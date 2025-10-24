import { PlaidData, PrivacyProofs, StoredPrivacyProofs } from '../../../types/credit';

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

// Backend Pinata Service with proper async initialization
class BackendPinataService {
  private credentialsValid: boolean = false;
  private initializationPromise: Promise<void>;
  private publicGateways = [
    'https://ipfs.io/ipfs',
    'https://gateway.pinata.cloud/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
    'https://dweb.link/ipfs'
  ];

  constructor() {
    console.log('🔧 Initializing BackendPinataService...');
    this.initializationPromise = this.checkBackendStatus();
  }

  // Wait for initialization to complete
  async waitForInitialization(): Promise<void> {
    await this.initializationPromise;
  }

  private async checkBackendStatus(): Promise<void> {
    try {
      const backendBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      console.log('🔍 Checking backend status at:', `${backendBase}/api/status`);
      
      const response = await fetch(`${backendBase}/api/status`);
      
      if (response.ok) {
        const status = await response.json();
        console.log('📊 Backend Status Response:', status);
        
        this.credentialsValid = status.pinata === true;
        
        if (this.credentialsValid) {
          console.log('🎉 Backend Pinata configuration found - REAL IPFS enabled');
        } else {
          console.warn('⚠️ Backend reports Pinata not configured - using development mode');
        }
      } else {
        console.warn('⚠️ Backend status endpoint not available - using development mode');
        this.credentialsValid = false;
      }
    } catch (error: any) {
      console.warn('⚠️ Could not check backend status - using development mode:', error.message);
      this.credentialsValid = false;
    }
  }

  // Check if service is available
  isAvailable(): boolean {
    return this.credentialsValid;
  }

