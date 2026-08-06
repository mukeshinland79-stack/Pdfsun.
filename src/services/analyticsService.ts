import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, set, get, Database, Unsubscribe } from "firebase/database";

export interface LiveAnalyticsData {
  activeUsersOnline: number;
  activeUsers: number;
  totalConversionsToday: number;
  serverLoadMs: number;
  processingSpeed: number;
  successRatePercent: number;
  successRate: number;
  timestamp: string;
}

export function normalizeAnalyticsData(raw: Partial<LiveAnalyticsData> | Record<string, unknown>): LiveAnalyticsData {
  const active = Number(raw.activeUsers ?? raw.activeUsersOnline ?? 1);
  const speed = Number(raw.processingSpeed ?? raw.serverLoadMs ?? 15);
  const rate = Number(raw.successRate ?? raw.successRatePercent ?? 99.8);
  const conversions = Number(raw.totalConversionsToday ?? 0);
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

// Helper to access env vars safely
const getEnvVar = (key: string, fallback: string): string => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
    if (typeof process !== "undefined" && process.env && process.env[key]) return process.env[key];
  } catch (e) {
    // ignore
  }
  return fallback;
};

// Firebase Project Configuration
const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY", "AIzaSyDemoKeyForPDFSunAnalytics2026"),
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN", "pdfsun-analytics.firebaseapp.com"),
  databaseURL: getEnvVar("VITE_FIREBASE_DATABASE_URL", "https://pdfsun-analytics-default-rtdb.firebaseio.com"),
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID", "pdfsun-analytics"),
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET", "pdfsun-analytics.appspot.com"),
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID", "123456789012"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID", "1:123456789012:web:abcdef1234567890"),
};

// Safe Firebase Initialization
let app: FirebaseApp | null = null;
let db: Database | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (err) {
  console.warn("Firebase Realtime Database initialization notice:", err);
}

class AnalyticsService {
  private baseUrl = "/api/analytics";

  /**
   * Get Firebase Realtime Database instance
   */
  getDatabaseInstance(): Database | null {
    return db;
  }

  /**
   * Fetch a snapshot of current live analytics metrics from Firebase or REST fallback
   */
  async getSnapshot(): Promise<LiveAnalyticsData | null> {
    // 1. Try Firebase Realtime Database snapshot first
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

    // 2. Fallback to API REST endpoint
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
   * Subscribe to real-time live metrics streaming using persistent WebSocket connection,
   * with automatic reconnects, heartbeats, and SSE/Firebase/REST fallbacks.
   */
  subscribeToLiveMetrics(options: AnalyticsStreamOptions): () => void {
    let isDisposed = false;
    let socket: WebSocket | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let unsubscribeFb: Unsubscribe | null = null;
    let eventSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    let isDisconnectHandled = false;

    const getWsUrl = (): string => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      return `${protocol}//${host}/ws/analytics`;
    };

    const handleWsDisconnect = () => {
      if (isDisconnectHandled) return;
      isDisconnectHandled = true;

      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      if (socket) {
        const currentSocket = socket;
        socket = null;
        try {
          if (
            currentSocket.readyState === WebSocket.OPEN ||
            currentSocket.readyState === WebSocket.CONNECTING
          ) {
            currentSocket.close();
          }
        } catch {
          // ignore close errors
        }
      }

      if (isDisposed) return;

      // Try SSE / Firebase fallback
      fallbackToSseOrFirebase();
    };

    const connectWebSocket = () => {
      if (isDisposed) return;
      isDisconnectHandled = false;

      const currentStatus = retryCount === 0 ? "connecting" : "reconnecting";
      options.onStatusChange?.(currentStatus);

      try {
        const wsUrl = getWsUrl();
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          if (isDisposed) return;
          retryCount = 0;
          options.onStatusChange?.("live");

          // Start heartbeat interval (ping every 10s)
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              try {
                socket.send(JSON.stringify({ type: "ping" }));
              } catch {
                // ignore write errors
              }
            }
          }, 10000);
        };

        socket.onmessage = (event) => {
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
          } catch (err) {
            console.warn("Failed to parse WebSocket analytics message:", err);
          }
        };

        socket.onerror = (err) => {
          if (isDisposed) return;
          console.warn("WebSocket analytics stream notice, switching to SSE fallback:", err);
          handleWsDisconnect();
        };

        socket.onclose = () => {
          if (isDisposed) return;
          handleWsDisconnect();
        };
      } catch (wsErr) {
        if (!isDisposed) {
          console.warn("Failed to initialize WebSocket client, falling back to SSE:", wsErr);
          fallbackToSseOrFirebase();
        }
      }
    };

    const fallbackToSseOrFirebase = () => {
      if (isDisposed) return;

      options.onStatusChange?.("reconnecting");

      // Try SSE first as secondary stream
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
                  options.onData(val as LiveAnalyticsData);
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

      // Immediately fetch snapshot as bridge
      this.getSnapshot().then((snapshot) => {
        if (snapshot && !isDisposed) {
          options.onData(snapshot);
        }
      });

      const backoffMs = Math.min(20000, Math.pow(2, retryCount) * 1000 + Math.random() * 500);
      retryCount++;

      retryTimer = setTimeout(() => {
        if (!isDisposed) {
          connectWebSocket();
        }
      }, backoffMs);
    };

    // Initiate primary WebSocket connection
    connectWebSocket();

    // Cleanup function
    return () => {
      isDisposed = true;
      if (pingInterval) clearInterval(pingInterval);
      if (retryTimer) clearTimeout(retryTimer);
      if (socket) {
        socket.close();
        socket = null;
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
   * Record a conversion event in backend and Firebase Realtime Database
   */
  async recordConversion(latencyMs = 15, success = true): Promise<LiveAnalyticsData | null> {
    let currentStats: LiveAnalyticsData | null = null;

    // 1. Send event to backend API endpoint
    try {
      const res = await fetch(`${this.baseUrl}/record-conversion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latencyMs, success }),
      });

      if (res.ok) {
        const json = await res.json();
        currentStats = json?.currentStats || null;
      }
    } catch (err) {
      console.warn("AnalyticsService recordConversion backend post failed:", err);
    }

    // 2. Sync updated metrics to Firebase Realtime Database
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

