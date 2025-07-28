import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, onValue, off, remove, update } from 'firebase/database';
import { Game, Player, TaskInstance, GameStatus } from '../types';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Validate Firebase configuration
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN', 
  'REACT_APP_FIREBASE_DATABASE_URL',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing Firebase environment variables:', missingVars);
  console.error('📝 Create a .env.local file with your Firebase configuration');
  console.error('📋 See .env.example for the required format');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Helper function to determine game settings based on player count
export const getGameSettings = (playerCount: number) => {
  const taskCount = playerCount >= 7 ? 8 : 7;
  const targetScore = playerCount >= 7 ? 5 : 4;
  
  return {
    taskCount,
    settings: {
      swapsAllowed: 2,
      disputeTimeoutSeconds: 120,
      hostDefaultOnTie: true,
      enableNegativeScoring: false,
      maxPlayers: 10,
      targetScore
    }
  };
};

export class FirebaseService {
  // Create a new game
  static async createGame(gameId: string, hostPlayer: Player): Promise<void> {
    try {
      // Get initial settings for 1 player (host)
      const { settings } = getGameSettings(1);
      
      const gameData: Omit<Game, 'id'> = {
        status: 'draft',
        mode: 'casual',
        packId: 'core-pack-a',
        createdBy: hostPlayer.name,
        createdAt: new Date(),
        hostId: hostPlayer.id,
        players: [hostPlayer],
        settings,
        currentPhase: 'draft'
      };

      // Use the provided gameId instead of generating a new one
      const gameRef = ref(database, `games/${gameId}`);

      await set(gameRef, {
        ...gameData,
        id: gameId,
        createdAt: gameData.createdAt.toISOString()
      });

      console.log('✅ Game created with ID:', gameId);
    } catch (error) {
      console.error('❌ Error creating game:', error);
      throw error;
    }
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
    
    // Check if player already exists (by name, case-insensitive)
    const existingPlayer = existingPlayers.find((p: Player) => p.name.toLowerCase() === player.name.toLowerCase());
    if (existingPlayer) {
      throw new Error('A player with this name has already joined');
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
        id: gameId, // Ensure id is always present
        createdAt: new Date(gameData.createdAt),
        startedAt: gameData.startedAt ? new Date(gameData.startedAt) : undefined,
        endedAt: gameData.endedAt ? new Date(gameData.endedAt) : undefined
      };
    }
    
    return null;
  }

  // Update game data
  static async updateGame(gameId: string, gameUpdate: Partial<Game>): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`);
    await update(gameRef, gameUpdate);
  }

  // Update game settings when player count changes
  static async updateGameSettings(gameId: string, playerCount: number): Promise<void> {
    try {
      const { settings } = getGameSettings(playerCount);
      const gameRef = ref(database, `games/${gameId}/settings`);
      await update(gameRef, settings);
      console.log(`✅ Game settings updated for ${playerCount} players`);
    } catch (error) {
      console.error('❌ Error updating game settings:', error);
      throw error;
    }
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