import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  FileX,
  Lock,
  HardDrive,
  X,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getErrorMessage } from "../utils/apiHelper";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: "password" | "corrupted" | "size" | "empty" | "unsupported" | "generic" | "upload" | "offline";
  fileName?: string;
  timestamp: number;
  duration?: number; // ms, default 4500ms
  onRetry?: () => void;
}

// Global debouncing and deduplication registry (prevents toast flooding)
const recentToastRegistry = new Map<string, number>();

/**
 * Triggers a debounced, deduplicated global toast notification.
 * Guarantees maximum 1 active toast message at a time to prevent UI spamming.
 */
export function triggerErrorToast(
  title: any,
  message: any,
  options?: {
    type?: ToastItem["type"];
    fileName?: string;
    duration?: number;
    onRetry?: () => void;
  }
) {
  if (typeof window === "undefined") return;

  const safeTitle = typeof title === "string" ? title : getErrorMessage(title);
  const safeMessage = typeof message === "string" ? message : getErrorMessage(message);

  const rawKey = `${safeTitle.trim().toLowerCase()}::${safeMessage.trim().toLowerCase()}`;
  const now = Date.now();
  const lastFired = recentToastRegistry.get(rawKey) || 0;

  // Suppress duplicates within a 4-second sliding window
  if (now - lastFired < 4000) {
    return;
  }

  recentToastRegistry.set(rawKey, now);

  // Periodic cleanup of stale registry entries
  if (recentToastRegistry.size > 20) {
    for (const [k, time] of recentToastRegistry.entries()) {
      if (now - time > 10000) {
        recentToastRegistry.delete(k);
      }
    }
  }

  // Suppress non-actionable background noises or false-positives during local WebAssembly offline execution
  const combined = `${safeTitle} ${safeMessage}`.toLowerCase();
  if (
    combined.includes("405") ||
    combined.includes("method not allowed") ||
    combined.includes("server 0") ||
    combined.includes("status 0") ||
    combined.includes("net::err") ||
    combined.includes("failed to fetch") ||
    combined.includes("websocket closed")
  ) {
    console.warn("[GlobalErrorToast] Suppressed background network toast:", safeTitle, safeMessage);
    return;
  }

  const event = new CustomEvent("pdfsun_error_toast", {
    detail: {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: safeTitle,
      message: safeMessage,
      type: options?.type || "generic",
      fileName: options?.fileName,
      duration: options?.duration || 4500,
      timestamp: now,
      onRetry: options?.onRetry,
    },
  });
  window.dispatchEvent(event);
}

export const GlobalErrorToast: React.FC = () => {
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        
        // Clear previous timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        setCurrentToast(newToast);

        // Schedule auto-dismiss
        const duration = newToast.duration || 4500;
        timerRef.current = setTimeout(() => {
          setCurrentToast(null);
        }, duration);
      }
    };

    window.addEventListener("pdfsun_error_toast", handleToastEvent);
    return () => {
      window.removeEventListener("pdfsun_error_toast", handleToastEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentToast(null);
  };

  const handleCopyToast = (toast: ToastItem) => {
    const text = `PDFSun Notice\nTitle: ${toast.title}\nMessage: ${toast.message}\nFile: ${toast.fileName || "N/A"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentToast) return null;

  const getToastTheme = () => {
    switch (currentToast.type) {
      case "password":
        return {
          icon: <Lock className="w-4 h-4 text-amber-500 shrink-0" />,
          borderColor: "border-amber-500/30",
          badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          badgeText: "Encrypted",
        };
      case "corrupted":
        return {
          icon: <FileX className="w-4 h-4 text-rose-500 shrink-0" />,
          borderColor: "border-rose-500/30",
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          badgeText: "Corrupted File",
        };
      case "size":
        return {
          icon: <HardDrive className="w-4 h-4 text-purple-500 shrink-0" />,
          borderColor: "border-purple-500/30",
          badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
          badgeText: "Size Exceeded",
        };
      case "upload":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />,
          borderColor: "border-orange-500/30",
          badgeBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
          badgeText: "Notice",
        };
      case "offline":
        return {
          icon: <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />,
          borderColor: "border-blue-500/30",
          badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          badgeText: "Offline Ready",
        };
      default:
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />,
          borderColor: "border-rose-500/30",
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          badgeText: "Notice",
        };
    }
  };

  const theme = getToastTheme();

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full pointer-events-none px-4 sm:px-0 animate-in slide-in-from-bottom-4 duration-200"
    >
      <div
        className={`pointer-events-auto relative p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border ${theme.borderColor} shadow-2xl backdrop-blur-md flex flex-col space-y-2 text-left group overflow-hidden`}
      >
        {/* Progress Bar Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-blue-500 dark:bg-blue-400 animate-[progress_4.5s_linear_forwards]" />
        </div>

        {/* Header Row */}
        <div className="flex items-start justify-between space-x-2 pt-0.5">
          <div className="flex items-center space-x-2">
            {theme.icon}
            <div>
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${theme.badgeBg}`}>
                {theme.badgeText}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                {typeof currentToast.title === "object" && currentToast.title !== null
                  ? (currentToast.title as any)?.message || JSON.stringify(currentToast.title)
                  : String(currentToast.title || "")}
              </h4>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Body */}
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
          {typeof currentToast.message === "object" && currentToast.message !== null
            ? (currentToast.message as any)?.message || JSON.stringify(currentToast.message)
            : String(currentToast.message || "")}
        </p>

        {currentToast.fileName && (
          <p className="text-[10px] text-slate-400 font-mono truncate">
            File: {String(currentToast.fileName)}
          </p>
        )}

        {/* Action Bar */}
        <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
          <button
            onClick={() => handleCopyToast(currentToast)}
            className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Details</span>
              </>
            )}
          </button>

          {currentToast.onRetry && (
            <button
              onClick={() => {
                handleDismiss();
                currentToast.onRetry!();
              }}
              className="flex items-center space-x-1 font-bold text-orange-500 hover:text-orange-600 dark:hover:text-amber-400 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
