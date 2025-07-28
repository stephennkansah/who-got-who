import React, { useState } from 'react';
import { Game, Player } from '../types';

interface ResultsShareProps {
  game: Game;
  style?: React.CSSProperties;
}

const ResultsShare: React.FC<ResultsShareProps> = ({ game, style }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Generate results summary
  const generateResultsText = (): string => {
    const winner = game.players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    
    const playerCount = game.players.length;
    const totalTasks = game.players.reduce((sum, player) => 
      sum + player.tasks.filter(task => task.status === 'completed').length, 0
    );

    const gameUrl = `${window.location.origin}`;
    
    return `🎮 Just finished an epic game of Who Got Who!

🏆 Winner: ${winner.name} (${winner.score} points)
👥 ${playerCount} players battled it out
✅ ${totalTasks} secret missions completed
🎯 Stealth level: LEGENDARY

Who Got Who - the ultimate party game where you complete secret missions on your friends without getting caught!

Play it yourself: ${gameUrl}

#WhoGotWho #PartyGame #SecretMissions #GameNight`;
  };

  const generateResultsSummary = (): string => {
    const winner = game.players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    
    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    
    let leaderboard = "🏆 FINAL RESULTS:\n";
    sortedPlayers.forEach((player, index) => {
      const emoji = index === 0 ? "👑" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎯";
      leaderboard += `${emoji} ${player.name}: ${player.score} points\n`;
    });

    return `🎮 Who Got Who - Game Complete!

${leaderboard}
🎉 Congrats ${winner.name}! Master of stealth missions!

${game.players.length} players • ${game.players.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'completed').length, 0)} tasks completed

The ultimate social party game! 
Play: ${window.location.origin}`;
  };

  const shareOptions = [
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(generateResultsText())}`,
      color: '#1DA1F2'
    },
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(generateResultsText())}`,
      color: '#4267B2'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(generateResultsSummary())}`,
      color: '#25D366'
    },
    {
      name: 'Copy Results',
      icon: '📋',
      action: 'copy',
      color: '#8E8E93'
    }
  ];

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(generateResultsSummary());
      alert('✅ Results copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generateResultsSummary();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Results copied to clipboard!');
    }
    setShowShareOptions(false);
  };

  const handleOptionClick = (option: typeof shareOptions[0]) => {
    if (option.action === 'copy') {
      copyResults();
    } else {
      window.open(option.url, '_blank', 'width=600,height=400');
      setShowShareOptions(false);
    }
  };

  if (showShareOptions) {
    return (
      <div style={{ position: 'relative' }}>
        {/* Backdrop */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowShareOptions(false)}
        >
          {/* Share modal */}
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.3em' }}>
                🎉 Share Your Victory!
              </h3>
              <button
                onClick={() => setShowShareOptions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>

            {/* Results Preview */}
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              fontSize: '0.9em',
              lineHeight: '1.5',
              color: '#374151',
              whiteSpace: 'pre-line'
            }}>
              {generateResultsSummary()}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px'
            }}>
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => handleOptionClick(option)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px 15px',
                    border: 'none',
                    borderRadius: '15px',
                    background: `${option.color}15`,
                    color: option.color,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '0.9em',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = `${option.color}25`;
                    target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.background = `${option.color}15`;
                    target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '2em', marginBottom: '8px' }}>
                    {option.icon}
                  </div>
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowShareOptions(true)}
      style={{
        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
        color: 'white',
        border: 'none',
        borderRadius: '15px',
        padding: '12px 24px',
        fontSize: '1em',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
        transition: 'all 0.3s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'translateY(-2px)';
        target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'translateY(0)';
        target.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
      }}
    >
      🎉 Share Results
    </button>
  );
};

export default ResultsShare; 