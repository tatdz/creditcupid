// src/hooks/useCreditData.ts
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { CreditData } from '../../../types/credit';

// Use direct backend URL in development to avoid proxy issues
const API_BASE_URL = 'http://localhost:3001';

export const useCreditData = () => {
  const { address, isConnected, chain } = useAccount();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditData = async (walletAddress: string, signal?: AbortSignal) => {
    if (!walletAddress) {
      setError('No wallet address provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`📊 Fetching credit data for ${walletAddress} on chain ${chain?.id}`);

      // Use direct backend URL
      const apiUrl = `${API_BASE_URL}/api/credit-data/${walletAddress}`;
      console.log(`🔧 Making API request to: ${apiUrl}`);

      const response = await axios.get(apiUrl, {
        params: { 
          chainId: chain?.id || 11155111
        },
        timeout: 10000,
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ API Response status: ${response.status}`);

      if (response.data && (response.data.creditScore !== undefined || response.data.fallbackUsed)) {
        console.log('✅ Credit data loaded successfully');
        setCreditData(response.data as CreditData);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err: any) {
      if (axios.isCancel(err)) {
        console.log('🔄 Request cancelled');
        return;
      }

      console.error('❌ API fetch failed:', err.message);

      if (err.code === 'ECONNABORTED') {
        setError('Request timeout - please try again');
      } else if (err.response?.status === 404) {
        setError('Credit data not found for this wallet address');
      } else if (err.response?.status === 503) {
        // Backend has RPC issues but provided fallback data
        if (err.response.data.fallbackUsed) {
          setCreditData(err.response.data as CreditData);
          setError('Using fallback data due to RPC issues');
        } else {
          setError('Backend temporarily unavailable - RPC connectivity issues');
        }
      } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend server');
      } else {
        setError(`Failed to load credit data: ${err.message}`);
      }
      
      if (!err.response?.data?.fallbackUsed) {
        setCreditData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected || !address) {
      setCreditData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetchCreditData(address, controller.signal);

    return () => {
      controller.abort();
    };
  }, [address, isConnected, chain?.id]);

  const retry = () => {
    if (address) {
      fetchCreditData(address);
    }
  };

  return { creditData, loading, error, retry };
};