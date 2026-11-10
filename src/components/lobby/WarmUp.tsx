import React, { useState } from 'react';

// Invented examples only (EXAMPLE_ONLY_KEYWORDS in packs.ts keeps them out of the
// real packs), so practising here can never spoil a mission someone is dealt.
const PRACTICE = [
  { mission: 'Get a player to do 10 push-ups', hint: "Bet them they can't — then look doubtful." },
  { mission: 'Get a player to start a conga line', hint: 'Wait for the right song and look bored of sitting.' },
  { mission: 'Get a player to challenge you to a thumb war', hint: 'Brag that your thumbs are undefeated.' },
  {
    mission: 'Get a player to pick up something you dropped and hand it back',
    hint: '“Accidentally” knock your keys off the table by their feet.',
  },
];

/** Something to do while the lobby fills: think through a made-up mission. */
export default function WarmUp({ missions }: { missions: number }) {
  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const practice = PRACTICE[index % PRACTICE.length];

  return (
    <div className="paper-card warm-up">
      <div className="type warm-up-label">Warm up · a made-up mission</div>
      <div className="warm-up-mission">“{practice.mission}”</div>
      {showHint ? (
        <div className="warm-up-hint">
          <strong>One sneaky way:</strong> {practice.hint}
        </div>
      ) : (
        <div className="warm-up-ask">How would you pull that off without them noticing?</div>
      )}
      <div className="warm-up-actions">
        {!showHint && (
          <button className="btn btn-secondary btn-small" onClick={() => setShowHint(true)}>
            Show a Sneaky Way
          </button>
        )}
        <button
          className="btn btn-secondary btn-small"
          onClick={() => {
            setIndex((value) => value + 1);
            setShowHint(false);
          }}
        >
          Try Another
        </button>
      </div>
      <p className="warm-up-note">
        Your {missions} real missions stay secret until the host starts.
      </p>
    </div>
  );
}
