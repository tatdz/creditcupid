import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { AaveSimulator } from '../aave-simulator'; // adjust import if needed

const rpcUrl = process.env.SEPOLIA_RPC_URL || '';
const privateKey = process.env.PRIVATE_KEY || '';

if (!rpcUrl || !privateKey) {
  console.error('Missing SEPOLIA_RPC_URL and/or PRIVATE_KEY environment variables.');
  process.exit(1);
}

async function testAaveSimulator() {
  const simulator = new AaveSimulator(rpcUrl, privateKey);

  const transactions = await simulator.simulateUserActivity('0x742E6fB6c6E4e5c7c8B9C12C5c0D9F8A7B6C5D4E');
  console.log('Transactions:');
  console.table(transactions);

  const profile = await simulator.generateTestUserProfile();
  console.log('User Profile:');
  console.table(profile);

  // Heuristic to check if txs are real by txHash pattern length (~66 hex chars with 0x prefix)
  const isReal = transactions.every(tx => /^0x[a-f0-9]{64}$/i.test(tx.txHash));

  if (isReal) {
    console.log('\nTrace real transactions on Alchemy Sepolia explorer:');
    transactions.forEach(tx => {
      console.log(`https://sepolia.etherscan.io/tx/${tx.txHash}`);
    });
  } else {
    console.log('\nTransactions are simulated - no explorer links available.');
  }
}

if (require.main === module) {
  testAaveSimulator()
    .then(() => console.log('Test finished.'))
    .catch(console.error);
}
