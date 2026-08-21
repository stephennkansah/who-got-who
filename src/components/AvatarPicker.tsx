import React, { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import Modal from './common/Modal';
import { showToast } from './common/Toast';

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
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const emojiAvatars = [
    // Light skin tone
    '👩🏻‍💼', '👨🏻‍🎓', '👩🏻‍⚕️', '👨🏻‍🍳', '👩🏻‍🚀', '👨🏻‍🔬',
    // Medium-light skin tone
    '👩🏼‍💻', '👨🏼‍🎨', '👩🏼‍🎤', '👨🏼‍🏫', '👩🏼‍✈️', '👨🏼‍⚕️',
    // Medium skin tone
    '👩🏽‍🔬', '👨🏽‍💼', '👩🏽‍🍳', '👨🏽‍🚀', '👩🏽‍🎓', '👨🏽‍💻',
    // Medium-dark skin tone
    '👩🏾‍🎨', '👨🏾‍⚕️', '👩🏾‍🏫', '👨🏾‍🎤', '👩🏾‍✈️', '👨🏾‍🔬',
    // Dark skin tone
    '👩🏿‍💼', '👨🏿‍🍳', '👩🏿‍🚀', '👨🏿‍🎓', '👩🏿‍💻', '👨🏿‍🎨',
    // Fun characters (skin tone neutral)
    '🤖', '👻', '🎭', '👾', '🦸‍♀️', '🦸‍♂️', 
    '🧙‍♀️', '🧙‍♂️', '🦹‍♀️', '🦹‍♂️', '🧚‍♀️', '🧚‍♂️'
  ];

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    onAvatarChange(emoji, false);
    setShowPicker(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Ensure video plays
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing video:', playError);
        }
        
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      showToast('Camera unavailable — check permissions or upload a photo instead.', 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob for compression
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setIsUploading(true);
      stopCamera();

      try {
        // Create file from blob for compression
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

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
        console.error('Error processing photo:', error);
        showToast('That photo could not be processed — try again.', 'error');
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.8);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showToast('That image is too big — 10MB max.', 'error');
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
      showToast('That image could not be processed — try another one.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isPhotoAvatar = selectedAvatar && selectedAvatar.startsWith('data:image');

  const closePicker = () => {
    stopCamera();
    setShowPicker(false);
  };

  if (showPicker) {
    return (
      <Modal isOpen onClose={closePicker} ariaLabel="Choose your avatar" maxWidth={500} showClose>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.3em', textAlign: 'left' }}>
          🎭 Choose Your Avatar
        </h3>

            {/* Photo Capture Section */}
            <div style={{
              background: 'linear-gradient(135deg, #e0f2fe, #b3e5fc)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0277bd' }}>
                📷 Take a Selfie
              </h4>
              
              {showCamera ? (
                <div style={{ marginBottom: '15px' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      borderRadius: '12px',
                      transform: 'scaleX(-1)' // Mirror effect for selfie
                    }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'center',
                    marginTop: '15px'
                  }}>
                    <button
                      onClick={capturePhoto}
                      disabled={isUploading}
                      style={{
                        background: isUploading ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        fontSize: '1em',
                        fontWeight: '600',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isUploading ? '📤 Processing...' : '📸 Capture'}
                    </button>
                    <button
                      onClick={stopCamera}
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        fontSize: '1em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={startCamera}
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
                      marginBottom: '10px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📸 Take Photo
                  </button>
                  
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
                      background: isUploading ? '#6b7280' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 20px',
                      fontSize: '0.9em',
                      fontWeight: '600',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      width: '100%',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📁 Or Upload Photo
                  </button>
                </div>
              )}
              
              <p style={{ 
                margin: '10px 0 0 0', 
                fontSize: '0.8em', 
                color: '#0288d1' 
              }}>
                Auto-compressed to 100KB for fast loading
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
      </Modal>
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