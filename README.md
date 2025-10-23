# 😇 creditcupid 

**Privacy-Preserving Onchain Credit Oracle creating web3 credit identities with Dual Financial and Social Matchmaking — Find Trusted Partners for P2P Lending and Life.**

---

## 🚀 Problem We Solve

In today’s lonely Web3 world, over 17 million DeFi users transact openly onchain but struggle to find trustworthy, verified partners for love and finance.  
$4.2 trillion is locked in overcollateralized loans—wasting capital and hurting adoption. Meanwhile, scams like the Tinder Swindler have defrauded victims of over $100 million, showing how traditional dating apps fail to protect users.  
Users see wallet addresses and transactions but lack social trust mechanisms. Creditcupid solves this by merging privacy-first credit scores with a new social matchmaking experience—building genuine connections backed by financial credibility and cryptographic proofs.

---

## ✨ What is creditcupid?

- 🔄 **Cross-Chain Credit Oracle:** Aggregates your DeFi activity and verified Web2 income and identity into a dynamic, privacy-first credit score (300-850 that follows FICO scoring).  
- 🤖 **AI-Powered Credit Analysis Agents:** Transparent credit score breakdowns and actionable recommendations verified by Blockscout MCP data—helping you improve your creditworthiness and attract better matches.  
- 💘 **Dual Matchmaking Experiences:**  
  - **Dating Flow:** Find life partners filtered by verified credit score, age, and gender—pseudonymous and privacy-first.  
  - **Finance Flow:** Discover trusted peers for undercollateralized peer-to-peer lending and borrowing opportunities.  
- 🔐 **Privacy-Preserving Verification:** Cryptographic proofs confirm creditworthiness without leaking sensitive data. Wallet addresses remain private by default, revealed only with consent.  
- 💰 **UnderCollateralized Lending:** Access loans starting at 85% collateral requirement based on your credit profile, eliminating the need to over-collateralize.

---

## 🎯 How It Works

1. **Connect & Analyze:** Connect your wallet. Creditcupid scans your onchain DeFi history (Ethereum, Polygon, Arbitrum, Optimism, Base, Sepolia) using Blockscout's SDK & MCP plus off-chain bank verification with Plaid that confirms income, KYC, transaction history and bank account balance.
2. **Get Score & Recommendations:** AI Agents analyze risks, explain your score and guide you to build better credit and social appeal.  
3. **Match & Borrow:** Use separate, intuitive flows to find romantic or finance partners based purely on verified, privacy-protected credit identities.  
4. **Stay Private & Secure:** Your financial details stay confidential. Wallets shown as pseudonyms with optional explorer links.

---

## 🏗️ Architecture & Tech Stack

- **Smart Contracts:** Foundry, Solidity 0.8.23—minimal proof verification & lending logic on Sepolia.
  - **CreditScore:** [https://eth-sepolia.blockscout.com/address/0x246E504F0B17A36906C3A9E255dbe3b51D54BcA8](https://eth-sepolia.blockscout.com/address/0x246E504F0B17A36906C3A9E255dbe3b51D54BcA8)  
    Manages credit scores onchain and integrates with AI credit analysis for real-time updates.  
  - **P2PLending:** [https://eth-sepolia.blockscout.com/address/0x8F254C3A7858d05a9829391319821eC62d69ACa4?tab=index)  
    Handles ETH-based peer-to-peer lending using credit-based terms and undercollateralized logic.
- **Backend & API:** Node.js + TypeScript; Blockscout MCP & API & SDK integration, Plaid bank verification, AI agent system, and privacy proof services.  
- **Frontend:** React 18 + TypeScript, Vite, Wagmi & Viem for wallet interactions, Tailwind CSS + Shadcn/ui for UI.  
- **AI Agents:** Fetch.ai uAgents employing MeTTa reasoning for credit insights.  
- **Privacy:** Cryptographic commitments, IPFS decentralized metadata storage, local proof generation ensuring zero user data is stored on servers.

---

## 🚀 Quick Start Guide

Prerequisites: Node.js v20+, Foundry, Python 3.10.9, Sepolia ETH wallet
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

# AI Agents setup
cd ../agents
# Setup python environment & dependencies
brew install pyenv
pyenv install 3.10.9
pyenv local 3.10.9

# Install OpenSSL and set environment variables
brew install openssl@3

# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
echo 'export GRPC_PYTHON_BUILD_SYSTEM_OPENSSL=1' >> ~/.bashrc
echo 'export GRPC_PYTHON_BUILD_SYSTEM_ZLIB=1' >> ~/.bashrc
echo 'export LDFLAGS="-L/opt/homebrew/opt/openssl@3/lib"' >> ~/.bashrc
echo 'export CPPFLAGS="-I/opt/homebrew/opt/openssl@3/include"' >> ~/.bashrc

# Reload your shell
source ~/.bashrc

# Upgrade pip and install dependencies
python3 -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Start the analyst agent first
python3 analyst.py

Important: Save the address output from analyst.py to use when running other agent files.

#### 5. Environment Configuration
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


