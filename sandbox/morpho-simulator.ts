import { ethers } from 'ethers';
import { RealProtocolInteractor } from './real-protocol-interactor';
import { MorphoTransaction } from '../backend/src/protocols/morpho';

export class MorphoSimulator {
  private realInteractor: RealProtocolInteractor;

  constructor(rpcUrl: string, privateKey: string) {
    this.realInteractor = new RealProtocolInteractor(rpcUrl, privateKey);
  }

  async simulateUserActivity(address: string): Promise<MorphoTransaction[]> {
    // OPTION 1: Use real protocol interactions (commented for safety in default mode)
    /*
    console.log('🔄 Using real Morpho protocol interactions...');
    try {
      const realTxs = await this.realInteractor.simulateRealMorphoActivity();
      return await this.mapRealToMorphoTransactions(realTxs, address);
    } catch (error) {
      console.error('Real Morpho interactions failed, falling back to simulation:', error);
      return this.generateSimulatedTransactions(address);
    }
    */
    
    // OPTION 2: Fallback to simulated data (current default behavior)
    return this.generateSimulatedTransactions(address);
  }

  private async mapRealToMorphoTransactions(realTxs: any[], address: string): Promise<MorphoTransaction[]> {
    if (!realTxs || realTxs.length === 0) {
      return this.generateSimulatedTransactions(address);
    }

    return realTxs.map((tx, index) => ({
      type: this.determineMorphoTransactionType(tx, index),
      poolToken: this.getMorphoPoolTokenFromTransaction(tx, index),
      amount: this.getMorphoAmountFromTransaction(tx, index),
      timestamp: tx.timestamp || Math.floor(Date.now() / 1000) - (realTxs.length - index) * 86400,
      txHash: tx.hash || `0x${Math.random().toString(16).substr(2, 64)}`,
      chainId: 11155111, // Sepolia
      blockNumber: tx.blockNumber || 4000000 + index * 1000
    }));
  }

  private determineMorphoTransactionType(tx: any, index: number): 'supply' | 'withdraw' | 'borrow' | 'repay' {
    // In a real implementation, this would decode the transaction data
    // For simulation, we use a pattern that makes sense
    const patterns = [
      ['supply', 'borrow', 'repay', 'supply', 'withdraw'],
      ['supply', 'borrow', 'repay', 'borrow', 'repay'],
      ['supply', 'withdraw', 'supply', 'borrow', 'repay']
    ];
    
    const pattern = patterns[index % patterns.length];
    return pattern[index % pattern.length] as 'supply' | 'withdraw' | 'borrow' | 'repay';
  }

  private getMorphoPoolTokenFromTransaction(tx: any, index: number): string {
    const assets = ['WETH', 'USDC', 'DAI', 'WBTC', 'USDT'];
    return assets[index % assets.length];
  }

  private getMorphoAmountFromTransaction(tx: any, index: number): string {
    const amounts = {
      WETH: ['2.00', '1.50', '0.75', '3.00', '1.25'],
      USDC: ['1000.00', '500.00', '750.00', '1500.00', '250.00'],
      DAI: ['500.00', '1000.00', '250.00', '750.00', '300.00'],
      WBTC: ['0.10', '0.05', '0.15', '0.08', '0.12'],
      USDT: ['800.00', '400.00', '600.00', '900.00', '350.00']
    };
    
    const asset = this.getMorphoPoolTokenFromTransaction(tx, index);
    const assetAmounts = amounts[asset as keyof typeof amounts] || amounts.USDC;
    return assetAmounts[index % assetAmounts.length];
  }

  private generateSimulatedTransactions(address: string): MorphoTransaction[] {
    console.log('🎭 Generating simulated Morpho transactions...');
    
    const transactionPatterns = [
      // Pattern 1: Conservative user
      [
        { type: 'supply' as const, asset: 'WETH', amount: '2.00', daysAgo: 45 },
        { type: 'borrow' as const, asset: 'USDC', amount: '1000.00', daysAgo: 40 },
        { type: 'repay' as const, asset: 'USDC', amount: '500.00', daysAgo: 30 },
        { type: 'repay' as const, asset: 'USDC', amount: '500.00', daysAgo: 20 },
        { type: 'withdraw' as const, asset: 'WETH', amount: '1.00', daysAgo: 10 }
      ],
      // Pattern 2: Active user
      [
        { type: 'supply' as const, asset: 'USDC', amount: '5000.00', daysAgo: 60 },
        { type: 'borrow' as const, asset: 'DAI', amount: '2000.00', daysAgo: 55 },
        { type: 'supply' as const, asset: 'WETH', amount: '1.50', daysAgo: 50 },
        { type: 'repay' as const, asset: 'DAI', amount: '1000.00', daysAgo: 40 },
        { type: 'borrow' as const, asset: 'USDC', amount: '1500.00', daysAgo: 35 },
        { type: 'repay' as const, asset: 'DAI', amount: '1000.00', daysAgo: 25 },
        { type: 'repay' as const, asset: 'USDC', amount: '1500.00', daysAgo: 15 },
        { type: 'withdraw' as const, asset: 'USDC', amount: '2000.00', daysAgo: 5 }
      ],
      // Pattern 3: New user
      [
        { type: 'supply' as const, asset: 'DAI', amount: '1000.00', daysAgo: 20 },
        { type: 'borrow' as const, asset: 'USDC', amount: '500.00', daysAgo: 15 },
        { type: 'repay' as const, asset: 'USDC', amount: '500.00', daysAgo: 5 }
      ]
    ];

    // Select a random pattern or use address-based deterministic pattern
    const patternIndex = this.getDeterministicPatternIndex(address);
    const selectedPattern = transactionPatterns[patternIndex];
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const secondsPerDay = 24 * 60 * 60;

    const transactions: MorphoTransaction[] = selectedPattern.map((action, index) => ({
      type: action.type,
      poolToken: action.asset,
      amount: action.amount,
      timestamp: currentTimestamp - (action.daysAgo * secondsPerDay),
      txHash: `0x${this.generateDeterministicHash(address, index)}`,
      chainId: 11155111, // Sepolia
      blockNumber: 4000000 + index * 500
    }));

    console.log(`✅ Generated ${transactions.length} simulated Morpho transactions for ${address}`);
    
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private getDeterministicPatternIndex(address: string): number {
    // Use the address to deterministically select a pattern
    const hash = ethers.keccak256(ethers.toUtf8Bytes(address));
    const patternIndex = parseInt(hash.slice(-2), 16) % 3;
    return patternIndex;
  }

  private generateDeterministicHash(address: string, index: number): string {
    const baseString = `${address}-${index}-${Date.now()}`;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(baseString));
    return hash.slice(2, 66); // Remove 0x and ensure 64 chars
  }

