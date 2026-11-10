import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecapShow from '../components/recap/RecapShow';
import { awardList, awardsByPlayer } from '../utils/awards';
import { rankPlayers } from '../utils/gameSettings';
import { Game, Player, TaskInstance } from '../types';

const task = (owner: string, n: number, status: TaskInstance['status'], targetId?: string): TaskInstance => ({
  id: `${owner}-${n}`,
  gameId: 'G',
  playerId: owner,
  text: `${owner} mission ${n}`,
  status,
  targetId,
});

const player = (id: string, score: number, tasks: TaskInstance[], place?: number): Player => {
  const done = tasks.filter((item) => item.status === 'completed');
  return {
    id,
    name: id,
    gameId: 'G',
    swapsLeft: 0,
    score,
    lockedIn: true,
    isHost: id === 'Ana',
    token: '',
    tasks,
    stats: {
      gothcas: done.length,
      failed: tasks.filter((item) => item.status === 'failed').length,
      disputesLost: 0,
      uniqueTargets: Array.from(new Set(done.map((item) => item.targetId as string))),
      firstTimeTargets: 0,
    },
    place,
  };
};

const players = [
  player('Ana', 5, [task('Ana', 1, 'completed', 'Ben'), task('Ana', 2, 'completed', 'Cy'), task('Ana', 3, 'pending')], 1),
  player('Ben', 2.5, [task('Ben', 1, 'completed', 'Ana'), task('Ben', 2, 'failed', 'Cy')]),
  player('Cy', 0, [task('Cy', 1, 'pending'), task('Cy', 2, 'failed', 'Ana')]),
];

const game = {
  id: 'G',
  status: 'ended',
  gameType: 'traditional',
  players,
  settings: { targetScore: 5 },
} as unknown as Game;

const show = (onDone = jest.fn(), meId = 'Ben') => {
  render(
    <MemoryRouter>
      <RecapShow
        game={game}
        rankings={rankPlayers(players)}
        meId={meId}
        scoreOf={(p) => p.score}
        nameOf={(id) => players.find((p) => p.id === id)?.name || 'someone'}
        hasWinner
        onDone={onDone}
      />
    </MemoryRouter>,
  );
  return onDone;
};

// Each place steps up on its own timer, set after the one before has appeared.
const finishPodium = () => {
  for (let step = 0; step < 4; step += 1) {
    act(() => {
      jest.advanceTimersByTime(1500);
    });
  }
};

describe('the ending show', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('builds the podium one place at a time, then names the winner', () => {
    show();
    expect(screen.getByText('And the Winner Is…')).toBeInTheDocument();
    expect(screen.queryByText('Ana Wins!')).not.toBeInTheDocument();
    finishPodium();
    expect(screen.getByText('Ana Wins!')).toBeInTheDocument();
  });

  it('walks last place to first, then the awards and your own night, then hands over to the results', () => {
    const onDone = show();
    finishPodium();

    fireEvent.click(screen.getByRole('button', { name: "Reveal Everyone's Missions" }));
    expect(screen.getByText("Cy's Missions")).toBeInTheDocument();
    expect(screen.getByText('Cy mission 2')).toBeInTheDocument();

    // Your own screen says so, and a mission pulled off on you is called out.
    fireEvent.click(screen.getByRole('button', { name: 'Next: You' }));
    expect(screen.getByText('Your Missions')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next: Ana' }));
    expect(screen.getByText(/that was this one/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'The Awards' }));
    expect(screen.getByText('Sneakiest')).toBeInTheDocument();

    // Your own game, summed up, comes last.
    fireEvent.click(screen.getByRole('button', { name: 'Your Night' }));
    expect(screen.getByText('missions pulled off')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'See the Results' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('lets you skip straight to the results', () => {
    const onDone = show();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('awards', () => {
  it('gives each award to everyone who earned it', () => {
    const awards = awardList(game);
    const winners = (type: string) => awards.find((award) => award.type === type)?.winners.map((p) => p.id);
    expect(winners('sneakiest')).toEqual(['Ana']);
    expect(winners('detective')).toEqual(['Ana', 'Cy']);
    // Two awards each at most: Ana's third and fourth are left out.
    expect(awardsByPlayer(game).get('Ana')).toEqual(['sneakiest', 'detective']);
    expect(winners('untouchable')).toBeUndefined();
    expect(awardsByPlayer(game).get('Ben')).toEqual([]);
  });

  it('has none in holiday games', () => {
    expect(awardList({ ...game, gameType: 'holiday-challenge' } as Game)).toEqual([]);
  });
});
