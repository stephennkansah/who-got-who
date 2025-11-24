import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean; // For red "destructive" actions
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="modal-content" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '350px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        textAlign: 'center'
      }}>
        <h3 style={{ 
          fontSize: '1.4rem', 
          marginBottom: '0.8rem',
          color: '#333',
          fontWeight: '800'
        }}>
          {title}
        </h3>
        
        <p style={{ 
          color: '#666', 
          marginBottom: '1.5rem',
          lineHeight: '1.5',
          fontSize: '1rem',
          whiteSpace: 'pre-line' // Allows \n to work in messages
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.8rem',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              background: 'white',
              color: '#4b5563',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            {cancelLabel}
          </button>
          
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.8rem',
              borderRadius: '12px',
              border: 'none',
              background: isDangerous 
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              boxShadow: isDangerous 
                ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                : '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

