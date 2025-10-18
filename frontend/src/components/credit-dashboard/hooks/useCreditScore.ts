// components/credit-dashboard/hooks/useCreditScore.ts
import { useMemo } from 'react';
import { 
  CreditData, 
  PlaidData, 
  PrivacyProofs, 
  TransactionAnalysis, 
  WalletData,
  CreditScoreResult,
  CreditFactor
} from '../../../types/credit';

// Credit scoring factors with exact weights
const CREDIT_FACTORS: { [key: string]: { weight: number; description: string; maxScore: number } } = {
  ON_CHAIN_HISTORY: {
    weight: 0.25,
    description: 'Regular on-chain activity and transaction volume',
    maxScore: 100
  },
  COLLATERAL_DIVERSITY: {
    weight: 0.20,
    description: 'Variety and quality of collateral assets',
    maxScore: 100
  },
  PROTOCOL_USAGE: {
    weight: 0.15,
    description: 'Active participation in DeFi protocols',
    maxScore: 100
  },
  FINANCIAL_HEALTH: {
    weight: 0.25,
    description: 'Traditional financial health from bank data',
    maxScore: 100
  },
  REPAYMENT_HISTORY: {
    weight: 0.15,
    description: 'Track record of loan repayments',
    maxScore: 100
  }
};

// Individual scoring functions - ZERO TOLERANCE for no activity
const calculateOnChainHistoryScore = (transactionAnalysis: TransactionAnalysis | undefined): number => {
  if (!transactionAnalysis) return 0;

  const totalTransactions = Number(transactionAnalysis.totalTransactions) || 0;
  const activeMonths = Number(transactionAnalysis.activeMonths) || 0;
  const transactionVolume = Number(transactionAnalysis.transactionVolume) || 0;

  console.log('🔍 REAL On-Chain Data:', {
    totalTransactions,
    activeMonths, 
    transactionVolume
  });

  // EXTREMELY STRICT: Need significant activity to get any points
  if (totalTransactions === 0) return 0;
  if (totalTransactions === 1) return 2; // Only 2 points for 1 transaction
  if (totalTransactions <= 5) return 5;  // 5 points for 2-5 transactions
  
  // Gradual scaling only after minimum threshold
  let score = 0;
  
  // Transaction count (max 40 points)
  if (totalTransactions >= 100) score += 40;
  else if (totalTransactions >= 50) score += 30;
  else if (totalTransactions >= 25) score += 20;
  else if (totalTransactions >= 10) score += 10;
  else if (totalTransactions >= 5) score += 5;

  // Activity duration (max 30 points)
  if (activeMonths >= 12) score += 30;
  else if (activeMonths >= 6) score += 15;
  else if (activeMonths >= 3) score += 5;

  // Volume (max 30 points)
  if (transactionVolume >= 10) score += 30;
  else if (transactionVolume >= 5) score += 15;
  else if (transactionVolume >= 1) score += 5;

  return Math.min(score, 100);
};

const calculateCollateralDiversityScore = (walletData: WalletData | undefined): number => {
  if (!walletData?.tokenBalances || walletData.tokenBalances.length === 0) {
    console.log('💰 REAL Collateral: NO tokens found');
    return 0;
  }
  
  const totalValue = Number(walletData.totalValueUSD) || 0;
  const tokenBalances = walletData.tokenBalances;

  console.log('💰 REAL Collateral Data:', {
    tokenCount: tokenBalances.length,
    totalValueUSD: totalValue,
    tokens: tokenBalances.map(t => ({
      symbol: t.symbol,
      balance: t.balance,
      valueUSD: t.valueUSD
    }))
  });

  // ZERO TOLERANCE: No value = no score
  if (totalValue <= 0) {
    console.log('💰 Collateral: ZERO value - returning 0');
    return 0;
  }

  // VERY STRICT: Minimal value gets minimal points
  if (totalValue < 100) return 2; // Only 2 points for <$100

  let score = 0;
  
  // Asset count (max 25 points)
  const assetCount = tokenBalances.length;
  if (assetCount >= 5) score += 25;
  else if (assetCount >= 3) score += 15;
  else if (assetCount >= 2) score += 8;
  else if (assetCount >= 1) score += 3; // Only 3 points for 1 asset

  // Value-based (max 50 points)
  if (totalValue > 50000) score += 50;
  else if (totalValue > 25000) score += 40;
  else if (totalValue > 10000) score += 30;
  else if (totalValue > 5000) score += 20;
  else if (totalValue > 1000) score += 15;
  else if (totalValue > 500) score += 10;
  else if (totalValue > 100) score += 5;

  // Blue-chip assets (max 25 points)
  const blueChipAssets = ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI'];
  const hasBlueChip = tokenBalances.some(token => blueChipAssets.includes(token.symbol));
  if (hasBlueChip) score += 5; // Only 5 points for having blue-chip

  return Math.min(score, 100);
};

