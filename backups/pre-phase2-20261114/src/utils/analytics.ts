/**
 * Google Analytics 4 (GA4) Utility Integration for PDFSun (pdfsun.in)
 * Measurement ID: G-VKEKHR7SK8
 * 
 * Production-grade funnel tracking:
 * Visitor -> Landing Page -> Tool View -> File Upload -> Processing -> Download -> Second Tool -> Signup -> Pricing -> Checkout -> Purchase
 */

import { TRAFFIC_SECURITY_CONFIG } from "../config/trafficSecurityConfig";
import { DUAL_OWNER_EMAILS } from "../types";

export const GA_MEASUREMENT_ID =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GA_MEASUREMENT_ID) ||
  "G-VKEKHR7SK8";

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Track last sent event signatures to prevent duplicate rapid-fire events (React StrictMode safe)
const recentEventCache = new Map<string, number>();

/**
 * Check if the current browser environment is an automated headless bot
 * (e.g. Selenium, Puppeteer, Headless Chrome)
 */
export function isAutomatedBotTraffic(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  // 1. Standard WebDriver flag exposed by automation frameworks
  if (navigator.webdriver === true) {
    return true;
  }

  // 2. Automated test runners & scrapers
  const ua = (navigator.userAgent || "").toLowerCase();
  if (
    ua.includes("headlesschrome") ||
    ua.includes("phantomjs") ||
    ua.includes("puppeteer") ||
    ua.includes("playwright")
  ) {
    return true;
  }

  return false;
}

/**
 * Check if current referrer matches known referral spam domains
 */
export function isReferralSpamVisit(): boolean {
  if (typeof document === "undefined") return false;
  const ref = (document.referrer || "").toLowerCase();
  if (!ref) return false;

  return TRAFFIC_SECURITY_CONFIG.suspiciousReferrers.some((spamDomain) => ref.includes(spamDomain));
}

/**
 * Check if the current session represents internal owner/developer traffic
 */
export function isInternalOwnerTraffic(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // 1. Explicit developer/internal override toggle in localStorage
    if (localStorage.getItem("pdfsun_internal_traffic") === "true") {
      return true;
    }

    // 2. Check if logged-in user is verified Owner
    const savedUser = localStorage.getItem("pdfsun_user_profile");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const email = (parsed?.email || "").toLowerCase().trim();
      if (DUAL_OWNER_EMAILS.some((e) => e.toLowerCase() === email) || parsed?.role === "owner") {
        return true;
      }
    }
  } catch (e) {
    // Ignore storage parse issues
  }

  return false;
}

/**
 * Allow Owner / Admin to toggle internal traffic filtering in live preview/production
 */
export function setInternalTrafficMode(enable: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (enable) {
      localStorage.setItem("pdfsun_internal_traffic", "true");
      if (typeof window.gtag === "function") {
        window.gtag("set", "user_properties", { traffic_type: "internal" });
      }
    } else {
      localStorage.removeItem("pdfsun_internal_traffic");
      if (typeof window.gtag === "function") {
        window.gtag("set", "user_properties", { traffic_type: "regular" });
      }
    }
  } catch (e) {}
}

function shouldThrottleEvent(signature: string, throttleMs = 800): boolean {
  const now = Date.now();
  const lastTime = recentEventCache.get(signature);
  if (lastTime && now - lastTime < throttleMs) {
    return true;
  }
  recentEventCache.set(signature, now);
  // Clean cache periodically
  if (recentEventCache.size > 200) {
    const cutoff = now - 60000;
    for (const [key, time] of recentEventCache.entries()) {
      if (time < cutoff) recentEventCache.delete(key);
    }
  }
  return false;
}

/**
 * Send custom event to Google Analytics 4
 * With Bot, Referral Spam, and Internal Traffic guardrails
 */
