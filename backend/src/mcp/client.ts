// backend/src/mcp/client.ts
import { ethers } from 'ethers';
import { CHAIN_CONFIGS, ChainConfig } from '../config/chains';

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const BLOCKSCOUT_API_KEY = process.env.BLOCKSCOUT_API_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

// Simple data interfaces - just raw data, no scoring
export interface OnChainData {
  address: string;
  transactions: Transaction[];
  lendingInteractions: LendingInteraction[];
  walletBalance: number;
  totalVolume: number;
  monthsActive: number;
  timestamp: number;
}

export interface Transaction {
  hash: string;
  timestamp: number;
  value: string;
  from: string;
  to: string;
  status: 'success' | 'failed';
}

export interface LendingInteraction {
  hash: string;
  protocol: 'Morpho' | 'Aave';
  type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'liquidate';
  amount: string;
  timestamp: number;
  asset: string;
  success: boolean;
}

// Enhanced Blockscout Service - JUST DATA FETCHING
class RealBlockscoutService {
  private chainConfig: ChainConfig;
  private apiKey: string;

  constructor(chainId: string) {
    this.chainConfig = CHAIN_CONFIGS[chainId] || CHAIN_CONFIGS['11155111']; // Default to Sepolia
    this.apiKey = BLOCKSCOUT_API_KEY;
  }

  private async makeApiRequest(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CreditCupid/1.0',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Blockscout API request failed: ${error}`);
      throw error;
    }
  }

  async getOnChainData(address: string): Promise<OnChainData> {
    console.log(`📊 [Backend] Fetching raw on-chain data for ${address} on chain ${this.chainConfig.chainId}`);
    
    try {
      // Fetch transactions
      const transactions = await this.fetchTransactions(address);
      
      // Analyze for lending interactions
      const lendingInteractions = this.analyzeLendingInteractions(transactions);
      
      // Calculate basic metrics
      const walletBalance = await this.getWalletBalance(address);
      const totalVolume = this.calculateTotalVolume(transactions);
      const monthsActive = this.calculateMonthsActive(transactions);

      const onChainData: OnChainData = {
        address,
        transactions,
        lendingInteractions,
        walletBalance,
        totalVolume,
        monthsActive,
        timestamp: Math.floor(Date.now() / 1000)
      };

      console.log(`✅ [Backend] Raw data fetched:`, {
        transactions: transactions.length,
        lendingInteractions: lendingInteractions.length,
        walletBalance,
        totalVolume,
        monthsActive
      });

      return onChainData;

    } catch (error) {
      console.error('❌ [Backend] Failed to fetch on-chain data:', error);
      // Return empty data structure
      return {
        address,
        transactions: [],
        lendingInteractions: [],
        walletBalance: 0,
        totalVolume: 0,
        monthsActive: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };
    }
  }

  private async fetchTransactions(address: string): Promise<Transaction[]> {
    let url = `${this.chainConfig.blockscoutUrl}/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=100`;
    
    if (this.apiKey) {
      url += `&apikey=${this.apiKey}`;
    }

    const data = await this.makeApiRequest(url);
    
    if (data.status === '1' && data.result) {
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: parseInt(tx.timeStamp),
        status: tx.isError === '0' ? 'success' : 'failed',
      }));
    } else {
      throw new Error(`Blockscout API error: ${data.message || 'Unknown error'}`);
    }
  }

  private analyzeLendingInteractions(transactions: Transaction[]): LendingInteraction[] {
    const interactions: LendingInteraction[] = [];

    transactions.forEach(tx => {
      // Check for Morpho interactions
      if (this.chainConfig.morphoAddress !== '0x0000000000000000000000000000000000000000' && 
          tx.to?.toLowerCase() === this.chainConfig.morphoAddress.toLowerCase()) {
        const interaction = this.parseMorphoInteraction(tx);
        if (interaction) {
          interactions.push(interaction);
        }
      }

      // Check for Aave interactions
      if (this.chainConfig.aaveAddresses && this.chainConfig.aaveAddresses.length > 0) {
        const aaveAddress = this.chainConfig.aaveAddresses.find((addr: string) => 
          tx.to?.toLowerCase() === addr.toLowerCase()
        );
        
        if (aaveAddress) {
          const interaction = this.parseAaveInteraction(tx, aaveAddress);
          if (interaction) {
            interactions.push(interaction);
          }
        }
      }
    });

    return interactions;
  }

  private parseMorphoInteraction(tx: Transaction): LendingInteraction | null {
    // Simplified - in reality you'd parse function calls
    return {
      hash: tx.hash,
      protocol: 'Morpho',
      type: 'supply', // This would be determined by function parsing
      amount: tx.value,
      timestamp: tx.timestamp,
      asset: 'ETH', // This would be determined by token analysis
      success: tx.status === 'success'
    };
  }

  private parseAaveInteraction(tx: Transaction, aaveAddress: string): LendingInteraction | null {
    // Simplified - in reality you'd parse function calls
    return {
      hash: tx.hash,
      protocol: 'Aave',
      type: 'supply', // This would be determined by function parsing
      amount: tx.value,
      timestamp: tx.timestamp,
      asset: 'ETH', // This would be determined by token analysis
      success: tx.status === 'success'
    };
  }

  private async getWalletBalance(address: string): Promise<number> {
    try {
      // Use the RPC URL from chain config
      const rpcUrl = (this.chainConfig as any).rpcUrl;
      if (!rpcUrl) {
        console.warn('No RPC URL configured for chain', this.chainConfig.chainId);
        return 0;
      }
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  private calculateTotalVolume(transactions: Transaction[]): number {
    return transactions.reduce((sum, tx) => {
      return sum + parseFloat(ethers.formatEther(tx.value || '0'));
    }, 0);
  }

  private calculateMonthsActive(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;
    
    const timestamps = transactions.map(tx => tx.timestamp).filter(ts => ts > 0);
    if (timestamps.length === 0) return 0;
    
    const oldest = Math.min(...timestamps);
    const newest = Math.max(...timestamps);
    const monthsDiff = (newest - oldest) / (30 * 24 * 60 * 60);
    
    return Math.max(1, Math.ceil(monthsDiff));
  }
}

// Main client export - SIMPLIFIED
export class CreditCupidCreditClient {
  constructor(rpcUrls?: any) {
    // Accept but don't use rpcUrls parameter to maintain compatibility
    console.log('🔗 [Backend] CreditCupidCreditClient initialized');
  }

  async getOnChainData(address: string, chainId: number = 11155111): Promise<OnChainData> {
    console.log(`🔗 [Backend] Getting on-chain data for ${address} on chain ${chainId}`);
    
    try {
      const blockscoutService = new RealBlockscoutService(chainId.toString());
      return await blockscoutService.getOnChainData(address);
    } catch (error) {
      console.error(`❌ [Backend] Failed to get on-chain data:`, error);
      // Return empty data structure
      return {
        address,
        transactions: [],
        lendingInteractions: [],
        walletBalance: 0,
        totalVolume: 0,
        monthsActive: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };
    }
  }

  // Health check
  async healthCheck(chainId: number = 11155111): Promise<{ status: string }> {
    try {
      const blockscoutService = new RealBlockscoutService(chainId.toString());
      await blockscoutService.getOnChainData('0x0000000000000000000000000000000000000000');
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}