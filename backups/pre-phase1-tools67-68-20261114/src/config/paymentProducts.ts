export interface PaymentProduct {
  id: string;
  name: string;
  productName?: string;
  internalProductId?: string;
  displayPriceINR: number;
  displayPriceUSD?: number;
  pricePaise: number;
  interval: "7_days" | "month" | "year" | string;
  billingInterval?: string;
  type?: string;
  credits?: number;
  razorpayPlanIdEnvVar?: string;
  durationDays?: number;
  seats?: number;
  badge: string;
  description: string;
  features: string[];
  razorpayPaymentLink: string;
}

export const PDFSUN_PAYMENT_PRODUCTS: Record<string, PaymentProduct> = {
  free: {
    id: "free",
    name: "Free Forever",
    displayPriceINR: 0,
    displayPriceUSD: 0,
    pricePaise: 0,
    interval: "month",
    badge: "FREE",
    description: "Basic PDF processing for personal tasks.",
    features: [
      "Access to basic PDF conversion & split tools",
      "Strict file size limit: 15 MB / document",
      "3 operations per day",
      "100% Client-side local processing",
    ],
    razorpayPaymentLink: "",
  },
  flexi: {
    id: "flexi",
    name: "Flex Pass",
    displayPriceINR: 99,
    displayPriceUSD: 1.99,
    pricePaise: 9900,
    interval: "7_days",
    durationDays: 7,
    badge: "7 DAYS PASS",
    description: "Pay-as-you-go access with zero auto-debit commitments.",
    features: [
      "Valid for 7 continuous days from activation",
      "Zero recurring debits / No surprise charges",
      "High file size limit (100 MB)",
      "Unlimited PDF conversion & merging",
    ],
    razorpayPaymentLink: "https://rzp.io/rzp/pdfsun-flexi",
  },
  "pro-monthly": {
    id: "pro-monthly",
    name: "Pro Sun Monthly",
    displayPriceINR: 199,
    displayPriceUSD: 2.99,
    pricePaise: 19900,
    interval: "month",
    badge: "POPULAR",
    description: "Full feature access, renewed monthly for power users.",
    features: [
      "Full feature access across all 66+ tools",
      "AI Document Copilot & OCR Image to Text",
      "High processing speeds & unlimited batches",
      "Priority customer support",
    ],
    razorpayPaymentLink: "https://rzp.io/rzp/pdfsun-monthly",
  },
  "pro-yearly": {
    id: "pro-yearly",
    name: "Pro Sun Annual",
    displayPriceINR: 1499,
    displayPriceUSD: 24,
    pricePaise: 149900,
    interval: "year",
    badge: "BEST VALUE",
    description: "Best annual rate with 12 months full Pro access.",
    features: [
      "Save 37% compared to monthly billing",
      "Full feature access across all 66+ tools",
      "Unlimited AI questions & OCR processing",
      "Bespoke layout reconstruction priority",
    ],
    razorpayPaymentLink: "https://rzp.io/rzp/pdfsun-annual",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    displayPriceINR: 3999,
    displayPriceUSD: 59,
    pricePaise: 399900,
    interval: "year",
    seats: 5,
    badge: "5 SEATS",
    description: "Collaborative multi-user plan for growing teams.",
    features: [
      "Multi-user access for up to 5 team seats",
      "Centralized billing & invoice management",
      "High document processing quotas",
      "Dedicated account manager",
      "Custom SLA guarantees",
    ],
    razorpayPaymentLink: "https://rzp.io/rzp/pdfsun-enterprise",
  },
  "enterprise-sso": {
    id: "enterprise-sso",
    name: "Enterprise SSO Unlimited",
    displayPriceINR: 9999,
    displayPriceUSD: 149,
    pricePaise: 999900,
    interval: "year",
    seats: 20,
    badge: "20 SEATS & SSO",
    description: "SAML/Okta SSO, dedicated infrastructure, and unlimited throughput.",
    features: [
      "Enterprise SSO (SAML 2.0 / Okta / Azure AD)",
      "20 team seats with role-based access control",
      "Unlimited file processing & storage throughput",
      "Dedicated private cloud infrastructure",
      "24/7 Phone & Slack engineering support",
    ],
    razorpayPaymentLink: "https://rzp.io/rzp/DTBivZF",
  },
};

export function resolvePaymentProduct(input: string | { planId?: string; [key: string]: any }): PaymentProduct {
  const planId = typeof input === "string" ? input : input?.planId || "pro-monthly";
  const p = PDFSUN_PAYMENT_PRODUCTS[planId] || PDFSUN_PAYMENT_PRODUCTS["pro-monthly"];
  return {
    ...p,
    productName: p.name,
    internalProductId: p.id,
    billingInterval: p.interval,
  };
}
