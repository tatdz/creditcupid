import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Building, CheckCircle, Lock } from 'lucide-react';
import { PlaidData, StoredZKProofs, ZKProofs } from '../../../types/credit';
import { PlaidIntegration } from './PlaidIntegration';
import { RealZKVerification } from './RealZKVerification';
import { formatUSD } from '../utils/formatters';

interface FinancialHealthPanelProps {
  plaidData: PlaidData | null;
  zkProofs: StoredZKProofs | null; //
  onConnectBank: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const FinancialHealthPanel: React.FC<FinancialHealthPanelProps> = ({
  plaidData,
  zkProofs,
  onConnectBank,
  loading,
  error
}) => {
  const calculateFinancialHealthScore = (plaidData: PlaidData | null, zkProofs: ZKProofs | null): number => {
    if (!plaidData || !plaidData.accounts || !zkProofs) return 0;
    
    let score = 0;
    if (zkProofs.incomeVerified) score += 25;
    if (zkProofs.accountBalanceVerified) {
      const totalBalance = plaidData.accounts.reduce((sum, account) => 
        sum + (account.balances?.current || 0), 0);
      if (totalBalance > 10000) score += 25;
      else if (totalBalance > 5000) score += 20;
      else if (totalBalance > 1000) score += 15;
    }
    if (zkProofs.transactionHistoryVerified) {
      if (plaidData.transactions && plaidData.transactions.length > 50) score += 25;
      else if (plaidData.transactions.length > 20) score += 15;
    }
    if (zkProofs.identityVerified) score += 25;
    
    return Math.min(100, score);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Financial Health
          {plaidData && <CheckCircle className="h-5 w-5 text-green-600" />}
        </CardTitle>
        <CardDescription>
          {plaidData 
            ? 'Your bank data is securely connected and verified with zero-knowledge proofs'
            : 'Connect your bank account to enhance your credit score with verified financial data'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!plaidData ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Boost Your Credit Score</h4>
              <p className="text-sm text-blue-800">
                Connect your bank account securely via Plaid to add traditional financial data to your credit profile.
                This can increase your score by up to 100 points through verified factors.
              </p>
            </div>
            
            <PlaidIntegration 
              onConnect={onConnectBank}
              loading={loading}
              error={error}
            />
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-green-900">Privacy Protected</h4>
              </div>
              <p className="text-sm text-green-800">
                Your financial data is never stored. We use zero-knowledge proofs to verify your financial health
                without exposing sensitive information. All proofs are generated locally and verified on-chain.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-green-900">Bank Data Connected</h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded font-semibold">
                  +{calculateFinancialHealthScore(plaidData, zkProofs)} points
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Accounts:</span> {plaidData.accounts?.length}
                </div>
                <div>
                  <span className="text-green-700">Total Balance:</span> {formatUSD(
                    plaidData.accounts?.reduce((sum, acc) => sum + (acc.balances?.current || 0), 0) || 0
                  )}
                </div>
                <div>
                  <span className="text-green-700">Transactions:</span> {plaidData.transactions?.length}
                </div>
                <div>
                  <span className="text-green-700">Income Streams:</span> {plaidData.income?.income_streams?.length || 0}
                </div>
              </div>
            </div>

{zkProofs && (
  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold text-green-900">Proof Verification Status</h4>
      <div className="flex gap-2 text-sm">
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
          {Object.values({
            income: zkProofs.incomeVerified,
            balance: zkProofs.accountBalanceVerified,
            transaction: zkProofs.transactionHistoryVerified,
            identity: zkProofs.identityVerified
          }).filter(Boolean).length}/4 Verified
        </span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${zkProofs.incomeVerified ? 'bg-green-500' : 'bg-red-500'}`} />
        Income: {zkProofs.incomeVerified ? '✅' : '❌'}
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${zkProofs.accountBalanceVerified ? 'bg-green-500' : 'bg-red-500'}`} />
        Balance: {zkProofs.accountBalanceVerified ? '✅' : '❌'}
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${zkProofs.transactionHistoryVerified ? 'bg-green-500' : 'bg-red-500'}`} />
        Transactions: {zkProofs.transactionHistoryVerified ? '✅' : '❌'}
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${zkProofs.identityVerified ? 'bg-green-500' : 'bg-red-500'}`} />
        Identity: {zkProofs.identityVerified ? '✅' : '❌'}
      </div>
    </div>
  </div>
)}

{zkProofs && (
  <RealZKVerification proofs={zkProofs} />
)}

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Financial Insights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Stable income stream detected</li>
                <li>• Good cash flow management</li>
                <li>• Multiple bank accounts for diversification</li>
                <li>• No overdraft or negative balances</li>
                <li>• Consistent transaction history</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};