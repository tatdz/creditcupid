import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const API_CONFIG = {
  baseUrl: 'http://localhost:3001',
  endpoints: {
    // Credit data endpoints
    creditData: (address: string) => `/api/credit-data/${address}`,
    onChainData: (address: string) => `/api/on-chain-data/${address}`,
    fallbackCreditData: (address: string) => `/api/fallback/credit-data/${address}`,
    
    // Wallet endpoints
    walletActivity: (address: string) => `/api/wallet-activity/${address}`,
    walletInfo: (address: string) => `/api/wallet-info/${address}`,
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
    health: '/health',
    apiStatus: '/api/status',
    
    // External API proxy endpoints (secure backend proxies)
    blockscoutProxy: (path: string) => `/api/proxy/blockscout/${path}`,
    etherscanProxy: (path: string) => `/api/proxy/etherscan/${path}`,
    pinataProxy: (path: string) => `/api/proxy/pinata/${path}`,
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
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    
    // Enhanced error handling
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, please try again later');
    } else if (error.response?.status >= 500) {
      console.error('Server error, please try again later');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('Network error - please check your connection');
    }
    
    return Promise.reject(error);
  }
);

// Utility functions for API calls
export const apiService = {
  // Health check
  async healthCheck() {
    const response = await apiClient.get(API_CONFIG.endpoints.health);
    return response.data;
  },
  
  // API status check
  async getApiStatus() {
    const response = await apiClient.get(API_CONFIG.endpoints.apiStatus);
    return response.data;
  },
  
  // Credit data with fallback
  async getCreditData(address: string, chainId?: string) {
    const params = chainId ? { chainId } : {};
    const response = await apiClient.get(API_CONFIG.endpoints.creditData(address), { params });
    return response.data;
  },
  
  // On-chain data only
  async getOnChainData(address: string, chainId?: string) {
    const params = chainId ? { chainId } : {};
    const response = await apiClient.get(API_CONFIG.endpoints.onChainData(address), { params });
    return response.data;
  },
  
  // Explicit fallback data
  async getFallbackCreditData(address: string, chainId?: string) {
    const params = chainId ? { chainId } : {};
    const response = await apiClient.get(API_CONFIG.endpoints.fallbackCreditData(address), { params });
    return response.data;
  },
  
  // Wallet information
  async getWalletInfo(address: string, chainId?: string) {
    const params = chainId ? { chainId } : {};
    const response = await apiClient.get(API_CONFIG.endpoints.walletInfo(address), { params });
    return response.data;
  },
  
  // Multi-chain data
  async getMultiChainCredit(address: string, chainIds?: string) {
    const params = chainIds ? { chainIds } : {};
    const response = await apiClient.get(API_CONFIG.endpoints.multiChainCredit(address), { params });
    return response.data;
  },
  
  // Simulation
  async simulateCreditImpact(address: string, action: string, amount: string, chainId?: string) {
    const response = await apiClient.post(API_CONFIG.endpoints.simulateImpact(address), {
      action,
      amount,
      chainId: chainId || '11155111'
    });
    return response.data;
  },
  
  // RPC proxy call
  async rpcCall(chainId: string, method: string, params: any[]) {
    const response = await apiClient.post(API_CONFIG.endpoints.rpcProxy(chainId), {
      method,
      params
    });
    return response.data;
  }
};

export default apiClient;