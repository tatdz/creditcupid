import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables from the project root .env file
// __dirname is /src/services, so we go up two levels to reach project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Direct environment variable declaration at the top
const PINATA_API_KEY = process.env.Pinata_API_Key || '';
const PINATA_API_SECRET = process.env.Pinata_API_Secret || '';
const PINATA_JWT = process.env.Pinata_JWT || '';

export interface LoanMetadata {
  description: string;
  purpose: string;
  riskAssessment: string;
  borrowerStatement: string;
  supportingDocs: string[]; // IPFS hashes of supporting documents
  timestamp: number;
}

export interface LoanTerms {
  description: string;
  conditions: string[];
  collateralRequirements: string;
  repaymentSchedule: string;
  riskDisclosure: string;
  timestamp: number;
}

export class IPFSService {
  private pinataApiKey: string;
  private pinataSecret: string;
  private pinataJWT: string;

  constructor() {
    // Use the directly declared constants
    this.pinataApiKey = PINATA_API_KEY;
    this.pinataSecret = PINATA_API_SECRET;
    this.pinataJWT = PINATA_JWT;
    
    // Log for debugging
    console.log('🔧 IPFSService initialized:');
    console.log(`   JWT Present: ${this.pinataJWT ? 'Yes' : 'No'}`);
    console.log(`   API Key Present: ${this.pinataApiKey ? 'Yes' : 'No'}`);
    console.log(`   API Secret Present: ${this.pinataSecret ? 'Yes' : 'No'}`);
    
    if (!this.pinataJWT) {
      console.error('❌ CRITICAL: Pinata_JWT environment variable is not set.');
      console.error('   Please check your .env file in the project root directory.');
    }
  }

  async uploadLoanMetadata(metadata: LoanMetadata): Promise<string> {
    if (!this.pinataJWT) {
      throw new Error('Pinata JWT is not configured. Please check your .env file');
    }

    try {
      console.log('📤 Uploading loan metadata to IPFS...');
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.pinataJWT}`
          },
          timeout: 30000
        }
      );
      
      console.log(`✅ Metadata uploaded successfully: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('❌ Error uploading loan metadata to IPFS:');
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
      throw new Error(`Failed to upload loan metadata to IPFS: ${error.response?.data?.error || error.message}`);
    }
  }

  async uploadLoanTerms(terms: LoanTerms): Promise<string> {
    if (!this.pinataJWT) {
      throw new Error('Pinata JWT is not configured. Please check your .env file');
    }

    try {
      console.log('📤 Uploading loan terms to IPFS...');
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        terms,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.pinataJWT}`
          },
          timeout: 30000
        }
      );
      
      console.log(`✅ Terms uploaded successfully: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('❌ Error uploading loan terms to IPFS:');
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
      throw new Error(`Failed to upload loan terms to IPFS: ${error.response?.data?.error || error.message}`);
    }
  }

  async retrieveFromIPFS(ipfsHash: string): Promise<any> {
    if (!ipfsHash || ipfsHash.trim() === '') {
      throw new Error('IPFS hash cannot be empty');
    }

    try {
      console.log(`📥 Retrieving from IPFS: ${ipfsHash}`);
      const response = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        {
          timeout: 30000
        }
      );
      console.log(`✅ Data retrieved successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error retrieving data from IPFS for hash ${ipfsHash}:`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
      throw new Error(`Failed to retrieve data from IPFS: ${error.response?.data?.error || error.message}`);
    }
  }

  async uploadFileToIPFS(file: Buffer, filename: string): Promise<string> {
    if (!this.pinataJWT) {
      throw new Error('Pinata JWT is not configured. Please check your .env file');
    }

    if (!file || file.length === 0) {
      throw new Error('File buffer cannot be empty');
    }

    if (!filename || filename.trim() === '') {
      throw new Error('Filename cannot be empty');
    }

    try {
      console.log(`📎 Uploading file to IPFS: ${filename} (${file.length} bytes)`);
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(file)], { type: 'application/octet-stream' });
      formData.append('file', blob, filename);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.pinataJWT}`
          },
          timeout: 60000
        }
      );
      
      console.log(`✅ File uploaded successfully: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('❌ Error uploading file to IPFS:');
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
      throw new Error(`Failed to upload file to IPFS: ${error.response?.data?.error || error.message}`);
    }
  }

  // Utility method to check if service is properly configured
  isConfigured(): boolean {
    return !!this.pinataJWT;
  }

  // Utility method to get configuration status
  getConfigurationStatus(): { jwt: boolean; apiKey: boolean; apiSecret: boolean } {
    return {
      jwt: !!this.pinataJWT,
      apiKey: !!this.pinataApiKey,
      apiSecret: !!this.pinataSecret
    };
  }
}