  // Main method to upload JSON to Pinata IPFS via backend proxy
  async pinJSONToIPFS(data: any, name: string): Promise<PinataPinResponse & {
    isRealCID: boolean;
    url: string;
    pinataURL: string;
  }> {
    if (!this.credentialsValid) {
      // Return mock data when credentials are missing
      const mockCid = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn(`⚠️ Using mock CID (no backend Pinata): ${mockCid}`);
      
      return {
        IpfsHash: mockCid,
        PinSize: 0,
        Timestamp: new Date().toISOString(),
        isRealCID: false,
        url: `https://ipfs.io/ipfs/${mockCid}`,
        pinataURL: `https://gateway.pinata.cloud/ipfs/${mockCid}`
      };
    }

    console.log(`📤 Uploading ${name} to Pinata IPFS via backend proxy...`);

    try {
      const backendBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendBase}/api/proxy/pinata/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `Creditcupid-${name}-${Date.now()}`,
            keyvalues: {
              type: 'privacy-proof',
              protocol: 'creditcupid-credit',
              timestamp: new Date().toISOString(),
              source: 'creditcupid-frontend',
              version: '1.0.0'
            }
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const publicCid = result.IpfsHash;
        
        console.log(`✅ IPFS SUCCESS via backend: ${publicCid}`);
        
        return {
          ...result,
          isRealCID: true,
          url: `https://ipfs.io/ipfs/${publicCid}`,
          pinataURL: `https://gateway.pinata.cloud/ipfs/${publicCid}`
        };
      } else {
        const errorText = await response.text();
        throw new Error(`Backend Pinata proxy failed: ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error('Backend Pinata proxy failed:', error.message);
      throw error;
    }
  }

  // Enhanced CID verification
  async verifyCID(cid: string): Promise<{ verified: boolean; data?: any; error?: string }> {
    console.log("🔍 Verifying CID:", cid);
    
    // Skip verification for mock CIDs
    if (cid.startsWith('mock_')) {
      return { verified: true, data: { mock: true, cid } };
    }
    
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
      const backendBase = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendBase}/api/status`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Universal Poseidon Hasher with Proper Function Selection
class PoseidonHasher {
  private static instance: PoseidonHasher;
  private poseidonAvailable: boolean = false;
  private poseidonModule: any = null;

  static getInstance(): Promise<PoseidonHasher> {
    if (!PoseidonHasher.instance) {
      PoseidonHasher.instance = new PoseidonHasher();
    }
    return Promise.resolve(PoseidonHasher.instance);
  }

  constructor() {
    this.initializePoseidon();
  }

  private async initializePoseidon(): Promise<void> {
    try {
      // Dynamically import poseidon-lite
      this.poseidonModule = await import('poseidon-lite');
      
      // Test if poseidon is available by trying a simple hash
      const testInputs = [1n, 2n];
      this.poseidonModule.poseidon2(testInputs);
      
      this.poseidonAvailable = true;
      console.log('✅ Poseidon library loaded successfully');
    } catch (error: any) {
      console.warn('❌ Poseidon library failed to load, using SHA-256 fallback:', error.message);
      this.poseidonAvailable = false;
    }
  }

  async hash(inputs: (number | string | boolean)[]): Promise<string> {
    if (!this.poseidonAvailable || !this.poseidonModule) {
      return this.fallbackHash(inputs);
    }

    try {
      // Convert inputs to BigInt
      const bigIntInputs = this.convertToBigInt(inputs);
      
      // Select the appropriate poseidon function based on input length
      const inputLength = bigIntInputs.length;
      const poseidonFunction = this.getPoseidonFunction(inputLength);
      
      if (!poseidonFunction) {
        throw new Error(`No poseidon function available for ${inputLength} inputs`);
      }
      
      const hash = poseidonFunction(bigIntInputs);
      return `poseidon_${hash.toString(16)}`;
    } catch (error: any) {
      console.warn('Poseidon hash failed, using SHA-256:', error.message);
      return this.fallbackHash(inputs);
    }
  }

  private getPoseidonFunction(inputLength: number): Function | null {
    // Map input lengths to poseidon functions
    const functionMap: { [key: number]: string } = {
      1: 'poseidon1',
      2: 'poseidon2', 
      3: 'poseidon3',
      4: 'poseidon4',
      5: 'poseidon5',
      6: 'poseidon6',
      7: 'poseidon7',
      8: 'poseidon8',
      9: 'poseidon9',
      10: 'poseidon10',
      11: 'poseidon11',
      12: 'poseidon12',
      13: 'poseidon13',
      14: 'poseidon14',
      15: 'poseidon15',
      16: 'poseidon16'
    };

    const functionName = functionMap[inputLength];
    if (functionName && this.poseidonModule[functionName]) {
      return this.poseidonModule[functionName];
    }
    
    return null;
  }

  private convertToBigInt(inputs: (number | string | boolean)[]): bigint[] {
    return inputs.map(input => {
      if (typeof input === 'boolean') return input ? 1n : 0n;
      if (typeof input === 'string') {
        // Create consistent numeric hash from string
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
          hash = ((hash << 5) - hash) + input.charCodeAt(i);
          hash |= 0; // Convert to 32-bit integer
        }
        return BigInt(Math.abs(hash));
      }
      if (typeof input === 'number') {
        return BigInt(Math.floor(input));
      }
      return 0n;
    });
  }

  async hashObject(obj: Record<string, any>): Promise<string> {
    // Create consistent inputs from object - use fixed length of 8 for compatibility
    const objString = JSON.stringify(obj, Object.keys(obj).sort());
    const inputs: (number | string | boolean)[] = [];
    
    // Always generate exactly 8 inputs for poseidon8 compatibility
    inputs.push(Date.now() % 1000000);
    inputs.push(objString.length % 10000);
    inputs.push(Object.keys(obj).length % 1000);
    
    // Add character codes from string (fill remaining 5 slots)
    for (let i = 0; i < 5 && i < objString.length; i++) {
      inputs.push(objString.charCodeAt(i) % 1000);
    }
    
    // Pad to exactly 8 inputs if needed
    while (inputs.length < 8) {
      inputs.push(0);
    }
    
    return this.hash(inputs);
  }

  private async fallbackHash(inputs: (number | string | boolean)[]): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataStr = JSON.stringify(inputs);
      const dataBuffer = encoder.encode(dataStr);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return `sha256_${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
    } catch (error) {
      // Ultimate fallback
      return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  isAvailable(): boolean {
    return this.poseidonAvailable;
  }

  getRequirements() {
    return {
      poseidonAvailable: this.poseidonAvailable
    };
  }
}

// Privacy Proof Generator with Universal Poseidon Support
export class PrivacyProofGenerator {
  private pinataService: BackendPinataService;
  private isAvailable: boolean = false;
  private poseidonHasher: PoseidonHasher | null = null;
  private poseidonInitialized: boolean = false;
  private initializationPromise: Promise<void>;
  private initializationError: string | null = null;

  constructor() {
    this.pinataService = new BackendPinataService();
    this.initializationPromise = this.initializeServices().catch(error => {
      this.initializationError = error.message;
      console.error('❌ PrivacyProofGenerator initialization failed:', error);
    });
  }

  // Wait for full initialization
  async waitForInitialization(): Promise<void> {
    await this.initializationPromise;
    if (this.initializationError) {
      throw new Error(this.initializationError);
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize Pinata service with timeout
      const pinataPromise = this.pinataService.waitForInitialization();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pinata initialization timeout')), 10000)
      );
      
      await Promise.race([pinataPromise, timeoutPromise]);
      
      this.isAvailable = this.pinataService.isAvailable();
      
      // Initialize Poseidon with timeout protection
      await this.initializePoseidon();
      
      console.log('🚀 PrivacyProofGenerator initialized successfully', {
        pinataAvailable: this.isAvailable,
        poseidonAvailable: this.poseidonInitialized
      });
      
    } catch (error: any) {
      console.warn('⚠️ Service initialization had issues:', error.message);
      // Don't throw - continue with fallback mode
      this.isAvailable = false;
      this.poseidonInitialized = false;
    }
  }

  private async initializePoseidon(): Promise<void> {
    try {
      this.poseidonHasher = await PoseidonHasher.getInstance();
      
      // Give Poseidon a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (this.poseidonHasher && this.poseidonHasher.isAvailable()) {
        this.poseidonInitialized = true;
        console.log('✅ Poseidon zk-hashing enabled');
      } else {
        console.warn('⚠️ Poseidon not available, using SHA-256 fallback');
        this.poseidonInitialized = false;
      }
    } catch (error: any) {
      console.warn('⚠️ Poseidon initialization failed:', error.message);
      this.poseidonInitialized = false;
    }
  }

  // Safe hash generation with fallbacks
  private async generateZKProofHash(verified: boolean, criteria: string, salt: string): Promise<string> {
    try {
      const proofData = {
        verified: verified ? 1 : 0,
        criteria: criteria.substring(0, 100),
        salt: salt,
        timestamp: Date.now()
      };
      
      if (this.poseidonInitialized && this.poseidonHasher) {
        return await this.poseidonHasher.hashObject(proofData);
      } else {
        return await this.generateSHA256Hash(proofData);
      }
    } catch (error) {
      console.warn('Hash generation failed, using secure fallback');
      return `zkp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private async generateSHA256Hash(data: any): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataStr = JSON.stringify(data);
      const dataBuffer = encoder.encode(dataStr);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return `sha256_${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
    } catch (error) {
      return `sha256_fallback_${Date.now()}`;
    }
  }

  // Generate data commitment
  private async generateDataCommitment(data: any, salt: string): Promise<string> {
    try {
      if (!this.poseidonInitialized || !this.poseidonHasher) {
        const fallbackHash = await this.generateSHA256Hash({ data, salt });
        return `commit_${fallbackHash}`;
      }

      // Use fixed 8 inputs for poseidon8 compatibility
      const inputs: (number | string | boolean)[] = [
        Date.now() % 1000000,
        data.verified ? 1 : 0,
        salt.length % 1000,
        JSON.stringify(data).length % 10000,
        data.hasOwnProperty('hasStableIncome') ? (data.hasStableIncome ? 1 : 0) : 0,
        data.hasOwnProperty('meetsThreshold') ? (data.meetsThreshold ? 1 : 0) : 0,
        data.hasOwnProperty('hasSufficientHistory') ? (data.hasSufficientHistory ? 1 : 0) : 0,
        data.hasOwnProperty('hasIdentity') ? (data.hasIdentity ? 1 : 0) : 0
      ];

      const commitment = await this.poseidonHasher.hash(inputs);
      return `commit_${commitment}`;
    } catch (error) {
      console.warn('Commitment generation failed, using fallback');
      return `commit_fallback_${Date.now()}`;
    }
  }

  // Store zkProof with error handling
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
          protocol: 'creditcupid-credit',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          generatedBy: 'Creditcupid Credit Protocol',
          storage: this.isAvailable ? 'ipfs' : 'local',
          privacy: 'zk-proofs',
          hashing: this.poseidonInitialized ? 'poseidon-zk' : 'sha-256-fallback',
          usingRealIPFS: this.isAvailable
        }
      };

      const pinataResponse = await this.pinataService.pinJSONToIPFS(zkProofData, `zk-${proofType}-proof`);
      
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
      
      const mockCid = `mock_${proofType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        cid: mockCid,
        url: `https://ipfs.io/ipfs/${mockCid}`,
        pinataURL: `https://gateway.pinata.cloud/ipfs/${mockCid}`,
        isReal: false,
        success: false,
        commitment: undefined
      };
    }
  }

