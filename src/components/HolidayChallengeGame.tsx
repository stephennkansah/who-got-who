import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useGameFeed } from '../hooks/useGameFeed';
import { Challenge } from '../types';
import PlayerAvatar from './PlayerAvatar';
import PhotoAlbum from './PhotoAlbum';
import Modal from './common/Modal';
import { ConfirmationModal } from './common/ConfirmationModal';
import { showToast } from './common/Toast';
import StampSplash from './common/StampSplash';
import LoadingScreen from './common/LoadingScreen';
import { LeaderboardWidget } from './game/LeaderboardWidget';
import PhaseBanner from './game/PhaseBanner';
import HostMenu from './game/HostMenu';
import { useGamePhase } from '../hooks/useGamePhase';

export default function HolidayChallengeGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, completeChallenge, endGame, leaveGame, openClaims, pauseGame, resumeGame } = useGame();
  const [finale, setFinale] = useState<{ title: string; subtitle: string; tone: 'success' | 'amber' } | null>(null);
  const [showHostMenu, setShowHostMenu] = useState(false);
  const sawLive = useRef(false);
  const phase = useGamePhase(state.currentGame);
  useGameFeed();

  const hostAction = (action: () => Promise<void>) => async () => {
    try {
      await action();
    } catch {
      // Errors surface via the global toast bridge.
    }
  };
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [confirmChallenge, setConfirmChallenge] = useState<Challenge | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'end' | 'leave' | null>(null);
  const [slam, setSlam] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

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
    if (!gameId || (!currentGame && !state.isLoading)) navigate('/', { replace: true });
  }, [gameId, currentGame, state.isLoading, navigate]);

  // Stamp the winner if we watched it happen, then go to the debrief.
  useEffect(() => {
    if (!currentGame) return;
    if (currentGame.status === 'live') {
      sawLive.current = true;
      return;
    }
    if (currentGame.status !== 'ended') return;
    if (!sawLive.current) {
      navigate(`/recap/${currentGame.id}`, { replace: true });
      return;
    }
    const target = currentGame.settings.holidayChallengeWinCondition || 18;
    const winner = [...currentGame.players].sort((a, b) => (b.challengeScore || 0) - (a.challengeScore || 0))[0];
    const reached = winner && (winner.challengeScore || 0) >= target;
    setFinale({
      title: !reached ? 'Trip Over' : winner.id === currentPlayer?.id ? 'You Win' : `${winner.name} Wins`,
      subtitle: reached ? `${winner.challengeScore} points — see the album` : 'the host ended the game',
      tone: reached && winner.id === currentPlayer?.id ? 'success' : 'amber',
    });
  }, [currentGame, currentPlayer?.id, navigate]);

  // One-time "challenges live" splash per game on this device
  useEffect(() => {
    if (currentGame?.status === 'live' && currentPlayer && gameId) {
      const key = `wgw-intro-${gameId}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        setShowIntro(true);
      }
    }
  }, [currentGame?.status, currentPlayer, gameId]);

  if (!currentGame || !currentPlayer) {
    return <LoadingScreen message="loading the challenge…" showBack />;
  }

  if (currentGame.gameType !== 'holiday-challenge') {
    return (
      <div className="container flex-center">
        <div className="card text-center" style={{ padding: '2.5rem 2rem' }}>
          <h2>Wrong game type</h2>
          <p style={{ marginBottom: '1.5rem' }}>This screen is only for You Got Who? games.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/game/${gameId}`)}>
            Go to Your Game
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
      setSlam(true);
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

  const winCondition = currentGame.settings.holidayChallengeWinCondition || 18;
  const myRank = sortedPlayers.findIndex(p => p.id === currentPlayer.id);
  const completedCount = challenges.filter(c => getChallengeStatus(c.id).completed).length;
  // Still-winnable challenges first; done and closed ones sink to the bottom.
  const orderedChallenges = [...challenges].sort((a, b) => {
    const rank = (id: string) => {
      const status = getChallengeStatus(id);
      return status.completed || status.awardsClosed ? 1 : 0;
    };
    return rank(a.id) - rank(b.id);
  });
  const recent = [...(currentGame.challengeCompletions || [])]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  const photos = recent.filter((completion) => completion.proofUrl);
  const nameOf = (id: string) => currentGame.players.find((p) => p.id === id)?.name || 'Someone';
  const challengeText = (id: string) => challenges.find((c) => c.id === id)?.text || 'a challenge';

  return (
    <div className="container">
      {/* Header */}
      <div className="game-header">
        <button
          onClick={() => setShowLeaderboard(true)}
          className="rank-badge"
          aria-label="Show leaderboard"
        >
          <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>{currentPlayer.challengeScore || 0}</div>
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', opacity: 0.8 }}>
            #{myRank + 1} OF {sortedPlayers.length}
          </div>
        </button>

        <div className="header-title" style={{ textAlign: 'center' }}>
          <h1>You Got Who?</h1>
          <div className="player-count">FIRST TO {winCondition} POINTS</div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {currentPlayer.isHost && (
            <button
              onClick={() => setShowHostMenu(true)}
              className="chip-btn"
              aria-label="Host controls: pause, open early, or end the game"
            >
              Host
            </button>
          )}
          <button
            onClick={() => setConfirmAction('leave')}
            className="chip-btn"
            aria-label="Leave game"
          >
            Exit
          </button>
        </div>
      </div>

      <PhaseBanner
        phase={phase}
        isHost={currentPlayer.isHost}
        hostName={nameOf(currentGame.hostId)}
        isHoliday
        onOpenNow={hostAction(openClaims)}
        onResume={hostAction(resumeGame)}
      />

      <LeaderboardWidget
        players={currentGame.players}
        currentPlayerId={currentPlayer.id}
        targetScore={winCondition}
        scoreOf={(player) => player.challengeScore || 0}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* Live feed: who just took what */}
      {recent.length > 0 && (
        <div className="card" style={{ padding: '0.9rem 1rem' }}>
          <div className="overline" style={{ marginBottom: '0.6rem' }}>Latest</div>
          <div className="flex-column" style={{ gap: '0.35rem', marginBottom: photos.length ? '0.8rem' : 0 }}>
            {recent.slice(0, 3).map((completion) => (
              <div key={completion.id} style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <strong>{completion.playerId === currentPlayer.id ? 'You' : nameOf(completion.playerId)}</strong>
                {' took '}
                <span style={{ color: completion.type === 'gold' ? 'var(--amber)' : 'var(--text-muted)', fontWeight: 700 }}>
                  {completion.type}
                </span>
                <span style={{ color: 'var(--text-muted)' }}> · {challengeText(completion.challengeId)}</span>
              </div>
            ))}
          </div>
          {photos.length > 0 && <PhotoAlbum game={currentGame} completions={photos.slice(0, 6)} />}
        </div>
      )}

      {/* Challenge List */}
      <div className="card">
        <div className="overline" style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
          Open assignments
        </div>
        <h2 style={{ marginBottom: '0.25rem' }}>
          Challenges
        </h2>
        <p className="type" style={{ textAlign: 'center', fontSize: '0.78rem', marginBottom: '1rem' }}>
          {completedCount}/{challenges.length} filed · gold {goldPoints} pts, then {currentGame.settings.holidayMaxSilverPerChallenge || 2} silvers at {silverPoints}
        </p>

        <div className="flex-column gap-1">
          {orderedChallenges.map((challenge, index) => {
            const status = getChallengeStatus(challenge.id);
            const locked = status.completed || status.awardsClosed;

            return (
              <button
                key={challenge.id}
                className="task-list-item paper-card"
                onClick={() => handleChallengeClick(challenge)}
                disabled={locked || isCompleting || !!phase.lockReason}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  borderLeft: `5px solid ${
                    status.completed
                      ? (status.type === 'gold' ? 'var(--warning)' : 'var(--paper-dim)')
                      : status.awardsClosed
                        ? 'var(--paper-line)'
                        : 'var(--success)'
                  }`,
                  opacity: locked ? 0.8 : 1,
                  cursor: locked ? 'default' : 'pointer',
                  marginBottom: 0,
                  animationDelay: `${Math.min(index * 50, 400)}ms`,
                  transform: `rotate(${index % 2 === 0 ? '-0.3' : '0.3'}deg)`,
                }}
              >
                <div className="flex-between gap-1" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--paper-ink)',
                      lineHeight: 1.45,
                      marginBottom: '0.3rem',
                    }}>
                      {challenge.text}
                    </div>
                    {challenge.requiresProof && (
                      <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--paper-dim)' }}>
                        Requires photo proof
                      </div>
                    )}
                    {status.awardsClosed && !status.completed && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--paper-dim)', fontWeight: 700 }}>
                        All points claimed for this one
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: '0.1rem' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.78rem',
                      letterSpacing: '0.14em',
                      color: status.awardsClosed && !status.completed
                        ? 'var(--paper-dim)'
                        : (status.completed ? status.type === 'gold' : !status.goldTaken)
                          ? 'var(--warning-deep)'
                          : 'var(--paper-dim)',
                    }}>
                      {status.completed
                        ? (status.type === 'gold' ? 'Gold' : 'Silver')
                        : status.awardsClosed
                          ? 'Closed'
                          : (status.goldTaken ? 'Silver' : 'Gold')}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.05rem',
                      color: status.completed || !status.goldTaken ? 'var(--warning-ink)' : 'var(--paper-dim)',
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
        title="Done it?"
        message={confirmChallenge
          ? `"${confirmChallenge.text}"\n\nClaim ${getChallengeStatus(confirmChallenge.id).goldTaken ? `silver (${silverPoints} pt)` : `gold (${goldPoints} pts)`} — everyone will see it.`
          : ''}
        confirmLabel={isCompleting ? 'Claiming…' : 'Yes, claim it'}
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
        <h2 style={{ margin: '0 0 0.75rem' }}>Photo Proof</h2>

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

        <p className="text-small" style={{ marginBottom: '0.75rem' }}>
          Everyone in the game sees this photo in the trip album — only include people who said yes.
        </p>

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
          {imagePreview ? 'Choose a Different Photo' : 'Take or Choose a Photo'}
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
            {isCompleting ? 'Uploading…' : 'Complete It'}
          </button>
        </div>
      </Modal>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Modal isOpen onClose={() => setShowLeaderboard(false)} showClose ariaLabel="Full rankings" maxWidth={400}>
          <h3 style={{ margin: '0 0 1rem', textAlign: 'left' }}>Full Rankings</h3>
          <div className="flex-column gap-1">
            {sortedPlayers.map((player, index) => {
              const isYou = player.id === currentPlayer.id;
              return (
                <div key={player.id} className="flex-between" style={{
                  padding: '0.6rem 0.75rem',
                  background: isYou ? 'var(--me-bg)' : 'rgba(35, 32, 20, 0.04)',
                  borderRadius: 'var(--radius-sm)',
                  border: isYou ? '1.5px solid var(--me-border)' : '1.5px solid transparent'
                }}>
                  <div className="flex gap-1" style={{ alignItems: 'center', minWidth: 0 }}>
                    <span style={{ fontSize: index < 3 ? '1.4rem' : '0.9rem', fontWeight: 700, minWidth: '28px', textAlign: 'center', color: 'var(--paper-dim)' }} aria-hidden="true">
                      {`${index + 1}.`}
                    </span>
                    <PlayerAvatar player={player} size="small" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name} {isYou && '(You)'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--paper-dim)' }}>
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

      <HostMenu
        isOpen={showHostMenu}
        phase={phase}
        isHoliday
        onClose={() => setShowHostMenu(false)}
        onOpenClaims={hostAction(openClaims)}
        onPause={hostAction(pauseGame)}
        onResume={hostAction(resumeGame)}
        onEnd={() => setConfirmAction('end')}
      />

      {/* End / leave confirmations */}
      <ConfirmationModal
        isOpen={confirmAction === 'end'}
        title="End the game?"
        message={'This ends the game for ALL players and shows the final results.\nIt can\'t be undone.'}
        confirmLabel="End game"
        isDangerous
        onConfirm={async () => {
          setConfirmAction(null);
          try {
            await endGame();
          } catch {
            // Errors surface via the global toast bridge.
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmationModal
        isOpen={confirmAction === 'leave'}
        title="Leave the game?"
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
          navigate('/', { replace: true });
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {showIntro && (
        <StampSplash
          title="Challenges Live"
          subtitle={`first to ${winCondition} points takes the trip`}
          tone="amber"
          durationMs={1900}
          onDone={() => setShowIntro(false)}
        />
      )}

      {slam && !finale && (
        <StampSplash
          title="Claimed!"
          subtitle="points banked — check the board"
          tone="amber"
          onDone={() => setSlam(false)}
        />
      )}

      {finale && (
        <StampSplash
          title={finale.title}
          subtitle={finale.subtitle}
          tone={finale.tone}
          durationMs={2400}
          onDone={() => navigate(`/recap/${currentGame.id}`, { replace: true })}
        />
      )}
    </div>
  );
}
