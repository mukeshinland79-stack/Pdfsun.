import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check, Trash2, Bug, FileText } from 'lucide-react';
import { logError } from '../services/errorReporter';
import {
  captureWasmCrashSnapshot,
  getLastPersistedCrashSnapshot,
  WasmCrashSnapshot,
} from '../utils/wasmPdfLifecycle';

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
  clearedStorage: boolean;
  postMortemSnapshot: WasmCrashSnapshot | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
    clearedStorage: false,
    postMortemSnapshot: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Unhandled runtime exception caught by ErrorBoundary:`, error);
    if (errorInfo?.componentStack) {
      console.error('Component Stack:', errorInfo.componentStack);
    }

    // Capture WASM / Tool State crash snapshot for post-mortem debugging
    let snapshot: WasmCrashSnapshot | null = null;
    try {
      snapshot = captureWasmCrashSnapshot(error, "react_error_boundary_unhandled", {
        componentStack: errorInfo?.componentStack,
      });
    } catch {
      snapshot = getLastPersistedCrashSnapshot();
    }
    
    // Log exception to telemetry monitoring queue
    logError(error, "fatal", {
      componentStack: errorInfo?.componentStack,
      location: "ErrorBoundary",
    });

    console.error('Error Details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    });

    this.setState({ errorInfo, postMortemSnapshot: snapshot });

    // Dispatch event for telemetry or global error listeners if registered
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-runtime-error', {
          detail: { error, errorInfo, timestamp },
        })
      );
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
      clearedStorage: false,
    });
  };

  private handleClearStorageAndReload = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
      this.setState({ clearedStorage: true });
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (e) {
      console.error('Failed to clear storage:', e);
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const errorText = `[Error Report - ${new Date().toISOString()}]\nMessage: ${this.state.error?.message || 'Unknown error'}\nName: ${this.state.error?.name || 'Error'}\n\nStack:\n${this.state.error?.stack || 'N/A'}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || 'N/A'}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {});
  };

  private getDiagnosticHint = (): string | null => {
    const msg = (this.state.error?.message || '').toLowerCase();
    if (msg.includes('usecontext') || msg.includes('usestate') || msg.includes('null')) {
      return 'Diagnostic Tip: This issue may be caused by a component rendering outside its required Provider context or a stale cached state. Trying "Clear Storage & Reload" will reset application preferences safely.';
    }
    if (msg.includes('localstorage') || msg.includes('quota') || msg.includes('storage')) {
      return 'Diagnostic Tip: Browser storage quota or permission issue detected. Clearing local cache may resolve this.';
    }
    if (msg.includes('failed to fetch') || msg.includes('network')) {
      return 'Diagnostic Tip: Network connectivity problem detected. Check your connection and try reloading.';
    }
    return null;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const diagnosticHint = this.getDiagnosticHint();

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

            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-mono break-words leading-relaxed space-y-2">
              <div>
                {typeof this.state.error?.message === 'string' && this.state.error.message !== '[object Object]'
                  ? this.state.error.message
                  : typeof this.state.error === 'object' && this.state.error !== null
                  ? (this.state.error as any).message || JSON.stringify(this.state.error)
                  : String(this.state.error || 'An unexpected runtime error occurred.')}
              </div>
              {diagnosticHint && (
                <div className="text-xs text-amber-800 dark:text-amber-300 font-sans pt-2 border-t border-amber-200/60 dark:border-amber-900/50 flex items-start gap-2">
                  <Bug className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <span>{diagnosticHint}</span>
                </div>
              )}
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
                onClick={this.handleClearStorageAndReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 font-medium text-xs sm:text-sm transition-colors"
                title="Reset stored settings and reload"
              >
                <Trash2 className="w-4 h-4" />
                {this.state.clearedStorage ? 'Clearing...' : 'Clear Storage & Reload'}
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
                <div className="mt-3 space-y-3">
                  {/* Post-Mortem Snapshot Section */}
                  {this.state.postMortemSnapshot && (
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono space-y-2 text-zinc-300">
                      <div className="flex items-center justify-between text-amber-400 font-bold border-b border-zinc-800 pb-1.5 font-sans">
                        <span className="flex items-center gap-1.5">
                          <Bug className="w-3.5 h-3.5 text-amber-500" />
                          Post-Mortem Snapshot (Persisted in LocalStorage)
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {this.state.postMortemSnapshot.timestamp}
                        </span>
                      </div>

                      {this.state.postMortemSnapshot.toolState && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="bg-zinc-900/90 p-2 rounded border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase font-sans font-bold">Active PDF Tool</span>
                            <span className="text-amber-300 font-bold">{this.state.postMortemSnapshot.toolState.toolName} ({this.state.postMortemSnapshot.toolState.toolId})</span>
                          </div>
                          <div className="bg-zinc-900/90 p-2 rounded border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase font-sans font-bold">Files in Workspace</span>
                            <span className="text-emerald-400 font-bold">
                              {this.state.postMortemSnapshot.toolState.fileCount} file(s) — Total: {this.state.postMortemSnapshot.toolState.totalSizeFormatted}
                            </span>
                          </div>
                        </div>
                      )}

                      {this.state.postMortemSnapshot.toolState?.files && this.state.postMortemSnapshot.toolState.files.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-zinc-500 text-[10px] uppercase font-sans font-bold block">File Sizes & Metadata</span>
                          <div className="max-h-24 overflow-y-auto space-y-1 bg-zinc-900 p-2 rounded border border-zinc-800 text-[11px]">
                            {this.state.postMortemSnapshot.toolState.files.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between text-zinc-300">
                                <span className="truncate pr-2">{idx + 1}. {file.name}</span>
                                <span className="text-amber-400 font-bold shrink-0">{file.sizeFormatted}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {this.state.postMortemSnapshot.memory && (
                        <div className="text-[11px] text-cyan-400/90 bg-zinc-900/80 p-2 rounded border border-zinc-800">
                          Heap: {this.state.postMortemSnapshot.memory.usedHeapMb ?? "N/A"} MB / {this.state.postMortemSnapshot.memory.totalHeapMb ?? "N/A"} MB | WASM: {this.state.postMortemSnapshot.memory.wasmMb ?? 0} MB
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-zinc-900 text-zinc-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 space-y-2">
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

