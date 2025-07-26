import React from 'react';
import { Player } from '../types';

interface TargetSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTarget: (targetId: string) => void;
  availableTargets: Player[];
  taskText: string;
  isReverse?: boolean; // true if "who got you", false if "who you got"
}

export default function TargetSelectModal({
  isOpen,
  onClose,
  onSelectTarget,
  availableTargets,
  taskText,
  isReverse = false
}: TargetSelectModalProps) {
  if (!isOpen) return null;

  const title = isReverse ? '🎯 Who Got You?' : '🎯 Who Did You Get?';
  const instruction = isReverse
    ? 'Select the player who completed this task on you:'
    : 'Select the player you completed this task on:';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
          <div style={{
            background: 'rgba(0, 0, 0, 0.05)',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem'
          }}>
            <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
              "{taskText}"
            </p>
          </div>
          <p className="text-small">
            {instruction}
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          {availableTargets.map((player) => (
            <button
              key={player.id}
              className="btn btn-secondary"
              onClick={() => onSelectTarget(player.id)}
              style={{
                marginBottom: '0.5rem',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <span>{player.name}</span>
              {player.isHost && <span style={{ fontSize: '0.8rem' }}>👑</span>}
            </button>
          ))}
        </div>

        <button
          className="btn btn-danger"
          onClick={onClose}
          style={{ marginTop: '0.5rem' }}
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
} 