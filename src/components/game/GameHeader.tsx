import React from 'react';
import { Player } from '../../types';
import { AnimatedScore } from '../common/AnimatedScore';

interface GameHeaderProps {
  currentPlayer: Player | null;
  playerCount: number;
  onEndGame: () => void;
  onLeaveGame: () => void;
  onShowLeaderboard: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentPlayer,
  playerCount,
  onEndGame,
  onLeaveGame,
  onShowLeaderboard
}) => {
  return (
    <div className="game-header">
      {/* Left: your score — opens the leaderboard */}
      <button
        onClick={onShowLeaderboard}
        className="rank-badge"
        aria-label="Show leaderboard"
      >
        <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>
          <AnimatedScore value={currentPlayer?.score || 0} />
        </div>
        <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', opacity: 0.8 }}>PTS</div>
      </button>

      {/* Center: Title */}
      <div className="header-title" style={{ textAlign: 'center' }}>
        <h1>Who Got Who</h1>
        <div className="player-count">
          {playerCount} AGENTS
        </div>
      </div>

      {/* Right: Game Controls */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {currentPlayer?.isHost && (
          <button
            onClick={onEndGame}
            className="chip-btn danger"
            aria-label="End game for everyone"
          >
            End
          </button>
        )}
        <button
          onClick={onLeaveGame}
          className="chip-btn"
          aria-label="Leave game"
        >
          Exit
        </button>
      </div>
    </div>
  );
};
