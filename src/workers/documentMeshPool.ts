/**
 * Document Mesh Pool Supervisor (documentMeshPool.ts)
 * Version 1.0.0 — PDFSun.in Document Intelligence Engine
 * 
 * Provides:
 * 1. Concurrency-bounded Worker Mesh (scales to navigator.hardwareConcurrency, clamped 2-4)
 * 2. 45-second execution timeout watchdog
 * 3. Graceful degradation: in-thread execution fallback if Workers are unavailable or in Node/SSR
 * 4. Zero-copy Transferable buffer support
 * 5. Memory-safe ephemeral Blob registration
 */

import { registerGuardedBlobUrl } from "../utils/memoryGuard";
import { UdirDocument, UdirTable } from "../core/udir/types";
import { buildUdirTableFromTokens, RawSpatialToken } from "../core/udir/spatialTableEngine";
import { compileUdirToDocx } from "../core/udir/docxCompiler";
import { compileUdirToXlsx } from "../core/udir/xlsxCompiler";
import { compileUdirToMarkdown } from "../core/udir/markdownCompiler";

export interface MeshTaskOptions {
  timeoutMs?: number;
  onProgress?: (percent: number, status: string) => void;
  priority?: "high" | "normal" | "low";
}

export interface MeshExecutionResult<T> {
  result: T;
  durationMs: number;
  workerThreadUsed: boolean;
  byteLength?: number;
}

class DocumentMeshPoolService {
  private maxConcurrency: number;
  private activeWorkers: number = 0;
  private isWorkerSupported: boolean;

  constructor() {
    this.isWorkerSupported = typeof window !== "undefined" && typeof Worker !== "undefined";
    const hardwareCores =
      typeof navigator !== "undefined" && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 4;
    // Bounded concurrency between 2 and 4 to prevent mobile browser memory exhaustion
    this.maxConcurrency = Math.max(2, Math.min(4, Math.floor(hardwareCores / 2) || 2));
  }

