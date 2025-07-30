import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { FirebaseGameProvider } from './context/FirebaseGameContext';
import { useGame } from './hooks/useGame';
import Home from './components/Home';
import PackSelect from './components/PackSelect';
import Lobby from './components/Lobby';
import Game from './components/Game';
import HolidayChallengeGame from './components/HolidayChallengeGame';
import Recap from './components/Recap';
import InstallPrompt from './components/InstallPrompt';
import FeedbackButton from './components/FeedbackButton';
import ErrorBoundary from './components/ErrorBoundary';
import './serviceWorkerRegistration';

// Wrapper component to extract gameId from URL params
const PackSelectWrapper: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  return <PackSelect gameId={gameId || ''} />;
};

// Wrapper component to determine which game component to render
const GameWrapper: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { state } = useGame();
  
  if (!state.currentGame) {
    return <Game />; // Show loading/default game component if no game data yet
  }
  
  // Determine which component to render based on game type
  if (state.currentGame.gameType === 'holiday-challenge') {
    return <HolidayChallengeGame />;
  } else {
    return <Game />;
  }
};

function App() {
  // Microsoft Clarity is now loaded via script tag in index.html

  return (
    <ErrorBoundary>
      <div className="container">
        <FirebaseGameProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/select-pack/:gameId" element={<PackSelectWrapper />} />
              <Route path="/lobby/:gameId" element={<Lobby />} />
              <Route path="/game/:gameId" element={<GameWrapper />} />
              <Route path="/recap/:gameId" element={<Recap />} />
            </Routes>
          </Router>
        </FirebaseGameProvider>
      
      {/* Install Prompt */}
      <InstallPrompt />
      
      {/* Feedback Button */}
      <FeedbackButton />
      
      {/* Mode indicator */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        🔥 Firebase
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App; 