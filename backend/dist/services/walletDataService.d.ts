export interface WalletData {
    nativeBalance: string;
    tokenBalances: TokenBalance[];
    totalValueUSD: string;
}
export interface TokenBalance {
    contractAddress: string;
    name: string;
    symbol: string;
    balance: string;
    valueUSD: string;
}
export declare class WalletDataService {
    private provider;
    constructor(rpcUrl: string);
    getWalletData(address: string): Promise<WalletData>;
}
//# sourceMappingURL=walletDataService.d.ts.map