// services/transactionService.ts
const BLOCKSCOUT_API_URL = 'https://eth-sepolia.blockscout.com/api';

export interface TransactionStatus {
  isConfirmed: boolean;
  confirmations: number;
  blockNumber: number | null;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

export class TransactionService {
  private static instance: TransactionService;

  private blockscoutApiKey: string;
  private etherscanApiKey: string;

  constructor() {
    // Set API keys from environment (works in both frontend and backend)
    this.blockscoutApiKey = '';
    this.etherscanApiKey = '';
    
    // Try to get from different environment sources
    if (typeof process !== 'undefined' && process.env) {
      this.blockscoutApiKey = process.env.VITE_BLOCKSCOUT_API_KEY || process.env.BLOCKSCOUT_API_KEY || '';
      this.etherscanApiKey = process.env.VITE_ETHERSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '';
    }
    
    // For Vite frontend, we'll set these via a separate method
  }

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  // Method to set API keys from frontend
  setApiKeys(blockscoutKey: string, etherscanKey: string) {
    this.blockscoutApiKey = blockscoutKey;
    this.etherscanApiKey = etherscanKey;
  }

  // Primary method: Blockscout with API key
  async checkTransactionStatusBlockscout(txHash: string): Promise<TransactionStatus> {
    try {
      const url = `${BLOCKSCOUT_API_URL}?module=transaction&action=gettxinfo&txhash=${txHash}`;
      
      const headers: HeadersInit = {};
      if (this.blockscoutApiKey) {
        headers['Authorization'] = `Bearer ${this.blockscoutApiKey}`;
      }

      console.log('🔍 Checking transaction status via Blockscout:', { txHash, hasApiKey: !!this.blockscoutApiKey });

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Blockscout API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === '0' || !data.result) {
        throw new Error(data.message || 'Transaction not found');
      }

      const result = data.result;
      
      const status: TransactionStatus = {
        isConfirmed: !!result.blockNumber,
        confirmations: result.confirmations ? parseInt(result.confirmations) : 0,
        blockNumber: result.blockNumber ? parseInt(result.blockNumber) : null,
        status: result.blockNumber ? 'success' : 'pending'
      };

      console.log('✅ Blockscout transaction status:', status);
      return status;

    } catch (error) {
      console.warn('❌ Blockscout API failed, falling back to Etherscan:', error);
      return await this.checkTransactionStatusEtherscan(txHash);
    }
  }

  // Fallback method: Etherscan
  async checkTransactionStatusEtherscan(txHash: string): Promise<TransactionStatus> {
    try {
      if (!this.etherscanApiKey) {
        throw new Error('Etherscan API key not available');
      }

      const url = `https://api-sepolia.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${this.etherscanApiKey}`;
      
      console.log('🔍 Checking transaction status via Etherscan:', { txHash });

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === '0') {
        throw new Error(data.message || 'Transaction not found on Etherscan');
      }

      // For Etherscan, we consider it confirmed if we get a valid response
      const status: TransactionStatus = {
        isConfirmed: true,
        confirmations: 1,
        blockNumber: null,
        status: 'success'
      };

      console.log('✅ Etherscan transaction status:', status);
      return status;

    } catch (error) {
      console.warn('❌ Etherscan API failed, using basic confirmation:', error);
      return await this.checkTransactionStatusBasic(txHash);
    }
  }

  // Last fallback: Basic RPC confirmation
  async checkTransactionStatusBasic(txHash: string): Promise<TransactionStatus> {
    try {
      console.log('🔍 Checking transaction status via basic RPC:', { txHash });

      const response = await fetch('https://ethereum-sepolia-rpc.publicnode.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1,
        }),
      });

      const data = await response.json();

      if (data.result) {
        const status: TransactionStatus = {
          isConfirmed: true,
          confirmations: 1,
          blockNumber: parseInt(data.result.blockNumber, 16),
          status: data.result.status === '0x1' ? 'success' : 'failed'
        };
        console.log('✅ Basic RPC transaction status:', status);
        return status;
      }

      const pendingStatus: TransactionStatus = {
        isConfirmed: false,
        confirmations: 0,
        blockNumber: null,
        status: 'pending'
      };
      console.log('⏳ Transaction still pending via basic RPC');
      return pendingStatus;

    } catch (error) {
      console.error('❌ All transaction status checks failed:', error);
      const errorStatus: TransactionStatus = {
        isConfirmed: false,
        confirmations: 0,
        blockNumber: null,
        status: 'pending',
        error: 'Failed to check transaction status'
      };
      return errorStatus;
    }
  }

  // Main method that tries all services in order
  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    console.log('🚀 Starting transaction status check for:', txHash);
    return await this.checkTransactionStatusBlockscout(txHash);
  }

  // Get transaction explorer URL
  getTransactionUrl(txHash: string): string {
    return `https://eth-sepolia.blockscout.com/tx/${txHash}`;
  }

  // Get fallback URL (Etherscan)
  getFallbackTransactionUrl(txHash: string): string {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
}

export const transactionService = TransactionService.getInstance();