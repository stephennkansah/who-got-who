import { useContext } from 'react';
import { GameContextType } from '../types';
import { GameContext } from '../context/GameContext';
import { FirebaseGameContext } from '../context/FirebaseGameContext';

export function useGame(): GameContextType {
  // Always call both useContext hooks (safe: they just read context)
  const firebaseContext = useContext(FirebaseGameContext);
  const localContext = useContext(GameContext);

  // Return Firebase context if available and not null
  if (firebaseContext) {
    return firebaseContext;
  }
  
  // Return local context if available and not null
  if (localContext) {
    return localContext;
  }
  
  throw new Error('useGame must be used within a GameProvider or FirebaseGameProvider');
}

export default useGame; 