import React, { useState } from 'react';
import Modal from './common/Modal';
import { showToast } from './common/Toast';

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

  const baseUrl = window.location.origin;

  // Include game type in URL for YOU GOT WHO? games
  const shareUrl = gameId
    ? gameType === 'holiday-challenge'
      ? `${baseUrl}/?join=${gameId}&type=you-got-who`
      : `${baseUrl}/?join=${gameId}`
    : baseUrl;

  const isYouGotWho = gameType === 'holiday-challenge';

  const shareText = gameId
    ? isYouGotWho
      ? `🏖️ Join my YOU GOT WHO? game!\n\nGame Code: ${gameId}\n\nSocial holiday challenges - race to complete the same challenges! Perfect for vacations!\n\n${shareUrl}`
      : `🎮 Join my WHO GOT WHO? game!\n\nGame Code: ${gameId}\n\nSecret missions, stealth gameplay - perfect for parties, dinners & hangouts!\n\n${shareUrl}`
    : `🎮 Check out WHO GOT WHO?\n\nSecret missions game perfect for parties, dinners & social events. Play in the background of whatever you're doing!\n\n${shareUrl}`;

  const shareTitle = gameId
    ? isYouGotWho
      ? `Join YOU GOT WHO? Game ${gameId}!`
      : `Join WHO GOT WHO? Game ${gameId}!`
    : 'WHO GOT WHO? - The Ultimate Party Game';

  // Try native Web Share API first (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return { success: true, cancelled: false };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return { success: false, cancelled: true };
        }
        return { success: false, cancelled: false };
      }
    }
    return { success: false, cancelled: false };
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
    small: { padding: '8px 16px', fontSize: '0.85rem' },
    medium: { padding: '12px 24px', fontSize: '1rem' },
    large: { padding: '16px 32px', fontSize: '1.1rem' }
  };

  return (
    <>
      <button
        onClick={handleShare}
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
        Share Game
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
