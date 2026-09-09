/**
 * Standardized WebAssembly & Worker Progress Tracking System
 * 
 * Provides real-time telemetry, stage progression, throughput (MB/s), dynamic ETA,
 * memory metrics, and worker binding for all PDF tools and large file operations.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { PoolTaskProgress, pdfWorkerPool } from "./pdfWorkerPool";
import { wasmTracker } from "./wasmPerformanceTracker";

export type WasmOperationPhase =
  | "idle"
  | "ingestion"      // Chunked streaming, checksum validation, reading buffer
  | "allocation"     // WebAssembly linear memory allocation & worker initialization
  | "transformation" // Page iteration, stream manipulation, OCR, conversion
  | "compression"    // Stream deflating, object stream packing, serialization
  | "rendering"      // PDF canvas page rasterization & image rendering
  | "analysis"       // OCR, text extraction, structural diff, metadata parsing
  | "finalizing"     // Blob creation, memory verification, download preparation
  | "completed"
  | "cancelled"
  | "error";

export interface WasmHeartbeatState {
  status: "healthy" | "delayed" | "unresponsive" | "reloaded" | "idle";
  lastHeartbeatTime: number | null;
  latencyMs: number | null;
  reloadCount: number;
}

export interface StandardizedProgressState {
  isProcessing: boolean;
  percent: number;
  phase: WasmOperationPhase;
  phaseLabel: string;
  stageTitle: string;
  stageMessage: string;
  detailMessage: string;
  currentPage?: number | null;
  totalPages?: number | null;
  processedBytes: number;
  totalBytes: number;
  throughputMbPerSec: number | null;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number | null;
  workerId: string;
  workerActive: boolean;
  wasmMb: number;
  isLargeFile: boolean;
  fileCount: number;
  toolName: string;
  activeTaskId?: string | null;
  heartbeat: WasmHeartbeatState;
}

export const INITIAL_PROGRESS_STATE: StandardizedProgressState = {
  isProcessing: false,
  percent: 0,
  phase: "idle",
  phaseLabel: "Ready",
  stageTitle: "Idle",
  stageMessage: "",
  detailMessage: "",
  currentPage: null,
  totalPages: null,
  processedBytes: 0,
  totalBytes: 0,
  throughputMbPerSec: null,
  elapsedSeconds: 0,
  estimatedRemainingSeconds: null,
  workerId: "wasm-worker-main",
  workerActive: false,
  wasmMb: 0,
  isLargeFile: false,
  fileCount: 1,
  toolName: "",
  activeTaskId: null,
  heartbeat: {
    status: "idle",
    lastHeartbeatTime: null,
    latencyMs: null,
    reloadCount: 0,
  },
};

const PHASE_LABELS: Record<WasmOperationPhase, string> = {
  idle: "Ready",
  ingestion: "Stream Ingestion",
  allocation: "WASM Worker Init",
  transformation: "Processing",
  compression: "Compressing Streams",
  rendering: "Rendering Pages",
  analysis: "Document Analysis",
  finalizing: "Finalizing Output",
  completed: "Completed",
  cancelled: "Aborted",
  error: "Failed",
};

export class WasmProgressSystem {
  private state: StandardizedProgressState = { ...INITIAL_PROGRESS_STATE };
  private listeners: Set<(state: StandardizedProgressState) => void> = new Set();
  private startTime: number = 0;
  private timerInterval: any = null;
  private lastBytesTime: number = 0;
  private lastProcessedBytes: number = 0;

  constructor() {
    this.refreshMemoryUsage();
  }

  public getState(): StandardizedProgressState {
    return { ...this.state };
  }

  public subscribe(listener: (state: StandardizedProgressState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const copy = this.getState();
    this.listeners.forEach((l) => l(copy));
  }

  private refreshMemoryUsage(): void {
    try {
      const snap = wasmTracker.getLatestSnapshot();
      if (snap) {
        this.state.wasmMb = Math.round((snap.wasmMb + snap.usedHeapMb) * 10) / 10;
      }
    } catch {}
  }

  private startTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.startTime = performance.now();
    this.lastBytesTime = this.startTime;
    this.lastProcessedBytes = 0;

    this.timerInterval = setInterval(() => {
      if (!this.state.isProcessing) {
        clearInterval(this.timerInterval);
        return;
      }

      const elapsedMs = performance.now() - this.startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      this.state.elapsedSeconds = elapsedSec;

      // Calculate ETA based on current percentage
      if (this.state.percent > 4 && this.state.percent < 99) {
        const totalEstimatedMs = (elapsedMs / this.state.percent) * 100;
        const remainingMs = Math.max(0, totalEstimatedMs - elapsedMs);
        this.state.estimatedRemainingSeconds = Math.max(1, Math.round(remainingMs / 1000));
      } else if (this.state.percent >= 99) {
        this.state.estimatedRemainingSeconds = 0;
      }

      this.refreshMemoryUsage();
      this.notify();
    }, 500);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Start standardized progress tracking for a tool operation
   */
  public start(params: {
    toolName: string;
    totalBytes: number;
    fileCount: number;
    isLargeFile?: boolean;
    activeTaskId?: string;
  }): void {
    this.stopTimer();

    const isLarge = params.isLargeFile ?? (params.totalBytes > 25 * 1024 * 1024 || params.fileCount > 3);

    this.state = {
      ...INITIAL_PROGRESS_STATE,
      isProcessing: true,
      percent: 3,
      phase: "ingestion",
      phaseLabel: PHASE_LABELS.ingestion,
      toolName: params.toolName,
      totalBytes: params.totalBytes,
      fileCount: params.fileCount,
      isLargeFile: isLarge,
      stageTitle: "Initializing Stream Ingestion",
      stageMessage: `Preparing ${params.fileCount} ${params.fileCount === 1 ? "document" : "documents"} (${formatBytes(params.totalBytes)})...`,
      detailMessage: isLarge
        ? "Large File Stream Active: Chunked memory allocation & WebAssembly pipeline enabled."
        : "Validating file signature & initializing WebAssembly engine...",
      workerActive: true,
      workerId: "wasm-worker-main",
      activeTaskId: params.activeTaskId || null,
    };

    this.startTimer();
    this.notify();
  }

  /**
   * Update chunked file streaming ingestion progress (0-30% range)
   */
  public updateChunkProgress(
    fileIndex: number,
    totalFiles: number,
    fileLoaded: number,
    fileTotal: number,
    filePercent: number,
    totalLoadedBytes?: number
  ): void {
    if (!this.state.isProcessing) return;

    // Ingestion spans 3% to 35%
    const fileRatio = (fileIndex + filePercent / 100) / totalFiles;
    const mappedPercent = Math.min(35, Math.max(5, Math.round(5 + fileRatio * 30)));

    const now = performance.now();
    const currentBytes = totalLoadedBytes || (this.state.totalBytes * fileRatio);
    this.state.processedBytes = Math.min(this.state.totalBytes, currentBytes);

    // Calculate throughput MB/s
    const timeDelta = (now - this.startTime) / 1000;
    if (timeDelta > 0.5 && this.state.processedBytes > 0) {
      this.state.throughputMbPerSec =
        Math.round((this.state.processedBytes / (1024 * 1024) / timeDelta) * 10) / 10;
    }

    this.state.percent = Math.max(this.state.percent, mappedPercent);
    this.state.phase = "ingestion";
    this.state.phaseLabel = PHASE_LABELS.ingestion;
    this.state.stageTitle = `Streaming Document ${fileIndex + 1} of ${totalFiles}`;
    this.state.stageMessage = `Ingesting ${formatBytes(fileLoaded)} / ${formatBytes(fileTotal)} (${filePercent}%)`;
    this.state.detailMessage = `Off-Main-Thread chunk buffer • Ingestion stream ${Math.round(fileRatio * 100)}% complete`;

    this.notify();
  }

  /**
   * Bind directly to a WebAssembly worker progress message or number callback
   */
  public bindWorkerProgress(
    progress: number | PoolTaskProgress,
    overridePhase?: WasmOperationPhase
  ): void {
    if (!this.state.isProcessing) return;

    let workerPercent = 0;
    let stage = "";
    let detail = "";
    let curPage: number | undefined;
    let totPages: number | undefined;
    let workerId = this.state.workerId;
    let workerMemMb: number | undefined;

    if (typeof progress === "number") {
      workerPercent = progress;
    } else if (progress && typeof progress === "object") {
      workerPercent = progress.percent || 0;
      stage = progress.stage || "";
      detail = progress.detail || "";
      curPage = progress.currentPage;
      totPages = progress.totalPages;
      if (progress.workerId) workerId = progress.workerId;
      if (progress.memoryMb) workerMemMb = progress.memoryMb;
      if (progress.processedBytes && progress.processedBytes > this.state.processedBytes) {
        this.state.processedBytes = progress.processedBytes;
      }
    }

    // Map worker progress (0-100) into overall pipeline progress (35% - 92%)
    const mappedPercent = Math.min(96, Math.max(this.state.percent, Math.round(35 + (workerPercent / 100) * 58)));

    // Auto-detect phase from progress or explicit override
    let currentPhase: WasmOperationPhase = overridePhase || "transformation";
    if (!overridePhase) {
      if (workerPercent < 15) {
        currentPhase = "allocation";
      } else if (workerPercent >= 75 && workerPercent < 90) {
        currentPhase = "compression";
      } else if (workerPercent >= 90) {
        currentPhase = "finalizing";
      }
    }

    this.state.phase = currentPhase;
    this.state.phaseLabel = PHASE_LABELS[currentPhase];
    this.state.percent = mappedPercent;
    this.state.workerActive = true;
    this.state.workerId = workerId;

    if (workerMemMb) {
      this.state.wasmMb = workerMemMb;
    } else {
      this.refreshMemoryUsage();
    }

    if (stage) this.state.stageTitle = stage;
    if (detail) this.state.stageMessage = detail;
    if (curPage !== undefined) this.state.currentPage = curPage;
    if (totPages !== undefined) this.state.totalPages = totPages;

    // Estimate processed bytes if not explicitly provided
    if (this.state.totalBytes > 0 && this.state.processedBytes === 0) {
      this.state.processedBytes = Math.round((mappedPercent / 100) * this.state.totalBytes);
    }

    // Compute live throughput
    const elapsedSec = (performance.now() - this.startTime) / 1000;
    if (elapsedSec > 0.5 && this.state.processedBytes > 0) {
      this.state.throughputMbPerSec =
        Math.round((this.state.processedBytes / (1024 * 1024) / elapsedSec) * 10) / 10;
    }

    // Compose informative detail message
    const pageInfo =
      this.state.currentPage && this.state.totalPages
        ? `Page ${this.state.currentPage} of ${this.state.totalPages} • `
        : "";
    const speedInfo = this.state.throughputMbPerSec ? `${this.state.throughputMbPerSec} MB/s • ` : "";
    const memInfo = `WASM Heap: ${this.state.wasmMb.toFixed(1)} MB`;

    this.state.detailMessage = `${pageInfo}${speedInfo}${memInfo}`;

    this.notify();
  }

  /**
   * Create a standardized progress callback function for any tool or transformation
   */
  public createProgressHandler(
    stageTitle: string,
    phase: WasmOperationPhase = "transformation"
  ): (progress: number | PoolTaskProgress, customMessage?: string) => void {
    this.state.stageTitle = stageTitle;
    this.state.phase = phase;
    this.state.phaseLabel = PHASE_LABELS[phase];
    this.notify();

    return (p: number | PoolTaskProgress, customMessage?: string) => {
      if (customMessage) {
        this.state.stageMessage = customMessage;
      }
      this.bindWorkerProgress(p, phase);
    };
  }

  /**
   * Finalize operation successfully
   */
  public complete(finalMessage: string = "Transformation completed successfully"): void {
    this.stopTimer();
    this.state.isProcessing = false;
    this.state.percent = 100;
    this.state.phase = "completed";
    this.state.phaseLabel = PHASE_LABELS.completed;
    this.state.stageTitle = "Complete";
    this.state.stageMessage = finalMessage;
    this.state.detailMessage = `Finished in ${this.state.elapsedSeconds}s • Ready for download`;
    this.state.estimatedRemainingSeconds = 0;
    this.state.workerActive = false;
    this.notify();
  }

  /**
   * Abort operation and terminate worker if running
   */
  public cancel(): void {
    this.stopTimer();
    if (this.state.activeTaskId) {
      pdfWorkerPool.abortTask(this.state.activeTaskId);
    }
    this.state.isProcessing = false;
    this.state.phase = "cancelled";
    this.state.phaseLabel = PHASE_LABELS.cancelled;
    this.state.stageTitle = "Operation Cancelled";
    this.state.stageMessage = "Processing was aborted by user. Resources cleared.";
    this.state.detailMessage = "WebAssembly worker thread terminated.";
    this.state.workerActive = false;
    this.notify();
  }

  /**
   * Record error state
   */
  public error(errorMessage: string): void {
    this.stopTimer();
    this.state.isProcessing = false;
    this.state.phase = "error";
    this.state.phaseLabel = PHASE_LABELS.error;
    this.state.stageTitle = "Processing Error";
    this.state.stageMessage = errorMessage;
    this.state.detailMessage = "Operation failed. Check file parameters and retry.";
    this.state.workerActive = false;
    this.notify();
  }

  /**
   * Update Web Worker heartbeat health state
   */
  public updateHeartbeat(heartbeat: Partial<WasmHeartbeatState>): void {
    this.state.heartbeat = {
      ...this.state.heartbeat,
      ...heartbeat,
    };
    this.notify();
  }
}

