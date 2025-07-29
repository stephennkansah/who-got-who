import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Game, Player, TaskInstance, GameState, GameContextType } from '../types';
import { getRandomTasks, getReplacementTask, isBonusTask } from '../data/packs';
import FirebaseService, { getGameSettings } from '../services/firebase';
import NotificationService from '../services/notificationService';


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

  // Initialize notifications on mount
  useEffect(() => {
    NotificationService.initialize();
  }, []);

  // Real-time subscriptions cleanup and game state watching
  useEffect(() => {
    let gameUnsubscribe: (() => void) | null = null;
    let previousGameStatus: string | null = null;

    if (state.currentGame?.id) {
      // Subscribe to real-time game updates
      gameUnsubscribe = FirebaseService.subscribeToGame(
        state.currentGame.id,
        (game) => {
          if (game) {
            // Check for game status changes to show notifications
            if (previousGameStatus && previousGameStatus !== game.status) {
              if (game.status === 'ended') {
                // Find the winner (player with highest score)
                const winner = game.players.reduce((prev, current) => 
                  (prev.score > current.score) ? prev : current
                );
                NotificationService.showGameEnded(winner.name, winner.avatar);
                
                // Microsoft Clarity tracking now handled via script tag in index.html
              }
            }
            previousGameStatus = game.status;
            
            dispatch({ type: 'UPDATE_GAME', payload: game });
            
            // Also update current player if they exist in the game
            if (state.currentPlayer) {
              const updatedPlayer = game.players.find(p => p.id === state.currentPlayer!.id);
              if (updatedPlayer) {
                dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
              }
            }
          }
        }
      );
    }

    return () => {
      if (gameUnsubscribe) {
        gameUnsubscribe();
      }
    };
  }, [state.currentGame?.id, state.currentPlayer?.id]);

  // Generate unique player ID


  // Create game
  const createGame = async (hostName: string, avatar?: string, avatarType?: 'emoji' | 'photo') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playerId = Math.random().toString(36).substring(2, 15);
      
      // No tasks loaded yet - pack selection comes first
      const tasks: TaskInstance[] = [];
      
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
        },
        avatar: avatar || '🎮',
        avatarType: avatarType || 'emoji'
      };

      console.log('Creating game with host player:', player.name);
      await FirebaseService.createGame(gameId, player); // Standard game mode
      console.log('Game created with ID:', gameId);
      console.log('Player updated with gameId');

      // Get the created game (with a small delay to ensure Firebase consistency)
      await new Promise(resolve => setTimeout(resolve, 100));
      const game = await FirebaseService.getGame(gameId);
      console.log('Retrieved game:', game);
      
      if (game) {
        dispatch({ type: 'SET_GAME', payload: game });
        dispatch({ type: 'SET_PLAYER', payload: player });
        
        // Store in localStorage for rejoin functionality
        localStorage.setItem('currentGameId', gameId);
        localStorage.setItem('currentPlayerId', playerId);
        
        // Set up host disconnect cleanup to prevent content leakage
        await FirebaseService.setupHostDisconnectCleanup(gameId);
        
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
  const joinGame = async (gameId: string, playerName: string, avatar?: string, avatarType?: 'emoji' | 'photo') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // If user is already in a game, leave it first
      if (state.currentGame && state.currentGame.id !== gameId) {
        console.log('Leaving current game before joining new one');
        await leaveGame();
      }

      const playerId = Math.random().toString(36).substring(2, 15);
      
      // Get the game info
      const game = await FirebaseService.getGame(gameId);
      if (!game) {
        throw new Error('Game not found');
      }
      
      // Don't assign tasks yet if pack hasn't been selected
      // Tasks will be assigned when the host starts the game
      const tasks: TaskInstance[] = [];

      const player: Player = {
        id: playerId,
        name: playerName,
        gameId,
        swapsLeft: 2,
        score: 0,
        lockedIn: false,
        isHost: false,
        token: 'mock-token',
        tasks: tasks,
        stats: {
          gothcas: 0,
          failed: 0,
          disputesLost: 0,
          uniqueTargets: [],
          firstTimeTargets: 0
        },
        avatar: avatar || '🎮',
        avatarType: avatarType || 'emoji'
      };

      await FirebaseService.joinGame(gameId, player);

      dispatch({ type: 'SET_GAME', payload: game });
      dispatch({ type: 'SET_PLAYER', payload: player });
      
      // Store in localStorage for rejoin functionality
      localStorage.setItem('currentGameId', gameId);
      localStorage.setItem('currentPlayerId', playerId);
      
      // Microsoft Clarity tracking now handled via script tag in index.html
      
      console.log('Successfully joined game:', gameId);
    } catch (error) {
      console.error('Error joining game:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to join game: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Select pack for the game
  const selectPack = async (packId: 'core' | 'remote') => {
    if (!state.currentGame || !state.currentPlayer?.isHost) {
      throw new Error('Only the host can select a pack');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Update game settings with selected pack
      const updatedSettings = {
        ...state.currentGame.settings,
        selectedPack: packId,
        tasksLoaded: false
      };

      // Update both the packId and settings
      await FirebaseService.updateGame(state.currentGame.id, { 
        packId: packId,
        settings: updatedSettings 
      });
      
      // Update local state
      const updatedGame = {
        ...state.currentGame,
        packId: packId,
        settings: updatedSettings
      };
      
      dispatch({ type: 'SET_GAME', payload: updatedGame });
      
      console.log(`Pack selected: ${packId}`);
    } catch (error) {
      console.error('Error selecting pack:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to select pack' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Start game
  const startGame = async () => {
    if (!state.currentGame || !state.currentPlayer) return;
    
    const selectedPack = state.currentGame.settings?.selectedPack;
    if (!selectedPack) {
      dispatch({ type: 'SET_ERROR', payload: 'No pack selected. Please select a pack first.' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Load tasks for all players from the selected pack
      const { taskCount } = getGameSettings(state.currentGame.players.length);
      const updatedPlayers = state.currentGame.players.map(player => {
        const rawTasks = getRandomTasks(selectedPack, taskCount);
        const tasks: TaskInstance[] = rawTasks.map(task => ({
          ...task,
          id: Math.random().toString(36).substring(2, 15),
          gameId: state.currentGame!.id,
          playerId: player.id,
          status: 'pending' as const
        }));
        
        return {
          ...player,
          tasks: tasks
        };
      });

      // Update game settings to mark tasks as loaded
      const updatedSettings = {
        ...state.currentGame.settings,
        tasksLoaded: true
      };

      // Update the game with loaded tasks and settings
      await FirebaseService.updateGame(state.currentGame.id, {
        players: updatedPlayers,
        settings: updatedSettings
      });

      // Cancel host disconnect cleanup since game is now starting
      await FirebaseService.cancelHostDisconnectCleanup(state.currentGame.id);

      // Start the game
      await FirebaseService.startGame(state.currentGame.id, updatedPlayers);
      
      console.log(`Game started with ${selectedPack} pack! Tasks loaded for ${updatedPlayers.length} players.`);
    } catch (error) {
      console.error('Error starting game:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}` });
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
          // Cancel host disconnect cleanup since host is properly leaving
          await FirebaseService.cancelHostDisconnectCleanup(currentGame.id);
          
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
            
            // Set up disconnect cleanup for the new host
            await FirebaseService.setupHostDisconnectCleanup(currentGame.id);
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

    // Find the task being swapped and check if it's a bonus task
    const taskBeingSwapped = state.currentPlayer.tasks.find(task => task.id === taskId);
    if (!taskBeingSwapped) return;
    
    const currentPackId = state.currentGame?.settings?.selectedPack || 'core';
    const isSwappingBonusTask = isBonusTask(currentPackId, taskBeingSwapped);
    
    // Get a replacement task that respects the bonus task limit
    const newTask = getReplacementTask(currentPackId, state.currentPlayer.tasks, isSwappingBonusTask);
    if (!newTask) {
      console.error('No replacement tasks available');
      return;
    }
    
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
    if (!state.currentGame || !state.currentPlayer) return;

    try {
      const task = state.currentPlayer.tasks.find(t => t.id === taskId);
      if (!task) return;

      if (targetId === 'failed') {
        // Handle failed task (no one got)
        const updatedTask = { 
          ...task, 
          status: 'failed' as const, 
          gotAt: new Date()
        };
        
        const updatedPlayer = {
          ...state.currentPlayer,
          tasks: state.currentPlayer.tasks.map(t => 
            t.id === taskId ? updatedTask : t
          ),
          stats: {
            ...state.currentPlayer.stats,
            failed: (state.currentPlayer.stats.failed || 0) + 1
          }
        };

        await FirebaseService.updatePlayer(state.currentGame.id, updatedPlayer);
        
        // Microsoft Clarity tracking now handled via script tag in index.html
        
                 NotificationService.showTaskFailed(state.currentPlayer.name);
        
        dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
        
      } else if (targetId.startsWith('caught:')) {
        // Handle getting caught
        const catcherId = targetId.replace('caught:', '');
        
        const updatedTask = { 
          ...task, 
          status: 'failed' as const,
          targetId: catcherId, // Who caught you
          gotAt: new Date()
        };
        
        const updatedPlayer = {
          ...state.currentPlayer,
          tasks: state.currentPlayer.tasks.map(t => 
            t.id === taskId ? updatedTask : t
          ),
          stats: {
            ...state.currentPlayer.stats,
            failed: (state.currentPlayer.stats.failed || 0) + 1
          }
        };

        await FirebaseService.updatePlayer(state.currentGame.id, updatedPlayer);
        
        // Microsoft Clarity tracking now handled via script tag in index.html
        
        const catcherPlayer = state.currentGame.players.find(p => p.id === catcherId);
        if (catcherPlayer) {
          NotificationService.showPlayerGotCaught(state.currentPlayer.name, catcherPlayer.name, state.currentPlayer.avatar, catcherPlayer.avatar);
        }
        
        dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
        
      } else {
        // Handle successful gotcha
        const uniqueTargets = state.currentPlayer.stats.uniqueTargets || [];
        const gothcas = state.currentPlayer.stats.gothcas || 0;
        
        const isFirstTimeTarget = !uniqueTargets.includes(targetId);
        const bonusPoints = isFirstTimeTarget ? 0.5 : 0;
        const newScore = state.currentPlayer.score + 1 + bonusPoints;

        // Update local tasks immediately
        const updatedTasks = state.currentPlayer.tasks.map(t => 
          t.id === taskId 
            ? { ...task, status: 'completed' as const, targetId, gotAt: new Date() }
            : t
        );

        const updatedPlayer = {
          ...state.currentPlayer,
          score: newScore,
          tasks: updatedTasks,
          stats: {
            ...state.currentPlayer.stats,
            gothcas: gothcas + 1,
            uniqueTargets: isFirstTimeTarget 
              ? [...uniqueTargets, targetId]
              : uniqueTargets,
            firstTimeTargets: isFirstTimeTarget 
              ? (state.currentPlayer.stats.firstTimeTargets || 0) + 1 
              : (state.currentPlayer.stats.firstTimeTargets || 0)
          }
        };

        const targetPlayer = state.currentGame.players.find(p => p.id === targetId);
        if (targetPlayer) {
          NotificationService.showPlayerGotPlayer(state.currentPlayer.name, targetPlayer.name, state.currentPlayer.avatar, targetPlayer.avatar);
        }

        // Microsoft Clarity tracking now handled via script tag in index.html
        
        await FirebaseService.updatePlayer(state.currentGame.id, updatedPlayer);
        
        // Immediately update local state
        dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
        
        // Check if player won
        if (updatedPlayer.score >= state.currentGame.settings.targetScore) {
          console.log('🏆 Player reached target score! Ending game...');
          await endGame();
        }
      }
    } catch (error) {
      console.error('Error claiming gotcha:', error);
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
    selectPack,
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