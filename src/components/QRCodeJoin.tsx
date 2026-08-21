import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import Modal from './common/Modal';

interface QRCodeJoinProps {
  gameId: string;
  gameType?: 'traditional' | 'holiday-challenge';
  style?: React.CSSProperties;
}

const QRCodeJoin: React.FC<QRCodeJoinProps> = ({ gameId, gameType, style }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Include game type in URL for YOU GOT WHO? games
  const gameUrl = gameType === 'holiday-challenge'
    ? `${window.location.origin}/?join=${gameId}&type=you-got-who`
    : `${window.location.origin}/?join=${gameId}`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'linear-gradient(135deg, #ec4899, #db2777)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '8px 16px',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
          ...style
        }}
      >
        📱 QR Code
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ariaLabel="Scan to join this game"
        maxWidth={380}
        showClose
      >
        <h3 style={{ margin: '0 0 1.1rem' }}>📱 Scan to Join</h3>

        <div style={{
          background: '#f9fafb',
          padding: '18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.1rem'
        }}>
          <QRCode
            value={gameUrl}
            size={200}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          />
        </div>

        <div style={{
          background: 'var(--info-soft)',
          border: '1px solid var(--info-border)',
          padding: '0.8rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.1rem'
        }}>
          <p style={{ color: 'var(--info-ink)', margin: '0 0 4px', fontWeight: 700, fontSize: '1rem', letterSpacing: '1px' }}>
            Game code: <strong>{gameId}</strong>
          </p>
          <p style={{ color: 'var(--info-ink)', margin: 0, fontSize: '0.85rem', opacity: 0.85 }}>
            Scan the QR or type the code on the home screen.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsOpen(false)}>
          Done
        </button>
      </Modal>
    </>
  );
};

export default QRCodeJoin;
