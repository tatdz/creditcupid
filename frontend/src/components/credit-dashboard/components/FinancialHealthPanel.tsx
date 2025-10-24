import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Building, CheckCircle, Shield, Hash, ExternalLink } from 'lucide-react';
import { PlaidData, StoredPrivacyProofs, PrivacyProofs } from '../../../types/credit';
import { PlaidIntegration } from './PlaidIntegration';
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

  const handleViewAllProofs = () => {
    if (privacyProofs?.pinataURLs?.fullProofs) {
      window.open(privacyProofs.pinataURLs.fullProofs, '_blank', 'noopener,noreferrer');
    } else if (privacyProofs?.ipfsData?.fullProofsCID) {
      // Fallback to public IPFS gateway
      const ipfsUrl = `https://ipfs.io/ipfs/${privacyProofs.ipfsData.fullProofsCID}`;
      window.open(ipfsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const hasProofsAvailable = privacyProofs?.pinataURLs?.fullProofs || privacyProofs?.ipfsData?.fullProofsCID;

  return (
    <Card className="border-4 border-white bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] font-vt323">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
          <Building className="h-5 w-5" />
          FINANCIAL HEALTH
          {plaidData && <CheckCircle className="h-5 w-5 text-green-600" />}
          {privacyProofs && <Shield className="h-5 w-5 text-blue-600" />}
        </CardTitle>
        <CardDescription className="text-base text-gray-700">
          {plaidData 
            ? 'BANK DATA CONNECTED'
            : 'CONNECT BANK ACCOUNT TO ENHANCE CREDIT SCORE'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {!plaidData ? (
          <div className="space-y-4">
            <PlaidIntegration 
              onConnect={onConnectBank}
              loading={loading}
              error={error}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bank Data Connected Section - Compact */}
            <div className="p-3 bg-green-100 rounded-lg border-4 border-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-green-900 text-lg">BANK DATA</h4>
                <span className="px-2 py-1 bg-green-500 text-white text-sm rounded font-semibold border-2 border-green-700">
                  +{calculateFinancialHealthScore(plaidData, privacyProofs)} PTS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">ACCOUNTS:</span>
                  <span className="text-green-900 font-semibold">{plaidData.accounts?.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">BALANCE:</span>
                  <span className="text-green-900 font-semibold">{formatUSD(
                    plaidData.accounts?.reduce((sum, acc) => sum + (acc.balances?.current || 0), 0) || 0
                  )}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">TXNS:</span>
                  <span className="text-green-900 font-semibold">{plaidData.transactions?.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">INCOME:</span>
                  <span className="text-green-900 font-semibold">{plaidData.income?.income_streams?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Verification Section - Compact */}
            {privacyProofs && (
              <div className="p-3 bg-blue-100 rounded-lg border-4 border-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900 text-lg flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    VERIFICATION
                  </h4>
                  <span className="bg-blue-500 text-white px-2 py-1 text-sm rounded font-semibold border-2 border-blue-700">
                    {Object.values({
                      income: privacyProofs.incomeVerified,
                      balance: privacyProofs.accountBalanceVerified,
                      transaction: privacyProofs.transactionHistoryVerified,
                      identity: privacyProofs.identityVerified
                    }).filter(Boolean).length}/4
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${privacyProofs.incomeVerified ? 'bg-green-500' : 'bg-red-500'} border border-white`} />
                    <span className={privacyProofs.incomeVerified ? 'text-green-700' : 'text-red-700'}>
                      INCOME: {privacyProofs.incomeVerified ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${privacyProofs.accountBalanceVerified ? 'bg-green-500' : 'bg-red-500'} border border-white`} />
                    <span className={privacyProofs.accountBalanceVerified ? 'text-green-700' : 'text-red-700'}>
                      BALANCE: {privacyProofs.accountBalanceVerified ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${privacyProofs.transactionHistoryVerified ? 'bg-green-500' : 'bg-red-500'} border border-white`} />
                    <span className={privacyProofs.transactionHistoryVerified ? 'text-green-700' : 'text-red-700'}>
                      HISTORY: {privacyProofs.transactionHistoryVerified ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${privacyProofs.identityVerified ? 'bg-green-500' : 'bg-red-500'} border border-white`} />
                    <span className={privacyProofs.identityVerified ? 'text-green-700' : 'text-red-700'}>
                      IDENTITY: {privacyProofs.identityVerified ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
                
                {hasProofsAvailable && (
                  <button
                    onClick={handleViewAllProofs}
                    className="w-full flex items-center justify-center gap-1 p-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded border-2 border-blue-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all duration-200 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 mt-2"
                  >
                    🔗 VIEW ZERO KNOWLEDGE PROOFS ON IPFS
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};