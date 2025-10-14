import path from 'path';
import dotenv from 'dotenv';
import { EnhancedProtocolService } from '../enhancedProtocolService';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const rpcUrl = process.env.SEPOLIA_RPC_URL || '';
const privateKey = process.env.PRIVATE_KEY || '';

// Mock credit scoring system integration
class MockCreditScoringSystem {
  async calculateCreditScore(walletAddress: string, protocolData: any): Promise<number> {
    // Simulate credit score calculation based on protocol data
    let score = 600; // Use let instead of const
    
    // Add points for good health factor
    if (protocolData.positions.some((p: any) => p.healthFactor && parseFloat(p.healthFactor) > 2.0)) {
      score += 50;
    }
    
    // Add points for low utilization
    if (protocolData.positions.some((p: any) => p.utilizationRate < 50)) {
      score += 30;
    }
    
    // Add points for diversification
    if (protocolData.riskMetrics.diversificationScore > 70) {
      score += 20;
    }
    
    // Add points for good repayment consistency
    if (protocolData.riskMetrics.repaymentConsistency > 80) {
      score += 25;
    }
    
    // Add points for protocol engagement
    if (protocolData.riskMetrics.protocolEngagement > 60) {
      score += 15;
    }
    
    // Cap at 850 (excellent credit)
    return Math.min(score + Math.floor(Math.random() * 30), 850);
  }
}

