import React, { useState, useRef, useEffect } from 'react';
import { useAgentChat, ChatMessage } from '../hooks/useAgentChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Send, User, Bot, Trash2 } from 'lucide-react';

interface AgentChatProps {
  address: string;
  agentType: 'advisor' | 'auditor';
}

export const AgentChat: React.FC<AgentChatProps> = ({ address, agentType }) => {
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage, clearMessages } = useAgentChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Add null check and try-catch for test environment
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        // Fallback for test environments where smooth scrolling might not be supported
        messagesEndRef.current.scrollIntoView();
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input, address, agentType);
      setInput('');
    }
  };

  const getAgentTitle = () => {
    return agentType === 'advisor' ? 'Credit Advisor' : 'Risk Auditor';
  };

  const getAgentDescription = () => {
    return agentType === 'advisor' 
      ? 'Get personalized advice to improve your credit score'
      : 'Understand how your credit score is calculated';
  };

  const getQuickQuestions = () => {
    if (agentType === 'advisor') {
      return [
        'How can I improve my credit score?',
        'What borrowing options do I have?',
        'Are there any risks in my portfolio?'
      ];
    } else {
      return [
        'How is my credit score calculated?',
        'Explain the scoring factors',
        'What makes my score transparent?'
      ];
    }
  };

  // Message component to simplify the JSX
  const MessageItem = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === 'user';
    const messageClass = isUser ? 'flex-row-reverse' : 'flex-row';
    const avatarClass = isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700';
    const bubbleClass = isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900';
    const timeClass = isUser ? 'text-blue-200' : 'text-gray-500';
    const Icon = isUser ? User : Bot;

    return (
      <div key={message.id} className={`flex gap-3 ${messageClass}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${avatarClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className={`max-w-[80%] rounded-lg px-4 py-2 ${bubbleClass}`}>
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
          <div className={`text-xs mt-1 ${timeClass}`}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {getAgentTitle()}
            </CardTitle>
            <CardDescription>{getAgentDescription()}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearMessages}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-1">Ask me about your credit score or use the quick questions below</p>
              
              <div className="mt-6 space-y-2">
                {getQuickQuestions().map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => sendMessage(question, address, agentType)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageItem key={message.id} message={message} />)
          )}
          
          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="h-4 w-4 text-gray-700" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask the ${getAgentTitle()}...`}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};