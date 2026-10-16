import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import { normalizeToolError, ToolError } from "../lib/toolStateMachine";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  toolError: ToolError | null;
}

export class ToolErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    toolError: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      toolError: normalizeToolError(error),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ToolErrorBoundary] Uncaught tool error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, toolError: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { toolError } = this.state;

      return (
        <div className="w-full max-w-xl mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-white shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertOctagon className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {toolError?.code === "OUT_OF_MEMORY"
                ? "Memory Limit Exceeded"
                : "Tool Execution Interrupted"}
            </h3>
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              {toolError?.message || "An unexpected error occurred while processing your document."}
            </p>
          </div>

          {toolError?.recoveryHint && (
            <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300 text-left">
              <span className="font-semibold text-amber-400">Recovery Solution: </span>
              {toolError.recoveryHint}
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all shadow-md active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Reset & Try Again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
