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
  startedAt?: string;
  endedAt?: string;
  rematchGameId?: string; // set once someone opens a rematch lobby for this group
  claimsOpenAt?: string; // missions are dealt at the start; gotchas count from here
  pausedAt?: string; // set while the host has paused play
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
  briefingMinutes?: number; // settling-in time between dealing missions and opening gotchas
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
  avatarKey?: string; // storage key of your own photo avatar (only sent for yourself)
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
  templateId?: string;
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
  phase?: 'response' | 'voting';
  votes: Vote[];
  description?: string;
  taskText?: string; // the claimed mission, shown to the target and the jury
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
  proofUrl?: string; // short-lived link to the proof photo
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

// UI State Types
export interface GameState {
  currentGame: Game | null;
  currentPlayer: Player | null;
  isConnected: boolean;
  /** Whether live updates are flowing; 'reconnecting' after a dropped connection. */
  connection: 'live' | 'reconnecting';
  isLoading: boolean;
  error: string | null;
  activeDisputes: Dispute[];
  leaderboard: Player[];
}

// Award Types
export type AwardType =
  | 'sneakiest'      // Most successful Gotchas
  | 'social'         // Most unique targets
  | 'detective'      // Caught the most people
  | 'untouchable'    // Never caught, with at least one Gotcha
  | 'jester';        // Most failed attempts

export interface GameContextType {
  state: GameState;
  createGame: (hostName: string, avatar?: string, avatarType?: 'emoji' | 'photo') => Promise<void>;
  joinGame: (gameId: string, playerName: string, avatar?: string, avatarType?: 'emoji' | 'photo') => Promise<void>;
  selectPack: (packId: 'core' | 'remote' | 'holiday-challenge') => Promise<void>;
  startGame: () => Promise<void>;
  endGame: () => Promise<void>;
  leaveGame: () => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  updatePlayerName: (newName: string) => Promise<void>;
  swapTask: (taskId: string) => Promise<void>;
  claimGotcha: (taskId: string, targetId: string) => Promise<void>;
  disputeGotcha: (taskInstanceId: string, reason?: string) => Promise<void>;
  voteOnDispute: (disputeId: string, vote: boolean) => Promise<void>;
  acceptGotcha: (taskInstanceId: string) => Promise<void>;
  /** Opens (or joins) a rematch lobby for everyone in the finished game. */
  rematch: () => Promise<void>;
  // Host pacing controls
  setBriefingMinutes: (minutes: number) => Promise<void>;
  openClaims: () => Promise<void>;
  pauseGame: () => Promise<void>;
  resumeGame: () => Promise<void>;
  // Holiday Challenge methods
  completeChallenge: (challengeId: string, proofImage?: File) => Promise<void>;
}
