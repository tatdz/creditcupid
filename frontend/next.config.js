/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: {
    sepoliaRpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    etherscanApiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
  },
};

module.exports = nextConfig;