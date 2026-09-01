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
  Send,
  X,
  Mail,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  Cpu,
  Clock,
  Heart,
} from "lucide-react";
import { PaymentBlinkingRedirectModal } from "./PaymentBlinkingRedirectModal";
import { UserProfile } from "../types";
import { useLanguage } from "../lib/i18n";
import { ALL_SUPPORTED_IDPS } from "./EnterpriseIdpCarousel";
import { PricingCompareTable } from "./PricingCompareTable";
import { DynamicPaymentQR } from "./DynamicPaymentQR";
import { PDFSUN_PAYMENT_PRODUCTS, PaymentProduct } from "../config/paymentProducts";
import { PDFSunLogo } from "./PDFSunLogo";

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
  const currentUserId = userProfile?.email ? userProfile.email.toLowerCase().trim() : "";

  // Privacy-safe obfuscated account label for UI display
  const displayBoundAccount = userProfile?.email
    ? userProfile.email.includes("mukesh") || !userProfile.email.includes("@")
      ? "Pdfsun.in Account"
      : (() => {
          const [namePart, domain] = userProfile.email.split("@");
          const maskedName =
            namePart.length > 2
              ? `${namePart[0]}***${namePart[namePart.length - 1]}`
              : `${namePart[0]}***`;
          return `Pdfsun.in User (${maskedName}@${domain})`;
        })()
    : "Pdfsun.in Account";

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
    "offers": [
      {
        "@type": "Offer",
        "name": "Flexi Pack",
        "price": "99",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://www.pdfsun.in/pricing"
      },
      {
        "@type": "Offer",
        "name": "Pro Sun Monthly",
        "price": "199",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://www.pdfsun.in/pricing"
      },
      {
        "@type": "Offer",
        "name": "Pro Sun Annual",
        "price": "1499",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://www.pdfsun.in/pricing"
      },
      {
        "@type": "Offer",
        "name": "Enterprise Plan",
        "price": "3999",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://www.pdfsun.in/pricing"
      },
      {
        "@type": "Offer",
        "name": "Enterprise SSO Unlimited",
        "price": "9999",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": "https://www.pdfsun.in/pricing"
      }
    ]
  };

  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundTxId, setRefundTxId] = useState("");
  const [refundStatus, setRefundStatus] = useState<string | null>(null);

  // Active Real-Time Subscriptions fetched from server
  const [userSubscription, setUserSubscription] = useState<{
    status: string;
    plan_id: string;
    user_id: string;
    expires_at?: string;
  } | null>(null);

  // Enterprise Sales Consultation Modal State
  const [enterpriseSalesModalOpen, setEnterpriseSalesModalOpen] = useState(false);
  const [enterpriseInquirySubmitted, setEnterpriseInquirySubmitted] = useState(false);
  const [enterpriseTicketId, setEnterpriseTicketId] = useState("");
  const [enterpriseForm, setEnterpriseForm] = useState({
    companyName: "",
    contactName: "",
    workEmail: currentUserId || "",
    estimatedSeats: "5-20",
    preferredIdp: "Okta",
    companyDomain: "",
    customRequirements: "",
  });

  // Dynamic Gateway Modal state
  const [activeGatewayModal, setActiveGatewayModal] = useState<"razorpay" | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>("");
  const [selectedPlanAmount, setSelectedPlanAmount] = useState<number>(1499);
  const [, setSelectedPlanRazorpayLink] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<PaymentProduct | null>(null);

  // Blinking 3-Step Redirect Modal State
  const [blinkingModalOpen, setBlinkingModalOpen] = useState(false);
  const [activePaymentDetails, setActivePaymentDetails] = useState<{
    planName: string;
    paymentId: string;
    amountStr: string;
    planId: string;
  } | null>(null);

  // FAQ Accordion State
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0, 1]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Fetch real-time active user subscription status from backend
  const fetchUserSubscription = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/user/subscription?userId=${encodeURIComponent(currentUserId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.active && data.subscription) {
          setUserSubscription(data.subscription);
          if (data.subscription.plan_id) {
            setActivePlanId(data.subscription.plan_id);
          }
        }
      }
    } catch {
      // Graceful fallback to cached state
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserSubscription();
    }
  }, [isOpen, currentUserId]);

  // Main 5 Plans List
  const plans: PlanTier[] = [
    {
      id: "free",
      name: "Free Forever",
      badge: "FREE TIER",
      badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      description: "Basic daily PDF tools with zero installation.",
      billingType: "free",
      priceINR: {
        monthly: 0,
        yearly: 0,
        labelMonthly: "₹0",
        labelYearly: "₹0",
        subtextMonthly: "Free forever • No credit card required",
        subtextYearly: "Free forever • No credit card required",
      },
      priceUSD: {
        monthly: 0,
        yearly: 0,
        labelMonthly: "$0",
        labelYearly: "$0",
        subtextMonthly: "Free forever • No credit card required",
        subtextYearly: "Free forever • No credit card required",
      },
      guaranteeText: "Free Forever",
      popular: false,
      features: [
        "3 PDF operations per 24 hours",
        "Up to 15 MB single file size",
        "Standard WebAssembly engine",
        "100% In-Browser Privacy",
        "Basic Gemini AI Chat (5 queries/day)",
      ],
      cta: "Current Free Tier",
      disabled: true,
    },
    {
      id: "flexi",
      name: "Flexi Pack",
      badge: "TOP-UP • ONE-TIME",
      badgeBg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
      description: "Pay once for on-demand high-volume tasks. No recurring auto-debit.",
      billingType: "one-time",
      paymentLinkId: "pdfsun-flexi",
      razorpayLink: "https://rzp.io/rzp/pdfsun-flexi",
      priceINR: {
        monthly: 99,
        yearly: 99,
        oneTime: 99,
        labelMonthly: "₹99",
        labelYearly: "₹99",
        subtextMonthly: "₹99 One-Time • 100 Lifetime Operations",
        subtextYearly: "₹99 One-Time • 100 Lifetime Operations",
      },
      priceUSD: {
        monthly: 1.99,
        yearly: 1.99,
        oneTime: 1.99,
        labelMonthly: "$1.99",
        labelYearly: "$1.99",
        subtextMonthly: "$1.99 One-Time • 100 Lifetime Operations",
        subtextYearly: "$1.99 One-Time • 100 Lifetime Operations",
      },
      guaranteeText: "Non-Refundable Top-Up",
      popular: false,
      features: [
        "100 High-Speed PDF Operations",
        "Credits Never Expire (Lifetime validity)",
        "Up to 200 MB per file",
        "Priority WebAssembly Engine",
        "No subscription or recurring charges",
        "Instant Dynamic QR with Auto-Amount",
      ],
      cta: "Get Flexi Pack (₹99)",
    },
    {
      id: "pro-monthly",
      name: "Pro Sun Monthly",
      badge: "MOST POPULAR",
      badgeBg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
      description: "For professionals needing unlimited PDF processing and AI features.",
      billingType: "subscription",
      paymentLinkId: "pdfsun-monthly",
      razorpayLink: "https://rzp.io/rzp/pdfsun-monthly",
      priceINR: {
        monthly: 199,
        yearly: 199,
        labelMonthly: "₹199",
        labelYearly: "₹199",
        subtextMonthly: "₹199/month (Billed monthly • Cancel anytime)",
        subtextYearly: "₹199/month (Billed monthly • Cancel anytime)",
      },
      priceUSD: {
        monthly: 2.99,
        yearly: 2.99,
        labelMonthly: "$2.99",
        labelYearly: "$2.99",
        subtextMonthly: "$2.99/month (Billed monthly • Cancel anytime)",
        subtextYearly: "$2.99/month (Billed monthly • Cancel anytime)",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
      popular: true,
      features: [
        "Unlimited PDF Conversions & Edits",
        "Unlimited File Size (up to 2 GB per file)",
        "Batch Processing up to 50 files",
        "Gemini 3.6 Flash Document AI & OCR",
        "No Watermarks & Zero Advertisements",
        "Instant Dynamic QR with Auto-Amount",
      ],
      cta: "Start Pro Monthly (₹199/mo)",
    },
    {
      id: "pro-yearly",
      name: "Pro Sun Annual",
      badge: "BEST VALUE • SAVE 40%",
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      description: "Maximum savings with dedicated high-throughput processing for power users.",
      billingType: "subscription",
      paymentLinkId: "pdfsun-annual",
      razorpayLink: "https://rzp.io/rzp/pdfsun-annual",
      priceINR: {
        monthly: 125,
        yearly: 1499,
        labelMonthly: "₹1,499",
        labelYearly: "₹1,499",
        subtextMonthly: "₹1,499/year (~₹125/month • Save 40%)",
        subtextYearly: "₹1,499/year (~₹125/month • Save 40%)",
      },
      priceUSD: {
        monthly: 1.99,
        yearly: 24,
        labelMonthly: "$24",
        labelYearly: "$24",
        subtextMonthly: "$24/year (~$2.00/month • Save 35%)",
        subtextYearly: "$24/year (~$2.00/month • Save 35%)",
      },
      guaranteeText: "First 7 Days 100% Money-Back Guarantee",
      popular: false,
      features: [
        "Everything in Pro Sun Monthly",
        "Full 1-Year Unrestricted Access",
        "Save 40% compared to monthly plan",
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
  ];

  // Dedicated Enterprise SSO Unlimited Tier (Featured in High-Value Banner)
  const enterprisePlanTier: PlanTier = {
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
  };

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

    // Resolve accurate central product config
    const matchedProduct = PDFSUN_PAYMENT_PRODUCTS[plan.id] || PDFSUN_PAYMENT_PRODUCTS["pro-monthly"];
    setSelectedProduct(matchedProduct);

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
    setSelectedPlanRazorpayLink(matchedProduct.razorpayPaymentLink || plan.razorpayLink || "");

    // Open Real Dynamic QR Checkout Modal
    setActiveGatewayModal("razorpay");
    setIsProcessing(false);
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
    } catch {
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

  // Frequently Asked Questions items
  const pricingFaqs = [
    {
      q: "How does the 7-Day Money-Back Guarantee work?",
      a: "If you are not completely satisfied with PDFSun Pro within the first 7 days of purchase and have used less than 30% of standard fair-use quotas, you can initiate an instant full refund through our 1-Click Self-Service Refund portal or by emailing support@pdfsun.in.",
    },
    {
      q: "Can I cancel my monthly or annual subscription anytime?",
      a: "Yes. You can cancel your subscription at any time with a single click from your account dashboard. You will retain full Pro benefits until the end of your prepaid billing period with zero cancellation penalties.",
    },
    {
      q: "What payment methods are supported in India and globally?",
      a: "In India, we support UPI (Google Pay, PhonePe, Paytm, BHIM), RuPay/Visa/Mastercard debit and credit cards, and NetBanking via Razorpay. Internationally, we accept all major global credit/debit cards in USD via Razorpay International & Stripe with 256-bit SSL encryption.",
    },
    {
      q: "Do you provide GST-compliant invoices for business tax claims?",
      a: "Yes! All purchases in India generate instant GST-compliant tax invoices with your business name and GSTIN number sent directly to your registered billing email.",
    },
    {
      q: "How does Enterprise SAML 2.0 & SSO work?",
      a: "Our Enterprise tiers integrate natively with Okta, Microsoft Azure AD / Entra ID, Google Workspace, Auth0, and any standard SAML 2.0 IdP. We enforce automatic domain binding (@yourcompany.com) so all employees log in seamlessly without managing separate credentials.",
    },
    {
      q: "Is my document data safe and private?",
      a: "100% yes. All core PDF processing (compression, merging, conversion, editing) executes in-browser via secure WebAssembly. Files never touch secondary servers, and any transient AI OCR analyses are wiped immediately post-completion with strict zero-log enforcement.",
    },
  ];

  return (
    <div
      id="pricing-page-shell"
      className={`${
        isModal
          ? "fixed inset-0 z-[9999] overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          : "w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      } flex flex-col justify-between transition-colors`}
    >
      {/* On-Page SEO & Structured Data (JSON-LD Product Schema) */}
      <Helmet>
        <title>Flexible PDF Tools &amp; Pricing Plans | PDFSUN</title>
        <meta
          name="description"
          content="Choose the best plan for PDF processing. Dedicated solutions for Students, Lawyers, Researchers, and Organizations with 100% data privacy."
        />
        <meta property="og:title" content="Flexible PDF Tools & Pricing Plans | PDFSUN" />
        <meta
          property="og:description"
          content="Choose the best plan for PDF processing. Dedicated solutions for Students, Lawyers, Researchers, and Organizations with 100% data privacy."
        />
        <meta property="og:url" content="https://www.pdfsun.in/pricing" />
        <link rel="canonical" href="https://www.pdfsun.in/pricing" />
        <script type="application/ld+json">
          {JSON.stringify(pricingProductSchema)}
        </script>
      </Helmet>

      {/* CONTINUOUS BACKGROUND WRAPPER (TOP TO FOOTER) */}
      <div className="w-full flex-1 bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-100/90 dark:from-slate-950 dark:via-[#0b1120] dark:to-slate-950 transition-colors">
        
        {/* Top Navigation & Sticky Header for Modal Mode */}
        {isModal && (
          <div className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between shadow-xs">
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
              <div className="hidden sm:flex items-center space-x-2">
                <PDFSunLogo layout="horizontal" size="sm" theme="dark" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Plans &amp; Subscriptions
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  aria-label="Close Pricing Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* MAIN PRICING CONTENT CONTAINER */}
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 sm:space-y-16">
          
          {/* 1. HERO & PRICING HEADER */}
          <section id="pricing-hero" className="text-center space-y-5 pt-2">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider shadow-xs">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500" />
              <span>{t("pricing.badge", "INSTANT UNLIMITED PDF PROCESSING & ENTERPRISE SSO")}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("pricing.title", "Simple, Transparent")} <span className="text-amber-600 dark:text-amber-400">{t("pricing.titleHighlight", "Pricing & SSO Plans")}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              {t("pricing.subtitle", "High-speed WebAssembly processing with 100% private in-browser security. Multi-currency billing for India (Razorpay) & Global enterprises (Stripe/USD). First 7 Days 100% Money-Back Guarantee.")}
            </p>

            {/* Currency & Billing Controls Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
              {/* Currency Switcher */}
              <div className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs font-bold shadow-md">
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

              {/* Billing Cycle Switcher */}
              <div className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs font-bold shadow-md">
                <button
                  type="button"
                  id="billing-cycle-monthly"
                  aria-label="Switch to Monthly Billing"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                    billingCycle === "monthly"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-md border border-slate-300 dark:border-slate-700"
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
          </section>

          {/* 2. MAIN 5 PRICING PLANS GRID */}
          <section id="pricing-plans-grid" className="space-y-4">
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
                } else if (plan.id === "enterprise") {
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
                    className={`relative rounded-3xl p-5 sm:p-6 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1 ${
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
                              Bound to Account: <span className="text-emerald-600 dark:text-emerald-400 font-black">{displayBoundAccount}</span>
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
          </section>

          {/* 3. ENTERPRISE SSO UNLIMITED (FEATURED HIGH-VALUE BANNER CARD) */}
          <section id="enterprise-sso-banner">
            <div className="relative rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-2 border-indigo-500/40 shadow-2xl overflow-hidden">
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
          </section>

          {/* 4. WHY CHOOSE PDFSUN (VALUE PILLARS) */}
          <section id="why-choose-pdfsun" className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Enterprise Architecture &amp; Privacy Standards</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Why Industry Leaders Choose PDFSun
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Engineered from the ground up for high security, zero cloud data leaks, and lightning-fast client-side execution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">WebAssembly Speed</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Processes multi-gigabyte PDFs directly inside your browser memory with zero upload delays or bandwidth bottlenecks.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">100% In-Browser Privacy</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Files never get uploaded to third-party databases. Complete zero-log architecture guarantees confidential document protection.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Gemini 3.6 Flash AI</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Instant contract summarization, financial table extraction, smart notes generation, and precision multilingual OCR.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Centralized SSO &amp; SCIM</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Connect Okta, Azure AD, or Google Workspace in under 5 minutes with automated team provisioning and GST tax invoicing.
                </p>
              </div>
            </div>
          </section>

          {/* 5. COMPARE PLANS FEATURE MATRIX TABLE */}
          <section id="compare-matrix">
            <PricingCompareTable
              currency={currency}
              onSelectPlan={handleSelectPlan}
              isProcessing={isProcessing}
              proYearlyPlan={plans.find((p) => p.id === "pro-yearly") || plans[3]}
              businessPlan={plans.find((p) => p.id === "enterprise") || plans[4]}
              enterprisePlan={enterprisePlanTier}
              freePlan={plans[0]}
            />
          </section>

          {/* 6. SOCIAL PROOF & AUDIENCE REVIEWS (4 CATEGORIES) */}
          <section id="social-proof" className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Verified Social Proof &amp; Real Impact</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Trusted by Students, Lawyers, Researchers &amp; Enterprises
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Zero-latency WebAssembly processing, strict zero-log privacy, and precision OCR built for rigorous professional standards.
              </p>
            </div>

            {/* 2x2 Desktop Grid / 1-Col Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* 1. 🎓 STUDENTS & ACADEMIA */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition duration-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
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

                  <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-snug">
                      ✨ <span className="underline decoration-amber-500/40">Key Benefit:</span> Fast, accurate compression and merging for thesis, coursework, and study materials.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
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

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
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
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition duration-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
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

                  <div className="p-3 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25">
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 leading-snug">
                      ✨ <span className="underline decoration-indigo-500/40">Key Benefit:</span> Legal-grade security, client confidentiality, instant OCR, and zero server logs.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
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

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
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
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition duration-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
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

                  <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-snug">
                      ✨ <span className="underline decoration-emerald-500/40">Key Benefit:</span> Bulk processing, high-precision OCR extraction, formula preservation, and fast conversion.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
                    <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      &ldquo;The AI PDF Translator and Explain tool helps our global team dissect complex international research quickly.&rdquo;
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

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
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
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-500/50 transition duration-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold">
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

                  <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25">
                    <p className="text-xs font-bold text-purple-900 dark:text-purple-200 leading-snug">
                      ✨ <span className="underline decoration-purple-500/40">Key Benefit:</span> Dedicated SLA, SAML 2.0 / Okta SSO, centralized administration, and GST tax invoicing.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
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

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-2 text-xs">
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
          </section>

          {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) */}
          <section id="pricing-faq" className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[11px] font-black uppercase tracking-wider border border-blue-500/20">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Everything You Need to Know</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Frequently Asked Questions
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Clear answers regarding billing, refund policies, subscriptions, and enterprise SSO integrations.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-3 pt-2">
              {pricingFaqs.map((faq, idx) => {
                const isOpen = openFaqIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between space-x-3 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900 transition"
                    >
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {faq.q}
                      </span>
                      <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 8. SECURITY & PAYMENT TRUST BADGES BAR */}
          <section id="security-trust-bar">
            <div className="max-w-5xl mx-auto p-4 sm:p-5 rounded-2xl bg-slate-900/95 text-white border border-amber-500/30 shadow-xl flex flex-wrap items-center justify-around gap-4 text-xs font-bold">
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
              <div className="flex items-center space-x-2 text-purple-300">
                <FileText className="w-4 h-4 shrink-0 text-purple-300 stroke-[2.5]" />
                <span>🧾 GST Tax Compliant Invoicing</span>
              </div>
            </div>
          </section>

          {/* 9. DISCLAIMER & REFUND TERMS SECTION */}
          <section id="disclaimer-refund-terms">
            <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center shadow-lg flex flex-col items-center justify-center space-y-4">
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <span>🛡️</span>
                  <span>{t("pricing.guaranteeBadge", "7-Day 100% Guarantee")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  <span>🔓</span>
                  <span>{t("pricing.cancelAnytime", "Cancel Anytime")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <span>⚡</span>
                  <span>{t("pricing.fastRefund", "1-Click Instant Refund Portal")}</span>
                </span>
              </div>

              {/* Title */}
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
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Need a refund? Open Self-Service Refund Portal</span>
                </button>
              </div>
            </div>
          </section>

          {/* 10. INTEGRATED PRICING FOOTER & LEGAL TRANSITION */}
          <footer className="w-full pt-10 pb-28 sm:pb-16 border-t border-slate-200/80 dark:border-slate-800/80 transition-colors">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center space-x-3">
                  <PDFSunLogo layout="horizontal" size="md" theme="dark" showTagline />
                </div>

                {/* Legal & Policy Quick Navigation */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => onOpenPolicy && onOpenPolicy("privacy")}
                    className="hover:text-amber-500 transition cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy && onOpenPolicy("terms")}
                    className="hover:text-amber-500 transition cursor-pointer"
                  >
                    Terms of Service
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy && onOpenPolicy("refund")}
                    className="hover:text-amber-500 transition cursor-pointer"
                  >
                    Refund Policy
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy && onOpenPolicy("cookie")}
                    className="hover:text-amber-500 transition cursor-pointer"
                  >
                    Cookie Policy
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy && onOpenPolicy("about")}
                    className="hover:text-amber-500 transition cursor-pointer"
                  >
                    About Us
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>support@pdfsun.in</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
                <p>© {new Date().getFullYear()} PDFSun.in. All rights reserved. 100% In-Browser Privacy &amp; Security.</p>
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Razorpay Certified Partner &amp; SSL Verified</span>
                </div>
              </div>
            </div>
          </footer>

        </div>
      </div>

      {/* Dynamic Payment QR & Real-Time Checkout Modal */}
      {activeGatewayModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="my-auto w-full max-w-lg">
            {selectedProduct ? (
              <DynamicPaymentQR
                product={selectedProduct}
                currency={currency}
                userEmail={currentUserId}
                onPaymentVerified={(data) => {
                  setActiveGatewayModal(null);
                  setActivePaymentDetails({
                    planName: data.planName || selectedProduct.productName,
                    paymentId: data.paymentId || `pay_rzp_${Date.now()}`,
                    amountStr: currency === "INR" ? `₹${selectedProduct.displayPriceINR}` : `$${selectedProduct.displayPriceUSD}`,
                    planId: selectedProduct.internalProductId,
                  });
                  setBlinkingModalOpen(true);
                }}
                onCancel={() => setActiveGatewayModal(null)}
              />
            ) : (
              <div className="bg-[#0f172a] border border-amber-400/50 rounded-3xl p-6 text-white text-center space-y-4">
                <p>Initializing secure checkout...</p>
                <button
                  onClick={() => setActiveGatewayModal(null)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                  <h3 className="text-base font-black text-white">Enterprise SSO &amp; Team Sales</h3>
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
};
