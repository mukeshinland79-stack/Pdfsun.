import React, { useState } from "react";
import { ShieldCheck, Sparkles, Zap, Lock, ArrowRight, X, Star, CheckCircle2 } from "lucide-react";

interface AdSensePlaceholderProps {
  slotId?: string;
  format?: "banner" | "rectangle" | "leaderboard" | "native-feed" | "sticky-bottom";
}

export const AdSensePlaceholder: React.FC<AdSensePlaceholderProps> = ({
  format = "leaderboard",
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) return null;

  return (
    <div
      className={`my-6 max-w-7xl mx-auto px-4 sm:px-6 w-full transition-all duration-300 ${
        format === "sticky-bottom" ? "fixed bottom-0 left-0 right-0 z-30 my-0 max-w-full px-0" : ""
      }`}
    >
      <div
        className={`relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 dark:from-slate-800/90 dark:via-indigo-950/40 dark:to-slate-800/90 border border-blue-500/20 dark:border-slate-700/80 shadow-md backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden transition-all duration-300 ${
          format === "sticky-bottom"
            ? "rounded-none border-x-0 border-b-0 bg-white/95 dark:bg-[#0f172a]/95 shadow-xl"
            : ""
        }`}
      >
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Left Side: Engaging Feature Info */}
        <div className="flex items-start sm:items-center space-x-3.5 text-left w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            {format === "leaderboard" ? (
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            ) : format === "rectangle" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            ) : (
              <Zap className="w-5 h-5 text-sky-300" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-2xs">
                PRO FEATURE
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                100% In-Browser Local Processing
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl font-medium leading-relaxed">
              {format === "rectangle"
                ? "Your privacy is guaranteed. All PDF tools run client-side using WebAssembly with zero server uploads."
                : "Unlock unlimited batch PDF conversion, AI summarization, compression, and e-signatures with instant local speed."}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action CTA + Dismiss */}
        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
          <a
            href="#tools"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center space-x-1.5 group"
          >
            <span>Explore 50+ Tools</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </a>

          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Dismiss banner"
            aria-label="Dismiss feature banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
