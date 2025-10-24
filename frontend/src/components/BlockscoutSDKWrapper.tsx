// /frontend/src/components/BlockscoutSDKWrapper.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TransactionPopupListener } from './TransactionPopupListener';

interface BlockscoutSDKContextType {
  showTransactionToast: (chainId: string, txHash: string) => void;
  showTransactionHistory: (chainId: string, address?: string) => void;
  isSDKAvailable: boolean;
}

const BlockscoutSDKContext = createContext<BlockscoutSDKContextType>({
  showTransactionToast: () => {},
  showTransactionHistory: () => {},
  isSDKAvailable: false,
});

export const useBlockscoutSDK = () => useContext(BlockscoutSDKContext);

interface BlockscoutSDKWrapperProps {
  children: ReactNode;
}

// Component that uses Blockscout hooks directly (called in component body)
const BlockscoutSDKProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notificationHook, setNotificationHook] = useState<any>(null);
  const [popupHook, setPopupHook] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Try to use Blockscout hooks directly in component body
  let blockscoutNotification = null;
  let blockscoutPopup = null;

  try {
    // This will only work if Blockscout SDK is available and hooks are called in component body
    const blockscoutSDK = require('@blockscout/app-sdk');
    blockscoutNotification = blockscoutSDK.useNotification?.();
    blockscoutPopup = blockscoutSDK.useTransactionPopup?.();
  } catch (error) {
    // SDK not available, we'll use fallbacks
    console.log('🔧 Blockscout SDK not available at build time, will try runtime');
  }

  useEffect(() => {
    if (blockscoutNotification && blockscoutPopup) {
      setNotificationHook(blockscoutNotification);
      setPopupHook(blockscoutPopup);
      setIsAvailable(true);
      console.log('✅ Blockscout SDK hooks initialized');
    }
  }, [blockscoutNotification, blockscoutPopup]);

  const showTransactionToast = (chainId: string, txHash: string) => {
    if (notificationHook && isAvailable) {
      try {
        console.log('🎯 Using Blockscout SDK toast for tx:', txHash);
        notificationHook.openTxToast(chainId, txHash);
      } catch (error) {
        console.error('Failed to show Blockscout toast:', error);
      }
    } else {
      console.warn('📱 Blockscout SDK not available for transaction toast');
    }
  };

  const showTransactionHistory = (chainId: string, address?: string) => {
    if (popupHook && isAvailable) {
      try {
        console.log('🎯 Using Blockscout SDK popup for address:', address);
        const config: any = { chainId };
        if (address) config.address = address;
        popupHook.openPopup(config);
      } catch (error) {
        console.error('Failed to show Blockscout popup:', error);
      }
    } else {
      console.warn('📱 Blockscout SDK not available for transaction history');
    }
  };

  const contextValue: BlockscoutSDKContextType = {
    showTransactionToast,
    showTransactionHistory,
    isSDKAvailable: isAvailable,
  };

  return (
    <BlockscoutSDKContext.Provider value={contextValue}>
      {children}
    </BlockscoutSDKContext.Provider>
  );
};

// Fallback provider for when SDK is not available
const BlockscoutSDKFallback: React.FC<{ children: ReactNode }> = ({ children }) => {
  const showTransactionToast = (chainId: string, txHash: string) => {
    console.log('🔧 Using fallback for transaction toast:', txHash);
    // Fallback: could show a custom modal or do nothing
  };

  const showTransactionHistory = (chainId: string, address?: string) => {
    console.log('🔧 Using fallback for transaction history:', address);
    // Fallback: could show a custom modal or do nothing
  };

  const contextValue: BlockscoutSDKContextType = {
    showTransactionToast,
    showTransactionHistory,
    isSDKAvailable: false,
  };

  return (
    <BlockscoutSDKContext.Provider value={contextValue}>
      {children}
    </BlockscoutSDKContext.Provider>
  );
};

export const BlockscoutSDKWrapper: React.FC<BlockscoutSDKWrapperProps> = ({ children }) => {
  const [useSDK, setUseSDK] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSDK = async () => {
      try {
        // Try to dynamically import the SDK to check if it's available
        await import('@blockscout/app-sdk');
        setUseSDK(true);
        console.log('✅ Blockscout SDK is available');
      } catch (error) {
        console.log('🔧 Blockscout SDK not available, using fallback');
        setUseSDK(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkSDK();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing Blockscout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TransactionPopupListener />
      {useSDK ? (
        <BlockscoutSDKProvider>
          {children}
        </BlockscoutSDKProvider>
      ) : (
        <BlockscoutSDKFallback>
          {children}
        </BlockscoutSDKFallback>
      )}
    </>
  );
};