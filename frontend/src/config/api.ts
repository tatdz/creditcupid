export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-6b17.up.railway.app',
  timeout: 30000,
};

// Export the backend URL for direct use
export const BACKEND_URL = API_CONFIG.baseUrl;

// Chain configuration
export const SUPPORTED_CHAINS = {
  1: 'Ethereum Mainnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base'
};

// API timeouts
export const API_TIMEOUTS = {
  default: 30000,
  creditData: 45000,
  rpcCall: 15000,
  healthCheck: 10000
};