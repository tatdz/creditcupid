# 😇 creditcupid 

**Zero-Knowledge Onchain Credit Oracle creating web3 credit identities with Dual Financial and Social Matchmaking — Find Trusted Partners for P2P Lending and Life.**


---

## 🚀 Problem We Solve

In today’s lonely Web3 world, over 17 million DeFi users transact openly onchain but struggle to find trustworthy, verified partners for love and finance.  
$4.2 trillion is locked in overcollateralized loans—wasting capital and hurting adoption. Meanwhile, scams like the Tinder Swindler have defrauded victims of over $100 million, showing how traditional dating apps fail to protect users.  
Users see wallet addresses and transactions but lack social trust mechanisms. Creditcupid solves this by merging zero-knowledge credit scores with a new social matchmaking experience—building genuine connections backed by financial credibility and cryptographic proofs.

---

## ✨ What is creditcupid?

- 🔄 **Cross-Chain Credit Oracle:** Aggregates your DeFi activity and verified Web2 income and identity into a dynamic, privacy-first credit score (300-850 that follows FICO scoring).   
- 💘 **Dual Matchmaking Experiences:**  
  - **Dating Flow:** Find life partners filtered by verified credit score, age, and gender—pseudonymous and privacy-first.  
  - **Finance Flow:** Discover trusted peers for undercollateralized peer-to-peer lending and borrowing opportunities.  
- 🔐 **Privacy-Preserving Verification:** **zero-knowledge proofs** confirm creditworthiness without leaking sensitive income, balance or transaction data. Only verification status is revealed
- 💰 **UnderCollateralized Lending:** Access loans starting at 85% collateral requirement based on your credit profile, eliminating the need to over-collateralize.

---

## 🎯 How It Works

1. **Connect & Analyze:** Connect your wallet. Creditcupid scans your onchain DeFi history (Ethereum, Polygon, Arbitrum, Optimism, Base, Sepolia) using Blockscout's SDK plus off-chain bank verification with Plaid that confirms income, KYC, transaction history and bank account balance.
2. **Match & Borrow:** Use separate, intuitive flows to find romantic or finance partners based purely on verified, privacy-protected credit identities.  
3. **Stay Private & Secure:** Your financial details remain confidential through **cryptographic commitments**—only verification results are accessible
---

## 🏗️ Architecture & Tech Stack

- **Smart Contracts:** Foundry, Solidity 0.8.23—minimal proof verification & lending logic on Sepolia.
  - **CreditScore:** [https://eth-sepolia.blockscout.com/address/0x246E504F0B17A36906C3A9E255dbe3b51D54BcA8](https://eth-sepolia.blockscout.com/address/0x246E504F0B17A36906C3A9E255dbe3b51D54BcA8)  
    Manages credit scores onchain and integrates with AI credit analysis for real-time updates.  
  - **P2PLending:** [https://eth-sepolia.blockscout.com/address/0x8F254C3A7858d05a9829391319821eC62d69ACa4?tab=index)  
    Handles ETH-based peer-to-peer lending using credit-based terms and undercollateralized logic.
- **Backend & API:** Node.js + TypeScript; Blockscout API & SDK integration, Plaid bank verification, zk proof services.  
- **Frontend:** React 18 + TypeScript, Vite, Wagmi & Viem for wallet interactions, Tailwind CSS + Shadcn/ui for UI.  
- **Privacy:** Poseidon zk-Hashing, zk-SNARK friendly cryptographic commitments, IPFS decentralized metadata storage, local proof generation ensuring zero user data is stored on servers.

---

## 🚀 Quick Start Guide

Prerequisites: Node.js v20+, Foundry, Sepolia ETH wallet
```bash
git clone https://github.com/tatdz/darma.git
cd darma

# Backend setup
cd backend
npm install
# Add .env configuration (Blockscout, Pinata, Plaid, RPC)
npm run dev

# Frontend setup
cd ../frontend
npm install
npm run dev

#### Environment Configuration
Backend (.env):

env
BLOCKSCOUT_API_KEY=your_blockscout_key
PINATA_JWT=your_pinata_jwt
# or use API key/secret
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_wallet_private_key

Frontend (.env):

env
VITE_PINATA_JWT=your_pinata_jwt
VITE_PINATA_API_KEY=your_api_key_here
VITE_PINATA_SECRET_KEY=your_secret_key_here

VITE_BLOCKSCOUT_API_KEY=your_blockscout_key
VITE_SEPOLIA_RPC_URL=your_alchemy_or_infura_url_here
VITE_ETHERSCAN_API_KEY=your_etherscan_api_key_here


