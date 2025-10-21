import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { CreditCupidCreditClient, RpcUrls } from './mcp/client';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced RPC configuration with reliable endpoints
const rpcUrls: RpcUrls = {
  1: process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com',
  137: process.env.POLYGON_RPC || 'https://polygon.llamarpc.com',
  42161: process.env.ARBITRUM_RPC || 'https://arbitrum.llamarpc.com',
  10: process.env.OPTIMISM_RPC || 'https://optimism.llamarpc.com',
  8453: process.env.BASE_RPC || 'https://base.llamarpc.com',
  11155111: process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
};

// Updated fallback URLs with working endpoints
const fallbackRpcUrls: { [key: number]: string[] } = {
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

const creditClient = new CreditCupidCreditClient(rpcUrls);

// Helper function to get primary RPC URL
const getRpcUrl = (chainId: number): string => {
  return rpcUrls[chainId] || '';
};

// Helper function to get all RPC URLs for a chain
const getAllRpcUrls = (chainId: number): string[] => {
  const primary = rpcUrls[chainId];
  const fallbacks = fallbackRpcUrls[chainId] || [];
  return [primary, ...fallbacks].filter(url => url !== '');
};

// Enhanced helper function to get a working RPC provider with timeouts
const getWorkingProvider = async (chainId: number): Promise<ethers.JsonRpcProvider | null> => {
  const urls = getAllRpcUrls(chainId);
  
  console.log(`🔍 Testing ${urls.length} RPC endpoints for chain ${chainId}`);
  
  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url, chainId, {
        staticNetwork: true
      });
      
      // Add timeout for the connection test
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`RPC timeout: ${url}`)), 3000)
      );
      
      // Test the connection with timeout
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        timeoutPromise
      ]);
      
      console.log(`✅ Connected to ${url} (block: ${blockNumber})`);
      return provider;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.log(`❌ Failed to connect to ${url}:`, errorMessage);
      continue;
    }
  }
  
  console.log(`❌ All ${urls.length} RPC URLs failed for chain ${chainId}`);
  return null;
};

// Enhanced rate limiting with IP-based and global limits
const requestCounts = new Map();
const globalRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50; // Reduced from 100
const MAX_GLOBAL_REQUESTS_PER_WINDOW = 1000; // Global limit

// Clean up old request data periodically
setInterval(() => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean IP-based counts
  for (const [ip, requests] of requestCounts.entries()) {
    const filtered = requests.filter((timestamp: number) => timestamp > windowStart);
    if (filtered.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, filtered);
    }
  }
  
  // Clean global counts
  for (const [endpoint, requests] of globalRequestCounts.entries()) {
    const filtered = requests.filter((timestamp: number) => timestamp > windowStart);
    if (filtered.length === 0) {
      globalRequestCounts.delete(endpoint);
    } else {
      globalRequestCounts.set(endpoint, filtered);
    }
  }
}, 30000); // Clean every 30 seconds

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const now = Date.now();
  const clientIp = req.ip || (req.connection as any).remoteAddress;
  const endpoint = req.path;
  
  // IP-based rate limiting
  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, []);
  }
  
  const ipRequests = requestCounts.get(clientIp);
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Remove old requests outside the current window
  while (ipRequests.length > 0 && ipRequests[0] < windowStart) {
    ipRequests.shift();
  }
  
  // Check if IP rate limit exceeded
  if (ipRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from your IP, please try again later',
      retryAfter: Math.ceil((ipRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }
  
  // Global endpoint rate limiting
  if (!globalRequestCounts.has(endpoint)) {
    globalRequestCounts.set(endpoint, []);
  }
  
  const globalRequests = globalRequestCounts.get(endpoint);
  while (globalRequests.length > 0 && globalRequests[0] < windowStart) {
    globalRequests.shift();
  }
  
  // Check if global endpoint limit exceeded
  if (globalRequests.length >= MAX_GLOBAL_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Service temporarily unavailable',
      message: 'This endpoint is experiencing high traffic, please try again later',
      retryAfter: Math.ceil((globalRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }
  
  // Add current request to both trackers
  ipRequests.push(now);
  globalRequests.push(now);
  next();
});

// Enhanced health check endpoint
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const { chainId = '1' } = req.query;
    const chainIdNum = parseInt(chainId as string);
    
    // Quick RPC connectivity check without blocking response
    getWorkingProvider(chainIdNum).then(provider => {
      console.log(`✅ RPC status for chain ${chainIdNum}: ${provider ? 'connected' : 'disconnected'}`);
    }).catch(error => {
      console.log(`❌ RPC check failed for chain ${chainIdNum}:`, error.message);
    });
    
    // Respond immediately without waiting for RPC
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      message: 'Credit Cupid backend server is running',
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
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: getErrorMessage(error)
    });
  }
});

