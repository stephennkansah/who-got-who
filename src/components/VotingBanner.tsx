import React, { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import { formatSeconds, useSecondsLeft } from '../hooks/useCountdown';
import { Dispute } from '../types';

interface VotingBannerProps {
  dispute: Dispute;
}

export default function VotingBanner({ dispute }: VotingBannerProps) {
  const { voteOnDispute, state } = useGame();
  const pausedAt = state.currentGame?.pausedAt;
  const timeLeft = useSecondsLeft(dispute.closesAt, pausedAt);
  const [hasVoted, setHasVoted] = useState(false);

  const currentPlayer = state.currentPlayer;
  const players = state.currentGame?.players || [];
  const accuserName = players.find((p) => p.id === dispute.accuserId)?.name || 'A player';
  const targetName = players.find((p) => p.id === dispute.targetId)?.name || 'another player';
  const taskText = dispute.taskText;

  useEffect(() => {
    // Check if current player has already voted
    const existingVote = dispute.votes.find(v => v.voterId === currentPlayer?.id);
    setHasVoted(!!existingVote);
  }, [dispute.votes, currentPlayer?.id]);

  const handleVote = async (vote: boolean) => {
    try {
      await voteOnDispute(dispute.id, vote);
      setHasVoted(true);
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  if (timeLeft === 0 && !pausedAt) {
    return null; // Hide banner when voting is over
  }

  const uphold = dispute.votes.filter(v => v.vote === true).length;
  const fail = dispute.votes.filter(v => v.vote === false).length;

  return (
    <div className="card" style={{
      background: 'var(--warning-soft)',
      border: '2px solid var(--warning)',
    }}>
      <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
        <h3 style={{
          margin: 0,
          color: 'var(--warning-ink)',
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          letterSpacing: '0.08em',
        }}>
          Group Vote
        </h3>
        <span className={`timer ${timeLeft <= 15 && !pausedAt ? 'urgent' : ''}`}>
          {pausedAt ? `Paused · ${formatSeconds(timeLeft)}` : formatSeconds(timeLeft)}
        </span>
      </div>

      <p style={{ marginBottom: '0.5rem', color: 'var(--warning-ink)', fontWeight: 700 }}>
        {accuserName} claims they got {targetName} — {targetName} disputes it.
      </p>

      {taskText && (
        <div style={{
          margin: '0.5rem 0',
          padding: '0.6rem 0.75rem',
          background: 'rgba(255,255,255,0.8)',
          color: 'var(--paper-ink)',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontStyle: 'italic',
        }}>
          <span style={{ fontStyle: 'normal', fontWeight: 700 }}>The mission:</span> "{taskText}"
        </div>
      )}

      {dispute.description && (
        <div style={{
          margin: '0.5rem 0',
          padding: '0.6rem 0.75rem',
          background: 'rgba(255,255,255,0.8)',
          color: 'var(--paper-ink)',
          borderRadius: '8px',
          fontSize: '0.9rem',
        }}>
          <strong>{targetName} says:</strong> "{dispute.description}"
        </div>
      )}

      {pausedAt && !hasVoted ? (
        <p className="text-small" style={{ margin: '0.6rem 0 0', color: 'var(--warning-ink)', fontWeight: 700 }}>
          Voting is on hold while the game is paused.
        </p>
      ) : !hasVoted ? (
        <>
          <div className="flex gap-1" style={{ margin: '0.75rem 0 0.5rem' }}>
            <button
              className="btn btn-success"
              onClick={() => handleVote(true)}
              disabled={state.isLoading}
              style={{ padding: '0.75rem' }}
            >
              It Counts
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleVote(false)}
              disabled={state.isLoading}
              style={{ padding: '0.75rem' }}
            >
              It Fails
            </button>
          </div>
          <p className="text-small" style={{ margin: 0, color: 'var(--warning-ink)' }}>
            Vote <strong>It counts</strong> if {accuserName} said "Gotcha!" first —{' '}
            <strong>It fails</strong> if {targetName} caught them before they could.
          </p>
        </>
      ) : (
        <div className="text-center" style={{
          marginTop: '0.6rem',
          padding: '0.6rem',
          background: 'var(--success-gradient)',
          color: '#fff',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 700,
        }}>
          Vote in! {uphold} count it · {fail} fail it — waiting for the rest…
        </div>
      )}
    </div>
  );
}
