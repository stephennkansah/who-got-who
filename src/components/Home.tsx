import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { validateGameInput } from '../utils/validation';
import { Game, Player } from '../types';
import AvatarPicker from './AvatarPicker';
import Modal from './common/Modal';
import { showToast } from './common/Toast';
import LoadingScreen from './common/LoadingScreen';
import BrandMark from './common/BrandMark';

const PROFILE_KEY = 'wgw-profile';

// avatarChosen: only an avatar the player actually picked is remembered and shown again.
type Profile = { name: string; avatar: string; avatarType: 'emoji' | 'photo'; avatarChosen?: boolean };

// Used when someone skips the picker, so the roster isn't a wall of identical faces.
const FALLBACK_AVATARS = ['🦊', '🐼', '🦉', '🐙', '🦄', '🐸', '🐯', '🦁', '🐨', '🐵', '🤖', '👻', '👾', '🎭'];

function randomAvatar(): string {
  return FALLBACK_AVATARS[Math.floor(Math.random() * FALLBACK_AVATARS.length)];
}

function loadProfile(): Profile | null {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    return saved && typeof saved.name === 'string' ? saved : null;
  } catch {
    return null;
  }
}

function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // A large photo may not fit; the name alone is still worth keeping.
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, avatar: '', avatarType: 'emoji', avatarChosen: false }));
    } catch {
      // Storage unavailable (private mode).
    }
  }
}

/** Accepts a bare code or a pasted invite link (…/?join=ABC123). */
function extractCode(value: string): string {
  const fromLink = value.match(/join=([A-Za-z0-9]{6})/);
  return (fromLink ? fromLink[1] : value).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
}

