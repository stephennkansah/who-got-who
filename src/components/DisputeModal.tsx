import React, { useEffect, useRef, useState } from 'react';
import { Dispute } from '../types';
import Modal from './common/Modal';
import { formatSeconds, useSecondsLeft } from '../hooks/useCountdown';

interface DisputeModalProps {
  dispute: Dispute;
  /** Name of the player claiming the Gotcha (resolved by the parent). */
  accuserName?: string;
  /** False when nobody else is in the game to vote. */
  canDispute: boolean;
  /** When the host paused the game; the response timer is frozen meanwhile. */
  pausedAt?: string;
  onAccept: () => void;
  onDispute: (reason?: string) => void;
}

export default function DisputeModal({
  dispute,
  accuserName,
  canDispute,
  pausedAt,
  onAccept,
  onDispute,
}: DisputeModalProps) {
  const taskText = dispute.taskText;
  const paused = !!pausedAt;
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const timeLeft = useSecondsLeft(dispute.closesAt, pausedAt);
  const expiredRef = useRef(false);
  const buzzedRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    if (timeLeft <= 10 && !buzzedRef.current) {
      buzzedRef.current = true;
      navigator.vibrate?.(200);
    }
    if (timeLeft === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onAccept(); // No response in time = automatic accept
    }
  }, [timeLeft, paused, onAccept]);

  const claimer = accuserName || 'Another player';

  return (
    <Modal isOpen dismissible={false} role="alertdialog" ariaLabel="Gotcha claim response">
      <h2 style={{ marginBottom: '0.75rem' }}>Gotcha Claimed</h2>

      <div style={{ marginBottom: '1rem' }}>
        <span
          className={`timer ${timeLeft <= 30 && !paused ? 'urgent' : ''}`}
          role="timer"
          aria-label={paused ? 'Timer frozen while the game is paused' : `Time to respond: ${formatSeconds(timeLeft)}`}
        >
          {paused ? `Paused · ${formatSeconds(timeLeft)}` : formatSeconds(timeLeft)}
        </span>
      </div>

      <div style={{
        background: 'var(--warning-soft)',
        border: '1px solid var(--warning-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.9rem 1rem',
        marginBottom: '1rem',
        textAlign: 'left'
      }}>
        <p style={{ margin: 0, color: 'var(--warning-ink)', fontWeight: 700 }}>
          {claimer} says they got you!
        </p>
        {taskText && (
          <p style={{ margin: '0.4rem 0 0', color: 'var(--warning-ink)', fontStyle: 'italic', fontSize: '0.9rem' }}>
            "{taskText}"
          </p>
        )}
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--warning-ink)' }}>
          Did they say "Gotcha!" before you could call them out?
        </p>
      </div>

      <div className="flex-column gap-1" style={{ marginBottom: '0.75rem' }}>
        <button className="btn btn-success" onClick={onAccept}>
          Fair &amp; Square — Accept
        </button>

        {!canDispute || paused ? null : !showReason ? (
          <button className="btn btn-danger" onClick={() => setShowReason(true)}>
            No Way — Dispute It
          </button>
        ) : (
          <div className="flex-column gap-1" style={{
            background: 'var(--danger-soft)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem'
          }}>
            <label htmlFor="dispute-reason" className="sr-only">Why are you disputing?</label>
            <input
              id="dispute-reason"
              type="text"
              placeholder="Why? e.g. “I caught them first” (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={100}
              style={{ fontSize: '0.9rem', padding: '0.7rem 1rem' }}
            />
            <button className="btn btn-danger" onClick={() => onDispute(reason)}>
              Send It to the Vote
            </button>
          </div>
        )}
      </div>

      <p className="text-small" style={{
        margin: 0,
        padding: '0.6rem 0.75rem',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: '8px',
        textAlign: 'left',
        lineHeight: 1.5
      }}>
        {paused ? (
          <><strong>Game paused:</strong> the timer is frozen. Accept now, or decide once play resumes.</>
        ) : (
          <>
            {canDispute ? (
              <><strong>How disputes work:</strong> the other players vote, majority decides.</>
            ) : (
              <><strong>Just the two of you:</strong> there's no jury, so settle it out loud.</>
            )}{' '}
            No response before the timer ends counts as accepting.
          </>
        )}
      </p>
    </Modal>
  );
}
