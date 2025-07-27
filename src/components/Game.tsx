import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { TaskInstance, Player } from '../types';
import CardDeck from './CardDeck';
import TargetSelectModal from './TargetSelectModal';

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, claimGotcha, endGame: endGameContext, leaveGame, swapTask } = useGame();
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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

  const handleTaskResult = (task: TaskInstance, result: 'passed' | 'failed') => {
    if (result === 'passed') {
      // Show target selection modal
      setSelectedTask(task);
      setShowTargetModal(true);
    } else {
      // Mark as failed - use special "failed" target ID
      if (task) {
        claimGotcha(task.id, 'failed');
      }
    }
  };

  const handleSwapTask = async (taskId: string) => {
    if (!currentPlayer || currentPlayer.swapsLeft <= 0) return;
    
    const confirmed = window.confirm(
      `Replace this task with a new one?\n\nSwaps remaining: ${currentPlayer.swapsLeft - 1}/2`
    );
    
    if (confirmed) {
      await swapTask(taskId);
    }
  };

  const handleTargetSelect = async (targetId: string) => {
    if (selectedTask) {
      await claimGotcha(selectedTask.id, targetId);
      setShowTargetModal(false);
      setSelectedTask(null);
    }
  };

  const handleTargetModalClose = () => {
    setShowTargetModal(false);
    setSelectedTask(null);
  };

  const getAvailableTargets = (): Player[] => {
    if (!currentGame || !currentPlayer) return [];
    return currentGame.players.filter(p => p.id !== currentPlayer.id);
  };

  // Create cards for Game Deck
  const createTaskCards = () => {
    if (!currentPlayer?.tasks) return [];
    
    return currentPlayer.tasks.map(task => ({
      id: task.id,
      onSwipeLeft: undefined,
      onSwipeRight: undefined, 
      onSwipeUp: task.status === 'pending' ? () => handleTaskResult(task, 'passed') : undefined,
      onSwipeDown: task.status === 'pending' ? () => handleTaskResult(task, 'failed') : undefined,
      leftAction: '',
      rightAction: '',
      upAction: task.status === 'pending' ? 'Pass' : '',
      downAction: task.status === 'pending' ? 'Fail' : '',
      content: (
        <div className="task-card-content">
          <div className="task-header">
            <div className={`task-status ${task.status}`}>
              {task.status === 'completed' && '✅ Passed'}
              {task.status === 'failed' && '❌ Failed'} 
              {task.status === 'pending' && '⏳ Pending'}
              {task.status === 'disputed' && '⚠️ Disputed'}
            </div>
          </div>
          
          <div className="task-text">
            {task.text}
          </div>
          
          {task.status === 'completed' && task.targetId && (
            <div className="task-target">
              🎯 Target: {currentGame?.players.find(p => p.id === task.targetId)?.name || 'Unknown'}
            </div>
          )}
          
          {task.status === 'pending' && (
            <div className="task-actions-hint">
              👆 PASS • 👇 FAIL
            </div>
          )}

          {task.status === 'pending' && (
            <div className="task-swap-section">
              <button 
                className={`swap-task-btn ${currentPlayer.swapsLeft <= 0 ? 'disabled' : ''}`}
                onClick={() => handleSwapTask(task.id)}
                disabled={currentPlayer.swapsLeft <= 0}
              >
                🔄 Swap Task ({currentPlayer.swapsLeft}/2)
              </button>
            </div>
          )}
        </div>
      )
    }));
  };

  if (!currentGame || !currentPlayer) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="card">
          <h2>Loading...</h2>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  const handleEndGame = async () => {
    await endGameContext();
    navigate(`/recap/${gameId}`);
  };

  const handleLeaveGame = async () => {
    await leaveGame();
    navigate('/');
  };

  const taskCards = createTaskCards();

  return (
    <div className="container">
      {/* Compact Header with Controls */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0.5rem 0'
      }}>
        {/* Left: Leaderboard Position */}
        <button 
          onClick={() => setShowLeaderboard(true)}
          style={{
            background: 'linear-gradient(135deg, #ffd700, #ffb347)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: '700',
            color: '#8b4513',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(255, 215, 0, 0.3)'
          }}
        >
          <div style={{ fontSize: '1rem' }}>
            {currentGame.players.sort((a, b) => b.score - a.score).findIndex(p => p.id === currentPlayer.id) === 0 ? '🥇' :
             currentGame.players.sort((a, b) => b.score - a.score).findIndex(p => p.id === currentPlayer.id) === 1 ? '🥈' :
             currentGame.players.sort((a, b) => b.score - a.score).findIndex(p => p.id === currentPlayer.id) === 2 ? '🥉' :
             `#${currentGame.players.sort((a, b) => b.score - a.score).findIndex(p => p.id === currentPlayer.id) + 1}`}
          </div>
          <div style={{ fontSize: '0.6rem' }}>
            {currentPlayer.score}
          </div>
        </button>

        {/* Center: Title */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ 
            fontSize: '1.3rem', 
            margin: '0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800'
          }}>
            Who Got Who
          </h1>
          <div style={{ color: '#666', fontSize: '0.75rem', fontWeight: '600' }}>
            {currentGame.players.length} players
          </div>
        </div>

        {/* Right: Game Controls */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {currentPlayer?.isHost && (
            <button
              onClick={handleEndGame}
              style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(255, 107, 107, 0.3)'
              }}
              title="End Game"
            >
              🏁
            </button>
          )}
          <button
            onClick={handleLeaveGame}
            style={{
              background: 'linear-gradient(135deg, #6c757d, #495057)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)'
            }}
            title="Leave Game"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Combined Game Info */}
      <div className="card" style={{ 
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #ffebf0 100%)',
        border: '1px solid #ff6b9d',
        padding: '0.75rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '0.9rem', 
            marginBottom: '0.3rem',
            fontWeight: '600',
            color: '#4caf50'
          }}>
            🎮 Complete stealth tasks • Say "Gotcha!" when you succeed
          </div>
          <div style={{ 
            color: '#8b2635', 
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            🕵️ <strong>Don't get caught or it's an auto-fail!</strong> Stay sneaky! 🤫
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ 
          fontSize: '1.2rem', 
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#333'
        }}>
          Your Tasks
        </h2>
        
        <CardDeck 
          cards={taskCards}
          emptyState={
            <div className="empty-deck">
              <div className="empty-deck-icon">🎯</div>
              <p style={{ fontWeight: '600' }}>All tasks completed!</p>
            </div>
          }
        />
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '70vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#333' }}>🏆 Leaderboard</h3>
              <button
                onClick={() => setShowLeaderboard(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentGame.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={player.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: player.id === currentPlayer.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    border: player.id === currentPlayer.id ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '1.2rem' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>
                          {player.name} {player.id === currentPlayer.id && '(You)'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {player.tasks.filter(t => t.status === 'completed').length} completed
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: index === 0 ? '#ffd700' : '#333'
                    }}>
                      {player.score}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Target Select Modal */}
      <TargetSelectModal
        isOpen={showTargetModal}
        onClose={handleTargetModalClose}
        onSelectTarget={handleTargetSelect}
        availableTargets={getAvailableTargets()}
        taskText={selectedTask?.text || ''}
        isReverse={false}
      />
    </div>
  );
} 