// components/credit-dashboard/CreditDashboard.tsx
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useTransactionPopupGood } from '../../hooks/useBlockscoutGood';
import { DatingTab } from '../DatingTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Shield,
  Heart,
  Zap,
  Star,
  Calendar,
  Target,
  ExternalLink
} from 'lucide-react';
import { CreditScore } from '../ui/CreditScore';
import { CreditData } from '../../types/credit';
import { P2PLending } from '../../components/P2PLending';

// Import new modular components
import { useCreditData } from './hooks/useCreditData';
import { usePlaidIntegration } from './hooks/usePlaidIntegration';
import { useCreditScore } from './hooks/useCreditScore';
import { FinancialHealthPanel } from './components/FinancialHealthPanel';
import { CreditScoreBreakdownPanel } from './components/CreditScoreBreakdownPanel';

// Import credit score context
import { CreditScoreProvider, useCreditScoreContext } from '../../hooks/useCreditScoreContext';

// Import Blockscout utilities
import { triggerTransactionPopup, ViewOnBlockscoutButton } from '../../utils/blockscout';

// Main dashboard component wrapped with provider
const CreditDashboardContent: React.FC = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { openPopup } = useTransactionPopupGood();
  
  const [activeTab, setActiveTab] = useState('overview');

  // Use custom hooks - NO MOCK DATA
  const { creditData, loading, error, retry } = useCreditData();
  const { plaidData, privacyProofs, loading: plaidLoading, error: plaidError, connectBank } = usePlaidIntegration();
  
  // Use the credit score context
  const { calculatedScore, isRealScore } = useCreditScoreContext();
  
  // Use ONLY real data - no fallback to mock data
  const displayData = creditData;
  const { creditScore: initialCreditScore, factors } = useCreditScore(displayData, plaidData, privacyProofs);

  // Use calculated score from context if available, otherwise use initial score
  const finalCreditScore = isRealScore ? calculatedScore : initialCreditScore;

  const handleViewTransactions = () => {
    if (!address) return;
    
    // Use Blockscout SDK to open transaction popup
    triggerTransactionPopup(chain?.id.toString() || "11155111", address);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-red-500 flex items-center justify-center p-4 font-vt323">
        <Card className="w-full max-w-md border-4 border-yellow-400 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader className="text-center border-b-4 border-yellow-400">
            <CardTitle className="flex items-center justify-center gap-2 text-3xl text-blue-800">
              <Wallet className="h-8 w-8" />
              CONNECT WALLET
            </CardTitle>
            <CardDescription className="text-lg text-gray-700">
              Connect your wallet to analyze your on-chain history and build your credit score
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-6">
            <Button
              onClick={() => connect({ connector: injected() })}
              size="lg"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white border-4 border-green-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-xl py-3"
            >
              <Wallet className="h-6 w-6" />
              CONNECT WALLET
            </Button>
            <div className="text-sm text-gray-600 text-center border-2 border-dashed border-gray-300 p-3 bg-gray-50">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-red-500 flex items-center justify-center font-vt323">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-2xl text-white mb-2">ANALYZING ON-CHAIN ACTIVITY...</p>
          <p className="text-lg text-yellow-200">Scanning transactions and protocol interactions</p>
          <div className="mt-6 flex justify-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // No data state (API unavailable or no data returned)
  if (!displayData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-red-500 flex items-center justify-center p-4 font-vt323">
        <Card className="w-full max-w-md border-4 border-red-500 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <CardHeader className="text-center border-b-4 border-red-500">
            <CardTitle className="flex items-center justify-center gap-2 text-3xl text-red-700">
              <AlertCircle className="h-8 w-8" />
              UNABLE TO LOAD DATA
            </CardTitle>
            <CardDescription className="text-lg text-gray-700">
              {error || 'We could not fetch your on-chain data. This might be because:'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="text-lg text-gray-700 space-y-2 bg-yellow-50 border-2 border-yellow-300 p-3">
              <p>• Backend service is unavailable</p>
              <p>• Network connection issues</p>
              <p>• Wallet has no on-chain activity</p>
            </div>
            
            <Button 
              onClick={retry} 
              size="lg" 
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-4 border-blue-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-xl py-3"
            >
              <RefreshCw className="h-6 w-6" />
              TRY AGAIN
            </Button>
            
            <div className="flex gap-2">
              <ViewOnBlockscoutButton 
                address={address}
                chainId={chain?.id.toString() || "11155111"}
                size="lg"
                className="flex-1 justify-center border-4 border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-xl py-3"
              />
            </div>
            
            <div className="text-sm text-gray-500 text-center border-2 border-dashed border-gray-300 p-2 bg-gray-50">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-red-500 font-vt323">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">CREDITCUPID</h1>
              <p className="text-xl text-yellow-200 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                Privacy-preserving credit scoring powered by on-chain data
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg px-4 py-2 border-4 border-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <div className="text-sm text-gray-600">NETWORK</div>
                <div className="text-lg font-semibold capitalize text-green-700">
                  {chain?.name || 'Ethereum'}
                </div>
              </div>
              
              <Button
                onClick={() => disconnect()}
                variant="outline"
                className="border-4 border-red-500 bg-white text-red-600 hover:bg-red-50 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
              >
                DISCONNECT
              </Button>
            </div>
          </div>

          {/* Welcome Card for New Users */}
          <div className="max-w-4xl mx-auto">
            <Card className="border-4 border-yellow-400 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
              <CardHeader className="text-center border-b-4 border-yellow-400 pb-4">
                <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 border-4 border-yellow-400">
                  <Zap className="h-10 w-10 text-yellow-600" />
                </div>
                <CardTitle className="text-3xl text-blue-800 mb-2">WELCOME TO ON-CHAIN CREDIT!</CardTitle>
                <CardDescription className="text-xl text-blue-600">
                  Start building your credit score with on-chain activity
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6 p-6">
                <div className="grid md:grid-cols-3 gap-4 text-lg">
                  <div className="bg-white p-4 rounded-lg border-4 border-blue-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    <BarChart3 className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-blue-900 text-xl mb-2">MAKE TRANSACTIONS</h3>
                    <p className="text-blue-700">Start with simple ETH transfers or token swaps</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-4 border-green-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    <Shield className="h-10 w-10 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-green-900 text-xl mb-2">BUILD PORTFOLIO</h3>
                    <p className="text-green-700">Hold diverse assets like ETH, USDC, or WBTC</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-4 border-purple-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    <TrendingUp className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-purple-900 text-xl mb-2">USE DEFI PROTOCOLS</h3>
                    <p className="text-purple-700">Interact with Aave, Morpho, or other lending protocols</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <ViewOnBlockscoutButton 
                    address={address}
                    chainId={chain?.id.toString() || "11155111"}
                    size="lg"
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-4 border-blue-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-xl py-3"
                  />
                  <Button 
                    onClick={() => setActiveTab('lending')} 
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2 border-4 border-gray-400 bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-xl py-3"
                  >
                    <DollarSign className="h-6 w-6" />
                    EXPLORE LENDING
                  </Button>
                </div>

                <div className="text-lg text-blue-600 border-2 border-dashed border-blue-300 p-3 bg-blue-50">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-red-500 font-vt323">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">CREDITCUPID</h1>
            <p className="text-xl text-yellow-200 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
              The first onchain credit oracle to spark authentic bonds in romance and P2P lending
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg px-4 py-2 border-4 border-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <div className="text-sm text-gray-600">NETWORK</div>
              <div className="text-lg font-semibold capitalize text-green-700">
                {chain?.name || 'Ethereum'}
              </div>
            </div>
            
            <Button
              onClick={() => disconnect()}
              variant="outline"
              className="border-4 border-red-500 bg-white text-red-600 hover:bg-red-50 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
            >
              DISCONNECT
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-yellow-100 border-4 border-yellow-500 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-yellow-800">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <p className="font-medium text-xl">LIMITED DATA AVAILABLE</p>
                  <p className="text-lg">{error}</p>
                </div>
              </div>
              <Button
                onClick={retry}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-4 border-yellow-500 bg-white text-yellow-700 hover:bg-yellow-50 text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
              >
                <RefreshCw className="h-5 w-5" />
                RETRY
              </Button>
            </div>
          </div>
        )}

        {/* Data Quality Notice */}
        {displayData && (
          <div className="mb-4 p-4 bg-blue-200 border-4 border-blue-400 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg text-blue-900 font-bold">
                  Build your credit score • Date on your financial frequency • Get better DeFi terms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full bg-white p-2 rounded-lg border-4 border-gray-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            <TabsTrigger value="overview" className="flex items-center gap-2 text-xl border-2 border-transparent data-[state=active]:border-4 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100 data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              <TrendingUp className="h-5 w-5" />
              OVERVIEW
            </TabsTrigger>
            <TabsTrigger value="dating" className="flex items-center gap-2 text-xl border-2 border-transparent data-[state=active]:border-4 data-[state=active]:border-pink-500 data-[state=active]:bg-pink-100 data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              <Heart className="h-5 w-5 text-pink-500" />
              DATING
            </TabsTrigger>
            <TabsTrigger value="lending" className="flex items-center gap-2 text-xl border-2 border-transparent data-[state=active]:border-4 data-[state=active]:border-green-500 data-[state=active]:bg-green-100 data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              <DollarSign className="h-5 w-5" />
              P2P LENDING
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <CreditScore 
                  score={finalCreditScore}
                  address={safeDisplayData.address}
                  riskFactors={safeDisplayData.riskFactors}
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
                  creditScore={finalCreditScore}
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
            <P2PLending 
              userCreditScore={finalCreditScore} 
              userAddress={address!}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-4 border-white">
          <div className="text-center text-lg text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
            <p>
              CREDITCUPID • The first onchain credit oracle to spark authentic bonds in romance and P2P lending •{' '}
              <button 
                onClick={handleViewTransactions}
                className="text-yellow-300 hover:text-yellow-200 underline drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]"
              >
                VERIFIED ON BLOCKSCOUT
              </button>
            </p>
            <p className="mt-2 text-yellow-200">
              All analysis performed locally in your browser. No data stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the wrapped dashboard
export const CreditDashboard: React.FC = () => {
  return (
    <CreditScoreProvider>
      <CreditDashboardContent />
    </CreditScoreProvider>
  );
};