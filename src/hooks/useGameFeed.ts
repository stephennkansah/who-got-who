import { buzz } from '../services/appPlatform';
import { playSound } from '../services/sounds';
import { useEffect, useRef } from 'react';
import { useGame } from './useGame';
import { showToast } from '../components/common/Toast';
import NotificationService from '../services/notificationService';
import { ONE_AWAY_SCORE, nextPrize, openPlaces, ordinal, rankPlayers } from '../utils/gameSettings';

export interface ClaimOutcome {
  accepted: boolean;
  points: number;
  targetName: string;
  /** Set when this claim took you to the winning score: your podium place. */
  finishedPlace?: number;
  /** Set when this claim put you within one gotcha of finishing: "win" or "take 2nd place". */
  closePrize?: string;
}

interface Snapshot {
  gameId: string;
  status: string;
  tasks: Map<string, string>;
  completions: Set<string>;
  claimsOnMe: Set<string>;
  votesForMe: Set<string>;
  myScore: number;
  paused: boolean;
  places: Map<string, number | undefined>;
  scores: Map<string, number>;
  busts: Map<string, string>;
}

/**
 * Announces what changed between two game states — gotchas, busts, holiday
 * medals, claims against you — by diffing snapshots rather than trusting
 * timestamps, so a device with a wrong clock still hears everything.
 */
