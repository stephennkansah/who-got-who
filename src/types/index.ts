import { Socket } from 'socket.io-client';

// Game Types
export type GameStatus = 'draft' | 'live' | 'ended';
export type GameMode = 'casual';
export type TaskStatus = 'pending' | 'completed' | 'failed' | 'disputed';
export type DisputeResult = 'upheld' | 'overturned' | 'pending';

export interface Game {
  id: string;
  status: GameStatus;
  mode: GameMode;
  packId: string;
  gameType?: 'traditional' | 'holiday-challenge'; // new field for game type
  createdBy: string;
  createdAt: Date;
  hostId: string;
  players: Player[];
  settings: GameSettings;
  currentPhase: 'draft' | 'play' | 'ended';
  challengeCompletions?: ChallengeCompletion[]; // for holiday challenge games
  selectedChallenges?: Challenge[]; // for holiday challenge games - random selection of 10 challenges
}

export interface GameSettings {
  swapsAllowed: number;
  disputeTimeoutSeconds: number;
  hostDefaultOnTie: boolean;
  enableNegativeScoring: boolean;
  maxPlayers: number;
  targetScore: number;
  selectedPack?: 'core' | 'remote' | 'holiday-challenge' | null;
  tasksLoaded?: boolean;
  // Holiday Challenge Pack specific settings
  holidayChallengeWinCondition?: number; // points needed to win
  holidayGoldPoints?: number; // points for first completion
  holidaySilverPoints?: number; // points for subsequent completions
  holidayMaxSilverPerChallenge?: number; // max silver points per challenge
}

export interface Player {
  id: string;
  name: string;
  gameId: string;
  swapsLeft: number;
  score: number;
  lockedIn: boolean;
  isHost: boolean;
  token: string;
  tasks: TaskInstance[];
  stats: PlayerStats;
  avatar?: string;
  avatarType?: 'emoji' | 'photo';
  // Holiday Challenge Pack specific fields
  challengeScore?: number; // separate score for challenge games
  challengeCompletions?: string[]; // array of completed challenge IDs
}

export interface PlayerStats {
  gothcas: number;
  failed: number;
  disputesLost: number;
  uniqueTargets: string[];
  firstTimeTargets: number;
}

export interface TaskInstance {
  id: string;
  gameId: string;
  playerId: string;
  text: string;
  tips?: string;
  status: 'pending' | 'completed' | 'failed' | 'disputed';
  targetId?: string;
  gotAt?: Date;
  disputeId?: string;
}

export interface Dispute {
  id: string;
  taskInstanceId: string;
  targetId: string;
  accuserId: string;
  openedAt: Date;
  closesAt: Date;
  result: DisputeResult;
  votes: Vote[];
  description?: string;
}

export interface Vote {
  id: string;
  disputeId: string;
  voterId: string;
  vote: boolean; // true = uphold Gotcha, false = fail it
  votedAt: Date;
}

export interface TaskPack {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  difficulty: 'easy' | 'medium' | 'hard';
  minPlayers: number;
  maxPlayers: number;
}

export interface Task {
  id: string;
  text: string;
  tips?: string;
}

// Holiday Challenge Pack types
export interface Challenge {
  id: string;
  text: string;
  requiresProof: boolean;
}

export interface ChallengeCompletion {
  id: string;
  challengeId: string;
  playerId: string;
  gameId: string;
  completedAt: Date;
  points: number; // 3 for gold, 1 for silver
  type: 'gold' | 'silver';
  proofImageUrl?: string;
}

export interface HolidayChallengePack {
  id: string;
  name: string;
  description: string;
  challenges: Challenge[];
  winCondition: number | ((playerCount: number) => number); // points needed to win - can be dynamic based on player count
  goldPointValue: number; // points for first completion (default 3)
  silverPointValue: number; // points for subsequent completions (default 1)
  maxSilverPerChallenge?: number; // optional limit on silver points per challenge
}

