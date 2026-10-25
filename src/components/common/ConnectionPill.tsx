import React from 'react';
import { useGame } from '../../hooks/useGame';

/** Small floating notice while live updates are interrupted. */
export default function ConnectionPill() {
  const { state } = useGame();
  if (!state.currentGame || state.connection !== 'reconnecting') return null;
  return (
    <div className="connection-pill" role="status" aria-live="polite">
      <span className="connection-dot" aria-hidden="true" />
      Reconnecting…
    </div>
  );
}