// Enhanced credit data endpoint with comprehensive error handling
app.get('/api/credit-data/:address', async (req: express.Request, res: express.Response) => {
  let fallbackUsed = false;
  
  try {
    const { address } = req.params;
    const { chainId = '1', useFallback = 'false' } = req.query;
    const chainIdNum = parseInt(chainId as string);
    const shouldUseFallback = useFallback === 'true';

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Valid Ethereum address is required',
        details: `Provided: ${address}`
      });
    }

    console.log(`📊 Fetching credit data for: ${address} on chain ${chainId}`);
    
    // Test RPC connectivity first with timeout
    let provider: ethers.JsonRpcProvider | null = null;
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RPC connection timeout')), 5000)
      );
      
      provider = await Promise.race([
        getWorkingProvider(chainIdNum),
        timeoutPromise
      ]) as ethers.JsonRpcProvider | null;
    } catch (error) {
      console.log('🔄 RPC connectivity test failed:', getErrorMessage(error));
      provider = null;
    }
    
    if (!provider || shouldUseFallback) {
      console.log('🔄 Using fallback response for credit data');
      fallbackUsed = true;
      
      // Enhanced fallback with realistic data based on address pattern
      const fallbackScore = generateFallbackCreditScore(address);
      return res.json({
        fallbackUsed: true,
        creditScore: fallbackScore,
        address,
        chainId: chainIdNum,
        riskLevel: getRiskLevel(fallbackScore),
        recommendation: getRecommendation(fallbackScore),
        timestamp: new Date().toISOString(),
        metadata: {
          dataSource: 'fallback',
          reason: provider ? 'user_requested_fallback' : 'rpc_unavailable',
          message: 'Using fallback data due to service limitations'
        }
      });
    }
    
    // Get real credit data with enhanced timeout and error handling
    try {
      const creditDataPromise = creditClient.getCreditData(address, chainIdNum);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Credit data fetch timeout')), 20000) // Increased timeout
      );
      
      const creditData = await Promise.race([creditDataPromise, timeoutPromise]);
      
      // Enhanced response with additional metadata
      const responseData = {
        ...(creditData as any),
        metadata: {
          chainId: chainIdNum,
          rpcProvider: getRpcUrl(chainIdNum),
          dataSource: 'real-time',
          timestamp: new Date().toISOString(),
          fallbackUsed: false
        }
      };
      
      res.json(responseData);
      
    } catch (creditError) {
      console.error('❌ Error fetching real credit data:', getErrorMessage(creditError));
      
      // Check if it's a rate limiting error from Blockscout
      if (getErrorMessage(creditError).includes('Too Many Requests') || 
          getErrorMessage(creditError).includes('rate limit') ||
          getErrorMessage(creditError).includes('429')) {
        
        console.log('🔁 Blockscout rate limit hit, using fallback data');
        fallbackUsed = true;
        
        const fallbackScore = generateFallbackCreditScore(address);
        return res.json({
          fallbackUsed: true,
          creditScore: fallbackScore,
          address,
          chainId: chainIdNum,
          riskLevel: getRiskLevel(fallbackScore),
          recommendation: getRecommendation(fallbackScore),
          timestamp: new Date().toISOString(),
          metadata: {
            dataSource: 'fallback',
            reason: 'blockscout_rate_limit',
            message: 'Using fallback data due to API rate limiting'
          }
        });
      }
      
      // Re-throw other errors to be caught by outer catch
      throw creditError;
    }
  } catch (error) {
    console.error('❌ Error fetching credit data:', getErrorMessage(error));
    
    // Final fallback in case of any unhandled errors
    const fallbackScore = generateFallbackCreditScore(req.params.address);
    
    res.status(200).json({ 
      fallbackUsed: true,
      creditScore: fallbackScore,
      address: req.params.address,
      chainId: parseInt(req.query.chainId as string) || 1,
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
app.get('/api/wallet-info/:address', async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.params;
    const { chainId = '1' } = req.query;
    const chainIdNum = parseInt(chainId as string);

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Valid Ethereum address is required'
      });
    }

    console.log(`📊 Getting wallet info for: ${address} on chain ${chainId}`);
    
    // Test RPC connectivity
    const provider = await getWorkingProvider(chainIdNum);
    if (!provider) {
      return res.status(503).json({
        error: 'RPC connectivity issues',
        message: 'Unable to connect to blockchain nodes'
      });
    }
    
    // Get basic wallet info using the provider directly
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
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
  } catch (error) {
    console.error('❌ Error fetching wallet info:', getErrorMessage(error));
    res.status(500).json({ 
      error: 'Failed to fetch wallet info',
      details: getErrorMessage(error)
    });
  }
});

