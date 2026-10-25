import React, { useState } from 'react';
import Modal from './common/Modal';
import { showToast } from './common/Toast';
import { publicGameOrigin, shareInvite, isShareCancelled } from '../services/appPlatform';

interface ShareButtonProps {
  gameId?: string;
  gameType?: 'traditional' | 'holiday-challenge';
  style?: React.CSSProperties;
  size?: 'small' | 'medium' | 'large';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  gameId,
  gameType,
  style,
  size = 'medium'
}) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  const baseUrl = publicGameOrigin();

  // Include game type in URL for YOU GOT WHO? games
  const shareUrl = gameId
    ? gameType === 'holiday-challenge'
      ? `${baseUrl}/?join=${gameId}&type=you-got-who`
      : `${baseUrl}/?join=${gameId}`
    : baseUrl;

  const isYouGotWho = gameType === 'holiday-challenge';

  // The pitch without the link. The link goes last on its own line so WhatsApp
  // and iMessage turn it into the big preview card (public/og-image.png).
  const pitch = gameId
    ? isYouGotWho
      ? `🏖️ Holiday challenge time!\nJoin my You Got Who? game — we all race the same challenges, first to finish takes the points.\n\nCode: ${gameId}`
      : `🕵️ You're invited!\nJoin my Who Got Who game — we each get secret missions to pull off on each other during the party. Don't get caught.\n\nCode: ${gameId}`
    : "🕵️ Who Got Who — a party game of secret missions you play in the background of a night out. No app, no sign-up.";
  const shareText = `${pitch}\n\n👉 ${shareUrl}`;

  const shareTitle = gameId
    ? isYouGotWho
      ? `Join my You Got Who? game · ${gameId}`
      : `Join my Who Got Who game · ${gameId}`
    : 'Who Got Who — the secret-mission party game';

  // Try native Web Share API first (mobile)
  const handleNativeShare = async () => {
      try {
        // Pass the link separately: Android appends `url` to `text`, so including
        // it in both would send the link twice.
        const shared = await shareInvite({
          title: shareTitle,
          text: `${pitch}\n\n👉`,
          url: shareUrl,
        });
        return { success: shared, cancelled: false };
      } catch (error) {
        if (isShareCancelled(error)) {
          return { success: false, cancelled: true };
        }
        return { success: false, cancelled: false };
      }
  };

  const handleShare = async () => {
    const result = await handleNativeShare();
    if (!result.success && !result.cancelled) {
      setShowShareOptions(true);
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
            url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      color: '#25D366'
    },
    {
      name: 'SMS',
            url: `sms:?body=${encodeURIComponent(shareText)}`,
      color: '#007AFF'
    },
    {
      name: 'Email',
            url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`,
      color: '#FF3B30'
    },
    {
      name: 'Copy Link',
            action: 'copy',
      color: '#8E8E93'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    showToast('Invite copied — paste it anywhere!', 'success');
    setShowShareOptions(false);
  };

  const handleOptionClick = (option: typeof shareOptions[0]) => {
    if (option.action === 'copy') {
      copyToClipboard();
    } else {
      window.open(option.url, '_blank');
      setShowShareOptions(false);
    }
  };

  const buttonSizes = {
    small: { padding: '8px 16px', fontSize: '0.9rem' },
    medium: { padding: '12px 24px', fontSize: '1rem' },
    large: { padding: '16px 32px', fontSize: '1.1rem' }
  };

  return (
    <>
      <button
        onClick={handleShare}
        aria-label={gameId ? 'Share game invite' : 'Share Who Got Who'}
        style={{
          background: 'var(--primary-gradient)',
          color: '#fdf6ec',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          ...buttonSizes[size],
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 3px 0 var(--primary-deep)',
          transition: 'transform 0.08s ease',
          ...style
        }}
      >
        Share
      </button>

      <Modal
        isOpen={showShareOptions}
        onClose={() => setShowShareOptions(false)}
        ariaLabel="Share game"
        maxWidth={400}
        showClose
      >
        <h3 style={{ margin: '0 0 1.25rem', textAlign: 'left' }}>Share Game</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => handleOptionClick(option)}
              style={{
                padding: '18px 12px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: `${option.color}18`,
                color: option.color,
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              {option.name}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default ShareButton;
