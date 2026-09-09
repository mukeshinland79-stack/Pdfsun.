/**
 * Standardized WebAssembly & Worker Progress Card Component
 * 
 * Displays real-time WebAssembly pipeline progression, throughput (MB/s), ETA,
 * memory consumption, worker threading status, and responsive cancellation for all PDF tools.
 */

import React from "react";
import {
  Cpu,
  Zap,
  Clock,
  Hourglass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  StopCircle,
  FileCheck,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  StandardizedProgressState,
  WasmOperationPhase,
  formatBytes,
  formatSeconds,
  formatEta,
} from "../utils/wasmProgressSystem";

interface WasmToolProgressCardProps {
  progressState: StandardizedProgressState;
  onCancel?: () => void;
  className?: string;
}

const PIPELINE_PHASES: { id: WasmOperationPhase; label: string; short: string }[] = [
  { id: "ingestion", label: "Stream Ingestion", short: "Ingest" },
  { id: "allocation", label: "Worker Allocation", short: "Alloc" },
  { id: "transformation", label: "Page Processing", short: "Process" },
  { id: "compression", label: "Stream Deflating", short: "Compress" },
  { id: "finalizing", label: "Packaging Output", short: "Finalize" },
];

export const WasmToolProgressCard: React.FC<WasmToolProgressCardProps> = ({
  progressState,
  onCancel,
  className = "",
}) => {
  if (!progressState.isProcessing && progressState.phase === "idle") {
    return null;
  }

  const {
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
    totalBytes,
    processedBytes,
    toolName,
  } = progressState;

  const currentPhaseIndex = PIPELINE_PHASES.findIndex((p) => p.id === phase);
  const isFailed = phase === "error";
  const isCancelled = phase === "cancelled";
  const isComplete = phase === "completed";

  return (
    <div
      id="wasm-tool-progress-card"
      className={`w-full rounded-2xl border transition-all duration-300 overflow-hidden ${
        isFailed
          ? "bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
          : isCancelled
          ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60"
          : isComplete
          ? "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
          : "bg-white/95 dark:bg-slate-900/95 border-amber-200/80 dark:border-amber-700/50 shadow-xl shadow-orange-500/5 backdrop-blur-md"
      } ${className}`}
    >
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isFailed ? (
                <XCircle className="w-4 h-4" />
              ) : isCancelled ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Cpu className="w-4 h-4 animate-pulse" />
              )}
            </div>
            {progressState.isProcessing && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                {toolName || "PDF Operation"} • WebAssembly Worker Pipeline
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60">
                {phaseLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
              {stageTitle}
            </p>
          </div>
        </div>

        {/* Top-Right Progress Badge & Abort Button */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-lg font-black tracking-tight text-orange-600 dark:text-orange-400 font-mono">
              {percent}%
            </span>
          </div>

          {progressState.isProcessing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 transition flex items-center space-x-1.5"
              title="Terminate worker task and abort processing"
            >
              <StopCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Stepper Breadcrumbs */}
      <div className="px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {PIPELINE_PHASES.map((p, idx) => {
            const isPhaseActive = p.id === phase;
            const isPhaseDone = currentPhaseIndex > idx || isComplete;
            return (
              <div key={p.id} className="flex items-center space-x-1.5">
                <div
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold transition-all ${
                    isPhaseDone
                      ? "bg-emerald-500 text-white"
                      : isPhaseActive
                      ? "bg-orange-500 text-white ring-2 ring-orange-400/40 animate-pulse"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {isPhaseDone ? "✓" : idx + 1}
                </div>
                <span
                  className={`hidden sm:inline transition-colors ${
                    isPhaseActive
                      ? "text-orange-600 dark:text-orange-400 font-bold"
                      : isPhaseDone
                      ? "text-slate-700 dark:text-slate-300 font-medium"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {p.label}
                </span>
                <span
                  className={`sm:hidden transition-colors ${
                    isPhaseActive
                      ? "text-orange-600 dark:text-orange-400 font-bold"
                      : isPhaseDone
                      ? "text-slate-700 dark:text-slate-300 font-medium"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {p.short}
                </span>
                {idx < PIPELINE_PHASES.length - 1 && (
                  <span className="text-slate-300 dark:text-slate-700 mx-0.5 sm:mx-1">
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar Body */}
      <div className="p-5 space-y-4">
        {/* Animated Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isFailed
                  ? "bg-rose-500"
                  : isCancelled
                  ? "bg-amber-500"
                  : isComplete
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 relative"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            >
              {progressState.isProcessing && (
                <div className="absolute inset-0 bg-white/20 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold truncate max-w-sm">
              {stageMessage || "Processing document streams in WebAssembly worker..."}
            </span>
            {totalBytes > 0 && (
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                {formatBytes(processedBytes)} / {formatBytes(totalBytes)}
              </span>
            )}
          </div>
        </div>

        {/* Real-Time Performance & Telemetry Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* 2-second Heartbeat Health */}
          <div className="px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Heartbeat</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono truncate">
                {progressState.heartbeat?.status === "reloaded"
                  ? `Reloaded #${progressState.heartbeat.reloadCount}`
                  : progressState.heartbeat?.status === "delayed"
                  ? "Lagging"
                  : progressState.heartbeat?.latencyMs !== null
                  ? `${progressState.heartbeat.latencyMs}ms (2s)`
                  : "Active (2s)"}
              </div>
            </div>
          </div>

          {/* Throughput */}
          <div className="px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Speed</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono truncate">
                {throughputMbPerSec ? `${throughputMbPerSec} MB/s` : "Streaming..."}
              </div>
            </div>
          </div>

          {/* Elapsed Time */}
          <div className="px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Elapsed</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono truncate">
                {formatSeconds(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Dynamic ETA */}
          <div className="px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center space-x-2">
            <Hourglass className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estimated ETA</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono truncate">
                {formatEta(estimatedRemainingSeconds)}
              </div>
            </div>
          </div>

          {/* WASM Memory & Thread */}
          <div className="px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">WASM Memory</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono truncate">
                {wasmMb > 0 ? `${wasmMb} MB` : "Off-Thread"}
              </div>
            </div>
          </div>
        </div>

        {/* Large File & Worker Thread Notice */}
        {isLargeFile && (
          <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Large File Mode Active:</strong> Operating off-main-thread via {workerId || "WebAssembly Worker"}. UI remains 100% responsive at 60 FPS without memory freezing.
            </span>
          </div>
        )}

        {/* Footer Detail */}
        {detailMessage && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span className="truncate">{detailMessage}</span>
            <span className="font-mono shrink-0 ml-2">Dedicated Worker Thread</span>
          </div>
        )}
      </div>
    </div>
  );
};
