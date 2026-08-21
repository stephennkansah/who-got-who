import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface StampSplashProps {
  title: string;
  subtitle?: string;
  tone?: 'success' | 'danger' | 'amber';
  durationMs?: number;
  onDone: () => void;
}

/**
 * Full-screen rubber-stamp takeover for the game's big beats:
 * claiming a Gotcha, missions going live, banking a challenge.
 * Auto-dismisses; tap skips it. Buzzes on devices that support it.
 */
export default function StampSplash({
  title,
  subtitle,
  tone = 'success',
  durationMs = 1600,
  onDone,
}: StampSplashProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    navigator.vibrate?.([90, 40, 60]);
    const timer = window.setTimeout(() => onDoneRef.current(), durationMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ReactDOM.createPortal(
    <div className="slam-overlay" onClick={() => onDoneRef.current()} role="status" aria-live="assertive">
      <div className={`slam-stamp ${tone}`}>{title}</div>
      {subtitle && <div className="slam-sub">{subtitle}</div>}
    </div>,
    document.body,
  );
}
