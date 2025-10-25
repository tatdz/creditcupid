"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxService = void 0;
class SandboxService {
    constructor(rpcUrl) {
        // Remove DarmaCreditClient dependency from constructor
        this.simulationTypes = this.initializeSimulationTypes();
    }
    initializeSimulationTypes() {
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
    async getSimulationTypes() {
        return this.simulationTypes;
    }
    async generateSimulatedCreditData(realAddress, simulationType = 'ideal', useRealProtocols = false) {
        const startTime = Date.now();
        try {
            // Create DarmaCreditClient on demand to avoid circular dependency
            const { DarmaCreditClient } = require('../mcp/client');
            const rpcUrls = { 1: 'https://eth.blockscout.com/rpc' }; // Default RPC
            const client = new DarmaCreditClient(rpcUrls);
            // Get real data as base
            const realData = await client.getCreditData(realAddress, 1);
            // Apply simulation enhancements
            let enhancedData = this.applySimulationEnhancement(realData, simulationType);
            const simulationDuration = Date.now() - startTime;
            return {
                ...enhancedData,
                simulationType,
                isSimulated: simulationType !== 'real',
                useRealProtocols,
                metadata: {
                    simulationTimestamp: new Date().toISOString(),
                    simulationDuration,
                    dataSources: ['DarmaCreditClient', 'Simulation Engine']
                }
            };
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error generating simulated credit data:', error.message);
                // Return fallback data instead of throwing
                return this.createFallbackCreditData(realAddress, simulationType);
            }
            else {
                console.error('Error generating simulated credit data: Unknown error');
                return this.createFallbackCreditData(realAddress, simulationType);
            }
        }
    }
    applySimulationEnhancement(data, simulationType) {
        const config = this.simulationTypes.find(st => st.id === simulationType);
        if (!config || simulationType === 'real') {
            return data;
        }
        const enhancedData = { ...data };
        switch (simulationType) {
            case 'ideal':
                enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
                enhancedData.riskFactors = enhancedData.riskFactors.filter((f) => !f.includes('High') && !f.includes('concentration') && !f.includes('gas'));
                enhancedData.recommendations = [
                    ...config.recommendations.map((msg) => ({ message: msg, priority: 'low' })),
                    { message: 'Maintain excellent cross-chain presence', priority: 'low' },
                    { message: 'Continue diverse asset allocation', priority: 'low' }
                ];
                break;
            case 'growing':
                enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
                enhancedData.riskFactors = [
                    ...config.riskFactors,
                    ...enhancedData.riskFactors.filter((f) => !f.includes('High'))
                ];
                enhancedData.recommendations = [
                    ...config.recommendations.map((msg) => ({ message: msg, priority: 'medium' })),
                    { message: 'Focus on consistent repayment patterns', priority: 'medium' },
                    { message: 'Gradually expand protocol usage', priority: 'medium' }
                ];
                break;
            case 'risky':
                enhancedData.creditScore = this.calculateScoreInRange(config.creditScoreRange);
                enhancedData.riskFactors = [
                    ...config.riskFactors,
                    'Simulated: High concentration in single asset',
                    'Simulated: Inconsistent repayment history',
                    'Simulated: Limited cross-chain diversification'
                ];
                enhancedData.recommendations = [
                    ...config.recommendations.map((msg) => ({ message: msg, priority: 'high' })),
                    { message: 'Start with over-collateralized positions', priority: 'high' },
                    { message: 'Build consistent on-chain history', priority: 'high' }
                ];
                break;
            default:
                break;
        }
        return enhancedData;
    }
    calculateScoreInRange(range) {
        const [min, max] = range;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    createFallbackCreditData(address, simulationType) {
        const baseScore = simulationType === 'ideal' ? 800 :
            simulationType === 'growing' ? 650 :
                simulationType === 'risky' ? 450 : 600;
        return {
            address,
            creditScore: baseScore,
            riskFactors: ['Simulation data used due to service unavailability'],
            aavePositions: [],
            morphoPositions: [],
            protocolInteractions: [],
            recommendations: [{ message: 'Service temporarily unavailable - using simulation data', priority: 'high' }],
            collateralAnalysis: {
                currentCollateralValue: '1000.00',
                enhancedCollateralValue: '1150.00',
                collateralBoost: 0.15,
                assets: []
            },
            creditBenefits: [],
            walletData: {
                nativeBalance: '0.5',
                tokenBalances: [],
                totalValueUSD: '500.00',
                activity: {
                    transactions: [],
                    tokenTransfers: [],
                    internalTransactions: [],
                    nftTransfers: [],
                    protocolInteractions: []
                }
            },
            timestamp: Math.floor(Date.now() / 1000),
            oracleData: {
                morphoPrices: {},
                aavePrices: {},
                chainId: 1
            },
            simulationType,
            isSimulated: true,
            useRealProtocols: false,
            metadata: {
                simulationTimestamp: new Date().toISOString(),
                simulationDuration: 0,
                dataSources: ['Fallback Simulation']
            }
        };
    }
}
exports.SandboxService = SandboxService;
//# sourceMappingURL=sandboxService.js.map