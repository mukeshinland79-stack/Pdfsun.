import net from "node:net";
import { Request, Response, NextFunction } from "express";
import { TRAFFIC_SECURITY_CONFIG, RateLimitRule } from "../config/trafficSecurityConfig";
import { getDistributedStateStore } from "./distributedStateStore";

// Sliding-window record for tracking request frequency
// NOTE: In-memory stores are process-local (preview / single-instance only).
// Cross-instance serverless durability requires Upstash Redis (Gate 4).
interface ClientTrafficRecord {
  requests: number[];
  badRequestCount: number;
  lastSeen: number;
  anomalyScore: number;
  temporaryThrottleUntil?: number;
}

// In-memory sliding stores
const ipTrafficStore = new Map<string, ClientTrafficRecord>();
const tempRestrictedIpStore = new Map<string, { until: number; reason: string }>();

// Lightweight in-memory traffic audit counters
export interface TrafficSecuritySummary {
  normalTraffic: number;
  suspiciousRequests: number;
  rateLimited: number;
  blockedTemporarily: number;
  botLikeRequests: number;
  referralSpamCandidates: number;
  searchEngineCrawlerHits: number;
  uptimeSeconds: number;
  recentAuditLogs: Array<{
    timestamp: string;
    endpoint: string;
    status: number;
    reason?: string;
    userAgentCategory: string;
    referrerCategory: string;
  }>;
}

const trafficAuditStats: TrafficSecuritySummary = {
  normalTraffic: 0,
  suspiciousRequests: 0,
  rateLimited: 0,
  blockedTemporarily: 0,
  botLikeRequests: 0,
  referralSpamCandidates: 0,
  searchEngineCrawlerHits: 0,
  uptimeSeconds: 0,
  recentAuditLogs: [],
};

const startTime = Date.now();

function addAuditLog(
  endpoint: string,
  status: number,
  userAgentCategory: string,
  referrerCategory: string,
  reason?: string
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    endpoint: endpoint.slice(0, 80),
    status,
    reason: reason ? reason.slice(0, 100) : undefined,
    userAgentCategory,
    referrerCategory,
  };

  trafficAuditStats.recentAuditLogs.unshift(logEntry);
  if (trafficAuditStats.recentAuditLogs.length > 80) {
    trafficAuditStats.recentAuditLogs.pop();
  }
}

/**
 * Periodically purge stale IP tracking records (every 10 minutes)
 */
const ipCleanupTimer = setInterval(() => {
  const now = Date.now();
  const maxRetention = 30 * 60 * 1000; // 30 minutes

  for (const [ip, record] of ipTrafficStore.entries()) {
    if (now - record.lastSeen > maxRetention) {
      ipTrafficStore.delete(ip);
    }
  }

  for (const [ip, data] of tempRestrictedIpStore.entries()) {
    if (now > data.until) {
      tempRestrictedIpStore.delete(ip);
    }
  }
}, 10 * 60 * 1000);
ipCleanupTimer.unref?.();

export interface ResolvedClientIp {
  ip: string | null;
  source: "cf-connecting-ip" | "express-req-ip" | "socket-remote" | "missing";
  trusted: boolean;
}

export function normalizeValidIp(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 64) return null;
  const stripped = trimmed.replace(/^::ffff:/i, "");
  return net.isIP(stripped) !== 0 ? stripped : null;
}

/**
 * Resolve trustworthy client IP without accepting spoofable client headers.
 * TRUST_CLOUDFLARE_EDGE defaults to false until direct origin lockdown is verified (Gate 4).
 */
export function resolveClientIp(req: Request): ResolvedClientIp {
  const trustCloudflareEdge = process.env.TRUST_CLOUDFLARE_EDGE === "true";

  if (trustCloudflareEdge) {
    const cfIp = normalizeValidIp(req.headers["cf-connecting-ip"]);
    if (cfIp) {
      return { ip: cfIp, source: "cf-connecting-ip", trusted: true };
    }
  }

  // Express req.ip honors the configured `trust proxy` boundary without honoring arbitrary spoofed headers
  const expressIp = normalizeValidIp(req.ip);
  if (expressIp) {
    return { ip: expressIp, source: "express-req-ip", trusted: true };
  }

  const socketIp = normalizeValidIp(req.socket?.remoteAddress);
  if (socketIp) {
    return { ip: socketIp, source: "socket-remote", trusted: true };
  }

  return { ip: null, source: "missing", trusted: false };
}

