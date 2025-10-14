// morpho-contract-verification.ts
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

async function verifyMorphoContracts() {
  console.log('🔍 Verifying Morpho Contracts...\n');

  if (!rpcUrl || !privateKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('💰 Wallet:', wallet.address);

  // Check current Morpho address from your code
  const currentMorphoAddress = '0xd011EE229E7459ba1ddd22631eF7bF528d424A14';
  
  console.log('📋 Current Morpho Address in Code:', currentMorphoAddress);

  // Test 1: Check if contract exists
  console.log('\n🧪 Test 1: Contract Existence');
  try {
    const code = await provider.getCode(currentMorphoAddress);
    console.log('✅ Contract exists:', code.length > 100 ? 'Yes' : 'No');
    console.log('   Code size:', code.length, 'bytes');
    
    if (code === '0x') {
      console.log('❌ Contract does not exist at this address!');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot check contract:', error.message);
    return;
  }

  // Test 2: Try to identify Morpho version
  console.log('\n🧪 Test 2: Morpho Version Identification');
  try {
    // Common Morpho function signatures
    const morphoAbi = [
      'function name() view returns (string)',
      'function version() view returns (uint256)',
      'function marketsCreated() view returns (uint256)',
      'function owner() view returns (address)',
      'function isMarketCreated(address) view returns (bool)',
      // Morpho V1 specific functions
      'function supply(address, uint256) external',
      'function borrow(address, uint256) external',
      // Morpho Blue functions (V2)
      'function supply(address, uint256, address, bytes) external',
      'function market(uint256) view returns (address, address, address)'
    ];

    const morpho = new ethers.Contract(currentMorphoAddress, morphoAbi, provider);

    // Try to get contract name
    try {
      const name = await morpho.name();
      console.log('✅ Contract name:', name);
    } catch (error) {
      console.log('❌ Cannot get name:', error.message);
    }

    // Try to get version
    try {
      const version = await morpho.version();
      console.log('✅ Contract version:', version.toString());
    } catch (error) {
      console.log('❌ Cannot get version:', error.message);
    }

    // Try to get markets count
    try {
      const marketsCount = await morpho.marketsCreated();
      console.log('✅ Markets created:', marketsCount.toString());
    } catch (error) {
      console.log('❌ Cannot get markets count:', error.message);
    }

    // Try to get owner
    try {
      const owner = await morpho.owner();
      console.log('✅ Contract owner:', owner);
    } catch (error) {
      console.log('❌ Cannot get owner:', error.message);
    }

  } catch (error) {
    console.log('❌ Version identification failed:', error.message);
  }

  // Test 3: Check if we can interact with the contract
  console.log('\n🧪 Test 3: Contract Interaction Test');
  try {
    const morphoAbi = [
      'function supply(address _poolToken, uint256 _amount) external',
      'function supply(address _poolToken, uint256 _amount, address _onBehalf, uint256 _maxGasForMatching) external'
    ];

    const morpho = new ethers.Contract(currentMorphoAddress, morphoAbi, wallet);

    // Check WETH balance
    const wethAddress = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'; // Sepolia WETH
    const wethAbi = ['function balanceOf(address) view returns (uint256)'];
    const weth = new ethers.Contract(wethAddress, wethAbi, wallet);
    
    const wethBalance = await weth.balanceOf(wallet.address);
    console.log('💰 WETH Balance:', ethers.formatEther(wethBalance));

    if (wethBalance > 0) {
      console.log('   Testing supply with 0.001 WETH...');
      const testAmount = ethers.parseEther('0.001');
      
      try {
        // Try V1 style supply
        const gasEstimate = await morpho.supply.estimateGas(wethAddress, testAmount);
        console.log('   ✅ Gas estimate successful for V1 supply():', gasEstimate.toString());
      } catch (v1Error) {
        console.log('   ❌ V1 supply() failed:', v1Error.message);
      }

      try {
        // Try V2 style supply with additional parameters
        const gasEstimate = await morpho.supply.estimateGas(wethAddress, testAmount, wallet.address, 0);
        console.log('   ✅ Gas estimate successful for V2 supply():', gasEstimate.toString());
      } catch (v2Error) {
        console.log('   ❌ V2 supply() failed:', v2Error.message);
      }
    } else {
      console.log('   ⚠️  No WETH balance to test with');
    }

  } catch (error) {
    console.log('❌ Contract interaction test failed:', error.message);
  }

  // Test 4: Check official Morpho addresses
  console.log('\n🧪 Test 4: Official Morpho Addresses Reference');
  
  console.log('📚 Morpho V1 (Mainnet - deprecated):');
  console.log('   Main Morpho: 0x8888882f8f843896699869179fB6E4f7e3B58888');
  console.log('   Lens: 0x930f1b46e1d081ec1524efd95752be3ece51ef67');
  
  console.log('📚 Morpho V2 - Morpho Blue (Mainnet):');
  console.log('   Morpho Blue: 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb');
  console.log('   MetaMorpho: 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb');
  
  console.log('📚 Morpho Testnet Addresses:');
  console.log('   Sepolia Morpho Blue: 0x0000000000000000000000000000000000000000'); // Need to verify
  console.log('   Goerli (deprecated): Various addresses');

  // Test 5: Check if this is a known Morpho deployment
  console.log('\n🧪 Test 5: Known Deployment Check');
  const knownMorphoDeployments = {
    '0xd011EE229E7459ba1ddd22631eF7bF528d424A14': 'Potential Sepolia Deployment',
    '0x8888882f8f843896699869179fB6E4f7e3B58888': 'Morpho V1 Mainnet',
    '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb': 'Morpho Blue Mainnet'
  };

  if (knownMorphoDeployments[currentMorphoAddress]) {
    console.log('✅ Known deployment:', knownMorphoDeployments[currentMorphoAddress]);
  } else {
    console.log('❓ Unknown deployment - may be custom or test deployment');
  }

  console.log('\n📋 Summary:');
  console.log('The address 0xd011EE229E7459ba1ddd22631eF7bF528d424A14 appears to be');
  console.log('a custom/test deployment. Morpho V1 is deprecated and Morpho Blue (V2)');
  console.log('is the current version with different contract addresses.');
}

verifyMorphoContracts();