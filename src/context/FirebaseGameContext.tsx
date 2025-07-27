import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Game, Player, TaskInstance, GameState, GameContextType } from '../types';
import { getRandomTasks } from '../data/mockTasks';
import FirebaseService from '../services/firebase';

// Check if Firebase is properly configured
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isFirebaseConfigured = () => {
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_DATABASE_URL',
    'REACT_APP_FIREBASE_PROJECT_ID'
  ];
  
  console.log('🔍 Checking Firebase Environment Variables:');
  console.log('API_KEY:', process.env.REACT_APP_FIREBASE_API_KEY);
  console.log('DATABASE_URL:', process.env.REACT_APP_FIREBASE_DATABASE_URL);
  console.log('PROJECT_ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
  
  const missing = requiredVars.filter(varName => {
    const value = process.env[varName];
    const isEmpty = !value || value === 'demo-key' || value === 'your_actual_api_key_here' || value.includes('demo');
    if (isEmpty) {
      console.log(`❌ ${varName} is missing or has demo value:`, value);
    } else {
      console.log(`✅ ${varName} is set correctly`);
    }
    return isEmpty;
  });
  
  if (missing.length > 0) {
    console.warn('❌ Firebase not configured properly. Missing/demo variables:', missing);
    return false;
  }
  
  console.log('✅ Firebase configuration is valid');
  return true;
};

// Initial state
const initialState: GameState = {
  isLoading: false,
  error: null,
  isConnected: true, // Firebase handles connection state
  currentGame: null,
  currentPlayer: null,
  activeDisputes: [],
  leaderboard: []
};

// Actions for the reducer
type FirebaseGameAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GAME'; payload: Game | null }
  | { type: 'SET_PLAYER'; payload: Player | null }
  | { type: 'UPDATE_GAME'; payload: Game }
  | { type: 'UPDATE_PLAYERS'; payload: Player[] };

// Reducer
function firebaseGameReducer(state: GameState, action: FirebaseGameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GAME':
      return { 
        ...state, 
        currentGame: action.payload
      };
    case 'SET_PLAYER':
      return { ...state, currentPlayer: action.payload };
    case 'UPDATE_GAME':
      return { 
        ...state, 
        currentGame: action.payload
      };
    case 'UPDATE_PLAYERS':
      return state;
    default:
      return state;
  }
}

// Create context
export const FirebaseGameContext = createContext<GameContextType | null>(null);

interface FirebaseGameProviderProps {
  children: ReactNode;
}

