/**
 * PDFSun.in — Phase 20 Web Worker Client Bridge
 * Manages background worker execution with progress relay and synchronous fallback
 */

import {
  convertPdfToWordEnterprise,
  EnterprisePdfToWordOptions,
  EnterprisePdfToWordResult,
} from "./enterprisePdfToWordEngine";

export async function convertPdfToWordViaWorker(
  file: File,
  options: EnterprisePdfToWordOptions = {}
): Promise<EnterprisePdfToWordResult> {
  // Check if Web Workers and ES modules in workers are supported in the current environment
  const canUseWorker =
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    typeof Blob !== "undefined" &&
    typeof File !== "undefined";

  if (!canUseWorker) {
    // Graceful fallback: run directly on the current thread
    return convertPdfToWordEnterprise(file, options);
  }

  let worker: Worker | null = null;
  const requestId = `p2w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    worker = new Worker(
      new URL("../workers/pdfToWord.worker.ts", import.meta.url),
      { type: "module" }
    );

    const buffer = await file.arrayBuffer();

    return await new Promise<EnterprisePdfToWordResult>((resolve, reject) => {
      if (!worker) {
        return reject(new Error("Worker initialization failed"));
      }

      const timer = setTimeout(() => {
        if (worker) {
          worker.terminate();
          worker = null;
        }
        // If worker times out (e.g. stuck script), fall back to synchronous execution
        convertPdfToWordEnterprise(file, options).then(resolve).catch(reject);
      }, 120000); // 2 minute maximum timeout

      worker.onmessage = (e: MessageEvent) => {
        const data = e.data;
        if (!data || data.id !== requestId) return;

        if (data.type === "PROGRESS") {
          if (options.onProgress) {
            options.onProgress(data.progress, data.message);
          }
        } else if (data.type === "SUCCESS") {
          clearTimeout(timer);
          if (worker) {
            worker.terminate();
            worker = null;
          }
          resolve(data.result as EnterprisePdfToWordResult);
        } else if (data.type === "ERROR") {
          clearTimeout(timer);
          if (worker) {
            worker.terminate();
            worker = null;
          }
          // On worker-level error, attempt synchronous fallback before rejecting
          console.warn("[pdfToWordWorkerClient] Worker error, falling back to direct engine:", data.error);
          convertPdfToWordEnterprise(file, options).then(resolve).catch(reject);
        }
      };

      worker.onerror = (err) => {
        clearTimeout(timer);
        if (worker) {
          worker.terminate();
          worker = null;
        }
        console.warn("[pdfToWordWorkerClient] Worker error event, falling back to direct engine:", err);
        convertPdfToWordEnterprise(file, options).then(resolve).catch(reject);
      };

      // Post the message transferring the buffer
      worker.postMessage(
        {
          id: requestId,
          type: "CONVERT_PDF_TO_WORD",
          fileBuffer: buffer,
          fileName: file.name,
          options: {
            preset: options.preset,
            preserveImages: options.preserveImages,
            dpiQuality: options.dpiQuality,
            preserveTables: options.preserveTables,
            enableOcrFallback: options.enableOcrFallback,
            detectionMode: options.detectionMode,
            documentProfile: options.documentProfile,
          },
        },
        [buffer]
      );
    });
  } catch (initErr) {
    console.warn("[pdfToWordWorkerClient] Could not spawn worker, falling back to direct engine:", initErr);
    if (worker) {
      try {
        worker.terminate();
      } catch {}
    }
    return convertPdfToWordEnterprise(file, options);
  }
}
