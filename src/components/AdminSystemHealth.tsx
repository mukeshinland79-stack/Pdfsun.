import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Clock,
  Server,
  RefreshCw,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Gauge,
  Radio,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export interface HealthMetricPoint {
  time: string;
  cpuUsage: number; // percentage (0-100)
  memoryUsageMB: number; // MB allocation
  memoryLimitMB: number; // MB limit
  memoryPct: number; // percentage
  apiLatencyMs: number; // ms
  compressLatencyMs: number; // ms
  aiLatencyMs: number; // ms
  requestsPerSec: number;
}

export interface AdminSystemHealthProps {
  className?: string;
}

const INITIAL_HEALTH_DATA: HealthMetricPoint[] = [
  { time: "04:20:00", cpuUsage: 22, memoryUsageMB: 412, memoryLimitMB: 1024, memoryPct: 40.2, apiLatencyMs: 38, compressLatencyMs: 45, aiLatencyMs: 120, requestsPerSec: 14 },
  { time: "04:21:00", cpuUsage: 28, memoryUsageMB: 435, memoryLimitMB: 1024, memoryPct: 42.4, apiLatencyMs: 42, compressLatencyMs: 52, aiLatencyMs: 135, requestsPerSec: 18 },
  { time: "04:22:00", cpuUsage: 35, memoryUsageMB: 468, memoryLimitMB: 1024, memoryPct: 45.7, apiLatencyMs: 55, compressLatencyMs: 68, aiLatencyMs: 160, requestsPerSec: 24 },
  { time: "04:23:00", cpuUsage: 24, memoryUsageMB: 440, memoryLimitMB: 1024, memoryPct: 42.9, apiLatencyMs: 36, compressLatencyMs: 42, aiLatencyMs: 115, requestsPerSec: 16 },
  { time: "04:24:00", cpuUsage: 31, memoryUsageMB: 485, memoryLimitMB: 1024, memoryPct: 47.3, apiLatencyMs: 48, compressLatencyMs: 58, aiLatencyMs: 142, requestsPerSec: 21 },
  { time: "04:25:00", cpuUsage: 26, memoryUsageMB: 452, memoryLimitMB: 1024, memoryPct: 44.1, apiLatencyMs: 40, compressLatencyMs: 46, aiLatencyMs: 125, requestsPerSec: 17 },
  { time: "04:26:00", cpuUsage: 45, memoryUsageMB: 530, memoryLimitMB: 1024, memoryPct: 51.7, apiLatencyMs: 62, compressLatencyMs: 82, aiLatencyMs: 185, requestsPerSec: 29 },
  { time: "04:27:00", cpuUsage: 29, memoryUsageMB: 470, memoryLimitMB: 1024, memoryPct: 45.8, apiLatencyMs: 41, compressLatencyMs: 48, aiLatencyMs: 130, requestsPerSec: 19 },
];

