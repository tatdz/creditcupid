import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Send, Bot, Shield } from 'lucide-react';

interface AgentChatProps {
  address: string;
  agentType: 'advisor' | 'auditor';
}

export const AgentChat: React.FC<AgentChatProps> = ({ address, agentType }) => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');

  const agentInfo = {
    advisor: {
      title: 'Financial Advisor',
      description: 'Get personalized financial advice based on your credit profile',
      icon: Bot,
      placeholder: 'Ask about investment strategies...'
    },
    auditor: {
      title: 'Security Auditor',
      description: 'Analyze your wallet security and transaction patterns',
      icon: Shield,
      placeholder: 'Ask about security recommendations...'
    }
  };

  const { title, description, icon: Icon, placeholder } = agentInfo[agentType];

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const responses = {
        advisor: [
          "Based on your credit score of 723, I recommend diversifying your portfolio with more blue-chip assets.",
          "Your on-chain activity shows good DeFi engagement. Consider exploring yield farming opportunities.",
          "With your financial health, you could qualify for better lending rates on multiple protocols."
        ],
        auditor: [
          "Your wallet shows secure transaction patterns. No suspicious activity detected.",
          "Recommend enabling 2FA and using a hardware wallet for large holdings.",
          "Recent transactions appear legitimate. Continue monitoring for unusual activity."
        ]
      };

      const response = responses[agentType][Math.floor(Math.random() * responses[agentType].length)];
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                Start a conversation with your {title.toLowerCase()}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-3 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block px-3 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            AI-powered assistant analyzing your on-chain data and credit profile
          </div>
        </div>
      </CardContent>
    </Card>
  );
};