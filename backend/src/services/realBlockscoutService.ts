import axios from 'axios';
import { ethers } from 'ethers';

export interface WalletActivity {
  transactions: Transaction[];
  tokenTransfers: TokenTransfer[];
  internalTransactions: InternalTransaction[];
  nftTransfers: NFTTransfer[];
  protocolInteractions: ProtocolInteraction[];
  blockscoutSupported: boolean;
  lastUpdated: number;
}

export interface Transaction {
  hash: string;
  timestamp: number;
  value: string;
  to: string;
  from: string;
  gasUsed: string;
  gasPrice: string;
  status: boolean;
  method?: string;
  contractAddress?: string;
  blockNumber?: number;
  confirmations?: number;
  nonce?: number;
  position?: number;
  fee?: string;
  gasLimit?: string;
  baseFeePerGas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  type?: number;
}

export interface TokenTransfer {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply?: string;
    exchangeRate?: string;
    type?: 'ERC-20' | 'ERC-721' | 'ERC-1155';
  };
  total?: {
    value: string;
    decimals: number;
  };
  logIndex?: number;
}

export interface InternalTransaction {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  type: 'call' | 'delegatecall' | 'create' | 'create2' | 'selfdestruct';
  gasUsed?: string;
  gasLimit?: string;
  success?: boolean;
  error?: string;
}

export interface NFTTransfer {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    tokenId: string;
    tokenType: 'ERC-721' | 'ERC-1155';
    metadata?: any;
  };
  total?: {
    value: string;
    decimals: number;
  };
  logIndex?: number;
}

export interface ProtocolInteraction {
  protocol: 'aave' | 'morpho' | 'uniswap' | 'compound' | 'curve' | 'balancer' | 'sushiswap' | 'yearn' | 'maker' | 'lido' | 'rocketpool' | 'other';
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'supply' | 'swap' | 'liquidity_add' | 'liquidity_remove' | 'stake' | 'unstake' | 'claim' | 'governance' | 'interaction';
  amount: string;
  timestamp: number;
  chainId: number;
  txHash: string;
  asset: string;
  contractAddress: string;
  success: boolean;
  gasUsed?: string;
  gasCostUSD?: string;
}

export interface BlockscoutResponse<T> {
  items: T[];
  next_page_params?: any;
}

export interface BlockscoutTransaction {
  hash: string;
  timestamp: string;
  value: string;
  to: BlockscoutAddress;
  from: BlockscoutAddress;
  gas_used: string;
  gas_price: string;
  status: string;
  result: string;
  method: string;
  created_contract: BlockscoutAddress;
  block: string;
  confirmations: number;
  nonce: number;
  position: number;
  fee: {
    value: string;
    type: string;
  };
  gas_limit: string;
  base_fee_per_gas: string;
  max_fee_per_gas: string;
  max_priority_fee_per_gas: string;
  type: number;
}

export interface BlockscoutAddress {
  hash: string;
  implementation_name?: string;
  name?: string;
  is_contract?: boolean;
  is_verified?: boolean;
}

export interface BlockscoutTokenTransfer {
  transaction: {
    hash: string;
    timestamp: string;
  };
  from: BlockscoutAddress;
  to: BlockscoutAddress;
  total: {
    value: string;
    decimals: number;
  };
  token: {
    address: string;
    name: string;
    symbol: string;
    type: string;
    total_supply?: string;
    exchange_rate?: string;
    decimals?: number;
  };
  log_index?: number;
}

export interface BlockscoutInternalTransaction {
  transaction: {
    hash: string;
    timestamp: string;
  };
  from: BlockscoutAddress;
  to: BlockscoutAddress;
  value: string;
  type: string;
  gas_used?: string;
  gas_limit?: string;
  success?: boolean;
  error?: string;
}

export interface BlockscoutNFTTransfer {
  transaction: {
    hash: string;
    timestamp: string;
  };
  from: BlockscoutAddress;
  to: BlockscoutAddress;
  total: {
    value: string;
    decimals: number;
  };
  nft: {
    address: string;
    name: string;
    symbol: string;
    token_id: string;
    token_type: string;
    metadata?: any;
  };
  log_index?: number;
}

