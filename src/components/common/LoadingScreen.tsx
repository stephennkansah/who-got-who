import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandMark from './BrandMark';

interface LoadingScreenProps {
  message: string;
  /** Offer a way out when loading may never finish. */
  showBack?: boolean;
}

/** Full-screen typewriter spinner used while a game is loading. */
export default function LoadingScreen({ message, showBack = false }: LoadingScreenProps) {
  const navigate = useNavigate();
  return (
    <div className="container flex-center">
      <div className="text-center">
        <BrandMark size={96} alt="Who Got Who" className="brand-mark-centered" />
        <div className="spinner" aria-hidden="true" />
        <p className="type" style={{ fontSize: '0.9rem', marginBottom: showBack ? '1.25rem' : 0 }}>
          {message}
        </p>
        {showBack && (
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            Back to home
          </button>
        )}
      </div>
    </div>
  );
}
