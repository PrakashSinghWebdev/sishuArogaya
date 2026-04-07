import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Application render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#f8fafc',
            fontFamily: "'Segoe UI', sans-serif",
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 760,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
              padding: 24,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Something went wrong while rendering the app
            </div>
            <div style={{ color: '#475569', marginBottom: 16 }}>
              Refresh after the next fix, or share this message if it stays visible.
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#0f172a',
                color: '#e2e8f0',
                borderRadius: 12,
                padding: 16,
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {this.state.error?.stack || this.state.error?.message || 'Unknown render error'}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
