// components/credit-dashboard/hooks/useBlockscoutData.ts
import { useState, useEffect } from 'react';
import { CHAIN_CONFIGS } from '../../../config/chains';
import { blockscoutCreditService, BlockscoutTransaction, ProtocolInteractionAnalysis } from '../../../services/blockscoutCreditService';

export const useBlockscoutData = (address: string | undefined, chainId: string) => {
  const [transactionHistory, setTransactionHistory] = useState<BlockscoutTransaction[]>([]);
  const [protocolInteractions, setProtocolInteractions] = useState<ProtocolInteractionAnalysis[]>([]);
  const [repaymentHistory, setRepaymentHistory] = useState<ProtocolInteractionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chainConfig = CHAIN_CONFIGS[chainId] || CHAIN_CONFIGS['1'];
  const blockscoutUrl = chainConfig.blockscoutUrl;

  useEffect(() => {
    const fetchBlockscoutData = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🚀 Starting Blockscout data fetch for address:', address);

        // Use the frontend service
        const transactions = await blockscoutCreditService.getTransactionHistory(address, blockscoutUrl);
        
        setTransactionHistory(transactions);

        // Analyze transactions for protocol interactions and repayments
        const { protocolInteractions, repayments } = blockscoutCreditService.analyzeTransactions(transactions, chainConfig);
        
        setProtocolInteractions(protocolInteractions);
        setRepaymentHistory(repayments);

        console.log('✅ Blockscout data fetch complete:', {
          transactions: transactions.length,
          protocolInteractions: protocolInteractions.length,
          repayments: repayments.length
        });

      } catch (err) {
        console.error('❌ Error fetching Blockscout data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch on-chain data');
        
        // Set empty arrays on error
        setTransactionHistory([]);
        setProtocolInteractions([]);
        setRepaymentHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockscoutData();
  }, [address, chainId, chainConfig, blockscoutUrl]);

  return {
    transactionHistory,
    protocolInteractions,
    repaymentHistory,
    loading,
    error,
    blockscoutUrl: blockscoutCreditService.getAddressUrl(address || ''),
    fallbackUrl: blockscoutCreditService.getFallbackAddressUrl(address || ''),
    getTransactionUrl: blockscoutCreditService.getTransactionUrl,
    getFallbackTransactionUrl: blockscoutCreditService.getFallbackTransactionUrl
  };
};