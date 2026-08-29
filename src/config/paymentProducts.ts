/**
 * ============================================================================
 * Official PDFSun.in Central Payment Product Catalog
 * ============================================================================
 * Defines official product metadata, pricing, credits, and verified payment links.
 *
 * RULES:
 * - Razorpay Plan IDs are ONLY used if verified in environment variables.
 * - Payment links are official Razorpay hosted checkout URLs.
 * - Display prices are catalog indicators only; actual paid amounts are verified server-side.
 */

export interface PaymentProduct {
  internalProductId: string;
  productName: string;
  type: "one-time" | "subscription" | "enterprise";
  displayPriceINR: number;
  displayPriceUSD: number;
  billingInterval?: "monthly" | "yearly" | "one-time";
  credits?: number; // One-time credits granted
  razorpayPaymentLink: string;
  razorpayPlanIdEnvVar?: string;
  seats?: number;
  badge: string;
  badgeBg: string;
  description: string;
  features: string[];
  ctaText: string;
  guaranteeText: string;
  popular?: boolean;
}

export const PDFSUN_PAYMENT_PRODUCTS: Record<string, PaymentProduct> = {
  flexi: {
    internalProductId: "flexi",
    productName: "Flexi Pack",
    type: "one-time",
    displayPriceINR: 99,
    displayPriceUSD: 1.99,
    billingInterval: "one-time",
    credits: 50,
    razorpayPaymentLink: "https://rzp.io/rzp/pdfsun-flexi",
    razorpayPlanIdEnvVar: "RAZORPAY_FLEXI_PLAN_ID",
    badge: "PAY-AS-YOU-GO",
    badgeBg: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
    description: "Pay-as-you-go credit top-up without any recurring commitments.",
    features: [
      "50 Lifetime Credits (No Expiry)",
      "500 MB max file size limit",
      "Pay once — no recurring commitments",
      "All premium PDF & AI OCR tools",
      "Dynamic QR payment with verified Razorpay checkout",
    ],
    ctaText: "Buy Flexi Pack (₹99)",
    guaranteeText: "Strictly Non-Refundable (Instant Credit Quota)",
    popular: false,
  },
  "pro-monthly": {
    internalProductId: "pro-monthly",
    productName: "Pro Sun Monthly",
    type: "subscription",
    displayPriceINR: 199,
    displayPriceUSD: 3.99,
    billingInterval: "monthly",
    razorpayPaymentLink: "https://rzp.io/rzp/pdfsun-monthly",
    razorpayPlanIdEnvVar: "RAZORPAY_PRO_MONTHLY_PLAN_ID",
    badge: "FLEXIBLE RECURRING",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    description: "Full unlimited power for active power users, freelancers & students.",
    features: [
      "Unlimited daily processing & downloads",
      "Up to 2 GB max file size support",
      "Priority Gemini AI Chat & OCR",
      "Batch processing multi-file tools",
      "Zero watermarks & max conversion speed",
      "Cancel anytime with 1-click",
    ],
    ctaText: "Subscribe Monthly (₹199)",
    guaranteeText: "First 7 Days 100% Money-Back Guarantee",
    popular: false,
  },
  "pro-yearly": {
    internalProductId: "pro-yearly",
    productName: "Pro Sun Annual",
    type: "subscription",
    displayPriceINR: 1499,
    displayPriceUSD: 24.99,
    billingInterval: "yearly",
    razorpayPaymentLink: "https://rzp.io/rzp/pdfsun-annual",
    razorpayPlanIdEnvVar: "RAZORPAY_PRO_YEARLY_PLAN_ID",
    badge: "MOST POPULAR • SAVE 40%",
    badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-400 shadow-xs",
    description: "Best value subscription for professionals & active creators.",
    features: [
      "All Pro Monthly features included",
      "Save 40% vs monthly billing",
      "Multi-device cloud sync",
      "Dedicated priority processing bandwidth",
      "24/7 Priority Support Desk",
      "First 7 Days 100% Money-Back Guarantee",
    ],
    ctaText: "Subscribe Annually (₹1,499)",
    guaranteeText: "First 7 Days 100% Money-Back Guarantee",
    popular: true,
  },
  enterprise: {
    internalProductId: "enterprise",
    productName: "Enterprise Plan",
    type: "subscription",
    displayPriceINR: 3999,
    displayPriceUSD: 59,
    billingInterval: "yearly",
    seats: 5,
    razorpayPaymentLink: "https://rzp.io/rzp/pdfsun-enterprise",
    razorpayPlanIdEnvVar: "RAZORPAY_ENTERPRISE_PLAN_ID",
    badge: "5 SEATS • ENTERPRISE",
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    description: "Standard Team tier with Google Workspace & Microsoft 365 SSO.",
    features: [
      "5 User Seats Included (+₹799 per extra seat)",
      "Google Workspace & Microsoft 365 SSO",
      "Centralized Team Billing & Admin Portal",
      "Priority Gemini AI & OCR Pipeline",
      "GST Invoicing & Priority Support Desk",
      "Dynamic QR code payment for desktop checkout",
    ],
    ctaText: "Subscribe Enterprise (₹3,999)",
    guaranteeText: "First 7 Days 100% Money-Back Guarantee",
    popular: false,
  },
  "enterprise-sso": {
    internalProductId: "enterprise-sso",
    productName: "Enterprise SSO Unlimited",
    type: "subscription",
    displayPriceINR: 9999,
    displayPriceUSD: 149,
    billingInterval: "yearly",
    seats: 20,
    razorpayPaymentLink: "https://rzp.io/rzp/DTBivZF",
    razorpayPlanIdEnvVar: "RAZORPAY_ENTERPRISE_SSO_PLAN_ID",
    badge: "20 SEATS • CUSTOM SAML 2.0",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    description: "Full SAML 2.0, Okta, Azure AD, Auth0, Custom Domain Auto-join (@company.com), and SCIM provisioning.",
    features: [
      "SAML 2.0 / Okta / Azure AD / Auth0 Custom SSO Integration",
      "Custom Domain Enforced Auto-Join (@yourcompany.com)",
      "SCIM User Provisioning & Granular Access Controls",
      "Flat up to 20 Seats included (Custom bulk volume available)",
      "Dedicated SLA Account Manager",
      "Dynamic QR code payment for desktop checkout",
    ],
    ctaText: "Subscribe Enterprise SSO (₹9,999)",
    guaranteeText: "First 7 Days 100% Money-Back Guarantee",
    popular: false,
  },
};
