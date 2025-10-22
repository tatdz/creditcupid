import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';

// Contract addresses for Sepolia
const CREDIT_SCORE_ADDRESS = '0x246E504F0B17A36906C3A9E255dbe3b51D54BcA8' as `0x${string}`;
const P2P_LENDING_ADDRESS = '0x8F254C3A7858d05a9829391319821eC62d69ACa4' as `0x${string}`;

// CreditScore contract ABI
const CREDIT_SCORE_ABI = [
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
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newScore",
        "type": "uint256"
      }
    ],
    "name": "CreditScoreUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "creditScores",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
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
      }
    ],
    "name": "getCreditScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
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
        "name": "score",
        "type": "uint256"
      }
    ],
    "name": "setCreditScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// P2PLending contract ABI for credit score
const P2P_LENDING_ABI = [
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
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserCreditScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Helper function to convert BigInt to number safely
const bigIntToNumber = (value: bigint | undefined | null): number => {
  if (!value) return 0;
  try {
    return Number(value);
  } catch {
    return 0;
  }
};

export interface CreditScoreState {
  creditScore: number;
  onChainScore: number;
  isScoreSet: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  transactionHash: string | null;
  isSuccess: boolean;
}

export const useCreditScore = (userAddress: string, initialCreditScore: number) => {
  const { isConnected, chain } = useAccount();
  const { writeContract } = useWriteContract();
  
  const [state, setState] = useState<CreditScoreState>({
    creditScore: 0,
    onChainScore: 0,
    isScoreSet: false,
    isLoading: true,
    isUpdating: false,
    error: null,
    transactionHash: null,
    isSuccess: false
  });

  const isCorrectNetwork = chain?.id === sepolia.id;

  // Read credit score from CreditScore contract
  const { 
    data: creditScoreData, 
    refetch: refetchCreditScore,
    isLoading: isLoadingCreditScore 
  } = useReadContract({
    address: CREDIT_SCORE_ADDRESS,
    abi: CREDIT_SCORE_ABI,
    functionName: 'getCreditScore',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: isConnected && isCorrectNetwork && !!userAddress,
      refetchInterval: 3000,
    }
  });

  // Read on-chain credit score from P2PLending contract
  const { 
    data: onChainCreditScore, 
    refetch: refetchP2PScore,
    isLoading: isLoadingP2PScore 
  } = useReadContract({
    address: P2P_LENDING_ADDRESS,
    abi: P2P_LENDING_ABI,
    functionName: 'getUserCreditScore',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: isConnected && isCorrectNetwork && !!userAddress,
      refetchInterval: 3000,
    }
  });

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: state.transactionHash as `0x${string}`,
  });

  // Update state when contract data changes
  useEffect(() => {
    const creditScoreNumber = bigIntToNumber(creditScoreData);
    const onChainScoreNumber = bigIntToNumber(onChainCreditScore);
    
    const isScoreSet = creditScoreNumber > 0 || onChainScoreNumber > 0;
    const effectiveScore = Math.max(creditScoreNumber, onChainScoreNumber);

    console.log('🔍 Credit Score Update:', {
      creditScoreNumber,
      onChainScoreNumber,
      effectiveScore,
      isScoreSet,
      userAddress
    });

    setState(prev => ({
      ...prev,
      creditScore: effectiveScore,
      onChainScore: onChainScoreNumber,
      isScoreSet,
      isLoading: isLoadingCreditScore || isLoadingP2PScore,
    }));
  }, [creditScoreData, onChainCreditScore, isLoadingCreditScore, isLoadingP2PScore, userAddress]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && state.transactionHash) {
      console.log('✅ Transaction confirmed, refetching credit scores...');
      
      setState(prev => ({ 
        ...prev, 
        isSuccess: true,
        isUpdating: false
      }));

      // Aggressive polling after confirmation
      const pollInterval = setInterval(() => {
        refetchCreditScore();
        refetchP2PScore();
      }, 1000);
      
      // Stop polling after 15 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 15000);
    }
  }, [isConfirmed, state.transactionHash, refetchCreditScore, refetchP2PScore]);

  const setCreditScoreOnChain = async () => {
    if (!isCorrectNetwork) {
      setState(prev => ({ 
        ...prev, 
        error: 'Please switch to Sepolia network' 
      }));
      return;
    }

    if (!userAddress) {
      setState(prev => ({ 
        ...prev, 
        error: 'No user address available' 
      }));
      return;
    }

    console.log('🚀 Setting credit score onchain:', {
      userAddress,
      initialCreditScore,
      isCorrectNetwork
    });

    setState(prev => ({ 
      ...prev, 
      isUpdating: true, 
      error: null,
      transactionHash: null,
      isSuccess: false
    }));

    try {
      writeContract({
        address: CREDIT_SCORE_ADDRESS,
        abi: CREDIT_SCORE_ABI,
        functionName: 'setCreditScore',
        args: [userAddress as `0x${string}`, BigInt(initialCreditScore)],
      }, {
        onSuccess: (hash: string) => {
          console.log('✅ Credit score transaction submitted:', hash);
          setState(prev => ({ 
            ...prev, 
            transactionHash: hash 
          }));
        },
        onError: (error: any) => {
          console.error('❌ Failed to set credit score:', error);
          let errorMessage = error.message || 'Unknown error occurred';
          
          // Provide more user-friendly error messages
          if (errorMessage.includes('user rejected')) {
            errorMessage = 'Transaction was rejected by user';
          } else if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction';
          }
          
          setState(prev => ({ 
            ...prev, 
            isUpdating: false, 
            error: errorMessage 
          }));
        }
      });
    } catch (error: any) {
      console.error('❌ Error setting credit score:', error);
      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        error: error.message 
      }));
    }
  };

  const refetchScores = () => {
    refetchCreditScore();
    refetchP2PScore();
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const clearSuccess = () => {
    setState(prev => ({ ...prev, isSuccess: false, transactionHash: null }));
  };

  return {
    ...state,
    setCreditScoreOnChain,
    refetchScores,
    isCorrectNetwork,
    isConfirming,
    clearError,
    clearSuccess
  };
};