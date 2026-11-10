import { buzz } from '../../services/appPlatform';
import { playSound, SoundName } from '../../services/sounds';
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Mascot, { MascotPose } from './Mascot';
import ConfettiBurst from './Confetti';

interface StampSplashProps {
  title: string;
  subtitle?: string;
  tone?: 'success' | 'danger' | 'amber';
  durationMs?: number;
  mascot?: MascotPose;
  /** Only for shared moments; secret moves stay silent. */
  sound?: SoundName;
  /** Confetti, for points banked and wins. */
  celebrate?: boolean;
  onDone: () => void;
}

/**
 * Full-screen rubber-stamp takeover for the game's big beats:
 * claiming a Gotcha, missions going live, banking a challenge.
 * Auto-dismisses; tap skips it. Buzzes on devices that support it, and plays
 * its sound if it has one.
 */
export default function StampSplash({
  title,
  subtitle,
  tone = 'success',
  durationMs = 1600,
  mascot,
  sound,
  celebrate = false,
  onDone,
}: StampSplashProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    buzz([90, 40, 60]);
    if (sound) playSound(sound);
    const timer = window.setTimeout(() => onDoneRef.current(), durationMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ReactDOM.createPortal(
    <div className="slam-overlay" onClick={() => onDoneRef.current()} role="status" aria-live="assertive">
      {celebrate && <ConfettiBurst />}
      {mascot && <Mascot pose={mascot} size={176} className="mascot-splash" />}
      <div className={`slam-stamp ${tone}`}>{title}</div>
      {subtitle && <div className="slam-sub">{subtitle}</div>}
    </div>,
    document.body,
  );
}
