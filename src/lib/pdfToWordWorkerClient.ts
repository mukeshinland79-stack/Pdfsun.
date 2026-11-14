/**
 * PDFSun.in — Web Worker Client Bridge for Enterprise PDF-to-Word Engine
 * Manages background worker execution with progress relay, complete option forwarding,
 * result normalization, and synchronous fallback.
 */

import {
  convertPdfToWordEnterprise,
  PdfToWordOptions as EnterprisePdfToWordOptions,
  PdfToWordResult as EnterprisePdfToWordResult,
} from "./enterprisePdfToWordEngine";

export type { EnterprisePdfToWordOptions, EnterprisePdfToWordResult };

export async function convertPdfToWordViaWorker(
  file: File,
  options: EnterprisePdfToWordOptions = {}
): Promise<EnterprisePdfToWordResult> {
  const canUseWorker =
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    typeof Blob !== "undefined" &&
    typeof File !== "undefined";

  if (!canUseWorker) {
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
        convertPdfToWordEnterprise(file, options).then(resolve).catch(reject);
      }, 150000);

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
          // Preserve genuine validation failures cleanly instead of masking corrupt file errors
          const errMsg = String(data.error || "");
          if (/Invalid PDF|Missing %PDF-|too small/i.test(errMsg)) {
            reject(new Error(errMsg));
            return;
          }
          convertPdfToWordEnterprise(file, options).then(resolve).catch(reject);
        }
      };

      worker.onerror = () => {
        clearTimeout(timer);
        if (worker) {
          worker.terminate();
          worker = null;
        }
        convertPdfToWordEnterprise(file, options).then(resolve).catch(reject);
      };

      worker.postMessage(
        {
          id: requestId,
          type: "CONVERT_PDF_TO_WORD",
          fileBuffer: buffer,
          fileName: file.name,
          options: {
            preset: options.preset,
            reconstructionMode: options.reconstructionMode,
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
  } catch {
    if (worker) {
      try {
        worker.terminate();
      } catch {}
    }
    return convertPdfToWordEnterprise(file, options);
  }
}
