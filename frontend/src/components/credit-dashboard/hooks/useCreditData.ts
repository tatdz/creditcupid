import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { CreditData } from '../../../types/credit';

export const useCreditData = () => {
  const { address, isConnected, chain } = useAccount();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditData = async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 Fetching REAL credit data for ${walletAddress} on chain ${chain?.id}`);
      
      // Try to fetch from your backend API
      const response = await axios.get(
        `http://localhost:3001/api/credit-data/${walletAddress}`,
        {
          params: { chainId: chain?.id || 1 },
          timeout: 10000 // 10 second timeout
        }
      );
      
      if (response.data) {
        console.log('✅ REAL credit data loaded successfully from API:', {
          creditScore: response.data.creditScore,
          transactions: response.data.transactionAnalysis?.totalTransactions,
          walletValue: response.data.walletData?.totalValueUSD,
          tokenCount: response.data.walletData?.tokenBalances?.length
        });
        
        setCreditData(response.data as CreditData);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err: any) {
      console.error('❌ API fetch failed:', err.message);
      
      // DO NOT USE MOCK DATA - set to null instead
      setCreditData(null);
      setError(`Unable to fetch credit data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    if (address) {
      fetchCreditData(address);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchCreditData(address);
    } else {
      setCreditData(null);
      setError(null);
    }
  }, [address, isConnected, chain?.id]); // Added chain.id dependency

  return {
    creditData,
    loading,
    error,
    retry
  };
};