function gamePath(game: Game, player: Player | null): string {
  if (game.status === 'live') return `/game/${game.id}`;
  if (game.status === 'ended') return `/recap/${game.id}`;
  return game.settings?.selectedPack || !player?.isHost ? `/lobby/${game.id}` : `/select-pack/${game.id}`;
}

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, createGame, joinGame, leaveGame } = useGame();
  const [profile] = useState(loadProfile);
  const [playerName, setPlayerName] = useState(profile?.name || '');
  const requestedCode = extractCode(searchParams.get('join') || '');
  const [gameId, setGameId] = useState(requestedCode);
  // Blank until the player picks one — a pre-filled face looked like it was assigned.
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatarChosen ? profile.avatar : '');
  const [avatarType, setAvatarType] = useState<'emoji' | 'photo'>(
    profile?.avatarChosen ? profile.avatarType : 'emoji',
  );
  const [mode, setMode] = useState<'join' | 'welcome'>(requestedCode ? 'join' : 'welcome');
  const [showBriefing, setShowBriefing] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // A game that was already open when Home appeared is offered back, never left silently.
  const gameOnArrival = useRef(state.isLoading ? null : state.currentGame?.id ?? null);
  const activeGame = state.currentGame && state.currentGame.status !== 'ended' ? state.currentGame : null;
  const showRejoin = !!activeGame && activeGame.id === gameOnArrival.current;

  // Finished games need no goodbye: clear them so the forms show.
  useEffect(() => {
    if (state.currentGame?.status === 'ended' && state.currentGame.id === gameOnArrival.current) {
      void leaveGame().catch(() => undefined);
    }
  }, [state.currentGame, leaveGame]);

  // Follow a game into its screen when it was just created, joined, or restored.
  useEffect(() => {
    const game = state.currentGame;
    if (!game || game.id === gameOnArrival.current) return;
    navigate(gamePath(game, state.currentPlayer));
  }, [state.currentGame, state.currentPlayer, navigate]);

  // An invite link for the game you're already in just takes you back to it.
  useEffect(() => {
    if (activeGame && requestedCode === activeGame.id) navigate(gamePath(activeGame, state.currentPlayer));
  }, [activeGame, requestedCode, state.currentPlayer, navigate]);

  const remember = (name: string) => saveProfile({
    name,
    avatar: selectedAvatar,
    avatarType,
    avatarChosen: !!selectedAvatar,
  });

  // Skipped the picker? You still get a face, just not one that looks pre-assigned.
  const avatarToSend = () => (selectedAvatar
    ? { avatar: selectedAvatar, type: avatarType }
    : { avatar: randomAvatar(), type: 'emoji' as const });

  const handleStartGame = async () => {
    const chosen = avatarToSend();
    const validation = validateGameInput(playerName, undefined, chosen.avatar);
    if (!validation.isValid) {
      showToast(validation.errors.join(' '), 'error');
      return;
    }
    remember(validation.sanitizedValues.playerName!);
    try {
      await createGame(
        validation.sanitizedValues.playerName!,
        validation.sanitizedValues.avatar,
        chosen.type,
      );
    } catch {
      // The provider renders the actionable service error below.
    }
  };

  const handleJoinGame = async () => {
    const chosen = avatarToSend();
    const validation = validateGameInput(playerName, gameId, chosen.avatar);
    if (!validation.isValid) {
      showToast(validation.errors.join(' '), 'error');
      return;
    }
    remember(validation.sanitizedValues.playerName!);
    try {
      await joinGame(
        validation.sanitizedValues.gameId!,
        validation.sanitizedValues.playerName!,
        validation.sanitizedValues.avatar,
        chosen.type,
      );
    } catch {
      // The provider renders the actionable service error below.
    }
  };

  const handleLeaveActive = async () => {
    setIsLeaving(true);
    try {
      await leaveGame();
    } catch {
      // Best-effort; the forms show either way.
    } finally {
      setIsLeaving(false);
      gameOnArrival.current = null;
    }
  };

  if (state.isLoading && !state.currentGame) {
    return <LoadingScreen message="establishing secure channel…" />;
  }

  return (
    <div className="container" style={{ justifyContent: 'space-between', textAlign: 'center' }}>
      {/* Masthead */}
      <header className="home-masthead">
        <BrandMark size={104} className="brand-mark-centered" />
        <div className="overline" style={{ marginBottom: '0.7rem' }}>
          Classified · Party Ops
        </div>
        <h1 style={{ fontSize: 'clamp(3.5rem, 20vw, 5rem)', marginBottom: '0.5rem' }}>
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
            top: 'calc(2vh + 135px)',
            right: '2px',
            fontSize: '0.82rem',
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

        {showRejoin && activeGame ? (
          <div className="paper-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div className="mission-number type" style={{ marginBottom: '0.5rem' }}>
              Operation in progress
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', letterSpacing: '0.14em', lineHeight: 1 }}>
              {activeGame.id}
            </div>
            <p style={{ color: 'var(--paper-dim)', fontSize: '0.93rem', margin: '0.5rem 0 1rem' }}>
              {activeGame.status === 'live'
                ? `You're still in this game as ${state.currentPlayer?.name}.`
                : `You're in this lobby as ${state.currentPlayer?.name}.`}
              {requestedCode && requestedCode !== activeGame.id && ` Leave it to join ${requestedCode}.`}
            </p>
            <div className="flex-column gap-1">
              <button
                className="btn btn-primary"
                onClick={() => navigate(gamePath(activeGame, state.currentPlayer))}
              >
                Rejoin Game
              </button>
              <button className="btn btn-secondary" onClick={handleLeaveActive} disabled={isLeaving}>
                {isLeaving ? 'Leaving…' : 'Leave It'}
              </button>
            </div>
          </div>
        ) : (
          <>
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
                maxLength={24}
                autoComplete="nickname"
                enterKeyHint={mode === 'join' ? 'next' : 'go'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mode === 'welcome' && playerName.trim()) void handleStartGame();
                }}
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
                  {state.isLoading ? 'Opening a case file…' : 'Start a New Game'}
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
                  onChange={(e) => setGameId(extractCode(e.target.value))}
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && gameId.length === 6 && playerName.trim()) void handleJoinGame();
                  }}
                  style={{ textTransform: 'uppercase', letterSpacing: '6px', fontSize: '1.15rem' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleJoinGame}
                  disabled={gameId.length !== 6 || !playerName.trim() || state.isLoading}
                  style={{ fontSize: '1.4rem', padding: '1.05rem' }}
                >
                  {state.isLoading ? 'Joining…' : 'Join the Party'}
                </button>
                <button className="btn btn-ghost" onClick={() => setMode('welcome')}>
                  ← Back
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Foot — clear of the floating Feedback / Install buttons */}
      <footer style={{ paddingBottom: '3.5rem' }}>
        <button
          className="btn btn-ghost"
          onClick={() => setShowBriefing(true)}
          style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}
        >
          How does it work?
        </button>
        <p style={{ fontSize: '0.8rem', margin: '0.4rem 0 0' }}>
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
          fontSize: '0.76rem',
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
          <Step number="2" text="Pull yours off without being noticed — and if you spot someone working on you, call them out to bust them." />
          <Step number="3" text={'Say "Gotcha!" out loud, then claim it in the app. Your target can accept — or dispute it to a group vote.'} />
          <Step number="4" text="First to the target score takes the game. Then everyone's missions are revealed." />
        </div>
        <div className="type" style={{ fontSize: '0.85rem', color: 'var(--paper-dim)', marginBottom: '1.25rem' }}>
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
    <p className="type" style={{ color: 'var(--paper-ink)', margin: 0, fontSize: '0.93rem', lineHeight: 1.5 }}>
      {text}
    </p>
  </div>
);

export default Home;
