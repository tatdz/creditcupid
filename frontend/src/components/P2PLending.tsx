import React, { useState, useEffect } from 'react';
import { useAccount, useContractWrite } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  User, 
  Shield,
  MessageCircle,
  Users,
  Search,
  Zap,
  Target
} from 'lucide-react';

// Real deployed contract addresses
const CREDIT_SCORE_ADDRESS = '0x624d2EbA7CaDf0091a8e91e105438569A1792C41' as `0x${string}`;
const P2P_LENDING_ADDRESS = '0xD587065497538F906cf5301D073539AFd7AB4E41' as `0x${string}`;

// Real P2PLending contract ABI (extracted from your deployed contract)
const P2P_LENDING_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_loanAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_collateralAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_duration", "type": "uint256"}
    ],
    "name": "createLoanRequest",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_maxAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_minCreditScore", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxLTV", "type": "uint256"},
      {"internalType": "uint256", "name": "_interestRate", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxDuration", "type": "uint256"}
    ],
    "name": "createLenderOffer",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_loanId", "type": "uint256"},
      {"internalType": "uint256", "name": "_offerId", "type": "uint256"}
    ],
    "name": "fundLoan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_loanId", "type": "uint256"}
    ],
    "name": "repayLoan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveLoanRequests",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "borrower", "type": "address"},
          {"internalType": "uint256", "name": "loanAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "collateralAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "duration", "type": "uint256"},
          {"internalType": "uint256", "name": "interestRate", "type": "uint256"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "bool", "name": "active", "type": "bool"},
          {"internalType": "address", "name": "lender", "type": "address"},
          {"internalType": "bool", "name": "funded", "type": "bool"},
          {"internalType": "uint256", "name": "creditScore", "type": "uint256"}
        ],
        "internalType": "struct P2PLending.LoanRequest[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveLenderOffers",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "lender", "type": "address"},
          {"internalType": "uint256", "name": "maxAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "minCreditScore", "type": "uint256"},
          {"internalType": "uint256", "name": "maxLTV", "type": "uint256"},
          {"internalType": "uint256", "name": "interestRate", "type": "uint256"},
          {"internalType": "uint256", "name": "maxDuration", "type": "uint256"},
          {"internalType": "bool", "name": "active", "type": "bool"}
        ],
        "internalType": "struct P2PLending.LenderOffer[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserCreditScore",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserMaxLTV",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface P2PProfile {
  walletAddress: string;
  nickname: string;
  creditScore: number;
  role: 'borrower' | 'lender' | 'both';
  maxLoanAmount: number;
  minCreditScore: number;
  preferredTerms: {
    minDuration: number;
    maxDuration: number;
    maxLTV: number;
  };
  isActive: boolean;
}

interface LoanOffer {
  id: number;
  lenderProfile: P2PProfile;
  token: string;
  amount: number;
  minScore: number;
  maxLTV: number;
  interestRate: number;
  duration: number;
  status: 'active' | 'filled' | 'cancelled';
}

interface LoanRequest {
  id: number;
  borrowerProfile: P2PProfile;
  token: string;
  amount: number;
  collateral: number;
  duration: number;
  interestRate: number;
  status: 'pending' | 'funded' | 'cancelled';
}

interface P2PLendingProps {
  userCreditScore: number;
  userAddress: string;
}

