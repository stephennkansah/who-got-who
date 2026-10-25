import React from 'react';
import { Game, SettingsUpdate } from '../../types';
import {
  BRIEFING_OPTIONS,
  lobbySummary,
} from '../../utils/gameSettings';

interface GameSetupProps {
  game: Game;
  packName?: string;
  isHost: boolean;
  busy: boolean;
  onChangePack: () => void;
  onUpdate: (settings: SettingsUpdate) => void;
}

function Segmented<T extends string | number>({ label, options, value, disabled, onChange }: {
  label: string;
  options: Array<{ value: T; label: string; sub?: string }>;
  value: T;
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="segmented"
      role="radiogroup"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          role="radio"
          aria-checked={value === option.value}
          className={value === option.value ? 'is-selected' : ''}
          onClick={() => value !== option.value && onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
          {option.sub && <small>{option.sub}</small>}
        </button>
      ))}
    </div>
  );
}

/** Pack and pacing. The host edits; everyone else sees the plan. */
export default function GameSetup({ game, packName, isHost, busy, onChangePack, onUpdate }: GameSetupProps) {
  const summary = lobbySummary(game);
  const what = summary.isHoliday ? 'challenges' : 'gotchas';

  const facts = summary.isHoliday
    ? [
        `${summary.challenges} shared challenges`,
        `first to ${summary.target} points`,
        'gold 3 · silver 1',
      ]
    : [
        `${summary.missions} secret missions each`,
        `first to ${summary.target} points`,
        `${summary.swaps} swaps`,
        `${summary.responseMinutes} min to respond to a claim`,
      ];
  facts.push(summary.briefingMinutes ? `${what} open ${summary.briefingMinutes} min after the start` : `${what} open at the start`);

  return (
    <div className="card">
      <div className="overline" style={{ marginBottom: '0.9rem' }}>Game setup</div>

      <div className="setup-row">
        <div>
          <div className="setup-label">Pack</div>
          <div className="setup-value">{packName || 'Not chosen yet'}</div>
        </div>
        {isHost && <button className="link-btn" onClick={onChangePack}>Change</button>}
      </div>

      {isHost && (
        <div className="setup-block">
          <div className="setup-label">Settling-in time</div>
          <Segmented<number>
            label="Settling-in time before play opens"
            value={summary.briefingMinutes}
            disabled={busy}
            onChange={(briefingMinutes) => onUpdate({ briefingMinutes })}
            options={BRIEFING_OPTIONS.map((minutes) => ({ value: minutes, label: minutes ? `${minutes}m` : 'None' }))}
          />
          <p className="setup-help">Missions arrive at the start; {what} only count once this runs out.</p>
        </div>
      )}

      <ul className="setup-facts" aria-label="This game">
        {facts.map((fact) => <li key={fact}>{fact}</li>)}
      </ul>
    </div>
  );
}
