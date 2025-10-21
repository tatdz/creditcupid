// src/utils/api.ts
import axios from 'axios';
import { CHAIN_CONFIGS, getChainConfig, ChainConfig } from '../config/chains';

// Create axios instance with default config
export const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('API endpoint not found. The server might be misconfigured.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
);

// Types
export interface Transaction {
  hash: string;
  value: string;
  timeStamp: string;
  from: string;
  to: string;
  isError?: string;
  input?: string;
}

export interface TokenBalance {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  balance: string;
  decimals: number;
}

export interface LendingInteraction {
  protocol: string;
  type: 'borrow' | 'repay' | 'deposit' | 'withdraw';
  hash: string;
  timestamp: string;
  amount: string;
}

export interface OnChainData {
  transactions: Transaction[];
  tokenBalances: TokenBalance[];
  lendingInteractions: LendingInteraction[];
  totalVolume: number;
  monthsActive: number;
  walletBalance: number;
  repaymentCount: number;
}

// API Service
export const apiService = {
  async getOnChainData(address: string, chainId: string | number): Promise<OnChainData> {
    const chain = getChainConfig(chainId);

    try {
      const [transactions, tokenBalances] = await Promise.all([
        this.getTransactions(address, chain),
        this.getTokenBalances(address, chain)
      ]);

      const lendingInteractions = await this.getLendingInteractions(transactions, chain);
      const totalVolume = this.calculateTotalVolume(transactions);
      const monthsActive = this.calculateMonthsActive(transactions);
      const walletBalance = this.calculateWalletBalance(tokenBalances);
      const repaymentCount = this.calculateRepaymentCount(lendingInteractions);

      return {
        transactions,
        tokenBalances,
        lendingInteractions,
        totalVolume,
        monthsActive,
        walletBalance,
        repaymentCount
      };
    } catch (error) {
      console.error('Error fetching on-chain data:', error);
      throw error;
    }
  },

  async getTransactions(address: string, chain: ChainConfig): Promise<Transaction[]> {
    // Use Blockscout API for all chains
    const response = await apiClient.get(
      `${chain.blockscoutUrl}/api?module=account&action=txlist&address=${address}&sort=desc`
    );
    return response.data.result || [];
  },

  async getTokenBalances(address: string, chain: ChainConfig): Promise<TokenBalance[]> {
    try {
      // Use Blockscout API for token balances
      const response = await apiClient.get(
        `${chain.blockscoutUrl}/api?module=account&action=tokenlist&address=${address}`
      );
      return response.data.result || [];
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  },

  async getLendingInteractions(transactions: Transaction[], chain: ChainConfig): Promise<LendingInteraction[]> {
    const lendingInteractions: LendingInteraction[] = [];
    const lendingAddresses = this.getLendingProtocolAddresses(chain);

    transactions.forEach(tx => {
      // Check if transaction interacts with lending protocols
      if (tx.to && lendingAddresses.includes(tx.to.toLowerCase())) {
        const interaction = this.parseLendingInteraction(tx, chain);
        if (interaction) {
          lendingInteractions.push(interaction);
        }
      }
    });

    return lendingInteractions;
  },

  getLendingProtocolAddresses(chain: ChainConfig): string[] {
    const addresses: string[] = [];
    
    // Add Morpho address
    if (chain.morphoAddress && chain.morphoAddress !== '0x0000000000000000000000000000000000000000') {
      addresses.push(chain.morphoAddress.toLowerCase());
    }
    
    // Add Aave addresses
    if (chain.aaveAddresses && chain.aaveAddresses.length > 0) {
      addresses.push(...chain.aaveAddresses.map(addr => addr.toLowerCase()));
    }

    return addresses;
  },

  parseLendingInteraction(tx: Transaction, chain: ChainConfig): LendingInteraction | null {
    const input = tx.input?.toLowerCase() || '';
    
    let type: 'borrow' | 'repay' | 'deposit' | 'withdraw' | null = null;
    let protocol = 'unknown';

    // Detect method calls based on function signatures and common patterns
    if (input.includes('repay') || input.includes('0x573ade81')) {
      type = 'repay';
    } else if (input.includes('borrow') || input.includes('0x6b9f96ea')) {
      type = 'borrow';
    } else if (input.includes('deposit') || input.includes('0x47e7ef24')) {
      type = 'deposit';
    } else if (input.includes('withdraw') || input.includes('0x853828b6')) {
      type = 'withdraw';
    }

    // Determine protocol
    if (tx.to?.toLowerCase() === chain.morphoAddress.toLowerCase()) {
      protocol = 'Morpho';
    } else if (chain.aaveAddresses.some(addr => addr.toLowerCase() === tx.to?.toLowerCase())) {
      protocol = 'Aave';
    }

    if (type) {
      return {
        protocol,
        type,
        hash: tx.hash,
        timestamp: tx.timeStamp,
        amount: tx.value
      };
    }

    return null;
  },

  calculateTotalVolume(transactions: Transaction[]): number {
    return transactions.reduce((total, tx) => {
      const value = parseFloat(tx.value) / 1e18; // Convert from wei to ETH
      return total + (isNaN(value) ? 0 : value);
    }, 0);
  },

  calculateMonthsActive(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;
    
    const timestamps = transactions
      .map(tx => parseInt(tx.timeStamp) * 1000)
      .filter(ts => !isNaN(ts));
    
    if (timestamps.length === 0) return 1;
    
    const oldest = new Date(Math.min(...timestamps));
    const newest = new Date(Math.max(...timestamps));
    
    const monthDiff = (newest.getFullYear() - oldest.getFullYear()) * 12 + 
                     (newest.getMonth() - oldest.getMonth());
    
    return Math.max(1, monthDiff + 1); // At least 1 month
  },

  calculateWalletBalance(tokenBalances: TokenBalance[]): number {
    // Simple calculation - in production you'd want to fetch actual USD prices
    return tokenBalances.reduce((total, token) => {
      const balance = parseFloat(token.balance) / Math.pow(10, token.decimals);
      // Simple approximation: ETH = $2000, other tokens = $1
      const usdValue = token.symbol === 'ETH' ? 2000 : 1;
      return total + (balance * usdValue);
    }, 0);
  },

  calculateRepaymentCount(lendingInteractions: LendingInteraction[]): number {
    return lendingInteractions.filter(interaction => interaction.type === 'repay').length;
  },

  getExplorerUrl(chainId: string | number, type: 'tx' | 'address', hash: string): string {
    const chain = getChainConfig(chainId);
    return `${chain.blockscoutUrl}/${type}/${hash}`;
  }
};