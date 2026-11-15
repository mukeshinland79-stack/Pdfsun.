import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

interface InFlightRequest {
  timestamp: number;
  responseBody?: any;
  statusCode?: number;
  completed: boolean;
}

const activeServerLocks = new Map<string, InFlightRequest>();
const LOCK_TTL_MS = 15000; // 15 seconds max lock TTL

// Periodic garbage collection to remove expired locks
setInterval(() => {
  const now = Date.now();
  activeServerLocks.forEach((lock, key) => {
    if (now - lock.timestamp > LOCK_TTL_MS) {
      activeServerLocks.delete(key);
    }
  });
}, 30000);

/**
 * Express Middleware to enforce backend idempotency and eliminate duplicate API requests
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only guard mutation endpoints (POST, PUT, DELETE, PATCH)
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return next();
  }

  // Retrieve explicit key or construct a deterministic fallback fingerprint
  const headerKey = req.headers["x-idempotency-key"] || req.headers["idempotency-key"];
  let idempotencyKey: string;

  if (headerKey && typeof headerKey === "string") {
    idempotencyKey = headerKey;
  } else {
    // Fingerprint based on route, client IP, and request payload
    const bodyString = req.body ? JSON.stringify(req.body) : "";
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    idempotencyKey = crypto
      .createHash("md5")
      .update(`${req.originalUrl}:${clientIp}:${bodyString}`)
      .digest("hex");
  }

  const existingLock = activeServerLocks.get(idempotencyKey);

  if (existingLock) {
    if (existingLock.completed && existingLock.responseBody) {
      // Replay identical response cleanly
      res.setHeader("X-Cache-Lookup", "HIT-IDEMPOTENT");
      return res.status(existingLock.statusCode || 200).json(existingLock.responseBody);
    }

    // In-flight request currently processing - reject duplicate request
    res.setHeader("Retry-After", "3");
    return res.status(429).json({
      error: "Duplicate Request Suppressed",
      message: "An identical command is currently being executed. Please wait for completion.",
      idempotencyKey,
    });
  }

  // Lock request
  const newLock: InFlightRequest = {
    timestamp: Date.now(),
    completed: false,
  };
  activeServerLocks.set(idempotencyKey, newLock);

  // Hook into res.json / res.send to capture completed response for idempotent replay & release
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    newLock.completed = true;
    newLock.statusCode = res.statusCode;
    newLock.responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    // Keep completed entry for 5 seconds to prevent rapid replay, then purge
    setTimeout(() => {
      activeServerLocks.delete(idempotencyKey);
    }, 5000);
  });

  res.on("close", () => {
    if (!newLock.completed) {
      activeServerLocks.delete(idempotencyKey);
    }
  });

  next();
}
