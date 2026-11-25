import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { resolveClientIp } from "../trafficProtection";

interface IdempotencyRecord {
  createdAt: number;
  expiresAt: number;
  requestHash: string;
  state: "IN_FLIGHT" | "COMPLETED";
  statusCode?: number;
  contentType?: string;
  responseKind?: "json" | "raw";
  responseBody?: any;
}

const activeServerLocks = new Map<string, IdempotencyRecord>();
const IN_FLIGHT_TTL_MS = 30_000;
const COMPLETED_EXPLICIT_TTL_MS = 60_000;
const COMPLETED_IMPLICIT_TTL_MS = 5_000;
const MAX_CACHE_ENTRIES = 2000;
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9._:-]{1,128}$/;

// Periodic garbage collection to remove expired entries (unref'd so tests/CLI exit cleanly)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of activeServerLocks.entries()) {
    if (now >= entry.expiresAt) {
      activeServerLocks.delete(key);
    }
  }
}, 30_000);
cleanupTimer.unref?.();

export function clearIdempotencyStoreForTesting(): void {
  activeServerLocks.clear();
}

function canonicalizeValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item));
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = canonicalizeValue((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

function computePayloadHash(req: Request): string {
  const hash = crypto.createHash("sha256");
  const rawBody = (req as any).rawBody;
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    hash.update(JSON.stringify(canonicalizeValue(req.body)));
  } else if (Buffer.isBuffer(rawBody)) {
    hash.update(rawBody);
  } else if (typeof req.body === "string") {
    hash.update(req.body);
  } else {
    hash.update("");
  }
  return hash.digest("hex");
}

function resolveVerifiedClientScope(req: Request): string | null {
  const adminId = (req as any).adminUser?.id || (req as any).adminUser?.email;
  if (typeof adminId === "string" && adminId.trim()) {
    return `auth:${adminId.trim().toLowerCase()}`;
  }
  const userId = (req as any).user?.id || (req as any).user?.uid;
  if (typeof userId === "string" && userId.trim()) {
    return `user:${userId.trim().toLowerCase()}`;
  }
  const ipInfo = resolveClientIp(req);
  if (ipInfo.ip) {
    return `ip:${ipInfo.ip}`;
  }
  return null;
}

function normalizeRouteScope(req: Request): string {
  const raw = (req.baseUrl || "") + (req.path || (req.originalUrl || "").split("?")[0] || "/");
  return raw.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
}

function enforceCacheBound(now: number): void {
  if (activeServerLocks.size < MAX_CACHE_ENTRIES) {
    return;
  }
  for (const [key, entry] of activeServerLocks.entries()) {
    if (now >= entry.expiresAt) {
      activeServerLocks.delete(key);
    }
  }
  while (activeServerLocks.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = activeServerLocks.keys().next().value;
    if (!oldestKey) break;
    activeServerLocks.delete(oldestKey);
  }
}

/**
 * Express Middleware to enforce scoped, payload-bound backend idempotency (SEC-04).
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(req.method.toUpperCase())) {
    return next();
  }

  const rawHeader = req.headers["idempotency-key"] ?? req.headers["x-idempotency-key"];
  let explicitKey: string | null = null;

  if (rawHeader !== undefined) {
    if (typeof rawHeader !== "string" || !IDEMPOTENCY_KEY_RE.test(rawHeader.trim())) {
      return res.status(400).json({
        success: false,
        error: "Invalid Idempotency-Key",
        message: "Idempotency-Key must be 1 to 128 characters using letters, numbers, '.', '_', ':', or '-'.",
      });
    }
    explicitKey = rawHeader.trim();
  }

  const clientScope = resolveVerifiedClientScope(req);
  if (!clientScope) {
    if (process.env.NODE_ENV === "production" && explicitKey) {
      return res.status(503).json({
        success: false,
        error: "Client Identity Unavailable",
        message: "Unable to scope idempotent request reliably. Please retry.",
      });
    }
  }

  const effectiveClientScope = clientScope || "dev-missing-client-scope";
  const routeScope = normalizeRouteScope(req);
  const requestHash = computePayloadHash(req);
  const compositeKey = explicitKey
    ? `${req.method.toUpperCase()}:${routeScope}:${effectiveClientScope}:explicit:${explicitKey}`
    : `${req.method.toUpperCase()}:${routeScope}:${effectiveClientScope}:implicit:${requestHash}`;

  const now = Date.now();
  const existing = activeServerLocks.get(compositeKey);

  if (existing && now < existing.expiresAt) {
    // Reuse of same explicit key with a different payload MUST return 409 Conflict
    if (existing.requestHash !== requestHash) {
      return res.status(409).json({
        success: false,
        error: "Idempotency Key Conflict",
        message: "This Idempotency-Key was already used with a different request payload.",
      });
    }

    if (existing.state === "COMPLETED") {
      res.setHeader("Idempotency-Replayed", "true");
      res.setHeader("X-Cache-Lookup", "HIT-IDEMPOTENT");
      if (existing.contentType) {
        res.setHeader("Content-Type", existing.contentType);
      }
      const status = existing.statusCode ?? 200;
      if (existing.responseKind === "json") {
        return res.status(status).json(existing.responseBody);
      }
      return res.status(status).send(existing.responseBody);
    }

    // Deterministic rejection for concurrent identical in-flight requests
    res.setHeader("Retry-After", "1");
    return res.status(409).json({
      success: false,
      error: "Request In Progress",
      message: "An identical request is currently being processed. Please wait briefly before retrying.",
    });
  }

  if (existing && now >= existing.expiresAt) {
    activeServerLocks.delete(compositeKey);
  }

  enforceCacheBound(now);

  const entry: IdempotencyRecord = {
    createdAt: now,
    expiresAt: now + IN_FLIGHT_TTL_MS,
    requestHash,
    state: "IN_FLIGHT",
  };
  activeServerLocks.set(compositeKey, entry);

  const completedTtl = explicitKey ? COMPLETED_EXPLICIT_TTL_MS : COMPLETED_IMPLICIT_TTL_MS;
  let captured = false;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (!captured) {
      captured = true;
      entry.state = "COMPLETED";
      entry.statusCode = res.statusCode;
      entry.contentType = String(res.getHeader("Content-Type") || "application/json; charset=utf-8");
      entry.responseKind = "json";
      entry.responseBody = body;
      entry.expiresAt = Date.now() + completedTtl;
    }
    return originalJson(body);
  };

  const originalSend = res.send.bind(res);
  res.send = (body?: any) => {
    if (!captured) {
      captured = true;
      entry.state = "COMPLETED";
      entry.statusCode = res.statusCode;
      const headerCt = res.getHeader("Content-Type");
      entry.contentType = headerCt ? String(headerCt) : undefined;
      entry.responseKind = "raw";
      entry.responseBody = body;
      entry.expiresAt = Date.now() + completedTtl;
    }
    return originalSend(body);
  };

  res.on("finish", () => {
    if (entry.state === "IN_FLIGHT") {
      entry.state = "COMPLETED";
      entry.statusCode = res.statusCode;
      entry.expiresAt = Date.now() + completedTtl;
    }
  });

  res.on("close", () => {
    if (entry.state !== "COMPLETED") {
      activeServerLocks.delete(compositeKey);
    }
  });

  next();
}

