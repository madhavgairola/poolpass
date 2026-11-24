import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090a0d] text-white flex items-center justify-center p-6 font-mono">
          <div className="max-w-lg w-full bg-[#12141a] border border-red-500/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Application Render Error
            </div>
            <p className="text-xs text-slate-300 font-sans">
              An error occurred while rendering the interface:
            </p>
            <pre className="bg-[#0b0c10] border border-[#1f2430] p-3 rounded text-[11px] text-red-300 overflow-x-auto whitespace-pre-wrap">
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2 bg-[#00e599] text-[#090a0d] font-bold text-xs rounded hover:bg-[#00c985] transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
