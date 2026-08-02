import React, { useState, useEffect, useCallback } from "react";
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Pause,
} from "lucide-react";

export interface MetricTimeSeriesPoint {
  time: string;
  trafficReqMin: number;
  conversionRatePct: number;
  latencyMs: number;
}

export interface DetectedAnomaly {
  id: string;
  time: string;
  metricName: string;
  currentVal: number;
  baselineMean: number;
  stdDev: number;
  zScore: number;
  type: "spike" | "drop";
  severity: "critical" | "warning";
  explanation: string;
}

export interface AdminAnomalyDetectorProps {
  className?: string;
}

export const AdminAnomalyDetector: React.FC<AdminAnomalyDetectorProps> = ({
  className = "",
}) => {
  const [sensitivityZ, setSensitivityZ] = useState<number>(2.0); // Z-score threshold
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<string>("");

  // Baseline metric history (last 15 intervals)
  const [history, setHistory] = useState<MetricTimeSeriesPoint[]>([
    { time: "10:00", trafficReqMin: 120, conversionRatePct: 98.4, latencyMs: 14 },
    { time: "10:01", trafficReqMin: 124, conversionRatePct: 98.6, latencyMs: 12 },
    { time: "10:02", trafficReqMin: 118, conversionRatePct: 98.2, latencyMs: 15 },
    { time: "10:03", trafficReqMin: 122, conversionRatePct: 98.5, latencyMs: 13 },
    { time: "10:04", trafficReqMin: 125, conversionRatePct: 98.7, latencyMs: 12 },
    { time: "10:05", trafficReqMin: 119, conversionRatePct: 98.3, latencyMs: 14 },
    { time: "10:06", trafficReqMin: 121, conversionRatePct: 98.6, latencyMs: 13 },
    { time: "10:07", trafficReqMin: 123, conversionRatePct: 98.4, latencyMs: 12 },
    { time: "10:08", trafficReqMin: 120, conversionRatePct: 98.5, latencyMs: 14 },
    { time: "10:09", trafficReqMin: 122, conversionRatePct: 98.6, latencyMs: 13 },
  ]);

  const [anomalies, setAnomalies] = useState<DetectedAnomaly[]>([]);

  // Calculate Statistical Mean and Standard Deviation
  const calculateStats = (arr: number[]) => {
    if (arr.length === 0) return { mean: 0, stdDev: 1 };
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance =
      arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    const stdDev = Math.max(0.1, Math.sqrt(variance));
    return { mean, stdDev };
  };

  // Run statistical z-score evaluation on the latest data point
  const evaluateDataPoint = useCallback(
    (latestPoint: MetricTimeSeriesPoint, currentHistory: MetricTimeSeriesPoint[]) => {
      if (currentHistory.length < 5) return;

      const trafficValues = currentHistory.map((h) => h.trafficReqMin);
      const conversionValues = currentHistory.map((h) => h.conversionRatePct);
      const latencyValues = currentHistory.map((h) => h.latencyMs);

      const trafficStats = calculateStats(trafficValues);
      const conversionStats = calculateStats(conversionValues);
      const latencyStats = calculateStats(latencyValues);

      const newAnomalies: DetectedAnomaly[] = [];

      // 1. Evaluate Traffic Requests
      const trafficZ = (latestPoint.trafficReqMin - trafficStats.mean) / trafficStats.stdDev;
      if (Math.abs(trafficZ) >= sensitivityZ) {
        newAnomalies.push({
          id: `anom-trf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          time: latestPoint.time,
          metricName: "Traffic Volume (Req/min)",
          currentVal: latestPoint.trafficReqMin,
          baselineMean: Math.round(trafficStats.mean),
          stdDev: Math.round(trafficStats.stdDev * 10) / 10,
          zScore: Math.round(trafficZ * 100) / 100,
          type: trafficZ > 0 ? "spike" : "drop",
          severity: Math.abs(trafficZ) >= 3.0 ? "critical" : "warning",
          explanation: `Traffic ${trafficZ > 0 ? "surged" : "dropped"} by ${Math.abs(
            Math.round(trafficZ)
          )} standard deviations from baseline mean (${Math.round(trafficStats.mean)} req/min).`,
        });
      }

      // 2. Evaluate Conversion Rate %
      const conversionZ =
        (latestPoint.conversionRatePct - conversionStats.mean) / conversionStats.stdDev;
      if (Math.abs(conversionZ) >= sensitivityZ) {
        newAnomalies.push({
          id: `anom-cnv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          time: latestPoint.time,
          metricName: "Conversion Success Rate",
          currentVal: latestPoint.conversionRatePct,
          baselineMean: Math.round(conversionStats.mean * 10) / 10,
          stdDev: Math.round(conversionStats.stdDev * 100) / 100,
          zScore: Math.round(conversionZ * 100) / 100,
          type: conversionZ > 0 ? "spike" : "drop",
          severity: Math.abs(conversionZ) >= 3.0 || conversionZ < -2.5 ? "critical" : "warning",
          explanation: `Conversion success rate ${
            conversionZ > 0 ? "surged" : "plummeted"
          } to ${latestPoint.conversionRatePct}% (Z-Score: ${Math.round(conversionZ * 10) / 10}).`,
        });
      }

      // 3. Evaluate Latency
      const latencyZ = (latestPoint.latencyMs - latencyStats.mean) / latencyStats.stdDev;
      if (Math.abs(latencyZ) >= sensitivityZ && latencyZ > 0) {
        newAnomalies.push({
          id: `anom-lat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          time: latestPoint.time,
          metricName: "API Engine Latency",
          currentVal: latestPoint.latencyMs,
          baselineMean: Math.round(latencyStats.mean),
          stdDev: Math.round(latencyStats.stdDev * 10) / 10,
          zScore: Math.round(latencyZ * 100) / 100,
          type: "spike",
          severity: latencyZ >= 3.0 ? "critical" : "warning",
          explanation: `Processing latency spiked to ${latestPoint.latencyMs}ms (${Math.round(
            latencyZ
          )}x standard deviation outlier).`,
        });
      }

      if (newAnomalies.length > 0) {
        setAnomalies((prev) => [...newAnomalies, ...prev.slice(0, 10)]);
      }
    },
    [sensitivityZ]
  );

  // Periodic Telemetry Generation & Statistical Check
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString();
      setLastAnalyzedTime(nowStr);

      // Normal slight variation around mean
      const normalPoint: MetricTimeSeriesPoint = {
        time: nowStr,
        trafficReqMin: Math.floor(118 + Math.random() * 8),
        conversionRatePct: Math.round((98.2 + Math.random() * 0.6) * 10) / 10,
        latencyMs: Math.floor(11 + Math.random() * 5),
      };

      setHistory((prev) => {
        const updated = [...prev.slice(-14), normalPoint];
        evaluateDataPoint(normalPoint, prev);
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isMonitoring, evaluateDataPoint]);

  // Inject a synthetic anomaly spike or drop for testing
  const injectSyntheticAnomaly = (metric: "traffic_spike" | "traffic_drop" | "conversion_drop" | "latency_spike") => {
    const nowStr = new Date().toLocaleTimeString();
    let point: MetricTimeSeriesPoint;

    if (metric === "traffic_spike") {
      point = { time: nowStr, trafficReqMin: 340, conversionRatePct: 98.5, latencyMs: 14 };
    } else if (metric === "traffic_drop") {
      point = { time: nowStr, trafficReqMin: 18, conversionRatePct: 98.4, latencyMs: 13 };
    } else if (metric === "conversion_drop") {
      point = { time: nowStr, trafficReqMin: 122, conversionRatePct: 82.1, latencyMs: 15 };
    } else {
      point = { time: nowStr, trafficReqMin: 125, conversionRatePct: 98.6, latencyMs: 240 };
    }

    setHistory((prev) => {
      const updated = [...prev.slice(-14), point];
      evaluateDataPoint(point, prev);
      return updated;
    });
  };

  // Latest statistics summary for cards
  const currentTrafficStats = calculateStats(history.map((h) => h.trafficReqMin));
  const currentConversionStats = calculateStats(history.map((h) => h.conversionRatePct));
  const currentLatencyStats = calculateStats(history.map((h) => h.latencyMs));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Statistical Anomaly & Outlier Detector
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                Z-Score (&sigma;) Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated standard deviation analysis flagging sudden traffic surges, drops, and conversion anomalies.
            </p>
          </div>
        </div>

        {/* Sensitivity & Monitoring Toggle */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Threshold:</span>
            {[1.5, 2.0, 2.5].map((z) => (
              <button
                key={z}
                onClick={() => setSensitivityZ(z)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${
                  sensitivityZ === z
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {z}&sigma;
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition ${
              isMonitoring
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isMonitoring ? "Active" : "Paused"}</span>
          </button>
        </div>
      </div>

      {/* 3 Statistical Baseline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Traffic Req/min */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Traffic Volume Standard Deviation</span>
            <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
              Z-Threshold: &plusmn;{sensitivityZ}&sigma;
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {Math.round(currentTrafficStats.mean)} <span className="text-xs font-bold text-slate-400">req/m</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              &sigma; = {currentTrafficStats.stdDev.toFixed(1)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Calculated moving baseline from 15-point window
          </p>
        </div>

        {/* Card 2: Conversion Success Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Conversion Rate Baseline</span>
            <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              Z-Threshold: &plusmn;{sensitivityZ}&sigma;
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {currentConversionStats.mean.toFixed(1)}%
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              &sigma; = {currentConversionStats.stdDev.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Monitors job output completions for sudden drops
          </p>
        </div>

        {/* Card 3: Engine Latency */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Engine Latency Variance</span>
            <span className="text-[10px] font-mono font-bold text-purple-500 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
              Z-Threshold: +{sensitivityZ}&sigma;
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {Math.round(currentLatencyStats.mean)} <span className="text-xs font-bold text-slate-400">ms</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              &sigma; = {currentLatencyStats.stdDev.toFixed(1)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Flags processing bottlenecks exceeding standard deviation
          </p>
        </div>
      </div>

      {/* Interactive Synthetic Anomaly Test Injector */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Inject Synthetic Outliers to Test Statistical Detector:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => injectSyntheticAnomaly("traffic_spike")}
            className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center space-x-1 transition"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>Traffic Spike (+340)</span>
          </button>

          <button
            onClick={() => injectSyntheticAnomaly("traffic_drop")}
            className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center space-x-1 transition"
          >
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            <span>Traffic Drop (18 req/m)</span>
          </button>

          <button
            onClick={() => injectSyntheticAnomaly("conversion_drop")}
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center space-x-1 transition"
          >
            <AlertOctagon className="w-3.5 h-3.5 mr-1" />
            <span>Conversion Drop (82%)</span>
          </button>

          <button
            onClick={() => injectSyntheticAnomaly("latency_spike")}
            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center space-x-1 transition"
          >
            <Zap className="w-3.5 h-3.5 mr-1" />
            <span>Latency Spike (240ms)</span>
          </button>
        </div>
      </div>

      {/* Detected Anomalies Stream Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Detected Statistical Outliers & Anomaly Stream
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            Total Flagged: {anomalies.length}
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No statistical anomalies detected. All metrics strictly within normal &sigma; distribution.</span>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition ${
                  anom.severity === "critical"
                    ? "bg-red-500/10 border-red-500/30 text-slate-900 dark:text-white"
                    : "bg-amber-500/10 border-amber-500/30 text-slate-900 dark:text-white"
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      anom.type === "spike"
                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-300"
                        : "bg-red-500/20 text-red-600 dark:text-red-300"
                    }`}
                  >
                    {anom.type === "spike" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold flex items-center space-x-2">
                      <span>{anom.metricName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">
                        Z = {anom.zScore}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      {anom.explanation}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 self-end sm:self-auto font-mono text-[11px]">
                  <span className="font-bold text-slate-500 block">{anom.time}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    Actual: {anom.currentVal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
