// src/hooks/usePlaidIntegration.ts
import { useState, useCallback } from 'react';
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
  }>({ available: false, message: 'Checking Pinata credentials...' });

  const connectBank = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏦 Starting Darma Bank Connection with REAL IPFS...');
      
      // Check Pinata status
      try {
        const status = privacyProofGenerator.getPinataStatus();
        setPinataStatus({
          available: status.available,
          message: status.message
        });
        
        if (!status.available) {
          throw new Error('REAL IPFS storage is not available. Please check your Pinata credentials.');
        }
        
        console.log('✅ Pinata Status:', status);
      } catch (statusError: any) {
        throw new Error(`Pinata configuration error: ${statusError.message}`);
      }

      // Simulate Plaid connection
      console.log('🔄 Connecting to bank via Plaid...');
      const mockPlaidData: PlaidData = await simulatePlaidConnection();
      setPlaidData(mockPlaidData);
      
      console.log('✅ Bank data received, generating cryptographic proofs...');

      // Generate cryptographic proofs - this will throw if Pinata fails
      const proofs = await privacyProofGenerator.generatePrivacyProofs(mockPlaidData);
      setPrivacyProofs(proofs);
      
      console.log('🎉 REAL cryptographic proofs Generated Successfully!');
      console.log('🔗 All proofs are now publicly accessible on IPFS');

    } catch (err: any) {
      console.error('❌ Bank connection failed:', err);
      setError(err.message || 'Failed to connect to bank account');
    } finally {
      setLoading(false);
    }
  }, []);

  // Method to verify a specific CID
  const verifyCID = useCallback(async (cid: string) => {
    try {
      return await privacyProofGenerator.verifyCID(cid);
    } catch (error) {
      console.error('CID verification failed:', error);
      return { verified: false, error: 'Verification failed' };
    }
  }, []);

  return {
    plaidData,
    privacyProofs,
    loading,
    error,
    pinataStatus,
    connectBank,
    verifyCID
  };
};

// Enhanced Plaid connection simulation
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