import React from 'react';
import { Player } from '../types';

interface PlayerAvatarProps {
  player: Player;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showName?: boolean;
  showBorder?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  size = 'medium',
  showName = false,
  showBorder = true,
  style,
  onClick
}) => {
  const sizeConfig = {
    small: { 
      width: '32px', 
      height: '32px', 
      fontSize: '0.9em',
      nameFontSize: '0.7rem',
      borderWidth: '2px'
    },
    medium: { 
      width: '48px', 
      height: '48px', 
      fontSize: '1.4em',
      nameFontSize: '0.8rem',
      borderWidth: '2px'
    },
    large: { 
      width: '64px', 
      height: '64px', 
      fontSize: '1.8em',
      nameFontSize: '0.9rem',
      borderWidth: '3px'
    },
    xlarge: { 
      width: '80px', 
      height: '80px', 
      fontSize: '2.2em',
      nameFontSize: '1rem',
      borderWidth: '3px'
    }
  };

  const config = sizeConfig[size];
  const isPhotoAvatar = player.avatar && player.avatarType === 'photo';

  const avatarElement = (
    <div
      style={{
        width: config.width,
        height: config.height,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isPhotoAvatar ? 'transparent' : 'var(--paper)',
        border: showBorder ? `${config.borderWidth} solid rgba(168, 161, 144, 0.55)` : 'none',
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.borderColor = '#3b82f6';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(168, 161, 144, 0.55)';
        }
      }}
    >
      {isPhotoAvatar ? (
        <img
          src={player.avatar}
          alt={`${player.name}'s avatar`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
          }}
        />
      ) : (
        <span style={{
          fontSize: config.fontSize,
          lineHeight: '1',
          fontFamily: player.avatar ? 'inherit' : 'var(--font-display)',
          color: player.avatar ? 'inherit' : 'var(--paper-ink)',
        }}>
          {player.avatar || player.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}

      {/* Host indicator */}
      {player.isHost && (
        <div
          title="Host"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'linear-gradient(180deg, #e8b554, #d9a441)',
            borderRadius: '50%',
            width: size === 'small' ? '15px' : '18px',
            height: size === 'small' ? '15px' : '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size === 'small' ? '9px' : '11px',
            color: '#3a2b0c',
            border: '2px solid var(--ink-0)',
          }}
        >
          ★
        </div>
      )}
    </div>
  );

  if (!showName) {
    return avatarElement;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px'
    }}>
      {avatarElement}
      <div style={{
        fontSize: config.nameFontSize,
        fontWeight: '600',
        color: 'inherit',
        textAlign: 'center',
        maxWidth: '80px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {player.name}
      </div>
    </div>
  );
};

export default PlayerAvatar; 