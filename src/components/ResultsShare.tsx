import React, { useState } from 'react';
import { Game, Player } from '../types';
import Modal from './common/Modal';
import { showToast } from './common/Toast';
import { renderResultsImage } from '../utils/resultsImage';

interface ResultsShareProps {
  game: Game;
  style?: React.CSSProperties;
}

const ResultsShare: React.FC<ResultsShareProps> = ({ game, style }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);

  const isHoliday = game.gameType === 'holiday-challenge';
  const scoreOf = (player: Player) => (isHoliday ? player.challengeScore || 0 : player.score);

  const sortedPlayers = [...game.players].sort((a, b) => scoreOf(b) - scoreOf(a));
  const winner = sortedPlayers[0];

  const totalCompleted = isHoliday
    ? game.challengeCompletions?.length || 0
    : game.players.reduce(
        (sum, player) => sum + player.tasks.filter((task) => task.status === 'completed').length,
        0,
      );

  const gameName = isHoliday ? 'You Got Who?' : 'Who Got Who';
  const missionWord = isHoliday ? 'challenges' : 'secret missions';

  const generateResultsSummary = (): string => {
    let leaderboard = '🏆 FINAL RESULTS:\n';
    sortedPlayers.forEach((player, index) => {
      const emoji = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯';
      leaderboard += `${emoji} ${player.name}: ${scoreOf(player)} points\n`;
    });

    return `🎮 ${gameName} - Game Complete!

${leaderboard}
🎉 Congrats ${winner?.name || 'everyone'}!

${game.players.length} players • ${totalCompleted} ${missionWord} completed

The ultimate social party game!
Play: ${window.location.origin}`;
  };

  const shareOptions = [
    {
      name: 'Share Image',
      action: 'image',
      color: '#b98c36'
    },
    {
      name: 'WhatsApp',
            url: `https://wa.me/?text=${encodeURIComponent(generateResultsSummary())}`,
      color: '#25D366'
    },
    {
      name: 'SMS',
            url: `sms:?body=${encodeURIComponent(generateResultsSummary())}`,
      color: '#007AFF'
    },
    {
      name: 'X / Twitter',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(generateResultsSummary())}`,
      color: '#1DA1F2'
    },
    {
      name: 'Copy Results',
            action: 'copy',
      color: '#8E8E93'
    }
  ];

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(generateResultsSummary());
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = generateResultsSummary();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    showToast('Results copied — go brag!', 'success');
    setShowShareOptions(false);
  };

  // A picture of the final standings travels further than text in group chats.
  const shareImage = async () => {
    try {
      const blob = await renderResultsImage(game);
      const file = new File([blob], `who-got-who-${game.id}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${gameName} — ${winner?.name || 'we'} won! ${window.location.origin}` });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('Results image saved', 'success');
      }
      setShowShareOptions(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      showToast("Couldn't create the image — try Copy Results instead.", 'error');
    }
  };

  const handleOptionClick = (option: typeof shareOptions[0]) => {
    if (option.action === 'image') {
      void shareImage();
    } else if (option.action === 'copy') {
      copyResults();
    } else {
      window.open(option.url, '_blank', 'width=600,height=400');
      setShowShareOptions(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowShareOptions(true)}
        className="btn"
        style={{
          background: 'var(--warning-gradient)',
          color: '#3a2b0c',
          boxShadow: '0 4px 0 var(--warning-deep)',
          ...style
        }}
      >
        Share Results
      </button>

      <Modal
        isOpen={showShareOptions}
        onClose={() => setShowShareOptions(false)}
        ariaLabel="Share your results"
        maxWidth={440}
        showClose
      >
        <h3 style={{ margin: '0 0 1rem', textAlign: 'left' }}>Share Your Victory</h3>

        <div style={{
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          marginBottom: '1.1rem',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-line',
          textAlign: 'left',
          maxHeight: '180px',
          overflowY: 'auto',
        }}>
          {generateResultsSummary()}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => handleOptionClick(option)}
              style={{
                gridColumn: option.action === 'image' ? '1 / -1' : undefined,
                padding: '18px 12px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: `${option.color}18`,
                color: option.color,
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              {option.name}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default ResultsShare;
