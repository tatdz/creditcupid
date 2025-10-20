import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface LandingPopupProps {
  gifUrl: string;
  onComplete: () => void;
}

// Extend Window interface for wallet providers
declare global {
  interface Window {
    ethereum?: any;
    talismanEth?: any;
  }
}

const LandingPopup: React.FC<LandingPopupProps> = ({ gifUrl, onComplete }) => {
  const { isConnected } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Auto-connect when wallet is detected and user is not connected
  useEffect(() => {
    const autoConnect = async () => {
      if (isConnected || !window.ethereum || isConnecting) return;

      try {
        setIsConnecting(true);
        setConnectionError(null);
        
        console.log('🔄 Checking wallet connection...');
        
        // Check if already connected by requesting accounts
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          console.log('✅ Wallet already connected');
          onComplete();
          return;
        }

        // If not connected, try to connect automatically
        console.log('🔗 Attempting auto-connection...');
        await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        console.log('✅ Auto-connection successful');
        onComplete();
        
      } catch (err: any) {
        console.log('❌ Auto-connection failed:', err);
        // Don't show error for user rejection - that's expected behavior
        if (err.code !== 4001) { // 4001 is user rejected
          setConnectionError(err.message || 'Failed to connect wallet');
        }
      } finally {
        setIsConnecting(false);
      }
    };

    // Only auto-connect if ethereum is detected
    if (window.ethereum) {
      autoConnect();
    }
  }, [isConnected, isConnecting, onComplete]);

  const handleManualConnect = async () => {
    if (!window.ethereum) {
      setConnectionError('No Ethereum wallet detected. Please install MetaMask or Talisman.');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      console.log('🔗 Manual connection attempt...');
      await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log('✅ Manual connection successful');
      onComplete();
      
    } catch (err: any) {
      console.error('❌ Manual connection failed:', err);
      if (err.code !== 4001) { // 4001 is user rejected
        setConnectionError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // If connected, don't show the popup
  if (isConnected) {
    return null;
  }

  const hasEthereum = !!window.ethereum;

  return (
    <>
      {/* Import VT323 font via Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
        rel="stylesheet"
      />
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{
          background: 'linear-gradient(135deg, rgb(72,144,255) 0%, rgb(160,200,255) 100%)',
        }}
      >
        <div className="text-center">
          <img
            src={gifUrl}
            alt="Cupid Animation"
            style={{
              width: 400,
              height: 400,
              margin: '0 auto',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          />
          <div
            className="text-white drop-shadow-lg"
            style={{
              fontFamily: "'VT323', monospace",
              marginTop: '2rem',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <h1
              style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                fontWeight: 'normal',
                whiteSpace: 'pre-line',
              }}
            >
              Welcome to CreditCupid!
            </h1>
            <p
              style={{
                fontSize: '1.5rem',
                lineHeight: 1.5,
                marginTop: 0,
                marginBottom: '2rem',
                fontWeight: 'normal',
              }}
            >
              The first onchain credit oracle to spark authentic bonds in romance and P2P lending💘
            </p>

            {/* Connection Section */}
            <div className="mt-6">
              {isConnecting ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                  <p style={{ fontSize: '1.2rem' }}>Connecting to your wallet...</p>
                </div>
              ) : hasEthereum ? (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleManualConnect}
                    disabled={isConnecting}
                    style={{
                      fontFamily: "'VT323', monospace",
                      fontSize: '1.5rem',
                      padding: '12px 24px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    }}
                  >
                    Connect Wallet
                  </button>
                  <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
                    Click to connect your wallet and continue
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                    No wallet detected
                  </p>
                  <div className="flex gap-4 justify-center">
                    <a 
                      href="https://metamask.io/download/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: 'white',
                        textDecoration: 'underline',
                        fontSize: '1.1rem',
                      }}
                    >
                      Install MetaMask
                    </a>
                    <a 
                      href="https://talisman.xyz/download" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: 'white',
                        textDecoration: 'underline',
                        fontSize: '1.1rem',
                      }}
                    >
                      Install Talisman
                    </a>
                  </div>
                </div>
              )}

              {connectionError && (
                <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-300 rounded max-w-md mx-auto">
                  <p style={{ color: 'white', fontSize: '1.1rem' }}>
                    {connectionError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPopup;