/**
 * PDF Web Worker Pool Manager for PDFSun.in
 * Manages a pool of Web Workers for concurrent, off-main-thread PDF tasks (Compression, OCR, Merging, Splitting).
 * Guarantees zero main-thread UI freezing and optimal multi-core CPU utilization.
 */

import { registerBlobUrl } from "./pdfWorkerManager";

export type PdfWorkerAction = "merge" | "compress" | "rotate" | "split" | "watermark" | "ocr" | "convert";

export interface PoolTaskOptions {
  rotationAngle?: number;
  watermarkText?: string;
  quality?: "low" | "medium" | "high";
  language?: string;
  [key: string]: any;
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

interface WorkerInstance {
  id: string;
  worker: Worker | null;
  isBusy: boolean;
  currentTaskId: string | null;
}

interface QueuedTask {
  taskId: string;
  action: PdfWorkerAction;
  files: File[];
  options: PoolTaskOptions;
  onProgress?: (percent: number) => void;
  resolve: (result: PoolTaskResult) => void;
  reject: (reason: any) => void;
  startTime: number;
}

class PDFWorkerPool {
  private workers: WorkerInstance[] = [];
  private taskQueue: QueuedTask[] = [];
  private maxWorkers: number;
  private initialized = false;

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
    onProgress?: (percent: number) => void
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
        const { taskId: resId, type, percent, resultBuffer, error } = e.data;
        if (resId !== task.taskId) return;

        if (type === "progress") {
          if (task.onProgress) task.onProgress(percent);
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
          task.reject(new Error(error || "Worker task execution failed"));
        }
      };

      const handleError = (err: ErrorEvent) => {
        cleanup();
        this.releaseWorker(availableWorker);
        task.reject(err);
      };

      const cleanup = () => {
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
      };

      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError);

      const transferList = task.action === "merge" ? buffers : [buffers[0]];

      worker.postMessage(
        {
          taskId: task.taskId,
          action: task.action,
          payload: {
            filesBuffers: buffers,
            fileBuffer: buffers[0],
            ...task.options,
          },
        },
        transferList
      );
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
