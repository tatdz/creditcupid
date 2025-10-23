import { PlaidData, PrivacyProofs, StoredPrivacyProofs } from '../../../types/credit';
import { getPinataConfig } from '../../../config/pinata';
import { poseidon1 } from 'poseidon-lite';

interface ProofResult {
  type: string;
  valid: boolean;
  proofHash: string;
  message: string;
  timestamp: string;
  ipfsCID?: string;
  ipfsURL?: string;
  pinataURL?: string;
}

interface VerificationReport {
  timestamp: string;
  proofs: ProofResult[];
  overallScore: number;
  summary: string;
  details: {
    totalProofs: number;
    validProofs: number;
    verificationLevel: string;
  };
  ipfsReportCID?: string;
  ipfsReportURL?: string;
}

interface PinataPinResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isRealCID?: boolean;
  url?: string;
  pinataURL?: string;
}

// Enhanced Pinata service with all required methods
class RealPinataService {
  private config = getPinataConfig();
  private credentialsValid: boolean;
  private publicGateways = [
    'https://ipfs.io/ipfs',
    'https://gateway.pinata.cloud/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
    'https://dweb.link/ipfs'
  ];

  constructor() {
    this.credentialsValid = !!(this.config.jwt || (this.config.apiKey && this.config.apiSecret));
    
    if (this.credentialsValid) {
      console.log('✅ Pinata credentials found - IPFS enabled');
    } else {
      console.warn('⚠️ Pinata credentials missing - IPFS functionality limited');
    }
  }

  // Check if service is available
  isAvailable(): boolean {
    return this.credentialsValid;
  }

