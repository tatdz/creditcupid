import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Scale, BadgePercent } from 'lucide-react';

export const ProtocolComparison: React.FC = () => {
  const protocolComparison = [
    {
      protocol: 'Darma',
      borrowRate: '2.8%',
      collateralFactor: 'Up to 85%',
      maxLTV: '85%',
      requirements: 'Credit Score 700+',
      benefits: 'Undercollateralized loans available',
      bestFor: 'High credit score users'
    },
    {
      protocol: 'Morpho',
      borrowRate: '3.2%',
      collateralFactor: 'Up to 80%',
      maxLTV: '75%',
      requirements: 'Standard verification',
      benefits: 'Optimized rates via peer-to-peer',
      bestFor: 'Efficient rate seekers'
    },
    {
      protocol: 'Aave',
      borrowRate: '3.5%',
      collateralFactor: 'Up to 75%',
      maxLTV: '70%',
      requirements: 'Standard verification',
      benefits: 'Liquidity pool based',
      bestFor: 'Liquidity access'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Lending Protocol Comparison
        </CardTitle>
        <CardDescription>
          Best borrowing options based on your credit profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {protocolComparison.map((protocol, index) => (
            <div key={index} className={`border rounded-lg p-4 ${
              protocol.protocol === 'Darma' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold text-lg ${
                  protocol.protocol === 'Darma' ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {protocol.protocol}
                </h3>
                {protocol.protocol === 'Darma' && (
                  <BadgePercent className="h-5 w-5 text-blue-600" />
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

              <Button 
                className={`w-full mt-3 ${
                  protocol.protocol === 'Darma' ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
                variant={protocol.protocol === 'Darma' ? 'default' : 'outline'}
              >
                Explore {protocol.protocol}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};