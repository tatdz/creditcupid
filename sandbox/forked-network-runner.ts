import { ethers } from 'ethers';
import { RealProtocolInteractor } from './real-protocol-interactor';

export class ForkedNetworkRunner {
  private interactor: RealProtocolInteractor;

  constructor() {
    // Using Sepolia testnet for real transactions
    const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';
    const PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat default #0
    
    this.interactor = new RealProtocolInteractor(RPC_URL, PRIVATE_KEY);
  }

  async runCompleteProtocolSimulation(): Promise<{
    aaveTransactions: any[];
    morphoTransactions: any[];
    userPositions: any;
  }> {
    console.log('🏃 Starting complete protocol simulation on Sepolia...');
    
    try {
      // Run Aave interactions
      const aaveTxs = await this.interactor.simulateRealAaveActivity();
      
      // Wait between protocol interactions
      await this.delay(5000);
      
      // Run Morpho interactions
      const morphoTxs = await this.interactor.simulateRealMorphoActivity();
      
      // Get final positions
      const aavePosition = await this.interactor.getUserAavePosition();
      
      return {
        aaveTransactions: aaveTxs.map(tx => ({
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          timestamp: Date.now()
        })),
        morphoTransactions: morphoTxs.map(tx => ({
          hash: tx.hash,
          blockNumber: tx.blockNumber, 
          timestamp: Date.now()
        })),
        userPositions: {
          aave: aavePosition
        }
      };
      
    } catch (error) {
      console.error('❌ Protocol simulation failed:', error);
      throw error;
    }
  }

  async generateTestUserProfiles(): Promise<any[]> {
    // Generate multiple test wallets with different activity patterns
    const testProfiles = [
      {
        name: 'Ideal Borrower',
        description: 'Perfect repayment history, diverse portfolio',
        activities: this.generateIdealBorrowerActivities()
      },
      {
        name: 'Growing Borrower', 
        description: 'Building credit with moderate activity',
        activities: this.generateGrowingBorrowerActivities()
      },
      {
        name: 'Risky Borrower',
        description: 'Inconsistent repayments, high concentration',
        activities: this.generateRiskyBorrowerActivities()
      }
    ];

    return testProfiles;
  }

  private generateIdealBorrowerActivities(): any[] {
    return [
      { protocol: 'aave', action: 'supply', amount: '2000', asset: 'USDC' },
      { protocol: 'aave', action: 'borrow', amount: '800', asset: 'DAI' },
      { protocol: 'aave', action: 'repay', amount: '800', asset: 'DAI' },
      { protocol: 'morpho', action: 'supply', amount: '2', asset: 'WETH' },
      { protocol: 'morpho', action: 'borrow', amount: '1000', asset: 'USDC' },
      { protocol: 'morpho', action: 'repay', amount: '1000', asset: 'USDC' }
    ];
  }

  private generateGrowingBorrowerActivities(): any[] {
    return [
      { protocol: 'aave', action: 'supply', amount: '500', asset: 'USDC' },
      { protocol: 'aave', action: 'borrow', amount: '200', asset: 'DAI' },
      { protocol: 'aave', action: 'repay', amount: '150', asset: 'DAI' },
      { protocol: 'aave', action: 'repay', amount: '50', asset: 'DAI' }
    ];
  }

  private generateRiskyBorrowerActivities(): any[] {
    return [
      { protocol: 'aave', action: 'supply', amount: '1000', asset: 'USDC' },
      { protocol: 'aave', action: 'borrow', amount: '800', asset: 'DAI' },
      { protocol: 'aave', action: 'borrow', amount: '400', asset: 'USDC' },
      // Missing repayments intentionally
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async monitorRealTimeActivity(walletAddress: string): Promise<void> {
    console.log(`👀 Monitoring real-time activity for ${walletAddress}...`);
    
    // Set up event listeners for real-time monitoring
    this.interactor.provider.on('block', async (blockNumber) => {
      console.log(`New block: ${blockNumber}`);
      
      // Check for new transactions involving this address
      const newTxs = await this.interactor.getTransactionHistory(walletAddress, blockNumber - 10);
      
      if (newTxs.length > 0) {
        console.log(`📈 New activity detected: ${newTxs.length} transactions`);
        
        // Update credit score in real-time
        await this.updateRealTimeCreditScore(walletAddress);
      }
    });
  }

  private async updateRealTimeCreditScore(walletAddress: string): Promise<void> {
    // Call backend to recalculate credit score with new data
    try {
      const response = await fetch(`http://localhost:3001/api/credit-data/${walletAddress}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const creditData = await response.json();
        console.log(`🔄 Real-time credit score update: ${creditData.creditScore}`);
        
        // Emit real-time update event
        this.emitCreditScoreUpdate(walletAddress, creditData.creditScore);
      }
    } catch (error) {
      console.error('Error updating real-time credit score:', error);
    }
  }

  private emitCreditScoreUpdate(walletAddress: string, score: number): void {
    // In a real implementation, this would emit to WebSocket clients
    console.log(`📊 Credit score update for ${walletAddress}: ${score}`);
  }
}