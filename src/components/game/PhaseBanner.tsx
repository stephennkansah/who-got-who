import React from 'react';
import { GamePhase } from '../../hooks/useGamePhase';
import { formatSeconds } from '../../hooks/useCountdown';

interface PhaseBannerProps {
  phase: GamePhase;
  isHost: boolean;
  hostName: string;
  isHoliday: boolean;
  onOpenNow: () => void;
  onResume: () => void;
  onShowRules: () => void;
}

/** Settling-in countdown, or the paused notice — whichever is holding play. */
export default function PhaseBanner({
  phase, isHost, hostName, isHoliday, onOpenNow, onResume, onShowRules,
}: PhaseBannerProps) {
  if (phase.paused) {
    return (
      <div className="phase-banner paused" role="status">
        <div className="phase-label type">Ceasefire</div>
        <div className="phase-title">Game Paused</div>
        <p className="phase-text">
          No {isHoliday ? 'challenges' : 'gotchas'} until {isHost ? 'you resume' : `${hostName} resumes`}.
          Missions stay yours, and claim timers are frozen.
        </p>
        {isHost && (
          <button className="btn btn-success" onClick={onResume}>
            Resume the Game
          </button>
        )}
      </div>
    );
  }

  if (!phase.briefing) return null;

  return (
    <div className="phase-banner" role="timer" aria-label={phase.lockReason ?? undefined}>
      <div className="phase-label type">Briefing · settle in</div>
      <div className="phase-clock">{formatSeconds(phase.secondsToOpen)}</div>
      <p className="phase-text">
        {isHoliday
          ? 'Read the challenges and get your bearings. Claims open when the clock hits zero.'
          : 'Read your missions, grab a drink, blend in. Gotchas only count once the clock hits zero.'}
      </p>
      <div className="flex-column gap-1" style={{ alignItems: 'center' }}>
        <button className="link-btn phase-rules" onClick={onShowRules}>
          New here? How to play
        </button>
        {isHost && (
          <button className="btn btn-secondary btn-small" onClick={onOpenNow}>
            Everyone's ready — open now
          </button>
        )}
      </div>
    </div>
  );
}