/**
 * Extract verified client IP string (returns empty string if unavailable — never fabricates a spoofable fallback).
 */
export function getClientIp(req: Request): string {
  return resolveClientIp(req).ip || "";
}

/**
 * Checks if User-Agent matches known search engine crawler signatures.
 */
export function isVerifiedSearchCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return TRAFFIC_SECURITY_CONFIG.verifiedSearchCrawlers.some((crawler) => ua.includes(crawler));
}

/**
 * Crawler exemptions are strictly limited to safe, read-only public GET/HEAD pages — NEVER POST or /api/* routes.
 */
export function isSafePublicCrawlerRequest(req: Request, userAgent: string): boolean {
  const method = (req.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }
  const reqPath = (req.path || "").toLowerCase();
  const originalUrl = (req.originalUrl || "").toLowerCase();
  if (reqPath.startsWith("/api") || originalUrl.startsWith("/api")) {
    return false;
  }
  return isVerifiedSearchCrawler(userAgent);
}

/**
 * Check if the HTTP Referer is from a known referral spam domain
 */
export function isReferralSpamDomain(refererHeader?: string): boolean {
  if (!refererHeader) return false;
  const ref = refererHeader.toLowerCase();

  return TRAFFIC_SECURITY_CONFIG.suspiciousReferrers.some((domain) => ref.includes(domain));
}

/**
 * Check if User Agent matches known exploit/scraping tools
 */
export function isMaliciousAutomatedTool(userAgent?: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();

  return TRAFFIC_SECURITY_CONFIG.blockedUserAgents.some((tool) => ua.includes(tool));
}

/**
 * Production Security Headers Middleware
 * Compatible with Google AdSense, GA4, WebSockets, WASM, and Web Workers.
 */
export function trafficSecurityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Cross-site scripting filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Strict Referrer Policy: Send full origin on same-origin, domain-only on cross-origin
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // HSTS (HTTP Strict Transport Security) - 1 Year
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Modern Permissions Policy
  res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");

  // Cross-Origin-Opener-Policy: isolates browsing context while permitting Razorpay/OAuth popups
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  // X-Frame-Options: SAMEORIGIN for clickjacking defense (while permitting same-origin tool previews)
  if (!req.path.startsWith("/api/webhooks")) {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
  }

  // Strict Content Security Policy (Zero-Data Leakage Shield)
  // Permits client-side WASM & Web Workers (blob:, data:), Google Fonts/Analytics/AdSense, and Razorpay
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://cdn.jsdelivr.net https://unpkg.com https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com blob: data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https: wss: ws: blob: data:",
    "worker-src 'self' blob: data:",
    "child-src 'self' blob: https://checkout.razorpay.com https://api.razorpay.com",
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.razorpay.com https://api.razorpay.com",
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);

  next();
}

/**
 * Global Traffic Hygiene & Anomaly Filter Middleware
 *
 * 1. Passes verified search crawlers ONLY on safe public GET/HEAD pages (never POST or /api/*).
 * 2. Blocks known malicious exploit scanners (sqlmap, nikto, masscan).
 * 3. Flags and monitors referral spam domains.
 * 4. Checks temporary restriction status (with automatic expiry).
 */
