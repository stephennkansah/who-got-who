import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { FirebaseGameProvider } from './context/FirebaseGameContext';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Recap from './components/Recap';

// Check if Firebase is configured
const isFirebaseConfigured = process.env.REACT_APP_FIREBASE_API_KEY && 
                           process.env.REACT_APP_FIREBASE_DATABASE_URL &&
                           process.env.REACT_APP_FIREBASE_PROJECT_ID;

function App() {
  // Use Firebase context if configured, otherwise use local context
  const GameContextProvider = isFirebaseConfigured ? FirebaseGameProvider : GameProvider;
  
  return (
    <GameContextProvider>
      <Router>
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby/:gameId" element={<Lobby />} />
            <Route path="/game/:gameId" element={<Game />} />
            <Route path="/recap/:gameId" element={<Recap />} />
          </Routes>
          
          {/* Development indicator */}
          {!isFirebaseConfigured && (
            <div style={{
              position: 'fixed',
              bottom: '10px',
              right: '10px',
              background: 'rgba(255, 152, 0, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              zIndex: 1000
            }}>
              🔧 Local Mode
            </div>
          )}
          
          {isFirebaseConfigured && (
            <div style={{
              position: 'fixed',
              bottom: '10px',
              right: '10px',
              background: 'rgba(76, 175, 80, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              zIndex: 1000
            }}>
              🔥 Firebase
            </div>
          )}
        </div>
      </Router>
    </GameContextProvider>
  );
}

export default App; 