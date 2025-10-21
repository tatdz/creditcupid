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
  Calculator
} from 'lucide-react';

// Import hooks
import { useCreditScoreManager } from '../hooks/useCreditScoreManager';
import { useP2PLending } from '../hooks/useP2PLending';
import { useP2PData } from '../hooks/useP2PData';

interface P2PLendingProps {
  userCreditScore: number;
  userAddress: string;
}

// Inline Input component to avoid missing file
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

// Inline Label component to avoid missing file
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

const NetworkAlert: React.FC = () => {
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
      <a 
        href={getFallbackTransactionUrl(hash)}
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs"
      >
        (or view on Etherscan)
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

  return (
    <Card className={`mb-6 ${isScoreSet ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isScoreSet ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">
                {isScoreSet ? 'Credit Score Verified Onchain' : 'Credit Score Not Set Onchain'}
              </h3>
              <p className="text-sm">
                {isScoreSet 
                  ? `Your credit score ${creditScore} is verified on the blockchain` 
                  : 'You need to set your credit score onchain to create loan requests'
                }
              </p>
              
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Effective Score:</span>
                  <Badge variant={creditScore > 0 ? "default" : "secondary"}>
                    {creditScore || 'Not set'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">P2PLending Contract:</span>
                  <Badge variant={onChainScore > 0 ? "default" : "secondary"}>
                    {onChainScore || 'Not set'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Original Score:</span>
                  <Badge variant="outline">
                    {userCreditScore}
                  </Badge>
                </div>
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
            </div>
          </div>
          
          {!isScoreSet && (
            <Button 
              onClick={() => setCreditScoreOnChain()}
              disabled={isUpdating || !isCorrectNetwork}
              size="sm"
              className="whitespace-nowrap"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Setting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Set Onchain
                </>
              )}
            </Button>
          )}
        </div>

        {!isCorrectNetwork && !isScoreSet && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-700">
              Please switch to Sepolia network to set your credit score
            </p>
          </div>
        )}

        {transactionError && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-700">
              {transactionError}
            </p>
          </div>
        )}

        {transactionSuccess && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg">
            <p className="text-sm text-green-700">
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
  onLoanAmountChange: (value: string) => void;
  onCollateralAmountChange: (value: string) => void;
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
  onLoanAmountChange,
  onCollateralAmountChange,
  onCreateLoan,
  isCreatingLoan,
  isCorrectNetwork,
  isScoreSet,
  canBorrow,
  effectiveOnChainScore,
  userCreditScore,
}) => {
  // Calculate required collateral based on loan amount (60% LTV = 166.67% collateral)
  const calculateRequiredCollateral = (loan: string): string => {
    const loanValue = parseFloat(loan);
    if (isNaN(loanValue) || loanValue <= 0) return '';
    const requiredCollateral = loanValue / 0.6; // 60% LTV
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
  const isValid = parseFloat(loanAmount) > 0 && parseFloat(requiredCollateral) >= minCollateral;

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
            placeholder="10"
            value={loanAmount}
            onChange={(e) => handleLoanAmountChange(e.target.value)}
            step="0.1"
            min="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the amount you want to borrow
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
            Based on 60% LTV ratio (min collateral: {minCollateral} ETH)
          </p>
          {requiredCollateral && parseFloat(requiredCollateral) < minCollateral && (
            <p className="text-xs text-red-500 mt-1">
              Minimum collateral required: {minCollateral} ETH
            </p>
          )}
        </div>

        {loanAmount && requiredCollateral && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span>
                To borrow <strong>{loanAmount} ETH</strong>, you need to provide{' '}
                <strong>{requiredCollateral} ETH</strong> as collateral
              </span>
            </div>
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
              Creating Loan...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Create Loan Request
            </>
          )}
        </Button>

        {!isScoreSet && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              You need to set your credit score onchain before creating loan requests
            </p>
          </div>
        )}

        {!isCorrectNetwork && (
          <div className="p-3 bg-red-50 rounded-lg">
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
  const isValid = parseFloat(lendAmount) > 0;

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
            placeholder="10"
            value={lendAmount}
            onChange={(e) => onLendAmountChange(e.target.value)}
            step="0.1"
            min="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the amount you want to lend
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
          <div className="p-3 bg-red-50 rounded-lg">
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
  const [lendAmount, setLendAmount] = useState('');

  // Use custom hooks
  const creditScoreManager = useCreditScoreManager(userAddress, userCreditScore);
  const p2pLending = useP2PLending();
  const p2pData = useP2PData();

  // Handle loan creation
  const handleCreateLoan = async () => {
    if (!loanAmount || !collateralAmount) return;
    
    if (!creditScoreManager.isScoreSet) {
      alert('Credit score not found onchain. Please set it first.');
      return;
    }

    const success = await p2pLending.createLoanRequest(loanAmount, collateralAmount);
    if (success) {
      setLoanAmount('');
      setCollateralAmount('');
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
        <NetworkAlert />
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-gray-600">Please switch to Sepolia network to access P2P Lending</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              onLoanAmountChange={setLoanAmount}
              onCollateralAmountChange={setCollateralAmount}
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