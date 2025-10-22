// components/P2PLending.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  DollarSign, 
  TrendingUp, 
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Lock,
  Heart,
  X,
  Users,
  Eye,
  Filter,
  Plus,
  RefreshCw
} from 'lucide-react';

// Import hooks
import { useCreditScoreManager } from '../hooks/useCreditScoreManager';
import { useP2PData } from '../hooks/useP2PData';

// Use Vite environment variables
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;
const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

console.log('🔧 Config:', { 
  SEPOLIA_RPC_URL: SEPOLIA_RPC_URL ? 'configured' : 'missing',
  ETHERSCAN_API_KEY: ETHERSCAN_API_KEY ? 'configured' : 'missing'
});

interface P2PLendingProps {
  userCreditScore: number;
  userAddress: string;
}

const P2P_LENDING_ADDRESS = '0x8F254C3A7858d05a9829391319821eC62d69ACa4' as `0x${string}`;

const P2P_LENDING_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_loanAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_duration", "type": "uint256" }
    ],
    "name": "createLoanRequest",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_maxAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_minCreditScore", "type": "uint256" },
      { "internalType": "uint256", "name": "_minCollateralRatio", "type": "uint256" },
      { "internalType": "uint256", "name": "_interestRate", "type": "uint256" },
      { "internalType": "uint256", "name": "_maxDuration", "type": "uint256" }
    ],
    "name": "createLenderOffer",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveLoanRequests",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "borrower", "type": "address" },
          { "internalType": "uint256", "name": "loanAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "collateralAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "duration", "type": "uint256" },
          { "internalType": "uint256", "name": "interestRate", "type": "uint256" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "bool", "name": "active", "type": "bool" },
          { "internalType": "address", "name": "lender", "type": "address" },
          { "internalType": "bool", "name": "funded", "type": "bool" },
          { "internalType": "uint256", "name": "creditScore", "type": "uint256" },
          { "internalType": "uint256", "name": "amountRepaid", "type": "uint256" }
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
          { "internalType": "address", "name": "lender", "type": "address" },
          { "internalType": "uint256", "name": "maxAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "minCreditScore", "type": "uint256" },
          { "internalType": "uint256", "name": "minCollateralRatio", "type": "uint256" },
          { "internalType": "uint256", "name": "interestRate", "type": "uint256" },
          { "internalType": "uint256", "name": "maxDuration", "type": "uint256" },
          { "internalType": "bool", "name": "active", "type": "bool" }
        ],
        "internalType": "struct P2PLending.LenderOffer[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Ultra-fast transaction checker with fallbacks
const checkTransactionFast = async (txHash: string): Promise<boolean> => {
  console.log('🔍 Checking transaction status...');
  
  // Method 1: Try Alchemy RPC first (fastest)
  if (SEPOLIA_RPC_URL) {
    try {
      console.log('🔄 Trying Alchemy RPC...');
      const rpcResponse = await fetch(SEPOLIA_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1
        })
      });
      
      const rpcData = await rpcResponse.json();
      
      if (rpcData.result) {
        const status = rpcData.result.status;
        console.log('📊 Alchemy RPC status:', status);
        
        if (status === '0x1') {
          console.log('✅ Transaction confirmed via Alchemy RPC!');
          return true;
        } else if (status === '0x0') {
          console.log('❌ Transaction failed on-chain');
          return false;
        }
      }
    } catch (error) {
      console.log('⚠️ Alchemy RPC failed:', error);
    }
  } else {
    console.log('⚠️ No Alchemy RPC URL configured');
  }
  
  // Method 2: Fallback to Etherscan API
  try {
    console.log('🔄 Trying Etherscan API...');
    const etherscanUrl = ETHERSCAN_API_KEY 
      ? `https://api-sepolia.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
      : `https://api-sepolia.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`;
    
    const etherscanResponse = await fetch(etherscanUrl);
    const etherscanData = await etherscanResponse.json();
    
    if (etherscanData.status === '1' && etherscanData.result?.status === '1') {
      console.log('✅ Transaction confirmed via Etherscan!');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Etherscan API failed:', error);
  }
  
  console.log('⏳ Transaction not yet confirmed');
  return false;
};

