import React from 'react';
import { Card, CardContent } from './Card';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';

interface TransactionState {
  hash?: string | null;
  success?: boolean;
  error?: string | null;
  isPending?: boolean;
  isConfirming?: boolean;
  type?: 'createLoan' | 'createOffer' | null;
}

interface TransactionStatusProps {
  type: 'creditScore' | 'p2p';
  transactionState: TransactionState;
  message: string;
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

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  type,
  transactionState,
  message
}) => {
  const { hash, success, error, isPending, isConfirming } = transactionState;

  // Don't show if no transaction state
  if (!hash && !error && !isPending) {
    return null;
  }

  // Determine status and styling
  let status: 'pending' | 'success' | 'error' = 'pending';
  let borderColor = 'border-blue-200';
  let bgColor = 'bg-blue-50';
  let icon = <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
  let title = 'Transaction Pending';

  if (success) {
    status = 'success';
    borderColor = 'border-green-200';
    bgColor = 'bg-green-50';
    icon = <CheckCircle className="h-6 w-6 text-green-600" />;
    title = 'Transaction Successful';
  } else if (error) {
    status = 'error';
    borderColor = 'border-red-200';
    bgColor = 'bg-red-50';
    icon = <XCircle className="h-6 w-6 text-red-600" />;
    title = 'Transaction Failed';
  } else if (isConfirming) {
    title = 'Waiting for Confirmation';
  }

  const getStatusMessage = () => {
    if (error) return message;
    if (success) return message;
    if (isConfirming) return `${message} is being confirmed...`;
    return `${message} is being processed...`;
  };

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm">{getStatusMessage()}</p>
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>
          </div>
          {hash && success && (
            <TransactionLink hash={hash} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};