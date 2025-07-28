import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import QRCode from 'react-qr-code';

interface QRCodeJoinProps {
  gameId: string;
  style?: React.CSSProperties;
}

const QRCodeJoin: React.FC<QRCodeJoinProps> = ({ gameId, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const gameUrl = `${window.location.origin}/?join=${gameId}`;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleOpen = () => {
    if (isDisabled || isOpen) return;
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsDisabled(true);
    
    // Re-enable after delay to prevent rapid reopening
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsDisabled(false);
    }, 1000);
  };

  const modal = isOpen ? ReactDOM.createPortal(
    <div style={{ position: 'fixed', zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}
        onClick={handleClose}
      >
        {/* Modal Content */}
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '5px',
              lineHeight: 1
            }}
          >
            ✕
          </button>

          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#1f2937', 
            fontSize: '1.3em' 
          }}>
            📱 Scan to Join
          </h3>
          
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
                width: '100%'
              }}
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
          
          <button
            onClick={handleClose}
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
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={isDisabled}
        style={{
          background: isDisabled 
            ? '#d1d5db'
            : 'linear-gradient(135deg, #ec4899, #db2777)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '8px 16px',
          fontSize: '0.8rem',
          fontWeight: '600',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: isDisabled 
            ? 'none'
            : '0 2px 8px rgba(236, 72, 153, 0.3)',
          transition: 'all 0.3s ease',
          opacity: isDisabled ? 0.6 : 1,
          ...style
        }}
      >
        📱 QR Code
      </button>
      {modal}
    </>
  );
};

export default QRCodeJoin; 