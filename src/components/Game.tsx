import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { TaskInstance, Player } from '../types';
import TaskListView from './TaskListView';
import TargetSelectModal from './TargetSelectModal';
import FirebaseService from '../services/firebase';

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, claimGotcha, endGame: endGameContext, leaveGame, swapTask } = useGame();
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  // Removed viewMode - only list view now
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: string}>>([]);

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
    
    const confirmed = window.confirm(
      `Replace this task with a new one?\n\nSwaps remaining: ${currentPlayer.swapsLeft - 1}/2`
    );
    
    if (confirmed) {
      await swapTask(taskId);
    }
  };

  const handleTargetSelect = async (targetId: string) => {
    if (selectedTask) {
      const resultType = (selectedTask as any)?.resultType;
      
      if (resultType === 'failed') {
        // Task failed - mark as failed and record who caught you
        // We need to update the claimGotcha function to handle this case
        // For now, let's create a custom update
        if (state.currentPlayer && state.currentGame) {
          await FirebaseService.updatePlayerTask(
            state.currentGame.id,
            state.currentPlayer.id,
            selectedTask.id,
            { 
              status: 'failed', 
              targetId, // Who caught you
              gotAt: new Date() 
            }
          );
        }
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

  // Removed createTaskCards - using TaskListView only

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

  // Removed taskCards - using TaskListView only

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
            {(() => {
              if (!currentGame?.players || !currentPlayer) return '#-';
              const sortedPlayers = currentGame.players.sort((a, b) => b.score - a.score);
              const rank = sortedPlayers.findIndex(p => p.id === currentPlayer.id);
              if (rank === 0) return '🥇';
              if (rank === 1) return '🥈';
              if (rank === 2) return '🥉';
              return `#${rank + 1}`;
            })()}
          </div>
          <div style={{ fontSize: '0.6rem' }}>
            {currentPlayer?.score || 0}
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

      {/* Compact Top 3 Leaderboard */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div 
          onClick={() => setShowLeaderboard(true)}
          style={{
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #ffd700, #ffed4a)',
            borderRadius: '12px',
            padding: '0.75rem',
            marginBottom: '1rem',
            border: '2px solid #f59e0b',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ 
            textAlign: 'center', 
            fontSize: '0.9rem', 
            fontWeight: '700',
            color: '#8b4513',
            marginBottom: '0.5rem'
          }}>
            🏆 LEADERBOARD - Click for Game Summary
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {(() => {
              if (!currentGame?.players) return <div>Loading...</div>;
              const sortedPlayers = [...currentGame.players].sort((a, b) => b.score - a.score);
              const topThree = sortedPlayers.slice(0, 3);
              
              return topThree.map((player, index) => (
                <div key={player.id} style={{
                  flex: '1',
                  textAlign: 'center',
                  background: player.id === currentPlayer?.id 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  border: player.id === currentPlayer?.id 
                    ? '2px solid #3b82f6' 
                    : '1px solid rgba(139, 69, 19, 0.2)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.2rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.1rem' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ 
                    color: '#8b4513',
                    fontWeight: '700',
                    fontSize: '0.7rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {player.name}
                    {player.id === currentPlayer?.id && ' (You)'}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: '800',
                    color: '#8b4513'
                  }}>
                    {player.score}
                  </div>
                </div>
              ));
            })()}
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
        
        <TaskListView 
          tasks={currentPlayer.tasks}
          players={currentGame.players}
          onTaskResult={handleTaskResult}
          onSwapTask={handleSwapTask}
          swapsLeft={currentPlayer.swapsLeft}
        />
      </div>

      {/* Notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '300px'
      }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              fontSize: '0.9rem',
              fontWeight: '600',
              animation: 'slideInRight 0.3s ease-out',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {notification.message}
          </div>
        ))}
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
              <h3 style={{ margin: 0, color: '#333' }}>🏆 Game Summary</h3>
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

            {/* Game Summary Section */}
            {(() => {
              if (!currentGame?.players) return <div>Loading game data...</div>;
              
              // Get all completed tasks across all players
              const allCompletions = currentGame.players.flatMap(player => 
                player.tasks
                  .filter(task => (task.status === 'completed' || task.status === 'failed') && task.targetId)
                  .map(task => ({
                    ...task,
                    playerName: player.name,
                    playerId: player.id,
                    targetName: currentGame.players.find(p => p.id === task.targetId)?.name || 'Unknown',
                    isSuccess: task.status === 'completed'
                  }))
              ).sort((a, b) => new Date(b.gotAt || 0).getTime() - new Date(a.gotAt || 0).getTime());

              return (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    margin: '0 0 0.75rem 0',
                    color: '#333',
                    fontSize: '1rem',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}>
                    📊 Recent Activity
                  </h4>
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    border: '1px solid #e9ecef'
                  }}>
                    {allCompletions.length > 0 ? (
                      allCompletions.slice(0, 8).map((completion, index) => (
                        <div key={`${completion.playerId}-${completion.id}-${index}`} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.4rem 0.5rem',
                          marginBottom: '0.3rem',
                          background: completion.isSuccess ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                          borderRadius: '8px',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            flex: 1
                          }}>
                            <span style={{ fontSize: '1rem' }}>
                              {completion.isSuccess ? '🎯' : '🚨'}
                            </span>
                            <div>
                              <div style={{ fontWeight: '600', color: '#333' }}>
                                {completion.playerName}
                              </div>
                              <div style={{ 
                                fontSize: '0.7rem', 
                                color: '#666',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {completion.text}
                              </div>
                            </div>
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: completion.isSuccess ? '#2e7d32' : '#c62828',
                            textAlign: 'right'
                          }}>
                            {completion.isSuccess ? 'Got' : 'Caught by'}
                            <br />
                            <strong>{completion.targetName}</strong>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#666', 
                        fontSize: '0.9rem',
                        padding: '1rem'
                      }}>
                        No completed tasks yet - game just started! 🎮
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

{(() => {
              if (!currentGame?.players) return <div>No players found</div>;
              const sortedPlayers = [...currentGame.players].sort((a, b) => b.score - a.score);
              const topThree = sortedPlayers.slice(0, 3);
              const others = sortedPlayers.slice(3);
              
              return (
                <div>
                  <h4 style={{ 
                    margin: '0 0 0.75rem 0',
                    color: '#333',
                    fontSize: '1rem',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}>
                    🏆 Current Rankings
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Top 3 Podium */}
                  {topThree.length > 0 && (
                    <div style={{ 
                      background: 'linear-gradient(135deg, #ffd700, #ffed4a)',
                      borderRadius: '16px',
                      padding: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 0.75rem 0', 
                        textAlign: 'center',
                        color: '#8b4513',
                        fontSize: '1rem',
                        fontWeight: '700'
                      }}>
                        🏆 TOP PLAYERS
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {topThree.map((player, index) => (
                          <div key={player.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem',
                            background: player.id === currentPlayer.id 
                              ? 'rgba(59, 130, 246, 0.2)' 
                              : 'rgba(255, 255, 255, 0.7)',
                            borderRadius: '12px',
                            border: player.id === currentPlayer.id 
                              ? '2px solid #3b82f6' 
                              : '1px solid rgba(139, 69, 19, 0.2)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ 
                                fontSize: '2rem',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                              }}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </div>
                              <div>
                                <div style={{ 
                                  fontWeight: '700',
                                  fontSize: '1.1rem',
                                  color: '#8b4513'
                                }}>
                                  {player.name} {player.id === currentPlayer.id && '(You)'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#a16207' }}>
                                  {player.tasks.filter(t => t.status === 'completed').length} tasks completed
                                </div>
                              </div>
                            </div>
                            <div style={{
                              fontSize: '1.5rem',
                              fontWeight: '900',
                              color: '#8b4513',
                              background: 'rgba(255, 255, 255, 0.8)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '8px',
                              border: '2px solid rgba(139, 69, 19, 0.3)'
                            }}>
                              {player.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Other Players */}
                  {others.length > 0 && (
                    <div>
                      <h4 style={{ 
                        margin: '0 0 0.5rem 0',
                        color: '#666',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        OTHER PLAYERS
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {others.map((player, index) => (
                          <div key={player.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            background: player.id === currentPlayer.id 
                              ? 'rgba(59, 130, 246, 0.1)' 
                              : 'rgba(0,0,0,0.02)',
                            borderRadius: '8px',
                            border: player.id === currentPlayer.id 
                              ? '2px solid rgba(59, 130, 246, 0.3)' 
                              : '1px solid rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ 
                                fontSize: '0.9rem',
                                color: '#666',
                                fontWeight: '600',
                                minWidth: '24px'
                              }}>
                                {index + 4}.
                              </div>
                              <div>
                                <div style={{ fontWeight: '600' }}>
                                  {player.name} {player.id === currentPlayer.id && '(You)'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                  {player.tasks.filter(t => t.status === 'completed').length} completed
                                </div>
                              </div>
                            </div>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '700',
                              color: '#333'
                            }}>
                              {player.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              );
            })()}
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
        isReverse={(selectedTask as any)?.resultType === 'failed'}
      />
    </div>
  );
} 