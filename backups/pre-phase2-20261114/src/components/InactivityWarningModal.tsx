import React from "react";
import { ShieldAlert, Clock, LogOut, RefreshCw, CheckCircle2 } from "lucide-react";

interface InactivityWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  remainingSeconds,
  onStayLoggedIn,
  onLogoutNow,
}) => {
  if (!isOpen) return null;

  // Calculate circular progress percentage (60s to 0s)
  const totalSeconds = 60;
  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
  const dashOffset = 283 - (283 * progressPercent) / 100;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-center space-y-5">
        
        {/* Subtle Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse" />

        {/* Security Shield & Circular Timer Graphic */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-amber-500 transition-all duration-1000 ease-linear"
              strokeWidth="6"
              strokeDasharray="283"
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-amber-500 font-mono tracking-tight">
              {remainingSeconds}s
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</span>
          </div>
        </div>

        {/* Title & Warning Message */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>INACTIVITY SECURITY ALERT</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Session Expiring Soon
          </h3>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            Aap 9 minute se inactive hain. Security reasons ke liye aap{" "}
            <span className="font-extrabold text-amber-500 font-mono">{remainingSeconds} seconds</span> me log out ho jayenge.
          </p>
        </div>

        {/* Auto-Draft Notification Badge */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center space-x-2.5 text-left">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Auto-Draft Preserved</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Your active inputs, tools & pages are saved in session memory.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onStayLoggedIn}
            type="button"
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>

          <button
            onClick={onLogoutNow}
            type="button"
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Logout Now</span>
          </button>
        </div>

      </div>
    </div>
  );
};
