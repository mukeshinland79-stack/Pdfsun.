import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, set, get, Database, Unsubscribe } from "firebase/database";
import { ResilientWebSocket } from "../utils/ResilientWebSocket";

export interface LiveAnalyticsData {
  activeUsersOnline: number;
  activeUsers: number;
  totalConversionsToday: number;
  serverLoadMs: number | null;
  processingSpeed: number | null;
  successRatePercent: number | null;
  successRate: number | null;
  timestamp: string;
}

function toFiniteNumberOrNull(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

export function normalizeAnalyticsData(raw: Partial<LiveAnalyticsData> | Record<string, unknown>): LiveAnalyticsData {
  const activeRaw = toFiniteNumberOrNull(raw.activeUsers ?? raw.activeUsersOnline);
  const active = activeRaw !== null && activeRaw >= 0 ? activeRaw : 0;
  const speed = toFiniteNumberOrNull(raw.processingSpeed ?? raw.serverLoadMs);
  const rate = toFiniteNumberOrNull(raw.successRate ?? raw.successRatePercent);
  const conversionsRaw = toFiniteNumberOrNull(raw.totalConversionsToday);
  const conversions = conversionsRaw !== null && conversionsRaw >= 0 ? conversionsRaw : 0;
  const ts = typeof raw.timestamp === "string" ? raw.timestamp : new Date().toISOString();

  return {
    activeUsersOnline: active,
    activeUsers: active,
    totalConversionsToday: conversions,
    serverLoadMs: speed,
    processingSpeed: speed,
    successRatePercent: rate,
    successRate: rate,
    timestamp: ts,
  };
}

export interface AnalyticsStreamOptions {
  onData: (data: LiveAnalyticsData) => void;
  onError?: (error: unknown) => void;
  onStatusChange?: (status: "connecting" | "live" | "reconnecting" | "offline") => void;
}

// Helper to access env vars safely without fabricated demo fallbacks
const getEnvVar = (key: string): string => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
    if (typeof process !== "undefined" && process.env && process.env[key]) return process.env[key];
  } catch {
    // ignore
  }
  return "";
};

const firebaseApiKey = getEnvVar("VITE_FIREBASE_API_KEY");
const firebaseDbUrl = getEnvVar("VITE_FIREBASE_DATABASE_URL");
const hasRealFirebaseConfig = Boolean(
  firebaseApiKey &&
    firebaseDbUrl &&
    !firebaseApiKey.includes("DemoKey") &&
    !firebaseDbUrl.includes("pdfsun-analytics-default-rtdb")
);

let app: FirebaseApp | null = null;
let db: Database | null = null;

if (hasRealFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: firebaseApiKey,
      authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN"),
      databaseURL: firebaseDbUrl,
      projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID"),
      storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID"),
      appId: getEnvVar("VITE_FIREBASE_APP_ID"),
    };
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (err) {
    console.warn("Firebase Realtime Database initialization notice:", err);
  }
}

class AnalyticsService {
  private baseUrl = "/api/analytics";

  getDatabaseInstance(): Database | null {
    return db;
  }

