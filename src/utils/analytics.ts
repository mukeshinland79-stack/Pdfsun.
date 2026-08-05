/**
 * Google Analytics 4 (GA4) Utility Integration for PDF Sun (pdfsun.in)
 * Measurement ID: G-VKEKHR7SK8
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

/**
 * Send custom event to Google Analytics 4
 */
export const trackGAEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, {
      send_to: GA_MEASUREMENT_ID,
      ...eventParams,
    });
  }
};

/**
 * Track pageview in GA4
 */
export const trackGAPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.href,
    });
  }
};
