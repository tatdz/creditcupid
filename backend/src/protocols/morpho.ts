import { ethers } from 'ethers';
import axios from 'axios';

// Morpho V2 ABIs
const MORPHO_ABI = [
  "function supply(address poolToken, address onBehalf, uint256 amount) external",
  "function withdraw(address poolToken, uint256 amount) external",
  "function borrow(address poolToken, uint256 amount) external",
  "function repay(address poolToken, address onBehalf, uint256 amount) external",
  "function position(address user) external view returns (uint256 supply, uint256 borrow)"
];

// Morpho Contract Addresses by Chain
export const MORPHO_ADDRESSES = {
  1: { // Ethereum Mainnet - Morpho Aave V2
    morpho: '0x777777c9898D384F785Ee44Acfe945efDFf5f3E0',
    rewardsManager: '0x78681D63E6DC6Ee052C256f4af36F57C6Fc116dC'
  },
  1: { // Ethereum Mainnet - Morpho Aave V3
    morpho: '0x33333aea097c193e66081E930c33020272b33333',
    rewardsManager: '0x3B14E5C73e0A56D607A8688098326fD4b4292135'
  },
  137: { // Polygon
    morpho: '0x8888882f8f843896699869179fB6e4f7e3B58888',
    rewardsManager: '0x3B14E5C73e0A56D607A8688098326fD4b4292135'
  }
};

export interface MorphoPosition {
  supplied: string;
  borrowed: string;
  collateral: string;
}

export interface MorphoTransaction {
  type: 'supply' | 'withdraw' | 'borrow' | 'repay';
  poolToken: string;
  amount: string;
  timestamp: number;
  txHash: string;
  chainId: number;
  blockNumber: number;
}

export class MorphoProtocol {
  private providers: { [chainId: number]: ethers.JsonRpcProvider } = {};

  constructor(rpcUrls: { [chainId: number]: string }) {
    for (const [chainId, url] of Object.entries(rpcUrls)) {
      this.providers[parseInt(chainId)] = new ethers.JsonRpcProvider(url);
    }
  }

  async getUserPositions(address: string, chainIds: number[]): Promise<{ [chainId: number]: MorphoPosition }> {
    const positions: { [chainId: number]: MorphoPosition } = {};

    for (const chainId of chainIds) {
      try {
        const provider = this.providers[chainId];
        if (!provider || !MORPHO_ADDRESSES[chainId]) continue;

        const morphoContract = new ethers.Contract(
          MORPHO_ADDRESSES[chainId].morpho,
          MORPHO_ABI,
          provider
        );

        // Note: This is a simplified implementation
        // In production, you would need to iterate through all pool tokens
        const position = await morphoContract.position(address);
        
        positions[chainId] = {
          supplied: ethers.formatEther(position.supply || 0),
          borrowed: ethers.formatEther(position.borrow || 0),
          collateral: '0' // Would need additional logic to calculate collateral
        };
      } catch (error) {
        console.error(`Error fetching Morpho position for chain ${chainId}:`, error);
      }
    }

    return positions;
  }

  async getUserTransactionHistory(address: string, chainIds: number[]): Promise<MorphoTransaction[]> {
    const allTransactions: MorphoTransaction[] = [];

    for (const chainId of chainIds) {
      try {
        const transactions = await this.getChainTransactions(address, chainId);
        allTransactions.push(...transactions);
      } catch (error) {
        console.error(`Error fetching Morpho transactions for chain ${chainId}:`, error);
      }
    }

    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private async getChainTransactions(address: string, chainId: number): Promise<MorphoTransaction[]> {
    const transactions: MorphoTransaction[] = [];
    const baseURL = this.getBlockscoutURL(chainId);
    
    try {
      const response = await axios.get(
        `${baseURL}/api?module=account&action=txlist&address=${address}&sort=desc`
      );

      if (response.data.status === '1') {
        const morphoAddress = MORPHO_ADDRESSES[chainId]?.morpho.toLowerCase();
        
        for (const tx of response.data.result) {
          if (tx.to?.toLowerCase() === morphoAddress) {
            const transaction = await this.decodeMorphoTransaction(tx, chainId);
            if (transaction) {
              transactions.push(transaction);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching Morpho transactions from Blockscout for chain ${chainId}:`, error);
    }

    return transactions;
  }

  private async decodeMorphoTransaction(tx: any, chainId: number): Promise<MorphoTransaction | null> {
    try {
      const iface = new ethers.Interface(MORPHO_ABI);
      const decoded = iface.parseTransaction({ data: tx.input, value: tx.value });

      if (!decoded) return null;

      let type: MorphoTransaction['type'];
      let poolToken: string;
      let amount: string;

      switch (decoded.name) {
        case 'supply':
          type = 'supply';
          poolToken = decoded.args[0];
          amount = ethers.formatEther(decoded.args[2]);
          break;
        case 'withdraw':
          type = 'withdraw';
          poolToken = decoded.args[0];
          amount = ethers.formatEther(decoded.args[1]);
          break;
        case 'borrow':
          type = 'borrow';
          poolToken = decoded.args[0];
          amount = ethers.formatEther(decoded.args[1]);
          break;
        case 'repay':
          type = 'repay';
          poolToken = decoded.args[0];
          amount = ethers.formatEther(decoded.args[2]);
          break;
        default:
          return null;
      }

      return {
        type,
        poolToken,
        amount,
        timestamp: parseInt(tx.timeStamp),
        txHash: tx.hash,
        chainId,
        blockNumber: parseInt(tx.blockNumber)
      };
    } catch (error) {
      console.error('Error decoding Morpho transaction:', error);
      return null;
    }
  }

  private getBlockscoutURL(chainId: number): string {
    const urls: { [key: number]: string } = {
      1: 'https://eth.blockscout.com',
      137: 'https://polygon.blockscout.com',
      42161: 'https://arbitrum.blockscout.com',
      10: 'https://optimism.blockscout.com'
    };
    return urls[chainId] || 'https://eth.blockscout.com';
  }
}