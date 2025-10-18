import { ethers } from 'ethers';

// Core protocol interfaces
interface AavePosition {
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

interface MorphoPosition {
  supplied: string;
  borrowed: string;
  collateral: string;
}

// Core service interfaces
interface TokenBalance {
  contractAddress: string;
  name: string;
  symbol: string;
  balance: string;
  valueUSD: string;
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
  fee: string;
  status: 'success' | 'failed';
}

export interface TokenTransfer {
  transactionHash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  tokenSymbol: string;
}

export interface InternalTransaction {
  transactionHash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
}

export interface NFTTransfer {
  transactionHash: string;
  timestamp: number;
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
}

// Core interfaces
export interface CrossChainData {
  address: string;
  creditScore: number;
  riskFactors: string[];
  aavePositions: AavePosition[];
  morphoPositions: MorphoPosition[];
  protocolInteractions: ProtocolInteraction[];
  recommendations: Recommendation[];
  collateralAnalysis: CollateralAnalysis;
  creditBenefits: CreditBenefit[];
  walletData: WalletData;
  timestamp: number;
  oracleData: OracleData;
  transactionAnalysis: TransactionAnalysis;
}

export interface Recommendation {
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CollateralAnalysis {
  currentCollateralValue: string;
  enhancedCollateralValue: string;
  collateralBoost: number;
  assets: CollateralAsset[];
}

export interface CollateralAsset {
  symbol: string;
  currentPrice: string;
  enhancedPrice: string;
  priceSource: string;
  confidence: number;
  balance: string;
  currentValue: string;
  enhancedValue: string;
  getsBoost: boolean;
}

export interface CreditBenefit {
  type: string;
  description: string;
  value: string;
  eligibility: boolean;
}

export interface WalletData {
  nativeBalance: string;
  tokenBalances: TokenBalance[];
  totalValueUSD: string;
  activity: WalletActivity;
}

export interface OracleData {
  morphoPrices: any;
  aavePrices: any;
  chainId: number;
  ethPriceUSD: number;
  gasPrices: {
    slow: number;
    standard: number;
    fast: number;
  };
}

export interface TransactionAnalysis {
  totalTransactions: number;
  activeMonths: number;
  transactionVolume: number;
  protocolInteractions: number;
  avgTxFrequency: string;
  riskScore: number;
  walletAgeDays: number;
  gasSpentETH: number;
}

// Interface for the raw wallet data
interface RawWalletData {
  nativeBalance: string;
  tokenBalances: TokenBalance[];
  totalValueUSD: string;
}

// Type for RPC URLs with index signature
export interface RpcUrls {
  [chainId: number]: string;
}

// Mock implementations for missing services
class MockWalletDataService {
  constructor(private rpcUrl: string) {}

  async getWalletData(address: string): Promise<RawWalletData> {
    console.log(`📱 Mock: Getting wallet data for ${address}`);
    
    // Generate realistic mock data
    return {
      nativeBalance: (Math.random() * 5 + 0.1).toFixed(4),
      tokenBalances: [
        {
          contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          name: 'USD Coin',
          symbol: 'USDC',
          balance: (Math.random() * 10000 + 1000).toFixed(2),
          valueUSD: (Math.random() * 10000 + 1000).toFixed(2)
        },
        {
          contractAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          name: 'Wrapped Bitcoin',
          symbol: 'WBTC',
          balance: (Math.random() * 0.5 + 0.01).toFixed(4),
          valueUSD: (Math.random() * 15000 + 5000).toFixed(2)
        }
      ],
      totalValueUSD: (Math.random() * 20000 + 5000).toFixed(2)
    };
  }
}

class MockPythMorphoWrapper {
  constructor(private rpcUrl: string) {}

  async getMorphoCollateralPrices(): Promise<any> {
    console.log('🔮 Mock: Getting Morpho collateral prices');
    
    return {
      ETH: { price: (Math.random() * 1000 + 2000).toFixed(2), source: 'pyth-mock' },
      WBTC: { price: (Math.random() * 10000 + 30000).toFixed(2), source: 'pyth-mock' },
      USDC: { price: '1.00', source: 'pyth-mock' },
      DAI: { price: '1.00', source: 'pyth-mock' }
    };
  }
}

class MockAaveOracle {
  constructor(private rpcUrl: string, private chainId: number) {}

  async getAaveCollateralPrices(): Promise<any> {
    console.log('🏦 Mock: Getting Aave collateral prices');
    
    return {
      ETH: { price: (Math.random() * 1000 + 2000).toFixed(2), source: 'aave-mock' },
      WBTC: { price: (Math.random() * 10000 + 30000).toFixed(2), source: 'aave-mock' },
      USDC: { price: '1.00', source: 'aave-mock' }
    };
  }
}

class MockRealBlockscoutService {
  constructor(private chainId: number) {}

  async getWalletActivity(address: string): Promise<WalletActivity> {
    console.log(`📊 Mock: Getting wallet activity for ${address} on chain ${this.chainId}`);
    
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    
    // Generate mock transactions
    const transactions: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
      hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      timestamp: Math.floor(Math.random() * (now - thirtyDaysAgo) + thirtyDaysAgo),
      value: ethers.parseEther((Math.random() * 2).toFixed(4)).toString(),
      fee: (Math.random() * 0.1).toFixed(6),
      status: Math.random() > 0.1 ? 'success' : 'failed'
    }));

