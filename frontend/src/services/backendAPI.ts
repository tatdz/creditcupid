import { CreditData } from '../types/credit';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-6b17.up.railway.app';

export class BackendAPI {
  // Debug endpoints
  static async getDebugEnv() {
    const response = await fetch(`${BACKEND_URL}/api/debug-env`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch debug environment: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Status endpoints
  static async getStatus() {
    const response = await fetch(`${BACKEND_URL}/api/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch backend status: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getHealth() {
    const response = await fetch(`${BACKEND_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch health status: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Credit data endpoints
  static async getCreditData(address: string, chainId: number): Promise<CreditData> {
    const response = await fetch(`${BACKEND_URL}/api/credit-data/${address}?chainId=${chainId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch credit data: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getOnChainData(address: string, chainId: number) {
    const response = await fetch(`${BACKEND_URL}/api/on-chain-data/${address}?chainId=${chainId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch on-chain data: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getWalletInfo(address: string, chainId: number) {
    const response = await fetch(`${BACKEND_URL}/api/wallet-info/${address}?chainId=${chainId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wallet info: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Pinata/IPFS endpoints
  static async pinJSONToIPFS(data: any) {
    const response = await fetch(`${BACKEND_URL}/api/proxy/pinata/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to pin to IPFS: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  }

  // RPC proxy endpoints
  static async proxyRPC(chainId: string | number, method: string, params: any[] = []) {
    const response = await fetch(`${BACKEND_URL}/api/proxy/rpc/${chainId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        params,
        id: 1,
        jsonrpc: '2.0'
      })
    });
    
    if (!response.ok) {
      throw new Error(`RPC proxy error: ${response.statusText}`);
    }
    
    return response.json();
  }

  static async getTransactionReceipt(chainId: string | number, txHash: string) {
    return this.proxyRPC(chainId, 'eth_getTransactionReceipt', [txHash]);
  }

  static async getBlockNumber(chainId: string | number) {
    return this.proxyRPC(chainId, 'eth_blockNumber');
  }

  static async getBalance(chainId: string | number, address: string) {
    return this.proxyRPC(chainId, 'eth_getBalance', [address, 'latest']);
  }

  static async getTransactionCount(chainId: string | number, address: string) {
    return this.proxyRPC(chainId, 'eth_getTransactionCount', [address, 'latest']);
  }

  // Utility methods for common operations
  static async checkBackendConnectivity() {
    try {
      const status = await this.getStatus();
      const health = await this.getHealth();
      return {
        connected: true,
        status,
        health
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getCompleteWalletData(address: string, chainId: number) {
    const [creditData, onChainData, walletInfo] = await Promise.all([
      this.getCreditData(address, chainId),
      this.getOnChainData(address, chainId),
      this.getWalletInfo(address, chainId)
    ]);

    return {
      creditData,
      onChainData,
      walletInfo,
      timestamp: new Date().toISOString()
    };
  }
}

export const backendAPI = new BackendAPI();