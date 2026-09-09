/**
 * GlobalWorkspaceProgressBar
 * 
 * Standardized global progress bar UI embedded directly into the ActiveToolWorkspace header.
 * Displays real-time WebAssembly worker progress, phase progression, dynamic ETA,
 * memory usage, throughput, and responsive abort controls.
 */

import React from "react";
import {
  Cpu,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  StopCircle,
  Layers,
  ArrowRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  WasmOperationPhase,
  StandardizedProgressState,
} from "../utils/wasmProgressSystem";

interface GlobalWorkspaceProgressBarProps {
  progressState: StandardizedProgressState;
  onCancel?: () => void;
  className?: string;
}

const PHASE_COLORS: Record<
  WasmOperationPhase,
  { bg: string; text: string; border: string; barGradient: string }
> = {
  idle: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
    barGradient: "from-slate-400 to-slate-500",
  },
  ingestion: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    barGradient: "from-blue-500 via-indigo-500 to-cyan-400",
  },
  allocation: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    barGradient: "from-purple-500 via-pink-500 to-rose-400",
  },
  transformation: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    barGradient: "from-amber-500 via-orange-500 to-amber-400",
  },
  compression: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800",
    barGradient: "from-teal-500 via-emerald-500 to-cyan-400",
  },
  rendering: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
    barGradient: "from-cyan-500 via-sky-500 to-blue-500",
  },
  analysis: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
    barGradient: "from-violet-500 via-purple-500 to-indigo-500",
  },
  finalizing: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    barGradient: "from-emerald-500 via-teal-500 to-green-400",
  },
  completed: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    barGradient: "from-emerald-500 to-green-500",
  },
  cancelled: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    barGradient: "from-amber-500 to-amber-600",
  },
  error: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    barGradient: "from-rose-500 to-red-600",
  },
};

export const GlobalWorkspaceProgressBar: React.FC<GlobalWorkspaceProgressBarProps> = ({
  progressState,
  onCancel,
  className = "",
}) => {
  const {
    isProcessing,
    percent,
    phase,
    phaseLabel,
    stageTitle,
    stageMessage,
    detailMessage,
    throughputMbPerSec,
    elapsedSeconds,
    estimatedRemainingSeconds,
    workerId,
    wasmMb,
    isLargeFile,
    currentPage,
    totalPages,
  } = progressState;

  // Only render when processing, complete, cancelled, or error
  if (!isProcessing && phase === "idle") {
    return null;
  }

  const colors = PHASE_COLORS[phase] || PHASE_COLORS.transformation;
  const isComplete = phase === "completed";
  const isFailed = phase === "error";
  const isCancelled = phase === "cancelled";

  return (
    <div
      id="global-workspace-progress-bar"
      className={`relative w-full border-b transition-all duration-300 ${colors.bg} ${colors.border} ${className}`}
    >
      {/* Visual Progress Track Header Line */}
      <div className="relative w-full h-1.5 bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out bg-gradient-to-r ${colors.barGradient} relative`}
          style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
        >
          {isProcessing && (
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/40 blur-xs animate-pulse" />
          )}
        </div>
      </div>

      {/* Progress Information Strip */}
      <div className="px-5 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Left Side: Status & Stage Title */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          {/* Phase Badge */}
          <span
            className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] shrink-0 border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {phaseLabel}
          </span>

          {/* Stage Message & Dynamic Detail */}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center space-x-1.5">
              <span>{stageTitle || "Processing WebAssembly pipeline..."}</span>
              {currentPage && totalPages && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700/80 font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  Page {currentPage}/{totalPages}
                </span>
              )}
            </div>
            {stageMessage && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {stageMessage}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Metrics & Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* WebAssembly Worker Heartbeat Indicator */}
          {isProcessing && progressState.heartbeat && (
            <div className="hidden sm:flex items-center">
              {progressState.heartbeat.status === "reloaded" ? (
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-300 dark:border-rose-800 animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Worker Reloaded (#{progressState.heartbeat.reloadCount})</span>
                </span>
              ) : progressState.heartbeat.status === "delayed" || progressState.heartbeat.status === "unresponsive" ? (
                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-medium border border-amber-300 dark:border-amber-800">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                  <span>Heartbeat Delay</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800/80"
                  title="WASM binary execution health checked every 2 seconds"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>2s Heartbeat {progressState.heartbeat.latencyMs !== null ? `${progressState.heartbeat.latencyMs}ms` : "OK"}</span>
                </span>
              )}
            </div>
          )}

          {/* Throughput Metric */}
          {throughputMbPerSec !== null && throughputMbPerSec > 0 && isProcessing && (
            <div className="hidden sm:flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{throughputMbPerSec} MB/s</span>
            </div>
          )}

          {/* Dynamic ETA */}
          {estimatedRemainingSeconds !== null && isProcessing && (
            <div className="hidden md:flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>
                {estimatedRemainingSeconds <= 1
                  ? "< 1s"
                  : `~${estimatedRemainingSeconds}s`}
              </span>
            </div>
          )}

          {/* Worker / WASM Memory Badge */}
          {wasmMb > 0 && (
            <div className="hidden lg:flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-mono">
              <Cpu className="w-3 h-3 text-cyan-500" />
              <span>{wasmMb.toFixed(1)} MB</span>
            </div>
          )}

          {/* Percentage Indicator */}
          <div className="flex items-center space-x-1 font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
            <span>{Math.round(percent)}%</span>
          </div>

          {/* Abort/Cancel Button */}
          {isProcessing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 text-[11px] font-bold transition flex items-center space-x-1"
              title="Abort current WebAssembly task and release worker memory"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Abort</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
