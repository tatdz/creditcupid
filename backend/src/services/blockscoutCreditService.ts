// src/services/blockscoutCreditService.ts (backend version)
export interface BlockscoutTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'success' | 'failed';
  functionName: string;
  input: string;
  tokenTransfers?: any[];
}

export interface ProtocolInteractionAnalysis {
  hash: string;
  protocol: 'morpho' | 'aave' | 'other';
  type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'liquidate' | 'flashloan' | 'interaction';
  asset: string;
  amount: string;
  timestamp: number;
  success: boolean;
  contractAddress: string;
  method: string;
}

export class BlockscoutCreditService {
  private static instance: BlockscoutCreditService;

  private blockscoutApiKey: string;
  private etherscanApiKey: string;

  constructor() {
    // For backend, use process.env directly
    this.blockscoutApiKey = process.env.BLOCKSCOUT_API_KEY || '';
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
    
    console.log('🔑 Backend API Keys initialized:', {
      hasBlockscoutKey: !!this.blockscoutApiKey,
      hasEtherscanKey: !!this.etherscanApiKey
    });
  }

  public static getInstance(): BlockscoutCreditService {
    if (!BlockscoutCreditService.instance) {
      BlockscoutCreditService.instance = new BlockscoutCreditService();
    }
    return BlockscoutCreditService.instance;
  }

  // Method to set API keys (for frontend compatibility)
  setApiKeys(blockscoutKey: string, etherscanKey: string) {
    this.blockscoutApiKey = blockscoutKey;
    this.etherscanApiKey = etherscanKey;
    console.log('🔑 API Keys updated');
  }

