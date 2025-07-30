import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// Helper component that throws when rendered
const ProblemChild: React.FC = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('renders fallback UI when child component throws', () => {
    render(
      <ErrorBoundary>
        {/* This component will throw immediately */}
        <ProblemChild />
      </ErrorBoundary>
    );

    // Fallback headline should be visible
    expect(
      screen.getByText(/oops! something went wrong/i)
    ).toBeInTheDocument();

    // Buttons for recovery should also be present
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument();
  });
});
