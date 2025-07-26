import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Dispute } from '../types';

interface VotingBannerProps {
  dispute: Dispute;
}

export default function VotingBanner({ dispute }: VotingBannerProps) {
  const { voteOnDispute, state } = useGame();
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  const currentPlayer = state.currentPlayer;

  useEffect(() => {
    // Check if current player has already voted
    const existingVote = dispute.votes.find(v => v.voterId === currentPlayer?.id);
    setHasVoted(!!existingVote);
  }, [dispute.votes, currentPlayer?.id]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const closeTime = new Date(dispute.closesAt).getTime();
      const remaining = Math.max(0, Math.ceil((closeTime - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [dispute.closesAt]);

  const handleVote = async (vote: boolean) => {
    await voteOnDispute(dispute.id, vote);
    setHasVoted(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVoteCounts = () => {
    const uphold = dispute.votes.filter(v => v.vote === true).length;
    const fail = dispute.votes.filter(v => v.vote === false).length;
    return { uphold, fail };
  };

  if (timeLeft === 0) {
    return null; // Hide banner when voting is over
  }

  const { uphold, fail } = getVoteCounts();

  return (
    <div className="card" style={{ 
      backgroundColor: '#ffc107', 
      color: '#000', 
      margin: '1rem 0',
      border: '2px solid #f0ad4e'
    }}>
      <div className="flex flex-between" style={{ marginBottom: '0.5rem' }}>
        <h3>⚖️ Vote on Dispute</h3>
        <div className="timer" style={{ backgroundColor: '#000', color: '#ffc107' }}>
          {formatTime(timeLeft)}
        </div>
      </div>
      
      <p style={{ marginBottom: '1rem' }}>
        <strong>A player is disputing a Gotcha claim. Vote to resolve!</strong>
      </p>
      
      {dispute.description && (
        <div style={{ 
          margin: '0.5rem 0', 
          padding: '0.5rem', 
          backgroundColor: '#fff', 
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          <strong>Dispute reason:</strong> "{dispute.description}"
        </div>
      )}
      
      <div className="text-small" style={{ marginBottom: '1rem' }}>
        Current votes: {uphold} uphold, {fail} fail
      </div>
      
      {!hasVoted ? (
        <div className="flex gap-1">
          <button
            className="btn btn-success"
            onClick={() => handleVote(true)}
            disabled={state.isLoading}
            style={{ color: '#fff' }}
          >
            ✅ Uphold Gotcha
          </button>
          <button
            className="btn btn-danger"
            onClick={() => handleVote(false)}
            disabled={state.isLoading}
            style={{ color: '#fff' }}
          >
            ❌ Fail Gotcha
          </button>
        </div>
      ) : (
        <div className="text-center" style={{ 
          padding: '0.5rem', 
          backgroundColor: '#28a745', 
          color: '#fff', 
          borderRadius: '4px' 
        }}>
          ✅ You've voted! Waiting for others...
        </div>
      )}
      
      <div className="text-small" style={{ marginTop: '0.5rem' }}>
        <strong>Vote wisely:</strong> Uphold if the claimer said "Gotcha!" first, 
        fail if the target caught them before they could say it.
      </div>
    </div>
  );
} 