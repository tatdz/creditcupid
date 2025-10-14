import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { BlockscoutMCPClient } from './mcp/client';
import { SandboxService } from './services/sandboxService';
import { EnhancedProtocolService } from './services/enhancedProtocolService';
import { IPFSService } from './services/ipfsService';
import { ForkedNetworkRunner } from '../../../sandbox/forked-network-runner';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// RPC URLs for different chains
const rpcUrls: { [chainId: number]: string } = {
  1: process.env.ETH_RPC_URL || 'https://eth.blockscout.com',
  137: process.env.POLYGON_RPC_URL || 'https://polygon.blockscout.com',
  42161: process.env.ARBITRUM_RPC_URL || 'https://arbitrum.blockscout.com',
  10: process.env.OPTIMISM_RPC_URL || 'https://optimism.blockscout.com',
  8453: process.env.BASE_RPC_URL || 'https://base.blockscout.com',
  11155111: process.env.SEPOLIA_RPC_URL || 'https://sepolia.blockscout.com'
};

// Initialize services
const mcpClient = new BlockscoutMCPClient(rpcUrls);
const sandboxService = new SandboxService(rpcUrls[11155111]);
const ipfsService = new IPFSService();

// Initialize enhanced protocol service with Sepolia
const protocolService = new EnhancedProtocolService(
  rpcUrls[11155111],
  process.env.TEST_WALLET_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
);

// Initialize forked network runner
const networkRunner = new ForkedNetworkRunner();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      blockscout: 'active',
      sandbox: 'active',
      ipfs: 'active',
      protocol: 'active'
    }
  });
});

// Main credit data endpoint
app.get('/api/credit-data/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    console.log(`📊 Fetching credit data for: ${address}`);
    const data = await mcpClient.getCrossChainData(address);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching credit data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch credit data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Protocol-specific data endpoint
app.get('/api/protocol-data/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const data = await mcpClient.getCrossChainData(address);
    
    const protocolData = {
      address: data.address,
      aavePositions: data.aavePositions,
      morphoPositions: data.morphoPositions,
      protocolInteractions: data.protocolInteractions,
      creditScore: data.creditScore,
      riskFactors: data.riskFactors
    };

    res.json(protocolData);
  } catch (error) {
    console.error('Error fetching protocol data:', error);
    res.status(500).json({ error: 'Failed to fetch protocol data' });
  }
});

// Recommendations endpoint
app.get('/api/recommendations/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const data = await mcpClient.getCrossChainData(address);
    
    res.json({
      address: data.address,
      creditScore: data.creditScore,
      recommendations: data.recommendations,
      riskFactors: data.riskFactors,
      improvementTips: data.recommendations.slice(0, 3)
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Batch processing endpoint
app.post('/api/batch-credit-data', async (req, res) => {
  try {
    const { addresses } = req.body;
    
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'Addresses array is required' });
    }

    if (addresses.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 addresses per batch' });
    }

    const results = await Promise.all(
      addresses.map(async (address: string) => {
        try {
          if (!ethers.isAddress(address)) {
            return { address, error: 'Invalid Ethereum address' };
          }
          const data = await mcpClient.getCrossChainData(address);
          return { address, data };
        } catch (error) {
          return { 
            address, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    res.json({ results });
  } catch (error) {
    console.error('Error processing batch request:', error);
    res.status(500).json({ error: 'Failed to process batch request' });
  }
});

// Sandbox endpoints
app.get('/api/sandbox/simulation-types', async (req, res) => {
  try {
    const types = await sandboxService.getSimulationTypes();
    res.json(types);
  } catch (error) {
    console.error('Error fetching simulation types:', error);
    res.status(500).json({ error: 'Failed to fetch simulation types' });
  }
});

app.get('/api/sandbox/credit-data/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { 
      simulation = 'real', 
      useRealProtocols = 'false'
    } = req.query;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    let data;
    if (simulation === 'real') {
      data = await mcpClient.getCrossChainData(address);
    } else {
      data = await sandboxService.generateSimulatedCreditData(
        address, 
        simulation as 'ideal' | 'growing' | 'risky',
        useRealProtocols === 'true'
      );
    }
    
    res.json({
      ...data,
      simulationType: simulation,
      isSimulated: simulation !== 'real',
      usesRealProtocols: useRealProtocols === 'true'
    });
  } catch (error) {
    console.error('Error fetching sandbox credit data:', error);
    res.status(500).json({ error: 'Failed to fetch credit data' });
  }
});

// Enhanced protocol data endpoint
app.get('/api/enhanced-protocol-data/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const protocolData = await protocolService.getUserEnhancedProtocolData(address);
    res.json(protocolData);
    
  } catch (error) {
    console.error('Error fetching enhanced protocol data:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced protocol data' });
  }
});

