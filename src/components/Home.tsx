import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

export default function Home() {
  const navigate = useNavigate();
  const { state, createGame, joinGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'casual' | 'competitive'>('casual');

  // Check for existing game session
  useEffect(() => {
    const existingGameId = localStorage.getItem('currentGameId');
    const existingPlayerId = localStorage.getItem('currentPlayerId');
    
    if (existingGameId && existingPlayerId) {
      setGameId(existingGameId);
    }
  }, []);

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

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    await createGame(playerName.trim(), selectedMode);
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !gameId.trim()) return;
    
    await joinGame(gameId.trim().toUpperCase(), playerName.trim());
  };

  const handleQuickJoin = () => {
    const existingGameId = localStorage.getItem('currentGameId');
    if (existingGameId && state.currentGame) {
      if (state.currentGame.status === 'draft') {
        navigate(`/lobby/${existingGameId}`);
      } else if (state.currentGame.status === 'live') {
        navigate(`/game/${existingGameId}`);
      } else if (state.currentGame.status === 'ended') {
        navigate(`/recap/${existingGameId}`);
      }
    }
  };

  const addDemoPlayer = async () => {
    if (!state.currentGame || !gameId) return;
    
    const demoNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const usedNames = state.currentGame.players.map(p => p.name);
    const availableNames = demoNames.filter(name => !usedNames.includes(name));
    
    if (availableNames.length === 0) {
      alert('No more demo players available');
      return;
    }
    
    const demoName = availableNames[0];
    await joinGame(gameId, demoName);
  };

  const switchPlayer = (playerId: string) => {
    if (!state.currentGame) return;
    
    const player = state.currentGame.players.find(p => p.id === playerId);
    if (player) {
      localStorage.setItem('currentPlayerId', playerId);
      window.location.reload();
    }
  };

  const quickTestGame = async () => {
    // Create a game with multiple players and set it to live for testing
    await createGame('TestHost', 'casual');
    
    // Wait for game to be created, then add demo players
    setTimeout(async () => {
      const demoNames = ['Alice', 'Bob', 'Charlie'];
      for (const name of demoNames) {
        await joinGame(state.currentGame?.id || '', name);
      }
    }, 100);
  };

  const clearDemoData = () => {
    localStorage.removeItem('gameData');
    localStorage.removeItem('currentGameId');
    localStorage.removeItem('currentPlayerId');
    localStorage.removeItem('playerToken');
    window.location.reload();
  };

  return (
    <div className="flex flex-column flex-center" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '1rem' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>WHO GOT WHO</h1>
          <p style={{ 
            fontSize: '1rem', 
            opacity: 0.9, 
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
          }}>
            The ultimate party game of stealth & gotchas!
          </p>
        </div>

        {state.error && (
          <div className="card card-warning" style={{ marginBottom: '1rem' }}>
            <p><strong>❌ {state.error}</strong></p>
          </div>
        )}

        {/* Quick Rejoin */}
        {gameId && state.currentGame && (
          <div className="card card-success" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.8rem', textTransform: 'uppercase' }}>🎮 Continue Game</h3>
            <div style={{ 
              background: 'rgba(46, 125, 50, 0.1)', 
              padding: '1rem', 
              borderRadius: '15px',
              marginBottom: '1rem'
            }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                <strong>Game ID:</strong> {gameId}
              </p>
              <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                <strong>Status:</strong> {state.currentGame.status.toUpperCase()}
              </p>
              <p style={{ fontWeight: '600' }}>
                <strong>Players:</strong> {state.currentGame.players.length}
              </p>
            </div>
            <button 
              className="btn btn-success" 
              onClick={handleQuickJoin}
              disabled={state.isLoading}
            >
              {state.currentGame.status === 'draft' ? '🚀 Return to Lobby' :
               state.currentGame.status === 'live' ? '⚡ Rejoin Game' :
               '🏆 View Results'}
            </button>
            
            {state.currentGame.status === 'draft' && state.currentGame.players.length < 8 && (
              <button 
                className="btn btn-secondary btn-small"
                onClick={addDemoPlayer}
                disabled={state.isLoading}
                style={{ marginTop: '0.5rem' }}
              >
                ➕ Add Demo Player ({state.currentGame.players.length}/8)
              </button>
            )}
          </div>
        )}

        {/* Main game creation/join */}
        {!showJoinForm ? (
          <div>
            {/* Create Game Form */}
            <div className="card">
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', textTransform: 'uppercase', textAlign: 'center' }}>
                🎮 Create New Game
              </h2>
              <form onSubmit={handleCreateGame}>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  required
                />
                
                <div style={{ margin: '1.5rem 0' }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    marginBottom: '1rem', 
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    color: '#4A90E2'
                  }}>
                    🎯 Choose Game Mode
                  </h3>
                  <div style={{ margin: '1rem 0' }}>
                    <label className="flex" style={{ 
                      alignItems: 'flex-start', 
                      marginBottom: '1rem', 
                      cursor: 'pointer',
                      padding: '1rem',
                      background: selectedMode === 'casual' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '15px',
                      border: selectedMode === 'casual' ? '2px solid #4CAF50' : '2px solid rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease'
                    }}>
                      <input
                        type="radio"
                        value="casual"
                        checked={selectedMode === 'casual'}
                        onChange={(e) => setSelectedMode(e.target.value as 'casual')}
                      />
                      <div>
                        <strong style={{ color: '#4CAF50', fontSize: '1.1rem' }}>🌟 CASUAL</strong>
                        <div className="text-small" style={{ marginTop: '0.3rem', fontWeight: '600' }}>
                          2 swaps • No penalties • Perfect for parties
                        </div>
                      </div>
                    </label>
                    <label className="flex" style={{ 
                      alignItems: 'flex-start', 
                      cursor: 'pointer',
                      padding: '1rem',
                      background: selectedMode === 'competitive' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '15px',
                      border: selectedMode === 'competitive' ? '2px solid #F44336' : '2px solid rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease'
                    }}>
                      <input
                        type="radio"
                        value="competitive"
                        checked={selectedMode === 'competitive'}
                        onChange={(e) => setSelectedMode(e.target.value as 'competitive')}
                      />
                      <div>
                        <strong style={{ color: '#F44336', fontSize: '1.1rem' }}>⚔️ COMPETITIVE</strong>
                        <div className="text-small" style={{ marginTop: '0.3rem', fontWeight: '600' }}>
                          1 swap • Penalties • Strategy focus
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn" 
                  disabled={state.isLoading || !playerName.trim()}
                  style={{ fontSize: '1.1rem' }}
                >
                  {state.isLoading ? '🔄 Creating Game...' : '🚀 Create Game'}
                </button>
              </form>
            </div>

            <div className="text-center" style={{ margin: '1rem 0' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowJoinForm(true)}
              >
                🔗 Join Existing Game
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Join Game Form */}
            <div className="card">
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', textTransform: 'uppercase', textAlign: 'center' }}>
                🔗 Join Game
              </h2>
              <form onSubmit={handleJoinGame}>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  required
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Game ID (e.g. ABC123)"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                />
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={state.isLoading || !playerName.trim() || !gameId.trim()}
                  style={{ fontSize: '1.1rem' }}
                >
                  {state.isLoading ? '🔄 Joining Game...' : '🎯 Join Game'}
                </button>
              </form>
            </div>

            <div className="text-center" style={{ margin: '1rem 0' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowJoinForm(false)}
              >
                ← Create New Game Instead
              </button>
            </div>
          </div>
        )}

        {/* Demo Mode Notice - Compact */}
        <div className="card card-demo" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', textTransform: 'uppercase' }}>
            📱 Demo Mode
          </h3>
          <p style={{ marginBottom: '1rem', fontWeight: '600' }}>
            <strong>Local testing mode</strong> • Multiple players • No backend required
          </p>
          {gameId && state.currentGame && (
            <button 
              className="btn btn-danger btn-small"
              onClick={clearDemoData}
            >
              🗑️ Clear Demo Data
            </button>
          )}
        </div>

        {/* Quick Test Setup - Only show if no game */}
        {!gameId && (
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, #9C27B0, #BA68C8)',
            color: 'white',
            marginBottom: '1rem'
          }}>
            <button 
              className="btn"
              onClick={quickTestGame}
              disabled={state.isLoading}
              style={{ 
                background: 'linear-gradient(135deg, #7B1FA2, #9C27B0)',
                fontSize: '1rem'
              }}
            >
              🚀 Quick Demo (4 Players)
            </button>
          </div>
        )}

        {/* Player Switching - Only when multiple players */}
        {state.currentGame && state.currentGame.players.length > 1 && (
          <div className="card card-test" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', textTransform: 'uppercase' }}>
              🔄 Switch Player View
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {state.currentGame.players.map(player => (
                <button
                  key={player.id}
                  className={`btn btn-small ${player.id === state.currentPlayer?.id ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => switchPlayer(player.id)}
                  style={{ margin: '0.25rem', fontWeight: '700' }}
                >
                  {player.name} {player.isHost ? '👑' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Rules - Compact */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.8rem', textTransform: 'uppercase', color: '#4A90E2' }}>
            📋 How to Play
          </h3>
          <div style={{ lineHeight: '1.8', fontWeight: '600' }}>
            <div style={{ marginBottom: '0.5rem' }}>🎯 Complete stealth tasks on other players</div>
            <div style={{ marginBottom: '0.5rem' }}>🗣️ Say "Gotcha!" when task is done</div>
            <div style={{ marginBottom: '0.5rem' }}>🏆 First player to 4 points wins</div>
            <div style={{ marginBottom: '0.5rem' }}>⚖️ Targets can dispute claims</div>
            <div>🔄 Swap unwanted tasks before starting</div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="text-center" style={{ 
          marginTop: '1.5rem', 
          opacity: 0.8, 
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '600',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }}>
          Status: {state.isConnected ? '🟢 Connected' : '🔴 Demo Mode'}
        </div>
      </div>
    </div>
  );
} 