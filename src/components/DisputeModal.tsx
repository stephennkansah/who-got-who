import React, { useEffect, useRef, useState } from 'react';
import { Dispute } from '../types';
import Modal from './common/Modal';

interface DisputeModalProps {
  dispute: Dispute;
  /** Name of the player claiming the Gotcha (resolved by the parent). */
  accuserName?: string;
  /** Text of the claimed task, when visible to this client. */
  taskText?: string;
  onAccept: () => void;
  onDispute: (reason?: string) => void;
}

export default function DisputeModal({
  dispute,
  accuserName,
  taskText,
  onAccept,
  onDispute,
}: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    const remaining = new Date(dispute.closesAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  });
  const expiredRef = useRef(false);
  const buzzedRef = useRef(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(dispute.closesAt).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(remaining);

      if (remaining <= 10 && !buzzedRef.current) {
        buzzedRef.current = true;
        navigator.vibrate?.(200);
      }
      if (remaining === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onAccept(); // No response in time = automatic accept
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dispute.closesAt, onAccept]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const claimer = accuserName || 'Another player';

  return (
    <Modal isOpen dismissible={false} role="alertdialog" ariaLabel="Gotcha claim response">
      <h3 style={{ marginBottom: '0.75rem' }}>⚡ Gotcha Claimed!</h3>

      <div style={{ marginBottom: '1rem' }}>
        <span className={`timer ${timeLeft <= 30 ? 'urgent' : ''}`} role="timer" aria-label={`Time to respond: ${formatTime(timeLeft)}`}>
          ⏱️ {formatTime(timeLeft)}
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
          ✅ Fair and square — accept
        </button>

        {!showReason ? (
          <button className="btn btn-danger" onClick={() => setShowReason(true)}>
            ❌ No way — dispute it
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
              ⚖️ Send to a group vote
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
        <strong>How disputes work:</strong> the other players vote, majority decides.
        No response before the timer ends counts as accepting.
      </p>
    </Modal>
  );
}
