import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { CreditData } from '../../../types/credit';

// Mock data for fallback
const mockCreditData: CreditData = {
  address: '0x0',
  creditScore: 723,
  riskFactors: [
    'Limited borrowing history',
    'High concentration in stablecoins',
    'New to DeFi protocols'
  ],
  creditBenefits: [
    {
      type: 'credit_boost',
      description: 'Enhanced collateral value across all protocols',
      value: '+1.9%',
      status: 'active',
      eligibility: true
    },
    {
      type: 'lower_requirements',
      description: 'Reduced collateral needed for borrowing',
      value: 'Up to 10% less',
      status: 'active',
      eligibility: true
    },
    {
      type: 'better_rates',
      description: 'Improved borrowing and lending rates',
      value: '0.1% better',
      status: 'pending',
      eligibility: false
    }
  ],
  walletData: {
    totalValueUSD: 18750.25,
    nativeBalance: '2.15',
    tokenBalances: [
      { symbol: 'ETH', balance: '2.15', valueUSD: 6450, contractAddress: '0x' },
      { symbol: 'USDC', balance: '8500', valueUSD: 8500, contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
      { symbol: 'WBTC', balance: '0.25', valueUSD: 8750, contractAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' }
    ],
    activity: {
      totalTransactions: 156,
      activeDays: 365,
      transactions: [],
      interactions: [],
      lastActivity: Date.now()
    }
  },
  collateralAnalysis: {
    collateralValueUSD: 24500,
    collateralRatio: 2.1,
    liquidationThreshold: 1.5,
    collateralBoost: 1.19,
    assets: [
      { 
        symbol: 'ETH', 
        amount: '2.15', 
        valueUSD: 6450, 
        collateralFactor: 0.82
      },
      { 
        symbol: 'WBTC', 
        amount: '0.25', 
        valueUSD: 8750, 
        collateralFactor: 0.75
      },
      { 
        symbol: 'USDC', 
        amount: '8500', 
        valueUSD: 8500, 
        collateralFactor: 0.90
      }
    ],
    currentCollateralValue: '$17,250',
    enhancedCollateralValue: '$20,527'
  },
  oracleData: {
    ethPriceUSD: 3000,
    gasPrices: { slow: 25, standard: 35, fast: 50 }
  },
  protocolInteractions: [
    { protocol: 'aave', type: 'deposit', asset: 'ETH', amount: '0.5', timestamp: Date.now() / 1000 - 86400, txHash: '0x123...', chainId: 1 },
    { protocol: 'uniswap', type: 'swap', asset: 'USDC', amount: '1000', timestamp: Date.now() / 1000 - 172800, txHash: '0x456...', chainId: 1 }
  ],
  transactionAnalysis: {
    totalTransactions: 156,
    activeMonths: 12,
    transactionVolume: 45.2,
    protocolInteractions: 28,
    avgTxFrequency: '2.3/day',
    riskScore: 23
  }
};

export const useCreditData = () => {
  const { address, isConnected } = useAccount();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditData = async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 Fetching credit data for ${walletAddress}`);
      
      // Try to fetch from your backend API
      const response = await axios.get(
        `http://localhost:3001/api/credit-data/${walletAddress}`
      );
      
      if (response.data) {
        // Transform API response to match our CreditData type if needed
        const transformedData = transformApiData(response.data, walletAddress);
        setCreditData(transformedData);
        console.log('✅ Credit data loaded successfully from API');
      } else {
        throw new Error('No data received from server');
      }
    } catch (err: any) {
      console.log('🔄 Falling back to mock data due to API error:', err.message);
      
      // Use mock data as fallback
      const mockData = {
        ...mockCreditData,
        address: walletAddress
      };
      setCreditData(mockData);
      setError('Using demo data - API unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to transform API data to our CreditData structure
  const transformApiData = (apiData: any, walletAddress: string): CreditData => {
    // If the API data already matches our structure, return it directly
    if (apiData.address && apiData.creditScore !== undefined) {
      return apiData as CreditData;
    }
    
    // Otherwise, transform it to match our structure
    return {
      address: walletAddress,
      creditScore: apiData.creditScore || 650,
      riskFactors: apiData.riskFactors || ['No risk data available'],
      creditBenefits: apiData.creditBenefits || mockCreditData.creditBenefits,
      walletData: apiData.walletData || mockCreditData.walletData,
      collateralAnalysis: apiData.collateralAnalysis || mockCreditData.collateralAnalysis,
      oracleData: apiData.oracleData || mockCreditData.oracleData,
      protocolInteractions: apiData.protocolInteractions || mockCreditData.protocolInteractions,
      transactionAnalysis: apiData.transactionAnalysis || mockCreditData.transactionAnalysis
    };
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
  }, [address, isConnected]);

  return {
    creditData,
    loading,
    error,
    retry
  };
};