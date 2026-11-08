import { buzz } from '../services/appPlatform';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useGameFeed, ClaimOutcome } from '../hooks/useGameFeed';
import { useCountdown } from '../hooks/useCountdown';
import { useGamePhase } from '../hooks/useGamePhase';
import NotificationService from '../services/notificationService';
import { TaskInstance } from '../types';
import { WINNING_SCORE, openPlaces, ordinal, podiumPlaces, rankPlayers } from '../utils/gameSettings';
import TaskListView from './TaskListView';
import TargetSelectModal from './TargetSelectModal';
import DisputeModal from './DisputeModal';
import BustModal from './BustModal';
import VotingBanner from './VotingBanner';

// Sub-components
import { GameHeader } from './game/GameHeader';
import { LeaderboardWidget } from './game/LeaderboardWidget';
import { FullLeaderboard } from './game/FullLeaderboard';
import PhaseBanner from './game/PhaseBanner';
import HostMenu from './game/HostMenu';
import RulesSheet from './game/RulesSheet';
import { ConfirmationModal } from './common/ConfirmationModal';
import StampSplash from './common/StampSplash';
import LoadingScreen from './common/LoadingScreen';
import { MascotPose } from './common/Mascot';

type Slam = { title: string; subtitle?: string; tone: 'success' | 'danger' | 'amber'; mascot: MascotPose; durationMs?: number };

/** Shown once you've reached the winning score while others play on for the podium. */
function FinishBanner({ place, stillOpen }: { place: number; stillOpen: string }) {
  return (
    <div className="phase-banner finished" role="status">
      <div className="phase-label type">Mission accomplished</div>
      <div className="phase-title">{place === 1 ? 'You Win!' : `You Finished ${ordinal(place)}`}</div>
      <p className="phase-text">
        Your missions are done. Stay in to vote on disputes
        {stillOpen ? <> and see who takes {stillOpen} place.</> : '.'}
      </p>
    </div>
  );
}

/** Shown to a catcher while the player they busted picks the mission. */
function BustWaitingBanner({ suspectName, closesAt, pausedAt }: { suspectName: string; closesAt: Date; pausedAt?: string }) {
  const label = useCountdown(closesAt, pausedAt);
  return (
    <div className="claim-banner" role="status">
      <span>You busted {suspectName} — waiting for them to say which mission.</span>
      <span className="timer">{label}</span>
    </div>
  );
}

