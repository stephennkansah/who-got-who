import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { Challenge, ChallengeCompletion } from '../types';
import { getAllHolidayChallenges, challengeRequiresProof } from '../data/packs';
import PlayerAvatar from './PlayerAvatar';

export default function HolidayChallengeGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, completeChallenge, endGame, leaveGame } = useGame();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const currentPlayer = state.currentPlayer;
  const currentGame = state.currentGame;
  const challenges = getAllHolidayChallenges();

  if (!currentGame || !currentPlayer) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p style={{ marginBottom: '30px' }}>Loading Holiday Challenge...</p>
          
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

  if (currentGame.gameType !== 'holiday-challenge') {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>❌ Wrong Game Type</h2>
          <p style={{ marginBottom: '30px' }}>This component is only for Holiday Challenge Pack games.</p>
          
          <button
            onClick={() => navigate(`/game/${gameId}`)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '1em',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🎮 Go to Standard Game
          </button>
        </div>
      </div>
    );
  }

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    
    // Check if challenge requires proof
    if (challengeRequiresProof(challenge.id)) {
      setShowImageUpload(true);
    } else {
      handleCompleteChallenge(challenge, null);
    }
  };

  const handleCompleteChallenge = async (challenge: Challenge, proofImage: File | null) => {
    setIsCompleting(true);
    try {
      await completeChallenge(challenge.id, proofImage || undefined);
      setSelectedChallenge(null);
      setShowImageUpload(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('Error completing challenge:', error);
      alert(`Failed to complete challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleImageUploadConfirm = () => {
    if (selectedChallenge && selectedImage) {
      handleCompleteChallenge(selectedChallenge, selectedImage);
    }
  };

  const handleImageUploadCancel = () => {
    setShowImageUpload(false);
    setSelectedChallenge(null);
    setSelectedImage(null);
  };

  const getChallengeStatus = (challengeId: string) => {
    const completions = currentGame.challengeCompletions || [];
    const challengeCompletions = completions.filter(c => c.challengeId === challengeId);
    
    const playerCompletion = challengeCompletions.find(c => c.playerId === currentPlayer.id);
    if (playerCompletion) {
      return { completed: true, type: playerCompletion.type, points: playerCompletion.points };
    }

    const hasGold = challengeCompletions.some(c => c.type === 'gold');
    return { completed: false, canGetGold: !hasGold, goldTaken: hasGold };
  };

  const handleEndGame = async () => {
    const confirmed = window.confirm(
      '🏁 End Holiday Challenge?\n\nThis will end the game for ALL players and show final results.\n\nThis action cannot be undone.'
    );
    
    if (confirmed) {
      await endGame();
      navigate(`/recap/${gameId}`);
    }
  };

  const handleLeaveGame = async () => {
    const confirmed = window.confirm(
      '🚪 Leave Game?\n\nYou will exit the current game and return to the home screen.\n\nOther players can continue without you.'
    );
    
    if (confirmed) {
      await leaveGame();
      navigate('/');
    }
  };

  const sortedPlayers = [...currentGame.players].sort((a, b) => 
    (b.challengeScore || 0) - (a.challengeScore || 0)
  );

  const winCondition = currentGame.settings.holidayChallengeWinCondition || 7;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0.5rem 0'
      }}>
        {/* Left: Leaderboard Position */}
        <button 
          onClick={() => setShowLeaderboard(true)}
          style={{
            background: 'linear-gradient(135deg, #ffd700, #ffb347)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: '700',
            color: '#8b4513',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(255, 215, 0, 0.3)'
          }}
        >
          <div style={{ fontSize: '1rem' }}>
            {(() => {
              const rank = sortedPlayers.findIndex(p => p.id === currentPlayer.id);
              if (rank === 0) return '🥇';
              if (rank === 1) return '🥈';
              if (rank === 2) return '🥉';
              return `#${rank + 1}`;
            })()}
          </div>
          <div style={{ fontSize: '0.6rem' }}>
            {currentPlayer?.challengeScore || 0}
          </div>
        </button>

        {/* Center: Title */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ 
            fontSize: '1.3rem', 
            margin: '0',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800'
          }}>
            🏖️ Holiday Challenge
          </h1>
          <div style={{ color: '#666', fontSize: '0.75rem', fontWeight: '600' }}>
            First to {winCondition} points wins!
          </div>
        </div>

        {/* Right: Game Controls */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {currentPlayer?.isHost && (
            <button
              onClick={handleEndGame}
              style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(255, 107, 107, 0.3)'
              }}
              title="End Game"
            >
              🏁
            </button>
          )}
          <button
            onClick={handleLeaveGame}
            style={{
              background: 'linear-gradient(135deg, #6c757d, #495057)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(108, 117, 125, 0.3)'
            }}
            title="Leave Game"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Game Info */}
      <div className="card" style={{ 
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
        border: '1px solid #ff9800',
        padding: '0.75rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '0.9rem', 
            marginBottom: '0.3rem',
            fontWeight: '600',
            color: '#e65100'
          }}>
            🎯 Complete challenges to earn points • 🥇 Gold = {currentGame.settings.holidayGoldPoints || 3} pts • 🥈 Silver = {currentGame.settings.holidaySilverPoints || 1} pt
          </div>
          <div style={{ 
            color: '#bf360c', 
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            📸 Some challenges require photo proof!
          </div>
        </div>
      </div>

      {/* Top 3 Leaderboard */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div 
          onClick={() => setShowLeaderboard(true)}
          style={{
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #ffd700, #ffed4a)',
            borderRadius: '12px',
            padding: '0.75rem',
            marginBottom: '1rem',
            border: '2px solid #f59e0b',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ 
            textAlign: 'center', 
            fontSize: '0.9rem', 
            fontWeight: '700',
            color: '#8b4513',
            marginBottom: '0.5rem'
          }}>
            🏆 LEADERBOARD - Click for Full Rankings
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {sortedPlayers.slice(0, 3).map((player, index) => (
              <div key={player.id} style={{
                flex: '1',
                textAlign: 'center',
                background: player.id === currentPlayer?.id 
                  ? 'rgba(59, 130, 246, 0.2)' 
                  : 'rgba(255, 255, 255, 0.7)',
                border: player.id === currentPlayer?.id 
                  ? '2px solid #3b82f6' 
                  : '1px solid rgba(139, 69, 19, 0.2)',
                borderRadius: '8px',
                padding: '0.4rem 0.2rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.1rem' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div style={{ 
                  color: '#8b4513',
                  fontWeight: '700',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {player.name}
                  {player.id === currentPlayer?.id && ' (You)'}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '800',
                  color: '#8b4513'
                }}>
                  {player.challengeScore || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenge List */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ 
          fontSize: '1.2rem', 
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#333'
        }}>
          Holiday Challenges
        </h2>
        
        <div style={{ 
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}>
          {challenges.map((challenge) => {
            const status = getChallengeStatus(challenge.id);
            const requiresProof = challengeRequiresProof(challenge.id);
            
            return (
              <div
                key={challenge.id}
                onClick={() => !status.completed && handleChallengeClick(challenge)}
                style={{
                  background: status.completed 
                    ? (status.type === 'gold' 
                        ? 'linear-gradient(135deg, #ffd700, #ffed4a)' 
                        : 'linear-gradient(135deg, #c0c0c0, #d3d3d3)')
                    : (status.goldTaken 
                        ? 'linear-gradient(135deg, #e3f2fd, #bbdefb)'
                        : 'linear-gradient(135deg, #f8f9fa, #e9ecef)'),
                  border: status.completed 
                    ? `2px solid ${status.type === 'gold' ? '#f59e0b' : '#9ca3af'}`
                    : (status.goldTaken 
                        ? '2px solid #2196f3'
                        : '2px solid #dee2e6'),
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: status.completed ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: status.completed ? 0.8 : 1
                }}
                onMouseEnter={(e) => {
                  if (!status.completed) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!status.completed) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '0.5rem',
                      lineHeight: '1.4'
                    }}>
                      {challenge.text}
                    </div>
                    
                    {requiresProof && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        📸 Requires photo proof
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {status.completed ? (
                      <>
                        <div style={{ fontSize: '1.5rem' }}>
                          {status.type === 'gold' ? '🥇' : '🥈'}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          color: status.type === 'gold' ? '#f59e0b' : '#6b7280'
                        }}>
                          +{status.points}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '1.5rem' }}>
                          {status.goldTaken ? '🥈' : '🥇'}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          color: status.goldTaken ? '#6b7280' : '#f59e0b'
                        }}>
                          {status.goldTaken ? `+${currentGame.settings.holidaySilverPoints || 1}` : `+${currentGame.settings.holidayGoldPoints || 3}`}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && selectedChallenge && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>📸 Upload Proof</h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              {selectedChallenge.text}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}
            />

            {selectedImage && (
              <div style={{
                background: '#e8f5e8',
                padding: '0.5rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#2e7d32'
              }}>
                ✓ Image selected: {selectedImage.name}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleImageUploadCancel}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImageUploadConfirm}
                disabled={!selectedImage || isCompleting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: selectedImage && !isCompleting 
                    ? 'linear-gradient(135deg, #4caf50, #45a049)' 
                    : '#ddd',
                  color: selectedImage && !isCompleting ? 'white' : '#666',
                  cursor: selectedImage && !isCompleting ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {isCompleting ? 'Completing...' : 'Complete Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '70vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#333' }}>🏆 Full Rankings</h3>
              <button
                onClick={() => setShowLeaderboard(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sortedPlayers.map((player, index) => (
                <div key={player.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: player.id === currentPlayer.id 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'rgba(0,0,0,0.02)',
                  borderRadius: '12px',
                  border: player.id === currentPlayer.id 
                    ? '2px solid rgba(59, 130, 246, 0.3)' 
                    : '1px solid rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      fontSize: '1.5rem',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </div>
                    <PlayerAvatar player={player} size="medium" />
                    <div>
                      <div style={{ 
                        fontWeight: '700',
                        fontSize: '1rem',
                        color: '#333'
                      }}>
                        {player.name} {player.id === currentPlayer.id && '(You)'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {player.challengeCompletions?.length || 0} challenges completed
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '900',
                    color: '#333',
                    background: 'rgba(255, 215, 0, 0.2)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 215, 0, 0.5)'
                  }}>
                    {player.challengeScore || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}