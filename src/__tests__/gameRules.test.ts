import { 
  calculateScore, 
  canSwapTask, 
  updatePlayerStats, 
  checkWinCondition,
  validateTaskCompletion
} from '../utils/gameRules';
import { Player, TaskInstance } from '../types';

describe('Game Rules Logic', () => {
  
  describe('calculateScore', () => {
    it('should add 1.5 points for a new target', () => {
      const result = calculateScore(0, 'target1', []);
      expect(result.score).toBe(1.5);
      expect(result.isFirstTimeTarget).toBe(true);
    });

    it('should add 1.0 point for a repeat target', () => {
      const result = calculateScore(2, 'target1', ['target1']);
      expect(result.score).toBe(3);
      expect(result.isFirstTimeTarget).toBe(false);
    });
  });

  describe('canSwapTask', () => {
    it('should return true if swaps > 0', () => {
      const player = { swapsLeft: 1 } as Player;
      expect(canSwapTask(player)).toBe(true);
    });

    it('should return false if swaps <= 0', () => {
      const player = { swapsLeft: 0 } as Player;
      expect(canSwapTask(player)).toBe(false);
    });
  });

  describe('updatePlayerStats', () => {
    it('should increment gotchas and update unique targets for new target', () => {
      const stats = { gothcas: 0, uniqueTargets: [], firstTimeTargets: 0 } as any;
      const newStats = updatePlayerStats(stats, 'target1', true);
      
      expect(newStats.gothcas).toBe(1);
      expect(newStats.uniqueTargets).toContain('target1');
      expect(newStats.firstTimeTargets).toBe(1);
    });

    it('should only increment gotchas for repeat target', () => {
      const stats = { gothcas: 1, uniqueTargets: ['target1'], firstTimeTargets: 1 } as any;
      const newStats = updatePlayerStats(stats, 'target1', false);
      
      expect(newStats.gothcas).toBe(2);
      expect(newStats.uniqueTargets).toHaveLength(1); // Still just 1 unique target
      expect(newStats.firstTimeTargets).toBe(1);
    });
  });

  describe('checkWinCondition', () => {
    it('should return true if score meets target', () => {
      expect(checkWinCondition(5, 5)).toBe(true);
      expect(checkWinCondition(6, 5)).toBe(true);
    });

    it('should return false if score is below target', () => {
      expect(checkWinCondition(4.5, 5)).toBe(false);
    });
  });

  describe('validateTaskCompletion', () => {
    it('should allow pending tasks', () => {
      const task = { status: 'pending' } as TaskInstance;
      expect(validateTaskCompletion(task)).toBe(true);
    });

    it('should reject completed tasks', () => {
      const task = { status: 'completed' } as TaskInstance;
      expect(validateTaskCompletion(task)).toBe(false);
    });

    it('should reject failed tasks', () => {
      const task = { status: 'failed' } as TaskInstance;
      expect(validateTaskCompletion(task)).toBe(false);
    });
  });

});

