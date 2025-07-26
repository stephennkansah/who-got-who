import { useContext } from 'react';
import { GameContextType } from '../types';
import { GameContext } from '../context/GameContext';
import FirebaseGameContext from '../context/FirebaseGameContext';

export function useGame() {
  // Always call both useContext hooks (safe: they just read context)
  const firebaseContext = useContext(FirebaseGameContext) as unknown as GameContextType | null;
  const localContext = useContext(GameContext) as GameContextType | null;

  if (firebaseContext) {
    return firebaseContext;
  }
  if (localContext) {
    return localContext;
  }
  throw new Error('useGame must be used within a GameProvider or FirebaseGameProvider');
}

export default useGame; 