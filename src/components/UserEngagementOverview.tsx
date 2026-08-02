import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Users,
  UserPlus,
  Clock,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
} from "lucide-react";

export interface EngagementDataPoint {
  day: string;
  dau: number;
  newSignups: number;
  avgSessionMins: number;
}

export interface UserEngagementOverviewProps {
  className?: string;
}

const engagementDataset: EngagementDataPoint[] = [
  { day: "Mon", dau: 1420, newSignups: 185, avgSessionMins: 6.8 },
  { day: "Tue", dau: 1580, newSignups: 210, avgSessionMins: 7.2 },
  { day: "Wed", dau: 1890, newSignups: 265, avgSessionMins: 8.1 },
  { day: "Thu", dau: 1740, newSignups: 230, avgSessionMins: 7.5 },
  { day: "Fri", dau: 2150, newSignups: 310, avgSessionMins: 8.9 },
  { day: "Sat", dau: 1980, newSignups: 280, avgSessionMins: 8.4 },
  { day: "Sun", dau: 2340, newSignups: 345, avgSessionMins: 9.3 },
];

export const UserEngagementOverview: React.FC<UserEngagementOverviewProps> = ({
  className = "",
}) => {
  const [activeMetric, setActiveMetric] = useState<"dau" | "signups" | "session">("dau");
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("7d");

  const totalDauAvg = Math.round(
    engagementDataset.reduce((acc, d) => acc + d.dau, 0) / engagementDataset.length
  );
  const totalSignups = engagementDataset.reduce((acc, d) => acc + d.newSignups, 0);
  const avgSessionOverall = (
    engagementDataset.reduce((acc, d) => acc + d.avgSessionMins, 0) / engagementDataset.length
  ).toFixed(1);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                User Engagement & Retention Analytics
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                Recharts Powered
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time daily active user traffic, new registration growth, and session duration trends.
            </p>
          </div>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <span className="text-[11px] font-bold text-slate-400">Span:</span>
          {(
            [
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
              { key: "90d", label: "90 Days" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`px-3 py-1 rounded-xl font-bold transition text-xs ${
                timeframe === t.key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: DAU */}
        <button
          onClick={() => setActiveMetric("dau")}
          className={`p-5 rounded-2xl text-left border transition shadow-sm space-y-2 ${
            activeMetric === "dau"
              ? "bg-indigo-500/10 border-indigo-500 dark:bg-indigo-950/40"
              : "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Daily Active Users (DAU)</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalDauAvg.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +14.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Average unique daily visitors
          </p>
        </button>

        {/* Card 2: New Sign-ups */}
        <button
          onClick={() => setActiveMetric("signups")}
          className={`p-5 rounded-2xl text-left border transition shadow-sm space-y-2 ${
            activeMetric === "signups"
              ? "bg-emerald-500/10 border-emerald-500 dark:bg-emerald-950/40"
              : "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>New Registrations</span>
            <UserPlus className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalSignups.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +18.5%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Total new user sign-ups this week
          </p>
        </button>

        {/* Card 3: Session Duration */}
        <button
          onClick={() => setActiveMetric("session")}
          className={`p-5 rounded-2xl text-left border transition shadow-sm space-y-2 ${
            activeMetric === "session"
              ? "bg-purple-500/10 border-purple-500 dark:bg-purple-950/40"
              : "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Avg Session Duration</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {avgSessionOverall} mins
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +1.2m
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Time spent per session on PDF tools
          </p>
        </button>
      </div>

      {/* Recharts Visualization Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>
                {activeMetric === "dau"
                  ? "Daily Active Users (DAU) Area Trend"
                  : activeMetric === "signups"
                  ? "Weekly New Sign-ups Bar Distribution"
                  : "Average Session Duration Curve"}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualizing active engagement metrics across peak user activity days
            </p>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {timeframe.toUpperCase()} Window
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === "dau" ? (
              <AreaChart data={engagementDataset}>
                <defs>
                  <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="dau"
                  name="Active Users"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#dauGradient)"
                />
              </AreaChart>
            ) : activeMetric === "signups" ? (
              <BarChart data={engagementDataset}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="newSignups"
                  name="New Registrations"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={engagementDataset}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgSessionMins"
                  name="Session Duration (mins)"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#a855f7" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
