# 🪔 Darma

**On-Chain Credit Oracle & Under-Collateralized Lending Protocol**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity 0.8.23](https://img.shields.io/badge/Solidity-0.8.23-informational)](https://docs.soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FF6944)](https://getfoundry.sh)
[![React 18](https://img.shields.io/badge/Frontend-React%2018-61DAFB)](https://reactjs.org/)

## 🚀 Overview

Darma is a modular credit stack that bridges the $4.2T credit gap in DeFi. We provide a **real-time, cross-chain credit oracle**,an **AI-powered user risk scoring and an under-collateralized peer2peer lending platform**, enabling users to leverage their on-chain reputation for better loan terms across the ecosystem.

> **Stop Over-Collateralizing. Start Building Credit.**

### ✨ What is Darma?

- **🔄 Cross-Chain Credit Oracle:** Aggregates your DeFi activity across 10+ EVM chains into a single, dynamic credit score (300-850).
- **🤖 AI Agent Network:** Get personalized credit coaching and transparent risk auditing from intelligent agents powered by MeTTa reasoning.
- **🔐 zkTLS Identity Layer:** *[Future]* Privacy-preserving KYC and off-chain data attestations.
- **💰 Under-Collateralized Lending:** Access peer-to-peer loans at 50-80% LTV based on your credit score, not just your collateral.

### 🎯 How It Works

1.  **Connect & Analyze:** Connect your wallet. Darma scans your history across Ethereum, Polygon, Arbitrum, Optimism, Base, and Sepolia via the Blockscout MCP server.
2.  **Get Your Score:** Receive a real-time credit score and a breakdown from our AI Risk Auditor.
3.  **Consult & Improve:** Chat with the AI Credit Advisor to get actionable steps to improve your creditworthiness.
4.  **Borrow Better:** Enjoy enhanced terms on integrated protocols like Aave and Morpho, or access under-collateralized loans directly on Darma's P2P platform.

## 🏗️ Architecture & Tech Stack

Darma is built with a modular, full-stack approach:

### 📜 Smart Contracts (`/contracts`)
- **Framework:** Foundry
- **Language:** Solidity 0.8.23
- **Contracts:**
  - `DarmaCreditOracle.sol`: Core credit scoring logic integrated with Pyth Price Feeds.
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

### 🌐 Frontend DApp (`/frontend`)
- **Framework:** React 18 + TypeScript, Vite
- **Wallet Integration:** Wagmi + Viem
- **UI:** Tailwind CSS + Shadcn/ui
- **Animations:** Framer Motion

### 🧠 AI Agent System (`/agents`)
- **Framework:** Fetch.ai uAgents
- **Reasoning Engine:** MeTTa for formal credit logic
- **Chat Protocol:** ASI:One
- **Deployment:** Fetch.ai Agentverse
- **Agents:**
  - `Credit Advisor`: Provides personalized improvement guidance.
  - `Risk Auditor`: Explains scoring factors and risk.
  - `Protocol Analyst`: Analyzes DeFi protocol interactions.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Foundry
- Python 3.9+
- A wallet with Sepolia testnet ETH

### Installation & Local Development
