// hooks/useCreditScoreManager.ts
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { transactionService, TransactionStatus } from '../../../backend/src/services/transactionService';

const CREDIT_SCORE_ADDRESS = '0x246E504F0B17A36906C3A9E255dbe3b51D54BcA8' as `0x${string}`;
const P2P_LENDING_ADDRESS = '0x8F254C3A7858d05a9829391319821eC62d69ACa4' as `0x${string}`;

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
  }
] as const;

const P2P_LENDING_ABI = [
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

export const useCreditScoreManager = (userAddress: string, initialCreditScore: number) => {
  const { isConnected, chain } = useAccount();
  const { writeContract } = useWriteContract();
  const isCorrectNetwork = chain?.id === sepolia.id;

  const [state, setState] = useState({
    creditScore: 0,
    onChainScore: 0,
    isScoreSet: false,
    isLoading: false,
    isUpdating: false,
    transactionHash: null as string | null,
    transactionStatus: null as TransactionStatus | null,
    transactionSuccess: false,
    transactionError: null as string | null,
  });

  // Read credit score from CreditScore contract
  const { 
    data: creditScoreData, 
    refetch: refetchCreditScore,
    isLoading: isLoadingCreditScore,
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
    data: onChainScoreData, 
    refetch: refetchP2PScore,
    isLoading: isLoadingP2PScore,
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

  // Enhanced transaction status checking
  const checkTransactionStatus = useCallback(async (txHash: string) => {
    try {
      console.log('🔄 Checking transaction status for:', txHash);
      const status = await transactionService.getTransactionStatus(txHash);
      setState(prev => ({ ...prev, transactionStatus: status }));

      if (status.isConfirmed && status.status === 'success') {
        console.log('✅ Transaction confirmed via transaction service!');
        
        setState(prev => ({
          ...prev,
          isUpdating: false,
          transactionSuccess: true,
          isScoreSet: true,
          creditScore: initialCreditScore,
        }));

        // Refetch scores after confirmation
        setTimeout(() => {
          refetchCreditScore();
          refetchP2PScore();
        }, 2000);

        // Clear success message after 8 seconds
        setTimeout(() => {
          setState(prev => ({ 
            ...prev, 
            transactionSuccess: false, 
            transactionHash: null,
            transactionStatus: null 
          }));
        }, 8000);

      } else if (status.status === 'failed') {
        console.log('❌ Transaction failed on-chain');
        setState(prev => ({
          ...prev,
          isUpdating: false,
          transactionError: 'Transaction failed on-chain',
        }));
      }
    } catch (error) {
      console.warn('Transaction status check failed:', error);
    }
  }, [refetchCreditScore, refetchP2PScore, initialCreditScore]);

  // Poll transaction status when we have a hash
  useEffect(() => {
    if (state.transactionHash && !state.transactionSuccess) {
      console.log('🔄 Starting transaction status polling for:', state.transactionHash);
      const interval = setInterval(() => {
        checkTransactionStatus(state.transactionHash!);
      }, 4000); // Check every 4 seconds

      return () => clearInterval(interval);
    }
  }, [state.transactionHash, state.transactionSuccess, checkTransactionStatus]);

  // Convert BigInt to number safely
  const bigIntToNumber = useCallback((value: bigint | undefined | null): number => {
    if (!value) return 0;
    try {
      return Number(value);
    } catch {
      return 0;
    }
  }, []);

  // Update state when contract data changes
  useEffect(() => {
    const creditScoreNumber = bigIntToNumber(creditScoreData);
    const onChainScoreNumber = bigIntToNumber(onChainScoreData);
    
    const isScoreSet = creditScoreNumber > 0 || onChainScoreNumber > 0;
    const effectiveScore = Math.max(creditScoreNumber, onChainScoreNumber);

    console.log('🔍 Credit Score Update:', {
      creditScoreNumber,
      onChainScoreNumber,
      effectiveScore,
      isScoreSet
    });

    setState(prev => ({
      ...prev,
      creditScore: effectiveScore,
      onChainScore: onChainScoreNumber,
      isScoreSet,
      isLoading: isLoadingCreditScore || isLoadingP2PScore,
    }));
  }, [creditScoreData, onChainScoreData, bigIntToNumber, isLoadingCreditScore, isLoadingP2PScore]);

  const setCreditScoreOnChain = async (): Promise<boolean> => {
    if (!isCorrectNetwork) {
      setState(prev => ({ 
        ...prev, 
        transactionError: 'Please switch to Sepolia network' 
      }));
      return false;
    }

    if (!userAddress) {
      setState(prev => ({ 
        ...prev, 
        transactionError: 'No user address available' 
      }));
      return false;
    }

    console.log('🚀 Setting credit score onchain...');

    setState(prev => ({ 
      ...prev, 
      isUpdating: true,
      isLoading: true,
      transactionError: null,
      transactionHash: null,
      transactionStatus: null,
      transactionSuccess: false
    }));

    return new Promise<boolean>((resolve) => {
      writeContract({
        address: CREDIT_SCORE_ADDRESS,
        abi: CREDIT_SCORE_ABI,
        functionName: 'setCreditScore',
        args: [userAddress as `0x${string}`, BigInt(initialCreditScore)],
      }, {
        onSuccess: (hash: string) => {
          console.log('✅ Transaction submitted:', hash);
          setState(prev => ({ 
            ...prev, 
            transactionHash: hash,
          }));

          // Start checking transaction status immediately
          setTimeout(() => {
            checkTransactionStatus(hash);
          }, 2000);

          resolve(true);
        },
        onError: (error: any) => {
          console.error('❌ Failed to set credit score:', error);
          let errorMessage = error.message || 'Unknown error occurred';
          
          if (errorMessage.includes('user rejected')) {
            errorMessage = 'Transaction was rejected in MetaMask';
          } else if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Insufficient Sepolia ETH for gas fees';
          } else if (errorMessage.includes('gas')) {
            errorMessage = 'Gas estimation failed - try adjusting gas limit';
          }
          
          setState(prev => ({ 
            ...prev, 
            isUpdating: false, 
            isLoading: false,
            transactionError: errorMessage,
          }));
          
          resolve(false);
        }
      });
    });
  };

  const refetchScores = useCallback(() => {
    refetchCreditScore();
    refetchP2PScore();
  }, [refetchCreditScore, refetchP2PScore]);

  const resetTransaction = useCallback(() => {
    setState(prev => ({
      ...prev,
      transactionHash: null,
      transactionSuccess: false,
      transactionError: null,
      transactionStatus: null
    }));
  }, []);

  const getTransactionUrl = useCallback((hash: string) => {
    return transactionService.getTransactionUrl(hash);
  }, []);

  const getFallbackTransactionUrl = useCallback((hash: string) => {
    return transactionService.getFallbackTransactionUrl(hash);
  }, []);

  return {
    // Data
    creditScore: state.creditScore,
    onChainScore: state.onChainScore,
    isScoreSet: state.isScoreSet,
    isLoading: state.isLoading,
    
    // Transaction state
    isUpdating: state.isUpdating,
    transactionError: state.transactionError,
    transactionHash: state.transactionHash,
    transactionStatus: state.transactionStatus,
    transactionSuccess: state.transactionSuccess,
    
    // Actions
    setCreditScoreOnChain,
    refetchScores,
    resetTransaction,
    isCorrectNetwork,
    getTransactionUrl,
    getFallbackTransactionUrl
  };
};