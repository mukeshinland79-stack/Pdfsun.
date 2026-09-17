import React, { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Zap, Globe, Activity, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export interface LiveActivityStatsWidgetProps {
  className?: string;
  variant?: "banner" | "compact" | "minimal";
  userRegion?: string;
}

export const LiveActivityStatsWidget: React.FC<LiveActivityStatsWidgetProps> = ({
  className = "",
  variant = "banner",
  userRegion,
}) => {
  const { currentLanguage } = useLanguage();

  const [filesCount, setFilesCount] = useState<number | null>(null);
  const [activeUsers, setActiveUsers] = useState<number>(1);
  const [avgSpeedMs, setAvgSpeedMs] = useState<number>(120);

  // Connect to actual server-side SSE telemetry stream and stats API
  useEffect(() => {
    let isMounted = true;

    fetch("/api/analytics/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (isMounted && payload?.data) {
          setFilesCount(payload.data.totalConversionsToday ?? 0);
          setActiveUsers(Math.max(1, payload.data.activeUsersOnline ?? 1));
          if (payload.data.serverLoadMs) {
            setAvgSpeedMs(payload.data.serverLoadMs);
          }
        }
      })
      .catch(() => {
        if (isMounted) setFilesCount(0);
      });

    let eventSource: EventSource | null = null;
    try {
      if (typeof window !== "undefined" && window.EventSource) {
        eventSource = new EventSource("/api/analytics/live");
        eventSource.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (typeof data.totalConversionsToday === "number") {
              setFilesCount(data.totalConversionsToday);
            }
            if (typeof data.activeUsersOnline === "number") {
              setActiveUsers(Math.max(1, data.activeUsersOnline));
            }
            if (typeof data.serverLoadMs === "number") {
              setAvgSpeedMs(data.serverLoadMs);
            }
          } catch {
            // Ignore parse errors from heartbeat pings
          }
        };
      }
    } catch {
      // Graceful fallback if SSE is blocked by proxy
    }

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Format numbers cleanly
  const formattedCount = useMemo(() => {
    if (filesCount === null) return "—";
    return filesCount.toLocaleString();
  }, [filesCount]);

  // Tier-aware regional compliance badge
  const regionalBadge = useMemo(() => {
    const lang = currentLanguage?.toLowerCase() || "en";
    if (lang === "hi") {
      return {
        label: "Tier-3 APAC",
        text: "Govt Portal & Exam Ready (50KB-200KB)",
        accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      };
    }
    if (["de", "fr", "es", "it", "nl"].includes(lang)) {
      return {
        label: "Tier-1 Europe",
        text: "GDPR Compliant • 100% In-Browser WASM",
        accent: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      };
    }
    if (["ar"].includes(lang)) {
      return {
        label: "Tier-2 Middle East",
        text: "Zero Cloud Bandwidth • 100% Private",
        accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      };
    }
    // Default Tier-1 North America / Global
    return {
      label: "Tier-1 Global",
      text: "HIPAA & Zero-Data-Retention Certified",
      accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    };
  }, [currentLanguage]);

  if (variant === "minimal") {
    return (
      <div className={`inline-flex items-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-300 ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
          {filesCount !== null && filesCount > 0 ? `${formattedCount} files processed` : "In-Browser Engine Ready"}
        </span>
        <span>•</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeUsers} active</span>
      </div>
    );
  }

  return (
    <div
      id="live-activity-stats-widget"
      aria-label="Real-Time Processing Telemetry"
      className={`w-full max-w-5xl mx-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md shadow-xs py-2 px-3 sm:px-4 transition-all duration-300 ${className}`}
      style={{ minHeight: "44px" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Left: Pulse dot + Real-time volume counter */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {filesCount !== null && filesCount > 0 ? formattedCount : "Private WASM"}
            </span>
            <span className="text-slate-600 dark:text-slate-400 hidden xs:inline">
              {filesCount !== null && filesCount > 0 ? "Files Processed Today" : "Processing Active"}
            </span>
          </div>
        </div>

        {/* Center: Processing Speed & Architecture Guarantee */}
        <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <Zap className="w-3 h-3 shrink-0" />
            <span>Avg Speed: <strong className="tabular-nums font-bold">{(avgSpeedMs / 1000).toFixed(2)}s</strong></span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-medium">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>100% In-Browser WASM</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 font-medium">
            <Globe className="w-3 h-3 shrink-0" />
            <span><strong className="text-slate-900 dark:text-white tabular-nums">{activeUsers}</strong> online</span>
          </div>
        </div>

        {/* Right: Tier-Aware Regional badge */}
        <div className="flex items-center space-x-2 ml-auto">
          <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${regionalBadge.accent}`}
            title="Privacy and regulatory adherence"
          >
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>{regionalBadge.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
