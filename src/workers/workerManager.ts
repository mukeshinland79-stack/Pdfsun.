/**
 * Resilient Web Worker Supervisor & Crash Isolation Manager (workerManager.ts)
 * 
 * Provides:
 * 1. 45-second execution timeout watcher to eradicate infinite browser hangs
 * 2. Automatic worker crash detection & termination
 * 3. 1-click automatic retry with degraded/memory-optimized settings (e.g. reduced quality/DPI)
 * 4. Human-friendly error reporting with actionable fallback suggestions
 */

import { registerGuardedBlobUrl } from "../utils/memoryGuard";

export interface GuardedWorkerOptions {
  timeoutMs?: number; // default: 45000ms
  allowDegradedRetry?: boolean; // default: true
  degradedPreset?: Record<string, any>;
  onProgress?: (percent: number, statusText?: string) => void;
  [key: string]: any;
}

export interface GuardedWorkerResult {
  blob: Blob;
  url: string;
  bytes: Uint8Array;
  durationMs: number;
  mimeType?: string;
  fileName?: string;
  wasDegraded?: boolean;
}

export interface GuardedWorkerError {
  code: "WORKER_TIMEOUT" | "WORKER_CRASH" | "WORKER_OOM" | "EXECUTION_FAILED";
  message: string;
  userSuggestion: string;
  canRetryManually: boolean;
  originalError?: any;
}

const DEFAULT_TIMEOUT_MS = 45000;

/**
 * Execute a task inside a dedicated Web Worker with timeout supervision and crash isolation.
 */
export async function executeGuardedWorker(
  workerUrl: URL | string,
  action: string,
  payload: Record<string, any>,
  transferables: Transferable[] = [],
  options: GuardedWorkerOptions = {}
): Promise<GuardedWorkerResult> {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const allowDegradedRetry = options.allowDegradedRetry ?? true;

  const runAttempt = (isRetry: boolean, customOptions: Record<string, any>): Promise<GuardedWorkerResult> => {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let timer: any = null;
      let settled = false;
      const startTime = performance.now();

      const cleanup = () => {
        settled = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (worker) {
          try {
            worker.terminate();
          } catch {}
          worker = null;
        }
      };

      try {
        if (typeof window === "undefined" || !window.Worker) {
          throw new Error("Web Workers are not supported in this runtime environment.");
        }

        worker = new Worker(workerUrl, { type: "module" });
      } catch (initErr: any) {
        cleanup();
        return reject({
          code: "WORKER_CRASH",
          message: initErr?.message || "Failed to instantiate Web Worker.",
          userSuggestion: "Your browser environment restricted background workers. Try with a smaller document.",
          canRetryManually: true,
          originalError: initErr,
        } as GuardedWorkerError);
      }

      // 45-Second Watcher Timer
      timer = setTimeout(() => {
        if (settled) return;
        cleanup();
        reject({
          code: "WORKER_TIMEOUT",
          message: `Worker execution exceeded the 45-second safety threshold without completing.`,
          userSuggestion: "The document is too complex for a single-pass conversion. Try splitting pages or lowering compression quality.",
          canRetryManually: true,
        } as GuardedWorkerError);
      }, timeoutMs);

      // Worker Message Handler
      worker.onmessage = (e: MessageEvent) => {
        if (settled) return;
        const data = e.data || {};

        if (data.status === "extracting" || data.status === "formatting" || data.type === "progress") {
          const pct = typeof data.progress === "number" ? data.progress : data.percent || 50;
          if (options.onProgress) {
            options.onProgress(pct, data.statusText || data.status);
          }
          return;
        }

        if (data.status === "completed" || data.type === "complete") {
          cleanup();
          const durationMs = Math.round(performance.now() - startTime);
          let resultBlob: Blob;
          let resultBytes: Uint8Array;

          if (data.blob instanceof Blob) {
            resultBlob = data.blob;
            resultBytes = new Uint8Array();
          } else if (data.resultBuffer) {
            resultBytes = new Uint8Array(data.resultBuffer);
            resultBlob = new Blob([resultBytes], { type: data.mimeType || "application/pdf" });
          } else if (data.bytes) {
            resultBytes = data.bytes;
            resultBlob = new Blob([resultBytes], { type: data.mimeType || "application/pdf" });
          } else {
            resultBytes = new Uint8Array();
            resultBlob = new Blob([], { type: data.mimeType || "application/octet-stream" });
          }

          const guardedUrl = registerGuardedBlobUrl(URL.createObjectURL(resultBlob));
          resolve({
            blob: resultBlob,
            url: guardedUrl,
            bytes: resultBytes,
            durationMs,
            mimeType: data.mimeType || resultBlob.type,
            fileName: data.fileName,
            wasDegraded: isRetry,
          });
        } else if (data.status === "error" || data.type === "error") {
          cleanup();
          reject({
            code: "EXECUTION_FAILED",
            message: data.message || data.error || "Worker failed during document transformation.",
            userSuggestion: "Verify that the document is not password-protected or corrupted.",
            canRetryManually: true,
          } as GuardedWorkerError);
        }
      };

      // Worker Error Handler (OOM or uncaught exceptions)
      worker.onerror = (err: ErrorEvent) => {
        if (settled) return;
        cleanup();
        reject({
          code: "WORKER_CRASH",
          message: err?.message || "Web Worker crashed unexpectedly.",
          userSuggestion: "The document likely triggered high memory usage. Retrying with optimized profile.",
          canRetryManually: true,
          originalError: err,
        } as GuardedWorkerError);
      };

      // Dispatch payload
      try {
        worker.postMessage(
          {
            taskId: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            action,
            payload: {
              ...payload,
              ...customOptions,
            },
          },
          transferables
        );
      } catch (postErr: any) {
        cleanup();
        reject({
          code: "WORKER_CRASH",
          message: postErr?.message || "Failed to transfer buffers to Web Worker.",
          userSuggestion: "Buffer transfer error. Processing will fallback safely.",
          canRetryManually: false,
          originalError: postErr,
        } as GuardedWorkerError);
      }
    });
  };

  try {
    // Attempt 1: Standard execution
    return await runAttempt(false, options);
  } catch (err: any) {
    if (allowDegradedRetry) {
      console.warn("[WorkerSupervisor] Primary attempt failed, initiating degraded fallback retry:", err);
      if (options.onProgress) {
        options.onProgress(20, "Retrying with memory-safe profile...");
      }
      const degradedPreset = options.degradedPreset || {
        quality: "low",
        dpi: 150,
        enableStreaming: true,
        useObjectStreams: true,
      };
      // Attempt 2: Degraded profile retry
      return await runAttempt(true, degradedPreset);
    }
    throw err;
  }
}