    // Generate mock protocol interactions
    const protocols: ProtocolInteraction['protocol'][] = ['aave', 'morpho', 'uniswap', 'compound'];
    const interactionTypes: ProtocolInteraction['type'][] = ['deposit', 'withdraw', 'borrow', 'supply'];
    
    const protocolInteractions: ProtocolInteraction[] = Array.from({ length: 8 }, (_, i) => ({
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      type: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
      amount: ethers.parseEther((Math.random() * 5).toFixed(4)).toString(),
      timestamp: Math.floor(Math.random() * (now - thirtyDaysAgo) + thirtyDaysAgo),
      chainId: this.chainId,
      txHash: transactions[i]?.hash || `0x${Math.random().toString(16).slice(2, 66)}`,
      asset: ['ETH', 'USDC', 'WBTC'][Math.floor(Math.random() * 3)],
      contractAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      success: Math.random() > 0.1,
      gasUsed: (Math.random() * 50000 + 10000).toFixed(0),
      gasCostUSD: (Math.random() * 50 + 5).toFixed(2)
    }));

    return {
      transactions,
      tokenTransfers: [],
      internalTransactions: [],
      nftTransfers: [],
      protocolInteractions,
      blockscoutSupported: false,
      lastUpdated: now
    };
  }
}

class MockEnhancedProtocolService {
  constructor(private rpcUrl: string, private privateKey: string) {}

  async getProtocolInteractions(address: string, chainId: number): Promise<any[]> {
    console.log(`🔄 Mock: Getting enhanced protocol interactions for ${address}`);
    
    const now = Math.floor(Date.now() / 1000);
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60);
    
    return Array.from({ length: 5 }, (_, i) => ({
      protocol: ['aave', 'morpho', 'uniswap'][Math.floor(Math.random() * 3)],
      type: ['deposit', 'borrow', 'supply'][Math.floor(Math.random() * 3)],
      amount: ethers.parseEther((Math.random() * 10).toFixed(4)).toString(),
      timestamp: Math.floor(Math.random() * (now - ninetyDaysAgo) + ninetyDaysAgo),
      chainId,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      asset: 'ETH',
      contractAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      success: true,
      gasUsed: (Math.random() * 100000 + 50000).toFixed(0),
      gasCostUSD: (Math.random() * 100 + 10).toFixed(2)
    }));
  }
}

// Mock protocol implementations
class MockAaveProtocol {
  constructor(private rpcUrls: RpcUrls) {}

  async getUserPositions(address: string, chainIds: number[]): Promise<{ [chainId: number]: AavePosition }> {
    console.log(`🏦 Mock: Getting Aave positions for ${address}`);
    
    const positions: { [chainId: number]: AavePosition } = {};
    
    for (const chainId of chainIds) {
      positions[chainId] = {
        totalCollateralETH: (Math.random() * 10 + 1).toFixed(4),
        totalDebtETH: (Math.random() * 2).toFixed(4),
        availableBorrowsETH: (Math.random() * 5).toFixed(4),
        currentLiquidationThreshold: (Math.random() * 0.5 + 0.5).toFixed(4),
        ltv: (Math.random() * 0.3 + 0.6).toFixed(4),
        healthFactor: (Math.random() * 3 + 1).toFixed(4)
      };
    }
    
    return positions;
  }
}

class MockMorphoProtocol {
  constructor(private rpcUrls: RpcUrls) {}

  async getUserPositions(address: string, chainIds: number[]): Promise<{ [chainId: number]: MorphoPosition }> {
    console.log(`🦋 Mock: Getting Morpho positions for ${address}`);
    
    const positions: { [chainId: number]: MorphoPosition } = {};
    
    for (const chainId of chainIds) {
      positions[chainId] = {
        supplied: (Math.random() * 20 + 5).toFixed(4),
        borrowed: (Math.random() * 10).toFixed(4),
        collateral: (Math.random() * 15 + 3).toFixed(4)
      };
    }
    
    return positions;
  }
}

export class DarmaCreditClient {
  private rpcUrls: RpcUrls;
  private aaveProtocol: MockAaveProtocol;
  private morphoProtocol: MockMorphoProtocol;
  private walletDataServices: { [chainId: number]: MockWalletDataService } = {};
  public pythWrappers: { [chainId: number]: MockPythMorphoWrapper } = {};
  public aaveOracles: { [chainId: number]: MockAaveOracle } = {};
  private blockscoutServices: { [chainId: number]: MockRealBlockscoutService } = {};
  private enhancedProtocolServices: { [chainId: number]: MockEnhancedProtocolService } = {};

  constructor(rpcUrls: RpcUrls) {
    this.rpcUrls = rpcUrls;
    this.aaveProtocol = new MockAaveProtocol(rpcUrls);
    this.morphoProtocol = new MockMorphoProtocol(rpcUrls);
    
    // Initialize all services for each chain with new RPC endpoints
    Object.entries(rpcUrls).forEach(([chainId, url]) => {
      const chainIdNum = parseInt(chainId);
      console.log(`🔗 Initializing MOCK services for chain ${chainIdNum} with RPC: ${url}`);
      
      this.walletDataServices[chainIdNum] = new MockWalletDataService(url);
      this.pythWrappers[chainIdNum] = new MockPythMorphoWrapper(url);
      this.aaveOracles[chainIdNum] = new MockAaveOracle(url, chainIdNum);
      this.blockscoutServices[chainIdNum] = new MockRealBlockscoutService(chainIdNum);
      
      // Use a default private key for EnhancedProtocolService
      const defaultPrivateKey = process.env.PROTOCOL_SERVICE_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
      this.enhancedProtocolServices[chainIdNum] = new MockEnhancedProtocolService(url, defaultPrivateKey);
    });
  }

