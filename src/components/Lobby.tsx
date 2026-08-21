import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player } from '../types';
import NotificationPrompt from './NotificationPrompt';
import ShareButton from './ShareButton';
import PlayerAvatar from './PlayerAvatar';
import QRCodeJoin from './QRCodeJoin';
import { ConfirmationModal } from './common/ConfirmationModal';

const RULES_SEEN_KEY = 'wgw-rules-seen';

interface RuleCardProps {
  icon: string;
  title: string;
  tone: 'danger' | 'info' | 'warning' | 'success';
  children: React.ReactNode;
}

const toneStyles: Record<RuleCardProps['tone'], { bg: string; border: string; ink: string }> = {
  danger: { bg: 'var(--danger-soft)', border: 'var(--danger)', ink: 'var(--danger-ink)' },
  info: { bg: 'var(--info-soft)', border: 'var(--secondary)', ink: 'var(--info-ink)' },
  warning: { bg: 'var(--warning-soft)', border: 'var(--warning)', ink: 'var(--warning-ink)' },
  success: { bg: 'var(--success-soft)', border: 'var(--success)', ink: 'var(--success-ink)' },
};

const RuleCard: React.FC<RuleCardProps> = ({ icon, title, tone, children }) => {
  const t = toneStyles[tone];
  return (
    <div style={{
      padding: '1rem 1.1rem',
      background: t.bg,
      borderRadius: 'var(--radius-md)',
      borderLeft: `5px solid ${t.border}`,
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: t.ink, marginBottom: '0.4rem' }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: '0.9rem', color: t.ink, lineHeight: 1.55 }}>
        {children}
      </div>
    </div>
  );
};

