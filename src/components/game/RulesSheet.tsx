import React from 'react';
import { Game } from '../../types';
import Modal from '../common/Modal';
import RulesContent from '../RulesContent';

/** The rules, on demand, without leaving the game. */
export default function RulesSheet({ game, isOpen, onClose }: { game: Game; isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="rules-sheet-title" showClose maxWidth={460}>
      <h2 id="rules-sheet-title">How to Play</h2>
      <RulesContent game={game} />
      <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1rem' }}>
        Back to the Game
      </button>
    </Modal>
  );
}
