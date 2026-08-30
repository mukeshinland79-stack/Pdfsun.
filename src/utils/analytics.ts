/**
 * Google Analytics 4 (GA4) Utility Integration for PDFSun (pdfsun.in)
 * Measurement ID: G-VKEKHR7SK8
 * 
 * Production-grade funnel tracking:
 * Visitor -> Landing Page -> Tool View -> File Upload -> Processing -> Download -> Second Tool -> Signup -> Pricing -> Checkout -> Purchase
 */

export const GA_MEASUREMENT_ID =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GA_MEASUREMENT_ID) ||
  "G-VKEKHR7SK8";

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Track last sent event signatures to prevent duplicate rapid-fire events
const recentEventCache = new Map<string, number>();

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
 */
export const trackGAEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window === "undefined") return;

  const signature = `${eventName}:${JSON.stringify(eventParams || {})}`;
  if (shouldThrottleEvent(signature)) {
    return;
  }

  if (typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, {
        send_to: GA_MEASUREMENT_ID,
        ...eventParams,
      });
    } catch (err) {
      console.warn("[GA4 Analytics] Error sending event:", eventName, err);
    }
  }
};

/**
 * Track pageview in GA4 with path and title
 */
export const trackGAPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window === "undefined") return;

  const signature = `page_view:${pagePath}`;
  if (shouldThrottleEvent(signature, 1200)) {
    return;
  }

  if (typeof window.gtag === "function") {
    try {
      window.gtag("event", "page_view", {
        send_to: GA_MEASUREMENT_ID,
        page_path: pagePath,
        page_title: pageTitle || document.title,
        page_location: window.location.href,
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

export const trackGAAiToolUsed = (toolId: string, taskType: string, success: boolean) => {
  trackGAEvent("ai_tool_used", {
    tool_id: toolId,
    task_type: taskType,
    success,
  });
};

