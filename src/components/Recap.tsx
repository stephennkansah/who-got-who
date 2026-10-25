import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player, AwardType, TaskInstance } from '../types';
import ResultsShare from './ResultsShare';
import PlayerAvatar from './PlayerAvatar';
import LoadingScreen from './common/LoadingScreen';
import BrandMark from './common/BrandMark';
import PhotoAlbum from './PhotoAlbum';

const CONFETTI_COLORS = ['#e5484d', '#e8b554', '#3f9b5b', '#efe5c6', '#d13c41', '#c9ac68'];

/** One-shot celebratory confetti (CSS-driven, honors prefers-reduced-motion). */
const ConfettiBurst: React.FC = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 53) % 120) / 100,
        duration: 2.6 + ((i * 29) % 140) / 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 8 + ((i * 13) % 8),
      })),
    [],
  );

  return (
    <div aria-hidden="true" className="no-rise">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${piece.left}vw`,
            width: piece.size,
            height: piece.size * 1.4,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

/** Counts up to the final score once on mount. */
const CountUpScore: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? value : 0,
  );

  useEffect(() => {
    if (display === value) return undefined;
    const steps = 24;
    const stepTime = 900 / steps;
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      const next = Math.round((value * step) / steps * 10) / 10;
      setDisplay(step >= steps ? value : next);
      if (step >= steps) window.clearInterval(interval);
    }, stepTime);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{display}</span>;
};

const AWARDS: Record<AwardType, { name: string; description: string }> = {
  sneakiest: { name: 'Sneakiest', description: 'Most successful Gotchas' },
  social: { name: 'Social Butterfly', description: 'Got the most different people' },
  detective: { name: 'Detective', description: 'Caught the most people in the act' },
  untouchable: { name: 'Untouchable', description: 'Scored without ever getting caught' },
  jester: { name: 'Court Jester', description: 'Most failed attempts' },
};

/** Every mission a player held, and what became of it. */
const RevealDossier: React.FC<{
  player: Player;
  isYou: boolean;
  nameOf: (id?: string) => string;
  defaultOpen: boolean;
}> = ({ player, isYou, nameOf, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  const done = player.tasks.filter((task) => task.status === 'completed').length;

  const outcome = (task: TaskInstance) => {
    switch (task.status) {
      case 'completed': return { cls: 'completed', label: <>Got <strong>{nameOf(task.targetId)}</strong></> };
      case 'failed': return { cls: 'failed', label: <>Busted by <strong>{nameOf(task.targetId)}</strong></> };
      case 'disputed': return { cls: 'disputed', label: <>Claim on {nameOf(task.targetId)} still open</> };
      default: return { cls: 'pending', label: <>Never pulled off</> };
    }
  };

  return (
    <div className="reveal-dossier">
      <button className="reveal-head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <PlayerAvatar player={player} size="small" showBorder={false} />
        <span className="reveal-name">
          {player.name}{isYou && ' (You)'}
        </span>
        <span className="reveal-count">{done}/{player.tasks.length} pulled off</span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <ul className="reveal-list">
          {player.tasks.map((task) => {
            const result = outcome(task);
            return (
              <li key={task.id} className={`reveal-item ${result.cls}`}>
                <div className="reveal-text">{task.text}</div>
                <div className="reveal-outcome">{result.label}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default function Recap() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, rematch, leaveGame } = useGame();
  const [showTimeline, setShowTimeline] = useState(false);

  const currentGame = state.currentGame;
  const currentPlayer = state.currentPlayer;
  const isHoliday = currentGame?.gameType === 'holiday-challenge';

  // Freeze the duration so it doesn't tick upward while people read
  const durationMinutes = useMemo(() => {
    if (!currentGame) return 0;
    const start = new Date(currentGame.startedAt || currentGame.createdAt).getTime();
    const end = currentGame.endedAt ? new Date(currentGame.endedAt).getTime() : Date.now();
    return Math.max(1, Math.round((end - start) / 60000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.id, currentGame?.endedAt]);

  useEffect(() => {
    if (!gameId || (!currentGame && !state.isLoading)) {
      navigate('/', { replace: true });
    }
  }, [gameId, currentGame, state.isLoading, navigate]);

  // After a rematch opens, follow everyone into the fresh lobby
  useEffect(() => {
    if (currentGame && currentGame.status === 'draft') {
      const packSelected = currentGame.settings?.selectedPack;
      navigate(
        packSelected || !currentPlayer?.isHost ? `/lobby/${currentGame.id}` : `/select-pack/${currentGame.id}`,
        { replace: true },
      );
    }
  }, [currentGame, currentPlayer, navigate]);

  const scoreOf = (player: Player) =>
    isHoliday ? (player.challengeScore || 0) : player.score;

  const finalRankings = useMemo(() => {
    if (!currentGame) return [] as Player[];
    return [...currentGame.players].sort((a, b) => {
      const diff = scoreOf(b) - scoreOf(a);
      if (diff !== 0) return diff;
      // Tiebreaker: fewer failed attempts
      return (a.stats?.failed || 0) - (b.stats?.failed || 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame, isHoliday]);

  const winner = finalRankings[0] || null;
  const isWinner = !!winner && winner.id === currentPlayer?.id;
  const nameOf = (id?: string) => currentGame?.players.find((p) => p.id === id)?.name || 'a former player';

  const awardsByPlayer = useMemo(() => {
    const result = new Map<string, AwardType[]>();
    if (!currentGame || isHoliday) return result;
    const all = currentGame.players;
    const catches = (player: Player) =>
      all.flatMap((other) => other.tasks).filter((task) => task.status === 'failed' && task.targetId === player.id).length;
    const max = (value: (player: Player) => number) => Math.max(...all.map(value));
    const maxGotchas = max((p) => p.stats?.gothcas || 0);
    const maxTargets = max((p) => p.stats?.uniqueTargets?.length || 0);
    const maxCatches = max(catches);
    const maxFailed = max((p) => p.stats?.failed || 0);

    for (const player of all) {
      const awards: AwardType[] = [];
      const gotchas = player.stats?.gothcas || 0;
      const failed = player.stats?.failed || 0;
      if (gotchas > 0 && gotchas === maxGotchas) awards.push('sneakiest');
      if (maxCatches > 0 && catches(player) === maxCatches) awards.push('detective');
      if (maxTargets > 1 && (player.stats?.uniqueTargets?.length || 0) === maxTargets) awards.push('social');
      if (all.length > 2 && gotchas > 0 && failed === 0) awards.push('untouchable');
      if (maxFailed > 2 && failed === maxFailed) awards.push('jester');
      result.set(player.id, awards.slice(0, 2));
    }
    return result;
  }, [currentGame, isHoliday]);

  const handleRematch = async () => {
    try {
      await rematch();
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  const handleHome = async () => {
    try {
      await leaveGame();
    } catch {
      // Best-effort; still go home.
    }
    navigate('/', { replace: true });
  };

  if (!currentGame) {
    return <LoadingScreen message="loading the debrief…" showBack />;
  }

  const totalGotchas = isHoliday
    ? (currentGame.challengeCompletions?.length || 0)
    : currentGame.players.reduce((sum, p) => sum + (p.stats?.gothcas || 0), 0);
  const photos = (currentGame.challengeCompletions || []).filter((completion) => completion.proofUrl);

  return (
    <div className="container">
      {isWinner && <ConfettiBurst />}

      {/* Debrief banner */}
      <div className="paper-card text-center" style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '1.75rem 1.25rem 1.5rem',
        marginBottom: '0.9rem',
      }}>
        <BrandMark size={64} alt="Who Got Who" className="brand-mark-centered" />
        <div className="type" style={{
          fontSize: '0.76rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--paper-dim)',
          marginBottom: '0.6rem',
        }}>
          Final debrief · case closed
        </div>
        <h1 style={{
          fontSize: '2.6rem',
          margin: '0 0 0.75rem',
          color: 'var(--paper-ink)',
        }}>
          {isWinner ? 'You Won' : 'Game Over'}
        </h1>
        {winner && (
          <>
            <div className="flex-center gap-1" style={{ marginBottom: '0.6rem' }}>
              <PlayerAvatar player={winner} size="large" />
            </div>
            <div className="stamp success big" style={{ marginBottom: '0.6rem' }}>
              {isWinner ? 'Top Agent' : `${winner.name} wins`}
            </div>
            <p className="type" style={{ fontSize: '1rem', margin: 0, color: 'var(--paper-ink)' }}>
              <CountUpScore value={scoreOf(winner)} /> points
            </p>
          </>
        )}
      </div>

      {/* Final Rankings */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Final standings</h3>
        </div>

        <div className="flex-column gap-1">
          {finalRankings.map((player: Player, index: number) => {
            const isYou = player.id === currentPlayer?.id;
            const awards = awardsByPlayer.get(player.id) || [];
            return (
              <div key={player.id} className="flex-between" style={{
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: isYou ? 'var(--me-bg)' : 'rgba(241, 237, 224, 0.04)',
                border: isYou ? '1.5px solid var(--me-border)' : '1.5px solid transparent',
                gap: '0.6rem',
              }}>
                <div className="flex gap-1" style={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: index < 3 ? '1.5rem' : '1rem', fontWeight: 700, minWidth: '30px', textAlign: 'center', color: 'var(--text-muted)' }} aria-hidden="true">
                    {`${index + 1}.`}
                  </span>
                  <PlayerAvatar player={player} size="medium" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name} {isYou && <span style={{ color: 'var(--amber)' }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {isHoliday
                        ? `${player.challengeCompletions?.length || 0} challenges`
                        : `${player.stats?.gothcas || 0} gotcha${(player.stats?.gothcas || 0) === 1 ? '' : 's'}`}
                    </div>
                    {awards.length > 0 && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {awards.map((awardType) => (
                          <span key={awardType} className="award-chip" title={AWARDS[awardType].description}>
                            {AWARDS[awardType].name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  color: 'var(--amber)',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {scoreOf(player)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What's next — the rematch is the main event */}
      <div className="card">
        <div className="flex-column gap-1">
          <button
            className="btn btn-primary"
            onClick={handleRematch}
            disabled={state.isLoading}
          >
            {state.isLoading
              ? 'Opening the lobby…'
              : currentGame.rematchGameId ? 'Join the Rematch' : 'Play Again'}
          </button>
          <p className="text-small" style={{ textAlign: 'center', margin: '-0.15rem 0 0.35rem' }}>
            {currentGame.rematchGameId
              ? 'A new lobby is open for this crew — tap to jump in.'
              : 'Opens a new lobby — everyone here gets a one-tap invite.'}
          </p>

          <ResultsShare game={currentGame} style={{ width: '100%' }} />

          <button className="btn btn-ghost" onClick={handleHome}>
            Back to home
          </button>
        </div>
      </div>

      {/* The Reveal: everyone's dossier, declassified */}
      {!isHoliday && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>The Reveal</h3>
            <p className="text-small" style={{ margin: '0.25rem 0 0' }}>
              Every secret mission — including the ones nobody pulled off.
            </p>
          </div>
          <div className="flex-column gap-1">
            {finalRankings.map((player, index) => (
              <RevealDossier
                key={player.id}
                player={player}
                isYou={player.id === currentPlayer?.id}
                nameOf={nameOf}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trip album (holiday mode) */}
      {isHoliday && photos.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Trip album</h3>
            <p className="text-small" style={{ margin: '0.25rem 0 0' }}>
              Save your favourites — photos are deleted within 30 days.
            </p>
          </div>
          <PhotoAlbum game={currentGame} completions={photos} />
        </div>
      )}

      {/* Game Stats */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Game stats</h3>
        </div>
        <div className="flex-column gap-1" style={{ fontSize: '0.9rem' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)' }}>Mode</span>
            <strong>{isHoliday ? 'You Got Who?' : 'Who Got Who'}</strong>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)' }}>Players</span>
            <strong>{currentGame.players.length}</strong>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)' }}>Duration</span>
            <strong>{durationMinutes} min</strong>
          </div>
          <div className="flex-between">
            <span style={{ color: 'var(--text-muted)' }}>{isHoliday ? 'Challenges completed' : 'Total gotchas'}</span>
            <strong>{totalGotchas}</strong>
          </div>
        </div>
      </div>

      {/* Timeline (classic mode) */}
      {!isHoliday && (
        <div className="card">
          <div className="flex-between" style={{ marginBottom: showTimeline ? '1rem' : 0 }}>
            <h3 style={{ margin: 0 }}>Timeline</h3>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              {showTimeline ? 'Hide' : 'Show'}
            </button>
          </div>

          {showTimeline && (
            <div className="text-small">
              {(() => {
                const allGotchas: Array<{
                  playerName: string;
                  targetName: string;
                  gotAt: Date;
                  isCaught: boolean;
                  text: string;
                }> = [];

                currentGame.players.forEach(player => {
                  player.tasks.forEach(task => {
                    if ((task.status === 'completed' || task.status === 'failed') && task.gotAt && task.targetId) {
                      allGotchas.push({
                        playerName: player.name,
                        targetName: nameOf(task.targetId),
                        gotAt: new Date(task.gotAt),
                        isCaught: task.status === 'failed',
                        text: task.text,
                      });
                    }
                  });
                });

                allGotchas.sort((a, b) => a.gotAt.getTime() - b.gotAt.getTime());

                if (allGotchas.length === 0) {
                  return (
                    <p style={{ textAlign: 'center', margin: 0 }}>
                      A quiet game — no gotchas were claimed.
                    </p>
                  );
                }

                return allGotchas.map((gotcha, index) => (
                  <div key={index} style={{
                    padding: '0.6rem 0.75rem',
                    borderLeft: `4px solid ${gotcha.isCaught ? 'var(--danger)' : 'var(--success)'}`,
                    background: gotcha.isCaught ? 'var(--danger-soft)' : 'var(--success-soft)',
                    borderRadius: '0 8px 8px 0',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{
                      fontWeight: 700,
                      marginBottom: '0.15rem',
                      color: gotcha.isCaught ? 'var(--danger-ink)' : 'var(--success-ink)',
                    }}>
                      {gotcha.playerName}{' '}
                      {gotcha.isCaught ? 'got caught by' : 'got'} {gotcha.targetName}
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--paper-dim)' }}>
                      "{gotcha.text}" · {gotcha.gotAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
