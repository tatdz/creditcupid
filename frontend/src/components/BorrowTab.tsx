import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  DollarSign, 
  Zap, 
  CheckCircle,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { LoanOffer } from '../hooks/useP2PData';
import { TransactionLink } from './ui/TransactionLink';

interface BorrowTabProps {
  loanAmount: string;
  collateralAmount: string;
  onLoanAmountChange: (amount: string) => void;
  onCollateralAmountChange: (amount: string) => void;
  onCreateLoan: () => void;
  isCreatingLoan: boolean;
  isCorrectNetwork: boolean;
  isScoreSet: boolean;
  canBorrow: boolean;
  effectiveOnChainScore: number;
  userCreditScore: number;
  loanOffers: LoanOffer[];
}

export const BorrowTab: React.FC<BorrowTabProps> = ({
  loanAmount,
  collateralAmount,
  onLoanAmountChange,
  onCollateralAmountChange,
  onCreateLoan,
  isCreatingLoan,
  isCorrectNetwork,
  isScoreSet,
  canBorrow,
  effectiveOnChainScore,
  userCreditScore,
  loanOffers
}) => {
  
  const currentLTV = loanAmount && collateralAmount ? 
    ((parseFloat(loanAmount) / parseFloat(collateralAmount)) * 100).toFixed(1) : '0';

  const activeOffers = loanOffers.filter(offer => offer.status === 'active');

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Zap className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold text-lg mb-2">Your Credit-Based Benefits</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-blue-600">60%</div>
                <div className="text-gray-600">Max LTV</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {userCreditScore >= 700 ? '4.5%' : userCreditScore >= 650 ? '5.5%' : '7.5%'}
                </div>
                <div className="text-gray-600">Borrow Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {isScoreSet ? effectiveOnChainScore : userCreditScore}
                </div>
                <div className="text-gray-600">Credit Score</div>
              </div>
            </div>
            {isScoreSet && (
              <div className="mt-3 p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 inline text-green-600 mr-1" />
                <span className="text-sm text-green-700">Credit score verified onchain</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Loan Request</CardTitle>
          <CardDescription>
            Request an undercollateralized loan using your credit score
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Collateral Amount (ETH)</label>
            <input
              type="number"
              value={collateralAmount}
              onChange={(e) => onCollateralAmountChange(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="10"
              min="0.1"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum: 0.1 ETH</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Loan Amount (ETH)</label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => onLoanAmountChange(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-50"
              placeholder="0"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Based on 60% LTV limit (max loan: 60% of collateral)
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Current LTV:</span>
              <span className={currentLTV && parseFloat(currentLTV) <= 60 ? 'text-green-600' : 'text-red-600'}>
                {currentLTV}% {currentLTV && parseFloat(currentLTV) > 60 && '(Exceeds limit)'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Max LTV:</span>
              <span>60%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Loan Duration:</span>
              <span>30 days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>You can borrow:</span>
              <span className="font-semibold">{loanAmount || '0'} ETH</span>
            </div>
          </div>
          <Button 
            onClick={onCreateLoan}
            disabled={
              !collateralAmount || 
              isCreatingLoan || 
              !isCorrectNetwork || 
              !canBorrow || 
              (currentLTV !== '' && parseFloat(currentLTV) > 60)
            }
            className="w-full"
          >
            {!isCorrectNetwork ? 'Switch to Sepolia Network' : 
             !isScoreSet ? 'Set Credit Score First' :
             !canBorrow ? 'Credit Score Too Low (min 600)' :
             currentLTV !== '' && parseFloat(currentLTV) > 60 ? 'LTV Exceeds Limit' :
             isCreatingLoan ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Loan...
              </>
             ) : 'Create Loan Request'}
          </Button>
          <p className="text-xs text-gray-600 text-center">
            Uses Sepolia testnet ETH for demonstration purposes only
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Loan Offers</CardTitle>
          <CardDescription>
            Lenders willing to fund your loan based on your credit score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeOffers.map(offer => (
              <div key={offer.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">{offer.token} Loan Offer #{offer.id}</div>
                    <div className="text-sm text-gray-600">
                      Up to {offer.amount} ETH • Min Score: {offer.minScore}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {offer.interestRate}% APY
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Amount</div>
                    <div className="font-medium">{offer.amount} ETH</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Max LTV</div>
                    <div className="font-medium">{offer.maxLtv}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Duration</div>
                    <div className="font-medium">{offer.duration} days</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className="font-medium">
                      <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                        {offer.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    className="flex-1" 
                    size="sm"
                    disabled={!canBorrow}
                  >
                    {!canBorrow ? 'Score Too Low' : 'Accept Offer'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {activeOffers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No active loan offers available</p>
                <p className="text-sm">Check back later or try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};