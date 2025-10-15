import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';

export interface CreditData {
  address: string;
  chains: ChainData[];
  creditScore: number;
  riskFactors: string[];
  aavePositions: { [chainId: number]: AavePosition };
  morphoPositions: { [chainId: number]: MorphoPosition };
  protocolInteractions: ProtocolInteraction[];
  recommendations: string[];
}

export interface ChainData {
  chainId: number;
  balance: string;
  tokens: TokenBalance[];
  nfts: NFT[];
  transactions: Transaction[];
}

export interface TokenBalance {
  contractAddress: string;
  name: string;
  symbol: string;
  balance: string;
  valueUSD: number;
}

export interface NFT {
  contractAddress: string;
  tokenId: string;
  name: string;
  image?: string;
  valueUSD?: number;
}

export interface Transaction {
  hash: string;
  timestamp: number;
  value: string;
  to: string;
  from: string;
  gasUsed: string;
  status: boolean;
}

export interface AavePosition {
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface MorphoPosition {
  supplied: string;
  borrowed: string;
  collateral: string;
}

export interface ProtocolInteraction {
  protocol: 'aave' | 'morpho';
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'supply';
  amount: string;
  timestamp: number;
  chainId: number;
  txHash: string;
  asset: string;
}

export const useCreditData = () => {
  const { address, isConnected } = useAccount();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditData = async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`http://localhost:3001/api/credit-data/${walletAddress}`);
      setCreditData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch credit data');
      console.error('Error fetching credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (walletAddress: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/recommendations/${walletAddress}`);
      return response.data.recommendations;
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      return [];
    }
  };


  useEffect(() => {
    if (isConnected && address) {
      fetchCreditData(address);
    } else {
      setCreditData(null);
    }
  }, [address, isConnected]);

  const refetch = () => {
    if (address) {
      fetchCreditData(address);
    }
  };

  return {
    creditData,
    loading,
    error,
    refetch,
    fetchRecommendations
  };
};

export const useProtocolData = (address: string) => {
  const [protocolData, setProtocolData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setLoading(true);
      axios.get(`http://localhost:3001/api/protocol-data/${address}`)
        .then(response => {
          setProtocolData(response.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [address]);

  return { protocolData, loading };
};