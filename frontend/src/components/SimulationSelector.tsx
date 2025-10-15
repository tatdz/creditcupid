import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Play, Zap, Shield } from 'lucide-react';

interface SimulationSelectorProps {
  onSimulationChange: (type: string, useRealProtocols: boolean) => void;
  currentSimulation: string;
}

export const SimulationSelector: React.FC<SimulationSelectorProps> = ({
  onSimulationChange,
  currentSimulation
}) => {
  const { address } = useAccount();
  const [useRealProtocols, setUseRealProtocols] = useState(false);
  const [executing, setExecuting] = useState(false);

  const simulationTypes = [
    {
      id: 'real',
      name: 'Real Data',
      description: 'Your actual on-chain data',
      icon: Shield,
      color: 'text-green-600'
    },
    {
      id: 'ideal',
      name: 'Ideal Borrower',
      description: 'Perfect credit history simulation',
      icon: Zap,
      color: 'text-blue-600'
    },
    {
      id: 'growing', 
      name: 'Growing Borrower',
      description: 'Building credit simulation',
      icon: Play,
      color: 'text-yellow-600'
    },
    {
      id: 'risky',
      name: 'Risky Borrower', 
      description: 'Credit challenges simulation',
      icon: Shield,
      color: 'text-red-600'
    }
  ];

  const executeRealProtocolActions = async () => {
    if (!address) return;
    
    setExecuting(true);
    try {
      const response = await fetch('/api/execute-real-protocol-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Wait for indexing then refresh data
        setTimeout(() => {
          onSimulationChange('real', false);
        }, 45000); // 45 seconds for indexing
      }
    } catch (error) {
      console.error('Error executing real actions:', error);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Simulation Mode
        </CardTitle>
        <CardDescription>
          Choose between real on-chain data or simulated scenarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simulation Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {simulationTypes.map((type) => (
            <Button
              key={type.id}
              variant={currentSimulation === type.id ? "default" : "outline"}
              onClick={() => onSimulationChange(type.id, false)}
              className="flex flex-col h-16"
            >
              <type.icon className={`h-4 w-4 ${type.color}`} />
              <span className="text-xs mt-1">{type.name}</span>
            </Button>
          ))}
        </div>

        {/* Real Protocol Execution */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Real Protocol Interactions</h4>
              <p className="text-sm text-blue-700">
                Execute real Aave/Morpho transactions on Sepolia testnet
              </p>
            </div>
            <Button
              onClick={executeRealProtocolActions}
              disabled={executing || !address}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {executing ? 'Executing...' : 'Run Real Transactions'}
            </Button>
          </div>
          
          {executing && (
            <div className="mt-2 text-sm text-blue-600">
              ⏳ Executing real transactions... This may take 1-2 minutes.
            </div>
          )}
        </div>

        {/* Information Badges */}
        <div className="flex gap-2">
          <Badge variant={currentSimulation === 'real' ? "default" : "secondary"}>
            {currentSimulation === 'real' ? '📊 Real Data' : '🎭 Simulation'}
          </Badge>
          <Badge variant="outline">
            🔗 {useRealProtocols ? 'Real Protocols' : 'Simulated Protocols'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};