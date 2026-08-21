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
        <div style={{ fontSize: '1.05rem', lineHeight: 1 }} aria-hidden="true">🏆</div>
        <div style={{ fontSize: '0.85rem' }}>
          <AnimatedScore value={currentPlayer?.score || 0} />
        </div>
      </button>

      {/* Center: Title */}
      <div className="header-title" style={{ textAlign: 'center' }}>
        <h1>Who Got Who</h1>
        <div className="player-count">
          {playerCount} PLAYERS
        </div>
      </div>

      {/* Right: Game Controls */}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        {currentPlayer?.isHost && (
          <button
            onClick={onEndGame}
            className="btn-icon danger"
            aria-label="End game for everyone"
            title="End Game"
          >
            🏁
          </button>
        )}
        <button
          onClick={onLeaveGame}
          className="btn-icon"
          aria-label="Leave game"
          title="Leave Game"
        >
          🚪
        </button>
      </div>
    </div>
  );
};
