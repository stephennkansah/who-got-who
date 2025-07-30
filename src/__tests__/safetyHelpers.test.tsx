import { 
  getPlayersArray, 
  getTasksArray, 
  findPlayerById, 
  findTaskById,
  getPlayerScore,
  getGameStatus,
  isPlayerHost,
  getCompletedTasksCount,
  safeLocalStorage,
  safeJsonParse
} from '../utils/safetyHelpers';
import { Game, Player } from '../types';

describe('Safety Helpers', () => {
  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    gameId: 'game1',
    swapsLeft: 2,
    score: 10,
    lockedIn: false,
    isHost: true,
    token: 'token',
    tasks: [
      { id: 'task1', gameId: 'game1', playerId: 'player1', text: 'Test task', status: 'completed' },
      { id: 'task2', gameId: 'game1', playerId: 'player1', text: 'Test task 2', status: 'pending' }
    ],
    stats: { gothcas: 0, failed: 0, disputesLost: 0, uniqueTargets: [], firstTimeTargets: 0 },
    avatar: '🎮',
    avatarType: 'emoji'
  };

  const mockGame: Game = {
    id: 'game1',
    status: 'live',
    mode: 'casual',
    packId: 'core',
    createdBy: 'Test Player',
    createdAt: new Date(),
    hostId: 'player1',
    players: [mockPlayer],
    settings: { swapsAllowed: 2, disputeTimeoutSeconds: 120, hostDefaultOnTie: true, enableNegativeScoring: false, maxPlayers: 10, targetScore: 4, selectedPack: null, tasksLoaded: false },
    currentPhase: 'play'
  };

  it('should safely get players array', () => {
    expect(getPlayersArray(mockGame)).toEqual([mockPlayer]);
    expect(getPlayersArray(null)).toEqual([]);
    expect(getPlayersArray(undefined)).toEqual([]);
  });

  it('should safely get tasks array', () => {
    expect(getTasksArray(mockPlayer)).toEqual(mockPlayer.tasks);
    expect(getTasksArray(null)).toEqual([]);
    expect(getTasksArray(undefined)).toEqual([]);
  });

  it('should safely find player by ID', () => {
    expect(findPlayerById(mockGame, 'player1')).toEqual(mockPlayer);
    expect(findPlayerById(mockGame, 'nonexistent')).toBeUndefined();
    expect(findPlayerById(null, 'player1')).toBeUndefined();
  });

  it('should safely get player score', () => {
    expect(getPlayerScore(mockPlayer)).toBe(10);
    expect(getPlayerScore(null)).toBe(0);
    expect(getPlayerScore(undefined)).toBe(0);
  });

  it('should safely get game status', () => {
    expect(getGameStatus(mockGame)).toBe('live');
    expect(getGameStatus(null)).toBe('draft');
    expect(getGameStatus(undefined)).toBe('draft');
  });

  it('should safely check if player is host', () => {
    expect(isPlayerHost(mockPlayer)).toBe(true);
    expect(isPlayerHost(null)).toBe(false);
    expect(isPlayerHost(undefined)).toBe(false);
  });

  it('should safely get completed tasks count', () => {
    expect(getCompletedTasksCount(mockPlayer)).toBe(1); // One completed task
    expect(getCompletedTasksCount(null)).toBe(0);
    expect(getCompletedTasksCount(undefined)).toBe(0);
  });

  it('should safely parse JSON', () => {
    expect(safeJsonParse('{"test": true}', {})).toEqual({ test: true });
    expect(safeJsonParse('invalid json', {})).toEqual({});
    expect(safeJsonParse('', [])).toEqual([]);
  });
});