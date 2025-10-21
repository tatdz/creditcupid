import { useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const P2P_LENDING_ADDRESS = '0xaF1847D02A5d235730c19f1aA5D95296D5EAE691' as `0x${string}`;

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
            "name": "maxLtv",
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
  maxLtv: number;
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
}

export const useP2PData = () => {
  const { 
    data: activeLoanRequests,
    refetch: refetchLoanRequests,
    isLoading: isLoadingRequests
  } = useReadContract({
    address: P2P_LENDING_ADDRESS,
    abi: P2P_LENDING_ABI,
    functionName: 'getActiveLoanRequests',
    query: {
      refetchInterval: 15000,
    }
  });

  const { 
    data: activeLenderOffers,
    refetch: refetchLenderOffers,
    isLoading: isLoadingOffers
  } = useReadContract({
    address: P2P_LENDING_ADDRESS,
    abi: P2P_LENDING_ABI,
    functionName: 'getActiveLenderOffers',
    query: {
      refetchInterval: 15000,
    }
  });

  const processLoanRequests = (): LoanRequest[] => {
    if (!activeLoanRequests || !Array.isArray(activeLoanRequests)) return [];
    
    return activeLoanRequests.map((req: any, index: number) => ({
      id: index + 1,
      borrower: req.borrower,
      token: 'ETH',
      amount: Number(req.loanAmount) / 1e18,
      collateral: Number(req.collateralAmount) / 1e18,
      duration: Number(req.duration) / (24 * 60 * 60),
      interestRate: Number(req.interestRate) / 100,
      status: req.funded ? 'funded' : 'pending',
      createdAt: new Date(Number(req.createdAt) * 1000)
    }));
  };

  const processLoanOffers = (): LoanOffer[] => {
    if (!activeLenderOffers || !Array.isArray(activeLenderOffers)) return [];
    
    return activeLenderOffers.map((offer: any, index: number) => ({
      id: index + 1,
      lender: offer.lender,
      token: 'ETH',
      amount: Number(offer.maxAmount) / 1e18,
      minScore: Number(offer.minCreditScore),
      maxLtv: Number(offer.maxLtv) / 100,
      interestRate: Number(offer.interestRate) / 100,
      duration: Number(offer.maxDuration) / (24 * 60 * 60),
      status: offer.active ? 'active' : 'cancelled'
    }));
  };

  return {
    loanRequests: processLoanRequests(),
    loanOffers: processLoanOffers(),
    isLoading: isLoadingRequests || isLoadingOffers,
    refetchAll: () => {
      refetchLoanRequests();
      refetchLenderOffers();
    }
  };
};