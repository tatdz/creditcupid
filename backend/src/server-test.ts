import request from 'supertest';

const baseURL = 'http://localhost:3001';
// Use a valid Ethereum address format
const testAddress = '0x742e6c9f70a83c48a8790fA0f315613210d84684'.toLowerCase();

async function testServerFixed() {
  console.log('🧪 Testing Server with Fixed Address\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await request(baseURL).get('/health').timeout(5000);
    console.log(`   ✅ Status: ${health.body.status}`);
    console.log(`   🔧 Services: ${JSON.stringify(health.body.services)}`);

    // Test credit data with valid address
    console.log('\n2. Testing credit data endpoint...');
    console.log(`   Using address: ${testAddress}`);
    const credit = await request(baseURL).get(`/api/credit-data/${testAddress}`).timeout(15000);
    console.log(`   ✅ Status: ${credit.status}`);
    if (credit.status === 200) {
      console.log(`   📊 Credit Score: ${credit.body.creditScore}`);
      console.log(`   ⚠️  Risk Factors: ${credit.body.riskFactors?.length || 0}`);
      console.log(`   💡 Recommendations: ${credit.body.recommendations?.length || 0}`);
      console.log(`   🔗 Chains: ${credit.body.chains?.length || 0}`);
    } else {
      console.log(`   ❌ Error: ${credit.body.error}`);
      console.log(`   📝 Details: ${credit.body.details}`);
    }

    // Test protocol data
    console.log('\n3. Testing protocol data endpoint...');
    const protocol = await request(baseURL).get(`/api/protocol-data/${testAddress}`).timeout(15000);
    console.log(`   ✅ Status: ${protocol.status}`);
    if (protocol.status === 200) {
      console.log(`   📊 Protocol Interactions: ${protocol.body.protocolInteractions?.length || 0}`);
    }

    // Test recommendations
    console.log('\n4. Testing recommendations endpoint...');
    const recommendations = await request(baseURL).get(`/api/recommendations/${testAddress}`).timeout(15000);
    console.log(`   ✅ Status: ${recommendations.status}`);
    if (recommendations.status === 200) {
      console.log(`   💡 Improvement Tips: ${recommendations.body.improvementTips?.length || 0}`);
    }

    // Test sandbox simulation types
    console.log('\n5. Testing sandbox simulation types...');
    const simTypes = await request(baseURL).get('/api/sandbox/simulation-types').timeout(5000);
    console.log(`   ✅ Status: ${simTypes.status}`);
    if (simTypes.status === 200) {
      console.log(`   🎮 Available Simulations: ${simTypes.body.length}`);
      simTypes.body.forEach((type: any) => {
        console.log(`      - ${type.name}: ${type.description}`);
      });
    }

    // Test sandbox simulations
    console.log('\n6. Testing sandbox simulations...');
    const simulations = ['ideal', 'growing', 'risky'];
    
    for (const simType of simulations) {
      console.log(`   Testing ${simType} simulation...`);
      const sim = await request(baseURL)
        .get(`/api/sandbox/credit-data/${testAddress}`)
        .query({ simulation: simType })
        .timeout(15000);
      
      console.log(`      ✅ Status: ${sim.status}`);
      if (sim.status === 200) {
        console.log(`      🎯 Score: ${sim.body.creditScore}`);
        console.log(`      🔄 Type: ${sim.body.simulationType}`);
        console.log(`      📊 Is Simulated: ${sim.body.isSimulated}`);
      } else {
        console.log(`      ❌ Error: ${sim.body.error}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test enhanced protocol data
    console.log('\n7. Testing enhanced protocol data...');
    const enhanced = await request(baseURL).get(`/api/enhanced-protocol-data/${testAddress}`).timeout(15000);
    console.log(`   ✅ Status: ${enhanced.status}`);
    if (enhanced.status === 200) {
      console.log(`   🔗 Enhanced Data: Received`);
    }

    // Test error handling
    console.log('\n8. Testing error handling...');
    const errorTests = [
      { path: '/api/credit-data/0xinvalid', expected: 400, name: 'Invalid Address' },
      { path: '/api/credit-data/0x123', expected: 400, name: 'Short Address' },
      { path: '/api/unknown-endpoint', expected: 404, name: 'Unknown Endpoint' },
    ];

    for (const test of errorTests) {
      const response = await request(baseURL).get(test.path).timeout(5000);
      const passed = response.status === test.expected;
      console.log(`   ${passed ? '✅' : '❌'} ${test.name}: ${response.status} (expected ${test.expected})`);
    }

    console.log('\n🎉 TESTING COMPLETE!');
    console.log('💡 Check server logs for any additional details or warnings.');

  } catch (error: any) {
    console.log('❌ Test failed:', error.message);
    console.log('🔧 This might be a network issue or server timeout');
  }
}

testServerFixed();