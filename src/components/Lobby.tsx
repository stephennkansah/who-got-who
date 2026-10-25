import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player } from '../types';
import NotificationPrompt from './NotificationPrompt';
import ShareButton from './ShareButton';
import PlayerAvatar from './PlayerAvatar';
import QRCodeJoin from './QRCodeJoin';
import { ConfirmationModal } from './common/ConfirmationModal';
import { showToast } from './common/Toast';

const RULES_SEEN_KEY = 'wgw-rules-seen';

interface RuleCardProps {
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

const RuleCard: React.FC<RuleCardProps> = ({ title, tone, children }) => {
  const t = toneStyles[tone];
  return (
    <div style={{
      padding: '1rem 1.1rem',
      background: t.bg,
      borderRadius: 'var(--radius-md)',
      borderLeft: `5px solid ${t.border}`,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        letterSpacing: '0.07em',
        color: t.ink,
        marginBottom: '0.4rem',
      }}>
        {title}
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
  const challengeCount = currentGame?.settings?.holidayChallengeCount ?? 10;
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

  const copyCode = async () => {
    if (!currentGame) return;
    try {
      await navigator.clipboard.writeText(currentGame.id);
    } catch {
      const area = document.createElement('textarea');
      area.value = currentGame.id;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    showToast('Code copied — send it to your crew', 'success');
  };

  if (!currentGame || !currentPlayer) {
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
          <p className="type" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>finding your game…</p>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            Back to home
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
              <RuleCard title={`Everyone gets the same ${challengeCount} challenges`} tone="danger">
                Unlike classic Who Got Who, <strong>everyone sees the same challenges</strong>.
                Race to complete them first!
              </RuleCard>

              <RuleCard title="Scoring" tone="info">
                <strong>First to finish a challenge:</strong> 3 gold points<br />
                <strong>Next 2 players:</strong> 1 silver point each<br />
                <strong>First to {currentGame.settings?.holidayChallengeWinCondition || 18} points wins.</strong><br />
                Some challenges need photo proof.<br />
                <em>Bigger groups get more challenges and a lower target.</em>
              </RuleCard>

              <RuleCard title="Social holiday challenges" tone="warning">
                Chat to other holiday-goers, snap photos, make friends. Perfect for vacation socialising.
              </RuleCard>

              <RuleCard title="Example challenges" tone="warning">
                <ExampleBox title="“Get someone to take a group photo of your team”" hint="Requires photo proof" />
                <ExampleBox title="“Borrow sunscreen from another group”" hint="A simple social mission" />
                <ExampleBox title="“Make a new friend and learn their name”" hint="Holiday networking!" />
              </RuleCard>
            </div>
          ) : (
            <div className="flex-column gap-2">
              <RuleCard title="Stay stealthy" tone="danger">
                Complete tasks <strong>without getting caught</strong>. If someone spots you
                attempting a task, it's an automatic fail!
              </RuleCard>

              <RuleCard title="Complete tasks &amp; score" tone="info">
                Mark a task <strong>Got it</strong> when you pull it off.<br />
                Mark it <strong>Caught</strong> if you get busted.<br />
                <strong>First to {currentGame.settings?.targetScore || 4} points wins</strong> —
                with a <strong>+0.5 bonus</strong> for targeting someone new.
              </RuleCard>

              <RuleCard title={'Say "Gotcha!"'} tone="warning">
                When you pull off a task, say <strong>"Gotcha [name]!"</strong> out loud, then
                claim it in the app. Your target can accept — or dispute it and put it to a group vote.
              </RuleCard>

              <RuleCard title={`Task swaps — ${currentGame.settings?.swapsAllowed ?? 2} per player`} tone="success">
                Don't like a task? <strong>Swap</strong> it for a random new one. Use them wisely!
              </RuleCard>

              <RuleCard title="The game scales with players" tone="success">
                {playerCount >= 7 ? (
                  <><strong>Big group:</strong> {playerCount} players get <strong>8 tasks</strong> each and play to <strong>5 points</strong>.</>
                ) : (
                  <><strong>Small group:</strong> everyone gets <strong>7 tasks</strong> and plays to <strong>4 points</strong>.</>
                )}
              </RuleCard>

              <RuleCard title="Example tasks" tone="warning">
                <ExampleBox title="“Get a player to correct you when you misquote a movie”" hint="Say: “Peter, I am your father” → wait for the correction" />
                <ExampleBox title="“Get a player to take a group selfie”" hint="Suggest a photo without being obvious" />
                <ExampleBox title="“Get a player to scratch your back for 10 seconds”" hint="Ask casually — “my back is killing me…”" />
              </RuleCard>
            </div>
          )}
        </div>

        <NotificationPrompt />

        <button
          className="btn btn-primary"
          onClick={dismissRules}
          style={{ marginTop: '0.5rem' }}
        >
          Got It — to the Lobby
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
      {/* Masthead: the code IS the hero */}
      <header style={{ textAlign: 'center', margin: '0.5rem 0 1.25rem' }}>
        <div className="overline" style={{ marginBottom: '0.6rem' }}>
          {isHoliday ? 'You Got Who? · Operation' : 'Who Got Who · Operation'}
        </div>
        <button
          onClick={copyCode}
          aria-label={`Game code ${currentGame.id} — tap to copy`}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', padding: 0 }}
        >
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3.4rem, 18vw, 4.8rem)',
            letterSpacing: '0.16em',
            lineHeight: 1,
            textIndent: '0.16em',
          }}>
            {currentGame.id}
          </div>
          <div className="app-subtitle" style={{ marginTop: '0.3rem' }}>
            tap code to copy · {playerCount} agent{playerCount !== 1 ? 's' : ''} in
          </div>
        </button>
        <div className="flex gap-1" style={{ justifyContent: 'center', marginTop: '0.9rem' }}>
          <ShareButton gameId={currentGame.id} gameType={currentGame.gameType} size="small" />
          <QRCodeJoin gameId={currentGame.id} gameType={currentGame.gameType} />
        </div>
      </header>

      {/* Players */}
      <div className="card">
        <div className="overline" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          The roster
        </div>
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
                Everyone's in? Unseal the missions.
              </p>
              <button
                className="btn btn-success"
                onClick={handleStartGame}
                disabled={isStarting}
                style={{ fontSize: '1.35rem' }}
              >
                {isStarting ? 'Starting…' : 'Start the Game'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--amber)', fontWeight: 700, marginBottom: '0.25rem' }}>
                You need at least 2 agents to start
              </p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Share the code or QR above and the game can begin.
              </p>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center' }}>
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
            ? `everyone races the same ${challengeCount} challenges once the game starts.`
            : `${playerCount >= 7 ? 8 : 7} missions decrypt when the host starts. tell no one.`}
        </p>
      </div>

      <NotificationPrompt />

      <div className="flex gap-2" style={{ justifyContent: 'center', marginTop: '0.75rem' }}>
        <button className="btn btn-ghost btn-small" onClick={() => setShowRules(true)}>
          Rules
        </button>
        <button className="btn btn-ghost btn-small" onClick={() => setConfirmLeave(true)}>
          Leave game
        </button>
      </div>

      <ConfirmationModal
        isOpen={confirmLeave}
        title="Leave the game?"
        message={'You\'ll return to the home screen.\nEveryone else stays in the lobby.'}
        confirmLabel="Leave"
        isDangerous
        onConfirm={handleLeaveGame}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
}
