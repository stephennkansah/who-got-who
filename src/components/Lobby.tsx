import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Player, TaskInstance } from '../types';
import CardDeck from './CardDeck';

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, lockInPlayer, swapTask, startGame, forceGameState, simulateScore } = useGame();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [showTestingTools, setShowTestingTools] = useState(false);

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const isHost = currentPlayer?.isHost || false;
  const allPlayersLocked = currentGame?.players.every(p => p.lockedIn) || false;
  const canStart = allPlayersLocked && (currentGame?.players.length || 0) >= 3;

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    // TODO: Join game if not already joined
    if (!currentGame || currentGame.id !== gameId) {
      // Auto-join logic here
    }
  }, [gameId, currentGame, navigate]);

  useEffect(() => {
    // Navigate to game when it starts
    if (currentGame?.status === 'live') {
      navigate(`/game/${gameId}`);
    }
  }, [currentGame?.status, gameId, navigate]);

  const handleLockIn = async () => {
    await lockInPlayer();
  };

  const handleSwapTask = async (taskId: string) => {
    if (!currentPlayer || currentPlayer.swapsLeft <= 0) {
      console.log('No swaps remaining');
      return;
    }
    
    await swapTask(taskId);
  };

  const handleStartGame = async () => {
    if (isHost && canStart) {
      await startGame();
    }
  };

  const getSwapButtonText = () => {
    if (!currentPlayer || currentPlayer.swapsLeft <= 0) return 'No swaps left';
    return `Swap (${currentPlayer.swapsLeft} left)`;
  };

  // Create cards for the deck
  const createTaskCards = () => {
    if (!currentPlayer) return [];
    
    return currentPlayer.tasks.map(task => ({
      id: task.id,
      onSwipeLeft: undefined,
      onSwipeRight: undefined,
      onSwipeUp: undefined,
      onSwipeDown: undefined,
      leftAction: '',
      rightAction: '',
      upAction: '',
      downAction: '',
      content: (
        <div className="task-card-content">
          <div className="task-header">
            <h3>Task</h3>
          </div>
          <div className="task-text">
            <p>{task.text}</p>
          </div>
          {task.tips && (
            <div className="task-footer">
              <div className="task-tips">
                <p>💡 {task.tips}</p>
              </div>
            </div>
          )}
          
          {/* Swap Button for Cards */}
          {currentPlayer.swapsLeft > 0 && (
            <div style={{ 
              textAlign: 'center',
              marginTop: '1.5rem'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleSwapTask(task.id)}
                style={{ 
                  fontSize: '1rem',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #FF9800, #FFB74D)',
                  color: 'white',
                  fontWeight: '700'
                }}
              >
                🔄 {getSwapButtonText()}
              </button>
              <p style={{ 
                margin: '0.5rem 0 0 0',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#666'
              }}>
                {currentPlayer.swapsLeft} swaps remaining
              </p>
            </div>
          )}
          
          {/* No Swaps Left Message */}
          {currentPlayer.swapsLeft === 0 && (
            <div style={{ 
              textAlign: 'center',
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '15px',
              border: '2px solid rgba(0, 0, 0, 0.1)'
            }}>
              <p style={{ 
                margin: 0,
                fontSize: '0.9rem',
                fontWeight: '700',
                color: '#666'
              }}>
                🔒 No swaps remaining
              </p>
              <p style={{ 
                margin: '0.5rem 0 0 0',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#999'
              }}>
                You're locked in with this task
              </p>
            </div>
          )}
        </div>
      )
    }));
  };

  const taskCards = createTaskCards();

  if (!currentGame || !currentPlayer) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="card">
          <h2>Loading...</h2>
          <p>Connecting to game...</p>
        </div>
      </div>
    );
  }

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
            👥 {currentGame.players.length} Players
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
        border: '2px solid rgba(33, 150, 243, 0.3)',
        color: '#1976D2',
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
              🎮 Lobby Phase
            </h3>
            <div style={{ fontWeight: '600' }}>
              <div>📦 <strong>Pack:</strong> Core Pack A</div>
              <div>🎯 <strong>Mode:</strong> {currentGame.mode.toUpperCase()}</div>
              <div>🔄 <strong>Swaps:</strong> {currentGame.mode === 'casual' ? '2 per player' : '1 per player'}</div>
            </div>
          </div>
          <div style={{ 
            background: 'rgba(25, 118, 210, 0.1)',
            padding: '1rem',
            borderRadius: '15px',
            textAlign: 'center',
            minWidth: '80px'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
              {currentGame.id}
            </div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>
              Game ID
            </div>
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="card">
        <h3 style={{ 
          fontSize: '1.2rem', 
          marginBottom: '1rem',
          textTransform: 'uppercase',
          fontWeight: '800',
          color: '#4A90E2'
        }}>
          👥 Players
        </h3>
        {currentGame.players.map(player => (
          <div 
            key={player.id} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              marginBottom: '0.5rem',
              background: player.lockedIn 
                ? 'linear-gradient(135deg, #E8F5E8, #C8E6C9)' 
                : 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
              border: player.lockedIn 
                ? '2px solid rgba(76, 175, 80, 0.3)' 
                : '2px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '15px',
              color: player.lockedIn ? '#2E7D32' : '#C62828',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>
                {player.isHost ? '👑' : player.lockedIn ? '✅' : '⏳'}
              </span>
              <span style={{ 
                fontWeight: '700',
                fontSize: player.id === currentPlayer?.id ? '1.1rem' : '1rem'
              }}>
                {player.name}
              </span>
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
              fontSize: '0.8rem',
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>
              {player.lockedIn ? 'READY!' : 'WAITING...'}
            </div>
          </div>
        ))}
      </div>

      {/* Your Tasks */}
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
              background: 'linear-gradient(135deg, #FFD700, #FFC107)',
              color: '#333333',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {currentPlayer.swapsLeft} Swaps Left
            </div>
          </div>

          <CardDeck
            cards={createTaskCards()}
            maxVisible={3}
            emptyState={
              <div className="empty-deck">
                <div className="empty-deck-icon">🎯</div>
                <p style={{ fontWeight: '600' }}>No tasks assigned yet!</p>
              </div>
            }
          />
        </div>
      )}

      {/* Host Controls */}
      {currentPlayer?.isHost && (
        <div className="card card-success">
          <h3 style={{ 
            fontSize: '1.2rem', 
            marginBottom: '1rem',
            textTransform: 'uppercase',
            fontWeight: '800'
          }}>
            👑 Host Controls
          </h3>
          <button
            className="btn btn-success"
            onClick={startGame}
            disabled={state.isLoading}
            style={{ 
              fontSize: '1.1rem',
              marginBottom: '1rem'
            }}
          >
            {state.isLoading ? '🔄 Starting Game...' : '🚀 Start Game'}
          </button>
          <div style={{ 
            background: 'rgba(46, 125, 50, 0.1)',
            padding: '1rem',
            borderRadius: '15px',
            fontWeight: '600'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              ✅ <strong>Ready:</strong> {currentGame.players.filter(p => p.lockedIn).length}
            </div>
            <div>
              ⏳ <strong>Waiting:</strong> {currentGame.players.filter(p => !p.lockedIn).length}
            </div>
          </div>
        </div>
      )}

      {/* Player Actions */}
      {currentPlayer && !currentPlayer.lockedIn && (
        <div className="card">
          <h3 style={{ 
            fontSize: '1.2rem', 
            marginBottom: '1rem',
            textTransform: 'uppercase',
            fontWeight: '800',
            color: '#4A90E2'
          }}>
            🎮 Player Actions
          </h3>
          <button
            className="btn"
            onClick={lockInPlayer}
            disabled={state.isLoading}
            style={{ 
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
              animation: 'pulse 2s infinite'
            }}
          >
            {state.isLoading ? '🔄 Locking In...' : '✅ Lock In & Ready Up!'}
          </button>
          <p style={{ 
            marginTop: '1rem', 
            textAlign: 'center',
            fontWeight: '600',
            color: '#666'
          }}>
            Review your tasks and swap any you don't like before locking in.
          </p>
        </div>
      )}

      {/* Share Game */}
      <div className="card card-demo">
        <h3 style={{ 
          fontSize: '1rem', 
          marginBottom: '1rem',
          textTransform: 'uppercase',
          fontWeight: '800'
        }}>
          📤 Share Game
        </h3>
        <div style={{ 
          background: 'rgba(25, 118, 210, 0.1)',
          padding: '1rem',
          borderRadius: '15px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: '900',
            marginBottom: '0.5rem',
            color: '#1976D2'
          }}>
            {currentGame.id}
          </div>
          <div style={{ 
            fontSize: '0.8rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: '#1976D2'
          }}>
            Game ID
          </div>
        </div>
        <p style={{ 
          textAlign: 'center',
          fontWeight: '600',
          marginBottom: '1rem'
        }}>
          <strong>Share this Game ID</strong> with friends to join!
        </p>
        <div style={{ 
          fontSize: '0.8rem',
          fontWeight: '600',
          color: '#666',
          textAlign: 'center'
        }}>
          💡 Tip: Use incognito windows to test multiplayer locally
        </div>
      </div>

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
              onClick={() => forceGameState?.('live')}
              style={{ fontSize: '0.7rem' }}
            >
              ⚡ Skip to Live
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => forceGameState?.('ended')}
              style={{ fontSize: '0.7rem' }}
            >
              🏁 Skip to End
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 