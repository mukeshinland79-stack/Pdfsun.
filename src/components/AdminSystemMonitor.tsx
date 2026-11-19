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
  const [history, setHistory] = useState<SystemResourcePoint[]>([]);
  const [systemMeta, setSystemMeta] = useState<{
    cores: number;
    systemUsedGb: string;
    systemTotalGb: string;
    heapUsedMb: number;
    heapTotalMb: number;
  }>({
    cores: 0,
    systemUsedGb: "0",
    systemTotalGb: "0",
    heapUsedMb: 0,
    heapTotalMb: 0,
  });

  // Poll owner-gated /api/admin/system-stats endpoint
  useEffect(() => {
    if (!isLive) return;
    let active = true;

    const sampleSystemStats = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("pdfsun_admin_token") || localStorage.getItem("pdfsun_auth_token") || ""
            : "";
        const res = await fetch("/api/admin/system-stats", {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok || !active) return;
        const stats = await res.json();
        const nowStr = new Date().toLocaleTimeString();

        const cpuPct = Math.round(Number(stats?.cpu?.usagePercent ?? 0));
        const ramPct = Math.round(Number(stats?.memory?.usagePercent ?? 0));
        const heapUsedMb = Math.round(Number(stats?.memory?.heapUsedMb ?? 0));
        const heapTotalMb = Math.max(1, Math.round(Number(stats?.memory?.heapTotalMb ?? 0)));
        const heapPct = Math.min(100, Math.round((heapUsedMb / heapTotalMb) * 100));
        const totalMb = Number(stats?.memory?.systemTotalMb ?? 0);
        const freeMb = Number(stats?.memory?.systemFreeMb ?? 0);

        setSystemMeta({
          cores: Number(stats?.cpu?.cores ?? 0),
          systemUsedGb: ((totalMb - freeMb) / 1024).toFixed(1),
          systemTotalGb: (totalMb / 1024).toFixed(1),
          heapUsedMb,
          heapTotalMb,
        });

        setHistory((prev) => [
          ...prev.slice(-11),
          { time: nowStr, cpuPct, ramPct, storagePct: heapPct },
        ]);
      } catch {
        // Non-blocking telemetry read
      }
    };

    sampleSystemStats();
    const interval = setInterval(sampleSystemStats, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isLive]);

  const latest = history[history.length - 1] || {
    cpuPct: 0,
    ramPct: 0,
    storagePct: 0,
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
            <span className="text-xs text-slate-400 font-mono">
              {systemMeta.cores > 0 ? `${systemMeta.cores} vCPU Cores` : "Polling..."}
            </span>
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
            <span className="text-xs text-slate-400 font-mono">
              {systemMeta.systemTotalGb !== "0"
                ? `${systemMeta.systemUsedGb} GB / ${systemMeta.systemTotalGb} GB`
                : "Polling..."}
            </span>
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
                Node Heap Utilization
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-cyan-500/10 text-cyan-500">
              V8 Heap
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {latest.storagePct}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {systemMeta.heapTotalMb > 0
                ? `${systemMeta.heapUsedMb} MB / ${systemMeta.heapTotalMb} MB`
                : "Polling..."}
            </span>
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
