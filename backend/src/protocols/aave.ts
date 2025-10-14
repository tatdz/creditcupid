import { ethers } from 'ethers';
import axios from 'axios';

// Aave V3 Pool ABI
const AAVE_POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external",
  "function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)",
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

// Strongly typed AAVE_ADDRESSES with number index signature
export const AAVE_ADDRESSES: {
  [chainId: number]: { pool: string; dataProvider: string }
} = {
  1: { // Ethereum Mainnet
    pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    dataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3'
  },
  137: { // Polygon
    pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654'
  },
  42161: { // Arbitrum
    pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', 
    dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654'
  },
  10: { // Optimism
    pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654'
  },
  8453: { // Base
    pool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    dataProvider: '0x2c8C2f4CA2b7f38f3E612945E0A0C5cC1f5F6C2e'
  },
  11155111: { // Sepolia
    pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    dataProvider: '0xFA3bD19110d986c5e5E9DD5F69362d05035D045B'
  }
};

export interface AavePosition {
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface AaveTransaction {
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  asset: string;
  amount: string;
  timestamp: number;
  txHash: string;
  chainId: number;
  blockNumber: number;
}

export class AaveProtocol {
  private providers: { [chainId: number]: ethers.JsonRpcProvider } = {};

  constructor(rpcUrls: { [chainId: number]: string }) {
    for (const [chainIdStr, url] of Object.entries(rpcUrls)) {
      const chainId = Number(chainIdStr);
      this.providers[chainId] = new ethers.JsonRpcProvider(url);
    }
  }

  async getUserPositions(address: string, chainIds: number[]): Promise<{ [chainId: number]: AavePosition }> {
    const positions: { [chainId: number]: AavePosition } = {};

    for (const chainId of chainIds) {
      try {
        const provider = this.providers[chainId];
        if (!provider || !AAVE_ADDRESSES[chainId]) continue;

        const poolContract = new ethers.Contract(
          AAVE_ADDRESSES[chainId].pool,
          AAVE_POOL_ABI,
          provider
        );

        const userData = await poolContract.getUserAccountData(address);

        positions[chainId] = {
          totalCollateralETH: ethers.formatUnits(userData.totalCollateralBase ?? userData[0], 8),
          totalDebtETH: ethers.formatUnits(userData.totalDebtBase ?? userData[1], 8),
          availableBorrowsETH: ethers.formatUnits(userData.availableBorrowsBase ?? userData[2], 8),
          currentLiquidationThreshold: ethers.formatUnits(userData.currentLiquidationThreshold ?? userData[3], 2),
          ltv: ethers.formatUnits(userData.ltv ?? userData[4], 2),
          healthFactor: ethers.formatUnits(userData.healthFactor ?? userData[5], 18)
        };
      } catch (error) {
        console.error(`Error fetching Aave position for chain ${chainId}:`, error);
      }
    }

    return positions;
  }

  async getUserTransactionHistory(address: string, chainIds: number[]): Promise<AaveTransaction[]> {
    const allTransactions: AaveTransaction[] = [];

    for (const chainId of chainIds) {
      try {
        const transactions = await this.getChainTransactions(address, chainId);
        allTransactions.push(...transactions);
      } catch (error) {
        console.error(`Error fetching Aave transactions for chain ${chainId}:`, error);
      }
    }

    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private async getChainTransactions(address: string, chainId: number): Promise<AaveTransaction[]> {
    const transactions: AaveTransaction[] = [];
    const baseURL = this.getBlockscoutURL(chainId);

    try {
      const response = await axios.get(`${baseURL}/api?module=account&action=txlist&address=${address}&sort=desc`);

      if (response.data.status === '1') {
        const aavePool = AAVE_ADDRESSES[chainId]?.pool.toLowerCase();

        for (const tx of response.data.result) {
          if (tx.to?.toLowerCase() === aavePool) {
            const transaction = await this.decodeAaveTransaction(tx, chainId);
            if (transaction) {
              transactions.push(transaction);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching transactions from Blockscout for chain ${chainId}:`, error);
    }

    return transactions;
  }

  private async decodeAaveTransaction(tx: any, chainId: number): Promise<AaveTransaction | null> {
    try {
      const iface = new ethers.Interface(AAVE_POOL_ABI);
      const decoded = iface.parseTransaction({ data: tx.input, value: tx.value });

      if (!decoded) return null;

      let type: AaveTransaction['type'];
      let asset: string;
      let amount: string;

      // ethers.js parseTransaction args are tuple-like, so access by index
      switch (decoded.name) {
        case 'supply':
          type = 'deposit';
          asset = decoded.args[0];
          amount = ethers.formatUnits(decoded.args[1], await this.getTokenDecimals(asset, chainId));
          break;
        case 'withdraw':
          type = 'withdraw';
          asset = decoded.args[0];
          amount = ethers.formatUnits(decoded.args[1], await this.getTokenDecimals(asset, chainId));
          break;
        case 'borrow':
          type = 'borrow';
          asset = decoded.args[0];
          amount = ethers.formatUnits(decoded.args[1], await this.getTokenDecimals(asset, chainId));
          break;
        case 'repay':
          type = 'repay';
          asset = decoded.args[0];
          amount = ethers.formatUnits(decoded.args[1], await this.getTokenDecimals(asset, chainId));
          break;
        default:
          return null;
      }

      return {
        type,
        asset,
        amount,
        timestamp: parseInt(tx.timeStamp, 10),
        txHash: tx.hash,
        chainId,
        blockNumber: parseInt(tx.blockNumber, 10)
      };
    } catch (error) {
      console.error('Error decoding Aave transaction:', error);
      return null;
    }
  }

  private async getTokenDecimals(tokenAddress: string, chainId: number): Promise<number> {
    try {
      const provider = this.providers[chainId];
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function decimals() view returns (uint8)'],
        provider
      );
      return await tokenContract.decimals();
    } catch {
      return 18; // Default fallback decimals
    }
  }

  private getBlockscoutURL(chainId: number): string {
    const urls: { [chainId: number]: string } = {
      1: 'https://eth.blockscout.com',
      137: 'https://polygon.blockscout.com',
      42161: 'https://arbitrum.blockscout.com',
      10: 'https://optimism.blockscout.com',
      8453: 'https://base.blockscout.com',
      11155111: 'https://sepolia.blockscout.com'
    };
    return urls[chainId] || 'https://eth.blockscout.com';
  }
}
