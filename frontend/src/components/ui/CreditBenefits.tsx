// components/ui/CreditBenefits.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { CheckCircle, Clock, Zap, Shield, Globe, Info } from 'lucide-react';

interface CreditBenefitsProps {
  benefits: any[];
  collateralBoost: number;
  creditScore: number;
  factorScores?: {
    [key: string]: number;
  };
}

// Popup component for benefit explanations
const BenefitPopup: React.FC<{
  title: string;
  content: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ title, content, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <div className="text-sm text-gray-600 space-y-2">
          {content.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CreditBenefits: React.FC<CreditBenefitsProps> = ({ 
  benefits, 
  collateralBoost, 
  creditScore,
  factorScores 
}) => {
  const [openPopup, setOpenPopup] = React.useState<string | null>(null);

  // Calculate benefits based on credit score and factor performance
  const calculateDynamicBenefits = () => {
    const collateralBoostValue = calculateCollateralBoost();
    const collateralReduction = calculateCollateralReduction();
    const rateImprovement = calculateRateImprovement();

    const baseBenefits = [
      {
        type: 'credit_boost',
        description: 'Higher valuation for your assets in lending protocols',
        value: `${collateralBoostValue}%`,
        status: creditScore >= 550 ? 'active' as const : 'pending' as const,
        eligibility: creditScore >= 550,
        formula: `Base: min(5, floor((${creditScore} - 600) / 25)) = ${Math.min(5, Math.floor((creditScore - 600) / 25))}
Collateral Bonus: floor((${factorScores?.COLLATERAL_DIVERSITY || 0} - 50) / 20) = ${Math.floor(((factorScores?.COLLATERAL_DIVERSITY || 0) - 50) / 20)}
Total: ${collateralBoostValue}%`
      },
      {
        type: 'lower_requirements',
        description: 'Reduced collateral needed for borrowing',
        value: `${collateralReduction}% less`,
        status: creditScore >= 600 ? 'active' as const : 'pending' as const,
        eligibility: creditScore >= 600,
        formula: `Credit Score: ${creditScore}
Tier: ${getCollateralTier(creditScore)}
Reduction: ${collateralReduction}%`
      },
      {
        type: 'better_rates',
        description: 'Improved borrowing and lending rates',
        value: `${rateImprovement}% better`,
        status: creditScore >= 700 ? 'active' as const : 'pending' as const,
        eligibility: creditScore >= 700,
        formula: `Base: min(0.3, (${creditScore} - 600) × 0.002) = ${Math.min(0.3, (creditScore - 600) * 0.002).toFixed(3)}
Protocol Bonus: floor((${factorScores?.PROTOCOL_USAGE || 0} - 60) / 10) × 0.01 = ${(Math.floor(((factorScores?.PROTOCOL_USAGE || 0) - 60) / 10) * 0.01).toFixed(3)}
Total: ${rateImprovement}%`
      },
      {
        type: 'cross_chain',
        description: 'Major EVM chains recognition',
        value: '10+ chains',
        status: 'active' as const,
        eligibility: true,
        formula: 'Automatic recognition across Ethereum, Polygon, Arbitrum, Optimism, Base, and other major EVM chains'
      }
    ];

    return baseBenefits;
  };

  const getCollateralTier = (score: number): string => {
    if (score >= 800) return 'Excellent (800+)';
    if (score >= 750) return 'Very Good (750-799)';
    if (score >= 700) return 'Good (700-749)';
    if (score >= 650) return 'Fair (650-699)';
    if (score >= 600) return 'Basic (600-649)';
    return 'Below Minimum (Under 600)';
  };

  const calculateCollateralBoost = (): number => {
    // Base boost + bonus from collateral diversity score
    const baseBoost = Math.min(5, Math.floor((creditScore - 600) / 25));
    const collateralBonus = factorScores?.COLLATERAL_DIVERSITY 
      ? Math.floor((factorScores.COLLATERAL_DIVERSITY - 50) / 20)
      : 0;
    
    return Math.max(0.5, baseBoost + collateralBonus);
  };

  const calculateCollateralReduction = (): number => {
    // Reduction in collateral requirements based on credit score
    if (creditScore >= 800) return 15;
    if (creditScore >= 750) return 12;
    if (creditScore >= 700) return 10;
    if (creditScore >= 650) return 7;
    if (creditScore >= 600) return 5;
    return 0;
  };

  const calculateRateImprovement = (): number => {
    // Interest rate improvement in basis points
    const protocolUsageBonus = factorScores?.PROTOCOL_USAGE 
      ? Math.floor((factorScores.PROTOCOL_USAGE - 60) / 10) * 0.01
      : 0;
    
    const baseImprovement = Math.min(0.3, (creditScore - 600) * 0.002);
    return Math.max(0, Number((baseImprovement + protocolUsageBonus).toFixed(2)));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Zap className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'credit_boost':
        return <Zap className="h-4 w-4 text-blue-600" />;
      case 'lower_requirements':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'better_rates':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'cross_chain':
        return <Globe className="h-4 w-4 text-orange-600" />;
      default:
        return <Zap className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBenefitExplanation = (benefit: any) => {
    switch (benefit.type) {
      case 'credit_boost':
        return {
          title: 'Higher Valuation Calculation',
          content: `This benefit increases how much your collateral is worth in lending protocols.\n\nFormula:\n${benefit.formula}\n\nStatus: ${benefit.eligibility ? 'ACTIVE' : 'PENDING'}\nMinimum Score: 550\nYour Score: ${creditScore}\n\nWhy ${benefit.eligibility ? 'Active' : 'Pending'}: ${benefit.eligibility ? 'Your credit score meets the minimum requirement for this benefit.' : 'Your credit score is below the minimum threshold. Improve your on-chain history and collateral diversity to unlock this benefit.'}`
        };
      case 'lower_requirements':
        return {
          title: 'Reduced Collateral Calculation',
          content: `This benefit reduces how much collateral you need to provide for borrowing.\n\nFormula:\n${benefit.formula}\n\nStatus: ${benefit.eligibility ? 'ACTIVE' : 'PENDING'}\nMinimum Score: 600\nYour Score: ${creditScore}\n\nWhy ${benefit.eligibility ? 'Active' : 'Pending'}: ${benefit.eligibility ? `Your credit score qualifies you for the ${benefit.value} reduction tier.` : 'You need a minimum credit score of 600 to access collateral reduction benefits.'}`
        };
      case 'better_rates':
        return {
          title: 'Improved Rates Calculation',
          content: `This benefit gives you better interest rates when borrowing and lending.\n\nFormula:\n${benefit.formula}\n\nStatus: ${benefit.eligibility ? 'ACTIVE' : 'PENDING'}\nMinimum Score: 700\nYour Score: ${creditScore}\n\nWhy ${benefit.eligibility ? 'Active' : 'Pending'}: ${benefit.eligibility ? 'Your excellent credit score qualifies you for premium interest rates.' : 'You need a credit score of 700+ to access improved interest rates. Focus on protocol usage and repayment history.'}`
        };
      case 'cross_chain':
        return {
          title: 'Major EVM Chains Recognition',
          content: `Your credit profile is recognized across 10+ major EVM chains.\n\nCoverage: Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC, Gnosis, zkSync, Linea, and more.\n\nStatus: ACTIVE\nRequirement: Connected Wallet\n\nThis benefit is automatically active for all connected users and allows you to use your credit profile seamlessly across all supported chains without rebuilding reputation.`
        };
      default:
        return {
          title: benefit.description,
          content: benefit.formula
        };
    }
  };

  const getCollateralBoostExplanation = () => {
    return {
      title: 'Collateral Boost Calculation',
      content: `Your collateral gets enhanced valuation based on creditworthiness.\n\nCurrent Boost: +${(collateralBoost * 100).toFixed(1)}%\n\nCalculation Factors:\n• Credit Score: ${creditScore}\n• Collateral Diversity: ${factorScores?.COLLATERAL_DIVERSITY || 0}/100\n• Asset Quality: Blue-chip assets preferred\n• Historical Performance: Consistent on-chain activity\n\nThis boost increases the effective value of your collateral in lending protocols, allowing you to borrow more against the same assets.`
    };
  };

  const dynamicBenefits = calculateDynamicBenefits();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Benefits</CardTitle>
        <CardDescription>
          Advantages based on your credit profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dynamicBenefits.map((benefit, index) => {
            const explanation = getBenefitExplanation(benefit);
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {getBenefitIcon(benefit.type)}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {benefit.description}
                      <button
                        onClick={() => setOpenPopup(`benefit-${benefit.type}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">{benefit.value}</div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  benefit.eligibility 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {benefit.eligibility ? 'Active' : 'Pending'}
                </div>

                <BenefitPopup
                  title={explanation.title}
                  content={explanation.content}
                  isOpen={openPopup === `benefit-${benefit.type}`}
                  onClose={() => setOpenPopup(null)}
                />
              </div>
            );
          })}
          
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="font-medium text-blue-900 flex items-center gap-2">
                Collateral Boost
                <button
                  onClick={() => setOpenPopup('collateral-boost')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Info className="h-3 w-3" />
                </button>
              </div>
              <div className="text-blue-700 font-semibold">
                +{(collateralBoost * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-sm text-blue-800 mt-1">
              Enhanced valuation for your assets
            </div>

            <BenefitPopup
              title={getCollateralBoostExplanation().title}
              content={getCollateralBoostExplanation().content}
              isOpen={openPopup === 'collateral-boost'}
              onClose={() => setOpenPopup(null)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};