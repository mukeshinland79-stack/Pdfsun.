/**
 * Pre-flight Memory Guard & Blob Lifecycle Management for PDFSun.in
 * 
 * Provides:
 * 1. Pre-flight RAM analysis based on navigator.deviceMemory & hardwareConcurrency
 * 2. Classifies pre-flight into: safe | warning | blocked
 * 3. Operation-aware pressure estimation (canvas rasterization, OCR vs binary parsing)
 * 4. Recovery paths (split PDF, compress first, lower DPI, process selected pages, ZIP output)
 * 5. Canvas and Blob lifecycle cleanup (width=0, height=0, revokeObjectURL)
 */

export type PreFlightStatus = "safe" | "warning" | "blocked";
export type OperationType = "canvas_raster" | "binary_pdf" | "ocr" | "conversion" | "general";

export interface RecoveryOption {
  id: "compress" | "split" | "lower_dpi" | "select_pages" | "zip_stream";
  label: string;
  actionUrl?: string;
  recommended: boolean;
}

export interface MemorySafetyReport {
  status: PreFlightStatus;
  safe: boolean;
  severity: "none" | "info" | "warning" | "danger";
  requiresStreaming: boolean;
  recommendedChunkSize: number; // in bytes
  warningMessage?: string;
  recoveryOptions: RecoveryOption[];
  deviceMemoryGb: number;
  hardwareConcurrency: number;
  totalSizeBytes: number;
  totalSizeMb: number;
  formattedTotalSize: string;
  filesCount: number;
  estimatedMemoryPressureMb: number;
}

// Global registry of active object URLs to guarantee revocation and zero memory leaks
const trackedObjectUrls = new Set<string>();

/**
 * Register a Blob Object URL in the Memory Guard registry.
 */
export function registerGuardedBlobUrl(url: string): string {
  if (url && typeof url === "string" && url.startsWith("blob:")) {
    trackedObjectUrls.add(url);
  }
  return url;
}

/**
 * Explicitly revoke a Blob Object URL and release browser memory.
 */
export function revokeGuardedBlobUrl(url: string): void {
  if (url && trackedObjectUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("[MemoryGuard] Error revoking Blob URL:", e);
    }
    trackedObjectUrls.delete(url);
  }
}

/**
 * Revoke all registered Blob Object URLs currently in memory.
 */
export function purgeAllGuardedBlobUrls(): void {
  trackedObjectUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  });
  trackedObjectUrls.clear();
}

/**
 * Immediately frees GPU/RAM resources held by an HTML5 canvas.
 * Setting width and height to 0 unallocates bitmap memory buffers in Chrome/Safari/Firefox.
 */
export function releaseCanvasMemory(canvas: HTMLCanvasElement | null | undefined): void {
  if (!canvas) return;
  try {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  } catch (err) {
    console.warn("[MemoryGuard] Error releasing canvas memory:", err);
  }
}

// Set up automatic cleanup on page unload / pagehide
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    purgeAllGuardedBlobUrls();
  });
}

/**
 * Format bytes into human-friendly string (KB, MB, GB).
 */
export function formatMemoryBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export interface PreFlightOptions {
  files: File[];
  operationType?: OperationType;
  estimatedPages?: number;
}

/**
 * Comprehensive pre-flight memory estimation that classifies into safe, warning, or blocked.
 * Calculates memory multipliers based on operation type (e.g., rasterizing canvas requires 4-8x file size in raw RGBA bitmap).
 */
