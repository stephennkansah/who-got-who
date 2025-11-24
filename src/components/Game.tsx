import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { TaskInstance, Player } from '../types';
import TaskListView from './TaskListView';
import TargetSelectModal from './TargetSelectModal';

// Sub-components
import { GameHeader } from './game/GameHeader';
import { LeaderboardWidget } from './game/LeaderboardWidget';
import { GameNotifications } from './game/GameNotifications';
import { FullLeaderboard } from './game/FullLeaderboard';
import { ConfirmationModal } from './common/ConfirmationModal';

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, claimGotcha, endGame: endGameContext, leaveGame, swapTask } = useGame();
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: string}>>([]);
  
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
        const existingNotification = notifications.find(n => n.id === notificationId);
        if (!existingNotification && task.playerId !== currentPlayer.id) {
          const message = `🎯 ${task.playerName} got ${task.targetName}!`;
          
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
  }, [currentGame?.players, currentPlayer, notifications]);

  const handleTaskResult = (task: TaskInstance, result: 'passed' | 'failed') => {
    // Both passed and failed tasks need target selection
    // Store the result type with the task for the modal to handle
    const taskWithResult = { ...task, resultType: result };
    setSelectedTask(taskWithResult as TaskInstance);
    setShowTargetModal(true);
  };

  const handleSwapTask = async (taskId: string) => {
    if (!currentPlayer || currentPlayer.swapsLeft <= 0) return;
    
    setConfirmation({
      isOpen: true,
      title: 'Swap Task?',
      message: `Replace this task with a new one?\n\nSwaps remaining: ${currentPlayer.swapsLeft - 1}/2`,
      onConfirm: async () => {
        await swapTask(taskId);
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      },
      confirmLabel: 'Swap Task'
    });
  };

  const handleTargetSelect = async (targetId: string) => {
    if (selectedTask) {
      const resultType = (selectedTask as any)?.resultType;
      
      if (resultType === 'failed') {
        // Task failed - use special failure handling
        await claimGotcha(selectedTask.id, `caught:${targetId}`);
      } else {
        // Task passed - mark as completed with target
        await claimGotcha(selectedTask.id, targetId);
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
      title: '🏁 End Game?',
      message: 'This will end the game for ALL players and show final results.\n\nThis action cannot be undone.',
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
      title: '🚪 Leave Game?',
      message: 'You will exit the current game and return to the home screen.\n\nOther players can continue without you.',
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
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p style={{ marginBottom: '30px', color: 'white' }}>Loading game...</p>
          
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            🏠 Back to Home
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

      {/* Combined Game Info */}
      <div className="card" style={{ 
        marginBottom: '1rem',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          fontSize: '0.9rem', 
          marginBottom: '0.3rem',
          fontWeight: '600',
          color: '#08d9d6' // Secondary Neon
        }}>
          🎮 Complete stealth tasks • Say "Gotcha!" when you succeed
        </div>
        <div style={{ 
          color: '#ff7675', // Danger Pastel
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          🕵️ <strong>Don't get caught or it's an auto-fail!</strong> Stay sneaky! 🤫
        </div>
      </div>

      <LeaderboardWidget 
        players={currentGame.players}
        currentPlayerId={currentPlayer.id}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* Task Cards */}
      <div className="card" style={{ 
        marginBottom: '1rem',
        background: 'rgba(255,255,255,0.02)' // Slightly darker for contrast
      }}>
        <h2 style={{ 
          fontSize: '1.2rem', 
          marginBottom: '1rem',
          textAlign: 'center',
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Your Tasks
        </h2>
        
        <TaskListView 
          tasks={currentPlayer.tasks}
          players={currentGame.players}
          onTaskResult={handleTaskResult}
          onSwapTask={handleSwapTask}
          swapsLeft={currentPlayer.swapsLeft}
        />
      </div>

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
    </div>
  );
}
