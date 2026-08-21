import { useContext } from 'react';
import { GameContextType } from '../types';
import { AwsGameContext } from '../context/AwsGameContext';

export function useGame(): GameContextType {
  const context = useContext(AwsGameContext);
  if (context) return context;
  throw new Error('useGame must be used within an AwsGameProvider');
}

export default useGame;
