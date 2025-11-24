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
      {/* Left: Leaderboard Position */}
      <button 
        onClick={onShowLeaderboard}
        className="rank-badge"
        aria-label="Show Leaderboard"
      >
        <div style={{ fontSize: '1.2rem' }}>🏆</div>
        <div style={{ fontSize: '0.8rem' }}>
          <AnimatedScore value={currentPlayer?.score || 0} />
        </div>
      </button>

      {/* Center: Title */}
      <div className="header-title">
        <h1>Who Got Who</h1>
        <div className="player-count">
          {playerCount} PLAYERS
        </div>
      </div>

      {/* Right: Game Controls */}
      <div style={{ display: 'flex', gap: '0.8rem' }}>
        {currentPlayer?.isHost && (
          <button
            onClick={onEndGame}
            className="btn-icon danger"
            title="End Game"
          >
            🏁
          </button>
        )}
        <button
          onClick={onLeaveGame}
          className="btn-icon"
          title="Leave Game"
        >
          🚪
        </button>
      </div>
    </div>
  );
};
