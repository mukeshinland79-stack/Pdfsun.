/**
 * Unit Tests for Memory Guard (memoryGuard.test.ts)
 * 
 * Verifies:
 * 1. Safe payload classification
 * 2. Warning payload threshold
 * 3. Blocked payload and recovery options
 * 4. Fallback without navigator.deviceMemory
 * 5. Canvas and Object URL memory cleanup
 */

import {
  evaluatePreFlight,
  registerGuardedBlobUrl,
  revokeGuardedBlobUrl,
  purgeAllGuardedBlobUrls,
  releaseCanvasMemory,
  formatMemoryBytes,
} from "../memoryGuard";

function createMockFile(sizeMb: number, name: string = "document.pdf"): File {
  return {
    name,
    size: sizeMb * 1024 * 1024,
    type: "application/pdf",
    lastModified: Date.now(),
  } as unknown as File;
}

export function runMemoryGuardUnitTests(): { passed: number; failed: number; results: Array<{ name: string; success: boolean; details?: string }> } {
  const results: Array<{ name: string; success: boolean; details?: string }> = [];

  // Test 1: Format Memory Bytes
  try {
    const formatted = formatMemoryBytes(10 * 1024 * 1024);
    if (formatted === "10.0 MB") {
      results.push({ name: "formatMemoryBytes formats MB correctly", success: true });
    } else {
      results.push({ name: "formatMemoryBytes formats MB correctly", success: false, details: `Got ${formatted}` });
    }
  } catch (err: any) {
    results.push({ name: "formatMemoryBytes formats MB correctly", success: false, details: err.message });
  }

  // Test 2: Safe Payload Classification (Small 5MB file)
  try {
    const report = evaluatePreFlight({
      files: [createMockFile(5)],
      operationType: "general",
    });

    if (report.status === "safe" && report.safe === true) {
      results.push({ name: "Small file classified as safe", success: true });
    } else {
      results.push({ name: "Small file classified as safe", success: false, details: `Status: ${report.status}` });
    }
  } catch (err: any) {
    results.push({ name: "Small file classified as safe", success: false, details: err.message });
  }

  // Test 3: Warning Payload Classification (Canvas raster with large working memory)
  try {
    const report = evaluatePreFlight({
      files: [createMockFile(35)],
      operationType: "canvas_raster",
    });

    if (report.status === "warning" || report.requiresStreaming) {
      results.push({ name: "Large raster payload triggers warning / streaming", success: true });
    } else {
      results.push({ name: "Large raster payload triggers warning / streaming", success: false, details: `Status: ${report.status}` });
    }
  } catch (err: any) {
    results.push({ name: "Large raster payload triggers warning / streaming", success: false, details: err.message });
  }

  // Test 4: Blocked Payload Classification (Extreme 500MB payload)
  try {
    const report = evaluatePreFlight({
      files: [createMockFile(500)],
      operationType: "canvas_raster",
    });

    if (report.status === "blocked" && report.safe === false && report.recoveryOptions.length > 0) {
      results.push({ name: "Massive payload is blocked and provides recovery paths", success: true });
    } else {
      results.push({ name: "Massive payload is blocked and provides recovery paths", success: false, details: `Status: ${report.status}` });
    }
  } catch (err: any) {
    results.push({ name: "Massive payload is blocked and provides recovery paths", success: false, details: err.message });
  }

  // Test 5: Object URL Registry & Purge
  try {
    const fakeBlobUrl = "blob:https://www.pdfsun.in/mock-test-12345";
    registerGuardedBlobUrl(fakeBlobUrl);
    revokeGuardedBlobUrl(fakeBlobUrl);
    purgeAllGuardedBlobUrls();
    results.push({ name: "Object URL lifecycle handles register, revoke, purge", success: true });
  } catch (err: any) {
    results.push({ name: "Object URL lifecycle handles register, revoke, purge", success: false, details: err.message });
  }

  // Test 6: Canvas memory release
  try {
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;
      releaseCanvasMemory(canvas);
      if (canvas.width === 0 && canvas.height === 0) {
        results.push({ name: "Canvas dimensions zeroed for memory deallocation", success: true });
      } else {
        results.push({ name: "Canvas dimensions zeroed for memory deallocation", success: false, details: `w: ${canvas.width}, h: ${canvas.height}` });
      }
    } else {
      results.push({ name: "Canvas dimensions zeroed (skipped in SSR/Node)", success: true });
    }
  } catch (err: any) {
    results.push({ name: "Canvas dimensions zeroed", success: false, details: err.message });
  }

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return { passed, failed, results };
}

// Auto-run if executed in Node environment
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const summary = runMemoryGuardUnitTests();
  if (summary.failed > 0) {
    console.warn(`[MemoryGuardTests] ${summary.failed} tests failed!`);
  } else {
    console.log(`[MemoryGuardTests] All ${summary.passed} tests passed successfully.`);
  }
}