/** Shown to the target while the group decides on their dispute. */
function JuryBanner({ accuserName, closesAt, pausedAt }: { accuserName: string; closesAt: Date; pausedAt?: string }) {
  const label = useCountdown(closesAt, pausedAt);
  return (
    <div className="claim-banner" role="status">
      <span>You disputed {accuserName}'s claim — the group is voting.</span>
      <span className="timer">{label}</span>
    </div>
  );
}

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const {
    state,
    claimGotcha,
    acceptGotcha,
    disputeGotcha,
    endGame: endGameContext,
    leaveGame,
    swapTask,
    openClaims,
    pauseGame,
    resumeGame,
    callBust,
    answerBust,
  } = useGame();
  const [showHostMenu, setShowHostMenu] = useState(false);
  const [showBustPicker, setShowBustPicker] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const phase = useGamePhase(state.currentGame);
  const wasBriefing = useRef(phase.briefing);
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [selectedResult, setSelectedResult] = useState<'passed' | 'failed'>('passed');
  const [filing, setFiling] = useState<{ taskId: string; result: 'passed' | 'failed' } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [slam, setSlam] = useState<Slam | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [finale, setFinale] = useState<Slam | null>(null);
  const sawLive = useRef(false);

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const targetScore = WINNING_SCORE;
  const responseClaim = state.activeDisputes.find(
    (dispute) => dispute.phase === 'response' && dispute.targetId === currentPlayer?.id,
  );
  const votingDisputes = state.activeDisputes.filter(
    (dispute) =>
      dispute.phase === 'voting' &&
      dispute.targetId !== currentPlayer?.id &&
      dispute.accuserId !== currentPlayer?.id,
  );
  const myJuryDisputes = state.activeDisputes.filter(
    (dispute) => dispute.phase === 'voting' && dispute.targetId === currentPlayer?.id,
  );
  const nameOf = (id?: string) => currentGame?.players.find((p) => p.id === id)?.name || 'them';
  const openBusts = state.activeBusts.filter((bust) => bust.result === 'pending');
  const bustOnMe = openBusts.find((bust) => bust.playerId === currentPlayer?.id);
  const myBust = openBusts.find((bust) => bust.catcherId === currentPlayer?.id);

  useGameFeed(
    useCallback((outcome: ClaimOutcome) => {
      if (outcome.finishedPlace) {
        buzz([200, 80, 200]);
        setSlam({
          title: outcome.finishedPlace === 1 ? 'You Win!' : `${ordinal(outcome.finishedPlace)} Place`,
          subtitle: 'your missions are done — the others play on for the podium',
          tone: 'success',
          mascot: 'happy',
          durationMs: 2400,
        });
        return;
      }
      setSlam(
        outcome.accepted
          ? {
              title: `+${outcome.points}`,
              subtitle: outcome.closePrize
                ? `gotcha on ${outcome.targetName} confirmed — your next one could ${outcome.closePrize}`
                : outcome.points > 1
                  ? `gotcha on ${outcome.targetName} confirmed — first-time bonus included`
                  : `gotcha on ${outcome.targetName} confirmed`,
              tone: 'success',
              mascot: 'happy',
            }
          : {
              title: 'Overturned',
              subtitle: `the group sided with ${outcome.targetName}`,
              tone: 'danger',
              mascot: 'caught',
            },
      );
    }, []),
  );

  const handleAcceptClaim = useCallback(async () => {
    if (!responseClaim) return;
    try {
      await acceptGotcha(responseClaim.taskInstanceId);
    } catch {
      // A different open client may have resolved the timer first.
    }
  }, [acceptGotcha, responseClaim]);

  const handleDisputeClaim = useCallback(async (reason?: string) => {
    if (!responseClaim) return;
    try {
      await disputeGotcha(responseClaim.taskInstanceId, reason);
    } catch {
      // Errors surface via the global toast bridge.
    }
  }, [disputeGotcha, responseClaim]);

  // No game (never loaded, removed, or expired): back to the start.
  useEffect(() => {
    if (!gameId || (!currentGame && !state.isLoading)) navigate('/', { replace: true });
  }, [gameId, currentGame, state.isLoading, navigate]);

  // Game over: stamp the result first if we watched it happen, then the debrief.
  useEffect(() => {
    if (!currentGame) return;
    if (currentGame.status === 'live') {
      sawLive.current = true;
      return;
    }
    if (currentGame.status !== 'ended') return;
    if (!sawLive.current) {
      navigate(`/recap/${currentGame.id}`, { replace: true });
      return;
    }
    const winner = rankPlayers(currentGame.players)[0];
    const reached = !!winner && (!!winner.place || winner.score >= targetScore);
    const mine = currentGame.players.find((player) => player.id === currentPlayer?.id)?.place;
    const iWon = reached && winner.id === currentPlayer?.id;
    let title = 'Case Closed';
    if (iWon) title = 'You Win';
    else if (reached && mine) title = `You Finished ${ordinal(mine)}`;
    else if (reached) title = `${winner.name} Wins`;
    setFinale({
      title,
      subtitle: !reached
        ? 'the host ended the game'
        : mine && !iWon
          ? `${winner.name} took 1st — the debrief is in`
          : `${winner.score} points — the debrief is in`,
      tone: mine ? 'success' : 'amber',
      mascot: 'happy',
      durationMs: 2400,
    });
  }, [currentGame, currentPlayer?.id, navigate, targetScore]);

  // One-time "missions live" splash per game on this device
  useEffect(() => {
    if (currentGame?.status === 'live' && currentPlayer && gameId) {
      const key = `wgw-intro-${gameId}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        setShowIntro(true);
        NotificationService.notifyIfHidden('The game has started', 'Your missions are in — open the game to read them.', `game-started-${gameId}`);
      }
    }
  }, [currentGame?.status, currentPlayer, gameId]);

  // The settling-in clock just hit zero: everyone hears the starting gun.
  useEffect(() => {
    if (wasBriefing.current && !phase.briefing && !phase.paused && currentGame?.status === 'live') {
      buzz([150, 80, 150]);
      setSlam({ title: 'Gotchas Open', subtitle: 'the briefing is over — happy hunting', tone: 'success', mascot: 'mission' });
      NotificationService.notifyIfHidden('Gotchas are open!', 'The briefing is over — go get them.', 'claims-open');
    }
    wasBriefing.current = phase.briefing;
  }, [phase.briefing, phase.paused, currentGame?.status]);

  const hostAction = (action: () => Promise<void>) => async () => {
    try {
      await action();
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  const handleTaskResult = (task: TaskInstance, result: 'passed' | 'failed') => {
    // Both outcomes need a player: who you got, or who caught you.
    setSelectedResult(result);
    setSelectedTask(task);
  };

  const handleSwapTask = async (taskId: string) => {
    if (!currentPlayer || currentPlayer.swapsLeft <= 0) return;
    const swapsTotal = currentGame?.settings?.swapsAllowed ?? 2;

    setConfirmation({
      isOpen: true,
      title: 'Swap this mission?',
      message: `You'll get a random new one instead.\n\nSwaps left after this: ${currentPlayer.swapsLeft - 1}/${swapsTotal}`,
      onConfirm: async () => {
        setConfirmation(prev => ({ ...prev, isOpen: false }));
        try {
          await swapTask(taskId);
        } catch {
          // Errors surface via the global toast bridge.
        }
      },
      confirmLabel: 'Swap it'
    });
  };

  const handleTargetSelect = async (targetId: string) => {
    if (!selectedTask) return;
    const task = selectedTask;
    const result = selectedResult;
    setSelectedTask(null);
    setFiling({ taskId: task.id, result });
    try {
      if (result === 'failed') {
        await claimGotcha(task.id, `caught:${targetId}`);
        setSlam({
          title: 'You Got Caught',
          subtitle: `${nameOf(targetId)} spotted you — try another mission`,
          tone: 'danger',
          mascot: 'caught',
        });
      } else {
        await claimGotcha(task.id, targetId);
        setSlam({
          title: 'Gotcha!',
          subtitle: `claim filed on ${nameOf(targetId)} — waiting for their call`,
          tone: 'success',
          mascot: 'sneaky',
        });
      }
    } catch {
      // Errors surface via the global toast bridge.
    } finally {
      setFiling(null);
    }
  };

  const handleBust = async (playerId: string) => {
    setShowBustPicker(false);
    try {
      await callBust(playerId);
      buzz([80, 40, 80]);
      setSlam({
        title: 'Busted!',
        subtitle: `${nameOf(playerId)} has 5 minutes to say which mission`,
        tone: 'danger',
        mascot: 'sneaky',
      });
    } catch {
      // Errors surface via the global toast bridge.
    }
  };

  const handleEndGame = async () => {
    setConfirmation({
      isOpen: true,
      title: 'End the game?',
      message: 'This ends the game for ALL players and shows the final results.\n\nIt cannot be undone.',
      isDangerous: true,
      confirmLabel: 'End Game',
      onConfirm: async () => {
        setConfirmation(prev => ({ ...prev, isOpen: false }));
        try {
          await endGameContext();
        } catch {
          // Errors surface via the global toast bridge.
        }
      }
    });
  };

  const handleLeaveGame = async () => {
    setConfirmation({
      isOpen: true,
      title: 'Leave the game?',
      message: 'You will return to the home screen.\n\nThe others keep playing without you.',
      isDangerous: true,
      confirmLabel: 'Leave Game',
      onConfirm: async () => {
        setConfirmation(prev => ({ ...prev, isOpen: false }));
        try {
          await leaveGame();
        } catch {
          // Leaving is best-effort; still return home.
        }
        navigate('/', { replace: true });
      }
    });
  };

  if (!currentGame || !currentPlayer) {
    return <LoadingScreen message="decrypting your game…" showBack />;
  }

  return (
    <div className="container">
      <GameHeader
        currentPlayer={currentPlayer}
        playerCount={currentGame.players.length}
        targetScore={targetScore}
        briefing={phase.briefing}
        onOpenHostMenu={() => setShowHostMenu(true)}
        onLeaveGame={handleLeaveGame}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />

      <PhaseBanner
        phase={phase}
        isHost={currentPlayer.isHost}
        hostName={nameOf(currentGame.hostId)}
        isHoliday={false}
        onOpenNow={hostAction(openClaims)}
        onResume={hostAction(resumeGame)}
        onShowRules={() => setShowRules(true)}
      />

      {currentPlayer.place && currentGame.status === 'live' && (
        <FinishBanner place={currentPlayer.place} stillOpen={openPlaces(currentGame)} />
      )}

      <LeaderboardWidget
        players={currentGame.players}
        currentPlayerId={currentPlayer.id}
        targetScore={targetScore}
        places={podiumPlaces(currentGame)}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />

      {myJuryDisputes.map((dispute) => (
        <JuryBanner
          key={dispute.id}
          accuserName={nameOf(dispute.accuserId)}
          closesAt={dispute.closesAt}
          pausedAt={currentGame.pausedAt}
        />
      ))}

      {votingDisputes.map((dispute) => (
        <VotingBanner key={dispute.id} dispute={dispute} />
      ))}

      {myBust && (
        <BustWaitingBanner
          key={myBust.id}
          suspectName={nameOf(myBust.playerId)}
          closesAt={myBust.closesAt}
          pausedAt={currentGame.pausedAt}
        />
      )}

      {/* Catching people is half the game: make it one tap. */}
      <div className="bust-bar">
        <span className="bust-bar-hint">
          {phase.lockReason ? 'Busts open when gotchas do.' : 'Caught someone trying a mission on you?'}
        </span>
        <button
          className="btn btn-danger btn-small"
          onClick={() => setShowBustPicker(true)}
          disabled={!!phase.lockReason || !!myBust}
        >
          Bust Them
        </button>
      </div>

      {/* Mission dossiers — straight on the desk */}
      <section style={{ marginTop: '0.25rem' }}>
        <TaskListView
          tasks={currentPlayer.tasks}
          players={currentGame.players}
          onTaskResult={handleTaskResult}
          onSwapTask={handleSwapTask}
          swapsLeft={currentPlayer.swapsLeft}
          swapsTotal={currentGame.settings?.swapsAllowed ?? 2}
          activeDisputes={state.activeDisputes}
          currentPlayerId={currentPlayer.id}
          filing={filing}
          lockReason={phase.lockReason}
          finished={!!currentPlayer.place}
        />
      </section>

      <button className="btn btn-ghost" onClick={() => setShowRules(true)} style={{ marginTop: '0.25rem' }}>
        How to play
      </button>

      <RulesSheet game={currentGame} isOpen={showRules} onClose={() => setShowRules(false)} />

      <HostMenu
        isOpen={showHostMenu}
        phase={phase}
        onClose={() => setShowHostMenu(false)}
        onOpenClaims={hostAction(openClaims)}
        onPause={hostAction(pauseGame)}
        onResume={hostAction(resumeGame)}
        onEnd={handleEndGame}
      />

      {showLeaderboard && (
        <FullLeaderboard
          players={currentGame.players}
          currentPlayerId={currentPlayer.id}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Target Select Modal */}
      <TargetSelectModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSelectTarget={handleTargetSelect}
        availableTargets={currentGame.players.filter((p) => p.id !== currentPlayer.id)}
        taskText={selectedTask?.text || ''}
        isReverse={selectedResult === 'failed'}
        previousTargets={currentPlayer.stats?.uniqueTargets || []}
      />

      <TargetSelectModal
        isOpen={showBustPicker}
        onClose={() => setShowBustPicker(false)}
        onSelectTarget={handleBust}
        availableTargets={currentGame.players.filter((p) => p.id !== currentPlayer.id && !p.place)}
        taskText=""
        isBust
      />

      {/* A claim on you comes first; a bust waits behind it. */}
      {bustOnMe && !responseClaim && (
        <BustModal
          key={bustOnMe.id}
          bust={bustOnMe}
          catcherName={nameOf(bustOnMe.catcherId)}
          missions={currentPlayer.tasks.filter((task) => task.status === 'pending')}
          pausedAt={currentGame.pausedAt}
          onAnswer={(taskId) => answerBust(bustOnMe.id, taskId)}
        />
      )}

      {responseClaim && (
        <DisputeModal
          key={responseClaim.id}
          dispute={responseClaim}
          accuserName={nameOf(responseClaim.accuserId)}
          canDispute={currentGame.players.length > 2}
          pausedAt={currentGame.pausedAt}
          onAccept={handleAcceptClaim}
          onDispute={handleDisputeClaim}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onCancel={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        isDangerous={confirmation.isDangerous}
        confirmLabel={confirmation.confirmLabel}
      />

      {showIntro && (
        <StampSplash
          title={phase.briefing ? 'Missions In' : 'Missions Live'}
          subtitle={phase.briefing
            ? 'read up and settle in — gotchas open when the clock runs out'
            : `case file ${currentGame.id} · trust no one`}
          tone="amber"
          mascot="mission"
          durationMs={1900}
          onDone={() => setShowIntro(false)}
        />
      )}

      {slam && !finale && (
        <StampSplash
          key={`${slam.title}-${slam.subtitle}`}
          title={slam.title}
          subtitle={slam.subtitle}
          tone={slam.tone}
          mascot={slam.mascot}
          durationMs={slam.durationMs}
          onDone={() => setSlam(null)}
        />
      )}

      {finale && (
        <StampSplash
          title={finale.title}
          subtitle={finale.subtitle}
          tone={finale.tone}
          mascot={finale.mascot}
          durationMs={finale.durationMs}
          onDone={() => navigate(`/recap/${currentGame.id}`, { replace: true })}
        />
      )}
    </div>
  );
}
