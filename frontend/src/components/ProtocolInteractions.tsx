import React from 'react';
import { ProtocolInteraction } from '../types/credit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, TrendingUp } from 'lucide-react';

interface ProtocolInteractionsProps {
  interactions: ProtocolInteraction[];
}

export const ProtocolInteractions: React.FC<ProtocolInteractionsProps> = ({ interactions }) => {
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'supply':
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
      case 'withdraw':
        return <ArrowUpCircle className="h-4 w-4 text-blue-500" />;
      case 'borrow':
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case 'repay':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <ArrowUpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'supply':
        return 'text-green-600 bg-green-50';
      case 'withdraw':
        return 'text-blue-600 bg-blue-50';
      case 'borrow':
        return 'text-yellow-600 bg-yellow-50';
      case 'repay':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAmount = (amount: string, asset: string) => {
    const numAmount = parseFloat(amount);
    if (numAmount > 1000) {
      return `${(numAmount / 1000).toFixed(1)}K ${asset}`;
    }
    return `${numAmount.toFixed(2)} ${asset}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getChainName = (chainId: number) => {
    const chains: { [key: number]: string } = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      11155111: 'Sepolia'
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Interactions</CardTitle>
        <CardDescription>
          Your recent activity across Aave and Morpho protocols
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {interactions.slice(0, 10).map((interaction, index) => (
            <div
              key={`${interaction.txHash}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                {getInteractionIcon(interaction.type)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInteractionColor(interaction.type)}`}>
                      {interaction.type.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {interaction.protocol.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getChainName(interaction.chainId)} • {formatTimestamp(interaction.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatAmount(interaction.amount, interaction.asset)}
                </div>
                <div className="text-xs text-gray-500">
                  {interaction.asset}
                </div>
              </div>
            </div>
          ))}
          {interactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ArrowUpCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No protocol interactions detected</p>
              <p className="text-sm">Interact with Aave or Morpho to see your activity here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};