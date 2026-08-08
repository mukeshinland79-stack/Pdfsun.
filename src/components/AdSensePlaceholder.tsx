import React, { useState, useEffect } from "react";
import { ShieldCheck, Sparkles, Zap, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { ALL_TOOLS } from "../data/toolsData";

interface AdSensePlaceholderProps {
  slotId?: string;
  adClient?: string;
  format?: "banner" | "rectangle" | "leaderboard" | "native-feed" | "sticky-bottom" | "skyscraper" | "tool-result";
  className?: string;
}

export const AdSensePlaceholder: React.FC<AdSensePlaceholderProps> = ({
  slotId = "pdfsun-auto-ad-slot",
  adClient = "ca-pub-0000000000000000",
  format = "leaderboard",
  className = "",
}) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // Ignore if AdBlocker active
    }
  }, []);

  if (collapsed) return null;

  const minHeightClass =
    format === "rectangle" || format === "native-feed"
      ? "min-h-[250px] sm:min-h-[280px]"
      : format === "skyscraper"
      ? "min-h-[600px]"
      : "min-h-[90px] sm:min-h-[100px]";

  return (
    <div
      className={`my-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full adsense-slot-wrapper transition-all duration-300 ${
        format === "sticky-bottom" ? "fixed bottom-0 left-0 right-0 z-40 my-0 max-w-full px-0 pointer-events-auto" : ""
      } ${className}`}
    >
      <div
        className={`relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-100/90 via-slate-50/90 to-slate-100/90 dark:from-slate-800/90 dark:via-indigo-950/30 dark:to-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden transition-all duration-300 ${minHeightClass} ${
          format === "sticky-bottom"
            ? "rounded-none border-x-0 border-b-0 bg-white/95 dark:bg-[#0f172a]/95 shadow-2xl border-t border-slate-200 dark:border-slate-800"
            : ""
        }`}
      >
        {/* Subtle "ADVERTISEMENT" Tag */}
        <div className="absolute top-2 right-3 text-[9px] font-mono uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
          ADVERTISEMENT
        </div>

        {/* Official Google AdSense Container */}
        <div className="w-full flex justify-center items-center overflow-hidden">
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={adClient}
            data-ad-slot={slotId}
            data-ad-format={format === "rectangle" || format === "native-feed" ? "rectangle" : "auto"}
            data-full-width-responsive="true"
          />
        </div>

        {/* Fallback & Verified Feature Banner when AdSense script is pending or blocked */}
        <div className="flex items-start sm:items-center space-x-3.5 text-left w-full sm:w-auto z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            {format === "leaderboard" ? (
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            ) : format === "rectangle" || format === "native-feed" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            ) : (
              <Zap className="w-5 h-5 text-sky-300" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-2xs">
                {format === "tool-result" ? "SPONSORED RESULT" : "PRO FEATURE"}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {format === "tool-result" ? "Download Ready • 100% Client-Side" : "100% Client-Side Local Processing"}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl font-medium leading-relaxed">
              {format === "rectangle" || format === "native-feed"
                ? "Your privacy is guaranteed. All PDF tools run client-side using WebAssembly with zero server uploads."
                : format === "tool-result"
                ? "Your document processed smoothly in milliseconds. No cloud data storage or tracking involved."
                : "Unlock unlimited batch PDF conversion, AI summarization, compression, and e-signatures with instant local speed."}
            </p>
          </div>
        </div>

        {/* Right Action Button & Dismiss */}
        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end z-10">
          <a
            href="#tools"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center space-x-1.5 group"
          >
            <span>Explore {ALL_TOOLS.length} Tools</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </a>

          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Dismiss ad container"
            aria-label="Dismiss ad container"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