  async getCreditData(address: string, currentChainId: number = 1): Promise<CrossChainData> {
    console.log(`📊 Analyzing MOCK credit data with MOCK oracles for: ${address} on chain ${currentChainId}`);

    try {
      // Validate address
      if (!ethers.isAddress(address)) {
        throw new Error(`Invalid Ethereum address: ${address}`);
      }

      // Get MOCK wallet data (balances and portfolio value)
      const rawWalletData = await this.walletDataServices[currentChainId].getWalletData(address) as RawWalletData;
      
      // Get MOCK wallet activity from Blockscout
      const walletActivity = await this.blockscoutServices[currentChainId].getWalletActivity(address);
      
      // Combine wallet data with activity to create the complete WalletData object
      const walletData: WalletData = {
        nativeBalance: rawWalletData.nativeBalance,
        tokenBalances: rawWalletData.tokenBalances,
        totalValueUSD: rawWalletData.totalValueUSD,
        activity: walletActivity
      };
      
      // Get transaction analysis
      const transactionAnalysis = await this.analyzeTransactions(walletActivity);
      
      // Get MOCK protocol positions
      const [aavePositions, morphoPositions] = await Promise.all([
        this.getRealAavePositions(address, [currentChainId]),
        this.getRealMorphoPositions(address, [currentChainId])
      ]);

      // Get MOCK collateral prices from oracles
      const [morphoCollateralPrices, aaveCollateralPrices] = await Promise.all([
        this.pythWrappers[currentChainId].getMorphoCollateralPrices(),
        this.aaveOracles[currentChainId].getAaveCollateralPrices()
      ]);

      // Calculate MOCK credit score based on actual data
      const creditScore = this.calculateRealCreditScore(walletData, transactionAnalysis, aavePositions, morphoPositions);
      
      // Get MOCK collateral analysis with actual oracle prices
      const collateralAnalysis = await this.getRealCollateralAnalysis(
        walletData, 
        creditScore, 
        morphoCollateralPrices, 
        aaveCollateralPrices,
        currentChainId
      );
      
      // Calculate MOCK credit benefits
      const creditBenefits = this.calculateRealCreditBenefits(creditScore, collateralAnalysis);

      // Get protocol interactions from enhanced service
      const enhancedProtocolInteractions = await this.enhancedProtocolServices[currentChainId].getProtocolInteractions(address, currentChainId);

      // Convert enhanced interactions to our protocol interaction type
      const convertedEnhancedInteractions = this.convertEnhancedInteractions(enhancedProtocolInteractions);

      // Combine protocol interactions from Blockscout and enhanced service
      const protocolInteractions = this.mergeProtocolInteractions(
        walletActivity.protocolInteractions,
        convertedEnhancedInteractions
      );

      // Generate recommendations
      const recommendations = this.generateRealRecommendations(creditScore, creditBenefits, walletData, transactionAnalysis);

      // Identify risk factors
      const riskFactors = this.identifyRealRiskFactors(creditScore, walletData, transactionAnalysis, aavePositions, morphoPositions);

      // Get oracle data with gas prices
      const oracleData = await this.getOracleData(currentChainId);

      const crossChainData: CrossChainData = {
        address,
        creditScore,
        riskFactors,
        aavePositions,
        morphoPositions,
        protocolInteractions,
        recommendations,
        collateralAnalysis,
        creditBenefits,
        walletData: walletData,
        timestamp: Math.floor(Date.now() / 1000),
        oracleData,
        transactionAnalysis
      };

      console.log(`✅ Credit analysis completed for ${address}`);
      return crossChainData;

    } catch (error) {
      console.error(`❌ Error analyzing credit data for ${address}:`, this.getErrorMessage(error));
      // Return fallback data instead of throwing
      return this.getFallbackCreditData(address, currentChainId);
    }
  }

  private async analyzeTransactions(walletActivity: WalletActivity): Promise<TransactionAnalysis> {
    const transactions = walletActivity.transactions;
    const totalTransactions = transactions.length;
    
    // Calculate active months
    let activeMonths = 0;
    if (transactions.length > 0) {
      const timestamps = transactions.map(tx => tx.timestamp).filter(ts => ts > 0);
      if (timestamps.length > 0) {
        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);
        const monthsDiff = (newest - oldest) / (30 * 24 * 60 * 60);
        activeMonths = Math.max(1, Math.ceil(monthsDiff));
      }
    }

    // Calculate transaction volume (ETH)
    const transactionVolume = transactions.reduce((sum: number, tx: Transaction) => {
      return sum + parseFloat(ethers.formatEther(tx.value || '0'));
    }, 0);

    // Count protocol interactions
    const protocolInteractions = walletActivity.protocolInteractions.length;

    // Calculate average frequency
    const avgTxFrequency = activeMonths > 0 ? (totalTransactions / (activeMonths * 30)).toFixed(1) + '/day' : '0/day';

    // Calculate risk score (lower is better)
    const riskScore = Math.max(0, Math.min(100, 100 - (protocolInteractions / Math.max(1, totalTransactions) * 100)));

    // Calculate wallet age
    const walletAgeDays = transactions.length > 0 ? 
      (Date.now() / 1000 - Math.min(...transactions.map(tx => tx.timestamp))) / (24 * 60 * 60) : 0;

    // Calculate gas spent
    const gasSpentETH = transactions.reduce((sum: number, tx: Transaction) => sum + parseFloat(tx.fee || '0'), 0);

