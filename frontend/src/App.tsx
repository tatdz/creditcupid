// src/App.tsx
import React, { useState, useEffect } from 'react';
import {
  createConfig,
  WagmiProvider,
  http,
  useAccount,
} from 'wagmi';
import {
  sepolia,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import {
  NotificationProvider,
  TransactionPopupProvider,
} from '@blockscout/app-sdk';

import LandingPopup from './components/LandingPopup';
import { CreditDashboard } from './components/credit-dashboard/CreditDashboard';
import { TransactionPopupListener } from './components/TransactionPopupListener';
import cupidGif from './assets/cupid.gif';
import { blockscoutCreditService } from './services/blockscoutCreditService';

// RPC URLs keyed by chain ID
const rpcUrls: Record<number, string> = {
  [sepolia.id]: 'https://rpc.sepolia.org',
  [mainnet.id]: 'https://eth.llamarpc.com',
  [polygon.id]: 'https://polygon.llamarpc.com',
  [arbitrum.id]: 'https://arbitrum.llamarpc.com',
  [optimism.id]: 'https://optimism.llamarpc.com',
  [base.id]: 'https://base.llamarpc.com',
};

const transports = {
  [sepolia.id]: http(rpcUrls[sepolia.id]),
  [mainnet.id]: http(rpcUrls[mainnet.id]),
  [polygon.id]: http(rpcUrls[polygon.id]),
  [arbitrum.id]: http(rpcUrls[arbitrum.id]),
  [optimism.id]: http(rpcUrls[optimism.id]),
  [base.id]: http(rpcUrls[base.id]),
};

const connectors = [
  injected({
    shimDisconnect: true,
  }),
];

const config = createConfig({
  chains: [sepolia, mainnet, polygon, arbitrum, optimism, base],
  connectors,
  transports,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
  },
});

// Blockscout wrapper component
function BlockscoutProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    console.log('BlockscoutProviders mounted');
  }, []);

  console.log('BlockscoutProviders rendering, isMounted:', isMounted);

  try {
    console.log('Rendering Blockscout providers...');
    return (
      <NotificationProvider>
        <TransactionPopupProvider>
          {isMounted && <TransactionPopupListener />}
          {children}
        </TransactionPopupProvider>
      </NotificationProvider>
    );
  } catch (error) {
    console.error('Error rendering Blockscout providers:', error);
    return <>{children}</>;
  }
}

function AppContent() {
  const { isConnected } = useAccount();

  // Set API keys for frontend usage
  useEffect(() => {
    // Use Vite's import.meta.env - this will work with the vite-env.d.ts declaration
    const blockscoutKey = import.meta.env.VITE_BLOCKSCOUT_API_KEY || '';
    const etherscanKey = import.meta.env.VITE_ETHERSCAN_API_KEY || '';
    
    if (blockscoutKey || etherscanKey) {
      blockscoutCreditService.setApiKeys(blockscoutKey, etherscanKey);
      console.log('🔑 API keys set from frontend environment');
    }
  }, []);

  // Show LandingPopup until wallet is connected
  if (!isConnected) {
    return <LandingPopup gifUrl={cupidGif} onComplete={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <CreditDashboard />
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BlockscoutProviders>
          <AppContent />
        </BlockscoutProviders>
      </QueryClientProvider>
    </WagmiProvider>
  );
}