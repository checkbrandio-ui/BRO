import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#05070A', color: '#ff6b6b', padding: '40px', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h1 style={{ color: '#ff6b6b' }}>❌ Runtime Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ffa0a0' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888', fontSize: '12px' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
