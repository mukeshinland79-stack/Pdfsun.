import React from "react";
import { Mic, ShieldCheck, Lock, Sparkles, X, AlertCircle } from "lucide-react";

interface MicrophonePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  featureName?: string;
  description?: string;
  isRequesting?: boolean;
  errorMessage?: string | null;
}

export const MicrophonePermissionModal: React.FC<MicrophonePermissionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  featureName = "Voice-to-PDF Dictation",
  description = "PDFSun needs microphone access to convert your spoken words into structured document text in real time.",
  isRequesting = false,
  errorMessage = null,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRequesting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-permission-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-slate-900 dark:text-white space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isRequesting}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Mic Icon */}
        <div className="flex items-center space-x-3.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Voice Tool Permission
            </span>
            <h3 id="mic-permission-title" className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
              Enable Microphone Access
            </h3>
          </div>
        </div>

        {/* Explanatory Text */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {description}
        </p>

        {/* Security & Privacy Highlights */}
        <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div className="flex items-start space-x-2.5 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>100% In-Browser Privacy:</strong> Audio is processed locally via browser speech APIs and never recorded or uploaded to cloud servers.
            </span>
          </div>
          <div className="flex items-start space-x-2.5 text-slate-700 dark:text-slate-300">
            <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Background Listening:</strong> Microphone turns off automatically as soon as you stop dictation or close the tool.
            </span>
          </div>
          <div className="flex items-start space-x-2.5 text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Specific to {featureName}:</strong> Permission is only used while actively dictating inside this tool.
            </span>
          </div>
        </div>

        {/* Error Notification if previously blocked or failed */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRequesting}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Mic className="w-4 h-4" />
            <span>{isRequesting ? "Requesting Access..." : "Allow & Start Speaking"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isRequesting}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Cancel / Type Manually
          </button>
        </div>
      </div>
    </div>
  );
};
