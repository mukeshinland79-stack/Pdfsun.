import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { parseCookieHeader } from "../cookieUtils";
import { buildCsrfTokenCookie } from "../cookieSecurity";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Webhook endpoints authenticate via cryptographic HMAC signatures (Razorpay/Stripe)
 * rather than browser cookies/Origin headers.
 */
const WEBHOOK_EXEMPT_PATHS = [
  "/api/razorpay-webhook",
  "/api/webhooks/razorpay",
  "/api/webhooks/stripe",
];

function extractOriginFromReferer(referer: string): string | null {
  try {
    const parsed = new URL(referer);
    return parsed.origin;
  } catch {
    return null;
  }
}

function timingSafeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function isTrustedRequestOrigin(origin: string, trustedOrigins: Set<string>, req?: Partial<Request>): boolean {
  if (!origin) return false;
  const normalized = origin.trim();
  if (trustedOrigins.has(normalized)) return true;

  // Allow exact same-host origin (e.g., isolated preview or staging host serving both SPA & API)
  const hostHeader = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (host) {
    try {
      const parsed = new URL(normalized);
      if (parsed.host.toLowerCase() === host.toLowerCase().trim()) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Explicit CSRF & Origin Validation Middleware for state-changing /api/* routes.
 *
 * Defense-in-depth checks:
 * 1. Exempts HMAC-verified payment webhooks.
 * 2. Rejects any state-changing request carrying an untrusted `Origin` header (HTTP 403).
 * 3. Rejects any state-changing request carrying an untrusted `Referer` origin (HTTP 403).
 * 4. Rejects `Sec-Fetch-Site: cross-site` browser requests unless the Origin is explicitly trusted.
 * 5. Enforces double-submit CSRF token validation (`pdfsun_csrf_token` cookie === `x-csrf-token` header)
 *    whenever a browser CSRF cookie is active alongside cookie-based authentication.
 */
export function createCsrfOriginProtectionMiddleware(trustedOrigins: Set<string>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const method = (req.method || "GET").toUpperCase();
    if (!STATE_CHANGING_METHODS.has(method)) {
      return next();
    }

    const fullPath = req.originalUrl ? req.originalUrl.split("?")[0] : req.path;
    if (WEBHOOK_EXEMPT_PATHS.some((exempt) => fullPath === exempt || fullPath.startsWith(`${exempt}/`))) {
      return next();
    }

    const rawOrigin = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
    const rawReferer = typeof req.headers.referer === "string" ? req.headers.referer.trim() : "";
    const secFetchSite = typeof req.headers["sec-fetch-site"] === "string" ? req.headers["sec-fetch-site"].toLowerCase().trim() : "";

    // 1. Explicit Origin check
    if (rawOrigin) {
      if (rawOrigin === "null" || !isTrustedRequestOrigin(rawOrigin, trustedOrigins, req)) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          code: "CSRF_ORIGIN_REJECTED",
          message: "Cross-origin state-changing request blocked by PDFSun CSRF/Origin security policy.",
        });
        return;
      }
    } else if (rawReferer) {
      // 2. Fallback Referer origin validation when Origin header is omitted
      const refererOrigin = extractOriginFromReferer(rawReferer);
      if (!refererOrigin || !isTrustedRequestOrigin(refererOrigin, trustedOrigins, req)) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          code: "CSRF_REFERER_REJECTED",
          message: "Untrusted Referer on state-changing request blocked by security policy.",
        });
        return;
      }
    }

    // 3. Browser Fetch Metadata defense against cross-site form/fetch forgery
    if (secFetchSite === "cross-site" && (!rawOrigin || !isTrustedRequestOrigin(rawOrigin, trustedOrigins, req))) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        code: "CSRF_CROSS_SITE_REJECTED",
        message: "Cross-site browser request blocked by Fetch Metadata CSRF protection.",
      });
      return;
    }

    // 4. Double-submit CSRF cookie/header verification when browser CSRF cookie is issued
    const cookies = parseCookieHeader(req.headers.cookie);
    const csrfCookie = cookies.pdfsun_csrf_token;
    const hasSessionCookie = Boolean(cookies.pdfsun_user_session || cookies.pdfsun_admin_session);
    const hasExplicitBearerAuth =
      typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ");

    if (csrfCookie && hasSessionCookie && !hasExplicitBearerAuth) {
      const csrfHeaderRaw = req.headers["x-csrf-token"];
      const csrfHeader = Array.isArray(csrfHeaderRaw) ? csrfHeaderRaw[0] : csrfHeaderRaw;
      if (!csrfHeader || !timingSafeCompare(String(csrfHeader).trim(), csrfCookie)) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          code: "CSRF_TOKEN_INVALID",
          message: "Missing or invalid CSRF token for cookie-authenticated request.",
        });
        return;
      }
    }

    next();
  };
}

/**
 * Issues a cryptographically random double-submit CSRF token and sets the matching
 * SameSite=Strict cookie so browser clients can attach `x-csrf-token` on mutations.
 */
export function issueCsrfTokenHandler(req: Request, res: Response): void {
  const token = crypto.randomBytes(32).toString("hex");
  res.setHeader("Set-Cookie", buildCsrfTokenCookie(token, req));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    success: true,
    csrfToken: token,
  });
}
