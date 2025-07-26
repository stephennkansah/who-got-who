import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { TaskInstance, Player } from '../types';
import CardDeck from './CardDeck';
import TargetSelectModal from './TargetSelectModal';

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, claimGotcha } = useGame();
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);

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
            <div className="task-id">#{task.id.slice(-3)}</div>
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
          
          {task.tips && (
            <div className="task-tips">
              💡 {task.tips}
            </div>
          )}
          
          {task.status === 'completed' && task.targetId && (
            <div className="task-target">
              🎯 Target: {currentGame?.players.find(p => p.id === task.targetId)?.name || 'Unknown'}
            </div>
          )}
          
          {task.status === 'pending' && (
            <div className="task-actions-hint">
              👆 Swipe up to mark as PASSED • 👇 Swipe down to mark as FAILED
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

  const endGame = () => {
    navigate(`/recap/${gameId}`);
  };

  const taskCards = createTaskCards();

  return (
    <div className="container">
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '1.5rem',
        padding: '1rem 0'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '800'
        }}>
          Who Got Who
        </h1>
        <div style={{ color: '#666', fontSize: '1rem', fontWeight: '600' }}>
          Game in Progress • {currentGame.players.length} players
        </div>
      </div>

      {/* Game Status */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4caf50', marginBottom: '0.5rem' }}>🎮 Game Live!</h2>
          <p style={{ color: '#666', margin: 0 }}>
            Complete your stealth tasks and say "Gotcha!" when you succeed
          </p>
        </div>
      </div>

      {/* Task Cards */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
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

      {/* Leaderboard */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#333'
        }}>
          🏆 Leaderboard
        </h3>
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

      {/* End Game Button (for testing) */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-danger"
            onClick={endGame}
            style={{ fontSize: '1rem' }}
          >
            🏁 End Game
          </button>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
            Click when all tasks are complete or time is up
          </p>
        </div>
      </div>

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