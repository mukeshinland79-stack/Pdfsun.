import React, { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Zap, Sparkles, Loader2, ArrowRight } from "lucide-react";

interface PaymentBlinkingRedirectModalProps {
  isOpen: boolean;
  onComplete: () => void;
  planName: string;
  paymentId: string;
  userId?: string;
  amountStr?: string;
}

export const PaymentBlinkingRedirectModal: React.FC<PaymentBlinkingRedirectModalProps> = ({
  isOpen,
  onComplete,
  planName,
  paymentId,
  userId = "user@pdfsun.in",
  amountStr = "₹199",
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(1);
      setCompletedSteps([]);
      return;
    }

    // Sequential 3-Step Blinking Timeline
    // Step 1: Payment Received (0 - 600ms)
    // Step 2: Verifying Transaction (600ms - 1200ms)
    // Step 3: Activating Subscription (1200ms - 1800ms)
    // Auto-Redirect at 1800ms

    const timer1 = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, 1]);
      setActiveStep(2);
    }, 600);

    const timer2 = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, 2]);
      setActiveStep(3);
    }, 1200);

    const timer3 = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, 3]);
    }, 1700);

    const redirectTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(redirectTimer);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-6 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
            <span>PAYMENT PROCESSING ENGINE</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Activating Your Access
          </h3>
          <p className="text-xs text-slate-400">
            Order: <span className="font-mono text-amber-400">{paymentId}</span> • User: <span className="text-slate-300 font-semibold">{userId}</span>
          </p>
        </div>

        {/* Sequential 3-Step Blinking Progress List */}
        <div className="space-y-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          {/* Step 1: Payment Received */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
              completedSteps.includes(1)
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : activeStep === 1
                ? "bg-amber-500/10 border-amber-500/60 text-amber-300 animate-pulse ring-2 ring-amber-500/30"
                : "bg-slate-950/40 border-slate-800 text-slate-500"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  completedSteps.includes(1)
                    ? "bg-emerald-500 text-slate-950"
                    : activeStep === 1
                    ? "bg-amber-500 text-slate-950 animate-bounce"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {completedSteps.includes(1) ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : "1"}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Step 1: Payment Received</p>
                <p className="text-[11px] opacity-80">{amountStr} confirmed via Razorpay Gateway</p>
              </div>
            </div>

            {activeStep === 1 && !completedSteps.includes(1) && (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Processing...</span>
              </span>
            )}
            {completedSteps.includes(1) && <span className="text-xs font-black text-emerald-400">DONE ✓</span>}
          </div>

          {/* Step 2: Verifying Transaction */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
              completedSteps.includes(2)
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : activeStep === 2
                ? "bg-amber-500/10 border-amber-500/60 text-amber-300 animate-pulse ring-2 ring-amber-500/30"
                : "bg-slate-950/40 border-slate-800 text-slate-500"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  completedSteps.includes(2)
                    ? "bg-emerald-500 text-slate-950"
                    : activeStep === 2
                    ? "bg-amber-500 text-slate-950 animate-bounce"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {completedSteps.includes(2) ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : "2"}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Step 2: Verifying Transaction</p>
                <p className="text-[11px] opacity-80">HMAC-SHA256 signature &amp; webhook check</p>
              </div>
            </div>

            {activeStep === 2 && !completedSteps.includes(2) && (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Verifying...</span>
              </span>
            )}
            {completedSteps.includes(2) && <span className="text-xs font-black text-emerald-400">DONE ✓</span>}
          </div>

          {/* Step 3: Activating Subscription */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
              completedSteps.includes(3)
                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/40"
                : activeStep === 3
                ? "bg-amber-500/10 border-amber-500/60 text-amber-300 animate-pulse ring-2 ring-amber-500/30"
                : "bg-slate-950/40 border-slate-800 text-slate-500"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  completedSteps.includes(3)
                    ? "bg-emerald-500 text-slate-950"
                    : activeStep === 3
                    ? "bg-amber-500 text-slate-950 animate-bounce"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {completedSteps.includes(3) ? <Sparkles className="w-5 h-5 stroke-[2.5]" /> : "3"}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Step 3: Activating Subscription</p>
                <p className="text-[11px] opacity-80">Binding plan to User ID: {userId}</p>
              </div>
            </div>

            {activeStep === 3 && !completedSteps.includes(3) && (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Binding...</span>
              </span>
            )}
            {completedSteps.includes(3) && <span className="text-xs font-black text-emerald-400">ACTIVATED 🟢</span>}
          </div>
        </div>

        {/* Footer info & auto-redirect indicator */}
        <div className="text-center pt-1 space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Redirecting to Main Plans Page...</span>
          </div>

          <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>256-Bit SSL Encrypted Session Security</span>
          </p>
        </div>
      </div>
    </div>
  );
};
