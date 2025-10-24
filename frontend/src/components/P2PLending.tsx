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
  RefreshCw,
  ExternalLink,
  Zap,
  ArrowLeftRight
} from 'lucide-react';

// Import hooks
import { useCreditScoreManager } from '../hooks/useCreditScoreManager';
import { useP2PData } from '../hooks/useP2PData';

// Import Blockscout utilities
import { triggerTransactionPopup, ViewOnBlockscoutButton, TransactionStatusWithBlockscout } from '../utils/blockscout';

// Use Vite environment variables
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;
const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

console.log('🔧 Config:', { 
  SEPOLIA_RPC_URL: SEPOLIA_RPC_URL ? 'configured' : 'missing',
  ETHERSCAN_API_KEY: ETHERSCAN_API_KEY ? 'configured' : 'missing'
});

// Ultra-fast transaction checker with fallbacks
const checkTransactionFast = async (txHash: string): Promise<boolean> => {
  console.log('🔍 Checking transaction status...');
  
  // Method 1: Try Sepolia RPC first (fastest)
  if (SEPOLIA_RPC_URL) {
    try {
      console.log('🔄 Trying Sepolia RPC...');
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
        console.log('📊 RPC status:', status);
        
        if (status === '0x1') {
          console.log('✅ Transaction confirmed via RPC!');
          return true;
        } else if (status === '0x0') {
          console.log('❌ Transaction failed on-chain');
          return false;
        }
      }
    } catch (error) {
      console.log('⚠️ RPC failed:', error);
    }
  } else {
    console.log('⚠️ No RPC URL configured');
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

interface P2PLendingProps {
  userCreditScore: number;
  userAddress: string;
}

const P2P_LENDING_ADDRESS = '0x8F254C3A7858d05a9829391319821eC62d69ACa4' as `0x${string}`;

// Types for the contract data
interface LoanRequest {
  borrower: string;
  loanAmount: bigint;
  collateralAmount: bigint;
  duration: bigint;
  interestRate: bigint;
  createdAt: bigint;
  active: boolean;
  funded: boolean;
  creditScore: number;
  amountRepaid: bigint;
  lender?: string;
}

interface LenderOffer {
  lender: string;
  maxAmount: bigint;
  minCreditScore: bigint;
  minCollateralRatio: bigint;
  interestRate: bigint;
  maxDuration: bigint;
  active: boolean;
}

// Extended types for mock data
interface MockLoanRequest extends LoanRequest {
  loanId: number;
}

interface MockLenderOffer extends LenderOffer {
  offerId: number;
}

const P2P_LENDING_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "loanId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "loanAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "collateralAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "name": "LoanRequestCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "lender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "minCreditScore",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "minCollateralRatio",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "interestRate",
        "type": "uint256"
      }
    ],
    "name": "LenderOfferCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "loanId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "lender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "loanAmount",
        "type": "uint256"
      }
    ],
    "name": "LoanFunded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_loanAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_duration",
        "type": "uint256"
      }
    ],
    "name": "createLoanRequest",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_maxAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minCreditScore",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minCollateralRatio",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_interestRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxDuration",
        "type": "uint256"
      }
    ],
    "name": "createLenderOffer",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_loanId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_offerId",
        "type": "uint256"
      }
    ],
    "name": "fundLoan",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveLoanRequests",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "loanAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "collateralAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "duration",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "interestRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "lender",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "funded",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "creditScore",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amountRepaid",
            "type": "uint256"
          }
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
          {
            "internalType": "address",
            "name": "lender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "maxAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minCreditScore",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minCollateralRatio",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "interestRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxDuration",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
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
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "creditScore",
        "type": "uint256"
      }
    ],
    "name": "setCreditScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_loanId",
        "type": "uint256"
      }
    ],
    "name": "repayLoan",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// Mock data for demonstration with proper typing