const ExampleBox: React.FC<{ title: string; hint: string }> = ({ title, hint }) => (
  <div style={{
    background: 'rgba(255,255,255,0.5)',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    marginBottom: '8px',
  }}>
    <strong>{title}</strong>
    <div style={{ fontStyle: 'italic', fontSize: '0.85em', marginTop: '2px' }}>{hint}</div>
  </div>
);

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, startGame, leaveGame } = useGame();
  const [showRules, setShowRules] = useState(
    () => localStorage.getItem(RULES_SEEN_KEY) !== 'true',
  );
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const isHost = currentPlayer?.isHost || false;
  const players = currentGame?.players || [];
  const playerCount = players.length;
  const canStart = playerCount >= 2;
  const isHoliday = currentGame?.gameType === 'holiday-challenge';
  const hostName = players.find((p) => p.isHost)?.name || 'the host';

  useEffect(() => {
    if (!gameId) navigate('/');
  }, [gameId, navigate]);

  useEffect(() => {
    if (currentGame?.status === 'live') {
      navigate(`/game/${gameId}`);
    }
  }, [currentGame?.status, gameId, navigate]);

  const handleStartGame = async () => {
    if (!isHost || !canStart || isStarting) return;
    setIsStarting(true);
    try {
      await startGame();
    } catch {
      // Errors surface via the global toast bridge.
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveGame = async () => {
    setConfirmLeave(false);
    try {
      await leaveGame();
    } catch {
      // Leaving is best-effort; still return home.
    }
    navigate('/');
  };

  const dismissRules = () => {
    localStorage.setItem(RULES_SEEN_KEY, 'true');
    setShowRules(false);
  };

  if (!currentGame || !currentPlayer) {
    return (
      <div className="container flex-center">
        <div className="card text-center" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }} aria-hidden="true">⏳</div>
          <h2>Connecting…</h2>
          <p style={{ marginBottom: '1.5rem' }}>Finding your game.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ---------- Rules interstitial (first visit only) ----------
  if (showRules) {
    return (
      <div className="container">
        <header style={{ textAlign: 'center', margin: '0.5rem 0 1.25rem' }}>
          <h1 style={{ fontSize: '1.9rem', marginBottom: '0.2rem' }}>
            {isHoliday ? 'You Got Who?' : 'Who Got Who'}
          </h1>
          <div className="app-subtitle">
            How to play · {playerCount} player{playerCount !== 1 ? 's' : ''} waiting
          </div>
        </header>

        <div className="card">
          {isHoliday ? (
            <div className="flex-column gap-2">
              <RuleCard icon="🏖️" title="Everyone gets the same 10 challenges" tone="danger">
                Unlike classic Who Got Who, <strong>everyone sees the same challenges</strong>.
                Race to complete them first!
              </RuleCard>

              <RuleCard icon="🏆" title="Scoring" tone="info">
                🥇 <strong>First to finish a challenge:</strong> 3 gold points<br />
                🥈 <strong>Next 2 players:</strong> 1 silver point each<br />
                🎯 <strong>First to {currentGame.settings?.holidayChallengeWinCondition || 18} points wins!</strong><br />
                📸 Some challenges need photo proof<br />
                <em>The target scales with group size — more players, lower target.</em>
              </RuleCard>

              <RuleCard icon="👥" title="Social holiday challenges" tone="warning">
                Chat to other holiday-goers, snap photos, make friends. Perfect for vacation socialising.
              </RuleCard>

              <RuleCard icon="💡" title="Example challenges" tone="warning">
                <ExampleBox title="“Get someone to take a group photo of your team” 📸" hint="Requires photo proof" />
                <ExampleBox title="“Borrow sunscreen from another group”" hint="A simple social mission" />
                <ExampleBox title="“Make a new friend and learn their name”" hint="Holiday networking!" />
              </RuleCard>
            </div>
          ) : (
            <div className="flex-column gap-2">
              <RuleCard icon="🕵️" title="Stay stealthy" tone="danger">
                Complete tasks <strong>without getting caught</strong>. If someone spots you
                attempting a task, it's an automatic fail!
              </RuleCard>

              <RuleCard icon="🎯" title="Complete tasks &amp; score" tone="info">
                ✅ Mark a task <strong>Got it</strong> when you pull it off<br />
                ❌ Mark it <strong>Caught</strong> if you get busted<br />
                🏆 <strong>First to {currentGame.settings?.targetScore || 4} points wins!</strong><br />
                ⭐ <strong>+0.5 bonus</strong> for targeting someone new
              </RuleCard>

              <RuleCard icon="📢" title={'Say "Gotcha!"'} tone="warning">
                When you pull off a task, say <strong>"Gotcha [name]!"</strong> out loud, then
                claim it in the app. Your target can accept — or dispute it and put it to a group vote.
              </RuleCard>

              <RuleCard icon="🔄" title={`Task swaps (${currentGame.settings?.swapsAllowed ?? 2} per player)`} tone="success">
                Don't like a task? <strong>Swap</strong> it for a random new one. Use them wisely!
              </RuleCard>

              <RuleCard icon="📊" title="The game scales with players" tone="success">
                {playerCount >= 7 ? (
                  <>🎯 <strong>Big group:</strong> {playerCount} players get <strong>8 tasks</strong> each and play to <strong>5 points</strong>.</>
                ) : (
                  <>🎯 <strong>Small group:</strong> everyone gets <strong>7 tasks</strong> and plays to <strong>4 points</strong>.</>
                )}
              </RuleCard>

              <RuleCard icon="💡" title="Example tasks" tone="warning">
                <ExampleBox title="“Get a player to correct a movie quote”" hint="Say: “Peter, I am your father” → wait for the correction" />
                <ExampleBox title="“Get someone to take a group selfie”" hint="Suggest a photo without being obvious" />
                <ExampleBox title="“Get someone to scratch your back for 10 secs”" hint="Ask casually — “my back is killing me…”" />
              </RuleCard>
            </div>
          )}
        </div>

        <NotificationPrompt />

        <button
          className="btn btn-primary"
          onClick={dismissRules}
          style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}
        >
          ✓ Got it — to the lobby
        </button>
        <p className="app-subtitle" style={{ marginTop: '0.6rem' }}>
          You can reopen the rules from the lobby anytime.
        </p>
      </div>
    );
  }

  // ---------- Lobby ----------
  return (
    <div className="container">
      <header style={{ textAlign: 'center', margin: '0.5rem 0 1.25rem' }}>
        <h1 style={{ fontSize: '1.9rem', marginBottom: '0.2rem' }}>
          {isHoliday ? 'You Got Who?' : 'Who Got Who'}
        </h1>
        <div className="app-subtitle">
          Lobby · {playerCount} player{playerCount !== 1 ? 's' : ''} ·{' '}
          <button
            onClick={() => setShowRules(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.9)',
              textDecoration: 'underline',
              fontWeight: 700,
              fontSize: 'inherit',
              padding: 0,
            }}
          >
            📖 Rules
          </button>
        </div>
      </header>

      {/* Invite */}
      <div className="card" style={{ background: 'var(--info-soft)', border: '1px solid var(--info-border)', padding: '1.1rem 1.25rem' }}>
        <div className="flex-between gap-2" style={{ flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--info-ink)', fontVariantNumeric: 'tabular-nums' }}>
              {currentGame.id}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--info-ink)', opacity: 0.8 }}>
              Game code
            </div>
          </div>
          <div className="flex gap-1" style={{ flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <ShareButton gameId={currentGame.id} gameType={currentGame.gameType} size="small" />
            <QRCodeJoin gameId={currentGame.id} gameType={currentGame.gameType} />
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="card">
        <h3 style={{ textAlign: 'center', margin: '0 0 1rem' }}>
          👥 Players ({playerCount})
        </h3>
        <div className="flex-column gap-1">
          {players.map((player: Player) => {
            const isYou = player.id === currentPlayer.id;
            return (
              <div
                key={player.id}
                className="flex-between"
                style={{
                  padding: '0.7rem 0.85rem',
                  background: isYou ? 'var(--me-bg)' : 'rgba(241, 237, 224, 0.04)',
                  borderRadius: 'var(--radius-sm)',
                  border: isYou ? '1.5px solid var(--me-border)' : '1.5px solid transparent',
                }}
              >
                <div className="flex gap-1" style={{ alignItems: 'center' }}>
                  <PlayerAvatar player={player} size="medium" />
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {player.name} {isYou && <span style={{ color: 'var(--amber)' }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {player.isHost ? 'Host — starts the game' : 'Ready to play'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start / waiting */}
      <div className="card">
        {isHost ? (
          canStart ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '0.75rem' }}>
                👑 Everyone's in? Unseal the missions.
              </p>
              <button
                className="btn btn-success"
                onClick={handleStartGame}
                disabled={isStarting}
                style={{ fontSize: '1.1rem' }}
              >
                {isStarting ? '⏳ Starting…' : '🚀 Start Game'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }} aria-hidden="true">👋</div>
              <p style={{ color: 'var(--amber)', fontWeight: 700, marginBottom: '0.25rem' }}>
                You need at least 2 players to start
              </p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Share the code or QR above and the game can begin.
              </p>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }} aria-hidden="true">⏳</div>
            <p style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '0.25rem' }}>
              Waiting for {hostName} to start
            </p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              Your missions decrypt the moment the game begins.
            </p>
          </div>
        )}
      </div>

      {/* Sealed dossier teaser */}
      <div className="paper-card" style={{ textAlign: 'center', padding: '1.25rem', marginBottom: '0.9rem' }}>
        <div className="type" style={{
          fontSize: '0.68rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--paper-dim)',
          marginBottom: '0.75rem',
        }}>
          Your dossier · sealed until start
        </div>
        <div className="flex-column gap-1" style={{ alignItems: 'center', marginBottom: '0.75rem' }} aria-hidden="true">
          <span className="redacted" style={{ width: '82%', height: '0.95rem' }}>&nbsp;</span>
          <span className="redacted" style={{ width: '64%', height: '0.95rem' }}>&nbsp;</span>
          <span className="redacted" style={{ width: '74%', height: '0.95rem' }}>&nbsp;</span>
        </div>
        <p className="type" style={{ fontSize: '0.82rem', margin: 0, color: 'var(--paper-dim)' }}>
          {isHoliday
            ? 'everyone races the same 10 challenges once the game starts.'
            : `${playerCount >= 7 ? 8 : 7} missions decrypt when the host starts. tell no one.`}
        </p>
      </div>

      <NotificationPrompt />

      <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
        <button className="btn btn-ghost btn-small" onClick={() => setConfirmLeave(true)}>
          🚪 Leave game
        </button>
      </div>

      <ConfirmationModal
        isOpen={confirmLeave}
        title="🚪 Leave game?"
        message={'You\'ll return to the home screen.\nEveryone else stays in the lobby.'}
        confirmLabel="Leave"
        isDangerous
        onConfirm={handleLeaveGame}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
}
