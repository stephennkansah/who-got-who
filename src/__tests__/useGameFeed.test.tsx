import React from 'react';
import { render } from '@testing-library/react';
import { AwsGameContext } from '../context/AwsGameContext';
import { useGameFeed } from '../hooks/useGameFeed';
import NotificationService from '../services/notificationService';
import { showToast } from '../components/common/Toast';
import { Bust, Dispute, Game, GameContextType, GameState, Player } from '../types';

jest.mock('../components/common/Toast', () => ({ showToast: jest.fn() }));

jest.mock('../context/AwsGameContext', () => {
  const { createContext } = jest.requireActual('react');
  return { AwsGameContext: createContext(null) };
});

const player = (id: string, score = 0): Player => ({
  id,
  name: id.toUpperCase(),
  gameId: 'GAME23',
  swapsLeft: 2,
  score,
  lockedIn: false,
  isHost: id === 'host',
  token: '',
  tasks: [],
  stats: { gothcas: 0, failed: 0, disputesLost: 0, uniqueTargets: [], firstTimeTargets: 0 },
});

const game = (status: Game['status'], players: Player[]): Game => ({
  id: 'GAME23',
  status,
  mode: 'casual',
  packId: 'core',
  gameType: 'traditional',
  createdBy: 'HOST',
  createdAt: new Date(),
  hostId: 'host',
  players,
  settings: {
    swapsAllowed: 2,
    disputeTimeoutSeconds: 120,
    hostDefaultOnTie: true,
    enableNegativeScoring: false,
    maxPlayers: 20,
    targetScore: 5,
  },
  currentPhase: status === 'ended' ? 'ended' : 'play',
});

const dispute = (phase: 'response' | 'voting', votes: Dispute['votes'] = []): Dispute => ({
  id: 'claim-1',
  taskInstanceId: 'task-1',
  accuserId: 'host',
  targetId: 'target',
  openedAt: new Date(),
  closesAt: new Date(Date.now() + 120000),
  result: 'pending',
  phase,
  votes,
});

function stateFor(current: Game, meId: string, activeDisputes: Dispute[] = [], activeBusts: Bust[] = []): GameState {
  return {
    currentGame: current,
    currentPlayer: current.players.find((candidate) => candidate.id === meId) || null,
    isConnected: true,
    connection: 'live',
    isLoading: false,
    error: null,
    activeDisputes,
    activeBusts,
    leaderboard: [],
  };
}

const bust = (result: Bust['result'], taskInstanceId?: string): Bust => ({
  id: 'bust-1',
  catcherId: 'host',
  playerId: 'target',
  openedAt: new Date(),
  closesAt: new Date(Date.now() + 300000),
  result,
  taskInstanceId,
});

function Feed() {
  useGameFeed();
  return null;
}

function renderFeed(initial: GameState) {
  const view = (state: GameState) => (
    <AwsGameContext.Provider value={{ state } as unknown as GameContextType}>
      <Feed />
    </AwsGameContext.Provider>
  );
  const result = render(view(initial));
  return (next: GameState) => result.rerender(view(next));
}

describe('useGameFeed notifications', () => {
  let notify: jest.SpyInstance;
  const players = [player('host'), player('target'), player('voter')];

  beforeEach(() => {
    notify = jest.spyOn(NotificationService, 'notifyIfHidden').mockImplementation(() => undefined);
  });

  afterEach(() => notify.mockRestore());

  it('buzzes the target when a gotcha is claimed on them', () => {
    const live = game('live', players);
    const update = renderFeed(stateFor(live, 'target'));
    update(stateFor(live, 'target', [dispute('response')]));
    expect(notify).toHaveBeenCalledWith('Gotcha claimed!', expect.stringContaining('HOST'), 'claim-claim-1');
  });

  it('asks a bystander to vote once a claim is disputed, and only once', () => {
    const live = game('live', players);
    const update = renderFeed(stateFor(live, 'voter', [dispute('response')]));
    update(stateFor(live, 'voter', [dispute('voting')]));
    expect(notify).toHaveBeenCalledWith('Your vote is needed', expect.stringContaining('TARGET'), 'vote-claim-1');
    notify.mockClear();
    update(stateFor({ ...live }, 'voter', [dispute('voting')]));
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not ask the accuser, the target, or someone who already voted to vote', () => {
    const live = game('live', players);
    for (const me of ['host', 'target']) {
      const update = renderFeed(stateFor(live, me, [dispute('response')]));
      update(stateFor(live, me, [dispute('voting')]));
    }
    const voted = dispute('voting', [{ id: 'v', disputeId: 'claim-1', voterId: 'voter', vote: true, votedAt: new Date() }]);
    const update = renderFeed(stateFor(live, 'voter'));
    update(stateFor(live, 'voter', [voted]));
    expect(notify).not.toHaveBeenCalledWith('Your vote is needed', expect.anything(), expect.anything());
  });

  it('tells everyone when the game ends', () => {
    const update = renderFeed(stateFor(game('live', players), 'voter'));
    update(stateFor(game('ended', [player('host', 6), player('target'), player('voter')]), 'voter'));
    expect(notify).toHaveBeenCalledWith('Game over', expect.stringContaining('HOST wins with 6 points'), 'game-over-GAME23');
  });

  it('buzzes a busted player, and tells the catcher how it went', () => {
    const live = game('live', players);
    const asTarget = renderFeed(stateFor(live, 'target'));
    asTarget(stateFor(live, 'target', [], [bust('pending')]));
    expect(notify).toHaveBeenCalledWith('Busted?', expect.stringContaining('HOST says they caught you'), 'bust-bust-1');

    const toast = showToast as jest.Mock;
    toast.mockClear();
    const caughtTask = { id: 'task-9', gameId: 'GAME23', playerId: 'target', text: 'Get a player to hum', status: 'failed' as const, targetId: 'host' };
    const before = game('live', [player('host'), { ...player('target'), tasks: [{ ...caughtTask, status: 'pending' }] }, player('voter')]);
    const after = game('live', [player('host'), { ...player('target'), tasks: [caughtTask] }, player('voter')]);
    const asCatcher = renderFeed(stateFor(before, 'host', [], [bust('pending')]));
    asCatcher(stateFor(after, 'host', [], [bust('confirmed', 'task-9')]));
    expect(toast).toHaveBeenCalledWith('Bust confirmed — TARGET was trying: "Get a player to hum"', 'info');
    expect(toast).toHaveBeenCalledTimes(1);

    toast.mockClear();
    const denied = renderFeed(stateFor(live, 'host', [], [bust('pending')]));
    denied(stateFor(live, 'host', [], [bust('denied')]));
    expect(toast).toHaveBeenCalledWith("TARGET says that wasn't a mission", 'info');
  });

  it('warns everyone else when a player could win with their next gotcha', () => {
    const toast = showToast as jest.Mock;
    toast.mockClear();
    const update = renderFeed(stateFor(game('live', [player('host', 2), player('target'), player('voter')]), 'voter'));
    update(stateFor(game('live', [player('host', 3.5), player('target'), player('voter')]), 'voter'));
    expect(toast).toHaveBeenCalledWith('HOST could win with their next gotcha — watch them!', 'info');
    toast.mockClear();
    update(stateFor(game('live', [player('host', 4.5), player('target'), player('voter')]), 'voter'));
    expect(toast).not.toHaveBeenCalledWith(expect.stringContaining('could win'), 'info');
  });
});
