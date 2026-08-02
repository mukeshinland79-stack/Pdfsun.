import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Cpu,
  HardDrive,
  Database,
  Activity,
  Server,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ArrowUpRight,
} from "lucide-react";

export interface SystemResourcePoint {
  time: string;
  cpuPct: number;
  ramPct: number;
  storagePct: number;
}

export interface AdminSystemMonitorProps {
  className?: string;
}

export const AdminSystemMonitor: React.FC<AdminSystemMonitorProps> = ({
  className = "",
}) => {
  const [isLive, setIsLive] = useState<boolean>(true);
  const [history, setHistory] = useState<SystemResourcePoint[]>([
    { time: "10:00", cpuPct: 24, ramPct: 42, storagePct: 58 },
    { time: "10:01", cpuPct: 28, ramPct: 44, storagePct: 58 },
    { time: "10:02", cpuPct: 35, ramPct: 43, storagePct: 58 },
    { time: "10:03", cpuPct: 22, ramPct: 45, storagePct: 59 },
    { time: "10:04", cpuPct: 31, ramPct: 46, storagePct: 59 },
    { time: "10:05", cpuPct: 29, ramPct: 45, storagePct: 59 },
    { time: "10:06", cpuPct: 42, ramPct: 48, storagePct: 60 },
    { time: "10:07", cpuPct: 26, ramPct: 47, storagePct: 60 },
  ]);

  // Live simulation ticker for system resource utilization
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString();

      const newCpu = Math.floor(18 + Math.random() * 28);
      const newRam = Math.floor(44 + Math.random() * 8);
      const newStorage = 60; // Stable storage

      setHistory((prev) => [
        ...prev.slice(-11),
        { time: nowStr, cpuPct: newCpu, ramPct: newRam, storagePct: newStorage },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const latest = history[history.length - 1] || {
    cpuPct: 25,
    ramPct: 46,
    storagePct: 60,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Server className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Real-Time Infrastructure & System Resource Monitor
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                Hardware Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live CPU compute load, RAM heap allocation, and SSD storage sparkline utilization.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <button
          onClick={() => setIsLive(!isLive)}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
            isLive
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
          }`}
        >
          {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isLive ? "Live Stream Active" : "Stream Paused"}</span>
        </button>
      </div>

      {/* 3 Metric Gauge Cards with Recharts Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: CPU Load */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                CPU Compute Core
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                latest.cpuPct > 80
                  ? "bg-red-500/10 text-red-500"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {latest.cpuPct > 80 ? "High Load" : "Optimal"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {latest.cpuPct}%
            </span>
            <span className="text-xs text-slate-400 font-mono">8 vCPU Cores</span>
          </div>

          {/* Recharts CPU Sparkline */}
          <div className="h-20 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpuPct"
                  name="CPU %"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#cpuGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: RAM Memory Allocation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                RAM Memory Allocation
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500">
              Healthy
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {latest.ramPct}%
            </span>
            <span className="text-xs text-slate-400 font-mono">7.3 GB / 16 GB</span>
          </div>

          {/* Recharts RAM Sparkline */}
          <div className="h-20 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ramPct"
                  name="RAM %"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#ramGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Storage Disk Space */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                SSD Disk Storage
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-cyan-500/10 text-cyan-500">
              SSD NVMe
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {latest.storagePct}%
            </span>
            <span className="text-xs text-slate-400 font-mono">300 GB / 500 GB</span>
          </div>

          {/* Recharts Storage Sparkline */}
          <div className="h-20 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="storagePct"
                  name="Storage %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#storageGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
