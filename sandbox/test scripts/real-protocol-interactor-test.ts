// real-protocol-interactor-test.ts
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') }); 

// Import from the current directory - the file is real-protocol-interactor.ts
import { RealProtocolInteractor } from '../real-protocol-interactor'; 

async function testRealProtocolInteractor() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || '';
  const privateKey = process.env.PRIVATE_KEY || '';

  if (!rpcUrl || !privateKey) {
    console.error('Missing SEPOLIA_RPC_URL and/or PRIVATE_KEY environment variables.');
    process.exit(1);
  }

  const interactor = new RealProtocolInteractor(rpcUrl, privateKey);

  // Use the onNewBlock method that exists in your class
  interactor.onNewBlock((blockNumber) => {
    console.log(`New block mined: ${blockNumber}`);
  });

  try {
    console.log('Starting real Aave protocol interactions...');
    const aaveTxs = await interactor.simulateRealAaveActivity();
    console.log(`Aave transactions (${aaveTxs.length}):`);
    aaveTxs.forEach((tx, i) => console.log(`  [${i}] TxHash: ${tx.hash}`));

    console.log('Starting real Morpho protocol interactions...');
    const morphoTxs = await interactor.simulateRealMorphoActivity();
    console.log(`Morpho transactions (${morphoTxs.length}):`);
    morphoTxs.forEach((tx, i) => console.log(`  [${i}] TxHash: ${tx.hash}`));

    console.log('Fetching user Aave position...');
    const userPosition = await interactor.getUserAavePosition();
    console.log('User Aave position:');
    console.table(userPosition);

    // Test the complete simulation method
    console.log('\nTesting complete protocol simulation...');
    const completeResult = await interactor.runCompleteProtocolSimulation();
    console.log('Complete simulation result:');
    console.log(`  Aave TXs: ${completeResult.aaveTransactions.length}`);
    console.log(`  Morpho TXs: ${completeResult.morphoTransactions.length}`);
    console.log('  Aave Position:', completeResult.userPositions.aave ? 'Available' : 'Not available');

  } catch (error) {
    console.error('Error during protocol interaction test:', error);
  }
}

if (require.main === module) {
  testRealProtocolInteractor().then(() => console.log('Test completed.'));
}