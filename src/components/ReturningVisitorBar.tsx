import React, { useState, useEffect } from "react";
import { History, ArrowRight, Zap, ShieldCheck, X } from "lucide-react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

export interface ReturningVisitorBarProps {
  onSelectTool: (tool: ToolItem) => void;
  onOpenHistory: () => void;
}

export const ReturningVisitorBar: React.FC<ReturningVisitorBarProps> = ({
  onSelectTool,
  onOpenHistory,
}) => {
  const [recentTools, setRecentTools] = useState<ToolItem[]>([]);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    try {
      // Check if user dismissed recently
      const dismissed = sessionStorage.getItem("pdfsun_dismiss_returning_bar");
      if (dismissed === "true") {
        setIsDismissed(true);
        return;
      }

      // Check for past tool usage history in localStorage
      const rawHistory = localStorage.getItem("pdfsun_tool_history");
      if (rawHistory) {
        const historyItems = JSON.parse(rawHistory);
        if (Array.isArray(historyItems) && historyItems.length > 0) {
          const toolIds = Array.from(
            new Set(historyItems.map((h: any) => h.toolId || h.id).filter(Boolean))
          ).slice(0, 3) as string[];

          const matched = toolIds
            .map((id) => ALL_TOOLS.find((t) => t.id === id || t.slug === id))
            .filter((t): t is ToolItem => !!t);

          if (matched.length > 0) {
            setRecentTools(matched);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load returning visitor history:", e);
    }
  }, []);

  if (isDismissed || recentTools.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("pdfsun_dismiss_returning_bar", "true");
    } catch (e) {}
  };

  return (
    <div
      id="returning-visitor-bar"
      aria-label="Recent Session Workspace Recovery"
      className="w-full max-w-5xl mx-auto mb-3 px-3 sm:px-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/40 text-xs shadow-2xs">
        {/* Welcome Back & Recent Tools */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center space-x-1.5 font-bold text-blue-900 dark:text-blue-300">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Welcome back! Quick Resume:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {recentTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-600 shadow-2xs transition group"
              >
                <span>{tool.name}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: 1-Click History & Close */}
        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={onOpenHistory}
            className="inline-flex items-center space-x-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <History className="w-3 h-3" />
            <span>Full History</span>
          </button>

          <span className="text-slate-300 dark:text-slate-600">•</span>

          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hidden md:inline-flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>100% Local Privacy</span>
          </span>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss quick resume bar"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
