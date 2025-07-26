import React, { useState, useRef, useEffect } from 'react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  swipeThreshold?: number;
  leftAction?: string;
  rightAction?: string;
  upAction?: string;
  downAction?: string;
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className = '',
  style = {},
  disabled = false,
  swipeThreshold = 100,
  leftAction = 'Swipe Left',
  rightAction = 'Swipe Right',
  upAction = 'Swipe Up',
  downAction = 'Swipe Down'
}: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Show hint animation on mount
    const timer = setTimeout(() => setShowHint(true), 500);
    const hideTimer = setTimeout(() => setShowHint(false), 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    if (disabled) return;
    
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
    currentPos.current = { x: clientX, y: clientY };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || disabled) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    
    currentPos.current = { x: clientX, y: clientY };
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging || disabled) return;

    const deltaX = dragOffset.x;
    const deltaY = dragOffset.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine primary direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > swipeThreshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > swipeThreshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    // Reset
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const getSwipeDirection = () => {
    const absDeltaX = Math.abs(dragOffset.x);
    const absDeltaY = Math.abs(dragOffset.y);
    
    if (absDeltaX > absDeltaY) {
      return dragOffset.x > 0 ? 'right' : 'left';
    } else {
      return dragOffset.y > 0 ? 'down' : 'up';
    }
  };

  const getActionForDirection = (direction: string) => {
    switch (direction) {
      case 'left': return leftAction;
      case 'right': return rightAction;
      case 'up': return upAction;
      case 'down': return downAction;
      default: return '';
    }
  };

  const shouldShowAction = () => {
    const absDeltaX = Math.abs(dragOffset.x);
    const absDeltaY = Math.abs(dragOffset.y);
    return (absDeltaX > 50 || absDeltaY > 50) && isDragging;
  };

  const getRotation = () => {
    return dragOffset.x * 0.1; // Slight rotation based on horizontal movement
  };

  const getScale = () => {
    const distance = Math.sqrt(dragOffset.x * dragOffset.x + dragOffset.y * dragOffset.y);
    const maxDistance = 200;
    const scaleReduction = Math.min(distance / maxDistance, 0.1);
    return 1 - scaleReduction;
  };

  return (
    <div
      ref={cardRef}
      className={`swipeable-card ${className} ${isDragging ? 'dragging' : ''} ${showHint ? 'hint' : ''}`}
      style={{
        ...style,
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg) scale(${getScale()})`,
        transition: isDragging ? 'none' : 'all 0.3s ease',
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      
      {/* Swipe Action Overlay */}
      {shouldShowAction() && (
        <div className="swipe-action-overlay">
          <div className={`swipe-action ${getSwipeDirection()}`}>
            {getActionForDirection(getSwipeDirection())}
          </div>
        </div>
      )}
      
      {/* Swipe Hints */}
      {showHint && !isDragging && (
        <div className="swipe-hints">
          {onSwipeLeft && (
            <div className="swipe-hint left">
              ← {leftAction}
            </div>
          )}
          {onSwipeRight && (
            <div className="swipe-hint right">
              {rightAction} →
            </div>
          )}
          {onSwipeUp && (
            <div className="swipe-hint up">
              ↑ {upAction}
            </div>
          )}
          {onSwipeDown && (
            <div className="swipe-hint down">
              ↓ {downAction}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 