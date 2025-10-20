// components/credit-dashboard/CreditDashboard.tsx
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useTransactionPopup } from "@blockscout/app-sdk";
import { DatingTab } from '../DatingTab';
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
  AlertCircle,
  RefreshCw,
  BarChart3,
  Shield,
  Heart,
  Zap
} from 'lucide-react';
import { CreditScore } from '../ui/CreditScore';
import { CreditBenefits } from '../ui/CreditBenefits';
import { CreditData } from '../../types/credit';

// Import new modular components
import { useCreditData } from './hooks/useCreditData';
import { usePlaidIntegration } from './hooks/usePlaidIntegration';
import { useCreditScore } from './hooks/useCreditScore';
import { FinancialHealthPanel } from './components/FinancialHealthPanel';
import { ProtocolComparison } from './components/ProtocolComparison';
import { CreditScoreBreakdownPanel } from './components/CreditScoreBreakdownPanel';

export const CreditDashboard: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { openPopup } = useTransactionPopup();
  
  const [activeTab, setActiveTab] = useState('overview');

  // Use custom hooks - NO MOCK DATA
  const { creditData, loading, error, retry } = useCreditData();
  const { plaidData, privacyProofs, loading: plaidLoading, error: plaidError, connectBank } = usePlaidIntegration();
  
  // Use ONLY real data - no fallback to mock data
  const displayData = creditData;
  const { creditScore, factors, collateralBoost } = useCreditScore(displayData, plaidData, privacyProofs);

  const handleViewTransactions = () => {
    if (!address) return;
    openPopup({
      chainId: chain?.id.toString() || "1",
      address: address,
    });
  };

  // Helper function to safely check if wallet has activity
  const hasWalletActivity = (data: CreditData | null): boolean => {
    if (!data) return false;
    
    const totalTransactions = data.transactionAnalysis?.totalTransactions || 0;
    const totalValueUSD = parseFloat(data.walletData?.totalValueUSD?.toString() || '0');
    const tokenBalancesCount = data.walletData?.tokenBalances?.length || 0;
    
    return totalTransactions > 0 || totalValueUSD > 0 || tokenBalancesCount > 0;
  };

  // Not connected state
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
              <p className="mt-1 text-gray-500">No data will be stored - everything stays in your browser</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your on-chain activity...</p>
          <p className="text-sm text-gray-500">Scanning transactions and protocol interactions</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // No data state (API unavailable or no data returned)
  if (!displayData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Unable to Load Data
            </CardTitle>
            <CardDescription>
              {error || 'We could not fetch your on-chain data. This might be because:'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Backend service is unavailable</p>
              <p>• Network connection issues</p>
              <p>• Wallet has no on-chain activity</p>
            </div>
            
            <Button 
              onClick={retry} 
              size="lg" 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </Button>
            
            <Button 
              onClick={handleViewTransactions} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Transactions on Blockscout
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              <p>Your data is processed locally and never stored on our servers</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty wallet state (connected but no activity)
  if (displayData && !hasWalletActivity(displayData)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">CreditCupid</h1>
              <p className="text-gray-600 mt-2">
                Privacy-preserving credit scoring powered by on-chain data
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

          {/* Welcome Card for New Users */}
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Welcome to On-Chain Credit!</CardTitle>
                <CardDescription className="text-blue-700 text-lg">
                  Start building your credit score with on-chain activity
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-900 mb-1">Make Transactions</h3>
                    <p className="text-blue-700">Start with simple ETH transfers or token swaps</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-900 mb-1">Build Portfolio</h3>
                    <p className="text-green-700">Hold diverse assets like ETH, USDC, or WBTC</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-purple-900 mb-1">Use DeFi Protocols</h3>
                    <p className="text-purple-700">Interact with Aave, Morpho, or other lending protocols</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleViewTransactions} 
                    size="lg"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <BarChart3 className="h-5 w-5" />
                    View Wallet on Explorer
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('lending')} 
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-5 w-5" />
                    Explore Lending Protocols
                  </Button>
                </div>

                <div className="text-xs text-blue-600">
                  <p>Your credit score will update automatically as you use your wallet</p>
                  <p>All analysis happens locally - your data never leaves your browser</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard with data - displayData is guaranteed to be non-null here
  const safeDisplayData = displayData!;

  // Prepare factor scores for CreditBenefits component
  const factorScores = factors.reduce((acc, factor) => {
    acc[factor.key] = factor.score;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">CreditCupid</h1>
            <p className="text-gray-600 mt-2">
              The first onchain credit oracle to spark authentic bonds in romance and P2P lending
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
                  <p className="font-medium">Limited Data Available</p>
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

        {/* Data Quality Notice */}
        {displayData && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  <strong>Privacy First:</strong> Your credit analysis happens locally using on-chain data. 
                  No personal information is stored on our servers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full bg-white p-1 rounded-lg border">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
              </TabsTrigger>
              <TabsTrigger value="dating" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Dating
            </TabsTrigger>
            <TabsTrigger value="lending" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              P2P Lending
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
                  address={safeDisplayData.address}
                  riskFactors={safeDisplayData.riskFactors}
                />
                
                <CreditBenefits 
                  benefits={safeDisplayData.creditBenefits || []}
                  collateralBoost={collateralBoost} // Now using the calculated boost from useCreditScore
                  creditScore={creditScore}
                  factorScores={factorScores}
                />

                <FinancialHealthPanel
                  plaidData={plaidData}
                  privacyProofs={privacyProofs}
                  onConnectBank={connectBank}
                  loading={plaidLoading}
                  error={plaidError}
                />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <CreditScoreBreakdownPanel 
                  factors={factors} 
                  creditScore={creditScore}
                  plaidData={plaidData}
                  privacyProofs={privacyProofs}
                />
              </div>
            </div>
          </TabsContent>
          {/* Dating Tab */}
          <TabsContent value="dating">
           <DatingTab />
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

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p>
              CreditCupid • The first onchain credit oracle to spark authentic bonds in romance and P2P lending •{' '}
              <button 
                onClick={handleViewTransactions}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Verify your data on Blockscout
              </button>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              All analysis performed locally in your browser. No data stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};