import React from 'react';
import { Player } from '../../types';
import { AnimatedScore } from '../common/AnimatedScore';

interface LeaderboardWidgetProps {
  players: Player[];
  currentPlayerId: string;
  targetScore: number;
  scoreOf?: (player: Player) => number;
  onShowLeaderboard: () => void;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  players,
  currentPlayerId,
  targetScore,
  scoreOf = (player) => player.score,
  onShowLeaderboard,
}) => {
  const sortedPlayers = [...players].sort((a, b) => scoreOf(b) - scoreOf(a));
  const topThree = sortedPlayers.slice(0, 3);

  return (
    <div className="card leaderboard-widget">
      <button
        onClick={onShowLeaderboard}
        aria-label="Show full leaderboard and activity"
        style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'inherit' }}
      >
        <div className="leaderboard-label">
          Leaderboard · first to {targetScore}
        </div>

        <div className="leaderboard-grid">
          {topThree.map((player, index) => (
            <div
              key={player.id}
              className={`leaderboard-card ${player.id === currentPlayerId ? 'is-me' : ''}`}
            >
              <span className="medal">
                {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
              </span>
              <span className="player-name">
                {player.id === currentPlayerId ? `${player.name} (You)` : player.name}
              </span>
              <span className="player-score">
                <AnimatedScore value={scoreOf(player)} />
              </span>
              <div className="progress-track" aria-hidden="true">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (scoreOf(player) / targetScore) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </button>
    </div>
  );
};
