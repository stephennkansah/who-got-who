import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { TaskInstance, Player } from '../types';
import TaskListView from './TaskListView';
import TargetSelectModal from './TargetSelectModal';
import DisputeModal from './DisputeModal';
import VotingBanner from './VotingBanner';

// Sub-components
import { GameHeader } from './game/GameHeader';
import { LeaderboardWidget } from './game/LeaderboardWidget';
import { GameNotifications } from './game/GameNotifications';
import { FullLeaderboard } from './game/FullLeaderboard';
import { ConfirmationModal } from './common/ConfirmationModal';
import StampSplash from './common/StampSplash';

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
  } = useGame();
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: string}>>([]);
  const [slam, setSlam] = useState<{ title: string; subtitle?: string; tone: 'success' | 'danger' | 'amber' } | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const seenNotifications = useRef(new Set<string>());
  
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
  const responseClaim = state.activeDisputes.find(
    (dispute) => dispute.phase === 'response' && dispute.targetId === currentPlayer?.id,
  );
  const votingDisputes = state.activeDisputes.filter(
    (dispute) =>
      dispute.phase === 'voting' &&
      dispute.targetId !== currentPlayer?.id &&
      dispute.accuserId !== currentPlayer?.id,
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
    await disputeGotcha(responseClaim.taskInstanceId, reason);
  }, [disputeGotcha, responseClaim]);

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }
  }, [gameId, navigate]);

  useEffect(() => {
    // Navigate to recap when game ends
    if (currentGame?.status === 'ended') {
      navigate(`/recap/${gameId}`);
    }
  }, [currentGame?.status, gameId, navigate]);

  // One-time "missions live" splash per game on this device
  useEffect(() => {
    if (currentGame?.status === 'live' && currentPlayer && gameId) {
      const key = `wgw-intro-${gameId}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        setShowIntro(true);
      }
    }
  }, [currentGame?.status, currentPlayer, gameId]);

  // Watch for completed tasks and show notifications
  useEffect(() => {
    if (!currentGame || !currentPlayer) return;

    const handleTaskNotifications = () => {
      // Get all completed tasks from all players
      const allCompletedTasks = (currentGame.players || []).flatMap(player => 
        player.tasks
          .filter(task => task.status === 'completed' && task.gotAt)
          .map(task => ({
            ...task,
            playerName: player.name,
            playerId: player.id,
            targetName: (currentGame.players || []).find(p => p.id === task.targetId)?.name || 'Unknown'
          }))
      );

      // Sort by completion time (most recent first)
      allCompletedTasks.sort((a, b) => 
        new Date(b.gotAt!).getTime() - new Date(a.gotAt!).getTime()
      );

      // Show notifications for recent completions (last 10 seconds)
      const now = new Date().getTime();
      const recentTasks = allCompletedTasks.filter(task => {
        const taskTime = new Date(task.gotAt!).getTime();
        return (now - taskTime) < 10000; // 10 seconds
      });

      recentTasks.forEach(task => {
        const notificationId = `${task.playerId}-${task.id}-${task.gotAt}`;
        
        // Check if we already showed this notification
        if (!seenNotifications.current.has(notificationId) && task.playerId !== currentPlayer.id) {
          seenNotifications.current.add(notificationId);
          const message = `${task.playerName} got ${task.targetName}!`;
          
          setNotifications(prev => [...prev, {
            id: notificationId,
            message,
            type: 'gotcha'
          }]);

          // Auto-remove notification after 4 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
          }, 4000);
        }
      });
    };

    handleTaskNotifications();
  }, [currentGame, currentPlayer]);

  const handleTaskResult = (task: TaskInstance, result: 'passed' | 'failed') => {
    // Both passed and failed tasks need target selection
    // Store the result type with the task for the modal to handle
    const taskWithResult = { ...task, resultType: result };
    setSelectedTask(taskWithResult as TaskInstance);
    setShowTargetModal(true);
  };

  const handleSwapTask = async (taskId: string) => {
    if (!currentPlayer || currentPlayer.swapsLeft <= 0) return;
    const swapsTotal = currentGame?.settings?.swapsAllowed ?? 2;

    setConfirmation({
      isOpen: true,
      title: 'Swap this task?',
      message: `Replace it with a random new one?\n\nSwaps left after this: ${currentPlayer.swapsLeft - 1}/${swapsTotal}`,
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
    if (selectedTask) {
      const resultType = (selectedTask as any)?.resultType;

      try {
        if (resultType === 'failed') {
          // Task failed - use special failure handling
          await claimGotcha(selectedTask.id, `caught:${targetId}`);
        } else {
          // Task passed - mark as completed with target
          await claimGotcha(selectedTask.id, targetId);
          const targetName = currentGame?.players.find(p => p.id === targetId)?.name || 'them';
          setSlam({
            title: 'Gotcha!',
            subtitle: `claim filed on ${targetName} — waiting for their call`,
            tone: 'success',
          });
        }
      } catch {
        // Errors surface via the global toast bridge.
      }

      setShowTargetModal(false);
      setSelectedTask(null);
    }
  };

  const handleTargetModalClose = () => {
    setShowTargetModal(false);
    setSelectedTask(null);
  };

  const getAvailableTargets = (): Player[] => {
    if (!currentGame || !currentPlayer || !currentGame.players) return [];
    return currentGame.players.filter(p => p.id !== currentPlayer.id);
  };

  const handleEndGame = async () => {
    setConfirmation({
      isOpen: true,
      title: 'End the game?',
      message: 'This ends the game for ALL players and shows the final results.\n\nIt cannot be undone.',
      isDangerous: true,
      confirmLabel: 'End Game',
      onConfirm: async () => {
        await endGameContext();
        setConfirmation(prev => ({ ...prev, isOpen: false }));
        navigate(`/recap/${gameId}`);
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
        await leaveGame();
        setConfirmation(prev => ({ ...prev, isOpen: false }));
        navigate('/');
      }
    });
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
          <p className="type" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>decrypting your game…</p>
          <button onClick={() => navigate('/')} className="btn btn-ghost">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <GameHeader 
        currentPlayer={currentPlayer}
        playerCount={currentGame.players.length}
        onEndGame={handleEndGame}
        onLeaveGame={handleLeaveGame}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />

      <LeaderboardWidget
        players={currentGame.players}
        currentPlayerId={currentPlayer.id}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />

      {votingDisputes.map((dispute) => (
        <VotingBanner key={dispute.id} dispute={dispute} />
      ))}

      {/* Mission dossiers — straight on the desk */}
      <section style={{ marginTop: '0.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '0.7rem', padding: '0 0.15rem' }}>
          <span className="overline">Your missions · eyes only</span>
          <span className="overline" style={{ color: 'var(--danger)' }}>
            stay invisible
          </span>
        </div>

        <TaskListView
          tasks={currentPlayer.tasks}
          players={currentGame.players}
          onTaskResult={handleTaskResult}
          onSwapTask={handleSwapTask}
          swapsLeft={currentPlayer.swapsLeft}
          swapsTotal={currentGame.settings?.swapsAllowed ?? 2}
          activeDisputes={state.activeDisputes}
          currentPlayerId={currentPlayer.id}
        />
      </section>

      <GameNotifications notifications={notifications} />

      {showLeaderboard && (
        <FullLeaderboard 
          players={currentGame.players}
          currentPlayerId={currentPlayer.id}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Target Select Modal */}
      <TargetSelectModal
        isOpen={showTargetModal}
        onClose={handleTargetModalClose}
        onSelectTarget={handleTargetSelect}
        availableTargets={getAvailableTargets()}
        taskText={selectedTask?.text || ''}
        isReverse={(selectedTask as any)?.resultType === 'failed'}
      />

      {responseClaim && (
        <DisputeModal
          dispute={responseClaim}
          accuserName={currentGame.players.find(p => p.id === responseClaim.accuserId)?.name}
          taskText={currentGame.players
            .flatMap(p => p.tasks || [])
            .find(task => task.id === responseClaim.taskInstanceId)?.text}
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
          title="Missions Live"
          subtitle={`case file ${currentGame.id} · trust no one`}
          tone="amber"
          durationMs={1900}
          onDone={() => setShowIntro(false)}
        />
      )}

      {slam && (
        <StampSplash
          title={slam.title}
          subtitle={slam.subtitle}
          tone={slam.tone}
          onDone={() => setSlam(null)}
        />
      )}
    </div>
  );
}
