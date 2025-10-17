import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';

interface CollateralAnalysisProps {
  analysis: any;
  oracleData: any;
}

export const CollateralAnalysis: React.FC<CollateralAnalysisProps> = ({ analysis, oracleData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collateral Analysis</CardTitle>
        <CardDescription>
          Your asset valuation and borrowing capacity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Current Value</div>
              <div className="text-xl font-bold text-blue-800">
                {analysis?.currentCollateralValue || '$0'}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Enhanced Value</div>
              <div className="text-xl font-bold text-green-800">
                {analysis?.enhancedCollateralValue || '$0'}
              </div>
            </div>
          </div>

          {analysis?.assets && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Asset Breakdown</h4>
              <div className="space-y-2">
                {analysis.assets.map((asset: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-sm text-gray-600">{asset.amount}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${asset.valueUSD?.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        {asset.collateralFactor ? (asset.collateralFactor * 100).toFixed(0) + '% CF' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {oracleData && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Market Data</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ETH Price: ${oracleData.ethPriceUSD}</div>
                <div>Gas (Fast): {oracleData.gasPrices?.fast} Gwei</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};