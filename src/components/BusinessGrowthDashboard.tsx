import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Target,
  Award,
  Filter,
  RefreshCw,
  Clock,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";

export interface RetentionCohort {
  weekLabel: string;
  users: number;
  day1: number;
  day7: number;
  day14: number;
  day30: number;
}

export interface ToolTrendData {
  toolName: string;
  category: string;
  weeklyGrowthPct: number;
  totalConversions: number;
  sharePct: number;
  status: "surging" | "steady" | "declining";
}

export interface BusinessGrowthDashboardProps {
  className?: string;
}

export const BusinessGrowthDashboard: React.FC<BusinessGrowthDashboardProps> = ({
  className = "",
}) => {
  const [timeframe, setTimeframe] = useState<"4w" | "8w" | "quarter">("4w");
  const [activeMetric, setActiveMetric] = useState<"retention" | "conversions" | "tools">("tools");
  const [liveStats, setLiveStats] = useState<{
    totalConversionsToday: number;
    successfulConversions: number;
    failedConversions: number;
    cancelledProcesses: number;
    successRatePercent: number | null;
    serverLoadMs: number | null;
    activeUsers: number;
  }>({
    totalConversionsToday: 0,
    successfulConversions: 0,
    failedConversions: 0,
    cancelledProcesses: 0,
    successRatePercent: null,
    serverLoadMs: null,
    activeUsers: 0,
  });
  const [toolTrends, setToolTrends] = useState<ToolTrendData[]>([]);

  useEffect(() => {
    let active = true;
    const loadAnalytics = async () => {
      try {
        const [statsRes, toolsRes] = await Promise.all([
          fetch("/api/analytics/stats", { credentials: "include" }),
          fetch("/api/analytics/tools", { credentials: "include" }),
        ]);
        if (statsRes.ok && active) {
          const sJson = await statsRes.json();
          if (sJson?.data) {
            setLiveStats({
              totalConversionsToday: Number(sJson.data.totalConversionsToday || 0),
              successfulConversions: Number(sJson.data.successfulConversions || 0),
              failedConversions: Number(sJson.data.failedConversions || 0),
              cancelledProcesses: Number(sJson.data.cancelledProcesses || 0),
              successRatePercent:
                typeof sJson.data.successRatePercent === "number" ? sJson.data.successRatePercent : null,
              serverLoadMs: typeof sJson.data.serverLoadMs === "number" ? sJson.data.serverLoadMs : null,
              activeUsers: Number(sJson.data.activeUsers || 0),
            });
          }
        }
        if (toolsRes.ok && active) {
          const tJson = await toolsRes.json();
          const breakdown = (tJson?.breakdown || {}) as Record<
            string,
            { toolId: string; completed?: number; downloaded?: number }
          >;
          const entries = Object.values(breakdown)
            .map((e) => ({
              toolId: e.toolId,
              count: Number(e.completed || 0),
            }))
            .filter((e) => e.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          const sum = entries.reduce((acc, e) => acc + e.count, 0);
          setToolTrends(
            entries.map((e) => ({
              toolName: e.toolId,
              category: "Recorded Tool",
              weeklyGrowthPct: 0,
              totalConversions: e.count,
              sharePct: sum > 0 ? Math.round((e.count / sum) * 100) : 0,
              status: "steady" as const,
            }))
          );
        }
      } catch {
        // Non-blocking
      }
    };
    loadAnalytics();
    return () => {
      active = false;
    };
  }, [timeframe]);

  const cohorts: RetentionCohort[] = [];
  const conversionWeekly: { week: string; uploads: number; conversions: number; downloads: number }[] = [];
  const maxUploads = 1;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                Enterprise Business Intelligence & Growth Engine
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Live Analysis
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verified retention metrics, conversion funnel efficiency, and product adoption analytics.
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <span className="text-[11px] font-bold text-slate-400">Range:</span>
          {(
            [
              { key: "4w", label: "Last 4 Weeks" },
              { key: "8w", label: "Last 8 Weeks" },
              { key: "quarter", label: "Q3 2026" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTimeframe(item.key)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                timeframe === item.key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Overview (Live Server Telemetry) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Users Online */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Active Stream Connections</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {liveStats.activeUsers}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Currently open telemetry connections
          </p>
        </div>

        {/* KPI 2: Overall Conversion Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Conversion Success Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {liveStats.successRatePercent !== null ? `${liveStats.successRatePercent.toFixed(1)}%` : "—"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Recorded completion vs failure ratio today
          </p>
        </div>

        {/* KPI 3: Conversions Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Recorded Conversions Today</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {liveStats.totalConversionsToday.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Verified processing completions on server
          </p>
        </div>

        {/* KPI 4: Avg Latency */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Avg Processing Latency</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {liveStats.serverLoadMs !== null ? `${liveStats.serverLoadMs}ms` : "—"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Measured mean execution duration
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        {[
          { key: "retention", label: "User Retention Cohorts", icon: Users },
          { key: "conversions", label: "Conversion Funnel Growth", icon: BarChart3 },
          { key: "tools", label: "Tool Popularity Trends", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMetric === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveMetric(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Retention Cohort Grid */}
      {activeMetric === "retention" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Weekly Retention Decay Analysis
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Percentage of unique visitors returning to PDFSun after initial session
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                Avg D30 Retention: —
              </span>
            </div>

            {/* SVG Visual Retention Decay Lines */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="h-44 w-full relative flex items-end justify-between px-4 pb-6 pt-4">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-4 px-2 opacity-20 pointer-events-none">
                  <div className="border-b border-slate-400 text-[9px] font-mono">100%</div>
                  <div className="border-b border-slate-400 text-[9px] font-mono">75%</div>
                  <div className="border-b border-slate-400 text-[9px] font-mono">50%</div>
                  <div className="border-b border-slate-400 text-[9px] font-mono">25%</div>
                </div>

                {/* Bars representing retention stages */}
                {["Day 1", "Day 7", "Day 14", "Day 30"].map((dayLabel, idx) => {
                  const values = cohorts.map((c) =>
                    idx === 0 ? c.day1 : idx === 1 ? c.day7 : idx === 2 ? c.day14 : c.day30
                  );
                  const avgVal =
                    values.length > 0
                      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
                      : 0;

                  return (
                    <div key={dayLabel} className="flex-1 flex flex-col items-center z-10 space-y-2">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {avgVal}%
                      </span>
                      <div className="w-12 sm:w-20 bg-slate-200 dark:bg-slate-700 rounded-2xl h-28 overflow-hidden flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-2xl transition-all duration-500"
                          style={{ height: `${avgVal}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retention Cohorts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-black">
                    <th className="py-3 px-3">Cohort Week</th>
                    <th className="py-3 px-3">New Users</th>
                    <th className="py-3 px-3">Day 1</th>
                    <th className="py-3 px-3">Day 7</th>
                    <th className="py-3 px-3">Day 14</th>
                    <th className="py-3 px-3">Day 30</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {cohorts.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 font-sans">
                        {c.weekLabel}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                        {c.users.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                          {c.day1}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                          {c.day7}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                          {c.day14}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                          {c.day30}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Conversion Funnel Growth */}
      {activeMetric === "conversions" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Weekly Conversion Volume & Funnel Throughput
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tracking document upload jobs vs successful engine outputs
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                Recorded Success Rate:{" "}
                {liveStats.successRatePercent !== null ? `${liveStats.successRatePercent.toFixed(1)}%` : "—"}
              </span>
            </div>

            {/* Funnel SVG Stacked Bars */}
            <div className="space-y-4 pt-2">
              {conversionWeekly.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No historical weekly cohort snapshots recorded yet. Today&apos;s live server counts:{" "}
                  <strong>{liveStats.successfulConversions}</strong> succeeded,{" "}
                  <strong>{liveStats.failedConversions}</strong> failed,{" "}
                  <strong>{liveStats.cancelledProcesses}</strong> cancelled.
                </div>
              ) : (
                conversionWeekly.map((item) => (
                  <div key={item.week} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200 font-mono">
                        Week {item.week}
                      </span>
                      <div className="flex items-center space-x-4 text-[11px] font-mono">
                        <span className="text-slate-400">
                          Uploads: <strong>{item.uploads}</strong>
                        </span>
                        <span className="text-blue-500">
                          Converted: <strong>{item.conversions}</strong>
                        </span>
                        <span className="text-emerald-500">
                          Downloaded: <strong>{item.downloads}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(item.downloads / maxUploads) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tool Popularity Trends */}
      {activeMetric === "tools" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Top Performing PDF Tools
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ranking PDFSun tools by genuine recorded conversions on server
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {toolTrends.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No tool conversion records stored yet. Run a PDF tool to record real metrics.
                </div>
              ) : (
                toolTrends.map((t, idx) => (
                  <div
                    key={t.toolName}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{t.toolName}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {t.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t.totalConversions.toLocaleString()} recorded conversions • {t.sharePct}% share
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Automated AI Executive Insights */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-500/30 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Live Platform Telemetry Summary</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/20">
            <strong className="text-slate-900 dark:text-white block mb-1">
              Top Tool Today
            </strong>
            {toolTrends[0]
              ? `${toolTrends[0].toolName} leads with ${toolTrends[0].totalConversions} recorded completions.`
              : "Awaiting first recorded tool conversion."}
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/20">
            <strong className="text-slate-900 dark:text-white block mb-1">
              Active Stream Connections
            </strong>
            Currently tracking {liveStats.activeUsers} open telemetry stream(s).
          </div>
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/20">
            <strong className="text-slate-900 dark:text-white block mb-1">
              Conversion Efficiency
            </strong>
            Measured average latency:{" "}
            <strong>{liveStats.serverLoadMs !== null ? `${liveStats.serverLoadMs}ms` : "—"}</strong>{" "}
            ({liveStats.successRatePercent !== null ? `${liveStats.successRatePercent.toFixed(1)}% success` : "no outcomes yet"}).
          </div>
        </div>
      </div>
    </div>
  );
};