// Enhanced protocol info endpoint
app.get('/api/protocol-info/:address', async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.params;
    const { chainId = '1' } = req.query;
    const chainIdNum = parseInt(chainId as string);

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Valid Ethereum address is required'
      });
    }

    console.log(`🏦 Getting protocol info for: ${address} on chain ${chainId}`);
    
    // Test RPC connectivity
    const provider = await getWorkingProvider(chainIdNum);
    if (!provider) {
      return res.status(503).json({
        error: 'RPC connectivity issues',
        message: 'Unable to connect to blockchain nodes'
      });
    }
    
    // Enhanced protocol info with basic activity check
    const transactionCount = await provider.getTransactionCount(address);
    
    const protocolInfo = {
      address,
      chainId: chainIdNum,
      supportedProtocols: ['Morpho', 'Aave', 'Compound', 'Uniswap'],
      hasPositions: transactionCount > 5, // Simple heuristic
      transactionCount,
      walletAge: 'unknown', // Could be enhanced with more data
      timestamp: new Date().toISOString()
    };
    
    res.json(protocolInfo);
  } catch (error) {
    console.error('❌ Error fetching protocol info:', getErrorMessage(error));
    res.status(500).json({ 
      error: 'Failed to fetch protocol info',
      details: getErrorMessage(error)
    });
  }
});

// Enhanced wallet stats endpoint
app.get('/api/wallet-stats/:address', async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.params;
    const { chainId = '1' } = req.query;
    const chainIdNum = parseInt(chainId as string);

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Valid Ethereum address is required'
      });
    }

    console.log(`📈 Getting wallet stats for: ${address} on chain ${chainId}`);
    
    // Test RPC connectivity
    const provider = await getWorkingProvider(chainIdNum);
    if (!provider) {
      return res.status(503).json({
        error: 'RPC connectivity issues',
        message: 'Unable to connect to blockchain nodes'
      });
    }
    
    // Enhanced wallet stats
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    const transactionCount = await provider.getTransactionCount(address);
    
    // Check if address is a contract
    let isContract = false;
    try {
      const code = await provider.getCode(address);
      isContract = code !== '0x';
    } catch (error) {
      console.log('⚠️ Could not check if address is contract:', getErrorMessage(error));
    }
    
    const walletStats = {
      address,
      balance: balanceEth,
      transactionCount,
      chainId: chainIdNum,
      isContract,
      activityLevel: getActivityLevel(transactionCount),
      valueTier: getValueTier(parseFloat(balanceEth)),
      timestamp: new Date().toISOString()
    };
    
    res.json(walletStats);
  } catch (error) {
    console.error('❌ Error fetching wallet stats:', getErrorMessage(error));
    res.status(500).json({ 
      error: 'Failed to fetch wallet stats',
      details: getErrorMessage(error)
    });
  }
});

// Enhanced credit impact simulation
app.post('/api/simulate-impact/:address', async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.params;
    const { chainId = '1', action, amount } = req.body;
    const chainIdNum = parseInt(chainId);

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Valid Ethereum address is required'
      });
    }

    console.log(`🎯 Simulating credit impact for: ${address} on chain ${chainId}`);
    
    // Get base credit score for simulation
    let baseScore = 720;
    try {
      // Try to get real credit data for more accurate simulation
      const provider = await getWorkingProvider(chainIdNum);
      if (provider) {
        const balance = await provider.getBalance(address);
        const balanceEth = parseFloat(ethers.formatEther(balance));
        const txCount = await provider.getTransactionCount(address);
        
        // Simple heuristic for base score
        baseScore = Math.min(850, 600 + 
          (balanceEth > 1 ? 100 : 0) + 
          (txCount > 10 ? 50 : 0) + 
          (txCount > 50 ? 50 : 0));
      }
    } catch (error) {
      console.log('⚠️ Using default base score for simulation');
    }
    
    // Enhanced simulation logic
    const simulation = simulateCreditImpact(baseScore, action, amount);
    
    res.json({
      ...simulation,
      address,
      chainId: chainIdNum,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error simulating credit impact:', getErrorMessage(error));
    res.status(500).json({ 
      error: 'Failed to simulate credit impact',
      details: getErrorMessage(error)
    });
  }
});

