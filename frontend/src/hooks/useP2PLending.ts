import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const P2P_LENDING_ADDRESS = '0x8F254C3A7858d05a9829391319821eC62d69ACa4' as `0x${string}`;

const P2P_LENDING_ABI = [
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
        "name": "_maxLtv",
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
  }
] as const;

interface P2PTransactionState {
  type: 'createLoan' | 'createOffer' | null;
  isPending: boolean;
  hash: string | null;
  success: boolean;
  error: string | null;
}

export const useP2PLending = () => {
  const { writeContract } = useWriteContract();
  const [transactionState, setTransactionState] = useState<P2PTransactionState>({
    type: null,
    isPending: false,
    hash: null,
    success: false,
    error: null
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionState.hash as `0x${string}`,
  });

  // Update state when transaction is confirmed
  if (isConfirmed && transactionState.hash && !transactionState.success) {
    setTransactionState(prev => ({
      ...prev,
      isPending: false,
      success: true
    }));
  }

  const createLoanRequest = async (loanAmount: string, collateralAmount: string) => {
    setTransactionState({
      type: 'createLoan',
      isPending: true,
      hash: null,
      success: false,
      error: null
    });

    try {
      const loanAmountWei = BigInt(Math.floor(parseFloat(loanAmount) * 1e18));
      const collateralAmountWei = BigInt(Math.floor(parseFloat(collateralAmount) * 1e18));
      const duration = BigInt(30 * 24 * 60 * 60);

      return new Promise<boolean>((resolve) => {
        writeContract({
          address: P2P_LENDING_ADDRESS,
          abi: P2P_LENDING_ABI,
          functionName: 'createLoanRequest',
          args: [loanAmountWei, duration],
          value: collateralAmountWei
        }, {
          onSuccess: (hash: string) => {
            setTransactionState(prev => ({ 
              ...prev, 
              hash 
            }));
            resolve(true);
          },
          onError: (error: any) => {
            let errorMessage = error.message || 'Unknown error occurred';
            if (errorMessage.includes('user rejected')) {
              errorMessage = 'Transaction was rejected in MetaMask';
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
      setTransactionState(prev => ({ 
        ...prev, 
        isPending: false, 
        error: error.message 
      }));
      return false;
    }
  };

  const createLenderOffer = async (lendAmount: string) => {
    setTransactionState({
      type: 'createOffer',
      isPending: true,
      hash: null,
      success: false,
      error: null
    });

    try {
      const amountWei = BigInt(Math.floor(parseFloat(lendAmount) * 1e18));
      const minCreditScore = BigInt(600);
      const maxLtv = BigInt(6000);
      const interestRate = BigInt(400);
      const maxDuration = BigInt(30 * 24 * 60 * 60);

      return new Promise<boolean>((resolve) => {
        writeContract({
          address: P2P_LENDING_ADDRESS,
          abi: P2P_LENDING_ABI,
          functionName: 'createLenderOffer',
          args: [amountWei, minCreditScore, maxLtv, interestRate, maxDuration],
        }, {
          onSuccess: (hash: string) => {
            setTransactionState(prev => ({ 
              ...prev, 
              hash 
            }));
            resolve(true);
          },
          onError: (error: any) => {
            let errorMessage = error.message || 'Unknown error occurred';
            if (errorMessage.includes('user rejected')) {
              errorMessage = 'Transaction was rejected in MetaMask';
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
      setTransactionState(prev => ({ 
        ...prev, 
        isPending: false, 
        error: error.message 
      }));
      return false;
    }
  };

  const clearTransactionState = () => {
    setTransactionState({
      type: null,
      isPending: false,
      hash: null,
      success: false,
      error: null
    });
  };

  return {
    createLoanRequest,
    createLenderOffer,
    transactionState: {
      ...transactionState,
      isConfirming
    },
    clearTransactionState
  };
};