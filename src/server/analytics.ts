import { Router, Request, Response } from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import fs from "fs";
import path from "path";

export type AnalyticsEventStage =
  | "tool_opened"
  | "process_started"
  | "process_completed"
  | "output_validated"
  | "download_initiated"
  | "process_failed"
  | "process_cancelled";

export const VALID_ANALYTICS_STAGES = new Set<AnalyticsEventStage>([
  "tool_opened",
  "process_started",
  "process_completed",
  "output_validated",
  "download_initiated",
  "process_failed",
  "process_cancelled",
]);

export interface ToolAnalyticsCounter {
  toolId: string;
  opened: number;
  started: number;
  completed: number;
  validated: number;
  downloaded: number;
  failed: number;
  cancelled: number;
  lastUpdatedAt: string;
}

export interface PersistedAnalyticsState {
  dayKey: string;
  totalConversionsToday: number;
  successfulConversions: number;
  failedConversions: number;
  cancelledProcesses: number;
  latencyHistory: number[];
  toolCounters: Record<string, ToolAnalyticsCounter>;
  recentEventIds: string[];
}

export interface LiveAnalyticsMetrics {
  activeUsersOnline: number;
  activeUsers: number;
  totalConversionsToday: number;
  successfulConversions: number;
  failedConversions: number;
  cancelledProcesses: number;
  serverLoadMs: number | null;
  processingSpeed: number | null;
  successRatePercent: number | null;
  successRate: number | null;
  timestamp: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics_events.json");
const MAX_DEDUPE_EVENT_IDS = 5000;
const MAX_LATENCY_SAMPLES = 50;

function getTodayUtcKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyState(): PersistedAnalyticsState {
  return {
    dayKey: getTodayUtcKey(),
    totalConversionsToday: 0,
    successfulConversions: 0,
    failedConversions: 0,
    cancelledProcesses: 0,
    latencyHistory: [],
    toolCounters: {},
    recentEventIds: [],
  };
}

let analyticsState: PersistedAnalyticsState = createEmptyState();
const processedEventIdSet = new Set<string>();

function loadAnalyticsState(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(ANALYTICS_FILE)) {
      const raw = fs.readFileSync(ANALYTICS_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<PersistedAnalyticsState>;
      const today = getTodayUtcKey();
      const sameDay = parsed.dayKey === today;
      analyticsState = {
        dayKey: today,
        totalConversionsToday: sameDay && Number.isFinite(parsed.totalConversionsToday) ? Number(parsed.totalConversionsToday) : 0,
        successfulConversions: sameDay && Number.isFinite(parsed.successfulConversions) ? Number(parsed.successfulConversions) : 0,
        failedConversions: sameDay && Number.isFinite(parsed.failedConversions) ? Number(parsed.failedConversions) : 0,
        cancelledProcesses: sameDay && Number.isFinite(parsed.cancelledProcesses) ? Number(parsed.cancelledProcesses) : 0,
        latencyHistory: Array.isArray(parsed.latencyHistory)
          ? parsed.latencyHistory.filter((n) => typeof n === "number" && Number.isFinite(n) && n > 0).slice(-MAX_LATENCY_SAMPLES)
          : [],
        toolCounters: parsed.toolCounters && typeof parsed.toolCounters === "object" ? parsed.toolCounters : {},
        recentEventIds: Array.isArray(parsed.recentEventIds)
          ? parsed.recentEventIds.filter((s) => typeof s === "string").slice(-MAX_DEDUPE_EVENT_IDS)
          : [],
      };
      processedEventIdSet.clear();
      for (const id of analyticsState.recentEventIds) {
        processedEventIdSet.add(id);
      }
    }
  } catch (err) {
    console.warn("[Analytics] Failed to load persisted analytics state, starting clean:", err);
    analyticsState = createEmptyState();
    processedEventIdSet.clear();
  }
}

function saveAnalyticsState(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${ANALYTICS_FILE}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(analyticsState, null, 2), "utf-8");
    fs.renameSync(tmpFile, ANALYTICS_FILE);
  } catch (err) {
    console.warn("[Analytics] Failed to persist analytics state atomically:", err);
  }
}