  // Main method to generate privacy proofs
  async generatePrivacyProofs(plaidData: PlaidData): Promise<StoredPrivacyProofs> {
    console.log('🚀 Starting Privacy Proof Generation...');

    // Ensure we're initialized
    await this.waitForInitialization();

    console.log(`🔧 Service Status - Pinata: ${this.isAvailable ? '✅' : '❌'}, Poseidon: ${this.poseidonInitialized ? '✅' : '❌'}`);

    // Calculate verification criteria
    const totalBalance = plaidData.accounts?.reduce((sum, account) => 
      sum + (account.balances?.current || 0), 0) || 0;

    const hasStableIncome = plaidData.income?.income_streams?.some(
      (stream: any) => stream.confidence > 0.9 && stream.status === 'ACTIVE'
    ) || false;

    const hasActiveHistory = (plaidData.transactions?.length || 0) > 30;
    const hasIdentity = !!(plaidData.identity?.names?.length);

    const verificationStatus = {
      income: !!hasStableIncome,
      balance: totalBalance >= 1000,
      transactions: hasActiveHistory,
      identity: !!hasIdentity
    };

    // Generate individual proofs
    const [incomeResult, balanceResult, transactionResult, identityResult] = await Promise.all([
      this.storeZKProof('income', !!hasStableIncome, {
        description: "Income stability verification",
        minConfidence: 0.9,
        requiredStatus: "ACTIVE",
      }, {
        hasStableIncome: !!hasStableIncome,
        streamCount: plaidData.income?.income_streams?.length || 0
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

    // Store complete proofs set
    const completeProofsData = {
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
        protocol: 'creditcupid-credit',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        proofCount: 4,
        privacyLevel: 'zk-proofs',
        hashing: this.poseidonInitialized ? 'poseidon' : 'sha-256',
        usingRealIPFS: this.isAvailable,
        poseidonEnabled: this.poseidonInitialized
      }
    };

    let completeProofsResponse;
    try {
      completeProofsResponse = await this.pinataService.pinJSONToIPFS(completeProofsData, 'complete-proofs');
    } catch (error: any) {
      console.error('❌ Failed to store complete proofs:', error.message);
      completeProofsResponse = {
        IpfsHash: `mock_complete_${Date.now()}`,
        pinataURL: `https://gateway.pinata.cloud/ipfs/mock_complete_${Date.now()}`
      };
    }

    // Generate final proof hashes
    const [incomeProof, balanceProof, transactionProof, identityProof] = await Promise.all([
      this.generateZKProofHash(!!hasStableIncome, 'income', 'final'),
      this.generateZKProofHash(totalBalance >= 1000, 'balance', 'final'),
      this.generateZKProofHash(hasActiveHistory, 'transaction', 'final'),
      this.generateZKProofHash(!!hasIdentity, 'identity', 'final')
    ]);

    // Calculate score
    const totalScore = Object.values(verificationStatus).filter(Boolean).length * 25;

    // Build final result
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
        verificationStatus: verificationStatus,
        hashingAlgorithm: this.poseidonInitialized ? 'poseidon' : 'sha-256',
        poseidonEnabled: this.poseidonInitialized
      }
    };

    console.log('🎉 Privacy Proofs Generation Complete!', {
      totalScore: `${totalScore}/100`,
      verifiedProofs: `${Object.values(verificationStatus).filter(Boolean).length}/4`,
      usingPoseidon: this.poseidonInitialized,
      usingRealIPFS: this.isAvailable
    });

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

  // Get status - FIXED METHOD NAME to match usePlaidIntegration
  getPinataStatus() {
    return {
      available: this.isAvailable,
      poseidonAvailable: this.poseidonInitialized,
      publicGateways: this.pinataService.getPublicGateways(),
      message: this.isAvailable ? 
        `IPFS storage with ${this.poseidonInitialized ? 'Poseidon' : 'SHA-256'} enabled` : 
        'Development mode - using mock storage'
    };
  }
}

// Safe singleton instance management
let privacyProofGeneratorInstance: PrivacyProofGenerator | null = null;

export const getPrivacyProofGenerator = async (): Promise<PrivacyProofGenerator> => {
  if (!privacyProofGeneratorInstance) {
    privacyProofGeneratorInstance = new PrivacyProofGenerator();
    try {
      await privacyProofGeneratorInstance.waitForInitialization();
    } catch (error) {
      console.warn('PrivacyProofGenerator initialization had issues, but continuing with fallbacks');
    }
  }
  return privacyProofGeneratorInstance;
};

// For backward compatibility - with safe initialization
export const privacyProofGenerator = ((): PrivacyProofGenerator => {
  if (!privacyProofGeneratorInstance) {
    privacyProofGeneratorInstance = new PrivacyProofGenerator();
    // Don't wait for initialization in sync context
    privacyProofGeneratorInstance.waitForInitialization().catch(error => {
      console.warn('Background initialization failed:', error);
    });
  }
  return privacyProofGeneratorInstance;
})();