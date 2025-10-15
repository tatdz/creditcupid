import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies at the top
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
}));

vi.mock('wagmi/connectors', () => ({
  injected: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock ALL child components to prevent rendering issues
vi.mock('../P2PLending', () => ({
  P2PLending: () => <div data-testid="p2p-lending">P2P Lending Mock</div>,
}));

vi.mock('../AgentChat', () => ({
  AgentChat: ({ agentType }: any) => (
    <div data-testid={`agent-chat-${agentType}`}>
      Agent Chat Mock - {agentType}
    </div>
  ),
}));

vi.mock('../ProtocolInteractions', () => ({
  ProtocolInteractions: () => (
    <div data-testid="protocol-interactions">Protocol Interactions Mock</div>
  ),
}));

// Mock UI components
vi.mock('../ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  ),
  CardDescription: ({ children, className }: any) => (
    <p className={className} data-testid="card-description">
      {children}
    </p>
  ),
}));

vi.mock('../ui/Button', () => ({
  Button: ({ children, onClick, variant, className, size }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock('../ui/Badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span
      className={className}
      data-testid="badge"
      data-variant={variant}
    >
      {children}
    </span>
  ),
}));

vi.mock('../ui/Tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs">
      <div>Current Tab: {value}</div>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          value, 
          onValueChange: onValueChange || (() => {}) 
        })
      )}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div className={className} data-testid="tabs-list">
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, onValueChange, className }: any) => (
    <button
      onClick={() => (onValueChange || (() => {}))(value)}
      className={className}
      data-testid="tabs-trigger"
      data-value={value}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div className={className} data-testid="tabs-content" data-value={value}>
      {children}
    </div>
  ),
}));

// Mock Recharts with simple components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div
      data-testid="responsive-container"
      style={{ width, height }}
    >
      {children}
    </div>
  ),
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  PieChart: ({ children, data }: any) => (
    <div data-testid="pie-chart" data-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock Lucide icons using importActual to get ALL icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    // Override specific icons if needed, but this ensures all are available
  };
});

// Import after mocks
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import axios from 'axios';
import { CreditDashboard } from '../CreditDashboard';

const mockUseAccount = vi.mocked(useAccount);
const mockUseConnect = vi.mocked(useConnect);
const mockUseDisconnect = vi.mocked(useDisconnect);
const mockAxios = vi.mocked(axios);

