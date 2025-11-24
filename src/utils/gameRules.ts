import { Player, TaskInstance } from '../types';

/**
 * Calculates the new score for a player after a successful Gotcha.
 * Adds 1 point for the Gotcha + 0.5 bonus points if it's a first-time target.
 */
export const calculateScore = (
  currentScore: number,
  targetId: string,
  previousTargets: string[]
): { score: number; isFirstTimeTarget: boolean } => {
  const isFirstTimeTarget = !previousTargets.includes(targetId);
  const bonusPoints = isFirstTimeTarget ? 0.5 : 0;
  const newScore = currentScore + 1 + bonusPoints;
  
  return { score: newScore, isFirstTimeTarget };
};

/**
 * Checks if a player is allowed to swap a task.
 */
export const canSwapTask = (player: Player): boolean => {
  return player.swapsLeft > 0;
};

/**
 * Updates the player's stats after a successful Gotcha.
 */
export const updatePlayerStats = (
  currentStats: Player['stats'],
  targetId: string,
  isFirstTimeTarget: boolean
): Player['stats'] => {
  return {
    ...currentStats,
    gothcas: (currentStats.gothcas || 0) + 1,
    uniqueTargets: isFirstTimeTarget 
      ? [...(currentStats.uniqueTargets || []), targetId]
      : (currentStats.uniqueTargets || []),
    firstTimeTargets: isFirstTimeTarget 
      ? (currentStats.firstTimeTargets || 0) + 1 
      : (currentStats.firstTimeTargets || 0)
  };
};

/**
 * Checks if the game should end based on the target score.
 */
export const checkWinCondition = (score: number, targetScore: number): boolean => {
  return score >= targetScore;
};

/**
 * Validates if a task can be completed.
 * (e.g. can't complete a task that is already completed or failed)
 */
export const validateTaskCompletion = (task: TaskInstance): boolean => {
  return task.status === 'pending' || task.status === 'disputed';
};

