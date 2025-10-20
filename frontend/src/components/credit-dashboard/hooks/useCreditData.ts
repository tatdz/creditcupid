import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { CreditData } from '../../../types/credit';

export const useCreditData = () => {
  const { address, isConnected, chain } = useAccount();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditData = async (walletAddress: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`📊 Fetching REAL credit data for ${walletAddress} on chain ${chain?.id}`);

      const response = await axios.get(
        `/api/credit-data/${walletAddress}`, // relative URL to use Vite proxy
        {
          params: { chainId: chain?.id || 1 },
          timeout: 15000, // increased timeout
          signal, // abort signal for cancellation
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
      if (axios.isCancel(err)) {
        console.log('Request cancelled', err.message);
      } else {
        console.error('❌ API fetch failed:', err.toJSON ? err.toJSON() : err.message);
        setCreditData(null);
        setError(`Unable to fetch credit data: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected || !address) {
      setCreditData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    fetchCreditData(address, controller.signal);

    return () => {
      controller.abort(); // cancel pending requests on deps change or unmount
    };
  }, [address, isConnected, chain?.id]);

  const retry = () => {
    if (address) {
      fetchCreditData(address);
    }
  };

  return { creditData, loading, error, retry };
};
