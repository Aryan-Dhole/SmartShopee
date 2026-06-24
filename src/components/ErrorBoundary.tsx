import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PriceWise ErrorBoundary]', error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <div className="max-w-md w-full text-center space-y-5 border border-white/10 bg-white/[0.02] rounded-3xl p-10 backdrop-blur-md">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Something went wrong</h3>
              <p className="text-xs text-white/45 mt-2 leading-relaxed">
                {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
