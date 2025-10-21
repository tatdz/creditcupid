import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const CREDIT_SCORE_ADDRESS = '0x246E504F0B17A36906C3A9E255dbe3b51D54BcA8' as `0x${string}`;

const CREDIT_SCORE_ABI = [
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
  }
] as const;

interface TransactionState {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  hash: string | null;
}

export const useCreditScoreTransaction = () => {
  const { writeContract } = useWriteContract();
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
    hash: null
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionState.hash as `0x${string}`,
  });

  const setCreditScore = async (userAddress: string, score: number) => {
    if (!userAddress) {
      setTransactionState(prev => ({ 
        ...prev, 
        error: 'No user address available' 
      }));
      return false;
    }

    console.log('🚀 Setting credit score:', { userAddress, score });

    setTransactionState({
      isPending: true,
      isConfirming: false,
      isSuccess: false,
      error: null,
      hash: null
    });

    return new Promise<boolean>((resolve) => {
      writeContract({
        address: CREDIT_SCORE_ADDRESS,
        abi: CREDIT_SCORE_ABI,
        functionName: 'setCreditScore',
        args: [userAddress as `0x${string}`, BigInt(score)],
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
          let errorMessage = error.message || 'Unknown error occurred';
          
          if (errorMessage.includes('user rejected')) {
            errorMessage = 'Transaction was rejected in MetaMask';
          } else if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Insufficient Sepolia ETH for gas fees';
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
  };

  // Update state when transaction is confirmed
  if (isConfirmed && transactionState.hash && !transactionState.isSuccess) {
    setTransactionState(prev => ({
      ...prev,
      isPending: false,
      isConfirming: false,
      isSuccess: true
    }));
  }

  const resetTransaction = () => {
    setTransactionState({
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
      hash: null
    });
  };

  return {
    setCreditScore,
    transactionState: {
      ...transactionState,
      isConfirming // Keep this updated from the hook
    },
    resetTransaction
  };
};