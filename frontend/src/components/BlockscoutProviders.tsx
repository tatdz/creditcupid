'use client'

import React, { useState, useEffect } from 'react'
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk'
import { TransactionPopupListener } from './TransactionPopupListener'

export function BlockscoutProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    console.log('BlockscoutProviders mounted on client')
  }, [])

  console.log('BlockscoutProviders rendering, isMounted:', isMounted)

  try {
    console.log('Rendering Blockscout providers...')
    return (
      <NotificationProvider>
        <TransactionPopupProvider>
          {isMounted && <TransactionPopupListener />}
          {children}
        </TransactionPopupProvider>
      </NotificationProvider>
    )
  } catch (error) {
    console.error('Error rendering Blockscout providers:', error)
    return <>{children}</>
  }
}