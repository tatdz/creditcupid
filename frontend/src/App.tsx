import React, { useState } from 'react';
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
import cupidGif from './assets/cupid.gif';

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
      staleTime: 20000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isConnected } = useAccount();

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
        <NotificationProvider>
          <TransactionPopupProvider>
            <AppContent />
          </TransactionPopupProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}