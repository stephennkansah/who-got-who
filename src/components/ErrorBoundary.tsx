import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI with escape route
      return (
        <div style={{ 
          padding: '2rem',
          maxWidth: '800px', 
          margin: '0 auto',
          minHeight: '100vh',
          background: '#12100c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#efe5c6',
            borderRadius: '8px',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 6px 0 rgba(0, 0, 0, 0.5)'
          }}>
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#232014',
              marginBottom: '1rem'
            }}>
              Oops! Something went wrong
            </h2>
            <p style={{
              color: '#4c4636',
              fontSize: '1rem',
              marginBottom: '2rem',
              lineHeight: '1.5'
            }}>
              The app encountered an unexpected error. Don't worry - you can get back to the home screen and try again.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  // Clear the error and try again
                  this.setState({ hasError: false, error: undefined });
                }}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  // Navigate to home and clear error
                  window.location.href = '/';
                }}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Back to Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '2rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
                  Error Details (Development)
                </summary>
                <pre style={{
                  fontSize: '0.86rem',
                  color: '#ef4444',
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 