#!/usr/bin/env python3
"""
ASI:One Chat Protocol Integration for Darma Agents
Provides natural language interaction and multi-agent communication
"""

import asyncio
import aiohttp
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

class ASIProtocolClient:
    def __init__(self, agent_id: str, api_key: str, base_url: str = "https://api.asi.one"):
        self.agent_id = agent_id
        self.api_key = api_key
        self.base_url = base_url
        self.session = None
        self.conversations: Dict[str, Dict] = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'X-Agent-ID': self.agent_id
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def start_conversation(self, user_id: str, context: Dict[str, Any]) -> str:
        """Start a new conversation with context"""
        conversation_id = f"conv_{user_id}_{int(datetime.now().timestamp())}"
        
        payload = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "agent_id": self.agent_id,
            "context": context,
            "timestamp": datetime.now().isoformat()
        }
        
        async with self.session.post(
            f"{self.base_url}/v1/conversations/start",
            json=payload
        ) as response:
            if response.status == 200:
                data = await response.json()
                self.conversations[conversation_id] = {
                    'user_id': user_id,
                    'start_time': datetime.now(),
                    'context': context,
                    'messages': []
                }
                return conversation_id
            else:
                raise Exception(f"Failed to start conversation: {response.status}")
    
    async def send_message(self, conversation_id: str, message: str, message_type: str = "text") -> Dict[str, Any]:
        """Send message through ASI:One protocol"""
        if conversation_id not in self.conversations:
            raise ValueError("Conversation not found")
        
        payload = {
            "conversation_id": conversation_id,
            "message": {
                "type": message_type,
                "content": message,
                "timestamp": datetime.now().isoformat(),
                "sender": self.agent_id
            },
            "context": self.conversations[conversation_id]['context']
        }
        
        async with self.session.post(
            f"{self.base_url}/v1/conversations/message",
            json=payload
        ) as response:
            if response.status == 200:
                data = await response.json()
                
                # Store message in conversation history
                self.conversations[conversation_id]['messages'].append({
                    'sender': self.agent_id,
                    'content': message,
                    'timestamp': datetime.now(),
                    'type': message_type
                })
                
                return data
            else:
                raise Exception(f"Failed to send message: {response.status}")
    
    async def get_agent_response(self, conversation_id: str, user_message: str) -> str:
        """Get AI agent response through ASI:One"""
        if conversation_id not in self.conversations:
            raise ValueError("Conversation not found")
        
        # First store user message
        self.conversations[conversation_id]['messages'].append({
            'sender': 'user',
            'content': user_message,
            'timestamp': datetime.now(),
            'type': 'text'
        })
        
        payload = {
            "conversation_id": conversation_id,
            "user_message": user_message,
            "conversation_history": self.conversations[conversation_id]['messages'][-10:],  # Last 10 messages
            "agent_context": self.conversations[conversation_id]['context'],
            "response_requirements": {
                "format": "natural_language",
                "include_reasoning": True,
                "max_length": 1000
            }
        }
        
        async with self.session.post(
            f"{self.base_url}/v1/agents/respond",
            json=payload
        ) as response:
            if response.status == 200:
                data = await response.json()
                agent_response = data.get('response', {}).get('content', 'I apologize, but I cannot process your request at the moment.')
                
                # Store agent response
                self.conversations[conversation_id]['messages'].append({
                    'sender': self.agent_id,
                    'content': agent_response,
                    'timestamp': datetime.now(),
                    'type': 'text'
                })
                
                return agent_response
            else:
                error_msg = f"Unable to generate response. Please try again later."
                self.conversations[conversation_id]['messages'].append({
                    'sender': self.agent_id,
                    'content': error_msg,
                    'timestamp': datetime.now(),
                    'type': 'text'
                })
                return error_msg
    
    async def multi_agent_consultation(self, user_id: str, query: str, credit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Consult multiple specialized agents for complex queries"""
        agents = ["credit_advisor", "risk_auditor", "protocol_analyst"]
        consultations = {}
        
        for agent_type in agents:
            conversation_id = await self.start_conversation(user_id, {
                "credit_data": credit_data,
                "agent_type": agent_type,
                "query_type": "multi_agent_consultation"
            })
            
            specialized_query = self.specialize_query_for_agent(query, agent_type)
            response = await self.get_agent_response(conversation_id, specialized_query)
            
            consultations[agent_type] = {
                "response": response,
                "conversation_id": conversation_id,
                "timestamp": datetime.now().isoformat()
            }
        
        # Synthesize responses
        synthesis = await self.synthesize_responses(consultations, query)
        
        return {
            "consultations": consultations,
            "synthesized_advice": synthesis,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }
    
    def specialize_query_for_agent(self, query: str, agent_type: str) -> str:
        """Specialize general query for specific agent type"""
        specializations = {
            "credit_advisor": f"As a credit advisor, please provide guidance on: {query}. Focus on credit improvement and borrowing strategies.",
            "risk_auditor": f"As a risk auditor, please analyze the risks in: {query}. Provide transparent risk assessment and mitigation strategies.",
            "protocol_analyst": f"As a protocol analyst, please analyze the DeFi protocol aspects of: {query}. Focus on Aave, Morpho, and other protocol interactions."
        }
        return specializations.get(agent_type, query)
    
    async def synthesize_responses(self, consultations: Dict[str, Any], original_query: str) -> str:
        """Synthesize multiple agent responses into coherent advice"""
        synthesis_prompt = f"""
        Original User Query: {original_query}
        
        Agent Consultations:
        {json.dumps(consultations, indent=2)}
        
        Please synthesize these expert opinions into a coherent, comprehensive response that addresses the user's original query while resolving any contradictions and highlighting the most important insights from each specialist.
        """
        
        # Use ASI:One to synthesize responses
        synthesis_conv_id = await self.start_conversation("synthesis_bot", {
            "purpose": "response_synthesis",
            "original_query": original_query
        })
        
        synthesized_response = await self.get_agent_response(synthesis_conv_id, synthesis_prompt)
        return synthesized_response
    
    async def get_conversation_history(self, conversation_id: str) -> List[Dict]:
        """Get conversation history"""
        if conversation_id in self.conversations:
            return self.conversations[conversation_id]['messages']
        return []
    
    async def end_conversation(self, conversation_id: str, summary: str = "") -> None:
        """End conversation and store summary"""
        if conversation_id in self.conversations:
            self.conversations[conversation_id]['end_time'] = datetime.now()
            self.conversations[conversation_id]['summary'] = summary
            
            # In production, you might want to persist this
            print(f"Conversation {conversation_id} ended. Summary: {summary}")