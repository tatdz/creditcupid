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
    if (score >= 800) return 'EXCELLENT';
    if (score >= 700) return 'GOOD';
    if (score >= 600) return 'FAIR';
    return 'POOR';
  };

  const getScoreDescription = () => {
    if (isRealScore && isValidScore) {
  
    }
    return 'BASED ON YOUR ON-CHAIN ACTIVITY AND FINANCIAL HEALTH';
  };

  return (
    <Card className="border-4 border-white bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] font-vt323">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-blue-800">CREDIT SCORE</CardTitle>
        <CardDescription className="text-base text-gray-700">
          {getScoreDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-center">
          {!isValidScore && (
            <div className="text-yellow-700 bg-yellow-100 p-2 rounded-lg mb-3 text-sm border-2 border-yellow-500">
              ⚠️ CALCULATING YOUR CREDIT SCORE...
            </div>
          )}
          
          <div className={`text-5xl font-bold ${getScoreColor(finalScore)} mb-2`}>
            {isValidScore ? finalScore : '--'}
          </div>
          <div className="text-lg font-semibold text-gray-700 mb-3">
            {isValidScore ? getScoreLabel(finalScore) : 'CALCULATING...'}
          </div>
          
          {isValidScore && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 border-2 border-gray-400">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${(finalScore - 300) / 5.5}%` }}
              />
            </div>
          )}

          <div className="text-left">
            <h4 className="font-semibold text-gray-900 mb-2 text-lg">CREDIT PROFILE</h4>
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