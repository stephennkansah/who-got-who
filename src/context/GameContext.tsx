import React, { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { 
  GameState, 
  GameStatus, 
  Player,
  TaskInstance,
  Game,
  Award,
  Task,
  GameContextType,
  Dispute
} from '../types';
import { getRandomTasks } from '../data/mockTasks';

// Initial State
const initialState: GameState = {
  currentGame: null,
  currentPlayer: null,
  isConnected: false,
  isLoading: false,
  error: null,
  activeDisputes: [],
  leaderboard: []
};

// Define local GameAction type
type GameAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_GAME'; payload: Game | null }
  | { type: 'SET_PLAYER'; payload: Player | null }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'UPDATE_TASK'; payload: TaskInstance }
  | { type: 'ADD_DISPUTE'; payload: Dispute }
  | { type: 'UPDATE_DISPUTE'; payload: Dispute }
  | { type: 'REMOVE_DISPUTE'; payload: string }
  | { type: 'UPDATE_LEADERBOARD'; payload: Player[] };

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CONNECTION':
      return { ...state, isConnected: action.payload };
    
    case 'SET_GAME':
      return { ...state, currentGame: action.payload };
    
    case 'SET_PLAYER':
      return { ...state, currentPlayer: action.payload };
    
    case 'UPDATE_PLAYER':
      if (!state.currentGame) return state;
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          players: state.currentGame.players.map(p => 
            p.id === action.payload.id ? action.payload : p
          )
        },
        currentPlayer: state.currentPlayer?.id === action.payload.id 
          ? action.payload 
          : state.currentPlayer
      };
    
    case 'ADD_PLAYER':
      if (!state.currentGame) return state;
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          players: [...state.currentGame.players, action.payload]
        }
      };
    
    case 'REMOVE_PLAYER':
      if (!state.currentGame) return state;
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          players: state.currentGame.players.filter(p => p.id !== action.payload)
        }
      };
    
    case 'UPDATE_TASK':
      if (!state.currentPlayer) return state;
      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          tasks: state.currentPlayer.tasks.map(t => 
            t.id === action.payload.id ? action.payload : t
          )
        }
      };
    
    case 'ADD_DISPUTE':
      return {
        ...state,
        activeDisputes: [...state.activeDisputes, action.payload]
      };
    
    case 'UPDATE_DISPUTE':
      return {
        ...state,
        activeDisputes: state.activeDisputes.map(d => 
          d.id === action.payload.id ? action.payload : d
        )
      };
    
    case 'REMOVE_DISPUTE':
      return {
        ...state,
        activeDisputes: state.activeDisputes.filter(d => d.id !== action.payload)
      };
    
    case 'UPDATE_LEADERBOARD':
      return {
        ...state,
        leaderboard: action.payload
      };
    
    default:
      return state;
  }
}

// Context Creation

export const GameContext = createContext<GameContextType | undefined>(undefined);

// Socket instance
let socket: Socket | null = null;