// Real-time Events
export interface SocketEvents {
  // Player events
  'player:join': { player: Player };
  'player:leave': { playerId: string };
  'player:update': { player: Player };
  'player:lock': { playerId: string };

  // Game events
  'game:start': { game: Game };
  'game:end': { game: Game; winner?: Player };
  'game:update': { game: Game };

  // Task events
  'task:swap': { playerId: string; oldTaskId: string; newTaskId: string };
  'task:gotcha': { taskInstance: TaskInstance };
  'task:fail': { taskInstanceId: string };

  // Dispute events
  'dispute:create': { dispute: Dispute };
  'dispute:vote': { disputeId: string; vote: Vote };
  'dispute:resolve': { dispute: Dispute };
  'dispute:timeout': { disputeId: string };

  // Holiday Challenge events
  'challenge:complete': { completion: ChallengeCompletion };
  'challenge:gold-claimed': { challengeId: string; playerId: string };
  'challenge:silver-awarded': { challengeId: string; playerId: string };

  // System events
  'error': { message: string; code?: string };
  'notification': { message: string; type: 'info' | 'warning' | 'error' };
}

// UI State Types
export interface GameState {
  currentGame: Game | null;
  currentPlayer: Player | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  activeDisputes: Dispute[];
  leaderboard: Player[];
}

export interface LobbyState {
  selectedTasks: string[];
  availableTasks: Task[];
  swapsRemaining: number;
  allPlayersLocked: boolean;
}

export interface GameplayState {
  selectedTask: TaskInstance | null;
  selectedTarget: Player | null;
  showTargetModal: boolean;
  showDisputeModal: boolean;
  currentDispute: Dispute | null;
}

// Award Types
export interface Award {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: (game: Game, player: Player) => boolean;
}

export type AwardType = 
  | 'sneakiest'      // Most successful Gotchas
  | 'social'         // Most unique targets
  | 'detective'      // Caught the most people
  | 'untouchable'    // Least times caught
  | 'jester'         // Most failed attempts
  | 'chaos';         // Most disputes created

// Utility Types
export type CreateGameRequest = Omit<Game, 'id' | 'createdAt' | 'players'>;
export type JoinGameRequest = { gameId: string; playerName: string };
export type SwapTaskRequest = { taskId: string; playerId: string };
export type GotchaRequest = { taskInstanceId: string; targetId: string };
export type DisputeRequest = { taskInstanceId: string; reason?: string };
export type VoteRequest = { disputeId: string; vote: boolean };

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GameSummary {
  id: string;
  mode: GameMode;
  playerCount: number;
  status: GameStatus;
  createdAt: Date;
  canRejoin: boolean;
} 

export interface GameContextType {
  state: GameState;
  createGame: (hostName: string, avatar?: string, avatarType?: 'emoji' | 'photo') => Promise<void>;
  joinGame: (gameId: string, playerName: string, avatar?: string, avatarType?: 'emoji' | 'photo') => Promise<void>;
  selectPack: (packId: 'core' | 'remote' | 'holiday-challenge') => Promise<void>;
  startGame: () => Promise<void>;
  endGame: () => Promise<void>;
  leaveGame: () => Promise<void>;
  updatePlayerName: (newName: string) => Promise<void>;
  swapTask: (taskId: string) => Promise<void>;
  claimGotcha: (taskId: string, targetId: string) => Promise<void>;
  disputeGotcha: (taskInstanceId: string) => Promise<void>;
  voteOnDispute: (disputeId: string, vote: boolean) => Promise<void>;
  acceptGotcha: (taskInstanceId: string) => Promise<void>;
  forceGameState?: (status: 'draft' | 'live' | 'ended') => void;
  simulateScore?: (points: number) => void;
  updatePlayerTasks: (playerId: string, updatedTasks: TaskInstance[]) => void;
  socket: Socket | null;
  // Holiday Challenge methods
  completeChallenge: (challengeId: string, proofImage?: File) => Promise<void>;
  uploadProofImage: (file: File, challengeId: string) => Promise<string>;
} 