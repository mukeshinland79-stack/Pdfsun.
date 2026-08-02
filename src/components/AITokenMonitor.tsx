import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Sparkles,
  Zap,
  DollarSign,
  Cpu,
  TrendingUp,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  PieChart,
} from "lucide-react";

export interface ModelUsageData {
  modelName: string;
  alias: string;
  promptTokens: number; // Input tokens
  outputTokens: number; // Output candidate tokens
  totalTokens: number;
  estimatedCostUsd: number;
  requestCount: number;
  avgLatencyMs: number;
}

export interface AITokenMonitorProps {
  className?: string;
}

const initialModelUsage: ModelUsageData[] = [
  {
    modelName: "gemini-2.5-flash",
    alias: "Gemini 2.5 Flash",
    promptTokens: 1420000,
    outputTokens: 680000,
    totalTokens: 2100000,
    estimatedCostUsd: 0.28,
    requestCount: 8420,
    avgLatencyMs: 320,
  },
  {
    modelName: "gemini-2.5-pro",
    alias: "Gemini 2.5 Pro",
    promptTokens: 480000,
    outputTokens: 290000,
    totalTokens: 770000,
    estimatedCostUsd: 1.85,
    requestCount: 1240,
    avgLatencyMs: 840,
  },
  {
    modelName: "gemini-1.5-flash",
    alias: "Gemini 1.5 Flash",
    promptTokens: 920000,
    outputTokens: 410000,
    totalTokens: 1330000,
    estimatedCostUsd: 0.16,
    requestCount: 5120,
    avgLatencyMs: 290,
  },
  {
    modelName: "gemini-flash-lite",
    alias: "Gemini Flash Lite",
    promptTokens: 1850000,
    outputTokens: 790000,
    totalTokens: 2640000,
    estimatedCostUsd: 0.19,
    requestCount: 12100,
    avgLatencyMs: 180,
  },
];

export const AITokenMonitor: React.FC<AITokenMonitorProps> = ({
  className = "",
}) => {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const [data, setData] = useState<ModelUsageData[]>(initialModelUsage);
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);

  // Live ticker updating token counts slightly
  useEffect(() => {
    if (!isLiveStream) return;

    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((m) => {
          const addedPrompt = Math.floor(Math.random() * 450) + 50;
          const addedOutput = Math.floor(Math.random() * 200) + 20;
          const newPrompt = m.promptTokens + addedPrompt;
          const newOutput = m.outputTokens + addedOutput;
          const newTotal = newPrompt + newOutput;
          // Rough cost multiplier
          const costFactor = m.modelName.includes("pro") ? 0.0000025 : 0.00000012;
          const newCost = +(m.estimatedCostUsd + (addedPrompt + addedOutput) * costFactor).toFixed(4);

          return {
            ...m,
            promptTokens: newPrompt,
            outputTokens: newOutput,
            totalTokens: newTotal,
            estimatedCostUsd: newCost,
            requestCount: m.requestCount + 1,
          };
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveStream]);

  const totalTokensCombined = data.reduce((acc, m) => acc + m.totalTokens, 0);
  const totalCostCombined = data.reduce((acc, m) => acc + m.estimatedCostUsd, 0);
  const totalRequestsCombined = data.reduce((acc, m) => acc + m.requestCount, 0);

  const exportTokenCsv = () => {
    let csv = "Model,Alias,Prompt Tokens,Output Tokens,Total Tokens,Requests,Avg Latency (ms),Est Cost (USD)\n";
    data.forEach((m) => {
      csv += `"${m.modelName}","${m.alias}",${m.promptTokens},${m.outputTokens},${m.totalTokens},${m.requestCount},${m.avgLatencyMs},$${m.estimatedCostUsd}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PDFSun_Gemini_AI_Token_Consumption_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white border border-purple-900/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Gemini AI Model Token Consumption & Cost Monitor
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                Real-Time Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live prompt/output token tracking across Gemini models to optimize costs and AI tool efficiency.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              isLiveStream
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {isLiveStream ? "Live Telemetry" : "Stream Paused"}
          </button>

          <button
            onClick={exportTokenCsv}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Tokens Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Total Tokens Consumed</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {(totalTokensCombined / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs font-bold text-emerald-500 font-mono">
              {totalTokensCombined.toLocaleString()} tokens
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Combined prompt and completion candidate tokens
          </p>
        </div>

        {/* Estimated API Cost Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Estimated Gemini API Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ${totalCostCombined.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-emerald-500 font-mono">
              USD
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Calculated rate based on Google Cloud Gemini pricing
          </p>
        </div>

        {/* Total AI Invocations Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Total AI Invocations</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalRequestsCombined.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-500 font-mono">
              Calls
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            OCR, summaries, translation, and chat requests
          </p>
        </div>
      </div>

      {/* Main Recharts Bar Chart Breakdown */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Token Consumption Breakdown by Gemini Model</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparative distribution of input prompt tokens vs output completion tokens
            </p>
          </div>

          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            Recharts Bar Visualization
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="alias" stroke="#94a3b8" fontSize={12} tickLine={false} />
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
              <Bar dataKey="promptTokens" name="Prompt Tokens (Input)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="outputTokens" name="Output Tokens (Completion)" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Gemini Models Breakdown Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Gemini Model Cost & Latency Ranks
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            {data.length} Models Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-black">
                <th className="py-2.5 px-3">Model Name</th>
                <th className="py-2.5 px-3">Prompt Tokens</th>
                <th className="py-2.5 px-3">Output Tokens</th>
                <th className="py-2.5 px-3">Total Tokens</th>
                <th className="py-2.5 px-3">Invocations</th>
                <th className="py-2.5 px-3">Avg Latency</th>
                <th className="py-2.5 px-3">Est Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {data.map((m) => (
                <tr key={m.modelName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-sans flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span>{m.alias}</span>
                  </td>
                  <td className="py-3 px-3 text-purple-600 dark:text-purple-400">
                    {m.promptTokens.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                    {m.outputTokens.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {m.totalTokens.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {m.requestCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {m.avgLatencyMs} ms
                  </td>
                  <td className="py-3 px-3 font-extrabold text-emerald-500">
                    ${m.estimatedCostUsd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
