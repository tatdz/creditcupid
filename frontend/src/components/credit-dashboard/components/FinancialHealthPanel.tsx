import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Building, CheckCircle, Lock, Shield, Hash } from 'lucide-react';
import { PlaidData, StoredPrivacyProofs, PrivacyProofs } from '../../../types/credit';
import { PlaidIntegration } from './PlaidIntegration';
import { PrivacyVerification } from './PrivacyVerification';
import { formatUSD } from '../utils/formatters';

interface FinancialHealthPanelProps {
  plaidData: PlaidData | null;
  privacyProofs: StoredPrivacyProofs | null;
  onConnectBank: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const FinancialHealthPanel: React.FC<FinancialHealthPanelProps> = ({
  plaidData,
  privacyProofs,
  onConnectBank,
  loading,
  error
}) => {
  const calculateFinancialHealthScore = (plaidData: PlaidData | null, proofs: PrivacyProofs | null): number => {
    if (!plaidData || !plaidData.accounts || !proofs) return 0;
    
    let score = 0;
    if (proofs.incomeVerified) score += 25;
    if (proofs.accountBalanceVerified) {
      const totalBalance = plaidData.accounts.reduce((sum, account) => 
        sum + (account.balances?.current || 0), 0);
      if (totalBalance > 10000) score += 25;
      else if (totalBalance > 5000) score += 20;
      else if (totalBalance > 1000) score += 15;
    }
    if (proofs.transactionHistoryVerified) {
      if (plaidData.transactions && plaidData.transactions.length > 50) score += 25;
      else if (plaidData.transactions.length > 20) score += 15;
    }
    if (proofs.identityVerified) score += 25;
    
    return Math.min(100, score);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Financial Health
          {plaidData && <CheckCircle className="h-5 w-5 text-green-600" />}
          {privacyProofs && <Shield className="h-5 w-5 text-blue-600" />}
        </CardTitle>
        <CardDescription>
          {plaidData 
            ? 'Your bank data is securely connected with privacy-preserving verification'
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
                <h4 className="font-semibold text-green-900">Privacy First Verification</h4>
              </div>
              <p className="text-sm text-green-800">
                Your sensitive financial data is never stored or exposed. We use cryptographic verification 
                to confirm your financial health without revealing private information. All verification 
                records are stored securely on IPFS.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-green-900">Bank Data Connected</h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded font-semibold">
                  +{calculateFinancialHealthScore(plaidData, privacyProofs)} points
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

            {privacyProofs && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Privacy-Preserving Verification
                  </h4>
                  <div className="flex gap-2 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {Object.values({
                        income: privacyProofs.incomeVerified,
                        balance: privacyProofs.accountBalanceVerified,
                        transaction: privacyProofs.transactionHistoryVerified,
                        identity: privacyProofs.identityVerified
                      }).filter(Boolean).length}/4 Verified
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${privacyProofs.incomeVerified ? 'bg-green-500' : 'bg-red-500'}`} />
                    Income Stability: {privacyProofs.incomeVerified ? '✅' : '❌'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${privacyProofs.accountBalanceVerified ? 'bg-green-500' : 'bg-red-500'}`} />
                    Minimum Balance: {privacyProofs.accountBalanceVerified ? '✅' : '❌'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${privacyProofs.transactionHistoryVerified ? 'bg-green-500' : 'bg-red-500'}`} />
                    Active History: {privacyProofs.transactionHistoryVerified ? '✅' : '❌'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${privacyProofs.identityVerified ? 'bg-green-500' : 'bg-red-500'}`} />
                    Identity: {privacyProofs.identityVerified ? '✅' : '❌'}
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-200">
                  <div className="flex items-center gap-2 text-xs text-blue-800">
                    <Shield className="h-3 w-3" />
                    <span>Verification records stored on IPFS - No sensitive data exposed</span>
                  </div>
                </div>
              </div>
            )}

            {privacyProofs && (
              <PrivacyVerification proofs={privacyProofs} />
            )}

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Financial Insights</h4>
              <ul className="text-sm text-green-800 space-y-1">
                {privacyProofs?.incomeVerified && <li>• Stable income stream verified</li>}
                {privacyProofs?.accountBalanceVerified && <li>• Meets minimum balance requirements</li>}
                {privacyProofs?.transactionHistoryVerified && <li>• Active transaction history confirmed</li>}
                {privacyProofs?.identityVerified && <li>• Identity verification complete</li>}
                {plaidData.accounts && plaidData.accounts.length > 1 && <li>• Multiple accounts for diversification</li>}
                <li>• Privacy-preserving verification complete</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};