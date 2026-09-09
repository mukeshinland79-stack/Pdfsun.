import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  Terminal,
  Zap,
  ChevronDown,
  Minimize2,
  X,
  Layers,
  Flag,
  Sparkles,
  Info,
} from "lucide-react";
import {
  wasmTracker,
  MemorySnapshot,
  MemoryHealthStatus,
  DiagnosticReport,
  WASM_HEAP_THRESHOLD_MB,
} from "../utils/wasmPerformanceTracker";

interface WasmPerformanceOverlayProps {
  initialOpen?: boolean;
  onClose?: () => void;
}

export const WasmPerformanceOverlay: React.FC<WasmPerformanceOverlayProps> = ({
  initialOpen = false,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem("pdfsun_wasm_overlay_visible");
    return saved !== null ? saved === "true" : initialOpen;
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    const saved = localStorage.getItem("pdfsun_wasm_overlay_minimized");
    return saved !== null ? saved === "true" : true;
  });

  const [snapshot, setSnapshot] = useState<MemorySnapshot>(() => wasmTracker.getLatestSnapshot());
  const [history, setHistory] = useState<MemorySnapshot[]>(() => wasmTracker.getHistory());
  const [cleanupFeedback, setCleanupFeedback] = useState<string | null>(null);
  const [stressActive, setStressActive] = useState<boolean>(false);

  // Global Keyboard Shortcut: Ctrl+Shift+W / Cmd+Shift+W to toggle overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        setIsVisible((prev) => {
          const next = !prev;
          localStorage.setItem("pdfsun_wasm_overlay_visible", String(next));
          return next;
        });
      }
    };

    const handleCustomOpen = () => {
      setIsVisible(true);
      setIsMinimized(false);
      localStorage.setItem("pdfsun_wasm_overlay_visible", "true");
      localStorage.setItem("pdfsun_wasm_overlay_minimized", "false");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-wasm-overlay", handleCustomOpen);
    window.addEventListener("open-wasm-overlay", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-wasm-overlay", handleCustomOpen);
      window.removeEventListener("open-wasm-overlay", handleCustomOpen);
    };
  }, []);

  // Subscribe to real-time 1s memory updates
  useEffect(() => {
    const unsubscribe = wasmTracker.subscribe((latest) => {
      setSnapshot(latest);
      setHistory(wasmTracker.getHistory());
    });

    return () => unsubscribe();
  }, []);

  // Save visibility preference
  const toggleVisibility = () => {
    setIsVisible((prev) => {
      const next = !prev;
      localStorage.setItem("pdfsun_wasm_overlay_visible", String(next));
      if (!next && onClose) onClose();
      return next;
    });
  };

  const toggleMinimized = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      localStorage.setItem("pdfsun_wasm_overlay_minimized", String(next));
      return next;
    });
  };

  // Run cleanup action
  const handleCleanup = () => {
    const res = wasmTracker.runMemoryCleanup();
    setCleanupFeedback(`Reclaimed ~${res.estimatedMbFreed.toFixed(1)} MB (${res.canvasesFreed} canvas buffers reset)`);
    setTimeout(() => setCleanupFeedback(null), 3500);
  };

  // Set baseline
  const handleSetBaseline = () => {
    wasmTracker.resetBaseline();
    setCleanupFeedback(`Pinned baseline at ${snapshot.usedHeapMb.toFixed(1)} MB`);
    setTimeout(() => setCleanupFeedback(null), 3000);
  };

  // Log to console
  const handleDumpToConsole = () => {
    wasmTracker.logDetailedReportToConsole();
    setCleanupFeedback("Detailed telemetry dumped to DevTools Console");
    setTimeout(() => setCleanupFeedback(null), 3000);
  };

  // Stress test
  const handleStressTest = () => {
    setStressActive(true);
    wasmTracker.simulateAllocationSpike();
    setTimeout(() => setStressActive(false), 4000);
  };

  // Export JSON Report
  const handleExportReport = () => {
    const report: DiagnosticReport = wasmTracker.generateDiagnosticReport();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pdfsun-wasm-telemetry-${new Date().toISOString().slice(0, 19)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Color mapping based on health status
  const statusConfig = useMemo(() => {
    switch (snapshot.status) {
      case "critical":
        return {
          badge: "bg-red-500/20 text-red-400 border-red-500/40",
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.4)]",
          dot: "bg-red-500 animate-ping",
          chartStroke: "#ef4444",
          chartFill: "rgba(239, 68, 68, 0.15)",
          text: "Critical Saturation",
        };
      case "leak_risk":
        return {
          badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
          dot: "bg-amber-500 animate-pulse",
          chartStroke: "#f59e0b",
          chartFill: "rgba(245, 158, 11, 0.15)",
          text: "Potential Leak",
        };
      case "elevated":
        return {
          badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",
          glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]",
          dot: "bg-blue-400",
          chartStroke: "#38bdf8",
          chartFill: "rgba(56, 189, 248, 0.12)",
          text: "Heavy Processing",
        };
      case "nominal":
      default:
        return {
          badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          glow: "shadow-[0_0_10px_rgba(16,185,129,0.2)]",
          dot: "bg-emerald-400",
          chartStroke: "#10b981",
          chartFill: "rgba(16, 185, 129, 0.12)",
          text: "Healthy",
        };
    }
  }, [snapshot.status]);

  // Calculate SVG Chart path from history
  const chartSvgPath = useMemo(() => {
    if (history.length < 2) return { line: "", area: "", maxVal: 0, minVal: 0, threshold500Y: null };

    const svgWidth = 340;
    const svgHeight = 65;
    const paddingY = 8;

    const maxVal = Math.max(
      ...history.map((h) => h.usedHeapMb),
      550, // ensures the 500MB reference threshold is always visible and proportionally scaled
      120
    );
    const minVal = Math.max(0, Math.min(...history.map((h) => h.usedHeapMb)) - 20);
    const range = Math.max(maxVal - minVal, 20);

    const points = history.map((item, idx) => {
      const x = (idx / (history.length - 1)) * svgWidth;
      const normalizedY = (item.usedHeapMb - minVal) / range;
      const y = svgHeight - paddingY - normalizedY * (svgHeight - paddingY * 2);
      return { x, y };
    });

    const linePath = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, "");

    const areaPath = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

    const threshold500Y = 500 >= minVal && 500 <= maxVal
      ? svgHeight - paddingY - ((500 - minVal) / range) * (svgHeight - paddingY * 2)
      : null;

    return { line: linePath, area: areaPath, maxVal, minVal, threshold500Y };
  }, [history]);

  if (!isVisible) {
    return null;
  }

  // MINIMIZED MODE: Compact floating telemetry pill
  if (isMinimized) {
    return (
      <div
        id="wasm-telemetry-pill"
        className={`fixed bottom-4 left-4 z-40 flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700/90 text-slate-100 shadow-xl backdrop-blur-md font-mono text-xs select-none transition-all ${statusConfig.glow}`}
      >
        <div className="flex items-center space-x-1.5 cursor-pointer" onClick={toggleMinimized}>
          <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200">WASM:</span>
          <span className="text-cyan-300 font-semibold">{snapshot.wasmMb.toFixed(1)} MB</span>
        </div>

        <div className="h-3.5 w-px bg-slate-700" />

        <div className="flex items-center space-x-1.5 cursor-pointer" onClick={toggleMinimized}>
          <span className="text-slate-400 text-[11px]">Heap:</span>
          <span className={`font-semibold ${snapshot.usedHeapMb > WASM_HEAP_THRESHOLD_MB ? "text-amber-400 font-bold animate-pulse" : "text-slate-200"}`}>
            {snapshot.usedHeapMb.toFixed(0)} MB
          </span>
          {snapshot.usedHeapMb > WASM_HEAP_THRESHOLD_MB && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40">
              &gt;500MB!
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 pl-1">
          <button
            onClick={toggleMinimized}
            title="Expand Full WASM Performance HUD"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button
            onClick={toggleVisibility}
            title="Hide Overlay (Ctrl+Shift+W to restore)"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // EXPANDED MODE: Full Real-Time Performance & Leak Diagnostic HUD
  return (
    <div
      id="wasm-performance-hud"
      className="fixed bottom-4 left-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-950/95 border border-slate-800 text-slate-100 shadow-2xl backdrop-blur-xl font-sans overflow-hidden transition-all duration-200"
    >
      {/* HUD Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              WASM Performance Overlay
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-mono">
                LIVE
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">WebAssembly & V8 Heap Watchdog</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono border font-semibold flex items-center space-x-1 ${statusConfig.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            <span>{statusConfig.text}</span>
          </div>

          <button
            onClick={toggleMinimized}
            title="Minimize to Pill"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleVisibility}
            title="Close Overlay"
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3.5 text-xs">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          {/* 1. JS Heap Used */}
          <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
            snapshot.usedHeapMb > WASM_HEAP_THRESHOLD_MB
              ? "bg-amber-950/40 border-amber-500/60"
              : "bg-slate-900/80 border-slate-800/80"
          }`}>
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1 font-sans">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                V8 Heap Used
              </span>
              <span className="text-[10px] text-slate-500">
                {((snapshot.usedHeapMb / snapshot.heapLimitMb) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-base font-bold text-white tracking-tight">
                {snapshot.usedHeapMb.toFixed(1)} <span className="text-xs font-normal text-slate-400">MB</span>
              </div>
              {snapshot.usedHeapMb > WASM_HEAP_THRESHOLD_MB ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                  &gt;500MB WARN
                </span>
              ) : (
                <span className="text-[9px] text-emerald-400/90 font-mono">
                  &lt;500MB OK
                </span>
              )}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 ${
                  snapshot.status === "critical"
                    ? "bg-red-500"
                    : snapshot.usedHeapMb > WASM_HEAP_THRESHOLD_MB
                    ? "bg-amber-500"
                    : "bg-cyan-500"
                }`}
                style={{ width: `${Math.min(100, (snapshot.usedHeapMb / snapshot.heapLimitMb) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 truncate">
              <span>window.performance.memory</span>
              <span className="text-amber-400/90 font-mono">500MB alert</span>
            </div>
          </div>

          {/* 2. WASM Linear Memory */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1 font-sans">
                <Cpu className="w-3 h-3 text-indigo-400" />
                WASM Buffers
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold">{snapshot.wasmBufferCount} act.</span>
            </div>
            <div className="text-base font-bold text-white tracking-tight">
              {snapshot.wasmMb.toFixed(1)} <span className="text-xs font-normal text-slate-400">MB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (snapshot.wasmMb / 250) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 mt-1 truncate">Linear Heap Pages</span>
          </div>

          {/* 3. Canvas Backing-Store */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1 font-sans">
                <Layers className="w-3 h-3 text-amber-400" />
                Canvas Memory
              </span>
              <span className="text-[10px] text-slate-400">{snapshot.canvasCount} dom</span>
            </div>
            <div className="text-base font-bold text-white tracking-tight">
              {snapshot.canvasMb.toFixed(1)} <span className="text-xs font-normal text-slate-400">MB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (snapshot.canvasMb / 100) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 mt-1 truncate">Render Tile Cache</span>
          </div>

          {/* 4. Memory Velocity */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1 font-sans">
                <Activity className="w-3 h-3 text-emerald-400" />
                Velocity
              </span>
              <span className="text-[9px] text-slate-500">Rate</span>
            </div>
            <div
              className={`text-base font-bold tracking-tight ${
                snapshot.velocityMbPerSec > 5
                  ? "text-red-400"
                  : snapshot.velocityMbPerSec < -2
                  ? "text-emerald-400"
                  : "text-slate-200"
              }`}
            >
              {snapshot.velocityMbPerSec > 0 ? "+" : ""}
              {snapshot.velocityMbPerSec.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-400">MB/s</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 ${
                  snapshot.velocityMbPerSec > 5 ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(100, Math.abs(snapshot.velocityMbPerSec) * 5)}%`,
                }}
              />
            </div>
            <span className="text-[9px] text-slate-500 mt-1 truncate">
              {snapshot.velocityMbPerSec < -0.5 ? "GC Reclaiming" : "Allocation Pace"}
            </span>
          </div>
        </div>

        {/* Real-Time Sparkline Waveform (Last 60 Seconds) */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Activity className="w-3 h-3 text-cyan-400" />
              60s Memory Trajectory
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              Peak: {chartSvgPath.maxVal ? chartSvgPath.maxVal.toFixed(0) : "0"} MB
            </span>
          </div>

          <div className="relative w-full h-[65px] overflow-hidden rounded-lg bg-slate-950/80 border border-slate-900">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 340 65">
              <defs>
                <linearGradient id="wasmGraphGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={statusConfig.chartStroke} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={statusConfig.chartStroke} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="340" y2="20" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
              <line x1="0" y1="42" x2="340" y2="42" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />

              {/* 500MB Proactive Leak Threshold Reference Line */}
              {chartSvgPath.threshold500Y !== null && (
                <g>
                  <line
                    x1="0"
                    y1={chartSvgPath.threshold500Y}
                    x2="340"
                    y2={chartSvgPath.threshold500Y}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                    strokeOpacity="0.85"
                  />
                  <text
                    x="336"
                    y={Math.max(9, chartSvgPath.threshold500Y - 2.5)}
                    textAnchor="end"
                    fill="#f59e0b"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    500MB Threshold
                  </text>
                </g>
              )}

              {/* Area Fill */}
              {chartSvgPath.area && (
                <path d={chartSvgPath.area} fill="url(#wasmGraphGrad)" />
              )}

              {/* Memory Line */}
              {chartSvgPath.line && (
                <path
                  d={chartSvgPath.line}
                  fill="none"
                  stroke={statusConfig.chartStroke}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>
        </div>

        {/* Live Leak Diagnostic Banner */}
        <div
          className={`p-2.5 rounded-xl border text-[11px] transition-colors flex items-start gap-2 ${
            snapshot.status === "critical"
              ? "bg-red-950/40 border-red-800/60 text-red-300"
              : snapshot.status === "leak_risk"
              ? "bg-amber-950/40 border-amber-800/60 text-amber-300"
              : snapshot.status === "elevated"
              ? "bg-blue-950/40 border-blue-800/60 text-blue-300"
              : "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
          }`}
        >
          {snapshot.status === "critical" || snapshot.status === "leak_risk" ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          )}
          <div className="leading-tight">
            <span className="font-bold block text-xs">
              {snapshot.status === "critical"
                ? "Critical Heap Saturation"
                : snapshot.status === "leak_risk"
                ? "Potential Memory Leak Detected"
                : snapshot.status === "elevated"
                ? "High Resource Allocation"
                : "Nominal WebAssembly Lifecycle"}
            </span>
            <span className="text-[11px] opacity-90">
              {snapshot.leakReason ||
                "Zero memory leaks detected. WebAssembly buffers and canvases are properly releasing during PDF processing."}
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {cleanupFeedback && (
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-700/60 text-cyan-300 text-[11px] font-mono flex items-center gap-1.5 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{cleanupFeedback}</span>
          </div>
        )}

        {/* Diagnostics & Toolset Bar */}
        <div className="grid grid-cols-5 gap-1 pt-1 font-sans">
          {/* Run Cleanup */}
          <button
            onClick={handleCleanup}
            title="Force Canvas & Scratchpad Memory Cleanup"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all text-center group"
          >
            <Trash2 className="w-3.5 h-3.5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold leading-none">Purge</span>
          </button>

          {/* Set Baseline */}
          <button
            onClick={handleSetBaseline}
            title="Pin Current Memory as Relative Zero-Baseline"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all text-center group"
          >
            <Flag className="w-3.5 h-3.5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold leading-none">Baseline</span>
          </button>

          {/* Console Dump */}
          <button
            onClick={handleDumpToConsole}
            title="Output Detailed Diagnostic Report to DevTools Console"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all text-center group"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold leading-none">Console</span>
          </button>

          {/* Stress Test */}
          <button
            onClick={handleStressTest}
            disabled={stressActive}
            title="Simulate 45 MB Allocation Spike to Test Leak Detection"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all text-center group disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 mb-1 text-emerald-400 group-hover:scale-110 transition-transform ${stressActive ? "animate-spin" : ""}`} />
            <span className="text-[10px] font-semibold leading-none">{stressActive ? "Spiking" : "Spike"}</span>
          </button>

          {/* Test 500MB Threshold Warning */}
          <button
            onClick={() => {
              wasmTracker.simulate500MbThresholdTest();
              setCleanupFeedback("500MB warning logged to console! Check DevTools.");
              setTimeout(() => setCleanupFeedback(null), 4000);
            }}
            title="Simulate exceeding 500MB threshold and log warning to console"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-all text-center group"
          >
            <AlertTriangle className="w-3.5 h-3.5 mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold leading-none">&gt;500MB</span>
          </button>
        </div>

        {/* Footer info & JSON download */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
          <span className="font-mono flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-500" />
            Shortcut: <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">Ctrl+Shift+W</kbd>
          </span>

          <button
            onClick={handleExportReport}
            className="hover:text-cyan-400 flex items-center gap-1 transition-colors underline decoration-slate-700"
          >
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
};