export const P2PLending: React.FC<P2PLendingProps> = ({ userCreditScore, userAddress }) => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'profiles' | 'borrow' | 'lend'>('profiles');
  const [userProfile, setUserProfile] = useState<P2PProfile | null>(null);
  const [profiles, setProfiles] = useState<P2PProfile[]>([]);
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'borrower' | 'lender' | null>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [lendAmount, setLendAmount] = useState('');

  // Calculate LTV based on credit score (matching contract logic)
  const calculateMaxLTV = (creditScore: number): number => {
    if (creditScore >= 800) return 85;
    if (creditScore >= 750) return 80;
    if (creditScore >= 700) return 75;
    if (creditScore >= 650) return 70;
    return 60;
  };

  // Calculate interest rate based on credit score (matching contract logic)
  const calculateInterestRate = (creditScore: number): number => {
    const baseRate = 3.5; // Base rate for excellent credit
    if (creditScore >= 800) return baseRate;
    if (creditScore >= 750) return baseRate + 0.5;
    if (creditScore >= 700) return baseRate + 1.0;
    if (creditScore >= 650) return baseRate + 2.0;
    return baseRate + 4.0;
  };

  // Initialize user profile
  useEffect(() => {
    if (isConnected && userAddress && userCreditScore) {
      const maxLTV = calculateMaxLTV(userCreditScore);
      
      const newProfile: P2PProfile = {
        walletAddress: userAddress,
        nickname: `User_${userAddress.slice(2, 8)}`,
        creditScore: userCreditScore,
        role: 'both',
        maxLoanAmount: userCreditScore >= 700 ? 50000 : 10000,
        minCreditScore: 650,
        preferredTerms: {
          minDuration: 30,
          maxDuration: 365,
          maxLTV: maxLTV
        },
        isActive: true
      };

      setUserProfile(newProfile);
    }
  }, [isConnected, userAddress, userCreditScore]);

  // Mock data for demonstration (you can replace with real contract calls)
  useEffect(() => {
    if (isConnected && userProfile) {
      const mockProfiles: P2PProfile[] = [
        {
          walletAddress: '0x742E...C5D4E',
          nickname: 'CryptoWhale',
          creditScore: 815,
          role: 'lender',
          maxLoanAmount: 100000,
          minCreditScore: 700,
          preferredTerms: {
            minDuration: 90,
            maxDuration: 365,
            maxLTV: 85
          },
          isActive: true
        },
        {
          walletAddress: '0x8C3a...8D9E',
          nickname: 'DeFiDegen',
          creditScore: 720,
          role: 'borrower',
          maxLoanAmount: 25000,
          minCreditScore: 650,
          preferredTerms: {
            minDuration: 30,
            maxDuration: 180,
            maxLTV: 75
          },
          isActive: true
        }
      ];

      const mockOffers: LoanOffer[] = [
        {
          id: 1,
          lenderProfile: mockProfiles[0],
          token: 'ETH',
          amount: 10000,
          minScore: 700,
          maxLTV: 85,
          interestRate: 3.8,
          duration: 180,
          status: 'active'
        }
      ];

      const mockRequests: LoanRequest[] = [
        {
          id: 1,
          borrowerProfile: mockProfiles[1],
          token: 'ETH',
          amount: 5000,
          collateral: 6250,
          duration: 120,
          interestRate: 4.5,
          status: 'pending'
        }
      ];

      setProfiles(mockProfiles);
      setLoanOffers(mockOffers);
      setLoanRequests(mockRequests);
    }
  }, [isConnected, userProfile]);

  // Contract write for creating loan request
  const { writeContract: createLoan, isPending: isCreatingLoan } = useContractWrite({
    mutation: {
      onSuccess: (data) => {
        console.log('Loan request created:', data);
        setLoanAmount(''); // Reset form
        // You could refresh loan requests here
      },
      onError: (error) => {
        console.error('Failed to create loan:', error);
      }
    }
  });

  // Contract write for creating lender offer
  const { writeContract: createOffer, isPending: isCreatingOffer } = useContractWrite({
    mutation: {
      onSuccess: (data) => {
        console.log('Lender offer created:', data);
        setLendAmount(''); // Reset form
        // You could refresh loan offers here
      },
      onError: (error) => {
        console.error('Failed to create offer:', error);
      }
    }
  });

  const handleCreateLoan = () => {
    if (!loanAmount || !userProfile) return;
    
    const loanAmountWei = BigInt(Math.floor(parseFloat(loanAmount) * 1e18));
    const collateralAmountWei = BigInt(Math.floor((parseFloat(loanAmount) / (userProfile.preferredTerms.maxLTV / 100)) * 1e18));
    const durationSeconds = BigInt(90 * 24 * 60 * 60); // 90 days in seconds

    createLoan({
      address: P2P_LENDING_ADDRESS,
      abi: P2P_LENDING_ABI,
      functionName: 'createLoanRequest',
      args: [
        loanAmountWei,
        collateralAmountWei,
        durationSeconds
      ]
    });
  };

  const handleCreateOffer = () => {
    if (!lendAmount || !userProfile) return;
    
    const lendAmountWei = BigInt(Math.floor(parseFloat(lendAmount) * 1e18));
    const maxLTVBps = BigInt(8000); // 80% in basis points
    const interestRateBps = BigInt(400); // 4% in basis points
    const maxDurationSeconds = BigInt(180 * 24 * 60 * 60); // 180 days in seconds

    createOffer({
      address: P2P_LENDING_ADDRESS,
      abi: P2P_LENDING_ABI,
      functionName: 'createLenderOffer',
      args: [
        lendAmountWei,
        BigInt(userProfile.minCreditScore),
        maxLTVBps,
        interestRateBps,
        maxDurationSeconds
      ]
    });
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOffers = loanOffers.filter(offer =>
    userProfile && offer.minScore <= userProfile.creditScore
  );

  // Calculate comparison rates for protocol comparison
  const comparison = {
    creditCupid: { rate: calculateInterestRate(userCreditScore) },
    morpho: { rate: calculateInterestRate(userCreditScore) + 1.5 },
    aave: { rate: calculateInterestRate(userCreditScore) + 2.0 }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CreditCupid P2P Lending</CardTitle>
          <CardDescription>
            Connect your wallet to access credit-based lending
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

  if (!selectedRole) {
    return (
      <RoleSelection 
        userProfile={userProfile}
        onSelectRole={setSelectedRole}
        userCreditScore={userCreditScore}
        comparison={comparison}
      />
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your profile...</p>
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
            <Target className="h-6 w-6" />
            CreditCupid P2P Lending
          </CardTitle>
          <CardDescription>
            Credit-based lending with better terms than traditional DeFi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <Button
              variant={activeTab === 'profiles' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('profiles')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Browse Profiles
            </Button>
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

          {activeTab === 'profiles' && (
            <ProfilesTab 
              profiles={filteredProfiles}
              userProfile={userProfile}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          )}

          {activeTab === 'borrow' && (
            <BorrowTab 
              userProfile={userProfile}
              loanOffers={filteredOffers}
              loanAmount={loanAmount}
              onLoanAmountChange={setLoanAmount}
              onCreateLoan={handleCreateLoan}
              isCreatingLoan={isCreatingLoan}
              comparison={comparison}
            />
          )}

          {activeTab === 'lend' && (
            <LendTab 
              userProfile={userProfile}
              loanRequests={loanRequests}
              lendAmount={lendAmount}
              onLendAmountChange={setLendAmount}
              onCreateOffer={handleCreateOffer}
              isCreatingOffer={isCreatingOffer}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const RoleSelection: React.FC<{
  userProfile: P2PProfile | null;
  onSelectRole: (role: 'borrower' | 'lender') => void;
  userCreditScore: number;
  comparison: any;
}> = ({ userProfile, onSelectRole, userCreditScore, comparison }) => {
  // Calculate LTV based on credit score
  const calculateMaxLTV = (creditScore: number): number => {
    if (creditScore >= 800) return 85;
    if (creditScore >= 750) return 80;
    if (creditScore >= 700) return 75;
    if (creditScore >= 650) return 70;
    return 60;
  };

  // Calculate interest rate based on credit score (lower score = higher rate)
  const calculateInterestRate = (creditScore: number): number => {
    const baseRate = 3.5; // Base rate for excellent credit
    if (creditScore >= 800) return baseRate;
    if (creditScore >= 750) return baseRate + 0.5;
    if (creditScore >= 700) return baseRate + 1.0;
    if (creditScore >= 650) return baseRate + 2.0;
    return baseRate + 4.0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Role</CardTitle>
          <CardDescription>
            Select whether you want to borrow or lend based on your credit profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Borrower Option */}
            <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer">
              <div className="pt-6 text-center cursor-pointer" onClick={() => onSelectRole('borrower')}>
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <CardTitle className="mb-2">Borrower</CardTitle>
                <p className="text-sm text-gray-600 mb-4">
                  Get loans with better terms based on your credit score
                </p>
                {userProfile && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Your Credit Score:</span>
                      <Badge variant="secondary">{userProfile.creditScore}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Max LTV:</span>
                      <span>{userProfile.preferredTerms.maxLTV}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span>{(calculateInterestRate(userCreditScore)).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
                <Button className="w-full mt-4">
                  Start Borrowing
                </Button>
              </div>
            </Card>

            {/* Lender Option */}
            <Card className="border-2 hover:border-green-500 transition-colors cursor-pointer">
              <div className="pt-6 text-center cursor-pointer" onClick={() => onSelectRole('lender')}>
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <CardTitle className="mb-2">Lender</CardTitle>
                <p className="text-sm text-gray-600 mb-4">
                  Provide liquidity and earn yield from creditworthy borrowers
                </p>
                {userProfile && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Your Credit Score:</span>
                      <Badge variant="secondary">{userProfile.creditScore}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Borrower Score:</span>
                      <span>{userProfile.minCreditScore}+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Loan Size:</span>
                      <span>${userProfile.maxLoanAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <Button className="w-full mt-4" variant="outline">
                  Start Lending
                </Button>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProfilesTab: React.FC<{
  profiles: P2PProfile[];
  userProfile: P2PProfile;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}> = ({ profiles, userProfile, searchTerm, onSearchChange }) => {
  // Simple Input component
  const Input: React.FC<{
    value: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
  }> = ({ value, onChange, placeholder, disabled, className }) => (
    <input
      type="text"
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full p-2 border rounded-lg ${className || ''} ${disabled ? 'bg-gray-100' : ''}`}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by nickname or wallet address..."
            value={searchTerm}
            onChange={onSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* User Profile Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold">{userProfile.nickname}</h3>
              <p className="text-sm text-gray-600 mb-3">Your Profile</p>
              <Badge className="mb-2">Score: {userProfile.creditScore}</Badge>
              <div className="text-xs text-gray-500 mt-2">
                {userProfile.walletAddress}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other Profiles */}
        {profiles.map(profile => (
          <Card key={profile.walletAddress} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <h3 className="font-semibold">{profile.nickname}</h3>
                <div className="flex justify-center gap-2 my-2">
                  <Badge variant="secondary">Score: {profile.creditScore}</Badge>
                  <Badge variant={profile.role === 'borrower' ? 'default' : 'secondary'}>
                    {profile.role}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <div>Max: ${profile.maxLoanAmount.toLocaleString()}</div>
                  <div>LTV: {profile.preferredTerms.maxLTV}%</div>
                </div>
                <Button size="sm" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const BorrowTab: React.FC<{
  userProfile: P2PProfile;
  loanOffers: LoanOffer[];
  loanAmount: string;
  onLoanAmountChange: (amount: string) => void;
  onCreateLoan: () => void;
  isCreatingLoan: boolean;
  comparison: any;
}> = ({ userProfile, loanOffers, loanAmount, onLoanAmountChange, onCreateLoan, isCreatingLoan, comparison }) => {
  const requiredCollateral = loanAmount ? 
    (parseFloat(loanAmount) / (userProfile.preferredTerms.maxLTV / 100)).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* CreditCupid Benefits */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Zap className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold text-lg mb-2">Your CreditCupid Benefits</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {userProfile.preferredTerms.maxLTV}%
                </div>
                <div className="text-gray-600">Max LTV</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {comparison.creditCupid.rate.toFixed(1)}%
                </div>
                <div className="text-gray-600">Borrow Rate</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Better terms than Morpho ({comparison.morpho.rate.toFixed(1)}%) and Aave ({comparison.aave.rate.toFixed(1)}%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Loan Request */}
      <Card>
        <CardHeader>
          <CardTitle>Create Loan Request</CardTitle>
          <CardDescription>
            Request a loan using your credit score for better terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Loan Amount (ETH)</label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => onLoanAmountChange(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Required Collateral (ETH)</label>
            <input
              value={requiredCollateral}
              disabled
              className="w-full p-2 border rounded-lg bg-gray-100"
              placeholder="0.00"
            />
          </div>
          <Button 
            onClick={onCreateLoan}
            disabled={!loanAmount || isCreatingLoan}
            className="w-full"
          >
            {isCreatingLoan ? 'Creating Loan...' : 'Create Loan Request (Smart Contract)'}
          </Button>
        </CardContent>
      </Card>

      {/* Available Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Loan Offers</CardTitle>
          <CardDescription>
            Lenders willing to fund your loan based on your credit score
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
                      Up to ${offer.amount.toLocaleString()}
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
                    <div className="font-medium">{offer.duration} days</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Lender</div>
                    <div className="font-medium">{offer.lenderProfile.nickname}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button className="flex-1" size="sm">
                    Accept Offer
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LendTab: React.FC<{
  userProfile: P2PProfile;
  loanRequests: LoanRequest[];
  lendAmount: string;
  onLendAmountChange: (amount: string) => void;
  onCreateOffer: () => void;
  isCreatingOffer: boolean;
}> = ({ userProfile, loanRequests, lendAmount, onLendAmountChange, onCreateOffer, isCreatingOffer }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Lender Offer</CardTitle>
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
              placeholder="0.00"
            />
          </div>
          <Button 
            onClick={onCreateOffer}
            disabled={!lendAmount || isCreatingOffer}
            className="w-full"
          >
            {isCreatingOffer ? 'Creating Offer...' : 'Create Lender Offer (Smart Contract)'}
          </Button>
        </CardContent>
      </Card>

      {/* Loan Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Available Loan Requests</CardTitle>
          <CardDescription>
            Borrowers seeking loans that match your criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loanRequests.map(request => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">{request.token} Request</div>
                    <div className="text-sm text-gray-600">
                      ${request.amount.toLocaleString()} • {request.borrowerProfile.nickname}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Score: {request.borrowerProfile.creditScore}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Amount</div>
                    <div className="font-medium">${request.amount.toLocaleString()}</div>
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
                <div className="flex gap-2 mt-3">
                  <Button className="flex-1" size="sm">
                    Fund Loan
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};