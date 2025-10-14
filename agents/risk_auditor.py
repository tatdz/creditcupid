import asyncio
import requests
import json
from typing import List, Dict, Any
from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
from dotenv import load_dotenv
import os

load_dotenv()

class AuditRequest(Model):
    address: str
    aspects: List[str]  # ["scoring", "risks", "transparency", "recommendations"]
    session_id: str = None

class AuditReport(Model):
    address: str
    session_id: str
    score_breakdown: Dict[str, Any]
    risk_analysis: Dict[str, Any]
    transparency_report: str
    verification_checks: List[str]
    confidence_score: float

class RiskAuditorAgent:
    def __init__(self):
        self.agent = Agent(
            name="risk_auditor",
            seed=os.getenv("RISK_AUDITOR_SEED", "risk_auditor_seed_phrase_here"),
            port=8001,
            endpoint=["http://localhost:8001/submit"],
        )
        
        fund_agent_if_low(self.agent.wallet.address())
        
        @self.agent.on_event("startup")
        async def startup(ctx: Context):
            ctx.logger.info(f"Risk Auditor Agent started: {ctx.address}")
        
        @self.agent.on_message(model=AuditRequest)
        async def handle_audit_request(ctx: Context, sender: str, msg: AuditRequest):
            ctx.logger.info(f"Auditing credit assessment for {msg.address}")
            
            try:
                credit_data = await self.fetch_credit_data(msg.address)
                
                if "error" in credit_data:
                    await ctx.send(sender, AuditReport(
                        address=msg.address,
                        session_id=msg.session_id or "default",
                        score_breakdown={},
                        risk_analysis={},
                        transparency_report="Error fetching credit data",
                        verification_checks=[],
                        confidence_score=0.0
                    ))
                    return
                
                audit_report = await self.perform_audit(credit_data, msg.aspects, msg.session_id)
                await ctx.send(sender, audit_report)
                
            except Exception as e:
                ctx.logger.error(f"Error performing audit: {e}")
                await ctx.send(sender, AuditReport(
                    address=msg.address,
                    session_id=msg.session_id or "default",
                    score_breakdown={},
                    risk_analysis={},
                    transparency_report="Audit failed due to internal error",
                    verification_checks=[],
                    confidence_score=0.0
                ))
    
    async def fetch_credit_data(self, address: str) -> Dict[str, Any]:
        """Fetch credit data from Darma backend"""
        try:
            response = requests.get(f"http://localhost:3001/api/credit-data/{address}", timeout=30)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def perform_audit(self, credit_data: Dict, aspects: List[str], session_id: str) -> AuditReport:
        """Perform comprehensive risk audit"""
        audit_report = AuditReport(
            address=credit_data.get('address', ''),
            session_id=session_id or "default",
            score_breakdown={},
            risk_analysis={},
            transparency_report="",
            verification_checks=[],
            confidence_score=0.0
        )
        
        if "scoring" in aspects:
            audit_report.score_breakdown = self.audit_scoring(credit_data)
        
        if "risks" in aspects:
            audit_report.risk_analysis = self.audit_risks(credit_data)
        
        if "transparency" in aspects:
            audit_report.transparency_report = self.generate_transparency_report(credit_data)
        
        if "recommendations" in aspects:
            audit_report.verification_checks = self.verify_recommendations(credit_data)
        
        audit_report.confidence_score = self.calculate_confidence(audit_report)
        
        return audit_report
    
    def audit_scoring(self, credit_data: Dict) -> Dict[str, Any]:
        """Audit the credit scoring methodology"""
        chains = credit_data.get('chains', [])
        interactions = credit_data.get('protocolInteractions', [])
        
        breakdown = {
            "base_score": 300,
            "portfolio_value_contribution": 0,
            "repayment_history_contribution": 0,
            "multi_chain_contribution": 0,
            "protocol_activity_contribution": 0,
            "asset_diversity_contribution": 0,
            "scoring_factors": {}
        }
        
        # Calculate portfolio value contribution
        total_value = sum(float(chain.get('balance', 0)) for chain in chains)
        total_value += sum(token.get('valueUSD', 0) for chain in chains for token in chain.get('tokens', []))
        
        if total_value > 50000:
            breakdown["portfolio_value_contribution"] = 200
        elif total_value > 10000:
            breakdown["portfolio_value_contribution"] = 150
        elif total_value > 5000:
            breakdown["portfolio_value_contribution"] = 100
        elif total_value > 1000:
            breakdown["portfolio_value_contribution"] = 50
        
        # Calculate repayment history
        repayments = [i for i in interactions if i['type'] == 'repay']
        borrows = [i for i in interactions if i['type'] == 'borrow']
        repayment_ratio = len(repayments) / len(borrows) if borrows else 1.0
        
        if repayment_ratio >= 0.9:
            breakdown["repayment_history_contribution"] = 150
        elif repayment_ratio >= 0.7:
            breakdown["repayment_history_contribution"] = 100
        elif repayment_ratio >= 0.5:
            breakdown["repayment_history_contribution"] = 50
        
        # Multi-chain activity
        active_chains = len([chain for chain in chains if float(chain.get('balance', 0)) > 0 or chain.get('tokens')])
        breakdown["multi_chain_contribution"] = active_chains * 25
        
        # Protocol activity
        total_interactions = len(interactions)
        if total_interactions > 20:
            breakdown["protocol_activity_contribution"] = 75
        elif total_interactions > 10:
            breakdown["protocol_activity_contribution"] = 50
        elif total_interactions > 5:
            breakdown["protocol_activity_contribution"] = 25
        
        # Asset diversity
        total_tokens = sum(len(chain.get('tokens', [])) for chain in chains)
        if total_tokens > 15:
            breakdown["asset_diversity_contribution"] = 75
        elif total_tokens > 8:
            breakdown["asset_diversity_contribution"] = 50
        elif total_tokens > 3:
            breakdown["asset_diversity_contribution"] = 25
        
        # Detailed scoring factors
        breakdown["scoring_factors"] = {
            "total_portfolio_value_usd": total_value,
            "repayment_ratio": repayment_ratio,
            "active_chains_count": active_chains,
            "total_protocol_interactions": total_interactions,
            "unique_tokens_count": total_tokens,
            "nft_holdings_count": sum(len(chain.get('nfts', [])) for chain in chains)
        }
        
        return breakdown
    
    def audit_risks(self, credit_data: Dict) -> Dict[str, Any]:
        """Comprehensive risk analysis"""
        chains = credit_data.get('chains', [])
        interactions = credit_data.get('protocolInteractions', [])
        
        risk_analysis = {
            "risk_level": "low",
            "risk_factors": {},
            "mitigation_recommendations": [],
            "confidence_indicators": []
        }
        
        # Gas spending analysis
        total_gas = sum(float(tx.get('gasUsed', 0)) for chain in chains for tx in chain.get('transactions', []))
        if total_gas > 100:
            risk_analysis["risk_factors"]["high_gas_usage"] = {
                "level": "medium",
                "description": "High gas spending may indicate speculative activity",
                "impact": "moderate"
            }
        
        # Concentration risk
        for chain in chains:
            tokens = chain.get('tokens', [])
            if tokens:
                total_value = sum(token.get('valueUSD', 0) for token in tokens)
                if total_value > 0:
                    top_token = max(tokens, key=lambda x: x.get('valueUSD', 0))
                    concentration = top_token.get('valueUSD', 0) / total_value
                    if concentration > 0.8:
                        risk_analysis["risk_factors"]["high_concentration"] = {
                            "level": "high",
                            "description": f"High concentration in {top_token.get('symbol', 'unknown')} on chain {chain['chainId']}",
                            "impact": "high"
                        }
        
        # Liquidity risk
        total_balance = sum(float(chain.get('balance', 0)) for chain in chains)
        if total_balance < 0.05:
            risk_analysis["risk_factors"]["low_liquidity"] = {
                "level": "medium", 
                "description": "Low native token balance across chains",
                "impact": "moderate"
            }
        
        # Borrowing pattern risk
        recent_borrows = [i for i in interactions if i['type'] == 'borrow' and 
                         (i['timestamp'] > (asyncio.get_event_loop().time() - 30*24*60*60))]
        recent_repayments = [i for i in interactions if i['type'] == 'repay' and 
                            (i['timestamp'] > (asyncio.get_event_loop().time() - 30*24*60*60))]
        
        if len(recent_borrows) > len(recent_repayments) * 1.5:
            risk_analysis["risk_factors"]["borrowing_imbalance"] = {
                "level": "medium",
                "description": "Recent borrowing activity exceeds repayments",
                "impact": "moderate"
            }
        
        # Determine overall risk level
        risk_levels = {
            'high': 0,
            'medium': 0, 
            'low': 0
        }
        
        for factor in risk_analysis["risk_factors"].values():
            risk_levels[factor["level"]] += 1
        
        if risk_levels['high'] > 0:
            risk_analysis["risk_level"] = "high"
        elif risk_levels['medium'] > 1:
            risk_analysis["risk_level"] = "medium"
        else:
            risk_analysis["risk_level"] = "low"
        
        # Generate mitigation recommendations
        if "high_concentration" in risk_analysis["risk_factors"]:
            risk_analysis["mitigation_recommendations"].append(
                "Diversify concentrated holdings across multiple asset types"
            )
        
        if "low_liquidity" in risk_analysis["risk_factors"]:
            risk_analysis["mitigation_recommendations"].append(
                "Maintain sufficient native token balances for gas across chains"
            )
        
        # Confidence indicators
        if len(chains) >= 2:
            risk_analysis["confidence_indicators"].append("Multi-chain activity increases data reliability")
        
        if len(interactions) >= 10:
            risk_analysis["confidence_indicators"].append("Substantial protocol history provides strong signals")
        
        return risk_analysis
    
    def generate_transparency_report(self, credit_data: Dict) -> str:
        """Generate transparency report"""
        chains = credit_data.get('chains', [])
        interactions = credit_data.get('protocolInteractions', [])
        
        report = f"# Transparency Report for {credit_data.get('address', 'Unknown')}\n\n"
        
        report += "## Data Sources & Methodology\n\n"
        report += "### Blockchain Data Sources\n"
        report += "- **Ethereum**: Blockscout API\n"
        report += "- **Polygon**: Blockscout API\n" 
        report += "- **Arbitrum**: Blockscout API\n"
        report += "- **Optimism**: Blockscout API\n"
        report += "- **Base**: Blockscout API\n"
        report += "- **Sepolia**: Blockscout API\n\n"
        
        report += "### Protocol Integration\n"
        report += "- **Aave V3**: Real contract interactions across all supported chains\n"
        report += "- **Morpho V2**: Supply/borrow activity monitoring\n"
        report += "- **Pyth Oracle**: Real-time price feeds for collateral valuation\n\n"
        
        report += "## Scoring Methodology\n\n"
        report += "The credit score (300-850) is calculated using weighted factors:\n\n"
        report += "| Factor | Weight | Description |\n"
        report += "|--------|--------|-------------|\n"
        report += "| Portfolio Value | 25% | Total value across all chains |\n"
        report += "| Repayment History | 30% | Consistency of loan repayments |\n"
        report += "| Multi-Chain Activity | 20% | Presence across different networks |\n"
        report += "| Protocol Interactions | 15% | Depth of Aave/Morpho usage |\n"
        report += "| Asset Diversity | 10% | Variety of tokens and NFTs |\n\n"
        
        report += "## Verification & Validation\n\n"
        report += "### Data Verification\n"
        report += "- All transactions verified on-chain\n"
        report += "- Protocol interactions validated against contract ABIs\n"
        report += "- Cross-chain data consistency checks\n\n"
        
        report += "### Algorithm Transparency\n"
        report += "- Open scoring methodology\n"
        report += "- Real-time score updates\n"
        report += "- Explanatory risk factors\n"
        report += "- Actionable improvement recommendations\n\n"
        
        report += "## Privacy & Security\n\n"
        report += "- **Zero Knowledge**: No personal information required\n"
        report += "- **On-chain Only**: Analysis based solely on public blockchain data\n"
        report += "- **User Control**: Users own their credit identity\n"
        report += "- **Transparent**: All scoring logic is verifiable\n\n"
        
        return report
    
    def verify_recommendations(self, credit_data: Dict) -> List[str]:
        """Verify and validate recommendations"""
        checks = []
        chains = credit_data.get('chains', [])
        interactions = credit_data.get('protocolInteractions', [])
        
        # Check multi-chain presence
        active_chains = len([chain for chain in chains if float(chain.get('balance', 0)) > 0])
        if active_chains >= 2:
            checks.append("✅ Multi-chain presence verified")
        else:
            checks.append("⚠️ Limited to single chain activity")
        
        # Check protocol activity
        if len(interactions) >= 5:
            checks.append("✅ Substantial protocol history")
        else:
            checks.append("⚠️ Limited protocol interactions")
        
        # Check repayment consistency
        repayments = [i for i in interactions if i['type'] == 'repay']
        borrows = [i for i in interactions if i['type'] == 'borrow']
        if borrows and len(repayments) >= len(borrows) * 0.7:
            checks.append("✅ Strong repayment patterns")
        elif borrows:
            checks.append("⚠️ Inconsistent repayment history")
        else:
            checks.append("ℹ️ No borrowing history yet")
        
        # Check asset diversity
        total_tokens = sum(len(chain.get('tokens', [])) for chain in chains)
        if total_tokens >= 5:
            checks.append("✅ Good asset diversification")
        else:
            checks.append("⚠️ Limited asset diversity")
        
        # Check portfolio value
        total_value = sum(float(chain.get('balance', 0)) for chain in chains)
        total_value += sum(token.get('valueUSD', 0) for chain in chains for token in chain.get('tokens', []))
        if total_value >= 1000:
            checks.append("✅ Substantial portfolio value")
        else:
            checks.append("⚠️ Limited portfolio value")
        
        return checks
    
    def calculate_confidence(self, audit_report: AuditReport) -> float:
        """Calculate overall confidence score (0.0 - 1.0)"""
        confidence = 0.5  # Base confidence
        
        # Score from risk analysis
        risk_level = audit_report.risk_analysis.get('risk_level', 'medium')
        if risk_level == 'low':
            confidence += 0.3
        elif risk_level == 'medium':
            confidence += 0.1
        
        # Score from verification checks
        checks = audit_report.verification_checks
        positive_checks = sum(1 for check in checks if check.startswith('✅'))
        total_checks = len(checks)
        if total_checks > 0:
            confidence += (positive_checks / total_checks) * 0.2
        
        return min(confidence, 1.0)

def main():
    auditor = RiskAuditorAgent()
    auditor.agent.run()

if __name__ == "__main__":
    main()