import React, { useState } from "react";
import {
  Mail,
  Clock,
  CheckCircle2,
  Send,
  Calendar,
  Sliders,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Settings,
  Eye,
  BellRing,
  Save,
} from "lucide-react";

export interface AdminEmailDigestProps {
  className?: string;
  userEmail?: string;
}

export const AdminEmailDigest: React.FC<AdminEmailDigestProps> = ({
  className = "",
  userEmail = "mukeshinland79@gmail.com",
}) => {
  const [recipientEmail, setRecipientEmail] = useState<string>(userEmail);
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "critical_only">("daily");
  const [dispatchTime, setDispatchTime] = useState<string>("08:00");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSentSuccess, setTestSentSuccess] = useState<boolean>(false);

  // Sections toggle flags
  const [includeSections, setIncludeSections] = useState({
    userGrowth: true,
    pdfConversionMetrics: true,
    securityAuditLogs: true,
    toolRanks: true,
    serverHealth: false,
  });

  const toggleSection = (key: keyof typeof includeSections) => {
    setIncludeSections((prev) => ({ ...prev, [key]: !prev[key] }));
    setIsSaved(false);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  const handleSendTestNow = () => {
    setIsSendingTest(true);
    setTestSentSuccess(false);
    setTimeout(() => {
      setIsSendingTest(false);
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 5000);
    }, 1200);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Mail className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Automated Admin Email Performance Digest
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                Active Scheduler
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize daily or weekly executive summaries dispatched directly to your inbox.
            </p>
          </div>
        </div>

        <button
          onClick={handleSendTestNow}
          disabled={isSendingTest}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{isSendingTest ? "Dispatching..." : "Send Test Digest Now"}</span>
        </button>
      </div>

      {testSentSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Test performance digest email successfully dispatched to <strong>{recipientEmail}</strong>!</span>
        </div>
      )}

      {/* Main Grid: Config Form & Live Digest Email Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schedule & Configuration Controls */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Digest Schedule Settings</span>
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              Config Panel
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            {/* Recipient Email Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Recipient Admin Email Address
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="admin@pdfsun.in"
                required
              />
            </div>

            {/* Frequency Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Dispatch Frequency
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {[
                  { key: "daily", label: "Daily" },
                  { key: "weekly", label: "Weekly" },
                  { key: "critical_only", label: "Critical Only" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setScheduleFrequency(f.key as any);
                      setIsSaved(false);
                    }}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      scheduleFrequency === f.key
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Time (UTC) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Schedule Time (UTC)
              </label>
              <input
                type="time"
                value={dispatchTime}
                onChange={(e) => {
                  setDispatchTime(e.target.value);
                  setIsSaved(false);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Sections to Include Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Include Metrics Sections:
              </span>

              {[
                { key: "userGrowth", label: "User Active Traffic & Growth" },
                { key: "pdfConversionMetrics", label: "PDF Conversion Error Rates" },
                { key: "securityAuditLogs", label: "Security & Role Audit Logs" },
                { key: "toolRanks", label: "Top PDF Tools Ranking" },
                { key: "serverHealth", label: "System Hardware & CPU Telemetry" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center space-x-2 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={(includeSections as any)[item.key]}
                    onChange={() => toggleSection(item.key as any)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? "Configuration Saved!" : "Save Digest Schedule"}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Email Digest Template Visual Preview */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-extrabold text-white">
                Live Digest Email Preview
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              HTML Email Mockup
            </span>
          </div>

          {/* Styled HTML Mock Email Container */}
          <div className="p-5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-inner space-y-4 font-sans text-xs">
            {/* Email Header */}
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                  P
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900">PDFSun Admin Digest</h5>
                  <span className="text-[10px] text-slate-500 font-mono">
                    To: {recipientEmail} &bull; {scheduleFrequency.toUpperCase()} ({dispatchTime} UTC)
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                {new Date().toLocaleDateString()}
              </span>
            </div>

            {/* Email Body Summary Cards */}
            <div className="space-y-3">
              <p className="text-slate-600 text-[11px]">
                Hello Administrator, here is your automated executive performance and security summary for PDFSun:
              </p>

              {includeSections.userGrowth && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
                  <span className="font-extrabold text-indigo-900 block text-[11px]">
                    📊 Active Traffic & User Registrations
                  </span>
                  <div className="flex justify-between font-mono text-[10px] text-indigo-800">
                    <span>DAU Avg: <strong>2,340 active</strong></span>
                    <span>New Registrations: <strong>+345 this period</strong></span>
                  </div>
                </div>
              )}

              {includeSections.pdfConversionMetrics && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
                  <span className="font-extrabold text-emerald-900 block text-[11px]">
                    ⚡ Conversion Success & Engine Latency
                  </span>
                  <div className="flex justify-between font-mono text-[10px] text-emerald-800">
                    <span>Conversion Success Rate: <strong>98.6%</strong></span>
                    <span>Avg Latency: <strong>14 ms</strong></span>
                  </div>
                </div>
              )}

              {includeSections.securityAuditLogs && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                  <span className="font-extrabold text-slate-900 block text-[11px]">
                    🛡️ Security & Role Audit Trail
                  </span>
                  <p className="text-[10px] text-slate-600">
                    Zero unauthorized access breaches. 2 administrative state changes logged.
                  </p>
                </div>
              )}

              {includeSections.toolRanks && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
                  <span className="font-extrabold text-amber-900 block text-[11px]">
                    🏆 Top Used PDF Tools
                  </span>
                  <div className="text-[10px] text-amber-800 font-mono">
                    1. Compress PDF &bull; 2. Merge PDF &bull; 3. PDF to Word
                  </div>
                </div>
              )}

              {includeSections.serverHealth && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 space-y-1">
                  <span className="font-extrabold text-purple-900 block text-[11px]">
                    🖥️ Server Hardware Telemetry
                  </span>
                  <div className="flex justify-between font-mono text-[10px] text-purple-800">
                    <span>CPU Load: <strong>24%</strong></span>
                    <span>RAM Heap: <strong>42%</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Email Footer */}
            <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
              PDFSun Automated System Telemetry &bull; Powered by Google Cloud Run & AI Studio
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
