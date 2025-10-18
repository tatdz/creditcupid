import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { DarmaCreditClient, RpcUrls } from './mcp/client';


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced RPC configuration with single URLs (not comma-separated)
const rpcUrls: RpcUrls = {
  1: process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com',
  137: process.env.POLYGON_RPC || 'https://polygon.llamarpc.com',
  42161: process.env.ARBITRUM_RPC || 'https://arbitrum.llamarpc.com',
  10: process.env.OPTIMISM_RPC || 'https://optimism.llamarpc.com',
  8453: process.env.BASE_RPC || 'https://base.llamarpc.com',
  11155111: process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
};

// Fallback URLs for retry logic (separate from primary URLs)
const fallbackRpcUrls: { [key: number]: string[] } = {
  1: ['https://rpc.ankr.com/eth', 'https://cloudflare-eth.com'],
  137: ['https://rpc.ankr.com/polygon', 'https://polygon-rpc.com'],
  42161: ['https://rpc.ankr.com/arbitrum', 'https://arb1.arbitrum.io/rpc'],
  10: ['https://rpc.ankr.com/optimism', 'https://mainnet.optimism.io'],
  8453: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'],
  11155111: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
};

console.log('🔗 Initializing Darma Credit Client with RPC endpoints:');
Object.entries(rpcUrls).forEach(([chainId, url]) => {
  console.log(`  Chain ${chainId}:`);
  console.log(`    1. ${url}`);
  const fallbacks = fallbackRpcUrls[parseInt(chainId)] || [];
  fallbacks.forEach((fallbackUrl, index) => {
    console.log(`    ${index + 2}. ${fallbackUrl}`);
  });
});

const creditClient = new DarmaCreditClient(rpcUrls);

// Helper function to get primary RPC URL
const getRpcUrl = (chainId: number): string => {
  return rpcUrls[chainId] || '';
};

// Helper function to get all RPC URLs for a chain (for status checking)
const getAllRpcUrls = (chainId: number): string[] => {
  const primary = rpcUrls[chainId];
  const fallbacks = fallbackRpcUrls[chainId] || [];
  return [primary, ...fallbacks].filter(url => url !== '');
};

// Helper function to get a working RPC provider with fallbacks
const getWorkingProvider = async (chainId: number): Promise<ethers.JsonRpcProvider | null> => {
  const urls = getAllRpcUrls(chainId);
  
  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      // Test the connection
      await provider.getBlockNumber();
      console.log(`✅ Connected to ${url}`);
      return provider;
    } catch (error) {
      // Safely handle the unknown error type
      const errorMessage = getErrorMessage(error);
      console.log(`❌ Failed to connect to ${url}:`, errorMessage);
      continue;
    }
  }
  
  console.log(`❌ All RPC URLs failed for chain ${chainId}`);
  return null;
};

// Rate limiting middleware
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const now = Date.now();
  const clientIp = req.ip || (req.connection as any).remoteAddress;
  
  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, []);
  }
  
  const requests = requestCounts.get(clientIp);
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Remove old requests outside the current window
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }
  
  // Check if rate limit exceeded
  if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil((requests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }
  
  // Add current request
  requests.push(now);
  next();
});

// Health check endpoint with RPC status
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const { chainId = '1' } = req.query;
    const chainIdNum = parseInt(chainId as string);
    
    // Test RPC connectivity
    const provider = await getWorkingProvider(chainIdNum);
    const rpcStatus = provider ? 'connected' : 'disconnected';
    
    const health = await creditClient.healthCheck(chainIdNum);
    
    res.json({ 
      status: health.status,
      rpcStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: health.services,
      chains: Object.keys(rpcUrls).map(chainId => ({
        chainId: parseInt(chainId),
        rpc: getRpcUrl(parseInt(chainId)),
        status: 'available'
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: getErrorMessage(error)
    });
  }
});

// Get credit data for an address
app.get('/api/credit-data/:address', async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.params;
    const { chainId = '1' } = req.query;
    const chainIdNum = parseInt(chainId as string);

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Valid Ethereum address is required',
        details: `Provided: ${address}`
      });
    }

    console.log(`📊 Fetching credit data for: ${address} on chain ${chainId}`);
    
    // Test RPC connectivity first
    const provider = await getWorkingProvider(chainIdNum);
    if (!provider) {
      console.log('🔄 Using fallback data due to RPC connectivity issues');
      return res.status(503).json({
        error: 'RPC connectivity issues',
        message: 'Unable to connect to blockchain nodes, using fallback data',
        fallbackUsed: true
      });
    }
    
    const creditData = await creditClient.getCreditData(address, chainIdNum);
    
    res.json({
      ...creditData,
      metadata: {
        chainId: chainIdNum,
        rpcProvider: getRpcUrl(chainIdNum),
        dataSource: 'real-time',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching credit data:', getErrorMessage(error));
    res.status(500).json({ 
      error: 'Failed to fetch credit data',
      details: getErrorMessage(error),
      fallbackUsed: true
    });
  }
});

