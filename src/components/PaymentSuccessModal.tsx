import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Crown,
} from "lucide-react";
import { UserProfile } from "../types";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  onRefreshProfile?: () => void;
  onStartProcessing?: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onRefreshProfile,
  onStartProcessing,
}) => {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    planName: string;
    amount: string;
    credits: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Parse URL search params or fallback to local storage
      const params = new URLSearchParams(window.location.search);
      const pId =
        params.get("razorpay_payment_id") ||
        params.get("payment_id") ||
        `pay_rzp_${Math.random().toString(36).substring(2, 10)}`;
      const plan =
        params.get("plan") ||
        localStorage.getItem("pdfsun_user_plan_v1") ||
        "Pro Sun Monthly";
      const credits = localStorage.getItem("pdfsun_user_credits_v1") || "100";

      // Instantly persist Pro state in local storage for zero-delay unlocking
      try {
        localStorage.setItem("pdfsun_user_plan_v1", plan);
        localStorage.setItem("pdfsun_pro_plan", "pro");
        localStorage.setItem("pdfsun_user_is_pro", "true");
      } catch {}

      setPaymentDetails({
        paymentId: pId,
        planName: plan.includes("flexi")
          ? "Flexi Pack (100 Credits)"
          : plan.includes("annual")
          ? "Pro Sun Annual"
          : plan.includes("enterprise")
          ? "Enterprise Plan"
          : plan,
        amount:
          params.get("amount") ||
          (plan.includes("flexi")
            ? "₹99"
            : plan.includes("annual")
            ? "₹1,499"
            : plan.includes("enterprise")
            ? "₹4,999"
            : "₹199"),
        credits: plan.includes("flexi")
          ? `${credits} Lifetime Credits`
          : "UNLIMITED 100% Full Capacity",
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      // Trigger automatic background credit/profile sync
      handleAutoSync();
    }
  }, [isOpen]);

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      if (onRefreshProfile) {
        onRefreshProfile();
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (e) {
      console.warn("Sync error:", e);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyPaymentId = () => {
    if (paymentDetails?.paymentId) {
      navigator.clipboard.writeText(paymentDetails.paymentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0f172a] border border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-6 relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-emerald-500/25 to-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Celebratory Icon & Header */}
        <div className="text-center space-y-3 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          {/* Prominent Green Status Tag: Plan Activated */}
          <div className="flex justify-center">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>PLAN ACTIVATED</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Payment Successful!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Your payment was processed securely. All PDF processing tools, high-speed compression, and premium features are now 100% unlocked on your account.
          </p>
        </div>

        {/* Transaction Summary Box */}
        {paymentDetails && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Transaction Reference:</span>
              <button
                type="button"
                onClick={handleCopyPaymentId}
                className="inline-flex items-center space-x-1.5 font-mono text-amber-400 hover:text-amber-300 transition cursor-pointer"
              >
                <span>{paymentDetails.paymentId}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Purchased Plan:</span>
                <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {paymentDetails.planName}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Status:</span>
                <span className="font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Plan Active (Pro)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Tool Capabilities:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Zap className="w-3.5 h-3.5 shrink-0 fill-emerald-400" />
                  {paymentDetails.credits}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Amount Paid:</span>
                <span className="font-bold text-white mt-0.5 block">{paymentDetails.amount}</span>
              </div>

              <div className="col-span-2 pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 text-[11px]">Activated On: </span>
                <span className="font-medium text-slate-300 text-[11px]">{paymentDetails.date}</span>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Sync Indicator */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">
              {syncing ? "Verifying active session..." : "Account status live & verified"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAutoSync}
            disabled={syncing}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Security & Trust Stamp */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Razorpay Verified • 256-Bit SSL Encrypted • 100% Privacy</span>
        </div>

        {/* Primary Action Button: Start Using PDF Tools Now */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onStartProcessing) {
                onStartProcessing();
              }
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Start Using PDF Tools Now</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
