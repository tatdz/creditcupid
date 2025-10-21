import React from 'react';
import { Card, CardContent } from './Card';
import { AlertTriangle } from 'lucide-react';

export const NetworkAlert: React.FC = () => {
  return (
    <Card className="border-yellow-200 bg-yellow-50 mb-6">
      <CardContent className="pt-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-yellow-600" />
          <h3 className="font-semibold text-lg mb-2">Wrong Network</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please switch to Sepolia testnet to use Credit Cupid. 
            You need Sepolia ETH (free from faucets) for transactions.
          </p>
          <p className="text-xs text-gray-600 mt-3">
            Get free Sepolia ETH from: sepoliafaucet.com
          </p>
        </div>
      </CardContent>
    </Card>
  );
};