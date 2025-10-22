// components/P2PLending.tsx
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  DollarSign, 
  TrendingUp, 
  Target,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
  Calculator,
  Clock,
  Shield,
  Lock,
  Zap
} from 'lucide-react';

// Import hooks
import { useCreditScoreManager } from '../hooks/useCreditScoreManager';
import { useP2PLending } from '../hooks/useP2PLending';
import { useP2PData } from '../hooks/useP2PData';

interface P2PLendingProps {
  userCreditScore: number;
  userAddress: string;
}

// Inline Input component
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Inline Label component
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    />
  )
);
Label.displayName = "Label";

// Rates Display Component
const RatesPanel: React.FC<{ userCreditScore: number }> = ({ userCreditScore }) => {
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
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-blue-600" />
          Your Personalized Rates
        </CardTitle>
        <CardDescription>
          Based on your credit score of {userCreditScore}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-2">BORROW RATE</div>
              <div className="text-2xl font-bold text-blue-700">{userBorrowRate.toFixed(1)}% APR</div>
              <p className="text-xs text-blue-600 mt-1">For loan requests</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-center">
              <div className="text-sm text-green-600 font-medium mb-2">LEND RATE</div>
              <div className="text-2xl font-bold text-green-700">{userLendRate.toFixed(1)}% APY</div>
              <p className="text-xs text-green-600 mt-1">For lending offers</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TransactionLink: React.FC<{ 
  hash: string; 
  getTransactionUrl: (hash: string) => string;
  getFallbackTransactionUrl: (hash: string) => string;
}> = ({ hash, getTransactionUrl, getFallbackTransactionUrl }) => {
  return (
    <div className="flex flex-col gap-1">
      <a 
        href={getTransactionUrl(hash)}
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
      >
        View on Blockscout <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
};

interface TransactionStatusProps {
  transactionState: {
    hash?: string | null;
    success?: boolean;
    error?: string | null;
    isPending?: boolean;
    isConfirming?: boolean;
    type?: 'createLoan' | 'createOffer' | null;
  };
  message: string;
  getTransactionUrl: (hash: string) => string;
  getFallbackTransactionUrl: (hash: string) => string;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  transactionState,
  message,
  getTransactionUrl,
  getFallbackTransactionUrl
}) => {
  const { hash, success, error, isPending, isConfirming } = transactionState;

  if (!hash && !error && !isPending) {
    return null;
  }

  let borderColor = 'border-blue-200';
  let bgColor = 'bg-blue-50';
  let icon = <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
  let title = 'Transaction Pending';

  if (success) {
    borderColor = 'border-green-200';
    bgColor = 'bg-green-50';
    icon = <CheckCircle className="h-6 w-6 text-green-600" />;
    title = 'Transaction Successful';
  } else if (error) {
    borderColor = 'border-red-200';
    bgColor = 'bg-red-50';
    icon = <XCircle className="h-6 w-6 text-red-600" />;
    title = 'Transaction Failed';
  } else if (isConfirming) {
    title = 'Waiting for Confirmation';
  }

  const getStatusMessage = () => {
    if (error) return message;
    if (success) return `${message} completed successfully!`;
    if (isConfirming) return `${message} is being confirmed...`;
    return `${message} is being processed...`;
  };

  return (
    <Card className={`${borderColor} ${bgColor} mb-6`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm">{getStatusMessage()}</p>
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>
          </div>
          {hash && (
            <TransactionLink 
              hash={hash} 
              getTransactionUrl={getTransactionUrl}
              getFallbackTransactionUrl={getFallbackTransactionUrl}
            />
          )}
        </div>
        {isConfirming && (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Waiting for confirmation...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Combined Credit Score Status Component
interface CreditScoreStatusProps {
  creditScoreManager: {
    creditScore: number;
    onChainScore: number;
    isScoreSet: boolean;
    isLoading: boolean;
    isUpdating: boolean;
    transactionError: string | null;
    transactionHash: string | null;
    transactionStatus: any;
    transactionSuccess: boolean;
    setCreditScoreOnChain: () => Promise<boolean>;
    isCorrectNetwork: boolean;
    getTransactionUrl: (hash: string) => string;
    getFallbackTransactionUrl: (hash: string) => string;
  };
  userCreditScore: number;
}

const CreditScoreStatus: React.FC<CreditScoreStatusProps> = ({
  creditScoreManager,
  userCreditScore,
}) => {
  const {
    creditScore,
    onChainScore,
    isScoreSet,
    isLoading,
    isUpdating,
    transactionError,
    transactionHash,
    transactionStatus,
    transactionSuccess,
    setCreditScoreOnChain,
    isCorrectNetwork,
    getTransactionUrl,
    getFallbackTransactionUrl
  } = creditScoreManager;

  // Show transaction in progress state
  if (isUpdating && transactionHash) {
    const confirmations = transactionStatus?.confirmations || 0;
    
    return (
      <Card className="border-blue-200 bg-blue-50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold">Setting Credit Score</h3>
                <p className="text-sm">Transaction submitted! Waiting for confirmation...</p>
                {confirmations > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Confirmations: {confirmations}
                  </p>
                )}
                {transactionHash && (
                  <div className="mt-2">
                    <TransactionLink 
                      hash={transactionHash} 
                      getTransactionUrl={getTransactionUrl}
                      getFallbackTransactionUrl={getFallbackTransactionUrl}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If score is already set, show compact status
  if (isScoreSet) {
    return (
      <Card className="border-green-200 bg-green-50 mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-sm">Credit Score Verified</h3>
                <p className="text-xs text-green-700">
                  Your score {creditScore} is set onchain
                </p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">
              {creditScore}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Score not set - show clickable setup card
  return (
    <Card className="border-yellow-200 bg-yellow-50 mb-6 cursor-pointer hover:bg-yellow-100 transition-colors">
      <CardContent className="py-4" onClick={() => setCreditScoreOnChain()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-200 rounded-full">
              <Lock className="h-5 w-5 text-yellow-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-sm text-yellow-800">Set Credit Score to Start</h3>
                <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                  Score: {userCreditScore}
                </Badge>
              </div>
              <p className="text-xs text-yellow-700">
                Click here to set your score onchain and unlock borrowing
              </p>
            </div>
          </div>
          
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              setCreditScoreOnChain();
            }}
            disabled={isUpdating || !isCorrectNetwork}
            size="sm"
            className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700 whitespace-nowrap"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Setting...
              </>
            ) : (
              <>
                <Upload className="h-3 w-3 mr-1" />
                Set Onchain
              </>
            )}
          </Button>
        </div>

        {transactionHash && (
          <div className="mt-3">
            <TransactionLink 
              hash={transactionHash} 
              getTransactionUrl={getTransactionUrl}
              getFallbackTransactionUrl={getFallbackTransactionUrl}
            />
          </div>
        )}

        {!isCorrectNetwork && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-xs text-red-700">
              Please switch to Sepolia network to set your credit score
            </p>
          </div>
        )}

        {transactionError && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-xs text-red-700">
              {transactionError}
            </p>
          </div>
        )}

        {transactionSuccess && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg">
            <p className="text-xs text-green-700">
              ✅ Credit score successfully set! You can now create loan requests.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper to format numbers without commas and extra zeros
const formatNumber = (num: number | string): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0';
  return Number(number.toFixed(6)).toString();
};

// Borrow Tab Component
interface BorrowTabProps {
  loanAmount: string;
  collateralAmount: string;
  loanDuration: string;
  onLoanAmountChange: (value: string) => void;
  onCollateralAmountChange: (value: string) => void;
  onLoanDurationChange: (value: string) => void;
  onCreateLoan: () => void;
  isCreatingLoan: boolean;
  isCorrectNetwork: boolean;
  isScoreSet: boolean;
  canBorrow: boolean;
  effectiveOnChainScore: number;
  userCreditScore: number;
}

const BorrowTab: React.FC<BorrowTabProps> = ({
  loanAmount,
  collateralAmount,
  loanDuration,
  onLoanAmountChange,
  onCollateralAmountChange,
  onLoanDurationChange,
  onCreateLoan,
  isCreatingLoan,
  isCorrectNetwork,
  isScoreSet,
  canBorrow,
  effectiveOnChainScore,
  userCreditScore,
}) => {
  // IMPORTANT: Check your P2PLending.sol contract for the actual collateral logic
  // Common patterns in lending protocols:
  // 1. Overcollateralized: collateral > loan amount (e.g., 150% = 1.5x)
  // 2. Undercollateralized: collateral < loan amount (e.g., 60% = 0.6x)
  
  // Based on your description, it seems you want 65% collateral of loan amount
  // But the transaction failure suggests the contract expects different logic
  
  const calculateRequiredCollateral = (loan: string): string => {
    const loanValue = parseFloat(loan);
    if (isNaN(loanValue) || loanValue <= 0) return '';
    
    // TRY DIFFERENT APPROACHES - comment out the one that doesn't work
    
    // Approach 1: Collateral is 65% of loan amount (what you described)
    // const requiredCollateral = loanValue * 0.65;
    
    // Approach 2: Collateral is based on LTV ratio (more common in DeFi)
    // For 65% LTV: Collateral = Loan Amount / 0.65
    const requiredCollateral = loanValue / 0.65;
    
    // Approach 3: Fixed overcollateralization (150%)
    // const requiredCollateral = loanValue * 1.5;
    
    return formatNumber(requiredCollateral);
  };

  const handleLoanAmountChange = (value: string) => {
    onLoanAmountChange(value);
    if (value) {
      const requiredCollateral = calculateRequiredCollateral(value);
      onCollateralAmountChange(requiredCollateral);
    } else {
      onCollateralAmountChange('');
    }
  };

  const minCollateral = 0.1;
  const requiredCollateral = calculateRequiredCollateral(loanAmount);
  const isValid = parseFloat(loanAmount) >= 0.1 && parseFloat(requiredCollateral) >= minCollateral && parseFloat(loanDuration) >= 30;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Create Loan Request</h3>
        <p className="text-sm text-gray-600 mb-4">
          Request an undercollateralized loan using your credit score
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="loanAmount">Loan Amount (ETH)</Label>
          <Input
            id="loanAmount"
            type="number"
            placeholder="10.0"
            value={loanAmount}
            onChange={(e) => handleLoanAmountChange(e.target.value)}
            step="0.1"
            min="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the amount you want to borrow (minimum: 0.1 ETH)
          </p>
        </div>

        <div>
          <Label htmlFor="collateralAmount">Required Collateral (ETH)</Label>
          <Input
            id="collateralAmount"
            type="number"
            placeholder="0"
            value={collateralAmount}
            onChange={(e) => onCollateralAmountChange(e.target.value)}
            readOnly
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Based on 65% LTV ratio (min collateral: {minCollateral} ETH)
          </p>
          {requiredCollateral && parseFloat(requiredCollateral) < minCollateral && (
            <p className="text-xs text-red-500 mt-1">
              Minimum collateral required: {minCollateral} ETH
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="loanDuration">Loan Duration (Days)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="loanDuration"
              type="number"
              placeholder="90"
              value={loanDuration}
              onChange={(e) => onLoanDurationChange(e.target.value)}
              min="30"
              max="365"
            />
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum 30 days, maximum 365 days
          </p>
        </div>

        {loanAmount && requiredCollateral && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Loan Summary</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Loan Amount:</span>
                <span className="font-medium">{loanAmount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Collateral (65% LTV):</span>
                <span className="font-medium text-blue-600">{requiredCollateral} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{loanDuration} days</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              You provide {requiredCollateral} ETH collateral to borrow {loanAmount} ETH
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              💡 If transaction fails, the contract may require different collateral calculation
            </p>
          </div>
        )}

        <Button
          onClick={onCreateLoan}
          disabled={!isValid || isCreatingLoan || !isCorrectNetwork || !canBorrow}
          className="w-full"
        >
          {isCreatingLoan ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating Loan Request...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Create Loan Request
            </>
          )}
        </Button>

        {!isScoreSet && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">
              You need to set your credit score onchain before creating loan requests
            </p>
          </div>
        )}

        {!isCorrectNetwork && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">
              Please switch to Sepolia network to create loan requests
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Lend Tab Component
interface LendTabProps {
  lendAmount: string;
  onLendAmountChange: (value: string) => void;
  onCreateOffer: () => void;
  isCreatingOffer: boolean;
  isCorrectNetwork: boolean;
}

const LendTab: React.FC<LendTabProps> = ({
  lendAmount,
  onLendAmountChange,
  onCreateOffer,
  isCreatingOffer,
  isCorrectNetwork,
}) => {
  const isValid = parseFloat(lendAmount) >= 1.0; // Minimum 1 ETH for lending

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Create Lender Offer</h3>
        <p className="text-sm text-gray-600 mb-4">
          Provide liquidity to borrowers and earn interest
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="lendAmount">Lend Amount (ETH)</Label>
          <Input
            id="lendAmount"
            type="number"
            placeholder="10.0"
            value={lendAmount}
            onChange={(e) => onLendAmountChange(e.target.value)}
            step="0.1"
            min="1.0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the amount you want to lend (minimum: 1.0 ETH)
          </p>
        </div>

        <Button
          onClick={onCreateOffer}
          disabled={!isValid || isCreatingOffer || !isCorrectNetwork}
          className="w-full"
        >
          {isCreatingOffer ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating Offer...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Create Lender Offer
            </>
          )}
        </Button>

        {!isCorrectNetwork && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">
              Please switch to Sepolia network to create lender offers
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const P2PLending: React.FC<P2PLendingProps> = ({ userCreditScore, userAddress }) => {
  const { isConnected } = useAccount();
  
  const [activeTab, setActiveTab] = useState<'borrow' | 'lend'>('borrow');
  const [loanAmount, setLoanAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [loanDuration, setLoanDuration] = useState('90'); // Default 90 days
  const [lendAmount, setLendAmount] = useState('');

  // Use custom hooks
  const creditScoreManager = useCreditScoreManager(userAddress, userCreditScore);
  const p2pLending = useP2PLending();
  const p2pData = useP2PData();

  // Handle loan creation
  const handleCreateLoan = async () => {
    if (!loanAmount || !collateralAmount || !loanDuration) return;
    
    if (!creditScoreManager.isScoreSet) {
      alert('Credit score not found onchain. Please set it first.');
      return;
    }

    // Convert days to seconds for the contract
    const durationInSeconds = parseInt(loanDuration) * 24 * 60 * 60;
    
    console.log('Creating loan with:', {
      loanAmount,
      collateralAmount, 
      durationInSeconds
    });
    
    const success = await p2pLending.createLoanRequest(loanAmount, collateralAmount, durationInSeconds);
    if (success) {
      setLoanAmount('');
      setCollateralAmount('');
      setLoanDuration('90');
    }
  };

  // Handle offer creation
  const handleCreateOffer = async () => {
    if (!lendAmount) return;
    
    const success = await p2pLending.createLenderOffer(lendAmount);
    if (success) {
      setLendAmount('');
    }
  };

  // Handle successful P2P transactions
  useEffect(() => {
    if (p2pLending.transactionState.success) {
      // Refetch data after successful transaction
      setTimeout(() => {
        p2pData.refetchAll();
      }, 3000);

      const timer = setTimeout(() => {
        p2pLending.clearTransactionState();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [p2pLending.transactionState.success, p2pData, p2pLending]);

  // Can borrow if score is set
  const canBorrow = creditScoreManager.isScoreSet;

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>P2P Lending</CardTitle>
          <CardDescription>Connect your wallet to access credit-based lending</CardDescription>
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

  if (isConnected && !creditScoreManager.isCorrectNetwork) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rates Panel - RESTORED */}
      <RatesPanel userCreditScore={userCreditScore} />

      {/* P2P Lending Transaction Status */}
      {p2pLending.transactionState.hash && (
        <TransactionStatus
          transactionState={p2pLending.transactionState}
          message={
            p2pLending.transactionState.type === 'createLoan' ? 'Loan request' :
            p2pLending.transactionState.type === 'createOffer' ? 'Lender offer' :
            'Transaction'
          }
          getTransactionUrl={creditScoreManager.getTransactionUrl}
          getFallbackTransactionUrl={creditScoreManager.getFallbackTransactionUrl}
        />
      )}

      {/* Credit Score Onchain Status */}
      <CreditScoreStatus
        creditScoreManager={creditScoreManager}
        userCreditScore={userCreditScore}
      />

      {/* Main P2P Lending Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            P2P Lending - Sepolia Testnet
          </CardTitle>
          <CardDescription>
            Credit-based lending with better terms than traditional DeFi
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
              loanAmount={loanAmount}
              collateralAmount={collateralAmount}
              loanDuration={loanDuration}
              onLoanAmountChange={setLoanAmount}
              onCollateralAmountChange={setCollateralAmount}
              onLoanDurationChange={setLoanDuration}
              onCreateLoan={handleCreateLoan}
              isCreatingLoan={p2pLending.transactionState.isPending && p2pLending.transactionState.type === 'createLoan'}
              isCorrectNetwork={creditScoreManager.isCorrectNetwork}
              isScoreSet={creditScoreManager.isScoreSet}
              canBorrow={canBorrow}
              effectiveOnChainScore={creditScoreManager.creditScore}
              userCreditScore={userCreditScore}
            />
          )}

          {activeTab === 'lend' && (
            <LendTab 
              lendAmount={lendAmount}
              onLendAmountChange={setLendAmount}
              onCreateOffer={handleCreateOffer}
              isCreatingOffer={p2pLending.transactionState.isPending && p2pLending.transactionState.type === 'createOffer'}
              isCorrectNetwork={creditScoreManager.isCorrectNetwork}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};