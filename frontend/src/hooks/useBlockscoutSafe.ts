// /frontend/src/hooks/useBlockscoutSafe.ts
import { useEffect, useState, useCallback, useRef } from 'react'

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

interface NotificationHook {
  openTxToast: (chainId: string, txHash: string) => void
}

interface TransactionPopupHook {
  openPopup: (config: any) => void
}

// Fallback implementations
function getFallbackNotification(): NotificationHook {
  return {
    openTxToast: (chainId: string, txHash: string) => {
      console.log(`[Blockscout Fallback] Transaction toast for chain ${chainId}, tx: ${txHash}`)
      const baseUrl = getBlockscoutBaseUrl(parseInt(chainId))
      const url = `${baseUrl}/tx/${txHash}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
}

function getFallbackTransactionPopup(): TransactionPopupHook {
  return {
    openPopup: (config: any) => {
      console.log('[Blockscout Fallback] Transaction popup:', config)
      const { chainId, address, transactionHash } = config
      const baseUrl = getBlockscoutBaseUrl(parseInt(chainId))
      let url = baseUrl
      if (transactionHash) {
        url += `/tx/${transactionHash}`
      } else if (address) {
        url += `/address/${address}`
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
}

function getBlockscoutBaseUrl(chainId: number): string {
  switch (chainId) {
    case 1: return 'https://eth.blockscout.com'
    case 137: return 'https://polygon.blockscout.com'
    case 42161: return 'https://arbitrum.blockscout.com'
    case 10: return 'https://optimism.blockscout.com'
    case 8453: return 'https://base.blockscout.com'
    case 11155111: return 'https://eth-sepolia.blockscout.com'
    default: return 'https://eth-sepolia.blockscout.com'
  }
}

// NEW APPROACH: Use Higher-Order Components instead of hooks
let blockscoutSDK: any = null
let isInitializing = false

const initializeBlockscoutSDK = async (): Promise<any> => {
  if (blockscoutSDK) return blockscoutSDK
  if (isInitializing) {
    // Wait for existing initialization
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (blockscoutSDK) {
          clearInterval(checkInterval)
          resolve(blockscoutSDK)
        }
      }, 100)
    })
  }

  isInitializing = true
  try {
    console.log('🚀 Initializing Blockscout SDK...')
    const sdk = await import('@blockscout/app-sdk')
    blockscoutSDK = sdk
    console.log('✅ Blockscout SDK initialized successfully')
    return sdk
  } catch (error) {
    console.error('❌ Failed to initialize Blockscout SDK:', error)
    throw error
  } finally {
    isInitializing = false
  }
}

// Safe hook for notifications - FIXED: Don't call Blockscout hooks directly
export function useNotificationSafe(): NotificationHook {
  const [notification, setNotification] = useState<NotificationHook>(getFallbackNotification)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    const initNotification = async () => {
      try {
        const sdk = await initializeBlockscoutSDK()
        if (isMounted.current) {
          // We can't call the hook here, so we'll create a wrapper that uses the SDK properly
          // For now, we'll use the SDK in components directly via the custom event system
          setNotification({
            openTxToast: (chainId: string, txHash: string) => {
              // Use the custom event system that will be handled by TransactionPopupListener
              const event = new CustomEvent('openTransactionPopup', {
                detail: {
                  chainId,
                  transactionHash: txHash,
                  useBlockscoutSDK: true
                }
              })
              window.dispatchEvent(event)
            }
          })
        }
      } catch (error) {
        console.warn('Blockscout SDK not available, using fallback for notifications:', error)
        if (isMounted.current) {
          setNotification(getFallbackNotification())
        }
      }
    }

    initNotification()

    return () => {
      isMounted.current = false
    }
  }, [])

  return notification
}

// Safe hook for transaction popup - FIXED: Don't call Blockscout hooks directly
export function useTransactionPopupSafe(): TransactionPopupHook {
  const [transactionPopup, setTransactionPopup] = useState<TransactionPopupHook>(getFallbackTransactionPopup)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    const initTransactionPopup = async () => {
      try {
        const sdk = await initializeBlockscoutSDK()
        if (isMounted.current) {
          // Create a wrapper that doesn't violate hook rules
          setTransactionPopup({
            openPopup: (config: any) => {
              // Use the custom event system
              const event = new CustomEvent('openTransactionPopup', {
                detail: {
                  ...config,
                  useBlockscoutSDK: true
                }
              })
              window.dispatchEvent(event)
            }
          })
        }
      } catch (error) {
        console.warn('Blockscout SDK not available, using fallback for transaction popup:', error)
        if (isMounted.current) {
          setTransactionPopup(getFallbackTransactionPopup())
        }
      }
    }

    initTransactionPopup()

    return () => {
      isMounted.current = false
    }
  }, [])

  return transactionPopup
}

// Combined safe hooks
export const useTransactionNotificationsSafe = () => {
  const { openTxToast } = useNotificationSafe()
  const { openPopup } = useTransactionPopupSafe()

  const showTransactionToast = useCallback(async (chainId: BlockscoutChainId, txHash: string) => {
    try {
      console.log(`🎯 Showing Blockscout toast for tx: ${txHash} on chain ${chainId}`)
      openTxToast(BLOCKSCOUT_CHAIN_IDS[chainId], txHash)
    } catch (error) {
      console.error('Failed to show transaction toast, using fallback:', error)
      const baseUrl = getBlockscoutBaseUrl(chainId)
      const url = `${baseUrl}/tx/${txHash}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [openTxToast])

  const showTransactionHistory = useCallback((chainId: BlockscoutChainId, address?: string) => {
    try {
      console.log(`🎯 Showing Blockscout history for address: ${address} on chain ${chainId}`)
      const config: any = {
        chainId: BLOCKSCOUT_CHAIN_IDS[chainId],
      }
      
      if (address) {
        config.address = address
      }

      openPopup(config)
    } catch (error) {
      console.error('Failed to show transaction history, using fallback:', error)
      const baseUrl = getBlockscoutBaseUrl(chainId)
      let url = baseUrl
      if (address) {
        url += `/address/${address}`
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [openPopup])

  return {
    showTransactionToast,
    showTransactionHistory,
  }
}

export const useBlockscoutSDKSafe = () => {
  const notification = useNotificationSafe()
  const transactionPopup = useTransactionPopupSafe()
  const transactionNotifications = useTransactionNotificationsSafe()
  
  return {
    notification,
    transactionPopup,
    ...transactionNotifications,
  }
}

// Direct Blockscout integration for components that can use hooks properly
export const useBlockscoutDirect = () => {
  const [sdk, setSdk] = useState<any>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    const initSDK = async () => {
      try {
        const loadedSDK = await initializeBlockscoutSDK()
        if (isMounted.current) {
          setSdk(loadedSDK)
        }
      } catch (error) {
        console.warn('Blockscout SDK not available for direct use:', error)
      }
    }

    initSDK()

    return () => {
      isMounted.current = false
    }
  }, [])

  return sdk
}