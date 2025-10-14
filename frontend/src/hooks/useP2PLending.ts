import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';

export interface LoanOffer {
  id: number;
  lender: string;
  token: string;
  maxAmount: string;
  minScore: number;
  maxLTV: number;
  interestRate: number;
  maxDuration: number;
  active: boolean;
}

export interface Loan {
  id: number;
  borrower: string;
  lender: string;
  token: string;
  principal: string;
  collateral: string;
  interestRate: number;
  duration: number;
  startTime: number;
  dueTime: number;
  status: 'Active' | 'Repaid' | 'Defaulted' | 'Liquidated';
}

export const useP2PLending = () => {
  const { address, isConnected } = useAccount();
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([]);
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoanOffers = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // In production, this would call your backend API
      // const response = await axios.get(`/api/p2p/offers?address=${address}`);
      // setLoanOffers(response.data);
      
      // Mock data for demonstration
      const mockOffers: LoanOffer[] = [
        {
          id: 1,
          lender: '0x742E...C5D4E',
          token: 'USDC',
          maxAmount: '10000.00',
          minScore: 700,
          maxLTV: 75,
          interestRate: 6.5,
          maxDuration: 180,
          active: true
        },
        // ... more mock offers
      ];
      
      setLoanOffers(mockOffers);
    } catch (err) {
      setError('Failed to fetch loan offers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLoans = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockLoans: Loan[] = [
        {
          id: 1,
          borrower: address,
          lender: '0x742E...C5D4E',
          token: 'USDC',
          principal: '2500.00',
          collateral: '3125.00',
          interestRate: 6.5,
          duration: 90,
          startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
          dueTime: Date.now() + 60 * 24 * 60 * 60 * 1000,
          status: 'Active'
        },
        // ... more mock loans
      ];
      
      setUserLoans(mockLoans);
    } catch (err) {
      setError('Failed to fetch user loans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createLoanOffer = async (offer: Omit<LoanOffer, 'id' | 'lender'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Contract interaction would go here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to local state
      const newOffer: LoanOffer = {
        ...offer,
        id: Date.now(),
        lender: address!
      };
      
      setLoanOffers(prev => [...prev, newOffer]);
    } catch (err) {
      setError('Failed to create loan offer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchLoanOffers();
      fetchUserLoans();
    }
  }, [isConnected, address]);

  return {
    loanOffers,
    userLoans,
    loading,
    error,
    createLoanOffer,
    refetchOffers: fetchLoanOffers,
    refetchLoans: fetchUserLoans
  };
};