import { useNotification, useTransactionPopup } from '@blockscout/app-sdk'
import { useEffect, useState } from 'react'

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

/**
 * Wrapper for useNotification to manage SSR 
 * Returns the real hook when mounted on client, fallback during SSR
 */
export function useNotificationGood() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  try {
    const notification = useNotification()
    return isMounted ? notification : getFallbackNotification()
  } catch (error) {
    console.warn('NotificationProvider not available, using fallback')
    return getFallbackNotification()
  }
}

/**
 * Wrapper for useNotification to manage SSR
 * Returns the real hook when mounted on client, fallback during SSR
 */
export function useTransactionPopupGood() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  try {
    const transactionPopup = useTransactionPopup()
    return isMounted ? transactionPopup : getFallbackTransactionPopup()
  } catch (error) {
    console.warn('TransactionPopupProvider not available, using fallback')
    return getFallbackTransactionPopup()
  }
}

export const useTransactionNotifications = () => {
  const { openTxToast } = useNotificationGood();
  const { openPopup } = useTransactionPopupGood();

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

export const useBlockscoutSDKGood = () => {
  const notification = useNotificationGood();
  const transactionPopup = useTransactionPopupGood();
  
  return {
    notification,
    transactionPopup,
    ...useTransactionNotifications(),
  };
};

function getFallbackNotification() {
  return {
    openTxToast: () => {
      console.log('Toast would be shown here')
    }
  }
}

function getFallbackTransactionPopup() {
  return {
    openPopup: () => {
      console.log('Transaction popup would be opened here')
    }
  }
}