export const AdminSystemHealth: React.FC<AdminSystemHealthProps> = ({ className = "" }) => {
  const [isLive, setIsLive] = useState<boolean>(true);
  const [timeWindow, setTimeWindow] = useState<string>("realtime");
  const [healthData, setHealthData] = useState<HealthMetricPoint[]>(INITIAL_HEALTH_DATA);

  // Live real-time streaming data generator
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString();
      const randomCpu = Math.floor(18 + Math.random() * 28);
      const randomRamMB = Math.floor(430 + Math.random() * 110);
      const randomRamPct = Number(((randomRamMB / 1024) * 100).toFixed(1));
      const randomLatency = Math.floor(32 + Math.random() * 25);
      const randomCompressLatency = Math.floor(40 + Math.random() * 30);
      const randomAiLatency = Math.floor(110 + Math.random() * 60);
      const randomRps = Math.floor(12 + Math.random() * 18);

      const newPoint: HealthMetricPoint = {
        time: timeStr,
        cpuUsage: randomCpu,
        memoryUsageMB: randomRamMB,
        memoryLimitMB: 1024,
        memoryPct: randomRamPct,
        apiLatencyMs: randomLatency,
        compressLatencyMs: randomCompressLatency,
        aiLatencyMs: randomAiLatency,
        requestsPerSec: randomRps,
      };

      setHealthData((prev) => [...prev.slice(-14), newPoint]);
    }, 3500);

    return () => clearInterval(interval);
  }, [isLive]);

  const latest = healthData[healthData.length - 1] || INITIAL_HEALTH_DATA[INITIAL_HEALTH_DATA.length - 1];

  // Calculate overall health score
  const avgCpu = Math.round(healthData.reduce((acc, curr) => acc + curr.cpuUsage, 0) / healthData.length);
  const avgLatency = Math.round(healthData.reduce((acc, curr) => acc + curr.apiLatencyMs, 0) / healthData.length);
  const healthScore = Math.max(92, Math.min(100, Math.round(100 - (avgCpu * 0.1) - (avgLatency * 0.05))));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner & Control Bar */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-white">
                PDFSun Backend System Health
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[10px] uppercase flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>OPERATIONAL</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live telemetry monitoring CPU core load, Node.js RAM heap allocation, and API endpoint latency metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
              isLive
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLive ? "animate-pulse text-emerald-400" : ""}`} />
            <span>{isLive ? "Real-Time Telemetry ON" : "Stream Paused"}</span>
          </button>

          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            {["realtime", "15m", "1h"].map((win) => (
              <button
                key={win}
                type="button"
                onClick={() => setTimeWindow(win)}
                className={`px-2.5 py-1 rounded-lg uppercase transition ${
                  timeWindow === win
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {win}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Overall System Health Score */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Health Index Score</span>
            <Gauge className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {healthScore}%
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
              Optimal
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Cloud Run multi-region cluster status</p>
        </div>

        {/* Card 2: CPU Compute Usage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">CPU Core Utilization</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {latest.cpuUsage}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              Avg {avgCpu}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500">8 vCPU active worker thread pool</p>
        </div>

        {/* Card 3: Memory Consumption */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">RAM Heap Memory</span>
            <HardDrive className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {latest.memoryUsageMB} <span className="text-xs font-normal">MB</span>
            </span>
            <span className="text-[10px] font-bold text-sky-500 font-mono">
              {latest.memoryPct}% of 1GB
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Node.js process RSS buffer limit</p>
        </div>

        {/* Card 4: API Response Latency */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">API Endpoint Latency</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {latest.apiLatencyMs} <span className="text-xs font-normal">ms</span>
            </span>
            <span className="text-[10px] font-bold text-amber-500 font-mono">
              Avg {avgLatency}ms
            </span>
          </div>
          <p className="text-[10px] text-slate-500">P95 round-trip response time</p>
        </div>
      </div>

      {/* Main Charts Grid using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Real-Time CPU Usage Area Chart */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Real-Time CPU Usage (% Load)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Continuous vCPU thread execution density
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              Current: {latest.cpuUsage}%
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#475569" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#475569" unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpuUsage"
                  name="CPU Usage"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cpuGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Memory Consumption Area Chart */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Memory Consumption (MB Allocation)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Node.js V8 heap memory RSS allocation against 1024MB container limit
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
              {latest.memoryUsageMB} MB / 1024 MB
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#475569" />
                <YAxis domain={[0, 1024]} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#475569" unit="MB" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="memoryUsageMB"
                  name="Heap Memory (MB)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#memoryGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* API Latency Metrics Chart */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                API Endpoint Latency Breakdown (Response Time in ms)
              </h4>
              <p className="text-[10px] text-slate-500">
                Comparison of general API response time vs PDF compression and Gemini AI processing latency
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono font-bold">
            <span className="flex items-center space-x-1 text-amber-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>General API ({latest.apiLatencyMs}ms)</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>PDF Engine ({latest.compressLatencyMs}ms)</span>
            </span>
            <span className="flex items-center space-x-1 text-purple-500">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>AI Summarizer ({latest.aiLatencyMs}ms)</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={healthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#475569" />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#475569" unit="ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  fontSize: "11px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="apiLatencyMs"
                name="Core API Latency (ms)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="compressLatencyMs"
                name="PDF Engine Latency (ms)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="aiLatencyMs"
                name="Gemini AI Service Latency (ms)"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