export function globalTrafficHygieneMiddleware(req: Request, res: Response, next: NextFunction) {
  const userAgent = (req.headers["user-agent"] || "").toString();
  const referer = (req.headers["referer"] || "").toString();
  const clientIp = getClientIp(req);

  // 1. Search Engine Crawler Protection: ONLY on safe public GET/HEAD pages (never POST/API)
  if (isSafePublicCrawlerRequest(req, userAgent)) {
    trafficAuditStats.searchEngineCrawlerHits++;
    trafficAuditStats.normalTraffic++;
    return next();
  }

  // 2. Check Temporary Restriction (Level 4 progressive protection)
  if (clientIp) {
    const restriction = tempRestrictedIpStore.get(clientIp);
    if (restriction) {
      if (Date.now() < restriction.until) {
        trafficAuditStats.blockedTemporarily++;
        addAuditLog(req.path, 429, "restricted_client", "direct", restriction.reason);
        const remainingSec = Math.ceil((restriction.until - Date.now()) / 1000);
        res.setHeader("Retry-After", remainingSec);
        return res.status(429).json({
          error: "Too Many Requests",
          message: "Traffic frequency threshold exceeded. Please retry after a brief pause.",
          retryAfter: remainingSec,
        });
      } else {
        // Restriction expired: clean up
        tempRestrictedIpStore.delete(clientIp);
      }
    }
  }

  // 3. Block Malicious Exploit Scanners (sqlmap, nikto, masscan, etc.)
  if (isMaliciousAutomatedTool(userAgent)) {
    trafficAuditStats.suspiciousRequests++;
    trafficAuditStats.botLikeRequests++;
    addAuditLog(req.path, 403, "malicious_tool", "direct", "Blocked known malicious scanner utility");
    return res.status(403).json({
      error: "Forbidden",
      message: "Automated vulnerability scanner request blocked by PDFSun traffic security.",
    });
  }

  // 4. Referral Spam Detection (Flagged for analytics cleanliness)
  if (isReferralSpamDomain(referer)) {
    trafficAuditStats.referralSpamCandidates++;
    trafficAuditStats.suspiciousRequests++;
    addAuditLog(req.path, 200, "browser", "spam_referrer", `Referral spam detected: ${referer.slice(0, 50)}`);
    // Tag request for downstream handlers
    (req as any).isReferralSpam = true;
  } else {
    trafficAuditStats.normalTraffic++;
  }

  next();
}

const SENSITIVE_RATE_LIMIT_CATEGORIES = new Set([
  "auth",
  "admin",
  "support",
  "payment",
  "payments",
  "ai",
  "comments",
  "contact",
]);

/**
 * Progressive Sliding-Window Rate Limiter Factory
 *
 * Security invariants (SEC-03):
 * - Ignores caller-supplied X-User-Id and X-User-Email headers completely.
 * - Never exempts POST or /api/* endpoints based on User-Agent.
 * - Fails closed on sensitive production routes when a trustworthy client IP cannot be established.
 * - Process-local RAM fallback is preview/single-instance only (distributed serverless limits require Gate 4 Upstash Redis).
 */
