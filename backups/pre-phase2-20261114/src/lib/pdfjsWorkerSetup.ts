/**
 * Unified Local PDF.js Worker Configuration Utility
 *
 * Ensures every PDF processing, preview, and thumbnail module uses the locally
 * bundled pdfjs-dist worker asset served from the same origin ('self'),
 * preventing external CDN failures, version mismatches, fake-worker fallbacks,
 * and Content-Security-Policy worker-src violations.
 */

let cachedLocalWorkerUrl: string | null = null;

function isBrowserOrWebWorkerRuntime(): boolean {
  if (typeof window !== "undefined") return true;
  if (typeof self !== "undefined") {
    return typeof process === "undefined" || !process?.versions?.node;
  }
  return false;
}

export function getLocalPdfJsWorkerUrl(): string {
  if (cachedLocalWorkerUrl !== null) {
    return cachedLocalWorkerUrl;
  }

  if (!isBrowserOrWebWorkerRuntime()) {
    cachedLocalWorkerUrl = "";
    return cachedLocalWorkerUrl;
  }

  try {
    cachedLocalWorkerUrl = new URL(
      "../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).href;
    return cachedLocalWorkerUrl;
  } catch (err) {
    throw new Error(
      `[PDFSun] Failed to resolve locally bundled PDF.js worker asset: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

export function ensurePdfJsWorkerConfigured<T extends { GlobalWorkerOptions?: { workerSrc?: string } }>(
  pdfjsModule: T
): T {
  if (!isBrowserOrWebWorkerRuntime()) {
    return pdfjsModule;
  }

  const workerOptions = pdfjsModule?.GlobalWorkerOptions;
  if (!workerOptions) {
    throw new Error("[PDFSun] pdfjs-dist GlobalWorkerOptions is unavailable; cannot initialize PDF worker.");
  }

  const localWorkerUrl = getLocalPdfJsWorkerUrl();
  if (!localWorkerUrl) {
    throw new Error("[PDFSun] Local PDF.js worker URL resolved to an empty string.");
  }

  // Always enforce the same-origin bundled worker and override any empty or external CDN workerSrc.
  if (workerOptions.workerSrc !== localWorkerUrl) {
    workerOptions.workerSrc = localWorkerUrl;
  }

  return pdfjsModule;
}
