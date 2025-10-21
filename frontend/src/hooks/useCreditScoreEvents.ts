import { useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const CREDIT_SCORE_ADDRESS = '0x246E504F0B17A36906C3A9E255dbe3b51D54BcA8' as `0x${string}`;
const P2P_LENDING_ADDRESS = '0xaF1847D02A5d235730c19f1aA5D95296D5EAE691' as `0x${string}`;

const CREDIT_SCORE_ABI = [
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

interface CreditScoreData {
  creditScore: number;
  onChainScore: number;
  isScoreSet: boolean;
  isLoading: boolean;
  lastUpdated: number;
}

export const useCreditScoreEvents = (userAddress: string) => {
  const { isConnected, chain } = useAccount();
  const isCorrectNetwork = chain?.id === sepolia.id;

  // Read from CreditScore contract
  const { 
    data: creditScoreData, 
    refetch: refetchCreditScore,
    isLoading: isLoadingCredit 
  } = useReadContract({
    address: CREDIT_SCORE_ADDRESS,
    abi: CREDIT_SCORE_ABI,
    functionName: 'getCreditScore',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: isConnected && isCorrectNetwork && !!userAddress,
      refetchInterval: 2000, // Poll every 2 seconds
    }
  });

  // Read from P2PLending contract
  const { 
    data: onChainScoreData, 
    refetch: refetchP2PScore,
    isLoading: isLoadingP2P 
  } = useReadContract({
    address: P2P_LENDING_ADDRESS,
    abi: P2P_LENDING_ABI,
    functionName: 'getUserCreditScore',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: isConnected && isCorrectNetwork && !!userAddress,
      refetchInterval: 2000, // Poll every 2 seconds
    }
  });

  const bigIntToNumber = (value: bigint | undefined | null): number => {
    if (!value) return 0;
    try {
      return Number(value);
    } catch {
      return 0;
    }
  };

  const creditScore = bigIntToNumber(creditScoreData);
  const onChainScore = bigIntToNumber(onChainScoreData);
  const isScoreSet = creditScore > 0 || onChainScore > 0;
  const effectiveScore = Math.max(creditScore, onChainScore);

  const refetchAll = useCallback(() => {
    refetchCreditScore();
    refetchP2PScore();
  }, [refetchCreditScore, refetchP2PScore]);

  // Aggressive polling trigger
  const triggerAggressivePolling = useCallback(() => {
    console.log('🚀 Starting aggressive polling for credit score updates...');
    
    // Immediate refetch
    refetchAll();
    
    // Poll every 500ms for 10 seconds
    const interval = setInterval(() => {
      refetchAll();
    }, 500);
    
    setTimeout(() => {
      clearInterval(interval);
      console.log('✅ Aggressive polling completed');
    }, 10000);
  }, [refetchAll]);

  const data: CreditScoreData = {
    creditScore: effectiveScore,
    onChainScore,
    isScoreSet,
    isLoading: isLoadingCredit || isLoadingP2P,
    lastUpdated: Date.now()
  };

  return {
    data,
    refetchAll,
    triggerAggressivePolling,
    isCorrectNetwork
  };
};