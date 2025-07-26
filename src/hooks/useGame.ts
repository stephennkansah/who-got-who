import { useContext } from 'react';
import { GameContextType } from '../types';
import GameContext from '../context/GameContext';
import FirebaseGameContext from '../context/FirebaseGameContext';

// Universal hook that works with both GameProvider and FirebaseGameProvider
export function useGame(): GameContextType {
  // Try Firebase context first
  const firebaseContext = useContext(FirebaseGameContext);
  if (firebaseContext) {
    return firebaseContext;
  }

  // Fall back to local context
  const localContext = useContext(GameContext);
  if (localContext) {
    return localContext;
  }

  // Neither context is available
  throw new Error('useGame must be used within a GameProvider or FirebaseGameProvider');
}

export default useGame; 