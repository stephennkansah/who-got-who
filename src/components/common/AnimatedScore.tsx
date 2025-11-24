import React, { useEffect, useState } from 'react';

interface AnimatedScoreProps {
  value: number;
  className?: string;
  prefix?: string;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({ value, className = '', prefix = '' }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
      setPrevValue(value);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 400); // Match animation duration in CSS

      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <span className={`${className} ${isAnimating ? 'score-pop' : ''}`}>
      {prefix}{value}
    </span>
  );
};

