import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { validateGameInput } from '../utils/validation';
import AvatarPicker from './AvatarPicker';

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, createGame, joinGame, leaveGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('😎');
  const [avatarType, setAvatarType] = useState<'emoji' | 'photo'>('emoji');
  const [mode, setMode] = useState<'start' | 'join' | 'welcome'>('welcome');

  // Initialization effects...
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      const joinGameId = searchParams.get('join');
      if (!joinGameId && state.currentGame) {
        leaveGame();
      }
      if (joinGameId) {
        setMode('join');
        setGameId(joinGameId);
      }
    }
  }, [hasInitialized, searchParams, state.currentGame, leaveGame]);

  useEffect(() => {
    if (state.currentGame) {
      if (state.currentGame.status === 'draft') {
        const packSelected = state.currentGame.settings?.selectedPack;
        const isHost = state.currentPlayer?.isHost;
        
        if (packSelected || !isHost) {
          navigate(`/lobby/${state.currentGame.id}`);
        } else {
          navigate(`/select-pack/${state.currentGame.id}`);
        }
      } else if (state.currentGame.status === 'live') {
        navigate(`/game/${state.currentGame.id}`);
      } else if (state.currentGame.status === 'ended') {
        navigate(`/recap/${state.currentGame.id}`);
      }
    }
  }, [state.currentGame, state.currentPlayer, navigate]);

  const handleStartGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    await createGame(playerName, selectedAvatar, avatarType);
  };

  const handleJoinGame = async () => {
    if (!playerName.trim() || !gameId.trim()) {
      alert('Please enter your name and game code');
      return;
    }
    await joinGame(gameId.toUpperCase(), playerName, selectedAvatar, avatarType);
  };

  if (state.isLoading) {
    return (
      <div className="container flex-center">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3em', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⏳</div>
          <h2>Setting up...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
        <h1>WHO GOT WHO</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', fontWeight: '600' }}>
          Secret tasks. Stealth claims. The life of the party.
        </p>
      </div>

      {/* Welcome / Action Card */}
      <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Welcome!</h2>
          <p>Choose your look</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
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
          onChange={(e) => setPlayerName(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />

        {mode === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setMode('start')}
              disabled={!playerName.trim()}
              style={{ opacity: playerName.trim() ? 1 : 0.7 }}
            >
              ✨ Start New Game
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setMode('join')}
            >
              🎮 Join Existing Game
            </button>
          </div>
        )}

        {mode === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button 
              className="btn btn-primary"
              onClick={handleStartGame}
            >
              🚀 Launch Party
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setMode('welcome')}
              style={{ border: 'none', color: '#6b7280', padding: '0.5rem' }}
            >
              Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <input 
              type="text"
              placeholder="Game Code (e.g. ABCD)"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
            />
            <button 
              className="btn btn-primary"
              onClick={handleJoinGame}
              disabled={gameId.length < 3}
            >
              Join Party
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setMode('welcome')}
              style={{ border: 'none', color: '#6b7280', padding: '0.5rem' }}
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* Perfect For... */}
      <div className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.6)' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1.2rem', color: '#4b5563' }}>Perfect For...</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          textAlign: 'center' 
        }}>
          <div className="feature-item">
            <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>🏠</div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#374151' }}>House Parties</div>
          </div>
          <div className="feature-item">
            <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>🍽️</div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#374151' }}>Dinner</div>
          </div>
          <div className="feature-item">
            <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>🍻</div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#374151' }}>Pre-Drinks</div>
          </div>
          <div className="feature-item">
            <div style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>🎲</div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#374151' }}>Game Night</div>
          </div>
        </div>
      </div>

      {/* How to Play */}
      <div className="card card-yellow">
        <h3 style={{ textAlign: 'center', color: '#92400e', marginBottom: '1rem' }}>How to Play</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <Step number="1" text="Each player gets secret tasks to complete on others" />
          <Step number="2" text="Complete tasks without being obvious - it's your mission" />
          <Step number="3" text="Say 'Gotcha!' and claim your win in the app" />
          <Step number="4" text="First to complete their tasks wins!" />
        </div>
      </div>
    </div>
  );
}

const Step = ({ number, text }: { number: string, text: string }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
    <div style={{ 
      background: '#f59e0b', 
      color: 'white', 
      borderRadius: '50%', 
      width: '24px', 
      height: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontWeight: 'bold',
      flexShrink: 0,
      marginTop: '2px'
    }}>
      {number}
    </div>
    <p style={{ color: '#78350f', margin: 0, fontWeight: '500' }}>{text}</p>
  </div>
);

export default Home;
