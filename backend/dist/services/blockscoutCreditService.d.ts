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
export declare class BlockscoutCreditService {
    private static instance;
    private blockscoutApiKey;
    private etherscanApiKey;
    constructor();
    static getInstance(): BlockscoutCreditService;
    setApiKeys(blockscoutKey: string, etherscanKey: string): void;
    fetchTransactionsBlockscout(address: string, blockscoutUrl: string): Promise<BlockscoutTransaction[]>;
    fetchTransactionsEtherscan(address: string): Promise<BlockscoutTransaction[]>;
    fetchTransactionsBasic(address: string): Promise<BlockscoutTransaction[]>;
    getTransactionHistory(address: string, blockscoutUrl: string): Promise<BlockscoutTransaction[]>;
    fetchTokenTransfers(address: string, transactions: BlockscoutTransaction[], blockscoutUrl: string): Promise<BlockscoutTransaction[]>;
    analyzeTransactions(transactions: BlockscoutTransaction[], chainConfig: any): {
        protocolInteractions: ProtocolInteractionAnalysis[];
        repayments: ProtocolInteractionAnalysis[];
    };
    private parseMorphoInteraction;
    private parseAaveInteraction;
    getTransactionUrl(txHash: string): string;
    getFallbackTransactionUrl(txHash: string): string;
    getAddressUrl(address: string): string;
    getFallbackAddressUrl(address: string): string;
}
export declare const blockscoutCreditService: BlockscoutCreditService;
//# sourceMappingURL=blockscoutCreditService.d.ts.map