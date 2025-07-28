import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import ClarityService from '../services/clarityService';
import AvatarPicker from './AvatarPicker';

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, createGame, joinGame, leaveGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [showGameOptions, setShowGameOptions] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('🎮');
  const [avatarType, setAvatarType] = useState<'emoji' | 'photo'>('emoji');

  // Track page views in Clarity
  useEffect(() => {
    if (!showNameEntry && !showGameOptions) {
      ClarityService.trackPageView('welcome');
    } else if (showNameEntry && !showGameOptions) {
      ClarityService.trackPageView('name_entry');
    } else if (showGameOptions) {
      ClarityService.trackPageView('game_options');
    }
  }, [showNameEntry, showGameOptions]);

  // Clear any existing game state only on first load from other pages
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      // Only clear if there's no join parameter (so rejoin links still work)
      const joinGameId = searchParams.get('join');
      if (!joinGameId && state.currentGame) {
        console.log('🧹 Clearing stale game state on Home initial load');
        leaveGame();
      }
      // If joining via link, skip straight to name entry
      if (joinGameId) {
        setShowNameEntry(true);
      }
    }
  }, [hasInitialized, searchParams, state.currentGame, leaveGame]);

  // Check for join parameter in URL
  useEffect(() => {
    const joinGameId = searchParams.get('join');
    if (joinGameId) {
      setGameId(joinGameId.toUpperCase());
    }
  }, [searchParams]);

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

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    // If joining via link, go directly to that game
    const joinGameId = searchParams.get('join');
    if (joinGameId) {
      await joinGame(joinGameId.toUpperCase(), playerName.trim(), selectedAvatar, avatarType);
    } else {
      setShowGameOptions(true);
    }
  };

  const handleCreateGame = async () => {
    console.log('🔥 CREATE GAME BUTTON CLICKED!');
    console.log('Player name:', playerName);
    try {
      await createGame(playerName.trim(), selectedAvatar, avatarType); // Standard game mode
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
          <p style={{ color: '#666', marginBottom: '20px' }}>Connecting to game...</p>
          <p style={{ color: '#999', fontSize: '0.9em', marginBottom: '30px' }}>
            Taking too long? Try the button below
          </p>
          
          <button
            onClick={() => {
              // Clear any ongoing operations and return to home
              leaveGame();
              setShowNameEntry(false);
              setShowGameOptions(false);
              setPlayerName('');
              setGameId('');
              // Clear URL parameters
              navigate('/', { replace: true });
            }}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '1em',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Show join-specific welcome if game ID is in URL
  const joinGameId = searchParams.get('join');
  
  // Welcome screen - main intro
  if (!showNameEntry && !showGameOptions) {
    return (
      <div className="container" style={{ 
        padding: '20px', 
        maxWidth: '500px', 
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '3.5em', 
            fontWeight: '900', 
            color: '#fff',
            textShadow: '0 6px 30px rgba(0,0,0,0.4)',
            marginBottom: '20px',
            letterSpacing: '-2px',
            lineHeight: '0.9'
          }}>
            WHO GOT WHO
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.95)', 
            fontSize: '1.5em',
            fontWeight: '600',
            marginBottom: '15px',
            textShadow: '0 3px 15px rgba(0,0,0,0.3)'
          }}>
            Secret tasks. Stealth claims.
          </p>
          <p style={{ 
            color: 'rgba(255,255,255,0.85)', 
            fontSize: '1.2em',
            fontWeight: '500',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            marginBottom: '10px'
          }}>
            The ultimate party game
          </p>

          <p style={{
            color: '#fffb',
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '25px'
          }}>
            👥 2-10 players • 🕐 5 mins to 5 hours • 📱 Works anywhere
          </p>
          
          {joinGameId ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.15))',
              backdropFilter: 'blur(15px)',
              padding: '20px',
              borderRadius: '20px',
              border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 15px 50px rgba(0,0,0,0.3)',
              marginBottom: '30px'
            }}>
              <p style={{ 
                color: '#fff', 
                fontSize: '1.3em',
                fontWeight: '700',
                marginBottom: '10px'
              }}>
                🎉 You've been invited to join
              </p>
              <div style={{ 
                color: '#fff', 
                fontSize: '2em',
                fontWeight: '800',
                letterSpacing: '3px',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                GAME {joinGameId}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '25px',
              marginBottom: '30px'
            }}>
              <p style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '1.1em',
                fontWeight: '600',
                lineHeight: '1.6',
                margin: '0 0 15px 0'
              }}>
                Complete secret missions on others without being caught. Win by being first to reach the target score!
              </p>
              <p style={{ 
                color: 'rgba(255,255,255,0.85)', 
                fontSize: '1em',
                fontWeight: '600',
                lineHeight: '1.5',
                margin: '0 0 20px 0'
              }}>
                Plays in the background of whatever you're doing — dinner, parties, work events.
              </p>
              
              {/* Perfect For Grid */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h4 style={{ 
                  color: 'rgba(255,255,255,0.95)', 
                  fontSize: '1.1em',
                  fontWeight: '700',
                  textAlign: 'center',
                  margin: '0 0 15px 0'
                }}>
                  🎯 Perfect For...
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  fontSize: '0.85em'
                }}>
                  <div style={{ textAlign: 'center', padding: '10px 8px' }}>
                    <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>🎉</div>
                    <div style={{ fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>House Parties</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8em' }}>Break the ice & get everyone laughing</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 8px' }}>
                    <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>🍽️</div>
                    <div style={{ fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>Dinner Guests</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8em' }}>Perfect conversation starter</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 8px' }}>
                    <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>✈️</div>
                    <div style={{ fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>Trips Away</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8em' }}>Hotels, cabins, road trips</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 8px' }}>
                    <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>🏢</div>
                    <div style={{ fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>Team Building</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8em' }}>Office events & retreats</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 8px' }}>
                    <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>👨‍👩‍👧‍👦</div>
                    <div style={{ fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>Family Time</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8em' }}>Holidays & reunions</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px 8px' }}>
                    <div style={{ fontSize: '1.5em', marginBottom: '4px' }}>🎲</div>
                    <div style={{ fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>Game Nights</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8em' }}>Play alongside board games</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => setShowNameEntry(true)}
            style={{ 
              fontSize: '1.4em',
              fontWeight: '700',
              padding: '20px 40px',
              borderRadius: '25px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              border: 'none',
              color: 'white',
              boxShadow: '0 15px 45px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              textTransform: 'none',
              letterSpacing: '0.5px',
              minWidth: '200px'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(-3px)';
              target.style.boxShadow = '0 20px 55px rgba(59, 130, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = '0 15px 45px rgba(59, 130, 246, 0.4)';
            }}
          >
            {joinGameId ? '🚀 Join Game' : '🎮 Start Playing'}
          </button>
        </div>
      </div>
    );
  }

  // Name entry screen
  if (showNameEntry && !showGameOptions) {
    return (
      <div className="container" style={{ 
        padding: '20px', 
        maxWidth: '500px', 
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '2.8em', 
            fontWeight: '900', 
            color: '#fff',
            textShadow: '0 6px 30px rgba(0,0,0,0.4)',
            marginBottom: '15px',
            letterSpacing: '-2px',
            lineHeight: '0.9'
          }}>
            WHO GOT WHO
          </h1>
          {joinGameId ? (
            <div style={{ marginTop: '20px' }}>
              <p style={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontSize: '1.3em',
                fontWeight: '600',
                marginBottom: '15px',
                textShadow: '0 3px 15px rgba(0,0,0,0.3)'
              }}>
                🎉 You've been invited!
              </p>
              <div style={{ 
                color: '#fff', 
                fontSize: '1.8em',
                fontWeight: '800',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.15))',
                backdropFilter: 'blur(15px)',
                padding: '15px 25px',
                borderRadius: '20px',
                display: 'inline-block',
                letterSpacing: '3px',
                border: '2px solid rgba(255,255,255,0.4)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                GAME {joinGameId}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '15px' }}>
              <p style={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontSize: '1.4em',
                fontWeight: '600',
                marginBottom: '8px',
                textShadow: '0 3px 15px rgba(0,0,0,0.3)'
              }}>
                Secret tasks. Stealth claims.
              </p>
              <p style={{ 
                color: 'rgba(255,255,255,0.85)', 
                fontSize: '1.1em',
                fontWeight: '500',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                marginBottom: '15px'
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
          padding: '40px 35px',
          marginBottom: '20px',
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
            <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>
              {joinGameId ? '🎮' : '👋'}
            </div>
            <h2 style={{ 
              marginBottom: '25px',
              fontSize: '1.8em',
              fontWeight: '800',
              color: '#1f2937',
              letterSpacing: '-1px'
            }}>
              {joinGameId ? 'Join the Lobby!' : 'Welcome!'}
            </h2>
            {joinGameId && (
              <p style={{
                color: '#666',
                fontSize: '0.95rem',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                Enter your name to see who's playing
              </p>
            )}
            <form onSubmit={handleNameSubmit}>
              {/* Avatar Selection */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '25px'
              }}>
                <p style={{
                  color: '#666',
                  fontSize: '0.9rem',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  Choose your avatar
                </p>
                <AvatarPicker
                  selectedAvatar={selectedAvatar}
                  onAvatarChange={(avatar, isPhoto) => {
                    setSelectedAvatar(avatar);
                    setAvatarType(isPhoto ? 'photo' : 'emoji');
                  }}
                />
              </div>
              
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.replace(/^\s+/, ''))}
                style={{ 
                  marginBottom: '25px',
                  fontSize: '1.2em',
                  textAlign: 'center',
                  padding: '18px 25px',
                  borderRadius: '18px',
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
                  fontSize: '1.2em',
                  fontWeight: '700',
                  padding: '18px 35px',
                  borderRadius: '18px',
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
                {joinGameId ? '🚀 Join Lobby' : '✨ Continue'}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Game Info - only show if not joining */}
        {!joinGameId && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '25px',
            marginBottom: '20px',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.4em',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '20px',
              textAlign: 'center',
              letterSpacing: '-0.5px'
            }}>
              🎯 How to Play
            </h3>
            
            <div style={{ 
              color: '#4b5563',
              fontSize: '1em',
              lineHeight: '1.6'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
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
                  marginRight: '12px',
                  fontSize: '0.8em',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>1</span>
                <span>Each player gets secret tasks to complete on others</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
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
                  marginRight: '12px',
                  fontSize: '0.8em',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>2</span>
                <span>Complete tasks without being obvious it's your mission</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
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
                  marginRight: '12px',
                  fontSize: '0.8em',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>3</span>
                <span>Say "Gotcha!" and claim your win in the app</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: '20px', 
                fontWeight: '600' 
              }}>
                <span style={{ 
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: '0.8em',
                  fontWeight: '700',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>4</span>
                <span>First to complete 4 tasks wins!</span>
              </div>

              {/* Example Tasks */}
              <div style={{ 
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                padding: '18px',
                borderRadius: '12px',
                marginBottom: '18px',
                border: '2px solid #f59e0b'
              }}>
                <h4 style={{ 
                  color: '#92400e', 
                  marginBottom: '12px', 
                  fontSize: '1em',
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  💡 Example Tasks
                </h4>
                <div style={{ color: '#78350f', fontSize: '0.9em', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.6)', padding: '8px 10px', borderRadius: '6px' }}>
                    <strong>"Get someone to correct a movie quote"</strong><br/>
                    <em style={{ fontSize: '0.85em' }}>Say: "Peter, I am your father" and wait for correction</em>
                  </div>
                  <div style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.6)', padding: '8px 10px', borderRadius: '6px' }}>
                    <strong>"Get someone to take a group selfie"</strong><br/>
                    <em style={{ fontSize: '0.85em' }}>Suggest taking a photo naturally</em>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.6)', padding: '8px 10px', borderRadius: '6px' }}>
                    <strong>"Get someone to scratch your back for 10 secs"</strong><br/>
                    <em style={{ fontSize: '0.85em' }}>Ask casually - "My back is killing me..."</em>
                  </div>
                </div>
              </div>

                             {/* Key Info */}
               <div style={{ 
                 background: 'linear-gradient(135deg, #e0f2fe, #b3e5fc)',
                 padding: '15px',
                 borderRadius: '12px',
                 border: '2px solid #29b6f6',
                 textAlign: 'center'
               }}>
                 <div style={{ color: '#0277bd', fontWeight: '700', marginBottom: '8px' }}>
                   👥 2-10 players • 🕐 5 mins to 5 hours • 📱 Works anywhere
                 </div>
                 <div style={{ color: '#0288d1', fontSize: '0.9em', fontStyle: 'italic' }}>
                   Plays in the background of whatever you're doing!
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Back button - only show if not joining via link */}
        {!joinGameId && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setShowNameEntry(false)}
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
              ← Back to Welcome
            </button>
          </div>
        )}

        {state.error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '2px solid #f87171',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(248, 113, 113, 0.2)',
            padding: '15px',
            marginTop: '15px'
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
      {/* Install App Promotion Banner */}
      {!window.matchMedia('(display-mode: standalone)').matches && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
            📱 Install Who Got Who
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Get the full app experience - works offline & faster loading!
          </div>
        </div>
      )}
      
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
              onChange={(e) => setGameId(e.target.value)}
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
                outline: 'none',
                textTransform: 'uppercase'
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
          ← Back
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
      
      {/* When to Play Section */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '20px',
        marginTop: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h3 style={{ 
          color: 'white', 
          marginBottom: '15px', 
          fontSize: '1.3em', 
          fontWeight: '700',
          textAlign: 'center'
        }}>
          🎯 Perfect For...
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          fontSize: '0.9em',
          color: 'rgba(255,255,255,0.9)'
        }}>
          <div style={{ textAlign: 'center', padding: '8px' }}>
            🎉 <strong>House Parties</strong><br/>
            <span style={{ fontSize: '0.8em', opacity: 0.8 }}>Break the ice & get everyone laughing</span>
          </div>
          <div style={{ textAlign: 'center', padding: '8px' }}>
            🍽️ <strong>Dinner Guests</strong><br/>
            <span style={{ fontSize: '0.8em', opacity: 0.8 }}>Perfect conversation starter</span>
          </div>
          <div style={{ textAlign: 'center', padding: '8px' }}>
            ✈️ <strong>Trips Away</strong><br/>
            <span style={{ fontSize: '0.8em', opacity: 0.8 }}>Hotels, cabins, road trips</span>
          </div>
          <div style={{ textAlign: 'center', padding: '8px' }}>
            🏢 <strong>Team Building</strong><br/>
            <span style={{ fontSize: '0.8em', opacity: 0.8 }}>Office events & retreats</span>
          </div>
          <div style={{ textAlign: 'center', padding: '8px' }}>
            👨‍👩‍👧‍👦 <strong>Family Time</strong><br/>
            <span style={{ fontSize: '0.8em', opacity: 0.8 }}>Holidays & reunions</span>
          </div>
          <div style={{ textAlign: 'center', padding: '8px' }}>
            🎲 <strong>Game Nights</strong><br/>
            <span style={{ fontSize: '0.8em', opacity: 0.8 }}>Replace boring board games</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 