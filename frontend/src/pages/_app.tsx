import React from 'react';
import type { AppProps } from 'next/app';
import {
  createConfig,
  WagmiProvider,
  http,
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
import '../styles/globals.css';

// Dynamic import with SSR disabled for Blockscout providers
const BlockscoutProviders = dynamic(
  () => import('../components/BlockscoutProviders').then(mod => ({ default: mod.BlockscoutProviders })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-4">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    )
  }
);

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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BlockscoutProviders>
          <Component {...pageProps} />
        </BlockscoutProviders>
      </QueryClientProvider>
    </WagmiProvider>
  );
}