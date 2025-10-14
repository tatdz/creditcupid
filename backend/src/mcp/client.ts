import { ethers } from 'ethers';
import axios from 'axios';
import { AaveProtocol, AaveTransaction, AavePosition } from '../protocols/aave';
import { MorphoProtocol, MorphoTransaction, MorphoPosition } from '../protocols/morpho';

export interface CrossChainData {
  address: string;
  chains: ChainData[];
  creditScore: number;
  riskFactors: string[];
  aavePositions: { [chainId: number]: AavePosition };
  morphoPositions: { [chainId: number]: MorphoPosition };
  protocolInteractions: ProtocolInteraction[];
  recommendations: string[];
}

export interface ChainData {
  chainId: number;
  balance: string;
  tokens: TokenBalance[];
  nfts: NFT[];
  transactions: Transaction[];
}

export interface TokenBalance {
  contractAddress: string;
  name: string;
  symbol: string;
  balance: string;
  valueUSD: number;
}

export interface NFT {
  contractAddress: string;
  tokenId: string;
  name: string;
  image?: string;
  valueUSD?: number;
}

export interface Transaction {
  hash: string;
  timestamp: number;
  value: string;
  to: string;
  from: string;
  gasUsed: string;
  status: boolean;
}

export interface ProtocolInteraction {
  protocol: 'aave' | 'morpho';
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'supply';
  amount: string;
  timestamp: number;
  chainId: number;
  txHash: string;
  asset: string;
}

export class BlockscoutMCPClient {
  private baseURLs: { [chainId: number]: string } = {
    1: 'https://eth.blockscout.com/api/v2',
    137: 'https://polygon.blockscout.com/api/v2',
    42161: 'https://arbitrum.blockscout.com/api/v2',
    10: 'https://optimism.blockscout.com/api/v2',
    8453: 'https://base.blockscout.com/api/v2',
    11155111: 'https://sepolia.blockscout.com/api/v2'
  };

  private aaveProtocol: AaveProtocol;
  private morphoProtocol: MorphoProtocol;

  constructor(rpcUrls: { [chainId: number]: string }) {
    this.aaveProtocol = new AaveProtocol(rpcUrls);
    this.morphoProtocol = new MorphoProtocol(rpcUrls);
  }

  async getCrossChainData(address: string): Promise<CrossChainData> {
    const supportedChains = [1, 137, 42161, 10, 8453, 11155111];
    
    const [
      chainsData,
      aavePositions,
      morphoPositions,
      aaveTransactions,
      morphoTransactions
    ] = await Promise.all([
      this.getChainsData(address, supportedChains),
      this.aaveProtocol.getUserPositions(address, supportedChains),
      this.morphoProtocol.getUserPositions(address, supportedChains),
      this.aaveProtocol.getUserTransactionHistory(address, supportedChains),
      this.morphoProtocol.getUserTransactionHistory(address, supportedChains)
    ]);

    const protocolInteractions = this.combineProtocolInteractions(aaveTransactions, morphoTransactions);
    const creditScore = this.calculateCreditScore(chainsData, protocolInteractions);
    const riskFactors = this.identifyRiskFactors(chainsData, protocolInteractions);
    const recommendations = this.generateRecommendations(creditScore, riskFactors, protocolInteractions);

    return {
      address,
      chains: chainsData.filter(data => data !== null),
      creditScore,
      riskFactors,
      aavePositions,
      morphoPositions,
      protocolInteractions,
      recommendations
    };
  }

  private async getChainsData(address: string, chainIds: number[]): Promise<ChainData[]> {
    const chainsData = await Promise.all(
      chainIds.map(chainId => this.getChainData(address, chainId))
    );
    return chainsData.filter(data => data !== null);
  }

  private async getChainData(address: string, chainId: number): Promise<ChainData | null> {
    try {
      const baseURL = this.baseURLs[chainId];
      const [balance, tokens, txs, nfts] = await Promise.all([
        this.getBalance(address, chainId),
        this.getTokenBalances(address, chainId),
        this.getTransactions(address, chainId),
        this.getNFTs(address, chainId)
      ]);

      return {
        chainId,
        balance,
        tokens,
        transactions: txs.slice(0, 100),
        nfts
      };
    } catch (error) {
      console.error(`Error fetching data for chain ${chainId}:`, error);
      return null;
    }
  }