const MOCK_LOAN_REQUESTS: MockLoanRequest[] = [
  {
    loanId: 1,
    borrower: '0x742E4C2C5Dc7Eb6B6C6D2b1c8C3a3D5F7a8B9c0d',
    loanAmount: BigInt(0.3 * 1e18),
    collateralAmount: BigInt(0.255 * 1e18),
    duration: BigInt(60 * 24 * 60 * 60),
    interestRate: BigInt(750),
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 86400),
    active: true,
    funded: false,
    creditScore: 400,
    amountRepaid: BigInt(0)
  },
  {
    loanId: 2,
    borrower: '0x893E4C2C5Dc7Eb6B6C6D2b1c8C3a3D5F7a8B9c1e',
    loanAmount: BigInt(0.3 * 1e18),
    collateralAmount: BigInt(0.255 * 1e18),
    duration: BigInt(90 * 24 * 60 * 60),
    interestRate: BigInt(450),
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 172800),
    active: true,
    funded: false,
    creditScore: 600,
    amountRepaid: BigInt(0)
  },
  {
    loanId: 3,
    borrower: '0x945E4C2C5Dc7Eb6B6C6D2b1c8C3a3D5F7a8B9c2f',
    loanAmount: BigInt(0.3 * 1e18),
    collateralAmount: BigInt(0.255 * 1e18),
    duration: BigInt(120 * 24 * 60 * 60),
    interestRate: BigInt(350),
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 259200),
    active: true,
    funded: false,
    creditScore: 800,
    amountRepaid: BigInt(0)
  }
];

const MOCK_LENDER_OFFERS: MockLenderOffer[] = [
  {
    offerId: 1,
    lender: '0x1234567890abcdef1234567890abcdef12345678',
    maxAmount: BigInt(0.3 * 1e18),
    minCreditScore: BigInt(400),
    minCollateralRatio: BigInt(8500),
    interestRate: BigInt(750),
    maxDuration: BigInt(60 * 24 * 60 * 60),
    active: true
  },
  {
    offerId: 2,
    lender: '0x2345678901bcdef2345678901bcdef2345678901',
    maxAmount: BigInt(0.3 * 1e18),
    minCreditScore: BigInt(600),
    minCollateralRatio: BigInt(8500),
    interestRate: BigInt(450),
    maxDuration: BigInt(90 * 24 * 60 * 60),
    active: true
  },
  {
    offerId: 3,
    lender: '0x3456789012cdef3456789012cdef3456789012cd',
    maxAmount: BigInt(0.3 * 1e18),
    minCreditScore: BigInt(800),
    minCollateralRatio: BigInt(8500),
    interestRate: BigInt(350),
    maxDuration: BigInt(120 * 24 * 60 * 60),
    active: true
  }
];

// Input component
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-8 w-full rounded-lg border-2 border-gray-400 bg-white/90 px-3 py-1 text-sm focus:outline-none focus:border-blue-500 focus:bg-white ${className}`}
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
      className={`text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
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
    <div className="grid grid-cols-3 gap-2 mb-3">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-2 border-2 border-blue-400 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="text-xs text-blue-600 font-medium mb-1">SCORE</div>
        <div className="text-base font-bold text-blue-700">{userCreditScore}</div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-2 border-2 border-green-400 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="text-xs text-green-600 font-medium mb-1">BORROW</div>
        <div className="text-base font-bold text-green-700">{userBorrowRate.toFixed(1)}%</div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-2 border-2 border-purple-400 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="text-xs text-purple-600 font-medium mb-1">LEND</div>
        <div className="text-base font-bold text-purple-700">{userLendRate.toFixed(1)}%</div>
      </div>
    </div>
  );
};

