import { useState } from 'react';
import { PlaidData, ZKProofs } from '../../../types/credit';
import { realZKProofGenerator } from '../utils/realZKProofs';

export const usePlaidIntegration = () => {
  const [plaidData, setPlaidData] = useState<PlaidData | null>(null);
  const [zkProofs, setZkProofs] = useState<ZKProofs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectBank = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate Plaid Link process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Enhanced mock Plaid sandbox data
      const mockPlaidData: PlaidData = {
        accounts: [
          {
            account_id: 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D',
            balances: {
              available: 10000,
              current: 12500,
            },
            name: 'Plaid Checking',
            official_name: 'Plaid Gold Standard 0% Interest Checking',
            type: 'depository',
            subtype: 'checking'
          },
          {
            account_id: '6Myq63K1KDSe3lB3JkFdnlR5gVr6LcVwJ6Y8E',
            balances: {
              available: 2000,
              current: 2100,
            },
            name: 'Plaid Savings',
            official_name: 'Plaid Silver Standard 0.1% Interest Saving',
            type: 'depository',
            subtype: 'savings'
          }
        ],
        transactions: Array.from({ length: 67 }, (_, i) => ({
          transaction_id: `txn_${i + 1}`,
          amount: Math.random() * 500 + 50,
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          name: ['Starbucks', 'Amazon', 'Netflix', 'Spotify', 'Grocery Store', 'Gas Station', 'Restaurant'][i % 7],
          category: ['Food & Drink', 'Shopping', 'Entertainment', 'Entertainment', 'Food & Drink', 'Transportation', 'Dining'],
          pending: false,
          account_id: i % 2 === 0 ? 'vzeNDwK7KQIm4yEog683uElbp9GRLEFXGK98D' : '6Myq63K1KDSe3lB3JkFdnlR5gVr6LcVwJ6Y8E'
        })),
        income: {
          income_streams: [
            {
              confidence: 0.95,
              days: 730,
              monthly_income: 4500,
              name: 'EMPLOYER INC',
              status: 'ACTIVE'
            }
          ],
          last_year_income: 54000,
          last_year_income_before_tax: 58000
        },
        identity: {
          names: ['John Doe'],
          emails: [{ data: 'john.doe@example.com', type: 'primary' }],
          phone_numbers: [{ data: '555-123-4567', type: 'home' }],
          addresses: [
            {
              data: {
                city: 'San Francisco',
                state: 'CA',
                zip: '94105',
                country: 'US'
              },
              primary: true
            }
          ]
        }
      };
      
      setPlaidData(mockPlaidData);
      
      // Generate REAL ZK proofs with actual verification
      const proofs = await realZKProofGenerator.generateRealZKProofs(mockPlaidData);
      setZkProofs(proofs);
      
      console.log('✅ Real ZK proofs generated with explorer verification URLs');
      
    } catch (err) {
      setError('Failed to connect bank account. Please try again.');
      console.error('Plaid connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    plaidData,
    zkProofs,
    loading,
    error,
    connectBank
  };
};