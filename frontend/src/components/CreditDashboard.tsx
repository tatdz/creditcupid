import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import axios from 'axios';
import { P2PLending } from './P2PLending';
import { AgentChat } from './AgentChat';
import { ProtocolInteractions } from './ProtocolInteractions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  MessageCircle,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface CreditData {
  address: string;
  chains: ChainData[];
  creditScore: number;
  riskFactors: string[];
  aavePositions: { [chainId: number]: AavePosition };
  morphoPositions: { [chainId: number]: MorphoPosition };
  protocolInteractions: ProtocolInteraction[];
  recommendations: string[];
}

interface ChainData {
  chainId: number;
  balance: string;
  tokens: TokenBalance[];
  nfts: NFT[];
  transactions: Transaction[];
}

interface TokenBalance {
  contractAddress: string;
  name: string;
  symbol: string;
  balance: string;
  valueUSD: number;
}

interface NFT {
  contractAddress: string;
  tokenId: string;
  name: string;
  image?: string;
  valueUSD?: number;
}

interface Transaction {
  hash: string;
  timestamp: number;
  value: string;
  to: string;
  from: string;
  gasUsed: string;
  status: boolean;
}

interface AavePosition {
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

interface MorphoPosition {
  supplied: string;
  borrowed: string;
  collateral: string;
}

interface ProtocolInteraction {
  protocol: 'aave' | 'morpho';
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'supply';
  amount: string;
  timestamp: number;
  chainId: number;
  txHash: string;
  asset: string;
}

interface SimulationType {
  id: string;
  name: string;
  description: string;
}

export const CreditDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [simulationType, setSimulationType] = useState('real');
  const [simulationTypes, setSimulationTypes] = useState<SimulationType[]>([]);

  const fetchCreditData = async (walletAddress: string, simulation: string = 'real') => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = simulation === 'real' 
        ? `http://localhost:3001/api/credit-data/${walletAddress}`
        : `http://localhost:3001/api/sandbox/credit-data/${walletAddress}?simulation=${simulation}`;
      
