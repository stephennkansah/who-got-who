import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FirebaseGameProvider } from './context/FirebaseGameContext';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Recap from './components/Recap';
import InstallPrompt from './components/InstallPrompt';
import FeedbackButton from './components/FeedbackButton';
import ClarityService from './services/clarityService';
import './serviceWorkerRegistration';

function App() {
  // Initialize Microsoft Clarity analytics
  useEffect(() => {
    ClarityService.initialize();
  }, []);

  return (
    <div className="container">
      <FirebaseGameProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby/:gameId" element={<Lobby />} />
            <Route path="/game/:gameId" element={<Game />} />
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
  );
}

export default App; 