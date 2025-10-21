import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  TrendingUp, 
  Loader2,
  MessageCircle
} from 'lucide-react';
import { LoanRequest } from '../hooks/useP2PData';

interface LendTabProps {
  lendAmount: string;
  onLendAmountChange: (amount: string) => void;
  onCreateOffer: () => void;
  isCreatingOffer: boolean;
  isCorrectNetwork: boolean;
  loanRequests: LoanRequest[];
}

export const LendTab: React.FC<LendTabProps> = ({
  lendAmount,
  onLendAmountChange,
  onCreateOffer,
  isCreatingOffer,
  isCorrectNetwork,
  loanRequests
}) => {
  const pendingRequests = loanRequests.filter(request => request.status === 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Loan Offer</CardTitle>
          <CardDescription>
            Provide liquidity to creditworthy borrowers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Lending Amount (ETH)</label>
            <input
              type="number"
              value={lendAmount}
              onChange={(e) => onLendAmountChange(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="0"
              min="0.1"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum: 0.1 ETH</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Min Credit Score:</span>
                <span>600</span>
              </div>
              <div className="flex justify-between">
                <span>Max LTV:</span>
                <span>60%</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Rate:</span>
                <span>4.0% APY</span>
              </div>
              <div className="flex justify-between">
                <span>Loan Duration:</span>
                <span>30 days</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={onCreateOffer}
            disabled={!lendAmount || parseFloat(lendAmount) < 0.1 || isCreatingOffer || !isCorrectNetwork}
            className="w-full"
          >
            {!isCorrectNetwork ? 'Switch to Sepolia Network' : 
             isCreatingOffer ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Offer...
              </>
             ) : 'Create Loan Offer'}
          </Button>
          <p className="text-xs text-gray-600 text-center">
            Uses Sepolia testnet ETH for demonstration purposes only
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Loan Requests</CardTitle>
          <CardDescription>
            Borrowers seeking loans that match your criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">Loan Request #{request.id}</div>
                    <div className="text-sm text-gray-600">
                      {request.amount} ETH • {request.borrower.slice(0, 8)}...{request.borrower.slice(-6)}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Score: {request.interestRate * 100}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-gray-600">Loan Amount</div>
                    <div className="font-medium">{request.amount} ETH</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Collateral</div>
                    <div className="font-medium">{request.collateral} ETH</div>
                  </div>
                  <div>
                    <div className="text-gray-600">LTV</div>
                    <div className="font-medium">
                      {((request.amount / request.collateral) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rate</div>
                    <div className="font-medium">{request.interestRate}%</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    Fund Loan
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No active loan requests available</p>
                <p className="text-sm">Check back later or create a loan request as a borrower</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};