import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Zap } from 'lucide-react';

interface ProtocolComparisonProps {
  userCreditScore: number;
}

export const ProtocolComparison: React.FC<ProtocolComparisonProps> = ({ userCreditScore }) => {
  // Calculate personalized rates
  const calculateBorrowRate = (creditScore: number): number => {
    const baseRate = 3.5;
    if (creditScore >= 800) return baseRate;
    if (creditScore >= 750) return baseRate + 0.5;
    if (creditScore >= 700) return baseRate + 1.0;
    if (creditScore >= 650) return baseRate + 2.0;
    return baseRate + 4.0;
  };

  const calculateLendRate = (creditScore: number): number => {
    return calculateBorrowRate(creditScore) - 1.0;
  };

  const userBorrowRate = calculateBorrowRate(userCreditScore);
  const userLendRate = calculateLendRate(userCreditScore);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-blue-600" />
          Your Rates
        </CardTitle>
        <CardDescription className="text-xs">
          Personalized for your credit score
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          {/* Borrowing Card */}
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="text-center">
              <div className="text-xs text-blue-600 font-medium mb-1">BORROW</div>
              <div className="text-xl font-bold text-blue-700">{userBorrowRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Lending Card */}
          <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <div className="text-center">
              <div className="text-xs text-green-600 font-medium mb-1">LEND</div>
              <div className="text-xl font-bold text-green-700">{userLendRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};