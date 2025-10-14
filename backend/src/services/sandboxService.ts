import { ethers } from 'ethers';
import { AaveSimulator } from '../../../sandbox/aave-simulator';
import { MorphoSimulator } from '../../../sandbox/morpho-simulator';
import {
  BlockscoutMCPClient,
  CrossChainData,
  ProtocolInteraction,
  ChainData,
  TokenBalance,
  Transaction
} from '../mcp/client';
import { AaveTransaction } from '../protocols/aave';
import { MorphoTransaction } from '../protocols/morpho';

function morphoTxTypeToProtocolType(type: string): 'deposit' | 'withdraw' | 'borrow' | 'repay' {
  switch (type) {
    case 'supply':
      return 'deposit';
    case 'withdraw':
      return 'withdraw';
    case 'borrow':
      return 'borrow';
    case 'repay':
      return 'repay';
    default:
      throw new Error(`Invalid morpho transaction type: ${type}`);
  }
}

export interface SimulationType {
  id: string;
  name: string;
  description: string;
  creditScoreRange: [number, number];
  riskFactors: string[];
  recommendations: string[];
}

export interface EnhancedCreditData extends CrossChainData {
  simulationType: string;
  isSimulated: boolean;
  useRealProtocols: boolean;
  metadata: {
    simulationTimestamp: string;
    simulationDuration: number;
    dataSources: string[];
  };
}

export class SandboxService {
  private aaveSimulator: AaveSimulator;
  private morphoSimulator: MorphoSimulator;
  private realInteractor: any;
  private networkRunner: any;
  private mcpClient: BlockscoutMCPClient;
  private simulationTypes: SimulationType[];

  constructor(rpcUrl: string) {
    const privateKey =
      process.env.TEST_WALLET_PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    this.aaveSimulator = new AaveSimulator(rpcUrl, privateKey);
    this.morphoSimulator = new MorphoSimulator(rpcUrl, privateKey);
    
    // Make RealProtocolInteractor optional
    try {
      const { RealProtocolInteractor } = require('../../../sandbox/forked-network-runner');
      this.realInteractor = new RealProtocolInteractor(rpcUrl, privateKey);
      this.networkRunner = new RealProtocolInteractor(rpcUrl, privateKey);
      console.log('✅ RealProtocolInteractor initialized in SandboxService');
    } catch (error) {
      console.warn('⚠️ RealProtocolInteractor not available in SandboxService, using simulation only');
      this.realInteractor = null;
      this.networkRunner = null;
    }
    
    this.mcpClient = new BlockscoutMCPClient({ 11155111: rpcUrl });

    this.simulationTypes = this.initializeSimulationTypes();
  }

  private initializeSimulationTypes(): SimulationType[] {
    return [
      {
        id: 'real',
        name: 'Real Data',
        description: 'Your actual on-chain data without simulation',
        creditScoreRange: [300, 850],
        riskFactors: [],
        recommendations: []
      },
      {
        id: 'ideal',
        name: 'Ideal Borrower',
        description: 'Simulate excellent credit history with strong repayment patterns',
        creditScoreRange: [750, 850],
        riskFactors: [],
        recommendations: [
          'Maintain your excellent repayment history',
          'Consider becoming a liquidity provider',
          'Explore higher credit limits'
        ]
      },
      {
        id: 'growing',
        name: 'Growing Borrower',
        description: 'Simulate building credit with moderate activity and consistent repayments',
        creditScoreRange: [600, 749],
        riskFactors: [
          'Moderate cross-chain activity',
          'Building repayment history'
        ],
        recommendations: [
          'Expand to multiple chains',
          'Increase protocol interactions',
          'Maintain consistent repayments'
        ]
      },
      {
        id: 'risky',
        name: 'Risky Borrower',
        description: 'Simulate credit challenges that need improvement',
        creditScoreRange: [300, 599],
        riskFactors: [
          'High asset concentration',
          'Inconsistent repayment history',
          'Limited cross-chain activity',
          'High gas spending patterns'
        ],
        recommendations: [
          'Diversify your asset holdings',
          'Establish consistent repayment patterns',
          'Expand to multiple blockchain networks',
          'Reduce speculative transaction patterns'
        ]
      }
    ];
  }

  async getSimulationTypes(): Promise<SimulationType[]> {
    return this.simulationTypes;
  }

