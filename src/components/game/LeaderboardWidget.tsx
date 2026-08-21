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
      <button
        onClick={onShowLeaderboard}
        aria-label="Show full leaderboard and activity"
        style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'inherit' }}
      >
        <div className="leaderboard-label">
          Live leaderboard · tap for all
        </div>

        <div className="leaderboard-grid">
          {topThree.map((player, index) => (
            <div
              key={player.id}
              className={`leaderboard-card ${player.id === currentPlayerId ? 'is-me' : ''}`}
            >
              <span className="medal" aria-hidden="true">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </span>
              <span className="player-name">
                {player.id === currentPlayerId ? `${player.name} (You)` : player.name}
              </span>
              <span className="player-score">
                <AnimatedScore value={player.score} />
              </span>
            </div>
          ))}
        </div>
      </button>
    </div>
  );
};
