import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useCreditData } from '../hooks/useCreditData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  User, 
  Shield,
  ArrowUpDown
} from 'lucide-react';

interface LoanOffer {
  id: number;
  lender: string;
  token: string;
  maxAmount: string;
  minScore: number;
  maxLTV: number;
  interestRate: number;
  maxDuration: number;
  active: boolean;
}

interface Loan {
  id: number;
  borrower: string;
  lender: string;
  token: string;
  principal: string;
  collateral: string;
  interestRate: number;
  duration: number;
  status: 'Active' | 'Repaid' | 'Defaulted' | 'Liquidated';
}

export const P2PLending: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { creditData } = useCreditData();
  const [activeTab, setActiveTab] = useState<'borrow' | 'lend'>('borrow');
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    if (isConnected && creditData) {
      // Simulate fetching loan offers
      const mockOffers: LoanOffer[] = [
        {
          id: 1,
          lender: '0x742E...C5D4E',
          token: 'USDC',
          maxAmount: '10000.00',
          minScore: 700,
          maxLTV: 75,
          interestRate: 6.5,
          maxDuration: 180,
          active: true
        },
        {
          id: 2,
          lender: '0x8C3a...8D9E',
          token: 'DAI',
          maxAmount: '5000.00',
          minScore: 650,
          maxLTV: 70,
          interestRate: 8.2,
          maxDuration: 90,
          active: true
        },
        {
          id: 3,
          lender: '0x1A2B...A0B',
          token: 'USDC',
          maxAmount: '20000.00',
          minScore: 750,
          maxLTV: 80,
          interestRate: 5.2,
          maxDuration: 365,
          active: true
        }
      ];

      const mockLoans: Loan[] = [
        {
          id: 1,
          borrower: address!,
          lender: '0x742E...C5D4E',
          token: 'USDC',
          principal: '2500.00',
          collateral: '3125.00',
          interestRate: 6.5,
          duration: 90,
          status: 'Active'
        }
      ];

      setLoanOffers(mockOffers.filter(offer => 
        creditData.creditScore >= offer.minScore
      ));
      setUserLoans(mockLoans);
    }
  }, [isConnected, creditData, address]);

  const handleCreateLoan = async (amount: string, collateral: string, duration: number) => {
    // Implementation for creating loan
    setLoading(true);
    // Contract interaction would go here
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const handleFundLoan = async (loanId: number, offerId: number) => {
    // Implementation for funding loan
    setLoading(true);
    // Contract interaction would go here
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>P2P Lending Platform</CardTitle>
          <CardDescription>
            Connect your wallet to access undercollateralized lending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Please connect your wallet to continue</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6" />
            Peer-to-Peer Lending
          </CardTitle>
          <CardDescription>
            Access undercollateralized loans or earn yield by lending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <Button
              variant={activeTab === 'borrow' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('borrow')}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Borrow
            </Button>
            <Button
              variant={activeTab === 'lend' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('lend')}
              className="flex-1"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Lend
            </Button>
          </div>

          {activeTab === 'borrow' && (
            <BorrowTab 
              creditScore={creditData?.creditScore || 0}
              loanOffers={loanOffers}
              userLoans={userLoans}
              onCreateLoan={handleCreateLoan}
              onFundLoan={handleFundLoan}
              loading={loading}
            />
          )}

          {activeTab === 'lend' && (
            <LendTab 
              creditScore={creditData?.creditScore || 0}
              onCreateOffer={() => {}}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BorrowTab: React.FC<{
  creditScore: number;
  loanOffers: LoanOffer[];
  userLoans: Loan[];
  onCreateLoan: (amount: string, collateral: string, duration: number) => void;
  onFundLoan: (loanId: number, offerId: number) => void;
  loading: boolean;
}> = ({ creditScore, loanOffers, userLoans, onCreateLoan, onFundLoan, loading }) => {
  const [loanAmount, setLoanAmount] = useState('');
  const [collateral, setCollateral] = useState('');
  const [duration, setDuration] = useState(90);

  const calculateLTV = () => {
    if (!loanAmount || !collateral) return 0;
    return (parseFloat(loanAmount) / parseFloat(collateral)) * 100;
  };

  const getBorrowingLimit = () => {
    // Simplified calculation - in production, this would use the credit oracle
    const baseLimit = creditScore >= 800 ? 80 : 
                     creditScore >= 700 ? 70 :
                     creditScore >= 600 ? 60 : 50;
    return baseLimit;
  };

  return (
    <div className="space-y-6">
      {/* Borrowing Power */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getBorrowingLimit()}% LTV
              </div>
              <div className="text-sm text-gray-600">Max Borrowing Power</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${(parseFloat(loanAmount) || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Loan Amount</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {calculateLTV().toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Current LTV</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Loan Request */}
      <Card>
        <CardHeader>
          <CardTitle>Create Loan Request</CardTitle>
          <CardDescription>
            Request a loan based on your credit score and collateral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Loan Amount (USDC)</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Collateral (USDC)</label>
              <input
                type="number"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Duration (days)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-2 border rounded-lg"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>365 days</option>
            </select>
          </div>
          <Button 
            onClick={() => onCreateLoan(loanAmount, collateral, duration)}
            disabled={loading || !loanAmount || !collateral}
            className="w-full"
          >
            {loading ? 'Creating Loan...' : 'Create Loan Request'}
          </Button>
        </CardContent>
      </Card>

      {/* Available Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Loan Offers</CardTitle>
          <CardDescription>
            Lenders willing to fund your loan based on your credit profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loanOffers.map(offer => (
              <div key={offer.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">{offer.token} Loan</div>
                    <div className="text-sm text-gray-600">
                      Up to ${parseFloat(offer.maxAmount).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {offer.interestRate}% APY
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Min Score</div>
                    <div className="font-medium">{offer.minScore}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Max LTV</div>
                    <div className="font-medium">{offer.maxLTV}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Duration</div>
                    <div className="font-medium">{offer.maxDuration} days</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Lender</div>
                    <div className="font-medium truncate">{offer.lender}</div>
                  </div>
                </div>
                <Button 
                  onClick={() => onFundLoan(1, offer.id)}
                  className="w-full mt-3"
                  size="sm"
                >
                  Accept Offer
                </Button>
              </div>
            ))}
            {loanOffers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No suitable loan offers found</p>
                <p className="text-sm">Create a loan request to attract lenders</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Your Active Loans */}
      <Card>
        <CardHeader>
          <CardTitle>Your Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userLoans.map(loan => (
              <div key={loan.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-semibold">
                    ${parseFloat(loan.principal).toLocaleString()} {loan.token}
                  </div>
                  <div className="text-sm text-gray-600">
                    {loan.interestRate}% APY • {loan.duration} days
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={
                    loan.status === 'Active' ? 'default' :
                    loan.status === 'Repaid' ? 'secondary' : 'destructive'
                  }>
                    {loan.status}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">
                    LTV: {((parseFloat(loan.principal) / parseFloat(loan.collateral)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
            {userLoans.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No active loans
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LendTab: React.FC<{
  creditScore: number;
  onCreateOffer: () => void;
  loading: boolean;
}> = ({ creditScore, onCreateOffer, loading }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Become a Lender</CardTitle>
          <CardDescription>
            Provide liquidity and earn yield based on borrower credit scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Lender Benefits</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Credit-based risk assessment
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Higher yields than traditional lending
                </li>
                <li className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-500" />
                  Access to creditworthy borrowers
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  Flexible loan terms
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Your Lender Profile</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Credit Score:</span>
                  <span className="font-semibold">{creditScore}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lender Tier:</span>
                  <span className="font-semibold">
                    {creditScore >= 750 ? 'Premium' : 
                     creditScore >= 650 ? 'Standard' : 'Basic'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max Loan Size:</span>
                  <span className="font-semibold">
                    {creditScore >= 750 ? '$50,000' : 
                     creditScore >= 650 ? '$25,000' : '$10,000'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onCreateOffer}
            disabled={loading}
            className="w-full mt-6"
          >
            {loading ? 'Creating Offer...' : 'Create Loan Offer'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};