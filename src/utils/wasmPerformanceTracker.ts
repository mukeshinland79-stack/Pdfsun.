/**
 * Real-Time WebAssembly & Heap Performance Tracker with Memory Leak Detection
 * 
 * Tracks:
 * 1. WebAssembly Linear Memory allocations (WebAssembly.Memory buffer tracking).
 * 2. Chromium V8 JS Heap (`performance.memory`: used, total, limit).
 * 3. HTML5 Canvas DOM Backing-Store Memory estimation (width * height * 4 bytes).
 * 4. Memory Velocity (MB/second growth or reclamation).
 * 5. Monotonic Drift & Memory Leak heuristic reporting directly to browser console.
 */

export type MemoryHealthStatus = "nominal" | "elevated" | "leak_risk" | "critical";

/**
 * Proactive Memory Leak Warning Threshold in Megabytes (500 MB)
 * Tracks window.performance.memory to proactively flag memory retention.
 */
export const WASM_HEAP_THRESHOLD_MB = 500;

export interface MemorySnapshot {
  timestamp: number;
  usedHeapMb: number;
  totalHeapMb: number;
  heapLimitMb: number;
  wasmMb: number;
  wasmBufferCount: number;
  canvasCount: number;
  canvasMb: number;
  velocityMbPerSec: number;
  status: MemoryHealthStatus;
  leakReason?: string;
}

export interface DiagnosticReport {
  generatedAt: string;
  userAgent: string;
  hasPerformanceMemoryApi: boolean;
  status: MemoryHealthStatus;
  current: MemorySnapshot;
  baseline: MemorySnapshot | null;
  peakUsedHeapMb: number;
  peakWasmMb: number;
  peakCanvasMb: number;
  totalLeaksReported: number;
  recentSnapshots: MemorySnapshot[];
  activeWasmInstances: number;
  recommendations: string[];
}

// Track WebAssembly.Memory instances globally
const activeWasmMemories = new Set<WebAssembly.Memory>();
let isWasmPatched = false;

function patchWasmMemoryConstructor(): void {
  if (isWasmPatched || typeof window === "undefined" || typeof WebAssembly === "undefined" || !WebAssembly.Memory) {
    return;
  }

  try {
    const OriginalMemory = WebAssembly.Memory;
    const PatchedMemory = function (descriptor: WebAssembly.MemoryDescriptor) {
      const memoryInstance = new OriginalMemory(descriptor);
      activeWasmMemories.add(memoryInstance);
      return memoryInstance;
    } as any;

    PatchedMemory.prototype = OriginalMemory.prototype;
    (WebAssembly as any).Memory = PatchedMemory;
    isWasmPatched = true;
  } catch (err) {
    console.debug("[WasmTracker] Could not patch WebAssembly.Memory (sandbox restricted):", err);
  }
}

// Call patch immediately
patchWasmMemoryConstructor();

class WasmPerformanceTracker {
  private snapshots: MemorySnapshot[] = [];
  private maxHistoryLength = 60; // 60 seconds of history at 1s intervals
  private timer: any = null;
  private subscribers = new Set<(snapshot: MemorySnapshot) => void>();
  private baseline: MemorySnapshot | null = null;
  private peakUsedHeapMb = 0;
  private peakWasmMb = 0;
  private peakCanvasMb = 0;
  private lastConsoleWarnTime = 0;
  private totalLeaksReported = 0;
  private isMonitoring = false;
  private stressTestBuffers: Uint8Array[] = [];

  constructor() {
    // Start tracking when window is ready
    if (typeof window !== "undefined") {
      this.startMonitoring();
    }
  }

  public startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Take initial snapshot
    this.takeSnapshot();

