// check-current-morpho.ts
import { RealProtocolInteractor } from '../real-protocol-interactor';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

async function checkCurrentMorphoImplementation() {
  console.log('🔍 Checking Current Morpho Implementation...\n');

  if (!rpcUrl || !privateKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  try {
    const interactor = new RealProtocolInteractor(rpcUrl, privateKey);
    
    // Try to access the Morpho contract address if it's exposed
    console.log('📋 Checking RealProtocolInteractor for Morpho addresses...');
    
    // These would be the properties if they exist in your RealProtocolInteractor
    const possibleProperties = [
      'morphoContract',
      'morphoAddress', 
      'morpho',
      'contracts',
      '_morpho'
    ];

    for (const prop of possibleProperties) {
      if ((interactor as any)[prop]) {
        console.log(`✅ Found property "${prop}":`, (interactor as any)[prop]);
      }
    }

    // Try to call simulateRealMorphoActivity to see what it does
    console.log('\n🧪 Testing Morpho simulation...');
    try {
      const result = await interactor.simulateRealMorphoActivity();
      console.log('✅ Morpho simulation result:', result.length, 'transactions');
      if (result.length > 0) {
        console.log('   Sample transaction:', result[0]);
      }
    } catch (error) {
      console.log('❌ Morpho simulation failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Cannot check RealProtocolInteractor:', error.message);
  }
}

checkCurrentMorphoImplementation();