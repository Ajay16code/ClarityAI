import React from 'react';
import ReactDOM from 'react-dom/client';

interface RootErrorBoundaryState {
  error: Error | null;
}

class RootErrorBoundary extends React.Component<React.PropsWithChildren, RootErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Root render error:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#111827',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: '24px',
        }}>
          <div style={{ maxWidth: '780px', width: '100%', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '20px' }}>Runtime Error</h1>
            <p style={{ marginTop: '10px', color: '#374151' }}>The app crashed while rendering. Open browser console (F12) for details.</p>
            <pre style={{ marginTop: '12px', background: '#f3f4f6', borderRadius: '8px', padding: '12px', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const renderFatalError = (title: string, detail: string) => {
  root.render(
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      color: '#111827',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '780px', width: '100%', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{title}</h1>
        <p style={{ marginTop: '10px', color: '#374151' }}>Open browser console (F12) for more details.</p>
        <pre style={{ marginTop: '12px', background: '#f3f4f6', borderRadius: '8px', padding: '12px', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
          {detail}
        </pre>
      </div>
    </div>
  );
};

window.addEventListener('error', (event) => {
  console.error('Global window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

import('./App')
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch((error: any) => {
    console.error('Failed to load App module:', error);
    renderFatalError('Startup Error', error?.message || String(error));
  });