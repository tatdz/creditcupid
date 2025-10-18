// components/credit-dashboard/components/CreditScoreBreakdownPanel.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { ExternalLink, Calculator, Wallet, Layers, Cpu, History, AlertCircle, Info } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useBlockscoutData } from '../hooks/useBlockscoutData';
import { PlaidData, PrivacyProofs } from '../../../types/credit';

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
  privacyProofs: PrivacyProofs | null;
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

export const CreditScoreBreakdownPanel: React.FC<CreditScoreBreakdownPanelProps> = ({ 
  factors, 
  creditScore,
  plaidData,
  privacyProofs
}) => {
  const { address, isConnected, chain } = useAccount();
  
  const {
    transactionHistory,
    protocolInteractions,
    repaymentHistory,
    loading,
    error,
    blockscoutUrl
  } = useBlockscoutData(address, chain?.id.toString() || '1');

  // Calculate real metrics for each factor
  const enhancedFactors = factors.map(factor => {
    let realMetrics: string[] = [];
    let realDescription = factor.description;
    let blockscoutLink: string | null = null;
    let showInfoDialog = false;

    switch (factor.key) {
      case 'ON_CHAIN_HISTORY':
        const activeMonths = getActiveMonths(transactionHistory);
        const totalVolume = getTransactionVolume(transactionHistory);
        realMetrics = [
          `${transactionHistory.length} transactions`,
          `${activeMonths} months active`,
          `${totalVolume.toFixed(4)} ETH volume`
        ];
        blockscoutLink = `${blockscoutUrl}?tab=transactions`;
        break;

      case 'COLLATERAL_DIVERSITY':
        const uniqueAssets = getUniqueAssets(transactionHistory);
        const collateralValue = getCollateralValue(transactionHistory);
        realMetrics = [
          `${uniqueAssets.length} token types`,
          `$${collateralValue.toLocaleString()} total value`,
          uniqueAssets.length >= 3 ? 'Diverse portfolio' : 'Limited diversity'
        ];
        // Show actual tokens in description
        if (uniqueAssets.length > 0) {
          realDescription = `Assets: ${uniqueAssets.slice(0, 3).map(asset => asset.symbol).join(', ')}${uniqueAssets.length > 3 ? '...' : ''}`;
        }
        blockscoutLink = `${blockscoutUrl}?tab=tokens`;
        break;

      case 'PROTOCOL_USAGE':
        // Rename to Lending Protocol Usage
        const morphoInteractions = protocolInteractions.filter(p => p.protocol === 'morpho' && p.type !== 'repay');
        const aaveInteractions = protocolInteractions.filter(p => p.protocol === 'aave' && p.type !== 'repay');
        const uniqueProtocols = new Set(protocolInteractions.map(p => p.protocol)).size;
        realMetrics = [
          `${protocolInteractions.length} total interactions`,
          `${morphoInteractions.length} Morpho, ${aaveInteractions.length} Aave`,
          `${uniqueProtocols} protocols used`
        ];
        realDescription = 'Active participation in lending protocols (Morpho & Aave)';
        
        // Only create link if there are interactions
        if (protocolInteractions.length > 0) {
          blockscoutLink = `${blockscoutUrl}?tab=transactions`;
        } else {
          showInfoDialog = true;
        }
        break;

      case 'REPAYMENT_HISTORY':
        const morphoRepayments = repaymentHistory.filter(r => r.protocol === 'morpho');
        const aaveRepayments = repaymentHistory.filter(r => r.protocol === 'aave');
        const totalRepayments = repaymentHistory.length;
        realMetrics = [
          `${totalRepayments} total repayments`,
          `${morphoRepayments.length} Morpho, ${aaveRepayments.length} Aave`,
          totalRepayments > 0 ? 'Good repayment history' : 'No repayment history'
        ];
        realDescription = 'Track record of loan repayments on Morpho & Aave';
        
        // Only create link if there are repayments
        if (repaymentHistory.length > 0) {
          blockscoutLink = `${blockscoutUrl}?tab=transactions`;
        } else {
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
          showInfoDialog = true; // Always show info dialog for Financial Health
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
      factor: factor.key === 'PROTOCOL_USAGE' ? 'Lending Protocol Usage' : factor.factor,
      metrics: realMetrics,
      description: realDescription,
      blockscoutLink,
      showInfoDialog,
      realData: getRealDataForFactor(factor.key, {
        transactionHistory,
        protocolInteractions,
        repaymentHistory,
        plaidData
      })
    };
  });

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Credit Score Breakdown
          </CardTitle>
          <CardDescription>
            Connect your wallet to view your credit score breakdown
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Credit Score Breakdown
          </CardTitle>
          <CardDescription>
            Analyzing your on-chain activity via Blockscout...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Credit Score Breakdown
          </CardTitle>
          <CardDescription>
            Unable to fetch on-chain data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Credit Score Breakdown
        </CardTitle>
        <CardDescription>
          How your credit score is calculated across different factors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {enhancedFactors.map((factor, index) => (
            <CreditFactorCard 
              key={factor.key} 
              factor={factor}
            />
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Scoring Formula</h4>
          <p className="text-sm text-blue-700 mb-2">
            Credit score = 300 + (On-Chain History × 25% + Collateral Diversity × 20% + 
            Lending Protocol Usage × 15% + Financial Health × 25% + Repayment History × 15%) × 5.5
          </p>
          <p className="text-xs text-blue-600">
            Range 300-850 follows traditional FICO scoring for familiarity. 300 represents minimum score, 850 represents excellent credit.
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
    blockscoutLink: string | null;
    showInfoDialog: boolean;
  };
}

const CreditFactorCard: React.FC<CreditFactorCardProps> = ({ factor }) => {
  const getFactorIcon = (key: string) => {
    switch (key) {
      case 'ON_CHAIN_HISTORY':
        return <Wallet className="h-4 w-4" />;
      case 'COLLATERAL_DIVERSITY':
        return <Layers className="h-4 w-4" />;
      case 'PROTOCOL_USAGE':
        return <Cpu className="h-4 w-4" />;
      case 'REPAYMENT_HISTORY':
        return <History className="h-4 w-4" />;
      case 'FINANCIAL_HEALTH':
        return <Calculator className="h-4 w-4" />;
      default:
        return <Calculator className="h-4 w-4" />;
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
      case 'ON_CHAIN_HISTORY': return '25%';
      case 'COLLATERAL_DIVERSITY': return '20%';
      case 'PROTOCOL_USAGE': return '15%';
      case 'FINANCIAL_HEALTH': return '25%';
      case 'REPAYMENT_HISTORY': return '15%';
      default: return '0%';
    }
  };

  const getInfoDialogContent = (key: string) => {
    switch (key) {
      case 'PROTOCOL_USAGE':
        return {
          title: 'Lending Protocol Usage',
          content: 'We track your interactions with Morpho and Aave lending protocols across all supported chains. This includes supply, withdraw, borrow, liquidate, and flash loan operations, but excludes repayments (which are tracked separately).'
        };
      case 'REPAYMENT_HISTORY':
        return {
          title: 'Repayment History',
          content: 'We monitor your loan repayments on Morpho and Aave protocols across all supported chains. Timely repayments improve your credit score, while missed payments negatively impact it.'
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
    <div className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            {getFactorIcon(factor.key)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{factor.factor}</h4>
              
              {factor.showInfoDialog ? (
                <InfoDialog title={infoContent.title} content={infoContent.content} />
              ) : factor.blockscoutLink ? (
                <a 
                  href={factor.blockscoutLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
            <p className="text-sm text-gray-600">{factor.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${color.text}`}>
            {factor.score}/100
          </div>
          <div className="text-sm text-gray-500">{weight} weight</div>
          <div className="text-xs text-gray-400 capitalize">{factor.impact} impact</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color.bg}`}
          style={{ width: `${factor.score}%` }}
        />
      </div>
      
      {/* Metrics */}
      <div className="flex flex-wrap gap-1 mb-3">
        {factor.metrics.map((metric: string, idx: number) => (
          <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
            {metric}
          </span>
        ))}
      </div>
    </div>
  );
};

// Helper functions (keep the same as before)
const getRealDataForFactor = (factorKey: string, data: any) => {
  switch (factorKey) {
    case 'ON_CHAIN_HISTORY':
      return data.transactionHistory?.slice(0, 3) || [];
    case 'COLLATERAL_DIVERSITY':
      return getUniqueAssets(data.transactionHistory).slice(0, 3);
    case 'PROTOCOL_USAGE':
      return data.protocolInteractions?.slice(0, 3) || [];
    case 'REPAYMENT_HISTORY':
      return data.repaymentHistory?.slice(0, 3) || [];
    case 'FINANCIAL_HEALTH':
      return data.plaidData?.transactions?.slice(0, 3) || [];
    default:
      return [];
  }
};

const getActiveMonths = (transactions: any[]): number => {
  if (!transactions || transactions.length === 0) return 0;
  const months = new Set();
  transactions.forEach(tx => {
    if (tx.timestamp) {
      const date = new Date(tx.timestamp * 1000);
      months.add(`${date.getFullYear()}-${date.getMonth()}`);
    }
  });
  return months.size;
};

const getTransactionVolume = (transactions: any[]): number => {
  if (!transactions) return 0;
  return transactions.reduce((total, tx) => {
    const value = parseFloat(tx.value) || 0;
    return total + (value / 1e18); // Convert from wei to ETH
  }, 0);
};

const getUniqueAssets = (transactions: any[]): any[] => {
  if (!transactions) return [];
  const assets: any[] = [];
  const seen = new Set();
  
  transactions.forEach(tx => {
    if (tx.tokenTransfers) {
      tx.tokenTransfers.forEach((transfer: any) => {
        if (transfer.token && !seen.has(transfer.token.address)) {
          seen.add(transfer.token.address);
          assets.push({
            symbol: transfer.token.symbol || 'Unknown',
            address: transfer.token.address,
            value: transfer.value
          });
        }
      });
    }
  });
  
  return assets;
};

const getCollateralValue = (transactions: any[]): number => {
  if (!transactions) return 0;
  let total = 0;
  
  // This would need actual price data from an oracle
  // For now, we'll estimate based on transaction values
  transactions.forEach(tx => {
    const value = parseFloat(tx.value) || 0;
    total += value / 1e18; // Convert from wei to ETH
  });
  
  // Rough estimate: assume $2000 per ETH
  return total * 2000;
};