  async generateTestUserProfile(): Promise<any> {
    // Enhanced with real data capability
    try {
      // Try to get real Morpho position data
      const realTransactions = await this.realInteractor.simulateRealMorphoActivity();
      
      return {
        address: '0x8C3a5F4c5B6D2E7f8C9A0B1C2D3E4F5A6B7C8D9E',
        totalSupplied: '3500.00',
        totalBorrowed: '1200.00',
        totalRepaid: '800.00',
        activePositions: 2,
        healthFactor: '1.6',
        preferredAssets: ['WETH', 'USDC', 'DAI'],
        // Add real data if available
        realData: realTransactions.length > 0 ? {
          recentTransactions: realTransactions.length,
          lastActivity: new Date().toISOString()
        } : null
      };
    } catch (error) {
      // Fallback to simulated data
      return {
        address: '0x8C3a5F4c5B6D2E7f8C9A0B1C2D3E4F5A6B7C8D9E',
        totalSupplied: '3500.00',
        totalBorrowed: '1200.00',
        totalRepaid: '800.00',
        activePositions: 2,
        healthFactor: '1.6',
        preferredAssets: ['WETH', 'USDC', 'DAI'],
        simulationNote: 'Using simulated Morpho data'
      };
    }
  }

  async analyzeMorphoBehaviorPatterns(address: string): Promise<{
    behaviorType: 'conservative' | 'active' | 'speculative' | 'new_user';
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    metrics: {
      supplyBorrowRatio: number;
      repaymentConsistency: number;
      assetDiversity: number;
      activityFrequency: number;
    };
  }> {
    const transactions = await this.simulateUserActivity(address);
    
    // Analyze transaction patterns
    const supplies = transactions.filter(tx => tx.type === 'supply');
    const borrows = transactions.filter(tx => tx.type === 'borrow');
    const repays = transactions.filter(tx => tx.type === 'repay');
    
    const totalSupply = supplies.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalBorrow = borrows.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    // Calculate metrics
    const supplyBorrowRatio = totalBorrow > 0 ? totalSupply / totalBorrow : 1;
    const repaymentConsistency = borrows.length > 0 ? repays.length / borrows.length : 1;
    
    const uniqueAssets = new Set(transactions.map(tx => tx.poolToken));
    const assetDiversity = uniqueAssets.size / Math.max(transactions.length, 1);
    
    const activityFrequency = transactions.length > 1 
      ? (transactions[0].timestamp - transactions[transactions.length - 1].timestamp) / transactions.length 
      : 0;
    
    // Determine behavior type
    let behaviorType: 'conservative' | 'active' | 'speculative' | 'new_user';
    let riskLevel: 'low' | 'medium' | 'high';
    
    if (transactions.length < 3) {
      behaviorType = 'new_user';
      riskLevel = 'medium';
    } else if (supplyBorrowRatio > 3 && repaymentConsistency > 0.8) {
      behaviorType = 'conservative';
      riskLevel = 'low';
    } else if (supplyBorrowRatio > 1.5 && repaymentConsistency > 0.6) {
      behaviorType = 'active';
      riskLevel = 'medium';
    } else {
      behaviorType = 'speculative';
      riskLevel = 'high';
    }
    
    // Generate recommendations
    const recommendations = this.generateMorphoRecommendations(behaviorType, riskLevel, {
      supplyBorrowRatio,
      repaymentConsistency,
      assetDiversity,
      activityFrequency
    });

    return {
      behaviorType,
      riskLevel,
      recommendations,
      metrics: {
        supplyBorrowRatio,
        repaymentConsistency,
        assetDiversity,
        activityFrequency
      }
    };
  }

  private generateMorphoRecommendations(
    behaviorType: string,
    riskLevel: string,
    metrics: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (behaviorType === 'new_user') {
      recommendations.push('Start with smaller supply positions to build history');
      recommendations.push('Consider conservative borrowing until established');
    }
    
    if (behaviorType === 'speculative' || riskLevel === 'high') {
      recommendations.push('Reduce borrowing relative to supplying');
      recommendations.push('Improve repayment consistency');
      recommendations.push('Diversify across different assets');
    }
    
    if (metrics.assetDiversity < 0.3) {
      recommendations.push('Diversify your supplied assets across different tokens');
    }
    
    if (metrics.repaymentConsistency < 0.7) {
      recommendations.push('Focus on consistent and timely repayments');
    }
    
    if (metrics.supplyBorrowRatio < 1.5) {
      recommendations.push('Consider increasing your supply cushion relative to borrowing');
    }
    
    return recommendations;
  }
}