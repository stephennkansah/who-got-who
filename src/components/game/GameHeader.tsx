import React from 'react';
import { Player } from '../../types';
import { AnimatedScore } from '../common/AnimatedScore';

interface GameHeaderProps {
  currentPlayer: Player | null;
  playerCount: number;
  targetScore: number;
  onOpenHostMenu: () => void;
  onLeaveGame: () => void;
  onShowLeaderboard: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentPlayer,
  playerCount,
  targetScore,
  onOpenHostMenu,
  onLeaveGame,
  onShowLeaderboard
}) => {
  return (
    <div className="game-header">
      {/* Left: your score toward the win — opens the leaderboard */}
      <button
        onClick={onShowLeaderboard}
        className="rank-badge"
        aria-label={`Your score ${currentPlayer?.score || 0} of ${targetScore}. Show leaderboard`}
      >
        <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>
          <AnimatedScore value={currentPlayer?.score || 0} />
        </div>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', opacity: 0.8 }}>OF {targetScore}</div>
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
            onClick={onOpenHostMenu}
            className="chip-btn"
            aria-label="Host controls: pause, open early, or end the game"
          >
            Host
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
