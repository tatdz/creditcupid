#!/usr/bin/env python3
"""
MeTTa Reasoning Engine for Darma Credit Assessment
Provides structured reasoning and knowledge graphs for credit decisions
"""

import asyncio
import json
from typing import Dict, List, Any, Optional
from metta_language import MeTTa, MeTTaRuntime

class MeTTaCreditReasoner:
    def __init__(self):
        self.metta = MeTTa()
        self.runtime = MeTTaRuntime()
        self.knowledge_base = self.initialize_knowledge_base()
        
    def initialize_knowledge_base(self) -> Dict[str, Any]:
        """Initialize MeTTa knowledge base with credit assessment rules"""
        
        credit_rules = """
        ; Credit Scoring Rules
        (= (credit-tier AA) (and (>= score 800) (>= chains 3) (>= repayment-ratio 0.9)))
        (= (credit-tier A+) (and (>= score 750) (>= chains 2) (>= repayment-ratio 0.8)))
        (= (credit-tier A) (>= score 700))
        (= (credit-tier B+) (>= score 650))
        (= (credit-tier B) (>= score 600))
        (= (credit-tier C) (>= score 550))
        (= (credit-tier D) (< score 550))
        
        ; Risk Assessment Rules
        (= (high-risk) (or 
            (< repayment-ratio 0.5)
            (> gas-usage 50)
            (> concentration 0.8)
            (< active-chains 1)))
            
        (= (medium-risk) (or
            (and (< repayment-ratio 0.7) (>= repayment-ratio 0.5))
            (and (> gas-usage 25) (<= gas-usage 50))
            (and (> concentration 0.6) (<= concentration 0.8))))
            
        (= (low-risk) (and
            (>= repayment-ratio 0.7)
            (<= gas-usage 25)
            (<= concentration 0.6)
            (>= active-chains 2)))
        
        ; Improvement Recommendations
        (= (recommendation diversify-assets) 
            (> concentration 0.7))
        (= (recommendation increase-repayments) 
            (< repayment-ratio 0.8))
        (= (recommendation expand-chains) 
            (< active-chains 2))
        (= (recommendation reduce-gas) 
            (> gas-usage 30))
        (= (recommendation build-history) 
            (< protocol-interactions 5))
        
        ; LTV Calculation Rules
        (= (max-ltv AA) 80)
        (= (max-ltv A+) 75)
        (= (max-ltv A) 70)
        (= (max-ltv B+) 65)
        (= (max-ltv B) 60)
        (= (max-ltv C) 55)
        (= (max-ltv D) 50)
        
        ; Interest Rate Rules
        (= (base-rate AA) 4.0)
        (= (base-rate A+) 5.0)
        (= (base-rate A) 6.0)
        (= (base-rate B+) 7.5)
        (= (base-rate B) 9.0)
        (= (base-rate C) 12.0)
        (= (base-rate D) 15.0)
        """
        
        return {
            "rules": credit_rules,
            "facts": {},
            "queries": {}
        }
    
    async def load_user_data(self, credit_data: Dict[str, Any]) -> None:
        """Load user credit data into MeTTa knowledge base"""
        
        facts = f"""
        ; User Credit Facts
        (= score {credit_data.get('creditScore', 300)})
        (= chains {len(credit_data.get('chains', []))})
        (= active-chains {len([c for c in credit_data.get('chains', []) if float(c.get('balance', 0)) > 0])})
        (= total-value {self.calculate_total_value(credit_data)})
        
        ; Protocol Interactions
        (= protocol-interactions {len(credit_data.get('protocolInteractions', []))})
        (= aave-interactions {len([i for i in credit_data.get('protocolInteractions', []) if i.get('protocol') == 'aave'])})
        (= morpho-interactions {len([i for i in credit_data.get('protocolInteractions', []) if i.get('protocol') == 'morpho'])})
        
        ; Risk Metrics
        (= repayment-ratio {self.calculate_repayment_ratio(credit_data)})
        (= gas-usage {self.calculate_gas_usage(credit_data)})
        (= concentration {self.calculate_concentration(credit_data)})
        
        ; Asset Diversity
        (= total-tokens {sum(len(chain.get('tokens', [])) for chain in credit_data.get('chains', []))})
        (= total-nfts {sum(len(chain.get('nfts', [])) for chain in credit_data.get('chains', []))})
        """
        
        self.knowledge_base["facts"] = facts
        full_kb = self.knowledge_base["rules"] + facts
        await self.metta.load_program(full_kb)
    
    def calculate_total_value(self, credit_data: Dict[str, Any]) -> float:
        """Calculate total portfolio value"""
        total = 0.0
        for chain in credit_data.get('chains', []):
            total += float(chain.get('balance', 0))
            for token in chain.get('tokens', []):
                total += token.get('valueUSD', 0)
        return total
    
    def calculate_repayment_ratio(self, credit_data: Dict[str, Any]) -> float:
        """Calculate repayment to borrowing ratio"""
        interactions = credit_data.get('protocolInteractions', [])
        repayments = len([i for i in interactions if i.get('type') == 'repay'])
        borrows = len([i for i in interactions if i.get('type') == 'borrow'])
        return repayments / max(borrows, 1)
    
    def calculate_gas_usage(self, credit_data: Dict[str, Any]) -> float:
        """Calculate total gas usage across chains"""
        total_gas = 0.0
        for chain in credit_data.get('chains', []):
            for tx in chain.get('transactions', []):
                total_gas += float(tx.get('gasUsed', 0))
        return total_gas
    
    def calculate_concentration(self, credit_data: Dict[str, Any]) -> float:
        """Calculate asset concentration risk"""
        max_concentration = 0.0
        for chain in credit_data.get('chains', []):
            tokens = chain.get('tokens', [])
            if tokens:
                total_value = sum(t.get('valueUSD', 0) for t in tokens)
                if total_value > 0:
                    max_token = max(tokens, key=lambda x: x.get('valueUSD', 0))
                    concentration = max_token.get('valueUSD', 0) / total_value
                    max_concentration = max(max_concentration, concentration)
        return max_concentration
    
    async def reason_credit_tier(self) -> str:
        """Use MeTTa to determine credit tier"""
        query = "(credit-tier $tier)"
        result = await self.metta.execute_query(query)
        
        if result and len(result) > 0:
            return str(result[0].get('tier', 'D'))
        return "D"
    
    async def assess_risk_level(self) -> str:
        """Use MeTTa to assess risk level"""
        queries = [
            "(high-risk)",
            "(medium-risk)", 
            "(low-risk)"
        ]
        
        for query in queries:
            result = await self.metta.execute_query(query)
            if result and len(result) > 0:
                if "high-risk" in query:
                    return "high"
                elif "medium-risk" in query:
                    return "medium"
                elif "low-risk" in query:
                    return "low"
        
        return "medium"
    
    async def generate_recommendations(self) -> List[str]:
        """Use MeTTa to generate personalized recommendations"""
        recommendation_types = [
            "diversify-assets",
            "increase-repayments", 
            "expand-chains",
            "reduce-gas",
            "build-history"
        ]
        
        recommendations = []
        for rec_type in recommendation_types:
            query = f"(recommendation {rec_type})"
            result = await self.metta.execute_query(query)
            if result and len(result) > 0:
                recommendations.append(self.format_recommendation(rec_type))
        
        return recommendations
    
    def format_recommendation(self, rec_type: str) -> str:
        """Format MeTTa recommendation into human-readable text"""
        formats = {
            "diversify-assets": "Diversify your asset holdings to reduce concentration risk",
            "increase-repayments": "Increase your repayment consistency across protocols",
            "expand-chains": "Expand your activity to multiple blockchain networks",
            "reduce-gas": "Optimize your transaction patterns to reduce gas spending",
            "build-history": "Build more protocol interaction history"
        }
        return formats.get(rec_type, "Continue building your credit history")
    
    async def calculate_max_ltv(self, tier: str) -> int:
        """Calculate maximum LTV based on credit tier"""
        query = f"(max-ltv {tier})"
        result = await self.metta.execute_query(query)
        if result and len(result) > 0:
            return int(result[0].get('value', 50))
        return 50
    
    async def calculate_interest_rate(self, tier: str, collateral_ratio: float) -> float:
        """Calculate dynamic interest rate using MeTTa reasoning"""
        base_query = f"(base-rate {tier})"
        base_result = await self.metta.execute_query(base_query)
        
        if base_result and len(base_result) > 0:
            base_rate = float(base_result[0].get('value', 8.0))
            
            # Adjust based on collateralization
            if collateral_ratio >= 2.0:  # 200%+ collateral
                return base_rate * 0.8  # 20% discount
            elif collateral_ratio <= 1.2:  # 120% collateral
                return base_rate * 1.2  # 20% premium
            
            return base_rate
        
        return 8.0  # Default rate
    
    async def generate_risk_report(self, credit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive risk report using MeTTa reasoning"""
        await self.load_user_data(credit_data)
        
        tier = await self.reason_credit_tier()
        risk_level = await self.assess_risk_level()
        recommendations = await self.generate_recommendations()
        max_ltv = await self.calculate_max_ltv(tier)
        
        return {
            "credit_tier": tier,
            "risk_level": risk_level,
            "recommendations": recommendations,
            "max_ltv": max_ltv,
            "reasoning_factors": {
                "portfolio_value": self.calculate_total_value(credit_data),
                "repayment_ratio": self.calculate_repayment_ratio(credit_data),
                "asset_concentration": self.calculate_concentration(credit_data),
                "cross_chain_activity": len([c for c in credit_data.get('chains', []) if float(c.get('balance', 0)) > 0]),
                "protocol_engagement": len(credit_data.get('protocolInteractions', []))
            }
        }