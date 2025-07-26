// Universal hook that works with both GameProvider and FirebaseGameProvider
// This detects if Firebase is configured and uses the appropriate hook

import { useGame as useLocalGame } from '../context/GameContext';
import { useFirebaseGame } from '../context/FirebaseGameContext';

// Check if Firebase is configured
const isFirebaseConfigured = process.env.REACT_APP_FIREBASE_API_KEY && 
                           process.env.REACT_APP_FIREBASE_DATABASE_URL &&
                           process.env.REACT_APP_FIREBASE_PROJECT_ID;

export function useGame() {
  if (isFirebaseConfigured) {
    // Use Firebase hook when Firebase is configured
    return useFirebaseGame();
  } else {
    // Use local hook when Firebase is not configured
    return useLocalGame();
  }
}

export default useGame; 