import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { AwsGameProvider } from './context/AwsGameContext';
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
import ToastHost, { showToast } from './components/common/Toast';

// Wrapper component to extract gameId from URL params
const PackSelectWrapper: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  return <PackSelect gameId={gameId || ''} />;
};

// Wrapper component to determine which game component to render
const GameWrapper: React.FC = () => {
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

// Home renders errors inline; every other screen surfaces them as a toast.
const ErrorToastBridge: React.FC = () => {
  const { state } = useGame();
  const location = useLocation();
  const lastError = useRef<string | null>(null);

  useEffect(() => {
    if (state.error && state.error !== lastError.current && location.pathname !== '/') {
      showToast(state.error, 'error');
    }
    lastError.current = state.error;
  }, [state.error, location.pathname]);

  return null;
};

// Floating pills only where they belong — never over live gameplay.
const FloatingWidgets: React.FC = () => {
  const { pathname } = useLocation();
  const showInstall = pathname === '/' || pathname.startsWith('/lobby');
  const showFeedback = pathname === '/' || pathname.startsWith('/recap');

  return (
    <>
      {showInstall && <InstallPrompt />}
      {showFeedback && <FeedbackButton />}
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <div style={{ height: '100%', width: '100%' }}>
        <AwsGameProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/select-pack/:gameId" element={<PackSelectWrapper />} />
              <Route path="/lobby/:gameId" element={<Lobby />} />
              <Route path="/game/:gameId" element={<GameWrapper />} />
              <Route path="/recap/:gameId" element={<Recap />} />
            </Routes>
            <ErrorToastBridge />
            <FloatingWidgets />
          </Router>
        </AwsGameProvider>
        <ToastHost />
      </div>
    </ErrorBoundary>
  );
}

export default App;
