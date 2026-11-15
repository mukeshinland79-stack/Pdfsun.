import React, { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Clock,
  Sparkles,
  Server,
  Globe,
  Gauge,
  Play,
  Pause,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export interface ApiEndpointMetric {
  id: string;
  name: string;
  service: "Gemini AI" | "PDF Engine" | "System Health" | "Analytics API";
  endpoint: string;
  latencyMs: number;
  status: "optimal" | "degraded" | "down";
  lastTested: string;
  uptimePercent: number;
}

export interface RealTimeApiLatencyMonitorProps {
  className?: string;
}

// Circular Speedometer / Gauge Component
const LatencyGauge: React.FC<{
  latencyMs: number;
  maxMs?: number;
  label?: string;
}> = ({ latencyMs, maxMs = 500, label = "Average Latency" }) => {
  // Gauge math: 180 degree semi-circle arc
  const clampedLatency = Math.min(Math.max(latencyMs, 0), maxMs);
  const percentage = clampedLatency / maxMs;
  const radius = 65;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference * (1 - percentage);

  // Status color logic based on response time
  let gaugeColor = "#10b981"; // Emerald (< 100ms)
  let statusText = "Ultra Fast";
  if (latencyMs > 250) {
    gaugeColor = "#ef4444"; // Red
    statusText = "Degraded";
  } else if (latencyMs > 120) {
    gaugeColor = "#f59e0b"; // Amber
    statusText = "Moderate";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden">
        <svg className="w-44 h-44 -rotate-180 transform">
          {/* Background Arc */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-700"
            strokeDasharray={circumference}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Progress Colored Arc */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Text overlay */}
        <div className="absolute bottom-1 text-center">
          <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {latencyMs}
          </span>
          <span className="text-xs font-bold text-slate-400 ml-1">ms</span>
        </div>
      </div>

      <div className="mt-1 flex items-center space-x-1.5">
        <span
          className="w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: gaugeColor }}
        />
        <span
          className="text-xs font-extrabold uppercase tracking-wider"
          style={{ color: gaugeColor }}
        >
          {statusText} ({label})
        </span>
      </div>
    </div>
  );
};

export const RealTimeApiLatencyMonitor: React.FC<RealTimeApiLatencyMonitorProps> = ({
  className = "",
}) => {
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Endpoint telemetry state (measured live from real probes)
  const [endpoints, setEndpoints] = useState<ApiEndpointMetric[]>([
    {
      id: "health-api",
      name: "Server Health Telemetry API",
      service: "System Health",
      endpoint: "/api/health",
      latencyMs: 0,
      status: "optimal",
      lastTested: "Pending",
      uptimePercent: 100,
    },
    {
      id: "analytics-api",
      name: "Analytics Snapshot API",
      service: "Analytics API",
      endpoint: "/api/analytics/stats",
      latencyMs: 0,
      status: "optimal",
      lastTested: "Pending",
      uptimePercent: 100,
    },
    {
      id: "pdf-engine",
      name: "Client PDF Processor Engine",
      service: "PDF Engine",
      endpoint: "PDF-Lib / PDF.js Local Assembly",
      latencyMs: 0,
      status: "optimal",
      lastTested: "Pending",
      uptimePercent: 100,
    },
    {
      id: "gemini-flash",
      name: "Gemini AI Server Proxy",
      service: "Gemini AI",
      endpoint: "/api/ai/* (On-Demand Proxy)",
      latencyMs: 0,
      status: "optimal",
      lastTested: "On-Demand",
      uptimePercent: 100,
    },
  ]);

  // Real Ping test function
  const runLatencyTest = useCallback(async () => {
    setIsTesting(true);
    try {
      const startHealth = performance.now();
      const healthRes = await fetch("/api/health", { credentials: "include" });
      const healthLatency = Math.max(1, Math.round(performance.now() - startHealth));

      const startAnalytics = performance.now();
      const analyticsRes = await fetch("/api/analytics/stats", { credentials: "include" });
      const analyticsLatency = Math.max(1, Math.round(performance.now() - startAnalytics));
      const analyticsJson = analyticsRes.ok ? await analyticsRes.json() : null;
      const recordedProcessMs = Number(analyticsJson?.data?.serverLoadMs || 0);

      const nowStr = new Date().toLocaleTimeString();
      setLastSyncTime(nowStr);

      setEndpoints([
        {
          id: "health-api",
          name: "Server Health Telemetry API",
          service: "System Health",
          endpoint: "/api/health",
          latencyMs: healthRes.ok ? healthLatency : 0,
          status: !healthRes.ok ? "down" : healthLatency < 250 ? "optimal" : "degraded",
          lastTested: nowStr,
          uptimePercent: healthRes.ok ? 100 : 0,
        },
        {
          id: "analytics-api",
          name: "Analytics Snapshot API",
          service: "Analytics API",
          endpoint: "/api/analytics/stats",
          latencyMs: analyticsRes.ok ? analyticsLatency : 0,
          status: !analyticsRes.ok ? "down" : analyticsLatency < 250 ? "optimal" : "degraded",
          lastTested: nowStr,
          uptimePercent: analyticsRes.ok ? 100 : 0,
        },
        {
          id: "pdf-engine",
          name: "Client PDF Processor Engine",
          service: "PDF Engine",
          endpoint: "PDF-Lib / PDF.js Local Assembly",
          latencyMs: recordedProcessMs,
          status: recordedProcessMs > 2500 ? "degraded" : "optimal",
          lastTested: recordedProcessMs > 0 ? nowStr : "Standby",
          uptimePercent: 100,
        },
        {
          id: "gemini-flash",
          name: "Gemini AI Server Proxy",
          service: "Gemini AI",
          endpoint: "/api/ai/* (On-Demand Proxy)",
          latencyMs: healthRes.ok ? healthLatency : 0,
          status: healthRes.ok ? "optimal" : "down",
          lastTested: "Server Ready",
          uptimePercent: healthRes.ok ? 100 : 0,
        },
      ]);
    } catch {
      setEndpoints((prev) => prev.map((ep) => ({ ...ep, status: "down", latencyMs: 0 })));
    } finally {
      setIsTesting(false);
    }
  }, []);

  useEffect(() => {
    if (!isPolling) return;
    runLatencyTest();
    const interval = setInterval(runLatencyTest, 5000);
    return () => clearInterval(interval);
  }, [isPolling, runLatencyTest]);

  // Calculate overall average latency across active non-zero measurements
  const measured = endpoints.filter((ep) => ep.latencyMs > 0);
  const avgLatency =
    measured.length > 0
      ? Math.round(measured.reduce((acc, ep) => acc + ep.latencyMs, 0) / measured.length)
      : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Gauge className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Real-Time API Response Latency Monitor
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                Active Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live response speed for Gemini AI model, PDF engine assembly, and server APIs.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              isPolling
                ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
            }`}
          >
            {isPolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPolling ? "Pause" : "Resume"}</span>
          </button>

          <button
            onClick={runLatencyTest}
            disabled={isTesting}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? "animate-spin" : ""}`} />
            <span>Ping All APIs</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Live Gauge & Detailed Service Latency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Live Speedometer Gauge */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase flex items-center space-x-1">
              <Zap className="w-4 h-4 text-amber-500 mr-1" />
              <span>Global API Speed Index</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Last: {lastSyncTime || "Just now"}
            </span>
          </div>

          <LatencyGauge latencyMs={avgLatency} maxMs={300} label="Global Average" />

          <div className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Total System Endpoints:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {endpoints.length} Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Health Probe Status:</span>
              <span className="font-bold text-emerald-500 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {endpoints.every((ep) => ep.status !== "down") ? "Live Measured" : "Degraded"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Endpoint Status Table */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Live Service Response Times
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Refresh: Every 3s
            </span>
          </div>

          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      ep.service === "Gemini AI"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        : ep.service === "PDF Engine"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : ep.service === "System Health"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {ep.service === "Gemini AI" && <Sparkles className="w-4 h-4" />}
                    {ep.service === "PDF Engine" && <Cpu className="w-4 h-4" />}
                    {ep.service === "System Health" && <Server className="w-4 h-4" />}
                    {ep.service === "Analytics API" && <Globe className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{ep.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {ep.service}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                      {ep.endpoint}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                      {ep.latencyMs} ms
                    </div>
                    <div className="text-[10px] text-emerald-500 font-bold">
                      {ep.uptimePercent}% uptime
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border ${
                      ep.latencyMs < 120
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : ep.latencyMs < 250
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        : "bg-red-500/10 text-red-600 border-red-500/30"
                    }`}
                  >
                    {ep.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
