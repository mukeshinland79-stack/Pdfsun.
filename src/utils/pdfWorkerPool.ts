/**
 * PDF Web Worker Pool Manager for PDFSun.in
 * Manages a pool of Web Workers for concurrent, off-main-thread PDF tasks (Compression, OCR, Merging, Splitting).
 * Guarantees zero main-thread UI freezing and optimal multi-core CPU utilization.
 */

import { registerBlobUrl } from "./pdfWorkerManager";
import { captureWasmCrashSnapshot } from "./wasmPdfLifecycle";

export type PdfWorkerAction =
  | "merge"
  | "compress"
  | "rotate"
  | "split"
  | "watermark"
  | "ocr"
  | "convert"
  | "page-numbers"
  | "remove-pages"
  | "extract-pages"
  | "flatten"
  | "crop"
  | "protect";

export interface PoolTaskOptions {
  rotationAngle?: number;
  watermarkText?: string;
  quality?: "low" | "medium" | "high";
  language?: string;
  pageRangesStr?: string;
  opacity?: number;
  fontSize?: number;
  angle?: number;
  position?: string;
  margin?: number;
  password?: string;
  mode?: string;
  dpi?: number;
  [key: string]: any;
}

export interface PoolTaskProgress {
  taskId?: string;
  percent: number;
  stage?: string;
  detail?: string;
  currentPage?: number;
  totalPages?: number;
  processedBytes?: number;
  totalBytes?: number;
  workerId?: string;
  memoryMb?: number;
}

export interface PoolTaskResult {
  blob: Blob;
  url: string;
  bytes: Uint8Array;
  durationMs: number;
}

export interface WorkerPoolStatus {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
}

export interface WorkerHeartbeatInfo {
  workerId: string;
  taskId: string;
  status: "healthy" | "delayed" | "unresponsive" | "reloaded";
  latencyMs: number;
  memoryMb?: number;
  timestamp: number;
  reloadCount: number;
}

interface WorkerInstance {
  id: string;
  worker: Worker | null;
  isBusy: boolean;
  currentTaskId: string | null;
  reloadCount: number;
  lastHeartbeatTime: number;
}

interface QueuedTask {
  taskId: string;
  action: PdfWorkerAction;
  files: File[];
  options: PoolTaskOptions;
  onProgress?: (progress: number | PoolTaskProgress) => void;
  resolve: (result: PoolTaskResult) => void;
  reject: (reason: any) => void;
  startTime: number;
}

class PDFWorkerPool {
  private workers: WorkerInstance[] = [];
  private taskQueue: QueuedTask[] = [];
  private maxWorkers: number;
  private initialized = false;
  private progressListeners: Set<(progress: PoolTaskProgress) => void> = new Set();
  private heartbeatListeners: Set<(info: WorkerHeartbeatInfo) => void> = new Set();

