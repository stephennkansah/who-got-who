import React, { useState, useEffect } from 'react';
import SwipeableCard from './SwipeableCard';

interface CardDeckProps {
  cards: Array<{
    id: string;
    content: React.ReactNode;
    leftAction?: string;
    rightAction?: string;
    upAction?: string;
    downAction?: string;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
  }>;
  maxVisible?: number;
  className?: string;
  onCardRemoved?: (cardId: string) => void;
  emptyState?: React.ReactNode;
}

export default function CardDeck({
  cards,
  maxVisible = 3,
  className = '',
  onCardRemoved,
  emptyState
}: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingDirection, setAnimatingDirection] = useState<'left' | 'right' | null>(null);
  const [newCardDirection, setNewCardDirection] = useState<'from-left' | 'from-right' | null>(null);

  // For single card view, show navigation
  const isSingleCardView = maxVisible === 1;
  
  useEffect(() => {
    // Reset index if it's beyond available cards
    if (currentIndex >= cards.length && cards.length > 0) {
      setCurrentIndex(0);
    }
  }, [cards.length, currentIndex]);

  const nextCard = () => {
    if (cards.length > 1) {
      setAnimatingDirection('left');
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setAnimatingDirection(null);
        setNewCardDirection('from-right');
        setTimeout(() => setNewCardDirection(null), 350);
      }, 180);
    }
  };

  const prevCard = () => {
    if (cards.length > 1) {
      setAnimatingDirection('right');
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        setAnimatingDirection(null);
        setNewCardDirection('from-left');
        setTimeout(() => setNewCardDirection(null), 350);
      }, 180);
    }
  };

  if (cards.length === 0) {
    return (
      <div className={`card-deck empty ${className}`}>
        {emptyState || (
          <div className="empty-deck">
            <div className="empty-deck-icon">🎴</div>
            <p>No more cards</p>
          </div>
        )}
      </div>
    );
  }

  const visibleCards = isSingleCardView 
    ? [cards[currentIndex]] 
    : cards.slice(currentIndex, currentIndex + maxVisible);

  return (
    <div className={`card-deck ${className}`}>
      {/* Navigation for single card view */}
      {isSingleCardView && cards.length > 1 && (
        <div className="deck-navigation">
          <button 
            className="nav-btn prev"
            onClick={prevCard}
          >
            ←
          </button>
          
          <div className="deck-dots">
            {cards.map((_, i) => (
              <div
                key={i}
                className={`deck-dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
          
          <button 
            className="nav-btn next"
            onClick={nextCard}
          >
            →
          </button>
        </div>
      )}

      {/* Card Stack */}
      <div className="deck-container">
        {visibleCards.map((card, index) => {
          const isTop = index === 0;
          const zIndex = maxVisible - index;
          const scale = isSingleCardView ? 1 : 1 - (index * 0.05);
          const yOffset = isSingleCardView ? 0 : index * 8;
          const rotation = isSingleCardView ? 0 : (index - 1) * 2;

          return (
            <SwipeableCard
              key={card.id}
              className={`deck-card ${isTop ? 'top-card' : 'stacked-card'} ${animatingDirection ? `animating-${animatingDirection}` : ''} ${isTop && newCardDirection ? `slide-in-${newCardDirection}` : ''}`}
              style={{
                zIndex,
                transform: `translateY(${yOffset}px) scale(${scale}) rotate(${rotation}deg)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
              onSwipeLeft={isTop && cards.length > 1 ? prevCard : card.onSwipeLeft}
              onSwipeRight={isTop && cards.length > 1 ? nextCard : card.onSwipeRight}
              onSwipeUp={card.onSwipeUp}
              onSwipeDown={card.onSwipeDown}
              leftAction={cards.length > 1 ? 'Previous' : card.leftAction}
              rightAction={cards.length > 1 ? 'Next' : card.rightAction}
              upAction={card.upAction}
              downAction={card.downAction}
              disabled={!isTop}
            >
              {card.content}
            </SwipeableCard>
          );
        })}
      </div>

      {/* Card Counter */}
      {cards.length > 1 && (
        <div className="deck-counter">
          <span className="current-card">{currentIndex + 1}</span>
          <span className="separator"> / </span>
          <span className="total-cards">{cards.length}</span>
        </div>
      )}
    </div>
  );
} 