export function useGameFeed(onMyClaimResolved?: (outcome: ClaimOutcome) => void): void {
  const { state } = useGame();
  const game = state.currentGame;
  const me = state.currentPlayer;
  const previous = useRef<Snapshot | null>(null);
  const callback = useRef(onMyClaimResolved);
  callback.current = onMyClaimResolved;

  useEffect(() => {
    if (!game || !me || game.status === 'draft') return;
    const nameOf = (id?: string) => game.players.find((player) => player.id === id)?.name || 'someone';
    const snapshot: Snapshot = {
      gameId: game.id,
      status: game.status,
      tasks: new Map(game.players.flatMap((player) => player.tasks.map((task) => [task.id, task.status]))),
      completions: new Set((game.challengeCompletions || []).map((completion) => completion.id)),
      claimsOnMe: new Set(
        state.activeDisputes
          .filter((dispute) => dispute.targetId === me.id && dispute.phase === 'response')
          .map((dispute) => dispute.id),
      ),
      votesForMe: new Set(
        state.activeDisputes
          .filter(
            (dispute) =>
              dispute.phase === 'voting' &&
              dispute.accuserId !== me.id &&
              dispute.targetId !== me.id &&
              !dispute.votes.some((vote) => vote.voterId === me.id),
          )
          .map((dispute) => dispute.id),
      ),
      myScore: me.score,
      paused: !!game.pausedAt,
      places: new Map(game.players.map((player) => [player.id, player.place])),
      scores: new Map(game.players.map((player) => [player.id, player.score])),
      busts: new Map(state.activeBusts.map((bust) => [bust.id, bust.result])),
    };
    const before = previous.current;
    previous.current = snapshot;
    if (!before || before.gameId !== game.id) return; // first look: nothing to compare yet

    const announce = (message: string) => {
      showToast(message, 'info');
      NotificationService.notifyIfHidden('Who Got Who', message, 'feed', true);
    };

    // The host already knows they paused; everyone else gets told.
    if (snapshot.paused !== before.paused && !me.isHost && game.status === 'live') {
      announce(snapshot.paused
        ? 'The host paused the game — no gotchas for now'
        : 'Game resumed — gotchas are back on');
    }

    // Podium places still up for grabs, e.g. "2nd and 3rd".
    const stillOpen = openPlaces(game);
    const holiday = game.gameType === 'holiday-challenge';

    // Busts: the catcher hears the answer; the busted player gets buzzed.
    const bustAnnounced = new Set<string>();
    for (const bust of state.activeBusts) {
      const was = before.busts.get(bust.id);
      if (bust.playerId === me.id && bust.result === 'pending' && !was) {
        buzz([200, 80, 200, 80, 200]);
        playSound('busted');
        NotificationService.notifyIfHidden(
          'Busted?',
          `${nameOf(bust.catcherId)} says they caught you trying a mission — open the game to say which one.`,
          `bust-${bust.id}`,
        );
      }
      if (bust.catcherId !== me.id || was === bust.result || (was && was !== 'pending')) continue;
      if (bust.result === 'confirmed') {
        const mission = game.players
          .find((player) => player.id === bust.playerId)
          ?.tasks.find((task) => task.id === bust.taskInstanceId);
        if (bust.taskInstanceId) bustAnnounced.add(bust.taskInstanceId);
        buzz([60, 40, 60]);
        announce(`Bust confirmed — ${nameOf(bust.playerId)} was trying${mission ? `: "${mission.text}"` : ' a mission'}`);
      } else if (bust.result === 'denied') {
        announce(`${nameOf(bust.playerId)} says that wasn't a mission`);
      }
    }

    for (const player of game.players) {
      const finishedNow = player.place && !before.places.get(player.id) ? player.place : undefined;
      for (const task of player.tasks) {
        const was = before.tasks.get(task.id);
        if (was === task.status || (task.status !== 'completed' && task.status !== 'failed')) continue;
        if (player.id === me.id) {
          if (was === 'disputed') {
            const nowClose = !holiday && !me.place && before.myScore < ONE_AWAY_SCORE && me.score >= ONE_AWAY_SCORE;
            callback.current?.({
              accepted: task.status === 'completed',
              points: Math.max(0, me.score - before.myScore),
              targetName: nameOf(task.targetId),
              finishedPlace: task.status === 'completed' ? finishedNow : undefined,
              closePrize: task.status === 'completed' && nowClose ? nextPrize(game) : undefined,
            });
          }
          continue;
        }
        if (bustAnnounced.has(task.id)) continue;
        if (task.status === 'completed') {
          const got = task.targetId === me.id
            ? `${player.name} got you`
            : `${player.name} got ${nameOf(task.targetId)}`;
          if (finishedNow && game.status === 'live' && stillOpen) {
            announce(`${got} and ${finishedNow === 1 ? 'wins' : `finishes ${ordinal(finishedNow)}`}! The game goes on for ${stillOpen} place.`);
          } else {
            announce(task.targetId === me.id ? `${got}!` : got);
          }
        } else {
          announce(`${player.name} got busted by ${task.targetId === me.id ? 'you' : nameOf(task.targetId)}`);
        }
      }
    }

    // Someone's next gotcha could finish them: everyone else should watch them.
    if (!holiday && game.status === 'live') {
      for (const player of game.players) {
        const was = before.scores.get(player.id);
        if (player.id === me.id || player.place || was === undefined) continue;
        if (was < ONE_AWAY_SCORE && player.score >= ONE_AWAY_SCORE) {
          announce(`${player.name} could ${nextPrize(game)} with their next gotcha — watch them!`);
        }
      }
    }

    for (const completion of game.challengeCompletions || []) {
      if (before.completions.has(completion.id) || completion.playerId === me.id) continue;
      const challenge = game.selectedChallenges?.find((item) => item.id === completion.challengeId);
      announce(`${nameOf(completion.playerId)} took ${completion.type}${challenge ? `: ${challenge.text}` : ''}`);
    }

    for (const dispute of state.activeDisputes) {
      if (dispute.targetId !== me.id || dispute.phase !== 'response' || before.claimsOnMe.has(dispute.id)) continue;
      buzz([120, 60, 120]);
      playSound('alert');
      NotificationService.notifyIfHidden(
        'Gotcha claimed!',
        `${nameOf(dispute.accuserId)} says they got you — open the game to accept or dispute.`,
        `claim-${dispute.id}`,
      );
    }

    for (const dispute of state.activeDisputes) {
      if (!snapshot.votesForMe.has(dispute.id) || before.votesForMe.has(dispute.id)) continue;
      buzz([120, 60, 120]);
      playSound('alert');
      NotificationService.notifyIfHidden(
        'Your vote is needed',
        `${nameOf(dispute.targetId)} disputes ${nameOf(dispute.accuserId)}'s gotcha — open the game to vote.`,
        `vote-${dispute.id}`,
      );
    }

    if (before.status === 'live' && snapshot.status === 'ended') {
      const holiday = game.gameType === 'holiday-challenge';
      const target = holiday ? game.settings.holidayChallengeWinCondition || 18 : game.settings.targetScore;
      const ranked = holiday ? [...game.players].sort((a, b) => b.score - a.score) : rankPlayers(game.players);
      const winner = ranked[0];
      const podium = ranked.filter((player) => player.place);
      const mine = game.players.find((player) => player.id === me.id)?.place;
      let body = 'The host ended the game — see the results.';
      if (winner && podium.length > 1) {
        body = mine === 1
          ? 'You won! See the final podium.'
          : mine
            ? `You finished ${ordinal(mine)} — ${winner.name} won. See the final podium.`
            : `${podium.map((player) => player.name).join(', ')} made the podium — see the results.`;
      } else if (winner && (winner.place || winner.score >= target)) {
        body = `${winner.id === me.id ? 'You win' : `${winner.name} wins`} with ${winner.score} points — see the results.`;
      }
      NotificationService.notifyIfHidden('Game over', body, `game-over-${game.id}`);
    }
  }, [game, me, state.activeDisputes, state.activeBusts]);
}
