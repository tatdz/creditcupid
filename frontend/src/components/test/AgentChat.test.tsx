import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the hook first - use a factory function without external variables
vi.mock('../../hooks/useAgentChat', () => ({
  useAgentChat: vi.fn()
}));

// Mock the UI components
vi.mock('../ui/Card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>
}));

vi.mock('../ui/Button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Send: () => <span>SendIcon</span>,
  User: () => <span>UserIcon</span>,
  Bot: () => <span>BotIcon</span>,
  Trash2: () => <span>TrashIcon</span>
}));

// Import the component and hook AFTER mocking
import { AgentChat } from '../AgentChat';
import { useAgentChat } from '../../hooks/useAgentChat';

// Get the mocked function AFTER imports
const mockUseAgentChat = vi.mocked(useAgentChat);

describe('AgentChat', () => {
  const address = '0x742E4C2F5D4d5F5d5F5D5f5d5f5D5f5d5f5d5f5d5f';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock return value
    mockUseAgentChat.mockReturnValue({
      messages: [],
      loading: false,
      sendMessage: vi.fn(),
      clearMessages: vi.fn()
    });
  });

  it('should render Credit Advisor title', () => {
    render(<AgentChat address={address} agentType="advisor" />);
    
    expect(screen.getByText('Credit Advisor')).toBeInTheDocument();
    expect(screen.getByText('Get personalized advice to improve your credit score')).toBeInTheDocument();
  });

  it('should render Risk Auditor title', () => {
    render(<AgentChat address={address} agentType="auditor" />);
    
    expect(screen.getByText('Risk Auditor')).toBeInTheDocument();
    expect(screen.getByText('Understand how your credit score is calculated')).toBeInTheDocument();
  });

  it('should show quick questions for advisor', () => {
    render(<AgentChat address={address} agentType="advisor" />);
    
    expect(screen.getByText('How can I improve my credit score?')).toBeInTheDocument();
    expect(screen.getByText('What borrowing options do I have?')).toBeInTheDocument();
    expect(screen.getByText('Are there any risks in my portfolio?')).toBeInTheDocument();
  });

  it('should call sendMessage when quick question is clicked', () => {
    const mockSendMessage = vi.fn();
    mockUseAgentChat.mockReturnValue({
      messages: [],
      loading: false,
      sendMessage: mockSendMessage,
      clearMessages: vi.fn()
    });

    render(<AgentChat address={address} agentType="advisor" />);
    
    const question = screen.getByText('How can I improve my credit score?');
    fireEvent.click(question);
    
    expect(mockSendMessage).toHaveBeenCalledWith(
      'How can I improve my credit score?',
      address,
      'advisor'
    );
  });

  it('should show empty state when no messages', () => {
    render(<AgentChat address={address} agentType="advisor" />);
    
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText(/Ask me about your credit score or use the quick questions below/)).toBeInTheDocument();
  });

  it('should display messages when available', () => {
    const mockMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Hello there',
        timestamp: new Date('2024-01-01T10:00:00'),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'How can I help you?',
        timestamp: new Date('2024-01-01T10:00:01'),
        type: 'credit-advice',
      },
    ];

    mockUseAgentChat.mockReturnValue({
      messages: mockMessages,
      loading: false,
      sendMessage: vi.fn(),
      clearMessages: vi.fn(),
    });

    render(<AgentChat address={address} agentType="advisor" />);

    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('How can I help you?')).toBeInTheDocument();
  });

  it('should handle form submission', () => {
    const mockSendMessage = vi.fn();
    mockUseAgentChat.mockReturnValue({
      messages: [],
      loading: false,
      sendMessage: mockSendMessage,
      clearMessages: vi.fn(),
    });

    render(<AgentChat address={address} agentType="advisor" />);

    const input = screen.getByPlaceholderText('Ask the Credit Advisor...');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    expect(mockSendMessage).toHaveBeenCalledWith('Test message', address, 'advisor');
  });

  it('should clear input after submission', () => {
    const mockSendMessage = vi.fn();
    mockUseAgentChat.mockReturnValue({
      messages: [],
      loading: false,
      sendMessage: mockSendMessage,
      clearMessages: vi.fn(),
    });

    render(<AgentChat address={address} agentType="advisor" />);

    const input = screen.getByPlaceholderText('Ask the Credit Advisor...');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    expect(input).toHaveValue('');
  });

  it('should call clearMessages when clear button is clicked', () => {
    const mockClearMessages = vi.fn();
    const mockMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      },
    ];

    mockUseAgentChat.mockReturnValue({
      messages: mockMessages,
      loading: false,
      sendMessage: vi.fn(),
      clearMessages: mockClearMessages,
    });

    render(<AgentChat address={address} agentType="advisor" />);

    // Find button containing trash icon
    const clearButton = screen.getByText('TrashIcon').closest('button');
    fireEvent.click(clearButton!);

    expect(mockClearMessages).toHaveBeenCalled();
  });
});