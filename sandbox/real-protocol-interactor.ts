import { ethers } from 'ethers';
import { JsonRpcProvider, Wallet, Contract, TransactionResponse } from 'ethers';

// Aave V3 Protocol ABIs
const AAVE_POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external",
  "function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)",
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

// Morpho V2 ABIs
const MORPHO_ABI = [
  "function supply(address poolToken, address onBehalf, uint256 amount) external",
  "function withdraw(address poolToken, uint256 amount) external",
  "function borrow(address poolToken, uint256 amount) external",
  "function repay(address poolToken, address onBehalf, uint256 amount) external",
  "function claimRewards(address[] calldata assets, address onBehalf) external"
];

// Test token ABIs
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external"
];

export class RealProtocolInteractor {
  private provider: JsonRpcProvider;
  private wallet: Wallet;

  // Sepolia addresses
  private readonly AAVE_POOL_SEPOLIA = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951';
  private readonly MORPHO_AAVE_V3_SEPOLIA = '0x33333aea097c193e66081E930c33020272b33333';

  // Test tokens on Sepolia
  private readonly USDC_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
  private readonly DAI_SEPOLIA = '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357';
  private readonly WETH_SEPOLIA = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14';

  constructor(rpcUrl: string, privateKey: string) {
    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
  }

  /**
   * Subscribe to new block headers via callback.
   * External callers do not access `provider` directly.
   */
  public onNewBlock(callback: (blockNumber: number) => void): void {
    this.provider.on('block', callback);
  }

  async simulateRealAaveActivity(): Promise<TransactionResponse[]> {
    const transactions: TransactionResponse[] = [];
    try {
      console.log('🚀 Starting real Aave protocol interactions...');
      
      // Token contracts
      const usdc = new Contract(this.USDC_SEPOLIA, ERC20_ABI, this.wallet);
      const dai = new Contract(this.DAI_SEPOLIA, ERC20_ABI, this.wallet);

      // Mint tokens (optional/test net)
      try {
        console.log('Minting test tokens...');
        const mintTx1 = await usdc.mint(this.wallet.address, ethers.parseUnits('10000', 6));
        await mintTx1.wait();
        console.log('✅ Minted USDC');

        const mintTx2 = await dai.mint(this.wallet.address, ethers.parseUnits('10000', 18));
        await mintTx2.wait();
        console.log('✅ Minted DAI');
      } catch (e) {
        console.log('Minting not available, using existing balances...');
      }

      // Get Aave pool contract
      const aavePool = new Contract(this.AAVE_POOL_SEPOLIA, AAVE_POOL_ABI, this.wallet);

      // Approve tokens
      console.log('Approving tokens for Aave...');
      const approve1 = await usdc.approve(this.AAVE_POOL_SEPOLIA, ethers.parseUnits('5000', 6));
      await approve1.wait();
      transactions.push(approve1);

      const approve2 = await dai.approve(this.AAVE_POOL_SEPOLIA, ethers.parseUnits('5000', 18));
      await approve2.wait();
      transactions.push(approve2);

      // Supply USDC
      console.log('Supplying to Aave...');
      const supplyTx = await aavePool.supply(this.USDC_SEPOLIA, ethers.parseUnits('1000', 6), this.wallet.address, 0);
      await supplyTx.wait();
      transactions.push(supplyTx);
      console.log('✅ Supplied 1000 USDC');

      // Borrow DAI
      console.log('Borrowing from Aave...');
      const borrowTx = await aavePool.borrow(this.DAI_SEPOLIA, ethers.parseUnits('500', 18), 2, 0, this.wallet.address);
      await borrowTx.wait();
      transactions.push(borrowTx);
      console.log('✅ Borrowed 500 DAI');

      // Partial repayment
      console.log('Repunaying loan...');
      const repayTx = await aavePool.repay(this.DAI_SEPOLIA, ethers.parseUnits('200', 18), 2, this.wallet.address);
      await repayTx.wait();
      transactions.push(repayTx);
      console.log('✅ Repaid 200 DAI');

      // Withdraw collateral
      console.log('Withdrawing from Aave...');
      const withdrawTx = await aavePool.withdraw(this.USDC_SEPOLIA, ethers.parseUnits('200', 6), this.wallet.address);
      await withdrawTx.wait();
      transactions.push(withdrawTx);
      console.log('✅ Withdrew 200 USDC');

      console.log('🎉 Aave complete.');
    } catch (error) {
      console.error('❌ Error in Aave simulation:', error);
    }
    return transactions;
  }

