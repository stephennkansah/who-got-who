import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player, TaskInstance } from '../types';
import CardDeck from './CardDeck';

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, lockInPlayer, swapTask, startGame } = useGame();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showPlayerList, setShowPlayerList] = useState(false);

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const isHost = currentPlayer?.isHost || false;
  const allPlayersLocked = currentGame?.players.every(p => p.lockedIn) || false;
  const canStart = allPlayersLocked && (currentGame?.players.length || 0) >= 2;

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

  const handleStartGame = async () => {
    if (!isHost || !canStart) return;
    await startGame();
  };

  const handleSwapTask = async (taskId: string) => {
    if (!currentPlayer || currentPlayer.swapsLeft <= 0) return;
    await swapTask(taskId);
  };

  const getSwapButtonText = () => {
    if (!currentPlayer || currentPlayer.swapsLeft <= 0) return 'No swaps left';
    return `Swap (${currentPlayer.swapsLeft} left)`;
  };

  // Create cards for the deck
  const createTaskCards = () => {
    if (!currentPlayer || !currentPlayer.tasks) return [];
    
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
            <div className="task-id">#{task.id.slice(-3)}</div>
          </div>
          <div className="task-text">
            {task.text}
          </div>
          {task.tips && (
            <div className="task-tips">
              💡 {task.tips}
            </div>
          )}
          <div className="task-footer">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => handleSwapTask(task.id)}
              disabled={currentPlayer.swapsLeft <= 0}
              style={{ fontSize: '0.8rem' }}
            >
              {getSwapButtonText()}
            </button>
          </div>
        </div>
      )
    }));
  };

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

  const taskCards = createTaskCards();

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '800'
        }}>
          Who Got Who
        </h1>
        <div style={{ color: '#666', fontSize: '1rem', fontWeight: '600' }}>
          Lobby • {currentGame.players.length} player{currentGame.players.length !== 1 ? 's' : ''}
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
          Your Secret Tasks
        </h2>
        
        <CardDeck 
          cards={taskCards}
          emptyState={<div className="empty-deck">No tasks available</div>}
        />
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1rem',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          💡 Swipe through your tasks and use swaps if needed
        </div>
      </div>

      {/* Players Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            margin: 0,
            color: '#333'
          }}>
            Players ({currentGame.players.length})
          </h3>
          <button
            className="btn btn-small"
            onClick={() => setShowPlayerList(!showPlayerList)}
            style={{ fontSize: '0.8rem' }}
          >
            {showPlayerList ? 'Hide' : 'Show'} All
          </button>
        </div>
        
        {showPlayerList ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentGame.players.map((player: Player) => (
              <div key={player.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: player.id === currentPlayer.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.02)',
                borderRadius: '8px',
                border: player.id === currentPlayer.id ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(0,0,0,0.1)'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>
                    {player.name} {player.isHost && '👑'} {player.id === currentPlayer.id && '(You)'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    Swaps: {player.swapsLeft} • Tasks: {player.tasks.length}
                  </div>
                </div>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: player.lockedIn ? '#10b981' : '#f59e0b',
                  color: 'white'
                }}>
                  {player.lockedIn ? 'Ready' : 'Preparing'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#666' }}>
            {allPlayersLocked ? '✅ Everyone is ready!' : `⏳ ${currentGame.players.filter(p => !p.lockedIn).length} players still preparing...`}
          </div>
        )}
      </div>

      {/* Ready/Start Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          {!currentPlayer.lockedIn ? (
            <div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Review your tasks and swap any you don't like, then lock in when ready.
              </p>
              <button 
                className="btn btn-primary"
                onClick={handleLockIn}
                style={{ 
                  fontSize: '1.1rem',
                  padding: '0.75rem 2rem',
                  fontWeight: '700'
                }}
              >
                🔒 Lock In & Ready Up
              </button>
            </div>
          ) : (
            <div>
              <p style={{ color: '#10b981', fontWeight: '600', marginBottom: '1rem' }}>
                ✅ You're locked in and ready!
              </p>
              {isHost && canStart && (
                <button 
                  className="btn btn-success"
                  onClick={handleStartGame}
                  style={{ 
                    fontSize: '1.2rem',
                    padding: '0.75rem 2rem',
                    fontWeight: '700'
                  }}
                >
                  🚀 Start Game
                </button>
              )}
              {isHost && !canStart && (
                <p style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                  ⏳ Waiting for all players to lock in...
                </p>
              )}
              {!isHost && (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  ⏳ Waiting for host to start the game...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Game */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            fontSize: '1.2rem',
            fontWeight: '700',
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
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              navigator.clipboard.writeText(currentGame.id);
              alert('Game ID copied! Share this code with friends.');
            }}
            style={{ flex: 1, fontSize: '0.9rem' }}
          >
            📋 Copy ID
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              const gameUrl = `${window.location.origin}/?join=${currentGame.id}`;
              navigator.clipboard.writeText(gameUrl);
              alert('Game link copied! Share this link via WhatsApp, email, etc.');
            }}
            style={{ flex: 1, fontSize: '0.9rem' }}
          >
            🔗 Copy Link
          </button>
        </div>
        
        <p style={{ 
          textAlign: 'center',
          fontWeight: '600',
          marginBottom: '1rem'
        }}>
          Share the <strong>Game ID</strong> or <strong>Link</strong> with friends!
        </p>
        <div style={{ 
          fontSize: '0.8rem',
          fontWeight: '600',
          color: '#666',
          textAlign: 'center'
        }}>
          💡 Tip: Links auto-fill the game code for easy joining
        </div>
      </div>
    </div>
  );
} 