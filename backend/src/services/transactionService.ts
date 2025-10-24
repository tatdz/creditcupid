// services/transactionService.ts
const BLOCKSCOUT_API_URL = '/api/proxy/blockscout'; // Now using backend proxy

export interface TransactionStatus {
  isConfirmed: boolean;
  confirmations: number;
  blockNumber: number | null;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

export class TransactionService {
  private static instance: TransactionService;

  constructor() {
    // No API keys stored in frontend anymore - all handled by backend
  }

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  // Primary method: Backend Blockscout proxy
  async checkTransactionStatusBlockscout(txHash: string): Promise<TransactionStatus> {
    try {
      const url = `${BLOCKSCOUT_API_URL}?module=transaction&action=gettxinfo&txhash=${txHash}`;
      
      console.log('🔍 Checking transaction status via backend Blockscout proxy:', { txHash });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Blockscout proxy error: ${response.status}`);
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
      console.warn('❌ Blockscout proxy failed, falling back to Etherscan proxy:', error);
      return await this.checkTransactionStatusEtherscan(txHash);
    }
  }

  // Fallback method: Backend Etherscan proxy
  async checkTransactionStatusEtherscan(txHash: string): Promise<TransactionStatus> {
    try {
      const url = `/api/proxy/etherscan?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`;
      
      console.log('🔍 Checking transaction status via backend Etherscan proxy:', { txHash });

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Etherscan proxy error: ${response.status}`);
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
      console.warn('❌ Etherscan proxy failed, using backend RPC proxy:', error);
      return await this.checkTransactionStatusRpc(txHash);
    }
  }

  // RPC proxy method: Uses backend RPC proxy with secure Alchemy URL
  async checkTransactionStatusRpc(txHash: string): Promise<TransactionStatus> {
    try {
      console.log('🔍 Checking transaction status via backend RPC proxy:', { txHash });

      const response = await fetch('/api/proxy/rpc/11155111', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1
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
        console.log('✅ Backend RPC transaction status:', status);
        return status;
      }

      const pendingStatus: TransactionStatus = {
        isConfirmed: false,
        confirmations: 0,
        blockNumber: null,
        status: 'pending'
      };
      console.log('⏳ Transaction still pending via backend RPC');
      return pendingStatus;

    } catch (error) {
      console.error('❌ Backend RPC proxy failed:', error);
      return await this.checkTransactionStatusBasic(txHash);
    }
  }

  // Last fallback: Basic public RPC confirmation (no API keys)
  async checkTransactionStatusBasic(txHash: string): Promise<TransactionStatus> {
    try {
      console.log('🔍 Checking transaction status via public RPC:', { txHash });

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
        console.log('✅ Public RPC transaction status:', status);
        return status;
      }

      const pendingStatus: TransactionStatus = {
        isConfirmed: false,
        confirmations: 0,
        blockNumber: null,
        status: 'pending'
      };
      console.log('⏳ Transaction still pending via public RPC');
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