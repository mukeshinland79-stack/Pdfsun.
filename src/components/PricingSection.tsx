import React, { useState } from "react";
import { Check, Zap, Sparkles, ShieldCheck, CreditCard, Lock, RefreshCw, HelpCircle, ArrowRight, Star, Globe, DollarSign } from "lucide-react";

interface PricingSectionProps {
  onSuccessUpgrade?: () => void;
  isProUser?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSuccessUpgrade, isProUser = false }) => {
  const [currency, setCurrency] = useState<"INR" | "USD">(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && (tz.includes("Kolkata") || tz.includes("Asia/Calcutta") || tz.includes("India"))) {
        return "INR";
      }
    } catch {}
    return "INR"; // Default to INR
  });

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeGatewayModal, setActiveGatewayModal] = useState<"razorpay" | "stripe" | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>("");
  const [selectedPlanAmount, setSelectedPlanAmount] = useState<number>(0);
  const [refundModalOpen, setRefundModalOpen] = useState<boolean>(false);
  const [refundTxId, setRefundTxId] = useState<string>("");
  const [refundStatus, setRefundStatus] = useState<string | null>(null);

  // Pricing Data Matrix
  const plans = [
    {
      id: "free",
      name: "Free Tier",
      badge: "START FREE",
      badgeBg: "bg-slate-700/60 text-slate-300 border-slate-600",
      description: "Core WebAssembly PDF processing for occasional quick tasks.",
      priceINRMonthly: 0,
      priceINRYearly: 0,
      priceUSDMonthly: 0,
      priceUSDYearly: 0,
      popular: false,
      features: [
        "3 Free Downloads/Conversions per 24h",
        "Up to 15 MB file size limit",
        "100% Client-side privacy & zero server logs",
        "Standard WebAssembly processing engine",
        "Basic PDF tools (Merge, Split, Compress)",
      ],
      cta: "Current Free Plan",
      disabled: true,
    },
    {
      id: "pro-monthly",
      name: "Pro Sun Monthly",
      badge: "FLEXIBLE",
      badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      description: "Full unlimited power for active power users & students.",
      priceINRMonthly: 199,
      priceINRYearly: 199,
      priceUSDMonthly: 4,
      priceUSDYearly: 4,
      popular: false,
      features: [
        "UNLIMITED daily downloads & conversions",
        "Up to 2 GB max file size support",
        "Priority Gemini 3.6 AI Chat & OCR engine",
        "Batch processing multi-file tools",
        "Zero watermarks & max compression ratio",
        "Cancel anytime with 1-click",
      ],
      cta: "Subscribe Monthly",
    },
    {
      id: "pro-yearly",
      name: "Pro Sun Annual",
      badge: "MOST POPULAR • SAVE 40%",
      badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-400",
      description: "Best value subscription for professionals & growing teams.",
      priceINRMonthly: 199,
      priceINRYearly: 1499, // ~ ₹125 / month
      priceUSDMonthly: 4,
      priceUSDYearly: 29, // ~ $2.40 / month
      popular: true,
      features: [
        "EVERYTHING in Monthly Plan",
        "Save 40% vs monthly billing",
        "Dedicated priority server bandwidth",
        "Multi-device cloud sync",
        "7-Day 100% Money-Back Guarantee",
        "24/7 Priority Support Desk",
      ],
      cta: "Get Annual Access — Save 40%",
    },
  ];

  const handleSelectPlan = async (plan: (typeof plans)[0]) => {
    if (plan.disabled || isProUser) return;

    setIsProcessing(true);
    const isYearly = billingCycle === "yearly";

    let amount = 0;
    if (currency === "INR") {
      amount = isYearly ? plan.priceINRYearly : plan.priceINRMonthly;
    } else {
      amount = isYearly ? plan.priceUSDYearly : plan.priceUSDMonthly;
    }

    setSelectedPlanName(plan.name);
    setSelectedPlanAmount(amount);

    try {
      if (currency === "INR") {
        // Trigger Razorpay Flow
        const res = await fetch("/api/create-razorpay-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            amount,
            currency: "INR",
            userEmail: "user@pdfsun.in",
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActiveGatewayModal("razorpay");
        }
      } else {
        // Trigger Stripe Flow
        const res = await fetch("/api/create-stripe-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            amount,
            currency: "USD",
            userEmail: "user@pdfsun.in",
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActiveGatewayModal("stripe");
        }
      }
    } catch (e) {
      console.error("Payment initiation error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const completePaymentSimulation = () => {
    // Set pro plan in localStorage
    try {
      localStorage.setItem("pdfsun_user_plan_v1", "pro");
    } catch {}

    if (onSuccessUpgrade) {
      onSuccessUpgrade();
    }

    setActiveGatewayModal(null);
    alert(`🎉 Success! Payment processed via ${activeGatewayModal === "razorpay" ? "Razorpay (UPI / Cards)" : "Stripe"}. Your PDFSun Pro subscription is now active!`);
    window.location.reload();
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTxId) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/process-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: refundTxId,
          userEmail: "user@pdfsun.in",
          reason: "7-Day Satisfaction Guarantee",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRefundStatus(data.message);
        try {
          localStorage.removeItem("pdfsun_user_plan_v1");
        } catch {}
      } else {
        setRefundStatus("Failed to process refund. Please contact support.");
      }
    } catch (err: any) {
      setRefundStatus("Error connecting to refund server.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider shadow-xs">
          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500" />
          <span>INSTANT UNLIMITED PDF PROCESSING</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Simple, Transparent <span className="text-amber-600 dark:text-amber-400">Pricing Plans</span>
        </h2>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Process unlimited PDF files with 100% private WebAssembly speed. No hidden fees. Cancel anytime with a 1-click 7-day money-back guarantee.
        </p>

        {/* Currency & Billing Controls Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {/* Smart Currency Switcher */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-xs font-bold shadow-md">
            <button
              onClick={() => setCurrency("INR")}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                currency === "INR"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>🇮🇳 INR (₹) Razorpay</span>
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                currency === "USD"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌎 USD ($) Stripe</span>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-xs font-bold shadow-md">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl transition ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md border border-slate-300 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                billingCycle === "yearly"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/20 dark:bg-slate-950/40 text-amber-900 dark:text-amber-300 uppercase font-black">
                Save 40%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {plans.map((plan) => {
          const isYearly = billingCycle === "yearly";
          const displayPrice =
            currency === "INR"
              ? isYearly
                ? plan.priceINRYearly
                : plan.priceINRMonthly
              : isYearly
              ? plan.priceUSDYearly
              : plan.priceUSDMonthly;

          const currencySymbol = currency === "INR" ? "₹" : "$";

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 sm:p-8 bg-white dark:bg-[#0f172a]/95 backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between shadow-xl ${
                plan.popular
                  ? "border-amber-500 dark:border-amber-400/80 shadow-[0_0_30px_rgba(234,179,8,0.25)] ring-2 ring-amber-500/40 dark:ring-amber-400/40 scale-102"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Top Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${plan.badgeBg}`}>
                  {plan.badge}
                </span>

                {plan.popular && (
                  <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Best Value</span>
                  </span>
                )}
              </div>

              {/* Plan Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{plan.description}</p>
                </div>

                {/* Price Display */}
                <div className="py-2 border-y border-slate-200 dark:border-slate-800">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currencySymbol}{displayPrice}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {plan.priceINRMonthly === 0 ? "/ forever" : isYearly ? "/ year" : "/ month"}
                    </span>
                  </div>

                  {isYearly && displayPrice > 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold font-mono mt-1">
                      Equivalent to ~{currencySymbol}
                      {currency === "INR" ? Math.round(displayPrice / 12) : (displayPrice / 12).toFixed(2)} / month
                    </p>
                  )}
                </div>

                {/* Features Checklist */}
                <ul className="space-y-3 pt-2 text-xs text-slate-800 dark:text-slate-200">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button & Payment Router */}
              <div className="pt-8 space-y-3">
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={plan.disabled || isProUser || isProcessing}
                  className={`w-full py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 ${
                    isProUser && plan.id !== "free"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 cursor-default"
                      : plan.popular
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 hover:scale-102 active:scale-98 shadow-amber-500/20"
                      : plan.disabled
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                      : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-800 dark:border-slate-700"
                  }`}
                >
                  {isProUser && plan.id !== "free" ? (
                    <span>Pro Account Active</span>
                  ) : (
                    <>
                      <span>{plan.cta}</span>
                      {!plan.disabled && <ArrowRight className="w-4 h-4 stroke-[3]" />}
                    </>
                  )}
                </button>

                {/* Payment Methods Info */}
                {!plan.disabled && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center space-x-1">
                    <CreditCard className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>
                      {currency === "INR"
                        ? "Razorpay (GPay, PhonePe, Paytm, Cards)"
                        : "Stripe (Cards, Apple Pay, GPay)"}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Badges Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs">
        <div className="flex items-center justify-center space-x-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">256-Bit SSL Encryption</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Bank-grade payment security</p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <RefreshCw className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">7-Day Guarantee</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">100% 1-click self-service refund</p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">Cancel Anytime</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Zero hidden contracts or lock-in</p>
          </div>
        </div>
      </div>

      {/* Self-Service Refund Portal Button Footer */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          Already subscribed? Need an invoice or 1-click self-service refund?{" "}
          <button
            onClick={() => setRefundModalOpen(true)}
            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-bold underline underline-offset-4 transition"
          >
            Click here.
          </button>
        </p>
      </div>

      {/* Simulated Payment Gateway Modal */}
      {activeGatewayModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f172a] border border-amber-400/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {activeGatewayModal === "razorpay" ? "Razorpay Payment Gateway" : "Stripe Checkout"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Secure Order Verification</p>
                </div>
              </div>
              <button
                onClick={() => setActiveGatewayModal(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="font-bold text-white">{selectedPlanName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {currency === "INR" ? "₹" : "$"}{selectedPlanAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway:</span>
                <span className="font-bold text-emerald-400">
                  {activeGatewayModal === "razorpay" ? "Razorpay (UPI / Cards / Netbanking)" : "Stripe (Global Credit Cards)"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={completePaymentSimulation}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-102 active:scale-98 transition"
              >
                Simulate Successful Payment →
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                Demo sandbox: Clicking activates Pro features instantly without real credit card charges.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refund Portal Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>1-Click Self-Service Refund</span>
              </h3>
              <button
                onClick={() => {
                  setRefundModalOpen(false);
                  setRefundStatus(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRequestRefund} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                If you are within 7 days of purchase, enter your Transaction ID or Order Number below for an instant full refund.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Transaction / Order ID
                </label>
                <input
                  type="text"
                  value={refundTxId}
                  onChange={(e) => setRefundTxId(e.target.value)}
                  placeholder="e.g. order_rzp_98a7sd6f"
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {refundStatus && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  {refundStatus}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
              >
                {isProcessing ? "Processing Refund..." : "Initiate Instant Refund"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
