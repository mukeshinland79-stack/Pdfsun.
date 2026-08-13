import { useState, useEffect } from "react";
import { X, Sparkles, ShieldCheck, Zap, Lock, ArrowRight, Check, AlertTriangle, Clock } from "lucide-react";
import { PaywallReason } from "../hooks/useUsageTracker";

interface FreeLimitPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: PaywallReason;
  fileSize?: number;
  onOpenPricing?: () => void;
  onUpgradeDirect?: (planId: "pro-monthly" | "pro-yearly") => void;
}

export const FreeLimitPaywallModal: React.FC<FreeLimitPaywallModalProps> = ({
  isOpen,
  onClose,
  reason = "limit",
  fileSize,
  onOpenPricing,
  onUpgradeDirect,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate time left until midnight reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const formattedFileSize = fileSize ? (fileSize / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-amber-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/20 text-white space-y-6 overflow-hidden">
        {/* Glow Accent Background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>PDFSUN PRO SUN PAYWALL</span>
          </div>
        </div>

        {/* Title & Reason Explanation */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>
              {reason === "size"
                ? "File Size Limit Exceeded"
                : reason === "batch"
                ? "Batch Limit Exceeded"
                : reason === "ai_trial"
                ? "AI Daily Trial Limit Reached"
                : "Daily Free Limit Reached"}
            </span>
          </h2>

          {reason === "size" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-medium space-y-1">
              <div className="flex items-center space-x-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Selected file: {formattedFileSize ? `${formattedFileSize} MB` : "File > 15 MB"} (Free Tier limit is 15 MB)</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                File size exceeds 15 MB limit. Upgrade to Pro Sun to process files up to 2 GB without restriction.
              </p>
            </div>
          )}

          {reason === "batch" && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs font-medium space-y-1">
              <div className="flex items-center space-x-2 font-bold text-indigo-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Batch processing requires Pro Sun membership (Max 2 files for Free Users)</span>
              </div>
              <p className="text-[11px] text-indigo-200/80">
                Batch processing requires Pro Sun membership. Upgrade to process unlimited files simultaneously.
              </p>
            </div>
          )}

          {reason === "ai_trial" && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs font-medium space-y-1">
              <div className="flex items-center space-x-2 font-bold text-purple-300">
                <Lock className="w-4 h-4 shrink-0 text-purple-400" />
                <span>AI Chat with PDF &amp; Advanced Gemini OCR trial queries used (2/2)</span>
              </div>
              <p className="text-[11px] text-purple-200/80">
                Top up with Flexi Pack (₹99) or subscribe to Pro Sun for unlimited AI document queries.
              </p>
            </div>
          )}

          {reason === "limit" && (
            <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs font-medium space-y-1">
              <div className="flex items-center space-x-2 font-bold text-orange-300">
                <Lock className="w-4 h-4 shrink-0 text-orange-400" />
                <span>Daily free task limit reached (3/3 downloads used today)</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-orange-200/90 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Free counter resets in: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                </span>
              </div>
              <p className="text-[11px] text-orange-200/80 pt-1">
                Daily free task limit reached (3/3). Top up with Flexi Pack (₹99) or subscribe to Pro Sun.
              </p>
            </div>
          )}
        </div>

        {/* Pro Benefits Grid */}
        <div className="space-y-3 pt-1 border-t border-slate-800">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Why Upgrade to PDFSun Pro?
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-200">
            {[
              "Unlimited daily downloads & conversions",
              "Up to 2 GB max file size support",
              "100% Client-side WebAssembly processing speed",
              "Priority AI Document Chat & OCR processing",
              "Batch processing & zero watermark option",
            ].map((benefit, idx) => (
              <li key={idx} className="flex items-center space-x-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="font-medium">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => {
              if (onUpgradeDirect) {
                onUpgradeDirect("pro-monthly");
              } else if (onOpenPricing) {
                onOpenPricing();
              }
              onClose();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 hover:scale-102 active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Upgrade to Pro — Instant Access</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition text-center"
          >
            No thanks, I'll wait for the free daily reset
          </button>
        </div>

        {/* Security / Guarantee Footer */}
        <div className="flex items-center justify-center space-x-4 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>256-bit SSL Security</span>
          </span>
          <span>•</span>
          <span>7-Day Money-Back Guarantee</span>
          <span>•</span>
          <span>Cancel Anytime</span>
        </div>
      </div>
    </div>
  );
};
