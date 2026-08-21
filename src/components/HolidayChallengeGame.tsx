import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Challenge } from '../types';
import PlayerAvatar from './PlayerAvatar';
import Modal from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import { showToast } from './common/Toast';

export default function HolidayChallengeGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, completeChallenge, endGame, leaveGame } = useGame();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [confirmChallenge, setConfirmChallenge] = useState<Challenge | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'end' | 'leave' | null>(null);

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const challenges = currentGame?.selectedChallenges || [];

  // Object URL for the proof preview
  useEffect(() => {
    if (!selectedImage) {
      setImagePreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(selectedImage);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  useEffect(() => {
    if (currentGame?.status === 'ended') {
      navigate(`/recap/${gameId}`);
    }
  }, [currentGame?.status, gameId, navigate]);

  if (!currentGame || !currentPlayer) {
    return (
      <div className="container flex-center">
        <div className="card text-center" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }} aria-hidden="true">⏳</div>
          <h2>Connecting…</h2>
          <p style={{ marginBottom: '1.5rem' }}>Loading the holiday challenge.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (currentGame.gameType !== 'holiday-challenge') {
    return (
      <div className="container flex-center">
        <div className="card text-center" style={{ padding: '2.5rem 2rem' }}>
          <h2>Wrong game type</h2>
          <p style={{ marginBottom: '1.5rem' }}>This screen is only for You Got Who? games.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/game/${gameId}`)}>
            🎮 Go to your game
          </button>
        </div>
      </div>
    );
  }

  const goldPoints = currentGame.settings.holidayGoldPoints || 3;
  const silverPoints = currentGame.settings.holidaySilverPoints || 1;

  const getChallengeStatus = (challengeId: string) => {
    const completions = currentGame.challengeCompletions || [];
    const challengeCompletions = completions.filter(c => c.challengeId === challengeId);

    const playerCompletion = challengeCompletions.find(c => c.playerId === currentPlayer.id);
    if (playerCompletion) {
      return { completed: true, type: playerCompletion.type, points: playerCompletion.points, awardsClosed: false, goldTaken: true };
    }

    const hasGold = challengeCompletions.some(c => c.type === 'gold');
    const silverCount = challengeCompletions.filter(c => c.type === 'silver').length;
    const awardsClosed = hasGold && silverCount >= (currentGame.settings.holidayMaxSilverPerChallenge || 2);
    return { completed: false, type: undefined as undefined | 'gold' | 'silver', points: 0, goldTaken: hasGold, awardsClosed };
  };

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    if (challenge.requiresProof) {
      setShowImageUpload(true);
    } else {
      setConfirmChallenge(challenge);
    }
  };

  const handleCompleteChallenge = async (challenge: Challenge, proofImage: File | null) => {
    setIsCompleting(true);
    try {
      await completeChallenge(challenge.id, proofImage || undefined);
      setSelectedChallenge(null);
      setConfirmChallenge(null);
      setShowImageUpload(false);
      setSelectedImage(null);
      showToast('Challenge complete! 🎉', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'That challenge could not be completed — try again.',
        'error',
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleImageUploadCancel = () => {
    setShowImageUpload(false);
    setSelectedChallenge(null);
    setSelectedImage(null);
  };

  const sortedPlayers = [...currentGame.players].sort((a, b) =>
    (b.challengeScore || 0) - (a.challengeScore || 0)
  );

  const winCondition = currentGame.settings.holidayChallengeWinCondition || 7;
  const myRank = sortedPlayers.findIndex(p => p.id === currentPlayer.id);
  const completedCount = challenges.filter(c => getChallengeStatus(c.id).completed).length;

  return (
    <div className="container">
      {/* Header */}
      <div className="game-header">
        <button
          onClick={() => setShowLeaderboard(true)}
          className="rank-badge"
          aria-label="Show leaderboard"
        >
          <div style={{ fontSize: '1.05rem', lineHeight: 1 }} aria-hidden="true">
            {myRank === 0 ? '🥇' : myRank === 1 ? '🥈' : myRank === 2 ? '🥉' : `#${myRank + 1}`}
          </div>
          <div style={{ fontSize: '0.85rem' }}>{currentPlayer.challengeScore || 0}</div>
        </button>

        <div className="header-title" style={{ textAlign: 'center' }}>
          <h1>🏖️ You Got Who?</h1>
          <div className="player-count">FIRST TO {winCondition} POINTS</div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {currentPlayer.isHost && (
            <button
              onClick={() => setConfirmAction('end')}
              className="btn-icon danger"
              aria-label="End game for everyone"
              title="End Game"
            >
              🏁
            </button>
          )}
          <button
            onClick={() => setConfirmAction('leave')}
            className="btn-icon"
            aria-label="Leave game"
            title="Leave Game"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Game Info */}
      <div className="card" style={{
        background: 'var(--warning-soft)',
        border: '1px solid var(--warning-border)',
        padding: '0.9rem 1.1rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--warning-ink)', marginBottom: '0.2rem' }}>
          🥇 First to finish: {goldPoints} pts · 🥈 next {currentGame.settings.holidayMaxSilverPerChallenge || 2}: {silverPoints} pt each
        </div>
        <div style={{ color: 'var(--warning-ink)', fontSize: '0.78rem', fontWeight: 600, opacity: 0.85 }}>
          📸 Only upload photo proof with permission from everyone shown.
        </div>
      </div>

      {/* Top 3 Leaderboard */}
      <div className="card leaderboard-widget">
        <button
          onClick={() => setShowLeaderboard(true)}
          aria-label="Show full leaderboard"
          style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'inherit' }}
        >
          <div className="leaderboard-label">Leaderboard · tap for all</div>
          <div className="leaderboard-grid">
            {sortedPlayers.slice(0, 3).map((player, index) => (
              <div
                key={player.id}
                className={`leaderboard-card ${player.id === currentPlayer.id ? 'is-me' : ''}`}
              >
                <span className="medal" aria-hidden="true">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
                <span className="player-name">
                  {player.id === currentPlayer.id ? `${player.name} (You)` : player.name}
                </span>
                <span className="player-score">{player.challengeScore || 0}</span>
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Challenge List */}
      <div className="card">
        <h2 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
          🏁 Challenges
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {completedCount}/{challenges.length} done — race the others!
        </p>

        <div className="flex-column gap-1">
          {challenges.map((challenge, index) => {
            const status = getChallengeStatus(challenge.id);
            const locked = status.completed || status.awardsClosed;

            return (
              <button
                key={challenge.id}
                className="task-list-item"
                onClick={() => handleChallengeClick(challenge)}
                disabled={locked || isCompleting}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: status.completed
                    ? (status.type === 'gold' ? 'var(--warning-soft)' : 'rgba(0,0,0,0.04)')
                    : 'white',
                  borderLeft: `5px solid ${
                    status.completed
                      ? (status.type === 'gold' ? 'var(--warning)' : '#9ca3af')
                      : status.awardsClosed
                        ? '#d1d5db'
                        : 'var(--success)'
                  }`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  opacity: locked ? 0.7 : 1,
                  cursor: locked ? 'default' : 'pointer',
                  marginBottom: 0,
                  animationDelay: `${Math.min(index * 50, 400)}ms`,
                }}
              >
                <div className="flex-between gap-1" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4, marginBottom: '0.3rem' }}>
                      {challenge.text}
                    </div>
                    {challenge.requiresProof && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        📸 Requires photo proof
                      </div>
                    )}
                    {status.awardsClosed && !status.completed && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        All points claimed for this one
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.4rem' }} aria-hidden="true">
                      {status.completed
                        ? (status.type === 'gold' ? '🥇' : '🥈')
                        : status.awardsClosed
                          ? '🔒'
                          : (status.goldTaken ? '🥈' : '🥇')}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: status.completed || !status.goldTaken ? 'var(--warning-ink)' : 'var(--text-muted)',
                    }}>
                      {status.completed
                        ? `+${status.points}`
                        : status.awardsClosed
                          ? '—'
                          : (status.goldTaken ? `+${silverPoints}` : `+${goldPoints}`)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm a no-proof completion — one mistap shouldn't claim gold */}
      <ConfirmationModal
        isOpen={!!confirmChallenge}
        title="Done it? 🎉"
        message={confirmChallenge
          ? `"${confirmChallenge.text}"\n\nClaim ${getChallengeStatus(confirmChallenge.id).goldTaken ? `🥈 ${silverPoints} point${silverPoints === 1 ? '' : 's'}` : `🥇 ${goldPoints} points`} — everyone will see it.`
          : ''}
        confirmLabel={isCompleting ? 'Claiming…' : 'Yes, claim it!'}
        cancelLabel="Not yet"
        onConfirm={() => confirmChallenge && handleCompleteChallenge(confirmChallenge, null)}
        onCancel={() => { setConfirmChallenge(null); setSelectedChallenge(null); }}
      />

      {/* Photo proof modal */}
      <Modal
        isOpen={showImageUpload && !!selectedChallenge}
        onClose={handleImageUploadCancel}
        ariaLabel="Upload photo proof"
        showClose
      >
        <h3 style={{ margin: '0 0 0.75rem' }}>📸 Photo proof</h3>

        <div style={{
          background: 'rgba(0,0,0,0.04)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          fontStyle: 'italic',
        }}>
          "{selectedChallenge?.text}"
        </div>

        {imagePreview ? (
          <div style={{ marginBottom: '1rem' }}>
            <img
              src={imagePreview}
              alt="Selected proof"
              style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        ) : (
          <p className="text-small" style={{ marginBottom: '1rem' }}>
            Snap it or pick it from your camera roll.
          </p>
        )}

        <label
          className="btn btn-secondary"
          style={{ marginBottom: '0.75rem', cursor: 'pointer' }}
        >
          {imagePreview ? '🔁 Choose a different photo' : '📷 Take or choose a photo'}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
            style={{ display: 'none' }}
          />
        </label>

        <div className="flex gap-1">
          <button className="btn btn-secondary" onClick={handleImageUploadCancel} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={() => selectedChallenge && selectedImage && handleCompleteChallenge(selectedChallenge, selectedImage)}
            disabled={!selectedImage || isCompleting}
            style={{ flex: 1.4 }}
          >
            {isCompleting ? '⏳ Uploading…' : '✅ Complete it!'}
          </button>
        </div>
      </Modal>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Modal isOpen onClose={() => setShowLeaderboard(false)} showClose ariaLabel="Full rankings" maxWidth={400}>
          <h3 style={{ margin: '0 0 1rem', textAlign: 'left' }}>🏆 Full rankings</h3>
          <div className="flex-column gap-1">
            {sortedPlayers.map((player, index) => {
              const isYou = player.id === currentPlayer.id;
              return (
                <div key={player.id} className="flex-between" style={{
                  padding: '0.6rem 0.75rem',
                  background: isYou ? 'rgba(139, 92, 246, 0.08)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 'var(--radius-sm)',
                  border: isYou ? '2px solid rgba(139, 92, 246, 0.35)' : '2px solid transparent'
                }}>
                  <div className="flex gap-1" style={{ alignItems: 'center', minWidth: 0 }}>
                    <span style={{ fontSize: index < 3 ? '1.4rem' : '0.9rem', fontWeight: 700, minWidth: '28px', textAlign: 'center', color: 'var(--text-muted)' }} aria-hidden="true">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <PlayerAvatar player={player} size="small" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name} {isYou && '(You)'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {player.challengeCompletions?.length || 0} challenges done
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--warning-ink)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {player.challengeScore || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* End / leave confirmations */}
      <ConfirmationModal
        isOpen={confirmAction === 'end'}
        title="🏁 End the game?"
        message={'This ends the game for ALL players and shows the final results.\nIt can\'t be undone.'}
        confirmLabel="End game"
        isDangerous
        onConfirm={async () => {
          setConfirmAction(null);
          try {
            await endGame();
            navigate(`/recap/${gameId}`);
          } catch {
            // Errors surface via the global toast bridge.
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmationModal
        isOpen={confirmAction === 'leave'}
        title="🚪 Leave game?"
        message={'You\'ll return to the home screen.\nEveryone else keeps playing.'}
        confirmLabel="Leave"
        isDangerous
        onConfirm={async () => {
          setConfirmAction(null);
          try {
            await leaveGame();
          } catch {
            // Best-effort; still go home.
          }
          navigate('/');
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
