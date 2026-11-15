import React, { useState } from "react";
import {
  Lock,
  FileX,
  HardDrive,
  AlertOctagon,
  AlertTriangle,
  X,
  Copy,
  Check,
  Wrench,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DetailedErrorInfo } from "../lib/errorNotificationService";

interface ErrorNotificationOverlayProps {
  error: DetailedErrorInfo;
  onDismiss: () => void;
  onRemoveProblematicFile?: (fileName?: string) => void;
  onSwitchToTool?: (toolSlug: string) => void;
}

export const ErrorNotificationOverlay: React.FC<ErrorNotificationOverlayProps> = ({
  error,
  onDismiss,
  onRemoveProblematicFile,
  onSwitchToTool,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleCopyLog = () => {
    const text = `PDFSun Error Report\nType: ${error.type}\nTitle: ${error.title}\nMessage: ${error.message}\nFile: ${error.fileName || "N/A"}\nRaw Log: ${error.rawDetails || "N/A"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Select appropriate icon, colors, and badge depending on error type
  const getIconAndColors = () => {
    switch (error.type) {
      case "password":
        return {
          icon: <Lock className="w-7 h-7 text-amber-500" />,
          badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          headerGradient: "from-amber-500/20 via-orange-500/10 to-transparent",
          accentColor: "text-amber-500",
        };
      case "corrupted":
        return {
          icon: <FileX className="w-7 h-7 text-rose-500" />,
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
          headerGradient: "from-rose-500/20 via-orange-500/10 to-transparent",
          accentColor: "text-rose-500",
        };
      case "size":
        return {
          icon: <HardDrive className="w-7 h-7 text-purple-500" />,
          badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
          headerGradient: "from-purple-500/20 via-indigo-500/10 to-transparent",
          accentColor: "text-purple-500",
        };
      case "empty":
        return {
          icon: <AlertTriangle className="w-7 h-7 text-orange-500" />,
          badgeBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
          headerGradient: "from-orange-500/20 via-amber-500/10 to-transparent",
          accentColor: "text-orange-500",
        };
      default:
        return {
          icon: <ShieldAlert className="w-7 h-7 text-rose-500" />,
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
          headerGradient: "from-rose-500/20 via-orange-500/10 to-transparent",
          accentColor: "text-rose-500",
        };
    }
  };

  const style = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className={`p-6 bg-gradient-to-r ${style.headerGradient} border-b border-slate-200 dark:border-slate-800 flex items-start justify-between`}>
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700">
              {style.icon}
            </div>
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border mb-1 ${style.badgeBg}`}>
                {error.badge}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {typeof error.title === "object" && error.title !== null
                  ? (error.title as any)?.message || JSON.stringify(error.title)
                  : String(error.title || "")}
              </h3>
              {error.fileName && (
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                  File: {String(error.fileName)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs">
          {/* Detailed Explanation */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <AlertOctagon className={`w-3.5 h-3.5 ${style.accentColor}`} />
              <span>Diagnostic Analysis</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {typeof error.message === "object" && error.message !== null
                ? (error.message as any)?.message || JSON.stringify(error.message)
                : String(error.message || "")}
            </p>
          </div>

          {/* Actionable Suggestion */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20">
            <div className="font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              <span>Recommended Resolution</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {typeof error.suggestion === "object" && error.suggestion !== null
                ? (error.suggestion as any)?.message || JSON.stringify(error.suggestion)
                : String(error.suggestion || "")}
            </p>
          </div>

          {/* Toggleable Raw Technical Details */}
          {error.rawDetails && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400"
              >
                <span>Raw Technical Diagnostics & Stack</span>
                {showTechnicalDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showTechnicalDetails && (
                <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[10px] space-y-2 overflow-x-auto max-h-36">
                  <div className="break-all whitespace-pre-wrap">
                    {typeof error.rawDetails === "object" && error.rawDetails !== null
                      ? JSON.stringify(error.rawDetails, null, 2)
                      : String(error.rawDetails)}
                  </div>
                  <button
                    onClick={handleCopyLog}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied Log!" : "Copy Diagnostics"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          {error.fileName && onRemoveProblematicFile && (
            <button
              onClick={() => {
                onRemoveProblematicFile(error.fileName);
                onDismiss();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition shrink-0"
            >
              Remove File
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            {error.type === "password" && onSwitchToTool && (
              <button
                onClick={() => {
                  onDismiss();
                  onSwitchToTool("protect-pdf");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition flex items-center space-x-1"
              >
                <span>Go to Unlock Tool</span>
              </button>
            )}

            <button
              onClick={onDismiss}
              className="px-5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Dismiss & Try Again</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
