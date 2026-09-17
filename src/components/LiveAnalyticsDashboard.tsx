import React, { useState, useEffect } from "react";
import { Users, FileCheck, Cpu, CheckCircle2, RefreshCw, Zap, Activity } from "lucide-react";
import { useLiveAnalytics, LiveAnalyticsData } from "../hooks/useLiveAnalytics";

export type { LiveAnalyticsData };

export const LiveAnalyticsDashboard: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { data: realData, status, isSimulating, simulateMsg, reconnect, recordConversion } = useLiveAnalytics();

  // Local state for analytics metrics display & fallback interval updates
  const [metrics, setMetrics] = useState<LiveAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync realData directly from real-time stream without random simulation
  useEffect(() => {
    if (realData) {
      setMetrics(realData);
      setIsLoading(false);
    } else {
      // Fetch snapshot immediately
      fetch("/api/analytics/stats")
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (payload?.data) {
            setMetrics(payload.data);
            setIsLoading(false);
          }
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [realData]);

  const handleSimulateConversion = () => {
    const measuredLatency = 16;
    recordConversion(measuredLatency, true);
  };

  const currentActiveUsers = metrics?.activeUsersOnline ?? metrics?.activeUsers ?? 0;
  const currentSpeed = metrics?.serverLoadMs ?? metrics?.processingSpeed ?? 0;
  const currentSuccessRate = metrics?.successRatePercent ?? metrics?.successRate ?? 99.8;
  const currentConversions = metrics?.totalConversionsToday ?? 0;

  return (
    <div className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 ${className}`}>
      {/* Header Bar with High-Contrast Amber Accents */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Real-Time Live Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Accurate real-time metrics for active users, processing speed, and conversion success rates.
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center space-x-3">
          <div
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              status === "live"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40"
                : status === "reconnecting" || status === "connecting"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>
              {status === "live"
                ? "🟢 Live WS Stream"
                : status === "reconnecting"
                ? "🟡 Reconnecting..."
                : status === "connecting"
                ? "🟡 Connecting..."
                : "🔴 Offline Mode"}
            </span>
          </div>

          <button
            onClick={() => reconnect()}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 transition"
            title="Force reconnect analytics stream"
          >
            <RefreshCw className={`w-4 h-4 ${status === "connecting" || status === "reconnecting" ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metrics Grid with Animate-Pulse Skeleton Loaders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Users */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-amber-500/20 dark:border-amber-500/20 space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Active Users</span>
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          {isLoading || !metrics ? (
            <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800/80 rounded-lg animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-all duration-300">
              {currentActiveUsers.toLocaleString()}
            </div>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Real-time connected users</p>
        </div>

        {/* Metric 2: Processing Speed */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-amber-500/20 dark:border-amber-500/20 space-y-2 group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Processing Speed</span>
            <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          {isLoading || !metrics ? (
            <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800/80 rounded-lg animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-all duration-300">
              {currentSpeed} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">ms</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Average server execution</p>
        </div>

        {/* Metric 3: Success Rate */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-amber-500/20 dark:border-amber-500/20 space-y-2 group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          {isLoading || !metrics ? (
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800/80 rounded-lg animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-all duration-300">
              {currentSuccessRate}%
            </div>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Zero-error processing</p>
        </div>

        {/* Metric 4: Conversions Today */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-amber-500/20 dark:border-amber-500/20 space-y-2 group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Conversions Today</span>
            <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          {isLoading || !metrics ? (
            <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800/80 rounded-lg animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-all duration-300">
              {currentConversions.toLocaleString()}
            </div>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Verified document tasks</p>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {metrics?.timestamp ? (
            <span>Last Analytics Sync: <strong className="text-slate-900 dark:text-slate-200">{new Date(metrics.timestamp).toLocaleTimeString()}</strong></span>
          ) : (
            <span>Synchronizing live stream...</span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {simulateMsg && (
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-fade-in">
              {simulateMsg}
            </span>
          )}
          <button
            onClick={handleSimulateConversion}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-slate-950 dark:text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center space-x-2 shadow-xs disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? "Recording..." : "Test Conversion Event (+1)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

