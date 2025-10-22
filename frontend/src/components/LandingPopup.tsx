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
      <div className="fixed inset-0 flex items-center justify-center z-50 font-vt323 min-h-screen bg-gradient-to-br from-blue-400 to-red-500">
        <div className="text-center p-8">
          <img
            src={gifUrl}
            alt="Cupid Animation"
            className="mx-auto border-4 border-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] mb-6"
            style={{
              width: 400,
              height: 400,
            }}
          />
          
          <div className="text-white max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
              CREDITCUPID
            </h1>
            
            <p className="text-2xl text-yellow-200 mb-6 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
              The first onchain credit oracle to spark authentic bonds in romance and P2P lending
            </p>

            {/* Footer Note - Moved higher up */}
            <div className="mb-6 p-4 bg-white bg-opacity-10 border-2 border-white border-dashed rounded-lg">
              <p className="text-lg text-yellow-200 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
                Build your credit score • Date on your financial frequency • Get better DeFi terms
              </p>
            </div>

            {/* Connection Section */}
            <div className="mt-4">
              {isConnecting ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"></div>
                  <p className="text-2xl text-yellow-200 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                    ANALYZING ON-CHAIN ACTIVITY...
                  </p>
                </div>
              ) : hasEthereum ? (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleManualConnect}
                    disabled={isConnecting}
                    className="text-2xl px-8 py-4 bg-green-500 hover:bg-green-600 text-white border-4 border-green-700 rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transition-all duration-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-1"
                  >
                    CONNECT WALLET
                  </button>
                  <p className="text-xl text-yellow-200 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                    Click to connect your wallet and continue
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl text-yellow-200 mb-4 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                    NO WALLET DETECTED
                  </p>
                  <div className="flex gap-6 justify-center">
                    <a 
                      href="https://metamask.io/download/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xl text-white hover:text-yellow-200 underline drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-colors duration-200"
                    >
                      Install MetaMask
                    </a>
                    <a 
                      href="https://talisman.xyz/download" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xl text-white hover:text-yellow-200 underline drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-colors duration-200"
                    >
                      Install Talisman
                    </a>
                  </div>
                </div>
              )}

              {connectionError && (
                <div className="mt-4 p-4 bg-red-500 bg-opacity-80 border-4 border-red-700 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] max-w-md mx-auto">
                  <p className="text-lg text-white text-center drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
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