/**
 * WebAssembly & PDF Lifecycle Watchdog for PDFSun
 * 
 * Provides:
 * 1. Resilient PDF.js WebAssembly worker, cMaps, and standard font initialization.
 * 2. WebAssembly linear memory leak prevention via automatic Page & Document cleanup.
 * 3. Graceful canvas backing-store memory release for large multi-page PDF conversions.
 * 4. Silent promise rejection interception for expected WebAssembly/Worker cancellations
 *    (e.g., RenderingCancelledException, canvas draw concurrency conflicts, worker termination).
 */

import * as pdfjsLib from "pdfjs-dist";
import { wasmTracker } from "./wasmPerformanceTracker";

const PDFJS_VERSION = pdfjsLib.version || "6.2.108";

export const PDFJS_ASSETS = {
  workerSrc: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`,
  workerFallbackSrc: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`,
  cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
};

// Initialize workerSrc once
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_ASSETS.workerSrc;
  } catch (err) {
    console.warn("[WasmLifecycle] Failed to set primary workerSrc, trying fallback:", err);
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_ASSETS.workerFallbackSrc;
    } catch {}
  }
}

/**
 * Check if an error or rejection reason is a benign WebAssembly / PDF.js lifecycle event
 */
export function isBenignWasmLifecycleError(error: any): boolean {
  if (!error) return false;

  const errorName = String(error?.name || "");
  const errorMessage = String(error?.message || error?.reason || error || "").toLowerCase();

  return (
    errorName === "RenderingCancelledException" ||
    errorMessage.includes("renderingcancelledexception") ||
    errorMessage.includes("rendering cancelled") ||
    errorMessage.includes("an operation that depends on the canvas being clean is already in progress") ||
    errorMessage.includes("cannot draw on canvas while a render is active") ||
    errorMessage.includes("worker task cancelled") ||
    errorMessage.includes("the worker has been terminated") ||
    errorMessage.includes("abortexception") ||
    errorMessage.includes("abort error") ||
    errorMessage.includes("the operation was aborted") ||
    errorMessage.includes("cmap not found") ||
    errorMessage.includes("the cmap")
  );
}

export interface FileMetaSnapshot {
  name: string;
  size: number;
  sizeFormatted: string;
  type?: string;
  lastModified?: number;
}

export interface ActivePdfToolState {
  toolId: string;
  toolName: string;
  toolSlug?: string;
  fileCount: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  files: FileMetaSnapshot[];
  isProcessing?: boolean;
  currentStep?: string;
  statusMessage?: string;
  activePhase?: string;
  progressPercent?: number;
  timestamp?: number;
  customOptions?: Record<string, any>;
}

export interface WasmCrashSnapshot {
  id: string;
  timestamp: string;
  epochMs: number;
  error: {
    name?: string;
    message: string;
    stack?: string;
    code?: string | number;
    isWasmOom?: boolean;
  };
  reason?: string;
  toolState: ActivePdfToolState | null;
  memory?: {
    usedHeapMb?: number;
    totalHeapMb?: number;
    heapLimitMb?: number;
    wasmMb?: number;
    wasmBufferCount?: number;
    canvasMb?: number;
    status?: string;
  };
  additionalMeta?: Record<string, any>;
  userAgent: string;
  url: string;
}

export const WASM_CRASH_STORAGE_KEY = "pdfsun_wasm_crash_snapshots";
export const LAST_WASM_CRASH_KEY = "pdfsun_last_wasm_crash";
const MAX_PERSISTED_CRASH_REPORTS = 20;

let currentActivePdfToolState: ActivePdfToolState | null = null;

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Register the current PDF tool workspace state (tool name, file count, file sizes, processing phase)
 */
export function registerActivePdfToolState(state: ActivePdfToolState | null): void {
  currentActivePdfToolState = state;
}

/**
 * Update the active tool state whenever files are selected, added, or modified in the workspace
 */
export function updateActivePdfToolFiles(
  toolId: string,
  toolName: string,
  files: (File | { name: string; size: number; type?: string; lastModified?: number })[],
  extra?: Partial<ActivePdfToolState>
): void {
  const fileSnapshots: FileMetaSnapshot[] = files.map((f) => ({
    name: f.name || "unnamed_document.pdf",
    size: f.size || 0,
    sizeFormatted: formatBytes(f.size || 0),
    type: f.type || "application/pdf",
    lastModified: "lastModified" in f && typeof f.lastModified === "number" ? f.lastModified : undefined,
  }));
  const totalSizeBytes = files.reduce((acc, f) => acc + (f?.size || 0), 0);

  currentActivePdfToolState = {
    toolId,
    toolName,
    fileCount: files.length,
    totalSizeBytes,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    files: fileSnapshots,
    timestamp: Date.now(),
    ...extra,
  };
}

