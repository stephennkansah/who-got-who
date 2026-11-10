import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Game, Player, TaskInstance } from '../../types';
import PlayerAvatar from '../PlayerAvatar';
import { ordinal } from '../../utils/gameSettings';
import { awardList, AwardGiven } from '../../utils/awards';
import { buzz, isShareCancelled, publicGameOrigin } from '../../services/appPlatform';
import { playSound } from '../../services/sounds';
import { useBackToClose } from '../../hooks/useBackToClose';
import ConfettiBurst from '../common/Confetti';
import { showToast } from '../common/Toast';
import { nightStats } from '../../utils/nightStats';
import { renderNightImage } from '../../utils/resultsImage';
import { sharePicture } from '../../utils/sharePicture';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** What became of a mission, in the words used on every results screen. */
export function missionOutcome(task: TaskInstance, nameOf: (id?: string) => string, meId?: string) {
  const who = task.targetId && task.targetId === meId ? 'you' : nameOf(task.targetId);
  switch (task.status) {
    case 'completed': return { cls: 'completed', label: <>Got <strong>{who}</strong></> };
    case 'failed': return { cls: 'failed', label: <>Busted by <strong>{who}</strong></> };
    case 'disputed': return { cls: 'disputed', label: <>Claim on {who} still open</> };
    default: return { cls: 'pending', label: <>Never pulled off</> };
  }
}

const points = (score: number) => `${score} ${score === 1 ? 'pt' : 'pts'}`;

const OUTCOME_ORDER: Record<TaskInstance['status'], number> = { completed: 0, failed: 1, disputed: 2, pending: 3 };

interface RecapShowProps {
  game: Game;
  /** Final order: finishers first, then by score. */
  rankings: Player[];
  meId?: string;
  scoreOf: (player: Player) => number;
  nameOf: (id?: string) => string;
  /** Somebody reached the winning score (false when the host ended the game early). */
  hasWinner: boolean;
  /** Thumbs up/down on your own missions. */
  onRate?: (taskId: string, rating: 'up' | 'down' | null) => void;
  onDone: () => void;
}

type Stage =
  | { kind: 'podium' }
  | { kind: 'player'; player: Player; rank: number }
  | { kind: 'awards' }
  | { kind: 'mine'; player: Player; rank: number };

/**
 * The ending as a short show, one screen at a time: the podium, then each
 * player's secret missions turned face up, then the awards.
 */
export default function RecapShow({
  game, rankings, meId, scoreOf, nameOf, hasWinner, onRate, onDone,
}: RecapShowProps) {
  const isHoliday = game.gameType === 'holiday-challenge';
  const awards = useMemo(() => awardList(game), [game]);

  // Last place first, so the winner's missions are the finale.
  const stages = useMemo<Stage[]>(() => {
    const players: Stage[] = isHoliday
      ? []
      : rankings
          .map((player, index) => ({ kind: 'player' as const, player, rank: index + 1 }))
          .filter((stage) => stage.player.tasks.length > 0)
          .reverse();
    const myRank = rankings.findIndex((player) => player.id === meId);
    const mine: Stage[] = !isHoliday && myRank >= 0 && rankings[myRank].tasks.length > 0
      ? [{ kind: 'mine', player: rankings[myRank], rank: myRank + 1 }]
      : [];
    return [{ kind: 'podium' }, ...players, ...(awards.length ? [{ kind: 'awards' as const }] : []), ...mine];
  }, [rankings, isHoliday, awards.length, meId]);

  const [step, setStep] = useState(0);
  const [podiumDone, setPodiumDone] = useState(false);
  const stage = stages[Math.min(step, stages.length - 1)];
  const isLast = step >= stages.length - 1;

  // The phone's back button leaves the show for the results.
  useBackToClose(true, onDone);

  const next = () => (isLast ? onDone() : setStep((value) => value + 1));
  const back = () => setStep((value) => Math.max(0, value - 1));

  const upcoming = stages[step + 1];
  const nextLabel = isLast
    ? 'See the Results'
    : upcoming.kind === 'mine'
      ? 'Your Night'
      : upcoming.kind === 'awards'
      ? 'The Awards'
      : upcoming.kind === 'player'
        ? stage.kind === 'podium'
          ? "Reveal Everyone's Missions"
          : `Next: ${upcoming.player.id === meId ? 'You' : upcoming.player.name}`
        : 'Next';

  const waitingForPodium = stage.kind === 'podium' && !podiumDone;

  return (
    <div className="container show">
      {stage.kind === 'podium' && podiumDone && hasWinner && <ConfettiBurst />}

      <div className="show-top">
        <div
          className="show-progress"
          role="progressbar"
          aria-label="Results"
          aria-valuemin={1}
          aria-valuemax={stages.length}
          aria-valuenow={step + 1}
        >
          <span style={{ width: `${((step + 1) / stages.length) * 100}%` }} />
        </div>
        {!isLast && (
          <button className="link-btn show-skip" onClick={onDone}>
            Skip
          </button>
        )}
      </div>

      <div className="show-body" key={step}>
        {stage.kind === 'podium' && (
          <Podium
            top={rankings.slice(0, 3)}
            meId={meId}
            scoreOf={scoreOf}
            hasWinner={hasWinner}
            onDone={() => setPodiumDone(true)}
          />
        )}
        {stage.kind === 'player' && (
          <PlayerReveal
            player={stage.player}
            rank={stage.rank}
            score={scoreOf(stage.player)}
            position={stages.filter((item) => item.kind === 'player').indexOf(stage) + 1}
            total={stages.filter((item) => item.kind === 'player').length}
            meId={meId}
            nameOf={nameOf}
            onRate={stage.player.id === meId ? onRate : undefined}
          />
        )}
        {stage.kind === 'awards' && <AwardsReveal awards={awards} meId={meId} />}
        {stage.kind === 'mine' && (
          <MyNight
            player={stage.player}
            rank={stage.rank}
            score={scoreOf(stage.player)}
            game={game}
            nameOf={nameOf}
            awards={awards}
          />
        )}
      </div>

      <div className="show-foot">
        {step > 0 && (
          <button className="btn btn-secondary show-back" onClick={back} aria-label="Back">
            ←
          </button>
        )}
        <button className="btn btn-primary" onClick={next} disabled={waitingForPodium}>
          {waitingForPodium ? '…' : nextLabel}
        </button>
      </div>
    </div>
  );
}

