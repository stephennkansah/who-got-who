import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { validateGameInput } from '../utils/validation';
import AvatarPicker from './AvatarPicker';
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
        <div className="card text-center" style={{ padding: '2.5rem 2rem' }}>
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
          <h2>Setting up…</h2>
          <p className="type" style={{ fontSize: '0.85rem' }}>establishing secure channel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Hero */}
      <header style={{ textAlign: 'center', margin: '1.25rem 0 1.5rem', position: 'relative' }}>
        <div className="overline" style={{ marginBottom: '0.6rem' }}>
          Classified · Party Ops
        </div>
        <h1 style={{ fontSize: '4rem' }}>
          Who Got Who
        </h1>
        <p className="type" style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.4rem' }}>
          secret tasks. stealth claims. plausible deniability.
        </p>
        <div
          className="stamp danger"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '6px',
            fontSize: '0.78rem',
            opacity: 0.85,
            transform: 'rotate(9deg)',
          }}
        >
          Top Secret
        </div>
      </header>

      {/* Recruitment card */}
      <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1.25rem' }}>
        {state.error && (
          <div role="alert" className="game-error" style={{ marginBottom: '1rem' }}>
            {state.error}
          </div>
        )}

        <div className="overline" style={{ marginBottom: '1rem' }}>Agent profile</div>

        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
          <AvatarPicker
            selectedAvatar={selectedAvatar}
            onAvatarChange={(avatar, isPhoto) => {
              setSelectedAvatar(avatar);
              setAvatarType(isPhoto ? 'photo' : 'emoji');
            }}
          />
        </div>

        <input
          aria-label="Player name"
          type="text"
          placeholder="Your agent name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={{ marginBottom: '0.9rem' }}
        />

        {mode === 'welcome' && (
          <div className="flex-column gap-1">
            <button
              className="btn btn-primary"
              onClick={handleStartGame}
              disabled={!playerName.trim() || state.isLoading}
            >
              Start a New Game
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setMode('join')}
            >
              Join a Game
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="flex-column gap-1">
            <input
              aria-label="Game code"
              type="text"
              className="type"
              placeholder="GAME CODE · e.g. ABC234"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: '4px' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleJoinGame}
              disabled={gameId.length !== 6 || !playerName.trim() || state.isLoading}
            >
              Join the Party
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setMode('welcome')}
            >
              ← Back
            </button>
          </div>
        )}
      </div>

      {/* Deployment scenarios */}
      <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
        <div className="overline" style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
          Field-tested at
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.6rem',
          textAlign: 'center'
        }}>
          {[
            ['🏠', 'House parties'],
            ['🍽️', 'Dinners'],
            ['🍻', 'Pre-drinks'],
            ['🎲', 'Game nights'],
          ].map(([icon, label]) => (
            <div key={label} className="feature-item">
              <div style={{ fontSize: '1.6rem', marginBottom: '0.15rem' }} aria-hidden="true">{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* The briefing */}
      <div className="paper-card" style={{ padding: '1.25rem 1.25rem 1.1rem', marginBottom: '0.9rem' }}>
        <div className="type" style={{
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--paper-dim)',
          marginBottom: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>Briefing № 001</span>
          <span>Eyes only</span>
        </div>
        <div className="flex-column" style={{ gap: '0.7rem' }}>
          <Step number="1" text="Every agent receives secret tasks to pull off on the others." />
          <Step number="2" text="Complete yours without being noticed. Suspicion is failure." />
          <Step number="3" text={'Say "Gotcha!" out loud, then claim it in the app.'} />
          <Step number="4" text="First to the target score takes the game." />
        </div>
      </div>

      <p style={{ textAlign: 'center', margin: '0.5rem 0 1rem', fontSize: '0.78rem' }}>
        <a href="/privacy.html" style={{ color: 'var(--text-muted)' }}>Privacy</a>
        {' · '}Only upload photos with everyone&apos;s permission.
      </p>
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