  async simulateRealMorphoActivity(): Promise<TransactionResponse[]> {
    const transactions: TransactionResponse[] = [];
    try {
      console.log('🚀 Starting real Morpho protocol interactions...');
      const usdc = new Contract(this.USDC_SEPOLIA, ERC20_ABI, this.wallet);
      const weth = new Contract(this.WETH_SEPOLIA, ERC20_ABI, this.wallet);

      // Mint WETH (optional/test)
      try {
        console.log('Minting WETH for Morpho...');
        const mintTx = await weth.mint(this.wallet.address, ethers.parseEther('10'));
        await mintTx.wait();
        console.log('✅ Minted WETH');
      } catch (e) {
        console.log('Mint not available for WETH...');
      }

      const morpho = new Contract(this.MORPHO_AAVE_V3_SEPOLIA, MORPHO_ABI, this.wallet);

      // Approve tokens
      console.log('Approving tokens for Morpho...');
      const approve1 = await usdc.approve(this.MORPHO_AAVE_V3_SEPOLIA, ethers.parseUnits('5000', 6));
      await approve1.wait();
      transactions.push(approve1);

      const approve2 = await weth.approve(this.MORPHO_AAVE_V3_SEPOLIA, ethers.parseEther('5'));
      await approve2.wait();
      transactions.push(approve2);

      // Supply WETH
      console.log('Supplying to Morpho...');
      const supplyTx = await morpho.supply(this.WETH_SEPOLIA, this.wallet.address, ethers.parseEther('1'));
      await supplyTx.wait();
      transactions.push(supplyTx);
      console.log('✅ Supplied 1 WETH');

      // Borrow USDC
      console.log('Borrowing from Morpho...');
      const borrowTx = await morpho.borrow(this.USDC_SEPOLIA, ethers.parseUnits('300', 6));
      await borrowTx.wait();
      transactions.push(borrowTx);
      console.log('✅ Borrowed 300 USDC');

      // Repay USDC
      console.log('Repay Morpho loan...');
      const repayTx = await morpho.repay(this.USDC_SEPOLIA, this.wallet.address, ethers.parseUnits('100', 6));
      await repayTx.wait();
      transactions.push(repayTx);
      console.log('✅ Repaid 100 USDC');
    } catch (error) {
      console.error('❌ Error in Morpho simulation:', error);
    }
    return transactions;
  }

  async getUserAavePosition(): Promise<any> {
    try {
      const aavePool = new Contract(this.AAVE_POOL_SEPOLIA, AAVE_POOL_ABI, this.provider);
      const userData = await aavePool.getUserAccountData(this.wallet.address);
      return {
        totalCollateralETH: ethers.formatUnits(userData.totalCollateralBase, 8),
        totalDebtETH: ethers.formatUnits(userData.totalDebtBase, 8),
        availableBorrowsETH: ethers.formatUnits(userData.availableBorrowsBase, 8),
        currentLiquidationThreshold: ethers.formatUnits(userData.currentLiquidationThreshold, 2),
        ltv: ethers.formatUnits(userData.ltv, 2),
        healthFactor: ethers.formatUnits(userData.healthFactor, 18),
      };
    } catch (error) {
      console.error('Error fetching Aave position:', error);
      return null;
    }
  }

  async getTransactionHistory(address: string, fromBlock: number = 0): Promise<any[]> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const logs = await this.provider.getLogs({
        address,
        fromBlock: fromBlock || currentBlock - 10000,
        toBlock: currentBlock
      });
      return logs;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }
}
