import React, { useMemo } from 'react';

const CONFETTI_COLORS = ['#e5484d', '#e8b554', '#3fa863', '#f3ead3', '#f05a5f', '#f2c268'];

/** One-shot celebratory confetti (CSS-driven, honors prefers-reduced-motion). */
export default function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 53) % 120) / 100,
        duration: 2.6 + ((i * 29) % 140) / 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 8 + ((i * 13) % 8),
      })),
    [],
  );

  return (
    <div aria-hidden="true" className="no-rise">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${piece.left}vw`,
            width: piece.size,
            height: piece.size * 1.4,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