// Global Singleton Progress System
export const wasmProgressSystem = new WasmProgressSystem();

/**
 * React Hook for binding component to the Standardized WebAssembly Progress System
 */
export function useWasmProgressTracker() {
  const [progressState, setProgressState] = useState<StandardizedProgressState>(
    wasmProgressSystem.getState()
  );

  useEffect(() => {
    return wasmProgressSystem.subscribe((next) => {
      setProgressState(next);
    });
  }, []);

  return {
    progressState,
    startProgress: useCallback((p: Parameters<WasmProgressSystem["start"]>[0]) => wasmProgressSystem.start(p), []),
    updateChunkProgress: useCallback((...args: Parameters<WasmProgressSystem["updateChunkProgress"]>) => wasmProgressSystem.updateChunkProgress(...args), []),
    bindWorkerProgress: useCallback((...args: Parameters<WasmProgressSystem["bindWorkerProgress"]>) => wasmProgressSystem.bindWorkerProgress(...args), []),
    createProgressHandler: useCallback((...args: Parameters<WasmProgressSystem["createProgressHandler"]>) => wasmProgressSystem.createProgressHandler(...args), []),
    completeProgress: useCallback((msg?: string) => wasmProgressSystem.complete(msg), []),
    cancelProgress: useCallback(() => wasmProgressSystem.cancel(), []),
    errorProgress: useCallback((err: string) => wasmProgressSystem.error(err), []),
  };
}

/**
 * Utility Formatters
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatEta(seconds: number | null): string {
  if (seconds === null) return "--";
  if (seconds <= 1) return "< 1s remaining";
  if (seconds < 60) return `~${seconds}s remaining`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `~${m}m ${s}s remaining`;
}
