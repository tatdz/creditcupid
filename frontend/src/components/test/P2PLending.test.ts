import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('wagmi', () => ({
  useAccount: vi.fn()
}));

vi.mock('../../hooks/UseCreditData', () => ({
  useCreditData: vi.fn()
}));

// Mock UI components
vi.mock('../ui/Card', () => ({
  Card: ({ children, ...props }) => React.createElement('div', props, children),
  CardContent: ({ children, ...props }) => React.createElement('div', props, children),
  CardHeader: ({ children, ...props }) => React.createElement('div', props, children),
  CardTitle: ({ children, ...props }) => React.createElement('h3', props, children),
  CardDescription: ({ children, ...props }) => React.createElement('p', props, children)
}));

vi.mock('../ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }) => 
    React.createElement('button', { onClick, disabled, ...props }, children)
}));

vi.mock('../ui/Badge', () => ({
  Badge: ({ children, ...props }) => React.createElement('span', props, children)
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  DollarSign: () => React.createElement('span', {}, 'DollarSignIcon'),
  TrendingUp: () => React.createElement('span', {}, 'TrendingUpIcon'),
  Clock: () => React.createElement('span', {}, 'ClockIcon'),
  User: () => React.createElement('span', {}, 'UserIcon'),
  Shield: () => React.createElement('span', {}, 'ShieldIcon'),
  ArrowUpDown: () => React.createElement('span', {}, 'ArrowUpDownIcon')
}));

// Import after mocks
import { useAccount } from 'wagmi';
import { useCreditData } from '../../hooks/UseCreditData';
import { P2PLending } from '../P2PLending';

const mockUseAccount = vi.mocked(useAccount);
const mockUseCreditData = vi.mocked(useCreditData);