/** 3rd, then 2nd, then 1st, each stepping onto the podium in turn. Tap to hurry it. */
function Podium({ top, meId, scoreOf, hasWinner, onDone }: {
  top: Player[];
  meId?: string;
  scoreOf: (player: Player) => number;
  hasWinner: boolean;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? top.length : 0));
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const announced = useRef(shown);

  useEffect(() => {
    if (shown >= top.length) {
      onDoneRef.current();
      return undefined;
    }
    const timer = window.setTimeout(() => setShown((value) => value + 1), shown === 0 ? 800 : 1200);
    return () => window.clearTimeout(timer);
  }, [shown, top.length]);

  useEffect(() => {
    if (shown === announced.current) return;
    announced.current = shown;
    const winnerNow = shown >= top.length;
    buzz(winnerNow ? [80, 40, 160] : 50);
    playSound(winnerNow && hasWinner ? 'win' : 'score');
  }, [shown, top.length, hasWinner]);

  const winner = top[0];
  const allShown = shown >= top.length;
  const visible = (index: number) => top.length - index <= shown;
  // On screen: 2nd, 1st, 3rd, like a real podium.
  const columns = [1, 0, 2].filter((index) => index < top.length);

  let headline = 'And the Winner Is…';
  if (allShown) {
    if (!hasWinner) headline = 'Game Over';
    else headline = winner?.id === meId ? 'You Won!' : `${winner?.name} Wins!`;
  }

  return (
    <div className="podium-stage" onClick={() => setShown(top.length)}>
      <div className="overline">Final results</div>
      <h1 className={`podium-headline ${allShown ? 'is-final' : ''}`} key={headline}>{headline}</h1>
      {allShown && !hasWinner && (
        <p className="podium-note">The host ended the game early — here's how it stood.</p>
      )}

      <div className="podium" role="list">
        {columns.map((index) => {
          const player = top[index];
          const up = visible(index);
          return (
            <div
              key={player.id}
              role="listitem"
              className={`podium-col place-${index + 1} ${up ? 'is-up' : ''} ${player.id === meId ? 'is-me' : ''}`}
              aria-hidden={!up}
            >
              <div className="podium-who">
                {up ? (
                  <>
                    <PlayerAvatar player={player} size={index === 0 ? 'xlarge' : 'large'} />
                    <div className="podium-name">{player.id === meId ? 'You' : player.name}</div>
                    <div className="podium-score">{points(scoreOf(player))}</div>
                  </>
                ) : (
                  <div className="podium-mystery" aria-hidden="true">?</div>
                )}
              </div>
              <div className="podium-block">{ordinal(index + 1)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One player's secret missions, turned face up one at a time. */
function PlayerReveal({ player, rank, score, position, total, meId, nameOf, onRate }: {
  player: Player;
  rank: number;
  score: number;
  position: number;
  total: number;
  meId?: string;
  nameOf: (id?: string) => string;
  onRate?: (taskId: string, rating: 'up' | 'down' | null) => void;
}) {
  const isYou = player.id === meId;
  const tasks = useMemo(
    () => [...player.tasks].sort((a, b) => OUTCOME_ORDER[a.status] - OUTCOME_ORDER[b.status]),
    [player.tasks],
  );
  const done = tasks.filter((task) => task.status === 'completed').length;

  return (
    <div className="reveal-screen">
      <div className="overline">The reveal · {position} of {total}</div>
      <div className="reveal-who">
        <PlayerAvatar player={player} size="large" />
        <div className="reveal-who-text">
          <h2>{isYou ? 'Your Missions' : `${player.name}'s Missions`}</h2>
          <div className="reveal-who-sub">
            {ordinal(rank)} place · {points(score)} · {done}/{tasks.length} pulled off
          </div>
        </div>
      </div>
      {onRate && <p className="reveal-rate-hint">Fun or flop? Rate yours — it helps us write better ones.</p>}

      <ul className="reveal-list show-list">
        {tasks.map((task, index) => {
          const result = missionOutcome(task, nameOf, meId);
          const onMe = !isYou && task.targetId === meId && task.status === 'completed';
          return (
            <li
              key={task.id}
              className={`reveal-item flip-in ${result.cls} ${onMe ? 'on-me' : ''}`}
              style={{ animationDelay: `${200 + index * 170}ms` }}
            >
              <div className="reveal-text">{task.text}</div>
              <div className="reveal-outcome">{result.label}{onMe && ' — that was this one!'}</div>
              {onRate && <RateButtons task={task} onRate={onRate} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RateButtons({ task, onRate }: {
  task: TaskInstance;
  onRate: (taskId: string, rating: 'up' | 'down' | null) => void;
}) {
  return (
    <div className="reveal-rate" role="group" aria-label="Rate this mission">
      {(['up', 'down'] as const).map((rating) => (
        <button
          key={rating}
          className={`rate-btn ${task.rating === rating ? 'is-picked' : ''}`}
          aria-pressed={task.rating === rating}
          aria-label={rating === 'up' ? 'Fun mission' : 'Not fun'}
          onClick={() => onRate(task.id, task.rating === rating ? null : rating)}
        >
          {rating === 'up' ? '👍' : '👎'}
        </button>
      ))}
    </div>
  );
}

/** Each award stamped onto the table in turn. */
function AwardsReveal({ awards, meId }: { awards: AwardGiven[]; meId?: string }) {
  return (
    <div className="reveal-screen">
      <div className="overline">The awards</div>
      <h2 className="awards-title">And the Awards Go To…</h2>
      <ul className="award-cards">
        {awards.map((award, index) => (
          <li
            key={award.type}
            className="paper-card award-card flip-in"
            style={{ animationDelay: `${300 + index * 450}ms` }}
          >
            <div className="award-card-text">
              <div className="award-card-name">{award.name}</div>
              <div className="award-card-why">{award.description}</div>
            </div>
            <div className="award-card-winners">
              {award.winners.map((winner) => (
                <div key={winner.id} className="award-card-winner">
                  <PlayerAvatar player={winner} size="small" />
                  <span>{winner.id === meId ? 'You' : winner.name}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Your own game in four numbers, just before the results. Share it as a picture. */
function MyNight({ player, rank, score, game, nameOf, awards }: {
  player: Player;
  rank: number;
  score: number;
  game: Game;
  nameOf: (id?: string) => string;
  awards: AwardGiven[];
}) {
  const stats = useMemo(() => nightStats(game, player, rank, nameOf, awards), [game, player, rank, nameOf, awards]);
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    setSharing(true);
    try {
      const blob = await renderNightImage(player, rank, score, stats);
      const how = await sharePicture(
        blob,
        `who-got-who-my-night-${game.id}.png`,
        `My night on Who Got Who: ${stats.title}. ${publicGameOrigin()}`,
      );
      if (how === 'saved') showToast('Picture saved', 'success');
    } catch (error) {
      if (!isShareCancelled(error)) showToast("Couldn't create the picture — try again.", 'error');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="reveal-screen night">
      <div className="overline">Your night</div>
      <div className="night-hero">
        <PlayerAvatar player={player} size="large" />
        <h2 className="night-title">{stats.title}</h2>
        <div className="reveal-who-sub">{ordinal(rank)} place · {points(score)}</div>
      </div>
      <ul className="night-tiles">
        {stats.tiles.map((tile, index) => (
          <li key={tile.label} className="night-tile" style={{ animationDelay: `${250 + index * 180}ms` }}>
            <div className="night-value">{tile.value}</div>
            <div className="night-label">{tile.label}</div>
          </li>
        ))}
      </ul>
      {stats.awards.length > 0 && (
        <div className="night-awards">
          {stats.awards.map((award) => (
            <span key={award.type} className="award-chip">{award.name}</span>
          ))}
        </div>
      )}
      <button className="btn btn-secondary night-share" onClick={share} disabled={sharing}>
        {sharing ? 'Making your picture…' : 'Share My Night'}
      </button>
    </div>
  );
}
