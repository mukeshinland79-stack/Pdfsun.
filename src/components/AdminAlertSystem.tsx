import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Bell,
  BellOff,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
  TrendingDown,
  Lock,
  FileX,
  Activity,
  Sliders,
  Play,
  ChevronRight,
} from "lucide-react";

export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  category: "security" | "traffic" | "conversion_engine" | "api_latency";
  actionRequired?: string;
  autoDismissable?: boolean;
}

export interface AdminAlertSystemProps {
  className?: string;
  onAlertTriggered?: (alert: SystemAlert) => void;
}

export const AdminAlertSystem: React.FC<AdminAlertSystemProps> = ({
  className = "",
  onAlertTriggered,
}) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: "alert-101",
      timestamp: new Date().toLocaleTimeString(),
      severity: "critical",
      title: "Unauthorized Admin Login Attempt",
      message: "Blocked 3 failed password attempts from IP 185.220.101.5 (Location: Unknown ASN).",
      category: "security",
      actionRequired: "Review IP Ban List",
    },
    {
      id: "alert-102",
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString(),
      severity: "warning",
      title: "Elevated PDF Conversion Errors",
      message: "OCR Engine failure rate increased to 2.4% on scanned multi-page documents.",
      category: "conversion_engine",
      actionRequired: "Restart OCR Sub-worker",
    },
    {
      id: "alert-103",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      severity: "info",
      title: "Traffic Drop Detected",
      message: "Concurrent active users dipped by 18% compared to peak hour average.",
      category: "traffic",
      actionRequired: "Check CDN Edge Nodes",
    },
  ]);

  const [toasts, setToasts] = useState<SystemAlert[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoSimulation, setAutoSimulation] = useState<boolean>(true);

  // Play subtle web audio beep when a critical alert fires
  const playAlertChime = useCallback((severity: "critical" | "warning" | "info") => {
    if (isMuted || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = severity === "critical" ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(severity === "critical" ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignore web audio restrictions if non-interacted
    }
  }, [isMuted]);

  // Dispatch a new alert
  const dispatchAlert = useCallback((newAlert: SystemAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    setToasts((prev) => [newAlert, ...prev.slice(0, 3)]); // Keep max 4 floating toasts
    playAlertChime(newAlert.severity);

    if (onAlertTriggered) {
      onAlertTriggered(newAlert);
    }
  }, [playAlertChime, onAlertTriggered]);

  // Dismiss a toast
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
    setToasts([]);
  };

  // Simulate incoming critical system events
  const triggerSimulatedEvent = (type: "unauthorized" | "conversion_fail" | "traffic_drop" | "latency_spike") => {
    const timestamp = new Date().toLocaleTimeString();
    let sample: SystemAlert;

    if (type === "unauthorized") {
      sample = {
        id: `alt-${Date.now()}`,
        timestamp,
        severity: "critical",
        title: "Unauthorized Admin Root Access Attempt",
        message: "Multiple failed authentication tokens detected targeting /api/admin endpoints.",
        category: "security",
        actionRequired: "Enforce 2FA / Lockdown",
      };
    } else if (type === "conversion_fail") {
      sample = {
        id: `alt-${Date.now()}`,
        timestamp,
        severity: "critical",
        title: "High PDF Conversion Failure Rate",
        message: "PDF-to-Word converter exceeded 4.5% error threshold due to corrupted font tables.",
        category: "conversion_engine",
        actionRequired: "Flush PDF Worker Cache",
      };
    } else if (type === "traffic_drop") {
      sample = {
        id: `alt-${Date.now()}`,
        timestamp,
        severity: "warning",
        title: "Sudden Sharp Traffic Drop",
        message: "Real-time active socket connections dropped by 32% in the last 2 minutes.",
        category: "traffic",
        actionRequired: "Inspect Network Ingress",
      };
    } else {
      sample = {
        id: `alt-${Date.now()}`,
        timestamp,
        severity: "warning",
        title: "Gemini AI Model Latency Spike",
        message: "Response ping for Gemini 3.6 Flash increased to 850ms.",
        category: "api_latency",
        actionRequired: "Fallback to Cached Models",
      };
    }

    dispatchAlert(sample);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Floating Active Toast Notifications Container */}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-2xl shadow-2xl border pointer-events-auto backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 ${
                toast.severity === "critical"
                  ? "bg-red-950/90 text-white border-red-700/80"
                  : toast.severity === "warning"
                  ? "bg-amber-950/90 text-white border-amber-700/80"
                  : "bg-slate-900/90 text-white border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between space-x-2">
                <div className="flex items-center space-x-2 min-w-0">
                  {toast.severity === "critical" && (
                    <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
                  )}
                  {toast.severity === "warning" && (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  {toast.severity === "info" && (
                    <Bell className="w-5 h-5 text-blue-400 shrink-0" />
                  )}
                  <h5 className="font-black text-xs uppercase tracking-wider truncate">
                    {toast.title}
                  </h5>
                </div>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                {toast.message}
              </p>

              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                <span>{toast.timestamp}</span>
                {toast.actionRequired && (
                  <span className="font-extrabold text-amber-300 uppercase underline">
                    {toast.actionRequired}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Admin Panel Control Widget */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-red-950 text-white shadow-xl border border-red-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  Real-Time Critical System Alert Dispatcher
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 uppercase">
                  {alerts.filter((a) => a.severity === "critical").length} Critical Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant toast warnings for traffic drops, unauthorized access attempts, and conversion errors.
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                isMuted
                  ? "bg-slate-800 text-slate-400 border-slate-700"
                  : "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
              }`}
              title={isMuted ? "Unmute Audio Chimes" : "Mute Audio Chimes"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={clearAllAlerts}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Test Alert Simulator Trigger Buttons */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
            Simulate & Test Critical System Events:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => triggerSimulatedEvent("unauthorized")}
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span className="truncate">Unauthorized Login</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => triggerSimulatedEvent("conversion_fail")}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-1.5">
                <FileX className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">Conversion Error</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => triggerSimulatedEvent("traffic_drop")}
              className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">Traffic Drop</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => triggerSimulatedEvent("latency_spike")}
              className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span className="truncate">Latency Spike</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* Active System Alerts History Log Table */}
        <div className="pt-2">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>All system services fully healthy. No active alerts.</span>
              </div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition ${
                    alt.severity === "critical"
                      ? "bg-red-950/40 border-red-800/60 text-slate-100"
                      : alt.severity === "warning"
                      ? "bg-amber-950/40 border-amber-800/60 text-slate-100"
                      : "bg-slate-900 border-slate-800 text-slate-200"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        alt.severity === "critical"
                          ? "bg-red-500/20 text-red-400"
                          : alt.severity === "warning"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {alt.severity === "critical" && <AlertOctagon className="w-4 h-4" />}
                      {alt.severity === "warning" && <AlertTriangle className="w-4 h-4" />}
                      {alt.severity === "info" && <Bell className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold flex items-center space-x-2">
                        <span>{alt.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase bg-slate-800 text-slate-300">
                          {alt.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {alt.message}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className="font-mono text-[10px] text-slate-400 block font-bold">
                      {alt.timestamp}
                    </span>
                    {alt.actionRequired && (
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase">
                        {alt.actionRequired}
                      </span>
                    )}
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
