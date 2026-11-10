import React from 'react';
import Modal from '../common/Modal';
import SoundToggle from '../common/SoundToggle';

interface GameMenuProps {
  isOpen: boolean;
  isHost: boolean;
  onClose: () => void;
  onShowRules: () => void;
  onHostControls: () => void;
  onLeave: () => void;
}

/** Everything that isn't playing: the rules, sounds, host controls, leaving. */
export default function GameMenu({ isOpen, isHost, onClose, onShowRules, onHostControls, onLeave }: GameMenuProps) {
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="game-menu-title" showClose>
      <h2 id="game-menu-title">Menu</h2>
      <div className="flex-column gap-1">
        <button className="btn btn-secondary" onClick={run(onShowRules)}>
          How to Play
        </button>
        {isHost && (
          <button className="btn btn-secondary" onClick={run(onHostControls)}>
            Host Controls
          </button>
        )}
        <SoundToggle />
        <button className="btn btn-ghost" onClick={run(onLeave)}>
          Leave game
        </button>
      </div>
    </Modal>
  );
}
