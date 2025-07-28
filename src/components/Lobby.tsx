import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player } from '../types';
import NotificationPrompt from './NotificationPrompt';
import ShareButton from './ShareButton';
import ClarityService from '../services/clarityService';



export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, startGame, leaveGame } = useGame();
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [showRules, setShowRules] = useState(true);

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const isHost = currentPlayer?.isHost || false;
  const canStart = (currentGame?.players.length || 0) >= 2;

  // Track page view in Clarity
  useEffect(() => {
    if (showRules) {
      ClarityService.trackPageView('lobby_rules');
    } else {
      ClarityService.trackPageView('lobby');
      if (currentGame?.id) {
        ClarityService.setTag('lobby_player_count', currentGame.players.length.toString());
      }
    }
  }, [showRules, currentGame?.players.length]);

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

  const handleStartGame = async () => {
    if (!isHost || !canStart) return;
    await startGame();
  };

  const handleLeaveGame = async () => {
    const confirmed = window.confirm(
      '🚪 Leave Game?\n\nYou will exit the lobby and return to the home screen.\n\nOther players will remain in the lobby.'
    );
    
    if (confirmed) {
      await leaveGame();
      navigate('/');
    }
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

  // Show rules first
  if (showRules) {
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
            Game Rules • {currentGame.players.length} player{currentGame.players.length !== 1 ? 's' : ''} waiting
          </div>
        </div>

        {/* Game Rules */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.3rem', 
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: '#333'
          }}>
            📋 How to Play
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Rule 1: Stealth */}
            <div style={{
              padding: '1.2rem',
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
              borderRadius: '15px',
              border: '2px solid #ff6b9d'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '700',
                color: '#8b2635',
                marginBottom: '0.5rem'
              }}>
                🕵️ Stay Stealthy!
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                color: '#8b2635',
                lineHeight: '1.5'
              }}>
                Complete tasks <strong>without getting caught</strong>. If someone notices you attempting a task, it's an automatic fail!
              </div>
            </div>

            {/* Rule 2: Tasks & Scoring */}
            <div style={{
              padding: '1.2rem',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              borderRadius: '15px',
              border: '2px solid #48cae4'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '700',
                color: '#006466',
                marginBottom: '0.5rem'
              }}>
                🎯 Complete Tasks & Score
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                color: '#006466',
                lineHeight: '1.5'
              }}>
                ✅ Mark tasks as <strong>PASSED</strong> when completed<br/>
                ❌ Mark as <strong>FAILED</strong> if caught<br/>
                🏆 <strong>First to 4 points wins!</strong>
              </div>
            </div>

            {/* Rule 3: Gotcha System */}
            <div style={{
              padding: '1.2rem',
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              borderRadius: '15px',
              border: '2px solid #ff8a65'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '700',
                color: '#d84315',
                marginBottom: '0.5rem'
              }}>
                📢 Say "Gotcha!" 
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                color: '#d84315',
                lineHeight: '1.5'
              }}>
                When you pass a task, choose who to target and say <strong>"Gotcha [Name]!"</strong> out loud. They can dispute if they disagree.
              </div>
            </div>

            {/* Rule 4: Swaps */}
            <div style={{
              padding: '1.2rem',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
              borderRadius: '15px',
              border: '2px solid #9c27b0'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '700',
                color: '#4a148c',
                marginBottom: '0.5rem'
              }}>
                🔄 Task Swaps (2 per player)
              </div>
              <div style={{ 
                fontSize: '0.9rem',
                color: '#4a148c',
                lineHeight: '1.5'
              }}>
                Don't like a task? Use the <strong>"Swap Task"</strong> button to get a new random one. Use them wisely!
              </div>
            </div>

            {/* Example Tasks */}
            <div style={{
              padding: '1.2rem',
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)',
              borderRadius: '15px',
              border: '2px solid #ff9800',
              marginTop: '1rem'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '700',
                color: '#e65100',
                marginBottom: '0.8rem',
                textAlign: 'center'
              }}>
                💡 Example Tasks
              </div>
              <div style={{ 
                fontSize: '0.85rem',
                color: '#bf360c',
                lineHeight: '1.4'
              }}>
                <div style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.7)', padding: '8px', borderRadius: '6px' }}>
                  <strong>"Get a player to correct a movie quote"</strong><br/>
                  <em>Say: "Luke, I am your father" → Wait for correction</em>
                </div>
                <div style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.7)', padding: '8px', borderRadius: '6px' }}>
                  <strong>"Get someone to take a group selfie"</strong><br/>
                  <em>Naturally suggest a photo without being obvious</em>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '8px', borderRadius: '6px' }}>
                  <strong>"Get a player to use air quotes"</strong><br/>
                  <em>Talk about something "so-called" or questionable</em>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Notification Prompt */}
        <NotificationPrompt />

        {/* Next Button */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowRules(false)}
              style={{ 
                fontSize: '1.2rem',
                padding: '0.75rem 2rem',
                fontWeight: '700',
                width: '100%'
              }}
            >
              ✓ Got It! Next →
            </button>
            <p style={{ 
              fontSize: '0.8rem', 
              color: '#666', 
              marginTop: '0.5rem',
              margin: '0.5rem 0 0 0'
            }}>
              Continue to lobby and wait for game to start
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Guest/Non-Host Layout - Simplified and focused
  if (!isHost) {
    return (
      <div className="container">
        {/* Compact Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '1rem',
          padding: '0.5rem 0'
        }}>
          <h1 style={{ 
            fontSize: '1.8rem', 
            marginBottom: '0.3rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800'
          }}>
            Who Got Who
          </h1>
          <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
            Lobby • {currentGame.players.length} player{currentGame.players.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Players List - Always Expanded for Guests */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            margin: '0 0 1rem 0',
            color: '#333',
            textAlign: 'center'
          }}>
            👥 Players ({currentGame.players.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {currentGame.players.map((player: Player) => (
              <div key={player.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: player.id === currentPlayer.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.02)',
                borderRadius: '12px',
                border: player.id === currentPlayer.id ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(0,0,0,0.1)'
              }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                    {player.name} {player.isHost && '👑'} {player.id === currentPlayer.id && '(You)'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {player.isHost ? 'Host - Will start the game' : 'Ready to play'}
                  </div>
                </div>
                <div style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: '#10b981',
                  color: 'white'
                }}>
                  Connected
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Banner */}
        <div className="card" style={{ 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #0ea5e9',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '0.5rem' 
          }}>
            🎯
          </div>
          <h3 style={{ 
            color: '#0c4a6e', 
            marginBottom: '0.5rem',
            fontSize: '1.2rem',
            fontWeight: '700'
          }}>
            Your Secret Tasks Will Be Revealed Soon!
          </h3>
          <p style={{ 
            color: '#0369a1', 
            fontSize: '0.9rem',
            margin: '0',
            lineHeight: '1.4'
          }}>
            Host <strong>{currentGame.players.find(p => p.isHost)?.name}</strong> 👑 will start when ready
          </p>
        </div>

        {/* Notification Prompt */}
        <NotificationPrompt />

        {/* Leave Game */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleLeaveGame}
              style={{
                background: 'linear-gradient(135deg, #6c757d, #495057)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                padding: '0.75rem 2rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              🚪 Leave Game
            </button>
            <p style={{ 
              fontSize: '0.8rem', 
              color: '#666', 
              margin: '0.5rem 0 0 0' 
            }}>
              Return to home screen
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Host Layout - Full functionality
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

      {/* Compact Share Section for Host */}
      <div className="card" style={{ 
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
        border: '1px solid #3b82f6'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
            <div style={{ 
              fontSize: '1.1rem',
              fontWeight: '700',
              color: '#1976D2',
              marginBottom: '0.2rem'
            }}>
              {currentGame.id}
            </div>
            <div style={{ 
              fontSize: '0.7rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: '#1976D2'
            }}>
              Game ID
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
            <ShareButton 
              gameId={currentGame.id}
              size="small"
              style={{
                fontSize: '0.8rem',
                padding: '0.6rem 1.2rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Combined Players & Game Control */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          margin: '0 0 1rem 0',
          color: '#333',
          textAlign: 'center'
        }}>
          👥 Players ({currentGame.players.length})
        </h3>
        
        {/* Always show player list for host */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
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
                     Ready to play
                   </div>
                </div>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: '#10b981',
                  color: 'white'
                }}>
                  Connected
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Start Section */}
        <div style={{ 
          textAlign: 'center',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          paddingTop: '1rem'
        }}>
          {isHost ? (
            <div style={{
              background: canStart 
                ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: canStart 
                ? '2px solid #16a34a' 
                : '2px solid #f59e0b',
              borderRadius: '12px',
              padding: '1rem',
              margin: '0.5rem 0'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                color: canStart ? '#15803d' : '#92400e',
                marginBottom: '0.5rem'
              }}>
                👑 You're the Host!
              </div>
              <p style={{ 
                color: canStart ? '#166534' : '#a16207', 
                fontSize: '0.85rem', 
                margin: '0 0 0.75rem 0' 
              }}>
                {canStart 
                  ? "Ready to start! Click below to reveal everyone's secret tasks"
                  : "Need at least 2 players to start the game"
                }
              </p>
              {canStart ? (
                <button 
                  className="btn btn-success"
                  onClick={handleStartGame}
                  style={{ 
                    fontSize: '1.1rem',
                    padding: '0.75rem 2rem',
                    fontWeight: '700',
                    width: '100%'
                  }}
                >
                  🚀 Start Game
                </button>
              ) : (
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#a16207',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Waiting for more players to join...
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '2px solid #0ea5e9',
              borderRadius: '12px',
              padding: '1rem',
              margin: '0.5rem 0'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                color: '#0c4a6e',
                marginBottom: '0.5rem'
              }}>
                ⏳ Waiting for Host to Start
              </div>
              <p style={{ color: '#0369a1', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>
                Host <strong>{currentGame.players.find(p => p.isHost)?.name || 'Unknown'}</strong> 👑 will start the game when ready
              </p>
              <p style={{ color: '#0284c7', fontSize: '0.8rem', margin: '0' }}>
                Tasks will be revealed when the game begins!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Task Preview */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ 
          fontSize: '1.2rem', 
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#333'
        }}>
          Your Secret Tasks
        </h2>
        
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, rgba(103, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          borderRadius: '20px',
          border: '2px dashed rgba(103, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
          <h3 style={{ 
            color: '#667eea', 
            marginBottom: '0.5rem',
            fontSize: '1.3rem',
            fontWeight: '700'
          }}>
            Tasks Will Be Revealed
          </h3>
          <p style={{ 
            color: '#666', 
            fontSize: '1rem',
            lineHeight: '1.6',
            maxWidth: '300px',
            margin: '0 auto'
          }}>
            Your secret missions will appear here once everyone locks in and the game starts!
          </p>
          <div style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(103, 126, 234, 0.1)',
            borderRadius: '25px',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#667eea'
          }}>
            🎲 You'll get {currentPlayer?.tasks?.length || 7} tasks to complete
          </div>
        </div>
      </div>







      {/* Leave Game */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button 
          className="btn btn-secondary btn-small"
          onClick={handleLeaveGame}
          style={{ fontSize: '0.9rem' }}
        >
          🚪 Leave Game
        </button>
        <p style={{ 
          fontSize: '0.8rem',
          color: '#666',
          marginTop: '0.5rem'
        }}>
          Return to home screen
        </p>
      </div>
    </div>
  );
} 