  // Primary method: Blockscout with API key
  async fetchTransactionsBlockscout(address: string, blockscoutUrl: string): Promise<BlockscoutTransaction[]> {
    try {
      const url = `${blockscoutUrl}/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=100`;
      
      const headers: HeadersInit = {};
      if (this.blockscoutApiKey) {
        headers['Authorization'] = `Bearer ${this.blockscoutApiKey}`;
      }

      console.log('🔍 Fetching transactions via Blockscout:', { 
        address, 
        blockscoutUrl,
        hasApiKey: !!this.blockscoutApiKey 
      });

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Blockscout API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === '0' || !data.result) {
        throw new Error(data.message || 'No transactions found');
      }

      const transactions: BlockscoutTransaction[] = data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: parseInt(tx.timeStamp),
        status: tx.isError === '0' ? 'success' : 'failed',
        functionName: tx.functionName || '',
        input: tx.input,
      }));

      console.log('✅ Blockscout transactions fetched:', transactions.length);
      return transactions;

    } catch (error) {
      console.warn('❌ Blockscout API failed, falling back to Etherscan:', error);
      return await this.fetchTransactionsEtherscan(address);
    }
  }

  // Fallback method: Etherscan
  async fetchTransactionsEtherscan(address: string): Promise<BlockscoutTransaction[]> {
    try {
      if (!this.etherscanApiKey) {
        throw new Error('Etherscan API key not available');
      }

      const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=100&apikey=${this.etherscanApiKey}`;
      
      console.log('🔍 Fetching transactions via Etherscan:', { address });

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === '0') {
        throw new Error(data.message || 'No transactions found on Etherscan');
      }

      const transactions: BlockscoutTransaction[] = data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: parseInt(tx.timeStamp),
        status: tx.isError === '0' ? 'success' : 'failed',
        functionName: tx.functionName || '',
        input: tx.input,
      }));

      console.log('✅ Etherscan transactions fetched:', transactions.length);
      return transactions;

    } catch (error) {
      console.warn('❌ Etherscan API failed, using basic RPC:', error);
      return await this.fetchTransactionsBasic(address);
    }
  }

  // Last fallback: Basic RPC
  async fetchTransactionsBasic(address: string): Promise<BlockscoutTransaction[]> {
    try {
      console.log('🔍 Fetching transactions via basic RPC:', { address });
      return []; // Return empty array for basic fallback
    } catch (error) {
      console.error('❌ All transaction fetch methods failed:', error);
      return [];
    }
  }

  // Main method that tries all services in order
  async getTransactionHistory(address: string, blockscoutUrl: string): Promise<BlockscoutTransaction[]> {
    console.log('🚀 Starting transaction history fetch for:', address);
    const transactions = await this.fetchTransactionsBlockscout(address, blockscoutUrl);
    
    // Fetch token transfers for each transaction
    const transactionsWithTransfers = await this.fetchTokenTransfers(address, transactions, blockscoutUrl);
    
    return transactionsWithTransfers;
  }

  // Fetch token transfers for transactions
  async fetchTokenTransfers(address: string, transactions: BlockscoutTransaction[], blockscoutUrl: string): Promise<BlockscoutTransaction[]> {
    const transactionsWithTransfers = await Promise.all(
      transactions.map(async (tx) => {
        try {
          const url = `${blockscoutUrl}/api?module=account&action=tokentx&address=${address}&txhash=${tx.hash}`;
          
          const headers: HeadersInit = {};
          if (this.blockscoutApiKey) {
            headers['Authorization'] = `Bearer ${this.blockscoutApiKey}`;
          }

          const response = await fetch(url, { headers });
          
          if (response.ok) {
            const tokenData = await response.json();
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
          console.warn('Error fetching token transfers for tx:', tx.hash, error);
        }
        return tx;
      })
    );

    console.log('✅ Token transfers fetched for transactions');
    return transactionsWithTransfers;
  }

  // Analyze transactions for protocol interactions
  analyzeTransactions(transactions: BlockscoutTransaction[], chainConfig: any): {
    protocolInteractions: ProtocolInteractionAnalysis[];
    repayments: ProtocolInteractionAnalysis[];
  } {
    const protocolInteractions: ProtocolInteractionAnalysis[] = [];
    const repayments: ProtocolInteractionAnalysis[] = [];

    transactions.forEach(tx => {
      // Check for Morpho interactions
      if (chainConfig.morphoAddress && chainConfig.morphoAddress !== '0x0000000000000000000000000000000000000000' && 
          tx.to?.toLowerCase() === chainConfig.morphoAddress.toLowerCase()) {
        const interaction = this.parseMorphoInteraction(tx, chainConfig.morphoAddress);
        if (interaction) {
          if (interaction.type === 'repay') {
            repayments.push(interaction);
          } else {
            protocolInteractions.push(interaction);
          }
        }
      }

      // Check for Aave interactions
      if (chainConfig.aaveAddresses && chainConfig.aaveAddresses.length > 0) {
        const aaveAddress = chainConfig.aaveAddresses.find((addr: string) => 
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

    console.log('📊 Transaction analysis complete:', {
      totalTransactions: transactions.length,
      protocolInteractions: protocolInteractions.length,
      repayments: repayments.length
    });

    return { protocolInteractions, repayments };
  }

  private parseMorphoInteraction(tx: BlockscoutTransaction, morphoAddress: string): ProtocolInteractionAnalysis | null {
    if (!tx.functionName) return null;

    const functionName = tx.functionName.toLowerCase();

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

  // Get transaction explorer URL
  getTransactionUrl(txHash: string): string {
    return `https://eth-sepolia.blockscout.com/tx/${txHash}`;
  }

  // Get fallback URL (Etherscan)
  getFallbackTransactionUrl(txHash: string): string {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }

  // Get address explorer URL
  getAddressUrl(address: string): string {
    return `https://eth-sepolia.blockscout.com/address/${address}`;
  }

  // Get fallback address URL (Etherscan)
  getFallbackAddressUrl(address: string): string {
    return `https://sepolia.etherscan.io/address/${address}`;
  }
}

export const blockscoutCreditService = BlockscoutCreditService.getInstance();