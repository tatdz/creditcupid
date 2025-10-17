import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';

interface CreditScoreProps {
  score: number;
  address: string;
  riskFactors: string[];
}

export const CreditScore: React.FC<CreditScoreProps> = ({ score, address, riskFactors }) => {
  // Handle NaN and invalid scores
  const isValidScore = !isNaN(score) && isFinite(score) && score >= 300 && score <= 850;
  const displayScore = isValidScore ? Math.round(score) : 0;
  const displayRiskFactors = riskFactors.length > 0 ? riskFactors : ['Calculating risk factors...'];

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 600) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 800) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 600) return 'Fair';
    return 'Poor';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Score</CardTitle>
        <CardDescription>
          Based on your on-chain activity and financial health
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          {!isValidScore && (
            <div className="text-yellow-600 bg-yellow-50 p-2 rounded-lg mb-4 text-sm">
              ⚠️ Calculating your credit score...
            </div>
          )}
          
          <div className={`text-6xl font-bold ${getScoreColor(displayScore)} mb-2`}>
            {isValidScore ? displayScore : '--'}
          </div>
          <div className="text-lg font-semibold text-gray-700 mb-4">
            {isValidScore ? getScoreLabel(displayScore) : 'Calculating...'}
          </div>
          
          {isValidScore && (
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${(displayScore - 300) / 5.5}%` }}
              />
            </div>
          )}

          <div className="text-left">
            <h4 className="font-semibold text-gray-900 mb-2">Risk Factors</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {displayRiskFactors.map((factor, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};