// CreditScoreBreakdown.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Calculator } from 'lucide-react';

interface CreditFactor {
  key: string;
  factor: string;
  score: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
  metrics: string[];
}

interface CreditScoreBreakdownProps {
  factors: CreditFactor[];
  creditScore: number;
}

const CREDIT_FACTORS = {
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
} as const;

export const CreditScoreBreakdown: React.FC<CreditScoreBreakdownProps> = ({ factors, creditScore }) => {
  // Safe factor processing
  const safeFactors = factors.map(factor => ({
    ...factor,
    score: isNaN(factor.score) ? 0 : Math.max(0, Math.min(100, factor.score))
  }));

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
        <div className="space-y-4">
          {safeFactors.map((factor, index) => {
            const factorConfig = CREDIT_FACTORS[factor.key as keyof typeof CREDIT_FACTORS];
            const weightedContribution = factor.score * factorConfig.weight;
            const scoreContribution = Math.round(weightedContribution * 5.5);
            const displayScore = isNaN(factor.score) ? 0 : factor.score;
            
            return (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{factor.factor}</h4>
                    <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {displayScore}/100
                    </div>
                    <div className="text-sm text-gray-500">{Math.round(factorConfig.weight * 100)}% weight</div>
                    <div className="text-xs text-green-600">
                      +{isNaN(scoreContribution) ? 0 : scoreContribution} points
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${displayScore}%` }}
                  />
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {factor.metrics.map((metric: string, idx: number) => (
                    <span key={idx} className="text-xs bg-white px-2 py-1 rounded border">
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {creditScore && !isNaN(creditScore) && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-green-900">Final Credit Score</h4>
                <p className="text-sm text-green-700">
                  Base (300) + Weighted Contributions = {creditScore}/850
                </p>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {creditScore}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};