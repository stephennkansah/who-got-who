import React, { useState } from 'react';
import { Bust, TaskInstance } from '../types';
import Modal from './common/Modal';
import Mascot from './common/Mascot';
import { formatSeconds, useSecondsLeft } from '../hooks/useCountdown';

interface BustModalProps {
  bust: Bust;
  catcherName: string;
  /** Your missions that are still open: the ones you could have been caught trying. */
  missions: TaskInstance[];
  /** When the host paused the game; the answer timer is frozen meanwhile. */
  pausedAt?: string;
  onAnswer: (taskId: string | null) => Promise<void>;
}

/**
 * Someone says they caught you mid-mission. You say which one (it's then gone),
 * or that they were wrong. No answer in time and the bust simply lapses.
 */
export default function BustModal({ bust, catcherName, missions, pausedAt, onAnswer }: BustModalProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timeLeft = useSecondsLeft(bust.closesAt, pausedAt);

  if (timeLeft === 0 && !pausedAt) return null;

  const answer = async (taskId: string | null) => {
    setBusy(true);
    try {
      await onAnswer(taskId);
    } catch {
      // Errors surface via the global toast bridge.
      setBusy(false);
    }
  };

  return (
    <Modal isOpen dismissible={false} role="alertdialog" labelledBy="bust-title">
      <div className="mascot-dialog-heading">
        <Mascot pose="caught" size={56} />
        <h2 id="bust-title">Busted?</h2>
      </div>
      <div style={{ marginBottom: '0.8rem' }}>
        <span className="timer" role="timer" aria-label={`Time to answer: ${formatSeconds(timeLeft)}`}>
          {pausedAt ? `Paused · ${formatSeconds(timeLeft)}` : formatSeconds(timeLeft)}
        </span>
      </div>
      <p style={{ margin: '0 0 0.8rem', textAlign: 'left' }}>
        <strong>{catcherName}</strong> says they caught you trying a mission. If they did, tap the one
        you were trying — it's then gone for good.
      </p>

      <div className="flex-column gap-1" style={{ marginBottom: '0.9rem' }} role="radiogroup" aria-label="Your open missions">
        {missions.map((task) => (
          <button
            key={task.id}
            role="radio"
            aria-checked={picked === task.id}
            className={`bust-mission ${picked === task.id ? 'is-picked' : ''}`}
            onClick={() => setPicked(task.id)}
            disabled={busy}
          >
            {task.text}
          </button>
        ))}
      </div>

      {/* Pinned to the bottom so a long mission list never hides the answer. */}
      <div className="flex-column gap-1 bust-actions">
        <button className="btn btn-danger" onClick={() => picked && answer(picked)} disabled={!picked || busy}>
          Yes, They Caught Me
        </button>
        <button className="btn btn-ghost" onClick={() => answer(null)} disabled={busy}>
          They didn't catch me
        </button>
      </div>
    </Modal>
  );
}