// Enhanced multi-chain credit data
app.get('/api/multi-chain-credit/:address', async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.params;
    const { chainIds = '1,137,42161,10,8453' } = req.query;

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Valid Ethereum address is required'
      });
    }

    const chainIdArray = (chainIds as string).split(',').map(id => parseInt(id.trim()));
    console.log(`🌐 Getting multi-chain credit data for: ${address} on chains ${chainIdArray.join(', ')}`);
    
    const multiChainResults = [];
    
    for (const chainId of chainIdArray) {
      try {
        const provider = await getWorkingProvider(chainId);
        if (provider) {
          const balance = await provider.getBalance(address);
          const balanceEth = ethers.formatEther(balance);
          const transactionCount = await provider.getTransactionCount(address);
          
          multiChainResults.push({
            chainId,
            chainName: getChainName(chainId),
            balance: balanceEth,
            transactionCount,
            activityLevel: getActivityLevel(transactionCount),
            status: 'success'
          });
        } else {
          multiChainResults.push({
            chainId,
            chainName: getChainName(chainId),
            balance: '0',
            transactionCount: 0,
            activityLevel: 'inactive',
            status: 'rpc_unavailable'
          });
        }
      } catch (error) {
        multiChainResults.push({
          chainId,
          chainName: getChainName(chainId),
          balance: '0',
          transactionCount: 0,
          activityLevel: 'inactive',
          status: 'error',
          error: getErrorMessage(error)
        });
      }
    }
    
    res.json({
      address,
      results: multiChainResults,
      totalChains: multiChainResults.length,
      activeChains: multiChainResults.filter(r => r.status === 'success').length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching multi-chain credit data:', getErrorMessage(error));
    res.status(500).json({ 
      error: 'Failed to fetch multi-chain credit data',
      details: getErrorMessage(error)
    });
  }
});

// Get supported chains
app.get('/api/supported-chains', (req: express.Request, res: express.Response) => {
  const chains = Object.entries(rpcUrls).map(([chainId, url]) => ({
    chainId: parseInt(chainId),
    rpcUrl: url,
    name: getChainName(parseInt(chainId)),
    nativeCurrency: getNativeCurrency(parseInt(chainId)),
    fallbackUrls: fallbackRpcUrls[parseInt(chainId)] || [],
    testnet: parseInt(chainId) === 11155111
  }));

  res.json({
    chains,
    total: chains.length,
    timestamp: new Date().toISOString()
  });
});

// Enhanced RPC status endpoint
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
        const provider = new ethers.JsonRpcProvider(url, chainIdNum, {
          staticNetwork: true
        });
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
    
    const connectedCount = statusResults.filter(r => r.status === 'connected').length;
    
    res.json({
      chainId: chainIdNum,
      chainName: getChainName(chainIdNum),
      rpcStatus: statusResults,
      summary: {
        totalEndpoints: urls.length,
        connected: connectedCount,
        disconnected: urls.length - connectedCount,
        health: connectedCount > 0 ? 'healthy' : 'unhealthy'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check RPC status',
      details: getErrorMessage(error)
    });
  }
});

// Enhanced Blockscout info endpoint with rate limit status
app.get('/api/blockscout/info', (req: express.Request, res: express.Response) => {
  res.json({
    service: 'Blockscout SDK',
    status: 'integrated',
    timestamp: new Date().toISOString(),
    rateLimiting: {
      enabled: true,
      strategy: 'fallback_on_limit',
      fallback: 'generated_credit_scores'
    },
    features: [
      'Transaction analysis',
      'Wallet activity tracking',
      'Token balance monitoring',
      'Contract interaction analysis',
      'Automatic fallback on rate limits'
    ]
  });
});

