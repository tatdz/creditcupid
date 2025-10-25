// src/components/TransactionPopupListener.tsx
'use client'

import { useEffect } from 'react'
import { useTransactionPopupGood } from '../hooks/useBlockscoutGood'

interface PopupEventDetail {
  chainId: string
  address: string
  blockscoutUrl?: string
  transactionHash?: string
}

export function TransactionPopupListener() {
  const { openPopup } = useTransactionPopupGood()

  useEffect(() => {
    const handlePopupRequest = (event: CustomEvent<PopupEventDetail>) => {
      const { chainId, address, blockscoutUrl, transactionHash } = event.detail
      
      console.log('🔍 Opening transaction viewer:', { 
        chain: chainId, 
        address: address.slice(0, 8), 
        tx: transactionHash?.slice(0, 10) 
      })
      
      try {
        const popupConfig = {
          chainId,
          address,
          ...(transactionHash && { transactionHash }),
          ...(blockscoutUrl && { 
            customBlockscoutUrl: blockscoutUrl 
          })
        }
        
        openPopup(popupConfig)
        console.log('✅ Transaction viewer launched')
        
      } catch (error) {
        console.error('❌ Failed to open transaction viewer:', error)
      }
    }

    const eventHandler = handlePopupRequest as EventListener
    window.addEventListener('openTransactionPopup', eventHandler)

    return () => {
      window.removeEventListener('openTransactionPopup', eventHandler)
    }
  }, [openPopup])

  return null
}