import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import LandingPopup from '../components/LandingPopup';
import { CreditDashboard } from '../components/credit-dashboard/CreditDashboard';
const cupidGif = '/cupid.gif';

function AppContent() {
  const { isConnected } = useAccount();

  // No more API keys in frontend - they're handled by backend proxies
  useEffect(() => {
    console.log('🔑 API keys are now securely handled by backend proxies');
    // The service will now use backend endpoints instead of direct API calls
  }, []);

  // Show LandingPopup until wallet is connected
  if (!isConnected) {
    return <LandingPopup gifUrl={cupidGif} onComplete={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <CreditDashboard />
    </div>
  );
}

export default function Home() {
  return <AppContent />;
}