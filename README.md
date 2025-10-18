# 🪔 Darma

**Onchain Credit Oracle & Undercollateralized Lending Protocol**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity 0.8.23](https://img.shields.io/badge/Solidity-0.8.23-informational)](https://docs.soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FF6944)](https://getfoundry.sh)
[![React 18](https://img.shields.io/badge/Frontend-React%2018-61DAFB)](https://reactjs.org/)

## 🚀 Overview

Darma is a modular credit stack that bridges the $4.2T credit gap in DeFi. We provide a **real-time, cross-chain credit oracle**, **AI-powered user risk scoring**, and an **undercollateralized peer-to-peer lending platform**, enabling users to leverage their on-chain reputation for better loan terms across the ecosystem.

> **Stop Over-Collateralizing. Start Building Credit.**

### ✨ What is Darma?

- **🔄 Cross-Chain Credit Oracle:** Aggregates your DeFi activity across EVM chains into a single, dynamic credit score (300-850). Non-EVM chains are planned.
- **🤖 AI Agent Network:** Get personalized credit coaching and transparent risk auditing from intelligent agents powered by MeTTa reasoning.
- **🔐 Privacy-Preserving Verification:** Secure cryptographic verification of financial health without exposing sensitive data.
- **💰 Undercollateralized Lending:** Access peer-to-peer loans at 50-80% LTV based on your credit score, not just your collateral.

### 🎯 How It Works

1.  **Connect & Analyze:** Connect your wallet. Darma scans your history across Ethereum, Polygon, Arbitrum, Optimism, Base, and Sepolia via the Blockscout MCP server.
2.  **Get Your Score:** Receive a real-time credit score and a breakdown from our AI Risk Auditor.
3.  **Consult & Improve:** Chat with the AI Credit Advisor to get actionable steps to improve your creditworthiness.
4.  **Borrow Better:** Enjoy enhanced terms on integrated protocols like Aave and Morpho, or access undercollateralized loans directly on Darma's P2P platform.

## 🏗️ Architecture & Tech Stack

Darma is built with a modular, full-stack approach:

### 📜 Smart Contracts (`/contracts`)
- **Framework:** Foundry
- **Language:** Solidity 0.8.23
- **Contracts:**
  - `UnderCollateralizedLending.sol`: Main P2P lending logic.
  - `DarmaP2PLending.sol`: Manages loan lifecycle and IPFS metadata.

### 🖥️ Backend & API (`/backend`)
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Key Services:**
  - `Blockscout MCP Client`: Fetches cross-chain transaction data.
  - `Aave/Morpho Integrations`: Interacts with real protocol contracts on Sepolia.
  - `EnhancedProtocolService`: Executes real transactions and simulates improved terms.
  - `IPFSService`: Stores loan metadata on decentralized storage.
  - `PrivacyProofService`: Generates cryptographic verification proofs for financial data.

### 🌐 Frontend DApp (`/frontend`)
- **Framework:** React 18 + TypeScript, Vite
- **Wallet Integration:** Wagmi + Viem
- **UI:** Tailwind CSS + Shadcn/ui
- **Animations:** Framer Motion
- **Key Features:**
  - Real-time credit score dashboard
  - Privacy-preserving bank verification via Plaid
  - Cryptographic proof generation and IPFS storage
  - AI agent chat interface

### 🧠 AI Agent System (`/agents`)
- **Framework:** Fetch.ai uAgents
- **Reasoning Engine:** MeTTa for formal credit logic
- **Chat Protocol:** ASI:One
- **Deployment:** Fetch.ai Agentverse
- **Agents:**
  - `Credit Advisor`: Provides personalized improvement guidance.
  - `Risk Auditor`: Explains scoring factors and risk.
  - `Protocol Analyst`: Analyzes DeFi protocol interactions.

## 🔐 Privacy & Security Features

### Privacy-Preserving Financial Verification
- **Cryptographic Commitments:** Bank data verification without exposing sensitive information
- **IPFS Storage:** All verification records stored on decentralized storage
- **Local Proof Generation:** Financial health proofs generated client-side
- **Zero Data Exposure:** No sensitive financial data stored on our servers

### Verification Types
- ✅ Income stability verification
- ✅ Minimum balance requirements  
- ✅ Transaction history activity
- ✅ Identity verification
- ✅ Real IPFS storage via Pinata

## 🚀 Quick Start

### Prerequisites
- Node.js (v20+)
- Foundry
- Python 3.10.9 (for agents)
- A wallet with Sepolia testnet ETH and relevant tokens (USDC, etc.)

### Installation & Local Development
```bash
#### 1. Clone repository
```bash
git clone github.com/tatdz/darma
cd darma

#### 2. Backend setup
cd backend
npm install
# Add credentials in .env files following .env.example.txt
npm run dev

#### 3. Frontend setup
cd frontend
npm install
npm run dev

#### 4. Agents setup
cd agents

# Install Python 3.10.9 (using pyenv recommended)
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
VITE_BLOCKSCOUT_API_KEY=your_blockscout_key
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
