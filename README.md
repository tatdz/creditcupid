# 😇 CreditCupid

**Privacy-Preserving On-Chain Credit Oracle with Dual Financial and Social Matchmaking — Find Trusted Partners for P2P Lending and Life.**

---

## 🚀 Problem We Solve

In today’s lonely Web3 world, over 17 million DeFi users transact openly on-chain but struggle to find trustworthy, verified partners for love and finance.  
$4.2 trillion is locked in overcollateralized loans—wasting capital and hurting adoption. Meanwhile, scams like the Tinder Swindler have defrauded victims of over $100 million, showing how traditional dating apps fail to protect users.  
Users see wallet addresses and transactions but lack social trust mechanisms. CreditCupid solves this by merging privacy-first credit scores with a new social matchmaking experience—building genuine connections backed by financial credibility and cryptographic proofs.

---

## ✨ What is CreditCupid?

- 🔄 **Cross-Chain Credit Oracle:** Aggregates your DeFi activity and verified Web2 income and identity into a dynamic, privacy-first credit score (300-850).  
- 🤖 **AI-Powered Credit Analysis Agents:** Transparent credit score breakdowns and actionable recommendations verified by Blockscout MCP data—helping you improve your creditworthiness and attract better matches.  
- 💘 **Dual Matchmaking Experiences:**  
  - **Dating Flow:** Find life partners filtered by verified credit score, age, and gender—pseudonymous and privacy-first.  
  - **Finance Flow:** Discover trusted peers for undercollateralized peer-to-peer lending and borrowing opportunities.  
- 🔐 **Privacy-Preserving Verification:** Cryptographic proofs confirm creditworthiness without leaking sensitive data. Wallet addresses remain private by default, revealed only with consent.  
- 💰 **UnderCollateralized Lending:** Access loans at 60-80% LTV based on your credit profile, eliminating the need to over-collateralize.

---

## 🎯 How It Works

1. **Connect & Analyze:** Connect your wallet. CreditCupid scans your on-chain DeFi history (Ethereum, Polygon, Arbitrum, Optimism, Base, Sepolia) plus off-chain bank verification with Plaid.  
2. **Get Score & Recommendations:** AI Agents analyze risks, explain your score, and guide you to build better credit and social appeal.  
3. **Match & Borrow:** Use separate, intuitive flows to find romantic or finance partners based purely on verified, privacy-protected credit identities.  
4. **Stay Private & Secure:** Your financial details stay confidential. Wallets shown as pseudonyms with optional explorer links.

---

## 🏗️ Architecture & Tech Stack

- **Smart Contracts:** Foundry, Solidity 0.8.23—minimal proof verification & lending logic on Sepolia.  
- **Backend & API:** Node.js + TypeScript; Blockscout MCP integration, Plaid bank verification, AI agent system, and privacy proof services.  
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
python3 analyst.py


