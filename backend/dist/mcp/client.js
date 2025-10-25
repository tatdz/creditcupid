"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditCupidCreditClient = void 0;
// backend/src/mcp/client.ts
const ethers_1 = require("ethers");
const chains_1 = require("../config/chains");
// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const BLOCKSCOUT_API_KEY = process.env.BLOCKSCOUT_API_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
// Enhanced Blockscout Service - JUST DATA FETCHING
class RealBlockscoutService {
    constructor(chainId) {
        this.chainConfig = chains_1.CHAIN_CONFIGS[chainId] || chains_1.CHAIN_CONFIGS['11155111']; // Default to Sepolia
        this.apiKey = BLOCKSCOUT_API_KEY;
    }
    async makeApiRequest(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'CreditCupid/1.0',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error(`Blockscout API request failed: ${error}`);
            throw error;
        }
    }
    async getOnChainData(address) {
        console.log(`📊 [Backend] Fetching raw on-chain data for ${address} on chain ${this.chainConfig.chainId}`);
        try {
            // Fetch transactions
            const transactions = await this.fetchTransactions(address);
            // Analyze for lending interactions
            const lendingInteractions = this.analyzeLendingInteractions(transactions);
            // Calculate basic metrics
            const walletBalance = await this.getWalletBalance(address);
            const totalVolume = this.calculateTotalVolume(transactions);
            const monthsActive = this.calculateMonthsActive(transactions);
            const onChainData = {
                address,
                transactions,
                lendingInteractions,
                walletBalance,
                totalVolume,
                monthsActive,
                timestamp: Math.floor(Date.now() / 1000)
            };
            console.log(`✅ [Backend] Raw data fetched:`, {
                transactions: transactions.length,
                lendingInteractions: lendingInteractions.length,
                walletBalance,
                totalVolume,
                monthsActive
            });
            return onChainData;
        }
        catch (error) {
            console.error('❌ [Backend] Failed to fetch on-chain data:', error);
            // Return empty data structure
            return {
                address,
                transactions: [],
                lendingInteractions: [],
                walletBalance: 0,
                totalVolume: 0,
                monthsActive: 0,
                timestamp: Math.floor(Date.now() / 1000)
            };
        }
    }
    async fetchTransactions(address) {
        let url = `${this.chainConfig.blockscoutUrl}/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=100`;
        if (this.apiKey) {
            url += `&apikey=${this.apiKey}`;
        }
        const data = await this.makeApiRequest(url);
        if (data.status === '1' && data.result) {
            return data.result.map((tx) => ({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                timestamp: parseInt(tx.timeStamp),
                status: tx.isError === '0' ? 'success' : 'failed',
            }));
        }
        else {
            throw new Error(`Blockscout API error: ${data.message || 'Unknown error'}`);
        }
    }
    analyzeLendingInteractions(transactions) {
        const interactions = [];
        transactions.forEach(tx => {
            // Check for Morpho interactions
            if (this.chainConfig.morphoAddress !== '0x0000000000000000000000000000000000000000' &&
                tx.to?.toLowerCase() === this.chainConfig.morphoAddress.toLowerCase()) {
                const interaction = this.parseMorphoInteraction(tx);
                if (interaction) {
                    interactions.push(interaction);
                }
            }
            // Check for Aave interactions
            if (this.chainConfig.aaveAddresses && this.chainConfig.aaveAddresses.length > 0) {
                const aaveAddress = this.chainConfig.aaveAddresses.find((addr) => tx.to?.toLowerCase() === addr.toLowerCase());
                if (aaveAddress) {
                    const interaction = this.parseAaveInteraction(tx, aaveAddress);
                    if (interaction) {
                        interactions.push(interaction);
                    }
                }
            }
        });
        return interactions;
    }
    parseMorphoInteraction(tx) {
        // Simplified - in reality you'd parse function calls
        return {
            hash: tx.hash,
            protocol: 'Morpho',
            type: 'supply', // This would be determined by function parsing
            amount: tx.value,
            timestamp: tx.timestamp,
            asset: 'ETH', // This would be determined by token analysis
            success: tx.status === 'success'
        };
    }
    parseAaveInteraction(tx, aaveAddress) {
        // Simplified - in reality you'd parse function calls
        return {
            hash: tx.hash,
            protocol: 'Aave',
            type: 'supply', // This would be determined by function parsing
            amount: tx.value,
            timestamp: tx.timestamp,
            asset: 'ETH', // This would be determined by token analysis
            success: tx.status === 'success'
        };
    }
    async getWalletBalance(address) {
        try {
            // Use the RPC URL from chain config
            const rpcUrl = this.chainConfig.rpcUrl;
            if (!rpcUrl) {
                console.warn('No RPC URL configured for chain', this.chainConfig.chainId);
                return 0;
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const balance = await provider.getBalance(address);
            return parseFloat(ethers_1.ethers.formatEther(balance));
        }
        catch (error) {
            console.error('Error getting wallet balance:', error);
            return 0;
        }
    }
    calculateTotalVolume(transactions) {
        return transactions.reduce((sum, tx) => {
            return sum + parseFloat(ethers_1.ethers.formatEther(tx.value || '0'));
        }, 0);
    }
    calculateMonthsActive(transactions) {
        if (transactions.length === 0)
            return 0;
        const timestamps = transactions.map(tx => tx.timestamp).filter(ts => ts > 0);
        if (timestamps.length === 0)
            return 0;
        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);
        const monthsDiff = (newest - oldest) / (30 * 24 * 60 * 60);
        return Math.max(1, Math.ceil(monthsDiff));
    }
}
// Main client export - SIMPLIFIED
class CreditCupidCreditClient {
    constructor(rpcUrls) {
        // Accept but don't use rpcUrls parameter to maintain compatibility
        console.log('🔗 [Backend] CreditCupidCreditClient initialized');
    }
    async getOnChainData(address, chainId = 11155111) {
        console.log(`🔗 [Backend] Getting on-chain data for ${address} on chain ${chainId}`);
        try {
            const blockscoutService = new RealBlockscoutService(chainId.toString());
            return await blockscoutService.getOnChainData(address);
        }
        catch (error) {
            console.error(`❌ [Backend] Failed to get on-chain data:`, error);
            // Return empty data structure
            return {
                address,
                transactions: [],
                lendingInteractions: [],
                walletBalance: 0,
                totalVolume: 0,
                monthsActive: 0,
                timestamp: Math.floor(Date.now() / 1000)
            };
        }
    }
    // Health check
    async healthCheck(chainId = 11155111) {
        try {
            const blockscoutService = new RealBlockscoutService(chainId.toString());
            await blockscoutService.getOnChainData('0x0000000000000000000000000000000000000000');
            return { status: 'healthy' };
        }
        catch (error) {
            return { status: 'unhealthy' };
        }
    }
}
exports.CreditCupidCreditClient = CreditCupidCreditClient;
//# sourceMappingURL=client.js.map