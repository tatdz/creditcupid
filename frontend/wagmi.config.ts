// wagmi.config.ts
import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { injected, metaMask, safe } from 'wagmi/connectors';

export const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    injected(),
    metaMask(),
    safe(),
  ],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [mainnet.id]: http('https://eth.llamarpc.com'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}