export class RealBlockscoutService {
  private baseURLs: { [chainId: number]: string } = {
    1: 'https://eth.blockscout.com/api/v2',
    137: 'https://polygon.blockscout.com/api/v2', 
    42161: 'https://arbitrum.blockscout.com/api/v2',
    10: 'https://optimism.blockscout.com/api/v2',
    8453: 'https://base.blockscout.com/api/v2',
    11155111: 'https://sepolia.blockscout.com/api/v2',
  };

  private chainNames: { [chainId: number]: string } = {
    1: 'Ethereum Mainnet',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
    11155111: 'Sepolia',
  };

  // Known DeFi protocol addresses
  private protocolAddresses: { [address: string]: { name: string; type: string; version?: string } } = {
    // Aave V3
    '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': { name: 'aave', type: 'lending', version: 'v3' },
    // Morpho
    '0x8888882f8f843896699869179fb6e4f7e3b58888': { name: 'morpho', type: 'lending', version: 'v2' },
    // Uniswap V3
    '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'uniswap', type: 'swap', version: 'v3' },
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'uniswap', type: 'router', version: 'v3' },
    // Compound
    '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b': { name: 'compound', type: 'lending', version: 'v2' },
  };

  constructor(private chainId: number = 1) {}

  private getBaseURL(): string {
    return this.baseURLs[this.chainId] || this.baseURLs[1];
  }

  private getChainName(): string {
    return this.chainNames[this.chainId] || 'Ethereum Mainnet';
  }

  private async makeBlockscoutRequest<T>(endpoint: string, params?: any): Promise<BlockscoutResponse<T>> {
    try {
      const url = `${this.getBaseURL()}${endpoint}`;
      console.log(`📡 Making Blockscout request to: ${url}`);
      
      const response = await axios.get(url, { 
        params,
        timeout: 10000,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });

      // Handle specific error statuses gracefully
      if (response.status === 422 || response.status === 400 || response.status === 429) {
        console.warn(`⚠️ Blockscout API returned ${response.status} for ${endpoint}`);
        return { items: [], next_page_params: null };
      }

      if (response.status !== 200) {
        console.warn(`⚠️ Blockscout API returned ${response.status} for ${endpoint}`);
        return { items: [], next_page_params: null };
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.warn(`⚠️ Blockscout API timeout for ${this.getChainName()}`);
      } else if (error.response?.status >= 500) {
        console.warn(`⚠️ Blockscout server error for ${this.getChainName()}`);
      } else {
        console.warn(`⚠️ Blockscout API error for ${endpoint}:`, error.message);
      }
      return { items: [], next_page_params: null };
    }
  }

  async getWalletActivity(address: string, fromBlock?: number, toBlock?: number): Promise<WalletActivity> {
    console.log(`📡 Fetching Blockscout data for: ${address} on ${this.getChainName()}`);

    try {
      if (!ethers.isAddress(address)) {
        throw new Error(`Invalid Ethereum address: ${address}`);
      }

      const normalizedAddress = ethers.getAddress(address);

      // Check Blockscout availability first
      const availability = await this.checkBlockscoutAvailability();
      if (!availability.available) {
        console.warn(`⚠️ Blockscout not available for ${this.getChainName()}`);
        return this.getEmptyWalletActivity();
      }

      const [
        transactions,
        tokenTransfers,
        internalTransactions,
        nftTransfers
      ] = await Promise.all([
        this.getTransactions(normalizedAddress, fromBlock, toBlock),
        this.getTokenTransfers(normalizedAddress, fromBlock, toBlock),
        this.getInternalTransactions(normalizedAddress, fromBlock, toBlock),
        this.getNFTTransfers(normalizedAddress, fromBlock, toBlock)
      ]);

      const protocolInteractions = this.identifyProtocolInteractions(
        transactions, 
        tokenTransfers,
        internalTransactions
      );

      return {
        transactions,
        tokenTransfers,
        internalTransactions,
        nftTransfers,
        protocolInteractions,
        blockscoutSupported: true,
        lastUpdated: Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      console.error(`Error fetching Blockscout data for ${address}:`, error);
      return this.getEmptyWalletActivity();
    }
  }

  private getEmptyWalletActivity(): WalletActivity {
    return {
      transactions: [],
      tokenTransfers: [],
      internalTransactions: [],
      nftTransfers: [],
      protocolInteractions: [],
      blockscoutSupported: false,
      lastUpdated: Math.floor(Date.now() / 1000)
    };
  }

  private async getTransactions(address: string, fromBlock?: number, toBlock?: number): Promise<Transaction[]> {
    try {
      const params: any = {
        address,
        sort: 'desc',
        page: 1,
        offset: 50
      };

      if (fromBlock) params.startblock = fromBlock;
      if (toBlock) params.endblock = toBlock;

      const data = await this.makeBlockscoutRequest<BlockscoutTransaction>(`/addresses/${address}/transactions`, params);
      
      return data.items.map((tx: BlockscoutTransaction) => {
        const gasPrice = tx.gas_price || '0';
        const gasUsed = tx.gas_used || '0';
        
        // Calculate transaction fee
        let fee = '0';
        if (tx.type === 2) { // EIP-1559
          const baseFee = tx.base_fee_per_gas || '0';
          const maxPriorityFee = tx.max_priority_fee_per_gas || '0';
          fee = ethers.formatEther((BigInt(gasUsed) * (BigInt(baseFee) + BigInt(maxPriorityFee))).toString());
        } else {
          fee = ethers.formatEther((BigInt(gasUsed) * BigInt(gasPrice)).toString());
        }

        return {
          hash: tx.hash,
          timestamp: Math.floor(new Date(tx.timestamp).getTime() / 1000),
          value: ethers.formatEther(tx.value || '0'),
          to: tx.to?.hash || '',
          from: tx.from?.hash || '',
          gasUsed: gasUsed,
          gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
          status: tx.status === 'ok' || tx.result === 'success',
          method: tx.method || undefined,
          contractAddress: tx.created_contract?.hash || undefined,
          blockNumber: parseInt(tx.block || '0'),
          confirmations: tx.confirmations || 0,
          nonce: tx.nonce || 0,
          position: tx.position || 0,
          fee: fee,
          gasLimit: tx.gas_limit || '0',
          baseFeePerGas: tx.base_fee_per_gas || '0',
          maxFeePerGas: tx.max_fee_per_gas || '0',
          maxPriorityFeePerGas: tx.max_priority_fee_per_gas || '0',
          type: tx.type || 0
        };
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  private async getTokenTransfers(address: string, fromBlock?: number, toBlock?: number): Promise<TokenTransfer[]> {
    try {
      const params: any = {
        address,
        sort: 'desc', 
        page: 1,
        offset: 50
      };

      if (fromBlock) params.startblock = fromBlock;
      if (toBlock) params.endblock = toBlock;

      const data = await this.makeBlockscoutRequest<BlockscoutTokenTransfer>(`/addresses/${address}/token-transfers`, params);
      
      return data.items.map((transfer: BlockscoutTokenTransfer) => {
        const decimals = transfer.total?.decimals || transfer.token.decimals || 18;
        const value = transfer.total?.value || '0';

        return {
          hash: transfer.transaction.hash,
          timestamp: Math.floor(new Date(transfer.transaction.timestamp).getTime() / 1000),
          from: transfer.from.hash,
          to: transfer.to.hash,
          value: ethers.formatUnits(value, decimals),
          token: {
            address: transfer.token.address,
            name: transfer.token.name,
            symbol: transfer.token.symbol,
            decimals: decimals,
            totalSupply: transfer.token.total_supply,
            exchangeRate: transfer.token.exchange_rate,
            type: transfer.token.type as 'ERC-20' | 'ERC-721' | 'ERC-1155'
          },
          total: transfer.total ? {
            value: transfer.total.value,
            decimals: transfer.total.decimals
          } : undefined,
          logIndex: transfer.log_index
        };
      });
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return [];
    }
  }

  private async getInternalTransactions(address: string, fromBlock?: number, toBlock?: number): Promise<InternalTransaction[]> {
    try {
      const params: any = {
        address,
        sort: 'desc',
        page: 1,
        offset: 50
      };

      if (fromBlock) params.startblock = fromBlock;
      if (toBlock) params.endblock = toBlock;

      const data = await this.makeBlockscoutRequest<BlockscoutInternalTransaction>(`/addresses/${address}/internal-transactions`, params);
      
      return data.items.map((tx: BlockscoutInternalTransaction) => ({
        hash: tx.transaction.hash,
        timestamp: Math.floor(new Date(tx.transaction.timestamp).getTime() / 1000),
        from: tx.from.hash,
        to: tx.to.hash,
        value: ethers.formatEther(tx.value || '0'),
        type: this.normalizeInternalTxType(tx.type),
        gasUsed: tx.gas_used,
        gasLimit: tx.gas_limit,
        success: tx.success,
        error: tx.error
      }));
    } catch (error) {
      console.error('Error fetching internal transactions:', error);
      return [];
    }
  }

  private async getNFTTransfers(address: string, fromBlock?: number, toBlock?: number): Promise<NFTTransfer[]> {
    try {
      const params: any = {
        address,
        sort: 'desc',
        page: 1,
        offset: 50
      };

      if (fromBlock) params.startblock = fromBlock;
      if (toBlock) params.endblock = toBlock;

      const data = await this.makeBlockscoutRequest<BlockscoutNFTTransfer>(`/addresses/${address}/nft-transfers`, params);
      
      return data.items.map((transfer: BlockscoutNFTTransfer) => ({
        hash: transfer.transaction.hash,
        timestamp: Math.floor(new Date(transfer.transaction.timestamp).getTime() / 1000),
        from: transfer.from.hash,
        to: transfer.to.hash,
        token: {
          address: transfer.nft.address,
          name: transfer.nft.name,
          symbol: transfer.nft.symbol,
          tokenId: transfer.nft.token_id,
          tokenType: transfer.nft.token_type as 'ERC-721' | 'ERC-1155',
          metadata: transfer.nft.metadata
        },
        total: transfer.total ? {
          value: transfer.total.value,
          decimals: transfer.total.decimals
        } : undefined,
        logIndex: transfer.log_index
      }));
    } catch (error) {
      console.error('Error fetching NFT transfers:', error);
      return [];
    }
  }

  private normalizeInternalTxType(type: string): InternalTransaction['type'] {
    const normalized = type.toLowerCase();
    if (normalized.includes('call')) return 'call';
    if (normalized.includes('delegate')) return 'delegatecall';
    if (normalized.includes('create2')) return 'create2';
    if (normalized.includes('create')) return 'create';
    if (normalized.includes('selfdestruct')) return 'selfdestruct';
    return 'call';
  }

  private identifyProtocolInteractions(
    transactions: Transaction[], 
    tokenTransfers: TokenTransfer[],
    internalTransactions: InternalTransaction[]
  ): ProtocolInteraction[] {
    const interactions: ProtocolInteraction[] = [];

    // Analyze transactions for protocol interactions
    transactions.forEach(tx => {
      if (tx.to) {
        const protocolInfo = this.getProtocolInfo(tx.to);
        if (protocolInfo) {
          const interactionType = this.determineTransactionInteractionType(protocolInfo.type, tx.value, tx.method);
          
          interactions.push({
            protocol: protocolInfo.name as ProtocolInteraction['protocol'],
            type: interactionType,
            amount: tx.value,
            timestamp: tx.timestamp,
            chainId: this.chainId,
            txHash: tx.hash,
            asset: 'ETH',
            contractAddress: tx.to,
            success: tx.status,
            gasUsed: tx.gasUsed,
            gasCostUSD: tx.fee
          });
        }
      }
    });

    // Remove duplicates and sort by timestamp
    const uniqueInteractions = interactions.filter((interaction, index, self) =>
      index === self.findIndex((t) => (
        t.txHash === interaction.txHash && 
        t.protocol === interaction.protocol &&
        t.type === interaction.type
      ))
    );

    return uniqueInteractions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private getProtocolInfo(address: string): { name: string; type: string; version?: string } | null {
    const normalizedAddress = address.toLowerCase();
    return this.protocolAddresses[normalizedAddress] || null;
  }

  private determineTransactionInteractionType(protocolType: string, value: string, method?: string): ProtocolInteraction['type'] {
    const amount = parseFloat(value);
    
    if (protocolType === 'lending') {
      if (method?.includes('deposit') || method?.includes('supply')) return 'deposit';
      if (method?.includes('withdraw')) return 'withdraw';
      if (method?.includes('borrow')) return 'borrow';
      if (method?.includes('repay')) return 'repay';
      return amount > 0 ? 'deposit' : 'withdraw';
    } 
    
    if (protocolType === 'swap' || protocolType === 'router') {
      return 'swap';
    }

    return 'interaction';
  }

  async getWalletStats(address: string): Promise<{
    totalTransactions: number;
    totalValue: string;
    firstSeen: number;
    lastSeen: number;
    activeDays: number;
    protocolUsage: { [protocol: string]: number };
    gasSpent: string;
    uniqueContracts: number;
    blockscoutSupported: boolean;
    chainName: string;
  }> {
    try {
      const activity = await this.getWalletActivity(address);
      
      const totalValue = activity.transactions.reduce((sum, tx) => 
        sum + parseFloat(tx.value), 0
      ).toFixed(4);

      const gasSpent = activity.transactions.reduce((sum, tx) => 
        sum + parseFloat(tx.fee || '0'), 0
      ).toFixed(6);

      const timestamps = activity.transactions.map(tx => tx.timestamp);
      const firstSeen = timestamps.length > 0 ? Math.min(...timestamps) : Date.now() / 1000;
      const lastSeen = timestamps.length > 0 ? Math.max(...timestamps) : Date.now() / 1000;
      
      const protocolUsage: { [protocol: string]: number } = {};
      activity.protocolInteractions.forEach(interaction => {
        protocolUsage[interaction.protocol] = (protocolUsage[interaction.protocol] || 0) + 1;
      });

      const uniqueContracts = new Set([
        ...activity.transactions.map(tx => tx.to).filter(Boolean),
        ...activity.tokenTransfers.map(transfer => transfer.to).filter(Boolean),
        ...activity.internalTransactions.map(tx => tx.to).filter(Boolean)
      ]).size;

      const activeDays = timestamps.length > 0 ? Math.ceil((lastSeen - firstSeen) / (24 * 60 * 60)) : 0;

      return {
        totalTransactions: activity.transactions.length,
        totalValue,
        firstSeen,
        lastSeen,
        activeDays,
        protocolUsage,
        gasSpent,
        uniqueContracts,
        blockscoutSupported: activity.blockscoutSupported,
        chainName: this.getChainName()
      };
    } catch (error) {
      console.error('Error getting wallet stats:', error);
      return {
        totalTransactions: 0,
        totalValue: '0',
        firstSeen: Date.now() / 1000,
        lastSeen: Date.now() / 1000,
        activeDays: 0,
        protocolUsage: {},
        gasSpent: '0',
        uniqueContracts: 0,
        blockscoutSupported: false,
        chainName: this.getChainName()
      };
    }
  }

  // Method to check if Blockscout is available for this chain
  async checkBlockscoutAvailability(): Promise<{ available: boolean; chainName: string; responseTime: number }> {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${this.getBaseURL()}/stats`, { 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      const responseTime = Date.now() - startTime;
      const available = response.status === 200;
      
      return {
        available,
        chainName: this.getChainName(),
        responseTime
      };
    } catch (error) {
      return {
        available: false,
        chainName: this.getChainName(),
        responseTime: Date.now() - startTime
      };
    }
  }
}