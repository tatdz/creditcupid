import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { CheckCircle, ExternalLink, Shield, FileText, Download, AlertCircle } from 'lucide-react';
import { StoredPrivacyProofs } from '../../../types/credit';

interface PrivacyVerificationProps {
  proofs: StoredPrivacyProofs;
}

const ProofItem: React.FC<{
  title: string;
  verified: boolean;
  proof: string;
  cid?: string;
  pinataURL?: string;
  isRealCID?: boolean;
}> = ({ title, verified, proof, cid, pinataURL, isRealCID }) => {
  const hasRealIPFS = isRealCID && pinataURL && !pinataURL.startsWith('#');
  
  const openPinataLink = (url?: string) => {
    if (url && !url.startsWith('#') && hasRealIPFS) {
      console.log('Opening Pinata link:', url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-center gap-3 flex-1">
        <div className={`p-2 rounded-full ${
          verified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {verified ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className={`text-sm ${verified ? 'text-green-700' : 'text-red-700'}`}>
            {verified ? 'Automatically Verified' : 'Not Verified'}
          </div>
          
          {/* REMOVED THE CID LINE COMPLETELY */}
          
          {hasRealIPFS && (
            <div className="text-xs text-green-600 mt-1">
              🔗 <a 
                href={pinataURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-green-800"
                onClick={(e) => e.stopPropagation()}
              >
                Click to view on IPFS
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* Removed the blue "View on IPFS" button */}
    </div>
  );
};

export const PrivacyVerification: React.FC<PrivacyVerificationProps> = ({ proofs }) => {
  const downloadAllProofs = () => {
    const proofsData = {
      generatedBy: 'Darma Credit Protocol',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      proofs: {
        income: {
          verified: proofs.incomeVerified,
          proof: proofs.proofs.incomeProof,
          ipfsCID: proofs.ipfsData.incomeProofCID,
          pinataURL: proofs.pinataURLs.incomeProof,
          isRealCID: proofs._metadata?.usingRealIPFS
        },
        balance: {
          verified: proofs.accountBalanceVerified,
          proof: proofs.proofs.balanceProof,
          ipfsCID: proofs.ipfsData.balanceProofCID,
          pinataURL: proofs.pinataURLs.balanceProof,
          isRealCID: proofs._metadata?.usingRealIPFS
        },
        transaction: {
          verified: proofs.transactionHistoryVerified,
          proof: proofs.proofs.transactionProof,
          ipfsCID: proofs.ipfsData.transactionProofCID,
          pinataURL: proofs.pinataURLs.transactionProof,
          isRealCID: proofs._metadata?.usingRealIPFS
        },
        identity: {
          verified: proofs.identityVerified,
          proof: proofs.proofs.identityProof,
          ipfsCID: proofs.ipfsData.identityProofCID,
          pinataURL: proofs.pinataURLs.identityProof,
          isRealCID: proofs._metadata?.usingRealIPFS
        }
      },
      ipfsLinks: proofs.pinataURLs,
      metadata: proofs._metadata
    };

    const blob = new Blob([JSON.stringify(proofsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `darma-privacy-proofs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPinataLink = (url?: string) => {
    const hasRealIPFS = proofs._metadata?.usingRealIPFS;
    if (url && !url.startsWith('#') && hasRealIPFS) {
      console.log('Opening Pinata link:', url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isRealIPFSLink = (url?: string): boolean => {
    return !!(url && !url.startsWith('#') && url.includes('pinata.cloud'));
  };

  const hasRealIPFS = proofs._metadata?.usingRealIPFS;
  const verifiedCount = [
    proofs.incomeVerified,
    proofs.accountBalanceVerified, 
    proofs.transactionHistoryVerified,
    proofs.identityVerified
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy-Preserving Verification
          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded font-semibold">
            {verifiedCount}/4 Verified
          </span>
        </CardTitle>
        <CardDescription>
          {hasRealIPFS 
            ? 'All proofs automatically verified and stored on IPFS via Pinata'
            : 'Proofs automatically verified with example CIDs'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage Status Banner */}
        {!hasRealIPFS && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-semibold text-yellow-900">Using Example CIDs</h4>
                <p className="text-sm text-yellow-800">
                  The system is showing example IPFS CIDs. Check your Pinata credentials and console logs to see why real CIDs aren't being generated.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <ProofItem
            title="Income Verification"
            verified={proofs.incomeVerified}
            proof={proofs.proofs.incomeProof}
            cid={proofs.ipfsData.incomeProofCID}
            pinataURL={proofs.pinataURLs.incomeProof}
            isRealCID={proofs._metadata?.usingRealIPFS}
          />
          
          <ProofItem
            title="Account Balance"
            verified={proofs.accountBalanceVerified}
            proof={proofs.proofs.balanceProof}
            cid={proofs.ipfsData.balanceProofCID}
            pinataURL={proofs.pinataURLs.balanceProof}
            isRealCID={proofs._metadata?.usingRealIPFS}
          />
          
          <ProofItem
            title="Transaction History"
            verified={proofs.transactionHistoryVerified}
            proof={proofs.proofs.transactionProof}
            cid={proofs.ipfsData.transactionProofCID}
            pinataURL={proofs.pinataURLs.transactionProof}
            isRealCID={proofs._metadata?.usingRealIPFS}
          />
          
          <ProofItem
            title="Identity Verification"
            verified={proofs.identityVerified}
            proof={proofs.proofs.identityProof}
            cid={proofs.ipfsData.identityProofCID}
            pinataURL={proofs.pinataURLs.identityProof}
            isRealCID={proofs._metadata?.usingRealIPFS}
          />
        </div>

        {/* Full Proofs Set*/}
        {proofs.pinataURLs.fullProofs && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">Complete Proofs Set</h4>
                <p className="text-sm text-blue-700">
                  {hasRealIPFS 
                    ? 'All proofs combined in a single IPFS file'
                    : 'All proofs combined (ready for IPFS)'
                  }
                </p>
                {hasRealIPFS && proofs.pinataURLs.fullProofs && (
                  <div className="text-xs text-blue-600 mt-1">
                    🔗 <a 
                      href={proofs.pinataURLs.fullProofs} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-800"
                    >
                      Click to view complete proofs on IPFS
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {hasRealIPFS 
              ? 'All proofs stored permanently on IPFS and automatically verified'
              : 'Proofs automatically verified. Add Pinata credentials for IPFS storage.'
            }
          </div>
          
          <button
            onClick={downloadAllProofs}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Proofs
          </button>
        </div>

        {/* Info Panel */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <Shield className="h-4 w-4" />
            <div>
              <strong>Automatic Verification:</strong> All privacy-preserving verifications are generated and confirmed automatically when you connect your bank account. 
              {!hasRealIPFS && (
                <span className="block mt-1">
                  <strong>To enable IPFS storage:</strong> Add valid Pinata credentials to your .env file for permanent proof storage.
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};