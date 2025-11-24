import React from 'react';
import { Player, TaskInstance } from '../../types';
import PlayerAvatar from '../PlayerAvatar';

interface FullLeaderboardProps {
  players: Player[];
  currentPlayerId: string;
  onClose: () => void;
}

export const FullLeaderboard: React.FC<FullLeaderboardProps> = ({ players, currentPlayerId, onClose }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topThree = sortedPlayers.slice(0, 3);
  const others = sortedPlayers.slice(3);

  // Helper to get completion history
  const getRecentActivity = () => {
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
    
    return allCompletions;
  };

  const allCompletions = getRecentActivity();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '70vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#333' }}>🏆 Game Summary</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Recent Activity Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0',
            color: '#333',
            fontSize: '1rem',
            fontWeight: '700',
            textAlign: 'center'
          }}>
            📊 Recent Activity
          </h4>
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '0.75rem',
            maxHeight: '150px',
            overflowY: 'auto',
            border: '1px solid #e9ecef'
          }}>
            {allCompletions.length > 0 ? (
              allCompletions.slice(0, 8).map((completion, index) => (
                <div key={`${completion.playerId}-${completion.id}-${index}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.4rem 0.5rem',
                  marginBottom: '0.3rem',
                  background: completion.isSuccess ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    flex: 1
                  }}>
                    <span style={{ fontSize: '1rem' }}>
                      {completion.isSuccess ? '🎯' : '🚨'}
                    </span>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333' }}>
                        {completion.playerName}
                      </div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: '#666',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {completion.text}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: completion.isSuccess ? '#2e7d32' : '#c62828',
                    textAlign: 'right'
                  }}>
                    {completion.isSuccess ? 'Got' : 'Caught by'}
                    <br />
                    <strong>{completion.targetName}</strong>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                fontSize: '0.9rem',
                padding: '1rem'
              }}>
                No completed tasks yet - game just started! 🎮
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div>
          <h4 style={{ 
            margin: '0 0 0.75rem 0',
            color: '#333',
            fontSize: '1rem',
            fontWeight: '700',
            textAlign: 'center'
          }}>
            🏆 Current Rankings
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <div style={{ 
                background: 'linear-gradient(135deg, #ffd700, #ffed4a)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '0.5rem'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.75rem 0', 
                  textAlign: 'center',
                  color: '#8b4513',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}>
                  🏆 TOP PLAYERS
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {topThree.map((player, index) => (
                    <div key={player.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: player.id === currentPlayerId 
                        ? 'rgba(59, 130, 246, 0.2)' 
                        : 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '12px',
                      border: player.id === currentPlayerId 
                        ? '2px solid #3b82f6' 
                        : '1px solid rgba(139, 69, 19, 0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          fontSize: '2rem',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <PlayerAvatar player={player} size="medium" />
                        <div>
                          <div style={{ 
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            color: '#8b4513'
                          }}>
                            {player.name} {player.id === currentPlayerId && '(You)'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#a16207' }}>
                            {player.tasks.filter(t => t.status === 'completed').length} tasks completed
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '900',
                        color: '#8b4513',
                        background: 'rgba(255, 255, 255, 0.8)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        border: '2px solid rgba(139, 69, 19, 0.3)'
                      }}>
                        {player.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Other Players */}
            {others.length > 0 && (
              <div>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0',
                  color: '#666',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  OTHER PLAYERS
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {others.map((player, index) => (
                    <div key={player.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      background: player.id === currentPlayerId 
                        ? 'rgba(59, 130, 246, 0.1)' 
                        : 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                      border: player.id === currentPlayerId 
                        ? '2px solid rgba(59, 130, 246, 0.3)' 
                        : '1px solid rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          fontSize: '0.9rem',
                          color: '#666',
                          fontWeight: '600',
                          minWidth: '24px'
                        }}>
                          {index + 4}.
                        </div>
                        <PlayerAvatar player={player} size="small" />
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {player.name} {player.id === currentPlayerId && '(You)'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {player.tasks.filter(t => t.status === 'completed').length} completed
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: '#333'
                      }}>
                        {player.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