  /**
   * Subscribe to global WebAssembly worker progress updates across any active tasks
   */
  public onProgress(listener: (progress: PoolTaskProgress) => void): () => void {
    this.progressListeners.add(listener);
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  /**
   * Subscribe to WebAssembly worker heartbeat health events and force-reload alerts
   */
  public onHeartbeat(listener: (info: WorkerHeartbeatInfo) => void): () => void {
    this.heartbeatListeners.add(listener);
    return () => {
      this.heartbeatListeners.delete(listener);
    };
  }

  private emitHeartbeat(info: WorkerHeartbeatInfo): void {
    this.heartbeatListeners.forEach((l) => {
      try {
        l(info);
      } catch (err) {
        console.warn("[PDFWorkerPool] Heartbeat listener error:", err);
      }
    });
  }

  constructor(maxWorkers?: number) {
    if (typeof window !== "undefined") {
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      // Determine optimal pool size (clamped between 2 and 6)
      this.maxWorkers = maxWorkers || Math.min(Math.max(hardwareConcurrency - 1, 2), 6);
    } else {
      this.maxWorkers = 2;
    }
  }

  /**
   * Lazy initialization of worker pool
   */
  private initializePool(): void {
    if (this.initialized || typeof window === "undefined") return;

    for (let i = 0; i < this.maxWorkers; i++) {
      const workerId = `worker_${i + 1}`;
      let workerInstance: Worker | null = null;

      try {
        if (window.Worker) {
          workerInstance = new Worker(new URL("./pdfWorker.ts", import.meta.url), { type: "module" });
        }
      } catch (err) {
        console.warn(`[PDFWorkerPool] Web Worker creation failed for slot ${workerId}:`, err);
      }

      this.workers.push({
        id: workerId,
        worker: workerInstance,
        isBusy: false,
        currentTaskId: null,
        reloadCount: 0,
        lastHeartbeatTime: Date.now(),
      });
    }

    this.initialized = true;
    console.log(`[PDFWorkerPool] Initialized pool with ${this.workers.length} workers.`);
  }

  /**
   * Get current worker pool telemetry
   */
  public getStatus(): WorkerPoolStatus {
    const activeWorkers = this.workers.filter((w) => w.isBusy).length;
    return {
      totalWorkers: this.workers.length,
      activeWorkers,
      idleWorkers: this.workers.length - activeWorkers,
      queuedTasks: this.taskQueue.length,
    };
  }

  /**
   * Dispatch task to pool or queue if all workers are busy
   */
  public async executeTask(
    action: PdfWorkerAction,
    files: File[],
    options: PoolTaskOptions = {},
    onProgress?: (progress: number | PoolTaskProgress) => void
  ): Promise<PoolTaskResult> {
    this.initializePool();

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return new Promise<PoolTaskResult>((resolve, reject) => {
      const queuedTask: QueuedTask = {
        taskId,
        action,
        files,
        options,
        onProgress,
        resolve,
        reject,
        startTime: performance.now(),
      };

      this.taskQueue.push(queuedTask);
      this.processNextTask();
    });
  }

  /**
   * Immediately abort an active or queued worker task and free worker resources
   */
  public abortTask(taskId: string): boolean {
    const queueIdx = this.taskQueue.findIndex((t) => t.taskId === taskId);
    if (queueIdx !== -1) {
      const task = this.taskQueue.splice(queueIdx, 1)[0];
      task.reject(new DOMException("Task aborted by user", "AbortError"));
      return true;
    }

    const busyWorker = this.workers.find((w) => w.currentTaskId === taskId);
    if (busyWorker) {
      try {
        if (busyWorker.worker) {
          busyWorker.worker.terminate();
        }
      } catch {}
      // Respawn clean worker in this slot
      try {
        if (typeof window !== "undefined" && window.Worker) {
          busyWorker.worker = new Worker(new URL("./pdfWorker.ts", import.meta.url), { type: "module" });
        }
      } catch {}
      this.releaseWorker(busyWorker);
      return true;
    }
    return false;
  }

  /**
   * Assign pending task from queue to an available idle worker
   */
  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    // Find available idle worker
    const availableWorker = this.workers.find((w) => !w.isBusy && w.worker !== null);

    if (!availableWorker) {
      // If no Web Worker is available, check if we can run fallback task async
      const nonWorkerSlot = this.workers.find((w) => !w.isBusy && w.worker === null);
      if (nonWorkerSlot && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (task) {
          nonWorkerSlot.isBusy = true;
          nonWorkerSlot.currentTaskId = task.taskId;
          this.executeFallbackTask(task, nonWorkerSlot);
        }
      }
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    availableWorker.isBusy = true;
    availableWorker.currentTaskId = task.taskId;

    try {
      // Read files to ArrayBuffers
      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < task.files.length; i++) {
        const ab = await task.files[i].arrayBuffer();
        buffers.push(ab);
      }

      const worker = availableWorker.worker!;

      const handleMessage = (e: MessageEvent) => {
        const {
          taskId: resId,
          type,
          percent,
          resultBuffer,
          error,
          stage,
          detail,
          currentPage,
          totalPages,
          processedBytes,
          totalBytes,
          memoryMb,
        } = e.data;
        if (resId !== task.taskId) return;

        if (type === "heartbeat_ack") {
          availableWorker.lastHeartbeatTime = Date.now();
          const latencyMs = Math.max(0, Date.now() - (e.data.timestamp || Date.now()));
          this.emitHeartbeat({
            workerId: availableWorker.id,
            taskId: task.taskId,
            status: "healthy",
            latencyMs,
            memoryMb: e.data.memoryMb,
            timestamp: Date.now(),
            reloadCount: availableWorker.reloadCount || 0,
          });
          return;
        }

        if (type === "progress") {
          const progressPayload: PoolTaskProgress = {
            taskId: resId,
            percent: typeof percent === "number" ? percent : 0,
            stage,
            detail,
            currentPage,
            totalPages,
            processedBytes,
            totalBytes,
            workerId: availableWorker.id,
            memoryMb,
          };

          if (task.onProgress) {
            task.onProgress(progressPayload);
          }

          // Broadcast to any subscribed React hooks or telemetry listeners
          this.progressListeners.forEach((listener) => {
            try {
              listener(progressPayload);
            } catch (listenerErr) {
              console.warn("[PDFWorkerPool] Progress listener error:", listenerErr);
            }
          });
        } else if (type === "complete") {
          cleanup();
          const durationMs = Math.round(performance.now() - task.startTime);
          const bytes = new Uint8Array(resultBuffer);
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = registerBlobUrl(URL.createObjectURL(blob));

          this.releaseWorker(availableWorker);
          task.resolve({ blob, url, bytes, durationMs });
        } else if (type === "error") {
          cleanup();
          this.releaseWorker(availableWorker);
          const taskError = new Error(error || "Worker task execution failed");
          captureWasmCrashSnapshot(taskError, "wasm_worker_task_error", {
            taskId: task.taskId,
            action: task.action,
          });
          task.reject(taskError);
        }
      };

      const handleError = (err: ErrorEvent) => {
        cleanup();
        this.releaseWorker(availableWorker);
        captureWasmCrashSnapshot(err?.error || err?.message || err, "wasm_worker_error_event", {
          taskId: task.taskId,
          action: task.action,
        });
        task.reject(err);
      };

      let taskTimeoutTimer: any = null;
      let heartbeatTimer: any = null;

      const cleanup = () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (taskTimeoutTimer) {
          clearTimeout(taskTimeoutTimer);
          taskTimeoutTimer = null;
        }
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
      };

      // Heartbeat Health Check Mechanism
      // Probes WASM binary responsiveness every 2 seconds, force-reloads if no heartbeat detected
      const HEARTBEAT_INTERVAL_MS = 2000;
      const HEARTBEAT_TIMEOUT_MS = 4000; // 2 consecutive missed heartbeats triggers force-reload
      availableWorker.lastHeartbeatTime = Date.now();

      const performForceReload = (timeSinceHeartbeat: number) => {
        console.warn(
          `[PDFWorkerPool] HEARTBEAT FAILURE: No heartbeat detected from ${availableWorker.id} for ${timeSinceHeartbeat}ms during ${task.action} (${task.taskId}). Force-reloading worker.`
        );

        cleanup();

        try {
          worker.terminate();
        } catch (termErr) {
          console.warn(`[PDFWorkerPool] Terminate unresponsive worker error:`, termErr);
        }

        availableWorker.reloadCount = (availableWorker.reloadCount || 0) + 1;
        try {
          if (typeof window !== "undefined" && window.Worker) {
            availableWorker.worker = new Worker(new URL("./pdfWorker.ts", import.meta.url), { type: "module" });
          }
        } catch (recreateErr) {
          console.error(`[PDFWorkerPool] Failed to instantiate fresh worker for ${availableWorker.id}:`, recreateErr);
          availableWorker.worker = null;
        }

        this.emitHeartbeat({
          workerId: availableWorker.id,
          taskId: task.taskId,
          status: "reloaded",
          latencyMs: timeSinceHeartbeat,
          timestamp: Date.now(),
          reloadCount: availableWorker.reloadCount,
        });

        const reloadError = new Error(
          `WebAssembly binary execution became unresponsive during conversion (no heartbeat detected every 2s). The worker has been force-reloaded. Please retry the operation.`
        );

        captureWasmCrashSnapshot(reloadError, "wasm_heartbeat_timeout_reload", {
          taskId: task.taskId,
          action: task.action,
          workerId: availableWorker.id,
          reloadCount: availableWorker.reloadCount,
          timeSinceHeartbeatMs: timeSinceHeartbeat,
        });

        this.releaseWorker(availableWorker);
        task.reject(reloadError);
      };

      heartbeatTimer = setInterval(() => {
        const timeSinceHeartbeat = Date.now() - availableWorker.lastHeartbeatTime;

        // Force-reload the worker if no heartbeat is detected during the conversion task
        if (timeSinceHeartbeat >= HEARTBEAT_TIMEOUT_MS) {
          performForceReload(timeSinceHeartbeat);
          return;
        }

        // Send 2-second heartbeat ping to worker
        try {
          worker.postMessage({
            type: "heartbeat_ping",
            taskId: task.taskId,
            timestamp: Date.now(),
          });
        } catch (pingErr) {
          console.warn(`[PDFWorkerPool] Failed to send heartbeat ping to worker:`, pingErr);
        }
      }, HEARTBEAT_INTERVAL_MS);

      // 120-second timeout watchdog for ultra-large files to prevent infinite lockup
      taskTimeoutTimer = setTimeout(() => {
        cleanup();
        console.warn(`[PDFWorkerPool] Task ${task.taskId} timed out after 120s. Restarting worker.`);
        try {
          worker.terminate();
        } catch {}
        availableWorker.worker = null;
        this.releaseWorker(availableWorker);
        const timeoutError = new Error("PDF conversion timed out. Try reducing file size or page count.");
        captureWasmCrashSnapshot(timeoutError, "wasm_worker_timeout_watchdog", {
          taskId: task.taskId,
          action: task.action,
        });
        task.reject(timeoutError);
      }, 120000);

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);

