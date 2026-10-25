import React from 'react';
import Modal from '../common/Modal';
import { GamePhase } from '../../hooks/useGamePhase';

interface HostMenuProps {
  isOpen: boolean;
  phase: GamePhase;
  isHoliday?: boolean;
  onClose: () => void;
  onOpenClaims: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

/** The host's pacing controls: open early, pause / resume, end. */
export default function HostMenu({
  isOpen, phase, isHoliday = false, onClose, onOpenClaims, onPause, onResume, onEnd,
}: HostMenuProps) {
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="host-menu-title" showClose>
      <h2 id="host-menu-title">Host Controls</h2>
      <div className="flex-column gap-1">
        {phase.briefing && !phase.paused && (
          <button className="btn btn-success" onClick={run(onOpenClaims)}>
            {isHoliday ? 'Open Challenges Now' : 'Open Gotchas Now'}
          </button>
        )}
        {phase.paused ? (
          <button className="btn btn-success" onClick={run(onResume)}>
            Resume the Game
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={run(onPause)}>
              Pause the Game
            </button>
            <p className="text-small" style={{ margin: '-0.15rem 0 0.35rem' }}>
              For meals, sleep or a breather — nobody can claim while paused, and claim timers freeze.
            </p>
          </>
        )}
        <button className="btn btn-danger" onClick={run(onEnd)}>
          End the Game for Everyone
        </button>
      </div>
    </Modal>
  );
}
