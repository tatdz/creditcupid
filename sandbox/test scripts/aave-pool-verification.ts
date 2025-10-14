// aave-pool-verification.ts
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

async function verifyAavePool() {
  console.log('🔍 Verifying Aave Sepolia Pool...\n');

  if (!rpcUrl || !privateKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('💰 Wallet:', wallet.address);
  
  // Official Aave v3 Sepolia addresses from Aave documentation
  const officialAddresses = {
    pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    poolDataProvider: '0x3e9708d80f7B3a431C223f0dA31Ca6765d76c5A5',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    weth: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    dai: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357'
  };

  console.log('📋 Official Aave Sepolia Addresses:');
  console.log('   Pool:', officialAddresses.pool);
  console.log('   Pool Data Provider:', officialAddresses.poolDataProvider);
  console.log('   USDC:', officialAddresses.usdc);
  console.log('   WETH:', officialAddresses.weth);
  console.log('   DAI:', officialAddresses.dai);

  // Test 1: Check if contracts exist
  console.log('\n🧪 Test 1: Contract Existence');
  try {
    const poolCode = await provider.getCode(officialAddresses.pool);
    console.log('✅ Pool contract exists:', poolCode.length > 100 ? 'Yes' : 'No');
    
    const usdcCode = await provider.getCode(officialAddresses.usdc);
    console.log('✅ USDC contract exists:', usdcCode.length > 100 ? 'Yes' : 'No');
  } catch (error) {
    console.log('❌ Cannot check contract existence:', error.message);
  }

  // Test 2: Check pool configuration
  console.log('\n🧪 Test 2: Pool Configuration');
  try {
    const poolAbi = [
      'function getReserveData(address asset) view returns (tuple(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint40))',
      'function MAX_STABLE_RATE_BORROW_SIZE_PERCENT() view returns (uint256)',
      'function FLASHLOAN_PREMIUM_TOTAL() view returns (uint128)'
    ];
    
    const pool = new ethers.Contract(officialAddresses.pool, poolAbi, provider);
    
    // Try to get reserve data for USDC
    const reserveData = await pool.getReserveData(officialAddresses.usdc);
    console.log('✅ Pool is accessible and returning reserve data');
    console.log('   Liquidity Rate:', reserveData[3].toString());
    console.log('   Variable Borrow Rate:', reserveData[4].toString());
    
    const maxStableRate = await pool.MAX_STABLE_RATE_BORROW_SIZE_PERCENT();
    console.log('   Max Stable Rate:', maxStableRate.toString());
    
  } catch (error) {
    console.log('❌ Pool configuration check failed:', error.message);
  }

  // Test 3: Check if we can read user position
  console.log('\n🧪 Test 3: User Position Reading');
  try {
    const dataProviderAbi = [
      'function getUserReserveData(address asset, address user) view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabled)'
    ];
    
    const dataProvider = new ethers.Contract(officialAddresses.poolDataProvider, dataProviderAbi, provider);
    
    const userData = await dataProvider.getUserReserveData(officialAddresses.usdc, wallet.address);
    console.log('✅ User reserve data accessible');
    console.log('   aToken Balance:', userData[0].toString());
    console.log('   Stable Debt:', userData[1].toString());
    console.log('   Variable Debt:', userData[2].toString());
    
  } catch (error) {
    console.log('❌ User position reading failed:', error.message);
  }

  // Test 4: Try direct supply with correct ABI
  console.log('\n🧪 Test 4: Direct Supply Attempt');
  try {
    const poolAbi = [
      'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
      'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external' // Some versions use deposit
    ];
    
    const pool = new ethers.Contract(officialAddresses.pool, poolAbi, wallet);
    
    // Check USDC balance and allowance first
    const usdcAbi = [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function allowance(address owner, address spender) view returns (uint256)'
    ];
    
    const usdc = new ethers.Contract(officialAddresses.usdc, usdcAbi, wallet);
    const balance = await usdc.balanceOf(wallet.address);
    const decimals = await usdc.decimals();
    const allowance = await usdc.allowance(wallet.address, officialAddresses.pool);
    
    console.log('   USDC Balance:', ethers.formatUnits(balance, decimals));
    console.log('   USDC Allowance:', ethers.formatUnits(allowance, decimals));
    
    if (balance > 0 && allowance > 0) {
      console.log('   Attempting supply with 0.1 USDC...');
      
      // Try both supply and deposit functions
      const amount = ethers.parseUnits('0.1', decimals);
      
      try {
        // Try supply function
        const gasEstimate = await pool.supply.estimateGas(
          officialAddresses.usdc,
          amount,
          wallet.address,
          0
        );
        console.log('   ✅ Gas estimate successful for supply():', gasEstimate.toString());
      } catch (supplyError) {
        console.log('   ❌ supply() failed:', supplyError.message);
      }
      
      try {
        // Try deposit function (some Aave versions use this)
        const gasEstimate = await pool.deposit.estimateGas(
          officialAddresses.usdc,
          amount,
          wallet.address,
          0
        );
        console.log('   ✅ Gas estimate successful for deposit():', gasEstimate.toString());
      } catch (depositError) {
        console.log('   ❌ deposit() failed:', depositError.message);
      }
    } else {
      console.log('   ⚠️  Cannot test supply - insufficient balance or allowance');
    }
    
  } catch (error) {
    console.log('❌ Direct supply test failed:', error.message);
  }

  // Test 5: Check if pool is paused
  console.log('\n🧪 Test 5: Pool Status Check');
  try {
    const poolAbi = [
      'function paused() view returns (bool)',
      'function getReservesList() view returns (address[])'
    ];
    
    const pool = new ethers.Contract(officialAddresses.pool, poolAbi, provider);
    
    const isPaused = await pool.paused();
    console.log('   Pool Paused:', isPaused);
    
    if (isPaused) {
      console.log('   ❌ POOL IS PAUSED - This is likely the issue!');
    } else {
      console.log('   ✅ Pool is not paused');
    }
    
    const reservesList = await pool.getReservesList();
    console.log('   Number of supported reserves:', reservesList.length);
    
  } catch (error) {
    console.log('❌ Pool status check failed:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('If the pool is paused or reserve data cannot be read,');
  console.log('the Aave Sepolia deployment might be deprecated or have issues.');
  console.log('\n💡 Next steps:');
  console.log('1. Check Aave documentation for updated Sepolia addresses');
  console.log('2. Try a different RPC endpoint');
  console.log('3. Check if Aave UI works: https://app.aave.com/');
  console.log('4. Consider using a local fork instead of testnet');
}

verifyAavePool();