const calculateProtocolUsageScore = (protocolInteractions: any[] = []): number => {
  console.log('🔄 REAL Protocol Interactions:', protocolInteractions);

  // ZERO TOLERANCE: No interactions = no score
  if (!protocolInteractions || protocolInteractions.length === 0) {
    console.log('🔄 Protocol Usage: NO interactions - returning 0');
    return 0;
  }

  const actualInteractions = protocolInteractions.filter(p => p && p.protocol);
  
  if (actualInteractions.length === 0) {
    console.log('🔄 Protocol Usage: NO valid interactions - returning 0');
    return 0;
  }

  // Count only REAL lending protocol interactions
  const lendingProtocols = ['aave', 'morpho', 'compound', 'maker', 'morpho-blue'];
  const lendingInteractions = actualInteractions.filter(p => 
    lendingProtocols.includes(p.protocol?.toLowerCase())
  );

  console.log('🔄 REAL Lending Interactions:', lendingInteractions);

  // ZERO TOLERANCE: No lending protocol interactions = no score
  if (lendingInteractions.length === 0) {
    console.log('🔄 Protocol Usage: NO lending protocol interactions - returning 0');
    return 0;
  }

  // VERY STRICT: Minimal interactions get minimal points
  if (lendingInteractions.length === 1) return 5; // Only 5 points for 1 interaction

  let score = 0;
  
  // Interaction frequency (max 50 points)
  if (lendingInteractions.length >= 20) score += 50;
  else if (lendingInteractions.length >= 10) score += 30;
  else if (lendingInteractions.length >= 5) score += 15;
  else if (lendingInteractions.length >= 2) score += 8;

  // Protocol diversity (max 30 points)
  const uniqueProtocols = new Set(lendingInteractions.map(p => p.protocol)).size;
  if (uniqueProtocols >= 3) score += 30;
  else if (uniqueProtocols >= 2) score += 15;
  else if (uniqueProtocols >= 1) score += 5;

  // Action complexity (max 20 points)
  const complexActions = lendingInteractions.filter(p => 
    ['supply', 'borrow', 'repay', 'withdraw'].includes(p.type)
  ).length;
  
  if (complexActions >= 10) score += 20;
  else if (complexActions >= 5) score += 10;
  else if (complexActions >= 2) score += 5;

  return Math.min(score, 100);
};

const calculateRepaymentHistoryScore = (protocolInteractions: any[] = []): number => {
  console.log('💳 REAL Repayment Data:', protocolInteractions);

  // ZERO TOLERANCE: No interactions = no score
  if (!protocolInteractions || protocolInteractions.length === 0) {
    console.log('💳 Repayment History: NO interactions - returning 0');
    return 0;
  }

  // Find REAL repayment transactions
  const repayInteractions = protocolInteractions.filter(p => 
    p && p.type === 'repay'
  );

  const loanInteractions = protocolInteractions.filter(p => 
    p && p.type === 'borrow'
  );

  console.log('💳 REAL Loan/Repayment Data:', {
    loans: loanInteractions.length,
    repayments: repayInteractions.length
  });

  // ZERO TOLERANCE: No loans = no repayment history score
  if (loanInteractions.length === 0) {
    console.log('💳 Repayment History: NO loans - returning 0');
    return 0;
  }

  // If loans exist but no repayments, very negative score
  if (repayInteractions.length === 0) {
    console.log('💳 Repayment History: Loans but NO repayments - returning 5');
    return 5; // Very low score for having loans but no repayments
  }

  // Calculate completion rate
  const completionRate = repayInteractions.length / loanInteractions.length;
  
  let score = 0;
  
  // Completion rate (max 60 points)
  if (completionRate >= 1.0) score += 60; // All loans repaid
  else if (completionRate >= 0.8) score += 45;
  else if (completionRate >= 0.6) score += 30;
  else if (completionRate >= 0.4) score += 20;
  else if (completionRate >= 0.2) score += 10;
  else score += 5;

  // Repayment frequency (max 40 points)
  if (repayInteractions.length >= 10) score += 40;
  else if (repayInteractions.length >= 5) score += 25;
  else if (repayInteractions.length >= 2) score += 15;
  else if (repayInteractions.length >= 1) score += 8; // Only 8 points for 1 repayment

  return Math.min(score, 100);
};

