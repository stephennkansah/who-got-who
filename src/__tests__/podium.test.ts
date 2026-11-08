import { Game, Player } from '../types';
import { lobbySummary, openPlaces, ordinal, podiumPlaces, rankPlayers, winRule } from '../utils/gameSettings';

const player = (id: string, score: number, place?: number, failed = 0): Player => ({
  id,
  name: id,
  gameId: 'G',
  swapsLeft: 0,
  score,
  lockedIn: true,
  isHost: false,
  token: '',
  tasks: [],
  stats: { gothcas: 0, failed, disputesLost: 0, uniqueTargets: [], firstTimeTargets: 0 },
  place,
});

const game = (players: Player[], podiumSize?: number, gameType: Game['gameType'] = 'traditional'): Game => ({
  id: 'G',
  status: 'live',
  mode: 'casual',
  packId: 'core',
  gameType,
  createdBy: 'a',
  createdAt: new Date(),
  hostId: 'a',
  players,
  settings: {
    swapsAllowed: 2,
    disputeTimeoutSeconds: 300,
    hostDefaultOnTie: true,
    enableNegativeScoring: false,
    maxPlayers: 18,
    targetScore: 5,
    podiumSize,
  },
  currentPhase: 'play',
});

describe('podium finishes', () => {
  it('ranks finishers by finishing order, even below a later higher score', () => {
    const ranked = rankPlayers([
      player('chasing', 4.5),
      player('second', 6.5, 2),
      player('first', 5, 1),
      player('clean', 3, undefined, 0),
      player('messy', 3, undefined, 2),
    ]);
    expect(ranked.map((p) => p.id)).toEqual(['first', 'second', 'chasing', 'clean', 'messy']);
  });

  it('lists the podium places still open', () => {
    expect(openPlaces(game([player('a', 6, 1), player('b', 2)], 3))).toBe('2nd and 3rd');
    expect(openPlaces(game([player('a', 6, 1), player('b', 2)], 2))).toBe('2nd');
    expect(openPlaces(game([player('a', 6, 1), player('b', 6, 2)], 2))).toBe('');
  });

  it('treats older games and holiday games as winner-only', () => {
    expect(podiumPlaces(game([], undefined))).toBe(1);
    expect(podiumPlaces(game([], 3, 'holiday-challenge'))).toBe(1);
    expect(lobbySummary(game([], 2)).places).toBe(2);
  });

  it('describes the win rule', () => {
    expect(winRule(1, 5)).toBe('first to 5 points');
    expect(winRule(3, 5)).toBe('top 3 to reach 5 points');
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(
      ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd'],
    );
  });
});
