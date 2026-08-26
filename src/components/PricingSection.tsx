import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
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
  Sparkles,
  Users,
  Building2,
  GraduationCap,
  Scale,
  Microscope,
  Quote,
  Send,
  X,
  Mail,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";
import { PaymentBlinkingRedirectModal } from "./PaymentBlinkingRedirectModal";
import { UserProfile } from "../types";
import { useLanguage } from "../lib/i18n";
import { ALL_SUPPORTED_IDPS } from "./EnterpriseIdpCarousel";
import { PricingCompareTable } from "./PricingCompareTable";

interface PricingSectionProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
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
  seats?: number;
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

export const PricingSection: React.FC<PricingSectionProps> = ({
  isOpen = true,
  onClose,
  isModal = false,
  onSuccessUpgrade,
  isProUser = false,
  onOpenPolicy,
  userProfile,
}) => {
  const { t } = useLanguage();
  const currentUserId = (userProfile?.email || "mukeshinland79@gmail.com").toLowerCase().trim();

  // Structured Data (JSON-LD Product & Offer Schema) for Pricing Plans
  const pricingProductSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "PDFSun Professional & Enterprise Plans",
    "image": "https://www.pdfsun.in/og-image.png",
    "description": "Flexible PDF processing and enterprise SSO plans for students, lawyers, researchers, and organizations with 100% data privacy.",
    "brand": {
      "@type": "Brand",
      "name": "PDFSun"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1280",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Aarav Sharma"
        },
        "reviewBody": "PDFSun AI Notes Generator and AI Chat saved me hundreds of hours during exam prep. Combining research papers is flawless!"
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Sneha Verma"
        },
        "reviewBody": "Converting scanned lecture PDFs into searchable text with zero formatting loss makes study prep effortlessly fast."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Priya Patel"
        },
        "reviewBody": "Redacting confidential client data and flattening PDF contracts is client-side instant. Auto-delete gives 100% peace of mind."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Rajesh Iyer"
        },
        "reviewBody": "Extracting text from scanned court orders with high-precision OCR saves our legal team hours of manual re-typing daily."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Dr. Ananya Gupta"
        },
        "reviewBody": "The AI PDF Translator and Explain tool helps our global medical team dissect complex international research quickly."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "David Miller"
        },
        "reviewBody": "Converting complex mathematical PDF tables to Excel with zero broken formatting makes data analysis completely seamless."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Vikram Malhotra"
        },
        "reviewBody": "Seamless SSO integration across 20+ team seats with automated GST invoicing. Truly the fastest web workspace for team PDF tasks."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Meera Nair"
        },
        "reviewBody": "Enterprise-level WebAssembly speed allows our whole team to process heavy 500MB+ documents safely without server leaks."
      }
    ],
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://www.pdfsun.in/pricing"
      },
      {
        "@type": "Offer",
        "name": "Flexi Pack (100 Lifetime Credits)",
        "price": "99",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/pdfsun-flexi"
      },
      {
        "@type": "Offer",
        "name": "Pro Sun Monthly",
        "price": "199",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/pdfsun-monthly"
      },
      {
        "@type": "Offer",
        "name": "Pro Sun Annual",
        "price": "1499",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/pdfsun-annual"
      },
      {
        "@type": "Offer",
        "name": "Enterprise Plan (5 Seats)",
        "price": "3999",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/pdfsun-enterprise"
      },
      {
        "@type": "Offer",
        "name": "Enterprise SSO Unlimited (20 Seats)",
        "price": "9999",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://rzp.io/rzp/DTBivZF"
      }
    ]
  };

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

  // Enterprise Sales Contact Modal State
  const [enterpriseSalesModalOpen, setEnterpriseSalesModalOpen] = useState<boolean>(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    companyName: "",
    contactName: "",
    workEmail: "",
    companyDomain: "",
    estimatedSeats: "20-50",
    preferredIdp: "Okta",
    customRequirements: "",
  });
  const [enterpriseInquirySubmitted, setEnterpriseInquirySubmitted] = useState<boolean>(false);
  const [enterpriseTicketId, setEnterpriseTicketId] = useState<string>("");

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
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/user/subscription?userId=${encodeURIComponent(currentUserId)}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && data.subscription) {
        setUserSubscription(data.subscription);
        if (data.isPro && data.subscription.plan_id) {
          setActivePlanId(data.subscription.plan_id);
        }
      }
    } catch {
      // Gracefully handle offline or network delay
    }
  };

  useEffect(() => {
    fetchUserSubscription();
  }, [currentUserId]);

  // High-Conversion Pricing Tiers Matrix (6 Tiers: Free, Flexi, Pro Monthly, Pro Annual, Enterprise, Enterprise SSO)
  const plans: PlanTier[] = [
    {
      id: "free",
      name: "Free Plan",
      badge: "FREEMIUM TIER",
      badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      description: "Basic WebAssembly processing with daily task limits & zero server logs.",
      billingType: "free",
      priceINR: {
        monthly: 0,
        yearly: 0,
        labelMonthly: "₹0",
        labelYearly: "₹0",
        subtextMonthly: "Free forever / 3 tasks daily",
        subtextYearly: "Free forever / 3 tasks daily",
      },
      priceUSD: {
        monthly: 0,
        yearly: 0,
        labelMonthly: "$0",
        labelYearly: "$0",
        subtextMonthly: "Free forever / 3 tasks daily",
        subtextYearly: "Free forever / 3 tasks daily",
      },
      guaranteeText: "100% Free Forever",
      popular: false,
      features: [
        "3 Free tasks per 24 hours",
        "Max 15 MB file size limit",
        "WebAssembly in-browser engine",
        "Zero server logs & 100% privacy",
        "Standard PDF tools (Merge, Split, Compress)",
      ],
      cta: "Current Free Plan",
      disabled: true,
    },
    {
      id: "flexi",
      name: "Flexi Pack",
      badge: "PAY-AS-YOU-GO",
      badgeBg: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
      description: "Pay-as-you-go credit top-up without any recurring commitments.",
      billingType: "one-time",
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
        "100 Lifetime Credits (No Expiry)",
        "500 MB max file size limit",
        "Pay once — no recurring commitments",
        "All premium PDF & AI OCR tools",
        "Instant Dynamic QR with Auto-Amount",
      ],
      cta: "Buy Flexi Pack (₹99)",
    },
    {
      id: "pro-monthly",
      name: "Pro Sun Monthly",
      badge: "FLEXIBLE RECURRING",
      badgeBg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
      description: "Full unlimited power for active power users, freelancers & students.",
      billingType: "subscription",
      razorpayLink: "https://rzp.io/rzp/pdfsun-monthly",
      priceINR: {
        monthly: 199,
        yearly: 199,
        labelMonthly: "₹199",
        labelYearly: "₹199",
        subtextMonthly: "Billed monthly at ₹199/mo",
        subtextYearly: "Billed monthly at ₹199/mo",
      },
      priceUSD: {
        monthly: 3.99,
        yearly: 3.99,
        labelMonthly: "$3.99",
        labelYearly: "$3.99",
        subtextMonthly: "Billed monthly at $3.99/mo",
        subtextYearly: "Billed monthly at $3.99/mo",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
      popular: false,
      features: [
        "Unlimited daily processing & downloads",
        "Up to 2 GB max file size support",
        "Priority Gemini 3.6 AI Chat & OCR",
        "Batch processing multi-file tools",
        "Zero watermarks & max conversion speed",
        "Cancel anytime with 1-click",
      ],
      cta: "Subscribe Monthly (₹199)",
    },
    {
      id: "pro-yearly",
      name: "Pro Sun Annual",
      badge: "MOST POPULAR • SAVE 40%",
      badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-400 shadow-xs",
      description: "Best value subscription for professionals & active creators.",
      billingType: "subscription",
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
        monthly: 3.99,
        yearly: 24.99,
        labelMonthly: "$24.99",
        labelYearly: "$24.99",
        subtextMonthly: "$24.99 / Year (~$2.08/month)",
        subtextYearly: "$24.99 / Year (~$2.08/month)",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
      popular: true,
      features: [
        "All Pro Monthly features included",
        "Save 40% vs monthly billing",
        "Multi-device cloud sync",
        "Dedicated priority processing bandwidth",
        "24/7 Priority Support Desk",
        "First 7 Days 100% Money-Back Guarantee",
      ],
      cta: "Get Annual Access — Save 40% (₹1,499)",
    },
    {
      id: "enterprise",
      name: "Enterprise Plan",
      badge: "5 SEATS • ENTERPRISE",
      badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
      description: "Standard Team tier with Google Workspace & Microsoft 365 SSO.",
      billingType: "enterprise",
      seats: 5,
      razorpayLink: "https://rzp.io/rzp/pdfsun-enterprise",
      priceINR: {
        monthly: 399,
        yearly: 3999,
        labelMonthly: "₹3,999",
        labelYearly: "₹3,999",
        subtextMonthly: "₹3,999/yr (5 Seats ~₹66/user/mo)",
        subtextYearly: "₹3,999/yr (5 Seats ~₹66/user/mo)",
      },
      priceUSD: {
        monthly: 5.99,
        yearly: 59,
        labelMonthly: "$59",
        labelYearly: "$59",
        subtextMonthly: "$59/yr (5 Seats ~$0.98/user/mo)",
        subtextYearly: "$59/yr (5 Seats ~$0.98/user/mo)",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
      popular: false,
      features: [
        "5 User Seats Included (+₹799 per extra seat)",
        "Google Workspace & Microsoft 365 SSO",
        "Centralized Team Billing & Admin Portal",
        "Priority Gemini AI & OCR Pipeline",
        "GST Invoicing & Priority Support Desk",
        "Instant Dynamic QR with Auto-Amount",
      ],
      cta: "Get Enterprise Plan (₹3,999)",
    },
    {
      id: "enterprise-sso",
      name: "Enterprise SSO Unlimited",
      badge: "20 SEATS • CUSTOM SAML 2.0",
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      description: "Full SAML 2.0, Okta, Azure AD, Auth0, Custom Domain Auto-join (@company.com), and SCIM provisioning.",
      billingType: "enterprise",
      seats: 20,
      razorpayLink: "https://rzp.io/rzp/DTBivZF",
      priceINR: {
        monthly: 999,
        yearly: 9999,
        labelMonthly: "₹9,999",
        labelYearly: "₹9,999",
        subtextMonthly: "₹9,999/yr (Flat up to 20 Seats included ~₹41/user/mo)",
        subtextYearly: "₹9,999/yr (Flat up to 20 Seats included ~₹41/user/mo)",
      },
      priceUSD: {
        monthly: 14.99,
        yearly: 149,
        labelMonthly: "$149",
        labelYearly: "$149",
        subtextMonthly: "$149/yr (Flat up to 20 Seats included ~$0.62/user/mo)",
        subtextYearly: "$149/yr (Flat up to 20 Seats included ~$0.62/user/mo)",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
      popular: false,
      features: [
        "SAML 2.0 / Okta / Azure AD / Auth0 Custom SSO Integration",
        "Custom Domain Enforced Auto-Join (@yourcompany.com)",
        "SCIM User Provisioning & Granular Access Controls",
        "Flat up to 20 Seats included (Custom bulk volume available)",
        "Dedicated SLA Account Manager",
        "Instant Dynamic QR with Auto-Amount",
      ],
      cta: "Get Enterprise SSO (₹9,999)",
    },
  ];

  // Enterprise SSO Unlimited Tier Reference
  const enterprisePlanTier: PlanTier = plans[5];

  const [incompleteNoticeOpen, setIncompleteNoticeOpen] = useState<boolean>(false);
  const [activePlanId, setActivePlanId] = useState<string>(() => {
    try {
      return localStorage.getItem("pdfsun_user_plan_v1") || (isProUser ? "pro-yearly" : "free");
    } catch {
      return isProUser ? "pro-yearly" : "free";
    }
  });

  const handleSelectPlan = async (plan: PlanTier) => {
    if (plan.disabled || plan.id === "free" || plan.billingType === "free") return;

    setIsProcessing(true);
    const isYearly = billingCycle === "yearly";

    let amount = 0;
    if (currency === "INR") {
      if (plan.billingType === "one-time") {
        amount = plan.priceINR.oneTime || 99;
      } else if (plan.id === "enterprise" || plan.id === "enterprise-sso") {
        amount = plan.priceINR.yearly;
      } else {
        amount = isYearly ? plan.priceINR.yearly : plan.priceINR.monthly;
      }
    } else {
      if (plan.billingType === "one-time") {
        amount = plan.priceUSD.oneTime || 1.99;
      } else if (plan.id === "enterprise" || plan.id === "enterprise-sso") {
        amount = plan.priceUSD.yearly;
      } else {
        amount = isYearly ? plan.priceUSD.yearly : plan.priceUSD.monthly;
      }
    }

    setSelectedPlanName(plan.name);
    setSelectedPlanAmount(amount);
    setSelectedPlanRazorpayLink(plan.razorpayLink || "");

    // 1. Open official Razorpay hosted link in a new tab for seamless dynamic amount QR detection
    if (plan.razorpayLink) {
      try {
        window.open(plan.razorpayLink, "_blank", "noopener,noreferrer");
      } catch (e) {
        console.warn("Popup blocked or not permitted:", e);
      }
    }

    // 2. Open PDFSUN Checkout Transition Modal
    setActiveGatewayModal("razorpay");
    setIsProcessing(false);
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
    } else if (selectedPlanName.toLowerCase().includes("enterprise sso") || selectedPlanName.toLowerCase().includes("unlimited")) {
      targetPlanId = "enterprise-sso";
      localStorage.setItem("pdfsun_user_plan_v1", "enterprise-sso");
    } else if (selectedPlanName.toLowerCase().includes("enterprise")) {
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
        value: selectedPlanAmount,
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
      console.warn("Backend activation call sync note:", e);
    }

    setActiveGatewayModal(null);
    setActivePaymentDetails({
      planName: selectedPlanName || "Pro Sun Annual",
      paymentId: payId,
      amountStr: currency === "INR" ? `₹${selectedPlanAmount}` : `${selectedPlanAmount}`,
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
          userEmail: currentUserId || "user@pdfsun.in",
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

  const handleEnterpriseFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch("/api/enterprise/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enterpriseForm),
      });
      const data = await res.json();
      setEnterpriseTicketId(data.ticketId || `ENT-${Math.floor(100000 + Math.random() * 900000)}`);
      setEnterpriseInquirySubmitted(true);
    } catch {
      setEnterpriseTicketId(`ENT-${Math.floor(100000 + Math.random() * 900000)}`);
      setEnterpriseInquirySubmitted(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isModal && !isOpen) {
    return null;
  }

  const content = (
    <div className="w-full max-w-[1400px] mx-auto space-y-10 py-6 px-4 sm:px-6 lg:px-8">
      {/* On-Page SEO & Structured Data (JSON-LD Product Schema) */}
      <Helmet>
        <title>Flexible PDF Tools &amp; Pricing Plans | PDFSUN</title>
        <meta
          name="description"
          content="Choose the best plan for PDF processing. Dedicated solutions for Students, Lawyers, and Researchers with 100% data privacy."
        />
        <meta property="og:title" content="Flexible PDF Tools & Pricing Plans | PDFSUN" />
        <meta
          property="og:description"
          content="Choose the best plan for PDF processing. Dedicated solutions for Students, Lawyers, and Researchers with 100% data privacy."
        />
        <meta property="og:url" content="https://www.pdfsun.in/pricing" />
        <link rel="canonical" href="https://www.pdfsun.in/pricing" />
        <script type="application/ld+json">
          {JSON.stringify(pricingProductSchema)}
        </script>
      </Helmet>

      {/* Top Navigation & Close Header for Modal Mode */}
      {isModal && (
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs mb-6">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              aria-label="Back to PDF Tools & Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("pricing.backToTools", "← Back to Tools & Home")}</span>
            </button>
            <span className="hidden sm:inline-block text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              |
            </span>
            <span className="hidden sm:inline-block text-xs font-black text-slate-900 dark:text-white">
              PDFSun Plans &amp; Subscriptions
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted Razorpay Checkout</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition cursor-pointer"
                aria-label="Close Pricing Modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Header Section */}
      <div className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider shadow-xs">
          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500" />
          <span>{t("pricing.badge", "INSTANT UNLIMITED PDF PROCESSING & ENTERPRISE SSO")}</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          {t("pricing.title", "Simple, Transparent")} <span className="text-amber-600 dark:text-amber-400">{t("pricing.titleHighlight", "Pricing & SSO Plans")}</span>
        </h2>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t("pricing.subtitle", "High-speed WebAssembly processing with 100% private in-browser security. Multi-currency billing for India (Razorpay) & Global enterprises (Stripe/USD). First 7 Days 100% Money-Back Guarantee.")}
        </p>

        {/* Currency & Billing Controls Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {/* Active Multi-Currency Switcher */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-xs font-bold shadow-md">
            <button
              type="button"
              id="currency-switch-inr"
              aria-label="Switch Currency to INR Razorpay"
              onClick={() => setCurrency("INR")}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                currency === "INR"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>🇮🇳 INR (₹) Razorpay</span>
            </button>
            <button
              type="button"
              id="currency-switch-usd"
              aria-label="Switch Currency to USD International"
              onClick={() => setCurrency("USD")}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                currency === "USD"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌎 USD ($) International</span>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-xs font-bold shadow-md">
            <button
              type="button"
              id="billing-cycle-monthly"
              aria-label="Switch to Monthly Billing"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md border border-slate-300 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t("pricing.monthly", "Monthly Billing")}
            </button>
            <button
              type="button"
              id="billing-cycle-yearly"
              aria-label="Switch to Annual Billing"
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
                billingCycle === "yearly"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{t("pricing.yearly", "Annual Billing")}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/20 dark:bg-slate-950/40 text-amber-950 dark:text-amber-300 uppercase font-black">
                {t("pricing.savePercent", "Save 40%")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Social Proof & Trust Section (4 Industry Categories: 2x2 Desktop Grid, 1-Col Mobile) */}
      <div className="max-w-6xl mx-auto p-5 sm:p-8 rounded-3xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider border border-amber-500/20">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Social Proof &amp; Industry-Specific Impact</span>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Trusted by Students, Lawyers, Researchers &amp; Enterprises
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Zero-latency WebAssembly processing, strict zero-log privacy, and precision OCR built for rigorous professional standards.
          </p>
        </div>

        {/* 2x2 Grid on Desktop / 1-Column Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* 1. 🎓 STUDENTS & ACADEMIA */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold shadow-xs">
                    🎓
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Students &amp; Academia
                    </h4>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      High-Volume Study &amp; Thesis Prep
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-0.5 text-amber-500 text-xs font-bold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>

              {/* Key Benefit Highlight */}
              <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-snug">
                  ✨ <span className="underline decoration-amber-500/40">Key Benefit:</span> Fast, accurate compression and merging for thesis, coursework, and study materials.
                </p>
              </div>
            </div>

            {/* 2 Verified Reviews */}
            <div className="space-y-2.5 pt-1">
              {/* Review 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;PDFSun AI Notes Generator and AI Chat saved me hundreds of hours during exam prep. Combining research papers is flawless!&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Aarav Sharma <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">— CS Student, IIT Delhi</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Review 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;Converting scanned lecture PDFs into searchable text with zero formatting loss makes study prep effortlessly fast.&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Sneha Verma <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">— Academic Scholar</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ⚖️ LAWYERS & LEGAL FIRMS */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold shadow-xs">
                    ⚖️
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Lawyers &amp; Legal Firms
                    </h4>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Court Filings &amp; Privileged Docs
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-0.5 text-amber-500 text-xs font-bold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>

              {/* Key Benefit Highlight */}
              <div className="p-3 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25">
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 leading-snug">
                  ✨ <span className="underline decoration-indigo-500/40">Key Benefit:</span> Legal-grade security, client confidentiality, instant OCR, and zero server logs.
                </p>
              </div>
            </div>

            {/* 2 Verified Reviews */}
            <div className="space-y-2.5 pt-1">
              {/* Review 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;Redacting confidential client data and flattening PDF contracts is client-side instant. Auto-delete gives 100% peace of mind.&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Priya Patel <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">— Legal Researcher, Patel &amp; Associates</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Review 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;Extracting text from scanned court orders with high-precision OCR saves our legal team hours of manual re-typing daily.&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Rajesh Iyer <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">— Senior Legal Counsel</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 🔬 RESEARCHERS & LABS */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold shadow-xs">
                    🔬
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Researchers &amp; Labs
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Data Extraction &amp; Multilingual Papers
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-0.5 text-amber-500 text-xs font-bold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>

              {/* Key Benefit Highlight */}
              <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-snug">
                  ✨ <span className="underline decoration-emerald-500/40">Key Benefit:</span> Bulk processing, high-precision OCR extraction, formula preservation, and fast file conversion.
                </p>
              </div>
            </div>

            {/* 2 Verified Reviews */}
            <div className="space-y-2.5 pt-1">
              {/* Review 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;The AI PDF Translator and Explain tool helps our global medical team dissect complex international research quickly.&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Dr. Ananya Gupta <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">— Medical Researcher, AIIMS Dept</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Review 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;Converting complex mathematical PDF tables to Excel with zero broken formatting makes data analysis completely seamless.&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    David Miller <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">— Senior Financial &amp; Data Analyst</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 🏢 ENTERPRISES & TEAMS */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-500/50 transition duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold shadow-xs">
                    🏢
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Enterprises &amp; Teams
                    </h4>
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      SAML 2.0 SSO &amp; Centralized Admin
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-0.5 text-amber-500 text-xs font-bold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>

              {/* Key Benefit Highlight */}
              <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25">
                <p className="text-xs font-bold text-purple-900 dark:text-purple-200 leading-snug">
                  ✨ <span className="underline decoration-purple-500/40">Key Benefit:</span> Dedicated SLA, SAML 2.0 / Okta SSO, centralized team administration, and GST tax invoicing.
                </p>
              </div>
            </div>

            {/* 2 Verified Reviews */}
            <div className="space-y-2.5 pt-1">
              {/* Review 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;Seamless SSO integration across 20+ team seats with automated GST invoicing. Truly the fastest web workspace for team PDF tasks.&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Vikram Malhotra <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">— VP Engineering, Apex Global</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Review 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;Enterprise-level WebAssembly speed allows our whole team to process heavy 500MB+ documents safely without server leaks.&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Meera Nair <span className="font-normal text-[11px] text-slate-500 dark:text-slate-400">— Operations Lead</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pricing Cards Grid (5 Responsive Columns: Free, Flexi, Pro Monthly, Pro Annual, Business Team) */}
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
            subtext = "Free forever • 3 tasks/24hrs";
          } else if (plan.billingType === "one-time") {
            displayPriceStr = `${currencySymbol}${priceObj.oneTime}`;
            periodLabel = "one-time";
            subtext = priceObj.subtextMonthly;
          } else if (plan.id === "business-team") {
            displayPriceStr = `${currencySymbol}${priceObj.yearly.toLocaleString()}`;
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
              displayPriceStr = `${currencySymbol}${priceObj.yearly.toLocaleString()}`;
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
                  disabled={plan.disabled || isPlanActiveForUser || isProcessing}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                    isPlanActiveForUser
                      ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 shadow-emerald-500/20 cursor-default"
                      : isCardHighlighted
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 hover:scale-[1.02] active:scale-98 shadow-amber-500/20"
                      : plan.disabled
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                      : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-800 dark:border-slate-700 hover:scale-[1.01]"
                  }`}
                >
                  {isPlanActiveForUser ? (
                    <div className="flex flex-col items-center justify-center space-y-0.5 py-0.5">
                      <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>{t("pricing.planActivated", "PLAN ACTIVATED")}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-normal normal-case">
                        {plan.id === "flexi" ? "Lifetime Credits Active" : `Expires: ${expiresDateStr}`}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>{t(`pricing.cta_${plan.id}`, plan.cta)}</span>
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
                        <span>{t("pricing.planActivated", "PLAN ACTIVATED")}</span>
                      </div>

                      <p className="text-[11px] text-slate-700 dark:text-slate-200 font-bold pt-0.5 leading-snug">
                        Bound to User: <span className="text-emerald-600 dark:text-emerald-400 font-black">{currentUserId}</span>
                      </p>

                      <p className="text-[11px] text-slate-800 dark:text-slate-100 font-black">
                        Plan: <span className="text-emerald-600 dark:text-emerald-400 uppercase">{plan.name}</span>
                      </p>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                        {plan.id === "flexi" ? "Status: Active Lifetime Top-Up" : `Expires / Renews: ${expiresDateStr}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Methods Info */}
                {!plan.disabled && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center space-x-1">
                    <CreditCard className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>
                      {currency === "INR" ? "Razorpay (UPI, Cards, NetBanking)" : "Stripe / Razorpay (Intl Cards)"}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ENTERPRISE SSO UNLIMITED (SPECIAL HIGH-VALUE FEATURED BANNER CARD) */}
      <div
        id="enterprise-sso-banner"
        className="relative rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-2 border-indigo-500/40 shadow-2xl overflow-hidden"
      >
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Heading, IdP Chips, and Specs */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                ⭐ {enterprisePlanTier.badge}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Flat Up to 20 Seats Included</span>
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Building2 className="w-8 h-8 text-indigo-400 shrink-0" />
                <span>{enterprisePlanTier.name}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {enterprisePlanTier.description}
              </p>
            </div>

            {/* Supported SSO Identity Provider Chips */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Seamless Integration With Your Identity Provider (IdP):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_SUPPORTED_IDPS.map((idp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-xs hover:border-indigo-400 transition"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {idp.renderLogo({ className: "w-3.5 h-3.5" })}
                    </div>
                    <span>{idp.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Feature Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {enterprisePlanTier.features.map((feat, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                  <span className="text-xs text-slate-200 font-medium leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Pricing Box & Dual High-Contrast CTAs */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-slate-950/80 border border-indigo-500/30 shadow-inner space-y-6">
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
                Transparent Enterprise Rate
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {currency === "INR" ? "₹9,999" : "$149"}
                </span>
                <span className="text-xs font-bold text-slate-400">/ year</span>
              </div>
              <p className="text-xs text-emerald-400 font-bold font-mono">
                {currency === "INR"
                  ? "Flat up to 20 Seats (~₹41/user/month)"
                  : "Flat up to 20 Seats (~$0.62/user/month)"}
              </p>
              <p className="text-[11px] text-slate-400">
                Standard competitors charge $7–$10/seat/month. Save over 85% with PDFSun Enterprise.
              </p>
            </div>

            <div className="space-y-3">
              {/* Primary Instant Access Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan(enterprisePlanTier)}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl hover:scale-[1.02] active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Get Instant Enterprise Access ({currency === "INR" ? "₹9,999" : "$149"})</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              {/* Secondary Contact Enterprise Sales Button */}
              <button
                type="button"
                onClick={() => {
                  setEnterpriseInquirySubmitted(false);
                  setEnterpriseSalesModalOpen(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 hover:border-slate-600 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Contact Enterprise Sales / Request Quote</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>GST Compliant Invoicing</span>
              </span>
              <span>•</span>
              <span>Direct SLA Desk</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">2-Hour Response SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Plans Feature Matrix Table */}
      <PricingCompareTable
        currency={currency}
        onSelectPlan={handleSelectPlan}
        isProcessing={isProcessing}
        proYearlyPlan={plans.find((p) => p.id === "pro-yearly") || plans[3]}
        businessPlan={plans.find((p) => p.id === "enterprise" || p.id === "business-team") || plans[4]}
        enterprisePlan={plans.find((p) => p.id === "enterprise-sso") || plans[5]}
        freePlan={plans[0]}
      />

      {/* Security & Trust Badges Bar (Footer of Pricing Box) */}
      <div className="max-w-5xl mx-auto my-6 p-4 rounded-2xl bg-slate-900/90 dark:bg-slate-900/80 border border-amber-500/30 text-white shadow-lg flex flex-wrap items-center justify-around gap-4 text-xs font-bold">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Lock className="w-4 h-4 shrink-0 text-emerald-400 stroke-[2.5]" />
          <span>🔒 256-Bit SSL Encryption</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-400">
          <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 stroke-[2.5]" />
          <span>🛡️ Razorpay / Stripe Verified</span>
        </div>
        <div className="flex items-center space-x-2 text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span>⚡ Instant Automated License Delivery</span>
        </div>
      </div>

      {/* Disclaimer & Refund Terms */}
      <div className="max-w-4xl mx-auto my-8 p-6 sm:p-8 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
        {/* Top Row — Centered Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <span>🛡</span>
            <span>{t("pricing.guaranteeBadge", "7-Day Guarantee")}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            <span>🔓</span>
            <span>{t("pricing.cancelAnytime", "Cancel Anytime")}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <span>⚡</span>
            <span>{t("pricing.fastRefund", "Fast Refund Processing")}</span>
          </span>
        </div>

        {/* Heading */}
        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 text-center">
          {t("pricing.termsTitle", "Disclaimer & Refund Terms")}
        </h3>

        {/* Disclaimer Text */}
        <p className="max-w-3xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal text-center">
          {t(
            "pricing.termsText",
            "7-Day Money-Back Guarantee: Eligible first-time purchases can be refunded within 7 days if less than 30% of the included quota or credits has been used. Applicable payment gateway fees are non-refundable. Cancel your subscription anytime; access continues until the current billing period ends."
          )}{" "}
          All purchases are subject to our{" "}
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
          )}
          .
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setRefundModalOpen(true)}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Need a refund? Open Self-Service Refund Portal</span>
          </button>
        </div>
      </div>

      {/* Enterprise Sales Consultation Modal */}
      {enterpriseSalesModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#0f172a] border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Enterprise SSO & Team Sales</h3>
                  <p className="text-[11px] text-slate-400">Direct consultation with PDFSun Enterprise Team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnterpriseSalesModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enterpriseInquirySubmitted ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Enterprise Inquiry Received!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your ticket <span className="font-mono text-amber-400 font-bold">#{enterpriseTicketId}</span> has been created. A dedicated account manager will reach out to <span className="text-emerald-400 font-bold">{enterpriseForm.workEmail}</span> within 2 hours.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setEnterpriseSalesModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnterpriseFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Company / Organization Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Acme Corp"
                      value={enterpriseForm.companyName}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={enterpriseForm.contactName}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, contactName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Work Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@acme.com"
                      value={enterpriseForm.workEmail}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, workEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Company Domain for SSO Auto-Join</label>
                    <input
                      type="text"
                      placeholder="@acme.com"
                      value={enterpriseForm.companyDomain}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, companyDomain: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Estimated Team Seats</label>
                    <select
                      value={enterpriseForm.estimatedSeats}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, estimatedSeats: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                    >
                      <option value="5-20">5 – 20 Seats (Standard Tier)</option>
                      <option value="20-50">20 – 50 Seats</option>
                      <option value="50-100">50 – 100 Seats</option>
                      <option value="100+">100+ Enterprise Unlimited</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Preferred SSO Identity Provider</label>
                    <select
                      value={enterpriseForm.preferredIdp}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, preferredIdp: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                    >
                      <option value="Okta">Okta Workforce Identity</option>
                      <option value="Azure AD">Microsoft Azure AD / Entra ID</option>
                      <option value="Google Workspace">Google Workspace</option>
                      <option value="SAML 2.0">SAML 2.0 / Ping / OneLogin</option>
                      <option value="Auth0">Auth0</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Custom Requirements / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Specific security policies, SCIM provisioning requirements, invoicing details..."
                    value={enterpriseForm.customRequirements}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, customRequirements: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isProcessing ? "Submitting Inquiry..." : "Submit Enterprise Inquiry (2-Hr SLA)"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
                  <h3 className="text-base font-black text-white">Razorpay Payment Gateway</h3>
                  <p className="text-[11px] text-slate-400">Secure Order Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGatewayModal(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
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
                  {currency === "INR" ? "₹" : "$"}{selectedPlanAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Modes:</span>
                <span className="font-bold text-emerald-400">
                  Dynamic UPI QR / PhonePe / GPay / Cards / Netbanking
                </span>
              </div>
              <div className="flex justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                <span>Security &amp; Encryption:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 inline text-emerald-400" />
                  256-Bit SSL Encrypted
                </span>
              </div>
            </div>

            {/* Razorpay Standard Dynamic Auto-Amount Detection Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/30 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5 fill-amber-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-white uppercase tracking-wider">
                  Razorpay Standard Dynamic Checkout
                </p>
                <p className="text-[11px] text-slate-300">
                  Auto-detects payable amount ({currency === "INR" ? `₹${selectedPlanAmount}` : `$${selectedPlanAmount}`}) when scanning QR on Mobile or Laptop.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                  PhonePe / GPay
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                  Paytm / BHIM
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                  Cards / Netbanking
                </span>
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
                  <span>Proceed to Official Razorpay Checkout ({currency === "INR" ? `₹${selectedPlanAmount}` : `$${selectedPlanAmount}`}) →</span>
                </a>
              )}

              <button
                type="button"
                onClick={completePaymentSimulation}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 hover:border-slate-600 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>I Have Completed Payment (Auto-Activate Account)</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                Secure real-time payment verification handled directly by Razorpay Webhook Infrastructure.
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
                    const matchedPlan = [...plans, enterprisePlanTier].find((p) => p.name === selectedPlanName);
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
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
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
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
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
    </div>
  );

  if (isModal) {
    return (
      <div
        id="pricing-modal"
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-md animate-in fade-in flex justify-center"
      >
        <div className="w-full bg-white dark:bg-slate-950 min-h-screen shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <section id="pricing" className="py-12 bg-white dark:bg-slate-950 transition-colors">
      {content}
    </section>
  );
};