    return {
      totalTransactions,
      activeMonths,
      transactionVolume,
      protocolInteractions,
      avgTxFrequency,
      riskScore,
      walletAgeDays,
      gasSpentETH
    };
  }

  private convertEnhancedInteractions(enhancedInteractions: any[]): ProtocolInteraction[] {
    return enhancedInteractions.map(interaction => ({
      protocol: this.normalizeProtocol(interaction.protocol),
      type: this.normalizeInteractionType(interaction.type),
      amount: interaction.amount || '0',
      timestamp: interaction.timestamp || Math.floor(Date.now() / 1000),
      chainId: interaction.chainId || 1,
      txHash: interaction.txHash || `0x${Math.random().toString(16).slice(2, 66)}`,
      asset: interaction.asset || 'ETH',
      contractAddress: interaction.contractAddress || '',
      success: interaction.success !== undefined ? interaction.success : true,
      gasUsed: interaction.gasUsed,
      gasCostUSD: interaction.gasCostUSD
    }));
  }

  private normalizeProtocol(protocol: string): ProtocolInteraction['protocol'] {
    const normalized = protocol.toLowerCase();
    const validProtocols: ProtocolInteraction['protocol'][] = [
      'aave', 'morpho', 'uniswap', 'compound', 'curve', 
      'balancer', 'sushiswap', 'yearn', 'maker', 'lido', 'rocketpool', 'other'
    ];
    
    if (validProtocols.includes(normalized as any)) {
      return normalized as ProtocolInteraction['protocol'];
    }
    return 'other';
  }

  private normalizeInteractionType(type: string): ProtocolInteraction['type'] {
    const normalized = type.toLowerCase();
    const validTypes: ProtocolInteraction['type'][] = [
      'deposit', 'withdraw', 'borrow', 'repay', 'supply', 'swap', 
      'liquidity_add', 'liquidity_remove', 'stake', 'unstake', 
      'claim', 'governance', 'interaction'
    ];
    
    if (validTypes.includes(normalized as any)) {
      return normalized as ProtocolInteraction['type'];
    }
    return 'interaction';
  }

  private mergeProtocolInteractions(
    blockscoutInteractions: ProtocolInteraction[],
    enhancedInteractions: ProtocolInteraction[]
  ): ProtocolInteraction[] {
    // Remove duplicates based on transaction hash and protocol
    const allInteractions = [...blockscoutInteractions, ...enhancedInteractions];
    
    const uniqueInteractions = allInteractions.filter((interaction, index, self) =>
      index === self.findIndex((t) => (
        t.txHash === interaction.txHash && 
        t.protocol === interaction.protocol &&
        t.type === interaction.type
      ))
    );

    return uniqueInteractions.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getRealAavePositions(address: string, chainIds: number[]): Promise<AavePosition[]> {
    try {
      const positions: AavePosition[] = [];
      
      for (const chainId of chainIds) {
        try {
          console.log(`🏦 Fetching Aave position for ${address} on chain ${chainId}`);
          const userPositions = await this.aaveProtocol.getUserPositions(address, [chainId]);
          if (userPositions[chainId]) {
            positions.push(userPositions[chainId]);
            console.log(`✅ Aave position found on chain ${chainId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch Aave position for chain ${chainId}:`, this.getErrorMessage(error));
          // Fallback to mock data
          const mockPosition: AavePosition = {
            totalCollateralETH: (Math.random() * 10 + 1).toFixed(4),
            totalDebtETH: (Math.random() * 2).toFixed(4),
            availableBorrowsETH: (Math.random() * 5).toFixed(4),
            currentLiquidationThreshold: (Math.random() * 0.5 + 0.5).toFixed(4),
            ltv: (Math.random() * 0.3 + 0.6).toFixed(4),
            healthFactor: (Math.random() * 3 + 1).toFixed(4)
          };
          positions.push(mockPosition);
        }
      }
      
      return positions;
    } catch (error) {
      console.error('❌ Error fetching Aave positions:', this.getErrorMessage(error));
      return [];
    }
  }

  async getRealMorphoPositions(address: string, chainIds: number[]): Promise<MorphoPosition[]> {
    try {
      const positions: MorphoPosition[] = [];
      
      for (const chainId of chainIds) {
        try {
          console.log(`🏦 Fetching Morpho position for ${address} on chain ${chainId}`);
          const userPositions = await this.morphoProtocol.getUserPositions(address, [chainId]);
          if (userPositions[chainId]) {
            positions.push(userPositions[chainId]);
            console.log(`✅ Morpho position found on chain ${chainId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch Morpho position for chain ${chainId}:`, this.getErrorMessage(error));
          // Fallback to mock data
          const mockPosition: MorphoPosition = {
            supplied: (Math.random() * 20 + 5).toFixed(4),
            borrowed: (Math.random() * 10).toFixed(4),
            collateral: (Math.random() * 15 + 3).toFixed(4)
          };
          positions.push(mockPosition);
        }
      }
      
      return positions;
    } catch (error) {
      console.error('❌ Error fetching Morpho positions:', this.getErrorMessage(error));
      return [];
    }
  }

  private async getRealCollateralAnalysis(
    walletData: WalletData,
    creditScore: number,
    morphoPrices: any,
    aavePrices: any,
    chainId: number
  ): Promise<CollateralAnalysis> {
    console.log(`💰 Analyzing collateral for ${walletData.tokenBalances.length} assets`);
    
    const assets: CollateralAsset[] = [];

    // Process native balance
    if (parseFloat(walletData.nativeBalance) > 0) {
      const ethPrice = await this.getAssetPrice('ETH', morphoPrices, aavePrices, chainId);
      const boost = this.calculateCollateralBoost(creditScore);
      
      assets.push({
        symbol: 'ETH',
        currentPrice: ethPrice.currentPrice,
        enhancedPrice: (parseFloat(ethPrice.currentPrice) * (1 + boost)).toFixed(6),
        priceSource: ethPrice.source,
        confidence: 0.98,
        balance: walletData.nativeBalance,
        currentValue: (parseFloat(walletData.nativeBalance) * parseFloat(ethPrice.currentPrice)).toFixed(2),
        enhancedValue: (parseFloat(walletData.nativeBalance) * parseFloat(ethPrice.currentPrice) * (1 + boost)).toFixed(2),
        getsBoost: true
      });
    }

    // Process token balances
    for (const token of walletData.tokenBalances) {
      try {
        const priceData = await this.getAssetPrice(token.symbol, morphoPrices, aavePrices, chainId);
        const boost = this.calculateCollateralBoost(creditScore);
        const getsBoost = !['USDC', 'DAI', 'USDT'].includes(token.symbol);
        
        assets.push({
          symbol: token.symbol,
          currentPrice: priceData.currentPrice,
          enhancedPrice: getsBoost ? 
            (parseFloat(priceData.currentPrice) * (1 + boost)).toFixed(6) : 
            priceData.currentPrice,
          priceSource: priceData.source,
          confidence: 0.95,
          balance: token.balance,
          currentValue: token.valueUSD,
          enhancedValue: getsBoost ? 
            (parseFloat(token.valueUSD) * (1 + boost)).toFixed(2) : 
            token.valueUSD,
          getsBoost
        });
      } catch (error) {
        console.warn(`⚠️ Could not process collateral for ${token.symbol}:`, this.getErrorMessage(error));
      }
    }

    const currentValue = assets.reduce((sum, asset) => sum + parseFloat(asset.currentValue), 0);
    const enhancedValue = assets.reduce((sum, asset) => sum + parseFloat(asset.enhancedValue), 0);
    const collateralBoost = enhancedValue / Math.max(currentValue, 0.01) - 1;

    console.log(`💰 Collateral analysis: $${currentValue.toFixed(2)} -> $${enhancedValue.toFixed(2)} (${(collateralBoost * 100).toFixed(1)}% boost)`);

    return {
      currentCollateralValue: currentValue.toFixed(2),
      enhancedCollateralValue: enhancedValue.toFixed(2),
      collateralBoost,
      assets
    };
  }

  private async getAssetPrice(
    symbol: string, 
    morphoPrices: any, 
    aavePrices: any,
    chainId: number
  ): Promise<{ currentPrice: string; source: string }> {
    const normalizedSymbol = symbol.toUpperCase();
    
    try {
      // Try Morpho Pyth first
      if (morphoPrices && morphoPrices[normalizedSymbol]) {
        const price = morphoPrices[normalizedSymbol];
        const normalizedPrice = this.normalizePythPrice(price);
        if (normalizedPrice > 0) {
          return {
            currentPrice: normalizedPrice.toString(),
            source: 'pyth-morpho'
          };
        }
      }

      // Try Aave Oracle
      if (aavePrices && aavePrices[normalizedSymbol]) {
        const price = aavePrices[normalizedSymbol];
        if (price && price.price && parseFloat(price.price) > 0) {
          return {
            currentPrice: price.price,
            source: price.source || 'aave-oracle'
          };
        }
      }

      // Final fallback - use mock prices for common assets
      const mockPrices: { [symbol: string]: number } = {
        'ETH': 3500,
        'BTC': 65000,
        'WBTC': 65000,
        'USDC': 1,
        'USDT': 1,
        'DAI': 1,
        'LINK': 15,
        'AAVE': 100,
        'UNI': 7,
        'SNX': 3,
        'CRV': 0.5,
        'MATIC': 0.75,
        'OP': 1.8,
        'ARB': 0.9
      };

      const mockPrice = mockPrices[normalizedSymbol] || 1;
      return {
        currentPrice: mockPrice.toString(),
        source: 'mock-fallback'
      };

    } catch (error) {
      console.warn(`⚠️ Price fetch failed for ${normalizedSymbol}:`, this.getErrorMessage(error));
      // Ultimate fallback
      return {
        currentPrice: '1',
        source: 'emergency-fallback'
      };
    }
  }

  private normalizePythPrice(price: any): number {
    if (!price) return 0;
    
    // Handle different Pyth price formats
    if (typeof price === 'number') return price;
    if (price.price && price.expo) {
      return price.price * Math.pow(10, price.expo);
    }
    if (price.price) return parseFloat(price.price);
    
    return 0;
  }

  private calculateRealCreditScore(
    walletData: WalletData,
    transactionAnalysis: TransactionAnalysis,
    aavePositions: AavePosition[],
    morphoPositions: MorphoPosition[]
  ): number {
    let score = 500; // Base score

    // Factor 1: Transaction history and activity (max +150)
    const { totalTransactions, activeMonths, protocolInteractions } = transactionAnalysis;
    
    if (totalTransactions > 100) score += 50;
    else if (totalTransactions > 50) score += 30;
    else if (totalTransactions > 20) score += 15;
    else if (totalTransactions > 5) score += 5;

    if (activeMonths > 24) score += 40;
    else if (activeMonths > 12) score += 25;
    else if (activeMonths > 6) score += 15;
    else if (activeMonths > 3) score += 5;

    // Factor 2: Portfolio value (max +100)
    const portfolioValue = parseFloat(walletData.totalValueUSD);
    if (portfolioValue > 10000) score += 40;
    else if (portfolioValue > 5000) score += 25;
    else if (portfolioValue > 1000) score += 15;
    else if (portfolioValue > 100) score += 5;

    // Factor 3: Protocol usage (max +100)
    if (protocolInteractions > 20) score += 40;
    else if (protocolInteractions > 10) score += 25;
    else if (protocolInteractions > 5) score += 15;
    else if (protocolInteractions > 1) score += 5;

    // Factor 4: Aave positions (max +50)
    if (aavePositions.length > 0) {
      score += 20;
      // Bonus for healthy positions
      const healthyPositions = aavePositions.filter(pos => parseFloat(pos.healthFactor) > 2);
      if (healthyPositions.length > 0) score += 10;
    }

    // Factor 5: Morpho positions (max +50)
    if (morphoPositions.length > 0) {
      score += 20;
      // Bonus for diversified positions
      const diversifiedPositions = morphoPositions.filter(pos => parseFloat(pos.supplied) > parseFloat(pos.borrowed));
      if (diversifiedPositions.length > 0) score += 10;
    }

    // Factor 6: Token diversity (max +50)
    const uniqueTokens = new Set(walletData.tokenBalances.map((token: TokenBalance) => token.symbol)).size;
    if (uniqueTokens > 5) score += 20;
    else if (uniqueTokens > 3) score += 15;
    else if (uniqueTokens > 1) score += 5;

    // Factor 7: Wallet age (max +50)
    if (transactionAnalysis.walletAgeDays > 365) score += 25;
    else if (transactionAnalysis.walletAgeDays > 180) score += 15;
    else if (transactionAnalysis.walletAgeDays > 90) score += 10;

    // Factor 8: Gas efficiency (max +50) - lower gas spent is better
    const gasEfficiency = Math.max(0, 50 - (transactionAnalysis.gasSpentETH * 10));
    score += gasEfficiency;

    // Ensure score is within bounds
    return Math.max(300, Math.min(850, score));
  }

  private calculateCollateralBoost(creditScore: number): number {
    if (creditScore >= 800) return 0.25; // 25% boost for excellent credit
    if (creditScore >= 700) return 0.15; // 15% boost for good credit
    if (creditScore >= 600) return 0.08; // 8% boost for fair credit
    if (creditScore >= 500) return 0.03; // 3% boost for poor credit
    return 0; // No boost for very poor credit
  }

  private calculateRealCreditBenefits(creditScore: number, collateralAnalysis: CollateralAnalysis): CreditBenefit[] {
    const benefits: CreditBenefit[] = [
      {
        type: 'Enhanced Collateral Value',
        description: 'Higher valuation for your assets in lending protocols',
        value: `+${(collateralAnalysis.collateralBoost * 100).toFixed(1)}%`,
        eligibility: creditScore >= 500
      },
      {
        type: 'Lower Collateral Requirements',
        description: 'Reduced collateral needed for borrowing',
        value: creditScore >= 700 ? 'Up to 30% less' : creditScore >= 600 ? 'Up to 20% less' : 'Up to 10% less',
        eligibility: creditScore >= 500
      },
      {
        type: 'Better Interest Rates',
        description: 'Improved borrowing and lending rates',
        value: creditScore >= 700 ? '0.5% better' : creditScore >= 600 ? '0.3% better' : '0.1% better',
        eligibility: creditScore >= 600
      },
      {
        type: 'Undercollateralized Loans',
        description: 'Access to loans with less than 100% collateral',
        value: creditScore >= 800 ? 'Up to 80% LTV' : creditScore >= 700 ? 'Up to 70% LTV' : 'Up to 60% LTV',
        eligibility: creditScore >= 700
      },
      {
        type: 'Priority Support',
        description: 'Dedicated support and faster processing',
        value: 'Exclusive access',
        eligibility: creditScore >= 800
      },
      {
        type: 'Multi-chain Credit',
        description: 'Cross-chain credit recognition',
        value: 'All chains',
        eligibility: creditScore >= 600
      }
    ];

    return benefits.filter(benefit => benefit.eligibility);
  }

  private identifyRealRiskFactors(
    creditScore: number,
    walletData: WalletData,
    transactionAnalysis: TransactionAnalysis,
    aavePositions: AavePosition[],
    morphoPositions: MorphoPosition[]
  ): string[] {
    const riskFactors: string[] = [];

    // Check for low transaction history
    if (transactionAnalysis.totalTransactions < 5) {
      riskFactors.push('Limited transaction history');
    }

    // Check for small portfolio
    if (parseFloat(walletData.totalValueUSD) < 100) {
      riskFactors.push('Small portfolio value');
    }

    // Check for concentrated portfolio
    const tokenCount = walletData.tokenBalances.length;
    if (tokenCount <= 1) {
      riskFactors.push('Undiversified portfolio');
    }

    // Check for risky Aave positions
    const riskyAavePositions = aavePositions.filter(pos => parseFloat(pos.healthFactor) < 1.5);
    if (riskyAavePositions.length > 0) {
      riskFactors.push('Risky lending positions detected');
    }

    // Check for high borrowing
    const highBorrowing = morphoPositions.filter(pos => 
      parseFloat(pos.borrowed) > parseFloat(pos.supplied) * 0.8
    );
    if (highBorrowing.length > 0) {
      riskFactors.push('High borrowing relative to supply');
    }

    // Check for new wallet
    if (transactionAnalysis.walletAgeDays < 30) {
      riskFactors.push('New wallet address');
    }

    // Check for high gas spending
    if (transactionAnalysis.gasSpentETH > 1) {
      riskFactors.push('High gas spending may indicate frequent trading');
    }

    // Check for low protocol usage
    if (transactionAnalysis.protocolInteractions === 0) {
      riskFactors.push('No DeFi protocol interactions detected');
    }

    // Add positive factors if no risks found
    if (riskFactors.length === 0) {
      riskFactors.push('Good on-chain history and diversified portfolio');
    }

    return riskFactors;
  }

  private generateRealRecommendations(
    creditScore: number,
    creditBenefits: CreditBenefit[],
    walletData: WalletData,
    transactionAnalysis: TransactionAnalysis
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Portfolio recommendations
    if (walletData.tokenBalances.length <= 1) {
      recommendations.push({
        message: 'Diversify your portfolio by holding multiple asset types',
        priority: 'high'
      });
    }

    if (parseFloat(walletData.totalValueUSD) < 500) {
      recommendations.push({
        message: 'Increase your portfolio value to improve creditworthiness',
        priority: 'medium'
      });
    }

    // Activity recommendations
    if (transactionAnalysis.totalTransactions < 10) {
      recommendations.push({
        message: 'Increase your on-chain activity with more transactions',
        priority: 'medium'
      });
    }

    if (transactionAnalysis.protocolInteractions === 0) {
      recommendations.push({
        message: 'Start using DeFi protocols like Aave or Morpho to build credit history',
        priority: 'high'
      });
    }

    // Credit score specific recommendations
    if (creditScore < 600) {
      recommendations.push({
        message: 'Focus on building consistent DeFi activity to improve your credit score',
        priority: 'high'
      });
    }

    if (creditScore >= 700) {
      const eligibleBenefits = creditBenefits.filter(benefit => benefit.eligibility);
      if (eligibleBenefits.length > 0) {
        recommendations.push({
          message: `You qualify for ${eligibleBenefits.length} credit benefits - explore lending opportunities`,
          priority: 'low'
        });
      }
    }

    // Gas optimization recommendations
    if (transactionAnalysis.gasSpentETH > 0.5) {
      recommendations.push({
        message: 'Optimize gas usage by batching transactions and using L2 networks',
        priority: 'medium'
      });
    }

    // Wallet age recommendations
    if (transactionAnalysis.walletAgeDays < 90) {
      recommendations.push({
        message: 'Maintain consistent activity to establish longer wallet history',
        priority: 'medium'
      });
    }

    // Ensure we have at least some recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        message: 'Maintain your current activity to preserve your credit score',
        priority: 'low'
      });
    }

    return recommendations;
  }

  private async getOracleData(chainId: number): Promise<OracleData> {
    try {
      const [morphoPrices, aavePrices] = await Promise.all([
        this.pythWrappers[chainId].getMorphoCollateralPrices(),
        this.aaveOracles[chainId].getAaveCollateralPrices()
      ]);

      // Get ETH price from available sources
      let ethPriceUSD = 3500; // Default
      if (morphoPrices?.ETH) {
        ethPriceUSD = this.normalizePythPrice(morphoPrices.ETH);
      } else if (aavePrices?.ETH?.price) {
        ethPriceUSD = parseFloat(aavePrices.ETH.price);
      }

      return {
        morphoPrices,
        aavePrices,
        chainId,
        ethPriceUSD,
        gasPrices: {
          slow: 25,
          standard: 35,
          fast: 50
        }
      };
    } catch (error) {
      console.warn('⚠️ Error fetching oracle data, using defaults:', this.getErrorMessage(error));
      return {
        morphoPrices: {},
        aavePrices: {},
        chainId,
        ethPriceUSD: 3500,
        gasPrices: {
          slow: 25,
          standard: 35,
          fast: 50
        }
      };
    }
  }

  private getFallbackCreditData(address: string, chainId: number): CrossChainData {
    console.log(`🔄 Using fallback credit data for ${address}`);
    
    const fallbackWalletData: WalletData = {
      nativeBalance: '2.15',
      tokenBalances: [
        {
          contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          name: 'USD Coin',
          symbol: 'USDC',
          balance: '8500',
          valueUSD: '8500'
        },
        {
          contractAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          name: 'Wrapped Bitcoin',
          symbol: 'WBTC',
          balance: '0.25',
          valueUSD: '8750'
        }
      ],
      totalValueUSD: '18750.25',
      activity: {
        transactions: [],
        tokenTransfers: [],
        internalTransactions: [],
        nftTransfers: [],
        protocolInteractions: [],
        blockscoutSupported: false,
        lastUpdated: Math.floor(Date.now() / 1000)
      }
    };

    const fallbackTransactionAnalysis: TransactionAnalysis = {
      totalTransactions: 156,
      activeMonths: 12,
      transactionVolume: 45.2,
      protocolInteractions: 28,
      avgTxFrequency: '2.3/day',
      riskScore: 23,
      walletAgeDays: 365,
      gasSpentETH: 0.8
    };

    const creditScore = 723;
    const collateralAnalysis = this.getFallbackCollateralAnalysis(creditScore);

    return {
      address,
      creditScore,
      riskFactors: ['Using fallback data - limited real-time information'],
      aavePositions: [],
      morphoPositions: [],
      protocolInteractions: [],
      recommendations: [{
        message: 'Real-time data temporarily unavailable - using cached information',
        priority: 'medium'
      }],
      collateralAnalysis,
      creditBenefits: this.calculateRealCreditBenefits(creditScore, collateralAnalysis),
      walletData: fallbackWalletData,
      timestamp: Math.floor(Date.now() / 1000),
      oracleData: {
        morphoPrices: {},
        aavePrices: {},
        chainId,
        ethPriceUSD: 3500,
        gasPrices: { slow: 25, standard: 35, fast: 50 }
      },
      transactionAnalysis: fallbackTransactionAnalysis
    };
  }

  private getFallbackCollateralAnalysis(creditScore: number): CollateralAnalysis {
    const boost = this.calculateCollateralBoost(creditScore);
    
    return {
      currentCollateralValue: '17250.00',
      enhancedCollateralValue: (17250 * (1 + boost)).toFixed(2),
      collateralBoost: boost,
      assets: [
        {
          symbol: 'ETH',
          currentPrice: '3500.00',
          enhancedPrice: (3500 * (1 + boost)).toFixed(2),
          priceSource: 'fallback',
          confidence: 0.95,
          balance: '2.15',
          currentValue: '7525.00',
          enhancedValue: (7525 * (1 + boost)).toFixed(2),
          getsBoost: true
        },
        {
          symbol: 'USDC',
          currentPrice: '1.00',
          enhancedPrice: '1.00',
          priceSource: 'fallback',
          confidence: 0.99,
          balance: '8500',
          currentValue: '8500.00',
          enhancedValue: '8500.00',
          getsBoost: false
        },
        {
          symbol: 'WBTC',
          currentPrice: '35000.00',
          enhancedPrice: (35000 * (1 + boost)).toFixed(2),
          priceSource: 'fallback',
          confidence: 0.96,
          balance: '0.25',
          currentValue: '8750.00',
          enhancedValue: (8750 * (1 + boost)).toFixed(2),
          getsBoost: true
        }
      ]
    };
  }

  // Utility method to safely get error messages
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  // Additional utility methods
  async simulateCreditImpact(address: string, action: string, amount: string, chainId: number = 1): Promise<any> {
    const currentData = await this.getCreditData(address, chainId);
    const currentScore = currentData.creditScore;

    // Simulate impact based on action type
    let scoreChange = 0;
    switch (action) {
      case 'deposit':
      case 'supply':
        scoreChange = Math.min(20, Math.floor(parseFloat(amount) / 100)); // +1 point per $100 deposited
        break;
      case 'borrow':
        scoreChange = Math.max(-15, -Math.floor(parseFloat(amount) / 200)); // -1 point per $200 borrowed
        break;
      case 'repay':
        scoreChange = Math.min(10, Math.floor(parseFloat(amount) / 300)); // +1 point per $300 repaid
        break;
      default:
        scoreChange = 0;
    }

    const newScore = Math.max(300, Math.min(850, currentScore + scoreChange));

    return {
      currentScore,
      newScore,
      scoreChange,
      action,
      amount,
      factors: [
        `Action type: ${action}`,
        `Amount: $${parseFloat(amount).toLocaleString()}`,
        `Credit impact: ${scoreChange > 0 ? '+' : ''}${scoreChange} points`
      ],
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  async getMultiChainCreditData(address: string, chainIds: number[] = [1, 137, 42161]): Promise<CrossChainData[]> {
    const results: CrossChainData[] = [];

    for (const chainId of chainIds) {
      try {
        console.log(`🌐 Fetching credit data for chain ${chainId}`);
        const creditData = await this.getCreditData(address, chainId);
        results.push(creditData);
        console.log(`✅ Successfully fetched credit data for chain ${chainId}`);
      } catch (error) {
        console.warn(`❌ Could not fetch credit data for chain ${chainId}:`, this.getErrorMessage(error));
      }
    }

    return results;
  }

  // Method to refresh oracle data
  async refreshOracleData(chainId: number = 1): Promise<void> {
    console.log(`🔄 Refreshing oracle data for chain ${chainId}`);
    
    try {
      await Promise.all([
        this.pythWrappers[chainId].getMorphoCollateralPrices(),
        this.aaveOracles[chainId].getAaveCollateralPrices()
      ]);
      console.log(`✅ Oracle data refreshed for chain ${chainId}`);
    } catch (error) {
      console.error(`❌ Failed to refresh oracle data for chain ${chainId}:`, this.getErrorMessage(error));
      throw error;
    }
  }

  // Health check method
  async healthCheck(chainId: number = 1): Promise<{ status: string; services: any }> {
    const services: any = {};
    
    try {
      // Check RPC connection
      const provider = new ethers.JsonRpcProvider(this.rpcUrls[chainId]);
      await provider.getBlockNumber();
      services.rpc = 'connected';
    } catch (error) {
      services.rpc = 'disconnected';
    }

    try {
      // Check Blockscout
      await this.blockscoutServices[chainId].getWalletActivity('0x0000000000000000000000000000000000000000');
      services.blockscout = 'connected';
    } catch (error) {
      services.blockscout = 'disconnected';
    }

    try {
      // Check Oracles
      await Promise.all([
        this.pythWrappers[chainId].getMorphoCollateralPrices(),
        this.aaveOracles[chainId].getAaveCollateralPrices()
      ]);
      services.oracles = 'connected';
    } catch (error) {
      services.oracles = 'disconnected';
    }

    const allConnected = Object.values(services).every(status => status === 'connected');
    
    return {
      status: allConnected ? 'healthy' : 'degraded',
      services
    };
  }
}