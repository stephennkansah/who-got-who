import React from 'react';
import Modal from './Modal';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      role="alertdialog"
      labelledBy="confirmation-title"
      maxWidth={350}
    >
      <h3 id="confirmation-title" style={{
        fontSize: '1.4rem',
        marginBottom: '0.8rem',
        fontWeight: 800
      }}>
        {title}
      </h3>

      <p style={{
        marginBottom: '1.5rem',
        lineHeight: 1.5,
        fontSize: '1rem',
        whiteSpace: 'pre-line' // Allows \n to work in messages
      }}>
        {message}
      </p>

      <div style={{ display: 'flex', gap: '0.8rem' }}>
        <button
          onClick={onCancel}
          className="btn btn-secondary"
          style={{ flex: 1, padding: '0.8rem', borderRadius: '12px' }}
        >
          {cancelLabel}
        </button>

        <button
          onClick={onConfirm}
          className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
          style={{ flex: 1, padding: '0.8rem', borderRadius: '12px' }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
