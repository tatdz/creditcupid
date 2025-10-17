import { ethers } from 'ethers';

export class PriceOracle {
  private provider: ethers.JsonRpcProvider;
  private chainId: number;

  constructor(provider: ethers.JsonRpcProvider, chainId: number) {
    this.provider = provider;
    this.chainId = chainId;
  }

  async getPrice(symbol: string): Promise<number> {
    const normalizedSymbol = symbol.toUpperCase();
    
    try {
      // Try Chainlink price feeds first
      const chainlinkPrice = await this.getChainlinkPrice(normalizedSymbol);
      if (chainlinkPrice > 0) {
        return chainlinkPrice;
      }

      // Fallback to decentralized exchanges
      const dexPrice = await this.getDexPrice(normalizedSymbol);
      if (dexPrice > 0) {
        return dexPrice;
      }

      // Final fallback to static prices
      return this.getStaticPrice(normalizedSymbol);
    } catch (error) {
      console.warn(`Error fetching price for ${symbol}:`, this.getErrorMessage(error));
      return this.getStaticPrice(normalizedSymbol);
    }
  }

  private async getChainlinkPrice(symbol: string): Promise<number> {
    const priceFeeds: { [key: string]: string } = {
      'ETH': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      'BTC': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      'USDC': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
      'USDT': '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
      'DAI': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
      'LINK': '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'
    };

    const feedAddress = priceFeeds[symbol];
    if (!feedAddress) {
      return 0;
    }

    try {
      const abi = [
        'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)'
      ];
      
      const contract = new ethers.Contract(feedAddress, abi, this.provider);
      const roundData = await contract.latestRoundData();
      const price = parseInt(roundData.answer) / 1e8;
      
      return price > 0 ? price : 0;
    } catch (error) {
      console.warn(`Chainlink price feed failed for ${symbol}:`, this.getErrorMessage(error));
      return 0;
    }
  }

  private async getDexPrice(symbol: string): Promise<number> {
    // For demo purposes, return static prices
    // In production, you'd query Uniswap/Sushiswap pools
    return this.getStaticPrice(symbol);
  }

  private getStaticPrice(symbol: string): number {
    const prices: { [symbol: string]: number } = {
      'ETH': 3000,
      'BTC': 35000,
      'WBTC': 35000,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'STETH': 3100,
      'UNI': 6.5,
      'LINK': 14.5,
      'AAVE': 85,
      'MATIC': 0.75,
      'OP': 1.8,
      'ARB': 0.9
    };

    return prices[symbol] || 0;
  }

  // Enhanced method to get multiple prices
  async getPrices(symbols: string[]): Promise<{ [key: string]: number }> {
    const prices: { [key: string]: number } = {};
    
    await Promise.all(
      symbols.map(async (symbol) => {
        prices[symbol] = await this.getPrice(symbol);
      })
    );

    return prices;
  }

  // Utility method to safely get error messages
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }
}