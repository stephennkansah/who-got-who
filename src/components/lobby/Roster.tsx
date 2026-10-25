import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../../types';
import PlayerAvatar from '../PlayerAvatar';

interface RosterProps {
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  maxPlayers: number;
  onEditSelf: () => void;
  onManage: (player: Player) => void;
}

const GHOST_TARGET = 4; // the game is best with at least this many

/** Who's in, who's ready, and room for more. */
export default function Roster({ players, currentPlayerId, isHost, maxPlayers, onEditSelf, onManage }: RosterProps) {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  // Briefly highlight anyone who arrives while you're watching.
  useEffect(() => {
    const ids = new Set(players.map((player) => player.id));
    if (seen.current) {
      const arrivals = players.filter((player) => !seen.current!.has(player.id)).map((player) => player.id);
      if (arrivals.length) {
        setFresh((current) => new Set([...Array.from(current), ...arrivals]));
        window.setTimeout(() => {
          setFresh((current) => new Set(Array.from(current).filter((id) => !arrivals.includes(id))));
        }, 2500);
      }
    }
    seen.current = ids;
  }, [players]);

  const guests = players.filter((player) => !player.isHost);
  const readyCount = guests.filter((player) => player.lockedIn).length;
  const ghostSlots = Math.max(0, Math.min(GHOST_TARGET, maxPlayers) - players.length);

  return (
    <div className="card">
      <div className="flex-between" style={{ marginBottom: '0.9rem' }}>
        <span className="overline">The roster · {players.length}/{maxPlayers}</span>
        {guests.length > 0 && (
          <span className="overline" style={{ color: readyCount === guests.length ? 'var(--success)' : 'var(--text-muted)' }}>
            {readyCount}/{guests.length} ready
          </span>
        )}
      </div>

      <ul className="roster">
        {players.map((player) => {
          const isYou = player.id === currentPlayerId;
          const status = player.isHost
            ? 'Host — starts the game'
            : player.lockedIn
              ? 'Ready'
              : 'Not ready yet';
          return (
            <li
              key={player.id}
              className={`roster-row ${isYou ? 'is-me' : ''} ${fresh.has(player.id) ? 'just-joined' : ''}`}
            >
              <PlayerAvatar player={player} size="medium" />
              <div className="roster-info">
                <div className="roster-name">
                  {player.name} {isYou && <span style={{ color: 'var(--amber)' }}>(You)</span>}
                </div>
                <div className={`roster-status ${player.isHost ? 'host' : player.lockedIn ? 'ready' : ''}`}>
                  {!player.isHost && <span className="ready-dot" aria-hidden="true" />}
                  {status}
                </div>
              </div>
              {isYou ? (
                <button className="link-btn" onClick={onEditSelf}>Edit</button>
              ) : isHost ? (
                <button
                  className="roster-more"
                  onClick={() => onManage(player)}
                  aria-label={`Options for ${player.name}`}
                >
                  ⋯
                </button>
              ) : null}
            </li>
          );
        })}
        {Array.from({ length: ghostSlots }, (_, index) => (
          <li key={`ghost-${index}`} className="roster-row ghost" aria-hidden="true">
            <span className="ghost-avatar" />
            <span className="roster-status">
              {index === 0 ? 'Waiting for agents — best with 4 or more' : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
