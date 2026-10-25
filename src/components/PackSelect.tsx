import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { getAllPackOptions } from '../data/packCatalog';
import BrandMark from './common/BrandMark';

interface PackSelectProps {
  gameId: string;
}

type PackId = 'core' | 'remote' | 'holiday-challenge';

interface PackTileProps {
  name: string;
  description: string;
  example: string;
  selected: boolean;
  dimmed: boolean;
  clickable: boolean;
  onSelect: () => void;
}

const PackTile: React.FC<PackTileProps> = ({
  name, description, example, selected, dimmed, clickable, onSelect,
}) => (
  <button
    onClick={onSelect}
    disabled={!clickable}
    className="paper-card"
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'center',
      padding: '1.25rem 1rem',
      opacity: dimmed ? 0.4 : 1,
      cursor: clickable ? 'pointer' : 'default',
      transition: 'transform 0.08s ease',
      outline: selected ? '3px solid var(--primary)' : 'none',
      outlineOffset: '2px',
    }}
  >
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: '1.5rem',
      letterSpacing: '0.06em',
      color: 'var(--paper-ink)',
      marginBottom: '0.3rem',
    }}>
      {name}
    </div>
    {selected && (
      <div className="stamp danger" style={{ marginBottom: '0.4rem' }}>Selected</div>
    )}
    <div style={{ fontSize: '0.9rem', color: '#4c4636', lineHeight: 1.45, marginBottom: '0.6rem' }}>
      {description}
    </div>
    <div className="type" style={{
      fontSize: '0.85rem',
      color: 'var(--paper-dim)',
      padding: '0.5rem 0.7rem',
      background: 'rgba(35, 32, 20, 0.05)',
      borderRadius: '6px',
    }}>
      {example}
    </div>
  </button>
);

const PackSelect: React.FC<PackSelectProps> = ({ gameId }) => {
  const { state, selectPack, leaveGame } = useGame();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const packs = getAllPackOptions();
  const currentGame = state.currentGame;
  const isHost = currentGame?.hostId === state.currentPlayer?.id;
  const packAlreadySelected = currentGame?.settings?.selectedPack;
  const canChoose = isHost && currentGame?.status === 'draft';

  const handlePackSelect = async (packId: PackId) => {
    if (!canChoose || isLoading) return;
    if (packId === packAlreadySelected) {
      navigate(`/lobby/${gameId}`, { replace: true });
      return;
    }

    setIsLoading(true);
    try {
      await selectPack(packId);
      navigate(`/lobby/${gameId}`, { replace: true });
    } catch {
      // Errors surface via the global toast bridge.
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    if (packAlreadySelected) {
      navigate(`/lobby/${gameId}`, { replace: true });
      return;
    }
    // Backing out before choosing a pack abandons the brand-new game.
    try {
      await leaveGame();
    } catch {
      // Best-effort; still go home.
    }
    navigate('/', { replace: true });
  };

  if (!currentGame) {
    return (
      <div className="container flex-center">
        <div className="card text-center" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} aria-hidden="true">✕</div>
          <h2>Game not found</h2>
          <p style={{ marginBottom: '1.5rem' }}>This game doesn't exist or has ended.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const tile = (packId: PackId) => ({
    selected: packAlreadySelected === packId,
    dimmed: !canChoose && !!packAlreadySelected && packAlreadySelected !== packId,
    clickable: canChoose && !isLoading,
    onSelect: () => handlePackSelect(packId),
  });

  const selectedName = packs?.find(p => p.id === packAlreadySelected)?.name;

  return (
    <div className="container">
      <button className="back-link" onClick={handleBack}>
        ← {packAlreadySelected ? 'Lobby' : 'Home'}
      </button>
      <header style={{ textAlign: 'center', margin: '0.25rem 0 1.25rem' }}>
        <BrandMark className="brand-mark-centered" />
        <h1 style={{ fontSize: '1.9rem', marginBottom: '0.2rem' }}>Choose Your Game</h1>
        <div className="app-subtitle">
          {!isHost
            ? 'The host is choosing a pack for everyone…'
            : packAlreadySelected
              ? `Current pack: ${selectedName || 'Unknown pack'} — tap another to switch`
              : 'Pick a pack — the lobby opens right after'}
        </div>
      </header>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ margin: '0 0 0.15rem' }}>Who Got Who?</h3>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>
            Everyone gets <strong>different secret tasks</strong> — complete yours without getting caught.
          </p>
        </div>

        <div className="flex-column gap-1">
          <PackTile
            name="Core Pack"
            description="Classic stealth missions for in-person groups — parties, dinners, game nights."
            example="e.g. “Get a player to pick up something you dropped and hand it back”"
            {...tile('core')}
          />
          <PackTile
            name="Remote Pack"
            description="Stealth missions built for group chats and long-distance friends."
            example="e.g. “Get a player to send you a photo of their fridge”"
            {...tile('remote')}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ margin: '0 0 0.15rem' }}>You Got Who?</h3>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>
            Everyone races the <strong>same 10–15 challenges</strong> — no stealth, all speed.
          </p>
        </div>

        <PackTile
          name="Holiday Challenge Pack"
          description="Social challenges perfect for holidays, trips, and big gatherings."
          example="e.g. “Get a local to tell you where the best ice cream is”"
          {...tile('holiday-challenge')}
        />
      </div>

      {isLoading && (
        <p className="app-subtitle" style={{ marginBottom: '0.75rem' }}>
          Setting up your pack…
        </p>
      )}

      <div style={{ textAlign: 'center' }}>
        <button
          className="btn btn-ghost btn-small"
          onClick={handleBack}
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          {packAlreadySelected ? 'Back to lobby' : 'Back to home'}
        </button>
      </div>
    </div>
  );
};

export default PackSelect;
