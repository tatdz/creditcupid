// real-aave-attempt.ts
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

async function attemptRealAaveInteraction() {
  console.log('🚀 Attempting Real Aave Interaction...\n');

  if (!rpcUrl || !privateKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const addresses = {
    pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  };

  try {
    // Complete Aave Pool ABI with all necessary functions
    const poolAbi = [
      'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
      'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
      'function withdraw(address asset, uint256 amount, address to) external returns (uint256)',
      'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external',
      'function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) external returns (uint256)',
      'function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external',
      'function swapBorrowRateMode(address asset, uint256 rateMode) external',
      'function rebalanceStableBorrowRate(address asset, address user) external',
      'function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256[] calldata modes, address onBehalfOf, bytes calldata params, uint16 referralCode) external'
    ];

    const pool = new ethers.Contract(addresses.pool, poolAbi, wallet);

    // Check USDC balance
    const usdcAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
    const usdc = new ethers.Contract(addresses.usdc, usdcAbi, wallet);
    
    const balance = await usdc.balanceOf(wallet.address);
    const decimals = await usdc.decimals();
    
    console.log('💰 USDC Balance:', ethers.formatUnits(balance, decimals));

    if (balance === 0n) {
      console.log('❌ No USDC balance to test with');
      return;
    }

    // Try a very small amount
    const testAmount = ethers.parseUnits('0.01', decimals); // 0.01 USDC
    
    console.log(`\n🧪 Testing with ${ethers.formatUnits(testAmount, decimals)} USDC...`);

    // Method 1: Try supply with fixed gas
    console.log('1. Trying supply() with fixed gas...');
    try {
      const tx = await pool.supply(
        addresses.usdc,
        testAmount,
        wallet.address,
        0,
        { gasLimit: 200000 } // Fixed gas limit
      );
      console.log('   ✅ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('   🎉 Supply successful! Block:', receipt.blockNumber);
      return;
    } catch (error) {
      console.log('   ❌ Supply failed:', error.message);
    }

    // Method 2: Try deposit (alternative function name)
    console.log('2. Trying deposit() with fixed gas...');
    try {
      const tx = await pool.deposit(
        addresses.usdc,
        testAmount,
        wallet.address,
        0,
        { gasLimit: 200000 }
      );
      console.log('   ✅ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('   🎉 Deposit successful! Block:', receipt.blockNumber);
      return;
    } catch (error) {
      console.log('   ❌ Deposit failed:', error.message);
    }

    // Method 3: Try with different gas settings
    console.log('3. Trying with higher gas limit...');
    try {
      const tx = await pool.supply(
        addresses.usdc,
        testAmount,
        wallet.address,
        0,
        { gasLimit: 300000, gasPrice: ethers.parseUnits('2', 'gwei') }
      );
      console.log('   ✅ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('   🎉 Supply successful! Block:', receipt.blockNumber);
      return;
    } catch (error) {
      console.log('   ❌ High gas supply failed:', error.message);
    }

    console.log('\n💡 All real interaction attempts failed.');
    console.log('The Aave Sepolia pool appears to be non-functional for direct interactions.');
    console.log('This confirms we need to use the mock implementation.');

  } catch (error) {
    console.log('❌ Real interaction attempt failed completely:', error.message);
  }
}

attemptRealAaveInteraction();