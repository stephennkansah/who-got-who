import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { validateGameInput } from '../utils/validation';
import { WINNING_SCORE } from '../utils/gameSettings';
import { Game, Player } from '../types';
import AvatarPicker from './AvatarPicker';
import Modal from './common/Modal';
import { showToast } from './common/Toast';
import LoadingScreen from './common/LoadingScreen';
import BrandMark from './common/BrandMark';
import { useBackToClose } from '../hooks/useBackToClose';
import './Home.css';

const PROFILE_KEY = 'wgw-profile';
const WELCOME_SEEN_KEY = 'wgw-welcome-seen';

function welcomeSeen(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

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
  const [showBriefing, setShowBriefing] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // A game that was already open when Home appeared is offered back, never left silently.
  const gameOnArrival = useRef(state.isLoading ? null : state.currentGame?.id ?? null);

  // New players see one friendly screen explaining the game before being asked anything.
  const [screen, setScreen] = useState<'welcome' | 'setup'>(() =>
    gameOnArrival.current || welcomeSeen() ? 'setup' : 'welcome',
  );
  const [cameFromWelcome, setCameFromWelcome] = useState(false);
  const goToSetup = () => {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    } catch {
      // Private mode: they'll just see the welcome again next time.
    }
    setCameFromWelcome(true);
    setScreen('setup');
  };
  // The phone's back button on the second screen returns to the welcome.
  useBackToClose(screen === 'setup' && cameFromWelcome, () => setScreen('welcome'));
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
    return <LoadingScreen message="getting things ready…" />;
  }

  // ---------- Screen 1: what is this? ----------
  if (screen === 'welcome') {
    return (
      <div className="container home-welcome">
        <div className="home-welcome-body">
          <BrandMark size={68} className="brand-mark-centered" />
          <h1 className="home-title">Who Got Who</h1>
          <p className="home-line">
            The party game where everyone gets secret missions to pull off on each other, without getting caught.
          </p>

          {/* A made-up example (never a real mission), so it can't spoil anyone's hand. */}
          <div className="paper-card home-example">
            <div className="home-example-label">Example mission</div>
            <div className="home-example-mission">
              “Get someone to pick up something you dropped and hand it back to you.”
            </div>
            <ol className="home-example-steps">
              <li>You knock your keys off the table.</li>
              <li>A friend hands them back to you.</li>
              <li>Say <strong>“Gotcha!”</strong> That's a point to you.</li>
            </ol>
          </div>
        </div>

        <div className="home-welcome-actions">
          <p className="home-note">Free · no download or sign-up needed</p>
          <button className="btn btn-primary home-cta" onClick={goToSetup}>
            {requestedCode ? `Join Game ${requestedCode}` : "Let's Play"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Screen 2: who are you, and which game? ----------
  const invited = !!requestedCode;
  const canJoin = gameId.length === 6 && !!playerName.trim() && !state.isLoading;
  const codeInput = (
    <input
      aria-label="Game code"
      type="text"
      className="type home-code"
      placeholder="CODE"
      value={gameId}
      onChange={(e) => setGameId(extractCode(e.target.value))}
      autoCapitalize="characters"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint="go"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && canJoin) void handleJoinGame();
      }}
    />
  );

  return (
    <div className="container home-setup">
      <button
        className="link-btn home-back"
        onClick={() => (cameFromWelcome ? navigate(-1) : setScreen('welcome'))}
      >
        {cameFromWelcome ? '← Back' : "← What's this game?"}
      </button>

      <header className="home-setup-head">
        <BrandMark size={56} className="brand-mark-centered" />
        <h1 className="home-title small">Who Got Who</h1>
      </header>

      <div className="home-setup-body">
        {state.error && (
          <div role="alert" className="game-error" style={{ marginBottom: '1rem' }}>
            {state.error}
          </div>
        )}

        {showRejoin && activeGame ? (
          <div className="paper-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div className="mission-number type" style={{ marginBottom: '0.5rem' }}>
              You're already in a game
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
            <label className="home-label" htmlFor="home-name">Pick a face and your name</label>
            <div className="home-identity">
              <AvatarPicker
                selectedAvatar={selectedAvatar}
                onAvatarChange={(avatar, isPhoto) => {
                  setSelectedAvatar(avatar);
                  setAvatarType(isPhoto ? 'photo' : 'emoji');
                }}
                style={{ width: '58px', height: '58px', flexShrink: 0 }}
              />
              <input
                id="home-name"
                type="text"
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={24}
                autoComplete="nickname"
                enterKeyHint="go"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || !playerName.trim()) return;
                  if (!invited) void handleStartGame();
                  else if (canJoin) void handleJoinGame();
                }}
                style={{ textAlign: 'left', paddingLeft: '1.1rem' }}
              />
            </div>

            {invited ? (
              // Came from an invite: joining is the whole point, starting your own is the side door.
              <div className="flex-column gap-1">
                {codeInput}
                <button className="btn btn-primary home-cta" onClick={handleJoinGame} disabled={!canJoin}>
                  {state.isLoading ? 'Joining…' : 'Join the Game'}
                </button>
                <button
                  className="link-btn home-alt"
                  onClick={handleStartGame}
                  disabled={!playerName.trim() || state.isLoading}
                >
                  or start my own game instead
                </button>
              </div>
            ) : (
              <div className="flex-column gap-1">
                <button
                  className="btn btn-primary home-cta"
                  onClick={handleStartGame}
                  disabled={!playerName.trim() || state.isLoading}
                >
                  {state.isLoading ? 'Starting…' : 'Start a New Game'}
                </button>
                <div className="home-or"><span>or join a friend's game</span></div>
                <div className="home-join-row">
                  {codeInput}
                  <button className="btn btn-secondary home-join-btn" onClick={handleJoinGame} disabled={!canJoin}>
                    Join
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Foot — clear of the floating Feedback / Install buttons */}
      <footer className="home-foot">
        <button className="link-btn" onClick={() => setShowBriefing(true)}>
          How to play
        </button>
        <span aria-hidden="true"> · </span>
        <a href="/privacy.html">Privacy</a>
      </footer>

      {/* The rules, on request */}
      <Modal
        isOpen={showBriefing}
        onClose={() => setShowBriefing(false)}
        ariaLabel="How the game works"
        showClose
        maxWidth={420}
      >
        <h2 style={{ color: 'var(--paper-ink)' }}>How to Play</h2>
        <div className="flex-column" style={{ gap: '0.8rem', textAlign: 'left', marginBottom: '1.25rem' }}>
          <Step number="1" text="Everyone gets secret missions to pull off on the other players." />
          <Step number="2" text="Pull yours off without anyone noticing. If you spot someone trying one on you, call it out to bust them." />
          <Step number="3" text={'Done one? Say "Gotcha!" out loud, then claim it in the app. Your target can accept, or dispute it to a group vote.'} />
          <Step number="4" text={`First to ${WINNING_SCORE} points wins. Then everyone's missions are revealed.`} />
        </div>
        <div className="type" style={{ fontSize: '0.85rem', color: 'var(--paper-dim)', marginBottom: '1.25rem' }}>
          Best at house parties, dinners, pre-drinks &amp; game nights.
        </div>
        <button className="btn btn-primary" onClick={() => setShowBriefing(false)}>
          Got It
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
