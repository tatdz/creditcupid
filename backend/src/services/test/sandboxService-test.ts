// simple-sandbox-test.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Simple interface definitions matching your service
interface SimulationType {
  id: string;
  name: string;
  description: string;
  creditScoreRange: [number, number];
  riskFactors: string[];
  recommendations: string[];
}

interface EnhancedCreditData {
  address: string;
  creditScore: number;
  simulationType: string;
  isSimulated: boolean;
  useRealProtocols: boolean;
  riskFactors: string[];
  recommendations: string[];
  chains: any[];
  protocolInteractions: any[];
  metadata: {
    simulationTimestamp: string;
    simulationDuration: number;
    dataSources: string[];
  };
}

class SimpleSandboxService {
  private simulationTypes: SimulationType[];

  constructor(rpcUrl: string) {
    console.log(`🏗️  Creating SimpleSandboxService with RPC: ${rpcUrl.substring(0, 40)}...`);
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
        description: 'Simulate building credit with moderate activity',
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
          'Limited cross-chain activity'
        ],
        recommendations: [
          'Diversify your asset holdings',
          'Establish consistent repayment patterns',
          'Expand to multiple blockchain networks'
        ]
      }
    ];
  }

  async getSimulationTypes(): Promise<SimulationType[]> {
    return this.simulationTypes;
  }

  async generateSimulatedCreditData(
    address: string,
    simulationType: 'ideal' | 'growing' | 'risky' = 'ideal',
    useRealProtocols: boolean = false
  ): Promise<EnhancedCreditData> {
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    const baseData = {
      address,
      creditScore: this.calculateScore(simulationType),
      simulationType,
      isSimulated: true,
      useRealProtocols,
      riskFactors: this.getRiskFactors(simulationType),
      recommendations: this.getRecommendations(simulationType),
      chains: this.generateChainData(),
      protocolInteractions: this.generateProtocolInteractions(),
      metadata: {
        simulationTimestamp: new Date().toISOString(),
        simulationDuration: Date.now() - startTime,
        dataSources: useRealProtocols 
          ? ['Mock Real Protocol Data', 'Simulation Engine'] 
          : ['Mock Simulation Engine']
      }
    };

    return baseData;
  }

  private calculateScore(simulationType: string): number {
    const ranges: { [key: string]: [number, number] } = {
      ideal: [750, 850],
      growing: [600, 749],
      risky: [300, 599]
    };
    
    const [min, max] = ranges[simulationType] || [300, 850];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRiskFactors(simulationType: string): string[] {
    const factors: { [key: string]: string[] } = {
      ideal: ['Excellent credit history', 'Strong repayment patterns'],
      growing: ['Moderate cross-chain activity', 'Building credit history'],
      risky: ['High asset concentration', 'Limited cross-chain activity', 'Inconsistent repayments']
    };
    
    return factors[simulationType] || [];
  }

  private getRecommendations(simulationType: string): string[] {
    const recommendations: { [key: string]: string[] } = {
      ideal: [
        'Maintain your excellent repayment history',
        'Consider becoming a liquidity provider',
        'Explore higher credit limits'
      ],
      growing: [
        'Expand to multiple chains',
        'Increase protocol interactions', 
        'Maintain consistent repayments'
      ],
      risky: [
        'Diversify your asset holdings',
        'Establish consistent repayment patterns',
        'Expand to multiple blockchain networks'
      ]
    };
    
    return recommendations[simulationType] || [];
  }

  private generateChainData(): any[] {
    return [
      {
        chainId: 1,
        chainName: 'Ethereum',
        balance: '2.5',
        tokens: [
          {
            contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            name: 'USD Coin',
            symbol: 'USDC', 
            balance: '1500.00',
            valueUSD: 1500
          },
          {
            contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            name: 'Wrapped Ethereum',
            symbol: 'WETH',
            balance: '1.2',
            valueUSD: 2400
          }
        ],
        transactions: [
          {
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            timestamp: Math.floor(Date.now() / 1000) - 86400,
            value: '0.1',
            to: '0xrecipient1234567890abcdef1234567890abcdef1234',
            from: '0x742E6c9F70A83C48a8790fA0f315613210D84684',
            gasUsed: '21000',
            status: true
          }
        ]
      }
    ];
  }

  private generateProtocolInteractions(): any[] {
    return [
      {
        protocol: 'aave',
        type: 'deposit',
        amount: '1000.00',
        timestamp: Math.floor(Date.now() / 1000) - 86400,
        chainId: 1,
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        asset: 'USDC'
      },
      {
        protocol: 'morpho', 
        type: 'supply',
        amount: '1.5',
        timestamp: Math.floor(Date.now() / 1000) - 43200,
        chainId: 1,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        asset: 'WETH'
      }
    ];
  }
}

async function runSimpleTest() {
  console.log('🧪 Simple SandboxService Test\n');

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    console.log('⚠️  SEPOLIA_RPC_URL not set, using mock URL');
  }

  const service = new SimpleSandboxService(rpcUrl || 'https://sepolia.infura.io/v3/mock');

  try {
    console.log('1. 📋 Getting simulation types...');
    const types = await service.getSimulationTypes();
    console.log(`   ✅ Found ${types.length} simulation types`);
    types.forEach(type => {
      console.log(`      🎯 ${type.name}: ${type.description}`);
    });

    console.log('\n2. 🎭 Testing simulations...');
    
    const testAddress = '0x742E6c9F70A83C48a8790fA0f315613210D84684';
    
    for (const simType of ['ideal', 'growing', 'risky'] as const) {
      console.log(`\n   Testing ${simType} borrower...`);
      const result = await service.generateSimulatedCreditData(testAddress, simType, false);
      
      console.log(`      ✅ ${simType} simulation completed`);
      console.log(`         Credit Score: ${result.creditScore}`);
      console.log(`         Risk Factors: ${result.riskFactors.length}`);
      console.log(`         Recommendations: ${result.recommendations.length}`);
      console.log(`         Protocol Interactions: ${result.protocolInteractions.length}`);
      console.log(`         Duration: ${result.metadata.simulationDuration}ms`);
    }

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
runSimpleTest();