/**
 * Clear the active PDF tool state when a workspace unmounts or resets
 */
export function clearActivePdfToolState(): void {
  currentActivePdfToolState = null;
}

/**
 * Retrieve the current active PDF tool state
 */
export function getActivePdfToolState(): ActivePdfToolState | null {
  return currentActivePdfToolState;
}

/**
 * Determine whether an uncaught error indicates a WebAssembly, Worker, OOM, or tool processing failure
 */
export function isWasmOrCriticalCrash(error: any): boolean {
  if (!error) return false;
  if (isBenignWasmLifecycleError(error)) return false;

  const msg = String(error?.message || error?.reason || error || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();
  const stack = String(error?.stack || "").toLowerCase();

  return (
    name.includes("runtimeerror") ||
    name.includes("rangeerror") ||
    name.includes("typeerror") ||
    msg.includes("wasm") ||
    msg.includes("webassembly") ||
    msg.includes("out of memory") ||
    msg.includes("memory access out of bounds") ||
    msg.includes("unreachable") ||
    msg.includes("table index is out of bounds") ||
    msg.includes("allocation failed") ||
    msg.includes("worker task execution failed") ||
    msg.includes("worker error") ||
    msg.includes("the worker has been terminated") ||
    msg.includes("timed out") ||
    msg.includes("heartbeat") ||
    msg.includes("force-reloaded") ||
    msg.includes("unresponsive") ||
    stack.includes("wasm") ||
    stack.includes("pdfjs") ||
    stack.includes("pdf-lib") ||
    (currentActivePdfToolState !== null && currentActivePdfToolState.isProcessing === true)
  );
}

/**
 * Persist a crash snapshot to localStorage for post-mortem debugging
 */
export function persistCrashSnapshotToLocalStorage(snapshot: WasmCrashSnapshot): void {
  if (typeof window === "undefined" || !window.localStorage) return;

  try {
    // 1. Persist the most recent crash snapshot directly for immediate inspection
    window.localStorage.setItem(LAST_WASM_CRASH_KEY, JSON.stringify(snapshot));

    // 2. Append to crash history list (capped to avoid exceeding localStorage quota)
    let existingList: WasmCrashSnapshot[] = [];
    try {
      const raw = window.localStorage.getItem(WASM_CRASH_STORAGE_KEY);
      if (raw) {
        existingList = JSON.parse(raw);
        if (!Array.isArray(existingList)) existingList = [];
      }
    } catch {
      existingList = [];
    }

    existingList.unshift(snapshot);
    if (existingList.length > MAX_PERSISTED_CRASH_REPORTS) {
      existingList = existingList.slice(0, MAX_PERSISTED_CRASH_REPORTS);
    }

    try {
      window.localStorage.setItem(WASM_CRASH_STORAGE_KEY, JSON.stringify(existingList));
    } catch (quotaErr) {
      console.warn("[WasmLifecycleWatchdog] LocalStorage quota reached, pruning older crash snapshots.");
      window.localStorage.setItem(WASM_CRASH_STORAGE_KEY, JSON.stringify([snapshot]));
    }
  } catch (err) {
    console.error("[WasmLifecycleWatchdog] Failed to persist crash snapshot to localStorage:", err);
  }
}

/**
 * Capture a complete snapshot of current tool state (number of files, file sizes), memory, and error,
 * and persist this metadata to localStorage for post-mortem debugging.
 */
export function captureWasmCrashSnapshot(
  error?: any,
  reason: string = "wasm_lifecycle_crash",
  additionalMeta?: Record<string, any>
): WasmCrashSnapshot {
  const timestampIso = new Date().toISOString();
  const epochMs = Date.now();
  const id = `wasm_crash_${epochMs}_${Math.random().toString(36).substring(2, 7)}`;

  // Capture current memory metrics from wasmTracker if available
  let memoryMetrics: WasmCrashSnapshot["memory"] = undefined;
  try {
    const memSnap = wasmTracker.getLatestSnapshot();
    if (memSnap) {
      memoryMetrics = {
        usedHeapMb: memSnap.usedHeapMb,
        totalHeapMb: memSnap.totalHeapMb,
        heapLimitMb: memSnap.heapLimitMb,
        wasmMb: memSnap.wasmMb,
        wasmBufferCount: memSnap.wasmBufferCount,
        canvasMb: memSnap.canvasMb,
        status: memSnap.status,
      };
    }
  } catch {}

  // Parse error details
  const errorObj = {
    name: error?.name || (typeof error === "string" ? "Error" : "UnhandledWasmException"),
    message: String(error?.message || error?.reason || error || "Unknown WebAssembly exception"),
    stack: typeof error?.stack === "string" ? error.stack : undefined,
    isWasmOom: false,
  };

  const lowerMsg = (errorObj.message + " " + (errorObj.stack || "")).toLowerCase();
  if (
    lowerMsg.includes("out of memory") ||
    lowerMsg.includes("allocation failed") ||
    lowerMsg.includes("memory access out of bounds") ||
    lowerMsg.includes("array buffer allocation") ||
    lowerMsg.includes("oom")
  ) {
    errorObj.isWasmOom = true;
  }

  // Snapshot the current tool state with file count and file sizes
  const toolStateSnapshot = currentActivePdfToolState
    ? JSON.parse(JSON.stringify(currentActivePdfToolState))
    : null;

  const snapshot: WasmCrashSnapshot = {
    id,
    timestamp: timestampIso,
    epochMs,
    error: errorObj,
    reason,
    toolState: toolStateSnapshot,
    memory: memoryMetrics,
    additionalMeta,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    url: typeof window !== "undefined" ? window.location.href : "Unknown",
  };

  // Persist metadata to localStorage for post-mortem debugging
  persistCrashSnapshotToLocalStorage(snapshot);

  // Dispatch custom window event for telemetry or debugging observers
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("wasm-crash-snapshot-saved", { detail: snapshot })
      );
    } catch {}
  }

  console.error(
    `[WasmLifecycleWatchdog] Crash snapshot captured & persisted to localStorage (tool: ${toolStateSnapshot?.toolName || 'none'}, files: ${toolStateSnapshot?.fileCount || 0}, size: ${toolStateSnapshot?.totalSizeFormatted || '0B'}):`,
    snapshot
  );

  return snapshot;
}

