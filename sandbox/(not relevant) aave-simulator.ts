import path from 'path';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { RealProtocolInteractor } from './real-protocol-interactor';
import { AaveTransaction } from '../backend/src/protocols/aave';

// Load .env from project root explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const rpcUrl = process.env.SEPOLIA_RPC_URL || '';
const privateKey = process.env.PRIVATE_KEY || '';

if (!rpcUrl || !privateKey) {
  throw new Error('Missing necessary environment variables: SEPOLIA_RPC_URL and/or PRIVATE_KEY');
}

export class AaveSimulator {
  private realInteractor: RealProtocolInteractor;

  constructor(rpcUrl: string, privateKey: string) {
    this.realInteractor = new RealProtocolInteractor(rpcUrl, privateKey);
  }

  async simulateUserActivity(address: string): Promise<AaveTransaction[]> {
    // OPTION 1: Use real protocol interactions
    const realTxs = await this.realInteractor.simulateRealAaveActivity();
    return this.mapRealToAaveTransactions(realTxs, address);

    // OPTION 2: Fallback simulated data (currently unreachable, can be toggled by commenting OPTION 1 above)
    // return this.generateSimulatedTransactions(address);
  }

  private async mapRealToAaveTransactions(realTxs: any[], address: string): Promise<AaveTransaction[]> {
    return realTxs.map(tx => ({
      type: this.determineTransactionType(tx),
      asset: this.getAssetFromTransaction(tx),
      amount: this.getAmountFromTransaction(tx),
      timestamp: Math.floor(Date.now() / 1000),
      txHash: tx.hash,
      chainId: 11155111, // Sepolia network ID
      blockNumber: tx.blockNumber || 0
    }));
  }

  private determineTransactionType(tx: any): 'deposit' | 'withdraw' | 'borrow' | 'repay' {
    // You may parse event logs or input data here for better accuracy
    return 'deposit'; // Simplified placeholder
  }

  private getAssetFromTransaction(tx: any): string {
    // Extract token symbol or address mapping here
    return 'USDC'; // Simplified placeholder
  }

  private getAmountFromTransaction(tx: any): string {
    // Extract amount from transaction data or logs here
    return '1000.00'; // Simplified placeholder
  }

  private generateSimulatedTransactions(address: string): AaveTransaction[] {
    // Fallback simulated data example
    const simulatedTransactions: AaveTransaction[] = [
      {
        type: 'deposit',
        asset: 'USDC',
        amount: '1000.00',
        timestamp: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
        txHash: '0x' + Math.random().toString(16).slice(2, 66),
        chainId: 11155111,
        blockNumber: 4000000
      },
      {
        type: 'borrow',
        asset: 'DAI',
        amount: '500.00',
        timestamp: Math.floor(Date.now() / 1000) - 20 * 24 * 60 * 60,
        txHash: '0x' + Math.random().toString(16).slice(2, 66),
        chainId: 11155111,
        blockNumber: 4100000
      },
      {
        type: 'repay',
        asset: 'DAI',
        amount: '200.00',
        timestamp: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60,
        txHash: '0x' + Math.random().toString(16).slice(2, 66),
        chainId: 11155111,
        blockNumber: 4200000
      }
    ];
    return simulatedTransactions;
  }

  async generateTestUserProfile(): Promise<any> {
    const realPosition = await this.realInteractor.getUserAavePosition();

    return {
      address: '0x742E6fB6c6E4e5c7c8B9C12C5c0D9F8A7B6C5D4E',
      totalDeposits: '2500.00',
      totalBorrowed: '500.00',
      totalRepaid: '200.00',
      healthFactor: realPosition?.healthFactor || '1.8',
      currentLoans: 1,
      repaymentRate: '0.85',
      realData: realPosition ? {
        totalCollateralETH: realPosition.totalCollateralETH,
        totalDebtETH: realPosition.totalDebtETH,
        availableBorrowsETH: realPosition.availableBorrowsETH
      } : null
    };
  }
}
