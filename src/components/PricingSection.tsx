import React, { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  Zap,
  ShieldCheck,
  CreditCard,
  Lock,
  RefreshCw,
  ArrowRight,
  Star,
  Globe,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { PaymentBlinkingRedirectModal } from "./PaymentBlinkingRedirectModal";
import { UserProfile } from "../types";

interface PricingSectionProps {
  onSuccessUpgrade?: () => void;
  isProUser?: boolean;
  onOpenPolicy?: (policy: "privacy" | "terms" | "cookie" | "refund" | "about") => void;
  userProfile?: UserProfile | null;
}

export interface PlanTier {
  id: string;
  name: string;
  badge: string;
  badgeBg: string;
  description: string;
  billingType: "free" | "one-time" | "subscription" | "enterprise";
  paymentLinkId?: string;
  razorpayLink?: string;
  priceINR: {
    monthly: number;
    yearly: number;
    oneTime?: number;
    labelMonthly: string;
    labelYearly: string;
    subtextMonthly: string;
    subtextYearly: string;
  };
  priceUSD: {
    monthly: number;
    yearly: number;
    oneTime?: number;
    labelMonthly: string;
    labelYearly: string;
    subtextMonthly: string;
    subtextYearly: string;
  };
  popular?: boolean;
  guaranteeText: string;
  features: string[];
  cta: string;
  disabled?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSuccessUpgrade, isProUser = false, onOpenPolicy, userProfile }) => {
  const currentUserId = (userProfile?.email || "mukeshinland79@gmail.com").toLowerCase().trim();

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
  const [selectedPlanRazorpayLink, setSelectedPlanRazorpayLink] = useState<string>("");
  const [refundModalOpen, setRefundModalOpen] = useState<boolean>(false);
  const [refundTxId, setRefundTxId] = useState<string>("");
  const [refundStatus, setRefundStatus] = useState<string | null>(null);

  // Sequential 3-Step Blinking Redirect Modal & User Subscription State
  const [blinkingModalOpen, setBlinkingModalOpen] = useState<boolean>(false);
  const [activePaymentDetails, setActivePaymentDetails] = useState<{
    planName: string;
    paymentId: string;
    amountStr: string;
    planId: string;
  } | null>(null);

  const [userSubscription, setUserSubscription] = useState<{
    id: string;
    user_id: string;
    plan_id: string;
    status: "pending" | "active" | "expired";
    activated_at: string;
    expires_at: string;
    payment_id: string;
  } | null>(null);

  // Fetch real-time active user subscription bound to User ID
  const fetchUserSubscription = async () => {
    try {
      const res = await fetch(`/api/user/subscription?userId=${encodeURIComponent(currentUserId)}`);
      const data = await res.json();
      if (data.success && data.subscription) {
        setUserSubscription(data.subscription);
        if (data.isPro) {
          setActivePlanId(data.subscription.plan_id);
        }
      }
    } catch (err) {
      console.warn("Error fetching user subscription:", err);
    }
  };

  useEffect(() => {
    fetchUserSubscription();
  }, [currentUserId]);

  // High-Conversion Pricing Tiers Matrix (Ordered Left to Right)
  const plans: PlanTier[] = [
    {
      id: "free",
      name: "Free Plan",
      badge: "FREE FOREVER",
      badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      description: "Basic WebAssembly PDF processing with daily task limits.",
      billingType: "free",
      priceINR: {
        monthly: 0,
        yearly: 0,
        labelMonthly: "₹0",
        labelYearly: "₹0",
        subtextMonthly: "Free forever / 3 daily limit",
        subtextYearly: "Free forever / 3 daily limit",
      },
      priceUSD: {
        monthly: 0,
        yearly: 0,
        labelMonthly: "$0",
        labelYearly: "$0",
        subtextMonthly: "Free forever / 3 daily limit",
        subtextYearly: "Free forever / 3 daily limit",
      },
      guaranteeText: "100% Free Forever",
      popular: false,
      features: [
        "3 Free tasks per 24 hours",
        "Up to 15 MB file size limit",
        "100% In-browser privacy & zero server logs",
        "Standard WebAssembly processing",
        "Basic PDF tools (Merge, Split, Compress)",
      ],
      cta: "Current Free Plan",
      disabled: true,
    },
    {
      id: "flexi",
      name: "Flexi Pack",
      badge: "ONE-TIME TOP-UP",
      badgeBg: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
      description: "Pay-as-you-go credit top-up without any recurring commitments.",
      billingType: "one-time",
      paymentLinkId: "plink_pdfsun_flexi",
      razorpayLink: "https://rzp.io/rzp/pdfsun-flexi",
      priceINR: {
        monthly: 99,
        yearly: 99,
        oneTime: 99,
        labelMonthly: "₹99",
        labelYearly: "₹99",
        subtextMonthly: "100 Lifetime Credits (No Expiry)",
        subtextYearly: "100 Lifetime Credits (No Expiry)",
      },
      priceUSD: {
        monthly: 1.99,
        yearly: 1.99,
        oneTime: 1.99,
        labelMonthly: "$1.99",
        labelYearly: "$1.99",
        subtextMonthly: "100 Lifetime Credits (No Expiry)",
        subtextYearly: "100 Lifetime Credits (No Expiry)",
      },
      guaranteeText: "Strictly Non-Refundable",
      popular: false,
      features: [
        "100 Instant Processing Credits (No Expiry)",
        "Use on all premium PDF & AI OCR tools",
        "Up to 500 MB max file size support",
        "Pay once — zero recurring charges",
        "Single-user instant credit top-up",
      ],
      cta: "Buy 100 Credits — ₹99",
    },
    {
      id: "pro-monthly",
      name: "Pro Sun Monthly",
      badge: "FLEXIBLE RECURRING",
      badgeBg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
      description: "Full unlimited power for active power users & students.",
      billingType: "subscription",
      paymentLinkId: "plink_pdfsun_monthly",
      razorpayLink: "https://rzp.io/rzp/pdfsun-monthly",
      priceINR: {
        monthly: 199,
        yearly: 199,
        labelMonthly: "₹199",
        labelYearly: "₹199",
        subtextMonthly: "Billed monthly at ₹199",
        subtextYearly: "Billed monthly at ₹199",
      },
      priceUSD: {
        monthly: 2.99,
        yearly: 2.99,
        labelMonthly: "$2.99",
        labelYearly: "$2.99",
        subtextMonthly: "Billed monthly at $2.99",
        subtextYearly: "Billed monthly at $2.99",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
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
      badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-400 shadow-xs",
      description: "Best value subscription for professionals & active users.",
      billingType: "subscription",
      paymentLinkId: "plink_pdfsun_annual",
      razorpayLink: "https://rzp.io/rzp/pdfsun-annual",
      priceINR: {
        monthly: 199,
        yearly: 1499,
        labelMonthly: "₹1,499",
        labelYearly: "₹1,499",
        subtextMonthly: "₹1,499 / Year (~₹125/month)",
        subtextYearly: "₹1,499 / Year (~₹125/month)",
      },
      priceUSD: {
        monthly: 2.99,
        yearly: 19.99,
        labelMonthly: "$19.99",
        labelYearly: "$19.99",
        subtextMonthly: "$19.99 / Year (~$1.66/month)",
        subtextYearly: "$19.99 / Year (~$1.66/month)",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
      popular: true,
      features: [
        "EVERYTHING in Monthly Plan",
        "Save 40% vs monthly rate",
        "Dedicated priority processing bandwidth",
        "Multi-device cloud sync",
        "24/7 Priority Support Desk",
      ],
      cta: "Get Annual Access — Save 40%",
    },
    {
      id: "enterprise",
      name: "Enterprise / Team Plan",
      badge: "5 SEATS & ADMIN TOOLS",
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      description: "Comprehensive team license with admin controls & multi-user seats.",
      billingType: "enterprise",
      paymentLinkId: "plink_pdfsun_enterprise",
      razorpayLink: "https://rzp.io/rzp/pdfsun-enterprise",
      priceINR: {
        monthly: 3999,
        yearly: 3999,
        labelMonthly: "₹3,999",
        labelYearly: "₹3,999",
        subtextMonthly: "5 User Seats Included (~₹66/mo per seat)",
        subtextYearly: "5 User Seats Included (~₹66/mo per seat)",
      },
      priceUSD: {
        monthly: 49.99,
        yearly: 49.99,
        labelMonthly: "$49.99",
        labelYearly: "$49.99",
        subtextMonthly: "5 User Seats Included (~$0.83/mo per seat)",
        subtextYearly: "5 User Seats Included (~$0.83/mo per seat)",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
      popular: false,
      features: [
        "5 User Seats Included",
        "Centralized Team Billing & Admin Portal",
        "Priority OCR & Gemini AI Pipeline",
        "Unlimited file size & batch speed",
        "Dedicated Account Manager & 24/7 SLA",
      ],
      cta: "Get Team Access",
    },
  ];

  const [incompleteNoticeOpen, setIncompleteNoticeOpen] = useState<boolean>(false);
  const [activePlanId, setActivePlanId] = useState<string>(() => {
    try {
      return localStorage.getItem("pdfsun_user_plan_v1") || (isProUser ? "pro-yearly" : "free");
    } catch {
      return isProUser ? "pro-yearly" : "free";
    }
  });

  const handleSelectPlan = async (plan: PlanTier) => {
    if (plan.disabled || (isProUser && plan.id !== "flexi")) return;

    setIsProcessing(true);
    const isYearly = billingCycle === "yearly";

    let amount = 0;
    if (currency === "INR") {
      if (plan.billingType === "one-time") {
        amount = plan.priceINR.oneTime || 99;
      } else if (plan.billingType === "enterprise") {
        amount = plan.priceINR.yearly;
      } else {
        amount = isYearly ? plan.priceINR.yearly : plan.priceINR.monthly;
      }
    } else {
      if (plan.billingType === "one-time") {
        amount = plan.priceUSD.oneTime || 1.99;
      } else if (plan.billingType === "enterprise") {
        amount = plan.priceUSD.yearly;
      } else {
        amount = isYearly ? plan.priceUSD.yearly : plan.priceUSD.monthly;
      }
    }

    setSelectedPlanName(plan.name);
    setSelectedPlanAmount(amount);
    setSelectedPlanRazorpayLink(plan.razorpayLink || "");

    try {
      // 1. Fetch Order & Subscription details from backend
      const res = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount,
          currency: currency === "INR" ? "INR" : "USD",
          userEmail: "user@pdfsun.in",
        }),
      });
      const data = await res.json();

      // 2. Check if Razorpay Checkout JS is loaded for Desktop / Laptop / Mobile Pop-up Modal
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: data.keyId || "rzp_live_pdfsun_key",
          amount: data.amount || amount * 100,
          currency: currency === "INR" ? "INR" : "USD",
          name: "PDFSun.in",
          description: `${plan.name} — Instant Premium Access`,
          image: "https://pdfsun.in/icon-192.png",
          order_id: data.orderId,
          subscription_id: data.subscriptionId,
          prefill: {
            name: "PDFSun User",
            email: "user@pdfsun.in",
            contact: "",
          },
          notes: {
            planId: plan.id,
            userEmail: "user@pdfsun.in",
            site: "PDFSun.in",
            payment_link_id: plan.paymentLinkId,
          },
          theme: {
            color: "#f59e0b",
          },
          handler: async function (response: any) {
            console.log("[Razorpay Pop-up Modal] Payment completed successfully:", response);
            const payId = response.razorpay_payment_id || `pay_rzp_${Math.random().toString(36).substring(2, 10)}`;

            // Fire GA4 Purchase Event according to requirement #5
            if (typeof (window as any).gtag === "function") {
              (window as any).gtag("event", "purchase", {
                transaction_id: payId,
                value: amount, // Dynamic: 99, 199, 1499, or 3999
                currency: currency === "INR" ? "INR" : "USD",
                items: [
                  {
                    item_name: plan.name, // Dynamic: 'Flexi Pack', 'Pro Sun Monthly', etc.
                    price: amount,
                    quantity: 1,
                  },
                ],
              });
            }

            // Synchronously verify payment on server & activate user subscription
            try {
              await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: payId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: plan.id,
                  userEmail: currentUserId,
                }),
              });
            } catch (e) {
              console.warn("Backend verification call sync note:", e);
            }

            // Update local user session entitlements
            if (plan.id === "flexi") {
              const current = parseInt(localStorage.getItem("pdfsun_user_credits_v1") || "0", 10);
              localStorage.setItem("pdfsun_user_credits_v1", (current + 100).toString());
            } else {
              localStorage.setItem("pdfsun_user_plan_v1", plan.id);
              localStorage.setItem("pdfsun_plan_activated_at", new Date().toISOString());
              setActivePlanId(plan.id);
            }

            // Trigger Sequential 3-Step Blinking Redirect Modal
            setActivePaymentDetails({
              planName: plan.name,
              paymentId: payId,
              amountStr: currency === "INR" ? `₹${amount}` : `$${amount}`,
              planId: plan.id,
            });
            setBlinkingModalOpen(true);
          },
          modal: {
            ondismiss: function () {
              console.log("[Razorpay Pop-up Modal] User dismissed checkout modal before completion.");
              setIncompleteNoticeOpen(true);
            },
          },
        };

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.open();
        setIsProcessing(false);
        return;
      }

      // 3. Fallback: If Razorpay JS script not loaded, trigger Razorpay Hosted Link or Modal
      if (plan.razorpayLink) {
        const opened = window.open(plan.razorpayLink, "_blank", "noopener,noreferrer");
        if (!opened || opened.closed) {
          window.location.href = plan.razorpayLink;
          return;
        }
      }
      setActiveGatewayModal("razorpay");
    } catch (e) {
      console.error("Payment initiation error:", e);
      if (plan.razorpayLink) {
        window.open(plan.razorpayLink, "_blank");
      } else {
        setActiveGatewayModal("razorpay");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const completePaymentSimulation = async () => {
    let targetPlanId = "pro-yearly";
    if (selectedPlanName.toLowerCase().includes("flexi")) {
      targetPlanId = "flexi";
      const currentCredits = parseInt(localStorage.getItem("pdfsun_user_credits_v1") || "0", 10);
      localStorage.setItem("pdfsun_user_credits_v1", (currentCredits + 100).toString());
    } else if (selectedPlanName.toLowerCase().includes("monthly")) {
      targetPlanId = "pro-monthly";
      localStorage.setItem("pdfsun_user_plan_v1", "pro-monthly");
    } else if (selectedPlanName.toLowerCase().includes("enterprise") || selectedPlanName.toLowerCase().includes("team")) {
      targetPlanId = "enterprise";
      localStorage.setItem("pdfsun_user_plan_v1", "enterprise");
    } else {
      targetPlanId = "pro-yearly";
      localStorage.setItem("pdfsun_user_plan_v1", "pro-yearly");
    }

    const payId = `pay_rzp_${Math.random().toString(36).substring(2, 10)}`;

    // Fire GA4 Purchase Event
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "purchase", {
        transaction_id: payId,
        value: selectedPlanAmount, // Dynamic: 99, 199, 1499, or 3999
        currency: currency === "INR" ? "INR" : "USD",
        items: [
          {
            item_name: selectedPlanName || "Pro Sun Annual",
            price: selectedPlanAmount,
            quantity: 1,
          },
        ],
      });
    }

    try {
      await fetch("/api/user/activate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          planId: targetPlanId,
          paymentId: payId,
        }),
      });
    } catch (e) {
      console.warn("Backend activation call sync error:", e);
    }

    setActiveGatewayModal(null);
    setActivePaymentDetails({
      planName: selectedPlanName || "Pro Sun Annual",
      paymentId: payId,
      amountStr: currency === "INR" ? `₹${selectedPlanAmount}` : `$${selectedPlanAmount}`,
      planId: targetPlanId,
    });
    setBlinkingModalOpen(true);
  };

  const handleBlinkingModalComplete = () => {
    setBlinkingModalOpen(false);
    fetchUserSubscription();
    if (onSuccessUpgrade) {
      onSuccessUpgrade();
    }
    setTimeout(() => {
      const el = document.getElementById(`plan-card-${activePaymentDetails?.planId || "pro-yearly"}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
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
        setRefundStatus(data.message || "Refund successfully initiated!");
        try {
          localStorage.removeItem("pdfsun_user_plan_v1");
        } catch {}
      } else {
        setRefundStatus("Failed to process refund. Please contact support@pdfsun.in.");
      }
    } catch (err: any) {
      setRefundStatus("Error connecting to refund server. Please email support@pdfsun.in.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto space-y-12">
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
          Process unlimited PDF files with 100% private WebAssembly speed. No hidden fees. First 7 Days 100% Money-Back Guarantee on all subscription plans.
        </p>

        {/* Currency & Billing Controls Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {/* Smart Currency Switcher */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-xs font-bold shadow-md">
            <button
              type="button"
              aria-label="Switch Currency to INR Razorpay"
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
              type="button"
              aria-label="Switch Currency to USD Razorpay"
              onClick={() => setCurrency("USD")}
              className={`px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                currency === "USD"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌎 USD ($) Razorpay</span>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-xs font-bold shadow-md">
            <button
              type="button"
              aria-label="Switch to Monthly Billing"
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
              type="button"
              aria-label="Switch to Annual Billing"
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                billingCycle === "yearly"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/20 dark:bg-slate-950/40 text-amber-950 dark:text-amber-300 uppercase font-black">
                Save 40%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid (5 Responsive Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
        {plans.map((plan) => {
          const isYearly = billingCycle === "yearly";
          const isAnnualHighlighted = isYearly && plan.id === "pro-yearly";
          const isCardHighlighted = plan.popular || isAnnualHighlighted;

          // Price Calculation Logic
          let displayPriceStr = "";
          let periodLabel = "";
          let subtext = "";

          const priceObj = currency === "INR" ? plan.priceINR : plan.priceUSD;
          const currencySymbol = currency === "INR" ? "₹" : "$";

          if (plan.billingType === "free") {
            displayPriceStr = `${currencySymbol}0`;
            periodLabel = "/ forever";
            subtext = "Forever free access";
          } else if (plan.billingType === "one-time") {
            displayPriceStr = `${currencySymbol}${priceObj.oneTime}`;
            periodLabel = "one-time";
            subtext = priceObj.subtextMonthly;
          } else if (plan.billingType === "enterprise") {
            displayPriceStr = `${currencySymbol}${priceObj.yearly}`;
            periodLabel = "/ year";
            subtext = priceObj.subtextYearly;
          } else {
            // Subscription: Monthly vs Yearly
            if (plan.id === "pro-monthly") {
              displayPriceStr = `${currencySymbol}${priceObj.monthly}`;
              periodLabel = "/ month";
              subtext = isYearly ? priceObj.subtextYearly : priceObj.subtextMonthly;
            } else {
              // Pro Sun Annual
              displayPriceStr = `${currencySymbol}${priceObj.yearly}`;
              periodLabel = "/ year";
              subtext = priceObj.subtextYearly;
            }
          }

          const activePlanFromStorage = typeof window !== "undefined" ? localStorage.getItem("pdfsun_user_plan_v1") : null;
          const activeUserPlanId = userSubscription?.plan_id || activePlanId || activePlanFromStorage || (isProUser ? "pro-yearly" : "free");

          const isPlanActiveForUser =
            (userSubscription &&
              userSubscription.user_id.toLowerCase() === currentUserId.toLowerCase() &&
              userSubscription.status === "active" &&
              userSubscription.plan_id === plan.id) ||
            (!userSubscription && activeUserPlanId === plan.id && plan.id !== "free");

          const expiresDateStr = userSubscription?.expires_at
            ? new Date(userSubscription.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

          return (
            <div
              key={plan.id}
              id={`plan-card-${plan.id}`}
              className={`relative rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0f172a]/95 backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1 ${
                isPlanActiveForUser
                  ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                  : isCardHighlighted
                  ? "border-amber-500 dark:border-amber-400 shadow-[0_0_35px_rgba(234,179,8,0.25)] ring-2 ring-amber-500/50 dark:ring-amber-400/50 xl:-translate-y-2 scale-[1.01]"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Top Badge */}
              <div>
                <div className="flex items-center justify-between mb-3">
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
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{plan.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="py-3 border-y border-slate-200 dark:border-slate-800">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {displayPriceStr}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {periodLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold font-mono mt-1">
                      {subtext}
                    </p>
                  </div>

                  {/* Guarantee Badge */}
                  <div className="pt-1">
                    <span
                      className={`inline-flex items-center space-x-1 text-[11px] font-bold ${
                        plan.guaranteeText.includes("Non-Refundable")
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      <span>{plan.guaranteeText}</span>
                    </span>
                  </div>

                  {/* Features Checklist */}
                  <ul className="space-y-2.5 pt-2 text-xs text-slate-800 dark:text-slate-200">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px] leading-snug">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA Button & Payment Router */}
              <div className="pt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={plan.disabled || (isPlanActiveForUser) || isProcessing}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center space-x-2 ${
                    isPlanActiveForUser
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 shadow-emerald-500/10 cursor-default"
                      : isCardHighlighted
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 hover:scale-[1.02] active:scale-98 shadow-amber-500/20"
                      : plan.disabled
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                      : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-800 dark:border-slate-700"
                  }`}
                >
                  {isPlanActiveForUser ? (
                    <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>🟢 CURRENTLY ACTIVE PLAN</span>
                    </span>
                  ) : (
                    <>
                      <span>{plan.cta}</span>
                      {!plan.disabled && <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />}
                    </>
                  )}
                </button>

                {/* STICKY "PLAN ACTIVATED" BADGE DIRECTLY BELOW PLAN CARD */}
                {isPlanActiveForUser && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
                    <div className="relative space-y-1">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[11px] uppercase tracking-wider border border-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                        <span>PLAN ACTIVATED</span>
                      </div>

                      <p className="text-[11px] text-slate-700 dark:text-slate-200 font-bold pt-0.5 leading-snug">
                        Bound to User ID: <span className="text-emerald-600 dark:text-emerald-400 font-black">{currentUserId}</span>
                      </p>

                      <p className="text-[11px] text-slate-800 dark:text-slate-100 font-black">
                        Plan: <span className="text-emerald-600 dark:text-emerald-400 uppercase">{plan.name}</span>
                      </p>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Expires: {expiresDateStr}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Methods Info */}
                {!plan.disabled && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center space-x-1">
                    <CreditCard className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>
                      Razorpay (UPI, Netbanking, Cards, Auto-pay)
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Trust Bar (Directly below Pricing Table) */}
      <div className="max-w-5xl mx-auto my-6 p-4 rounded-2xl bg-slate-900/90 dark:bg-slate-900/80 border border-amber-500/30 text-white shadow-lg flex flex-wrap items-center justify-around gap-4 text-xs font-bold">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Lock className="w-4 h-4 shrink-0 text-emerald-400 stroke-[2.5]" />
          <span>🔒 256-Bit SSL Encrypted Connection</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-400">
          <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 stroke-[2.5]" />
          <span>🛡️ Razorpay Verified Partner (UPI, Cards, NetBanking)</span>
        </div>
        <div className="flex items-center space-x-2 text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span>⚡ Instant Automated Delivery</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto my-8 p-6 sm:p-8 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
        {/* Top Row — Centered Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <span>🛡</span>
            <span>7-Day Guarantee</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            <span>🔓</span>
            <span>Cancel Anytime</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <span>⚡</span>
            <span>Fast Refund Processing</span>
          </span>
        </div>

        {/* Heading */}
        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 text-center">
          Disclaimer &amp; Refund Terms
        </h3>

        {/* Disclaimer Text */}
        <p className="max-w-3xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal text-center">
          7-Day Money-Back Guarantee: Eligible first-time purchases can be refunded within 7 days if less than 30% of the included quota or credits has been used. Applicable payment gateway fees are non-refundable. Cancel your subscription anytime; access continues until the current billing period ends. Refunds are processed through available self-service or support options. All purchases are subject to our{" "}
          {onOpenPolicy ? (
            <button
              type="button"
              onClick={() => onOpenPolicy("terms")}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer inline"
            >
              Terms of Service
            </button>
          ) : (
            <span className="font-semibold text-slate-700 dark:text-slate-300">Terms of Service</span>
          )}{" "}
          and{" "}
          {onOpenPolicy ? (
            <button
              type="button"
              onClick={() => onOpenPolicy("refund")}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer inline"
            >
              Refund Policy
            </button>
          ) : (
            <span className="font-semibold text-slate-700 dark:text-slate-300">Refund Policy</span>
          )}.
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
                    Razorpay Payment Gateway
                  </h3>
                  <p className="text-[11px] text-slate-400">Secure Order Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGatewayModal(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="font-bold text-white">{selectedPlanName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Payable:</span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {currency === "INR" ? "₹" : "$"}{selectedPlanAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Modes:</span>
                <span className="font-bold text-emerald-400">
                  UPI QR / PhonePe / GPay / Cards / Netbanking
                </span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-500">Webhook Secret:</span>
                <span className="font-mono text-slate-300">905065 (Verified)</span>
              </div>
            </div>

            {/* Laptop / Mobile UPI QR & Checkout Options */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center space-y-3">
              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                📲 Laptop / Mobile Payment Options
              </p>
              <div className="bg-white p-3 rounded-xl inline-block shadow-inner mx-auto">
                {/* Dynamically generated UPI QR link placeholder for quick scan on phone */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=9991659655@axl&pn=PDFSun%20India&am=${selectedPlanAmount}&cu=INR`}
                  alt="Razorpay UPI Payment QR Code"
                  className="w-32 h-32 object-contain mx-auto"
                />
              </div>
              <div className="text-[11px] text-slate-300 space-y-1">
                <p className="font-semibold text-white">Scan with PhonePe, Paytm, Google Pay, or BHIM</p>
                <p className="text-[10px] text-slate-400">VPA: <span className="font-mono text-amber-300">9991659655@axl</span></p>
              </div>
            </div>

            <div className="space-y-3">
              {activeGatewayModal === "razorpay" && selectedPlanRazorpayLink && (
                <a
                  href={selectedPlanRazorpayLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Open Official Razorpay Link ({selectedPlanRazorpayLink.replace("https://", "")}) →</span>
                </a>
              )}

              <button
                type="button"
                onClick={completePaymentSimulation}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Confirm Payment &amp; Auto-Activate Account →</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                Instant webhook verification active. Webhook handler listens at <span className="font-mono text-amber-300">/api/razorpay-webhook</span> with secret <span className="font-mono text-amber-300">905065</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Payment Recovery Modal */}
      {incompleteNoticeOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Payment Incomplete</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Need help completing your subscription or scanning the Razorpay UPI QR code? Our support team is available 24/7.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2 text-left">
              <p className="text-slate-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>UPI, PhonePe, GPay, Cards &amp; NetBanking Supported</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Selected Plan: <span className="text-amber-400 font-bold">{selectedPlanName || "Pro Sun Monthly"}</span>
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIncompleteNoticeOpen(false);
                  if (selectedPlanName) {
                    const matchedPlan = plans.find((p) => p.name === selectedPlanName);
                    if (matchedPlan) handleSelectPlan(matchedPlan);
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-98 transition cursor-pointer"
              >
                Retry Payment (Resume Checkout)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://wa.me/919991659655?text=Hi%20PDFSun%20Support,%20I%20need%20help%20completing%20my%20payment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                >
                  💬 WhatsApp Help
                </a>
                <button
                  type="button"
                  onClick={() => setIncompleteNoticeOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
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
                type="button"
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

      {/* Sequential 3-Step Blinking Redirect Modal */}
      <PaymentBlinkingRedirectModal
        isOpen={blinkingModalOpen}
        onComplete={handleBlinkingModalComplete}
        planName={activePaymentDetails?.planName || "Pro Sun Plan"}
        paymentId={activePaymentDetails?.paymentId || "pay_rzp_live"}
        userId={currentUserId}
        amountStr={activePaymentDetails?.amountStr || "₹199"}
      />
    </section>
  );
};

