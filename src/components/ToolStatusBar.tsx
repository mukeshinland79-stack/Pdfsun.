import React from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Download, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { ToolExecutionSnapshot } from "../lib/toolStateMachine";
import { formatMemoryBytes } from "../utils/memoryGuard";

interface ToolStatusBarProps {
  snapshot: ToolExecutionSnapshot;
  onDownload?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const ToolStatusBar: React.FC<ToolStatusBarProps> = ({
  snapshot,
  onDownload,
  onRetry,
  onCancel,
}) => {
  const { state, progressPercent, statusMessage, error, outputFileName, outputSizeBytes } = snapshot;

  if (state === "idle") return null;

  const isProcessing = state === "processing" || state === "validating" || state === "pre_flight_check";
  const isReady = state === "download_ready" || state === "downloaded";
  const isFailed = state === "failed";

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Tool execution status"
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
        isFailed
          ? "bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-900 dark:text-rose-100"
          : isReady
          ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-50"
          : "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-neutral-800 dark:text-neutral-100"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left Side: Status Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isFailed
                ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
                : isReady
                ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isReady ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base truncate">
                {isProcessing
                  ? statusMessage || "Processing in browser..."
                  : isReady
                  ? state === "downloaded"
                    ? "Downloaded Successfully ✓"
                    : "Ready for Download"
                  : error?.message || "Operation failed"}
              </span>

              {isProcessing && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/70 dark:bg-neutral-800/80 border border-current/10 font-bold">
                  {Math.round(progressPercent)}%
                </span>
              )}
            </div>

            {/* Error recovery hint */}
            {isFailed && error?.recoveryHint && (
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                💡 <span className="font-medium">{error.recoveryHint}</span>
              </p>
            )}

            {/* Ready details */}
            {isReady && outputFileName && (
              <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <span className="font-mono truncate max-w-[220px]">{outputFileName}</span>
                {outputSizeBytes && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-900/50 font-mono text-[10px]">
                    {formatMemoryBytes(outputSizeBytes)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% In-Browser
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isProcessing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
          )}

          {isFailed && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Safe Mode
            </button>
          )}

          {isReady && onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download Document
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (during processing) */}
      {isProcessing && (
        <div className="mt-3.5 w-full bg-neutral-200/80 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
