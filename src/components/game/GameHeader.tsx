import React, { useEffect, useRef, useState } from 'react';
import { AnimatedScore } from '../common/AnimatedScore';

interface GameHeaderProps {
  score: number;
  /** Small line under your score, e.g. "OF 5". */
  scoreLabel: string;
  scoreAria: string;
  title: string;
  /** Who's playing and how to win, e.g. "6 players · first to 5". */
  subtitle: string;
  onShowLeaderboard: () => void;
  onOpenMenu: () => void;
}

/** The points you just gained, for a moment, so a score change is something you see. */
function useScoreGain(score: number): number | null {
  const previous = useRef(score);
  const [gain, setGain] = useState<number | null>(null);

  useEffect(() => {
    const diff = Math.round((score - previous.current) * 10) / 10;
    previous.current = score;
    if (diff <= 0) return undefined;
    setGain(diff);
    const timer = window.setTimeout(() => setGain(null), 1500);
    return () => window.clearTimeout(timer);
  }, [score]);

  return gain;
}

/** One slim row, so the missions start as high up the screen as possible. */
export const GameHeader: React.FC<GameHeaderProps> = ({
  score, scoreLabel, scoreAria, title, subtitle, onShowLeaderboard, onOpenMenu,
}) => {
  const gain = useScoreGain(score);

  return (
    <div className="game-header">
      {/* Your score toward the win — opens the leaderboard */}
      <button onClick={onShowLeaderboard} className="rank-badge" aria-label={`${scoreAria}. Show leaderboard`}>
        <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>
          <AnimatedScore value={score} />
        </div>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', opacity: 0.8 }}>{scoreLabel}</div>
        {gain !== null && <span className="score-gain" aria-hidden="true">+{gain}</span>}
      </button>

      <div className="header-title">
        <h1>{title}</h1>
        <div className="player-count">{subtitle}</div>
      </div>

      <button onClick={onOpenMenu} className="chip-btn" aria-label="Menu: how to play, sounds, leave game">
        Menu
      </button>
    </div>
  );
};
