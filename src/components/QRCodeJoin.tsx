import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import Modal from './common/Modal';
import { publicGameOrigin } from '../services/appPlatform';

interface QRCodeJoinProps {
  gameId: string;
  gameType?: 'traditional' | 'holiday-challenge';
  style?: React.CSSProperties;
}

const QRCodeJoin: React.FC<QRCodeJoinProps> = ({ gameId, gameType, style }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Include game type in URL for YOU GOT WHO? games
  const gameUrl = gameType === 'holiday-challenge'
    ? `${publicGameOrigin()}/?join=${gameId}&type=you-got-who`
    : `${publicGameOrigin()}/?join=${gameId}`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'var(--ink-2)',
          color: 'var(--text-main)',
          border: '2px solid var(--line-strong)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 16px',
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          ...style
        }}
      >
        QR Code
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ariaLabel="Scan to join this game"
        maxWidth={380}
        showClose
      >
        <h3 style={{ margin: '0 0 1.1rem' }}>Scan to Join</h3>

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
          <p style={{ color: 'var(--info-ink)', margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>
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
