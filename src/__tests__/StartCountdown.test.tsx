import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import StartCountdown from '../components/common/StartCountdown';
import { clearJustJoined, markJustJoined, takeJustJoined } from '../utils/justJoined';
import { nightStats } from '../utils/nightStats';
import { Game, Player, TaskInstance } from '../types';

describe('the 3-2-1 start', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const step = () => act(() => {
    jest.advanceTimersByTime(850);
  });

  it('counts 3, 2, 1 and then lets the game begin', () => {
    const onDone = jest.fn();
    render(<StartCountdown onDone={onDone} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    step();
    expect(screen.getByText('2')).toBeInTheDocument();
    step();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    step();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Get ready')).not.toBeInTheDocument();
  });

  it('can be skipped with a tap', () => {
    const onDone = jest.fn();
    render(<StartCountdown onDone={onDone} />);
    fireEvent.click(screen.getByText('Get ready'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('the "You\'re In!" welcome', () => {
  it('fires once, and only for the game you just joined', () => {
    markJustJoined('ABC123');
    expect(takeJustJoined('ZZZ999')).toBe(false);
    expect(takeJustJoined('ABC123')).toBe(true);
    expect(takeJustJoined('ABC123')).toBe(false);
  });

  it('is dropped if joining fails', () => {
    markJustJoined('ABC123');
    clearJustJoined();
    expect(takeJustJoined('ABC123')).toBe(false);
  });
});

describe('your night', () => {
  const task = (owner: string, n: number, status: TaskInstance['status'], targetId?: string): TaskInstance => ({
    id: `${owner}-${n}`, gameId: 'G', playerId: owner, text: `${owner} ${n}`, status, targetId,
  });
  const player = (id: string, tasks: TaskInstance[]): Player => ({
    id, name: id, gameId: 'G', swapsLeft: 0, score: 0, lockedIn: true, isHost: false, token: '', tasks,
    stats: { gothcas: 0, failed: 0, disputesLost: 0, uniqueTargets: [], firstTimeTargets: 0 },
  });
  const ana = player('Ana', [task('Ana', 1, 'completed', 'Ben'), task('Ana', 2, 'completed', 'Ben'), task('Ana', 3, 'failed', 'Cy')]);
  const ben = player('Ben', [task('Ben', 1, 'completed', 'Ana'), task('Ben', 2, 'failed', 'Ana')]);
  const cy = player('Cy', [task('Cy', 1, 'failed', 'Ana'), task('Cy', 2, 'pending')]);
  const game = { id: 'G', gameType: 'traditional', players: [ana, ben, cy] } as unknown as Game;
  const nameOf = (id?: string) => id || 'someone';

  it('sums up a player\'s game', () => {
    const stats = nightStats(game, ana, 2, nameOf, []);
    expect(stats.title).toBe('Eagle Eyes'); // caught Ben and Cy
    expect(stats.tiles.map((tile) => tile.value)).toEqual(['2/3', 'Ben', '2', 'Ben']);
    expect(stats.tiles[1].label).toBe('favourite target — got them twice');
    expect(stats.tiles[3].label).toBe('got me once');
  });

  it('handles a quiet night', () => {
    const stats = nightStats(game, cy, 3, nameOf, []);
    expect(stats.title).toBe('Good Game');
    expect(stats.tiles.map((tile) => tile.value)).toEqual(['0/2', '—', '1', 'Nobody']);
  });

  it('crowns the winner', () => {
    expect(nightStats(game, ana, 1, nameOf, []).title).toBe('Champion');
  });
});
