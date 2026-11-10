import React, { useLayoutEffect, useRef } from 'react';
import { Player } from '../../types';
import { AnimatedScore } from '../common/AnimatedScore';
import { rankPlayers } from '../../utils/gameSettings';

interface LeaderboardWidgetProps {
  players: Player[];
  currentPlayerId: string;
  targetScore: number;
  /** From this score a player's next gotcha could finish them; they get a pulsing chip. */
  matchPoint?: number;
  scoreOf?: (player: Player) => number;
  onShowLeaderboard: () => void;
}

const MEDALS = ['1st', '2nd', '3rd'];

/**
 * Slides each chip from where it was to where it is now whenever the order
 * changes, so an overtake is something you see happen.
 */
function useSlideOnReorder(order: string) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const lastLeft = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const still = typeof window !== 'undefined'
      && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    nodes.current.forEach((node, id) => {
      // offsetLeft ignores a slide already in progress, so chained overtakes stay correct.
      const left = node.offsetLeft;
      const before = lastLeft.current.get(id);
      lastLeft.current.set(id, left);
      if (still || before === undefined || Math.abs(before - left) < 2 || !node.animate) return;
      node.animate(
        [
          { transform: `translateX(${before - left}px) scale(1.06)`, zIndex: 1 },
          { transform: 'translateX(0) scale(1)', zIndex: 1 },
        ],
        { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' },
      );
    });
    Array.from(lastLeft.current.keys()).forEach((id) => {
      if (!nodes.current.has(id)) lastLeft.current.delete(id);
    });
  }, [order]);

  return (id: string) => (node: HTMLElement | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  };
}

/** The top three in one slim strip. Tap for everyone. */
export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  players,
  currentPlayerId,
  targetScore,
  matchPoint,
  scoreOf = (player) => player.score,
  onShowLeaderboard,
}) => {
  const topThree = rankPlayers(players, scoreOf).slice(0, 3);
  const track = useSlideOnReorder(topThree.map((player) => player.id).join('|'));
  const summary = topThree
    .map((player, index) => `${MEDALS[index]} ${player.id === currentPlayerId ? 'you' : player.name} ${scoreOf(player)}`)
    .join(', ');

  return (
    <button
      className="scoreboard"
      onClick={onShowLeaderboard}
      aria-label={`Leaderboard: ${summary}. Show everyone`}
    >
      {topThree.map((player, index) => {
        const isMe = player.id === currentPlayerId;
        const hot = matchPoint !== undefined && !player.place && scoreOf(player) >= matchPoint;
        return (
          <span
            key={player.id}
            ref={track(player.id)}
            className={`score-chip ${isMe ? 'is-me' : ''} ${hot ? 'is-hot' : ''} ${player.place ? 'is-done' : ''}`}
          >
            <span className="medal">{MEDALS[index]}{player.place ? ' ✓' : ''}</span>
            <span className="player-name">{isMe ? 'You' : player.name}</span>
            <span className="player-score">
              <AnimatedScore value={scoreOf(player)} />
            </span>
            <span className="score-chip-track" aria-hidden="true">
              <span style={{ width: `${Math.min(100, (scoreOf(player) / targetScore) * 100)}%` }} />
            </span>
          </span>
        );
      })}
    </button>
  );
};
