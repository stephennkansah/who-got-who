import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, onValue, off, remove, update } from 'firebase/database';
import { Game, Player, TaskInstance, GameStatus } from '../types';

// Firebase configuration - Hardcoded for testing
const firebaseConfig = {
  apiKey: "AIzaSyA-dXRiaKqESjoanSePUAB1Avn2Y0xh-2U",
  authDomain: "who-got-who.firebaseapp.com",
  databaseURL: "https://who-got-who-default-rtdb.firebaseio.com",
  projectId: "who-got-who",
  storageBucket: "who-got-who.firebasestorage.app",
  messagingSenderId: "96566213225",
  appId: "1:96566213225:web:e4cf0ae1532ad0a77fd978"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseService {
  // Create a new game
  static async createGame(hostPlayer: Player): Promise<string> {
    try {
      const gameId = hostPlayer.gameId;
      
      const gameData: Game = {
        id: gameId,
        status: 'draft',
        mode: 'casual',
        packId: 'core-a',
        createdBy: hostPlayer.name,
        createdAt: new Date(),
        hostId: hostPlayer.id,
        players: [hostPlayer],
        settings: {
          swapsAllowed: 2,
          disputeTimeoutSeconds: 120,
          hostDefaultOnTie: true,
          enableNegativeScoring: false,
          maxPlayers: 8,
          targetScore: 4
        },
        currentPhase: 'draft'
      };

      // Use the provided gameId instead of generating a new one
      const gameRef = ref(database, `games/${gameId}`);

      await set(gameRef, {
        ...gameData,
        createdAt: gameData.createdAt.toISOString()
      });

      return gameId;
    } catch (error) {
      console.error('Error creating game:', error);
      throw new Error('Failed to create game');
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