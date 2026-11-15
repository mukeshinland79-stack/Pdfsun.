import React, { useState } from "react";
import { Lightbulb, Info, Sparkles, X, ChevronRight } from "lucide-react";
import { getQuickTipForTool, QuickTipItem } from "../data/quickTipsData";

export interface QuickTipTooltipProps {
  toolId: string;
  variant?: "inline" | "tooltip" | "card";
  className?: string;
  autoDismissable?: boolean;
}

export const QuickTipTooltip: React.FC<QuickTipTooltipProps> = ({
  toolId,
  variant = "inline",
  className = "",
  autoDismissable = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const tipObj: QuickTipItem = getQuickTipForTool(toolId);

  if (isDismissed) return null;

  if (variant === "tooltip") {
    return (
      <div className={`group relative inline-block ${className}`}>
        <button
          type="button"
          aria-label="Show quick tip"
          className="min-w-[24px] min-h-[24px] inline-flex items-center justify-center p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Hover for quick tip"
        >
          <Lightbulb className="w-4 h-4 animate-pulse" aria-hidden="true" />
        </button>

        {/* Hover Popover */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5">
            <span className="text-[10px] font-black uppercase text-amber-400 flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>{tipObj.badge || "Quick Tip"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {tipObj.tip}
          </p>
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
        </div>
      </div>
    );
  }

  // Default Inline Variant for Workspace
  return (
    <div
      className={`relative p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-900/5 dark:from-amber-950/40 dark:via-slate-900/60 dark:to-slate-900/80 border border-amber-500/30 flex items-start justify-between gap-3 text-xs transition-all shadow-2xs ${className}`}
    >
      <div className="flex items-start space-x-2.5">
        <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {tipObj.badge || "Quick Tip"}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
            {tipObj.tip}
          </p>
        </div>
      </div>

      {autoDismissable && (
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss tip"
          className="min-w-[24px] min-h-[24px] inline-flex items-center justify-center p-1 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-lg shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Dismiss tip"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
