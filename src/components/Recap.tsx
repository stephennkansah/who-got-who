import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { AwardType, Player } from '../types';
import ResultsShare from './ResultsShare';
import PlayerAvatar from './PlayerAvatar';
import LoadingScreen from './common/LoadingScreen';
import BrandMark from './common/BrandMark';
import Mascot from './common/Mascot';
import Fold from './common/Fold';
import PhotoAlbum from './PhotoAlbum';
import RecapShow, { missionOutcome, RateButtons } from './recap/RecapShow';
import { WINNING_SCORE, ordinal, rankPlayers } from '../utils/gameSettings';
import { AWARDS, awardsByPlayer } from '../utils/awards';
import './Recap.css';

const showSeenKey = (gameId: string) => `wgw-recap-show-${gameId}`;

/** The show plays once per game on this phone; after that you land on the results. */
function showAlreadySeen(gameId?: string): boolean {
  if (!gameId) return true;
  try {
    return sessionStorage.getItem(showSeenKey(gameId)) === '1';
  } catch {
    return false;
  }
}

function markShowSeen(gameId: string): void {
  try {
    sessionStorage.setItem(showSeenKey(gameId), '1');
  } catch {
    // Storage blocked (private mode): the show just plays again on a reload.
  }
}

/** Every mission a player held, and what became of it. */
const RevealDossier: React.FC<{
  player: Player;
  isYou: boolean;
  meId?: string;
  nameOf: (id?: string) => string;
  defaultOpen: boolean;
  /** Your own missions only: thumbs up/down on each (tap again to clear). */
  onRate?: (taskId: string, rating: 'up' | 'down' | null) => void;
}> = ({ player, isYou, meId, nameOf, defaultOpen, onRate }) => {
  const [open, setOpen] = useState(defaultOpen);
  const done = player.tasks.filter((task) => task.status === 'completed').length;

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
      {open && onRate && (
        <p className="reveal-rate-hint">Fun or flop? Rate your missions — it helps us write better ones.</p>
      )}
      {open && (
        <ul className="reveal-list">
          {player.tasks.map((task) => {
            const result = missionOutcome(task, nameOf, meId);
            return (
              <li key={task.id} className={`reveal-item ${result.cls}`}>
                <div className="reveal-text">{task.text}</div>
                <div className="reveal-outcome">{result.label}</div>
                {onRate && <RateButtons task={task} onRate={onRate} />}
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
  const { state, rematch, leaveGame, createGame, rateMission } = useGame();
  const [showing, setShowing] = useState(() => !showAlreadySeen(gameId));

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

  // Podium finishers first, in the order they finished; then score, then fewer failed attempts.
  const finalRankings = useMemo(() => {
    if (!currentGame) return [] as Player[];
    return rankPlayers(currentGame.players, scoreOf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame, isHoliday]);

  const winner = finalRankings[0] || null;
  const isWinner = !!winner && winner.id === currentPlayer?.id;
  const runnersUp = finalRankings.filter((player) => player.place && player.place > 1);
  const myPlace = finalRankings.find((player) => player.id === currentPlayer?.id)?.place;
  const myRank = finalRankings.findIndex((player) => player.id === currentPlayer?.id) + 1;
  const nameOf = (id?: string) => currentGame?.players.find((p) => p.id === id)?.name || 'a former player';

  // Missions each player caught someone trying (busts, and "I Got Caught" reports naming them).
  const bustsBy = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of currentGame?.players.flatMap((player) => player.tasks) || []) {
      if (task.status === 'failed' && task.targetId) counts.set(task.targetId, (counts.get(task.targetId) || 0) + 1);
    }
    return counts;
  }, [currentGame]);

  const awards = useMemo(
    () => (currentGame ? awardsByPlayer(currentGame) : new Map<string, AwardType[]>()),
    [currentGame],
  );

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

  // The growth loop: a guest who just had fun becomes a host in one tap.
  // The new lobby loads and the draft-game effect above takes them there.
  const handleHostOwn = async () => {
    const me = currentPlayer;
    if (!me) return;
    const photo = me.avatarType === 'photo' && !!me.avatarKey;
    try {
      await createGame(me.name, photo ? me.avatarKey : me.avatar, photo ? 'photo' : 'emoji');
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  if (!currentGame) {
    return <LoadingScreen message="loading the results…" showBack />;
  }

  const rate = (taskId: string, rating: 'up' | 'down' | null) => {
    void rateMission(taskId, rating).catch(() => undefined);
  };

  // Someone actually reached the winning score (not just leading when the host ended it).
  const hasWinner = !!winner && (isHoliday
    ? scoreOf(winner) >= (currentGame.settings.holidayChallengeWinCondition ?? 18)
    : !!winner.place || winner.score >= WINNING_SCORE);

  // ---------- The show: podium, the reveal, the awards ----------
  if (showing && currentGame.status === 'ended' && finalRankings.length > 0) {
    return (
      <RecapShow
        game={currentGame}
        rankings={finalRankings}
        meId={currentPlayer?.id}
        scoreOf={scoreOf}
        nameOf={nameOf}
        hasWinner={hasWinner}
        onRate={rate}
        onDone={() => {
          markShowSeen(currentGame.id);
          setShowing(false);
        }}
      />
    );
  }

  const totalGotchas = isHoliday
    ? (currentGame.challengeCompletions?.length || 0)
    : currentGame.players.reduce((sum, p) => sum + (p.stats?.gothcas || 0), 0);
  const photos = (currentGame.challengeCompletions || []).filter((completion) => completion.proofUrl);

  const timeline = isHoliday ? [] : currentGame.players
    .flatMap((player) => player.tasks
      .filter((task) => (task.status === 'completed' || task.status === 'failed') && task.gotAt && task.targetId)
      .map((task) => ({
        id: task.id,
        playerName: player.name,
        targetName: nameOf(task.targetId),
        gotAt: new Date(task.gotAt as Date),
        isCaught: task.status === 'failed',
        text: task.text,
      })))
    .sort((a, b) => a.gotAt.getTime() - b.gotAt.getTime());

  let headline = 'Game Over';
  if (hasWinner && isWinner) headline = 'You Won';
  else if (myPlace) headline = `You Came ${ordinal(myPlace)}`;

  return (
    <div className="container">
      {/* Result banner */}
      <div className="recap-banner">
        {isHoliday
          ? <BrandMark size={56} alt="Who Got Who" className="brand-mark-centered" />
          : <Mascot pose="happy" size={84} className="mascot-centered" />}
        <div className="type recap-banner-label">Final results</div>
        <h1>{headline}</h1>
        {winner && (
          <div className="recap-winner">
            <PlayerAvatar player={winner} size="medium" />
            <div>
              <div className="recap-winner-name">
                {hasWinner
                  ? (isWinner ? 'Winner — that\'s you' : `${winner.name} wins`)
                  : `${isWinner ? 'You were' : `${winner.name} was`} in the lead`}
              </div>
              <div className="recap-winner-score">
                {scoreOf(winner)} points
                {runnersUp.length > 0 && ` · ${runnersUp.map((player) => `${ordinal(player.place || 0)} ${player.name}`).join(' · ')}`}
              </div>
            </div>
          </div>
        )}
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
              ? 'A new lobby is open for this group — tap to jump in.'
              : 'Opens a new lobby — everyone here gets a one-tap invite.'}
          </p>

          <ResultsShare game={currentGame} style={{ width: '100%' }} />
        </div>
      </div>

      {/* Guests: run the next one yourself */}
      {!currentPlayer?.isHost && (
        <div className="host-cta">
          <div className="type host-cta-label">Your turn to host</div>
          <h3>Host Your Own Game</h3>
          <p>
            Take it to your next party, dinner or trip. You get a code, your friends get a link —
            no app, no sign-up.
          </p>
          <button className="btn btn-success" onClick={handleHostOwn} disabled={state.isLoading}>
            Start My Own Game
          </button>
        </div>
      )}

      {/* Trip album (holiday mode): the photos are the payoff, so they start open */}
      {isHoliday && photos.length > 0 && (
        <Fold title="Trip album" hint={`${photos.length} photo${photos.length === 1 ? '' : 's'}`} defaultOpen>
          <p className="text-small" style={{ margin: '0 0 0.6rem' }}>
            Save your favourites — photos are deleted within 30 days.
          </p>
          <PhotoAlbum game={currentGame} completions={photos} />
        </Fold>
      )}

      <Fold
        title="Final standings"
        hint={myRank > 0 ? `you came ${ordinal(myRank)}` : `${finalRankings.length} players`}
        defaultOpen={finalRankings.length <= 4}
      >
        <div className="flex-column gap-1">
          {finalRankings.map((player: Player, index: number) => {
            const isYou = player.id === currentPlayer?.id;
            const playerAwards = awards.get(player.id) || [];
            return (
              <div key={player.id} className={`standing-row ${isYou ? 'is-me' : ''}`}>
                <span className={`standing-rank ${index < 3 ? 'top' : ''}`} aria-hidden="true">{index + 1}.</span>
                <PlayerAvatar player={player} size="medium" />
                <div className="standing-info">
                  <div className="standing-name">
                    {player.name} {isYou && <span style={{ color: 'var(--amber)' }}>(You)</span>}
                  </div>
                  <div className="standing-sub">
                    {isHoliday
                      ? `${player.challengeCompletions?.length || 0} challenges`
                      : `${player.stats?.gothcas || 0} gotcha${(player.stats?.gothcas || 0) === 1 ? '' : 's'}`}
                    {!isHoliday && (bustsBy.get(player.id) || 0) > 0 &&
                      ` · ${bustsBy.get(player.id)} bust${bustsBy.get(player.id) === 1 ? '' : 's'}`}
                  </div>
                  {playerAwards.length > 0 && (
                    <div className="standing-awards">
                      {playerAwards.map((awardType) => (
                        <span key={awardType} className="award-chip" title={AWARDS[awardType].description}>
                          {AWARDS[awardType].name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="standing-score">{scoreOf(player)}</div>
              </div>
            );
          })}
        </div>
      </Fold>

      {/* The Reveal: every secret mission, face up */}
      {!isHoliday && (
        <Fold title="Every secret mission" hint="including the ones nobody pulled off">
          <div className="flex-column gap-1">
            {finalRankings.map((player) => {
              const isYou = player.id === currentPlayer?.id;
              return (
                <RevealDossier
                  key={player.id}
                  player={player}
                  isYou={isYou}
                  meId={currentPlayer?.id}
                  nameOf={nameOf}
                  defaultOpen={isYou}
                  onRate={isYou ? rate : undefined}
                />
              );
            })}
          </div>
        </Fold>
      )}

      {!isHoliday && (
        <Fold title="Timeline" hint={`${timeline.length} moment${timeline.length === 1 ? '' : 's'}`}>
          {timeline.length === 0 ? (
            <p className="text-small" style={{ textAlign: 'center', margin: 0 }}>
              A quiet game — no gotchas were claimed.
            </p>
          ) : timeline.map((moment) => (
            <div key={moment.id} className={`timeline-row ${moment.isCaught ? 'caught' : ''}`}>
              <div className="timeline-who">
                {moment.playerName} {moment.isCaught ? 'got caught by' : 'got'} {moment.targetName}
              </div>
              <div className="timeline-what">
                "{moment.text}" · {moment.gotAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </Fold>
      )}

      <Fold title="Game stats" hint={`${durationMinutes} min · ${currentGame.players.length} players`}>
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
      </Fold>

      <div className="recap-foot">
        {currentGame.status === 'ended' && (
          <button className="btn btn-ghost" onClick={() => setShowing(true)}>
            {isHoliday ? 'Watch the podium again' : 'Watch the reveal again'}
          </button>
        )}
        <button className="btn btn-ghost" onClick={handleHome}>
          Back to home
        </button>
      </div>
    </div>
  );
}