const calculateFinancialHealthScore = (plaidData: PlaidData | null, zkProofs: PrivacyProofs | null): number => {
  // ZERO TOLERANCE: No Plaid data = no score
  if (!plaidData || !zkProofs) {
    console.log('🏦 Financial Health: NO Plaid data - returning 0');
    return 0;
  }

  let score = 0;
  
  // Only count if we have REAL verified data
  if (zkProofs.incomeVerified) score += 25;
  if (zkProofs.accountBalanceVerified) score += 25;
  if (zkProofs.transactionHistoryVerified) score += 25;
  if (zkProofs.identityVerified) score += 25;

  console.log('🏦 Financial Health Score:', score);
  return score;
};

// NEW: Calculate collateral boost based on credit score and collateral diversity
const calculateCollateralBoost = (creditScore: number, collateralDiversityScore: number): number => {
  console.log('🚀 Calculating Collateral Boost:', { creditScore, collateralDiversityScore });

  // Base boost from credit score (0-15% range)
  let baseBoost = 0;
  
  if (creditScore >= 800) baseBoost = 15;
  else if (creditScore >= 750) baseBoost = 12;
  else if (creditScore >= 700) baseBoost = 10;
  else if (creditScore >= 650) baseBoost = 8;
  else if (creditScore >= 600) baseBoost = 5;
  else if (creditScore >= 550) baseBoost = 3;
  else if (creditScore >= 500) baseBoost = 1;
  else baseBoost = 0; // No boost for scores below 500

  // Bonus from collateral diversity (0-5% range)
  let diversityBonus = 0;
  if (collateralDiversityScore >= 80) diversityBonus = 5;
  else if (collateralDiversityScore >= 60) diversityBonus = 3;
  else if (collateralDiversityScore >= 40) diversityBonus = 1;

  const totalBoost = baseBoost + diversityBonus;
  
  console.log('🚀 Collateral Boost Calculation:', {
    baseBoost,
    diversityBonus,
    totalBoost
  });

  return totalBoost; // This is already a percentage (e.g., 15 means 15%)
};

