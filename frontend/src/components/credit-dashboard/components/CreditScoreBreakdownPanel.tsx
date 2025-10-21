// components/credit-dashboard/components/CreditScoreBreakdownPanel.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { ExternalLink, Calculator, Wallet, Layers, Cpu, History, AlertCircle, Info } from 'lucide-react';
import { useAccount } from 'wagmi';
import { PlaidData, StoredPrivacyProofs } from '../../../types/credit';
import { getChainConfig } from '../../../config/chains';
import { apiService, OnChainData } from '../../../utils/api';

interface CreditScoreBreakdownPanelProps {
  factors: Array<{
    key: string;
    factor: string;
    score: number;
    impact: 'high' | 'medium' | 'low';
    description: string;
    metrics: string[];
  }>;
  creditScore: number;
  plaidData: PlaidData | null;
  privacyProofs: StoredPrivacyProofs | null;
}

// Simple dialog component for our use case
const InfoDialog: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-800"
      >
        <Info className="h-3 w-3" />
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <p className="text-sm text-gray-600">{content}</p>
          </div>
        </div>
      )}
    </>
  );
};

// Single link component for Onchain Activity
const OnchainActivityLink: React.FC<{ 
  address: string;
  chainId: string | number;
}> = ({ address, chainId }) => {
  const chain = getChainConfig(chainId);
  const blockscoutUrl = `${chain.blockscoutUrl}/address/${address}`;
  const apiUrl = `${chain.blockscoutUrl}/api?module=account&action=eth_get_balance&address=${address}`;

  return (
    <div className="flex flex-col gap-1">
      <a 
        href={blockscoutUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
      >
        View Activity on Blockscout <ExternalLink className="h-3 w-3" />
      </a>
      <a 
        href={apiUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs"
      >
      </a>
    </div>
  );
};

export const CreditScoreBreakdownPanel: React.FC<CreditScoreBreakdownPanelProps> = ({ 
  factors, 
  creditScore,
  plaidData,
  privacyProofs
}) => {
  const { address, isConnected, chain } = useAccount();
  const [onChainData, setOnChainData] = useState<OnChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use Sepolia as default (chain ID 11155111)
  const chainId = chain?.id || 11155111;
  const chainConfig = getChainConfig(chainId);

  useEffect(() => {
    const fetchOnChainData = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getOnChainData(address, chainId);
        setOnChainData(data);
      } catch (error) {
        console.error('Failed to fetch on-chain data:', error);
        setError('Failed to fetch on-chain data from Blockscout API');
      } finally {
        setLoading(false);
      }
    };

    fetchOnChainData();
  }, [address, chainId]);

  // Calculate real metrics for each factor
  const enhancedFactors = factors.map(factor => {
    let realMetrics: string[] = [];
    let realDescription = factor.description;
    let showInfoDialog = false;
    let transactionHashes: string[] = [];

    switch (factor.key) {
      case 'ON_CHAIN_HISTORY':
        // Rename to "Onchain Activity"
        const transactionCount = onChainData?.transactions.length || 0;
        const monthsActive = onChainData?.monthsActive || 0;
        const totalVolume = onChainData?.totalVolume || 0;
        
        realMetrics = [
          `${transactionCount} transactions`,
          `${monthsActive} months active`,
          `${totalVolume.toFixed(4)} ETH volume`
        ];
        // Get first 3 transaction hashes for linking
        transactionHashes = onChainData?.transactions.slice(0, 3).map(tx => tx.hash) || [];
        break;

      case 'COLLATERAL_DIVERSITY':
        // Remove Wallet Balance factor - we'll filter this out
        return null;

      case 'PROTOCOL_USAGE':
        // Lending Protocol Usage
        const totalInteractions = onChainData?.lendingInteractions.length || 0;
        const morphoInteractions = onChainData?.lendingInteractions.filter(p => p.protocol === 'Morpho') || [];
        const aaveInteractions = onChainData?.lendingInteractions.filter(p => p.protocol === 'Aave') || [];
        const uniqueProtocols = new Set(onChainData?.lendingInteractions.map(p => p.protocol) || []).size;
        
        realMetrics = [
          `${totalInteractions} total interactions`,
          `${morphoInteractions.length} Morpho, ${aaveInteractions.length} Aave`,
          `${uniqueProtocols} protocols used`
        ];
        realDescription = 'Active participation in lending protocols (Morpho & Aave)';
        
        // Get transaction hashes for protocol interactions
        transactionHashes = onChainData?.lendingInteractions.slice(0, 3).map(interaction => interaction.hash) || [];
        
        if (totalInteractions === 0) {
          showInfoDialog = true;
        }
        break;

      case 'REPAYMENT_HISTORY':
        const repayments = onChainData?.lendingInteractions.filter(p => p.type === 'repay') || [];
        const morphoRepayments = repayments.filter(r => r.protocol === 'Morpho');
        const aaveRepayments = repayments.filter(r => r.protocol === 'Aave');
        const totalRepayments = repayments.length;
        
        realMetrics = [
          `${totalRepayments} total repayments`,
          `${morphoRepayments.length} Morpho, ${aaveRepayments.length} Aave`,
          totalRepayments > 0 ? 'Good repayment history' : 'No repayment history'
        ];
        realDescription = 'Track record of loan repayments on Morpho & Aave';
        
        // Get transaction hashes for repayments
        transactionHashes = repayments.slice(0, 3).map(repayment => repayment.hash);
        
        if (repayments.length === 0) {
          showInfoDialog = true;
        }
        break;

      case 'FINANCIAL_HEALTH':
        if (plaidData && privacyProofs) {
          realMetrics = [
            privacyProofs.incomeVerified ? 'Income verified' : 'Income not verified',
            privacyProofs.accountBalanceVerified ? 'Balance verified' : 'Balance not verified',
            privacyProofs.transactionHistoryVerified ? 'History verified' : 'History not verified',
            privacyProofs.identityVerified ? 'Identity verified' : 'Identity not verified'
          ];
          realDescription = 'Web2 financial health from verified bank data';
          showInfoDialog = true;
        } else {
          realMetrics = [
            'Connect bank account via Plaid',
            'To unlock Web2 financial data',
            '+100 potential credit points'
          ];
        }
        break;

      default:
        realMetrics = factor.metrics;
    }

    return {
      ...factor,
      factor: factor.key === 'ON_CHAIN_HISTORY' ? 'Onchain Activity' : 
              factor.key === 'PROTOCOL_USAGE' ? 'Lending Protocol Usage' : factor.factor,
      metrics: realMetrics,
      description: realDescription,
      transactionHashes,
      showInfoDialog,
      realData: getRealDataForFactor(factor.key, onChainData, plaidData)
    };
  }).filter(factor => factor !== null); // Remove Wallet Balance factor

  // Calculate actual credit score based on real data with new weights
  const calculateRealScore = () => {
    if (!onChainData) return creditScore;

    const weights = {
      onchainActivity: 0.35,      // 35% weight
      lendingUsage: 0.15,         // 15% weight
      financialHealth: 0.35,      // 35% weight
      repaymentHistory: 0.15      // 15% weight
    };

    // Calculate individual scores (0-100 scale)
    const onchainActivityScore = Math.min(100, (onChainData.transactions.length / 500) * 100);
    const lendingUsageScore = Math.min(100, (onChainData.lendingInteractions.length / 50) * 100);
    
    // Use Plaid verification status for financial health if available
    const financialHealthScore = privacyProofs ? 
      (privacyProofs.incomeVerified ? 80 : 40) + // Base score based on income verification
      (privacyProofs.accountBalanceVerified ? 10 : 0) +
      (privacyProofs.transactionHistoryVerified ? 10 : 0) :
      Math.min(100, (onChainData.walletBalance / 5000) * 100); // Use wallet balance as fallback
    
    const repaymentHistoryScore = Math.min(100, ((onChainData.lendingInteractions.filter(i => i.type === 'repay').length) / 20) * 100);

    // Apply new scoring formula: 300 + (weighted average × 5.5)
    const weightedScore = (
      onchainActivityScore * weights.onchainActivity +
      lendingUsageScore * weights.lendingUsage +
      financialHealthScore * weights.financialHealth +
      repaymentHistoryScore * weights.repaymentHistory
    );

    return Math.round(300 + weightedScore * 5.5);
  };

  const realCreditScore = calculateRealScore();

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-4 w-4" />
            Credit Score Breakdown
          </CardTitle>
          <CardDescription className="text-sm">
            Connect your wallet to view your credit score breakdown
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-4 w-4" />
            Credit Score Breakdown
          </CardTitle>
          <CardDescription className="text-sm">
            Analyzing your onchain activity via Blockscout...
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-4 w-4" />
            Credit Score Breakdown
          </CardTitle>
          <CardDescription className="text-sm">
            Unable to fetch onchain data
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="text-center text-red-600">
            <AlertCircle className="h-6 w-6 mx-auto mb-1" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-4 w-4" />
          Credit Score Breakdown
        </CardTitle>
        <CardDescription className="text-sm">
          How your credit score is calculated across different factors
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {enhancedFactors.map((factor, index) => (
            <CreditFactorCard 
              key={factor.key} 
              factor={factor}
              chainId={chainId}
              address={address}
            />
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-1 text-sm">Scoring Formula</h4>
          <p className="text-xs text-blue-700 mb-1">
            Credit score = 300 + (Onchain Activity × 35% + Lending Protocol Usage × 15% + Financial Health × 35% + Repayment History × 15%) × 5.5
          </p>
          <p className="text-xs text-blue-600">
            Current calculated score: <strong>{realCreditScore}</strong> (based on real Sepolia data)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Individual factor card component
interface CreditFactorCardProps {
  factor: {
    key: string;
    factor: string;
    score: number;
    impact: 'high' | 'medium' | 'low';
    description: string;
    metrics: string[];
    realData: any[];
    transactionHashes: string[];
    showInfoDialog: boolean;
  };
  chainId: string | number;
  address: string | undefined;
}

const CreditFactorCard: React.FC<CreditFactorCardProps> = ({ 
  factor, 
  chainId,
  address
}) => {
  const getFactorIcon = (key: string) => {
    switch (key) {
      case 'ON_CHAIN_HISTORY':
        return <History className="h-3 w-3" />;
      case 'PROTOCOL_USAGE':
        return <Cpu className="h-3 w-3" />;
      case 'REPAYMENT_HISTORY':
        return <Layers className="h-3 w-3" />;
      case 'FINANCIAL_HEALTH':
        return <Calculator className="h-3 w-3" />;
      default:
        return <Calculator className="h-3 w-3" />;
    }
  };

  const getFactorColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-500' };
    if (score >= 60) return { text: 'text-blue-600', bg: 'bg-blue-500' };
    if (score >= 40) return { text: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { text: 'text-red-600', bg: 'bg-red-500' };
  };

  const getWeight = (key: string): string => {
    switch (key) {
      case 'ON_CHAIN_HISTORY': return '35%';
      case 'PROTOCOL_USAGE': return '15%';
      case 'FINANCIAL_HEALTH': return '35%';
      case 'REPAYMENT_HISTORY': return '15%';
      default: return '0%';
    }
  };

  const getInfoDialogContent = (key: string) => {
    switch (key) {
      case 'PROTOCOL_USAGE':
        return {
          title: 'Lending Protocol Usage',
          content: 'We track your interactions with Morpho and Aave lending protocols on Sepolia. This includes supply, withdraw, borrow, and liquidate operations using real Blockscout API data.'
        };
      case 'REPAYMENT_HISTORY':
        return {
          title: 'Repayment History',
          content: 'We monitor your loan repayments on Morpho and Aave protocols on Sepolia. Timely repayments improve your credit score. Uses real transaction data from Blockscout.'
        };
      case 'FINANCIAL_HEALTH':
        return {
          title: 'Web2 Financial Health',
          content: 'Based on Plaid verification: Income stability (consistent income over 90 days), Account balance (minimum $1,000), Transaction history (90+ days of activity), Identity verification (KYC completed).'
        };
      default:
        return {
          title: factor.factor,
          content: factor.description
        };
    }
  };

  const color = getFactorColor(factor.score);
  const weight = getWeight(factor.key);
  const infoContent = getInfoDialogContent(factor.key);

  return (
    <div className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2 flex-1">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            {getFactorIcon(factor.key)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <h4 className="font-semibold text-sm">{factor.factor}</h4>
              
              {factor.showInfoDialog ? (
                <InfoDialog title={infoContent.title} content={infoContent.content} />
              ) : factor.key === 'ON_CHAIN_HISTORY' && address ? (
                <OnchainActivityLink address={address} chainId={chainId} />
              ) : factor.transactionHashes.length > 0 ? (
                <div className="flex gap-1">
                  {factor.transactionHashes.slice(0, 2).map((hash, index) => (
                    <a 
                      key={hash}
                      href={apiService.getExplorerUrl(chainId, 'tx', hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                    >
                      View TX <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ))}
                  {factor.transactionHashes.length > 2 && (
                    <span className="text-xs text-gray-500">+{factor.transactionHashes.length - 2} more</span>
                  )}
                </div>
              ) : null}
            </div>
            <p className="text-xs text-gray-600">{factor.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-base font-bold ${color.text}`}>
            {factor.score}/100
          </div>
          <div className="text-xs text-gray-500">{weight} weight</div>
          <div className="text-xs text-gray-400 capitalize">{factor.impact} impact</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div 
          className={`h-1.5 rounded-full transition-all duration-500 ${color.bg}`}
          style={{ width: `${factor.score}%` }}
        />
      </div>
      
      {/* Metrics */}
      <div className="flex flex-wrap gap-1">
        {factor.metrics.map((metric: string, idx: number) => (
          <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
            {metric}
          </span>
        ))}
      </div>
    </div>
  );
};

// Helper functions
const getRealDataForFactor = (factorKey: string, onChainData: OnChainData | null, plaidData: any) => {
  if (!onChainData) return [];

  switch (factorKey) {
    case 'ON_CHAIN_HISTORY':
      return onChainData.transactions.slice(0, 3);
    case 'PROTOCOL_USAGE':
      return onChainData.lendingInteractions.slice(0, 3);
    case 'REPAYMENT_HISTORY':
      return onChainData.lendingInteractions.filter(i => i.type === 'repay').slice(0, 3);
    case 'FINANCIAL_HEALTH':
      return plaidData?.transactions?.slice(0, 3) || [];
    default:
      return [];
  }
};