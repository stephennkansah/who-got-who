import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, onValue, off, remove, update } from 'firebase/database';
import { Game, Player, TaskInstance, GameStatus } from '../types';

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "who-got-who-demo.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://who-got-who-demo-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "who-got-who-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "who-got-who-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseService {
  // Create a new game
  static async createGame(hostPlayer: Player, mode: 'casual' | 'competitive'): Promise<string> {
    const gameRef = push(ref(database, 'games'));
    const gameId = gameRef.key!;
    
    const game: Game = {
      id: gameId,
      status: 'draft' as GameStatus,
      mode,
      players: [{ ...hostPlayer, isHost: true }],
      createdAt: new Date(),
      createdBy: hostPlayer.id,
      hostId: hostPlayer.id,
      currentPhase: 'draft',
      packId: 'core-pack-a',
      settings: {
        maxPlayers: 8,
        swapsAllowed: mode === 'casual' ? 2 : 1,
        disputeTimeoutSeconds: 120,
        hostDefaultOnTie: true,
        enableNegativeScoring: mode === 'competitive',
        targetScore: 4
      }
    };

    await set(gameRef, {
      ...game,
      createdAt: game.createdAt.toISOString()
    });

    return gameId;
  }

  // Join an existing game
  static async joinGame(gameId: string, player: Player): Promise<boolean> {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }

    const gameData = snapshot.val();
    
    if (gameData.status !== 'draft') {
      throw new Error('Game has already started');
    }

    if (gameData.players && gameData.players.length >= 8) {
      throw new Error('Game is full');
    }

    // Add player to game
    const playersRef = ref(database, `games/${gameId}/players`);
    const playersSnapshot = await get(playersRef);
    const existingPlayers = playersSnapshot.val() || [];
    
    // Check if player already exists
    const existingPlayer = existingPlayers.find((p: Player) => p.id === player.id);
    if (existingPlayer) {
      return true; // Player already in game
    }

    const updatedPlayers = [...existingPlayers, player];
    await set(playersRef, updatedPlayers);

    return true;
  }

  // Start the game
  static async startGame(gameId: string, players: Player[]): Promise<void> {
    const updates = {
      [`games/${gameId}/status`]: 'live',
      [`games/${gameId}/startedAt`]: new Date().toISOString(),
      [`games/${gameId}/players`]: players
    };

    await update(ref(database), updates);
  }

  // Update player data
  static async updatePlayer(gameId: string, player: Player): Promise<void> {
    const playersRef = ref(database, `games/${gameId}/players`);
    const snapshot = await get(playersRef);
    const players = snapshot.val() || [];
    
    const updatedPlayers = players.map((p: Player) => 
      p.id === player.id ? player : p
    );

    await set(playersRef, updatedPlayers);
  }

  // Update game status
  static async updateGameStatus(gameId: string, status: GameStatus): Promise<void> {
    await update(ref(database), {
      [`games/${gameId}/status`]: status
    });
  }

  // Real-time listeners
  static subscribeToGame(gameId: string, callback: (game: Game | null) => void): () => void {
    const gameRef = ref(database, `games/${gameId}`);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val();
        const game: Game = {
          ...gameData,
          createdAt: new Date(gameData.createdAt),
          startedAt: gameData.startedAt ? new Date(gameData.startedAt) : undefined,
          endedAt: gameData.endedAt ? new Date(gameData.endedAt) : undefined
        };
        callback(game);
      } else {
        callback(null);
      }
    });

    return () => off(gameRef, 'value', unsubscribe);
  }

  // Subscribe to specific player updates
  static subscribeToPlayer(gameId: string, playerId: string, callback: (player: Player | null) => void): () => void {
    const gameRef = ref(database, `games/${gameId}/players`);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const players = snapshot.val() || [];
        const player = players.find((p: Player) => p.id === playerId);
        callback(player || null);
      } else {
        callback(null);
      }
    });

    return () => off(gameRef, 'value', unsubscribe);
  }

  // Get game by ID (one-time fetch)
  static async getGame(gameId: string): Promise<Game | null> {
    const snapshot = await get(ref(database, `games/${gameId}`));
    
    if (snapshot.exists()) {
      const gameData = snapshot.val();
      return {
        ...gameData,
        createdAt: new Date(gameData.createdAt),
        startedAt: gameData.startedAt ? new Date(gameData.startedAt) : undefined,
        endedAt: gameData.endedAt ? new Date(gameData.endedAt) : undefined
      };
    }
    
    return null;
  }

  // Delete game (cleanup)
  static async deleteGame(gameId: string): Promise<void> {
    await remove(ref(database, `games/${gameId}`));
  }

  // Update specific task for a player
  static async updatePlayerTask(gameId: string, playerId: string, taskId: string, taskUpdate: Partial<TaskInstance>): Promise<void> {
    const gameRef = ref(database, `games/${gameId}/players`);
    const snapshot = await get(gameRef);
    const players = snapshot.val() || [];
    
    const updatedPlayers = players.map((player: Player) => {
      if (player.id === playerId) {
        const updatedTasks = player.tasks.map((task: TaskInstance) => 
          task.id === taskId ? { ...task, ...taskUpdate } : task
        );
        return { ...player, tasks: updatedTasks };
      }
      return player;
    });

    await set(gameRef, updatedPlayers);
  }

  // Batch update multiple fields
  static async batchUpdate(updates: Record<string, any>): Promise<void> {
    await update(ref(database), updates);
  }
}

export default FirebaseService; 