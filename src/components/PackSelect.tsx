import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { getAllPackOptions } from '../data/packCatalog';

interface PackSelectProps {
  gameId: string;
}

type PackId = 'core' | 'remote' | 'holiday-challenge';

interface PackTileProps {
  icon: string;
  name: string;
  description: string;
  example: string;
  selected: boolean;
  dimmed: boolean;
  clickable: boolean;
  onSelect: () => void;
}

const PackTile: React.FC<PackTileProps> = ({
  icon, name, description, example, selected, dimmed, clickable, onSelect,
}) => (
  <button
    onClick={onSelect}
    disabled={!clickable}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'center',
      background: selected ? 'var(--primary-gradient)' : 'white',
      color: selected ? 'white' : 'var(--text-main)',
      border: selected ? '3px solid var(--primary)' : '2px solid #e5e7eb',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem 1rem',
      opacity: dimmed ? 0.45 : 1,
      cursor: clickable ? 'pointer' : 'default',
      transition: 'transform 0.1s ease, box-shadow 0.15s ease',
      boxShadow: selected ? '0 6px 18px rgba(139, 92, 246, 0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
    }}
  >
    <div style={{ fontSize: '2.4rem', marginBottom: '0.4rem' }} aria-hidden="true">{icon}</div>
    <div style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.3rem' }}>
      {name} {selected && '✓'}
    </div>
    <div style={{ fontSize: '0.85rem', opacity: 0.85, lineHeight: 1.4, marginBottom: '0.6rem' }}>
      {description}
    </div>
    <div style={{
      fontSize: '0.78rem',
      fontStyle: 'italic',
      padding: '0.5rem 0.7rem',
      background: selected ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.04)',
      borderRadius: '8px',
    }}>
      {example}
    </div>
  </button>
);

const PackSelect: React.FC<PackSelectProps> = ({ gameId }) => {
  const { state, selectPack } = useGame();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const packs = getAllPackOptions();
  const currentGame = state.currentGame;
  const isHost = currentGame?.hostId === state.currentPlayer?.id;
  const packAlreadySelected = currentGame?.settings?.selectedPack;

  const handlePackSelect = async (packId: PackId) => {
    if (packAlreadySelected || !isHost || isLoading) return;

    setIsLoading(true);
    try {
      await selectPack(packId);
      navigate(`/lobby/${gameId}`);
    } catch {
      // Errors surface via the global toast bridge.
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentGame) {
    return (
      <div className="container flex-center">
        <div className="card text-center" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} aria-hidden="true">🚫</div>
          <h2>Game not found</h2>
          <p style={{ marginBottom: '1.5rem' }}>This game doesn't exist or has ended.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  const tile = (packId: PackId) => ({
    selected: packAlreadySelected === packId,
    dimmed: !!packAlreadySelected && packAlreadySelected !== packId,
    clickable: !packAlreadySelected && isHost && !isLoading,
    onSelect: () => handlePackSelect(packId),
  });

  const selectedName = packs?.find(p => p.id === packAlreadySelected)?.name;

  return (
    <div className="container">
      <header style={{ textAlign: 'center', margin: '0.5rem 0 1.25rem' }}>
        <h1 style={{ fontSize: '1.9rem', marginBottom: '0.2rem' }}>🎮 Choose Your Game</h1>
        <div className="app-subtitle">
          {packAlreadySelected
            ? `Pack selected: ${selectedName || 'Unknown pack'}`
            : isHost
              ? 'Pick a pack — the lobby opens right after'
              : 'The host is choosing a pack for everyone…'}
        </div>
      </header>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ margin: '0 0 0.15rem' }}>🕵️ Who Got Who?</h3>
          <p style={{ fontSize: '0.82rem', margin: 0 }}>
            Everyone gets <strong>different secret tasks</strong> — complete yours without getting caught.
          </p>
        </div>

        <div className="flex-column gap-1">
          <PackTile
            icon="🏠"
            name="Core Pack"
            description="Classic stealth missions for in-person groups — parties, dinners, game nights."
            example="💡 “Get a player to scratch your back for 10 seconds”"
            {...tile('core')}
          />
          <PackTile
            icon="📱"
            name="Remote Pack"
            description="Stealth missions built for group chats and long-distance friends."
            example="💡 “Get a player to send you a voice note”"
            {...tile('remote')}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ margin: '0 0 0.15rem' }}>🏁 You Got Who?</h3>
          <p style={{ fontSize: '0.82rem', margin: 0 }}>
            Everyone races the <strong>same 10 challenges</strong> — no stealth, all speed.
          </p>
        </div>

        <PackTile
          icon="🏖️"
          name="Holiday Challenge Pack"
          description="Social challenges perfect for holidays, trips, and big gatherings."
          example="💡 “Get someone to take a group photo of your team” 📸"
          {...tile('holiday-challenge')}
        />
      </div>

      {isLoading && (
        <p className="app-subtitle" style={{ marginBottom: '0.75rem' }}>
          ⏳ Setting up your pack…
        </p>
      )}

      <div style={{ textAlign: 'center' }}>
        <button
          className="btn btn-ghost btn-small"
          onClick={() => navigate('/')}
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
};

export default PackSelect;
