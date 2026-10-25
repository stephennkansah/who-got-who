import React from 'react';
import { Player } from '../types';
import PlayerAvatar from './PlayerAvatar';
import Modal from './common/Modal';

interface TargetSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTarget: (targetId: string) => void;
  availableTargets: Player[];
  taskText: string;
  isReverse?: boolean; // true if "who got you", false if "who you got"
  /** Players you've already scored on — everyone else is worth the +0.5 bonus. */
  previousTargets?: string[];
}

export default function TargetSelectModal({
  isOpen,
  onClose,
  onSelectTarget,
  availableTargets,
  taskText,
  isReverse = false,
  previousTargets = [],
}: TargetSelectModalProps) {
  const title = isReverse ? 'Who Caught You?' : 'Who Did You Get?';
  const instruction = isReverse
    ? 'Pick the player who caught you trying this mission:'
    : 'Pick the player you pulled this mission off on:';

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="target-select-title">
      <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
        <h2 id="target-select-title" style={{ marginBottom: '0.8rem' }}>{title}</h2>
        <div style={{
          background: 'rgba(0, 0, 0, 0.05)',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '0.8rem'
        }}>
          <p style={{ fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>
            "{taskText}"
          </p>
        </div>
        <p className="text-small" style={{ margin: 0 }}>
          {instruction}
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        {availableTargets.map((player) => {
          const isNew = !isReverse && !previousTargets.includes(player.id);
          return (
            <button
              key={player.id}
              className="btn btn-secondary"
              onClick={() => onSelectTarget(player.id)}
              aria-label={isNew ? `${player.name}, first time: +0.5 bonus` : player.name}
              style={{
                marginBottom: '0.5rem',
                justifyContent: 'flex-start',
                gap: '12px',
                padding: '12px 16px'
              }}
            >
              <PlayerAvatar player={player} size="small" showBorder={false} />
              <span style={{ fontWeight: 600, flex: 1, textAlign: 'left' }}>{player.name}</span>
              {isNew && <span className="bonus-tag" aria-hidden="true">+0.5 new</span>}
            </button>
          );
        })}
      </div>

      <button className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
    </Modal>
  );
}
