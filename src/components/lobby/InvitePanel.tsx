import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import ShareButton from '../ShareButton';
import BrandMark from '../common/BrandMark';
import Mascot from '../common/Mascot';
import { showToast } from '../common/Toast';

interface InvitePanelProps {
  gameId: string;
  gameType?: 'traditional' | 'holiday-challenge';
  playerCount: number;
  maxPlayers: number;
}

type WakeLockSentinel = { release: () => Promise<void> };

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }
}

/** The code as the hero, plus every way to get people in: share, link, QR. */
export default function InvitePanel({ gameId, gameType, playerCount, maxPlayers }: InvitePanelProps) {
  const [showQr, setShowQr] = useState(false);
  const joinUrl = `${window.location.origin}/?join=${gameId}${gameType === 'holiday-challenge' ? '&type=you-got-who' : ''}`;

  // Keep the screen awake while the host holds the QR up for people to scan.
  useEffect(() => {
    if (!showQr) return undefined;
    let lock: WakeLockSentinel | null = null;
    const wakeLock = (navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> };
    }).wakeLock;
    void wakeLock?.request('screen').then((sentinel) => {
      lock = sentinel;
    }).catch(() => undefined);
    return () => {
      void lock?.release().catch(() => undefined);
    };
  }, [showQr]);

  return (
    <header className="invite-panel">
      {gameType === 'holiday-challenge'
        ? <BrandMark size={64} className="brand-mark-centered" />
        : <Mascot pose="lobby" size={104} className="mascot-centered" />}
      <div className="overline" style={{ marginBottom: '0.6rem' }}>
        {gameType === 'holiday-challenge' ? 'You Got Who? · Operation' : 'Who Got Who · Operation'}
      </div>
      <button
        className="invite-code"
        onClick={async () => {
          await copyText(gameId);
          showToast('Code copied — send it to your crew', 'success');
        }}
        aria-label={`Game code ${gameId}. Tap to copy`}
      >
        {gameId}
      </button>
      <div className="app-subtitle" style={{ marginTop: '0.3rem' }}>
        tap the code to copy · {playerCount}/{maxPlayers} agents in
      </div>

      <div className="invite-actions">
        <ShareButton
          gameId={gameId}
          gameType={gameType}
          size="small"
          style={{ minHeight: 44, padding: '8px 6px', fontSize: '0.8rem', justifyContent: 'center' }}
        />
        <button
          className={`chip-btn ${showQr ? 'active' : ''}`}
          onClick={() => setShowQr((value) => !value)}
          aria-expanded={showQr}
        >
          {showQr ? 'Hide QR' : 'Show QR'}
        </button>
        <button
          className="chip-btn"
          onClick={async () => {
            await copyText(joinUrl);
            showToast('Invite link copied', 'success');
          }}
        >
          Copy link
        </button>
      </div>

      {showQr && (
        <div className="qr-panel">
          <div className="qr-frame">
            <QRCode value={joinUrl} size={220} style={{ width: '100%', height: 'auto' }} />
          </div>
          <p className="type">point a camera here to join {gameId}</p>
        </div>
      )}
    </header>
  );
}
