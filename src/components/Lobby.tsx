import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player } from '../types';
import NotificationPrompt from './NotificationPrompt';
import ShareButton from './ShareButton';
import PlayerAvatar from './PlayerAvatar';
import QRCodeJoin from './QRCodeJoin';
import { ConfirmationModal } from './common/ConfirmationModal';
import Modal from './common/Modal';
import LoadingScreen from './common/LoadingScreen';
import { showToast } from './common/Toast';
import { getAllPackOptions } from '../data/packCatalog';

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
  const { state, startGame, leaveGame, kickPlayer, updatePlayerName, setBriefingMinutes } = useGame();
  const [showRules, setShowRules] = useState(
    () => localStorage.getItem(RULES_SEEN_KEY) !== 'true',
  );
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [kickTarget, setKickTarget] = useState<Player | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const isHost = currentPlayer?.isHost || false;
  const players = currentGame?.players || [];
  const playerCount = players.length;
  const canStart = playerCount >= 2;
  const isHoliday = currentGame?.gameType === 'holiday-challenge';
  const hostName = players.find((p) => p.isHost)?.name || 'the host';
  const packName = getAllPackOptions().find((pack) => pack.id === currentGame?.settings?.selectedPack)?.name;
  const briefingMinutes = currentGame?.settings?.briefingMinutes ?? 0;
  const briefingLabel = briefingMinutes === 0
    ? `${isHoliday ? 'Challenges' : 'Gotchas'} open the moment the game starts.`
    : `Missions arrive at the start — ${isHoliday ? 'challenges' : 'gotchas'} open ${briefingMinutes} minutes later, once everyone's settled in.`;

  const chooseBriefing = async (minutes: number) => {
    if (minutes === briefingMinutes) return;
    try {
      await setBriefingMinutes(minutes);
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  useEffect(() => {
    if (!gameId || (!currentGame && !state.isLoading)) navigate('/', { replace: true });
  }, [gameId, currentGame, state.isLoading, navigate]);

  useEffect(() => {
    if (currentGame?.status === 'live') {
      navigate(`/game/${currentGame.id}`, { replace: true });
    }
  }, [currentGame?.status, currentGame?.id, navigate]);

  const handleKick = async () => {
    const player = kickTarget;
    setKickTarget(null);
    if (!player) return;
    try {
      await kickPlayer(player.id);
      showToast(`${player.name} was removed`, 'info');
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  const handleRename = async () => {
    const name = editingName?.trim();
    if (!name || name === currentPlayer?.name) {
      setEditingName(null);
      return;
    }
    try {
      await updatePlayerName(name);
      setEditingName(null);
      try {
        const saved = JSON.parse(localStorage.getItem('wgw-profile') || '{}');
        localStorage.setItem('wgw-profile', JSON.stringify({ ...saved, name }));
      } catch {
        // Remembering the name is a convenience only.
      }
    } catch {
      // Errors (e.g. name taken) surface via the global toast bridge.
    }
  };

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
    navigate('/', { replace: true });
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
    return <LoadingScreen message="finding your game…" showBack />;
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
              <RuleCard title="1 · Same 10 challenges for everyone" tone="danger">
                No secrets this time — <strong>race the others</strong> to complete social
                challenges: chat to holiday-goers, snap photos, make friends.
              </RuleCard>

              <RuleCard title="2 · Gold for first, silver for speed" tone="info">
                <strong>First to finish a challenge:</strong> 3 gold points.{' '}
                <strong>Next 2 players:</strong> 1 silver point each.
                Some challenges need photo proof — everyone sees it in the trip album.
              </RuleCard>

              <RuleCard title={`3 · First to ${currentGame.settings?.holidayChallengeWinCondition || 18} points wins`} tone="success">
                The target scales with group size — more players, lower target.
              </RuleCard>

              <RuleCard title="Example challenges" tone="warning">
                <ExampleBox title="“Get someone to take a group photo of your team”" hint="Requires photo proof" />
                <ExampleBox title="“Borrow sunscreen from another group”" hint="A simple social mission" />
                <ExampleBox title="“Make a new friend and learn their name”" hint="Holiday networking!" />
              </RuleCard>
            </div>
          ) : (
            <div className="flex-column gap-2">
              <RuleCard title="1 · Pull it off quietly" tone="danger">
                You get <strong>{playerCount >= 7 ? 8 : 7} secret missions</strong>
                {briefingMinutes > 0 && <> and {briefingMinutes} minutes to settle in before gotchas open</>}.
                Complete them on other players <strong>without getting caught</strong> — if someone spots you
                trying, it's busted. Hate one? <strong>Swap</strong> it ({currentGame.settings?.swapsAllowed ?? 2} per game).
                The host can pause the game for breaks.
              </RuleCard>

              <RuleCard title={'2 · Say "Gotcha!" — then claim it'} tone="warning">
                Say <strong>"Gotcha [name]!"</strong> out loud, tap the mission and pick who you got.
                They can accept — or dispute it and put it to a group vote.
              </RuleCard>

              <RuleCard title={`3 · First to ${playerCount >= 7 ? 5 : 4} points wins`} tone="info">
                <strong>1 point</strong> per gotcha, <strong>+0.5</strong> the first time you get
                each player. When it's over, everyone's missions are revealed.
              </RuleCard>

              <RuleCard title="Example tasks" tone="warning">
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
        <div className="pack-line">
          <span>Pack: <strong>{packName || 'not chosen yet'}</strong></span>
          {isHost && (
            <button className="link-btn" onClick={() => navigate(`/select-pack/${currentGame.id}`)}>
              Change
            </button>
          )}
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
                <div className="flex gap-1" style={{ alignItems: 'center', minWidth: 0 }}>
                  <PlayerAvatar player={player} size="medium" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name} {isYou && <span style={{ color: 'var(--amber)' }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {player.isHost ? 'Host — starts the game' : 'Ready to play'}
                    </div>
                  </div>
                </div>
                {isYou ? (
                  <button className="link-btn" onClick={() => setEditingName(player.name)}>
                    Edit
                  </button>
                ) : isHost ? (
                  <button
                    className="link-btn danger"
                    onClick={() => setKickTarget(player)}
                    aria-label={`Remove ${player.name}`}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start / waiting */}
      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <div className="overline" style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
            Settling-in time
          </div>
          {isHost && (
            <div className="segmented" role="radiogroup" aria-label="Settling-in time before gotchas open">
              {[0, 5, 10, 15, 30].map((minutes) => (
                <button
                  key={minutes}
                  role="radio"
                  aria-checked={briefingMinutes === minutes}
                  className={briefingMinutes === minutes ? 'is-selected' : ''}
                  onClick={() => chooseBriefing(minutes)}
                  disabled={state.isLoading}
                >
                  {minutes === 0 ? 'None' : `${minutes} min`}
                </button>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.82rem', textAlign: 'center', margin: isHost ? '0.5rem 0 0' : 0 }}>
            {briefingLabel}
          </p>
        </div>

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
            ? 'everyone races the same 10 challenges once the game starts.'
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

      <ConfirmationModal
        isOpen={!!kickTarget}
        title={`Remove ${kickTarget?.name ?? 'player'}?`}
        message="They'll drop out of this lobby. They can rejoin with the code if you change your mind."
        confirmLabel="Remove"
        isDangerous
        onConfirm={handleKick}
        onCancel={() => setKickTarget(null)}
      />

      <Modal
        isOpen={editingName !== null}
        onClose={() => setEditingName(null)}
        labelledBy="rename-title"
        showClose
      >
        <h3 id="rename-title" style={{ fontSize: '1.3rem' }}>Your agent name</h3>
        <input
          type="text"
          aria-label="New name"
          value={editingName ?? ''}
          maxLength={24}
          autoFocus
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleRename();
          }}
          style={{ marginBottom: '1rem' }}
        />
        <button className="btn btn-primary" onClick={handleRename} disabled={!editingName?.trim()}>
          Save
        </button>
      </Modal>
    </div>
  );
}
