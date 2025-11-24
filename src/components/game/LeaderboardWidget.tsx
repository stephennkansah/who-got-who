import React from 'react';
import { Player } from '../../types';
import { AnimatedScore } from '../common/AnimatedScore';

interface LeaderboardWidgetProps {
  players: Player[];
  currentPlayerId: string;
  onShowLeaderboard: () => void;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ players, currentPlayerId, onShowLeaderboard }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topThree = sortedPlayers.slice(0, 3);

  return (
    <div className="card leaderboard-widget">
      <div 
        onClick={onShowLeaderboard}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '0.5rem'
        }}>
          Live Leaderboard
        </div>
        
        <div className="leaderboard-grid">
          {topThree.map((player, index) => (
            <div 
              key={player.id} 
              className={`leaderboard-card ${player.id === currentPlayerId ? 'is-me' : ''}`}
            >
              <span className="medal">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </span>
              <span className="player-name">
                {player.name}
                {player.id === currentPlayerId && ' (You)'}
              </span>
              <span className="player-score">
                <AnimatedScore value={player.score} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