  private async getBalance(address: string, chainId: number): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseURLs[chainId]}/addresses/${address}`
      );
      return ethers.formatEther(response.data.coin_balance || '0');
    } catch (error) {
      return '0';
    }
  }

  private async getTokenBalances(address: string, chainId: number): Promise<TokenBalance[]> {
    try {
      const response = await axios.get(
        `${this.baseURLs[chainId]}/addresses/${address}/token-balances`
      );
      
      return response.data.items.map((token: any) => ({
        contractAddress: token.token.address,
        name: token.token.name,
        symbol: token.token.symbol,
        balance: ethers.formatUnits(token.value, token.token.decimals),
        valueUSD: token.usd_value || 0
      }));
    } catch (error) {
      return [];
    }
  }

  private async getTransactions(address: string, chainId: number): Promise<Transaction[]> {
    try {
      const response = await axios.get(
        `${this.baseURLs[chainId]}/addresses/${address}/transactions`
      );
      
      return response.data.items.map((tx: any) => ({
        hash: tx.hash,
        timestamp: new Date(tx.timestamp).getTime() / 1000,
        value: ethers.formatEther(tx.value),
        to: tx.to.hash,
        from: tx.from.hash,
        gasUsed: tx.gas_used,
        status: tx.status === 'ok'
      }));
    } catch (error) {
      return [];
    }
  }

  private async getNFTs(address: string, chainId: number): Promise<NFT[]> {
    try {
      const response = await axios.get(
        `${this.baseURLs[chainId]}/addresses/${address}/transfers`,
        { params: { type: 'ERC-721,ERC-1155' } }
      );
      
      const nfts: NFT[] = [];
      const seen: Set<string> = new Set();

      for (const transfer of response.data.items) {
        const key = `${transfer.token.address}-${transfer.total.token_id}`;
        if (!seen.has(key)) {
          seen.add(key);
          nfts.push({
            contractAddress: transfer.token.address,
            tokenId: transfer.total.token_id,
            name: transfer.token.name,
            image: transfer.token.icon_url
          });
        }
      }

      return nfts;
    } catch (error) {
      return [];
    }
  }

  private combineProtocolInteractions(
    aaveTxs: AaveTransaction[],
    morphoTxs: MorphoTransaction[]
  ): ProtocolInteraction[] {
    const interactions: ProtocolInteraction[] = [];

    aaveTxs.forEach(tx => {
      interactions.push({
        protocol: 'aave',
        type: tx.type,
        amount: tx.amount,
        timestamp: tx.timestamp,
        chainId: tx.chainId,
        txHash: tx.txHash,
        asset: tx.asset
      });
    });

    morphoTxs.forEach(tx => {
      interactions.push({
        protocol: 'morpho',
        type: tx.type === 'supply' ? 'deposit' : tx.type,
        amount: tx.amount,
        timestamp: tx.timestamp,
        chainId: tx.chainId,
        txHash: tx.txHash,
        asset: tx.poolToken
      });
    });

    return interactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private calculateCreditScore(chainsData: ChainData[], interactions: ProtocolInteraction[]): number {
    let score = 300; // Base score

    // Factor 1: Total portfolio value
    const totalValue = chainsData.reduce((sum, chain) => {
      const chainValue = chain.tokens.reduce((tokenSum, token) => 
        tokenSum + token.valueUSD, parseFloat(chain.balance)
      );
      return sum + chainValue;
    }, 0);

    if (totalValue > 50000) score += 200;
    else if (totalValue > 10000) score += 150;
    else if (totalValue > 5000) score += 100;
    else if (totalValue > 1000) score += 50;

    // Factor 2: Protocol repayment history
    const repayments = interactions.filter(i => 
      i.type === 'repay' && (i.protocol === 'aave' || i.protocol === 'morpho')
    );
    const borrows = interactions.filter(i => i.type === 'borrow');
    
    const repaymentRatio = borrows.length > 0 ? repayments.length / borrows.length : 1;
    if (repaymentRatio >= 0.9) score += 150;
    else if (repaymentRatio >= 0.7) score += 100;
    else if (repaymentRatio >= 0.5) score += 50;

    // Factor 3: Multi-chain activity
    const activeChains = chainsData.filter(chain => 
      parseFloat(chain.balance) > 0 || chain.tokens.length > 0
    ).length;
    score += activeChains * 25;

    // Factor 4: Transaction history depth
    const totalTxs = chainsData.reduce((sum, chain) => sum + chain.transactions.length, 0);
    if (totalTxs > 500) score += 100;
    else if (totalTxs > 200) score += 75;
    else if (totalTxs > 100) score += 50;
    else if (totalTxs > 50) score += 25;

    // Factor 5: Asset diversity
    const totalTokens = chainsData.reduce((sum, chain) => sum + chain.tokens.length, 0);
    if (totalTokens > 20) score += 75;
    else if (totalTokens > 10) score += 50;
    else if (totalTokens > 5) score += 25;

    return Math.min(score, 850);
  }

  private identifyRiskFactors(chainsData: ChainData[], interactions: ProtocolInteraction[]): string[] {
    const riskFactors: string[] = [];

    // Check for high gas spending
    const totalGas = chainsData.reduce((sum, chain) => {
      return sum + chain.transactions.reduce((gasSum, tx) => 
        gasSum + parseFloat(tx.gasUsed), 0
      );
    }, 0);

    if (totalGas > 50) {
      riskFactors.push('High gas spending indicates potential speculative activity');
    }

    // Check for concentration risk
    chainsData.forEach(chain => {
      if (chain.tokens.length > 0) {
        const totalValue = chain.tokens.reduce((sum, token) => sum + token.valueUSD, 0);
        if (totalValue > 0) {
          const topToken = chain.tokens.reduce((max, token) => 
            token.valueUSD > max.valueUSD ? token : max
          );
          if (topToken.valueUSD / totalValue > 0.8) {
            riskFactors.push(`High concentration in ${topToken.symbol} on chain ${chain.chainId}`);
          }
        }
      }
    });

    // Check for borrowing patterns
    const recentBorrows = interactions
      .filter(i => i.type === 'borrow')
      .filter(i => Date.now() / 1000 - i.timestamp < 30 * 24 * 60 * 60);

    const recentRepayments = interactions
      .filter(i => i.type === 'repay')
      .filter(i => Date.now() / 1000 - i.timestamp < 30 * 24 * 60 * 60);

    if (recentBorrows.length > recentRepayments.length * 2) {
      riskFactors.push('High recent borrowing activity without corresponding repayments');
    }

    // Check for low liquidity
    const totalBalance = chainsData.reduce((sum, chain) => sum + parseFloat(chain.balance), 0);
    if (totalBalance < 0.1) {
      riskFactors.push('Low native token balance across chains');
    }

    return riskFactors;
  }

  private generateRecommendations(
    score: number,
    riskFactors: string[],
    interactions: ProtocolInteraction[]
  ): string[] {
    const recommendations: string[] = [];

    if (score < 700) {
      recommendations.push('Focus on building consistent repayment history across protocols');
    }

    if (riskFactors.some(factor => factor.includes('concentration'))) {
      recommendations.push('Diversify your token holdings to reduce concentration risk');
    }

    const activeChains = new Set(interactions.map(i => i.chainId)).size;
    if (activeChains < 2) {
      recommendations.push('Expand your DeFi activity to multiple chains to demonstrate cross-chain credibility');
    }

    const recentProtocolActivity = interactions.filter(i => 
      Date.now() / 1000 - i.timestamp < 90 * 24 * 60 * 60
    ).length;

    if (recentProtocolActivity < 5) {
      recommendations.push('Increase your protocol interactions to build stronger credit history');
    }

    if (score >= 800) {
      recommendations.push('You qualify for our best rates! Consider applying for higher credit limits');
    }

    return recommendations;
  }
}