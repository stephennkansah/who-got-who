import React, { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { 
  GameState, 
  Player,
  TaskInstance,
  Game,
  Task,
  GameContextType,
  Dispute
} from '../types';
import { getRandomTasks, getReplacementTask, isBonusTask } from '../data/mockTasks';
import { getRandomHolidayChallenges, getHolidayChallengeWinCondition } from '../data/packs';
import { getGameSettings } from '../services/firebase';

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
        
        // Only restore games that have a pack selected or are already live/ended
        // This prevents restoring incomplete draft games
        if (game && player && (game.settings?.selectedPack || game.status !== 'draft')) {
          console.log('🔄 Restoring game from localStorage:', game.id);
          dispatch({ type: 'SET_GAME', payload: game });
          dispatch({ type: 'SET_PLAYER', payload: player });
        } else {
          console.log('🚫 Skipping restoration of incomplete draft game');
          // Clear incomplete game data
          localStorage.removeItem('gameData');
          localStorage.removeItem('currentPlayerId');
          localStorage.removeItem('currentGameId');
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
  const createGame = async (hostName: string, avatar?: string, avatarType?: 'emoji' | 'photo') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playerId = Math.random().toString(36).substring(2, 15);
      
      // Don't load tasks yet - wait for pack selection
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

      const mockGame: Game = {
        id: gameId,
        status: 'draft',
        mode: 'casual',
        packId: '', // No pack selected yet
        createdBy: hostName,
        createdAt: new Date(),
        hostId: playerId,
        players: [player],
        settings: {
          ...getGameSettings(1).settings,
          selectedPack: null, // Explicitly set no pack selected
          tasksLoaded: false
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

  const joinGame = async (gameId: string, playerName: string, avatar?: string, avatarType?: 'emoji' | 'photo') => {
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
        
        // Don't assign tasks yet - wait for pack selection
        const newPlayer: Player = {
          id: playerId,
          name: playerName,
          gameId: gameId,
          swapsLeft: 2,
          score: 0,
          lockedIn: false,
          isHost: false,
          token: 'mock-token',
          tasks: [], // No tasks until pack is selected and game starts
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

  // Select pack for the game (local context version)
  const selectPack = async (packId: 'core' | 'remote' | 'holiday-challenge') => {
    if (!state.currentGame || !state.currentPlayer?.isHost) {
      throw new Error('Only the host can select a pack');
    }

    // Update game settings with selected pack
    const updatedSettings = {
      ...state.currentGame.settings,
      selectedPack: packId,
      tasksLoaded: false,
      // Add Holiday Challenge specific settings
      ...(packId === 'holiday-challenge' && {
        holidayChallengeWinCondition: getHolidayChallengeWinCondition(state.currentGame.players.length),
        holidayGoldPoints: 3,
        holidaySilverPoints: 1,
        holidayMaxSilverPerChallenge: 2
      })
    };

    // Set game type based on pack selection
    const gameType: 'traditional' | 'holiday-challenge' = packId === 'holiday-challenge' ? 'holiday-challenge' : 'traditional';

    const updatedGame = {
      ...state.currentGame,
      gameType: gameType,
      settings: updatedSettings,
      ...(packId === 'holiday-challenge' && { challengeCompletions: [] })
    };
    
    dispatch({ type: 'SET_GAME', payload: updatedGame });
    localStorage.setItem('gameData', JSON.stringify(updatedGame));
    
    console.log(`Pack selected: ${packId}`);
  };

  const startGame = async () => {
    if (!state.currentGame) return;
    
    const selectedPack = state.currentGame.settings?.selectedPack;
    if (!selectedPack) {
      dispatch({ type: 'SET_ERROR', payload: 'No pack selected. Please select a pack first.' });
      return;
    }
    
    let updatedPlayers = state.currentGame.players;
    
    if (selectedPack === 'holiday-challenge') {
      // Holiday Challenge Pack: Select 10 random challenges for everyone
      const selectedChallenges = getRandomHolidayChallenges(10);
      
      // Initialize players with challenge-specific fields
      updatedPlayers = state.currentGame.players.map(player => ({
        ...player,
        challengeScore: 0,
        challengeCompletions: [],
        tasks: [] // Holiday challenges don't use individual tasks
      }));
      
      // Store the selected challenges in the local game data
      state.currentGame.selectedChallenges = selectedChallenges;
    } else {
      // Traditional packs: Load tasks for all players
      const { taskCount } = getGameSettings(state.currentGame.players.length);
      updatedPlayers = state.currentGame.players.map(player => {
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
    }
    
    const updatedGame = {
      ...state.currentGame,
      status: 'live' as const,
      currentPhase: 'play' as const,
      players: updatedPlayers,
      settings: {
        ...state.currentGame.settings,
        tasksLoaded: true
      },
      ...(selectedPack === 'holiday-challenge' && state.currentGame.selectedChallenges && {
        selectedChallenges: state.currentGame.selectedChallenges
      })
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

  const leaveGame = async () => {
    // If user is host and game is still in draft/lobby phase, warn them
    if (state.currentPlayer?.isHost && state.currentGame?.status === 'draft') {
      const confirmed = window.confirm(
        '⚠️ Leave Lobby?\n\nAs the host, leaving the lobby will END THE GAME for all players.\n\nAre you sure you want to leave?'
      );
      
      if (!confirmed) {
        return; // Don't leave if they cancel
      }
    }
    
    // Clear localStorage
    localStorage.removeItem('currentGameId');
    localStorage.removeItem('currentPlayerId');
    localStorage.removeItem('gameData');
    
    // Reset state
    dispatch({ type: 'SET_GAME', payload: null });
    dispatch({ type: 'SET_PLAYER', payload: null });
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
      // Find the task being swapped and check if it's a bonus task
      const taskBeingSwapped = currentPlayer.tasks.find(task => task.id === taskId);
      if (!taskBeingSwapped) {
        dispatch({ type: 'SET_ERROR', payload: 'Task not found' });
        return;
      }
      
      const isSwappingBonusTask = isBonusTask(taskBeingSwapped);
      
      // Get a replacement task that respects the bonus task limit
      const newTask = getReplacementTask(currentPlayer.tasks, isSwappingBonusTask);
      
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

  // Holiday Challenge Pack methods (local context version)
  const completeChallenge = async (challengeId: string, proofImage?: File) => {
    if (!state.currentGame || !state.currentPlayer) {
      throw new Error('No active game or player');
    }

    if (state.currentGame.gameType !== 'holiday-challenge') {
      throw new Error('This action is only available for Holiday Challenge Pack games');
    }

    try {
      // Check if this challenge already has a gold completion
      const existingCompletions = state.currentGame.challengeCompletions || [];
      const challengeCompletions = existingCompletions.filter(c => c.challengeId === challengeId);
      const hasGold = challengeCompletions.some(c => c.type === 'gold');
      
      // Check if this player already completed this challenge
      const playerAlreadyCompleted = challengeCompletions.some(c => c.playerId === state.currentPlayer!.id);
      if (playerAlreadyCompleted) {
        throw new Error('You have already completed this challenge');
      }

      // Determine completion type and points
      const completionType: 'gold' | 'silver' = hasGold ? 'silver' : 'gold';
      const points = hasGold 
        ? (state.currentGame.settings.holidaySilverPoints || 1)
        : (state.currentGame.settings.holidayGoldPoints || 3);

      // Upload proof image if provided
      let proofImageUrl: string | undefined;
      if (proofImage) {
        proofImageUrl = await uploadProofImage(proofImage, challengeId);
      }

      // Create challenge completion
      const completion = {
        id: Math.random().toString(36).substring(2, 15),
        challengeId,
        playerId: state.currentPlayer.id,
        gameId: state.currentGame.id,
        completedAt: new Date(),
        points,
        type: completionType,
        proofImageUrl
      };

      // Update player score and completions
      const updatedPlayer = {
        ...state.currentPlayer,
        challengeScore: (state.currentPlayer.challengeScore || 0) + points,
        challengeCompletions: [...(state.currentPlayer.challengeCompletions || []), challengeId]
      };

      // Update game with new completion
      const updatedGame = {
        ...state.currentGame,
        challengeCompletions: [...existingCompletions, completion],
        players: state.currentGame.players.map(p => 
          p.id === state.currentPlayer!.id ? updatedPlayer : p
        )
      };

      // Update local state and localStorage
      dispatch({ type: 'SET_GAME', payload: updatedGame });
      dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
      localStorage.setItem('gameData', JSON.stringify(updatedGame));

      // Check for win condition
      const winCondition = state.currentGame.settings.holidayChallengeWinCondition || 7;
      if (updatedPlayer.challengeScore >= winCondition) {
        // Auto-end game when win condition is met
        setTimeout(() => {
          const wonGame = {
            ...updatedGame,
            status: 'ended' as const,
            currentPhase: 'ended' as const
          };
          dispatch({ type: 'SET_GAME', payload: wonGame });
          localStorage.setItem('gameData', JSON.stringify(wonGame));
        }, 1000); // Small delay to show the winning completion
      }

      console.log(`Challenge completed: ${challengeId} (${completionType}, ${points} points)`);
    } catch (error) {
      console.error('Error completing challenge:', error);
      throw error;
    }
  };

  const uploadProofImage = async (file: File, challengeId: string): Promise<string> => {
    if (!state.currentGame || !state.currentPlayer) {
      throw new Error('No active game or player');
    }

    // For local context, return a mock URL (same as Firebase context)
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUrl = `https://mockcdn.example.com/images/${state.currentGame!.id}/${challengeId}/${state.currentPlayer!.id}_${Date.now()}.jpg`;
        resolve(mockUrl);
      }, 1000);
    });
  };

  const contextValue: GameContextType = {
    state,
    socket,
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
    // Testing utilities
    forceGameState,
    simulateScore,
    updatePlayerTasks,
    // Holiday Challenge methods
    completeChallenge,
    uploadProofImage
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