export function evaluatePreFlight(options: PreFlightOptions): MemorySafetyReport {
  const { files, operationType = "general", estimatedPages = 0 } = options;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMb = totalSizeBytes / (1024 * 1024);
  const formattedTotalSize = formatMemoryBytes(totalSizeBytes);
  const filesCount = files.length;

  // Retrieve client device memory (GB) or assume 4GB standard baseline if undefined
  let deviceMemoryGb = 4;
  if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
    const mem = Number((navigator as any).deviceMemory);
    if (!isNaN(mem) && mem > 0) {
      deviceMemoryGb = mem;
    }
  }

  // Retrieve concurrency
  let hardwareConcurrency = 4;
  if (typeof navigator !== "undefined" && "hardwareConcurrency" in navigator) {
    hardwareConcurrency = navigator.hardwareConcurrency || 4;
  }

  // Calculate memory multiplier based on operation type:
  // - canvas_raster / ocr: A single A4 page rendered at 200 DPI produces ~35MB raw RGBA bitmap in memory.
  // - conversion / binary_pdf: typically 2x - 3x buffer overhead.
  let multiplier = 2;
  if (operationType === "canvas_raster" || operationType === "ocr") {
    multiplier = 6;
  } else if (operationType === "conversion") {
    multiplier = 3.5;
  }

  const estimatedPressureMb = totalSizeMb * multiplier + (estimatedPages > 0 ? estimatedPages * 15 : 0);

  // Recommended chunk size based on RAM
  let recommendedChunkSize = 5 * 1024 * 1024;
  if (deviceMemoryGb <= 2) {
    recommendedChunkSize = 2 * 1024 * 1024;
  } else if (deviceMemoryGb >= 8) {
    recommendedChunkSize = 10 * 1024 * 1024;
  }

  const recoveryOptions: RecoveryOption[] = [];

  // Determine Safe Thresholds relative to device RAM
  // Available browser heap is typically ~25%-35% of total device RAM
  const safeHeapLimitMb = (deviceMemoryGb * 1024) * 0.3;
  const hardBlockedLimitMb = (deviceMemoryGb * 1024) * 0.65;

  let status: PreFlightStatus = "safe";
  let severity: "none" | "info" | "warning" | "danger" = "none";
  let requiresStreaming = false;
  let warningMessage: string | undefined;

  if (estimatedPressureMb > hardBlockedLimitMb || (deviceMemoryGb <= 2 && totalSizeMb > 120) || totalSizeMb > 450) {
    status = "blocked";
    severity = "danger";
    requiresStreaming = true;
    warningMessage = `Document payload (${formattedTotalSize}, ~${Math.round(estimatedPressureMb)} MB working memory) exceeds safe execution quota for this device (${deviceMemoryGb}GB RAM). Processing would trigger a browser crash.`;
    
    recoveryOptions.push(
      { id: "compress", label: "Compress PDF First (Reduce Size)", actionUrl: "/compress-pdf", recommended: true },
      { id: "split", label: "Split PDF into Smaller Batches", actionUrl: "/split-pdf", recommended: true },
      { id: "lower_dpi", label: "Lower Resolution / DPI", recommended: false },
      { id: "select_pages", label: "Process Selected Pages", recommended: false }
    );
  } else if (estimatedPressureMb > safeHeapLimitMb || (deviceMemoryGb <= 2 && totalSizeMb > 30) || totalSizeMb > 80) {
    status = "warning";
    severity = "warning";
    requiresStreaming = true;
    warningMessage = `Large document batch detected (${formattedTotalSize}). Memory Guard activated single-page streaming buffers to prevent slowdown.`;

    recoveryOptions.push(
      { id: "compress", label: "Compress First", actionUrl: "/compress-pdf", recommended: false },
      { id: "zip_stream", label: "Stream Output as ZIP", recommended: true }
    );
  } else if (totalSizeMb > 25) {
    status = "safe";
    severity = "info";
    requiresStreaming = true;
    warningMessage = `Document batch (${formattedTotalSize}) running with active memory protection.`;
  }

  return {
    status,
    safe: status !== "blocked",
    severity,
    requiresStreaming,
    recommendedChunkSize,
    warningMessage,
    recoveryOptions,
    deviceMemoryGb,
    hardwareConcurrency,
    totalSizeBytes,
    totalSizeMb,
    formattedTotalSize,
    filesCount,
    estimatedMemoryPressureMb: Math.round(estimatedPressureMb),
  };
}

/**
 * Backward compatible alias for evaluateMemorySafety
 */
export function evaluateMemorySafety(files: File[]): MemorySafetyReport {
  return evaluatePreFlight({ files, operationType: "general" });
}
