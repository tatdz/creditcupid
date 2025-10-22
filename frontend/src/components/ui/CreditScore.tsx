import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { useCreditScoreContext } from '../../hooks/useCreditScoreContext'

interface CreditScoreProps {
  score: number; // fallback score
  address: string;
  riskFactors: string[];
}

export const CreditScore: React.FC<CreditScoreProps> = ({ score, address, riskFactors }) => {
  // Use the credit score context
  const { calculatedScore, isRealScore } = useCreditScoreContext();
  
  // Use calculated score if available, otherwise use fallback score
  const displayScore = isRealScore ? calculatedScore : score;
  
  // Handle NaN and invalid scores
  const isValidScore = !isNaN(displayScore) && isFinite(displayScore) && displayScore >= 300 && displayScore <= 850;
  const finalScore = isValidScore ? Math.round(displayScore) : 0;
  
  // Enhanced risk factors logic
  const getEnhancedRiskFactors = () => {
    // If using simplified scoring from backend
    if (riskFactors.includes('Using simplified scoring - upgrade to use frontend calculation')) {
      return [
        'Limited transaction history analysis',
        'Basic wallet activity assessment',
        'No real-time DeFi protocol data',
        'Using estimated scoring model'
      ];
    }
    
    // If we have real calculated score, use real risk factors
    if (isRealScore && isValidScore) {
      const factors = [];
      
      if (finalScore < 600) {
        factors.push('Limited on-chain transaction history');
        factors.push('Low protocol interaction frequency');
        factors.push('Small wallet portfolio value');
      } else if (finalScore < 700) {
        factors.push('Moderate transaction activity');
        factors.push('Some DeFi protocol usage detected');
        factors.push('Growing credit profile');
      } else if (finalScore < 800) {
        factors.push('Strong transaction history');
        factors.push('Active in multiple DeFi protocols');
        factors.push('Healthy wallet diversification');
      } else {
        factors.push('Excellent on-chain reputation');
        factors.push('Extensive DeFi protocol experience');
        factors.push('Optimal wallet management');
      }
      
      return factors;
    }
    
    // Fallback to original risk factors
    return riskFactors.length > 0 ? riskFactors : ['Analyzing your on-chain activity...'];
  };

  const displayRiskFactors = getEnhancedRiskFactors();

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

  const getScoreDescription = () => {
    if (isRealScore && isValidScore) {
  
    }
    return 'Based on your on-chain activity and financial health';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Score</CardTitle>
        <CardDescription>
          {getScoreDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          {!isValidScore && (
            <div className="text-yellow-600 bg-yellow-50 p-2 rounded-lg mb-4 text-sm">
              ⚠️ Calculating your credit score...
            </div>
          )}
          
          <div className={`text-6xl font-bold ${getScoreColor(finalScore)} mb-2`}>
            {isValidScore ? finalScore : '--'}
          </div>
          <div className="text-lg font-semibold text-gray-700 mb-4">
            {isValidScore ? getScoreLabel(finalScore) : 'Calculating...'}
          </div>
          
          {isValidScore && (
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${(finalScore - 300) / 5.5}%` }}
              />
            </div>
          )}

          <div className="text-left">
            <h4 className="font-semibold text-gray-900 mb-2">Credit Profile</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {displayRiskFactors.map((factor, index) => (
                <li key={index} className="flex items-start">
                  <span className={`mr-2 ${
                    factor.includes('Limited') || factor.includes('Basic') || factor.includes('No real-time') ? 'text-red-500' :
                    factor.includes('Moderate') || factor.includes('Some') || factor.includes('Growing') ? 'text-yellow-500' :
                    factor.includes('Strong') || factor.includes('Active') || factor.includes('Healthy') ? 'text-blue-500' :
                    factor.includes('Excellent') || factor.includes('Extensive') || factor.includes('Optimal') ? 'text-green-500' :
                    'text-gray-500'
                  }`}>•</span>
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