export function FirebaseGameProvider({ children }: FirebaseGameProviderProps) {
  const [state, dispatch] = useReducer(firebaseGameReducer, initialState);

  // Real-time subscriptions cleanup
  useEffect(() => {
    let gameUnsubscribe: (() => void) | null = null;

    if (state.currentGame?.id) {
      // Subscribe to real-time game updates
      gameUnsubscribe = FirebaseService.subscribeToGame(
        state.currentGame.id,
        (game) => {
          if (game) {
            dispatch({ type: 'UPDATE_GAME', payload: game });
          }
        }
      );
    }

    return () => {
      if (gameUnsubscribe) {
        gameUnsubscribe();
      }
    };
  }, [state.currentGame?.id]);

  // Generate unique player ID
  const generatePlayerId = (): string => {
    return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Create game
  const createGame = async (hostName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playerId = Math.random().toString(36).substring(2, 15);
      
      // Get random tasks from core pack A
      const rawTasks = getRandomTasks('core-pack-a', 7);
      const tasks: TaskInstance[] = rawTasks.map(task => ({
        ...task,
        id: Math.random().toString(36).substring(2, 15),
        gameId: gameId,
        playerId: playerId,
        status: 'pending'
      }));
      
      const player: Player = {
        id: playerId,
        name: hostName,
        gameId,
        swapsLeft: 2,
        score: 0,
        lockedIn: false,
        isHost: true,
        token: 'mock-token',
        tasks: tasks,
        stats: {
          gothcas: 0,
          failed: 0,
          disputesLost: 0,
          uniqueTargets: [],
          firstTimeTargets: 0
        }
      };

      console.log('Creating game with host player:', player.name);
      const createdGameId = await FirebaseService.createGame(player); // Standard game mode
      console.log('Game created with ID:', createdGameId);
      
      // The gameId should be the same as what we created
      if (createdGameId !== gameId) {
        console.error('Game ID mismatch!', { expected: gameId, actual: createdGameId });
      }
      console.log('Player updated with gameId');

      // Get the created game
      const game = await FirebaseService.getGame(gameId);
      console.log('Retrieved game:', game);
      
      if (game) {
        dispatch({ type: 'SET_GAME', payload: game });
        dispatch({ type: 'SET_PLAYER', payload: player });
        
        // Store in localStorage for rejoin functionality
        localStorage.setItem('currentGameId', gameId);
        localStorage.setItem('currentPlayerId', playerId);
        
        console.log('Game creation successful');
      } else {
        throw new Error('Failed to retrieve created game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Join game
  const joinGame = async (gameId: string, playerName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
           const playerId = generatePlayerId();
     const rawTasks = getRandomTasks('core-pack-a', 7);
     const tasks = rawTasks.map(task => ({
       ...task,
       gameId,
       playerId,
       status: 'pending' as const
     }));

      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        gameId,
        swapsLeft: 2, // Will be updated based on game mode
        score: 0,
        lockedIn: false,
        isHost: false,
        token: `token_${playerId}`,
        tasks,
                 stats: {
           gothcas: 0,
           failed: 0,
           disputesLost: 0,
           uniqueTargets: [],
           firstTimeTargets: 0
         }
      };

      await FirebaseService.joinGame(gameId, newPlayer);
      
      // Get updated game data
      const game = await FirebaseService.getGame(gameId);
      
      if (game) {
        // Update swapsLeft based on game mode
        const updatedPlayer = { 
          ...newPlayer, 
          swapsLeft: 2 
        };
        
        dispatch({ type: 'SET_GAME', payload: game });
        dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
        
        // Store in localStorage for rejoin functionality
        localStorage.setItem('currentGameId', gameId);
        localStorage.setItem('currentPlayerId', playerId);
      }
    } catch (error) {
      console.error('Error joining game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join game';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Start game
  const startGame = async () => {
    if (!state.currentGame || !state.currentPlayer) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await FirebaseService.startGame(state.currentGame.id, state.currentGame.players);
    } catch (error) {
      console.error('Error starting game:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start game.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // End game
  const endGame = async () => {
    if (!state.currentGame) return;

    try {
      await FirebaseService.updateGameStatus(state.currentGame.id, 'ended');
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  // Leave game - clears local state and returns to home
  const leaveGame = async () => {
    try {
      if (state.currentPlayer && state.currentGame) {
        const currentPlayer = state.currentPlayer;
        const currentGame = state.currentGame;
        
        // If the leaving player is the host and game hasn't started yet
        if (currentPlayer.isHost && currentGame.status === 'draft') {
          const remainingPlayers = currentGame.players.filter(p => p.id !== currentPlayer.id);
          
          if (remainingPlayers.length > 0) {
            // Promote the first remaining player to host
            const newHost = remainingPlayers[0];
            await FirebaseService.updateGame(currentGame.id, {
              hostId: newHost.id,
              players: currentGame.players
                .filter(p => p.id !== currentPlayer.id)
                .map(p => p.id === newHost.id ? { ...p, isHost: true } : { ...p, isHost: false })
            });
          } else {
            // Last player leaving - delete the game
            await FirebaseService.deleteGame(currentGame.id);
          }
        } else {
          // Regular player leaving - just remove from players list
          await FirebaseService.updateGame(currentGame.id, {
            players: currentGame.players.filter(p => p.id !== currentPlayer.id)
          });
        }
      }

      // Clear localStorage
      localStorage.removeItem('currentGameId');
      localStorage.removeItem('currentPlayerId');
      
      // Clear local state
      dispatch({ type: 'SET_GAME', payload: null });
      dispatch({ type: 'SET_PLAYER', payload: null });
      
      console.log('🚪 Left game successfully');
    } catch (error) {
      console.error('Error leaving game:', error);
      // Still clear local state even if server update fails
      localStorage.removeItem('currentGameId');
      localStorage.removeItem('currentPlayerId');
      dispatch({ type: 'SET_GAME', payload: null });
      dispatch({ type: 'SET_PLAYER', payload: null });
    }
  };

  // Update player name
  const updatePlayerName = async (newName: string) => {
    if (!state.currentPlayer || !state.currentGame) return;

    const updatedPlayer = { ...state.currentPlayer, name: newName };
    
    try {
      await FirebaseService.updatePlayer(state.currentGame.id, updatedPlayer);
      dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
    } catch (error) {
      console.error('Error updating player name:', error);
    }
  };

  // Swap task
  const swapTask = async (taskId: string) => {
    if (!state.currentPlayer || !state.currentGame || state.currentPlayer.swapsLeft <= 0) return;

              const newTask = getRandomTasks('core-pack-a', 1)[0];
     const updatedTasks = state.currentPlayer.tasks.map(task => 
       task.id === taskId ? { ...newTask, id: task.id, playerId: task.playerId, gameId: task.gameId, status: task.status } : task
     );
    
    const updatedPlayer = {
      ...state.currentPlayer,
      tasks: updatedTasks,
      swapsLeft: state.currentPlayer.swapsLeft - 1
    };

    try {
      await FirebaseService.updatePlayer(state.currentGame.id, updatedPlayer);
      dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
    } catch (error) {
      console.error('Error swapping task:', error);
    }
  };

  // Claim gotcha
  const claimGotcha = async (taskId: string, targetId: string) => {
    if (!state.currentPlayer || !state.currentGame) return;

    try {
      if (targetId === 'failed') {
        // Mark task as failed
        await FirebaseService.updatePlayerTask(
          state.currentGame.id, 
          state.currentPlayer.id, 
          taskId, 
          { status: 'failed' }
        );
      } else {
        // Mark task as completed and assign target
        await FirebaseService.updatePlayerTask(
          state.currentGame.id,
          state.currentPlayer.id,
          taskId,
          { 
            status: 'completed', 
            targetId, 
            gotAt: new Date() 
          }
        );

        // Update player score and stats
        const isFirstTimeTarget = !state.currentPlayer.stats.uniqueTargets.includes(targetId);
        const updatedPlayer = {
          ...state.currentPlayer,
          score: state.currentPlayer.score + 1 + (isFirstTimeTarget ? 0.5 : 0),
          stats: {
            ...state.currentPlayer.stats,
            gothcas: state.currentPlayer.stats.gothcas + 1,
            uniqueTargets: isFirstTimeTarget
              ? [...state.currentPlayer.stats.uniqueTargets, targetId]
              : state.currentPlayer.stats.uniqueTargets,
          }
        };

        await FirebaseService.updatePlayer(state.currentGame.id, updatedPlayer);
      }
    } catch (error) {
      console.error('Error claiming gotcha:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to claim Gotcha.' });
    }
  };

  // Placeholder functions for features not yet implemented
  const disputeGotcha = async (taskInstanceId: string) => {
    console.log('Dispute functionality not yet implemented:', taskInstanceId);
  };

  const voteOnDispute = async (disputeId: string, vote: boolean) => {
    console.log('Voting functionality not yet implemented:', disputeId, vote);
  };

  const acceptGotcha = async (taskInstanceId: string) => {
    console.log('Accept functionality not yet implemented:', taskInstanceId);
  };

  // Development/testing functions
  const forceGameState = (status: 'draft' | 'live' | 'ended') => {
    if (!state.currentGame) return;
    FirebaseService.updateGameStatus(state.currentGame.id, status);
  };

  const simulateScore = (points: number) => {
    if (!state.currentPlayer || !state.currentGame) return;
    
    const updatedPlayer = {
      ...state.currentPlayer,
      score: Math.max(0, state.currentPlayer.score + points)
    };
    
    FirebaseService.updatePlayer(state.currentGame.id, updatedPlayer);
  };

  const updatePlayerTasks = (playerId: string, updatedTasks: TaskInstance[]) => {
    if (!state.currentGame) return;
    
    const targetPlayer = state.currentGame.players.find(p => p.id === playerId);
    if (targetPlayer) {
      const updatedPlayer = { ...targetPlayer, tasks: updatedTasks };
      FirebaseService.updatePlayer(state.currentGame.id, updatedPlayer);
    }
  };

  // Auto-rejoin functionality
  useEffect(() => {
    const autoRejoin = async () => {
      const savedGameId = localStorage.getItem('currentGameId');
      const savedPlayerId = localStorage.getItem('currentPlayerId');
      
      if (savedGameId && savedPlayerId) {
        try {
          const game = await FirebaseService.getGame(savedGameId);
          if (game && (game.status === 'draft' || game.status === 'live')) {
            const player = game.players.find(p => p.id === savedPlayerId);
            if (player) {
              dispatch({ type: 'SET_GAME', payload: game });
              dispatch({ type: 'SET_PLAYER', payload: player });
            }
          }
        } catch (error) {
          console.error('Auto-rejoin failed:', error);
          localStorage.removeItem('currentGameId');
          localStorage.removeItem('currentPlayerId');
        }
      }
    };

    autoRejoin();
  }, []);

  const contextValue: GameContextType = {
    state,
    createGame,
    joinGame,
    startGame,
    endGame,
    leaveGame,
    updatePlayerName,
    swapTask,
    claimGotcha,
    disputeGotcha,
    voteOnDispute,
    acceptGotcha,
    forceGameState,
    simulateScore,
    updatePlayerTasks,
    socket: null // Firebase doesn't use traditional sockets
  };

  return (
    <FirebaseGameContext.Provider value={contextValue}>
      {children}
    </FirebaseGameContext.Provider>
  );
}

// Hook to use the context
export function useFirebaseGame(): GameContextType {
  const context = useContext(FirebaseGameContext);
  if (!context) {
    throw new Error('useFirebaseGame must be used within a FirebaseGameProvider');
  }
  return context;
}

export default FirebaseGameContext; 