import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  Users,
  Eye,
  Clock,
  Zap,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  Globe,
  Laptop,
  Smartphone,
  Tablet,
  ArrowUpRight,
  Radio,
  Signal,
  RefreshCw,
  TrendingUp,
  Sliders,
  CheckCircle2,
  FileText,
  Download,
  Upload,
  Layers,
} from "lucide-react";

export interface LiveStreamEvent {
  id: string;
  timestamp: string;
  eventType: "pageview" | "tool_exec" | "upload" | "download" | "session_start";
  toolName?: string;
  path: string;
  device: "Desktop" | "Mobile" | "Tablet";
  location: string;
  latencyMs: number;
}

export interface RealTimeTrafficMonitorProps {
  onEventTracked?: (event: LiveStreamEvent) => void;
  className?: string;
}

export const RealTimeTrafficMonitor: React.FC<RealTimeTrafficMonitorProps> = ({
  onEventTracked,
  className = "",
}) => {
  // Connection and stream state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [pollingIntervalMs, setPollingIntervalMs] = useState<number>(5000);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [pingMs, setPingMs] = useState<number>(0);

  // Live real metrics
  const [liveVisitors, setLiveVisitors] = useState<number>(0);
  const [totalPageViews, setTotalPageViews] = useState<number>(0);
  const [sessionStartTime] = useState<number>(() => {
    if (typeof window === "undefined") return Date.now();
    try {
      const saved = sessionStorage.getItem("pdfsun_session_start");
      if (saved) return parseInt(saved, 10);
      const now = Date.now();
      sessionStorage.setItem("pdfsun_session_start", now.toString());
      return now;
    } catch {
      return Date.now();
    }
  });
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(0);
  const [activeTabVisible, setActiveTabVisible] = useState<boolean>(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );

  // Event stream state
  const [eventStream, setEventStream] = useState<LiveStreamEvent[]>([]);
  const prevToolCountsRef = useRef<Record<string, { opened: number; completed: number; downloaded: number }>>({});

  // Page endpoint traffic breakdown (real server data)
  const [activePages, setActivePages] = useState<
    { path: string; label: string; activeUsers: number; percent: number }[]
  >([]);

  // Client device detection
  const currentDevice = useRef<"Desktop" | "Mobile" | "Tablet">("Desktop");
  const [deviceStats, setDeviceStats] = useState({
    desktop: 100,
    mobile: 0,
    tablet: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator) {
      const ua = navigator.userAgent.toLowerCase();
      if (/tablet|ipad|playbook|silk/i.test(ua)) {
        currentDevice.current = "Tablet";
        setDeviceStats({ desktop: 0, mobile: 0, tablet: 100 });
      } else if (/mobile|iphone|android|touch/i.test(ua)) {
        currentDevice.current = "Mobile";
        setDeviceStats({ desktop: 0, mobile: 100, tablet: 0 });
      } else {
        currentDevice.current = "Desktop";
        setDeviceStats({ desktop: 100, mobile: 0, tablet: 0 });
      }
    }
  }, []);

  // Track session timer
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      setSessionDurationSec(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Track tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setActiveTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Real polling pulse against /api/analytics/stats and /api/analytics/tools
  const triggerPollPulse = useCallback(async () => {
    const startTime = performance.now();
    try {
      const [statsRes, toolsRes] = await Promise.all([
        fetch("/api/analytics/stats", { credentials: "include" }),
        fetch("/api/analytics/tools", { credentials: "include" }),
      ]);
      const measuredPing = Math.max(1, Math.round(performance.now() - startTime));
      setPingMs(measuredPing);
      setLastSyncTime(new Date().toLocaleTimeString());

      if (!statsRes.ok || !toolsRes.ok) {
        setIsConnected(false);
        return;
      }

      setIsConnected(true);
      const statsJson = await statsRes.json();
      const toolsJson = await toolsRes.json();

      const live = statsJson?.data || {};
      setLiveVisitors(Number(live.activeUsers ?? live.activeUsersOnline ?? 0));

      const breakdown = (toolsJson?.breakdown || {}) as Record<
        string,
        { toolId: string; opened?: number; started?: number; completed?: number; downloaded?: number }
      >;
      const entries = Object.values(breakdown);
      const totalOpened = entries.reduce((sum, item) => sum + Number(item.opened || 0), 0);
      const totalConversions = Number(live.totalConversionsToday || 0);
      setTotalPageViews(Math.max(totalOpened, totalConversions));

      const sortedTools = entries
        .map((item) => ({
          id: item.toolId,
          count: Number(item.opened || 0) + Number(item.completed || 0),
        }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      const topSum = sortedTools.reduce((s, item) => s + item.count, 0);
      setActivePages(
        sortedTools.map((item) => ({
          path: `/${item.id}`,
          label: item.id,
          activeUsers: item.count,
          percent: topSum > 0 ? Math.round((item.count / topSum) * 100) : 0,
        }))
      );

      // Append real delta events when backend tool counters advance
      const newRealEvents: LiveStreamEvent[] = [];
      for (const entry of entries) {
        const prev = prevToolCountsRef.current[entry.toolId];
        const opened = Number(entry.opened || 0);
        const completed = Number(entry.completed || 0);
        const downloaded = Number(entry.downloaded || 0);
        if (prev) {
          const eventIdBase =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${Date.now()}-${entry.toolId}`;
          if (downloaded > prev.downloaded) {
            newRealEvents.push({
              id: `dl-${eventIdBase}`,
              timestamp: new Date().toLocaleTimeString(),
              eventType: "download",
              toolName: entry.toolId,
              path: `/${entry.toolId}`,
              device: currentDevice.current,
              location: "Server Verified",
              latencyMs: measuredPing,
            });
          } else if (completed > prev.completed) {
            newRealEvents.push({
              id: `exec-${eventIdBase}`,
              timestamp: new Date().toLocaleTimeString(),
              eventType: "tool_exec",
              toolName: entry.toolId,
              path: `/${entry.toolId}`,
              device: currentDevice.current,
              location: "Server Verified",
              latencyMs: measuredPing,
            });
          } else if (opened > prev.opened) {
            newRealEvents.push({
              id: `view-${eventIdBase}`,
              timestamp: new Date().toLocaleTimeString(),
              eventType: "pageview",
              toolName: entry.toolId,
              path: `/${entry.toolId}`,
              device: currentDevice.current,
              location: "Server Verified",
              latencyMs: measuredPing,
            });
          }
        }
        prevToolCountsRef.current[entry.toolId] = { opened, completed, downloaded };
      }

      if (newRealEvents.length > 0) {
        setEventStream((prev) => [...newRealEvents, ...prev].slice(0, 20));
        if (onEventTracked) {
          newRealEvents.forEach((evt) => onEventTracked(evt));
        }
      }
    } catch {
      setIsConnected(false);
    }
  }, [onEventTracked]);

  // Main polling timer
  useEffect(() => {
    if (!isPolling) return;

    triggerPollPulse();

    const interval = setInterval(() => {
      triggerPollPulse();
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [isPolling, pollingIntervalMs, triggerPollPulse]);

  // Format seconds into HH:MM:SS or MM:SS
  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Realtime Stream Header Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isConnected && isPolling
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              <Radio className={`w-5 h-5 ${isConnected && isPolling ? "animate-pulse" : ""}`} />
            </div>
            {isConnected && isPolling && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black tracking-wide uppercase text-white">
                WebSocket Live Traffic Engine
              </h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isConnected && isPolling
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                }`}
              >
                {isConnected && isPolling ? "Live Socket Stream" : "Stream Paused"}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-3 mt-0.5">
              <span>
                Syncing every <strong>{(pollingIntervalMs / 1000).toFixed(1)}s</strong>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Signal className="w-3 h-3 text-emerald-400" />
                <span>Ping: {pingMs}ms</span>
              </span>
              <span>•</span>
              <span>Last sync: {lastSyncTime || "Now"}</span>
            </p>
          </div>
        </div>

        {/* Stream Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <span className="text-[10px] font-extrabold text-slate-400 px-2 uppercase">Interval:</span>
            {[1000, 2000, 5000].map((ms) => (
              <button
                key={ms}
                onClick={() => setPollingIntervalMs(ms)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  pollingIntervalMs === ms
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              isPolling
                ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
            }`}
            title={isPolling ? "Pause Live Stream" : "Resume Live Stream"}
          >
            {isPolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden md:inline">{isPolling ? "Pause" : "Resume"}</span>
          </button>

          <button
            onClick={triggerPollPulse}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Manual Immediate Refresh Tick"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Live Active Visitors */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Live Concurrent Visitors</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {liveVisitors}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {isConnected ? "Connected" : "Idle"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-slate-400"} shrink-0`} />
            <span>Open analytics stream connections</span>
          </div>
        </div>

        {/* Metric 2: Live Page Views */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Today's Total Page Views</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalPageViews.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              Real-Time
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Verified browser navigation events
          </div>
        </div>

        {/* Metric 3: Active Session Clock */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Your Active Session Time</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {formatDuration(sessionDurationSec)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tab state: {activeTabVisible ? "Active Focus" : "Background"}</span>
          </div>
        </div>

        {/* Metric 4: Device & Client Details */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Your Connected Device</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {currentDevice.current === "Desktop" && <Laptop className="w-4 h-4" />}
              {currentDevice.current === "Mobile" && <Smartphone className="w-4 h-4" />}
              {currentDevice.current === "Tablet" && <Tablet className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {currentDevice.current}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {typeof window !== "undefined" ? window.navigator.language : "en-US"} • {typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "Desktop"}
          </div>
        </div>
      </div>

      {/* Middle Layout Grid: Active Tool Distribution & Real-time Live Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Active Endpoint / Tool Distribution */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Active Users By Tool Page
              </h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Live Breakdown</span>
          </div>

          <div className="space-y-3">
            {activePages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No recorded tool traffic yet today.
              </div>
            ) : (
              activePages.map((pg, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-200 truncate pr-2">
                      {pg.label}
                    </span>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {pg.activeUsers} events
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-black text-[11px]">
                        {pg.percent}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${pg.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Device Distribution Progress */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Device Share</span>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Desktop ({deviceStats.desktop}%)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Mobile ({deviceStats.mobile}%)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Tablet ({deviceStats.tablet}%)</span>
                </span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-500" style={{ width: `${deviceStats.desktop}%` }} />
              <div className="h-full bg-emerald-500" style={{ width: `${deviceStats.mobile}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${deviceStats.tablet}%` }} />
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Live WebSocket Event Log Feed */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Live Real-Time Activity Log Stream
              </h4>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {eventStream.length} Events Streamed
            </span>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
            {eventStream.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Waiting for incoming WebSocket traffic stream events...
              </div>
            ) : (
              eventStream.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        evt.eventType === "upload"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : evt.eventType === "download"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : evt.eventType === "tool_exec"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {evt.eventType === "upload" && <Upload className="w-3.5 h-3.5" />}
                      {evt.eventType === "download" && <Download className="w-3.5 h-3.5" />}
                      {evt.eventType === "tool_exec" && <FileText className="w-3.5 h-3.5" />}
                      {evt.eventType === "pageview" && <Eye className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {evt.toolName ? `${evt.toolName} (${evt.eventType})` : `Page view: ${evt.path}`}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                        <span>{evt.location}</span>
                        <span>•</span>
                        <span>{evt.device}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                      {evt.timestamp}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-mono">
                      {evt.latencyMs}ms
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
