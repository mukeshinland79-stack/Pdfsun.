import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message || 'Unknown error'}\n\nStack:\n${this.state.error?.stack || 'N/A'}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || 'N/A'}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {});
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-amber-50/40 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
          <div className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Application Exception Encountered
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  An unhandled runtime error occurred in the workspace.
                </p>
              </div>
            </div>

            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-mono break-words leading-relaxed">
              {this.state.error?.message || 'An unexpected runtime error occurred.'}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                <RefreshCw className="w-4 h-4" />
                Try Recovering Workspace
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs sm:text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleCopyError}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-medium text-xs sm:text-sm transition-colors ml-auto"
                title="Copy error details to clipboard"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Error</span>
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 underline underline-offset-2"
              >
                {this.state.showDetails ? 'Hide technical details' : 'Show technical details'}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-zinc-900 text-zinc-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 space-y-2">
                  <div>
                    <span className="text-amber-400 font-bold">Stack Trace:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-[11px] text-zinc-400">
                      {this.state.error?.stack || 'No stack trace available'}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div className="pt-2 border-t border-zinc-800">
                      <span className="text-amber-400 font-bold">Component Tree:</span>
                      <pre className="mt-1 whitespace-pre-wrap text-[11px] text-zinc-400">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
