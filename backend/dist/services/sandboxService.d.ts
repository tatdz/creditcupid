export interface SimulationType {
    id: string;
    name: string;
    description: string;
    creditScoreRange: [number, number];
    riskFactors: string[];
    recommendations: string[];
}
export interface EnhancedCreditData {
    address: string;
    creditScore: number;
    riskFactors: string[];
    aavePositions: any[];
    morphoPositions: any[];
    protocolInteractions: any[];
    recommendations: any[];
    collateralAnalysis: any;
    creditBenefits: any[];
    walletData: any;
    timestamp: number;
    oracleData: any;
    simulationType: string;
    isSimulated: boolean;
    useRealProtocols: boolean;
    metadata: {
        simulationTimestamp: string;
        simulationDuration: number;
        dataSources: string[];
    };
}
export declare class SandboxService {
    private simulationTypes;
    constructor(rpcUrl: string);
    private initializeSimulationTypes;
    getSimulationTypes(): Promise<SimulationType[]>;
    generateSimulatedCreditData(realAddress: string, simulationType?: string, useRealProtocols?: boolean): Promise<EnhancedCreditData>;
    private applySimulationEnhancement;
    private calculateScoreInRange;
    private createFallbackCreditData;
}
//# sourceMappingURL=sandboxService.d.ts.map