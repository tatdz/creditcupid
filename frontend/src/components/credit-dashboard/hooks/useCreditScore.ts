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

// Safe number utility functions
const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const safeMinMax = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, safeNumber(value, min)));
};

const safeReduce = (array: any[], reducer: (sum: number, item: any) => number, initialValue: number = 0): number => {
  if (!Array.isArray(array)) return initialValue;
  try {
    return array.reduce(reducer, initialValue);
  } catch (error) {
    console.error('Error in safeReduce:', error);
    return initialValue;
  }
};

// Individual scoring functions with comprehensive NaN protection
const calculateOnChainHistoryScore = (transactionAnalysis: TransactionAnalysis | undefined): number => {
  console.log('🔍 Calculating On-Chain History Score:', transactionAnalysis);
  
  if (!transactionAnalysis) return 25;

  try {
    const totalTransactions = safeNumber(transactionAnalysis.totalTransactions, 0);
    const activeMonths = safeNumber(transactionAnalysis.activeMonths, 0);
    const transactionVolume = safeNumber(transactionAnalysis.transactionVolume, 0);

    // Transaction count score (max 40 points)
    const txCountScore = safeMinMax(totalTransactions / 4, 0, 40);
    
    // Activity duration score (max 30 points)
    const activityScore = safeMinMax(activeMonths * 2.5, 0, 30);
    
    // Transaction volume score (max 30 points)
    const volumeScore = safeMinMax(transactionVolume * 0.66, 0, 30);
    
    const totalScore = txCountScore + activityScore + volumeScore;
    const finalScore = safeMinMax(totalScore, 0, 100);
    
    console.log('📊 On-Chain History Score Breakdown:', {
      totalTransactions,
      activeMonths,
      transactionVolume,
      txCountScore,
      activityScore,
      volumeScore,
      totalScore,
      finalScore
    });
    
    return finalScore;
  } catch (error) {
    console.error('❌ Error calculating on-chain history score:', error);
    return 25;
  }
};

const calculateCollateralDiversityScore = (walletData: WalletData | undefined): number => {
  console.log('🔍 Calculating Collateral Diversity Score:', walletData);
  
  if (!walletData?.tokenBalances || walletData.tokenBalances.length === 0) {
    console.log('❌ No token balances found');
    return 10;
  }
  
  try {
    const tokenBalances = walletData.tokenBalances;
    
    // Log token values for debugging
    console.log('💰 Token Balances:', tokenBalances.map(t => ({
      symbol: t.symbol,
      valueUSD: t.valueUSD,
      balance: t.balance,
      isValid: !isNaN(t.valueUSD)
    })));

    // Asset count score (max 40 points)
    const assetCountScore = safeMinMax(tokenBalances.length * 10, 0, 40);
    
    // Calculate total portfolio value with safe reduction
    const totalValue = safeReduce(tokenBalances, (sum, token) => {
      const tokenValue = safeNumber(token.valueUSD, 0);
      console.log(`   ${token.symbol}: ${token.valueUSD} -> ${tokenValue}`);
      return sum + tokenValue;
    }, 0);
    
    console.log('💵 Total Portfolio Value:', totalValue);
    
    if (totalValue <= 0) {
      console.log('⚠️ Total value is 0 or negative, returning asset count only');
      return assetCountScore;
    }
    
    // Concentration risk score (max 30 points)
    const concentrations = tokenBalances.map(token => {
      const tokenValue = safeNumber(token.valueUSD, 0);
      return tokenValue / totalValue;
    });
    
    const maxConcentration = Math.max(...concentrations.filter(c => !isNaN(c)));
    const concentrationScore = safeMinMax((1 - maxConcentration) * 30, 0, 30);
    
    console.log('📊 Concentration Analysis:', {
      concentrations,
      maxConcentration,
      concentrationScore
    });
    
    // Blue-chip asset score (max 30 points)
    const blueChipAssets = ['ETH', 'WBTC', 'USDC', 'USDT', 'DAI'];
    const blueChipValue = safeReduce(
      tokenBalances.filter(token => blueChipAssets.includes(token.symbol)),
      (sum, token) => sum + safeNumber(token.valueUSD, 0),
      0
    );
    
    const blueChipRatio = blueChipValue / totalValue;
    const blueChipScore = safeMinMax(blueChipRatio * 30, 0, 30);
    
    console.log('🏦 Blue-chip Analysis:', {
      blueChipValue,
      blueChipRatio,
      blueChipScore
    });
    
    const totalScore = assetCountScore + concentrationScore + blueChipScore;
    const finalScore = safeMinMax(totalScore, 0, 100);
    
    console.log('🎯 Final Collateral Diversity Score:', {
      assetCountScore,
      concentrationScore,
      blueChipScore,
      totalScore,
      finalScore
    });
    
    return finalScore;
  } catch (error) {
    console.error('❌ Error calculating collateral diversity score:', error);
    return 20;
  }
};