      const transferList = task.action === "merge" ? buffers : [buffers[0]];

      const messagePayload = {
        taskId: task.taskId,
        action: task.action,
        payload: {
          filesBuffers: buffers,
          fileBuffer: buffers[0],
          ...task.options,
        },
      };

      try {
        worker.postMessage(messagePayload, transferList);
      } catch (postErr) {
        // Fallback without transfer list in case of detached or restricted buffer cloning
        console.warn("[PDFWorkerPool] Transfer failed, falling back to structured copy:", postErr);
        worker.postMessage(messagePayload);
      }
    } catch (err) {
      this.releaseWorker(availableWorker);
      task.reject(err);
    }
  }

  /**
   * Release worker after task completion and trigger processing of remaining queue
   */
  private releaseWorker(workerInstance: WorkerInstance): void {
    workerInstance.isBusy = false;
    workerInstance.currentTaskId = null;
    this.processNextTask();
  }

  /**
   * Non-blocking async fallback when Web Worker creation is disallowed
   */
  private executeFallbackTask(task: QueuedTask, workerInstance: WorkerInstance): void {
    setTimeout(async () => {
      try {
        const { PDFDocument, degrees } = await import("pdf-lib");
        const buffers: ArrayBuffer[] = [];

        for (let i = 0; i < task.files.length; i++) {
          buffers.push(await task.files[i].arrayBuffer());
        }

        let resultBytes: Uint8Array;

        if (task.action === "merge") {
          const merged = await PDFDocument.create();
          for (let i = 0; i < buffers.length; i++) {
            const doc = await PDFDocument.load(new Uint8Array(buffers[i]), { ignoreEncryption: true });
            const pages = await merged.copyPages(doc, doc.getPageIndices());
            pages.forEach((p) => merged.addPage(p));
            if (task.onProgress) task.onProgress(Math.round(((i + 1) / buffers.length) * 85));
          }
          resultBytes = await merged.save();
        } else if (task.action === "compress") {
          const doc = await PDFDocument.load(new Uint8Array(buffers[0]), { ignoreEncryption: true });
          doc.setTitle("");
          doc.setAuthor("");
          resultBytes = await doc.save({ useObjectStreams: true });
        } else if (task.action === "rotate") {
          const doc = await PDFDocument.load(new Uint8Array(buffers[0]), { ignoreEncryption: true });
          const pages = doc.getPages();
          pages.forEach((p) => p.setRotation(degrees((p.getRotation().angle + (task.options.rotationAngle || 90)) % 360)));
          resultBytes = await doc.save();
        } else {
          const doc = await PDFDocument.load(new Uint8Array(buffers[0]), { ignoreEncryption: true });
          resultBytes = await doc.save();
        }

        if (task.onProgress) task.onProgress(100);

        const durationMs = Math.round(performance.now() - task.startTime);
        const blob = new Blob([resultBytes], { type: "application/pdf" });
        const url = registerBlobUrl(URL.createObjectURL(blob));

        this.releaseWorker(workerInstance);
        task.resolve({ blob, url, bytes: resultBytes, durationMs });
      } catch (err) {
        this.releaseWorker(workerInstance);
        task.reject(err);
      }
    }, 10);
  }

  /**
   * Terminate all worker instances and clear task queue
   */
  public destroyPool(): void {
    this.workers.forEach((w) => {
      if (w.worker) {
        w.worker.terminate();
      }
    });
    this.workers = [];
    this.taskQueue = [];
    this.initialized = false;
    console.log("[PDFWorkerPool] Worker pool destroyed.");
  }
}

// Export Singleton Instance
export const pdfWorkerPool = new PDFWorkerPool();

// Specialized Task Helper Functions
export async function compressPdfWithPool(
  file: File,
  quality: "low" | "medium" | "high" = "medium",
  onProgress?: (percent: number) => void
): Promise<PoolTaskResult> {
  return pdfWorkerPool.executeTask("compress", [file], { quality }, onProgress);
}

export async function mergePdfsWithPool(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<PoolTaskResult> {
  return pdfWorkerPool.executeTask("merge", files, {}, onProgress);
}

export async function rotatePdfWithPool(
  file: File,
  rotationAngle: number = 90,
  onProgress?: (percent: number) => void
): Promise<PoolTaskResult> {
  return pdfWorkerPool.executeTask("rotate", [file], { rotationAngle }, onProgress);
}

export async function ocrPdfWithPool(
  file: File,
  language: string = "eng",
  onProgress?: (percent: number) => void
): Promise<PoolTaskResult> {
  return pdfWorkerPool.executeTask("ocr", [file], { language }, onProgress);
}
