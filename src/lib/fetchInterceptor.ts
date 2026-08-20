/**
 * PDFSun Global Network Interceptor
 * Intercepts all `window.fetch` (and `axios` if available) requests globally.
 * - Catches & logs network connectivity errors (offline, failed to fetch)
 * - Intercepts HTTP 4xx and 5xx error responses
 * - Enforces request timeout limits and catches timeout events
 * - Logs detailed error telemetry to errorReporter and networkMonitor
 * - Shows user-friendly toast notifications via GlobalErrorToast without breaking application flow
 */

import { triggerErrorToast, ToastItem } from "../components/GlobalErrorToast";
import { logError } from "../services/errorReporter";
import { networkMonitor } from "../utils/networkMonitor";

export interface InterceptorOptions {
  timeoutMs?: number; // Default timeout in ms (e.g., 30000ms = 30s)
  enableToasts?: boolean;
}

// Debounce map to prevent toast spamming when multiple requests fail simultaneously
const recentToastsMap = new Map<string, number>();

function triggerDebouncedToast(
  title: string,
  message: string,
  options?: {
    type?: ToastItem["type"];
    fileName?: string;
    duration?: number;
    onRetry?: () => void;
  }
) {
  const toastKey = `${title}::${message}`;
  const now = Date.now();
  const lastTime = recentToastsMap.get(toastKey) || 0;

  // Skip duplicate toast if triggered within 3 seconds
  if (now - lastTime < 3000) {
    return;
  }

  recentToastsMap.set(toastKey, now);

  // Periodic cleanup of stale entries
  if (recentToastsMap.size > 30) {
    for (const [key, timestamp] of recentToastsMap.entries()) {
      if (now - timestamp > 6000) {
        recentToastsMap.delete(key);
      }
    }
  }

  triggerErrorToast(title, message, options);
}

/**
 * Safely extract human-readable error messages from a 4xx/5xx Response clone.
 */
async function parseResponseBodyForErrorMsg(response: Response): Promise<string | null> {
  try {
    const clone = response.clone();
    const contentType = clone.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const rawText = await clone.text();
      if (rawText && rawText.trim()) {
        try {
          const data = JSON.parse(rawText);
          if (data) {
            if (typeof data.error === "string") return data.error;
            if (typeof data.message === "string") return data.message;
            if (typeof data.detail === "string") return data.detail;
            if (data.error && typeof data.error.message === "string") return data.error.message;
          }
        } catch {}
      }
    } else if (contentType.includes("text/")) {
      const text = await clone.text();
      if (text && text.length < 200 && !text.toLowerCase().includes("<html")) {
        return text.trim();
      }
    }
  } catch {
    // Ignore clone/parsing errors
  }
  return null;
}

/**
 * Maps HTTP status codes to user-friendly toast titles and messages.
 */
function getToastMetadataForHttpStatus(
  status: number,
  customDetail?: string | null,
  urlPath?: string
): { title: string; message: string; type: ToastItem["type"] } {
  const pathLabel = urlPath ? ` (${urlPath})` : "";

  switch (status) {
    case 400:
      return {
        title: "Bad Request (400)",
        message: customDetail || `The server could not process the request parameters${pathLabel}.`,
        type: "generic",
      };
    case 401:
      return {
        title: "Authentication Required (401)",
        message: customDetail || "Your session may have expired. Please sign in again.",
        type: "generic",
      };
    case 403:
      return {
        title: "Access Forbidden (403)",
        message: customDetail || `You do not have permission to perform this action${pathLabel}.`,
        type: "generic",
      };
    case 404:
      return {
        title: "Resource Not Found (404)",
        message: customDetail || `The requested endpoint or file was not found${pathLabel}.`,
        type: "generic",
      };
    case 408:
      return {
        title: "Request Timeout (408)",
        message: "The server took too long to respond. Please try again.",
        type: "upload",
      };
    case 413:
      return {
        title: "Payload Too Large (413)",
        message: customDetail || "The uploaded file or request body exceeds server limits.",
        type: "size",
      };
    case 429:
      return {
        title: "Rate Limit Exceeded (429)",
        message: customDetail || "Too many requests sent in a short time. Please wait a moment before trying again.",
        type: "generic",
      };
    case 500:
      return {
        title: "Internal Server Error (500)",
        message: customDetail || `An error occurred on the server${pathLabel}. Please try again shortly.`,
        type: "upload",
      };
    case 502:
      return {
        title: "Bad Gateway (502)",
        message: "The server received an invalid response from an upstream service. Please try again.",
        type: "upload",
      };
    case 503:
      return {
        title: "Service Unavailable (503)",
        message: "The server is temporarily undergoing maintenance or overloaded. Please wait a moment.",
        type: "upload",
      };
    case 504:
      return {
        title: "Gateway Timeout (504)",
        message: "The upstream server failed to respond in time. Please try again.",
        type: "upload",
      };
    default:
      if (status >= 400 && status < 500) {
        return {
          title: `Client Request Error (${status})`,
          message: customDetail || `A client error occurred while processing the request${pathLabel}.`,
          type: "generic",
        };
      }
      return {
        title: `Server Error (${status})`,
        message: customDetail || `A server error occurred while processing the request${pathLabel}.`,
        type: "upload",
      };
  }
}

