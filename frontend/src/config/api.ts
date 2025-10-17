import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3001', // Add base URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const API_CONFIG = {
  baseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3001', // Changed to 3001
  endpoints: {
    creditData: (address: string) => `/api/credit-data/${address}`,
    walletActivity: (address: string) => `/api/wallet-activity/${address}`,
    collateralPrices: '/api/collateral-prices',
    protocolPositions: (address: string) => `/api/protocol-positions/${address}`,
    simulateTransaction: '/api/simulate-transaction',
    plaidLink: '/plaid/link',
    zkProofs: '/zk-proofs',
    lending: '/lending'
  }
};

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);