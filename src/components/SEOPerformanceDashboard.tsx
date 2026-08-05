import React, { useState } from "react";
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
  Search,
  TrendingUp,
  Globe,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  MousePointerClick,
  Eye,
  Percent,
  Award,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  SearchCode,
  FileText,
} from "lucide-react";

export interface KeywordRankingItem {
  query: string;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgPosition: number;
  positionChange: number; // e.g. +1.4 means moved up 1.4 positions
  targetUrl: string;
  intent: "Transactional" | "Informational" | "Navigational";
}

export interface SeoTrendPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgPosition: number;
}

export interface SEOPerformanceDashboardProps {
  className?: string;
}

const mockSeoTimeSeries: SeoTrendPoint[] = [
  { date: "Jul 1", clicks: 4200, impressions: 32000, ctrPct: 13.1, avgPosition: 4.2 },
  { date: "Jul 5", clicks: 4800, impressions: 35400, ctrPct: 13.5, avgPosition: 3.9 },
  { date: "Jul 10", clicks: 5300, impressions: 38200, ctrPct: 13.8, avgPosition: 3.7 },
  { date: "Jul 15", clicks: 5900, impressions: 41000, ctrPct: 14.3, avgPosition: 3.5 },
  { date: "Jul 20", clicks: 6400, impressions: 43500, ctrPct: 14.7, avgPosition: 3.3 },
  { date: "Jul 25", clicks: 7100, impressions: 47200, ctrPct: 15.0, avgPosition: 3.1 },
  { date: "Jul 30", clicks: 7800, impressions: 51000, ctrPct: 15.2, avgPosition: 2.9 },
];

const mockKeywordRankings: KeywordRankingItem[] = [
  {
    query: "compress pdf online free",
    clicks: 42100,
    impressions: 245000,
    ctrPct: 17.18,
    avgPosition: 1.8,
    positionChange: +0.6,
    targetUrl: "/compress-pdf",
    intent: "Transactional",
  },
  {
    query: "merge pdf files without limits",
    clicks: 34800,
    impressions: 210000,
    ctrPct: 16.57,
    avgPosition: 2.1,
    positionChange: +1.2,
    targetUrl: "/merge-pdf",
    intent: "Transactional",
  },
  {
    query: "pdf to word converter free",
    clicks: 29400,
    impressions: 195000,
    ctrPct: 15.07,
    avgPosition: 2.4,
    positionChange: -0.2,
    targetUrl: "/pdf-to-word",
    intent: "Transactional",
  },
  {
    query: "edit pdf text online free",
    clicks: 22100,
    impressions: 168000,
    ctrPct: 13.15,
    avgPosition: 3.2,
    positionChange: +2.1,
    targetUrl: "/pdf-editor",
    intent: "Transactional",
  },
  {
    query: "split pdf pages online",
    clicks: 18500,
    impressions: 142000,
    ctrPct: 13.02,
    avgPosition: 3.5,
    positionChange: +0.8,
    targetUrl: "/split-pdf",
    intent: "Transactional",
  },
  {
    query: "how to compress pdf to 100kb",
    clicks: 14200,
    impressions: 118000,
    ctrPct: 12.03,
    avgPosition: 4.1,
    positionChange: +1.5,
    targetUrl: "/blog/how-to-compress-pdf-100kb",
    intent: "Informational",
  },
  {
    query: "pdfsun pdf tools",
    clicks: 12800,
    impressions: 24000,
    ctrPct: 53.33,
    avgPosition: 1.0,
    positionChange: 0.0,
    targetUrl: "/",
    intent: "Navigational",
  },
];

