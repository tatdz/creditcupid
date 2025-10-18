// backend/src/services/RealBlockscoutService.ts
import { CHAIN_CONFIGS, ChainConfig } from '../config/chains'; 

export interface BlockscoutTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'success' | 'failed';
  functionName: string;
  input: string;
  tokenTransfers?: TokenTransfer[];
}

export interface TokenTransfer {
  token: {
    address: string;
    symbol: string;
    decimals: number;
  };
  value: string;
  from: string;
  to: string;
}

export interface ProtocolInteractionAnalysis {
  hash: string;
  protocol: 'aave' | 'morpho' | 'uniswap' | 'compound' | 'other';
  type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'liquidate' | 'flashloan' | 'deposit';
  asset: string;
  amount: string;
  timestamp: number;
  success: boolean;
  contractAddress: string;
  method: string;
}

export class RealBlockscoutService {
  private chainConfig: ChainConfig;

  constructor(chainId: string) {
    this.chainConfig = CHAIN_CONFIGS[chainId] || CHAIN_CONFIGS['1'];
  }

  async getWalletActivity(address: string): Promise<{
    transactions: BlockscoutTransaction[];
    protocolInteractions: ProtocolInteractionAnalysis[];
    repayments: ProtocolInteractionAnalysis[];
  }> {
    console.log(`📊 [Backend] Getting REAL wallet activity for ${address} on chain ${this.chainConfig.chainId}`);
    
    try {
      // Fetch transactions from Blockscout API (same as frontend)
      const transactions = await this.fetchTransactions(address);
      
      // Fetch token transfers for each transaction
      const transactionsWithTransfers = await this.fetchTokenTransfers(address, transactions);
      
      // Analyze transactions for protocol interactions and repayments
      const { protocolInteractions, repayments } = this.analyzeTransactions(transactionsWithTransfers);
      
      console.log(`✅ [Backend] Real data fetched:`, {
        transactions: transactions.length,
        protocolInteractions: protocolInteractions.length,
        repayments: repayments.length
      });

      return {
        transactions: transactionsWithTransfers,
        protocolInteractions,
        repayments
      };

    } catch (error) {
      console.error('❌ [Backend] Real Blockscout service failed:', error);
      // Return empty data instead of mock data
      return {
        transactions: [],
        protocolInteractions: [],
        repayments: []
      };
    }
  }