/**
 * Retrieve all persisted WASM crash snapshots from localStorage
 */
export function getPersistedCrashSnapshots(): WasmCrashSnapshot[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(WASM_CRASH_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("[WasmLifecycleWatchdog] Error reading crash snapshots:", e);
    return [];
  }
}

/**
 * Retrieve the most recent persisted WASM crash snapshot from localStorage
 */
export function getLastPersistedCrashSnapshot(): WasmCrashSnapshot | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(LAST_WASM_CRASH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("[WasmLifecycleWatchdog] Error reading last crash snapshot:", e);
    return null;
  }
}

/**
 * Clear all persisted WASM crash snapshots from localStorage
 */
export function clearPersistedCrashSnapshots(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(WASM_CRASH_STORAGE_KEY);
    window.localStorage.removeItem(LAST_WASM_CRASH_KEY);
    console.log("[WasmLifecycleWatchdog] Cleared all persisted crash snapshots from localStorage.");
  } catch (e) {
    console.error("[WasmLifecycleWatchdog] Error clearing crash snapshots:", e);
  }
}

/**
 * Export persisted crash snapshots as formatted JSON string
 */
export function exportCrashSnapshotJson(): string {
  const list = getPersistedCrashSnapshots();
  return JSON.stringify(list, null, 2);
}

/**
 * Developer helper: simulate a WASM crash to verify watchdog state capture and localStorage persistence
 */
export function simulateWasmCrashForTesting(customMessage = "Simulated WebAssembly linear memory allocation fault"): WasmCrashSnapshot {
  const err = new Error(customMessage);
  err.name = "WebAssembly.RuntimeError";
  return captureWasmCrashSnapshot(err, "simulated_debug_crash", { simulated: true });
}

/**
 * Setup global window listener to intercept silent promise rejections during PDF WebAssembly lifecycle,
 * and capture full tool snapshots upon critical failures and crashes.
 */
