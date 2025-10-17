import { useNotification, useTransactionPopup } from "@blockscout/app-sdk";

// Chain ID mapping according to Blockscout documentation
export const BLOCKSCOUT_CHAIN_IDS = {
  1: "1",      // Ethereum Mainnet
  137: "137",  // Polygon
  42161: "42161", // Arbitrum
  10: "10",    // Optimism
  8453: "8453", // Base
  11155111: "11155111", // Sepolia
} as const;

export type BlockscoutChainId = keyof typeof BLOCKSCOUT_CHAIN_IDS;

export const useTransactionNotifications = () => {
  const { openTxToast } = useNotification();
  const { openPopup } = useTransactionPopup();

  const showTransactionToast = async (chainId: BlockscoutChainId, txHash: string) => {
    try {
      openTxToast(BLOCKSCOUT_CHAIN_IDS[chainId], txHash);
    } catch (error) {
      console.error('Failed to show transaction toast:', error);
      throw error;
    }
  };

  const showTransactionHistory = (chainId: BlockscoutChainId, address?: string) => {
    const config: any = {
      chainId: BLOCKSCOUT_CHAIN_IDS[chainId],
    };
    
    if (address) {
      config.address = address;
    }

    openPopup(config);
  };

  return {
    showTransactionToast,
    showTransactionHistory,
  };
};

export const useBlockscoutSDK = () => {
  const notification = useNotification();
  const transactionPopup = useTransactionPopup();
  
  return {
    notification,
    transactionPopup,
    ...useTransactionNotifications(),
  };
};