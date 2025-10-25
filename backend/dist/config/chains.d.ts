export interface ChainConfig {
    chainId: string;
    name: string;
    blockscoutUrl: string;
    morphoAddress: string;
    aaveAddresses: string[];
}
export declare const CHAIN_CONFIGS: Record<string, ChainConfig>;
export declare const getChainConfig: (chainId: string | number) => ChainConfig;
//# sourceMappingURL=chains.d.ts.map