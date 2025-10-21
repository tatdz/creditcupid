import React from 'react';
import { ExternalLink } from 'lucide-react';

interface TransactionLinkProps {
  hash: string;
  className?: string;
}

export const TransactionLink: React.FC<TransactionLinkProps> = ({ hash, className = '' }) => {
  return (
    <a 
      href={`https://eth-sepolia.blockscout.com/tx/${hash}`}
      target="_blank" 
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm ${className}`}
    >
      View on Blockscout <ExternalLink className="h-3 w-3" />
    </a>
  );
};