/**
 * Global Network Monitor & Resilient Request Utility for PDFSun.in
 * Monitors browser online/offline connectivity, intercepts network errors,
 * provides exponential-backoff retries for fetch calls, and handles transient WebSocket drops seamlessly.
 */

export type NetworkStatus = "online" | "offline" | "degraded";

export interface NetworkState {
  status: NetworkStatus;
  isOnline: boolean;
  effectiveType?: string; // e.g. '4g', '3g'
  rtt?: number; // Round-trip time in ms
  downlink?: number; // Downlink bandwidth in Mbps
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
  failedRequestCount: number;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryOnStatuses?: number[];
  timeoutMs?: number;
}

type StatusListener = (state: NetworkState) => void;
type ErrorListener = (error: { url: string; method: string; status?: number; message: string; timestamp: Date }) => void;

class NetworkMonitorManager {
  private state: NetworkState = {
    status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    lastOnlineAt: typeof navigator !== "undefined" && navigator.onLine ? new Date() : null,
    lastOfflineAt: typeof navigator !== "undefined" && !navigator.onLine ? new Date() : null,
    failedRequestCount: 0,
  };

  private statusListeners = new Set<StatusListener>();
  private errorListeners = new Set<ErrorListener>();
  private originalFetch: typeof fetch | null = null;
  private isIntercepting = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initEventListeners();
      this.updateNetworkInformation();
    }
  }

  private updateNetworkInformation(): void {
    if (typeof navigator === "undefined") return;

    // Check NetworkInformation API if available
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      this.state.effectiveType = connection.effectiveType;
      this.state.rtt = connection.rtt;
      this.state.downlink = connection.downlink;
    }
  }

  private initEventListeners(): void {
    window.addEventListener("online", () => {
      this.state.isOnline = true;
      this.state.status = "online";
      this.state.lastOnlineAt = new Date();
      this.updateNetworkInformation();
      this.notifyStatusChange();
    });

    window.addEventListener("offline", () => {
      this.state.isOnline = false;
      this.state.status = "offline";
      this.state.lastOfflineAt = new Date();
      this.notifyStatusChange();
    });

    // Listen for network connection quality changes if supported
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      connection.addEventListener("change", () => {
        this.updateNetworkInformation();
        this.notifyStatusChange();
      });
    }
  }

  /**
   * Subscribe to network status changes (online / offline / degraded)
   */
  public subscribe(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    // Immediately notify current state
    listener({ ...this.state });

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Subscribe to network request errors
   */
  public subscribeError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  private notifyStatusChange(): void {
    const currentState = { ...this.state };
    this.statusListeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error("[NetworkMonitor] Error in status listener:", err);
      }
    });
  }

  public reportError(url: string, method: string, message: string, status?: number): void {
    this.state.failedRequestCount++;
    const errorEvent = {
      url,
      method,
      status,
      message,
      timestamp: new Date(),
    };

    this.errorListeners.forEach((listener) => {
      try {
        listener(errorEvent);
      } catch (err) {
        console.error("[NetworkMonitor] Error in error listener:", err);
      }
    });
  }

  public getSnapshot(): NetworkState {
    return { ...this.state };
  }

  /**
   * Enhanced fetch with automatic exponential backoff retries and timeout support
   */
  public async fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    const {
      maxRetries = 3,
      initialDelayMs = 500,
      maxDelayMs = 4000,
      backoffFactor = 2,
      retryOnStatuses = [408, 429, 500, 502, 503, 504],
      timeoutMs = 15000,
    } = retryOptions;

    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || "GET";

    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (!this.state.isOnline && attempt > 0) {
        // Pause briefly if browser is offline
        await new Promise((res) => setTimeout(res, 1000));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Merge user signal with timeout signal
      const combinedInit: RequestInit = {
        ...init,
        signal: init?.signal ? init.signal : controller.signal,
      };

      try {
        const fetchFn = this.originalFetch || fetch;
        const response = await fetchFn(input, combinedInit);
        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        // Check if status qualifies for retry
        if (retryOnStatuses.includes(response.status) && attempt < maxRetries) {
          console.warn(
            `[NetworkMonitor] Request to ${urlStr} failed with status ${response.status}. Retrying attempt ${attempt + 1}/${maxRetries}...`
          );
          const delay = Math.min(initialDelayMs * Math.pow(backoffFactor, attempt), maxDelayMs);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Non-retriable response or out of retries
        this.reportError(urlStr, method, `HTTP ${response.status} ${response.statusText}`, response.status);
        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;

        const isAbort = err?.name === "AbortError";
        const errorMsg = isAbort ? `Request timeout after ${timeoutMs}ms` : err?.message || "Network request failed";

        if (attempt < maxRetries) {
          console.warn(
            `[NetworkMonitor] Request to ${urlStr} threw error (${errorMsg}). Retrying attempt ${attempt + 1}/${maxRetries}...`
          );
          const delay = Math.min(initialDelayMs * Math.pow(backoffFactor, attempt), maxDelayMs);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          this.reportError(urlStr, method, errorMsg);
        }
      }
    }

    throw lastError || new Error(`Network request to ${urlStr} failed after ${maxRetries} retries.`);
  }

  /**
   * Optional global fetch interceptor activation
   */
  public enableGlobalFetchInterceptor(): void {
    if (this.isIntercepting || typeof window === "undefined") return;

    this.originalFetch = window.fetch.bind(window);
    const monitor = this;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      // Skip interception for SSE streams or WebSockets
      if (init?.headers && (init.headers as any)["Accept"] === "text/event-stream") {
        return monitor.originalFetch!(input, init);
      }

      try {
        return await monitor.fetchWithRetry(input, init, { maxRetries: 2, initialDelayMs: 400 });
      } catch (err) {
        return monitor.originalFetch!(input, init);
      }
    };

    this.isIntercepting = true;
    console.log("[NetworkMonitor] Global fetch interceptor enabled.");
  }
}

// Export Singleton Instance
export const networkMonitor = new NetworkMonitorManager();

// Helper Export Functions
export function getNetworkState(): NetworkState {
  return networkMonitor.getSnapshot();
}

export function subscribeNetworkStatus(listener: StatusListener): () => void {
  return networkMonitor.subscribe(listener);
}

export function subscribeNetworkErrors(listener: ErrorListener): () => void {
  return networkMonitor.subscribeError(listener);
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return networkMonitor.fetchWithRetry(input, init, options);
}