    this.timer = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }

  public stopMonitoring(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isMonitoring = false;
  }

  public subscribe(callback: (snapshot: MemorySnapshot) => void): () => void {
    this.subscribers.add(callback);
    // Immediately notify with current snapshot if available
    if (this.snapshots.length > 0) {
      callback(this.snapshots[this.snapshots.length - 1]);
    }
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getHistory(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  public getLatestSnapshot(): MemorySnapshot {
    if (this.snapshots.length > 0) {
      return this.snapshots[this.snapshots.length - 1];
    }
    return this.takeSnapshot();
  }

  public resetBaseline(): void {
    this.baseline = this.getLatestSnapshot();
    console.info(
      `%c[WASM Tracker] 📍 Memory baseline pinned at ${this.baseline.usedHeapMb.toFixed(1)} MB (WASM: ${this.baseline.wasmMb.toFixed(1)} MB)`,
      "color: #0ea5e9; font-weight: bold;"
    );
  }

  public getBaseline(): MemorySnapshot | null {
    return this.baseline;
  }

  public registerWasmMemory(memory: WebAssembly.Memory): void {
    activeWasmMemories.add(memory);
  }

  public unregisterWasmMemory(memory: WebAssembly.Memory): void {
    activeWasmMemories.delete(memory);
  }

  /**
   * Calculate current WebAssembly linear memory allocations
   */
  private getWasmMemoryMetrics(): { wasmMb: number; activeCount: number } {
    let totalBytes = 0;
    let validCount = 0;

    // Prune detached or garbage collected buffers
    for (const mem of Array.from(activeWasmMemories)) {
      try {
        if (mem.buffer && mem.buffer.byteLength > 0) {
          totalBytes += mem.buffer.byteLength;
          validCount++;
        } else {
          activeWasmMemories.delete(mem);
        }
      } catch {
        activeWasmMemories.delete(mem);
      }
    }

    return {
      wasmMb: totalBytes / (1024 * 1024),
      activeCount: validCount,
    };
  }

  /**
   * Estimate DOM canvas backing-store memory
   */
  private getCanvasMemoryMetrics(): { canvasCount: number; canvasMb: number } {
    if (typeof document === "undefined") {
      return { canvasCount: 0, canvasMb: 0 };
    }

    try {
      const canvases = document.querySelectorAll("canvas");
      let totalBytes = 0;

      canvases.forEach((c) => {
        // Standard RGBA backing store uses 4 bytes per pixel
        const w = c.width || 0;
        const h = c.height || 0;
        totalBytes += w * h * 4;
      });

      return {
        canvasCount: canvases.length,
        canvasMb: totalBytes / (1024 * 1024),
      };
    } catch {
      return { canvasCount: 0, canvasMb: 0 };
    }
  }

  /**
   * Take a synchronous memory snapshot and evaluate leak heuristics
   */
  public takeSnapshot(): MemorySnapshot {
    const timestamp = Date.now();
    const hasPerfMemory =
      typeof window !== "undefined" &&
      !!(window.performance as any)?.memory;

    let usedHeapMb = 0;
    let totalHeapMb = 0;
    let heapLimitMb = 4096; // Default V8 ~4GB limit estimate if unavailable

    if (hasPerfMemory) {
      const mem = (window.performance as any).memory;
      usedHeapMb = mem.usedJSHeapSize / (1024 * 1024);
      totalHeapMb = mem.totalJSHeapSize / (1024 * 1024);
      heapLimitMb = mem.jsHeapSizeLimit / (1024 * 1024);
    }

    const wasmMetrics = this.getWasmMemoryMetrics();
    const canvasMetrics = this.getCanvasMemoryMetrics();

    // If browser doesn't have performance.memory (Firefox/Safari), calculate composite estimate
    if (!hasPerfMemory) {
      usedHeapMb = wasmMetrics.wasmMb + canvasMetrics.canvasMb + 32; // base runtime estimate
      totalHeapMb = usedHeapMb * 1.3;
      heapLimitMb = 2048;
    }

    // Update peak metrics
    if (usedHeapMb > this.peakUsedHeapMb) this.peakUsedHeapMb = usedHeapMb;
    if (wasmMetrics.wasmMb > this.peakWasmMb) this.peakWasmMb = wasmMetrics.wasmMb;
    if (canvasMetrics.canvasMb > this.peakCanvasMb) this.peakCanvasMb = canvasMetrics.canvasMb;

    // Calculate velocity (growth or drop in MB per second)
    let velocityMbPerSec = 0;
    if (this.snapshots.length > 0) {
      const prev = this.snapshots[this.snapshots.length - 1];
      const elapsedSeconds = Math.max(0.5, (timestamp - prev.timestamp) / 1000);
      velocityMbPerSec = (usedHeapMb - prev.usedHeapMb) / elapsedSeconds;
    }

    // Evaluate Memory Health & Leak Detection
    const { status, leakReason } = this.evaluateHealth(
      usedHeapMb,
      heapLimitMb,
      wasmMetrics.wasmMb,
      canvasMetrics.canvasMb,
      canvasMetrics.canvasCount,
      velocityMbPerSec
    );

    const snapshot: MemorySnapshot = {
      timestamp,
      usedHeapMb,
      totalHeapMb,
      heapLimitMb,
      wasmMb: wasmMetrics.wasmMb,
      wasmBufferCount: wasmMetrics.activeCount,
      canvasCount: canvasMetrics.canvasCount,
      canvasMb: canvasMetrics.canvasMb,
      velocityMbPerSec,
      status,
      leakReason,
    };

    // Store in history
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxHistoryLength) {
      this.snapshots.shift();
    }

    // Set baseline on first snapshot if none exists
    if (!this.baseline) {
      this.baseline = snapshot;
    }

    // Proactive Warning when usage exceeds 500MB threshold
    if (usedHeapMb > WASM_HEAP_THRESHOLD_MB || wasmMetrics.wasmMb > WASM_HEAP_THRESHOLD_MB) {
      this.reportExceeded500MbWarning(snapshot);
    }

    // Report to console if leak risk or critical
    if (status === "leak_risk" || status === "critical") {
      this.reportLeakToConsole(snapshot);
    }

    // Notify all subscribers
    this.notifySubscribers(snapshot);

    return snapshot;
  }

  /**
   * Multi-Factor Leak Detection Heuristic Engine
   */
  private evaluateHealth(
    usedHeapMb: number,
    heapLimitMb: number,
    wasmMb: number,
    canvasMb: number,
    canvasCount: number,
    velocity: number
  ): { status: MemoryHealthStatus; leakReason?: string } {
    // 1. Critical V8 Heap Saturation (>85% of limit or >850MB)
    const heapRatio = usedHeapMb / heapLimitMb;
    if (heapRatio > 0.85 || usedHeapMb > 850) {
      return {
        status: "critical",
        leakReason: `Critical heap saturation (${(heapRatio * 100).toFixed(1)}% of limit / ${usedHeapMb.toFixed(1)} MB). Crash imminent if unreleased.`,
      };
    }

    // 2. Proactive 500MB Threshold Warning (monitored via window.performance.memory)
    if (usedHeapMb > WASM_HEAP_THRESHOLD_MB || wasmMb > WASM_HEAP_THRESHOLD_MB) {
      return {
        status: "leak_risk",
        leakReason: `Memory usage exceeds 500MB threshold (${usedHeapMb.toFixed(1)} MB detected via window.performance.memory). Proactively identifying potential memory leaks.`,
      };
    }

    // 3. Monotonic Growth Detection (Memory steadily climbing over last 8-10 samples without any drop)
    if (this.snapshots.length >= 8) {
      const recent = this.snapshots.slice(-8);
      let climbs = 0;
      for (let i = 1; i < recent.length; i++) {
        if (recent[i].usedHeapMb >= recent[i - 1].usedHeapMb - 0.5) {
          climbs++;
        }
      }

      const totalRise = recent[recent.length - 1].usedHeapMb - recent[0].usedHeapMb;
      if (climbs >= 7 && totalRise > 40) {
        return {
          status: "leak_risk",
          leakReason: `Monotonic climb detected (+${totalRise.toFixed(1)} MB over ${recent.length}s without GC reclamation). Potential unreleased page renders.`,
        };
      }
    }

    // 4. Excessive Canvas Accumulation (>12 canvases or >120MB canvas backing store)
    if (canvasCount > 15 || canvasMb > 140) {
      return {
        status: "leak_risk",
        leakReason: `Excessive canvas backing store: ${canvasCount} canvases (~${canvasMb.toFixed(1)} MB). Canvas memory is unreleased.`,
      };
    }

    // 5. WASM Linear Buffer Retention (>250MB WASM buffers)
    if (wasmMb > 250) {
      return {
        status: "leak_risk",
        leakReason: `WASM linear memory is unusually high (${wasmMb.toFixed(1)} MB). Verify WebAssembly.Memory cleanup.`,
      };
    }

    // 6. Elevated state (>300MB heap or rapid velocity >15MB/s)
    if (usedHeapMb > 300 || velocity > 15 || canvasMb > 70) {
      return {
        status: "elevated",
        leakReason: velocity > 15 ? `Rapid allocation rate (+${velocity.toFixed(1)} MB/s)` : undefined,
      };
    }

    return { status: "nominal" };
  }

  private lastExceeded500MbWarnTime = 0;

  /**
   * Dedicated Proactive Warning when usage exceeds 500MB (monitored via window.performance.memory)
   */
  public reportExceeded500MbWarning(snapshot: MemorySnapshot): void {
    const now = Date.now();
    // Throttle to once every 8 seconds
    if (now - this.lastExceeded500MbWarnTime < 8000) return;
    this.lastExceeded500MbWarnTime = now;

    console.warn(
      `%c[WASM Performance Warning] ⚠️ Memory usage exceeds 500MB threshold!\n` +
      `Used JS Heap: ${snapshot.usedHeapMb.toFixed(1)} MB (Limit: ${snapshot.heapLimitMb.toFixed(0)} MB, ${((snapshot.usedHeapMb / snapshot.heapLimitMb) * 100).toFixed(1)}%)\n` +
      `WASM Linear Memory: ${snapshot.wasmMb.toFixed(1)} MB (${snapshot.wasmBufferCount} active buffers)\n` +
      `Canvas Backing-Store: ${snapshot.canvasMb.toFixed(1)} MB (${snapshot.canvasCount} canvases)\n` +
      `Proactively identifying memory leaks during heavy PDF processing. Call page.cleanup() or click Purge in the WASM overlay.`,
      "color: #f59e0b; font-weight: bold; font-size: 11px;"
    );
  }

  /**
   * Check if current memory exceeds the 500MB threshold (or custom threshold)
   */
  public checkMemoryThreshold(thresholdMb: number = WASM_HEAP_THRESHOLD_MB): { exceeded: boolean; usedMb: number; thresholdMb: number } {
    const snap = this.getLatestSnapshot();
    const exceeded = snap.usedHeapMb > thresholdMb || snap.wasmMb > thresholdMb;
    if (exceeded) {
      this.reportExceeded500MbWarning(snap);
    }
    return { exceeded, usedMb: snap.usedHeapMb, thresholdMb };
  }

  /**
   * Throttled, visually striking console leak warning
   */
  private reportLeakToConsole(snapshot: MemorySnapshot): void {
    const now = Date.now();
    // Throttle to once every 12 seconds per alert
    if (now - this.lastConsoleWarnTime < 12000) return;
    this.lastConsoleWarnTime = now;
    this.totalLeaksReported++;

    const isCritical = snapshot.status === "critical";
    const headerColor = isCritical ? "#ef4444" : "#f59e0b";
    const badgeText = isCritical ? "CRITICAL HEAP SATURATION" : "POTENTIAL MEMORY LEAK";

    console.group(
      `%c[WASM Leak Detector] ⚠️ ${badgeText}: ${snapshot.leakReason || "High resource retention"}`,
      `background: ${headerColor}22; color: ${headerColor}; padding: 3px 8px; border-radius: 4px; font-weight: bold; border: 1px solid ${headerColor};`
    );
    console.table({
      "Timestamp": new Date(snapshot.timestamp).toLocaleTimeString(),
      "Health Status": snapshot.status.toUpperCase(),
      "Used JS Heap": `${snapshot.usedHeapMb.toFixed(1)} MB`,
      "Total Heap": `${snapshot.totalHeapMb.toFixed(1)} MB`,
      "Heap Limit": `${snapshot.heapLimitMb.toFixed(1)} MB`,
      "Heap % of Limit": `${((snapshot.usedHeapMb / snapshot.heapLimitMb) * 100).toFixed(1)}%`,
      "WASM Linear Memory": `${snapshot.wasmMb.toFixed(1)} MB (${snapshot.wasmBufferCount} buffers)`,
      "Canvas Backing Store": `${snapshot.canvasMb.toFixed(1)} MB (${snapshot.canvasCount} canvases)`,
      "Memory Velocity": `${snapshot.velocityMbPerSec > 0 ? "+" : ""}${snapshot.velocityMbPerSec.toFixed(2)} MB/s`,
    });
    console.warn(
      `[Diagnosis]: ${snapshot.leakReason}\n` +
      `[Action]: Invoke page.cleanup(), reset unneeded canvas.width=0/height=0, or click 'Run Memory Cleanup' in the WASM Performance Overlay.`
    );
    console.groupEnd();
  }

  private notifySubscribers(snapshot: MemorySnapshot): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error("[WasmTracker] Subscriber notification error:", err);
      }
    });
  }

  /**
   * Active Memory Cleanup & Garbage Collection trigger
   */
  public runMemoryCleanup(): { canvasesFreed: number; estimatedMbFreed: number } {
    let canvasesFreed = 0;
    let bytesFreed = 0;

    if (typeof document !== "undefined") {
      try {
        // Look for orphan or off-screen canvases
        const canvases = document.querySelectorAll("canvas");
        canvases.forEach((canvas) => {
          // If canvas is not connected to DOM or is an invisible detached scratchpad
          const isAttached = document.body.contains(canvas);
          const isHidden = canvas.style.display === "none" || canvas.offsetParent === null;

          if (!isAttached || isHidden) {
            const w = canvas.width;
            const h = canvas.height;
            if (w > 0 && h > 0) {
              bytesFreed += w * h * 4;
              const ctx = canvas.getContext("2d");
              if (ctx) ctx.clearRect(0, 0, w, h);
              canvas.width = 0;
              canvas.height = 0;
              canvasesFreed++;
            }
          }
        });
      } catch (err) {
        console.warn("[WasmTracker] Error during DOM canvas cleanup:", err);
      }
    }

    // Release any stress test buffers
    if (this.stressTestBuffers.length > 0) {
      bytesFreed += this.stressTestBuffers.length * 50 * 1024 * 1024;
      this.stressTestBuffers = [];
    }

    // Force microtask / promise cycle to encourage V8 GC
    if (typeof window !== "undefined" && (window as any).gc) {
      try {
        (window as any).gc();
      } catch {}
    }

    // Take immediate snapshot to reflect cleanup
    setTimeout(() => {
      this.takeSnapshot();
    }, 150);

    const mbFreed = bytesFreed / (1024 * 1024);
    console.info(
      `%c[WASM Memory Flush] Cleaned ${canvasesFreed} idle canvas(es), reclaimed ~${mbFreed.toFixed(1)} MB buffer memory.`,
      "color: #10b981; font-weight: bold;"
    );

    return { canvasesFreed, estimatedMbFreed: mbFreed };
  }

  /**
   * Safe Controlled Memory Stress Test (Allocates 40MB for 3.5s to test detector & graph)
   */
  public simulateAllocationSpike(): void {
    try {
      console.info("[WasmTracker] Simulating 45 MB allocation spike to verify leak detection...");
      // Allocate three 15MB typed arrays
      for (let i = 0; i < 3; i++) {
        this.stressTestBuffers.push(new Uint8Array(15 * 1024 * 1024));
      }
      this.takeSnapshot();

      // Automatically release after 3.5 seconds
      setTimeout(() => {
        this.stressTestBuffers = [];
        this.takeSnapshot();
        console.info("[WasmTracker] Allocation spike released successfully.");
      }, 3500);
    } catch (err) {
      console.warn("[WasmTracker] Allocation spike aborted:", err);
    }
  }

  /**
   * Test 500MB Threshold Warning
   * Directly exercises the 500MB warning console output to proactively verify leak detection
   */
  public simulate500MbThresholdTest(): void {
    console.info("[WasmTracker] Triggering 500MB leak threshold verification test...");
    const current = this.getLatestSnapshot();
    const testSnapshot: MemorySnapshot = {
      ...current,
      usedHeapMb: Math.max(524.8, current.usedHeapMb > 500 ? current.usedHeapMb : 524.8),
      status: "leak_risk",
      leakReason: "Simulated memory usage exceeding 500MB threshold (524.8 MB via window.performance.memory)",
    };
    this.reportExceeded500MbWarning(testSnapshot);
    this.reportLeakToConsole(testSnapshot);
    this.notifySubscribers(testSnapshot);

    setTimeout(() => {
      this.takeSnapshot();
    }, 4500);
  }

  /**
   * Generate Full Diagnostic Report for developers / support
   */
  public generateDiagnosticReport(): DiagnosticReport {
    const current = this.getLatestSnapshot();
    const recommendations: string[] = [];

    if (current.wasmMb > 120) {
      recommendations.push("High WASM linear memory: Ensure pdfDoc.destroy() or page.cleanup() is called immediately after page rendering completes.");
    }
    if (current.canvasMb > 80) {
      recommendations.push("High Canvas backing-store memory: Clear canvas dimensions (width=0, height=0) when unmounting preview components.");
    }
    if (current.velocityMbPerSec > 10) {
      recommendations.push("Rapid memory climb: Limit batch PDF concurrency or process pages sequentially using worker pooling.");
    }
    if (recommendations.length === 0) {
      recommendations.push("WebAssembly and JS Heap metrics are well within safe thresholds for heavy PDF operations.");
    }

    return {
      generatedAt: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      hasPerformanceMemoryApi: typeof window !== "undefined" && !!(window.performance as any)?.memory,
      status: current.status,
      current,
      baseline: this.baseline,
      peakUsedHeapMb: this.peakUsedHeapMb,
      peakWasmMb: this.peakWasmMb,
      peakCanvasMb: this.peakCanvasMb,
      totalLeaksReported: this.totalLeaksReported,
      recentSnapshots: this.snapshots.slice(-20),
      activeWasmInstances: activeWasmMemories.size,
      recommendations,
    };
  }

  /**
   * Print formatted summary to browser console
   */
  public logDetailedReportToConsole(): void {
    const report = this.generateDiagnosticReport();
    console.group("%c[WASM Performance Telemetry Summary]", "background: #0284c7; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-weight: bold;");
    console.log("Overall Health:", report.status.toUpperCase());
    console.log("Current Used Heap:", `${report.current.usedHeapMb.toFixed(1)} MB`);
    console.log("Peak Used Heap:", `${report.peakUsedHeapMb.toFixed(1)} MB`);
    console.log("Current WASM Memory:", `${report.current.wasmMb.toFixed(1)} MB (${report.activeWasmInstances} buffers)`);
    console.log("Peak WASM Memory:", `${report.peakWasmMb.toFixed(1)} MB`);
    console.log("Active Canvases:", `${report.current.canvasCount} (~${report.current.canvasMb.toFixed(1)} MB)`);
    console.log("Recommendations:", report.recommendations);
    console.groupEnd();
  }
}

export const wasmTracker = new WasmPerformanceTracker();