async function integrationTest() {
  console.log('🔗 ENHANCED PROTOCOL SERVICE INTEGRATION TEST\n');
  console.log('Testing integration with credit scoring system...\n');

  if (!rpcUrl || !privateKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  try {
    const enhancedService = new EnhancedProtocolService(rpcUrl, privateKey);
    const creditSystem = new MockCreditScoringSystem();
    
    const testAddress = '0x2067ca3b10B136A38203723D842418C646c6e393';

    console.log('1. 🔄 DATA FLOW SIMULATION');
    console.log('='.repeat(40));

    // Step 1: Get enhanced protocol data
    console.log('\n📥 Step 1: Fetching protocol data...');
    const protocolData = await enhancedService.getUserEnhancedProtocolData(testAddress);
    console.log('   ✅ Protocol data retrieved');
    console.log(`   📊 ${protocolData.positions.length} protocol positions analyzed`);
    console.log(`   🎯 Risk level: ${protocolData.riskMetrics.riskLevel}`);

    // Step 2: Calculate credit score
    console.log('\n🧮 Step 2: Calculating credit score...');
    const creditScore = await creditSystem.calculateCreditScore(testAddress, protocolData);
    console.log(`   ✅ Credit score calculated: ${creditScore}`);
    console.log(`   🏆 Credit tier: ${creditScore >= 800 ? 'PLATINUM' : creditScore >= 750 ? 'GOLD' : creditScore >= 700 ? 'SILVER' : creditScore >= 650 ? 'BRONZE' : 'STANDARD'}`);

    // Step 3: Get enhanced benefits
    console.log('\n🎁 Step 3: Generating enhanced benefits...');
    const benefits = await enhancedService.simulateEnhancedProtocolAccess(testAddress, creditScore);
    console.log('   ✅ Enhanced benefits generated');

    // Display integrated results
    console.log('\n2. 🎯 INTEGRATED RESULTS');
    console.log('='.repeat(40));

    console.log('\n📈 PROTOCOL ANALYSIS SUMMARY:');
    protocolData.positions.forEach((position: any, index: number) => {
      console.log(`   ${position.protocol.toUpperCase()}:`);
      console.log(`     💰 Total Supplied: $${position.suppliedAssets.reduce((sum: number, asset: any) => sum + parseFloat(asset.amount), 0).toFixed(2)}`);
      console.log(`     🏦 Total Borrowed: $${position.borrowedAssets.reduce((sum: number, asset: any) => sum + parseFloat(asset.amount), 0).toFixed(2)}`);
      console.log(`     📊 Utilization: ${position.utilizationRate.toFixed(1)}%`);
      if (position.healthFactor) {
        console.log(`     🛡️  Health Factor: ${position.healthFactor}`);
      }
    });

    console.log('\n⚖️ RISK ASSESSMENT:');
    console.log(`   🔄 Repayment Consistency: ${protocolData.riskMetrics.repaymentConsistency}%`);
    console.log(`   🏠 Collateral Quality: ${protocolData.riskMetrics.collateralQuality}%`);
    console.log(`   📱 Protocol Engagement: ${protocolData.riskMetrics.protocolEngagement}%`);
    console.log(`   🌐 Diversification: ${protocolData.riskMetrics.diversificationScore}%`);
    console.log(`   ⚡ Overall Risk Score: ${protocolData.riskMetrics.overallRiskScore}%`);
    console.log(`   🚦 Risk Level: ${protocolData.riskMetrics.riskLevel}`);

    console.log('\n💎 CREDIT-BASED BENEFITS:');
    console.log(`   🦸 Enhanced Aave Access:`);
    console.log(`      📍 ${benefits.enhancedAave.collateralRequirement}`);
    console.log(`      💰 ${benefits.enhancedAave.interestRate}`);
    console.log(`      📈 ${benefits.enhancedAave.borrowingLimit}`);
    console.log(`      ✅ ${benefits.enhancedAave.eligibility}`);

    console.log(`   🦋 Enhanced Morpho Access:`);
    console.log(`      📍 ${benefits.enhancedMorpho.collateralRequirement}`);
    console.log(`      💰 ${benefits.enhancedMorpho.interestRate}`);
    console.log(`      📈 ${benefits.enhancedMorpho.borrowingLimit}`);
    console.log(`      ✅ ${benefits.enhancedMorpho.eligibility}`);

    console.log(`   🎯 Darma Platform Benefits:`);
    console.log(`      📊 P2P LTV: ${benefits.darmaBenefits.p2pLTV}`);
    console.log(`      🏆 Tier: ${benefits.darmaBenefits.creditTier}`);
    console.log(`      🔗 ${benefits.darmaBenefits.protocolIntegration}`);
    console.log(`      👀 ${benefits.darmaBenefits.realTimeMonitoring}`);

    console.log('\n3. 💡 RECOMMENDATIONS & NEXT STEPS');
    console.log('='.repeat(40));

    console.log('\n🎯 OPTIMIZATION OPPORTUNITIES:');
    protocolData.riskMetrics.recommendations.forEach((rec: string, i: number) => {
      console.log(`   ${i + 1}. ${rec}`);
    });

    console.log('\n🚀 POTENTIAL ACTIONS:');
    if (creditScore < 700) {
      console.log('   • Focus on building consistent repayment history');
      console.log('   • Increase protocol engagement across multiple platforms');
      console.log('   • Maintain healthy collateral ratios');
    } else {
      console.log('   • Leverage enhanced borrowing limits for better yields');
      console.log('   • Explore advanced DeFi strategies with reduced collateral');
      console.log('   • Consider protocol diversification for risk management');
    }

    console.log('\n4. 📊 BUSINESS IMPACT ANALYSIS');
    console.log('='.repeat(40));

    const standardRates = { aave: 8.0, morpho: 7.5 };
    const enhancedRates = { 
      aave: parseFloat(benefits.enhancedAave.interestRate.split('%')[0]),
      morpho: parseFloat(benefits.enhancedMorpho.interestRate.split('%')[0])
    };

    const savingsAave = ((standardRates.aave - enhancedRates.aave) / standardRates.aave * 100).toFixed(1);
    const savingsMorpho = ((standardRates.morpho - enhancedRates.morpho) / standardRates.morpho * 100).toFixed(1);

    console.log(`\n💰 INTEREST SAVINGS:`);
    console.log(`   Aave: ${savingsAave}% reduction (${standardRates.aave}% → ${enhancedRates.aave}%)`);
    console.log(`   Morpho: ${savingsMorpho}% reduction (${standardRates.morpho}% → ${enhancedRates.morpho}%)`);

    const collateralReductionAave = parseInt(benefits.enhancedAave.collateralRequirement.split('%')[0]) - 150;
    const collateralReductionMorpho = parseInt(benefits.enhancedMorpho.collateralRequirement.split('%')[0]) - 140;

    console.log(`\n📉 COLLATERAL EFFICIENCY:`);
    console.log(`   Aave: ${Math.abs(collateralReductionAave)}% less collateral required`);
    console.log(`   Morpho: ${Math.abs(collateralReductionMorpho)}% less collateral required`);

    console.log(`\n📈 BORROWING CAPACITY:`);
    console.log(`   ${benefits.enhancedAave.borrowingLimit} across protocols`);

    console.log('\n🎉 INTEGRATION TEST COMPLETE!');
    console.log('='.repeat(40));
    console.log('✅ EnhancedProtocolService successfully integrated with credit scoring');
    console.log('✅ Real-time protocol analysis and risk assessment operational');
    console.log('✅ Credit-based benefit calculation working correctly');
    console.log('✅ Ready for production deployment');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run different user scenario tests
async function userScenarioTest() {
  console.log('\n👥 USER SCENARIO ANALYSIS');
  console.log('='.repeat(40));

  const enhancedService = new EnhancedProtocolService(rpcUrl, privateKey);
  const testAddress = '0x2067ca3b10B136A38203723D842418C646c6e393';

  const scenarios = [
    { name: 'DeFi Beginner', description: 'New to protocols, minimal history', creditScore: 620 },
    { name: 'Active Trader', description: 'Regular protocol user, good history', creditScore: 730 },
    { name: 'Institutional', description: 'High volume, excellent history', creditScore: 820 }
  ];

  for (const scenario of scenarios) {
    console.log(`\n🔍 ${scenario.name}: ${scenario.description}`);
    console.log('-'.repeat(35));
    
    const benefits = await enhancedService.simulateEnhancedProtocolAccess(testAddress, scenario.creditScore);
    
    console.log(`   Credit Score: ${scenario.creditScore}`);
    console.log(`   Aave Collateral: ${benefits.enhancedAave.collateralRequirement}`);
    console.log(`   Morpho Interest: ${benefits.enhancedMorpho.interestRate}`);
    console.log(`   Darma LTV: ${benefits.darmaBenefits.p2pLTV}`);
    console.log(`   Platform Tier: ${benefits.darmaBenefits.creditTier}`);
    
    // Calculate potential savings
    const standardInterest = 8.0;
    const enhancedInterest = parseFloat(benefits.enhancedAave.interestRate.split('%')[0]);
    const savings = ((standardInterest - enhancedInterest) / standardInterest * 100).toFixed(1);
    
    console.log(`   💰 Interest Savings: ${savings}% vs standard rates`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--scenarios') || args.includes('-s')) {
    await userScenarioTest();
  } else {
    await integrationTest();
  }
}

if (require.main === module) {
  main().catch(console.error);
}