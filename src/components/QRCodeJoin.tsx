import React, { useState } from 'react';
import QRCode from 'react-qr-code';

interface QRCodeJoinProps {
  gameId: string;
  style?: React.CSSProperties;
}

const QRCodeJoin: React.FC<QRCodeJoinProps> = ({ gameId, style }) => {
  const [showQR, setShowQR] = useState(false);
  
  const gameUrl = `${window.location.origin}/?join=${gameId}`;

  if (showQR) {
    return (
      <div style={{ position: 'relative' }}>
        {/* Backdrop */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowQR(false)}
        >
          {/* QR Modal */}
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.3em' }}>
                📱 Scan to Join
              </h3>
              <button
                onClick={() => setShowQR(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '15px',
              marginBottom: '20px'
            }}>
              <QRCode
                value={gameUrl}
                size={200}
                style={{ 
                  height: 'auto', 
                  maxWidth: '100%', 
                  width: '100%',
                  border: '10px solid white',
                  borderRadius: '10px'
                }}
                viewBox="0 0 256 256"
              />
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #e0f2fe, #b3e5fc)',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ 
                color: '#0277bd', 
                margin: '0 0 8px 0',
                fontWeight: '700',
                fontSize: '1em'
              }}>
                Game Code: <strong>{gameId}</strong>
              </p>
              <p style={{ 
                color: '#0288d1', 
                margin: 0,
                fontSize: '0.9em'
              }}>
                Scan QR or enter code manually
              </p>
            </div>
            
            <p style={{
              color: '#6b7280',
              fontSize: '0.9em',
              margin: '0 0 20px 0',
              lineHeight: '1.4'
            }}>
              Players can scan this QR code with their phone camera to join instantly!
            </p>
            
            <button
              onClick={() => setShowQR(false)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '1em',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowQR(true)}
      style={{
        background: 'linear-gradient(135deg, #ec4899, #db2777)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '8px 16px',
        fontSize: '0.8rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
        transition: 'all 0.3s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'translateY(-1px)';
        target.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'translateY(0)';
        target.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.3)';
      }}
      title="Show QR code for easy joining"
    >
      📱 QR Code
    </button>
  );
};

export default QRCodeJoin; 