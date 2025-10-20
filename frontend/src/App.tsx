import React, { useState } from 'react';
import {
  createConfig,
  WagmiProvider,
  http,
  useAccount,
  useConnect,
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

const config = createConfig({
  chains: [sepolia, mainnet, polygon, arbitrum, optimism, base],
  connectors: [injected()],
  transports,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15000,
      refetchOnWindowFocus: false,
    },
  },
});

function ConnectWalletPrompt() {
  const { connect, connectors, error } = useConnect();
  const { isConnected } = useAccount();

  if (isConnected) return null;

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <h2 className="mb-6 text-2xl font-semibold text-center">
        Please connect your wallet to continue
      </h2>
      <div className="flex flex-col gap-4 w-60">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={!connector.ready}
            className="rounded px-6 py-3 bg-blue-600 text-white text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connector.name}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 text-red-600 text-center">{error.message}</p>}
    </div>
  );
}

function AppContent() {
  const [showPopup, setShowPopup] = useState(true);
  const { isConnected } = useAccount();

  if (showPopup) {
    return <LandingPopup gifUrl={cupidGif} onComplete={() => setShowPopup(false)} />;
  }

  if (!isConnected) {
    return <ConnectWalletPrompt />;
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
