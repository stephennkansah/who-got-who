import React from 'react';
import { Player } from '../../types';
import PlayerAvatar from '../PlayerAvatar';
import Modal from '../common/Modal';

interface FullLeaderboardProps {
  players: Player[];
  currentPlayerId: string;
  onClose: () => void;
}

export const FullLeaderboard: React.FC<FullLeaderboardProps> = ({ players, currentPlayerId, onClose }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // All completed / failed tasks across players, newest first
  const allCompletions = players.flatMap(player =>
    player.tasks
      .filter(task => (task.status === 'completed' || task.status === 'failed') && task.targetId)
      .map(task => ({
        ...task,
        playerName: player.name,
        playerId: player.id,
        targetName: players.find(p => p.id === task.targetId)?.name || 'Unknown',
        isSuccess: task.status === 'completed'
      }))
  ).sort((a, b) => new Date(b.gotAt || 0).getTime() - new Date(a.gotAt || 0).getTime());

  return (
    <Modal isOpen onClose={onClose} showClose ariaLabel="Game summary" maxWidth={400}>
      <h3 style={{ margin: '0 0 1rem', textAlign: 'left' }}>🏆 Game Summary</h3>

      {/* Recent Activity */}
      <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
        <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.95rem', fontWeight: 700 }}>
          📊 Recent activity
        </h4>
        <div style={{
          background: 'rgba(0,0,0,0.03)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.6rem',
          maxHeight: '160px',
          overflowY: 'auto',
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          {allCompletions.length > 0 ? (
            allCompletions.slice(0, 10).map((completion, index) => (
              <div key={`${completion.playerId}-${completion.id}-${index}`} className="flex-between" style={{
                padding: '0.4rem 0.5rem',
                marginBottom: '0.3rem',
                background: completion.isSuccess ? 'var(--success-soft)' : 'var(--danger-soft)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                gap: '0.5rem'
              }}>
                <div className="flex gap-1" style={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '1rem' }} aria-hidden="true">
                    {completion.isSuccess ? '🎯' : '🚨'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {completion.playerName}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--paper-dim)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {completion.text}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: completion.isSuccess ? 'var(--success-ink)' : 'var(--danger-ink)',
                  textAlign: 'right',
                  flexShrink: 0
                }}>
                  {completion.isSuccess ? 'got' : 'caught by'}
                  <br />
                  <strong>{completion.targetName}</strong>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--paper-dim)', fontSize: '0.85rem', padding: '0.75rem' }}>
              No gotchas yet — stay sneaky 🤫
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      <div style={{ textAlign: 'left' }}>
        <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.95rem', fontWeight: 700 }}>
          🏅 Current rankings
        </h4>
        <div className="flex-column gap-1">
          {sortedPlayers.map((player, index) => {
            const isYou = player.id === currentPlayerId;
            return (
              <div key={player.id} className="flex-between" style={{
                padding: '0.6rem 0.75rem',
                background: isYou ? 'var(--me-bg)' : 'rgba(35, 32, 20, 0.04)',
                borderRadius: 'var(--radius-sm)',
                border: isYou ? '1.5px solid var(--me-border)' : '1.5px solid transparent'
              }}>
                <div className="flex gap-1" style={{ alignItems: 'center', minWidth: 0 }}>
                  <span style={{ fontSize: index < 3 ? '1.4rem' : '0.9rem', fontWeight: 700, minWidth: '28px', textAlign: 'center', color: 'var(--paper-dim)' }} aria-hidden="true">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </span>
                  <PlayerAvatar player={player} size="small" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name} {isYou && '(You)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--paper-dim)' }}>
                      {player.tasks.filter(t => t.status === 'completed').length} tasks completed
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0
                }}>
                  {player.score}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
