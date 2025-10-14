import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'credit-advice' | 'risk-audit' | 'general';
}

export const useAgentChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (message: string, address: string, agentType: 'advisor' | 'auditor' = 'advisor') => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Simulate agent response - in production, this would call the actual agent endpoint
      const response = await simulateAgentResponse(message, address, agentType);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: agentType === 'advisor' ? 'credit-advice' : 'risk-audit'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    clearMessages
  };
};

// Simulated agent response - replace with actual agent API call
const simulateAgentResponse = async (message: string, address: string, agentType: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const lowerMessage = message.toLowerCase();
  
  if (agentType === 'advisor') {
    if (lowerMessage.includes('improve') || lowerMessage.includes('increase')) {
      return `Based on your wallet ${address.slice(0, 8)}..., I recommend:\n\n1. **Diversify your holdings**: Consider adding more asset types across different chains\n2. **Maintain consistent repayments**: Ensure timely repayments on any borrowed positions\n3. **Increase protocol activity**: Regular interactions with Aave/Morpho build stronger history\n4. **Expand cross-chain presence**: Activity on multiple chains improves your score`;
    }
    
    if (lowerMessage.includes('borrow') || lowerMessage.includes('loan')) {
      return `For borrowing with your current profile:\n\n- **Aave**: You may qualify for reduced collateral requirements (115% instead of 150%)\n- **Morpho**: Better interest rates available based on your repayment history\n- **Darma Platform**: Access to under-collateralized loans with 80% LTV\n\nYour cross-chain activity makes you a strong candidate for better terms.`;
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('safe')) {
      return `Your risk assessment shows:\n\n✅ **Strong Points**: Multi-chain activity, diverse holdings\n⚠️ **Areas to Watch**: Consider more consistent repayment patterns\n📈 **Opportunity**: Expand protocol interactions beyond current levels\n\nOverall, you're in a good position for DeFi credit activities.`;
    }
  } else {
    // Risk Auditor responses
    if (lowerMessage.includes('score') || lowerMessage.includes('calculate')) {
      return `Your credit score is calculated based on:\n\n- **Portfolio Value (25%)**: Total value across all chains\n- **Repayment History (30%)**: Consistency in repaying borrowed funds\n- **Multi-Chain Activity (20%)**: Presence and activity across different networks\n- **Protocol Interactions (15%)**: Depth of Aave/Morpho usage\n- **Asset Diversity (10%)**: Variety of tokens and NFTs held\n\nEach factor contributes to your overall creditworthiness.`;
    }
    
    if (lowerMessage.includes('transparent') || lowerMessage.includes('explain')) {
      return `Transparency Report:\n\n🔍 **Data Sources**: Blockscout APIs across 6 EVM chains\n📊 **Protocol Analysis**: Real Aave V3 & Morpho V2 contract interactions\n⚖️ **Weighting**: Algorithm considers both quantity and quality of activity\n🛡️ **Privacy**: Only on-chain data analyzed, no personal information stored\n\nAll scoring logic is verifiable and based on public blockchain data.`;
    }
  }
  
  return `I understand you're asking about "${message}". As your ${agentType === 'advisor' ? 'Credit Advisor' : 'Risk Auditor'}, I can help you understand your credit position, identify improvement opportunities, and optimize your DeFi borrowing strategy. Could you be more specific about what you'd like to know?`;
};