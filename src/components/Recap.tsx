import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player, AwardType } from '../types';
import ResultsShare from './ResultsShare';
import PlayerAvatar from './PlayerAvatar';

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

export default function Recap() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, createGame, leaveGame } = useGame();
  const [showTimeline, setShowTimeline] = useState(false);

  const currentGame = state.currentGame;
  const currentPlayer = state.currentPlayer;
  const isHoliday = currentGame?.gameType === 'holiday-challenge';

  // Freeze the duration at mount so it doesn't tick upward while people read
  const durationMinutes = useMemo(() => {
    if (!currentGame) return 0;
    return Math.max(1, Math.round((Date.now() - new Date(currentGame.createdAt).getTime()) / 60000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.id]);

  useEffect(() => {
    if (!gameId || !currentGame) {
      navigate('/');
    }
  }, [gameId, currentGame, navigate]);

  // After "Start a new lobby", route into the fresh game instead of lingering here
  useEffect(() => {
    if (currentGame && currentGame.status === 'draft') {
      const packSelected = currentGame.settings?.selectedPack;
      if (packSelected || !currentPlayer?.isHost) {
        navigate(`/lobby/${currentGame.id}`);
      } else {
        navigate(`/select-pack/${currentGame.id}`);
      }
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

  const getPlayerAwards = (player: Player): AwardType[] => {
    if (!currentGame || isHoliday) return [];

    const awards: AwardType[] = [];
    const allPlayers = currentGame.players;

    const maxGotchas = Math.max(...allPlayers.map(p => p.stats?.gothcas || 0));
    if ((player.stats?.gothcas || 0) === maxGotchas && maxGotchas > 0) {
      awards.push('sneakiest');
    }

    const maxTargets = Math.max(...allPlayers.map(p => p.stats?.uniqueTargets?.length || 0));
    if ((player.stats?.uniqueTargets?.length || 0) === maxTargets && maxTargets > 1) {
      awards.push('social');
    }

    if (allPlayers.length > 3) {
      const minFailed = Math.min(...allPlayers.map(p => p.stats?.failed || 0));
      if ((player.stats?.failed || 0) === minFailed) {
        awards.push('untouchable');
      }
    }

    const maxFailed = Math.max(...allPlayers.map(p => p.stats?.failed || 0));
    if ((player.stats?.failed || 0) === maxFailed && maxFailed > 2) {
      awards.push('jester');
    }

    return awards.slice(0, 2);
  };

  const getAwardInfo = (awardType: AwardType) => {
    const awards = {
      sneakiest: { name: 'Sneakiest', description: 'Most successful Gotchas' },
      social: { name: 'Social Butterfly', description: 'Most unique targets' },
      detective: { name: 'Detective', description: 'Caught the most people' },
      untouchable: { name: 'Untouchable', description: 'Never got caught' },
      jester: { name: 'Court Jester', description: 'Most failed attempts' },
      chaos: { name: 'Chaos Agent', description: 'Most disputes created' }
    };
    return awards[awardType];
  };

  const handleNewGame = async () => {
    if (!currentPlayer) return;
    try {
      await createGame(
        currentPlayer.name,
        currentPlayer.avatarType === 'photo' ? undefined : currentPlayer.avatar,
        'emoji',
      );
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  const handleNewGroup = async () => {
    try {
      await leaveGame();
    } catch {
      // Best-effort; still go home.
    }
    navigate('/');
  };

  if (!currentGame) {
    return (
      <div className="container flex-center">
        <div className="card text-center" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }} aria-hidden="true">⏳</div>
          <h2>Loading results…</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalGotchas = isHoliday
    ? (currentGame.challengeCompletions?.length || 0)
    : currentGame.players.reduce((sum, p) => sum + (p.stats?.gothcas || 0), 0);

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
        <div className="type" style={{
          fontSize: '0.68rem',
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
            const awards = getPlayerAwards(player);
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isHoliday
                        ? `${player.challengeCompletions?.length || 0} challenges`
                        : `${player.stats?.gothcas || 0} gotcha${(player.stats?.gothcas || 0) === 1 ? '' : 's'}`}
                    </div>
                    {awards.length > 0 && (
                      <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {awards.map((awardType) => {
                          const award = getAwardInfo(awardType);
                          return (
                            <span key={awardType} title={award.description} style={{
                              background: 'var(--warning-soft)',
                              border: '1px solid var(--warning-border)',
                              color: 'var(--warning-ink)',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                            }}>
                              {award.name}
                            </span>
                          );
                        })}
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
            <span style={{ color: 'var(--text-muted)' }}>⏱️ Duration</span>
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
                      const other = currentGame.players.find(p => p.id === task.targetId);
                      if (other) {
                        allGotchas.push({
                          playerName: player.name,
                          targetName: other.name,
                          gotAt: new Date(task.gotAt),
                          isCaught: task.status === 'failed',
                          text: task.text,
                        });
                      }
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
                    <div className="type" style={{ fontSize: '0.76rem', color: 'var(--paper-dim)' }}>
                      "{gotcha.text}" · {gotcha.gotAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="card">
        <h3 style={{ textAlign: 'center' }}>What's next?</h3>

        <div className="flex-column gap-1">
          <button
            className="btn btn-primary"
            onClick={handleNewGame}
            disabled={state.isLoading}
          >
            Start a New Lobby
          </button>
          <p className="text-small" style={{ textAlign: 'center', margin: '-0.25rem 0 0.25rem' }}>
            You'll get a fresh code to share with the group.
          </p>

          <ResultsShare game={currentGame} style={{ width: '100%' }} />

          <button
            className="btn btn-ghost"
            onClick={handleNewGroup}
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
