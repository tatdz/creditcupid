"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ethers_1 = require("ethers");
const client_1 = require("./mcp/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Debug: Check if Pinata env vars are loaded
console.log('🔧 Environment Check:');
console.log('   PINATA_JWT:', process.env.PINATA_JWT ? '✅ Loaded' : '❌ Missing');
console.log('   PINATA_API_KEY:', process.env.PINATA_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('   PINATA_API_SECRET:', process.env.PINATA_API_SECRET ? '✅ Loaded' : '❌ Missing');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Enhanced RPC configuration with reliable endpoints
const rpcUrls = {
    1: process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com',
    137: process.env.POLYGON_RPC || 'https://polygon.llamarpc.com',
    42161: process.env.ARBITRUM_RPC || 'https://arbitrum.llamarpc.com',
    10: process.env.OPTIMISM_RPC || 'https://optimism.llamarpc.com',
    8453: process.env.BASE_RPC || 'https://base.llamarpc.com',
    11155111: process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
};
// Updated fallback URLs with working endpoints
const fallbackRpcUrls = {
    1: ['https://rpc.ankr.com/eth', 'https://cloudflare-eth.com'],
    137: ['https://rpc.ankr.com/polygon', 'https://polygon-rpc.com'],
    42161: ['https://rpc.ankr.com/arbitrum', 'https://arb1.arbitrum.io/rpc'],
    10: ['https://rpc.ankr.com/optimism', 'https://mainnet.optimism.io'],
    8453: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'],
    11155111: [
        'https://sepolia.drpc.org',
        'https://rpc2.sepolia.org',
        'https://1rpc.io/sepolia',
        'https://gateway.tenderly.co/public/sepolia'
    ],
};
console.log('🔗 Initializing Credit Cupid Client with RPC endpoints:');
Object.entries(rpcUrls).forEach(([chainId, url]) => {
    console.log(`  Chain ${chainId}:`);
    console.log(`    1. ${url}`);
    const fallbacks = fallbackRpcUrls[parseInt(chainId)] || [];
    fallbacks.forEach((fallbackUrl, index) => {
        console.log(`    ${index + 2}. ${fallbackUrl}`);
    });
});
const creditClient = new client_1.CreditCupidCreditClient();
// Add this debug endpoint to see what environment variables are actually loaded
app.get('/api/debug-env', (req, res) => {
    res.json({
        PINATA_JWT: process.env.PINATA_JWT ? '✅ Loaded (length: ' + process.env.PINATA_JWT.length + ')' : '❌ Missing',
        PINATA_API_KEY: process.env.PINATA_API_KEY ? '✅ Loaded (length: ' + process.env.PINATA_API_KEY.length + ')' : '❌ Missing',
        PINATA_API_SECRET: process.env.PINATA_API_SECRET ? '✅ Loaded (length: ' + process.env.PINATA_API_SECRET.length + ')' : '❌ Missing',
        NODE_ENV: process.env.NODE_ENV || 'development',
        backendPort: process.env.PORT || 3001,
        allEnvVars: Object.keys(process.env).filter(key => key.includes('PINATA'))
    });
});
// Helper function to get primary RPC URL
const getRpcUrl = (chainId) => {
    return rpcUrls[chainId] || '';
};
// Helper function to get all RPC URLs for a chain
const getAllRpcUrls = (chainId) => {
    const primary = rpcUrls[chainId];
    const fallbacks = fallbackRpcUrls[chainId] || [];
    return [primary, ...fallbacks].filter(url => url !== '');
};
// Enhanced helper function to get a working RPC provider with timeouts
const getWorkingProvider = async (chainId) => {
    const urls = getAllRpcUrls(chainId);
    console.log(`🔍 Testing ${urls.length} RPC endpoints for chain ${chainId}`);
    for (const url of urls) {
        try {
            const provider = new ethers_1.ethers.JsonRpcProvider(url, chainId, {
                staticNetwork: true
            });
            // Add timeout for the connection test
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`RPC timeout: ${url}`)), 3000));
            // Test the connection with timeout
            const blockNumber = await Promise.race([
                provider.getBlockNumber(),
                timeoutPromise
            ]);
            console.log(`✅ Connected to ${url} (block: ${blockNumber})`);
            return provider;
        }
        catch (error) {
            const errorMessage = getErrorMessage(error);
            console.log(`❌ Failed to connect to ${url}:`, errorMessage);
            continue;
        }
    }
    console.log(`❌ All ${urls.length} RPC URLs failed for chain ${chainId}`);
    return null;
};
// Enhanced rate limiting
const requestCounts = new Map();
const globalRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 50;
const MAX_GLOBAL_REQUESTS_PER_WINDOW = 1000;
// Clean up old request data periodically
setInterval(() => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    for (const [ip, requests] of requestCounts.entries()) {
        const filtered = requests.filter((timestamp) => timestamp > windowStart);
        if (filtered.length === 0) {
            requestCounts.delete(ip);
        }
        else {
            requestCounts.set(ip, filtered);
        }
    }
    for (const [endpoint, requests] of globalRequestCounts.entries()) {
        const filtered = requests.filter((timestamp) => timestamp > windowStart);
        if (filtered.length === 0) {
            globalRequestCounts.delete(endpoint);
        }
        else {
            globalRequestCounts.set(endpoint, filtered);
        }
    }
}, 30000);
app.use((req, res, next) => {
    const now = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress;
    const endpoint = req.path;
    if (!requestCounts.has(clientIp)) {
        requestCounts.set(clientIp, []);
    }
    const ipRequests = requestCounts.get(clientIp);
    const windowStart = now - RATE_LIMIT_WINDOW;
    while (ipRequests.length > 0 && ipRequests[0] < windowStart) {
        ipRequests.shift();
    }
    if (ipRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests from your IP, please try again later',
            retryAfter: Math.ceil((ipRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
        });
    }
    if (!globalRequestCounts.has(endpoint)) {
        globalRequestCounts.set(endpoint, []);
    }
    const globalRequests = globalRequestCounts.get(endpoint);
    while (globalRequests.length > 0 && globalRequests[0] < windowStart) {
        globalRequests.shift();
    }
    if (globalRequests.length >= MAX_GLOBAL_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            error: 'Service temporarily unavailable',
            message: 'This endpoint is experiencing high traffic, please try again later',
            retryAfter: Math.ceil((globalRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
        });
    }
    ipRequests.push(now);
    globalRequests.push(now);
    next();
});
// NEW PINATA API ENDPOINTS
// Pinata status endpoint
app.get('/api/status', async (req, res) => {
    try {
        const pinataConfigured = !!(process.env.PINATA_JWT && process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET);
        // Test Pinata connectivity if configured
        let pinataTest = false;
        if (pinataConfigured) {
            try {
                const testResponse = await fetch('https://api.pinata.cloud/data/testAuthentication', {
                    headers: {
                        'Authorization': `Bearer ${process.env.PINATA_JWT}`
                    }
                });
                pinataTest = testResponse.ok;
            }
            catch (error) {
                console.log('⚠️ Pinata test failed:', getErrorMessage(error));
            }
        }
        res.status(200).json({
            pinata: pinataConfigured && pinataTest,
            pinataConfigured,
            pinataTest,
            message: pinataConfigured && pinataTest
                ? 'Pinata configured and ready'
                : pinataConfigured
                    ? 'Pinata configured but test failed'
                    : 'Pinata not configured - using development mode',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to check backend status',
            details: getErrorMessage(error)
        });
    }
});
// Pinata proxy endpoint for pinning JSON to IPFS
app.post('/api/proxy/pinata/pinning/pinJSONToIPFS', async (req, res) => {
    try {
        const pinataJWT = process.env.PINATA_JWT;
        const pinataAPIKey = process.env.PINATA_API_KEY;
        const pinataAPISecret = process.env.PINATA_API_SECRET;
        if (!pinataJWT || !pinataAPIKey || !pinataAPISecret) {
            return res.status(503).json({
                error: 'Pinata not configured',
                message: 'Please configure Pinata credentials in environment variables',
                details: {
                    PINATA_JWT: !!pinataJWT,
                    PINATA_API_KEY: !!pinataAPIKey,
                    PINATA_API_SECRET: !!pinataAPISecret
                }
            });
        }
        console.log('📤 Proxying Pinata request to IPFS...');
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pinataJWT}`
            },
            body: JSON.stringify(req.body)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Pinata API error:', response.status, errorText);
            throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log('✅ Pinata IPFS upload successful:', data.IpfsHash);
        res.status(200).json(data);
    }
    catch (error) {
        console.error('❌ Pinata proxy error:', error.message);
        res.status(500).json({
            error: 'Failed to pin to IPFS',
            message: error.message,
            fallback: 'Using development mode with mock CIDs'
        });
    }
});
// Enhanced health check endpoint
app.get('/health', async (req, res) => {
    try {
        const { chainId = '11155111' } = req.query;
        const chainIdNum = parseInt(chainId);
        // Check Pinata status
        const pinataConfigured = !!(process.env.PINATA_JWT && process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET);
        let pinataStatus = 'not_configured';
        if (pinataConfigured) {
            try {
                const testResponse = await fetch('https://api.pinata.cloud/data/testAuthentication', {
                    headers: {
                        'Authorization': `Bearer ${process.env.PINATA_JWT}`
                    }
                });
                pinataStatus = testResponse.ok ? 'connected' : 'failed';
            }
            catch (error) {
                pinataStatus = 'error';
            }
        }
        // Quick RPC connectivity check without blocking response
        getWorkingProvider(chainIdNum).then(provider => {
            console.log(`✅ RPC status for chain ${chainIdNum}: ${provider ? 'connected' : 'disconnected'}`);
        }).catch(error => {
            console.log(`❌ RPC check failed for chain ${chainIdNum}:`, error.message);
        });
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            message: 'Credit Cupid backend server is running',
            services: {
                pinata: pinataStatus,
                rpc: 'available',
                blockscout: 'integrated'
            },
            rateLimiting: {
                ipLimit: MAX_REQUESTS_PER_WINDOW,
                windowMs: RATE_LIMIT_WINDOW
            },
            chains: Object.keys(rpcUrls).map(chainId => ({
                chainId: parseInt(chainId),
                rpc: getRpcUrl(parseInt(chainId)),
                status: 'available'
            }))
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: getErrorMessage(error)
        });
    }
});
// NEW ENDPOINT: Get raw on-chain data
app.get('/api/on-chain-data/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { chainId = '11155111' } = req.query;
        const chainIdNum = parseInt(chainId);
        if (!address || !ethers_1.ethers.isAddress(address)) {
            return res.status(400).json({
                error: 'Valid Ethereum address is required',
                details: `Provided: ${address}`
            });
        }
        console.log(`📊 Fetching on-chain data for: ${address} on chain ${chainId}`);
        const onChainData = await creditClient.getOnChainData(address, chainIdNum);
        res.json({
            ...onChainData,
            metadata: {
                chainId: chainIdNum,
                dataSource: 'blockscout',
                timestamp: new Date().toISOString(),
            }
        });
    }
    catch (error) {
        console.error('❌ Error fetching on-chain data:', getErrorMessage(error));
        res.status(500).json({
            error: 'Failed to fetch on-chain data',
            details: getErrorMessage(error)
        });
    }
});
// Keep the existing credit-data endpoint for backward compatibility
app.get('/api/credit-data/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { chainId = '11155111' } = req.query;
        const chainIdNum = parseInt(chainId);
        if (!address || !ethers_1.ethers.isAddress(address)) {
            return res.status(400).json({
                error: 'Valid Ethereum address is required',
                details: `Provided: ${address}`
            });
        }
        console.log(`📊 [Legacy] Fetching credit data for: ${address} on chain ${chainId}`);
        const onChainData = await creditClient.getOnChainData(address, chainIdNum);
        const fallbackScore = generateFallbackCreditScore(address);
        res.json({
            address,
            creditScore: fallbackScore,
            riskFactors: ['Using simplified scoring - upgrade to use frontend calculation'],
            protocolInteractions: onChainData.lendingInteractions,
            walletData: {
                nativeBalance: onChainData.walletBalance.toString(),
                tokenBalances: [],
                totalValueUSD: '0',
                activity: {
                    transactions: onChainData.transactions,
                    tokenTransfers: [],
                    internalTransactions: [],
                    nftTransfers: [],
                    protocolInteractions: onChainData.lendingInteractions,
                    blockscoutSupported: true,
                    lastUpdated: onChainData.timestamp
                }
            },
            transactionAnalysis: {
                totalTransactions: onChainData.transactions.length,
                activeMonths: onChainData.monthsActive,
                transactionVolume: onChainData.totalVolume,
                protocolInteractions: onChainData.lendingInteractions.length,
                avgTxFrequency: onChainData.monthsActive > 0 ?
                    (onChainData.transactions.length / (onChainData.monthsActive * 30)).toFixed(1) + '/day' : '0/day',
                riskScore: 50,
                walletAgeDays: onChainData.monthsActive * 30,
                gasSpentETH: onChainData.transactions.length * 0.001
            },
            timestamp: new Date().toISOString(),
            metadata: {
                note: 'This endpoint is deprecated. Use /api/on-chain-data and calculate scores in frontend',
                dataSource: 'blockscout'
            }
        });
    }
    catch (error) {
        console.error('❌ Error in legacy credit-data endpoint:', getErrorMessage(error));
        const fallbackScore = generateFallbackCreditScore(req.params.address);
        res.status(200).json({
            fallbackUsed: true,
            creditScore: fallbackScore,
            address: req.params.address,
            chainId: parseInt(req.query.chainId) || 11155111,
            riskLevel: getRiskLevel(fallbackScore),
            recommendation: getRecommendation(fallbackScore),
            timestamp: new Date().toISOString(),
            metadata: {
                dataSource: 'fallback',
                reason: 'unexpected_error',
                error: getErrorMessage(error)
            }
        });
    }
});
// Enhanced wallet info endpoint
app.get('/api/wallet-info/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { chainId = '11155111' } = req.query;
        const chainIdNum = parseInt(chainId);
        if (!address || !ethers_1.ethers.isAddress(address)) {
            return res.status(400).json({
                error: 'Valid Ethereum address is required'
            });
        }
        console.log(`📊 Getting wallet info for: ${address} on chain ${chainId}`);
        const provider = await getWorkingProvider(chainIdNum);
        if (!provider) {
            return res.status(503).json({
                error: 'RPC connectivity issues',
                message: 'Unable to connect to blockchain nodes'
            });
        }
        const balance = await provider.getBalance(address);
        const balanceEth = ethers_1.ethers.formatEther(balance);
        const transactionCount = await provider.getTransactionCount(address);
        res.json({
            address,
            balance: balanceEth,
            balanceWei: balance.toString(),
            transactionCount,
            chainId: chainIdNum,
            isActive: transactionCount > 0,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error fetching wallet info:', getErrorMessage(error));
        res.status(500).json({
            error: 'Failed to fetch wallet info',
            details: getErrorMessage(error)
        });
    }
});
// RPC proxy endpoint for secure RPC calls
app.post('/api/proxy/rpc/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { method, params } = req.body;
        let rpcUrl;
        switch (parseInt(chainId)) {
            case 11155111:
                rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
                break;
            case 1:
                rpcUrl = process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com';
                break;
            case 137:
                rpcUrl = process.env.POLYGON_RPC || 'https://polygon.llamarpc.com';
                break;
            case 42161:
                rpcUrl = process.env.ARBITRUM_RPC || 'https://arbitrum.llamarpc.com';
                break;
            case 10:
                rpcUrl = process.env.OPTIMISM_RPC || 'https://optimism.llamarpc.com';
                break;
            case 8453:
                rpcUrl = process.env.BASE_RPC || 'https://base.llamarpc.com';
                break;
            default:
                rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
        }
        console.log('🔗 Proxying RPC request:', { chainId, method, rpcUrl: rpcUrl.replace(/\/\/(.*)@/, '//***@') });
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method,
                params,
                id: 1
            })
        });
        if (!response.ok) {
            throw new Error(`RPC proxy error: ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error('❌ RPC proxy error:', getErrorMessage(error));
        res.status(500).json({
            error: 'Failed to proxy RPC request',
            details: getErrorMessage(error)
        });
    }
});
// Helper functions
function getChainName(chainId) {
    const names = {
        1: 'Ethereum Mainnet',
        137: 'Polygon Mainnet',
        42161: 'Arbitrum One',
        10: 'Optimism',
        8453: 'Base',
        11155111: 'Sepolia'
    };
    return names[chainId] || `Chain ${chainId}`;
}
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return 'Unknown error occurred';
}
function generateFallbackCreditScore(address) {
    const addressHash = address.toLowerCase().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    const score = 600 + Math.abs(addressHash % 250);
    return Math.min(850, Math.max(300, score));
}
function getRiskLevel(score) {
    if (score >= 800)
        return 'excellent';
    if (score >= 700)
        return 'good';
    if (score >= 600)
        return 'fair';
    if (score >= 500)
        return 'poor';
    return 'very_poor';
}
function getRecommendation(score) {
    if (score >= 800)
        return 'Excellent creditworthiness. You qualify for the best rates.';
    if (score >= 700)
        return 'Good credit profile. Consider maintaining or improving your position.';
    if (score >= 600)
        return 'Fair credit. Work on building your credit history.';
    if (score >= 500)
        return 'Poor credit. Focus on improving your financial position.';
    return 'Very poor credit. Consider seeking financial advice.';
}
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            'GET /health',
            'GET /api/status',
            'GET /api/credit-data/:address',
            'GET /api/on-chain-data/:address',
            'GET /api/wallet-info/:address',
            'POST /api/proxy/pinata/pinning/pinJSONToIPFS',
            'POST /api/proxy/rpc/:chainId'
        ]
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Credit Cupid API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Pinata status: http://localhost:${PORT}/api/status`);
    console.log(`📤 Pinata proxy: POST http://localhost:${PORT}/api/proxy/pinata/pinning/pinJSONToIPFS`);
    console.log(`📊 On-chain data: http://localhost:${PORT}/api/on-chain-data/:address`);
    console.log(`💳 Legacy credit data: http://localhost:${PORT}/api/credit-data/:address`);
    console.log(`👛 Wallet info: http://localhost:${PORT}/api/wallet-info/:address`);
    console.log(`🔗 RPC proxy: POST http://localhost:${PORT}/api/proxy/rpc/:chainId`);
    console.log(`⚡ Rate limiting: ${MAX_REQUESTS_PER_WINDOW} requests per minute per IP`);
});
exports.default = app;
//# sourceMappingURL=server.js.map