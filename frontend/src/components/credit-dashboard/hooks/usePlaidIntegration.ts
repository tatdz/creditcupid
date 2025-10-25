import { useState, useCallback, useEffect } from 'react';
import { PlaidData, StoredPrivacyProofs } from '../../../types/credit';
import { privacyProofGenerator } from '../../../components/credit-dashboard/utils/PrivacyProofs';

export const usePlaidIntegration = () => {
  const [plaidData, setPlaidData] = useState<PlaidData | null>(null);
  const [privacyProofs, setPrivacyProofs] = useState<StoredPrivacyProofs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinataStatus, setPinataStatus] = useState<{
    available: boolean;
    message: string;
  }>({ available: false, message: 'Checking backend configuration...' });

  useEffect(() => {
    checkPinataStatus();
  }, []);


useEffect(() => {
  const debugPinata = async () => {
    try {
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-6b17.up.railway.app';
      const response = await fetch(`${backendBase}/api/status`);
      const status = await response.json();
      
      console.log('🔍 FRONTEND DEBUG - Backend Status:', status);
      console.log('🔍 FRONTEND DEBUG - Should use real IPFS:', status.pinata === true);
      
      // Also check the frontend service status
      const frontendStatus = privacyProofGenerator.getPinataStatus();
      console.log('🔍 FRONTEND DEBUG - Frontend Detection:', frontendStatus);
    } catch (error) {
      console.error('🔍 FRONTEND DEBUG - Error:', error);
    }
  };
  
  debugPinata();
}, []);

  const checkPinataStatus = useCallback(async () => {
    try {
      console.log('🔍 Checking backend Pinata configuration...');
      
      const status = privacyProofGenerator.getPinataStatus();
      setPinataStatus({
        available: status.available,
        message: status.message
      });
      
    } catch (statusError: any) {
      console.error('❌ Backend status check failed:', statusError);
      setPinataStatus({
        available: false,
        message: `Backend connection failed: ${statusError.message}`
      });
    }
  }, []);

//  connectBank function
const connectBank = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    console.log('🏦 Starting Darma Bank Connection...');
    
    // Check backend status
    await checkPinataStatus();

    if (!pinataStatus.available) {
      console.log('🔧 Development Mode: Working without backend IPFS');
      console.log('💡 To enable real IPFS storage:');
      console.log('   1. Add Pinata credentials to backend .env file');
      console.log('   2. Restart backend server');
      console.log('   3. Refresh frontend');
    }

    // Simulate Plaid connection
    console.log('🔄 Connecting to bank via Plaid...');
    const mockPlaidData: PlaidData = await simulatePlaidConnection();
    setPlaidData(mockPlaidData);
    
    console.log('✅ Bank data received, generating cryptographic proofs...');

    // Generate cryptographic proofs - this will work in development mode
    const proofs = await privacyProofGenerator.generatePrivacyProofs(mockPlaidData);
    setPrivacyProofs(proofs);
    
    console.log('🎉 Cryptographic proofs generated successfully!');
    
    if (pinataStatus.available) {
      console.log('🔗 All proofs stored on real IPFS via backend');
    } else {
      console.log('🔧 Development proofs generated - configure backend for real IPFS');
    }

  } catch (err: any) {
    console.error('❌ Bank connection failed:', err);
    setError(err.message || 'Failed to connect to bank account');
  } finally {
    setLoading(false);
  }
}, [checkPinataStatus, pinataStatus.available]);

  const verifyCID = useCallback(async (cid: string) => {
    try {
      return await privacyProofGenerator.verifyCID(cid);
    } catch (error) {
      console.error('CID verification failed:', error);
      return { verified: false, error: 'Verification failed' };
    }
  }, []);

  const retryWithRealIPFS = useCallback(async () => {
    await checkPinataStatus();
    if (plaidData && pinataStatus.available) {
      console.log('🔄 Regenerating proofs with real IPFS via backend...');
      try {
        const newProofs = await privacyProofGenerator.generatePrivacyProofs(plaidData);
        setPrivacyProofs(newProofs);
        console.log('✅ Proofs regenerated with real IPFS via backend!');
      } catch (error) {
        console.error('❌ Failed to regenerate proofs:', error);
      }
    }
  }, [plaidData, pinataStatus.available, checkPinataStatus]);

  return {
    plaidData,
    privacyProofs,
    loading,
    error,
    pinataStatus,
    connectBank,
    verifyCID,
    checkPinataStatus,
    retryWithRealIPFS
  };
};

const simulatePlaidConnection = (): Promise<PlaidData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const transactionCount = 45 + Math.floor(Math.random() * 30);
      const totalBalance = 12500 + Math.floor(Math.random() * 30000);
      
      const mockData: PlaidData = {
        accounts: [
          {
            account_id: 'darma_checking_001',
            name: 'Darma Primary Checking',
            official_name: 'Darma Smart Checking Account',
            type: 'depository',
            subtype: 'checking',
            balances: {
              current: totalBalance * 0.3,
              available: totalBalance * 0.28,
              iso_currency_code: 'USD'
            },
            mask: '1234'
          },
          {
            account_id: 'darma_savings_001',
            name: 'Darma High-Yield Savings',
            official_name: 'Darma Optimized Savings',
            type: 'depository',
            subtype: 'savings',
            balances: {
              current: totalBalance * 0.7,
              available: totalBalance * 0.7,
              iso_currency_code: 'USD'
            },
            mask: '5678'
          }
        ],
        transactions: Array.from({ length: transactionCount }, (_, i) => ({
          transaction_id: `darma_tx_${Date.now()}_${i}`,
          amount: i % 3 === 0 ? -(50 + Math.random() * 200) : (2000 + Math.random() * 3000),
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          name: i % 3 === 0 ? 'Whole Foods Market' : 'TechCorp Inc Salary',
          category: i % 3 === 0 ? ['Shops', 'Food'] : ['Transfer', 'Payroll'],
          pending: false
        })),
        income: {
          income_streams: [
            {
              confidence: 0.95 + Math.random() * 0.04,
              days: 180,
              monthly_income: 7500 + Math.random() * 5000,
              name: 'Primary Employment',
              status: 'ACTIVE'
            }
          ],
          last_year_income: 125000 + Math.random() * 50000,
          last_year_income_before_tax: 125000 + Math.random() * 50000
        },
        identity: {
          names: ['Alex Johnson'],
          emails: [{ data: 'alex.johnson@email.com', type: 'primary' }],
          phone_numbers: [{ data: '+1-555-0123', type: 'home' }],
          addresses: [
            {
              data: {
                city: 'San Francisco',
                state: 'CA',
                zip: '94105',
                country: 'US',
                street: '123 Blockchain Avenue'
              },
              primary: true
            }
          ]
        }
      };

      resolve(mockData);
    }, 2000);
  });
};

export default usePlaidIntegration;