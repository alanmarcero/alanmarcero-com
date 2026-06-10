import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--ink, #e8edee)',
        }}>
          <p style={{
            fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            fontSize: 'var(--text-xs, 0.72rem)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--amber, #ffb454)',
            marginBottom: '0.75rem',
          }}>
            Signal lost
          </p>
          <h1 style={{
            fontFamily: "var(--font-display, 'Archivo', sans-serif)",
            fontSize: '2rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: 'var(--phosphor, #4af2a4)',
            marginBottom: '1rem',
          }}>
            Something went wrong
          </h1>
          <p style={{
            color: 'var(--ink-muted, #99a6ab)',
            marginBottom: '2rem',
            maxWidth: '400px',
          }}>
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          <button
            className="btn"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
