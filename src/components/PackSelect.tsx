import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { getAllPacks, getAllPackOptions } from '../data/packs';

interface PackSelectProps {
  gameId: string;
}

const PackSelect: React.FC<PackSelectProps> = ({ gameId }) => {
  const { state, selectPack } = useGame();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'who-got-who' | 'you-got-who'>('who-got-who');
  
  const packs = getAllPackOptions();
  const currentGame = state.currentGame;
  const isHost = currentGame?.hostId === state.currentPlayer?.id;

  // If pack already selected, show read-only view
  const packAlreadySelected = currentGame?.settings?.selectedPack;

  const handlePackSelect = async (packId: 'core' | 'remote' | 'holiday-challenge') => {
    if (packAlreadySelected || !isHost || isLoading) return;

    setIsLoading(true);
    try {
      await selectPack(packId);
      navigate(`/lobby/${gameId}`);
    } catch (error) {
      console.error('Failed to select pack:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPackTileStyle = (packId: string, isSelected: boolean) => ({
    background: isSelected 
      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    border: isSelected ? '3px solid #1d4ed8' : '2px solid #cbd5e1',
    borderRadius: '16px',
    padding: '1.5rem',
    cursor: packAlreadySelected || !isHost ? 'default' : 'pointer',
    transition: 'all 0.3s ease',
    opacity: packAlreadySelected && packAlreadySelected !== packId ? 0.5 : 1,
    color: isSelected ? 'white' : '#1e293b'
  });

  const getExampleStyle = (packId: string, isSelected: boolean) => ({
    fontSize: '0.8rem',
    color: isSelected ? '#e2e8f0' : '#64748b',
    fontStyle: 'italic',
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
    borderRadius: '8px',
    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}`
  });

  if (!currentGame) {
    return (
      <div style={{ 
        padding: '2rem',
        maxWidth: '800px', 
        margin: '0 auto',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Game Not Found
          </h2>
          <p style={{ 
            color: '#64748b', 
            fontSize: '1rem',
            marginBottom: '2rem'
          }}>
            This game doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 2rem',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '0.5rem'
          }}>
            🎮 Choose Your Pack
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '1rem',
            margin: 0
          }}>
            {packAlreadySelected 
              ? `Pack selected: ${packs?.find(p => p.id === packAlreadySelected)?.name || 'Unknown Pack'}`
              : isHost 
                ? 'Select which type of game you want to play'
                : 'Waiting for host to choose a pack...'
            }
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          marginBottom: '2rem',
          borderRadius: '12px',
          background: '#f1f5f9',
          padding: '4px'
        }}>
          <button
            onClick={() => setActiveTab('who-got-who')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'who-got-who' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                : 'transparent',
              color: activeTab === 'who-got-who' ? 'white' : '#64748b'
            }}
          >
            WHO GOT WHO?
          </button>
          <button
            onClick={() => setActiveTab('you-got-who')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'you-got-who' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                : 'transparent',
              color: activeTab === 'you-got-who' ? 'white' : '#64748b'
            }}
          >
            YOU GOT WHO?
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'who-got-who' ? (
          <div>
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                WHO GOT WHO?
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: '#64748b',
                lineHeight: '1.4'
              }}>
                🕵️ <strong>Secret stealth-based gameplay</strong><br/>
                Each player gets different secret tasks. Complete them without getting caught and target other players when you succeed.
              </p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              
              {/* Core Pack */}
              <div 
                style={getPackTileStyle('core', packAlreadySelected === 'core')}
                onClick={() => handlePackSelect('core')}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    🏠
                  </div>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Core Pack
                  </h3>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    margin: '0 0 1rem 0',
                    opacity: 0.8,
                    lineHeight: '1.3'
                  }}>
                    Classic stealth gameplay for in-person groups. Each player gets unique secret tasks.
                  </p>
                  
                  <div style={getExampleStyle('core', packAlreadySelected === 'core')}>
                    💡 Example: "Get a player to scratch your back for 10 seconds"
                  </div>
                </div>
              </div>

              {/* Remote Pack */}
              <div 
                style={getPackTileStyle('remote', packAlreadySelected === 'remote')}
                onClick={() => handlePackSelect('remote')}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    📱
                  </div>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Remote Pack
                  </h3>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    margin: '0 0 1rem 0',
                    opacity: 0.8,
                    lineHeight: '1.3'
                  }}>
                    Stealth gameplay for remote groups. Each player gets unique secret tasks designed for digital interaction.
                  </p>
                  
                  <div style={getExampleStyle('remote', packAlreadySelected === 'remote')}>
                    💡 Example: "Get a player to send you a voice note"
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                YOU GOT WHO?
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: '#64748b',
                lineHeight: '1.4'
              }}>
                🏁 <strong>Social challenge racing gameplay</strong><br/>
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>Everyone gets the exact same 10 challenges!</span> Race to complete them first. No stealth required - it's all about speed and social interaction.
              </p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              justifyContent: 'center',
              marginBottom: '2rem'
            }}>

              {/* Holiday Challenge Pack */}
              <div 
                style={getPackTileStyle('holiday-challenge', packAlreadySelected === 'holiday-challenge')}
                onClick={() => handlePackSelect('holiday-challenge')}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    🏖️
                  </div>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Holiday Challenge Pack
                  </h3>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    margin: '0 0 1rem 0',
                    opacity: 0.8,
                    lineHeight: '1.3'
                  }}>
                    <span style={{ color: '#3b82f6', fontWeight: '600' }}>Everyone gets the same 10 challenges!</span> Racing gameplay perfect for holidays and social gatherings.
                  </p>
                  
                  <div style={getExampleStyle('holiday-challenge', packAlreadySelected === 'holiday-challenge')}>
                    💡 Example: "Get someone to take a group photo of your team" 📸
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            color: '#6366f1',
            fontWeight: '500'
          }}>
            🔄 Selecting pack...
          </div>
        )}

        {/* Navigation */}
        {!packAlreadySelected && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ 
              color: '#64748b', 
              fontSize: '0.9rem',
              margin: 0
            }}>
              {isHost 
                ? 'Click a pack above to continue to the lobby'
                : 'The host will choose the pack for everyone'
              }
            </p>
          </div>
        )}

        {/* Back to Home Button */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              color: '#64748b',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackSelect; 