let originalFetch: typeof fetch | null = null;
let isInterceptorActive = false;

/**
 * Initializes global window.fetch and optional axios interceptors.
 */
export function setupGlobalFetchInterceptor(options: InterceptorOptions = {}): void {
  if (isInterceptorActive || typeof window === "undefined") {
    return;
  }

  const DEFAULT_TIMEOUT_MS = options.timeoutMs ?? 30000; // 30 second default request timeout
  originalFetch = window.fetch.bind(window);

  const interceptedFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request)?.url || "";
    const method = (init?.method || "GET").toUpperCase();

    // Clean pathname for cleaner toast displays
    let pathName = "";
    try {
      const parsedUrl = new URL(urlStr, window.location.origin);
      pathName = parsedUrl.pathname;
    } catch {
      pathName = urlStr;
    }

    // Ignore background noise endpoints (telemetry, auth verify checks, history prefetch, admin sync, payment-history sync, vite websockets, local static translation files, third-party fonts/analytics/scripts)
    const isTelemetryEndpoint =
      urlStr.includes("/api/telemetry") ||
      urlStr.includes("/api/health") ||
      urlStr.includes("/api/ping") ||
      urlStr.includes("/api/history") ||
      urlStr.includes("/api/system") ||
      urlStr.includes("/api/admin/system-stats") ||
      urlStr.includes("/api/admin/users") ||
      urlStr.includes("/api/auth/verify-session") ||
      urlStr.includes("/api/user/payment-history");
    const isViteHmrNoise =
      urlStr.includes("ws:") ||
      urlStr.includes("wss:") ||
      urlStr.includes("__vite") ||
      urlStr.includes("@vite") ||
      urlStr.includes("/src/") ||
      urlStr.includes("/.vite/") ||
      urlStr.includes("node_modules");
    const isStaticTranslation = urlStr.includes("/locales/");
    const isExternalFontOrAnalytics =
      urlStr.includes("fonts.gstatic.com") ||
      urlStr.includes("fonts.googleapis.com") ||
      urlStr.includes("google-analytics.com") ||
      urlStr.includes("googletagmanager.com") ||
      urlStr.includes("pagead2.googlesyndication.com") ||
      urlStr.includes("razorpay.com") ||
      urlStr.includes("cdn.razorpay.com") ||
      urlStr.includes("checkout.js") ||
      urlStr.includes("bundle.js");

    // Check if request is a background/read-only GET request (which shouldn't disrupt the user with scary popups)
    const isBackgroundGet = (method === "GET" && !urlStr.includes("/api/process")) || isTelemetryEndpoint;

    // Manage request timeout signal if caller did not provide their own AbortSignal
    let timeoutController: AbortController | null = null;
    let timeoutTimer: any = null;
    let fetchInit = init;

    if (!init?.signal && DEFAULT_TIMEOUT_MS > 0 && !isViteHmrNoise) {
      timeoutController = new AbortController();
      timeoutTimer = setTimeout(() => {
        timeoutController?.abort("NETWORK_TIMEOUT_EXCEEDED");
      }, DEFAULT_TIMEOUT_MS);

      fetchInit = {
        ...init,
        signal: timeoutController.signal,
      };
    }

    const startTime = performance.now();

    try {
      const response = await originalFetch!(input, fetchInit);
      if (timeoutTimer) clearTimeout(timeoutTimer);

      const durationMs = Math.round(performance.now() - startTime);

      // Intercept 4xx and 5xx HTTP response statuses
      if (!response.ok && !isTelemetryEndpoint && !isViteHmrNoise && !isExternalFontOrAnalytics) {
        parseResponseBodyForErrorMsg(response).then((customDetail) => {
          logError(`[Fetch HTTP ${response.status}] ${method} ${pathName}`, "warn", {
            status: response.status,
            statusText: response.statusText,
            url: urlStr,
            method,
            durationMs,
            customDetail,
          });

          networkMonitor.reportError(
            urlStr,
            method,
            `HTTP ${response.status} ${response.statusText}` + (customDetail ? `: ${customDetail}` : ""),
            response.status
          );

          // Do not trigger noisy toasts for background GET pings or static translation fallbacks
          if (!isBackgroundGet && (!isStaticTranslation || response.status !== 404)) {
            const toastMeta = getToastMetadataForHttpStatus(response.status, customDetail, pathName);
            triggerDebouncedToast(toastMeta.title, toastMeta.message, { type: toastMeta.type });
          }
        });
      }

      return response;
    } catch (err: any) {
      if (timeoutTimer) clearTimeout(timeoutTimer);

      const durationMs = Math.round(performance.now() - startTime);
      const isTimeoutError =
        err === "NETWORK_TIMEOUT_EXCEEDED" ||
        err?.name === "AbortError" ||
        (err?.message && err.message.toLowerCase().includes("timeout"));
      const isBrowserOffline = typeof navigator !== "undefined" && !navigator.onLine;

      if (!isTelemetryEndpoint && !isViteHmrNoise && !isExternalFontOrAnalytics) {
        if (isTimeoutError) {
          const timeoutMsg = `Request to ${pathName || urlStr} timed out after ${Math.round(
            DEFAULT_TIMEOUT_MS / 1000
          )}s.`;
          logError(`[Fetch Timeout] ${method} ${pathName}`, "error", { url: urlStr, method, durationMs });
          networkMonitor.reportError(urlStr, method, timeoutMsg, 408);

          triggerDebouncedToast(
            "Request Timed Out",
            "The server took too long to respond. Please check your network connection and try again.",
            { type: "upload" }
          );
        } else if (isBrowserOffline) {
          if (!isBackgroundGet) {
            logError(`[Fetch Offline] ${method} ${pathName}`, "warn", { url: urlStr, method });
            networkMonitor.reportError(urlStr, method, "Client is offline", 0);

            triggerDebouncedToast(
              "Network Connection Lost",
              "You appear to be offline. Please check your internet connection.",
              { type: "generic" }
            );
          }
        } else {
          const errorMessage = err?.message || "Failed to fetch";
          logError(`[Network Connection Error] ${method} ${pathName}: ${errorMessage}`, "error", {
            url: urlStr,
            method,
            error: String(err),
          });
          networkMonitor.reportError(urlStr, method, errorMessage, 0);

          if (!isBackgroundGet) {
            triggerDebouncedToast(
              "Network Request Error",
              `Unable to connect to server (${errorMessage}). Please verify your network connection.`,
              { type: "upload" }
            );
          }
        }
      }

      throw err;
    }
  };

  try {
    Object.defineProperty(window, "fetch", {
      value: interceptedFetch,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch {
    try {
      (window as any).fetch = interceptedFetch;
    } catch (e) {
      console.warn("[PDFSun] Unable to patch window.fetch:", e);
    }
  }

  // Attach interceptors to window.axios if loaded or when instantiated
  setupAxiosInterceptorIfAvailable();

  isInterceptorActive = true;
  console.log("[PDFSun] Global Fetch & Network Interceptor initialized.");
}

/**
 * Attach interceptor to window.axios if axios is attached globally.
 */
export function setupAxiosInterceptorIfAvailable(): void {
  if (typeof window === "undefined") return;

  const globalAxios = (window as any).axios;
  if (globalAxios && globalAxios.interceptors?.response) {
    try {
      globalAxios.interceptors.response.use(
        (response: any) => response,
        (error: any) => {
          const status = error?.response?.status;
          const url = error?.config?.url || "Axios Request";
          const method = (error?.config?.method || "GET").toUpperCase();
          const detail = error?.response?.data?.message || error?.response?.data?.error || error?.message;

          logError(`[Axios HTTP ${status || "Error"}] ${method} ${url}`, "error", { status, detail });
          networkMonitor.reportError(url, method, detail || "Axios request failed", status);

          if (error?.code === "ECONNABORTED" || (detail && String(detail).toLowerCase().includes("timeout"))) {
            triggerDebouncedToast("Request Timed Out", "The request timed out. Please try again.", {
              type: "upload",
            });
          } else if (status) {
            const toastMeta = getToastMetadataForHttpStatus(status, detail, url);
            triggerDebouncedToast(toastMeta.title, toastMeta.message, { type: toastMeta.type });
          } else {
            triggerDebouncedToast(
              "Network Error",
              `Unable to connect to server. Please check your network connection.`,
              { type: "upload" }
            );
          }

          return Promise.reject(error);
        }
      );
    } catch {
      // Ignore if axios interceptor setup fails
    }
  }
}
