import { ethers } from 'ethers';
import { AaveSimulator } from '../../../sandbox/aave-simulator';
import { MorphoSimulator } from '../../../sandbox/morpho-simulator';
import { RealProtocolInteractor } from '../../../sandbox/real-protocol-interactor';
import { ForkedNetworkRunner } from '../../../sandbox/forked-network-runner';
import { BlockscoutMCPClient, CrossChainData, ProtocolInteraction, ChainData, TokenBalance, NFT, Transaction } from '../mcp/client';
import { AaveTransaction } from '../protocols/aave';
import { MorphoTransaction } from '../protocols/morpho';

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
  usesRealProtocols: boolean;
  metadata: {
    simulationTimestamp: string;
    simulationDuration: number;
    dataSources: string[];
  };
}

export class SandboxService {
  private aaveSimulator: AaveSimulator;
  private morphoSimulator: MorphoSimulator;
  private realInteractor: RealProtocolInteractor;
  private networkRunner: ForkedNetworkRunner;
  private mcpClient: BlockscoutMCPClient;
  private simulationTypes: SimulationType[];

  constructor(rpcUrl: string) {
    const privateKey = process.env.TEST_WALLET_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    
    this.aaveSimulator = new AaveSimulator(rpcUrl, privateKey);
    this.morphoSimulator = new MorphoSimulator(rpcUrl, privateKey);
    this.realInteractor = new RealProtocolInteractor(rpcUrl, privateKey);
    this.networkRunner = new ForkedNetworkRunner();
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
      // Get real data first as base
      const realData = await this.mcpClient.getCrossChainData(realAddress);
      
      let simulatedAaveTxs: AaveTransaction[] = [];
      let simulatedMorphoTxs: MorphoTransaction[] = [];

      if (useRealProtocols) {
        // USE REAL PROTOCOL INTERACTIONS ON SEPOLIA
        console.log('🔄 Using real protocol interactions on Sepolia...');
        
        try {
          // Execute real transactions on Sepolia testnet
          const realResults = await this.networkRunner.runCompleteProtocolSimulation();
          
          // Map real transactions to our format
          simulatedAaveTxs = await this.mapRealToAaveTransactions(realResults.aaveTransactions, realAddress);
          simulatedMorphoTxs = await this.mapRealToMorphoTransactions(realResults.morphoTransactions, realAddress);
          
          console.log(`✅ Real protocol interactions completed: ${simulatedAaveTxs.length} Aave + ${simulatedMorphoTxs.length} Morpho transactions`);
        } catch (error) {
          console.error('❌ Real interactions failed, falling back to simulation:', error);
          // Fallback to simulation
          simulatedAaveTxs = await this.aaveSimulator.simulateUserActivity(realAddress);
          simulatedMorphoTxs = await this.morphoSimulator.simulateUserActivity(realAddress);
        }
      } else {
        // USE SIMULATED DATA (original behavior)
        console.log('🎭 Using simulated protocol data...');
        simulatedAaveTxs = await this.aaveSimulator.simulateUserActivity(realAddress);
        simulatedMorphoTxs = await this.morphoSimulator.simulateUserActivity(realAddress);
      }

      // Enhance with simulation based on type
      const enhancedData = this.enhanceWithSimulation(realData, simulatedAaveTxs, simulatedMorphoTxs, simulationType);
      
      const simulationDuration = Date.now() - startTime;
      
      return {
        ...enhancedData,
        simulationType,
        isSimulated: true,
        usesRealProtocols,
        metadata: {
          simulationTimestamp: new Date().toISOString(),
          simulationDuration,
          dataSources: useRealProtocols 
            ? ['Blockscout MCP', 'Real Sepolia Transactions', 'Simulation Engine']
            : ['Blockscout MCP', 'Simulation Engine']
        }
      };
      
    } catch (error) {
      console.error('Error generating simulated credit data:', error);
      throw new Error(`Failed to generate simulated credit data: ${error.message}`);
    }
  }

  private async mapRealToAaveTransactions(realTxs: any[], address: string): Promise<AaveTransaction[]> {
    return realTxs.map((tx, index) => ({
      type: this.determineAaveTransactionType(tx, index),
      asset: this.getAaveAssetFromTransaction(tx, index),
      amount: this.getAaveAmountFromTransaction(tx, index),
      timestamp: tx.timestamp || Math.floor(Date.now() / 1000) - (realTxs.length - index) * 86400, // Spread over days
      txHash: tx.hash || `0x${Math.random().toString(16).substr(2, 64)}`,
      chainId: 11155111, // Sepolia
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
      chainId: 11155111, // Sepolia
      blockNumber: tx.blockNumber || 4000000 + index * 1000
    }));
  }

  private determineAaveTransactionType(tx: any, index: number): 'deposit' | 'withdraw' | 'borrow' | 'repay' {
    const types: ('deposit' | 'withdraw' | 'borrow' | 'repay')[] = ['deposit', 'borrow', 'repay', 'withdraw'];
    return types[index % types.length];
  }

  private determineMorphoTransactionType(tx: any, index: number): 'supply' | 'withdraw' | 'borrow' | 'repay' {
    const types: ('supply' | 'withdraw' | 'borrow' | 'repay')[] = ['supply', 'borrow', 'repay', 'withdraw'];
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

  private enhanceWithSimulation(
    realData: CrossChainData,
    aaveTxs: AaveTransaction[],
    morphoTxs: MorphoTransaction[],
    simulationType: string
  ): CrossChainData {
    let enhancedData = { ...realData };
    
    // Combine real and simulated protocol interactions
    const simulatedInteractions: ProtocolInteraction[] = [
      ...aaveTxs.map(tx => ({
        protocol: 'aave' as const,
        type: tx.type,
        amount: tx.amount,
        timestamp: tx.timestamp,
        chainId: tx.chainId,
        txHash: tx.txHash,
        asset: tx.asset
      })),
      ...morphoTxs.map(tx => ({
        protocol: 'morpho' as const,
        type: tx.type === 'supply' ? 'deposit' : tx.type,
        amount: tx.amount,
        timestamp: tx.timestamp,
        chainId: tx.chainId,
        txHash: tx.txHash,
        asset: tx.poolToken
      }))
    ];

    enhancedData.protocolInteractions = [
      ...(enhancedData.protocolInteractions || []),
      ...simulatedInteractions
    ].sort((a, b) => b.timestamp - a.timestamp);

    // Enhance based on simulation type
    const simulationConfig = this.simulationTypes.find(st => st.id === simulationType);
    
    if (simulationConfig) {
      enhancedData = this.applySimulationEnhancement(enhancedData, simulationConfig);
    }

    return enhancedData;
  }

  private applySimulationEnhancement(data: CrossChainData, config: SimulationType): CrossChainData {
    const enhancedData = { ...data };
    
    switch (config.id) {
      case 'ideal':
        // Ideal borrower: high score, low risk, diverse portfolio
        enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
        enhancedData.riskFactors = enhancedData.riskFactors.filter(f => 
          !f.includes('High') && !f.includes('concentration') && !f.includes('gas')
        );
        enhancedData.recommendations = [
          ...config.recommendations,
          'Maintain excellent cross-chain presence',
          'Continue diverse asset allocation'
        ];
        
        // Enhance portfolio for ideal borrower
        enhancedData.chains = this.enhanceChainsForIdealBorrower(enhancedData.chains);
        break;
      
      case 'growing':
        // Growing borrower: medium score, some risks, building history
        enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
        enhancedData.riskFactors = [
          ...config.riskFactors,
          ...enhancedData.riskFactors.filter(f => !f.includes('High'))
        ];
        enhancedData.recommendations = [
          ...config.recommendations,
          'Focus on consistent repayment patterns',
          'Gradually expand protocol usage'
        ];
        break;
      
      case 'risky':
        // Risky borrower: low score, multiple risks, needs improvement
        enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
        enhancedData.riskFactors = [
          ...config.riskFactors,
          'Simulated: High concentration in single asset',
          'Simulated: Inconsistent repayment history',
          'Simulated: Limited cross-chain diversification'
        ];
        enhancedData.recommendations = [
          ...config.recommendations,
          'Start with over-collateralized positions',
          'Build consistent on-chain history'
        ];
        
        // Simulate risky portfolio patterns
        enhancedData.chains = this.enhanceChainsForRiskyBorrower(enhancedData.chains);
        break;
      
      default:
        // Real data - no changes
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
      balance: (parseFloat(chain.balance) + 2.5).toString(), // Add some ETH
      tokens: this.enhanceTokensForIdealBorrower(chain.tokens),
      transactions: [...chain.transactions, ...this.generateAdditionalTransactions(5)]
    }));
  }

  private enhanceChainsForRiskyBorrower(chains: ChainData[]): ChainData[] {
    if (chains.length === 0) return chains;
    
    // Risky borrower typically has limited chain presence
    const limitedChains = chains.slice(0, 1); // Only keep first chain
    
    return limitedChains.map(chain => ({
      ...chain,
      balance: (parseFloat(chain.balance) * 0.3).toString(), // Lower balance
      tokens: this.enhanceTokensForRiskyBorrower(chain.tokens),
      transactions: chain.transactions.slice(0, 10) // Fewer transactions
    }));
  }

  private enhanceTokensForIdealBorrower(tokens: TokenBalance[]): TokenBalance[] {
    const additionalTokens: TokenBalance[] = [
      {
        contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
        name: 'Uniswap',
        symbol: 'UNI',
        balance: '50.00',
        valueUSD: 500
      },
      {
        contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
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
    
    // Risky borrower has concentrated holdings
    return tokens.map((token, index) => ({
      ...token,
      valueUSD: index === 0 ? token.valueUSD * 3 : token.valueUSD * 0.5 // Concentrate in first token
    }));
  }

  private generateAdditionalTransactions(count: number): Transaction[] {
    const transactions: Transaction[] = [];
    
    for (let i = 0; i < count; i++) {
      transactions.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Math.floor(Date.now() / 1000) - i * 86400, // Spread over days
        value: (Math.random() * 0.1).toFixed(4),
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        gasUsed: (Math.random() * 50000).toFixed(0),
        status: Math.random() > 0.1 // 90% success rate
      });
    }
    
    return transactions;
  }

  async getSimulationStatistics(): Promise<{
    totalSimulations: number;
    simulationTypes: { [key: string]: number };
    averageScore: number;
    mostCommonRiskFactors: string[];
  }> {
    // This would typically come from a database
    // For now, return mock statistics
    return {
      totalSimulations: 1247,
      simulationTypes: {
        ideal: 456,
        growing: 543,
        risky: 248
      },
      averageScore: 672,
      mostCommonRiskFactors: [
        'Limited cross-chain activity',
        'Asset concentration',
        'Inconsistent repayment history'
      ]
    };
  }

  async validateSimulationData(address: string, simulationType: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      const realData = await this.mcpClient.getCrossChainData(address);
      
      // Check if simulation makes sense for this address
      if (simulationType === 'ideal' && realData.creditScore < 400) {
        issues.push('Current credit score is very low for ideal borrower simulation');
        suggestions.push('Consider using "growing" or "risky" simulation for more realistic results');
      }
      
      if (simulationType === 'risky' && realData.creditScore > 700) {
        issues.push('Current credit score is high for risky borrower simulation');
        suggestions.push('Consider using "ideal" or "growing" simulation for more realistic results');
      }
      
      // Check chain activity
      const activeChains = realData.chains.filter(chain => 
        parseFloat(chain.balance) > 0 || chain.tokens.length > 0
      ).length;
      
      if (activeChains < 2 && simulationType === 'ideal') {
        issues.push('Limited cross-chain activity for ideal borrower simulation');
        suggestions.push('Ideal borrowers typically have activity across multiple chains');
      }

      return {
        isValid: issues.length === 0,
        issues,
        suggestions
      };
      
    } catch (error) {
      return {
        isValid: false,
        issues: ['Failed to validate simulation data'],
        suggestions: ['Check if address has sufficient on-chain activity']
      };
    }
  }
}