  async generateSimulatedCreditData(
    realAddress: string,
    simulationType: 'ideal' | 'growing' | 'risky' = 'ideal',
    useRealProtocols: boolean = false
  ): Promise<EnhancedCreditData> {
    const startTime = Date.now();

    try {
      const realData = await this.mcpClient.getCrossChainData(realAddress);

      let simulatedAaveTxs: AaveTransaction[] = [];
      let simulatedMorphoTxs: MorphoTransaction[] = [];

      if (useRealProtocols && this.networkRunner) {
        console.log('🔄 Using real protocol interactions on Sepolia...');
        try {
          const realResults = await this.networkRunner.runCompleteProtocolSimulation();
          simulatedAaveTxs = await this.mapRealToAaveTransactions(realResults.aaveTransactions, realAddress);
          simulatedMorphoTxs = await this.mapRealToMorphoTransactions(realResults.morphoTransactions, realAddress);

          console.log(`✅ Real protocol interactions completed: ${simulatedAaveTxs.length} Aave + ${simulatedMorphoTxs.length} Morpho transactions`);
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('❌ Real interactions failed, falling back to simulation:', error.message);
          } else {
            console.error('❌ Real interactions failed, falling back to simulation: Unknown error');
          }
          simulatedAaveTxs = await this.aaveSimulator.simulateUserActivity(realAddress);
          simulatedMorphoTxs = await this.morphoSimulator.simulateUserActivity(realAddress);
        }
      } else {
        if (useRealProtocols && !this.networkRunner) {
          console.log('⚠️ Real protocols requested but not available, using simulation');
        }
        console.log('🎭 Using simulated protocol data...');
        simulatedAaveTxs = await this.aaveSimulator.simulateUserActivity(realAddress);
        simulatedMorphoTxs = await this.morphoSimulator.simulateUserActivity(realAddress);
      }

      const simulatedInteractions: ProtocolInteraction[] = [
        ...simulatedAaveTxs.map(tx => ({
          protocol: 'aave' as const,
          type: tx.type,
          amount: tx.amount,
          timestamp: tx.timestamp,
          chainId: tx.chainId,
          txHash: tx.txHash,
          asset: tx.asset
        })),
        ...simulatedMorphoTxs.map(tx => ({
          protocol: 'morpho' as const,
          type: morphoTxTypeToProtocolType(tx.type),
          amount: tx.amount,
          timestamp: tx.timestamp,
          chainId: tx.chainId,
          txHash: tx.txHash,
          asset: tx.poolToken
        }))
      ];

      const combinedInteractions: ProtocolInteraction[] = [
        ...(realData.protocolInteractions ?? []),
        ...simulatedInteractions
      ].sort((a, b) => b.timestamp - a.timestamp);

      let enhancedData: CrossChainData = {
        ...realData,
        protocolInteractions: combinedInteractions
      };

      const config = this.simulationTypes.find(st => st.id === simulationType);
      if (config) {
        enhancedData = this.applySimulationEnhancement(enhancedData, config);
      }

      const simulationDuration = Date.now() - startTime;
      return {
        ...enhancedData,
        simulationType,
        isSimulated: true,
        useRealProtocols,
        metadata: {
          simulationTimestamp: new Date().toISOString(),
          simulationDuration,
          dataSources: useRealProtocols && this.networkRunner
            ? ['Blockscout MCP', 'Real Sepolia Transactions', 'Simulation Engine']
            : ['Blockscout MCP', 'Simulation Engine']
        }
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error generating simulated credit data:', error.message);
        throw new Error(`Failed to generate simulated credit data: ${error.message}`);
      } else {
        console.error('Error generating simulated credit data: Unknown error');
        throw new Error('Failed to generate simulated credit data: Unknown error');
      }
    }
  }

  private async mapRealToAaveTransactions(realTxs: any[], address: string): Promise<AaveTransaction[]> {
    return realTxs.map((tx, index) => ({
      type: this.determineAaveTransactionType(tx, index),
      asset: this.getAaveAssetFromTransaction(tx, index),
      amount: this.getAaveAmountFromTransaction(tx, index),
      timestamp: tx.timestamp || Math.floor(Date.now() / 1000) - (realTxs.length - index) * 86400,
      txHash: tx.hash || `0x${Math.random().toString(16).substr(2, 64)}`,
      chainId: 11155111,
      blockNumber: tx.blockNumber || 4000000 + index * 1000
    }));
  }

  private async mapRealToMorphoTransactions(realTxs: any[], address: string): Promise<MorphoTransaction[]> {
    return realTxs.map((tx, index) => ({
      type: this.determineMorphoTransactionType(tx, index),
      poolToken: this.getMorphoPoolTokenFromTransaction(tx, index),
      amount: this.getMorphoAmountFromTransaction(tx, index),
      timestamp: tx.timestamp || Math.floor(Date.now() / 1000) - (realTxs.length - index) * 86400,
      txHash: tx.hash || `0x${Math.random().toString(16).substr(2, 64)}`,
      chainId: 11155111,
      blockNumber: tx.blockNumber || 4000000 + index * 1000
    }));
  }

  private determineAaveTransactionType(tx: any, index: number): 'deposit' | 'withdraw' | 'borrow' | 'repay' {
    const types: Array<'deposit' | 'withdraw' | 'borrow' | 'repay'> = ['deposit', 'borrow', 'repay', 'withdraw'];
    return types[index % types.length];
  }

  private determineMorphoTransactionType(tx: any, index: number): 'supply' | 'withdraw' | 'borrow' | 'repay' {
    const types: Array<'supply' | 'withdraw' | 'borrow' | 'repay'> = ['supply', 'withdraw', 'borrow', 'repay'];
    return types[index % types.length];
  }

  private getAaveAssetFromTransaction(tx: any, index: number): string {
    const assets = ['USDC', 'DAI', 'WETH', 'USDT'];
    return assets[index % assets.length];
  }

  private getMorphoPoolTokenFromTransaction(tx: any, index: number): string {
    const assets = ['WETH', 'USDC', 'DAI', 'WBTC'];
    return assets[index % assets.length];
  }

  private getAaveAmountFromTransaction(tx: any, index: number): string {
    const amounts = ['1000.00', '500.00', '200.00', '750.00', '300.00'];
    return amounts[index % amounts.length];
  }

  private getMorphoAmountFromTransaction(tx: any, index: number): string {
    const amounts = ['2.00', '1000.00', '500.00', '1.50', '750.00'];
    return amounts[index % amounts.length];
  }

  private applySimulationEnhancement(data: CrossChainData, config: SimulationType): CrossChainData {
    const enhancedData = { ...data };

    switch (config.id) {
      case 'ideal':
        enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
        enhancedData.riskFactors = enhancedData.riskFactors.filter(f => !f.includes('High') && !f.includes('concentration') && !f.includes('gas'));
        enhancedData.recommendations = [...config.recommendations, 'Maintain excellent cross-chain presence', 'Continue diverse asset allocation'];
        enhancedData.chains = this.enhanceChainsForIdealBorrower(enhancedData.chains);
        break;
      case 'growing':
        enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
        enhancedData.riskFactors = [...config.riskFactors, ...enhancedData.riskFactors.filter(f => !f.includes('High'))];
        enhancedData.recommendations = [...config.recommendations, 'Focus on consistent repayment patterns', 'Gradually expand protocol usage'];
        break;
      case 'risky':
        enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
        enhancedData.riskFactors = [...config.riskFactors, 'Simulated: High concentration in single asset', 'Simulated: Inconsistent repayment history', 'Simulated: Limited cross-chain diversification'];
        enhancedData.recommendations = [...config.recommendations, 'Start with over-collateralized positions', 'Build consistent on-chain history'];
        enhancedData.chains = this.enhanceChainsForRiskyBorrower(enhancedData.chains);
        break;
      default:
        break;
    }

    return enhancedData;
  }

  private calculateScoreInRange(range: [number, number]): number {
    const [min, max] = range;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private enhanceChainsForIdealBorrower(chains: ChainData[]): ChainData[] {
    return chains.map(chain => ({
      ...chain,
      balance: (parseFloat(chain.balance) + 2.5).toString(),
      tokens: this.enhanceTokensForIdealBorrower(chain.tokens),
      transactions: [...chain.transactions, ...this.generateAdditionalTransactions(5)]
    }));
  }

  private enhanceChainsForRiskyBorrower(chains: ChainData[]): ChainData[] {
    if (chains.length === 0) return chains;

    const limitedChains = chains.slice(0, 1);
    return limitedChains.map(chain => ({
      ...chain,
      balance: (parseFloat(chain.balance) * 0.3).toString(),
      tokens: this.enhanceTokensForRiskyBorrower(chain.tokens),
      transactions: chain.transactions.slice(0, 10)
    }));
  }

  private enhanceTokensForIdealBorrower(tokens: TokenBalance[]): TokenBalance[] {
    const additionalTokens: TokenBalance[] = [
      {
        contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        name: 'Uniswap',
        symbol: 'UNI',
        balance: '50.00',
        valueUSD: 500
      },
      {
        contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
        name: 'Chainlink',
        symbol: 'LINK',
        balance: '25.00',
        valueUSD: 375
      }
    ];

    return [...tokens, ...additionalTokens];
  }

  private enhanceTokensForRiskyBorrower(tokens: TokenBalance[]): TokenBalance[] {
    if (tokens.length === 0) return tokens;
    return tokens.map((token, index) => ({
      ...token,
      valueUSD: index === 0 ? token.valueUSD * 3 : token.valueUSD * 0.5
    }));
  }

  private generateAdditionalTransactions(count: number): Transaction[] {
    const transactions: Transaction[] = [];

    for (let i = 0; i < count; i++) {
      transactions.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Math.floor(Date.now() / 1000) - i * 86400,
        value: (Math.random() * 0.1).toFixed(4),
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        gasUsed: (Math.random() * 50000).toFixed(0),
        status: Math.random() > 0.1
      });
    }

    return transactions;
  }
}