  /**
   * Fetch a snapshot of current live analytics metrics from REST API (or configured Firebase RTDB)
   */
  async getSnapshot(): Promise<LiveAnalyticsData | null> {
    if (db) {
      try {
        const metricsRef = ref(db, "analytics/live");
        const snapshot = await get(metricsRef);
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val) {
            return normalizeAnalyticsData(val);
          }
        }
      } catch (fbErr) {
        console.warn("Firebase snapshot fetch fallback:", fbErr);
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json?.data ? normalizeAnalyticsData(json.data) : null;
    } catch (err) {
      console.warn("AnalyticsService getSnapshot failed:", err);
      return null;
    }
  }

  /**
   * Subscribe to real-time live metrics streaming via WebSocket -> SSE -> REST fallback
   */
  subscribeToLiveMetrics(options: AnalyticsStreamOptions): () => void {
    let isDisposed = false;
    let resilientSocket: ResilientWebSocket | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let unsubscribeFb: Unsubscribe | null = null;
    let eventSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;

    const getWsUrl = (): string => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      return `${protocol}//${host}/ws/analytics`;
    };

    const connectWebSocket = () => {
      if (isDisposed) return;

      const currentStatus = retryCount === 0 ? "connecting" : "reconnecting";
      options.onStatusChange?.(currentStatus);

      try {
        const wsUrl = getWsUrl();
        resilientSocket = new ResilientWebSocket(wsUrl);

        resilientSocket.on("open", () => {
          if (isDisposed) return;
          retryCount = 0;
          options.onStatusChange?.("live");

          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (resilientSocket && resilientSocket.readyState === WebSocket.OPEN) {
              try {
                resilientSocket.send(JSON.stringify({ type: "ping" }));
              } catch {
                // ignore write errors
              }
            }
          }, 10000);
        });

        resilientSocket.on("message", (event: MessageEvent) => {
          if (isDisposed) return;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === "metrics" && parsed.data) {
              options.onData(normalizeAnalyticsData(parsed.data));
              options.onStatusChange?.("live");
            } else if (parsed.activeUsersOnline !== undefined || parsed.activeUsers !== undefined) {
              options.onData(normalizeAnalyticsData(parsed));
              options.onStatusChange?.("live");
            }
          } catch {
            // benign parse error suppressed
          }
        });

        resilientSocket.on("error", () => {
          if (isDisposed) return;
        });

        resilientSocket.on("close", () => {
          if (isDisposed) return;
          fallbackToSseOrFirebase();
        });
      } catch {
        if (!isDisposed) {
          fallbackToSseOrFirebase();
        }
      }
    };

    const fallbackToSseOrFirebase = () => {
      if (isDisposed) return;

      options.onStatusChange?.("reconnecting");

      try {
        eventSource = new EventSource("/api/analytics/live");

        eventSource.onopen = () => {
          if (isDisposed) return;
          retryCount = 0;
          options.onStatusChange?.("live");
        };

        eventSource.onmessage = (event) => {
          if (isDisposed) return;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed && typeof parsed.activeUsersOnline === "number") {
              options.onData(normalizeAnalyticsData(parsed));
              options.onStatusChange?.("live");
            }
          } catch (err) {
            console.error("Failed to parse SSE payload:", err);
          }
        };

        eventSource.onerror = () => {
          if (isDisposed) return;
          if (eventSource) {
            try {
              eventSource.close();
            } catch {
              // ignore
            }
            eventSource = null;
          }
          fallbackToFirebaseOrRest();
        };
      } catch {
        fallbackToFirebaseOrRest();
      }
    };

    const fallbackToFirebaseOrRest = () => {
      if (isDisposed) return;

      if (db) {
        try {
          const analyticsRef = ref(db, "analytics/live");
          unsubscribeFb = onValue(
            analyticsRef,
            (snapshot) => {
              if (isDisposed) return;
              if (snapshot.exists()) {
                const val = snapshot.val();
                if (val && typeof val.activeUsersOnline === "number") {
                  options.onData(normalizeAnalyticsData(val));
                  options.onStatusChange?.("live");
                }
              }
            },
            () => scheduleReconnect()
          );
        } catch {
          scheduleReconnect();
        }
      } else {
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (isDisposed) return;

      options.onStatusChange?.("reconnecting");

      this.getSnapshot()
        .then((snapshot) => {
          if (snapshot && !isDisposed) {
            options.onData(snapshot);
          }
        })
        .catch(() => {
          // ignore snapshot bridge errors during offline/disconnect state
        });

      const backoffMs = Math.min(30000, 1000 * Math.pow(1.8, Math.min(retryCount, 6)) + Math.random() * 500);
      retryCount++;

      retryTimer = setTimeout(() => {
        if (!isDisposed) {
          connectWebSocket();
        }
      }, backoffMs);
    };

    connectWebSocket();

    return () => {
      isDisposed = true;
      if (pingInterval) clearInterval(pingInterval);
      if (retryTimer) clearTimeout(retryTimer);
      if (resilientSocket) {
        resilientSocket.close(1000, "Component unmounted");
        resilientSocket = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (unsubscribeFb) {
        try {
          unsubscribeFb();
        } catch {
          // ignore
        }
      }
    };
  }

  /**
   * Record a real conversion event in backend analytics
   */
  async recordConversion(latencyMs: number, success = true, toolId?: string, eventId?: string): Promise<LiveAnalyticsData | null> {
    if (!Number.isFinite(latencyMs) || latencyMs < 1) return null;
    let currentStats: LiveAnalyticsData | null = null;

    try {
      const res = await fetch(`${this.baseUrl}/record-conversion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latencyMs: Math.round(latencyMs), success, toolId, eventId }),
      });

      if (res.ok) {
        const json = await res.json();
        currentStats = json?.currentStats ? normalizeAnalyticsData(json.currentStats) : null;
      }
    } catch (err) {
      console.warn("AnalyticsService recordConversion backend post failed:", err);
    }

    if (db && currentStats) {
      try {
        const liveRef = ref(db, "analytics/live");
        await set(liveRef, currentStats);
      } catch (fbErr) {
        console.warn("Firebase Realtime Database write warning:", fbErr);
      }
    }

    return currentStats;
  }
}

export const analyticsService = new AnalyticsService();
export { useLiveAnalytics } from "../hooks/useLiveAnalytics";
