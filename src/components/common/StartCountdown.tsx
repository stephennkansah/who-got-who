import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { buzz } from '../../services/appPlatform';
import { playSound } from '../../services/sounds';

const STEP_MS = 850;

/**
 * 3… 2… 1… on every phone when the host starts the game, so the whole room
 * looks down at the same moment. Tap skips it.
 */
export default function StartCountdown({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (count <= 0) {
      onDoneRef.current();
      return undefined;
    }
    buzz(40);
    playSound('join');
    const timer = window.setTimeout(() => setCount((value) => value - 1), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [count]);

  if (count <= 0) return null;

  return ReactDOM.createPortal(
    <div className="countdown-overlay" role="status" aria-live="assertive" onClick={() => setCount(0)}>
      <div className="countdown-label">Get ready</div>
      <div key={count} className="countdown-number">{count}</div>
    </div>,
    document.body,
  );
}
