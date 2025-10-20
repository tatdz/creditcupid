import React, { useEffect } from 'react';

interface LandingPopupProps {
  gifUrl: string;
  onComplete: () => void;
}

const LandingPopup: React.FC<LandingPopupProps> = ({ gifUrl, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // show popup for 4 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

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
              width: 500, // Enlarged GIF width
              height: 500, // Enlarged GIF height
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
                fontWeight: 'normal',
              }}
            >
              The first onchain credit oracle to spark authentic bonds in romance and P2P lending💘
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPopup;