// Updated TransactionStatus component with Blockscout integration
const TransactionStatus: React.FC<{
  transactionHash: string | null;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  type: 'createLoan' | 'createOffer' | 'fundLoan' | 'setScore' | null;
}> = ({ transactionHash, isPending, isConfirming, isSuccess, error, type }) => {
  if (!transactionHash && !error && !isPending) return null;

  const getMessage = () => {
    switch (type) {
      case 'createLoan': return 'Loan request';
      case 'createOffer': return 'Lender offer';
      case 'fundLoan': return 'Loan funding';
      case 'setScore': return 'Credit score';
      default: return 'Transaction';
    }
  };

  const message = getMessage();

  return (
    <div className={`p-3 rounded-xl border-2 mb-3 ${
      isSuccess ? 'bg-green-50 border-green-400' :
      error ? 'bg-red-50 border-red-400' :
      'bg-blue-50 border-blue-400'
    } shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]`}>
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
          <ViewOnBlockscoutButton 
            transactionHash={transactionHash}
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

// CreditScoreStatus component with Blockscout integration
const CreditScoreStatus: React.FC<{
  creditScoreManager: {
    creditScore: number;
    isScoreSet: boolean;
    isUpdating: boolean;
    transactionError: string | null;
    setCreditScoreOnChain: () => Promise<boolean>;
    isCorrectNetwork: boolean;
    lastTransactionHash?: string | null; // Allow null
    viewTransactionOnBlockscout: (transactionHash?: string) => void;
  };
}> = ({ creditScoreManager }) => {
  const { 
    creditScore, 
    isScoreSet, 
    isUpdating, 
    transactionError, 
    setCreditScoreOnChain, 
    isCorrectNetwork, 
    lastTransactionHash,
    viewTransactionOnBlockscout 
  } = creditScoreManager;

  const handleViewOnBlockscout = () => {
    viewTransactionOnBlockscout(lastTransactionHash || undefined);
  };

  if (isScoreSet) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400 rounded-xl p-3 mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Credit Score Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600 border-2 border-green-700">{creditScore}</Badge>
            {lastTransactionHash && (
              <Button
                onClick={handleViewOnBlockscout}
                variant="outline"
                size="sm"
                className="h-6 text-xs border-2 border-blue-400 bg-white text-blue-600 hover:bg-blue-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View TX
              </Button>
            )}
          </div>
        </div>
        {lastTransactionHash && (
          <p className="text-xs text-green-600 mt-2">
            Successfully set on-chain at block {lastTransactionHash.slice(0, 10)}...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-3 mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
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
          className="h-7 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-2 border-yellow-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]"
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
  userAddress: string;
}> = ({ item, type, onSwipeRight, onSwipeLeft, userAddress }) => {
  const getTypeDetails = () => {
    if (type === 'loan') {
      const loanAmount = parseFloat(item.loanAmount?.toString() || '0') / 1e18;
      const collateralAmount = parseFloat(item.collateralAmount?.toString() || '0') / 1e18;
      const durationDays = Math.floor(parseFloat(item.duration?.toString() || '0') / (24 * 60 * 60));
      const interestRate = parseFloat(item.interestRate?.toString() || '0') / 100;
      
      return {
        title: `${loanAmount.toFixed(2)} ETH Loan`,
        subtitle: `Credit Score: ${item.creditScore || 'N/A'}`,
        address: item.borrower,
        details: [
          { label: 'Collateral', value: `${collateralAmount.toFixed(2)} ETH` },
          { label: 'Duration', value: `${durationDays} days` },
          { label: 'Interest', value: `${interestRate.toFixed(1)}%` }
        ]
      };
    } else {
      const maxAmount = parseFloat(item.maxAmount?.toString() || '0') / 1e18;
      const maxDurationDays = Math.floor(parseFloat(item.maxDuration?.toString() || '0') / (24 * 60 * 60));
      const interestRate = parseFloat(item.interestRate?.toString() || '0') / 100;
      
      return {
        title: `${maxAmount.toFixed(2)} ETH Offer`,
        subtitle: `Min Score: ${item.minCreditScore || 'N/A'}`,
        address: item.lender,
        details: [
          { label: 'Min Collateral', value: `${(parseFloat(item.minCollateralRatio?.toString() || '0') / 100).toFixed(0)}%` },
          { label: 'Max Duration', value: `${maxDurationDays} days` },
          { label: 'Rate', value: `${interestRate.toFixed(1)}%` }
        ]
      };
    }
  };

  const details = getTypeDetails();

  const handleViewOnBlockscout = () => {
    triggerTransactionPopup('11155111', details.address);
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-400 p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-blue-800 text-base">{details.title}</h3>
        <Badge variant={type === 'loan' ? 'default' : 'secondary'} className="border-2">
          {type === 'loan' ? 'Borrow' : 'Lend'}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{details.subtitle}</p>
        <Button
          onClick={handleViewOnBlockscout}
          variant="outline"
          size="sm"
          className="h-6 text-xs border-2 border-blue-400 bg-white text-blue-600 hover:bg-blue-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        {details.details.map((detail, index) => (
          <div key={index} className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-1">
            <div className="text-xs text-blue-600">{detail.label}</div>
            <div className="text-sm font-semibold text-blue-800">{detail.value}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button 
          onClick={() => onSwipeLeft(item)}
          className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:scale-110 transition-transform"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <span className="text-xs text-gray-500">Swipe to match</span>
        <button 
          onClick={() => onSwipeRight(item)}
          className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:scale-110 transition-transform"
        >
          <Heart className="h-5 w-5 text-white" />
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
  const [offerAmount, setOfferAmount] = useState('1.0');

  const handleCreate = () => {
    if (type === 'loan') {
      if (!loanAmount || parseFloat(loanAmount) <= 0 || !duration) {
        alert('Please enter a valid loan amount and duration');
        return;
      }
      
      if (parseFloat(loanAmount) < 0.1) {
        alert('Minimum loan amount is 0.1 ETH');
        return;
      }
      
      if (parseFloat(loanAmount) > 10) {
        alert('Loan amount too large. Maximum 10 ETH for demo.');
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
            placeholder="0.5"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            step="0.01"
            min="0.1"
            max="10"
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
            className="h-8 text-sm bg-blue-50 border-blue-300"
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

        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
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
          className="w-full h-8 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform"
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
          placeholder="1.0"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          step="0.1"
          min="0.1"
          max="10"
          className="h-8 text-sm"
        />
      </div>

      <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Auto-Matching</span>
        </div>
        <p className="text-xs text-green-700">
          Your offer will automatically match with borrowers based on their credit scores and requirements
        </p>
      </div>

      <Button
        onClick={handleCreate}
        disabled={!offerAmount || isCreating || !isCorrectNetwork}
        className="w-full h-8 text-sm bg-gradient-to-r from-green-500 to-blue-500 text-white border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform"
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
    type: null as 'createLoan' | 'createOffer' | 'fundLoan' | 'setScore' | null,
  });

  const isCorrectNetwork = chain?.id === sepolia.id;

  // Use custom hooks
  const creditScoreManager = useCreditScoreManager(userAddress, userCreditScore);
  const p2pData = useP2PData();

  // Combine real data with mock data for demonstration - use type assertions
  const availableLoanRequests = [
    ...(p2pData.loanRequests || []),
    ...MOCK_LOAN_REQUESTS
  ] as (LoanRequest | MockLoanRequest)[];

  const availableLenderOffers = [
    ...(p2pData.loanOffers || []),
    ...MOCK_LENDER_OFFERS
  ] as (LenderOffer | MockLenderOffer)[];

  // Get available items based on current view
  const availableItems = activeView === 'borrow' 
    ? availableLenderOffers
    : availableLoanRequests;

  const currentItem = availableItems?.[currentIndex];

  // Ultra-fast transaction confirmation with timeout
  const confirmTransaction = useCallback(async (txHash: string) => {
    console.log('🚀 Starting ultra-fast transaction confirmation...');
    
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
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
    }, 1000);
    
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
      const minCreditScore = BigInt(650);
      const minCollateralRatio = BigInt(8500);
      const interestRate = BigInt(450);
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

  const fundLoan = async (item: any): Promise<boolean> => {
    if (!isCorrectNetwork || !userAddress) return false;

    try {
      // For mock data, use the loanId if available, otherwise use a default
      const loanId = item.loanId || 1;
      const loanAmountWei = BigInt(parseFloat(item.loanAmount?.toString() || '0'));
      
      console.log('🔍 Funding loan:', {
        loanId,
        loanAmountWei: loanAmountWei.toString()
      });

      setTransactionState({
        hash: null,
        isPending: true,
        isConfirming: false,
        isSuccess: false,
        error: null,
        type: 'fundLoan'
      });

      return new Promise<boolean>((resolve) => {
        writeContract({
          address: P2P_LENDING_ADDRESS,
          abi: P2P_LENDING_ABI,
          functionName: 'fundLoan',
          args: [BigInt(loanId), BigInt(1)], // Using first offer for simplicity
          value: loanAmountWei,
        }, {
          onSuccess: (hash: string) => {
            console.log('✅ Funding transaction submitted:', hash);
            setTransactionState(prev => ({ 
              ...prev, 
              hash,
              isConfirming: true 
            }));
            resolve(true);
          },
          onError: (error: any) => {
            console.error('❌ Funding transaction failed:', error);
            let errorMessage = error.message || 'Transaction failed';
            
            if (errorMessage.includes('user rejected')) {
              errorMessage = 'Transaction was rejected';
            } else if (errorMessage.includes('insufficient funds')) {
              errorMessage = 'Insufficient ETH for funding + gas fees';
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
      console.error('❌ Error funding loan:', error);
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
      // As a borrower, accept a lender offer - create loan request
      await createLoanRequest(
        (parseFloat(item.maxAmount?.toString() || '0') / 1e18).toString(),
        (parseFloat(item.maxDuration?.toString() || '0') / (24 * 60 * 60)).toString()
      );
    } else {
      // As a lender, fund a loan request
      await fundLoan(item);
    }
    
    if (currentIndex < (availableItems?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleSwipeLeft = (item: any) => {
    console.log('Skipped:', item);
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
    setCurrentIndex(0);
    console.log('🔄 Manual refresh triggered');
  };

  if (!isConnected) {
    return (
      <Card className="border-4 border-white bg-gradient-to-br from-blue-50 to-pink-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] font-vt323">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-lg text-blue-800 bg-white/80 rounded-lg py-1 px-3 border-2 border-blue-300 inline-block">
            P2P LENDING
          </CardTitle>
          <CardDescription className="text-sm text-gray-700">CONNECT YOUR WALLET TO START</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 text-sm">Connect your wallet to access credit-based lending</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConnected && !isCorrectNetwork) {
    return (
      <Card className="border-4 border-white bg-gradient-to-br from-yellow-50 to-orange-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] font-vt323">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-lg text-blue-800">WRONG NETWORK</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-3">
            <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
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
    <div className="p-3 space-y-3 font-vt323 max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className="border-4 border-white bg-gradient-to-br from-blue-50 to-pink-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <CardHeader className="pb-2 text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <ArrowLeftRight className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-blue-800 bg-white/80 rounded-lg py-1 px-3 border-2 border-blue-300 inline-block">
            SWIPE TO MATCH LENDING OPPORTUNITIES
          </CardTitle>
          <CardDescription className="flex items-center justify-between text-sm text-gray-700 mt-2">
            <span></span>
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              size="sm"
              className="h-6 text-xs border-2 border-gray-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)] bg-white"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickStats userCreditScore={userCreditScore} />
          
          {/* View Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-3 border-2 border-gray-300">
            <Button
              variant={activeView === 'borrow' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveView('borrow');
                setCurrentIndex(0);
              }}
              className="flex-1 h-8 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]"
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
              className="flex-1 h-8 text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white border-2 border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Lend
            </Button>
          </div>

          {/* Tab Toggle */}
          <div className="flex space-x-1 bg-gray-50 p-1 rounded-xl mb-2 border-2 border-gray-300">
            <Button
              variant={activeTab === 'swipe' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('swipe')}
              className="flex-1 h-7 text-xs bg-gradient-to-r from-pink-500 to-blue-500 text-white border-2 border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]"
            >
              <Eye className="h-3 w-3 mr-1" />
              Browse
            </Button>
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('create')}
              className="flex-1 h-7 text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white border-2 border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]"
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
        <Card className="border-4 border-white bg-gradient-to-br from-white to-blue-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
              <Filter className="h-4 w-4" />
              {activeView === 'borrow' ? 'AVAILABLE LOAN OFFERS' : 'LOAN REQUESTS'}
              <div className="flex items-center gap-2 ml-auto">
                {availableItems && availableItems.length > 0 && (
                  <Badge variant="outline" className="border-2 bg-white">
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
                userAddress={userAddress}
              />
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">No {activeView === 'borrow' ? 'offers' : 'requests'} available</p>
                <p className="text-xs text-gray-500 mt-1">Check back later or create one</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-4 border-white bg-gradient-to-br from-green-50 to-blue-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800">
              CREATE {activeView === 'borrow' ? 'LOAN REQUEST' : 'LENDER OFFER'}
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