function ensureCurrentDay(): void {
  const today = getTodayUtcKey();
  if (analyticsState.dayKey !== today) {
    analyticsState.dayKey = today;
    analyticsState.totalConversionsToday = 0;
    analyticsState.successfulConversions = 0;
    analyticsState.failedConversions = 0;
    analyticsState.cancelledProcesses = 0;
    analyticsState.latencyHistory = [];
  }
}

function markEventId(eventId: string): boolean {
  if (!eventId) return true;
  if (processedEventIdSet.has(eventId)) {
    return false;
  }
  processedEventIdSet.add(eventId);
  analyticsState.recentEventIds.push(eventId);
  if (analyticsState.recentEventIds.length > MAX_DEDUPE_EVENT_IDS) {
    const excess = analyticsState.recentEventIds.length - MAX_DEDUPE_EVENT_IDS;
    const removed = analyticsState.recentEventIds.splice(0, excess);
    for (const oldId of removed) {
      processedEventIdSet.delete(oldId);
    }
  }
  return true;
}

function ensureToolCounter(toolId: string): ToolAnalyticsCounter {
  if (!analyticsState.toolCounters[toolId]) {
    analyticsState.toolCounters[toolId] = {
      toolId,
      opened: 0,
      started: 0,
      completed: 0,
      validated: 0,
      downloaded: 0,
      failed: 0,
      cancelled: 0,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
  return analyticsState.toolCounters[toolId];
}

loadAnalyticsState();

const router = Router();

let activeSseClientsCount = 0;
let activeWsClientsCount = 0;

const sseClients = new Set<Response>();
const wsClients = new Set<WebSocket>();

export function calculateLiveMetrics(externalWsClientCount: number = 0): LiveAnalyticsMetrics {
  ensureCurrentDay();
  const totalOutcomes = analyticsState.successfulConversions + analyticsState.failedConversions;
  const successRate =
    totalOutcomes > 0 ? Math.round((analyticsState.successfulConversions / totalOutcomes) * 1000) / 10 : null;
  const avgLatency =
    analyticsState.latencyHistory.length > 0
      ? Math.round(analyticsState.latencyHistory.reduce((a, b) => a + b, 0) / analyticsState.latencyHistory.length)
      : null;

  const totalConnected = Math.max(activeSseClientsCount + activeWsClientsCount, externalWsClientCount);

  return {
    activeUsersOnline: totalConnected,
    activeUsers: totalConnected,
    totalConversionsToday: analyticsState.totalConversionsToday,
    successfulConversions: analyticsState.successfulConversions,
    failedConversions: analyticsState.failedConversions,
    cancelledProcesses: analyticsState.cancelledProcesses,
    serverLoadMs: avgLatency,
    processingSpeed: avgLatency,
    successRatePercent: successRate,
    successRate,
    timestamp: new Date().toISOString(),
  };
}

export function getToolAnalyticsSummary(): {
  counts: Record<string, number>;
  breakdown: Record<string, ToolAnalyticsCounter>;
} {
  const counts: Record<string, number> = {};
  for (const [toolId, entry] of Object.entries(analyticsState.toolCounters)) {
    counts[toolId] = entry.completed;
  }
  return {
    counts,
    breakdown: { ...analyticsState.toolCounters },
  };
}

export function broadcastLiveMetrics(): void {
  const metrics = calculateLiveMetrics();

  const ssePayload = `data: ${JSON.stringify(metrics)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(ssePayload);
    } catch {
      sseClients.delete(client);
    }
  }

  const wsPayload = JSON.stringify({ type: "metrics", data: metrics });
  for (const client of wsClients) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(wsPayload);
      }
    } catch {
      wsClients.delete(client);
    }
  }
}

export function recordConversionMetric(params: {
  latencyMs: number;
  success: boolean;
  toolId?: string;
  eventId?: string;
}): { recorded: boolean; deduplicated: boolean; metrics: LiveAnalyticsMetrics } {
  ensureCurrentDay();
  const eventId = params.eventId ? String(params.eventId).trim() : "";
  if (eventId && !markEventId(eventId)) {
    return { recorded: false, deduplicated: true, metrics: calculateLiveMetrics() };
  }

  if (params.success) {
    analyticsState.totalConversionsToday++;
    analyticsState.successfulConversions++;
  } else {
    analyticsState.failedConversions++;
  }

  const safeLatency = Math.min(300000, Math.max(1, Math.round(params.latencyMs)));
  analyticsState.latencyHistory.push(safeLatency);
  if (analyticsState.latencyHistory.length > MAX_LATENCY_SAMPLES) {
    analyticsState.latencyHistory.shift();
  }

  if (params.toolId) {
    const counter = ensureToolCounter(params.toolId);
    if (params.success) counter.completed++;
    else counter.failed++;
    counter.lastUpdatedAt = new Date().toISOString();
  }

  saveAnalyticsState();
  broadcastLiveMetrics();
  return { recorded: true, deduplicated: false, metrics: calculateLiveMetrics() };
}

export function recordPlatformAnalyticsEvent(params: {
  toolId: string;
  stage: AnalyticsEventStage;
  eventId?: string;
  latencyMs?: number;
  fileExt?: string;
  fileSizeBytes?: number;
  success?: boolean;
}): { recorded: boolean; deduplicated: boolean; metrics: LiveAnalyticsMetrics } {
  ensureCurrentDay();
  const cleanToolId = String(params.toolId || "").trim().slice(0, 80);
  if (!cleanToolId) {
    return { recorded: false, deduplicated: false, metrics: calculateLiveMetrics() };
  }

  const eventId = params.eventId ? String(params.eventId).trim().slice(0, 128) : "";
  if (eventId && !markEventId(eventId)) {
    return { recorded: false, deduplicated: true, metrics: calculateLiveMetrics() };
  }

  const counter = ensureToolCounter(cleanToolId);
  counter.lastUpdatedAt = new Date().toISOString();

  switch (params.stage) {
    case "tool_opened":
      counter.opened++;
      break;
    case "process_started":
      counter.started++;
      break;
    case "process_completed":
      counter.completed++;
      analyticsState.totalConversionsToday++;
      analyticsState.successfulConversions++;
      if (typeof params.latencyMs === "number" && Number.isFinite(params.latencyMs) && params.latencyMs >= 1 && params.latencyMs <= 300000) {
        analyticsState.latencyHistory.push(Math.round(params.latencyMs));
        if (analyticsState.latencyHistory.length > MAX_LATENCY_SAMPLES) {
          analyticsState.latencyHistory.shift();
        }
      }
      break;
    case "output_validated":
      counter.validated++;
      break;
    case "download_initiated":
      counter.downloaded++;
      break;
    case "process_failed":
      counter.failed++;
      analyticsState.failedConversions++;
      break;
    case "process_cancelled":
      counter.cancelled++;
      analyticsState.cancelledProcesses++;
      break;
  }

  saveAnalyticsState();
  broadcastLiveMetrics();
  return { recorded: true, deduplicated: false, metrics: calculateLiveMetrics() };
}

export function resetAnalyticsStateForTests(): void {
  analyticsState = createEmptyState();
  processedEventIdSet.clear();
  saveAnalyticsState();
}

/**
 * Attaches a WebSocket server to the Node HTTP server on /ws/analytics
 */
export function setupAnalyticsWebSocket(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("error", (err: any) => {
    console.warn("[Analytics WS Server] Non-fatal WS server warning:", err?.message || err);
  });

  server.on("upgrade", (request, socket, head) => {
    socket.on("error", (err: any) => {
      console.warn("[Analytics WS Socket] Non-fatal socket warning:", err?.message || err);
    });

    try {
      const pathname = request.url ? new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname : "";

      if (pathname === "/ws/analytics" || pathname === "/api/analytics/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    } catch {
      // Ignore malformed upgrade URLs
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    activeWsClientsCount++;
    wsClients.add(ws);

    try {
      ws.send(JSON.stringify({ type: "metrics", data: calculateLiveMetrics() }));
    } catch {
      // ignore
    }

    broadcastLiveMetrics();

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
        } else if (msg.type === "record_conversion") {
          const latencyMs = Number(msg.payload?.latencyMs);
          const success = typeof msg.payload?.success === "boolean" ? msg.payload.success : true;
          if (Number.isFinite(latencyMs) && latencyMs >= 1 && latencyMs <= 300000) {
            recordConversionMetric({
              latencyMs,
              success,
              toolId: typeof msg.payload?.toolId === "string" ? msg.payload.toolId : undefined,
              eventId: typeof msg.payload?.eventId === "string" ? msg.payload.eventId : undefined,
            });
          }
        }
      } catch {
        // ignore invalid payload
      }
    });

    ws.on("close", () => {
      activeWsClientsCount = Math.max(0, activeWsClientsCount - 1);
      wsClients.delete(ws);
      broadcastLiveMetrics();
    });

    ws.on("error", () => {
      activeWsClientsCount = Math.max(0, activeWsClientsCount - 1);
      wsClients.delete(ws);
      broadcastLiveMetrics();
    });
  });

  return wss;
}

// GET /api/analytics/live (SSE Real-Time Stream Endpoint)
router.get("/live", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  activeSseClientsCount++;
  sseClients.add(res);

  res.write(`data: ${JSON.stringify(calculateLiveMetrics())}\n\n`);

  const pinger = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      clearInterval(pinger);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(pinger);
    activeSseClientsCount = Math.max(0, activeSseClientsCount - 1);
    sseClients.delete(res);
    broadcastLiveMetrics();
  });
});

// GET /api/analytics/stats (REST Snapshot Endpoint)
router.get("/stats", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    success: true,
    data: calculateLiveMetrics(),
  });
});

// GET /api/analytics/tools (Per-tool genuine analytics counts)
router.get("/tools", (_req: Request, res: Response) => {
  res.json({
    success: true,
    ...getToolAnalyticsSummary(),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/analytics/event (Idempotent multi-stage analytics instrumentation)
router.post("/event", (req: Request, res: Response) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, error: "Invalid payload: expected JSON object" });
  }
  const { toolId, stage, eventId, latencyMs, fileExt, fileSizeBytes, success } = req.body;
  if (typeof toolId !== "string" || !/^[a-z0-9_-]{2,80}$/i.test(toolId.trim())) {
    return res.status(400).json({ success: false, error: "Invalid toolId" });
  }
  if (!VALID_ANALYTICS_STAGES.has(stage)) {
    return res.status(400).json({ success: false, error: "Invalid analytics stage" });
  }
  if (eventId !== undefined && (typeof eventId !== "string" || eventId.length > 128)) {
    return res.status(400).json({ success: false, error: "Invalid eventId" });
  }
  if (latencyMs !== undefined && (typeof latencyMs !== "number" || !Number.isFinite(latencyMs) || latencyMs < 1 || latencyMs > 300000)) {
    return res.status(400).json({ success: false, error: "Invalid latencyMs" });
  }
  if (fileExt !== undefined && (typeof fileExt !== "string" || !/^[a-z0-9.]{1,16}$/i.test(fileExt))) {
    return res.status(400).json({ success: false, error: "Invalid fileExt" });
  }
  if (fileSizeBytes !== undefined && (typeof fileSizeBytes !== "number" || !Number.isFinite(fileSizeBytes) || fileSizeBytes < 0)) {
    return res.status(400).json({ success: false, error: "Invalid fileSizeBytes" });
  }

  const outcome = recordPlatformAnalyticsEvent({
    toolId: toolId.trim(),
    stage,
    eventId,
    latencyMs,
    fileExt,
    fileSizeBytes,
    success,
  });

  return res.status(200).json({
    success: true,
    recorded: outcome.recorded,
    deduplicated: outcome.deduplicated,
    data: outcome.metrics,
  });
});

// POST /api/analytics/record-conversion (Record Event Endpoint)
router.post("/record-conversion", (req: Request, res: Response) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, error: "Invalid payload: body must be a JSON object" });
  }
  const { latencyMs, success, toolId, eventId } = req.body;
  if (typeof latencyMs !== "number" || !Number.isFinite(latencyMs) || latencyMs < 1 || latencyMs > 300000) {
    return res.status(400).json({
      success: false,
      error: "Invalid payload: latencyMs must be a finite number between 1 and 300,000",
    });
  }
  if (typeof success !== "boolean") {
    return res.status(400).json({ success: false, error: "Invalid payload: success must be a boolean" });
  }

  const outcome = recordConversionMetric({
    latencyMs,
    success,
    toolId: typeof toolId === "string" ? toolId : undefined,
    eventId: typeof eventId === "string" ? eventId : undefined,
  });

  return res.json({
    status: "ok",
    success: true,
    recorded: outcome.recorded,
    deduplicated: outcome.deduplicated,
    currentStats: outcome.metrics,
  });
});

export default router;
export { router as analyticsRouter };
