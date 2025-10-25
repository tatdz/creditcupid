import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-6b17.up.railway.app';

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const API_CONFIG = {
  baseUrl: BACKEND_URL,
  endpoints: {
    // Debug & Status endpoints
    debugEnv: '/api/debug-env',
    apiStatus: '/api/status',
    health: '/health',
    
    // Credit data endpoints (ACTUAL endpoints from your backend)
    creditData: (address: string) => `/api/credit-data/${address}`,
    onChainData: (address: string) => `/api/on-chain-data/${address}`,
    walletInfo: (address: string) => `/api/wallet-info/${address}`,
    
    // Wallet endpoints (ACTUAL endpoints)
    walletActivity: (address: string) => `/api/wallet-activity/${address}`,
    walletStats: (address: string) => `/api/wallet-stats/${address}`,
    
    // Protocol endpoints
    protocolPositions: (address: string) => `/api/protocol-positions/${address}`,
    protocolInfo: (address: string) => `/api/protocol-info/${address}`,
    
    // Simulation endpoints
    simulateTransaction: '/api/simulate-transaction',
    simulateImpact: (address: string) => `/api/simulate-impact/${address}`,
    
    // Multi-chain endpoints
    multiChainCredit: (address: string) => `/api/multi-chain-credit/${address}`,
    
    // System endpoints
    collateralPrices: '/api/collateral-prices',
    supportedChains: '/api/supported-chains',
    rpcStatus: (chainId: string) => `/api/rpc-status/${chainId}`,
    
    // External API proxy endpoints (ACTUAL endpoints from your backend)
    pinataPinJSON: '/api/proxy/pinata/pinning/pinJSONToIPFS',
    rpcProxy: (chainId: string) => `/api/proxy/rpc/${chainId}`,
    
    // Additional services
    plaidLink: '/plaid/link',
    zkProofs: '/zk-proofs',
    lending: '/lending',
    blockscoutInfo: '/api/blockscout/info'
  }
};

// Request interceptor to add auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Enhanced error handling
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, please try again later');
      error.message = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.response?.status >= 500) {
      console.error('Server error, please try again later');
      error.message = 'Server temporarily unavailable. Please try again later.';
    } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('Network error - please check your connection');
      error.message = 'Network connection error. Please check your internet connection.';
    } else if (error.response?.status === 404) {
      console.error('Endpoint not found');
      error.message = 'Service endpoint not found. Please check the API configuration.';
    }
    
    return Promise.reject(error);
  }
);

// Utility functions for API calls
export const apiService = {
  // Health & Status checks
  async healthCheck() {
    const response = await apiClient.get(API_CONFIG.endpoints.health);
    return response.data;
  },
  
  async getApiStatus() {
    const response = await apiClient.get(API_CONFIG.endpoints.apiStatus);
    return response.data;
  },
  
  async getDebugEnv() {
    const response = await apiClient.get(API_CONFIG.endpoints.debugEnv);
    return response.data;
  },
  
  async checkBackendConnectivity() {
    try {
      const [status, health] = await Promise.all([
        this.getApiStatus(),
        this.healthCheck()
      ]);
      return { connected: true, status, health };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  // Credit data endpoints (ACTUAL - from your backend)
  async getCreditData(address: string, chainId: number = 11155111) {
    const response = await apiClient.get(API_CONFIG.endpoints.creditData(address), { 
      params: { chainId } 
    });
    return response.data;
  },
  
  async getOnChainData(address: string, chainId: number = 11155111) {
    const response = await apiClient.get(API_CONFIG.endpoints.onChainData(address), { 
      params: { chainId } 
    });
    return response.data;
  },
  
  async getWalletInfo(address: string, chainId: number = 11155111) {
    const response = await apiClient.get(API_CONFIG.endpoints.walletInfo(address), { 
      params: { chainId } 
    });
    return response.data;
  },

  // Complete wallet data (combines multiple endpoints)
  async getCompleteWalletData(address: string, chainId: number = 11155111) {
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
  },

  // Pinata/IPFS endpoints (ACTUAL - from your backend)
  async pinJSONToIPFS(data: any) {
    const response = await apiClient.post(API_CONFIG.endpoints.pinataPinJSON, data);
    return response.data;
  },

  // RPC proxy endpoints (ACTUAL - from your backend)
  async rpcCall(chainId: string | number, method: string, params: any[] = []) {
    const response = await apiClient.post(API_CONFIG.endpoints.rpcProxy(chainId.toString()), {
      method,
      params,
      id: 1,
      jsonrpc: '2.0'
    });
    return response.data;
  },

  async getTransactionReceipt(chainId: string | number, txHash: string) {
    return this.rpcCall(chainId, 'eth_getTransactionReceipt', [txHash]);
  },

  async getBlockNumber(chainId: string | number) {
    return this.rpcCall(chainId, 'eth_blockNumber');
  },

  async getBalance(chainId: string | number, address: string) {
    return this.rpcCall(chainId, 'eth_getBalance', [address, 'latest']);
  },

  async getTransactionCount(chainId: string | number, address: string) {
    return this.rpcCall(chainId, 'eth_getTransactionCount', [address, 'latest']);
  },

  // Legacy methods for backward compatibility
  async getFallbackCreditData(address: string, chainId: number = 11155111) {
    return this.getCreditData(address, chainId);
  },
  
  async getWalletActivity(address: string, chainId?: number) {
    return this.getOnChainData(address, chainId);
  },
  
  async getMultiChainCredit(address: string, chainIds?: string) {
    const primaryChainId = chainIds?.split(',')[0] || '11155111';
    return this.getCreditData(address, parseInt(primaryChainId));
  },
  
  async simulateCreditImpact(address: string, action: string, amount: string, chainId: number = 11155111) {
    console.log('Simulation requested:', { address, action, amount, chainId });
    return {
      simulated: true,
      message: 'Simulation endpoint not yet implemented',
      timestamp: new Date().toISOString()
    };
  }
};

export const getOnChainData = apiService.getOnChainData;
export const getCreditData = apiService.getCreditData;

export default apiClient;