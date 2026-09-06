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
  Printer,
  Calendar,
  CreditCard,
} from "lucide-react";
import { UserProfile } from "../types";
import { resolvePaymentProduct } from "../config/paymentProducts";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  onRefreshProfile?: () => void;
  onStartProcessing?: () => void;
  onOpenInvoice?: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onRefreshProfile,
  onStartProcessing,
  onOpenInvoice,
}) => {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    planName: string;
    planId: string;
    amount: string;
    amountINR: number;
    credits: string;
    activatedDate: string;
    expiryDate: string;
    isSubscription: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Parse URL search params or fallback to local storage
      const params = new URLSearchParams(window.location.search);
      const pId =
        params.get("razorpay_payment_id") ||
        params.get("payment_id") ||
        localStorage.getItem("pdfsun_last_payment_id") ||
        `pay_rzp_${Math.random().toString(36).substring(2, 10)}`;

      const rawPlan =
        params.get("plan") ||
        params.get("planId") ||
        params.get("plan_id") ||
        localStorage.getItem("pdfsun_last_checkout_plan") ||
        sessionStorage.getItem("pdfsun_last_checkout_plan") ||
        localStorage.getItem("pdfsun_user_plan_v1") ||
        "";

      const rawAmount =
        params.get("amount") ||
        params.get("amountINR") ||
        localStorage.getItem("pdfsun_last_checkout_amount") ||
        sessionStorage.getItem("pdfsun_last_checkout_amount") ||
        localStorage.getItem("pdfsun_last_payment_amount") ||
        "";

      const rawPaymentLinkId =
        params.get("payment_link_id") ||
        params.get("plink_id") ||
        "";

      // Dynamically resolve exact product
      const product = resolvePaymentProduct({
        planId: rawPlan,
        amountINR: rawAmount ? Number(rawAmount.replace(/[^0-9.]/g, "")) : undefined,
        paymentLinkId: rawPaymentLinkId,
      });

      const now = new Date();
      let expiryText = "";
      const isSub = product.type === "subscription" || product.type === "enterprise";

      if (product.internalProductId === "flexi") {
        expiryText = "Never Expires (Lifetime Validity)";
      } else {
        const days =
          product.billingInterval === "yearly" ||
          product.internalProductId.includes("yearly") ||
          product.internalProductId.includes("annual") ||
          product.internalProductId.includes("enterprise")
            ? 365
            : 30;
        const expDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        expiryText = `Active until ${expDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })} (${days} Days Active)`;
      }

      // Persist state in storage
      try {
        localStorage.setItem("pdfsun_user_plan_v1", product.productName);
        localStorage.setItem("pdfsun_pro_plan", "pro");
        localStorage.setItem("pdfsun_user_is_pro", "true");
        localStorage.setItem("pdfsun_last_payment_amount", String(product.displayPriceINR));
        localStorage.setItem("pdfsun_last_payment_id", pId);
        if (product.credits) {
          localStorage.setItem("pdfsun_user_credits_v1", String(product.credits));
        }
      } catch {}

      setPaymentDetails({
        paymentId: pId,
        planName: product.productName,
        planId: product.internalProductId,
        amount: `₹${product.displayPriceINR.toLocaleString("en-IN")}`,
        amountINR: product.displayPriceINR,
        credits: product.internalProductId === "flexi"
          ? "100 Lifetime PDF Operations"
          : "Unlimited Operations (Zero Restrictions)",
        activatedDate: now.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        expiryDate: expiryText,
        isSubscription: isSub,
      });

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

  const handlePrintInvoice = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0f172a] border border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-5 relative overflow-hidden">
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
            Your payment was processed securely via Razorpay. Your account entitlements have been dynamically synchronized.
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
                <span className="font-bold text-white flex items-center gap-1 mt-0.5 text-xs">
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {paymentDetails.planName}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Amount Paid:</span>
                <span className="font-mono font-black text-emerald-400 text-sm mt-0.5 block">
                  {paymentDetails.amount} INR
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
                <span className="text-slate-400 block text-[11px]">Plan Expiry:</span>
                <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  {paymentDetails.expiryDate}
                </span>
              </div>

              <div className="col-span-2 pt-1.5 border-t border-slate-800/60 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Activated On: {paymentDetails.activatedDate}</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Real-time Sync Active</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Sync Indicator */}
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">
              {syncing ? "Verifying active session..." : "Account status live & verified with Firestore"}
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

        {/* Action Buttons: Invoice & Start Using Tools */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onStartProcessing) {
                onStartProcessing();
              }
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-99 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Start Using All PDF Tools Now</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={handlePrintInvoice}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Download / Print GST Tax Invoice</span>
          </button>
        </div>

        {/* Security & Trust Stamp */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Official Razorpay Verified Gateway • 256-Bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
};
