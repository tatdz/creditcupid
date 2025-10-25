import React, { useState, useEffect } from 'react'; // ← Add useEffect here
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
import dynamic from 'next/dynamic';

import LandingPopup from './components/LandingPopup';
import { CreditDashboard } from './components/credit-dashboard/CreditDashboard';
import cupidGif from './assets/cupid.gif';

// Dynamic import with SSR disabled for Blockscout providers
const BlockscoutProviders = dynamic(
  () => import('./components/BlockscoutProviders').then(mod => ({ default: mod.BlockscoutProviders })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-4">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    )
  }
)

// RPC URLs keyed by chain ID - these are public, safe to keep in frontend
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

function AppContent() {
  const { isConnected } = useAccount();

  // No more API keys in frontend - they're handled by backend proxies
  useEffect(() => { // ← This useEffect was missing the import
    console.log('🔑 API keys are now securely handled by backend proxies');
    // The service will now use backend endpoints instead of direct API calls
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