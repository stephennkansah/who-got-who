/**
 * Safety helper functions to prevent crashes from undefined/null data
 */

import { Player, Game, TaskInstance } from '../types';

/**
 * Safely get players array from game, with fallback to empty array
 */
export const getPlayersArray = (game?: Game | null): Player[] => {
  return game?.players || [];
};

/**
 * Safely get tasks array from player, with fallback to empty array
 */
export const getTasksArray = (player?: Player | null): TaskInstance[] => {
  return player?.tasks || [];
};

/**
 * Safely find a player by ID
 */
export const findPlayerById = (game?: Game | null, playerId?: string): Player | undefined => {
  if (!game?.players || !playerId) return undefined;
  return game.players.find(p => p.id === playerId);
};

/**
 * Safely find a task by ID
 */
export const findTaskById = (player?: Player | null, taskId?: string): TaskInstance | undefined => {
  if (!player?.tasks || !taskId) return undefined;
  return player.tasks.find(t => t.id === taskId);
};

/**
 * Safely get player score with fallback to 0
 */
export const getPlayerScore = (player?: Player | null): number => {
  return player?.score || 0;
};

/**
 * Safely get game status with fallback to 'draft'
 */
export const getGameStatus = (game?: Game | null): 'draft' | 'live' | 'ended' => {
  return game?.status || 'draft';
};

/**
 * Safely check if player is host
 */
export const isPlayerHost = (player?: Player | null): boolean => {
  return player?.isHost || false;
};

/**
 * Safely get completed tasks count
 */
export const getCompletedTasksCount = (player?: Player | null): number => {
  if (!player?.tasks) return 0;
  return player.tasks.filter(task => task.status === 'completed').length;
};

/**
 * Safely access localStorage with error handling
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to read from localStorage: ${key}`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to write to localStorage: ${key}`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove from localStorage: ${key}`, error);
      return false;
    }
  }
};

/**
 * Safely parse JSON with error handling
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON, using fallback:', error);
    return fallback;
  }
};

/**
 * Create a safe navigation function that handles errors
 */
export const createSafeNavigator = (navigate: (path: string) => void) => {
  return (path: string, fallbackPath: string = '/') => {
    try {
      navigate(path);
    } catch (error) {
      console.warn(`Navigation failed to ${path}, falling back to ${fallbackPath}`, error);
      navigate(fallbackPath);
    }
  };
};