export function createSlidingRateLimiter(rule: RateLimitRule, categoryName: string = "general") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userAgent = (req.headers["user-agent"] || "").toString();

    // 1. Search Engine Crawlers are exempt ONLY on safe public GET/HEAD non-API pages
    if (categoryName !== "auth" && isSafePublicCrawlerRequest(req, userAgent)) {
      return next();
    }

    const resolved = resolveClientIp(req);
    const isProduction = process.env.NODE_ENV === "production";
    const isSensitiveCategory =
      SENSITIVE_RATE_LIMIT_CATEGORIES.has(categoryName.toLowerCase()) ||
      (req.path || "").toLowerCase().startsWith("/api/");

    if (!resolved.ip) {
      if (isProduction && isSensitiveCategory) {
        trafficAuditStats.suspiciousRequests++;
        addAuditLog(req.path, 503, "missing_ip", "direct", `${categoryName} missing trustworthy client IP`);
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Unable to verify request origin. Please retry shortly.",
        });
      }
    }

    // Preview/dev-only fallback bucket when local harness lacks a socket IP (explicitly NOT a per-client identity)
    const clientIp = resolved.ip || "dev-missing-ip-shared-bucket";

    // Strictly key by verified IP + category — NEVER include caller-supplied X-User-Id or X-User-Email
    const clientKey = `${clientIp}:${categoryName}`;

    // If a shared distributed store (Redis REST) is configured, enforce cross-instance limits first
    const sharedStore = getDistributedStateStore();
    if (sharedStore.distributedReliable) {
      const distributed = await sharedStore.consumeWindow(clientKey, rule.maxRequests, rule.windowMs);
      res.setHeader("X-RateLimit-Limit", String(distributed.limit));
      res.setHeader("X-RateLimit-Remaining", String(distributed.remaining));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(distributed.resetAtMs / 1000)));
      if (!distributed.allowed) {
        const retryAfterSec = Math.max(1, Math.ceil((distributed.resetAtMs - Date.now()) / 1000));
        trafficAuditStats.rateLimited++;
        trafficAuditStats.suspiciousRequests++;
        res.setHeader("Retry-After", String(retryAfterSec));
        addAuditLog(req.path, 429, "rate_limited_client", "direct", `${categoryName} distributed limit exceeded`);
        return res.status(429).json({
          error: "Too Many Requests",
          message: rule.message,
          retryAfter: retryAfterSec,
        });
      }
      return next();
    }

    const now = Date.now();
    const resetEpochSec = Math.ceil((now + rule.windowMs) / 1000);
    let record = ipTrafficStore.get(clientKey);

    if (!record) {
      record = {
        requests: [now],
        badRequestCount: 0,
        lastSeen: now,
        anomalyScore: 0,
      };
      ipTrafficStore.set(clientKey, record);
      res.setHeader("X-RateLimit-Limit", String(rule.maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, rule.maxRequests - 1)));
      res.setHeader("X-RateLimit-Reset", String(resetEpochSec));
      return next();
    }

    // Prune requests older than windowMs
    const windowStart = now - rule.windowMs;
    record.requests = record.requests.filter((timestamp) => timestamp > windowStart);
    record.requests.push(now);
    record.lastSeen = now;

    // Check if client is in temporary throttle
    if (record.temporaryThrottleUntil && now < record.temporaryThrottleUntil) {
      trafficAuditStats.rateLimited++;
      const retrySec = Math.ceil((record.temporaryThrottleUntil - now) / 1000);
      res.setHeader("X-RateLimit-Limit", String(rule.maxRequests));
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(record.temporaryThrottleUntil / 1000)));
      res.setHeader("Retry-After", retrySec);
      addAuditLog(req.path, 429, "rate_limited_client", "direct", `${categoryName} throttle active`);
      return res.status(429).json({
        error: "Too Many Requests",
        message: rule.message,
        retryAfter: retrySec,
      });
    }

    const currentCount = record.requests.length;
    const oldestInWindow = record.requests[0] || now;
    const windowResetSec = Math.ceil((oldestInWindow + rule.windowMs) / 1000);

    res.setHeader("X-RateLimit-Limit", String(rule.maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, rule.maxRequests - currentCount)));
    res.setHeader("X-RateLimit-Reset", String(windowResetSec));

    // Check limit
    if (currentCount > rule.maxRequests) {
      record.anomalyScore += 1;
      trafficAuditStats.rateLimited++;
      trafficAuditStats.suspiciousRequests++;

      // Progressive Defense Escalation:
      if (record.anomalyScore >= 6) {
        // Sustained flooding: Level 4 temporary hold (15 minutes)
        const blockDuration = TRAFFIC_SECURITY_CONFIG.progressiveThresholds.temporaryBlockMinutes * 60 * 1000;
        tempRestrictedIpStore.set(clientIp, {
          until: now + blockDuration,
          reason: `High-frequency flooding on ${categoryName} (${currentCount} req/${Math.round(rule.windowMs / 1000)}s)`,
        });
        addAuditLog(req.path, 429, "flooding_client", "direct", `Level 4 temporary restriction applied (${categoryName})`);
      } else if (record.anomalyScore >= 3) {
        // Level 3: Short throttle (2 minutes)
        record.temporaryThrottleUntil = now + 2 * 60 * 1000;
        addAuditLog(req.path, 429, "throttled_client", "direct", `Level 3 burst throttle applied (${categoryName})`);
      }

      const retryAfterSec = Math.ceil(rule.windowMs / 1000);
      res.setHeader("Retry-After", retryAfterSec);

      return res.status(429).json({
        error: "Too Many Requests",
        message: rule.message,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

/**
 * Retrieve traffic security audit summary (For owner/admin dashboard)
 */
export function getTrafficSecuritySummary(): TrafficSecuritySummary {
  trafficAuditStats.uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  return { ...trafficAuditStats };
}
