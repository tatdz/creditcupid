import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CheckCircle, ExternalLink, Lock, Loader2, Shield, FileText, Download } from 'lucide-react';
import { ZKProofs } from '../../../types/credit';
import { realZKProofGenerator } from '../utils/realZKProofs';

interface RealZKVerificationProps {
  proofs: ZKProofs;
}

export const RealZKVerification: React.FC<RealZKVerificationProps> = ({ proofs }) => {
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<{[key: string]: any}>({});
  const [report, setReport] = useState<any>(null);

  const verifyProof = async (proofType: string, proofData: string) => {
    setVerifying(proofType);
    
    try {
      const result = await realZKProofGenerator.verifyProofLocally(proofType, proofData);
      
      setVerificationResults(prev => ({
        ...prev,
        [proofType]: result
      }));
      
      console.log(`🔍 ${proofType} verification:`, result);
    } catch (error) {
      console.error(`Error verifying ${proofType}:`, error);
      setVerificationResults(prev => ({
        ...prev,
        [proofType]: {
          valid: false,
          message: 'Verification failed',
          proofHash: 'error'
        }
      }));
    } finally {
      setVerifying(null);
    }
  };

  const generateVerificationReport = async () => {
    setVerifying('report');
    try {
      const newReport = await realZKProofGenerator.generateVerificationReport(proofs);
      setReport(newReport);
      console.log('📊 Verification Report:', newReport);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setVerifying(null);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportContent = realZKProofGenerator.generateDownloadableReport(report);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `darma-verification-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ProofItem: React.FC<{
    type: string;
    title: string;
    description: string;
    proof: string;
    isVerified: boolean;
  }> = ({ type, title, description, proof, isVerified }) => {
    const verification = verificationResults[type];
    const isVerifying = verifying === type;
    
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            verification?.valid ? 'bg-green-100 text-green-600' :
            isVerifying ? 'bg-blue-100 text-blue-600' :
            verification ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {verification?.valid ? (
              <CheckCircle className="h-5 w-5" />
            ) : isVerifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : verification ? (
              <Shield className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-green-700">{description}</div>
            <div className="text-xs text-green-600 mt-1 font-mono">
              Proof: {proof}
            </div>
            {verification && (
              <div className={`text-xs mt-1 ${
                verification.valid ? 'text-green-600' : 'text-red-600'
              }`}>
                {verification.message}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`text-sm font-semibold ${
            verification?.valid ? 'text-green-700' :
            isVerifying ? 'text-blue-700' :
            verification ? 'text-red-700' :
            'text-gray-700'
          }`}>
            {verification?.valid ? 'Verified' :
             isVerifying ? 'Verifying...' :
             verification ? 'Failed' :
             isVerified ? 'Ready to Verify' : 'Not Verified'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => verifyProof(type, proof)}
            disabled={isVerifying}
            className="h-8 text-xs"
          >
            {isVerifying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ExternalLink className="h-3 w-3 mr-1" />
            )}
            Verify
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Zero-Knowledge Proof Verification
        </CardTitle>
        <CardDescription>
          Cryptographic proofs verified locally with secure hashing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <ProofItem
            type="income"
            title="Income Verification"
            description="Stable income stream verified"
            proof={proofs.proofs.incomeProof}
            isVerified={proofs.incomeVerified}
          />
          
          <ProofItem
            type="balance"
            title="Account Balance"
            description="Minimum balance requirement met"
            proof={proofs.proofs.balanceProof}
            isVerified={proofs.accountBalanceVerified}
          />
          
          <ProofItem
            type="transaction"
            title="Transaction History"
            description="Active account history verified"
            proof={proofs.proofs.transactionProof}
            isVerified={proofs.transactionHistoryVerified}
          />
          
          <ProofItem
            type="identity"
            title="Identity Verification"
            description="Identity information confirmed"
            proof={proofs.proofs.identityProof}
            isVerified={proofs.identityVerified}
          />
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={generateVerificationReport}
            disabled={verifying === 'report'}
            className="flex items-center gap-2"
          >
            {verifying === 'report' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generate Verification Report
          </Button>
          
          {report && (
            <Button
              onClick={downloadReport}
              variant="default"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>

        {report && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Verification Report</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <strong>Overall Score:</strong> {report.overallScore}/100
              </div>
              <div>
                <strong>Verification Level:</strong> {report.details.verificationLevel}
              </div>
              <div>
                <strong>Valid Proofs:</strong> {report.details.validProofs}/{report.details.totalProofs}
              </div>
              <div>
                <strong>Summary:</strong> {report.summary}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <Shield className="h-4 w-4" />
            <div>
              <strong>Local ZK Proofs:</strong> Each proof generates a unique cryptographic hash 
              that can be independently verified. Click "Verify" to check proof validity locally.
              No external services required.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};