import React, { useState } from 'react';

interface ShareButtonProps {
  gameId?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'medium' | 'large';
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  gameId, 
  style,
  size = 'medium' 
}) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  const baseUrl = window.location.origin;
  const shareUrl = gameId ? `${baseUrl}/?join=${gameId}` : baseUrl;
  
  const shareText = gameId 
    ? `🎮 Join my Who Got Who game!\n\nGame Code: ${gameId}\n\nSecret missions, stealth gameplay - perfect for parties, dinners & hangouts!\n\n${shareUrl}`
    : `🎮 Check out Who Got Who!\n\nSecret missions game perfect for parties, dinners & social events. Play in the background of whatever you're doing!\n\n${shareUrl}`;

  const shareTitle = gameId 
    ? `Join Who Got Who Game ${gameId}!`
    : 'Who Got Who - The Ultimate Party Game';

  // Try native Web Share API first (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return true;
      } catch (error) {
        console.log('Native share cancelled or failed:', error);
        return false;
      }
    }
    return false;
  };

  const handleShare = async () => {
    // Try native share first
    const nativeShareSuccess = await handleNativeShare();
    
    if (!nativeShareSuccess) {
      // Show custom share options
      setShowShareOptions(true);
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      color: '#25D366'
    },
    {
      name: 'SMS',
      icon: '📱',
      url: `sms:?body=${encodeURIComponent(shareText)}`,
      color: '#007AFF'
    },
    {
      name: 'Email',
      icon: '📧',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`,
      color: '#FF3B30'
    },
    {
      name: 'Copy Link',
      icon: '🔗',
      action: 'copy',
      color: '#8E8E93'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert('✅ Copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Copied to clipboard!');
    }
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
    small: { padding: '8px 16px', fontSize: '0.9em' },
    medium: { padding: '12px 24px', fontSize: '1em' },
    large: { padding: '16px 32px', fontSize: '1.1em' }
  };

  if (showShareOptions) {
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
          onClick={() => setShowShareOptions(false)}
        >
          {/* Share modal */}
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '400px',
              width: '100%',
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
                📤 Share Game
              </h3>
              <button
                onClick={() => setShowShareOptions(false)}
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
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px'
            }}>
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => handleOptionClick(option)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px 15px',
                    border: 'none',
                    borderRadius: '15px',
                    background: `${option.color}15`,
                    color: option.color,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '0.9em',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = `${option.color}25`;
                    target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = `${option.color}15`;
                    target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                    {option.icon}
                  </div>
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      style={{
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        border: 'none',
        borderRadius: '15px',
        ...buttonSizes[size],
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
        transition: 'all 0.3s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'translateY(-2px)';
        target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'translateY(0)';
        target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
      }}
    >
      📤 Share Game
    </button>
  );
};

export default ShareButton; 