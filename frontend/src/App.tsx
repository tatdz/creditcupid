import React from 'react';
import { CreditDashboard } from './components/CreditDashboard';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';

// Real MetaMask configuration
const config = createConfig({
  chains: [sepolia, mainnet, polygon, arbitrum, optimism, base],
  connectors: [
    injected({
      target: 'metaMask', // Explicitly target MetaMask
      shimDisconnect: true,
    })
  ],
  transports: {
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo'),
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/demo'),
    [polygon.id]: http('https://polygon-mainnet.g.alchemy.com/v2/demo'),
    [arbitrum.id]: http('https://arb-mainnet.g.alchemy.com/v2/demo'),
    [optimism.id]: http('https://opt-mainnet.g.alchemy.com/v2/demo'),
    [base.id]: http('https://base-mainnet.g.alchemy.com/v2/demo'),
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <CreditDashboard />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;