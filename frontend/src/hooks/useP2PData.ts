// hooks/useP2PData.ts
import { useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const P2P_LENDING_ADDRESS = '0x8F254C3A7858d05a9829391319821eC62d69ACa4' as `0x${string}`;

// Use the SAME ABI as in P2PLending.tsx
const P2P_LENDING_ABI = [
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
            "name": "minCollateralRatio", // ✅ CORRECT: This matches your contract
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
  }
] as const;

export interface LoanOffer {
  id: number;
  lender: string;
  token: string;
  amount: number;
  minScore: number;
  minCollateralRatio: number; // ✅ Update this field name
  interestRate: number;
  duration: number;
  status: 'active' | 'filled' | 'cancelled';
}

export interface LoanRequest {
  id: number;
  borrower: string;
  token: string;
  amount: number;
  collateral: number;
  duration: number;
  interestRate: number;
  status: 'pending' | 'funded' | 'cancelled';
  createdAt: Date;
  creditScore: number; // ✅ Add this field
}

export const useP2PData = () => {
  const { 
    data: activeLoanRequests,
    refetch: refetchLoanRequests,
    isLoading: isLoadingRequests,
    error: requestsError // ✅ Add error handling
  } = useReadContract({
    address: P2P_LENDING_ADDRESS,
    abi: P2P_LENDING_ABI,
    functionName: 'getActiveLoanRequests',
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  });

  const { 
    data: activeLenderOffers,
    refetch: refetchLenderOffers,
    isLoading: isLoadingOffers,
    error: offersError // ✅ Add error handling
  } = useReadContract({
    address: P2P_LENDING_ADDRESS,
    abi: P2P_LENDING_ABI,
    functionName: 'getActiveLenderOffers',
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  });

  // Add debug logging
  console.log('🔍 useP2PData Debug:', {
    activeLoanRequests,
    activeLenderOffers,
    requestsError,
    offersError
  });

  const processLoanRequests = (): LoanRequest[] => {
    if (!activeLoanRequests || !Array.isArray(activeLoanRequests)) {
      console.log('❌ No loan requests data or not an array');
      return [];
    }
    
    console.log('📋 Processing loan requests:', activeLoanRequests.length);
    
    return activeLoanRequests.map((req: any, index: number) => ({
      id: index + 1,
      borrower: req.borrower,
      token: 'ETH',
      amount: Number(req.loanAmount) / 1e18,
      collateral: Number(req.collateralAmount) / 1e18,
      duration: Number(req.duration) / (24 * 60 * 60),
      interestRate: Number(req.interestRate) / 100,
      status: req.funded ? 'funded' : req.active ? 'pending' : 'cancelled',
      createdAt: new Date(Number(req.createdAt) * 1000),
      creditScore: Number(req.creditScore)
    }));
  };

  const processLoanOffers = (): LoanOffer[] => {
    if (!activeLenderOffers || !Array.isArray(activeLenderOffers)) {
      console.log('❌ No lender offers data or not an array');
      return [];
    }
    
    console.log('📋 Processing loan offers:', activeLenderOffers.length);
    
    return activeLenderOffers.map((offer: any, index: number) => ({
      id: index + 1,
      lender: offer.lender,
      token: 'ETH',
      amount: Number(offer.maxAmount) / 1e18,
      minScore: Number(offer.minCreditScore),
      minCollateralRatio: Number(offer.minCollateralRatio) / 100, // ✅ Use correct field
      interestRate: Number(offer.interestRate) / 100,
      duration: Number(offer.maxDuration) / (24 * 60 * 60),
      status: offer.active ? 'active' : 'cancelled'
    }));
  };

  const loanRequests = processLoanRequests();
  const loanOffers = processLoanOffers();

  return {
    loanRequests,
    loanOffers,
    isLoading: isLoadingRequests || isLoadingOffers,
    refetchAll: () => {
      console.log('🔄 Refetching P2P data...');
      refetchLoanRequests();
      refetchLenderOffers();
    },
    errors: {
      requestsError,
      offersError
    }
  };
};