import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { TaskInstance, Player } from '../types';
import CardDeck from './CardDeck';
import TargetSelectModal from './TargetSelectModal';

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, claimGotcha, disputeGotcha, acceptGotcha, forceGameState, simulateScore, updatePlayerTasks } = useGame();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTestingTools, setShowTestingTools] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);

  const currentGame = state.currentGame!;
  const currentPlayer = state.currentPlayer!;

  useEffect(() => {
    if (!currentGame || !currentPlayer) {
      navigate('/');
      return;
    }

    if (currentGame.status === 'draft') {
      navigate(`/lobby/${gameId}`);
    } else if (currentGame.status === 'ended') {
      navigate(`/recap/${gameId}`);
    }
  }, [currentGame, currentPlayer, navigate, gameId]);

  if (!currentGame || !currentPlayer) {
    return (
      <div className="container">
        <div className="card">
          <p>⏳ Loading game...</p>
        </div>
      </div>
    );
  }

  const getCurrentScore = () => {
    return currentPlayer.score || 0;
  };

  // Filter tasks to only show truly pending ones
  const getPendingTasks = () => {
    return currentPlayer.tasks.filter((task: TaskInstance) => task.status === 'pending');
  };

  const getCompletedTasks = () => {
    return currentPlayer.tasks.filter((task: TaskInstance) => task.status === 'completed');
  };

  const getFailedTasks = () => {
    return currentPlayer.tasks.filter((task: TaskInstance) => task.status === 'failed');
  };

  const getAvailableTargets = (): Player[] => {
    return currentGame.players.filter(p => p.id !== currentPlayer.id);
  };

  // Handle manual task completion (pass/fail)
  const handleTaskResult = async (taskId: string, result: 'completed' | 'failed') => {
    if (!currentPlayer) return;
    
    const task = currentPlayer.tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'pending') {
      // Task already has a result - don't allow duplicate unless disputed
      if (task && task.status !== 'disputed') {
        console.log('Task already has a result:', task.status);
        return;
      }
    }

    if (result === 'completed') {
      // For completed tasks, open target selection modal
      if (task) {
        setSelectedTask(task);
        setShowTargetModal(true);
      }
    } else {
      // For failed tasks, use existing claimGotcha with special "failed" target
      await claimGotcha(taskId, 'failed');
    }
  };

  // Update existing handleTargetSelect to work with new flow
  const handleTargetSelect = async (targetId: string) => {
    if (!selectedTask || !currentPlayer) return;

    // Use existing claimGotcha function
    await claimGotcha(selectedTask.id, targetId);
    
    // Award points manually for now
    simulateScore?.(1);
    
    setShowTargetModal(false);
    setSelectedTask(null);
  };

  const handleSwapTask = (taskId: string) => {
    console.log('Swap task:', taskId);
  };

  // Create cards for all tasks showing their current status
  const createTaskCards = () => {
    return currentPlayer.tasks.map(task => {
      const isPending = task.status === 'pending';
      const isCompleted = task.status === 'completed';
      const isFailed = task.status === 'failed';
      
      return {
        id: task.id,
        onSwipeLeft: isPending ? () => {
          const currentIndex = currentPlayer.tasks.findIndex(t => t.id === task.id);
          const nextIndex = (currentIndex + 1) % currentPlayer.tasks.length;
          setCurrentCardIndex(nextIndex);
        } : undefined,
        onSwipeRight: isPending ? () => {
          const currentIndex = currentPlayer.tasks.findIndex(t => t.id === task.id);
          const prevIndex = currentIndex === 0 ? currentPlayer.tasks.length - 1 : currentIndex - 1;
          setCurrentCardIndex(prevIndex);
        } : undefined,
        onSwipeUp: isPending ? () => handleTaskResult(task.id, 'completed') : undefined,
        onSwipeDown: isPending ? () => handleTaskResult(task.id, 'failed') : undefined,
        upAction: isPending ? '✅ PASS' : '',
        downAction: isPending ? '❌ FAIL' : '', 
        leftAction: isPending ? 'Next' : '',
        rightAction: isPending ? 'Previous' : '',
        content: (
          <div className="task-card-content">
            <div className="task-header">
              <h3>
                {isPending && 'Task'}
                {isCompleted && '✅ Completed'}
                {isFailed && '❌ Failed'}
              </h3>
            </div>
            <div className="task-text">
              <p>{task.text}</p>
            </div>
            
            {/* Show result for completed/failed tasks */}
            {isCompleted && task.targetId && (
              <div style={{ 
                textAlign: 'center',
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(76, 175, 80, 0.1)',
                borderRadius: '15px',
                border: '2px solid rgba(76, 175, 80, 0.3)'
              }}>
                <p style={{ 
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#2E7D32'
                }}>
                  🎯 Got: {currentGame.players.find(p => p.id === task.targetId)?.name || 'Unknown'}
                </p>
              </div>
            )}
            
            {isFailed && (
              <div style={{ 
                textAlign: 'center',
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(244, 67, 54, 0.1)',
                borderRadius: '15px',
                border: '2px solid rgba(244, 67, 54, 0.3)'
              }}>
                <p style={{ 
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#C62828'
                }}>
                  💥 Task Failed
                </p>
              </div>
            )}

            {task.tips && isPending && (
              <div className="task-footer">
                <div className="task-tips">
                  <p>💡 {task.tips}</p>
                </div>
              </div>
            )}
            
            {/* Swipe Instructions for pending tasks only */}
            {isPending && (
              <div style={{ 
                textAlign: 'center',
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(74, 144, 226, 0.05)',
                borderRadius: '15px',
                border: '2px dashed rgba(74, 144, 226, 0.2)'
              }}>
                <p style={{ 
                  margin: 0,
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: '#4A90E2',
                  lineHeight: '1.6'
                }}>
                  ⬆️ <strong>Swipe UP</strong> if you completed this task<br/>
                  ⬇️ <strong>Swipe DOWN</strong> if you failed this task<br/>
                  ← → Swipe LEFT/RIGHT to see other tasks
                </p>
              </div>
            )}
          </div>
        )
      };
    });
  };

  const taskCards = createTaskCards();

  const endGame = () => {
    if (currentGame.status === 'live') {
      forceGameState?.('ended');
    }
  };

  return (
    <div className="container">
      {/* Compact Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '1.5rem',
        padding: '1rem 0'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '0.5rem',
          color: 'white',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          fontWeight: '900',
          textTransform: 'uppercase'
        }}>
          WHO GOT WHO
        </h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            color: 'white',
            fontWeight: '700',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            🏆 {currentPlayer?.score || 0} Points
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #E8F5E8, #C8E6C9)',
        border: '2px solid rgba(76, 175, 80, 0.3)',
        color: '#2E7D32',
        marginBottom: '1rem'
      }}>
        <div className="flex flex-between">
          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '800'
            }}>
              🎮 Live Game
            </h3>
            <div style={{ fontWeight: '600' }}>
              <div>🎯 <strong>Target:</strong> 4 Gotchas to win</div>
              <div>👥 <strong>Players:</strong> {currentGame.players.length}</div>
            </div>
          </div>
          <div style={{ 
            background: 'rgba(46, 125, 50, 0.1)',
            padding: '1rem',
            borderRadius: '15px',
            textAlign: 'center',
            minWidth: '80px'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
              {getPendingTasks().length}
            </div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>
              Tasks Left
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <h3 style={{ 
          fontSize: '1.2rem', 
          marginBottom: '1rem',
          textTransform: 'uppercase',
          fontWeight: '800',
          color: '#4A90E2'
        }}>
          🏆 Leaderboard
        </h3>
        <div>
          {currentGame.players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div 
                key={player.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  background: index === 0 
                    ? 'linear-gradient(135deg, #FFD700, #FFC107)' 
                    : player.id === currentPlayer?.id
                    ? 'linear-gradient(135deg, #E3F2FD, #BBDEFB)'
                    : 'linear-gradient(135deg, #F5F5F5, #EEEEEE)',
                  border: index === 0 
                    ? '2px solid rgba(255, 193, 7, 0.5)' 
                    : player.id === currentPlayer?.id
                    ? '2px solid rgba(33, 150, 243, 0.3)'
                    : '2px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '15px',
                  color: index === 0 ? '#333333' : player.id === currentPlayer?.id ? '#1976D2' : '#333333',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    minWidth: '24px'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </span>
                  <span style={{ 
                    fontWeight: '700',
                    fontSize: player.id === currentPlayer?.id ? '1.1rem' : '1rem'
                  }}>
                    {player.name}
                  </span>
                  {player.isHost && <span style={{ fontSize: '0.8rem' }}>👑</span>}
                  {player.id === currentPlayer?.id && (
                    <span style={{ 
                      background: 'rgba(0, 0, 0, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      YOU
                    </span>
                  )}
                </div>
                <div style={{ 
                  fontSize: '1.2rem',
                  fontWeight: '800',
                  background: 'rgba(0, 0, 0, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  minWidth: '60px',
                  textAlign: 'center'
                }}>
                  {player.score}
                </div>
              </div>
          ))}
        </div>
      </div>

      {/* All Tasks - Single Deck View */}
      {currentPlayer && (
        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              margin: 0,
              textTransform: 'uppercase',
              fontWeight: '800',
              color: '#4A90E2'
            }}>
              🎯 Your Tasks
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #FF9800, #FFB74D)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {getPendingTasks().length} / {currentPlayer.tasks.length}
            </div>
          </div>

          <CardDeck
            cards={createTaskCards()}
            maxVisible={1}
            emptyState={
              <div className="empty-deck">
                <div className="empty-deck-icon">🎉</div>
                <p style={{ fontWeight: '600' }}>No tasks assigned!</p>
              </div>
            }
          />
        </div>
      )}

      {/* Testing Tools */}
      <div className="card card-test">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            margin: 0,
            textTransform: 'uppercase',
            fontWeight: '800'
          }}>
            🔧 Demo Tools
          </h3>
          <button
            className="btn btn-small"
            onClick={() => setShowTestingTools(!showTestingTools)}
            style={{ 
              background: 'rgba(123, 31, 162, 0.2)',
              color: '#7B1FA2',
              border: '2px solid rgba(123, 31, 162, 0.3)',
              minHeight: '32px',
              fontSize: '0.7rem'
            }}
          >
            {showTestingTools ? '▼' : '▶'}
          </button>
        </div>
        
        {showTestingTools && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => simulateScore?.(1)}
              style={{ fontSize: '0.7rem' }}
            >
              +1 Point
            </button>
            <button
              className="btn btn-danger btn-small"
              onClick={() => simulateScore?.(-1)}
              style={{ fontSize: '0.7rem' }}
            >
              -1 Point
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={endGame}
              style={{ fontSize: '0.7rem' }}
            >
              🏁 End Game
            </button>
          </div>
        )}
      </div>

      {/* Target Select Modal */}
      <TargetSelectModal
        isOpen={showTargetModal}
        onClose={() => {
          setShowTargetModal(false);
          setSelectedTask(null);
        }}
        onSelectTarget={handleTargetSelect}
        availableTargets={getAvailableTargets()}
        taskText={selectedTask?.text || ''}
      />
    </div>
  );
} 