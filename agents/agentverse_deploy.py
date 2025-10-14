#!/usr/bin/env python3
"""
Agentverse Deployment Configuration for Darma Agents
Deploys agents to Fetch.ai Agentverse for discoverability and interoperability
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Any
import os

class AgentverseDeployer:
    def __init__(self):
        self.base_url = "https://agentverse.fetch.ai"
        self.api_key = os.getenv("AGENTVERSE_API_KEY")
        self.agent_configs = self.load_agent_configs()
    
    def load_agent_configs(self) -> Dict[str, Any]:
        """Load agent configurations for deployment"""
        return {
            "credit_advisor": {
                "name": "Darma Credit Advisor",
                "description": "AI-powered credit advisor with MeTTa reasoning for DeFi lending",
                "version": "1.0.0",
                "endpoints": ["http://localhost:8000/submit"],
                "capabilities": [
                    "credit_scoring",
                    "risk_assessment", 
                    "borrowing_advice",
                    "portfolio_analysis",
                    "meetta_reasoning"
                ],
                "tags": ["defi", "credit", "lending", "metta", "asi"],
                "visibility": "public"
            },
            "risk_auditor": {
                "name": "Darma Risk Auditor", 
                "description": "Transparent risk assessment and scoring explanation agent",
                "version": "1.0.0",
                "endpoints": ["http://localhost:8001/submit"],
                "capabilities": [
                    "risk_analysis",
                    "scoring_transparency",
                    "compliance_checking",
                    "audit_reporting"
                ],
                "tags": ["defi", "risk", "audit", "compliance", "transparency"],
                "visibility": "public"
            },
            "protocol_analyst": {
                "name": "Darma Protocol Analyst",
                "description": "DeFi protocol interaction analysis and optimization agent",
                "version": "1.0.0", 
                "endpoints": ["http://localhost:8002/submit"],
                "capabilities": [
                    "protocol_analysis",
                    "gas_optimization",
                    "yield_strategies",
                    "cross_chain_analytics"
                ],
                "tags": ["defi", "protocols", "aave", "morpho", "analytics"],
                "visibility": "public"
            }
        }
    
    async def deploy_agent(self, agent_id: str) -> str:
        """Deploy agent to Agentverse"""
        if agent_id not in self.agent_configs:
            raise ValueError(f"Unknown agent: {agent_id}")
        
        config = self.agent_configs[agent_id]
        
        payload = {
            "agent_id": agent_id,
            "config": config,
            "deployment_type": "container",
            "resources": {
                "cpu": "0.5",
                "memory": "1Gi",
                "storage": "10Gi"
            },
            "networking": {
                "ports": [8000, 8001, 8002],
                "protocol": "http"
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/v1/agents/deploy",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get('deployment_id', '')
                else:
                    raise Exception(f"Deployment failed: {response.status}")
    
    async def register_agent_service(self, agent_id: str, deployment_id: str) -> bool:
        """Register agent service in Agentverse directory"""
        service_config = {
            "agent_id": agent_id,
            "deployment_id": deployment_id,
            "service_name": f"darma_{agent_id}",
            "service_description": self.agent_configs[agent_id]["description"],
            "service_endpoints": self.agent_configs[agent_id]["endpoints"],
            "pricing_model": "free",  # For demo purposes
            "availability": "high",
            "service_tags": self.agent_configs[agent_id]["tags"]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/v1/services/register",
                json=service_config,
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                return response.status == 200
    
    async def discover_agents(self, tags: List[str] = None) -> List[Dict[str, Any]]:
        """Discover other agents in Agentverse"""
        params = {}
        if tags:
            params['tags'] = ','.join(tags)
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/api/v1/agents/discover",
                params=params,
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                if response.status == 200:
                    return await response.json()
                return []
    
    async def deploy_all_agents(self) -> Dict[str, str]:
        """Deploy all Darma agents to Agentverse"""
        deployment_results = {}
        
        for agent_id in self.agent_configs.keys():
            try:
                print(f"Deploying {agent_id}...")
                deployment_id = await self.deploy_agent(agent_id)
                
                if deployment_id:
                    success = await self.register_agent_service(agent_id, deployment_id)
                    if success:
                        deployment_results[agent_id] = deployment_id
                        print(f"✅ {agent_id} deployed successfully: {deployment_id}")
                    else:
                        print(f"❌ {agent_id} service registration failed")
                else:
                    print(f"❌ {agent_id} deployment failed")
                    
            except Exception as e:
                print(f"❌ {agent_id} deployment error: {e}")
        
        return deployment_results
    
    async def get_agent_status(self, deployment_id: str) -> Dict[str, Any]:
        """Get deployment status for an agent"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/api/v1/deployments/{deployment_id}/status",
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                if response.status == 200:
                    return await response.json()
                return {"status": "unknown"}

async def main():
    """Main deployment script"""
    deployer = AgentverseDeployer()
    
    print("🚀 Starting Darma Agent Deployment to Agentverse...")
    
    # Deploy all agents
    results = await deployer.deploy_all_agents()
    
    print("\n📊 Deployment Results:")
    for agent_id, deployment_id in results.items():
        status = await deployer.get_agent_status(deployment_id)
        print(f"  {agent_id}: {deployment_id} - {status.get('status', 'unknown')}")
    
    # Discover related agents
    print("\n🔍 Discovering Related Agents...")
    related_agents = await deployer.discover_agents(["defi", "lending", "credit"])
    print(f"Found {len(related_agents)} related agents in Agentverse")

if __name__ == "__main__":
    asyncio.run(main())