#!/usr/bin/env python3
"""
Sandbox Runner for Darma Protocol Testing
Creates simulated Aave/Morpho interactions on testnets
"""

import asyncio
import json
import requests
from web3 import Web3
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

load_dotenv()

class SandboxRunner:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(os.getenv('SEPOLIA_RPC_URL')))
        self.test_wallets = self.load_test_wallets()
        
    def load_test_wallets(self) -> Dict[str, Any]:
        """Load test wallet configurations"""
        try:
            with open('sandbox/test-wallets.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                "wallets": [
                    {
                        "address": "0x...",
                        "private_key": "...",
                        "description": "Test wallet with Aave history"
                    }
                ]
            }
    
    async def run_aave_simulations(self):
        """Run Aave protocol simulations"""
        print("Starting Aave protocol simulations...")
        
        # This would interact with real Aave contracts on Sepolia
        # For demo purposes, we'll simulate the interactions
        
        simulations = [
            {
                "protocol": "aave",
                "action": "supply",
                "asset": "USDC",
                "amount": 1000,
                "chain": "sepolia"
            },
            {
                "protocol": "aave", 
                "action": "borrow",
                "asset": "DAI",
                "amount": 500,
                "chain": "sepolia"
            },
            {
                "protocol": "aave",
                "action": "repay", 
                "asset": "DAI",
                "amount": 200,
                "chain": "sepolia"
            }
        ]
        
        for sim in simulations:
            print(f"Simulating {sim['action']} {sim['amount']} {sim['asset']} on Aave...")
            await asyncio.sleep(1)  # Simulate network delay
        
        print("Aave simulations completed!")
    
    async def run_morpho_simulations(self):
        """Run Morpho protocol simulations"""
        print("Starting Morpho protocol simulations...")
        
        simulations = [
            {
                "protocol": "morpho",
                "action": "supply",
                "asset": "WETH", 
                "amount": 0.5,
                "chain": "sepolia"
            },
            {
                "protocol": "morpho",
                "action": "borrow",
                "asset": "USDC",
                "amount": 300,
                "chain": "sepolia"
            }
        ]
        
        for sim in simulations:
            print(f"Simulating {sim['action']} {sim['amount']} {sim['asset']} on Morpho...")
            await asyncio.sleep(1)
        
        print("Morpho simulations completed!")
    
    async def test_credit_scoring(self, wallet_address: str):
        """Test credit scoring with simulated activity"""
        print(f"Testing credit scoring for {wallet_address}...")
        
        # Call Darma backend to get credit score
        try:
            response = requests.get(f"http://localhost:3001/api/credit-data/{wallet_address}")
            if response.status_code == 200:
                data = response.json()
                score = data.get('creditScore', 0)
                recommendations = data.get('recommendations', [])
                
                print(f"Credit Score: {score}")
                print("Recommendations:")
                for rec in recommendations:
                    print(f"  - {rec}")
            else:
                print(f"Error fetching credit data: {response.status_code}")
        except Exception as e:
            print(f"Error testing credit scoring: {e}")
    
    async def run_full_test_suite(self):
        """Run complete test suite"""
        print("🚀 Starting Darma Sandbox Test Suite...\n")
        
        # Run protocol simulations
        await self.run_aave_simulations()
        print()
        await self.run_morpho_simulations()
        print()
        
        # Test with sample wallet
        sample_wallet = self.test_wallets["wallets"][0]["address"]
        await self.test_credit_scoring(sample_wallet)
        print()
        
        print("✅ Sandbox test suite completed!")
        print("\nNext steps:")
        print("1. Check the frontend at http://localhost:3000")
        print("2. Connect your wallet to see real credit data")
        print("3. Chat with the Credit Advisor and Risk Auditor agents")
        print("4. Explore under-collateralized lending opportunities")

async def main():
    sandbox = SandboxRunner()
    await sandbox.run_full_test_suite()

if __name__ == "__main__":
    asyncio.run(main())