// Input component
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

const QuickStats: React.FC<{ userCreditScore: number }> = ({ userCreditScore }) => {
  const calculateBorrowRate = (creditScore: number): number => {
    const baseRate = 3.5;
    if (creditScore >= 800) return baseRate;
    if (creditScore >= 750) return baseRate + 0.5;
    if (creditScore >= 700) return baseRate + 1.0;
    if (creditScore >= 650) return baseRate + 2.0;
    return baseRate + 4.0;
  };

  const userBorrowRate = calculateBorrowRate(userCreditScore);
  const userLendRate = userBorrowRate - 1.0;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 text-center">
        <div className="text-xs text-blue-600 font-medium mb-1">SCORE</div>
        <div className="text-lg font-bold text-blue-700">{userCreditScore}</div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200 text-center">
        <div className="text-xs text-green-600 font-medium mb-1">BORROW</div>
        <div className="text-lg font-bold text-green-700">{userBorrowRate.toFixed(1)}%</div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200 text-center">
        <div className="text-xs text-purple-600 font-medium mb-1">LEND</div>
        <div className="text-lg font-bold text-purple-700">{userLendRate.toFixed(1)}%</div>
      </div>
    </div>
  );
};

const TransactionStatus: React.FC<{
  transactionHash: string | null;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  type: 'createLoan' | 'createOffer' | null;
}> = ({ transactionHash, isPending, isConfirming, isSuccess, error, type }) => {
  if (!transactionHash && !error && !isPending) return null;

  const getMessage = () => {
    switch (type) {
      case 'createLoan': return 'Loan request';
      case 'createOffer': return 'Lender offer';
      default: return 'Transaction';
    }
  };

  const message = getMessage();

  return (
    <div className={`p-3 rounded-lg border mb-4 ${
      isSuccess ? 'bg-green-50 border-green-200' :
      error ? 'bg-red-50 border-red-200' :
      'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : error ? (
          <XCircle className="h-4 w-4 text-red-600" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isSuccess ? 'Success!' : error ? 'Failed' : isConfirming ? 'Confirming...' : 'Processing...'}
          </p>
          <p className="text-xs text-gray-600">
            {error || `${message} ${isSuccess ? 'completed' : isConfirming ? 'being confirmed' : 'being processed'}`}
          </p>
        </div>
        {transactionHash && (
          <a 
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            View
          </a>
        )}
      </div>
    </div>
  );
};

const CreditScoreStatus: React.FC<{
  creditScoreManager: {
    creditScore: number;
    isScoreSet: boolean;
    isUpdating: boolean;
    transactionError: string | null;
    setCreditScoreOnChain: () => Promise<boolean>;
    isCorrectNetwork: boolean;
  };
}> = ({ creditScoreManager }) => {
  const { creditScore, isScoreSet, isUpdating, transactionError, setCreditScoreOnChain, isCorrectNetwork } = creditScoreManager;

  if (isScoreSet) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Credit Score Verified</span>
          </div>
          <Badge variant="default" className="bg-green-600">{creditScore}</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Set Credit Score</p>
            <p className="text-xs text-yellow-700">Required for borrowing</p>
          </div>
        </div>
        <Button 
          onClick={setCreditScoreOnChain}
          disabled={isUpdating || !isCorrectNetwork}
          size="sm"
          className="h-7 text-xs bg-yellow-600 hover:bg-yellow-700"
        >
          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
        </Button>
      </div>
      {transactionError && (
        <p className="text-xs text-red-600 mt-2">{transactionError}</p>
      )}
    </div>
  );
};

const SwipeCard: React.FC<{
  item: any;
  type: 'loan' | 'offer';
  onSwipeRight: (item: any) => void;
  onSwipeLeft: (item: any) => void;
}> = ({ item, type, onSwipeRight, onSwipeLeft }) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const swipeDistance = currentX;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        onSwipeRight(item);
      } else {
        onSwipeLeft(item);
      }
    }
    
    setCurrentX(0);
    setIsDragging(false);
  };

  const getTypeDetails = () => {
    if (type === 'loan') {
      return {
        title: `${item.amount || parseFloat(item.loanAmount) / 1e18} ETH Loan`,
        subtitle: `Credit Score: ${item.creditScore || 'N/A'}`,
        details: [
          { label: 'Collateral', value: `${item.collateral || parseFloat(item.collateralAmount) / 1e18} ETH` },
          { label: 'Duration', value: `${Math.floor((item.duration || 0) / (24 * 60 * 60))} days` },
          { label: 'Interest', value: `${(item.interestRate || 0) / 100}%` }
        ]
      };
    } else {
      return {
        title: `${item.amount || parseFloat(item.maxAmount) / 1e18} ETH Offer`,
        subtitle: `Min Score: ${item.minScore || item.minCreditScore || 'N/A'}`,
        details: [
          { label: 'Min Collateral', value: `${(item.minCollateralRatio || 0) / 100}%` },
          { label: 'Max Duration', value: `${Math.floor((item.duration || item.maxDuration || 0) / (24 * 60 * 60))} days` },
          { label: 'Rate', value: `${(item.interestRate || 0) / 100}%` }
        ]
      };
    }
  };

  const details = getTypeDetails();

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-grab active:cursor-grabbing"
      style={{ transform: `translateX(${currentX}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{details.title}</h3>
        <Badge variant={type === 'loan' ? 'default' : 'secondary'}>
          {type === 'loan' ? 'Borrow' : 'Lend'}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{details.subtitle}</p>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {details.details.map((detail, index) => (
          <div key={index} className="text-center">
            <div className="text-xs text-gray-500">{detail.label}</div>
            <div className="text-sm font-semibold text-gray-900">{detail.value}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button 
          onClick={() => onSwipeLeft(item)}
          className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="text-xs text-gray-500">Swipe or click</span>
        <button 
          onClick={() => onSwipeRight(item)}
          className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

const CreateForm: React.FC<{
  type: 'loan' | 'offer';
  onCreate: (data: any) => void;
  isCreating: boolean;
  isCorrectNetwork: boolean;
  isScoreSet: boolean;
}> = ({ type, onCreate, isCreating, isCorrectNetwork, isScoreSet }) => {
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('90');
  const [offerAmount, setOfferAmount] = useState('5.0');

  const handleCreate = () => {
    if (type === 'loan') {
      if (!loanAmount || parseFloat(loanAmount) <= 0 || !duration) {
        alert('Please enter a valid loan amount and duration');
        return;
      }
      
      if (parseFloat(loanAmount) < 0.2) {
        alert('Minimum loan amount is 0.2 ETH');
        return;
      }
      
      if (parseFloat(loanAmount) > 100) {
        alert('Loan amount too large. Maximum 100 ETH for demo.');
        return;
      }
      
      onCreate({ loanAmount, duration });
    } else {
      if (!offerAmount || parseFloat(offerAmount) <= 0) {
        alert('Please enter a valid offer amount');
        return;
      }
      onCreate({ maxAmount: offerAmount });
    }
  };

  const collateralAmount = loanAmount ? (parseFloat(loanAmount) * 0.85).toFixed(4) : '0';

  if (type === 'loan') {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="loanAmount" className="text-xs">Loan Amount (ETH)</Label>
          <Input
            id="loanAmount"
            type="number"
            placeholder="0.2"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            step="0.01"
            min="0.01"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="collateral" className="text-xs">Required Collateral</Label>
          <Input
            id="collateral"
            type="text"
            value={`${collateralAmount} ETH (85%)`}
            readOnly
            className="h-8 text-sm bg-gray-50"
          />
        </div>

        <div>
          <Label htmlFor="duration" className="text-xs">Duration (Days)</Label>
          <Input
            id="duration"
            type="number"
            placeholder="90"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="30"
            max="365"
            className="h-8 text-sm"
          />
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Transaction Details</span>
          </div>
          <p className="text-xs text-blue-700">
            You'll need to send <strong>{collateralAmount} ETH</strong> as collateral with this transaction
          </p>
        </div>

        <Button
          onClick={handleCreate}
          disabled={!loanAmount || isCreating || !isCorrectNetwork || !isScoreSet}
          className="w-full h-8 text-sm"
        >
          {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create Loan'}
        </Button>

        {!isScoreSet && (
          <p className="text-xs text-yellow-600 text-center">
            Set your credit score first to create loan requests
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="offerAmount" className="text-xs">Lend Amount (ETH)</Label>
        <Input
          id="offerAmount"
          type="number"
          placeholder="5.0"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          step="0.1"
          min="0.1"
          className="h-8 text-sm"
        />
      </div>

      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Auto-Matching</span>
        </div>
        <p className="text-xs text-blue-700">
          Your offer will automatically match with borrowers based on their credit scores and requirements
        </p>
      </div>

      <Button
        onClick={handleCreate}
        disabled={!offerAmount || isCreating || !isCorrectNetwork}
        className="w-full h-8 text-sm"
      >
        {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create Offer'}
      </Button>
    </div>
  );
};

export const P2PLending: React.FC<P2PLendingProps> = ({ userCreditScore, userAddress }) => {
  const { isConnected, chain } = useAccount();
  const { writeContract } = useWriteContract();
  
  const [activeTab, setActiveTab] = useState<'swipe' | 'create'>('swipe');
  const [activeView, setActiveView] = useState<'borrow' | 'lend'>('borrow');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transactionState, setTransactionState] = useState({
    hash: null as string | null,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null as string | null,
    type: null as 'createLoan' | 'createOffer' | null,
  });

  const isCorrectNetwork = chain?.id === sepolia.id;

  // Use custom hooks
  const creditScoreManager = useCreditScoreManager(userAddress, userCreditScore);
  const p2pData = useP2PData();

  // Get available items based on current view
  const availableItems = activeView === 'borrow' 
    ? p2pData.loanOffers
    : p2pData.loanRequests;

  const currentItem = availableItems?.[currentIndex];

  // Ultra-fast transaction confirmation with timeout
  const confirmTransaction = useCallback(async (txHash: string) => {
    console.log('🚀 Starting ultra-fast transaction confirmation...');
    console.log('🔗 Using RPC:', SEPOLIA_RPC_URL);
    
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`🔄 Confirmation attempt ${attempts}/${maxAttempts}`);
      
      try {
        const isConfirmed = await checkTransactionFast(txHash);
        
        if (isConfirmed) {
          confirmed = true;
          clearInterval(pollInterval);
          console.log('🎉 Transaction confirmed! Updating UI...');
          
          setTransactionState(prev => ({ 
            ...prev, 
            isSuccess: true,
            isConfirming: false,
            isPending: false
          }));
          
          // Immediate data refresh
          p2pData.refetchAll();
          console.log('🔄 Data refreshed after confirmation');
          
          // Clear after 5 seconds
          setTimeout(() => {
            setTransactionState({
              hash: null,
              isPending: false,
              isConfirming: false,
              isSuccess: false,
              error: null,
              type: null
            });
          }, 5000);
        }
      } catch (error) {
        console.error('❌ Error during confirmation:', error);
      }
      
      // Stop after max attempts
      if (attempts >= maxAttempts && !confirmed) {
        clearInterval(pollInterval);
        console.log('⏰ Max confirmation attempts reached');
        setTransactionState(prev => ({
          ...prev,
          isConfirming: false,
          error: 'Transaction confirmation timeout. Check Etherscan manually.'
        }));
      }
    }, 1000); // Check every 1 second
    
  }, [p2pData]);

  // Start confirmation when we get a transaction hash
  useEffect(() => {
    if (transactionState.hash && !transactionState.isSuccess && !transactionState.error) {
      console.log('🔄 Starting confirmation for tx:', transactionState.hash);
      confirmTransaction(transactionState.hash);
    }
  }, [transactionState.hash, transactionState.isSuccess, transactionState.error, confirmTransaction]);

  const createLoanRequest = async (loanAmount: string, durationDays: string): Promise<boolean> => {
    if (!isCorrectNetwork || !userAddress) return false;

    try {
      const loanAmountWei = BigInt(Math.floor(parseFloat(loanAmount) * 1e18));
      const durationSeconds = BigInt(parseInt(durationDays) * 24 * 60 * 60);
      const collateralWei = BigInt(Math.floor(parseFloat(loanAmount) * 0.85 * 1e18));

      console.log('🔍 Creating loan request:', {
        loanAmountETH: loanAmount,
        loanAmountWei: loanAmountWei.toString(),
        collateralETH: (parseFloat(loanAmount) * 0.85).toFixed(6),
        collateralWei: collateralWei.toString(),
        durationDays: durationDays,
        durationSeconds: durationSeconds.toString()
      });

      setTransactionState({
        hash: null,
        isPending: true,
        isConfirming: false,
        isSuccess: false,
        error: null,
        type: 'createLoan'
      });

      return new Promise<boolean>((resolve) => {
        writeContract({
          address: P2P_LENDING_ADDRESS,
          abi: P2P_LENDING_ABI,
          functionName: 'createLoanRequest',
          args: [loanAmountWei, durationSeconds],
          value: collateralWei,
        }, {
          onSuccess: (hash: string) => {
            console.log('✅ Transaction submitted:', hash);
            setTransactionState(prev => ({ 
              ...prev, 
              hash,
              isConfirming: true 
            }));
            resolve(true);
          },
          onError: (error: any) => {
            console.error('❌ Transaction failed:', error);
            let errorMessage = error.message || 'Transaction failed';
            
            if (errorMessage.includes('user rejected')) {
              errorMessage = 'Transaction was rejected';
            } else if (errorMessage.includes('insufficient funds')) {
              errorMessage = 'Insufficient ETH for collateral + gas fees';
            }
            
            setTransactionState(prev => ({ 
              ...prev, 
              isPending: false,
              error: errorMessage
            }));
            resolve(false);
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Error creating loan:', error);
      setTransactionState(prev => ({ 
        ...prev, 
        isPending: false,
        error: error.message || 'Unknown error occurred'
      }));
      return false;
    }
  };

  const createLenderOffer = async (maxAmount: string): Promise<boolean> => {
    if (!isCorrectNetwork || !userAddress) return false;

    try {
      const maxAmountWei = BigInt(Math.floor(parseFloat(maxAmount) * 1e18));
      const minCreditScore = BigInt(700);
      const minCollateralRatio = BigInt(8500);
      const interestRate = BigInt(500);
      const maxDuration = BigInt(90 * 24 * 60 * 60);

      console.log('🔍 Creating lender offer:', {
        maxAmountETH: maxAmount,
        maxAmountWei: maxAmountWei.toString()
      });

      setTransactionState({
        hash: null,
        isPending: true,
        isConfirming: false,
        isSuccess: false,
        error: null,
        type: 'createOffer'
      });

      return new Promise<boolean>((resolve) => {
        writeContract({
          address: P2P_LENDING_ADDRESS,
          abi: P2P_LENDING_ABI,
          functionName: 'createLenderOffer',
          args: [maxAmountWei, minCreditScore, minCollateralRatio, interestRate, maxDuration],
        }, {
          onSuccess: (hash: string) => {
            console.log('✅ Offer transaction submitted:', hash);
            setTransactionState(prev => ({ 
              ...prev, 
              hash,
              isConfirming: true 
            }));
            resolve(true);
          },
          onError: (error: any) => {
            console.error('❌ Offer transaction failed:', error);
            let errorMessage = error.message || 'Transaction failed';
            
            if (errorMessage.includes('user rejected')) {
              errorMessage = 'Transaction was rejected';
            }
            
            setTransactionState(prev => ({ 
              ...prev, 
              isPending: false,
              error: errorMessage
            }));
            resolve(false);
          }
        });
      });
    } catch (error: any) {
      console.error('❌ Error creating offer:', error);
      setTransactionState(prev => ({ 
        ...prev, 
        isPending: false,
        error: error.message || 'Unknown error occurred'
      }));
      return false;
    }
  };

  const handleSwipeRight = async (item: any) => {
    if (activeView === 'borrow') {
      await createLoanRequest(
        (item.amount || item.maxAmount / 1e18).toString(),
        (item.duration || item.maxDuration / (24 * 60 * 60)).toString()
      );
    } else {
      alert('As a lender, you create offers that borrowers can accept. Use the Create tab to make an offer.');
      return;
    }
    
    if (currentIndex < (availableItems?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleSwipeLeft = (item: any) => {
    if (currentIndex < (availableItems?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleCreate = async (data: any) => {
    if (activeView === 'borrow') {
      await createLoanRequest(data.loanAmount, data.duration);
    } else {
      await createLenderOffer(data.maxAmount || data.offerAmount);
    }
  };

  const handleManualRefresh = () => {
    p2pData.refetchAll();
    console.log('🔄 Manual refresh triggered');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">P2P Lending</CardTitle>
          <CardDescription>Connect your wallet to start</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 text-sm">Connect your wallet to access credit-based lending</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConnected && !isCorrectNetwork) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Wrong Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm text-gray-600 mb-3">
              Please switch to Sepolia testnet to use Credit Cupid
            </p>
            <p className="text-xs text-gray-500">
              Get free Sepolia ETH from: sepoliafaucet.com
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Credit Cupid
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Swipe right to match with perfect lending opportunities</span>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="h-6 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickStats userCreditScore={userCreditScore} />
          
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-3">
            <Button
              variant={activeView === 'borrow' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveView('borrow');
                setCurrentIndex(0);
              }}
              className="flex-1 h-8 text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Borrow
            </Button>
            <Button
              variant={activeView === 'lend' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveView('lend');
                setCurrentIndex(0);
              }}
              className="flex-1 h-8 text-xs"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Lend
            </Button>
          </div>

          <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg mb-4">
            <Button
              variant={activeTab === 'swipe' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('swipe')}
              className="flex-1 h-7 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Browse
            </Button>
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('create')}
              className="flex-1 h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <TransactionStatus
        transactionHash={transactionState.hash}
        isPending={transactionState.isPending}
        isConfirming={transactionState.isConfirming}
        isSuccess={transactionState.isSuccess}
        error={transactionState.error}
        type={transactionState.type}
      />

      <CreditScoreStatus creditScoreManager={creditScoreManager} />

      {activeTab === 'swipe' ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {activeView === 'borrow' ? 'Available Loan Offers' : 'Loan Requests'}
              <div className="flex items-center gap-2 ml-auto">
                {availableItems && (
                  <Badge variant="outline">
                    {currentIndex + 1} of {availableItems.length}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableItems && availableItems.length > 0 ? (
              <SwipeCard
                item={currentItem}
                type={activeView === 'borrow' ? 'offer' : 'loan'}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
              />
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 text-sm">No {activeView === 'borrow' ? 'offers' : 'requests'} available</p>
                <p className="text-xs text-gray-500 mt-1">Check back later or create one</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Create {activeView === 'borrow' ? 'Loan Request' : 'Lender Offer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateForm
              type={activeView === 'borrow' ? 'loan' : 'offer'}
              onCreate={handleCreate}
              isCreating={transactionState.isPending}
              isCorrectNetwork={isCorrectNetwork}
              isScoreSet={creditScoreManager.isScoreSet}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};