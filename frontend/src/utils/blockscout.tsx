// src/utils/blockscout.ts
import React from 'react';
import { ExternalLink } from 'lucide-react';

// Generate Blockscout URLs for transactions
export interface BlockscoutUrls {
  transaction: string | null
  address: string
  baseUrl: string
}

export function generateBlockscoutUrls(
  transactionHash?: string, 
  address?: string,
  chainId: string | number = '11155111'
): BlockscoutUrls {
  const chainIdNum = typeof chainId === 'string' ? parseInt(chainId) : chainId;
  
  // For Sepolia
  if (chainIdNum === 11155111) {
    const baseUrl = 'https://sepolia.etherscan.io'
    return {
      transaction: transactionHash ? `${baseUrl}/tx/${transactionHash}` : null,
      address: address ? `${baseUrl}/address/${address}` : `${baseUrl}`,
      baseUrl
    }
  }
  
  // For Mainnet
  if (chainIdNum === 1) {
    const baseUrl = 'https://etherscan.io'
    return {
      transaction: transactionHash ? `${baseUrl}/tx/${transactionHash}` : null,
      address: address ? `${baseUrl}/address/${address}` : `${baseUrl}`,
      baseUrl
    }
  }
  
  // For local development
  if (chainIdNum === 31337 || chainIdNum === 1337) {
    const baseUrl = 'http://localhost:3000'
    return {
      transaction: transactionHash ? `${baseUrl}/tx/${transactionHash}` : null,
      address: address ? `${baseUrl}/address/${address}` : `${baseUrl}`,
      baseUrl
    }
  }
  
  // Default fallback - Sepolia
  const baseUrl = 'https://sepolia.etherscan.io'
  return {
    transaction: transactionHash ? `${baseUrl}/tx/${transactionHash}` : null,
    address: address ? `${baseUrl}/address/${address}` : `${baseUrl}`,
    baseUrl
  }
}

// Trigger transaction popup
export function triggerTransactionPopup(
  chainId: string, 
  address: string, 
  transactionHash?: string,
  customBlockscoutUrl?: string
) {
  const urls = generateBlockscoutUrls(transactionHash, address, chainId);
  
  const event = new CustomEvent('openTransactionPopup', {
    detail: {
      chainId,
      address,
      transactionHash,
      blockscoutUrl: customBlockscoutUrl || urls.transaction
    }
  })
  window.dispatchEvent(event)
}

// Create view on Blockscout button component
interface ViewOnBlockscoutButtonProps {
  transactionHash?: string
  address?: string
  chainId?: string
  className?: string 
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export const ViewOnBlockscoutButton: React.FC<ViewOnBlockscoutButtonProps> = ({ 
  transactionHash, 
  address,
  chainId = '11155111',
  className = '',
  size = 'sm',
  showIcon = true
}) => {
  const handleViewOnBlockscout = () => {
    triggerTransactionPopup(chainId, address || '', transactionHash)
  }

  const urls = generateBlockscoutUrls(transactionHash, address, chainId)
  const displayUrl = transactionHash ? urls.transaction : urls.address

  const sizeClasses = {
    sm: 'h-6 text-xs px-2',
    md: 'h-7 text-sm px-3',
    lg: 'h-8 text-base px-4'
  }

  return (
    <button
      onClick={handleViewOnBlockscout}
      className={`inline-flex items-center gap-1 border-2 border-blue-400 bg-white text-blue-600 hover:bg-blue-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)] rounded-lg font-medium ${sizeClasses[size]} ${className}`}
      title={displayUrl || 'View on Explorer'}
    >
      {showIcon && <ExternalLink className="h-3 w-3" />}
      View {transactionHash ? 'TX' : 'Explorer'}
    </button>
  )
}

// Component for displaying transaction status with Blockscout link
interface TransactionStatusWithBlockscoutProps {
  transactionHash?: string
  isSuccess?: boolean
  isPending?: boolean
  message?: string
  chainId?: string
}

export const TransactionStatusWithBlockscout: React.FC<TransactionStatusWithBlockscoutProps> = ({ 
  transactionHash,
  isSuccess,
  isPending,
  message,
  chainId = '11155111'
}) => {
  if (!transactionHash) return null;

  return (
    <div className={`p-3 rounded-xl border-2 mb-3 ${
      isSuccess ? 'bg-green-50 border-green-400' :
      isPending ? 'bg-blue-50 border-blue-400' :
      'bg-gray-50 border-gray-400'
    } shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${
            isSuccess ? 'bg-green-500' :
            isPending ? 'bg-blue-500 animate-pulse' :
            'bg-gray-500'
          }`} />
          <div>
            <p className="text-sm font-medium text-gray-800">
              {isSuccess ? 'Transaction Confirmed' : 
               isPending ? 'Transaction Processing' : 
               'Transaction Submitted'}
            </p>
            {message && (
              <p className="text-xs text-gray-600">{message}</p>
            )}
          </div>
        </div>
        <ViewOnBlockscoutButton 
          transactionHash={transactionHash}
          chainId={chainId}
          size="sm"
        />
      </div>
    </div>
  );
}