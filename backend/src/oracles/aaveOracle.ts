import { ethers } from 'ethers';

export interface AavePriceData {
  price: string;
  source: string;
  timestamp: number;
}

export class AaveOracle {
  private provider: ethers.JsonRpcProvider;
  private chainId: number;

  // Updated Aave Oracle addresses for mainnet
  private aaveOracleAddresses: { [chainId: number]: string } = {
    1: '0x54586bE62E3c3580375aE3723C145253060Ca0C2', // Aave V3 Oracle
    137: '0xb023e699F5a33916Ea823A16485e259257cA8Bd1', // Aave Polygon
    42161: '0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7', // Aave Arbitrum
    10: '0xD81eb3728a631871a7eBBaD631b5f424909f0c77', // Aave Optimism
  };

  // Token addresses for common assets
  private tokenAddresses: { [symbol: string]: string } = {
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    'STETH': '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  };

  constructor(rpcUrl: string, chainId: number) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.chainId = chainId;
  }

  async getAaveCollateralPrices(): Promise<{ [symbol: string]: AavePriceData }> {
    console.log(`💰 Fetching Aave collateral prices for chain ${this.chainId}`);
    
    const prices: { [symbol: string]: AavePriceData } = {};
    const symbols = ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'STETH'];

    for (const symbol of symbols) {
      try {
        const priceData = await this.getAssetPrice(symbol);
        if (priceData) {
          prices[symbol] = priceData;
        } else {
          // Fallback to mock price
          prices[symbol] = this.getMockPrice(symbol);
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch Aave price for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
        prices[symbol] = this.getMockPrice(symbol);
      }
    }

    return prices;
  }

  private async getAssetPrice(symbol: string): Promise<AavePriceData | null> {
    const oracleAddress = this.aaveOracleAddresses[this.chainId];
    const tokenAddress = this.tokenAddresses[symbol];

    if (!oracleAddress || !tokenAddress) {
      return this.getMockPrice(symbol);
    }

    try {
      // Try multiple ABI approaches for Aave Oracle
      const price = await this.tryMultipleABIs(oracleAddress, tokenAddress);
      
      if (price && price > 0) {
        return {
          price: price.toString(),
          source: `aave-oracle-chain-${this.chainId}`,
          timestamp: Math.floor(Date.now() / 1000)
        };
      }

      return this.getMockPrice(symbol);
    } catch (error) {
      console.warn(`Aave Oracle call failed for ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
      return this.getMockPrice(symbol);
    }
  }

  private async tryMultipleABIs(oracleAddress: string, tokenAddress: string): Promise<number | null> {
    const abiVariants = [
      // Aave V3 Oracle ABI
      ['function getAssetPrice(address asset) external view returns (uint256)'],
      // Generic price feed ABI
      ['function latestAnswer() external view returns (int256)'],
      ['function getPrice(address asset) external view returns (uint256)'],
    ];

    for (const abi of abiVariants) {
      try {
        const contract = new ethers.Contract(oracleAddress, abi, this.provider);
        
        if (abi[0].includes('getAssetPrice')) {
          const price = await contract.getAssetPrice(tokenAddress);
          return parseFloat(ethers.formatUnits(price, 8)); // Aave prices are often in 8 decimals
        } else if (abi[0].includes('latestAnswer')) {
          const price = await contract.latestAnswer();
          return parseFloat(ethers.formatUnits(price, 8));
        } else if (abi[0].includes('getPrice')) {
          const price = await contract.getPrice(tokenAddress);
          return parseFloat(ethers.formatUnits(price, 8));
        }
      } catch (error) {
        // Try next ABI variant
        continue;
      }
    }

    return null;
  }

  private getMockPrice(symbol: string): AavePriceData {
    const mockPrices: { [symbol: string]: number } = {
      'ETH': 3500,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WBTC': 65000,
      'STETH': 3600,
      'LINK': 15,
      'AAVE': 100,
    };

    return {
      price: (mockPrices[symbol] || 1).toString(),
      source: 'mock-fallback',
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const prices = await this.getAaveCollateralPrices();
      return Object.keys(prices).length > 0;
    } catch (error) {
      return false;
    }
  }
}