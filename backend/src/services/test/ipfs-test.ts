import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the project root .env file
// __dirname is /src/services/test, so we go up three levels to reach project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { IPFSService, LoanMetadata, LoanTerms } from '../ipfsService';

async function runRealTest() {
  console.log('🌐 Testing IPFS Service with Real Pinata API\n');
  
  // Show environment status
  console.log('🔍 Environment Configuration Status:');
  console.log(`   Pinata_API_Key: ${process.env.Pinata_API_Key ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Pinata_API_Secret: ${process.env.Pinata_API_Secret ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Pinata_JWT: ${process.env.Pinata_JWT ? '✅ Present' : '❌ Missing'}`);
  console.log(`   SEPOLIA_RPC_URL: ${process.env.SEPOLIA_RPC_URL ? '✅ Present' : '❌ Missing'}`);
  console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅ Present' : '❌ Missing'}`);

  // Check if we have the required Pinata JWT
  if (!process.env.Pinata_JWT) {
    console.error('\n❌ CRITICAL: Pinata_JWT environment variable is missing!');
    console.error('   Please ensure your .env file contains:');
    console.error('   Pinata_API_Key=your_api_key_here');
    console.error('   Pinata_API_Secret=your_api_secret_here');
    console.error('   Pinata_JWT=your_jwt_token_here');
    console.error('\n💡 You can get these from: https://app.pinata.cloud/developers/api-keys');
    return;
  }

  const ipfsService = new IPFSService();
  
  // Verify service configuration
  const configStatus = ipfsService.getConfigurationStatus();
  console.log('\n🔧 IPFSService Configuration:');
  console.log(`   JWT Configured: ${configStatus.jwt ? '✅ Yes' : '❌ No'}`);
  console.log(`   API Key Configured: ${configStatus.apiKey ? '✅ Yes' : '❌ No'}`);
  console.log(`   API Secret Configured: ${configStatus.apiSecret ? '✅ Yes' : '❌ No'}`);

  if (!configStatus.jwt) {
    console.error('\n❌ Cannot proceed: IPFSService is not properly configured.');
    return;
  }

  // Test data
  const loanMetadata: LoanMetadata = {
    description: 'Small business expansion loan - REAL TEST',
    purpose: 'Purchase new equipment and inventory for business growth',
    riskAssessment: 'Low risk - established business with 5 years of consistent revenue',
    borrowerStatement: 'We have been successfully operating for 5 years with consistent year-over-year growth and need capital to expand our operations and inventory.',
    supportingDocs: [],
    timestamp: Date.now()
  };

  const loanTerms: LoanTerms = {
    description: '24-month business loan with flexible repayment terms',
    conditions: [
      'Monthly repayments on the 1st of each month',
      'Early repayment allowed without penalty after 6 months',
      'Collateral required: business equipment and inventory',
      'Loan amount: $50,000 USD',
      'Interest rate: 7.5% APR'
    ],
    collateralRequirements: 'Business equipment and inventory valued at minimum 125% of loan amount',
    repaymentSchedule: '24 equal monthly installments of $2,250.42 starting after 30-day grace period',
    riskDisclosure: 'Default may result in collateral liquidation and reporting to credit agencies. Late payments may incur fees and affect creditworthiness.',
    timestamp: Date.now()
  };

  try {
    console.log('\n🚀 Starting Real IPFS Operations...\n');

    // Test 1: Upload Loan Metadata
    console.log('1. 📄 Uploading Loan Metadata to IPFS...');
    const metadataHash = await ipfsService.uploadLoanMetadata(loanMetadata);
    console.log(`   ✅ SUCCESS!`);
    console.log(`   🔗 IPFS Hash: ${metadataHash}`);
    console.log(`   🌐 View at: https://gateway.pinata.cloud/ipfs/${metadataHash}`);
    console.log(`   🌐 View at: https://ipfs.io/ipfs/${metadataHash}`);

    // Test 2: Upload Loan Terms
    console.log('\n2. 📋 Uploading Loan Terms to IPFS...');
    const termsHash = await ipfsService.uploadLoanTerms(loanTerms);
    console.log(`   ✅ SUCCESS!`);
    console.log(`   🔗 IPFS Hash: ${termsHash}`);
    console.log(`   🌐 View at: https://gateway.pinata.cloud/ipfs/${termsHash}`);
    console.log(`   🌐 View at: https://ipfs.io/ipfs/${termsHash}`);

    // Test 3: Retrieve Data
    console.log('\n3. 🔍 Retrieving Metadata from IPFS...');
    const retrievedData = await ipfsService.retrieveFromIPFS(metadataHash);
    console.log(`   ✅ SUCCESS!`);
    console.log(`   📝 Description: ${retrievedData.description}`);
    console.log(`   🎯 Purpose: ${retrievedData.purpose}`);
    console.log(`   ⚠️  Risk Assessment: ${retrievedData.riskAssessment}`);

    // Test 4: Upload Test File
    console.log('\n4. 📎 Uploading Test File to IPFS...');
    const testContent = `Test Document for Loan Application

Business Name: Test Company Inc.
Application Date: ${new Date().toISOString()}
Loan Purpose: Testing IPFS file upload functionality
Document Type: Test Financial Statement

This is a test document to verify IPFS file upload capabilities.
File generated for testing purposes only.

---
Test Signature: Automated Test System
Timestamp: ${Date.now()}
`;

    const fileBuffer = Buffer.from(testContent, 'utf-8');
    const fileHash = await ipfsService.uploadFileToIPFS(fileBuffer, 'test-financial-statement.txt');
    console.log(`   ✅ SUCCESS!`);
    console.log(`   🔗 IPFS Hash: ${fileHash}`);
    console.log(`   🌐 View at: https://gateway.pinata.cloud/ipfs/${fileHash}`);
    console.log(`   🌐 View at: https://ipfs.io/ipfs/${fileHash}`);

    // Test 5: Complete Flow with Real Hashes
    console.log('\n5. 🔄 Testing Complete Loan Application Flow...');
    const completeMetadata = {
      ...loanMetadata,
      supportingDocs: [fileHash], // Using the real file hash
      description: `${loanMetadata.description} - With Supporting Documents`
    };
    const completeHash = await ipfsService.uploadLoanMetadata(completeMetadata);
    console.log(`   ✅ SUCCESS!`);
    console.log(`   🔗 IPFS Hash: ${completeHash}`);
    console.log(`   🌐 View at: https://gateway.pinata.cloud/ipfs/${completeHash}`);
    console.log(`   📎 Includes supporting document: ${fileHash}`);

    // Final Summary
    console.log('\n🎉 ALL REAL IPFS OPERATIONS COMPLETED SUCCESSFULLY!');
    console.log('\n📋 REAL IPFS HASHES SUMMARY:');
    console.log(`   • Loan Metadata: ${metadataHash}`);
    console.log(`   • Loan Terms: ${termsHash}`);
    console.log(`   • Test File: ${fileHash}`);
    console.log(`   • Complete Application: ${completeHash}`);

    console.log('\n🔗 ALL IPFS LINKS:');
    console.log(`   📄 Metadata: https://gateway.pinata.cloud/ipfs/${metadataHash}`);
    console.log(`   📋 Terms: https://gateway.pinata.cloud/ipfs/${termsHash}`);
    console.log(`   📎 File: https://gateway.pinata.cloud/ipfs/${fileHash}`);
    console.log(`   📦 Complete: https://gateway.pinata.cloud/ipfs/${completeHash}`);

    console.log('\n💡 These are REAL IPFS hashes that are permanently stored on the IPFS network!');
    console.log('   You can share these links with anyone to view the stored data.');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:');
    console.error(`   Error: ${error.message}`);
    
    if (error.response) {
      console.error(`   Status Code: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   • Check your Pinata JWT token is valid and not expired');
    console.log('   • Verify your Pinata account is active and has sufficient credits');
    console.log('   • Ensure your API keys have pinning permissions enabled');
    console.log('   • Check your internet connection and firewall settings');
    console.log('   • Verify the .env file is in the correct location (project root)');
  }
}

// Run the test
runRealTest();