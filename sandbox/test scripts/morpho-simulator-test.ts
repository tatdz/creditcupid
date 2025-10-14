import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { MorphoSimulator } from '../morpho-simulator';

const rpcUrl = process.env.SEPOLIA_RPC_URL || '';
const privateKey = process.env.PRIVATE_KEY || '';

if (!rpcUrl || !privateKey) {
  console.error('Missing SEPOLIA_RPC_URL or PRIVATE_KEY in env');
  process.exit(1);
}

async function testMorphoSimulator() {
  const simulator = new MorphoSimulator(rpcUrl, privateKey);

  const testAddresses = [
    '0x8C3a5F4c5B6D2E7f8C9A0B1C2D3E4F5A6B7C8D9E',
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
    '0x3333333333333333333333333333333333333333'
  ];

  for (const address of testAddresses) {
    console.log(`\n=== Testing address: ${address} ===`);

    const transactions = await simulator.simulateUserActivity(address);
    console.log(`Morpho transactions (${transactions.length}):`);
    console.table(transactions);

    const profile = await simulator.generateTestUserProfile();
    console.log('User profile:');
    console.table(profile);

    // Only create links if tx hashes look real (0x + 64 hex chars)
    const allTxReal = transactions.every(tx => /^0x[a-fA-F0-9]{64}$/.test(tx.txHash));
    if (allTxReal) {
      console.log('Trace Morpho transactions on Etherscan Sepolia:');
      for (const tx of transactions) {
        console.log(`https://sepolia.etherscan.io/tx/${tx.txHash}`);
      }
    } else {
      console.log('Transactions are simulated — explorer links unavailable.');
    }
  }
}

if (require.main === module) {
  testMorphoSimulator()
    .then(() => console.log('\nTest completed.'))
    .catch(console.error);
}