const calculateProtocolUsageScore = (transactionAnalysis: TransactionAnalysis | undefined, protocolInteractions: any[] = []): number => {
  console.log('🔍 Calculating Protocol Usage Score:', { transactionAnalysis, protocolInteractions });
  
  try {
    const interactionCount = safeNumber(transactionAnalysis?.protocolInteractions, 0);
    
    // Interaction frequency score (max 50 points)
    const interactionScore = safeMinMax(interactionCount * 2, 0, 50);
    
    // Protocol diversity score (max 30 points)
    const uniqueProtocols = new Set(
      protocolInteractions
        .filter(p => p && p.protocol)
        .map(p => p.protocol)
    ).size;
    const diversityScore = safeMinMax(uniqueProtocols * 6, 0, 30);
    
    // Complexity score (max 20 points)
    const complexInteractions = protocolInteractions.filter(p => 
      p && ['borrow', 'supply', 'liquidity_add', 'liquidity_remove'].includes(p.type)
    ).length;
    const complexityScore = safeMinMax(complexInteractions * 2, 0, 20);
    
    const totalScore = interactionScore + diversityScore + complexityScore;
    const finalScore = safeMinMax(totalScore, 0, 100);
    
    console.log('📊 Protocol Usage Score Breakdown:', {
      interactionCount,
      interactionScore,
      uniqueProtocols,
      diversityScore,
      complexInteractions,
      complexityScore,
      totalScore,
      finalScore
    });
    
    return finalScore;
  } catch (error) {
    console.error('❌ Error calculating protocol usage score:', error);
    return 15;
  }
};

const calculateFinancialHealthScore = (plaidData: PlaidData | null, zkProofs: PrivacyProofs | null): number => {
  console.log('🔍 Calculating Financial Health Score:', { hasPlaidData: !!plaidData, hasZKProofs: !!zkProofs });
  
  if (!plaidData || !plaidData.accounts || !zkProofs) {
    return 0;
  }
  
  try {
    let score = 0;
    
    // Income verification (max 25 points)
    if (zkProofs.incomeVerified) {
      score += 25;
    }
    
    // Account balance strength (max 25 points)
    if (zkProofs.accountBalanceVerified && plaidData.accounts) {
      const totalBalance = safeReduce(
        plaidData.accounts,
        (sum, account) => sum + safeNumber(account.balances?.current, 0),
        0
      );
      
      if (totalBalance > 10000) score += 25;
      else if (totalBalance > 5000) score += 20;
      else if (totalBalance > 1000) score += 15;
      else score += 10;
    }
    
    // Transaction history depth (max 25 points)
    if (zkProofs.transactionHistoryVerified && plaidData.transactions) {
      const transactionCount = plaidData.transactions.length;
      if (transactionCount > 50) {
        score += 25;
      } else if (transactionCount > 20) {
        score += 15;
      } else {
        score += 10;
      }
    }
    
    // Identity verification (max 25 points)
    if (zkProofs.identityVerified) {
      score += 25;
    }
    
    const finalScore = safeMinMax(score, 0, 100);
    console.log('💰 Financial Health Score:', finalScore);
    
    return finalScore;
  } catch (error) {
    console.error('❌ Error calculating financial health score:', error);
    return 0;
  }
};

const calculateRepaymentHistoryScore = (protocolInteractions: any[] = []): number => {
  console.log('🔍 Calculating Repayment History Score:', protocolInteractions);
  
  try {
    const loanInteractions = protocolInteractions.filter(p => 
      p && (p.type === 'borrow' || p.type === 'repay')
    );
    
    const totalLoans = new Set(
      loanInteractions
        .filter(p => p.type === 'borrow')
        .map(p => p.txHash)
        .filter(Boolean)
    ).size;
    
    const repayments = loanInteractions.filter(p => p.type === 'repay').length;
    
    // Completion rate score (max 40 points)
    const completionScore = totalLoans > 0 
      ? safeMinMax((repayments / totalLoans) * 40, 0, 40)
      : 20;
    
    // Timeliness score (max 40 points)
    const timelinessScore = totalLoans > 0 ? 35 : 20;
    
    // Default avoidance score (max 20 points)
    const defaultScore = totalLoans > 0 ? 20 : 10;
    
    const totalScore = completionScore + timelinessScore + defaultScore;
    const finalScore = safeMinMax(totalScore, 0, 100);
    
    console.log('📊 Repayment History Score Breakdown:', {
      totalLoans,
      repayments,
      completionScore,
      timelinessScore,
      defaultScore,
      totalScore,
      finalScore
    });
    
    return finalScore;
  } catch (error) {
    console.error('❌ Error calculating repayment history score:', error);
    return 25;
  }
};

