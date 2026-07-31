import React, { useState, useEffect } from "react";
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
  Info,
} from "lucide-react";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: "password" | "corrupted" | "size" | "empty" | "unsupported" | "generic" | "upload";
  fileName?: string;
  timestamp: number;
  duration?: number; // ms, default 5000ms
  onRetry?: () => void;
}

export function triggerErrorToast(
  title: string,
  message: string,
  options?: {
    type?: ToastItem["type"];
    fileName?: string;
    duration?: number;
    onRetry?: () => void;
  }
) {
  const event = new CustomEvent("pdfsun_error_toast", {
    detail: {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type: options?.type || "generic",
      fileName: options?.fileName,
      duration: options?.duration || 5000,
      timestamp: Date.now(),
      onRetry: options?.onRetry,
    },
  });
  window.dispatchEvent(event);
}

export const GlobalErrorToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 active toasts
      }
    };

    window.addEventListener("pdfsun_error_toast", handleToastEvent);
    return () => {
      window.removeEventListener("pdfsun_error_toast", handleToastEvent);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCopyToast = (toast: ToastItem) => {
    const text = `PDFSun Error\nTitle: ${toast.title}\nMessage: ${toast.message}\nFile: ${toast.fileName || "N/A"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(toast.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const getToastTheme = () => {
          switch (toast.type) {
            case "password":
              return {
                icon: <Lock className="w-5 h-5 text-amber-500 shrink-0" />,
                borderColor: "border-amber-500/30",
                badgeBg: "bg-amber-500/10 text-amber-500",
                badgeText: "Encrypted",
              };
            case "corrupted":
              return {
                icon: <FileX className="w-5 h-5 text-rose-500 shrink-0" />,
                borderColor: "border-rose-500/30",
                badgeBg: "bg-rose-500/10 text-rose-500",
                badgeText: "Corrupted File",
              };
            case "size":
              return {
                icon: <HardDrive className="w-5 h-5 text-purple-500 shrink-0" />,
                borderColor: "border-purple-500/30",
                badgeBg: "bg-purple-500/10 text-purple-500",
                badgeText: "Size Exceeded",
              };
            case "upload":
              return {
                icon: <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />,
                borderColor: "border-orange-500/30",
                badgeBg: "bg-orange-500/10 text-orange-500",
                badgeText: "Upload Issue",
              };
            default:
              return {
                icon: <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />,
                borderColor: "border-rose-500/30",
                badgeBg: "bg-rose-500/10 text-rose-500",
                badgeText: "Processing Error",
              };
          }
        };

        const theme = getToastTheme();

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border ${theme.borderColor} shadow-2xl backdrop-blur-md flex flex-col space-y-2 text-left animate-in slide-in-from-bottom-5 duration-200 group overflow-hidden`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between space-x-2">
              <div className="flex items-center space-x-2">
                {theme.icon}
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${theme.badgeBg}`}>
                    {theme.badgeText}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                    {toast.title}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Message Body */}
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
              {toast.message}
            </p>

            {toast.fileName && (
              <p className="text-[10px] text-slate-400 font-mono truncate">
                File: {toast.fileName}
              </p>
            )}

            {/* Action Bar */}
            <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
              <button
                onClick={() => handleCopyToast(toast)}
                className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                {copiedId === toast.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Error</span>
                  </>
                )}
              </button>

              {toast.onRetry && (
                <button
                  onClick={() => {
                    removeToast(toast.id);
                    toast.onRetry!();
                  }}
                  className="flex items-center space-x-1 font-bold text-orange-500 hover:text-orange-600 dark:hover:text-amber-400 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