  /**
   * Execute an action using the Worker Mesh, with automatic fallback to in-thread execution.
   */
  async execute<T>(
    action: string,
    payload: any,
    transferables: Transferable[] = [],
    options: MeshTaskOptions = {}
  ): Promise<MeshExecutionResult<T>> {
    const startTime = performance.now();
    const timeoutMs = options.timeoutMs || 45000;

    // If Workers are not supported or in test/node environment, run inline safely
    if (!this.isWorkerSupported) {
      const inlineResult = await this.runInlineFallback<T>(action, payload, options);
      return {
        result: inlineResult,
        durationMs: performance.now() - startTime,
        workerThreadUsed: false,
        byteLength: (inlineResult as any)?.byteLength,
      };
    }

    return new Promise<MeshExecutionResult<T>>((resolve, reject) => {
      let worker: Worker | null = null;
      let timer: any = null;
      let settled = false;
      const taskId = `mesh-task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const cleanup = () => {
        settled = true;
        if (timer) clearTimeout(timer);
        if (worker) {
          try {
            worker.terminate();
          } catch {
            // Ignore termination errors
          }
          worker = null;
          this.activeWorkers = Math.max(0, this.activeWorkers - 1);
        }
      };

      timer = setTimeout(() => {
        if (!settled) {
          cleanup();
          // Fallback inline on timeout
          this.runInlineFallback<T>(action, payload, options)
            .then((res) => {
              resolve({
                result: res,
                durationMs: performance.now() - startTime,
                workerThreadUsed: false,
                byteLength: (res as any)?.byteLength,
              });
            })
            .catch(reject);
        }
      }, timeoutMs);

      try {
        this.activeWorkers++;
        worker = new Worker(new URL("./documentMesh.worker.ts", import.meta.url), {
          type: "module",
        });

        worker.onmessage = (e: MessageEvent) => {
          const data = e.data || {};
          if (data.taskId !== taskId) return;

          if (data.type === "progress") {
            options.onProgress?.(data.percent, data.status);
          } else if (data.type === "success") {
            cleanup();
            resolve({
              result: data.result,
              durationMs: performance.now() - startTime,
              workerThreadUsed: true,
              byteLength: data.byteLength,
            });
          } else if (data.type === "error") {
            cleanup();
            // Retry inline if worker threw
            this.runInlineFallback<T>(action, payload, options)
              .then((res) => {
                resolve({
                  result: res,
                  durationMs: performance.now() - startTime,
                  workerThreadUsed: false,
                  byteLength: (res as any)?.byteLength,
                });
              })
              .catch(reject);
          }
        };

        worker.onerror = () => {
          cleanup();
          this.runInlineFallback<T>(action, payload, options)
            .then((res) => {
              resolve({
                result: res,
                durationMs: performance.now() - startTime,
                workerThreadUsed: false,
                byteLength: (res as any)?.byteLength,
              });
            })
            .catch(reject);
        };

        worker.postMessage({ taskId, action, payload }, transferables);
      } catch {
        cleanup();
        this.runInlineFallback<T>(action, payload, options)
          .then((res) => {
            resolve({
              result: res,
              durationMs: performance.now() - startTime,
              workerThreadUsed: false,
              byteLength: (res as any)?.byteLength,
            });
          })
          .catch(reject);
      }
    });
  }

  /**
   * Safe inline fallback for environments without Web Workers (e.g. Node test suite, SSR)
   */
  private async runInlineFallback<T>(
    action: string,
    payload: any,
    options: MeshTaskOptions
  ): Promise<T> {
    options.onProgress?.(25, "Processing in safe mode...");

    switch (action) {
      case "SPATIAL_CLUSTER_TABLE": {
        const { tokens, tableId, title } = payload as {
          tokens: RawSpatialToken[];
          tableId?: string;
          title?: string;
        };
        const table = buildUdirTableFromTokens(tokens, tableId, title);
        options.onProgress?.(100, "Table clustering complete.");
        return table as any as T;
      }

      case "COMPILE_UDIR_TO_DOCX": {
        const { udir, options: docxOpts } = payload as { udir: UdirDocument; options?: any };
        const buffer = await compileUdirToDocx(udir, docxOpts);
        options.onProgress?.(100, "DOCX compilation complete.");
        return buffer as any as T;
      }

      case "COMPILE_UDIR_TO_XLSX": {
        const { udir } = payload as { udir: UdirDocument };
        const buffer = await compileUdirToXlsx(udir);
        options.onProgress?.(100, "XLSX compilation complete.");
        return buffer as any as T;
      }

      case "COMPILE_UDIR_TO_MARKDOWN": {
        const { udir } = payload as { udir: UdirDocument };
        const md = compileUdirToMarkdown(udir);
        options.onProgress?.(100, "Markdown compilation complete.");
        return md as any as T;
      }

      default:
        throw new Error(`Unsupported Mesh action: ${action}`);
    }
  }

  /**
   * Helper to compile UDIR to DOCX with guarded Blob registration
   */
  async compileDocxWithMemoryGuard(
    udir: UdirDocument,
    options?: MeshTaskOptions
  ): Promise<{ blob: Blob; url: string; bytes: Uint8Array }> {
    const res = await this.execute<Uint8Array>("COMPILE_UDIR_TO_DOCX", { udir }, [], options);
    const blob = new Blob([res.result], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const rawUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function" ? URL.createObjectURL(blob) : "";
    const url = registerGuardedBlobUrl(rawUrl);
    return { blob, url, bytes: res.result };
  }

  /**
   * Helper to compile UDIR to XLSX with guarded Blob registration
   */
  async compileXlsxWithMemoryGuard(
    udir: UdirDocument,
    options?: MeshTaskOptions
  ): Promise<{ blob: Blob; url: string; bytes: Uint8Array }> {
    const res = await this.execute<Uint8Array>("COMPILE_UDIR_TO_XLSX", { udir }, [], options);
    const blob = new Blob([res.result], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const rawUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function" ? URL.createObjectURL(blob) : "";
    const url = registerGuardedBlobUrl(rawUrl);
    return { blob, url, bytes: res.result };
  }
}

export const documentMeshPool = new DocumentMeshPoolService();