export const trackGAEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window === "undefined") return;

  // 1. Filter out automated scrapers & headless bots from dirtying GA4 metrics
  if (isAutomatedBotTraffic()) {
    return;
  }

  // 2. Filter out referral spam domains
  if (isReferralSpamVisit()) {
    return;
  }

  // 3. Deduplicate events
  const signature = `${eventName}:${JSON.stringify(eventParams || {})}`;
  if (shouldThrottleEvent(signature)) {
    return;
  }

  const isInternal = isInternalOwnerTraffic();

  if (typeof window.gtag === "function") {
    try {
      // Mark internal developer/owner traffic so GA4 filters can exclude it
      if (isInternal) {
        window.gtag("set", "user_properties", { traffic_type: "internal" });
      }

      window.gtag("event", eventName, {
        send_to: GA_MEASUREMENT_ID,
        ...(isInternal ? { traffic_type: "internal" } : {}),
        ...eventParams,
      });
    } catch (err) {
      console.warn("[GA4 Analytics] Error sending event:", eventName, err);
    }
  }
};

/**
 * Track pageview in GA4 with path and title
 * Strict deduplication ensures React StrictMode never causes double counting
 */
export const trackGAPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window === "undefined") return;

  if (isAutomatedBotTraffic() || isReferralSpamVisit()) {
    return;
  }

  const signature = `page_view:${pagePath}`;
  if (shouldThrottleEvent(signature, 1500)) {
    return;
  }

  const isInternal = isInternalOwnerTraffic();

  if (typeof window.gtag === "function") {
    try {
      if (isInternal) {
        window.gtag("set", "user_properties", { traffic_type: "internal" });
      }

      window.gtag("event", "page_view", {
        send_to: GA_MEASUREMENT_ID,
        page_path: pagePath,
        page_title: pageTitle || document.title,
        page_location: window.location.href,
        ...(isInternal ? { traffic_type: "internal" } : {}),
      });
    } catch (err) {
      console.warn("[GA4 Analytics] Error sending pageview:", err);
    }
  }
};

/**
 * Funnel Event: Tool View
 */
export const trackGAToolView = (toolId: string, toolName: string, category?: string) => {
  trackGAEvent("tool_view", {
    tool_id: toolId,
    tool_name: toolName,
    category: category || "general",
    page_location: window.location.href,
  });
};

/**
 * Funnel Event: Upload Start & Upload Success / Failure
 */
export const trackGAUploadStart = (toolId: string, fileCount: number, fileType?: string, fileSizeBytes?: number) => {
  trackGAEvent("upload_start", {
    tool_id: toolId,
    file_count: fileCount,
    file_type: fileType || "unknown",
    file_size_bytes: fileSizeBytes || 0,
  });
};

export const trackGAUploadSuccess = (toolId: string, fileCount: number, fileSizeBytes?: number) => {
  trackGAEvent("upload_success", {
    tool_id: toolId,
    file_count: fileCount,
    file_size_bytes: fileSizeBytes || 0,
  });
};

export const trackGAUploadFailed = (toolId: string, reason: string, fileSizeBytes?: number) => {
  trackGAEvent("upload_failed", {
    tool_id: toolId,
    reason: reason.slice(0, 100),
    file_size_bytes: fileSizeBytes || 0,
  });
};

/**
 * Funnel Event: Processing Start, Success & Failure
 */
export const trackGAProcessingStart = (toolId: string, fileCount: number, options?: Record<string, any>) => {
  trackGAEvent("processing_start", {
    tool_id: toolId,
    file_count: fileCount,
    ...options,
  });
};

export const trackGAProcessingSuccess = (toolId: string, latencyMs: number, outputSizeBytes?: number) => {
  trackGAEvent("processing_success", {
    tool_id: toolId,
    latency_ms: Math.round(latencyMs),
    output_size_bytes: outputSizeBytes || 0,
  });
};

export const trackGAProcessingFailed = (toolId: string, errorMessage: string, latencyMs?: number) => {
  trackGAEvent("processing_failed", {
    tool_id: toolId,
    error_message: errorMessage.slice(0, 120),
    latency_ms: latencyMs ? Math.round(latencyMs) : 0,
  });
};

/**
 * Funnel Event: Download Start, Success & Failure
 */
export const trackGADownloadStart = (toolId: string, fileName?: string, fileSizeBytes?: number) => {
  trackGAEvent("download_start", {
    tool_id: toolId,
    file_name: fileName || "output.pdf",
    file_size_bytes: fileSizeBytes || 0,
  });
};