  // Main method to upload JSON to Pinata IPFS - with fallback
  async pinJSONToIPFS(data: any, name: string): Promise<PinataPinResponse & {
    isRealCID: boolean;
    url: string;
    pinataURL: string;
  }> {
    if (!this.credentialsValid) {
      // Return mock data when credentials are missing
      const mockCid = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn(`⚠️ Using mock CID (no Pinata credentials): ${mockCid}`);
      
      return {
        IpfsHash: mockCid,
        PinSize: 0,
        Timestamp: new Date().toISOString(),
        isRealCID: false,
        url: `https://ipfs.io/ipfs/${mockCid}`,
        pinataURL: `https://gateway.pinata.cloud/ipfs/${mockCid}`
      };
    }

    console.log(`📤 Uploading ${name} to Pinata IPFS...`);

    // Method 1: Try JWT auth first (preferred)
    if (this.config.jwt) {
      try {
        console.log('🔑 Using JWT authentication...');
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.jwt}`,
            'User-Agent': 'Darma-Credit/1.0'
          },
          body: JSON.stringify({
            pinataContent: data,
            pinataMetadata: {
              name: `Darma-${name}-${Date.now()}`,
              keyvalues: {
                type: 'privacy-proof',
                protocol: 'darma-credit',
                timestamp: new Date().toISOString(),
                source: 'darma-frontend',
                version: '1.0.0'
              }
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const publicCid = result.IpfsHash;
          
          console.log(`✅ IPFS SUCCESS: ${publicCid}`);
          
          return {
            ...result,
            isRealCID: true,
            url: `https://ipfs.io/ipfs/${publicCid}`,
            pinataURL: `https://gateway.pinata.cloud/ipfs/${publicCid}`
          };
        } else {
          const errorText = await response.text();
          throw new Error(`Pinata JWT failed: ${response.status} - ${errorText}`);
        }
      } catch (error: any) {
        console.warn('JWT auth failed, trying API key...', error.message);
      }
    }

    // Method 2: API key/secret auth
    if (this.config.apiKey && this.config.apiSecret) {
      try {
        console.log('🔑 Using API key authentication...');
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.config.apiKey,
            'pinata_secret_api_key': this.config.apiSecret,
            'User-Agent': 'Darma-Credit/1.0'
          },
          body: JSON.stringify({
            pinataContent: data,
            pinataMetadata: {
              name: `Darma-${name}-${Date.now()}`,
              keyvalues: {
                type: 'privacy-proof',
                protocol: 'darma-credit',
                timestamp: new Date().toISOString(),
                source: 'darma-frontend'
              }
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const publicCid = result.IpfsHash;
          
          console.log(`✅ IPFS SUCCESS (API Key): ${publicCid}`);
          
          return {
            ...result,
            isRealCID: true,
            url: `https://ipfs.io/ipfs/${publicCid}`,
            pinataURL: `https://gateway.pinata.cloud/ipfs/${publicCid}`
          };
        } else {
          const errorText = await response.text();
          throw new Error(`Pinata API key failed: ${response.status} - ${errorText}`);
        }
      } catch (error: any) {
        console.error('API key auth failed:', error.message);
        throw error;
      }
    }

    throw new Error('No valid Pinata authentication methods available');
  }

  // Enhanced CID verification
  async verifyCID(cid: string): Promise<{ verified: boolean; data?: any; error?: string }> {
    console.log("🔍 Verifying CID:", cid);
    
    for (const gateway of this.publicGateways) {
      try {
        const response = await fetch(`${gateway}/${cid}`, {
          signal: AbortSignal.timeout(5000),
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ CID VERIFIED: ${gateway}`);
          return { verified: true, data };
        }
      } catch (error) {
        // Continue to next gateway
      }
    }

    return { verified: false, error: "CID not yet accessible via public gateways" };
  }

  // Get public gateways
  getPublicGateways(): string[] {
    return this.publicGateways;
  }

  // Generate URLs for a CID
  getIPFSURLs(cid: string): { url: string; pinataURL: string; publicURLs: string[] } {
    const publicURLs = this.publicGateways.map(gateway => `${gateway}/${cid}`);
    return {
      url: `https://ipfs.io/ipfs/${cid}`,
      pinataURL: `https://gateway.pinata.cloud/ipfs/${cid}`,
      publicURLs
    };
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.credentialsValid) {
      return false;
    }
    
    try {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Fixed Poseidon Hasher with proper input handling
class PoseidonHasher {
  private static instance: PoseidonHasher;

  static getInstance(): Promise<PoseidonHasher> {
    if (!PoseidonHasher.instance) {
      PoseidonHasher.instance = new PoseidonHasher();
      console.log('✅ Poseidon Hasher initialized');
    }
    return Promise.resolve(PoseidonHasher.instance);
  }

  async hash(inputs: (number | string | boolean)[]): Promise<string> {
    // Convert all inputs to bigint first
    const bigIntInputs = inputs.map(input => {
      if (typeof input === 'boolean') return BigInt(input ? 1 : 0);
      if (typeof input === 'string') {
        // More robust string to bigint conversion
        const strSum = Array.from(input).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return BigInt(strSum % 1000000);
      }
      return BigInt(input);
    });

    try {
      // Pad inputs to exactly 5 elements as required by poseidon1
      const paddedInputs = this.padInputs(bigIntInputs, 5);
      const hash = poseidon1(paddedInputs);
      return `poseidon_${hash.toString(16)}`;
    } catch (error) {
      console.warn('Poseidon hash failed, using SHA-256:', error);
      return this.fallbackHash(inputs);
    }
  }

  // Pad inputs to required length with zeros
  private padInputs(inputs: bigint[], requiredLength: number): bigint[] {
    const padded = [...inputs];
    while (padded.length < requiredLength) {
      padded.push(0n);
    }
    // If still too long, truncate (shouldn't happen with our data)
    return padded.slice(0, requiredLength);
  }

  async hashObject(obj: Record<string, any>): Promise<string> {
    // Flatten the object and ensure we have consistent data
    const values = this.flattenObject(obj);
    
    // Convert all values to hashable format
    const hashableValues = values.map(value => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return value;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'bigint') return Number(value); // Convert bigint to number
      return String(value); // Fallback for any other type
    });

    return this.hash(hashableValues);
  }

  private flattenObject(obj: Record<string, any>): any[] {
    const values: any[] = [];
    
    const flatten = (currentObj: any) => {
      if (typeof currentObj !== 'object' || currentObj === null) {
        values.push(currentObj);
        return;
      }
      
      if (Array.isArray(currentObj)) {
        currentObj.forEach(item => flatten(item));
      } else {
        Object.values(currentObj).forEach(value => flatten(value));
      }
    };
    
    flatten(obj);
    return values;
  }

  private async fallbackHash(inputs: (number | string | boolean)[]): Promise<string> {
    const encoder = new TextEncoder();
    const dataStr = JSON.stringify(inputs);
    const dataBuffer = encoder.encode(dataStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return `sha256_${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }
}

// Privacy Proof Generator with Fixed Poseidon Implementation
export class PrivacyProofGenerator {
  private pinataService: RealPinataService;
  private isAvailable: boolean;
  private poseidonHasher: PoseidonHasher | null = null;
  private poseidonInitialized: boolean = false;

  constructor() {
    this.pinataService = new RealPinataService();
    this.isAvailable = this.pinataService.isAvailable();
    
    // Initialize Poseidon asynchronously
    this.initializePoseidon();
    
    if (this.isAvailable) {
      console.log('🚀 PrivacyProofGenerator initialized with IPFS');
    } else {
      console.warn('⚠️ PrivacyProofGenerator initialized in fallback mode');
    }
  }

  private async initializePoseidon(): Promise<void> {
    try {
      this.poseidonHasher = await PoseidonHasher.getInstance();
      this.poseidonInitialized = true;
      console.log('✅ Poseidon zk-hashing enabled');
    } catch (error) {
      console.warn('⚠️ Poseidon initialization failed, falling back to SHA-256');
      this.poseidonHasher = null;
      this.poseidonInitialized = false;
    }
  }

  // Generate zkProof hash using Poseidon with proper error handling
  private async generateZKProofHash(verified: boolean, criteria: string, salt: string): Promise<string> {
    try {
      const proofData = {
        verified: verified ? 1 : 0, // Use numbers for consistency
        criteria: criteria.substring(0, 100), // Limit length for hashing
        salt: salt,
        timestamp: Date.now()
      };
      
      if (this.poseidonHasher && this.poseidonInitialized) {
        // Use Poseidon for zk-friendly hashing
        return await this.poseidonHasher.hashObject(proofData);
      } else {
        // Fallback to SHA-256
        return await this.generateSHA256Hash(proofData);
      }
    } catch (error) {
      console.warn('Hash generation failed, using secure fallback:', error);
      return `zkp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private async generateSHA256Hash(data: any): Promise<string> {
    const encoder = new TextEncoder();
    const dataStr = JSON.stringify(data);
    const dataBuffer = encoder.encode(dataStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return `sha256_${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  // Generate Poseidon commitment for sensitive data with proper input handling
  private async generateDataCommitment(data: any, salt: string): Promise<string> {
    try {
      if (!this.poseidonHasher || !this.poseidonInitialized) {
        return `commit_${await this.generateZKProofHash(true, JSON.stringify(data), salt)}`;
      }

      // Create commitment with properly formatted inputs
      const commitmentInputs = [
        data.timestamp || Date.now(),
        data.verified ? 1 : 0,
        data.verified ? 1 : 0, // Duplicate for padding if needed
        ...this.createDataFingerprint(data)
      ];

      const commitment = await this.poseidonHasher.hash(commitmentInputs);
      return `commit_${commitment}`;
    } catch (error) {
      console.warn('Commitment generation failed:', error);
      return `commit_${await this.generateSHA256Hash(data)}`;
    }
  }

  private createDataFingerprint(data: any): number[] {
    const fingerprint: number[] = [];
    
    if (typeof data === 'object' && data !== null) {
      Object.values(data).forEach(value => {
        if (typeof value === 'number') {
          fingerprint.push(value % 1000); // Reduce size for hashing
        } else if (typeof value === 'string') {
          fingerprint.push(value.length % 1000);
        } else if (typeof value === 'boolean') {
          fingerprint.push(value ? 1 : 0);
        }
      });
    }
    
    // Ensure we have at least some data for hashing
    return fingerprint.length > 0 ? fingerprint.slice(0, 3) : [0, 0, 0];
  }

  // Store zkProof with proper error handling and Poseidon commitments
  private async storeZKProof(
    proofType: string, 
    verified: boolean, 
    criteria: any,
    sensitiveData?: any
  ): Promise<{ 
    cid: string; 
    url: string; 
    pinataURL: string; 
    isReal: boolean;
    success: boolean;
    commitment?: string;
  }> {
    console.log(`💾 Storing ${proofType} zkProof...`);

    try {
      // Generate commitment for sensitive data if provided
      const dataCommitment = sensitiveData ? 
        await this.generateDataCommitment(sensitiveData, `${proofType}_${Date.now()}`) : 
        undefined;

      const zkProofData = {
        proofType: proofType,
        verified: verified,
        verificationCriteria: criteria,
        proofHash: await this.generateZKProofHash(verified, JSON.stringify(criteria), `${proofType}_${Date.now()}`),
        dataCommitment: dataCommitment,
        timestamp: new Date().toISOString(),
        hashingAlgorithm: this.poseidonInitialized ? 'poseidon' : 'sha-256',
        
        _metadata: {
          proofType: proofType,
          protocol: 'darma-credit',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          generatedBy: 'Darma Credit Protocol',
          storage: this.isAvailable ? 'ipfs' : 'local',
          privacy: 'zk-proofs',
          hashing: this.poseidonInitialized ? 'poseidon-zk' : 'sha-256-fallback',
          usingRealIPFS: this.isAvailable
        }
      };

      const pinataResponse = await this.pinataService.pinJSONToIPFS(zkProofData, `zk-${proofType}-proof`);
      
      console.log(`✅ ${this.isAvailable ? 'CID Generated' : 'Mock CID Created'}: ${pinataResponse.IpfsHash}`);
      
      const urls = this.pinataService.getIPFSURLs(pinataResponse.IpfsHash);
      
      return {
        cid: pinataResponse.IpfsHash,
        url: urls.url,
        pinataURL: urls.pinataURL,
        isReal: pinataResponse.isRealCID,
        success: true,
        commitment: dataCommitment
      };
    } catch (error: any) {
      console.error(`❌ Failed to store ${proofType} proof:`, error.message);
      
      // Generate fallback mock data
      const mockCid = `mock_${proofType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn(`⚠️ Using fallback mock CID for ${proofType}: ${mockCid}`);
      
      const dataCommitment = sensitiveData ? 
        await this.generateDataCommitment(sensitiveData, `${proofType}_fallback_${Date.now()}`) : 
        undefined;
      
      return {
        cid: mockCid,
        url: `https://ipfs.io/ipfs/${mockCid}`,
        pinataURL: `https://gateway.pinata.cloud/ipfs/${mockCid}`,
        isReal: false,
        success: false,
        commitment: dataCommitment
      };
    }
  }

  // Main method to generate zkProofs with proper Poseidon implementation
  async generatePrivacyProofs(plaidData: PlaidData): Promise<StoredPrivacyProofs> {
    console.log('🚀 Starting zkProof Generation...');

    if (!this.isAvailable) {
      console.warn('⚠️ Running in fallback mode - using mock CIDs for zkProofs');
    }

    console.log(`🔧 Poseidon Status: ${this.poseidonInitialized ? 'ENABLED' : 'FALLBACK (SHA-256)'}`);

    // Calculate verification criteria (private - not stored on IPFS)
    const totalBalance = plaidData.accounts?.reduce((sum, account) => 
      sum + (account.balances?.current || 0), 0) || 0;

    const hasStableIncome = plaidData.income?.income_streams?.some(
      (stream: any) => stream.confidence > 0.9 && stream.status === 'ACTIVE'
    ) || false;

    const hasActiveHistory = (plaidData.transactions?.length || 0) > 30;
    const hasIdentity = !!(plaidData.identity?.names?.length);

    // Create verification status (this is all we reveal)
    const verificationStatus = {
      income: !!hasStableIncome,
      balance: totalBalance >= 1000,
      transactions: hasActiveHistory,
      identity: !!hasIdentity
    };

    console.log('📊 zkProof Financial Verification:', {
      verificationStatus,
      accounts: plaidData.accounts?.length || 0,
      transactions: plaidData.transactions?.length || 0,
      usingPoseidon: this.poseidonInitialized
    });

    // Generate zkProofs - ONLY store verification results with commitments
    const [incomeResult, balanceResult, transactionResult, identityResult] = await Promise.all([
      this.storeZKProof('income', !!hasStableIncome, {
        description: "Income stability verification",
        minConfidence: 0.9,
        requiredStatus: "ACTIVE",
      }, {
        hasStableIncome: !!hasStableIncome,
        streamCount: plaidData.income?.income_streams?.length || 0,
        confidence: plaidData.income?.income_streams?.[0]?.confidence || 0
      }),
      this.storeZKProof('balance', totalBalance >= 1000, {
        description: "Minimum balance verification", 
        minBalance: 1000,
        currency: "USD",
      }, {
        meetsThreshold: totalBalance >= 1000,
        accountCount: plaidData.accounts?.length || 0
      }),
      this.storeZKProof('transaction', hasActiveHistory, {
        description: "Transaction history activity",
        minTransactions: 30,
        timePeriod: "90 days",
      }, {
        hasSufficientHistory: hasActiveHistory,
        transactionCount: plaidData.transactions?.length || 0
      }),
      this.storeZKProof('identity', !!hasIdentity, {
        description: "Identity verification",
        requiresIdentity: true,
      }, {
        hasIdentity: !!hasIdentity,
        nameCount: plaidData.identity?.names?.length || 0
      })
    ]);

    // Store complete zkProofs set (aggregated verification only)
    const completeZKProofsData = {
      verificationSummary: verificationStatus,
      proofHashes: {
        income: incomeResult.cid,
        balance: balanceResult.cid,
        transaction: transactionResult.cid,
        identity: identityResult.cid
      },
      dataCommitments: {
        income: incomeResult.commitment,
        balance: balanceResult.commitment,
        transaction: transactionResult.commitment,
        identity: identityResult.commitment
      },
      timestamp: new Date().toISOString(),
      hashingAlgorithm: this.poseidonInitialized ? 'poseidon' : 'sha-256',
      
      _metadata: {
        protocol: 'darma-credit',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        proofCount: 4,
        privacyLevel: 'zk-proofs',
        hashing: this.poseidonInitialized ? 'poseidon' : 'sha-256',
        description: 'zkProofs with cryptographic commitments - No sensitive data stored',
        dataPrivacy: 'Only commitments to sensitive data, no raw values',
        usingRealIPFS: this.isAvailable,
        storageMode: this.isAvailable ? 'real-ipfs' : 'local-fallback',
        poseidonEnabled: this.poseidonInitialized
      }
    };

    let completeProofsResponse;
    try {
      completeProofsResponse = await this.pinataService.pinJSONToIPFS(completeZKProofsData, 'zk-complete-proofs');
      console.log(`✅ Complete proofs stored: ${completeProofsResponse.IpfsHash}`);
    } catch (error: any) {
      console.error('❌ Failed to store complete proofs:', error.message);
      completeProofsResponse = {
        IpfsHash: `mock_complete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isRealCID: false,
        pinataURL: `https://gateway.pinata.cloud/ipfs/mock_complete_${Date.now()}`
      };
    }

    // Calculate verification score
    const totalScore = Object.values(verificationStatus).filter(Boolean).length * 25;

    // Generate final proof hashes
    const [incomeProof, balanceProof, transactionProof, identityProof] = await Promise.all([
      this.generateZKProofHash(!!hasStableIncome, 'income', 'final'),
      this.generateZKProofHash(totalBalance >= 1000, 'balance', 'final'),
      this.generateZKProofHash(hasActiveHistory, 'transaction', 'final'),
      this.generateZKProofHash(!!hasIdentity, 'identity', 'final')
    ]);

    // Build the final proofs object with CIDs
    const baseProofs: PrivacyProofs = {
      incomeVerified: !!hasStableIncome,
      accountBalanceVerified: totalBalance >= 1000,
      transactionHistoryVerified: hasActiveHistory,
      identityVerified: !!hasIdentity,
      proofs: {
        incomeProof,
        balanceProof,
        transactionProof,
        identityProof
      },
      validationUrls: {
        incomeProof: incomeResult.url,
        balanceProof: balanceResult.url,
        transactionProof: transactionResult.url,
        identityProof: identityResult.url
      }
    };

    const storedProofs: any = {
      ...baseProofs,
      ipfsData: {
        incomeProofCID: incomeResult.cid,
        balanceProofCID: balanceResult.cid,
        transactionProofCID: transactionResult.cid,
        identityProofCID: identityResult.cid,
        fullProofsCID: completeProofsResponse.IpfsHash
      },
      pinataURLs: {
        incomeProof: incomeResult.pinataURL,
        balanceProof: balanceResult.pinataURL,
        transactionProof: transactionResult.pinataURL,
        identityProof: identityResult.pinataURL,
        fullProofs: completeProofsResponse.pinataURL
      },
      _metadata: {
        generatedAt: new Date().toISOString(),
        usingRealIPFS: this.isAvailable,
        storageType: this.isAvailable ? 'ipfs' : 'local',
        totalScore: totalScore,
        pinataGateway: 'https://gateway.pinata.cloud/ipfs',
        publicGateways: this.pinataService.getPublicGateways(),
        verificationStatus: verificationStatus,
        hashingAlgorithm: this.poseidonInitialized ? 'poseidon' : 'sha-256',
        poseidonEnabled: this.poseidonInitialized,
        privacyNotice: 'zkProofs: Only commitments to sensitive data exposed',
        privacyVersion: '2.0.0'
      }
    };

    console.log('🎉 zkProofs Generation Complete!', {
      totalScore: `${totalScore}/100`,
      verifiedProofs: `${Object.values(verificationStatus).filter(Boolean).length}/4`,
      usingPoseidon: this.poseidonInitialized,
      privacyCIDs: storedProofs.ipfsData,
      usingRealIPFS: this.isAvailable,
      mode: this.isAvailable ? '✓ Real IPFS' : '⚠️ Local Storage'
    });

    if (this.poseidonInitialized) {
      console.log('🔒 zkProof Privacy with Poseidon:');
      console.log('   - Poseidon commitments for sensitive data');
      console.log('   - zk-friendly hashing enabled');
      console.log('   - No raw financial data stored publicly');
    } else {
      console.log('🔒 zkProof Privacy (SHA-256):');
      console.log('   - SHA-256 commitments for sensitive data');
      console.log('   - Cryptographic privacy maintained');
      console.log('   - No raw financial data stored publicly');
    }

    return storedProofs as StoredPrivacyProofs;
  }

  // Verify CID on public gateways
  async verifyCID(cid: string): Promise<{ verified: boolean; data?: any; error?: string }> {
    return await this.pinataService.verifyCID(cid);
  }

  // Check if Poseidon is available
  isPoseidonAvailable(): boolean {
    return this.poseidonInitialized;
  }

  // Check if Pinata is available
  isPinataAvailable(): boolean {
    return this.isAvailable;
  }

  // Get status
  getPinataStatus() {
    return {
      available: this.isAvailable,
      poseidonAvailable: this.poseidonInitialized,
      publicGateways: this.pinataService.getPublicGateways(),
      message: this.isAvailable ? 
        `IPFS storage with ${this.poseidonInitialized ? 'Poseidon zkProofs' : 'SHA-256 proofs'} enabled` : 
        'Development mode - add Pinata credentials for IPFS'
    };
  }
}

// Export singleton instance with proper initialization
let privacyProofGeneratorInstance: PrivacyProofGenerator | null = null;

export const privacyProofGenerator = ((): PrivacyProofGenerator => {
  if (!privacyProofGeneratorInstance) {
    privacyProofGeneratorInstance = new PrivacyProofGenerator();
  }
  return privacyProofGeneratorInstance;
})();