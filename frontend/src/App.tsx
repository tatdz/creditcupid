import React from 'react';
import { CreditDashboard } from './components/credit-dashboard/CreditDashboard';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import { NotificationProvider, TransactionPopupProvider } from "@blockscout/app-sdk";

// RPC URLs using public endpoints
const rpcUrls = {
  [sepolia.id]: 'https://rpc.sepolia.org',
  [mainnet.id]: 'https://eth.llamarpc.com',
  [polygon.id]: 'https://polygon.llamarpc.com',
  [arbitrum.id]: 'https://arbitrum.llamarpc.com',
  [optimism.id]: 'https://optimism.llamarpc.com',
  [base.id]: 'https://base.llamarpc.com',
};

const config = createConfig({
  chains: [sepolia, mainnet, polygon, arbitrum, optimism, base],
  connectors: [
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    })
  ],
  transports: {
    [sepolia.id]: http(rpcUrls[sepolia.id]),
    [mainnet.id]: http(rpcUrls[mainnet.id]),
    [polygon.id]: http(rpcUrls[polygon.id]),
    [arbitrum.id]: http(rpcUrls[arbitrum.id]),
    [optimism.id]: http(rpcUrls[optimism.id]),
    [base.id]: http(rpcUrls[base.id]),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <TransactionPopupProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              <CreditDashboard />
            </div>
          </TransactionPopupProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


export default App;