export const trackGADownloadSuccess = (toolId: string, fileName?: string, fileSizeBytes?: number) => {
  trackGAEvent("download_success", {
    tool_id: toolId,
    file_name: fileName || "output.pdf",
    file_size_bytes: fileSizeBytes || 0,
    is_key_event: true,
  });
};

export const trackGADownloadFailed = (toolId: string, reason: string, fileSizeBytes?: number) => {
  trackGAEvent("download_failed", {
    tool_id: toolId,
    reason: reason.slice(0, 100),
    file_size_bytes: fileSizeBytes || 0,
  });
};

export const trackGAFileSelected = (toolId: string, fileCount: number, fileType?: string, fileSizeBytes?: number) => {
  trackGAEvent("file_selected", {
    tool_id: toolId,
    file_count: fileCount,
    file_type: fileType || "unknown",
    file_size_bytes: fileSizeBytes || 0,
  });
};

export const trackGAToolError = (toolId: string, errorType: string, message: string) => {
  trackGAEvent("tool_error", {
    tool_id: toolId,
    error_type: errorType,
    message: message.slice(0, 120),
  });
};

/**
 * Funnel Event: Tool Switch (Discovery loop: e.g. "Need another PDF tool?")
 */
export const trackGAToolSwitch = (fromToolId: string, toToolId: string, source: string = "related_tools") => {
  trackGAEvent("tool_switch", {
    from_tool_id: fromToolId,
    to_tool_id: toToolId,
    source,
  });
};

/**
 * Funnel Event: Auth (Signup, Login, Logout)
 */
export const trackGASignup = (method: "google" | "microsoft" | "email" | "sso", role: string = "user") => {
  trackGAEvent("signup", {
    method,
    role,
  });
};

export const trackGALogin = (method: "google" | "microsoft" | "email" | "sso", role: string = "user") => {
  trackGAEvent("login", {
    method,
    role,
  });
};

export const trackGALogout = (role: string = "user") => {
  trackGAEvent("logout", {
    role,
  });
};

/**
 * Funnel Event: Pricing & Monetization Funnel
 */
export const trackGAPricingView = (source: string = "header_navigation") => {
  trackGAEvent("pricing_view", {
    source,
  });
};

export const trackGACheckoutStart = (planId: string, planName: string, priceInr: number, currency: string = "INR") => {
  trackGAEvent("checkout_start", {
    plan_id: planId,
    plan_name: planName,
    price: priceInr,
    currency,
  });
};

export const trackGAPaymentSuccess = (planId: string, paymentId: string, amount: number, currency: string = "INR") => {
  trackGAEvent("payment_success", {
    plan_id: planId,
    payment_id: paymentId,
    amount,
    currency,
  });
};

export const trackGAPaymentFailed = (planId: string, errorCode: string, reason?: string) => {
  trackGAEvent("payment_failed", {
    plan_id: planId,
    error_code: errorCode,
    reason: reason?.slice(0, 100) || "cancelled",
  });
};

export const trackGASubscriptionStart = (planId: string, subscriptionId: string) => {
  trackGAEvent("subscription_start", {
    plan_id: planId,
    subscription_id: subscriptionId,
  });
};

export const trackGASubscriptionCancel = (planId: string) => {
  trackGAEvent("subscription_cancel", {
    plan_id: planId,
  });
};

/**
 * Engagement Events: Contact, Search, Language, AI Tools
 */
export const trackGAContactSubmit = (category: string) => {
  trackGAEvent("contact_submit", {
    category,
  });
};

export const trackGASearch = (query: string, resultsCount: number) => {
  trackGAEvent("search", {
    search_term: query.slice(0, 60),
    results_count: resultsCount,
  });
};

export const trackGALanguageChange = (language: string) => {
  trackGAEvent("language_change", {
    language,
  });
};

export const trackGAThemeChanged = (theme: string) => {
  trackGAEvent("theme_changed", {
    theme,
  });
};

export const trackGAAiToolUsed = (toolId: string, taskType: string, success: boolean) => {
  trackGAEvent("ai_tool_used", {
    tool_id: toolId,
    task_type: taskType,
    success,
  });
};

