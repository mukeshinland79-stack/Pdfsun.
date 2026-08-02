import React, { useState } from "react";
import {
  Activity,
  Clock,
  Zap,
  Filter,
  Download,
  AlertTriangle,
  Server,
  CheckCircle2,
  Flame,
  Info,
  Calendar,
} from "lucide-react";

export interface HourlyHeatmapCell {
  hour: number; // 0..23
  dayName: string; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  serverLoadPct: number; // 0..100
  apiLatencyMs: number; // e.g. 10..280 ms
  requestCount: number;
}

export interface AdminPerformanceHeatmapProps {
  className?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Generate realistic 24-hour x 7-day heatmap mock matrix
const generateHeatmapMatrix = (): HourlyHeatmapCell[] => {
  const matrix: HourlyHeatmapCell[] = [];

  DAYS.forEach((dayName, dayIndex) => {
    HOURS.forEach((hour) => {
      // Peak hours typically around 13:00 - 18:00 UTC
      const isPeakHour = hour >= 13 && hour <= 18;
      const isWeekend = dayName === "Sat" || dayName === "Sun";

      const baseLoad = isPeakHour ? 65 : 20;
      const loadVar = Math.floor(Math.random() * 25);
      const serverLoadPct = Math.min(98, Math.max(10, baseLoad + loadVar - (isWeekend ? 15 : 0)));

      const baseLatency = isPeakHour ? 110 : 25;
      const latencyVar = Math.floor(Math.random() * 60);
      const apiLatencyMs = Math.min(320, Math.max(8, baseLatency + latencyVar));

      const requestCount = Math.floor(serverLoadPct * 42 + Math.random() * 200);

      matrix.push({
        hour,
        dayName,
        serverLoadPct,
        apiLatencyMs,
        requestCount,
      });
    });
  });

  return matrix;
};

export const AdminPerformanceHeatmap: React.FC<AdminPerformanceHeatmapProps> = ({
  className = "",
}) => {
  const [metricMode, setMetricMode] = useState<"serverLoad" | "apiLatency">("serverLoad");
  const [matrixData] = useState<HourlyHeatmapCell[]>(generateHeatmapMatrix());
  const [hoveredCell, setHoveredCell] = useState<HourlyHeatmapCell | null>(null);

  // Helper color interpolator for heatmap cells
  const getCellColorClass = (cell: HourlyHeatmapCell) => {
    if (metricMode === "serverLoad") {
      const load = cell.serverLoadPct;
      if (load < 35) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      if (load < 65) return "bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border-indigo-500/40";
      if (load < 82) return "bg-amber-500/40 text-amber-800 dark:text-amber-200 border-amber-500/50";
      return "bg-red-500/60 text-white border-red-500 font-black animate-pulse";
    } else {
      const latency = cell.apiLatencyMs;
      if (latency < 50) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      if (latency < 120) return "bg-blue-500/30 text-blue-700 dark:text-blue-300 border-blue-500/40";
      if (latency < 190) return "bg-amber-500/40 text-amber-800 dark:text-amber-200 border-amber-500/50";
      return "bg-red-500/60 text-white border-red-500 font-black animate-pulse";
    }
  };

  // Find peak load cell
  const peakCell = matrixData.reduce((prev, current) => {
    const prevVal = metricMode === "serverLoad" ? prev.serverLoadPct : prev.apiLatencyMs;
    const currVal = metricMode === "serverLoad" ? current.serverLoadPct : current.apiLatencyMs;
    return currVal > prevVal ? current : prev;
  }, matrixData[0]);

  const exportHeatmapCsv = () => {
    let csv = "Day,Hour (UTC),Server Load %,API Latency (ms),Request Volume\n";
    matrixData.forEach((c) => {
      csv += `"${c.dayName}",${c.hour}:00,${c.serverLoadPct}%,${c.apiLatencyMs}ms,${c.requestCount}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PDFSun_Performance_Heatmap_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-flame-500/20 text-amber-400 bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Flame className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                24-Hour Server Performance & Latency Heatmap
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                Peak Load Profiler
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hourly 7-day matrix mapping infrastructure CPU stress and response latency bottlenecks.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Mode Selector */}
          <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setMetricMode("serverLoad")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                metricMode === "serverLoad"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Server Load (%)
            </button>
            <button
              onClick={() => setMetricMode("apiLatency")}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                metricMode === "apiLatency"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              API Latency (ms)
            </button>
          </div>

          <button
            onClick={exportHeatmapCsv}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Peak Telemetry Insight Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white">
              Identified Peak Hour Bottleneck: <span className="text-amber-500 font-mono">{peakCell.dayName} at {peakCell.hour}:00 UTC</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Highest registered value:{" "}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {metricMode === "serverLoad" ? `${peakCell.serverLoadPct}% CPU` : `${peakCell.apiLatencyMs} ms Response`}
              </strong>{" "}
              with {peakCell.requestCount.toLocaleString()} total API executions.
            </p>
          </div>
        </div>

        {/* Heat Legend */}
        <div className="flex items-center space-x-3 text-[11px] font-bold shrink-0">
          <span className="text-slate-400">Heat Level:</span>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" title="Low" />
            <span className="text-slate-500">Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-indigo-500/40 border border-indigo-500/50" title="Normal" />
            <span className="text-slate-500">Normal</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-amber-500/50 border border-amber-500/50" title="Elevated" />
            <span className="text-slate-500">Elevated</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-red-500 border border-red-500" title="Peak" />
            <span className="text-slate-500">Peak Stress</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Matrix Grid */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              7-Day &times; 24-Hour Metric Grid
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            Hover cell for precise telemetry breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px] space-y-2">
            {/* Hour Labels Row */}
            <div className="grid grid-cols-25 gap-1 text-[10px] font-mono font-bold text-slate-400 text-center">
              <div className="text-left font-sans text-slate-500">Day \ Hr</div>
              {HOURS.map((h) => (
                <div key={h}>{h}</div>
              ))}
            </div>

            {/* Matrix Days Rows */}
            {DAYS.map((day) => (
              <div key={day} className="grid grid-cols-25 gap-1 items-center">
                <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                  {day}
                </div>
                {HOURS.map((hour) => {
                  const cell = matrixData.find((c) => c.dayName === day && c.hour === hour);
                  if (!cell) return null;

                  const colorClass = getCellColorClass(cell);
                  const displayValue = metricMode === "serverLoad" ? `${cell.serverLoadPct}%` : `${cell.apiLatencyMs}m`;

                  return (
                    <div
                      key={hour}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-8 rounded-lg border text-[9px] font-mono font-extrabold flex items-center justify-center cursor-pointer transition-transform transform hover:scale-110 shadow-xs ${colorClass}`}
                      title={`${day} at ${hour}:00 - Load: ${cell.serverLoadPct}%, Latency: ${cell.apiLatencyMs}ms`}
                    >
                      {cell.serverLoadPct > 85 || cell.apiLatencyMs > 200 ? displayValue : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Hover Cell Inspector Modal Card */}
        {hoveredCell ? (
          <div className="p-3 rounded-xl bg-slate-900 text-white border border-indigo-500/50 shadow-xl flex items-center justify-between text-xs animate-in fade-in-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono font-black">
                {hoveredCell.dayName} {hoveredCell.hour}:00
              </div>
              <div>
                <span className="font-extrabold text-white">Hourly Telemetry Snapshot</span>
                <div className="text-[11px] text-slate-400 font-mono">
                  Total Requests: <strong>{hoveredCell.requestCount.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">CPU Load</span>
                <span className="font-black text-amber-400">{hoveredCell.serverLoadPct}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Response Latency</span>
                <span className="font-black text-emerald-400">{hoveredCell.apiLatencyMs} ms</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-400">
            Hover over any cell in the 24-hour heatmap grid to inspect detailed telemetry.
          </div>
        )}
      </div>
    </div>
  );
};