// Provider Component
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize socket connection
  useEffect(() => {
    // TODO: Replace mock with real Socket.IO connection once backend is ready
    // For now we skip setting up a socket so TypeScript doesn't complain about
    // methods like .on() on an uninitialised object.
    dispatch({ type: 'SET_CONNECTION', payload: false });
    return () => {
      if (socket) {
        socket.disconnect?.();
        socket = null;
      }
    };
  }, []);

  // Check for existing game in localStorage on app load
  useEffect(() => {
    const savedGameData = localStorage.getItem('gameData');
    const savedPlayerId = localStorage.getItem('currentPlayerId');
    
    if (savedGameData && savedPlayerId) {
      try {
        const game: Game = JSON.parse(savedGameData);
        const player = game.players.find(p => p.id === savedPlayerId);
        
        if (game && player) {
          dispatch({ type: 'SET_GAME', payload: game });
          dispatch({ type: 'SET_PLAYER', payload: player });
        }
      } catch (error) {
        console.log('Failed to restore game from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('gameData');
        localStorage.removeItem('currentPlayerId');
      }
    }
  }, []);

  // Game Actions
  const createGame = async (hostName: string, mode: 'casual' | 'competitive') => {
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
        swapsLeft: mode === 'casual' ? 2 : 1,
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

      const mockGame: Game = {
        id: gameId,
        status: 'draft',
        mode,
        packId: 'core-a',
        createdBy: hostName,
        createdAt: new Date(),
        hostId: playerId,
        players: [player],
        settings: {
          swapsAllowed: mode === 'casual' ? 2 : 1,
          disputeTimeoutSeconds: 120,
          hostDefaultOnTie: true,
          enableNegativeScoring: mode === 'competitive',
          maxPlayers: 8,
          targetScore: 4
        },
        currentPhase: 'draft'
      };
      
      dispatch({ type: 'SET_GAME', payload: mockGame });
      dispatch({ type: 'SET_PLAYER', payload: player });
      
      // Store game info for rejoin
      localStorage.setItem('currentGameId', mockGame.id);
      localStorage.setItem('currentPlayerId', playerId);
      localStorage.setItem('gameData', JSON.stringify(mockGame));
      localStorage.setItem('playerToken', 'mock-token');
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create game' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const joinGame = async (gameId: string, playerName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      // Try to load existing game from localStorage
      const savedGameData = localStorage.getItem('gameData');
      let game: Game | null = null;
      
      if (savedGameData) {
        const parsedGame = JSON.parse(savedGameData);
        if (parsedGame.id === gameId) {
          game = parsedGame;
        }
      }
      
      if (!game) {
        throw new Error('Game not found');
      }
      
      // Check if player already exists
      let existingPlayer = game.players.find(p => p.name === playerName);
      
      if (!existingPlayer) {
        // Create new player
        const playerId = Math.random().toString(36).substr(2, 9);
        const playerTasks = getRandomTasks('core-a', 7);
        
        const newPlayer: Player = {
          id: playerId,
          name: playerName,
          gameId: gameId,
          swapsLeft: game.settings.swapsAllowed,
          score: 0,
          lockedIn: false,
          isHost: false,
          token: 'mock-token',
          tasks: playerTasks.map((task, index) => ({
            id: `task-instance-${playerId}-${index}`,
            gameId: gameId,
            playerId: playerId,
            text: task.text,
            tips: task.tips,
            status: 'pending' as const
          })),
          stats: {
            gothcas: 0,
            failed: 0,
            disputesLost: 0,
            uniqueTargets: [],
            firstTimeTargets: 0
          }
        };
        
        game.players.push(newPlayer);
        existingPlayer = newPlayer;
      }
      
      dispatch({ type: 'SET_GAME', payload: game });
      dispatch({ type: 'SET_PLAYER', payload: existingPlayer });
      
      // Update localStorage
      localStorage.setItem('currentGameId', gameId);
      localStorage.setItem('currentPlayerId', existingPlayer.id);
      localStorage.setItem('gameData', JSON.stringify(game));
      localStorage.setItem('playerToken', 'mock-token');
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to join game. Make sure the game ID is correct.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startGame = async () => {
    if (!state.currentGame) return;
    
    const updatedGame = {
      ...state.currentGame,
      status: 'live' as const,
      currentPhase: 'play' as const
    };
    
    dispatch({ type: 'SET_GAME', payload: updatedGame });
    localStorage.setItem('gameData', JSON.stringify(updatedGame));
  };

  const endGame = async () => {
    if (!state.currentGame) return;
    
    const updatedGame = {
      ...state.currentGame,
      status: 'ended' as const,
      currentPhase: 'ended' as const
    };
    
    dispatch({ type: 'SET_GAME', payload: updatedGame });
    localStorage.setItem('gameData', JSON.stringify(updatedGame));
  };

  const lockInPlayer = async () => {
    if (!state.currentPlayer || !state.currentGame) return;
    
    const updatedPlayer = { ...state.currentPlayer, lockedIn: true };
    const updatedGame = {
      ...state.currentGame,
      players: state.currentGame.players.map(p => 
        p.id === updatedPlayer.id ? updatedPlayer : p
      )
    };
    
    dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
    dispatch({ type: 'SET_GAME', payload: updatedGame });
    localStorage.setItem('gameData', JSON.stringify(updatedGame));
  };

  const updatePlayerName = async (name: string) => {
    if (!state.currentPlayer || !state.currentGame) return;
    
    const updatedPlayer = { ...state.currentPlayer, name };
    const updatedGame = {
      ...state.currentGame,
      players: state.currentGame.players.map(p => 
        p.id === updatedPlayer.id ? updatedPlayer : p
      )
    };
    
    dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
    dispatch({ type: 'SET_GAME', payload: updatedGame });
    localStorage.setItem('gameData', JSON.stringify(updatedGame));
  };

  const swapTask = async (taskId: string) => {
    const currentPlayer = state.currentPlayer;
    const currentGame = state.currentGame;
    
    if (!currentPlayer || !currentGame) return;
    
    if (currentPlayer.swapsLeft <= 0) {
      dispatch({ type: 'SET_ERROR', payload: 'No swaps remaining' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Get one new random task
      const newTasks = getRandomTasks('core-pack-a', 1);
      const newTask = newTasks[0];
      
      if (!newTask) {
        dispatch({ type: 'SET_ERROR', payload: 'No more tasks available for swapping' });
        return;
      }
      
      const updatedTasks = currentPlayer.tasks.map(task => 
        task.id === taskId 
          ? {
              ...newTask,
              id: taskId,
              gameId: currentGame.id,
              playerId: currentPlayer.id,
              status: task.status // Preserve the original status
            }
          : task
      );
      
      const updatedPlayer = {
        ...currentPlayer,
        tasks: updatedTasks,
        swapsLeft: currentPlayer.swapsLeft - 1
      };
      
      dispatch({ type: 'UPDATE_PLAYER', payload: updatedPlayer });
      
      // Update the game state with the new player data
      const updatedGame: Game = {
        ...currentGame,
        players: currentGame.players.map(p => 
          p.id === updatedPlayer.id ? updatedPlayer : p
        )
      };
      
      dispatch({ type: 'SET_GAME', payload: updatedGame });
      localStorage.setItem('gameData', JSON.stringify(updatedGame));
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to swap task' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const claimGotcha = async (taskId: string, targetId: string) => {
    if (!state.currentPlayer || !state.currentGame) return;
    
    try {
      // Update task status and add target
      const updatedTasks = state.currentPlayer.tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed' as const, targetId, gotAt: new Date() }
          : task
      );
      
      // Update player score and stats
      const targetPlayer = state.currentGame.players.find(p => p.id === targetId);
      const isFirstTimeTarget = !state.currentPlayer.stats.uniqueTargets.includes(targetId);
      
      const updatedPlayer = {
        ...state.currentPlayer,
        tasks: updatedTasks,
        score: state.currentPlayer.score + 1 + (isFirstTimeTarget ? 0.5 : 0),
        stats: {
          ...state.currentPlayer.stats,
          gothcas: state.currentPlayer.stats.gothcas + 1,
          uniqueTargets: isFirstTimeTarget 
            ? [...state.currentPlayer.stats.uniqueTargets, targetId]
            : state.currentPlayer.stats.uniqueTargets,
          firstTimeTargets: isFirstTimeTarget 
            ? state.currentPlayer.stats.firstTimeTargets + 1
            : state.currentPlayer.stats.firstTimeTargets
        }
      };
      
      const updatedGame = {
        ...state.currentGame,
        players: state.currentGame.players.map(p => 
          p.id === updatedPlayer.id ? updatedPlayer : p
        )
      };
      
      dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
      dispatch({ type: 'SET_GAME', payload: updatedGame });
      localStorage.setItem('gameData', JSON.stringify(updatedGame));
      
      // Check win condition
      if (updatedPlayer.score >= state.currentGame.settings.targetScore) {
        await endGame();
      }
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to claim Gotcha' });
    }
  };

  const disputeGotcha = async (taskId: string, reason?: string) => {
    // For demo purposes, just mark as disputed
    console.log('Dispute created for task:', taskId, 'Reason:', reason);
  };

  const voteOnDispute = async (disputeId: string, vote: boolean) => {
    // For demo purposes, just log the vote
    console.log('Vote cast on dispute:', disputeId, 'Vote:', vote);
  };

  const acceptGotcha = async (taskId: string) => {
    // For demo purposes, just accept
    console.log('Gotcha accepted for task:', taskId);
  };

  // Testing utilities for demo
  const forceGameState = async (status: 'draft' | 'live' | 'ended') => {
    if (!state.currentGame) return;
    
    const updatedGame = {
      ...state.currentGame,
      status,
      currentPhase: (status === 'draft' ? 'draft' : status === 'live' ? 'play' : 'ended') as 'draft' | 'play' | 'ended'
    };
    
    dispatch({ type: 'SET_GAME', payload: updatedGame });
    localStorage.setItem('gameData', JSON.stringify(updatedGame));
  };

  const simulateScore = async (points: number) => {
    if (!state.currentPlayer || !state.currentGame) return;
    
    const updatedPlayer = {
      ...state.currentPlayer,
      score: Math.max(0, state.currentPlayer.score + points),
      stats: {
        ...state.currentPlayer.stats,
        gothcas: Math.max(0, state.currentPlayer.stats.gothcas + (points > 0 ? points : 0))
      }
    };
    
    const updatedGame = {
      ...state.currentGame,
      players: state.currentGame.players.map(p => 
        p.id === updatedPlayer.id ? updatedPlayer : p
      )
    };
    
    dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
    dispatch({ type: 'SET_GAME', payload: updatedGame });
    localStorage.setItem('gameData', JSON.stringify(updatedGame));
  };

  // Update player tasks directly
  const updatePlayerTasks = (playerId: string, updatedTasks: TaskInstance[]) => {
    dispatch({
      type: 'SET_GAME',
      payload: {
        ...state.currentGame!,
        players: state.currentGame!.players.map(player => 
          player.id === playerId 
            ? { ...player, tasks: player.tasks.map(task => {
                const updated = updatedTasks.find(ut => ut.id === task.id);
                return updated || task;
              })}
            : player
        )
      }
    });

    // Update localStorage
    const gameData = {
      ...state.currentGame!,
      players: state.currentGame!.players.map(player => 
        player.id === playerId 
          ? { ...player, tasks: player.tasks.map(task => {
              const updated = updatedTasks.find(ut => ut.id === task.id);
              return updated || task;
            })}
          : player
      )
    };
    localStorage.setItem('gameData', JSON.stringify(gameData));
  };

  const createTaskInstances = (tasks: Task[], gameId: string, playerId: string): TaskInstance[] => {
    return tasks.map(task => ({
      id: `${task.id}-${playerId}`,
      gameId,
      playerId,
      text: task.text,
      tips: task.tips,
      status: 'pending' as const
    }));
  };

  const contextValue: GameContextType = {
    state,
    socket,
    createGame,
    joinGame,
    startGame,
    endGame,
    lockInPlayer,
    updatePlayerName,
    swapTask,
    claimGotcha,
    disputeGotcha,
    voteOnDispute,
    acceptGotcha,
    // Testing utilities
    forceGameState,
    simulateScore,
    updatePlayerTasks
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 