/**
 * PDFSun Client-Side Error & Performance Telemetry Reporter
 * Queues client-side exceptions, unhandled rejections, and Web Vitals metrics
 * in localStorage / memory and flushes them to server telemetry endpoints.
 */

export interface ErrorLogPayload {
  id: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  level: "error" | "warn" | "info" | "fatal";
  context?: Record<string, any>;
}

export interface PerformanceMetricPayload {
  id: string;
  name: string; // e.g., 'FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'pdf_conversion_time'
  value: number;
  unit: "ms" | "score" | "bytes";
  tags?: Record<string, string>;
  timestamp: string;
}

const STORAGE_KEY_ERRORS = "pdfsun_telemetry_errors_v1";
const STORAGE_KEY_METRICS = "pdfsun_telemetry_metrics_v1";
const MAX_QUEUE_SIZE = 50;

class ErrorReporter {
  private errorQueue: ErrorLogPayload[] = [];
  private metricQueue: PerformanceMetricPayload[] = [];
  private endpoint: string = "/api/telemetry";
  private isFlushing = false;

  constructor() {
    this.loadPersistedLogs();
    this.setupAutomaticFlush();
  }

  private loadPersistedLogs(): void {
    if (typeof window === "undefined") return;
    try {
      const storedErrors = localStorage.getItem(STORAGE_KEY_ERRORS);
      if (storedErrors) {
        this.errorQueue = JSON.parse(storedErrors);
      }
      const storedMetrics = localStorage.getItem(STORAGE_KEY_METRICS);
      if (storedMetrics) {
        this.metricQueue = JSON.parse(storedMetrics);
      }
    } catch {
      // Clear corrupt storage
      this.errorQueue = [];
      this.metricQueue = [];
    }
  }

  private persistQueue(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_ERRORS, JSON.stringify(this.errorQueue.slice(-MAX_QUEUE_SIZE)));
      localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(this.metricQueue.slice(-MAX_QUEUE_SIZE)));
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  /**
   * Log client-side error event
   */
  public logError(
    error: Error | string,
    level: "error" | "warn" | "info" | "fatal" = "error",
    context?: Record<string, any>
  ): void {
    const message = typeof error === "string" ? error : error.message || "Unknown error";
    const stack = typeof error === "object" && error.stack ? error.stack : undefined;

    // Filter out benign HMR/WebSocket closed noise, background checks, and offline/aborted fallbacks
    if (
      message.includes("WebSocket closed without opened") ||
      message.includes("failed to connect to websocket") ||
      message.includes("Transition was aborted") ||
      message.includes("The user aborted a request") ||
      message.includes("AbortError") ||
      (message.includes("[Fetch Offline]") && (message.includes("verify-session") || message.includes("payment-history") || message.includes("telemetry") || message.includes("health") || message.includes("history")))
    ) {
      return;
    }

    const payload: ErrorLogPayload = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      message,
      stack,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      timestamp: new Date().toISOString(),
      level,
      context,
    };

    if (level === "error" || level === "fatal") {
      console.error(`[PDFSun ErrorReporter][${level.toUpperCase()}]`, message, context || "");
    } else if (level === "warn") {
      console.warn(`[PDFSun ErrorReporter][${level.toUpperCase()}]`, message, context || "");
    } else {
      console.info(`[PDFSun ErrorReporter][${level.toUpperCase()}]`, message, context || "");
    }

    this.errorQueue.push(payload);
    if (this.errorQueue.length > MAX_QUEUE_SIZE) {
      this.errorQueue.shift();
    }

    this.persistQueue();
  }

  /**
   * Log performance timing or metric
   */
  public logMetric(
    name: string,
    value: number,
    unit: "ms" | "score" | "bytes" = "ms",
    tags?: Record<string, string>
  ): void {
    const payload: PerformanceMetricPayload = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      value: Math.round(value * 100) / 100,
      unit,
      tags,
      timestamp: new Date().toISOString(),
    };

    this.metricQueue.push(payload);
    if (this.metricQueue.length > MAX_QUEUE_SIZE) {
      this.metricQueue.shift();
    }

    this.persistQueue();
  }

  /**
   * Flush queued logs to telemetry server endpoint if available
   */
  public async flushQueue(): Promise<void> {
    if (this.isFlushing || (this.errorQueue.length === 0 && this.metricQueue.length === 0)) {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    this.isFlushing = true;
    const errorsToFlush = [...this.errorQueue];
    const metricsToFlush = [...this.metricQueue];

    try {
      if (typeof window !== "undefined" && window.fetch) {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            errors: errorsToFlush,
            metrics: metricsToFlush,
          }),
        });

        if (response.ok) {
          // Successfully sent, drain flushed items
          this.errorQueue = this.errorQueue.filter((e) => !errorsToFlush.some((f) => f.id === e.id));
          this.metricQueue = this.metricQueue.filter((m) => !metricsToFlush.some((f) => f.id === m.id));
          this.persistQueue();
        }
      }
    } catch {
      // Retain in queue for next sync cycle
    } finally {
      this.isFlushing = false;
    }
  }

  private setupAutomaticFlush(): void {
    if (typeof window === "undefined") return;

    // Flush periodically every 60 seconds
    setInterval(() => {
      this.flushQueue();
    }, 60000);

    // Flush on page unload if sendBeacon is supported
    window.addEventListener("beforeunload", () => {
      if (navigator.sendBeacon && (this.errorQueue.length > 0 || this.metricQueue.length > 0)) {
        navigator.sendBeacon(
          this.endpoint,
          JSON.stringify({
            errors: this.errorQueue,
            metrics: this.metricQueue,
          })
        );
      }
    });
  }

  public getBufferedErrors(): ErrorLogPayload[] {
    return [...this.errorQueue];
  }

  public getBufferedMetrics(): PerformanceMetricPayload[] {
    return [...this.metricQueue];
  }

  public clearAll(): void {
    this.errorQueue = [];
    this.metricQueue = [];
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY_ERRORS);
        localStorage.removeItem(STORAGE_KEY_METRICS);
      } catch {
        // ignore
      }
    }
  }
}

// Export Singleton Instance
export const errorReporter = new ErrorReporter();

// Convenience Function Exports
export function logError(
  error: Error | string,
  level: "error" | "warn" | "info" | "fatal" = "error",
  context?: Record<string, any>
): void {
  errorReporter.logError(error, level, context);
}

export function logMetric(
  name: string,
  value: number,
  unit: "ms" | "score" | "bytes" = "ms",
  tags?: Record<string, string>
): void {
  errorReporter.logMetric(name, value, unit, tags);
}

export async function flushTelemetry(): Promise<void> {
  return errorReporter.flushQueue();
}