export const useCreditScore = (
  creditData: CreditData | null, 
  plaidData: PlaidData | null = null, 
  zkProofs: PrivacyProofs | null = null
): CreditScoreResult => {
  return useMemo(() => {
    console.log('🚀 useCreditScore Hook Executing:', { 
      hasCreditData: !!creditData,
      hasPlaidData: !!plaidData,
      hasZKProofs: !!zkProofs
    });

    // Safe default when no credit data
    if (!creditData) {
      console.log('❌ No credit data available');
      return {
        creditScore: 0,
        factors: []
      };
    }

    const {
      walletData,
      transactionAnalysis,
      protocolInteractions = []
    } = creditData;

    try {
      console.log('📊 Starting Credit Score Calculation');
      
      // Calculate individual factor scores with NaN protection
      const onChainHistoryScore = safeNumber(calculateOnChainHistoryScore(transactionAnalysis), 25);
      const collateralDiversityScore = safeNumber(calculateCollateralDiversityScore(walletData), 20);
      const protocolUsageScore = safeNumber(calculateProtocolUsageScore(transactionAnalysis, protocolInteractions), 15);
      const financialHealthScore = safeNumber(calculateFinancialHealthScore(plaidData, zkProofs), 0);
      const repaymentHistoryScore = safeNumber(calculateRepaymentHistoryScore(protocolInteractions), 25);

      console.log('🎯 Raw Factor Scores:', {
        onChainHistoryScore,
        collateralDiversityScore,
        protocolUsageScore,
        financialHealthScore,
        repaymentHistoryScore
      });

      // Create factors array with safe scores
      const factors: CreditFactor[] = [
        {
          key: 'ON_CHAIN_HISTORY',
          factor: 'On-Chain History',
          score: Math.round(onChainHistoryScore),
          impact: 'high',
          description: CREDIT_FACTORS.ON_CHAIN_HISTORY.description,
          metrics: [
            `${safeNumber(transactionAnalysis?.totalTransactions, 0)} transactions`,
            `${safeNumber(transactionAnalysis?.activeMonths, 0)} months active`,
            `${safeNumber(transactionAnalysis?.transactionVolume, 0).toFixed(1)} ETH volume`
          ]
        },
        {
          key: 'COLLATERAL_DIVERSITY',
          factor: 'Collateral Diversity',
          score: Math.round(collateralDiversityScore),
          impact: 'medium',
          description: CREDIT_FACTORS.COLLATERAL_DIVERSITY.description,
          metrics: [
            `${walletData?.tokenBalances?.length || 0} asset types`,
            `$${safeNumber(walletData?.totalValueUSD, 0).toLocaleString()} total value`,
            collateralDiversityScore >= 60 ? 'Good distribution' : 
            collateralDiversityScore >= 30 ? 'Average distribution' : 'Limited diversity'
          ]
        },
        {
          key: 'PROTOCOL_USAGE',
          factor: 'Protocol Usage',
          score: Math.round(protocolUsageScore),
          impact: 'medium',
          description: CREDIT_FACTORS.PROTOCOL_USAGE.description,
          metrics: [
            `${safeNumber(transactionAnalysis?.protocolInteractions, 0)} interactions`,
            `${new Set(protocolInteractions.map((p: any) => p.protocol)).size} protocols`,
            protocolInteractions.length > 5 ? 'Regular activity' : 'Limited activity'
          ]
        },
        {
          key: 'FINANCIAL_HEALTH',
          factor: 'Financial Health',
          score: Math.round(financialHealthScore),
          impact: 'high',
          description: CREDIT_FACTORS.FINANCIAL_HEALTH.description,
          metrics: plaidData && zkProofs ? [
            `${plaidData.accounts?.length || 0} bank accounts`,
            `$${safeReduce(plaidData.accounts || [], (sum, acc) => sum + safeNumber(acc.balances?.current, 0), 0).toLocaleString()} balance`,
            `${zkProofs.incomeVerified ? 'Income Verified' : 'Income Unverified'}`
          ] : [
            'Connect bank account',
            'To unlock this factor',
            '+100 potential points'
          ]
        },
        {
          key: 'REPAYMENT_HISTORY',
          factor: 'Repayment History',
          score: Math.round(repaymentHistoryScore),
          impact: 'high',
          description: CREDIT_FACTORS.REPAYMENT_HISTORY.description,
          metrics: [
            'On-time repayments',
            'No defaults recorded',
            'Good standing'
          ]
        }
      ];

      // Calculate weighted average score with NaN protection
      const weightedAverage = safeReduce(factors, (total, factor) => {
        const weight = CREDIT_FACTORS[factor.key]?.weight || 0;
        const factorScore = safeNumber(factor.score, 0);
        return total + (factorScore * weight);
      }, 0);

      console.log('⚖️ Weighted Average:', weightedAverage);

      // Convert to 300-850 credit score range
      const creditScore = Math.round(300 + (weightedAverage * 5.5));
      const finalScore = safeMinMax(creditScore, 300, 850);

      console.log('🏆 Final Credit Score:', finalScore);
      console.log('📈 Final Factors:', factors);

      return {
        creditScore: finalScore,
        factors
      };
    } catch (error) {
      console.error('💥 Critical error in credit score calculation:', error);
      // Fallback to using the credit score from API data if available
      return {
        creditScore: safeNumber(creditData.creditScore, 300),
        factors: []
      };
    }
  }, [creditData, plaidData, zkProofs]);
};