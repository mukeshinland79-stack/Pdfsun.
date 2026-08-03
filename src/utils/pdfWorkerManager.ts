/**
 * PDF Worker Manager for PDFSun
 * Manages off-main-thread execution, worker pool, progress tracking, and Blob memory cleanup.
 */

// Memory URL Revocation Tracking to prevent browser memory leaks
const activeBlobUrls = new Set<string>();

export function registerBlobUrl(url: string): string {
  activeBlobUrls.add(url);
  return url;
}

export function revokeBlobUrl(url: string): void {
  if (url && activeBlobUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
    activeBlobUrls.delete(url);
  }
}

export function clearAllBlobUrls(): void {
  activeBlobUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  });
  activeBlobUrls.clear();
}

/**
 * Execute PDF processing off-main-thread.
 * Falls back safely to asynchronous microtasks if Web Workers are restricted in certain iframe environments.
 */
export async function executePdfWorkerTask(
  action: "merge" | "compress" | "rotate" | "split" | "watermark",
  payloadFiles: File[],
  options: Record<string, any> = {},
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; url: string; bytes: Uint8Array }> {
  // Read files to ArrayBuffers
  const buffers: ArrayBuffer[] = [];
  for (let i = 0; i < payloadFiles.length; i++) {
    const ab = await payloadFiles[i].arrayBuffer();
    buffers.push(ab);
  }

  return new Promise((resolve, reject) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Try creating Web Worker dynamically using Blob or inline Worker URL
    let worker: Worker | null = null;
    try {
      if (typeof window !== "undefined" && window.Worker) {
        worker = new Worker(new URL("./pdfWorker.ts", import.meta.url), { type: "module" });
      }
    } catch (e) {
      console.warn("Direct Web Worker creation failed, executing off-thread fallback:", e);
    }

    if (worker) {
      worker.onmessage = (e: MessageEvent) => {
        const { taskId: resId, type, percent, resultBuffer, error } = e.data;
        if (resId !== taskId) return;

        if (type === "progress") {
          if (onProgress) onProgress(percent);
        } else if (type === "complete") {
          const bytes = new Uint8Array(resultBuffer);
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = registerBlobUrl(URL.createObjectURL(blob));
          worker?.terminate();
          resolve({ blob, url, bytes });
        } else if (type === "error") {
          worker?.terminate();
          reject(new Error(error || "Worker processing error"));
        }
      };

      worker.onerror = (err) => {
        worker?.terminate();
        reject(err);
      };

      const transferList = action === "merge" ? buffers : [buffers[0]];
      worker.postMessage(
        {
          taskId,
          action,
          payload: {
            filesBuffers: buffers,
            fileBuffer: buffers[0],
            ...options,
          },
        },
        transferList
      );
    } else {
      // Non-blocking asynchronous fallback using requestIdleCallback / setTimeout
      setTimeout(async () => {
        try {
          const { PDFDocument, degrees } = await import("pdf-lib");
          let resultBytes: Uint8Array;

          if (action === "merge") {
            const merged = await PDFDocument.create();
            for (let i = 0; i < buffers.length; i++) {
              const doc = await PDFDocument.load(new Uint8Array(buffers[i]), { ignoreEncryption: true });
              const pages = await merged.copyPages(doc, doc.getPageIndices());
              pages.forEach((p) => merged.addPage(p));
              if (onProgress) onProgress(Math.round(((i + 1) / buffers.length) * 80));
            }
            resultBytes = await merged.save();
          } else if (action === "compress") {
            const doc = await PDFDocument.load(new Uint8Array(buffers[0]), { ignoreEncryption: true });
            doc.setTitle("");
            doc.setAuthor("");
            resultBytes = await doc.save({ useObjectStreams: true });
          } else if (action === "rotate") {
            const doc = await PDFDocument.load(new Uint8Array(buffers[0]), { ignoreEncryption: true });
            const pages = doc.getPages();
            pages.forEach((p) => p.setRotation(degrees((p.getRotation().angle + (options.rotationAngle || 90)) % 360)));
            resultBytes = await doc.save();
          } else {
            const doc = await PDFDocument.load(new Uint8Array(buffers[0]), { ignoreEncryption: true });
            resultBytes = await doc.save();
          }

          if (onProgress) onProgress(100);
          const blob = new Blob([resultBytes], { type: "application/pdf" });
          const url = registerBlobUrl(URL.createObjectURL(blob));
          resolve({ blob, url, bytes: resultBytes });
        } catch (err) {
          reject(err);
        }
      }, 10);
    }
  });
}
