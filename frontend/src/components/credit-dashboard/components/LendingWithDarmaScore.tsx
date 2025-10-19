import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { TrendingUp, Shield, Zap, BarChart3, Info, AlertCircle, RefreshCw } from 'lucide-react';

interface MorphoMarket {
  uniqueKey: string;
  market: string;
  loanAsset: string;
  collateralAsset: string;
  lltv: string;
  lltvPercent: number;
  apy?: {
    borrowApy?: number;
    avgBorrowApy?: number;
  };
}

interface AaveReserve {
  symbol: string;
  baseLTVasCollateral: number;
  baseLTVasCollateralPercent: number;
  liquidationThreshold: number;
  avgBorrowRate?: number;
  isRealData: boolean;
}

interface LendingWithDarmaScoreProps {
  creditScore: number;
  collateralBoost: number;
}

export const LendingWithDarmaScore: React.FC<LendingWithDarmaScoreProps> = ({ 
  creditScore, 
  collateralBoost 
}) => {
  const [morphoMarkets, setMorphoMarkets] = useState<MorphoMarket[]>([]);
  const [aaveReserves, setAaveReserves] = useState<AaveReserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataStatus, setDataStatus] = useState<'all-real' | 'partial-real' | 'all-demo'>('all-demo');

  useEffect(() => {
    fetchLTVData();
  }, []);

  const fetchLTVData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both Morpho and Aave data in parallel
      const [morphoData, aaveData] = await Promise.all([
        fetchMorphoLLTV(),
        fetchAaveLTV()
      ]);

      setMorphoMarkets(morphoData);
      setAaveReserves(aaveData);

      // Update data status
      const morphoReal = morphoData.length > 0 && !morphoData[0].uniqueKey.startsWith('fallback');
      const aaveReal = aaveData.length > 0 && aaveData[0].isRealData;
      
      if (morphoReal && aaveReal) {
        setDataStatus('all-real');
      } else if (morphoReal || aaveReal) {
        setDataStatus('partial-real');
      } else {
        setDataStatus('all-demo');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch LTV data');
      setDataStatus('all-demo');
    } finally {
      setLoading(false);
    }
  };

  const fetchMorphoLLTV = async (): Promise<MorphoMarket[]> => {
    try {
      const query = `
        query GetMorphoMarkets {
          markets {
            items {
              uniqueKey
              lltv
              loanAsset {
                symbol
                address
                decimals
              }
              collateralAsset {
                symbol
                address
                decimals
              }
              state {
                borrowApy
                avgBorrowApy
              }
            }
          }
        }
      `;

      console.log('📡 Fetching real Morpho data...');
      const response = await fetch('https://api.morpho.org/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const markets = result.data.markets.items;
      const processedMarkets: MorphoMarket[] = [];

      console.log(`📊 Processing ${markets.length} Morpho markets...`);

      for (const market of markets) {
        // Skip markets with null assets
        if (!market.loanAsset?.symbol || !market.collateralAsset?.symbol) {
          continue;
        }

        // Parse LLTV value - handle different formats
        let lltvPercent: number;
        const lltvValue = Number(market.lltv);
        
        if (lltvValue > 10000) {
          // If value is too large, it might be in wei or other format
          if (lltvValue > 1e15) {
            lltvPercent = (lltvValue / 1e18) * 100;
          } else {
            lltvPercent = (lltvValue / 1e16) * 100;
          }
        } else {
          // Assume basis points (e.g., 9200 = 92%)
          lltvPercent = (lltvValue / 100) * 100;
        }

        // Ensure reasonable range (0-100%)
        lltvPercent = Math.min(Math.max(lltvPercent, 0), 100);

        processedMarkets.push({
          uniqueKey: market.uniqueKey,
          market: `${market.loanAsset.symbol}/${market.collateralAsset.symbol}`,
          loanAsset: market.loanAsset.symbol,
          collateralAsset: market.collateralAsset.symbol,
          lltv: market.lltv,
          lltvPercent: parseFloat(lltvPercent.toFixed(2)),
          apy: {
            borrowApy: market.state.borrowApy ? parseFloat(market.state.borrowApy) : undefined,
            avgBorrowApy: market.state.avgBorrowApy ? parseFloat(market.state.avgBorrowApy) : undefined,
          },
        });
      }

      // Filter for reasonable LTV ranges and sort
      const validMarkets = processedMarkets
        .filter(market => market.lltvPercent <= 100 && market.lltvPercent > 0)
        .sort((a, b) => b.lltvPercent - a.lltvPercent)
        .slice(0, 8);

      console.log(`✅ Found ${validMarkets.length} valid Morpho markets`);
      return validMarkets;

    } catch (error) {
      console.error('Error fetching Morpho LLTV data:', error);
      return getFallbackMorphoData();
    }
  };

  const fetchAaveLTV = async (): Promise<AaveReserve[]> => {
    try {
      // Try multiple Aave data sources
      console.log('📡 Fetching real Aave data...');
      
      // Source 1: Aave V3 Ethereum Subgraph (Primary)
      const subgraphQuery = `
        query GetAaveReserves {
          reserves(where: { isActive: true }, first: 20) {
            symbol
            name
            baseLTVasCollateral
            liquidationThreshold
            reserveLiquidationBonus
            variableBorrowRate
            stableBorrowRate
            liquidityRate
          }
        }
      `;

      const response = await fetch('https://api.thegraph.com/subgraphs/name/aave/protocol-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: subgraphQuery }),
      });

      if (!response.ok) {
        throw new Error(`Aave Subgraph HTTP error: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`Aave Subgraph errors: ${JSON.stringify(result.errors)}`);
      }

      const reserves = result.data.reserves;
      const processedReserves: AaveReserve[] = [];

      console.log(`📊 Processing ${reserves.length} Aave reserves...`);

      for (const reserve of reserves) {
        // Convert from basis points to percentage (e.g., 8250 → 82.50%)
        const baseLTVPercent = (reserve.baseLTVasCollateral / 10000) * 100;
        const liquidationThresholdPercent = (reserve.liquidationThreshold / 10000) * 100;
        
        // Convert borrow rates from ray to percentage
        const variableBorrowRate = reserve.variableBorrowRate ? 
          parseFloat(reserve.variableBorrowRate) / 1e25 : undefined;
        
        const stableBorrowRate = reserve.stableBorrowRate ? 
          parseFloat(reserve.stableBorrowRate) / 1e25 : undefined;

        // Use variable borrow rate as average, fallback to stable rate
        const avgBorrowRate = variableBorrowRate || stableBorrowRate;

        // Only include reserves with valid LTV
        if (baseLTVPercent > 0 && baseLTVPercent <= 100) {
          processedReserves.push({
            symbol: reserve.symbol,
            baseLTVasCollateral: reserve.baseLTVasCollateral,
            baseLTVasCollateralPercent: parseFloat(baseLTVPercent.toFixed(2)),
            liquidationThreshold: parseFloat(liquidationThresholdPercent.toFixed(2)),
            avgBorrowRate: avgBorrowRate ? parseFloat(avgBorrowRate.toFixed(2)) : undefined,
            isRealData: true,
          });
        }
      }

      const validReserves = processedReserves
        .sort((a, b) => b.baseLTVasCollateralPercent - a.baseLTVasCollateralPercent)
        .slice(0, 8);

      console.log(`✅ Found ${validReserves.length} valid Aave reserves`);
      return validReserves;

    } catch (error) {
      console.error('Error fetching Aave LTV data:', error);
      
      // Fallback: Try Aave API directly
      try {
        console.log('🔄 Trying Aave API fallback...');
        const apiResponse = await fetch('https://aave-api-v2.aave.com/data/markets-data/');
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          // Process Aave API data format here if needed
        }
      } catch (apiError) {
        console.error('Aave API fallback also failed:', apiError);
      }
      
      return getFallbackAaveData();
    }
  };

  const getFallbackMorphoData = (): MorphoMarket[] => {
    console.log('🔄 Using fallback Morpho data');
    return [
      {
        uniqueKey: 'fallback-1',
        market: 'WETH/USDC',
        loanAsset: 'WETH',
        collateralAsset: 'USDC',
        lltv: '9200',
        lltvPercent: 92.00,
        apy: { avgBorrowApy: 3.2 }
      },
      {
        uniqueKey: 'fallback-2',
        market: 'WBTC/USDC',
        loanAsset: 'WBTC',
        collateralAsset: 'USDC',
        lltv: '8500',
        lltvPercent: 85.00,
        apy: { avgBorrowApy: 2.8 }
      },
      {
        uniqueKey: 'fallback-3',
        market: 'USDC/ETH',
        loanAsset: 'USDC',
        collateralAsset: 'ETH',
        lltv: '8800',
        lltvPercent: 88.00,
        apy: { avgBorrowApy: 5.5 }
      }
    ];
  };

  const getFallbackAaveData = (): AaveReserve[] => {
    console.log('🔄 Using fallback Aave data');
    return [
      {
        symbol: 'WETH',
        baseLTVasCollateral: 8250,
        baseLTVasCollateralPercent: 82.50,
        liquidationThreshold: 86.00,
        avgBorrowRate: 3.8,
        isRealData: false,
      },
      {
        symbol: 'USDC',
        baseLTVasCollateral: 8250,
        baseLTVasCollateralPercent: 82.50,
        liquidationThreshold: 86.00,
        avgBorrowRate: 5.2,
        isRealData: false,
      },
      {
        symbol: 'USDT',
        baseLTVasCollateral: 8250,
        baseLTVasCollateralPercent: 82.50,
        liquidationThreshold: 86.00,
        avgBorrowRate: 5.5,
        isRealData: false,
      },
      {
        symbol: 'DAI',
        baseLTVasCollateral: 8250,
        baseLTVasCollateralPercent: 82.50,
        liquidationThreshold: 86.00,
        avgBorrowRate: 5.0,
        isRealData: false,
      },
      {
        symbol: 'WBTC',
        baseLTVasCollateral: 7250,
        baseLTVasCollateralPercent: 72.50,
        liquidationThreshold: 78.00,
        avgBorrowRate: 2.5,
        isRealData: false,
      },
    ];
  };

  const getCreditScoreTier = (score: number): string => {
    if (score >= 800) return 'Excellent';
    if (score >= 750) return 'Very Good';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    if (score >= 600) return 'Basic';
    return 'Needs Improvement';
  };

  const getEffectiveLTVBoost = (baseLTV: number): number => {
    const boostMultiplier = 1 + (collateralBoost / 100);
    return parseFloat((baseLTV * boostMultiplier).toFixed(2));
  };

  const getLTVColor = (ltv: number): string => {
    if (ltv >= 90) return 'text-green-600';
    if (ltv >= 80) return 'text-blue-600';
    if (ltv >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDataStatusBadge = () => {
    switch (dataStatus) {
      case 'all-real':
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Live Data</span>;
      case 'partial-real':
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Mixed Data</span>;
      case 'all-demo':
        return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Demo Data</span>;
      default:
        return null;
    }
  };

  const getDataStatusText = () => {
    const morphoReal = morphoMarkets.length > 0 && !morphoMarkets[0].uniqueKey.startsWith('fallback');
    const aaveReal = aaveReserves.length > 0 && aaveReserves[0].isRealData;

    if (morphoReal && aaveReal) return 'All data is live from protocols';
    if (morphoReal) return 'Morpho: Live • Aave: Demo';
    if (aaveReal) return 'Aave: Live • Morpho: Demo';
    return 'Using demo data - APIs unavailable';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lending with Darma Credit Score
          </CardTitle>
          <CardDescription>
            Loading real-time LTV data from protocols...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Fetching live data from Morpho & Aave</p>
            <div className="mt-2 flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Lending with Darma Credit Score
          {getDataStatusBadge()}
        </CardTitle>
        <CardDescription>
          Your credit score {creditScore} ({getCreditScoreTier(creditScore)}) + {collateralBoost}% collateral boost
          <div className="text-xs text-gray-500 mt-1">{getDataStatusText()}</div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credit Score Impact */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Darma Credit Advantage
              </h3>
              <p className="text-sm text-blue-700">
                Your assets are worth more with Darma credit score
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-700">+{collateralBoost}%</div>
              <div className="text-sm text-blue-600">Collateral Boost</div>
            </div>
          </div>
        </div>

        {/* Morpho Markets */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Morpho Blue Markets - LLTV
            {morphoMarkets.length > 0 && !morphoMarkets[0].uniqueKey.startsWith('fallback') && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Live</span>
            )}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {morphoMarkets.map((market) => (
              <div key={market.uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {market.loanAsset} / {market.collateralAsset}
                  </div>
                  <div className="text-sm text-gray-600">
                    Max LLTV: <strong>{market.lltvPercent}%</strong>
                    {market.apy?.avgBorrowApy && (
                      <span className="ml-2">• APY: {market.apy.avgBorrowApy.toFixed(2)}%</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getLTVColor(market.lltvPercent)}`}>
                    {market.lltvPercent}%
                  </div>
                  <div className="text-xs text-gray-500">
                    With Darma: <strong>{getEffectiveLTVBoost(market.lltvPercent)}%</strong>
                  </div>
                </div>
              </div>
            ))}
            {morphoMarkets.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No Morpho markets data available
              </div>
            )}
          </div>
        </div>

        {/* Aave Reserves */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Aave V3 Reserves - LTV
            {aaveReserves.length > 0 && aaveReserves[0].isRealData && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Live</span>
            )}
          </h3>
          <div className="space-y-2">
            {aaveReserves.map((reserve) => (
              <div key={reserve.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{reserve.symbol}</div>
                  <div className="text-sm text-gray-600">
                    Base LTV: <strong>{reserve.baseLTVasCollateralPercent}%</strong>
                    {reserve.avgBorrowRate && (
                      <span className="ml-2">• Rate: {reserve.avgBorrowRate.toFixed(2)}%</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getLTVColor(reserve.baseLTVasCollateralPercent)}`}>
                    {reserve.baseLTVasCollateralPercent}%
                  </div>
                  <div className="text-xs text-gray-500">
                    With Darma: <strong>{getEffectiveLTVBoost(reserve.baseLTVasCollateralPercent)}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error/Status Info */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <div className="text-sm">
                <strong>Data Status:</strong> {getDataStatusText()}
                <div className="text-xs mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchLTVData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* How It Works */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            How Darma Credit Score Improves Your Lending
          </h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• <strong>Higher Collateral Value:</strong> Your assets are worth {collateralBoost}% more</p>
            <p>• <strong>Better Loan Terms:</strong> Access higher LTV ratios across protocols</p>
            <p>• <strong>Cross-Protocol Recognition:</strong> Your credit score works on Morpho, Aave, and more</p>
            <p>• <strong>Real-time Updates:</strong> LTV data fetched live from protocol APIs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};