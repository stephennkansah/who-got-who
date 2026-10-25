import React from 'react';
import { Player } from '../../types';
import { AnimatedScore } from '../common/AnimatedScore';
import Mascot from '../common/Mascot';

interface GameHeaderProps {
  currentPlayer: Player | null;
  playerCount: number;
  targetScore: number;
  briefing?: boolean;
  onOpenHostMenu: () => void;
  onLeaveGame: () => void;
  onShowLeaderboard: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentPlayer,
  playerCount,
  targetScore,
  briefing = false,
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
        <div style={{ fontSize: '0.68rem', letterSpacing: '0.16em', opacity: 0.8 }}>OF {targetScore}</div>
      </button>

      {/* Center: Title */}
      <div className="header-title" style={{ textAlign: 'center' }}>
        <Mascot pose={briefing ? 'mission' : 'sneaky'} size={56} className="mascot-centered mascot-header" />
        <h1>Who Got Who</h1>
        <div className="player-count">
          {playerCount} AGENTS
        </div>
      </div>

      {/* Right: Game Controls */}
      <div className="game-header-controls">
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
