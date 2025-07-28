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
        background: isPhotoAvatar ? 'transparent' : '#f8fafc',
        border: showBorder ? `${config.borderWidth} solid #e5e7eb` : 'none',
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          const target = e.target as HTMLDivElement;
          target.style.transform = 'scale(1.05)';
          target.style.borderColor = '#3b82f6';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          const target = e.target as HTMLDivElement;
          target.style.transform = 'scale(1)';
          target.style.borderColor = '#e5e7eb';
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
          lineHeight: '1'
        }}>
          {player.avatar || '🎮'}
        </span>
      )}
      
      {/* Host indicator */}
      {player.isHost && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          borderRadius: '50%',
          width: size === 'small' ? '16px' : '20px',
          height: size === 'small' ? '16px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'small' ? '0.6em' : '0.7em',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          👑
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
        color: '#374151',
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