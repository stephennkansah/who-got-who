import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Player, AwardType } from '../types';
import ResultsShare from './ResultsShare';
import PlayerAvatar from './PlayerAvatar';



export default function Recap() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, createGame, leaveGame } = useGame();
  const [showTimeline, setShowTimeline] = useState(false);
  const [showAwards, setShowAwards] = useState(false);

  const currentGame = state.currentGame;
  const currentPlayer = state.currentPlayer;

  useEffect(() => {
    if (!gameId || !currentGame) {
      navigate('/');
      return;
    }
  }, [gameId, currentGame, navigate]);

  const getWinner = (): Player | null => {
    if (!currentGame) return null;
    
    const sortedPlayers = [...currentGame.players].sort((a, b) => b.score - a.score);
    return sortedPlayers[0] || null;
  };

  const getFinalRankings = (): Player[] => {
    if (!currentGame) return [];
    
    return [...currentGame.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreaker: fewer failed attempts
      return (a.stats?.failed || 0) - (b.stats?.failed || 0);
    });
  };

  const getPlayerAwards = (player: Player): AwardType[] => {
    if (!currentGame) return [];
    
    const awards: AwardType[] = [];
    const allPlayers = currentGame.players;
    
    // Sneakiest (Most successful Gotchas)
    const maxGotchas = Math.max(...allPlayers.map(p => p.stats?.gothcas || 0));
    if ((player.stats?.gothcas || 0) === maxGotchas && maxGotchas > 0) {
      awards.push('sneakiest');
    }
    
    // Social Butterfly (Most unique targets)
    const maxTargets = Math.max(...allPlayers.map(p => p.stats?.uniqueTargets?.length || 0));
    if ((player.stats?.uniqueTargets?.length || 0) === maxTargets && maxTargets > 1) {
      awards.push('social');
    }
    
    // Detective (Caught the most people - disputes won)
    // TODO: Track disputes won
    
    // Untouchable (Least times caught)
    const minFailed = Math.min(...allPlayers.map(p => p.stats?.failed || 0));
    if ((player.stats?.failed || 0) === minFailed && allPlayers.length > 3) {
      awards.push('untouchable');
    }
    
    // Court Jester (Most failed attempts)
    const maxFailed = Math.max(...allPlayers.map(p => p.stats?.failed || 0));
    if ((player.stats?.failed || 0) === maxFailed && maxFailed > 2) {
      awards.push('jester');
    }
    
    // Chaos Agent (Most disputes created)
    // TODO: Track disputes created
    
    return awards.slice(0, 2); // Max 2 awards per player
  };

  const getAwardInfo = (awardType: AwardType) => {
    const awards = {
      sneakiest: { name: 'Sneakiest', icon: '🥷', description: 'Most successful Gotchas' },
      social: { name: 'Social Butterfly', icon: '🦋', description: 'Most unique targets' },
      detective: { name: 'Detective', icon: '🕵️', description: 'Caught the most people' },
      untouchable: { name: 'Untouchable', icon: '👻', description: 'Least times caught' },
      jester: { name: 'Court Jester', icon: '🃏', description: 'Most failed attempts' },
      chaos: { name: 'Chaos Agent', icon: '💥', description: 'Most disputes created' }
    };
    
    return awards[awardType];
  };

  const handleNewGame = async () => {
    if (currentGame && currentPlayer) {
      await createGame(currentPlayer.name);
    }
  };

  const handleNewGroup = async () => {
    // Clear game state and return to home
    await leaveGame();
    navigate('/');
  };

  if (!currentGame) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p style={{ marginBottom: '30px' }}>Loading game results...</p>
          
          <button
            onClick={() => navigate('/')}
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

  const winner = getWinner();
  const finalRankings = getFinalRankings();
  const isWinner = winner?.id === currentPlayer?.id;

  return (
    <div className="container">
      {/* Winner Banner */}
      <div className={`card text-center ${isWinner ? 'winner-banner' : ''}`} style={{ 
        background: isWinner 
          ? 'linear-gradient(135deg, #ffd700, #ffed4e)' 
          : 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(238, 90, 111, 0.2))',
        color: isWinner ? '#000' : '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '2.5rem', margin: '1rem 0' }}>
            {isWinner ? '🎉 You Won! 🎉' : '🏆 Game Over'}
          </h1>
          {winner && (
            <h2 style={{ margin: '0.5rem 0' }}>
              {isWinner ? '🥇 Congratulations!' : `🏆 ${winner.name} Wins!`}
            </h2>
          )}
          <p className="text-small" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            Final Score: {winner?.score || 0} points
          </p>
        </div>
        {isWinner && (
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            fontSize: '3rem',
            animation: 'float 2s ease-in-out infinite' 
          }}>
            🎊
          </div>
        )}
      </div>

      {/* Final Rankings */}
      <div className="card">
        <div className="card-header">
          <h3>🏅 Final Standings</h3>
        </div>
        
        {finalRankings.map((player: Player, index: number) => (
          <div key={player.id} className="flex flex-between" style={{ 
            padding: '1.5rem', 
            borderRadius: '15px',
            margin: '0.5rem 0',
            background: player.id === currentPlayer?.id 
              ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(238, 90, 111, 0.3))'
              : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </span>
              <PlayerAvatar player={player} size="medium" />
              <div>
                <strong style={{ fontSize: '1.1rem' }}>{player.name}</strong>
                {player.id === currentPlayer?.id && <span className="text-small"> 👤 (You)</span>}
              </div>
            </div>
            <div style={{ marginLeft: '4rem' }}>
              
              {/* Player awards */}
              <div style={{ marginTop: '0.8rem' }}>
                {getPlayerAwards(player).map((awardType: AwardType) => {
                  const award = getAwardInfo(awardType);
                  return (
                    <span key={awardType} className="score-badge" style={{ 
                      background: 'linear-gradient(135deg, #ffd93d, #ff6b6b)', 
                      color: '#000',
                      margin: '0 0.25rem',
                      fontSize: '0.75rem',
                      padding: '4px 8px'
                    }}>
                      {award.icon} {award.name}
                    </span>
                  );
                })}
              </div>
            </div>
            
            <div className="text-center">
              <div className="score-badge" style={{ 
                background: 'linear-gradient(135deg, #56ab2f, #a8e6cf)',
                fontSize: '1.2rem',
                padding: '8px 16px'
              }}>
                {player.score}
              </div>
              <div className="text-small" style={{ marginTop: '0.5rem' }}>
                🎯 {player.stats?.gothcas || 0} Gotchas
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Game Stats */}
      <div className="card card-demo">
        <div className="card-header">
          <h3>📊 Game Statistics</h3>
        </div>
        
        <div className="text-small" style={{ lineHeight: '1.8' }}>
          <div className="flex flex-between" style={{ margin: '0.8rem 0' }}>
            <span>🎮 Game Mode:</span>
            <strong style={{ color: '#56ab2f' }}>
              🌟 Standard Game
            </strong>
          </div>
          <div className="flex flex-between" style={{ margin: '0.8rem 0' }}>
            <span>👥 Total Players:</span>
            <strong>{currentGame.players.length}</strong>
          </div>
          <div className="flex flex-between" style={{ margin: '0.8rem 0' }}>
            <span>⏱️ Game Duration:</span>
            <strong>
              {Math.round((new Date().getTime() - new Date(currentGame.createdAt).getTime()) / (1000 * 60))} min
            </strong>
          </div>
          <div className="flex flex-between" style={{ margin: '0.8rem 0' }}>
            <span>🎯 Total Gotchas:</span>
            <strong>
              {currentGame.players.reduce((sum, p) => sum + (p.stats?.gothcas || 0), 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* Awards Section */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.2), rgba(255, 107, 107, 0.2))' }}>
        <div className="flex flex-between" style={{ marginBottom: '1rem' }}>
          <h3>🏆 Awards</h3>
          <button 
            className="btn btn-small btn-secondary"
            onClick={() => setShowAwards(!showAwards)}
          >
            {showAwards ? '🙈 Hide' : '👀 Show'} Awards
          </button>
        </div>
        
        {showAwards && (
          <div>
            {finalRankings.map((player: Player) => {
              const awards = getPlayerAwards(player);
              if (awards.length === 0) return null;
              
              return (
                <div key={player.id} style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <strong style={{ fontSize: '1.1rem' }}>🎖️ {player.name}</strong>
                  <div style={{ marginTop: '0.8rem' }}>
                    {awards.map((awardType: AwardType) => {
                      const award = getAwardInfo(awardType);
                      return (
                        <div key={awardType} style={{ margin: '0.5rem 0', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{award.icon} <strong>{award.name}</strong></span>
                          <div className="text-small" style={{ marginTop: '0.25rem' }}>{award.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="flex flex-between" style={{ marginBottom: '1rem' }}>
          <h3>📅 Game Timeline</h3>
          <button 
            className="btn btn-small btn-secondary"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            {showTimeline ? '🙈 Hide' : '👀 Show'} Timeline
          </button>
        </div>
        
        {showTimeline && (
          <div className="text-small">
            <div style={{ 
              padding: '1rem', 
              borderLeft: '4px solid #4ecdc4', 
              marginLeft: '1rem',
              background: 'rgba(78, 205, 196, 0.1)',
              borderRadius: '0 8px 8px 0',
              marginBottom: '1rem'
            }}>
              <p><strong>🎮 Game Created</strong></p>
              <p>👑 Host: {currentGame.createdBy}</p>
              <p>⏰ {new Date(currentGame.createdAt).toLocaleString()}</p>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              borderLeft: '4px solid #56ab2f', 
              marginLeft: '1rem',
              background: 'rgba(86, 171, 47, 0.1)',
              borderRadius: '0 8px 8px 0'
            }}>
              <p><strong>🏁 Game Ended</strong></p>
              <p>🏆 Winner: {winner?.name || 'No winner'}</p>
              <p>⏰ {new Date().toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(68, 160, 141, 0.2))' }}>
        <h3>🚀 What's Next?</h3>
        
        <div className="flex flex-column gap-1">
          <button 
            className="btn"
            onClick={handleNewGame}
            disabled={state.isLoading}
            style={{ background: 'linear-gradient(135deg, #4ecdc4, #44a08d)' }}
          >
            🔄 New Game (Same Group)
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleNewGroup}
          >
            👥 Play with New Group
          </button>
          
          <ResultsShare 
            game={currentGame}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Back to Home */}
      <div className="text-center" style={{ margin: '2rem 0' }}>
        <button 
          className="btn btn-small btn-secondary"
          onClick={() => navigate('/')}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
} 