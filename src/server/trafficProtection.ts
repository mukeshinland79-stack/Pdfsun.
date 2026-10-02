import { Request, Response, NextFunction } from "express";
import { TRAFFIC_SECURITY_CONFIG, RateLimitRule } from "../config/trafficSecurityConfig";

// Sliding-window record for tracking request frequency
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
setInterval(() => {
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

/**
 * Extract real client IP behind reverse proxies/Cloudflare
 */
export function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp) {
    return realIp.trim();
  }

  return req.socket.remoteAddress || "127.0.0.1";
}

/**
 * Unconditionally checks if the request is from a legitimate search engine or social crawler
 * (Googlebot, Google-InspectionTool, Bingbot, etc.)
 */
export function isVerifiedSearchCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return TRAFFIC_SECURITY_CONFIG.verifiedSearchCrawlers.some((crawler) => ua.includes(crawler));
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

  // X-Frame-Options: SAMEORIGIN for clickjacking defense (while permitting same-origin tool previews)
  if (!req.path.startsWith("/api/webhooks")) {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
  }

  next();
}

/**
 * Global Traffic Hygiene & Anomaly Filter Middleware
 * 
 * 1. Passes all verified search crawlers immediately (zero friction for Google/Bing indexing).
 * 2. Blocks known malicious exploit scanners (sqlmap, nikto, masscan).
 * 3. Flags and monitors referral spam domains.
 * 4. Checks temporary restriction status (with automatic expiry).
 */
export function globalTrafficHygieneMiddleware(req: Request, res: Response, next: NextFunction) {
  const userAgent = (req.headers["user-agent"] || "").toString();
  const referer = (req.headers["referer"] || "").toString();
  const clientIp = getClientIp(req);

  // 1. Search Engine Crawler Protection: NEVER block or rate-limit legitimate search indexers
  if (isVerifiedSearchCrawler(userAgent)) {
    trafficAuditStats.searchEngineCrawlerHits++;
    trafficAuditStats.normalTraffic++;
    return next();
  }

  // 2. Check Temporary Restriction (Level 4 progressive protection)
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

/**
 * Progressive Sliding-Window Rate Limiter Factory
 * 
 * Protects specific sensitive endpoints with generous human thresholds:
 * - Tracks requests within a sliding millisecond window.
 * - Progressive response:
 *     * Level 1: Normal pass
 *     * Level 2: Soft 429 with Retry-After header
 *     * Level 3: Temporary throttle for burst spam
 *     * Level 4: Temporary IP hold for sustained flooding
 */
export function createSlidingRateLimiter(rule: RateLimitRule, categoryName: string = "general") {
  return (req: Request, res: Response, next: NextFunction) => {
    const userAgent = (req.headers["user-agent"] || "").toString();

    // 1. Search Engine Crawlers are always exempt from rate limits on public pages
    if (isVerifiedSearchCrawler(userAgent) && !req.path.startsWith("/api/auth")) {
      return next();
    }

    const clientIp = getClientIp(req);
    const userIdHeader = (req.headers["x-user-id"] || req.headers["x-user-email"] || "").toString().toLowerCase().trim();
    // Unique key: composite of IP + endpoint category (+ user ID if authenticated)
    const clientKey = userIdHeader ? `${clientIp}:${userIdHeader}:${categoryName}` : `${clientIp}:${categoryName}`;

    const now = Date.now();
    let record = ipTrafficStore.get(clientKey);

    if (!record) {
      record = {
        requests: [now],
        badRequestCount: 0,
        lastSeen: now,
        anomalyScore: 0,
      };
      ipTrafficStore.set(clientKey, record);
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
      res.setHeader("Retry-After", retrySec);
      addAuditLog(req.path, 429, "rate_limited_client", "direct", `${categoryName} throttle active`);
      return res.status(429).json({
        error: "Too Many Requests",
        message: rule.message,
        retryAfter: retrySec,
      });
    }

    const currentCount = record.requests.length;

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
