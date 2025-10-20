import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Scale, Zap } from 'lucide-react';

interface ProtocolComparisonProps {
  userCreditScore: number;
}

export const ProtocolComparison: React.FC<ProtocolComparisonProps> = ({ userCreditScore }) => {
  // Calculate LTV based on credit score
  const calculateMaxLTV = (creditScore: number): number => {
    if (creditScore >= 800) return 85;
    if (creditScore >= 750) return 80;
    if (creditScore >= 700) return 75;
    if (creditScore >= 650) return 70;
    return 60;
  };

  // Calculate interest rate based on credit score (lower score = higher rate)
  const calculateInterestRate = (creditScore: number): number => {
    const baseRate = 3.5; // Base rate for excellent credit
    if (creditScore >= 800) return baseRate;
    if (creditScore >= 750) return baseRate + 0.5;
    if (creditScore >= 700) return baseRate + 1.0;
    if (creditScore >= 650) return baseRate + 2.0;
    return baseRate + 4.0;
  };

  const userLTV = calculateMaxLTV(userCreditScore);
  const userRate = calculateInterestRate(userCreditScore);

  const protocolComparison = [
    {
      protocol: 'CreditCupid',
      borrowRate: `${userRate.toFixed(1)}%`,
      collateralFactor: `Up to ${userLTV}%`,
      maxLTV: `${userLTV}%`,
      requirements: `Credit Score ${userCreditScore}`,
      benefits: 'Personalized rates based on credit score',
      bestFor: 'Credit-based lending',
      description: `Based on your credit score of ${userCreditScore}`
    },
    {
      protocol: 'Morpho',
      borrowRate: '4.2%',
      collateralFactor: 'Up to 80%',
      maxLTV: '75%',
      requirements: 'Standard verification',
      benefits: 'Optimized rates via peer-to-peer',
      bestFor: 'Efficient rate seekers',
      description: 'Standard DeFi lending platform'
    },
    {
      protocol: 'Aave',
      borrowRate: '3.8%',
      collateralFactor: 'Up to 85%',
      maxLTV: '80%',
      requirements: 'Standard verification',
      benefits: 'Liquidity pool based',
      bestFor: 'Liquidity access',
      description: 'Leading DeFi lending protocol'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Platform Comparison
        </CardTitle>
        <CardDescription>
          See how CreditCupid compares to traditional DeFi lending platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {protocolComparison.map((protocol, index) => (
            <div key={index} className={`border rounded-lg p-4 ${
              protocol.protocol === 'CreditCupid' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold text-lg ${
                  protocol.protocol === 'CreditCupid' ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {protocol.protocol}
                </h3>
                {protocol.protocol === 'CreditCupid' && (
                  <Zap className="h-5 w-5 text-blue-600" />
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Borrow Rate:</span>
                  <span className="font-semibold">{protocol.borrowRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collateral Factor:</span>
                  <span className="font-semibold">{protocol.collateralFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max LTV:</span>
                  <span className="font-semibold">{protocol.maxLTV}</span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-white rounded border text-xs text-gray-600">
                {protocol.benefits}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {protocol.description}
              </p>

              <Button 
                className={`w-full mt-3 ${
                  protocol.protocol === 'CreditCupid' ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
                variant={protocol.protocol === 'CreditCupid' ? 'default' : 'outline'}
              >
                Explore {protocol.protocol}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Borrow rates on DeFi platforms like Morpho and Aave change based on market supply and demand. 
            CreditCupid rates are personalized based on your credit score and may offer better terms for creditworthy borrowers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};