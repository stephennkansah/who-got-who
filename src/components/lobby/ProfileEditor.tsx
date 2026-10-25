import React, { useEffect, useState } from 'react';
import { Player } from '../../types';
import Modal from '../common/Modal';
import AvatarPicker from '../AvatarPicker';

interface ProfileEditorProps {
  player: Player | null;
  busy: boolean;
  onClose: () => void;
  onSave: (name: string, avatar?: string, avatarType?: 'emoji' | 'photo') => void;
}

/** Change your name and avatar before the game starts. */
export default function ProfileEditor({ player, busy, onClose, onSave }: ProfileEditorProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<{ value: string; type: 'emoji' | 'photo' } | null>(null);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setAvatar(null);
    }
  }, [player]);

  if (!player) return null;

  const shownAvatar = avatar?.value ?? (player.avatarType === 'photo' ? '' : player.avatar || '😎');
  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, avatar?.value, avatar?.type);
  };

  return (
    <Modal isOpen onClose={onClose} labelledBy="profile-title" showClose>
      <h2 id="profile-title">Your Agent</h2>
      <div className="flex gap-1" style={{ alignItems: 'center', marginBottom: '1.1rem' }}>
        <AvatarPicker
          selectedAvatar={shownAvatar}
          onAvatarChange={(value, isPhoto) => setAvatar({ value, type: isPhoto ? 'photo' : 'emoji' })}
          style={{ width: '58px', height: '58px' }}
        />
        <input
          type="text"
          aria-label="Your name"
          value={name}
          maxLength={24}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save();
          }}
          style={{ textAlign: 'left' }}
        />
      </div>
      <button className="btn btn-primary" onClick={save} disabled={!name.trim() || busy}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </Modal>
  );
}