describe('P2PLending', () => {
  const mockAddress = '0x742E4C2F5D4d5F5d5F5D5f5d5f5D5f5d5f5d5f5d5f';
  
  const mockCreditData = {
    address: mockAddress,
    chains: [],
    creditScore: 750,
    riskFactors: [],
    aavePositions: {},
    morphoPositions: {},
    protocolInteractions: [],
    recommendations: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      status: 'disconnected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: null,
      loading: false,
      error: null,
      refetch: vi.fn()
    });
  });

  it('should show connect wallet message when not connected', () => {
    render(React.createElement(P2PLending));

    expect(screen.getByText('P2P Lending Platform')).toBeInTheDocument();
    expect(screen.getByText('Connect your wallet to access undercollateralized lending')).toBeInTheDocument();
    expect(screen.getByText('Please connect your wallet to continue')).toBeInTheDocument();
  });

  it('should display lending platform when connected', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    expect(screen.getByText('Peer-to-Peer Lending')).toBeInTheDocument();
    expect(screen.getByText('Access undercollateralized loans or earn yield by lending')).toBeInTheDocument();
  });

  it('should show borrow tab by default when connected', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    expect(screen.getByText('Borrow')).toBeInTheDocument();
    expect(screen.getByText('Lend')).toBeInTheDocument();
    
    // Verify borrow content is shown by default
    expect(screen.getByText('Create Loan Request')).toBeInTheDocument();
  });

  it('should switch to lend tab when lend button is clicked', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    const lendButton = screen.getByText('Lend');
    await act(async () => {
      fireEvent.click(lendButton);
    });

    expect(screen.getByText('Become a Lender')).toBeInTheDocument();
  });

  it('should display borrowing power cards', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    expect(screen.getByText('70% LTV')).toBeInTheDocument();
    expect(screen.getByText('Max Borrowing Power')).toBeInTheDocument();
    expect(screen.getByText('Loan Amount')).toBeInTheDocument();
    expect(screen.getByText('Current LTV')).toBeInTheDocument();
  });

  it('should display loan offers', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    await waitFor(() => {
      // Use getAllByText for multiple elements and check that at least one exists
      const usdcLoans = screen.getAllByText(/USDC Loan/i);
      expect(usdcLoans.length).toBeGreaterThan(0);
      
      const daiLoans = screen.getAllByText(/DAI Loan/i);
      expect(daiLoans.length).toBeGreaterThan(0);
    });
  });

  it('should show no offers message when no suitable offers', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: {
        ...mockCreditData,
        creditScore: 500
      },
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    await waitFor(() => {
      expect(screen.getByText('No suitable loan offers found')).toBeInTheDocument();
      expect(screen.getByText('Your credit score is too low for available offers')).toBeInTheDocument();
    });
  });

  it('should display active loans', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    await waitFor(() => {
      expect(screen.getByText('Your Active Loans')).toBeInTheDocument();
      expect(screen.getByText('$2,500 USDC')).toBeInTheDocument();
    });
  });

  it('should handle loan creation form input', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    // Get all inputs with placeholder '0.00' and use the first one (loan amount)
    const inputs = screen.getAllByPlaceholderText('0.00');
    const loanAmountInput = inputs[0];
    
    await act(async () => {
      fireEvent.change(loanAmountInput, { target: { value: '1000' } });
    });

    expect(loanAmountInput).toHaveValue(1000);
  });

  it('should handle collateral input', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    // Get all inputs with placeholder '0.00' and use the second one (collateral)
    const inputs = screen.getAllByPlaceholderText('0.00');
    const collateralInput = inputs[1];
    
    await act(async () => {
      fireEvent.change(collateralInput, { target: { value: '500' } });
    });

    expect(collateralInput).toHaveValue(500);
  });

  it('should disable create loan button when form is invalid', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    // Use getAllByText and find the button (not the heading)
    const createLoanElements = screen.getAllByText(/Create Loan Request/i);
    const createButton = createLoanElements.find(element => 
      element.tagName.toLowerCase() === 'button'
    );
    
    expect(createButton).toBeDefined();
    expect(createButton).toBeDisabled();
  });

  it('should enable create loan button when form is valid', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    // Fill in the form
    const inputs = screen.getAllByPlaceholderText('0.00');
    const loanAmountInput = inputs[0];
    const collateralInput = inputs[1];
    
    await act(async () => {
      fireEvent.change(loanAmountInput, { target: { value: '1000' } });
      fireEvent.change(collateralInput, { target: { value: '1500' } });
    });

    // Select a duration - use querySelector since we don't have a proper label
    const durationSelect = screen.getByDisplayValue('30 days');
    await act(async () => {
      fireEvent.change(durationSelect, { target: { value: '30' } });
    });

    // Find the button among all Create Loan Request elements
    const createLoanElements = screen.getAllByText(/Create Loan Request/i);
    const createButton = createLoanElements.find(element => 
      element.tagName.toLowerCase() === 'button'
    );
    
    expect(createButton).toBeDefined();
    expect(createButton).not.toBeDisabled();
  });

  it('should display lender profile in lend tab', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    const lendButton = screen.getByText('Lend');
    await act(async () => {
      fireEvent.click(lendButton);
    });

    expect(screen.getByText('Become a Lender')).toBeInTheDocument();
    expect(screen.getByText('Your Credit Profile')).toBeInTheDocument();
  });

  it('should show loading state when credit data is loading', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: null,
      loading: true,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    expect(screen.getByText('Loading credit data...')).toBeInTheDocument();
  });

  it('should show error state when credit data fails to load', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: null,
      loading: false,
      error: 'Failed to load credit data',
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    expect(screen.getByText('Error loading credit data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load credit data')).toBeInTheDocument();
  });

  it('should handle loan offer acceptance', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    await waitFor(() => {
      const acceptButtons = screen.getAllByRole('button', { name: /accept offer/i });
      expect(acceptButtons.length).toBeGreaterThan(0);
    });
  });

  it('should display correct APY rates in loan offers', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    await waitFor(() => {
      expect(screen.getByText('6.5% APY')).toBeInTheDocument();
      expect(screen.getByText('8.2% APY')).toBeInTheDocument();
      expect(screen.getByText('5.2% APY')).toBeInTheDocument();
    });
  });

  it('should display loan offer details correctly', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected'
    } as any);

    mockUseCreditData.mockReturnValue({
      creditData: mockCreditData,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    await act(async () => {
      render(React.createElement(P2PLending));
    });

    await waitFor(() => {
      // Check for various loan details
      expect(screen.getByText('Up to $10,000')).toBeInTheDocument();
      expect(screen.getByText('Up to $5,000')).toBeInTheDocument();
      expect(screen.getByText('Up to $20,000')).toBeInTheDocument();
      
      // Check for minimum scores
      expect(screen.getByText('700')).toBeInTheDocument();
      expect(screen.getByText('650')).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });
});