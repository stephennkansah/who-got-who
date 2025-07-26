import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Recap from './components/Recap';

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby/:gameId" element={<Lobby />} />
            <Route path="/game/:gameId" element={<Game />} />
            <Route path="/recap/:gameId" element={<Recap />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App; 