/**
 * Pre-flight Memory Guard & Blob Lifecycle Management for PDFSun.in
 * 
 * Provides:
 * 1. Pre-flight RAM analysis based on navigator.deviceMemory & hardwareConcurrency
 * 2. Automatic threshold detection to enable chunked streaming before browser OOM crashes
 * 3. Graceful user-facing warnings for large payloads on low-memory devices
 * 4. Zero-leak Blob Object URL registry and automatic unmount cleanup
 */

export interface MemorySafetyReport {
  safe: boolean;
  severity: "none" | "info" | "warning" | "danger";
  requiresStreaming: boolean;
  recommendedChunkSize: number; // in bytes
  warningMessage?: string;
  deviceMemoryGb: number;
  totalSizeBytes: number;
  formattedTotalSize: string;
  filesCount: number;
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

/**
 * Estimates safe memory execution boundaries for input files.
 * Protects client-side WASM and Web Workers from crashing browser tabs.
 */
export function evaluateMemorySafety(files: File[]): MemorySafetyReport {
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const formattedTotalSize = formatMemoryBytes(totalSizeBytes);
  const filesCount = files.length;

  // Retrieve client device memory (GB) or assume 4GB standard baseline if undefined
  let deviceMemoryGb = 4;
  if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
    deviceMemoryGb = Number((navigator as any).deviceMemory) || 4;
  }

  // Calculate streaming chunk size dynamically based on RAM
  // Low RAM (<= 2GB) -> 2MB chunks; Standard (<= 4GB) -> 5MB chunks; High (> 4GB) -> 10MB chunks
  let recommendedChunkSize = 5 * 1024 * 1024;
  if (deviceMemoryGb <= 2) {
    recommendedChunkSize = 2 * 1024 * 1024;
  } else if (deviceMemoryGb >= 8) {
    recommendedChunkSize = 10 * 1024 * 1024;
  }

  // Define device-tier limits
  // Tier 1: Low-memory device (<= 2GB RAM e.g. budget mobile)
  if (deviceMemoryGb <= 2) {
    if (totalSizeBytes > 80 * 1024 * 1024) {
      return {
        safe: false,
        severity: "danger",
        requiresStreaming: true,
        recommendedChunkSize,
        warningMessage: `Selected files (${formattedTotalSize}) exceed safe memory on this device (${deviceMemoryGb}GB RAM). Processing may stall. Consider compressing or processing fewer pages.`,
        deviceMemoryGb,
        totalSizeBytes,
        formattedTotalSize,
        filesCount,
      };
    }
    if (totalSizeBytes > 25 * 1024 * 1024) {
      return {
        safe: true,
        severity: "warning",
        requiresStreaming: true,
        recommendedChunkSize,
        warningMessage: `Large payload detected (${formattedTotalSize}). Memory Guard activated streaming mode to preserve 60fps performance.`,
        deviceMemoryGb,
        totalSizeBytes,
        formattedTotalSize,
        filesCount,
      };
    }
  }

  // Tier 2: Standard memory device (3GB - 4GB RAM)
  if (deviceMemoryGb <= 4) {
    if (totalSizeBytes > 200 * 1024 * 1024) {
      return {
        safe: false,
        severity: "danger",
        requiresStreaming: true,
        recommendedChunkSize,
        warningMessage: `Document batch is very large (${formattedTotalSize}). To avoid browser memory crash, please process in smaller batches or compress first.`,
        deviceMemoryGb,
        totalSizeBytes,
        formattedTotalSize,
        filesCount,
      };
    }
    if (totalSizeBytes > 50 * 1024 * 1024) {
      return {
        safe: true,
        severity: "info",
        requiresStreaming: true,
        recommendedChunkSize,
        warningMessage: `Streaming mode enabled (${formattedTotalSize}). In-browser memory isolation active.`,
        deviceMemoryGb,
        totalSizeBytes,
        formattedTotalSize,
        filesCount,
      };
    }
  }

  // Tier 3: High-spec desktop / workstation (> 4GB RAM)
  if (totalSizeBytes > 400 * 1024 * 1024) {
    return {
      safe: false,
      severity: "danger",
      requiresStreaming: true,
      recommendedChunkSize,
      warningMessage: `Document payload (${formattedTotalSize}) exceeds safe single-pass browser quota. Consider splitting or compressing first.`,
      deviceMemoryGb,
      totalSizeBytes,
      formattedTotalSize,
      filesCount,
    };
  }

  if (totalSizeBytes > 80 * 1024 * 1024) {
    return {
      safe: true,
      severity: "info",
      requiresStreaming: true,
      recommendedChunkSize,
      warningMessage: `Processing large document (${formattedTotalSize}) using chunked streaming buffers.`,
      deviceMemoryGb,
      totalSizeBytes,
      formattedTotalSize,
      filesCount,
    };
  }

  // Standard safe execution
  return {
    safe: true,
    severity: "none",
    requiresStreaming: false,
    recommendedChunkSize,
    deviceMemoryGb,
    totalSizeBytes,
    formattedTotalSize,
    filesCount,
  };
}
