import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Upload, 
  Loader2,
  ExternalLink
} from 'lucide-react';

interface CreditScoreManager {
  creditScore: number;
  onChainScore: number;
  isScoreSet: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  transactionError: string | null;
  transactionHash: string | null;
  transactionSuccess: boolean;
  setCreditScoreOnChain: () => Promise<boolean>;
  isCorrectNetwork: boolean;
}

interface CreditScoreStatusProps {
  creditScoreManager: CreditScoreManager;
  userCreditScore: number;
  canBorrow: boolean;
}

const TransactionLink: React.FC<{ hash: string }> = ({ hash }) => {
  return (
    <a 
      href={`https://eth-sepolia.blockscout.com/tx/${hash}`}
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
    >
      View on Blockscout <ExternalLink className="h-3 w-3" />
    </a>
  );
};

export const CreditScoreStatus: React.FC<CreditScoreStatusProps> = ({
  creditScoreManager,
  userCreditScore,
  canBorrow
}) => {
  const {
    creditScore,
    onChainScore,
    isScoreSet,
    isLoading,
    isUpdating,
    transactionError,
    transactionHash,
    transactionSuccess,
    setCreditScoreOnChain,
    isCorrectNetwork
  } = creditScoreManager;

  // Show transaction in progress state
  if (isUpdating && transactionHash) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div>
                <h3 className="font-semibold">Setting Credit Score</h3>
                <p className="text-sm">Transaction is being processed...</p>
                {transactionHash && (
                  <div className="mt-2">
                    <TransactionLink hash={transactionHash} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isScoreSet ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isScoreSet ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">
                {isScoreSet ? 'Credit Score Verified Onchain' : 'Credit Score Not Set Onchain'}
              </h3>
              <p className="text-sm">
                {isScoreSet 
                  ? `Your credit score ${creditScore} is verified on the blockchain` 
                  : 'You need to set your credit score onchain to create loan requests'
                }
              </p>
              
              {isScoreSet && !canBorrow && (
                <p className="text-sm text-red-600 mt-1">
                  Your score is below the minimum required 600 for borrowing
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Effective Score:</span>
                  <Badge variant={creditScore > 0 ? "default" : "secondary"}>
                    {creditScore || 'Not set'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">P2PLending Contract:</span>
                  <Badge variant={onChainScore > 0 ? "default" : "secondary"}>
                    {onChainScore || 'Not set'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Original Score:</span>
                  <Badge variant="outline">
                    {userCreditScore}
                  </Badge>
                </div>
              </div>

              {transactionHash && (
                <div className="mt-3">
                  <TransactionLink hash={transactionHash} />
                </div>
              )}
            </div>
          </div>
          
          {!isScoreSet && (
            <Button 
              onClick={setCreditScoreOnChain}
              disabled={isUpdating || !isCorrectNetwork}
              size="sm"
              className="whitespace-nowrap"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Setting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Set Onchain
                </>
              )}
            </Button>
          )}
        </div>

        {!isCorrectNetwork && !isScoreSet && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-700">
              Please switch to Sepolia network to set your credit score
            </p>
          </div>
        )}

        {transactionError && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-700">
              {transactionError}
            </p>
          </div>
        )}

        {transactionSuccess && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ Credit score successfully set! You can now create loan requests.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};