// ... rest of your endpoints remain the same, but update getRpcUrl calls to use the new function ...

// Get supported chains
app.get('/api/supported-chains', (req: express.Request, res: express.Response) => {
  const chains = Object.entries(rpcUrls).map(([chainId, url]) => ({
    chainId: parseInt(chainId),
    rpcUrl: url, // Single primary URL
    name: getChainName(parseInt(chainId)),
    nativeCurrency: getNativeCurrency(parseInt(chainId)),
    fallbackUrls: fallbackRpcUrls[parseInt(chainId)] || [] // Separate fallback URLs
  }));

  res.json({
    chains,
    total: chains.length,
    timestamp: new Date().toISOString()
  });
});

// RPC status endpoint
app.get('/api/rpc-status/:chainId', async (req: express.Request, res: express.Response) => {
  try {
    const { chainId } = req.params;
    const chainIdNum = parseInt(chainId);
    
    const urls = getAllRpcUrls(chainIdNum);
    const statusResults: Array<{
      url: string;
      status: string;
      blockNumber?: number;
      latency?: string;
      error?: string;
    }> = [];
    
    for (const url of urls) {
      try {
        const startTime = Date.now();
        const provider = new ethers.JsonRpcProvider(url);
        const blockNumber = await provider.getBlockNumber();
        const latency = `${Date.now() - startTime}ms`;
        
        statusResults.push({
          url,
          status: 'connected',
          blockNumber,
          latency
        });
      } catch (error) {
        statusResults.push({
          url,
          status: 'disconnected',
          error: getErrorMessage(error)
        });
      }
    }
    
    res.json({
      chainId: chainIdNum,
      chainName: getChainName(chainIdNum),
      rpcStatus: statusResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check RPC status',
      details: getErrorMessage(error)
    });
  }
});

// Helper functions
function getChainName(chainId: number): string {
  const names: { [key: number]: string } = {
    1: 'Ethereum Mainnet',
    137: 'Polygon Mainnet',
    42161: 'Arbitrum One',
    10: 'Optimism',
    8453: 'Base',
    11155111: 'Sepolia'
  };
  return names[chainId] || `Chain ${chainId}`;
}

function getNativeCurrency(chainId: number): string {
  const currencies: { [key: number]: string } = {
    1: 'ETH',
    137: 'MATIC',
    42161: 'ETH',
    10: 'ETH',
    8453: 'ETH',
    11155111: 'ETH'
  };
  return currencies[chainId] || 'ETH';
}

// Utility function to safely get error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health',
      'GET /api/credit-data/:address',
      'GET /api/wallet-activity/:address',
      'GET /api/collateral-prices',
      'GET /api/protocol-positions/:address',
      'GET /api/wallet-stats/:address',
      'POST /api/simulate-impact/:address',
      'GET /api/multi-chain-credit/:address',
      'GET /api/supported-chains',
      'GET /api/blockscout/info',
      'GET /api/rpc-status/:chainId'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Darma Credit API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Credit data: http://localhost:${PORT}/api/credit-data/:address`);
  console.log(`📡 Wallet activity: http://localhost:${PORT}/api/wallet-activity/:address`);
  console.log(`💰 Collateral prices: http://localhost:${PORT}/api/collateral-prices`);
  console.log(`🏦 Protocol positions: http://localhost:${PORT}/api/protocol-positions/:address`);
  console.log(`📈 Wallet stats: http://localhost:${PORT}/api/wallet-stats/:address`);
  console.log(`🎯 Credit impact simulation: http://localhost:${PORT}/api/simulate-impact/:address`);
  console.log(`🌐 Multi-chain credit: http://localhost:${PORT}/api/multi-chain-credit/:address`);
  console.log(`🔗 Blockscout SDK: Integrated and ready`);
  console.log(`🔗 RPC Endpoints configured for ${Object.keys(rpcUrls).length} chains`);
});

export default app;