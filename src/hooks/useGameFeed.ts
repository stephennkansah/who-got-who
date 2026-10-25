import { useEffect, useRef } from 'react';
import { useGame } from './useGame';
import { showToast } from '../components/common/Toast';
import NotificationService from '../services/notificationService';

export interface ClaimOutcome {
  accepted: boolean;
  points: number;
  targetName: string;
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

    for (const player of game.players) {
      for (const task of player.tasks) {
        const was = before.tasks.get(task.id);
        if (was === task.status || (task.status !== 'completed' && task.status !== 'failed')) continue;
        if (player.id === me.id) {
          if (was === 'disputed') {
            callback.current?.({
              accepted: task.status === 'completed',
              points: Math.max(0, me.score - before.myScore),
              targetName: nameOf(task.targetId),
            });
          }
          continue;
        }
        if (task.status === 'completed') {
          announce(task.targetId === me.id
            ? `${player.name} got you!`
            : `${player.name} got ${nameOf(task.targetId)}`);
        } else {
          announce(`${player.name} got busted by ${task.targetId === me.id ? 'you' : nameOf(task.targetId)}`);
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
      navigator.vibrate?.([120, 60, 120]);
      NotificationService.notifyIfHidden(
        'Gotcha claimed!',
        `${nameOf(dispute.accuserId)} says they got you — open the game to accept or dispute.`,
        `claim-${dispute.id}`,
      );
    }

    for (const dispute of state.activeDisputes) {
      if (!snapshot.votesForMe.has(dispute.id) || before.votesForMe.has(dispute.id)) continue;
      navigator.vibrate?.([120, 60, 120]);
      NotificationService.notifyIfHidden(
        'Your vote is needed',
        `${nameOf(dispute.targetId)} disputes ${nameOf(dispute.accuserId)}'s gotcha — open the game to vote.`,
        `vote-${dispute.id}`,
      );
    }

    if (before.status === 'live' && snapshot.status === 'ended') {
      const holiday = game.gameType === 'holiday-challenge';
      const target = holiday ? game.settings.holidayChallengeWinCondition || 18 : game.settings.targetScore;
      const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
      NotificationService.notifyIfHidden(
        'Game over',
        winner && winner.score >= target
          ? `${winner.id === me.id ? 'You win' : `${winner.name} wins`} with ${winner.score} points — see the results.`
          : 'The host ended the game — see the results.',
        `game-over-${game.id}`,
      );
    }
  }, [game, me, state.activeDisputes]);
}
