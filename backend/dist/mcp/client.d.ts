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
export declare class CreditCupidCreditClient {
    constructor(rpcUrls?: any);
    getOnChainData(address: string, chainId?: number): Promise<OnChainData>;
    healthCheck(chainId?: number): Promise<{
        status: string;
    }>;
}
//# sourceMappingURL=client.d.ts.map