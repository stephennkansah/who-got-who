import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';

interface AvatarPickerProps {
  selectedAvatar: string;
  onAvatarChange: (avatar: string, isPhoto: boolean) => void;
  style?: React.CSSProperties;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ 
  selectedAvatar, 
  onAvatarChange, 
  style 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojiAvatars = [
    '🧑‍💼', '👩‍🎓', '🧑‍🎨', '👨‍🍳', '👩‍⚕️', '🦸‍♀️', 
    '🧑‍🚀', '👨‍🔬', '👩‍💻', '🧑‍🎤', '👨‍🎨', '👩‍🔬',
    '🤵', '👰', '🧙‍♂️', '🧙‍♀️', '🧚‍♂️', '🧚‍♀️',
    '🦹‍♂️', '🦹‍♀️', '🧛‍♂️', '🧛‍♀️', '🧜‍♂️', '🧜‍♀️',
    '🎮', '👾', '🤖', '👻', '💀', '🎭',
    '😎', '🤓', '😇', '😈', '🤠', '🥳'
  ];

  const handleEmojiSelect = (emoji: string) => {
    onAvatarChange(emoji, false);
    setShowPicker(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Compression options
      const options = {
        maxSizeMB: 0.1, // 100KB max
        maxWidthOrHeight: 200, // 200px max dimension
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
        quality: 0.8
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onAvatarChange(base64, true);
        setShowPicker(false);
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isPhotoAvatar = selectedAvatar && selectedAvatar.startsWith('data:image');

  if (showPicker) {
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
          onClick={() => setShowPicker(false)}
        >
          {/* Picker Modal */}
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
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
                🎭 Choose Your Avatar
              </h3>
              <button
                onClick={() => setShowPicker(false)}
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

            {/* Photo Upload Section */}
            <div style={{
              background: 'linear-gradient(135deg, #e0f2fe, #b3e5fc)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0277bd' }}>
                📷 Upload Your Selfie
              </h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  background: isUploading ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '1em',
                  fontWeight: '600',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                {isUploading ? '📤 Uploading...' : '📷 Choose Photo'}
              </button>
              <p style={{ 
                margin: '10px 0 0 0', 
                fontSize: '0.8em', 
                color: '#0288d1' 
              }}>
                Max 10MB • Auto-compressed to 100KB
              </p>
            </div>

            {/* Emoji Grid */}
            <div>
              <h4 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>
                🎭 Or Pick an Emoji
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '10px'
              }}>
                {emojiAvatars.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    style={{
                      background: selectedAvatar === emoji ? '#e5e7eb' : 'transparent',
                      border: selectedAvatar === emoji ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '15px',
                      fontSize: '2em',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      aspectRatio: '1'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAvatar !== emoji) {
                        const target = e.target as HTMLButtonElement;
                        target.style.background = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAvatar !== emoji) {
                        const target = e.target as HTMLButtonElement;
                        target.style.background = 'transparent';
                      }
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPicker(true)}
      style={{
        background: 'transparent',
        border: '3px solid #e5e7eb',
        borderRadius: '50%',
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.borderColor = '#3b82f6';
        target.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.borderColor = '#e5e7eb';
        target.style.transform = 'scale(1)';
      }}
      title="Click to choose avatar"
    >
      {selectedAvatar ? (
        isPhotoAvatar ? (
          <img
            src={selectedAvatar}
            alt="Avatar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        ) : (
          <span style={{ fontSize: '2.5em' }}>{selectedAvatar}</span>
        )
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#6b7280',
          fontSize: '0.7em',
          fontWeight: '600'
        }}>
          <span style={{ fontSize: '2em', marginBottom: '2px' }}>👤</span>
          <span>Choose</span>
        </div>
      )}
    </button>
  );
};

export default AvatarPicker; 