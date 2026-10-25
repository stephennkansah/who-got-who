import React from 'react';
import { Player } from '../../types';
import Modal from '../common/Modal';
import PlayerAvatar from '../PlayerAvatar';

interface PlayerActionsProps {
  player: Player | null;
  onClose: () => void;
  onMakeHost: (player: Player) => void;
  onRemove: (player: Player) => void;
}

/** What the host can do to someone else in the lobby. */
export default function PlayerActions({ player, onClose, onMakeHost, onRemove }: PlayerActionsProps) {
  if (!player) return null;
  return (
    <Modal isOpen onClose={onClose} labelledBy="player-actions-title" showClose>
      <div className="flex-center" style={{ marginBottom: '0.6rem' }}>
        <PlayerAvatar player={player} size="large" />
      </div>
      <h2 id="player-actions-title">{player.name}</h2>
      <div className="flex-column gap-1">
        <button className="btn btn-secondary" onClick={() => onMakeHost(player)}>
          Make Them Host
        </button>
        <p className="text-small" style={{ margin: '-0.2rem 0 0.3rem' }}>
          Handy if you're leaving early — they'll get the start, pause and end controls.
        </p>
        <button className="btn btn-danger" onClick={() => onRemove(player)}>
          Remove From Game
        </button>
      </div>
    </Modal>
  );
}
