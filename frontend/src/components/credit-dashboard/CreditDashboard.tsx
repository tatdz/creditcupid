import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useTransactionPopup } from "@blockscout/app-sdk";
import { P2PLending } from '../P2PLending';
import { AgentChat } from '../AgentChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Wallet, 
  TrendingUp, 
  MessageCircle,
  DollarSign,
  CreditCard,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { CreditScore } from '../ui/CreditScore';
import { CollateralAnalysis } from '../ui/CollateralAnalysis';
import { CreditBenefits } from '../ui/CreditBenefits';
import { CreditData } from '../../types/credit';

// Import new modular components
import { useCreditData } from './hooks/useCreditData';
import { usePlaidIntegration } from './hooks/usePlaidIntegration';
import { useCreditScore } from './hooks/useCreditScore';
import { FinancialHealthPanel } from './components/FinancialHealthPanel';
import { CreditScoreBreakdown } from './components/CreditScoreBreakdown';
import { ProtocolComparison } from './components/ProtocolComparison';
import { formatUSD } from './utils/formatters';

// Mock data - Fix the WalletActivity type issue
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
      transactions: [], // Add empty arrays for optional fields
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

export const CreditDashboard: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { openPopup } = useTransactionPopup();
  
  const [activeTab, setActiveTab] = useState('overview');

  // Use custom hooks
  const { creditData, loading, error, retry } = useCreditData();
  const { plaidData, zkProofs, loading: plaidLoading, error: plaidError, connectBank } = usePlaidIntegration();
  
  const displayData = creditData || mockCreditData;
  const { creditScore, factors } = useCreditScore(displayData, plaidData, zkProofs);

  // Specifically check the collateral diversity factor
  const collateralFactor = factors.find(f => f.key === 'COLLATERAL_DIVERSITY');
  if (collateralFactor) {
    console.log('🔍 COLLATERAL FACTOR DETAILS:', {
      factor: collateralFactor.factor,
      score: collateralFactor.score,
      isNaN: isNaN(collateralFactor.score),
      metrics: collateralFactor.metrics,
      rawData: displayData?.walletData
    });
  }

  const handleViewTransactions = () => {
    if (!address) return;
    openPopup({
      chainId: chain?.id.toString() || "1",
      address: address,
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6" />
              Connect Your Wallet
            </CardTitle>
            <CardDescription>
              Connect your wallet to analyze your on-chain history and build your credit score
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              onClick={() => connect({ connector: injected() })}
              size="lg"
              className="flex items-center gap-2"
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </Button>
            <div className="text-xs text-gray-600 text-center">
              <p>We'll analyze your on-chain activity to build your credit profile</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your on-chain activity...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </div>
      </div>
    );
  }

  console.log('Credit Data:', creditData);
  console.log('Credit Score:', creditScore);
  console.log('Factors:', factors);
  console.log('Display Data:', displayData);

  console.log('🔍 Credit Data Debug:', {
    walletData: displayData?.walletData,
    tokenBalances: displayData?.walletData?.tokenBalances,
    totalValueUSD: displayData?.walletData?.totalValueUSD,
    tokenValues: displayData?.walletData?.tokenBalances?.map(t => ({
      symbol: t.symbol,
      valueUSD: t.valueUSD,
      balance: t.balance
    }))
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Darma Credit Protocol</h1>
            <p className="text-gray-600 mt-2">
              Privacy-preserving credit scoring powered by on-chain data and cryptographic verification
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg px-3 py-2 border">
              <div className="text-sm text-gray-600">Network</div>
              <div className="text-sm font-semibold capitalize">
                {chain?.name || 'Ethereum'}
              </div>
            </div>
            
            <Button
              onClick={() => disconnect()}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Disconnect
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Unable to fetch live data</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
              <Button
                onClick={retry}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-red-300 text-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-white p-1 rounded-lg border">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="lending" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lending
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Agents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <CreditScore 
                  score={creditScore}
                  address={displayData.address}
                  riskFactors={displayData.riskFactors}
                />
                
                <CreditBenefits 
                  benefits={displayData.creditBenefits}
                  collateralBoost={displayData.collateralAnalysis?.collateralBoost || 1.0}
                />

                <FinancialHealthPanel
                  plaidData={plaidData}
                  privacyProofs={zkProofs}
                  onConnectBank={connectBank}
                  loading={plaidLoading}
                  error={plaidError}
                />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <CreditScoreBreakdown factors={factors} creditScore={creditScore} />
                <CollateralAnalysis 
                  analysis={displayData.collateralAnalysis}
                  oracleData={displayData.oracleData}
                />
              </div>
            </div>
          </TabsContent>

          {/* Lending Tab */}
          <TabsContent value="lending" className="space-y-6">
            <ProtocolComparison />
            <P2PLending />
          </TabsContent>

          {/* AI Agents Tab */}
          <TabsContent value="agents">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentChat address={address!} agentType="advisor" />
              <AgentChat address={address!} agentType="auditor" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};