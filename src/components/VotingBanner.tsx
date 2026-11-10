import React, { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { formatSeconds, useSecondsLeft } from '../hooks/useCountdown';
import { Dispute } from '../types';
import Modal from './common/Modal';

interface VotingBannerProps {
  dispute: Dispute;
  /**
   * True when this vote may pop up over the game: it's the next one waiting for
   * you and nothing else is open. The banner row is there either way.
   */
  canPopUp?: boolean;
}

/**
 * A disputed gotcha the group has to settle. It pops up once so nobody misses
 * it; close it and a slim banner stays with the timer and a Vote button.
 */
export default function VotingBanner({ dispute, canPopUp = true }: VotingBannerProps) {
  const { voteOnDispute, state } = useGame();
  const pausedAt = state.currentGame?.pausedAt;
  const timeLeft = useSecondsLeft(dispute.closesAt, pausedAt);
  const [votedHere, setVotedHere] = useState(false);
  const [open, setOpen] = useState(true);

  const currentPlayer = state.currentPlayer;
  const players = state.currentGame?.players || [];
  const accuserName = players.find((p) => p.id === dispute.accuserId)?.name || 'A player';
  const targetName = players.find((p) => p.id === dispute.targetId)?.name || 'another player';
  const taskText = dispute.taskText;

  const hasVoted = votedHere || dispute.votes.some((vote) => vote.voterId === currentPlayer?.id);

  const handleVote = async (vote: boolean) => {
    try {
      await voteOnDispute(dispute.id, vote);
      setVotedHere(true);
      setOpen(false);
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  if (timeLeft === 0 && !pausedAt) {
    return null; // Hide banner when voting is over
  }

  const uphold = dispute.votes.filter(v => v.vote === true).length;
  const fail = dispute.votes.filter(v => v.vote === false).length;
  const clock = pausedAt ? `Paused · ${formatSeconds(timeLeft)}` : formatSeconds(timeLeft);
  const urgent = timeLeft <= 15 && !pausedAt;
  const votable = !hasVoted && !pausedAt;

  return (
    <>
      <div className="claim-banner vote-banner" role="status">
        <span>
          {hasVoted
            ? `Vote in — ${uphold} count it · ${fail} fail it. Waiting for the rest…`
            : pausedAt
              ? `Group vote on hold: ${accuserName} vs ${targetName}.`
              : `Group vote: did ${accuserName} get ${targetName}?`}
        </span>
        {votable ? (
          <button className="btn btn-success btn-small" onClick={() => setOpen(true)}>
            Vote · {clock}
          </button>
        ) : (
          <span className={`timer ${urgent ? 'urgent' : ''}`}>{clock}</span>
        )}
      </div>

      <Modal
        isOpen={open && votable && canPopUp}
        onClose={() => setOpen(false)}
        labelledBy={`vote-title-${dispute.id}`}
        showClose
        maxWidth={400}
      >
        <h2 id={`vote-title-${dispute.id}`} style={{ marginBottom: '0.6rem' }}>Group Vote</h2>
        <div style={{ marginBottom: '0.8rem' }}>
          <span className={`timer ${urgent ? 'urgent' : ''}`} role="timer" aria-label={`Time left to vote: ${clock}`}>
            {clock}
          </span>
        </div>

        <p style={{ margin: '0 0 0.6rem', color: 'var(--paper-ink)', fontWeight: 700 }}>
          {accuserName} says they got {targetName}. {targetName} disputes it.
        </p>

        {taskText && (
          <div className="vote-quote">
            <strong>The mission:</strong> <em>"{taskText}"</em>
          </div>
        )}

        {dispute.description && (
          <div className="vote-quote">
            <strong>{targetName} says:</strong> "{dispute.description}"
          </div>
        )}

        <div className="flex gap-1" style={{ margin: '0.9rem 0 0.6rem' }}>
          <button className="btn btn-success" onClick={() => handleVote(true)} disabled={state.isLoading}>
            It Counts
          </button>
          <button className="btn btn-danger" onClick={() => handleVote(false)} disabled={state.isLoading}>
            It Fails
          </button>
        </div>
        <p className="text-small" style={{ margin: 0 }}>
          <strong>It counts</strong> if {accuserName} said "Gotcha!" first.{' '}
          <strong>It fails</strong> if {targetName} caught them before they could.
        </p>
      </Modal>
    </>
  );
}