describe('CreditDashboard', () => {
  const mockAddress = '0x742E4C2F5D4d5F5d5F5D5f5d5f5D5f5d5f5d5f5d5f';
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  
  const mockCreditData = {
    address: mockAddress,
    chains: [
      {
        chainId: 1,
        balance: '1.5',
        tokens: [
          {
            contractAddress: '0x123',
            name: 'Ethereum',
            symbol: 'ETH',
            balance: '1.5',
            valueUSD: 4500,
          },
        ],
        nfts: [],
        transactions: [],
      },
    ],
    creditScore: 750,
    riskFactors: ['High concentration in single asset'],
    aavePositions: {},
    morphoPositions: {},
    protocolInteractions: [],
    recommendations: ['Diversify your portfolio'],
  };

  const mockSimulationTypes = [
    { id: 'real', name: 'Real Data', description: 'Actual on-chain data' },
    { id: 'sandbox', name: 'Sandbox', description: 'Simulated data for testing' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default disconnected state
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      status: 'disconnected',
    } as any);

    mockUseConnect.mockReturnValue({
      connect: mockConnect,
    } as any);

    mockUseDisconnect.mockReturnValue({
      disconnect: mockDisconnect,
    } as any);

    // Default axios mock implementation
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('simulation-types')) {
        return Promise.resolve({ data: mockSimulationTypes });
      }
      if (url.includes('credit-data')) {
        return Promise.resolve({ data: mockCreditData });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('should show connect wallet when not connected', async () => {
    await act(async () => {
      render(<CreditDashboard />);
    });

    expect(screen.getByText('Darma')).toBeInTheDocument();
    expect(screen.getByText('Cross-chain credit oracle and undercollateralized lending')).toBeInTheDocument();
    expect(screen.getByText('Connect MetaMask')).toBeInTheDocument();
  });

  it('should call connect when connect button is clicked', async () => {
    await act(async () => {
      render(<CreditDashboard />);
    });

    const connectButton = screen.getByText('Connect MetaMask');
    await act(async () => {
      fireEvent.click(connectButton);
    });

    expect(mockConnect).toHaveBeenCalled();
  });

  it('should show loading state when connected', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    // Mock axios to never resolve (loading state)
    mockAxios.get.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<CreditDashboard />);
    });

    expect(screen.getByText('Analyzing your cross-chain activity...')).toBeInTheDocument();
    expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
  });

  it('should show dashboard when data is loaded', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    // Wait for the component to load and render
    await waitFor(() => {
      expect(screen.getByText('Your cross-chain credit identity')).toBeInTheDocument();
    });

    // Check that credit data is displayed
    expect(screen.getByText('750')).toBeInTheDocument(); // Credit score
    expect(screen.getByText('Tier: A')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
  });

  it('should call disconnect when disconnect button is clicked', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Your cross-chain credit identity')).toBeInTheDocument();
    });

    const disconnectButton = screen.getByText('Disconnect');
    await act(async () => {
      fireEvent.click(disconnectButton);
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should show error state when data fetch fails', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    // Mock axios to reject for credit data but resolve for simulation types
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('simulation-types')) {
        return Promise.resolve({ data: mockSimulationTypes });
      }
      if (url.includes('credit-data')) {
        return Promise.reject(new Error('API error'));
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText('Try Again');
    await act(async () => {
      fireEvent.click(retryButton);
    });

    // Should call axios.get again
    expect(mockAxios.get).toHaveBeenCalledTimes(3); // simulation-types + credit-data (initial) + credit-data (retry)
  });

  it('should handle simulation type change', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Your cross-chain credit identity')).toBeInTheDocument();
    });

    // Find the select element by its role or by finding the parent container
    const modeLabel = screen.getByText('Mode:');
    const selectContainer = modeLabel.parentElement;
    const simulationSelect = selectContainer?.querySelector('select') as HTMLSelectElement;
    
    expect(simulationSelect).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.change(simulationSelect, { target: { value: 'sandbox' } });
    });

    // Should call credit data endpoint with new simulation type
    expect(mockAxios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/sandbox/credit-data/0x742E4C2F5D4d5F5d5F5D5f5d5f5D5f5d5f5d5f5d5f?simulation=sandbox'
    );
  });

  it('should display portfolio overview data', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
    });

    // Check that chain data is displayed
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Balance: 1.5000 ETH')).toBeInTheDocument();
    expect(screen.getByText('Tokens: 1')).toBeInTheDocument();
    expect(screen.getByText('NFTs: 0')).toBeInTheDocument();
    expect(screen.getByText('Transactions: 0')).toBeInTheDocument();
  });

  it('should display risk factors and recommendations', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Risk Factors')).toBeInTheDocument();
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    expect(screen.getByText('High concentration in single asset')).toBeInTheDocument();
    expect(screen.getByText('Diversify your portfolio')).toBeInTheDocument();
  });

  it('should display lending opportunities', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Lending Opportunities')).toBeInTheDocument();
    });

    expect(screen.getByText('Aave + Darma')).toBeInTheDocument();
    expect(screen.getByText('Morpho + Darma')).toBeInTheDocument();
    expect(screen.getByText('Darma P2P')).toBeInTheDocument();
    expect(screen.getByText('115%')).toBeInTheDocument();
    
    // Use getAllByText for multiple elements with same text - there are only 2
    const collateralRequiredElements = screen.getAllByText('Collateral Required');
    expect(collateralRequiredElements).toHaveLength(2); // Fixed from 3 to 2
  });

  it('should switch between tabs', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Your cross-chain credit identity')).toBeInTheDocument();
    });

    // Check that overview tab is active by default
    expect(screen.getByText('Current Tab: overview')).toBeInTheDocument();

    // Switch to lending tab
    const lendingTab = screen.getByText('P2P Lending');
    await act(async () => {
      fireEvent.click(lendingTab);
    });

    // Should render P2P lending component
    expect(screen.getByTestId('p2p-lending')).toBeInTheDocument();

    // Switch to agents tab
    const agentsTab = screen.getByText('AI Agents');
    await act(async () => {
      fireEvent.click(agentsTab);
    });

    // Should render agent chat components
    expect(screen.getByTestId('agent-chat-advisor')).toBeInTheDocument();
    expect(screen.getByTestId('agent-chat-auditor')).toBeInTheDocument();

    // Switch to protocols tab
    const protocolsTab = screen.getByText('Protocols');
    await act(async () => {
      fireEvent.click(protocolsTab);
    });

    // Should render protocol interactions component
    expect(screen.getByTestId('protocol-interactions')).toBeInTheDocument();
  });

  it('should display protocol activity summary', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Protocol Activity Summary')).toBeInTheDocument();
    });

    expect(screen.getByText('Aave Positions')).toBeInTheDocument();
    expect(screen.getByText('Morpho Positions')).toBeInTheDocument();
    expect(screen.getByText('No Aave positions found')).toBeInTheDocument();
    expect(screen.getByText('No Morpho positions found')).toBeInTheDocument();
  });

  it('should display connected wallet information', async () => {
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      status: 'connected',
    } as any);

    await act(async () => {
      render(<CreditDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    expect(screen.getByText('0x742E...5d5f')).toBeInTheDocument();
  });
});