export function initWasmLifecycleWatchdog(): void {
  if (typeof window === "undefined") return;

  // Intercept unhandled promise rejections specifically targeting PDF/WASM lifecycle
  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      if (isBenignWasmLifecycleError(event.reason)) {
        event.preventDefault();
        if (typeof event.stopPropagation === "function") {
          event.stopPropagation();
        }
        return;
      }

      // Check if this unhandled rejection is a WASM crash or occurred during active tool processing
      if (isWasmOrCriticalCrash(event.reason)) {
        console.error("[WasmLifecycleWatchdog] Unhandled promise rejection crash detected:", event.reason);
        captureWasmCrashSnapshot(event.reason, "unhandled_promise_rejection");
      }
    },
    { capture: true }
  );

  // Intercept uncaught global errors
  window.addEventListener(
    "error",
    (event: ErrorEvent) => {
      if (isBenignWasmLifecycleError(event.error || event.message)) {
        event.preventDefault();
        return;
      }

      if (isWasmOrCriticalCrash(event.error || event.message)) {
        console.error("[WasmLifecycleWatchdog] Uncaught error crash detected:", event.error || event.message);
        captureWasmCrashSnapshot(
          event.error || event.message,
          "uncaught_runtime_error",
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          }
        );
      }
    },
    { capture: true }
  );

  // Expose post-mortem debug utilities on window for developer console access
  (window as any).__PDFSUN_WASM_WATCHDOG__ = {
    getActiveState: getActivePdfToolState,
    getLastCrash: getLastPersistedCrashSnapshot,
    getAllCrashes: getPersistedCrashSnapshots,
    clearCrashes: clearPersistedCrashSnapshots,
    exportJson: exportCrashSnapshotJson,
    simulateCrash: simulateWasmCrashForTesting,
    simulateHeartbeatFailure: (msg = "WASM worker heartbeat timeout: worker execution frozen for >4s during conversion") => {
      const err = new Error(msg);
      return captureWasmCrashSnapshot(err, "wasm_heartbeat_timeout_reload", { simulated: true });
    },
    captureSnapshot: captureWasmCrashSnapshot,
  };

  // Start real-time WebAssembly heap & leak performance watchdog
  wasmTracker.startMonitoring();
}

export interface SafeDocumentResult {
  pdf: any;
  cleanup: () => Promise<void>;
}

/**
 * Load a PDF.js document safely with cMaps, standard fonts, and guaranteed cleanup
 */
export async function safeLoadPdfJsDocument(
  source: ArrayBuffer | Uint8Array | File,
  customOptions: Record<string, any> = {}
): Promise<SafeDocumentResult> {
  let dataBuffer: Uint8Array;

  if (source instanceof File || source instanceof Blob) {
    const ab = await source.arrayBuffer();
    dataBuffer = new Uint8Array(ab);
  } else if (source instanceof Uint8Array) {
    dataBuffer = source;
  } else {
    dataBuffer = new Uint8Array(source);
  }

  const loadingTask = pdfjsLib.getDocument({
    data: dataBuffer.slice(0),
    cMapUrl: PDFJS_ASSETS.cMapUrl,
    cMapPacked: PDFJS_ASSETS.cMapPacked,
    standardFontDataUrl: PDFJS_ASSETS.standardFontDataUrl,
    ...customOptions,
  });

  const pdf = await loadingTask.promise;

  // Proactively check memory threshold after document allocation
  wasmTracker.checkMemoryThreshold(500);

  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    try {
      if (typeof pdf.cleanup === "function") {
        await pdf.cleanup();
      }
    } catch {}
    try {
      if (typeof (pdf as any).destroy === "function") {
        await (pdf as any).destroy();
      }
    } catch {}
    try {
      if (typeof (loadingTask as any).destroy === "function") {
        await (loadingTask as any).destroy();
      }
    } catch {}
  };

  return { pdf, cleanup };
}

/**
 * Safely render a PDF page to a canvas, handling cancellation and cleanup
 */
export async function safeRenderPdfPage(
  page: any,
  renderContext: {
    canvasContext: CanvasRenderingContext2D;
    viewport: any;
    canvas?: HTMLCanvasElement;
  }
): Promise<{ cancelled: boolean }> {
  try {
    const renderTask = page.render(renderContext as any);
    await renderTask.promise;
    return { cancelled: false };
  } catch (err: any) {
    if (isBenignWasmLifecycleError(err)) {
      return { cancelled: true };
    }
    throw err;
  } finally {
    try {
      if (typeof page.cleanup === "function") {
        page.cleanup();
      }
    } catch {}
    wasmTracker.checkMemoryThreshold(500);
  }
}

/**
 * Immediately release HTML5 Canvas backing store memory
 */
export function releaseCanvasMemory(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  try {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  } catch {}
}