export const SEOPerformanceDashboard: React.FC<SEOPerformanceDashboardProps> = ({
  className = "",
}) => {
  const [timeframe, setTimeframe] = useState<"7d" | "28d" | "3m" | "12m">("28d");
  const [activeTab, setActiveTab] = useState<"traffic" | "keywords" | "position">("traffic");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const filteredKeywords = mockKeywordRankings.filter(
    (k) =>
      k.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.targetUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClicks = mockKeywordRankings.reduce((sum, k) => sum + k.clicks, 0);
  const totalImpressions = mockKeywordRankings.reduce((sum, k) => sum + k.impressions, 0);
  const avgCtr = (totalClicks / totalImpressions) * 100;
  const weightedPosition = (
    mockKeywordRankings.reduce((sum, k) => sum + k.avgPosition * k.impressions, 0) /
    totalImpressions
  ).toFixed(1);

  const handleRefreshSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  const exportKeywordCsv = () => {
    let csv = "Query,Clicks,Impressions,CTR (%),Avg Position,Position Change,Target URL,Intent\n";
    mockKeywordRankings.forEach((k) => {
      csv += `"${k.query}",${k.clicks},${k.impressions},${k.ctrPct}%,${k.avgPosition},${k.positionChange},"${k.targetUrl}","${k.intent}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PDFSun_Search_Console_SEO_Keywords_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <SearchCode className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Google Search Console SEO & Keyword Rankings
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                GSC API Synced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Domain: <strong className="text-emerald-400 font-mono">pdfsun.in</strong> &bull; Organic CTR, Google SERP positions, and search query trends.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Timeframe selector */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            {(
              [
                { key: "7d", label: "7D" },
                { key: "28d", label: "28D" },
                { key: "3m", label: "3M" },
                { key: "12m", label: "12M" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeframe(t.key)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  timeframe === t.key
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefreshSync}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition"
            title="Force Google Search Console API Sync"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          <button
            onClick={exportKeywordCsv}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Primary GSC KPI Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total Organic Clicks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Total Clicks</span>
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalClicks.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +18.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Organic clicks from Google SERP
          </p>
        </div>

        {/* Card 2: Total Impressions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Total Impressions</span>
            <Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {(totalImpressions / 1000).toFixed(1)}K
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +24.1%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Times PDFSun appeared in search
          </p>
        </div>

        {/* Card 3: Average Organic CTR */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Average CTR</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {avgCtr.toFixed(2)}%
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +2.1%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Click-through rate across top queries
          </p>
        </div>

        {/* Card 4: Average Search Position */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Average Position</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {weightedPosition}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +0.8 Rank
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Average SERP rank on targeted terms
          </p>
        </div>
      </div>

      {/* Main Visualizations: Recharts Trends */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Organic Search Performance & Clicks Growth</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Google Search Console daily traffic telemetry
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("traffic")}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === "traffic"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Clicks & Impressions
            </button>
            <button
              onClick={() => setActiveTab("position")}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === "position"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Position & CTR Curve
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "traffic" ? (
              <AreaChart data={mockSeoTimeSeries}>
                <defs>
                  <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
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
                <Legend />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  name="Organic Clicks"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#clicksGrad)"
                />
              </AreaChart>
            ) : (
              <LineChart data={mockSeoTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis yAxisId="left" stroke="#a855f7" fontSize={12} tickLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f59e0b"
                  fontSize={12}
                  tickLine={false}
                  reversed
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ctrPct"
                  name="CTR (%)"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgPosition"
                  name="Avg Position (Lower = Better)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Keyword Rankings Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Top Search Keywords & SERP Rankings
            </h4>
          </div>

          {/* Search filter input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search query or URL..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-black">
                <th className="py-2.5 px-3">Search Query</th>
                <th className="py-2.5 px-3">Intent</th>
                <th className="py-2.5 px-3">Clicks</th>
                <th className="py-2.5 px-3">Impressions</th>
                <th className="py-2.5 px-3">CTR (%)</th>
                <th className="py-2.5 px-3">SERP Rank</th>
                <th className="py-2.5 px-3">Target Landing Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 font-sans">
                    No keywords matching search filter.
                  </td>
                </tr>
              ) : (
                filteredKeywords.map((k, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-sans">
                      {k.query}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-extrabold uppercase ${
                          k.intent === "Transactional"
                            ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                            : k.intent === "Informational"
                            ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                            : "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {k.intent}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {k.clicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {k.impressions.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">
                      {k.ctrPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-900 dark:text-white">#{k.avgPosition}</span>
                        {k.positionChange > 0 && (
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center">
                            <ArrowUpRight className="w-3 h-3" />
                            +{k.positionChange}
                          </span>
                        )}
                        {k.positionChange < 0 && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center">
                            <ArrowDownRight className="w-3 h-3" />
                            {k.positionChange}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-sans">
                      <a
                        href={k.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-indigo-500 flex items-center space-x-1"
                      >
                        <span className="truncate max-w-[140px]">{k.targetUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
