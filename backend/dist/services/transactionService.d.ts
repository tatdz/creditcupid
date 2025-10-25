export interface TransactionStatus {
    isConfirmed: boolean;
    confirmations: number;
    blockNumber: number | null;
    status: 'pending' | 'success' | 'failed';
    error?: string;
}
export declare class TransactionService {
    private static instance;
    constructor();
    static getInstance(): TransactionService;
    checkTransactionStatusBlockscout(txHash: string): Promise<TransactionStatus>;
    checkTransactionStatusEtherscan(txHash: string): Promise<TransactionStatus>;
    checkTransactionStatusRpc(txHash: string): Promise<TransactionStatus>;
    checkTransactionStatusBasic(txHash: string): Promise<TransactionStatus>;
    getTransactionStatus(txHash: string): Promise<TransactionStatus>;
    getTransactionUrl(txHash: string): string;
    getFallbackTransactionUrl(txHash: string): string;
}
export declare const transactionService: TransactionService;
//# sourceMappingURL=transactionService.d.ts.map