      const response = await axios.get(endpoint);
      setCreditData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch credit data');
      console.error('Error fetching credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimulationTypes = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/sandbox/simulation-types');
      setSimulationTypes(response.data);
    } catch (err) {
      console.error('Error fetching simulation types:', err);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchCreditData(address, simulationType);
    } else {
      setCreditData(null);
    }
  }, [address, isConnected, simulationType]);

  useEffect(() => {
    fetchSimulationTypes();
  }, []);

  const refetch = () => {
    if (address) {
      fetchCreditData(address, simulationType);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-500';
    if (score >= 700) return 'text-blue-500';
    if (score >= 600) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 800) return 'bg-green-500';
    if (score >= 700) return 'bg-blue-500';
    if (score >= 600) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTier = (score: number) => {
    if (score >= 800) return 'AA';
    if (score >= 700) return 'A';
    if (score >= 600) return 'B';
    if (score >= 500) return 'C';
    return 'D';
  };

  const getTierColor = (score: number) => {
    if (score >= 800) return 'bg-green-100 text-green-800';
    if (score >= 700) return 'bg-blue-100 text-blue-800';
    if (score >= 600) return 'bg-yellow-100 text-yellow-800';
    if (score >= 500) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getChainName = (chainId: number) => {
    const chains: { [key: number]: string } = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      11155111: 'Sepolia'
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  // Chart data for portfolio distribution
  const portfolioData = creditData ? creditData.chains.flatMap(chain => 
    chain.tokens.map(token => ({
      name: token.symbol,
      value: token.valueUSD,
      chain: getChainName(chain.chainId)
    }))
  ).filter(item => item.value > 0) : [];

  // Score history data (mock for now)
  const scoreHistoryData = [
    { date: '1M', score: creditData ? Math.max(300, creditData.creditScore - 50) : 400 },
    { date: '2W', score: creditData ? Math.max(300, creditData.creditScore - 25) : 450 },
    { date: '1W', score: creditData ? Math.max(300, creditData.creditScore - 10) : 480 },
    { date: 'Now', score: creditData?.creditScore || 500 }
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <Wallet className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Darma</h1>
            <p className="text-gray-600 mb-6">Cross-chain credit oracle and undercollateralized lending</p>
            <Button
              onClick={() => connect({ connector: injected() })}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              size="lg"
            >
              Connect MetaMask
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Connect your wallet to access your cross-chain credit score
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your cross-chain activity...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Darma</h1>
            <p className="text-gray-600">Your cross-chain credit identity</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Simulation Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mode:</span>
              <select
                value={simulationType}
                onChange={(e) => setSimulationType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                {simulationTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Wallet Info */}
            <div className="bg-white rounded-lg px-3 py-2 border">
              <div className="text-sm text-gray-600">Connected</div>
              <div className="text-sm font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
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

        {creditData && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full bg-white p-1 rounded-lg">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-md"
              >
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="lending" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-md"
              >
                <DollarSign className="h-4 w-4" />
                P2P Lending
              </TabsTrigger>
              <TabsTrigger 
                value="agents" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-md"
              >
                <MessageCircle className="h-4 w-4" />
                AI Agents
              </TabsTrigger>
              <TabsTrigger 
                value="protocols" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-md"
              >
                <Shield className="h-4 w-4" />
                Protocols
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Credit Score Card */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Credit Score
                    </CardTitle>
                    <CardDescription>
                      Your cross-chain credit assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(creditData.creditScore)} mb-2`}>
                      {creditData.creditScore}
                    </div>
                    <Badge className={`${getTierColor(creditData.creditScore)} mb-4`}>
                      Tier: {getTier(creditData.creditScore)}
                    </Badge>
                    
                    <div className="w-48 h-48 mx-auto relative mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Score', value: creditData.creditScore }, 
                              { name: 'Remaining', value: 850 - creditData.creditScore }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#4F46E5" />
                            <Cell fill="#E5E7EB" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold">{getTier(creditData.creditScore)}</span>
                      </div>
                    </div>

                    {/* Score History Chart */}
                    <div className="h-32 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scoreHistoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[300, 850]} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#4F46E5" 
                            strokeWidth={2}
                            dot={{ fill: '#4F46E5' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Portfolio Overview */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Portfolio Overview</CardTitle>
                    <CardDescription>
                      Your assets across {creditData.chains.length} chains
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {creditData.chains.map((chain) => (
                        <div key={chain.chainId} className="bg-gray-50 rounded-lg p-4">
                          <div className="font-semibold text-gray-900">
                            {getChainName(chain.chainId)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Balance: {parseFloat(chain.balance).toFixed(4)} ETH
                          </div>
                          <div className="text-sm text-gray-600">
                            Tokens: {chain.tokens.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            NFTs: {chain.nfts.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Transactions: {chain.transactions.length}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Portfolio Distribution */}
                    {portfolioData.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Portfolio Distribution</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={portfolioData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {portfolioData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatUSD(Number(value))} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                {creditData.riskFactors.length > 0 && (
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        Risk Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {creditData.riskFactors.map((factor, index) => (
                          <div key={index} className="flex items-center text-red-600">
                            <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                            {factor}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {creditData.recommendations.length > 0 && (
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {creditData.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-center text-green-700">
                            <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                            {recommendation}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lending Opportunities */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Lending Opportunities
                    </CardTitle>
                    <CardDescription>
                      Based on your credit score, you qualify for these lending options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border-2 border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-lg font-semibold text-gray-900">Aave + Darma</div>
                        <div className="text-sm text-gray-600 mb-2">Enhanced borrowing</div>
                        <div className="text-2xl font-bold text-green-600">115%</div>
                        <div className="text-sm text-gray-600">Collateral Required</div>
                        <Badge variant="outline" className="mt-2">
                          Better than 150% standard
                        </Badge>
                      </div>
                      
                      <div className="border-2 border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-lg font-semibold text-gray-900">Morpho + Darma</div>
                        <div className="text-sm text-gray-600 mb-2">Better rates</div>
                        <div className="text-2xl font-bold text-green-600">120%</div>
                        <div className="text-sm text-gray-600">Collateral Required</div>
                        <Badge variant="outline" className="mt-2">
                          Preferred rates
                        </Badge>
                      </div>
                      
                      <div className="border-2 border-blue-500 rounded-lg p-4 text-center bg-blue-50">
                        <div className="text-lg font-semibold text-gray-900">Darma P2P</div>
                        <div className="text-sm text-gray-600 mb-2">Undercollateralized</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {creditData.creditScore >= 800 ? '80%' :
                           creditData.creditScore >= 700 ? '70%' :
                           creditData.creditScore >= 600 ? '60%' : '50%'}
                        </div>
                        <div className="text-sm text-gray-600">LTV Available</div>
                        <Button 
                          onClick={() => setActiveTab('lending')}
                          className="w-full mt-3"
                          size="sm"
                        >
                          Explore P2P Lending
                        </Button>
                        <Badge variant="secondary" className="mt-2">
                          Your Tier: {getTier(creditData.creditScore)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Protocol Activity Summary */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Protocol Activity Summary</CardTitle>
                    <CardDescription>
                      Your recent interactions with DeFi protocols
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Aave Positions</h4>
                        {Object.entries(creditData.aavePositions).length > 0 ? (
                          Object.entries(creditData.aavePositions).map(([chainId, position]) => (
                            <div key={chainId} className="bg-gray-50 rounded-lg p-3 mb-2">
                              <div className="text-sm font-medium">{getChainName(Number(chainId))}</div>
                              <div className="text-xs text-gray-600">
                                Collateral: {position.totalCollateralETH} ETH
                              </div>
                              <div className="text-xs text-gray-600">
                                Debt: {position.totalDebtETH} ETH
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm">No Aave positions found</div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Morpho Positions</h4>
                        {Object.entries(creditData.morphoPositions).length > 0 ? (
                          Object.entries(creditData.morphoPositions).map(([chainId, position]) => (
                            <div key={chainId} className="bg-gray-50 rounded-lg p-3 mb-2">
                              <div className="text-sm font-medium">{getChainName(Number(chainId))}</div>
                              <div className="text-xs text-gray-600">
                                Supplied: {position.supplied}
                              </div>
                              <div className="text-xs text-gray-600">
                                Borrowed: {position.borrowed}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm">No Morpho positions found</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="lending">
              <P2PLending />
            </TabsContent>

            <TabsContent value="agents">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgentChat address={address!} agentType="advisor" />
                <AgentChat address={address!} agentType="auditor" />
              </div>
            </TabsContent>

            <TabsContent value="protocols">
              <ProtocolInteractions interactions={creditData.protocolInteractions} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};