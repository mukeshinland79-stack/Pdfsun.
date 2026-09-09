/**
 * Custom React Hook: useWasmWorkerProgress
 * 
 * Standardizes progress tracking across all PDF tools in ActiveToolWorkspace:
 * 1. Directly subscribes to WebAssembly worker messages and the Worker Pool event bus.
 * 2. Unifies chunked ingestion, WebAssembly memory allocation, page transformations, and stream packing.
 * 3. Provides live metrics: throughput (MB/s), dynamic ETA, current page / total pages, V8/WASM memory footprint.
 * 4. Drives the global workspace progress bar UI and tool execution controls.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  wasmProgressSystem,
  StandardizedProgressState,
  WasmOperationPhase,
  WasmHeartbeatState,
  INITIAL_PROGRESS_STATE,
  formatBytes,
  formatSeconds,
  formatEta,
} from "../utils/wasmProgressSystem";
import { pdfWorkerPool, PoolTaskProgress, WorkerHeartbeatInfo } from "../utils/pdfWorkerPool";

export interface UseWasmWorkerProgressOptions {
  toolName?: string;
  onProgressUpdate?: (state: StandardizedProgressState) => void;
  onHeartbeat?: (heartbeat: WorkerHeartbeatInfo) => void;
  onComplete?: (finalMessage: string) => void;
  onError?: (errorMessage: string) => void;
  onCancel?: () => void;
}

export interface WasmWorkerProgressHookResult {
  // Reactive State
  progressState: StandardizedProgressState;
  percent: number;
  isProcessing: boolean;
  phase: WasmOperationPhase;
  phaseLabel: string;
  stageTitle: string;
  stageMessage: string;
  detailMessage: string;
  currentPage: number | null;
  totalPages: number | null;
  processedBytes: number;
  totalBytes: number;
  throughputMbPerSec: number | null;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number | null;
  workerId: string;
  workerActive: boolean;
  wasmMb: number;
  isLargeFile: boolean;
  formattedElapsed: string;
  formattedEta: string;
  formattedBytesProcessed: string;
  formattedTotalBytes: string;

  // WebAssembly Worker Heartbeat Telemetry
  heartbeat: WasmHeartbeatState;
  heartbeatStatus: "healthy" | "delayed" | "unresponsive" | "reloaded" | "idle";
  heartbeatLatencyMs: number | null;
  workerReloadCount: number;
  isWorkerHealthy: boolean;

  // Actions
  startProgress: (params: {
    toolName: string;
    totalBytes: number;
    fileCount: number;
    isLargeFile?: boolean;
    activeTaskId?: string;
  }) => void;
  updateChunkProgress: (
    fileIndex: number,
    totalFiles: number,
    fileLoaded: number,
    fileTotal: number,
    filePercent: number,
    totalLoadedBytes?: number
  ) => void;
  bindWorkerProgress: (
    progress: number | PoolTaskProgress,
    overridePhase?: WasmOperationPhase
  ) => void;
  createProgressHandler: (
    stageTitle: string,
    phase?: WasmOperationPhase
  ) => (p: number | PoolTaskProgress, customMessage?: string) => void;
  completeProgress: (message?: string) => void;
  cancelProgress: () => void;
  errorProgress: (message: string) => void;
  resetProgress: () => void;
}

export function useWasmWorkerProgress(
  options: UseWasmWorkerProgressOptions = {}
): WasmWorkerProgressHookResult {
  const [state, setState] = useState<StandardizedProgressState>(() =>
    wasmProgressSystem.getState()
  );

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // 1. Subscribe to the Centralized WebAssembly Progress System
  useEffect(() => {
    const unsubscribeSystem = wasmProgressSystem.subscribe((nextState) => {
      setState(nextState);
      if (optionsRef.current.onProgressUpdate) {
        optionsRef.current.onProgressUpdate(nextState);
      }
      if (nextState.phase === "completed" && optionsRef.current.onComplete) {
        optionsRef.current.onComplete(nextState.stageMessage);
      } else if (nextState.phase === "error" && optionsRef.current.onError) {
        optionsRef.current.onError(nextState.stageMessage);
      } else if (nextState.phase === "cancelled" && optionsRef.current.onCancel) {
        optionsRef.current.onCancel();
      }
    });

    // 2. Subscribe directly to the Web Worker Pool output stream
    const unsubscribeWorkerPool = pdfWorkerPool.onProgress((workerData: PoolTaskProgress) => {
      const current = wasmProgressSystem.getState();
      if (current.isProcessing) {
        wasmProgressSystem.bindWorkerProgress(workerData);
      }
    });

    // 3. Subscribe directly to the 2-second Web Worker Heartbeat channel
    const unsubscribeHeartbeat = pdfWorkerPool.onHeartbeat((info: WorkerHeartbeatInfo) => {
      wasmProgressSystem.updateHeartbeat({
        status: info.status,
        lastHeartbeatTime: info.timestamp,
        latencyMs: info.latencyMs,
        reloadCount: info.reloadCount,
      });

      if (optionsRef.current.onHeartbeat) {
        optionsRef.current.onHeartbeat(info);
      }

      // If worker was force-reloaded, update UI state with diagnostic alert
      if (info.status === "reloaded") {
        wasmProgressSystem.error(
          `WASM execution heartbeat timed out. Worker was force-reloaded (Reset #${info.reloadCount}) to preserve stability.`
        );
      }
    });

    return () => {
      unsubscribeSystem();
      unsubscribeWorkerPool();
      unsubscribeHeartbeat();
    };
  }, []);

  const startProgress = useCallback(
    (params: {
      toolName: string;
      totalBytes: number;
      fileCount: number;
      isLargeFile?: boolean;
      activeTaskId?: string;
    }) => {
      wasmProgressSystem.start(params);
    },
    []
  );

  const updateChunkProgress = useCallback(
    (
      fileIndex: number,
      totalFiles: number,
      fileLoaded: number,
      fileTotal: number,
      filePercent: number,
      totalLoadedBytes?: number
    ) => {
      wasmProgressSystem.updateChunkProgress(
        fileIndex,
        totalFiles,
        fileLoaded,
        fileTotal,
        filePercent,
        totalLoadedBytes
      );
    },
    []
  );

  const bindWorkerProgress = useCallback(
    (
      progress: number | PoolTaskProgress,
      overridePhase?: WasmOperationPhase
    ) => {
      wasmProgressSystem.bindWorkerProgress(progress, overridePhase);
    },
    []
  );

  const createProgressHandler = useCallback(
    (stageTitle: string, phase: WasmOperationPhase = "transformation") => {
      return wasmProgressSystem.createProgressHandler(stageTitle, phase);
    },
    []
  );

  const completeProgress = useCallback((message?: string) => {
    wasmProgressSystem.complete(message);
  }, []);

  const cancelProgress = useCallback(() => {
    wasmProgressSystem.cancel();
  }, []);

  const errorProgress = useCallback((message: string) => {
    wasmProgressSystem.error(message);
  }, []);

  const resetProgress = useCallback(() => {
    wasmProgressSystem.cancel();
  }, []);

  return {
    progressState: state,
    percent: state.percent,
    isProcessing: state.isProcessing,
    phase: state.phase,
    phaseLabel: state.phaseLabel,
    stageTitle: state.stageTitle,
    stageMessage: state.stageMessage,
    detailMessage: state.detailMessage,
    currentPage: state.currentPage ?? null,
    totalPages: state.totalPages ?? null,
    processedBytes: state.processedBytes,
    totalBytes: state.totalBytes,
    throughputMbPerSec: state.throughputMbPerSec,
    elapsedSeconds: state.elapsedSeconds,
    estimatedRemainingSeconds: state.estimatedRemainingSeconds,
    workerId: state.workerId,
    workerActive: state.workerActive,
    wasmMb: state.wasmMb,
    isLargeFile: state.isLargeFile,
    formattedElapsed: formatSeconds(state.elapsedSeconds),
    formattedEta: formatEta(state.estimatedRemainingSeconds),
    formattedBytesProcessed: formatBytes(state.processedBytes),
    formattedTotalBytes: formatBytes(state.totalBytes),

    // WebAssembly Worker Heartbeat Telemetry
    heartbeat: state.heartbeat,
    heartbeatStatus: state.heartbeat?.status || "idle",
    heartbeatLatencyMs: state.heartbeat?.latencyMs ?? null,
    workerReloadCount: state.heartbeat?.reloadCount ?? 0,
    isWorkerHealthy:
      state.heartbeat?.status === "healthy" ||
      state.heartbeat?.status === "idle" ||
      !state.heartbeat,

    startProgress,
    updateChunkProgress,
    bindWorkerProgress,
    createProgressHandler,
    completeProgress,
    cancelProgress,
    errorProgress,
    resetProgress,
  };
}
