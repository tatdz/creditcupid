import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { CheckCircle, Clock, Zap } from 'lucide-react';

interface CreditBenefitsProps {
  benefits: any[];
  collateralBoost: number;
}

export const CreditBenefits: React.FC<CreditBenefitsProps> = ({ benefits, collateralBoost }) => {
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
          {benefits?.map((benefit, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(benefit.status)}
                <div>
                  <div className="font-medium text-gray-900">{benefit.description}</div>
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
            </div>
          ))}
          
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="font-medium text-blue-900">Collateral Boost</div>
              <div className="text-blue-700 font-semibold">
                +{(collateralBoost * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-sm text-blue-800 mt-1">
              Enhanced valuation for your assets
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};