  private async fetchTransactions(address: string): Promise<BlockscoutTransaction[]> {
    const response = await fetch(
      `${this.chainConfig.blockscoutUrl}/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=100`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      return data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: parseInt(tx.timeStamp),
        status: tx.isError === '0' ? 'success' : 'failed',
        functionName: tx.functionName,
        input: tx.input,
      }));
    } else {
      return [];
    }
  }

  private async fetchTokenTransfers(address: string, transactions: BlockscoutTransaction[]): Promise<BlockscoutTransaction[]> {
    const transactionsWithTransfers = await Promise.all(
      transactions.map(async (tx) => {
        try {
          const tokenResponse = await fetch(
            `${this.chainConfig.blockscoutUrl}/api?module=account&action=tokentx&address=${address}&txhash=${tx.hash}`
          );
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (tokenData.status === '1' && tokenData.result) {
              return {
                ...tx,
                tokenTransfers: tokenData.result.map((transfer: any) => ({
                  token: {
                    address: transfer.contractAddress,
                    symbol: transfer.tokenSymbol,
                    decimals: parseInt(transfer.tokenDecimal),
                  },
                  value: transfer.value,
                  from: transfer.from,
                  to: transfer.to,
                }))
              };
            }
          }
        } catch (error) {
          console.error('Error fetching token transfers:', error);
        }
        return tx;
      })
    );

    return transactionsWithTransfers;
  }

  private analyzeTransactions(transactions: BlockscoutTransaction[]): {
    protocolInteractions: ProtocolInteractionAnalysis[];
    repayments: ProtocolInteractionAnalysis[];
  } {
    const protocolInteractions: ProtocolInteractionAnalysis[] = [];
    const repayments: ProtocolInteractionAnalysis[] = [];

    transactions.forEach(tx => {
      // Check for Morpho interactions (all methods except repay)
      if (this.chainConfig.morphoAddress !== '0x0000000000000000000000000000000000000000' && 
          tx.to?.toLowerCase() === this.chainConfig.morphoAddress.toLowerCase()) {
        const interaction = this.parseMorphoInteraction(tx, this.chainConfig.morphoAddress);
        if (interaction) {
          if (interaction.type === 'repay') {
            repayments.push(interaction);
          } else {
            protocolInteractions.push(interaction);
          }
        }
      }

      // Check for Aave interactions (all methods except repay)
      if (this.chainConfig.aaveAddresses.length > 0) {
        const aaveAddress = this.chainConfig.aaveAddresses.find((addr: string) => 
          tx.to?.toLowerCase() === addr.toLowerCase()
        );
        
        if (aaveAddress) {
          const interaction = this.parseAaveInteraction(tx, aaveAddress);
          if (interaction) {
            if (interaction.type === 'repay') {
              repayments.push(interaction);
            } else {
              protocolInteractions.push(interaction);
            }
          }
        }
      }
    });

    return { protocolInteractions, repayments };
  }

  private parseMorphoInteraction(tx: BlockscoutTransaction, morphoAddress: string): ProtocolInteractionAnalysis | null {
    if (!tx.functionName) return null;

    const functionName = tx.functionName.toLowerCase();

    // Morpho method detection based on function names
    const isSupply = functionName.includes('supply') || functionName.includes('deposit') || functionName.includes('provide');
    const isWithdraw = functionName.includes('withdraw') || functionName.includes('redeem');
    const isBorrow = functionName.includes('borrow');
    const isRepay = functionName.includes('repay');
    const isLiquidate = functionName.includes('liquidate');

    if (isSupply) {
      return {
        hash: tx.hash,
        protocol: 'morpho',
        type: 'supply',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: morphoAddress,
        method: functionName
      };
    }

    if (isWithdraw) {
      return {
        hash: tx.hash,
        protocol: 'morpho',
        type: 'withdraw',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: morphoAddress,
        method: functionName
      };
    }

    if (isBorrow) {
      return {
        hash: tx.hash,
        protocol: 'morpho',
        type: 'borrow',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: morphoAddress,
        method: functionName
      };
    }

    if (isRepay) {
      return {
        hash: tx.hash,
        protocol: 'morpho',
        type: 'repay',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: morphoAddress,
        method: functionName
      };
    }

    if (isLiquidate) {
      return {
        hash: tx.hash,
        protocol: 'morpho',
        type: 'liquidate',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: morphoAddress,
        method: functionName
      };
    }

    return null;
  }

  private parseAaveInteraction(tx: BlockscoutTransaction, aaveAddress: string): ProtocolInteractionAnalysis | null {
    if (!tx.functionName) return null;

    const functionName = tx.functionName.toLowerCase();

    // Aave method detection based on function names
    const isSupply = functionName.includes('supply') || functionName.includes('deposit') || functionName.includes('mint');
    const isWithdraw = functionName.includes('withdraw') || functionName.includes('redeem');
    const isBorrow = functionName.includes('borrow');
    const isRepay = functionName.includes('repay');
    const isLiquidate = functionName.includes('liquidate');
    const isFlashLoan = functionName.includes('flashloan');

    if (isSupply) {
      return {
        hash: tx.hash,
        protocol: 'aave',
        type: 'supply',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: aaveAddress,
        method: functionName
      };
    }

    if (isWithdraw) {
      return {
        hash: tx.hash,
        protocol: 'aave',
        type: 'withdraw',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: aaveAddress,
        method: functionName
      };
    }

    if (isBorrow) {
      return {
        hash: tx.hash,
        protocol: 'aave',
        type: 'borrow',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: aaveAddress,
        method: functionName
      };
    }

    if (isRepay) {
      return {
        hash: tx.hash,
        protocol: 'aave',
        type: 'repay',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: aaveAddress,
        method: functionName
      };
    }

    if (isLiquidate) {
      return {
        hash: tx.hash,
        protocol: 'aave',
        type: 'liquidate',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: aaveAddress,
        method: functionName
      };
    }

    if (isFlashLoan) {
      return {
        hash: tx.hash,
        protocol: 'aave',
        type: 'flashloan',
        asset: 'Unknown',
        amount: tx.value,
        timestamp: tx.timestamp,
        success: tx.status === 'success',
        contractAddress: aaveAddress,
        method: functionName
      };
    }

    return null;
  }
}