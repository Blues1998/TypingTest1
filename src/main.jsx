import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: '#888', gap: '12px' }}>
          <div style={{ color: '#e74c3c', fontSize: '14px', fontWeight: 600 }}>something went wrong</div>
          <div style={{ fontSize: '12px', maxWidth: '480px', textAlign: 'center', color: '#666' }}>
            {this.state.error?.message || 'unknown error'}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            style={{ marginTop: '8px', padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#e2b714', color: '#1a1a1a', fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
