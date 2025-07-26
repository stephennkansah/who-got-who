import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, createGame, joinGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [showGameOptions, setShowGameOptions] = useState(false);

  // Check for join parameter in URL
  useEffect(() => {
    const joinGameId = searchParams.get('join');
    if (joinGameId) {
      setGameId(joinGameId.toUpperCase());
      // If we already have a name, show game options directly
      if (playerName.trim()) {
        setShowGameOptions(true);
      }
    }
  }, [searchParams, playerName]);

  // Navigate to game when one is created/joined
  useEffect(() => {
    if (state.currentGame) {
      if (state.currentGame.status === 'draft') {
        navigate(`/lobby/${state.currentGame.id}`);
      } else if (state.currentGame.status === 'live') {
        navigate(`/game/${state.currentGame.id}`);
      } else if (state.currentGame.status === 'ended') {
        navigate(`/recap/${state.currentGame.id}`);
      }
    }
  }, [state.currentGame, navigate]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setShowGameOptions(true);
  };

  const handleCreateGame = async () => {
    console.log('🔥 CREATE GAME BUTTON CLICKED!');
    console.log('Player name:', playerName);
    try {
      await createGame(playerName.trim(), 'casual'); // Always use casual mode for now
    } catch (error) {
      console.error('Create game error:', error);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId.trim()) return;
    
    await joinGame(gameId.trim().toUpperCase(), playerName.trim());
  };

  if (state.isLoading) {
    return (
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="card" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ fontSize: '2em', marginBottom: '20px' }}>🎮</div>
          <h2 style={{ color: '#333', marginBottom: '15px' }}>Loading...</h2>
          <p style={{ color: '#666' }}>Connecting to game...</p>
        </div>
      </div>
    );
  }

  // Show join-specific welcome if game ID is in URL
  const joinGameId = searchParams.get('join');
  
  // Welcome screen - name entry
  if (!showGameOptions) {
    return (
      <div className="container" style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '60px', paddingTop: '40px' }}>
          <h1 style={{ 
            fontSize: '4em', 
            fontWeight: '900', 
            color: '#fff',
            textShadow: '0 6px 30px rgba(0,0,0,0.4)',
            marginBottom: '25px',
            letterSpacing: '-2px',
            lineHeight: '0.9'
          }}>
            WHO GOT WHO
          </h1>
          {joinGameId ? (
            <div style={{ marginTop: '30px' }}>
              <p style={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontSize: '1.5em',
                fontWeight: '600',
                marginBottom: '20px',
                textShadow: '0 3px 15px rgba(0,0,0,0.3)'
              }}>
                🎉 You've been invited!
              </p>
              <div style={{ 
                color: '#fff', 
                fontSize: '2.2em',
                fontWeight: '800',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.15))',
                backdropFilter: 'blur(15px)',
                padding: '20px 35px',
                borderRadius: '25px',
                display: 'inline-block',
                letterSpacing: '4px',
                border: '3px solid rgba(255,255,255,0.4)',
                boxShadow: '0 15px 50px rgba(0,0,0,0.3)',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                GAME {joinGameId}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '20px' }}>
              <p style={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontSize: '1.6em',
                fontWeight: '600',
                marginBottom: '10px',
                textShadow: '0 3px 15px rgba(0,0,0,0.3)'
              }}>
                Secret tasks. Stealth claims.
              </p>
              <p style={{ 
                color: 'rgba(255,255,255,0.85)', 
                fontSize: '1.3em',
                fontWeight: '500',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                The ultimate party game
              </p>
            </div>
          )}
        </header>

        {/* Name Entry */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92))',
          backdropFilter: 'blur(25px)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2)',
          borderRadius: '30px',
          padding: '50px 40px',
          marginBottom: '30px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
            borderRadius: '30px 30px 0 0'
          }} />
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3em', marginBottom: '20px' }}>
              {joinGameId ? '🎮' : '👋'}
            </div>
            <h2 style={{ 
              marginBottom: '35px',
              fontSize: '2em',
              fontWeight: '800',
              color: '#1f2937',
              letterSpacing: '-1px'
            }}>
              {joinGameId ? 'Ready to Join!' : 'Welcome!'}
            </h2>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{ 
                  marginBottom: '30px',
                  fontSize: '1.3em',
                  textAlign: 'center',
                  padding: '20px 30px',
                  borderRadius: '20px',
                  border: '3px solid #e2e8f0',
                  background: '#ffffff',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontWeight: '600',
                  color: '#1f2937',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}
                autoFocus
                maxLength={20}
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = '#3b82f6';
                  target.style.boxShadow = '0 0 0 6px rgba(59, 130, 246, 0.1), 0 8px 30px rgba(0, 0, 0, 0.1)';
                  target.style.transform = 'translateY(-2px)';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = '#e2e8f0';
                  target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
                  target.style.transform = 'translateY(0)';
                }}
              />
              <button 
                type="submit" 
                disabled={!playerName.trim()}
                style={{ 
                  fontSize: '1.3em',
                  fontWeight: '700',
                  padding: '20px 40px',
                  borderRadius: '20px',
                  background: playerName.trim() 
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                    : 'linear-gradient(135deg, #94a3b8, #64748b)',
                  border: 'none',
                  color: 'white',
                  width: '100%',
                  boxShadow: playerName.trim() 
                    ? '0 10px 35px rgba(59, 130, 246, 0.4)' 
                    : '0 6px 20px rgba(148, 163, 184, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                  textTransform: 'none',
                  letterSpacing: '0.5px',
                  opacity: playerName.trim() ? 1 : 0.7
                }}
                onMouseEnter={(e) => {
                  if (playerName.trim()) {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'translateY(-3px)';
                    target.style.boxShadow = '0 15px 45px rgba(59, 130, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (playerName.trim()) {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'translateY(0)';
                    target.style.boxShadow = '0 10px 35px rgba(59, 130, 246, 0.4)';
                  }
                }}
              >
                {joinGameId ? '🚀 Join Game' : '✨ Continue'}
              </button>
            </form>
          </div>
        </div>

        {/* Quick How to Play - only show if not joining */}
        {!joinGameId && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
            borderRadius: '25px',
            padding: '35px 30px'
          }}>
            <h2 style={{
              fontSize: '1.8em',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '25px',
              letterSpacing: '-0.5px',
              textAlign: 'center'
            }}>
              🎯 How to Play
            </h2>
            <div style={{ 
              textAlign: 'left', 
              lineHeight: '1.9',
              fontSize: '1.1em',
              color: '#4b5563'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '15px', 
                fontWeight: '600' 
              }}>
                <span style={{ 
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px',
                  fontSize: '0.8em',
                  fontWeight: '700'
                }}>1</span>
                Complete secret tasks on other players
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '15px', 
                fontWeight: '600' 
              }}>
                <span style={{ 
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px',
                  fontSize: '0.8em',
                  fontWeight: '700'
                }}>2</span>
                Say "Gotcha!" when done & claim in app
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '15px', 
                fontWeight: '600' 
              }}>
                <span style={{ 
                  background: 'linear-gradient(135deg, #ec4899, #db2777)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px',
                  fontSize: '0.8em',
                  fontWeight: '700'
                }}>3</span>
                First to 4 completed tasks wins!
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                padding: '15px 20px',
                borderRadius: '15px',
                marginTop: '20px',
                border: '2px solid #bae6fd',
                textAlign: 'center'
              }}>
                <strong style={{ color: '#0369a1' }}>👥 2+ players needed to start</strong>
              </div>
            </div>
          </div>
        )}

        {state.error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '2px solid #f87171',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(248, 113, 113, 0.2)',
            padding: '20px',
            marginTop: '20px'
          }}>
            <p style={{ color: '#dc2626', margin: 0, fontWeight: '600', textAlign: 'center' }}>
              ⚠️ {state.error}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Game options screen - simplified without competitive mode
  return (
    <div className="container" style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '20px' }}>
        <h1 style={{ 
          fontSize: '2.8em', 
          fontWeight: '800', 
          color: '#fff',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          marginBottom: '10px',
          letterSpacing: '-1px'
        }}>
          Hey {playerName}! 👋
        </h1>
        <p style={{ 
          color: 'rgba(255,255,255,0.9)', 
          fontSize: '1.2em',
          fontWeight: '500'
        }}>
          {joinGameId ? `Ready to join game ${joinGameId}?` : 'Ready to start playing?'}
        </p>
      </header>

      {/* Show join option first if joining via link */}
      {joinGameId && (
        <div style={{ 
          border: '3px solid #10b981', 
          background: 'linear-gradient(145deg, #ecfdf5, #d1fae5)',
          borderRadius: '25px',
          padding: '40px 30px',
          marginBottom: '25px',
          boxShadow: '0 20px 50px rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🎮</div>
            <h2 style={{ color: '#065f46', marginBottom: '15px', fontSize: '1.8em' }}>
              Join Game {joinGameId}
            </h2>
            <p style={{ marginBottom: '25px', color: '#047857', fontSize: '1.1em' }}>
              You're all set! Click below to join the game.
            </p>
            <button 
              onClick={() => joinGame(joinGameId, playerName.trim())}
              style={{ 
                fontSize: '1.3em',
                fontWeight: '700',
                padding: '18px 35px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: 'white',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(-3px)';
                target.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.5)';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
              }}
            >
              🚀 Join Game Now
            </button>
          </div>
        </div>
      )}

      {/* Create Game - simplified without mode selection */}
      {!joinGameId && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
          borderRadius: '25px',
          padding: '40px 30px',
          marginBottom: '25px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🎨</div>
            <h2 style={{ color: '#1f2937', marginBottom: '20px', fontSize: '1.8em' }}>
              Create New Game
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '30px', fontSize: '1.1em' }}>
              Start a new game and invite your friends!
            </p>
            
            <button 
              onClick={() => {
                console.log('🔥 BUTTON CLICK DETECTED!');
                handleCreateGame();
              }}
              style={{ 
                fontSize: '1.3em',
                fontWeight: '700',
                padding: '18px 35px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: 'none',
                color: 'white',
                width: '100%',
                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
                cursor: 'pointer'
              }}
            >
              ✨ Create Game
            </button>
          </div>
        </div>
      )}

      {/* Join Different Game */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
        borderRadius: '25px',
        padding: '35px 30px',
        marginBottom: '25px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>🔗</div>
          <h2 style={{ color: '#1f2937', marginBottom: '20px', fontSize: '1.6em' }}>
            {joinGameId ? 'Join Different Game' : 'Join Existing Game'}
          </h2>
          <form onSubmit={handleJoinGame}>
            <input
              type="text"
              placeholder="Game Code (e.g., ABC123)"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              style={{ 
                marginBottom: '25px',
                fontSize: '1.2em',
                textAlign: 'center',
                letterSpacing: '3px',
                padding: '18px 25px',
                borderRadius: '15px',
                border: '2px solid #e2e8f0',
                background: '#ffffff',
                width: '100%',
                boxSizing: 'border-box',
                fontWeight: '700',
                color: '#1f2937',
                outline: 'none'
              }}
              maxLength={10}
            />
            <button 
              type="submit" 
              style={{ 
                fontSize: '1.2em',
                fontWeight: '700',
                padding: '16px 30px',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                color: 'white',
                width: '100%',
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            >
              🎯 Join Game
            </button>
          </form>
        </div>
      </div>

      {/* Back button */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button 
          onClick={() => setShowGameOptions(false)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: 'rgba(255,255,255,0.9)',
            padding: '12px 25px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255,255,255,0.3)';
            target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'rgba(255,255,255,0.2)';
            target.style.transform = 'translateY(0)';
          }}
        >
          ← Change Name
        </button>
      </div>

      {state.error && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '2px solid #f87171',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(248, 113, 113, 0.2)',
          padding: '20px',
          marginTop: '20px'
        }}>
          <p style={{ color: '#dc2626', margin: 0, fontWeight: '600', textAlign: 'center' }}>
            ⚠️ {state.error}
          </p>
        </div>
      )}
    </div>
  );
}

export default Home; 