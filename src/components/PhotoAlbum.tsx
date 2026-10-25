import React, { useState } from 'react';
import { ChallengeCompletion, Game } from '../types';
import Modal from './common/Modal';

interface PhotoAlbumProps {
  game: Game;
  completions: ChallengeCompletion[];
}

/** Grid of challenge proof photos; tap one to see it full size. */
export default function PhotoAlbum({ game, completions }: PhotoAlbumProps) {
  const [viewing, setViewing] = useState<ChallengeCompletion | null>(null);

  const caption = (completion: ChallengeCompletion) => {
    const who = game.players.find((player) => player.id === completion.playerId)?.name || 'A player';
    const what = game.selectedChallenges?.find((challenge) => challenge.id === completion.challengeId)?.text;
    return { who, what };
  };

  return (
    <>
      <div className="album-grid">
        {completions.map((completion) => {
          const { who, what } = caption(completion);
          return (
            <button
              key={completion.id}
              className="album-thumb"
              onClick={() => setViewing(completion)}
              aria-label={`${who}: ${what || 'challenge photo'}`}
            >
              <img src={completion.proofUrl} alt="" loading="lazy" />
              <span className="album-who">{who}</span>
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        ariaLabel="Challenge photo"
        showClose
        maxWidth={480}
      >
        {viewing && (
          <>
            <img
              src={viewing.proofUrl}
              alt={caption(viewing).what || 'Challenge photo'}
              style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginTop: '1.5rem' }}
            />
            <p style={{ margin: '0.75rem 0 0', textAlign: 'left' }}>
              <strong style={{ color: 'var(--paper-ink)' }}>{caption(viewing).who}</strong>
              {' · '}{viewing.type === 'gold' ? 'Gold' : 'Silver'}
              {caption(viewing).what && <><br />{caption(viewing).what}</>}
            </p>
          </>
        )}
      </Modal>
    </>
  );
}
