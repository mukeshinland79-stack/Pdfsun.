import React from "react";
import { AlertTriangle, ShieldAlert, Cpu, Sparkles, ArrowRight, X } from "lucide-react";
import { MemorySafetyReport } from "../utils/memoryGuard";

interface ToolMemoryWarningProps {
  report: MemorySafetyReport;
  onDismiss?: () => void;
  onProceedAnyway?: () => void;
  onSelectRecovery?: (actionId: string, actionUrl?: string) => void;
}

export const ToolMemoryWarning: React.FC<ToolMemoryWarningProps> = ({
  report,
  onDismiss,
  onProceedAnyway,
  onSelectRecovery,
}) => {
  if (report.status === "safe" && report.severity === "none") {
    return null;
  }

  const isBlocked = report.status === "blocked";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 shadow-sm ${
        isBlocked
          ? "bg-rose-50/80 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 text-rose-900 dark:text-rose-100"
          : "bg-amber-50/80 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-900 dark:text-amber-100"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            isBlocked
              ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
          }`}
        >
          {isBlocked ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-base sm:text-lg flex items-center gap-2">
              <span>{isBlocked ? "Memory Protection Block" : "High Memory Alert"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-white/60 dark:bg-black/40 border border-current/10">
                {report.formattedTotalSize}
              </span>
            </h4>
            {!isBlocked && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {report.warningMessage ||
              (isBlocked
                ? "This document is too large for your browser's available RAM. To prevent your tab from crashing, processing is paused."
                : "Processing this file may take longer than usual. Single-page streaming is active to preserve responsiveness.")}
          </p>

          {/* Device & Memory Stats Bar */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-neutral-800/60 px-2.5 py-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 font-mono">
              <Cpu className="w-3.5 h-3.5" /> Device RAM: {report.deviceMemoryGb}GB
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-neutral-800/60 px-2.5 py-1 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Working RAM: ~{report.estimatedMemoryPressureMb}MB
            </span>
          </div>

          {/* Recovery Actions */}
          {report.recoveryOptions && report.recoveryOptions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-current/10 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Recommended Solutions:
              </p>
              <div className="flex flex-wrap gap-2">
                {report.recoveryOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (onSelectRecovery) {
                        onSelectRecovery(opt.id, opt.actionUrl);
                      } else if (opt.actionUrl) {
                        window.location.href = opt.actionUrl;
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl transition-all shadow-sm ${
                      opt.recommended
                        ? "bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        : "bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                  </button>
                ))}

                {!isBlocked && onProceedAnyway && (
                  <button
                    type="button"
                    onClick={onProceedAnyway}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Proceed Anyway
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
