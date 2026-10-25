import React from 'react';

// Only the five exact images selected by the user. Keep the app icon separate.
const poses = {
  lobby: 'lobby',
  sneaky: 'mission-transparent',
  caught: 'caught',
  mission: 'mission',
  happy: 'results',
} as const;

export type MascotPose = keyof typeof poses;

interface MascotProps {
  pose: MascotPose;
  size?: number;
  className?: string;
}

/** Decorative expression; the adjacent heading always explains the game state. */
export default function Mascot({ pose, size = 96, className = '' }: MascotProps) {
  return (
    <img
      className={`mascot mascot-${pose} ${className}`.trim()}
      src={`${process.env.PUBLIC_URL || ''}/mascots/${poses[pose]}.png`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable={false}
    />
  );
}
