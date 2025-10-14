#!/usr/bin/env python3
"""
Enhanced Credit Advisor Agent with MeTTa Reasoning and ASI:One Integration
"""

import asyncio
import requests
import json
from typing import List, Dict, Any
from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
from dotenv import load_dotenv
import os

from metta_reasoner import MeTTaCreditReasoner
from asi_protocol import ASIProtocolClient

load_dotenv()

class CreditQuery(Model):
    address: str
    question: str
    session_id: str = None
    conversation_id: str = None

class CreditAdvice(Model):
    address: str
    session_id: str
    conversation_id: str
    score: int
    credit_tier: str
    risk_level: str
    recommendations: List[str]
    risk_factors: List[str]
    answer: str
    actionable_steps: List[str]
    metta_reasoning: Dict[str, Any]
    asi_consultation: Dict[str, Any] = None

class EnhancedCreditAdvisorAgent:
    def __init__(self):
        self.agent = Agent(
            name="enhanced_credit_advisor",
            seed=os.getenv("CREDIT_ADVISOR_SEED", "enhanced_credit_advisor_seed_here"),
            port=8000,
            endpoint=["http://localhost:8000/submit"],
        )
        
        self.metta_reasoner = MeTTaCreditReasoner()
        self.asi_client = ASIProtocolClient(
            agent_id="darma_credit_advisor",
            api_key=os.getenv("ASI_API_KEY", "demo_key"),
            base_url=os.getenv("ASI_BASE_URL", "https://api.asi.one")
        )
        
        # Fund agent for development
        fund_agent_if_low(self.agent.wallet.address())
        
        @self.agent.on_event("startup")
        async def startup(ctx: Context):
            ctx.logger.info(f"Enhanced Credit Advisor Agent started: {ctx.address}")
            ctx.logger.info("MeTTa Reasoner and ASI:One Protocol initialized")
        
        @self.agent.on_message(model=CreditQuery)
        async def handle_credit_query(ctx: Context, sender: str, msg: CreditQuery):
            ctx.logger.info(f"Received enhanced credit query for {msg.address}")
            
            try:
                # Fetch credit data from backend
                credit_data = await self.fetch_credit_data(msg.address)
                
                if "error" in credit_data:
                    await ctx.send(sender, CreditAdvice(
                        address=msg.address,
                        session_id=msg.session_id or "default",
                        conversation_id=msg.conversation_id or "",
                        score=0,
                        credit_tier="Unknown",
                        risk_level="Unknown",
                        recommendations=[],
                        risk_factors=[],
                        answer="Sorry, I couldn't fetch your credit data. Please try again later.",
                        actionable_steps=[],
                        metta_reasoning={}
                    ))
                    return
                
                # Generate enhanced advice with MeTTa and ASI:One
                advice = await self.generate_enhanced_advice(credit_data, msg.question, msg.session_id, msg.conversation_id)
                
                # Send response back
                await ctx.send(sender, advice)
                
            except Exception as e:
                ctx.logger.error(f"Error processing enhanced credit query: {e}")
                await ctx.send(sender, CreditAdvice(
                    address=msg.address,
                    session_id=msg.session_id or "default",
                    conversation_id=msg.conversation_id or "",
                    score=0,
                    credit_tier="Unknown",
                    risk_level="Unknown",
                    recommendations=[],
                    risk_factors=[],
                    answer="I encountered an error while processing your request. Please try again.",
                    actionable_steps=[],
                    metta_reasoning={}
                ))
    
    async def fetch_credit_data(self, address: str) -> Dict[str, Any]:
        """Fetch credit data from Darma backend"""
        try:
            response = requests.get(f"http://localhost:3001/api/credit-data/{address}", timeout=30)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def generate_enhanced_advice(self, credit_data: Dict, question: str, session_id: str, conversation_id: str) -> CreditAdvice:
        """Generate enhanced credit advice using MeTTa and ASI:One"""
        
        # MeTTa Reasoning
        metta_report = await self.metta_reasoner.generate_risk_report(credit_data)
        
        # ASI:One Consultation for complex queries
        asi_consultation = None
        if self.is_complex_query(question):
            async with self.asi_client as client:
                asi_consultation = await client.multi_agent_consultation(
                    credit_data.get('address', 'unknown'),
                    question,
                    credit_data
                )
        
        # Generate answer using ASI:One or fallback
        answer = await self.generate_answer(question, credit_data, metta_report, asi_consultation, conversation_id)
        
        return CreditAdvice(
            address=credit_data.get('address', ''),
            session_id=session_id or "default",
            conversation_id=conversation_id or "",
            score=credit_data.get('creditScore', 300),
            credit_tier=metta_report.get('credit_tier', 'D'),
            risk_level=metta_report.get('risk_level', 'medium'),
            recommendations=metta_report.get('recommendations', []),
            risk_factors=credit_data.get('riskFactors', []),
            answer=answer,
            actionable_steps=self.generate_actionable_steps(metta_report, credit_data),
            metta_reasoning=metta_report.get('reasoning_factors', {}),
            asi_consultation=asi_consultation
        )
    
    def is_complex_query(self, question: str) -> bool:
        """Determine if query requires multi-agent consultation"""
        complex_keywords = [
            'complex', 'multiple', 'contradictory', 'conflicting', 
            'synthesize', 'comprehensive', 'detailed analysis'
        ]
        return any(keyword in question.lower() for keyword in complex_keywords)
    
    async def generate_answer(self, question: str, credit_data: Dict, metta_report: Dict, asi_consultation: Dict, conversation_id: str) -> str:
        """Generate answer using ASI:One or fallback logic"""
        
        # Use ASI:One for natural language generation
        try:
            async with self.asi_client as client:
                if not conversation_id:
                    conversation_id = await client.start_conversation(
                        credit_data.get('address', 'user'),
                        {
                            "credit_data": credit_data,
                            "metta_report": metta_report,
                            "agent_type": "credit_advisor"
                        }
                    )
                
                answer = await client.get_agent_response(conversation_id, question)
                return answer
                
        except Exception as e:
            # Fallback to rule-based answer generation
            ctx.logger.warning(f"ASI:One unavailable, using fallback: {e}")
            return self.fallback_answer_generation(question, credit_data, metta_report)
    
    def fallback_answer_generation(self, question: str, credit_data: Dict, metta_report: Dict) -> str:
        """Fallback answer generation without ASI:One"""
        question_lower = question.lower()
        score = credit_data.get('creditScore', 300)
        tier = metta_report.get('credit_tier', 'D')
        
        if any(word in question_lower for word in ['improve', 'increase', 'better']):
            return self.get_improvement_advice(score, credit_data, metta_report)
        elif any(word in question_lower for word in ['risk', 'safe', 'danger']):
            return self.explain_risks(credit_data, metta_report)
        elif any(word in question_lower for word in ['borrow', 'loan', 'lend']):
            return self.borrowing_advice(score, metta_report)
        else:
            return f"""Based on your credit profile (Score: {score}, Tier: {tier}):

{self.get_improvement_advice(score, credit_data, metta_report)}

I can help you understand your credit position, identify risks, and explore borrowing opportunities. Could you be more specific about what you'd like to know?"""
    
    def get_improvement_advice(self, score: int, credit_data: Dict, metta_report: Dict) -> str:
        """Generate improvement advice using MeTTa reasoning"""
        reasoning = metta_report.get('reasoning_factors', {})
        recommendations = metta_report.get('recommendations', [])
        
        advice = f"**MeTTa Analysis for Score {score} (Tier: {metta_report.get('credit_tier', 'D')}):**\n\n"
        
        # Add reasoning insights
        if reasoning.get('repayment_ratio', 0) < 0.7:
            advice += "• Focus on consistent repayments to build trust\n"
        if reasoning.get('asset_concentration', 0) > 0.7:
            advice += "• Diversify your portfolio across different assets\n"
        if reasoning.get('cross_chain_activity', 0) < 2:
            advice += "• Expand your presence to multiple blockchain networks\n"
        
        # Add specific recommendations
        if recommendations:
            advice += "\n**Recommended Actions:**\n"
            for rec in recommendations[:3]:  # Top 3 recommendations
                advice += f"• {rec}\n"
        
        advice += f"\n**Maximum LTV Available:** {metta_report.get('max_ltv', 50)}%"
        
        return advice
    
    def explain_risks(self, credit_data: Dict, metta_report: Dict) -> str:
        """Explain risks using MeTTa analysis"""
        risk_level = metta_report.get('risk_level', 'medium')
        reasoning = metta_report.get('reasoning_factors', {})
        
        explanation = f"**Risk Assessment: {risk_level.upper()} RISK**\n\n"
        
        if risk_level == 'high':
            explanation += "🚨 Significant areas need attention:\n"
        elif risk_level == 'medium':
            explanation += "⚠️ Some areas need improvement:\n"
        else:
            explanation += "✅ Low risk profile detected:\n"
        
        # Add specific risk factors
        if reasoning.get('repayment_ratio', 0) < 0.5:
            explanation += "• Repayment consistency needs improvement\n"
        if reasoning.get('asset_concentration', 0) > 0.8:
            explanation += "• High asset concentration detected\n"
        if reasoning.get('cross_chain_activity', 0) < 1:
            explanation += "• Limited cross-chain activity\n"
        
        explanation += f"\n**Portfolio Value:** ${reasoning.get('portfolio_value', 0):.2f}"
        explanation += f"\n**Protocol Engagement:** {reasoning.get('protocol_engagement', 0)} interactions"
        
        return explanation
    
    def borrowing_advice(self, score: int, metta_report: Dict) -> str:
        """Provide borrowing advice based on MeTTa analysis"""
        tier = metta_report.get('credit_tier', 'D')
        max_ltv = metta_report.get('max_ltv', 50)
        
        advice = f"**Borrowing Options for Tier {tier}:**\n\n"
        
        if tier in ['AA', 'A+', 'A']:
            advice += "🎉 Excellent borrowing terms available!\n"
            advice += f"• **Darma P2P Platform**: {max_ltv}% LTV (Undercollateralized)\n"
            advice += "• **Aave + Darma**: Enhanced collateral requirements\n"
            advice += "• **Morpho + Darma**: Preferred interest rates\n"
        elif tier in ['B+', 'B']:
            advice += "Good borrowing options available\n"
            advice += f"• **Darma P2P Platform**: {max_ltv}% LTV\n"
            advice += "• **Standard Aave/Morpho**: Regular terms apply\n"
            advice += "• Focus on improving to Tier A for better rates\n"
        else:
            advice += "Building phase - focus on credit improvement\n"
            advice += f"• **Darma P2P Platform**: {max_ltv}% LTV available\n"
            advice += "• Start with smaller, consistent borrowing\n"
            advice += "• Build repayment history across protocols\n"
        
        return advice
    
    def generate_actionable_steps(self, metta_report: Dict, credit_data: Dict) -> List[str]:
        """Generate specific actionable steps"""
        steps = []
        reasoning = metta_report.get('reasoning_factors', {})
        
        # Immediate actions based on risk assessment
        risk_level = metta_report.get('risk_level', 'medium')
        if risk_level == 'high':
            steps.append("Review and address high-risk factors immediately")
        
        # Portfolio-specific actions
        if reasoning.get('portfolio_value', 0) < 1000:
            steps.append("Build portfolio value through consistent deposits")
        
        if reasoning.get('repayment_ratio', 0) < 0.7:
            steps.append("Ensure timely repayments on all active loans")
        
        if reasoning.get('cross_chain_activity', 0) < 2:
            steps.append("Establish presence on at least one additional chain")
        
        # Add recommendations from MeTTa
        steps.extend(metta_report.get('recommendations', [])[:2])
        
        return steps[:5]  # Return top 5 steps

def main():
    advisor = EnhancedCreditAdvisorAgent()
    advisor.agent.run()

if __name__ == "__main__":
    main()