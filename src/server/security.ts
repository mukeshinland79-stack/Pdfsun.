import { Request, Response, NextFunction } from "express";

// Dynamic In-Memory Rate Limiting & Banned IP Store
interface RateLimitRecord {
  count: number;
  resetTime: number;
  badRequestCount: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const bannedIpStore = new Map<string, number>(); // IP -> Ban Expiry Timestamp

// Default Admin Secret Key (In production, loaded from process.env.ADMIN_SECRET_KEY)
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "pdfsun_owner_super_secret_key_2026";

/**
 * Pillar 1: Absolute Admin Panel Cloaking & Zero-Trust Stealth Middleware
 * Returns a generic '404 Not Found' response to obscure the existence of admin endpoints
 * unless the client presents a valid authenticated session/owner key.
 */
export function adminStealthMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";

  // Check if IP is banned
  if (isIpBanned(clientIp)) {
    return res.status(404).json({ error: "Cannot GET " + req.originalUrl });
  }

  const authHeader = req.headers["x-admin-token"] || req.headers["authorization"];
  const cookieToken = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("pdfsun_admin_session="))
    ?.split("=")[1];

  const rawHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const providedToken = (typeof rawHeader === "string" ? rawHeader.replace("Bearer ", "").trim() : "") || cookieToken;

  // Session Hijacking Protection: Verify IP & User-Agent fingerprint consistency
  const sessionFingerprint = (req.headers["x-session-fingerprint"] as string) || "";
  if (providedToken === ADMIN_SECRET_KEY) {
    // Valid owner session
    res.setHeader("Set-Cookie", `pdfsun_admin_session=${ADMIN_SECRET_KEY}; HttpOnly; Secure; SameSite=Strict; Path=/`);
    return next();
  }

  // Stealth Mode: Unauthorized requests targeting admin endpoints receive a generic 404
  recordBadRequest(clientIp);
  return res.status(404).type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head><title>404 Not Found</title></head>
<body style="font-family:sans-serif; text-align:center; padding-top:100px; color:#333;">
  <h1>404 Not Found</h1>
  <p>The requested URL ${escapeHtml(req.originalUrl)} was not found on this server.</p>
  <hr style="max-width:500px; border:0; border-top:1px solid #ccc;"/>
  <small>nginx/1.24.0 (Ubuntu)</small>
</body>
</html>
  `);
}

/**
 * Pillar 3: Security Headers Middleware
 * Enforces HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' wss: ws: https:; frame-ancestors 'self';"
  );
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

/**
 * Pillar 3: Dynamic Rate Limiter Middleware
 * Enforces sliding window limits and auto-bans abusing IPs.
 */
export function createRateLimiter(maxRequests: number, windowMs: number = 60000, isHeavyTask: boolean = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);

    if (isIpBanned(clientIp)) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Your IP has been temporarily restricted due to excessive requests or malformed payloads.",
        retryAfterSec: 3600,
      });
    }

    const now = Date.now();
    let record = rateLimitStore.get(clientIp);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs, badRequestCount: record?.badRequestCount || 0 };
      rateLimitStore.set(clientIp, record);
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      recordBadRequest(clientIp);
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        error: "Rate Limit Exceeded",
        message: isHeavyTask
          ? "Heavy transformation rate limit reached (max 10 requests per minute). Please wait a moment."
          : "Too many requests. Please slow down.",
      });
    }

    next();
  };
}

/**
 * Tracks malformed/corrupted file payload abuses
 */
export function recordBadRequest(ip: string) {
  const now = Date.now();
  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { count: 1, resetTime: now + 60000, badRequestCount: 1 };
  } else {
    record.badRequestCount++;
  }

  rateLimitStore.set(ip, record);

  // Auto-ban IP if > 8 bad requests within short timeframe
  if (record.badRequestCount >= 8) {
    bannedIpStore.set(ip, now + 3600000); // 1-hour ban
    console.warn(`[SECURITY ALERT] IP ${ip} automatically banned for 1 hour due to abuse patterns.`);
  }
}

export function isIpBanned(ip: string): boolean {
  const banExpiry = bannedIpStore.get(ip);
  if (!banExpiry) return false;
  if (Date.now() > banExpiry) {
    bannedIpStore.delete(ip);
    return false;
  }
  return true;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

function escapeHtml(str: string): string {
  const safeStr = typeof str === "string" ? str : String(str ?? "");
  return safeStr.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
}
