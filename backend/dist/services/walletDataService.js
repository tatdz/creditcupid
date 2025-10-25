"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletDataService = void 0;
const ethers_1 = require("ethers");
class WalletDataService {
    constructor(rpcUrl) {
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    }
    async getWalletData(address) {
        console.log(`💰 Fetching wallet data for: ${address}`);
        try {
            // Get native balance
            const nativeBalance = await this.provider.getBalance(address);
            const nativeBalanceETH = ethers_1.ethers.formatEther(nativeBalance);
            // Mock token balances (in real implementation, this would scan for tokens)
            const tokenBalances = [
                {
                    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    name: 'Wrapped Ethereum',
                    symbol: 'WETH',
                    balance: '0.5',
                    valueUSD: '1750.00'
                },
                {
                    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                    name: 'USD Coin',
                    symbol: 'USDC',
                    balance: '1000.00',
                    valueUSD: '1000.00'
                },
                {
                    contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                    name: 'Uniswap',
                    symbol: 'UNI',
                    balance: '10.00',
                    valueUSD: '100.00'
                }
            ];
            // Calculate total value
            const totalValueUSD = tokenBalances.reduce((total, token) => {
                return total + parseFloat(token.valueUSD);
            }, parseFloat(nativeBalanceETH) * 3500).toFixed(2);
            return {
                nativeBalance: nativeBalanceETH,
                tokenBalances,
                totalValueUSD
            };
        }
        catch (error) {
            console.error('Error fetching wallet data:', error);
            throw error;
        }
    }
}
exports.WalletDataService = WalletDataService;
//# sourceMappingURL=walletDataService.js.map