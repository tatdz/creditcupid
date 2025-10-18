// components/credit-dashboard/hooks/useBlockscoutData.ts
import { useState, useEffect } from 'react';
import { CHAIN_CONFIGS } from '../../../config/chains';
import { BlockscoutTransaction, ProtocolInteractionAnalysis } from '../../../types/credit';

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

        // Fetch transactions from Blockscout API
        const response = await fetch(
          `${blockscoutUrl}/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=100`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          const transactions: BlockscoutTransaction[] = data.result.map((tx: any) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            timestamp: parseInt(tx.timeStamp),
            status: tx.isError === '0' ? 'success' : 'failed',
            functionName: tx.functionName,
            input: tx.input,
          }));

          setTransactionHistory(transactions);

          // Fetch token transfers for collateral analysis
          const transactionsWithTransfers = await Promise.all(
            transactions.map(async (tx) => {
              try {
                const tokenResponse = await fetch(
                  `${blockscoutUrl}/api?module=account&action=tokentx&address=${address}&txhash=${tx.hash}`
                );
                
                if (tokenResponse.ok) {
                  const tokenData = await tokenResponse.json();
                  if (tokenData.status === '1' && tokenData.result) {
                    return {
                      ...tx,
                      tokenTransfers: tokenData.result.map((transfer: any) => ({
                        token: {
                          address: transfer.contractAddress,
                          symbol: transfer.tokenSymbol,
                          decimals: parseInt(transfer.tokenDecimal),
                        },
                        value: transfer.value,
                        from: transfer.from,
                        to: transfer.to,
                      }))
                    };
                  }
                }
              } catch (error) {
                console.error('Error fetching token transfers:', error);
              }
              return tx;
            })
          );

          setTransactionHistory(transactionsWithTransfers);

          // Analyze transactions for protocol interactions and repayments
          const { protocolInteractions, repayments } = analyzeTransactions(
            transactionsWithTransfers, 
            chainConfig
          );
          
          setProtocolInteractions(protocolInteractions);
          setRepaymentHistory(repayments);

        } else {
          setTransactionHistory([]);
          setProtocolInteractions([]);
          setRepaymentHistory([]);
        }
      } catch (err) {
        console.error('Error fetching Blockscout data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch on-chain data');
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
    blockscoutUrl: `${blockscoutUrl}/address/${address}`
  };
};

// Analyze transactions for protocol interactions and repayments
const analyzeTransactions = (transactions: BlockscoutTransaction[], chainConfig: any) => {
  const protocolInteractions: ProtocolInteractionAnalysis[] = [];
  const repayments: ProtocolInteractionAnalysis[] = [];

  transactions.forEach(tx => {
    // Check for Morpho interactions (all methods except repay)
    if (chainConfig.morphoAddress !== '0x0000000000000000000000000000000000000000' && 
        tx.to?.toLowerCase() === chainConfig.morphoAddress.toLowerCase()) {
      const interaction = parseMorphoInteraction(tx, chainConfig.morphoAddress);
      if (interaction) {
        if (interaction.type === 'repay') {
          repayments.push(interaction);
        } else {
          protocolInteractions.push(interaction);
        }
      }
    }

    // Check for Aave interactions (all methods except repay)
    if (chainConfig.aaveAddresses.length > 0) {
      const aaveAddress = chainConfig.aaveAddresses.find((addr: string) => 
        tx.to?.toLowerCase() === addr.toLowerCase()
      );
      
      if (aaveAddress) {
        const interaction = parseAaveInteraction(tx, aaveAddress);
        if (interaction) {
          if (interaction.type === 'repay') {
            repayments.push(interaction);
          } else {
            protocolInteractions.push(interaction);
          }
        }
      }
    }
  });

  return { protocolInteractions, repayments };
};

const parseMorphoInteraction = (tx: BlockscoutTransaction, morphoAddress: string): ProtocolInteractionAnalysis | null => {
  if (!tx.functionName) return null;

  const functionName = tx.functionName.toLowerCase();

  // Morpho method detection based on function names
  const isSupply = functionName.includes('supply') || functionName.includes('deposit') || functionName.includes('provide');
  const isWithdraw = functionName.includes('withdraw') || functionName.includes('redeem');
  const isBorrow = functionName.includes('borrow');
  const isRepay = functionName.includes('repay');
  const isLiquidate = functionName.includes('liquidate');

  if (isSupply) {
    return {
      hash: tx.hash,
      protocol: 'morpho',
      type: 'supply',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: morphoAddress,
      method: functionName
    };
  }

  if (isWithdraw) {
    return {
      hash: tx.hash,
      protocol: 'morpho',
      type: 'withdraw',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: morphoAddress,
      method: functionName
    };
  }

  if (isBorrow) {
    return {
      hash: tx.hash,
      protocol: 'morpho',
      type: 'borrow',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: morphoAddress,
      method: functionName
    };
  }

  if (isRepay) {
    return {
      hash: tx.hash,
      protocol: 'morpho',
      type: 'repay',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: morphoAddress,
      method: functionName
    };
  }

  if (isLiquidate) {
    return {
      hash: tx.hash,
      protocol: 'morpho',
      type: 'liquidate',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: morphoAddress,
      method: functionName
    };
  }

  return null;
};

const parseAaveInteraction = (tx: BlockscoutTransaction, aaveAddress: string): ProtocolInteractionAnalysis | null => {
  if (!tx.functionName) return null;

  const functionName = tx.functionName.toLowerCase();

  // Aave method detection based on function names
  const isSupply = functionName.includes('supply') || functionName.includes('deposit') || functionName.includes('mint');
  const isWithdraw = functionName.includes('withdraw') || functionName.includes('redeem');
  const isBorrow = functionName.includes('borrow');
  const isRepay = functionName.includes('repay');
  const isLiquidate = functionName.includes('liquidate');
  const isFlashLoan = functionName.includes('flashloan');

  if (isSupply) {
    return {
      hash: tx.hash,
      protocol: 'aave',
      type: 'supply',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: aaveAddress,
      method: functionName
    };
  }

  if (isWithdraw) {
    return {
      hash: tx.hash,
      protocol: 'aave',
      type: 'withdraw',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: aaveAddress,
      method: functionName
    };
  }

  if (isBorrow) {
    return {
      hash: tx.hash,
      protocol: 'aave',
      type: 'borrow',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: aaveAddress,
      method: functionName
    };
  }

  if (isRepay) {
    return {
      hash: tx.hash,
      protocol: 'aave',
      type: 'repay',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: aaveAddress,
      method: functionName
    };
  }

  if (isLiquidate) {
    return {
      hash: tx.hash,
      protocol: 'aave',
      type: 'liquidate',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: aaveAddress,
      method: functionName
    };
  }

  if (isFlashLoan) {
    return {
      hash: tx.hash,
      protocol: 'aave',
      type: 'flashloan',
      asset: 'Unknown',
      amount: tx.value,
      timestamp: tx.timestamp,
      success: tx.status === 'success',
      contractAddress: aaveAddress,
      method: functionName
    };
  }

  return null;
};