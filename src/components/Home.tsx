import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { validateGameInput } from '../utils/validation';
import AvatarPicker from './AvatarPicker';
import Modal from './common/Modal';
import { showToast } from './common/Toast';

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, createGame, joinGame, leaveGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('😎');
  const [avatarType, setAvatarType] = useState<'emoji' | 'photo'>('emoji');
  const [mode, setMode] = useState<'join' | 'welcome'>('welcome');
  const [showBriefing, setShowBriefing] = useState(false);

  // Initialization effects...
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      const joinGameId = searchParams.get('join')?.trim().toUpperCase();
      if (!joinGameId && state.currentGame) {
        void leaveGame().catch(() => undefined);
      }
      if (joinGameId) {
        setMode('join');
        setGameId(joinGameId);
        if (state.currentGame && state.currentGame.id !== joinGameId) {
          void leaveGame().catch(() => undefined);
        }
      }
    }
  }, [hasInitialized, searchParams, state.currentGame, leaveGame]);

  useEffect(() => {
    if (state.currentGame) {
      const requestedGameId = searchParams.get('join')?.trim().toUpperCase();
      if (requestedGameId && requestedGameId !== state.currentGame.id) return;
      if (state.currentGame.status === 'draft') {
        const packSelected = state.currentGame.settings?.selectedPack;
        const isHost = state.currentPlayer?.isHost;

        if (packSelected || !isHost) {
          navigate(`/lobby/${state.currentGame.id}`);
        } else {
          navigate(`/select-pack/${state.currentGame.id}`);
        }
      } else if (state.currentGame.status === 'live') {
        navigate(`/game/${state.currentGame.id}`);
      } else if (state.currentGame.status === 'ended') {
        navigate(`/recap/${state.currentGame.id}`);
      }
    }
  }, [state.currentGame, state.currentPlayer, navigate, searchParams]);

  const handleStartGame = async () => {
    const validation = validateGameInput(playerName, undefined, selectedAvatar);
    if (!validation.isValid) {
      showToast(validation.errors.join(' '), 'error');
      return;
    }
    try {
      await createGame(
        validation.sanitizedValues.playerName!,
        validation.sanitizedValues.avatar,
        avatarType,
      );
    } catch {
      // The provider renders the actionable service error below.
    }
  };

  const handleJoinGame = async () => {
    const validation = validateGameInput(playerName, gameId, selectedAvatar);
    if (!validation.isValid) {
      showToast(validation.errors.join(' '), 'error');
      return;
    }
    try {
      await joinGame(
        validation.sanitizedValues.gameId!,
        validation.sanitizedValues.playerName!,
        validation.sanitizedValues.avatar,
        avatarType,
      );
    } catch {
      // The provider renders the actionable service error below.
    }
  };

  if (state.isLoading) {
    return (
      <div className="container flex-center">
        <div className="text-center">
          <div
            aria-hidden="true"
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 1.1rem',
              borderRadius: '50%',
              border: '3px solid var(--line)',
              borderTopColor: 'var(--amber)',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <p className="type" style={{ fontSize: '0.85rem' }}>establishing secure channel…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ justifyContent: 'space-between', textAlign: 'center' }}>
      {/* Masthead */}
      <header style={{ position: 'relative', paddingTop: '9vh' }}>
        <div className="overline" style={{ marginBottom: '0.7rem' }}>
          Classified · Party Ops
        </div>
        <h1 style={{ fontSize: 'clamp(4rem, 22vw, 5.5rem)', marginBottom: '0.5rem' }}>
          Who<br />Got Who
        </h1>
        <p className="type" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          secret tasks. stealth claims.<br />plausible deniability.
        </p>
        <div
          className="stamp danger"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'calc(9vh + 30px)',
            right: '2px',
            fontSize: '0.75rem',
            opacity: 0.9,
            transform: 'rotate(10deg)',
          }}
        >
          Top Secret
        </div>
      </header>

      {/* Action zone */}
      <div style={{ margin: '2rem 0' }}>
        {state.error && (
          <div role="alert" className="game-error" style={{ marginBottom: '1rem' }}>
            {state.error}
          </div>
        )}

        {/* Agent identity: one row */}
        <div className="flex gap-1" style={{ alignItems: 'center', marginBottom: '1rem' }}>
          <AvatarPicker
            selectedAvatar={selectedAvatar}
            onAvatarChange={(avatar, isPhoto) => {
              setSelectedAvatar(avatar);
              setAvatarType(isPhoto ? 'photo' : 'emoji');
            }}
            style={{ width: '58px', height: '58px', flexShrink: 0 }}
          />
          <input
            aria-label="Player name"
            type="text"
            placeholder="Your agent name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ textAlign: 'left', paddingLeft: '1.1rem' }}
          />
        </div>

        {mode === 'welcome' ? (
          <div className="flex-column gap-1">
            <button
              className="btn btn-primary"
              onClick={handleStartGame}
              disabled={!playerName.trim() || state.isLoading}
              style={{ fontSize: '1.4rem', padding: '1.05rem' }}
            >
              Start a New Game
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              I Have a Code
            </button>
          </div>
        ) : (
          <div className="flex-column gap-1">
            <input
              aria-label="Game code"
              type="text"
              className="type"
              placeholder="GAME CODE"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: '6px', fontSize: '1.15rem' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleJoinGame}
              disabled={gameId.length !== 6 || !playerName.trim() || state.isLoading}
              style={{ fontSize: '1.4rem', padding: '1.05rem' }}
            >
              Join the Party
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('welcome')}>
              ← Back
            </button>
          </div>
        )}
      </div>

      {/* Foot */}
      <footer style={{ paddingBottom: '0.5rem' }}>
        <button
          className="btn btn-ghost"
          onClick={() => setShowBriefing(true)}
          style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}
        >
          How does it work?
        </button>
        <p style={{ fontSize: '0.72rem', margin: '0.4rem 0 0' }}>
          <a href="/privacy.html" style={{ color: 'var(--text-muted)' }}>Privacy</a>
          {' · '}Only upload photos with everyone&apos;s permission.
        </p>
      </footer>

      {/* The briefing, on request */}
      <Modal
        isOpen={showBriefing}
        onClose={() => setShowBriefing(false)}
        ariaLabel="How the game works"
        showClose
        maxWidth={420}
      >
        <div className="type" style={{
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--paper-dim)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>Briefing № 001</span>
          <span>Eyes only</span>
        </div>
        <div className="flex-column" style={{ gap: '0.8rem', textAlign: 'left', marginBottom: '1.25rem' }}>
          <Step number="1" text="Every agent receives secret tasks to pull off on the others." />
          <Step number="2" text="Complete yours without being noticed. Suspicion is failure." />
          <Step number="3" text={'Say "Gotcha!" out loud, then claim it in the app. Your target can accept — or dispute it to a group vote.'} />
          <Step number="4" text="First to the target score takes the game." />
        </div>
        <div className="type" style={{ fontSize: '0.78rem', color: 'var(--paper-dim)', marginBottom: '1.25rem' }}>
          field-tested at house parties, dinners, pre-drinks &amp; game nights
        </div>
        <button className="btn btn-primary" onClick={() => setShowBriefing(false)}>
          Understood
        </button>
      </Modal>
    </div>
  );
}

const Step = ({ number, text }: { number: string, text: string }) => (
  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'baseline' }}>
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: '1.2rem',
      color: 'var(--primary)',
      flexShrink: 0,
      width: '18px',
      textAlign: 'center',
    }} aria-hidden="true">
      {number}
    </div>
    <p className="type" style={{ color: 'var(--paper-ink)', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
      {text}
    </p>
  </div>
);

export default Home;
