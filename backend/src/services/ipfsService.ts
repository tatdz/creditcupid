import axios from 'axios';

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
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataSecret = process.env.PINATA_API_SECRET || '';
    this.pinataJWT = process.env.PINATA_JWT || '';
  }

  async uploadLoanMetadata(metadata: LoanMetadata): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        }
      );
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload loan metadata to IPFS');
    }
  }

  async uploadLoanTerms(terms: LoanTerms): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        terms,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        }
      );
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload loan terms to IPFS');
    }
  }

  async retrieveFromIPFS(ipfsHash: string): Promise<any> {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      return response.data;
    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      throw new Error('Failed to retrieve data from IPFS');
    }
  }

  async uploadFileToIPFS(file: Buffer, filename: string): Promise<string> {
    try {
      const formData = new FormData();
      const blob = new Blob([file], { type: 'application/octet-stream' });
      formData.append('file', blob, filename);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        }
      );
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }
}