// Enhanced protocol access simulation
app.get('/api/enhanced-access/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const creditScore = parseInt(req.query.creditScore as string) || 500;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const enhancedAccess = await protocolService.simulateEnhancedProtocolAccess(address, creditScore);
    res.json(enhancedAccess);
    
  } catch (error) {
    console.error('Error simulating enhanced access:', error);
    res.status(500).json({ error: 'Failed to simulate enhanced access' });
  }
});

// Real protocol interaction endpoint
app.post('/api/execute-real-protocol-actions', async (req, res) => {
  try {
    const { address, actions } = req.body;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    console.log('🚀 Executing real protocol actions for:', address);
    
    // Execute real transactions on Sepolia
    const results = await networkRunner.runCompleteProtocolSimulation();
    
    res.json({
      success: true,
      message: 'Real protocol interactions executed successfully',
      transactions: {
        aave: results.aaveTransactions,
        morpho: results.morphoTransactions
      },
      positions: results.userPositions,
      nextSteps: [
        'Wait 30-60 seconds for blockchain indexing',
        'Call /api/credit-data to see updated score',
        'Check enhanced protocol access benefits',
        'Monitor real-time credit score changes'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error executing real protocol actions:', error);
    res.status(500).json({ 
      error: 'Failed to execute real protocol actions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// IPFS endpoints for loan metadata
app.post('/api/ipfs/upload-loan-metadata', async (req, res) => {
  try {
    const { metadata } = req.body;
    
    if (!metadata) {
      return res.status(400).json({ error: 'Metadata is required' });
    }

    const ipfsHash = await ipfsService.uploadLoanMetadata(metadata);
    
    res.json({
      success: true,
      ipfsHash,
      message: 'Loan metadata uploaded to IPFS successfully'
    });
    
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    res.status(500).json({ error: 'Failed to upload to IPFS' });
  }
});

app.get('/api/ipfs/retrieve/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;
    
    const data = await ipfsService.retrieveFromIPFS(ipfsHash);
    
    res.json({
      success: true,
      data,
      ipfsHash
    });
    
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    res.status(500).json({ error: 'Failed to retrieve from IPFS' });
  }
});

// Agent communication endpoints
app.post('/api/agents/credit-advice', async (req, res) => {
  try {
    const { address, question, sessionId } = req.body;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // In production, this would call the actual agent service
    // For now, simulate agent response
    const creditData = await mcpClient.getCrossChainData(address);
    
    const advice = {
      address,
      sessionId: sessionId || 'default',
      creditScore: creditData.creditScore,
      recommendations: creditData.recommendations,
      answer: `Based on your credit score of ${creditData.creditScore}, I recommend: ${creditData.recommendations.join(', ')}`,
      timestamp: new Date().toISOString()
    };

    res.json(advice);
    
  } catch (error) {
    console.error('Error getting credit advice:', error);
    res.status(500).json({ error: 'Failed to get credit advice' });
  }
});

// Real-time monitoring endpoint
app.get('/api/monitor/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Set up Server-Sent Events for real-time updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send initial data
    const initialData = await mcpClient.getCrossChainData(address);
    res.write(`data: ${JSON.stringify({
      type: 'initial',
      data: initialData
    })}\n\n`);

    // Simulate real-time updates (in production, this would listen to blockchain events)
    const interval = setInterval(async () => {
      try {
        const updatedData = await mcpClient.getCrossChainData(address);
        res.write(`data: ${JSON.stringify({
          type: 'update',
          data: {
            creditScore: updatedData.creditScore,
            timestamp: new Date().toISOString()
          }
        })}\n\n`);
      } catch (error) {
        console.error('Error in real-time update:', error);
      }
    }, 30000); // Update every 30 seconds

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
    
  } catch (error) {
    console.error('Error setting up monitoring:', error);
    res.status(500).json({ error: 'Failed to set up monitoring' });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.id || 'unknown'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      '/health',
      '/api/credit-data/:address',
      '/api/protocol-data/:address',
      '/api/recommendations/:address',
      '/api/sandbox/credit-data/:address',
      '/api/enhanced-protocol-data/:address',
      '/api/execute-real-protocol-actions',
      '/api/ipfs/upload-loan-metadata'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Darma backend server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`📊 Credit data: http://localhost:${port}/api/credit-data/:address`);
  console.log(`🎮 Sandbox: http://localhost:${port}/api/sandbox/credit-data/:address`);
  console.log(`🔗 Enhanced protocols: http://localhost:${port}/api/enhanced-protocol-data/:address`);
  console.log(`⚡ Real transactions: http://localhost:${port}/api/execute-real-protocol-actions`);
  console.log('\n📋 Available Chains:');
  Object.entries(rpcUrls).forEach(([chainId, url]) => {
    console.log(`  • Chain ${chainId}: ${url}`);
  });
});

export default app;