// New endpoint to explicitly request fallback data
app.get('/api/fallback/credit-data/:address', async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.params;
    const { chainId = '1' } = req.query;
    const chainIdNum = parseInt(chainId as string);

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        error: 'Valid Ethereum address is required'
      });
    }

    console.log(`🔄 Explicitly using fallback credit data for: ${address}`);
    
    const fallbackScore = generateFallbackCreditScore(address);
    
    res.json({
      fallbackUsed: true,
      creditScore: fallbackScore,
      address,
      chainId: chainIdNum,
      riskLevel: getRiskLevel(fallbackScore),
      recommendation: getRecommendation(fallbackScore),
      timestamp: new Date().toISOString(),
      metadata: {
        dataSource: 'fallback',
        reason: 'explicit_request',
        message: 'Fallback data requested explicitly'
      }
    });
  } catch (error) {
    console.error('❌ Error generating fallback credit data:', getErrorMessage(error));
    res.status(500).json({ 
      error: 'Failed to generate fallback credit data',
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

// Enhanced utility function to safely get error messages
function getErrorMessage(error: unknown): string {
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

// Fallback credit score generation
function generateFallbackCreditScore(address: string): number {
  // Generate deterministic but realistic score based on address
  const addressHash = address.toLowerCase().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const score = 600 + Math.abs(addressHash % 250); // 600-850 range
  return Math.min(850, Math.max(300, score));
}

function getRiskLevel(score: number): string {
  if (score >= 800) return 'excellent';
  if (score >= 700) return 'good';
  if (score >= 600) return 'fair';
  if (score >= 500) return 'poor';
  return 'very_poor';
}

function getRecommendation(score: number): string {
  if (score >= 800) return 'Excellent creditworthiness. You qualify for the best rates.';
  if (score >= 700) return 'Good credit profile. Consider maintaining or improving your position.';
  if (score >= 600) return 'Fair credit. Work on building your credit history.';
  if (score >= 500) return 'Poor credit. Focus on improving your financial position.';
  return 'Very poor credit. Consider seeking financial advice.';
}

function getActivityLevel(txCount: number): string {
  if (txCount === 0) return 'inactive';
  if (txCount < 10) return 'low';
  if (txCount < 50) return 'medium';
  if (txCount < 200) return 'high';
  return 'very_high';
}

function getValueTier(balance: number): string {
  if (balance === 0) return 'zero';
  if (balance < 0.01) return 'dust';
  if (balance < 0.1) return 'low';
  if (balance < 1) return 'medium';
  if (balance < 10) return 'high';
  return 'very_high';
}

function simulateCreditImpact(baseScore: number, action: string, amount: string) {
  const amountNum = parseFloat(amount) || 1;
  let impact = 0;
  let riskLevel = 'low';
  
  switch (action) {
    case 'borrow_large':
      impact = -20;
      riskLevel = 'high';
      break;
    case 'borrow_medium':
      impact = -10;
      riskLevel = 'medium';
      break;
    case 'borrow_small':
      impact = -5;
      riskLevel = 'low';
      break;
    case 'repay_large':
      impact = +15;
      riskLevel = 'low';
      break;
    case 'repay_medium':
      impact = +8;
      riskLevel = 'low';
      break;
    case 'add_collateral':
      impact = +5;
      riskLevel = 'low';
      break;
    default:
      impact = -5;
      riskLevel = 'medium';
  }
  
  // Adjust impact based on amount
  impact = impact * (amountNum / 10);
  
  const projectedScore = Math.max(300, Math.min(850, baseScore + impact));
  
  return {
    action: action || 'borrow',
    amount: amount || '1.0',
    currentScore: baseScore,
    projectedScore: Math.round(projectedScore),
    impact: Math.round(impact),
    riskLevel,
    recommendation: getRecommendation(projectedScore)
  };
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
      'GET /api/fallback/credit-data/:address',
      'GET /api/wallet-info/:address',
      'GET /api/protocol-info/:address',
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
  console.log(`🚀 Credit Cupid API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Credit data: http://localhost:${PORT}/api/credit-data/:address`);
  console.log(`🔄 Fallback credit: http://localhost:${PORT}/api/fallback/credit-data/:address`);
  console.log(`👛 Wallet info: http://localhost:${PORT}/api/wallet-info/:address`);
  console.log(`🏦 Protocol info: http://localhost:${PORT}/api/protocol-info/:address`);
  console.log(`📈 Wallet stats: http://localhost:${PORT}/api/wallet-stats/:address`);
  console.log(`🎯 Credit impact simulation: http://localhost:${PORT}/api/simulate-impact/:address`);
  console.log(`🌐 Multi-chain credit: http://localhost:${PORT}/api/multi-chain-credit/:address`);
  console.log(`🔗 Blockscout SDK: Integrated with fallback handling`);
  console.log(`🔗 RPC Endpoints configured for ${Object.keys(rpcUrls).length} chains`);
  console.log(`⚡ Rate limiting: ${MAX_REQUESTS_PER_WINDOW} requests per minute per IP`);
});

export default app;