export const useCreditScore = (
  creditData: CreditData | null, 
  plaidData: PlaidData | null = null, 
  zkProofs: PrivacyProofs | null = null
): CreditScoreResult & { collateralBoost: number } => {
  return useMemo(() => {
    console.log('🚀 useCreditScore: Starting calculation with REAL data only');

    // If no credit data, return minimum score
    if (!creditData) {
      console.log('❌ useCreditScore: NO credit data - returning minimum 300');
      return {
        creditScore: 300,
        factors: [],
        collateralBoost: 0 // No boost for no data
      };
    }

    const {
      walletData,
      transactionAnalysis,
      protocolInteractions = []
    } = creditData;

    // LOG ALL INPUT DATA FOR DEBUGGING
    console.log('📊 useCreditScore: RAW INPUT DATA', {
      hasWalletData: !!walletData,
      walletValue: walletData?.totalValueUSD,
      walletTokens: walletData?.tokenBalances?.length,
      hasTransactionAnalysis: !!transactionAnalysis,
      totalTransactions: transactionAnalysis?.totalTransactions,
      hasProtocolInteractions: protocolInteractions.length > 0,
      protocolInteractions
    });

    // Calculate scores with ZERO TOLERANCE
    const onChainHistoryScore = calculateOnChainHistoryScore(transactionAnalysis);
    const collateralDiversityScore = calculateCollateralDiversityScore(walletData);
    const protocolUsageScore = calculateProtocolUsageScore(protocolInteractions);
    const financialHealthScore = calculateFinancialHealthScore(plaidData, zkProofs);
    const repaymentHistoryScore = calculateRepaymentHistoryScore(protocolInteractions);

    console.log('🎯 useCreditScore: FINAL FACTOR SCORES', {
      onChainHistoryScore,
      collateralDiversityScore, 
      protocolUsageScore,
      financialHealthScore,
      repaymentHistoryScore
    });

    const factors: CreditFactor[] = [
      {
        key: 'ON_CHAIN_HISTORY',
        factor: 'On-Chain History',
        score: onChainHistoryScore,
        impact: 'high',
        description: 'Regular on-chain activity and transaction volume',
        metrics: [
          `${transactionAnalysis?.totalTransactions || 0} transactions`,
          `${transactionAnalysis?.activeMonths || 0} months active`,
          `${transactionAnalysis?.transactionVolume || 0} ETH volume`
        ]
      },
      {
        key: 'COLLATERAL_DIVERSITY',
        factor: 'Collateral Diversity',
        score: collateralDiversityScore,
        impact: 'medium',
        description: 'Variety and quality of collateral assets',
        metrics: [
          `${walletData?.tokenBalances?.length || 0} assets`,
          `$${walletData?.totalValueUSD || 0} total value`,
          collateralDiversityScore > 0 ? 'Assets found' : 'No significant assets'
        ]
      },
      {
        key: 'PROTOCOL_USAGE',
        factor: 'Lending Protocol Usage',
        score: protocolUsageScore,
        impact: 'medium',
        description: 'Active participation in DeFi lending protocols',
        metrics: [
          `${protocolInteractions.length} interactions`,
          `${new Set(protocolInteractions.map(p => p.protocol)).size} protocols`,
          protocolUsageScore > 0 ? 'Lending activity found' : 'No lending activity'
        ]
      },
      {
        key: 'FINANCIAL_HEALTH',
        factor: 'Financial Health',
        score: financialHealthScore,
        impact: 'high',
        description: 'Traditional financial health from bank data',
        metrics: plaidData ? [
          'Bank data connected',
          `${financialHealthScore > 0 ? 'Verified' : 'Unverified'}`,
          `${plaidData.accounts?.length || 0} accounts`
        ] : [
          'No bank data',
          'Connect to unlock',
          '0 points'
        ]
      },
      {
        key: 'REPAYMENT_HISTORY',
        factor: 'Repayment History',
        score: repaymentHistoryScore,
        impact: 'high',
        description: 'Track record of loan repayments',
        metrics: [
          `${protocolInteractions.filter(p => p.type === 'borrow').length} loans`,
          `${protocolInteractions.filter(p => p.type === 'repay').length} repayments`,
          repaymentHistoryScore > 0 ? 'Repayment history' : 'No repayment history'
        ]
      }
    ];

    // Calculate weighted average
    const weightedAverage = factors.reduce((total, factor) => {
      const weight = CREDIT_FACTORS[factor.key]?.weight || 0;
      return total + (factor.score * weight);
    }, 0);

    // Convert to 300-850 range
    const creditScore = Math.round(300 + (weightedAverage * 5.5));

    // Calculate collateral boost based on final credit score and collateral diversity
    const collateralBoost = calculateCollateralBoost(creditScore, collateralDiversityScore);

    console.log('🏆 useCreditScore: FINAL CREDIT SCORE', {
      weightedAverage,
      creditScore,
      collateralBoost,
      factors: factors.map(f => ({ factor: f.factor, score: f.score }))
    });

    return {
      creditScore: Math.min(Math.max(creditScore, 300), 850),
      factors,
      collateralBoost
    };
  }, [creditData, plaidData, zkProofs]);
};