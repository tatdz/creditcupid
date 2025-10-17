import React from 'react';
import { Button } from '../../ui/Button';
import { Building, Loader2 } from 'lucide-react';

interface PlaidIntegrationProps {
  onConnect: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const PlaidIntegration: React.FC<PlaidIntegrationProps> = ({ 
  onConnect, 
  loading, 
  error 
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Plaid Sandbox Demo</h4>
        <p className="text-sm text-blue-800 mb-3">
          Connect using Plaid's sandbox environment. Use any credentials or the test credentials below.
        </p>
        
        <div className="bg-white p-3 rounded border text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Username:</strong> user_good
            </div>
            <div>
              <strong>Password:</strong> pass_good
            </div>
            <div>
              <strong>PIN:</strong> 1234
            </div>
            <div>
              <strong>Institution:</strong> Chase
            </div>
          </div>
        </div>
      </div>
      
      <Button
        onClick={onConnect}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Connecting to Bank...
          </>
        ) : (
          <>
            <Building className="h-5 w-5 mr-2" />
            Connect Bank Account with Plaid
          </>
        )}
      </Button>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      <div className="text-xs text-gray-600 text-center">
        <p>Secure connection via Plaid • Read-only access • No credentials stored</p>
      </div>
    </div>
  );
};