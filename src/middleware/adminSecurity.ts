import { Request, Response, NextFunction } from "express";
import {
  isValidAdminSecret,
  isVerifiedOwnerIdentity,
  isRevokedAdminOrSessionTokenAsync,
} from "../server/middleware/adminAuth";
import { DUAL_OWNER_EMAILS } from "../server/ownerIdentity";

/**
 * Enterprise Zero-Trust Admin Cloaking & Security Middleware for PDFSun
 *
 * Objectives:
 * 1. Enforce the single authoritative Sole-Owner policy imported from src/server/ownerIdentity.ts.
 * 2. Validate cryptographically signed Owner JWTs (with mandatory MFA & revocation check)
 *    or timing-safe ADMIN_SECRET_KEY from headers or HTTP-only cookies.
 * 3. Return generic 404 'Not Found' on unauthorized attempts to completely obscure
 *    the existence of administrative routes and prevent discovery scans.
 */

export { DUAL_OWNER_EMAILS };

/**
 * Escapes HTML characters to prevent XSS in reflected error pages
 */
function escapeHtml(str: string): string {
  const safeStr = typeof str === "string" ? str : String(str ?? "");
  return safeStr.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
}

/**
 * Generates an obfuscated 404 HTML response mimicking a default web server 404
 */
export function sendStealth404(req: Request, res: Response) {
  res.status(404).type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head><title>404 Not Found</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; text-align:center; padding-top:100px; color:#333; background-color:#fff;">
  <h1 style="font-size:24px; font-weight:600;">404 Not Found</h1>
  <p style="font-size:14px; color:#666;">The requested URL ${escapeHtml(req.originalUrl)} was not found on this server.</p>
  <hr style="max-width:500px; border:0; border-top:1px solid #e2e8f0; margin: 20px auto;"/>
  <small style="color:#94a3b8;">nginx/1.24.0 (Ubuntu)</small>
</body>
</html>
  `);
}

/**
 * Extracts client IP address accurately behind reverse proxies
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

function extractAdminToken(req: Request): string | undefined {
  const authHeader = req.headers["x-admin-token"] || req.headers["authorization"] || req.headers["x-admin-secret"];
  const cookieToken = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("pdfsun_admin_session="))
    ?.split("=")[1];

  const rawHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  return (typeof rawHeader === "string" ? rawHeader.replace("Bearer ", "").trim() : "") || cookieToken;
}

/**
 * Strict Sole-Owner Security Middleware (legacy-compatible export name)
 * Verifies that the requesting user's session proves authentic sole-owner credentials:
 * 1. Verified cryptographic JWT for the sole authoritative owner email (MFA-verified, non-revoked)
 * 2. Timing-safe valid ADMIN_SECRET_KEY
 * Client-supplied email header ALONE cannot establish owner privilege.
 */
export async function dualOwnerSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const providedToken = extractAdminToken(req);

  const isVerifiedJwt = isVerifiedOwnerIdentity(providedToken);
  const revokedInSharedStore = providedToken ? await isRevokedAdminOrSessionTokenAsync(providedToken) : false;
  const isActiveVerifiedJwt = isVerifiedJwt && !revokedInSharedStore;
  const isValidSecret = isValidAdminSecret(providedToken);

  // Must have cryptographically verified sole-owner identity or timing-safe valid secret key
  if (!isActiveVerifiedJwt && !isValidSecret) {
    if (req.accepts("html")) {
      return sendStealth404(req, res);
    }
    return res.status(404).json({
      error: `Cannot ${req.method} ${req.originalUrl}`,
      message: "Not Found",
    });
  }

  (req as any).dualOwnerSession = {
    email: DUAL_OWNER_EMAILS[0],
    authenticatedAt: Date.now(),
    clientIp: getClientIp(req),
    role: "Owner",
  };

  next();
}

/**
 * Core Admin Security Middleware
 */
export async function adminSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const providedToken = extractAdminToken(req);

  const revokedInSharedStore = providedToken ? await isRevokedAdminOrSessionTokenAsync(providedToken) : false;
  const isVerifiedJwt = !revokedInSharedStore && isVerifiedOwnerIdentity(providedToken);
  const isValidSecret = isValidAdminSecret(providedToken);

  if (!isValidSecret && !isVerifiedJwt) {
    return sendStealth404(req, res);
  }

  const clientIp = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";

  (req as any).adminSession = {
    authenticatedAt: Date.now(),
    clientIp,
    userAgent,
    role: "Owner",
  };

  next();
}

/**
 * Strict JSON Auth Guard for Admin API Endpoints
 * Returns JSON 404 when unauthorized
 */
export async function requireAdminApiAuth(req: Request, res: Response, next: NextFunction) {
  const providedToken = extractAdminToken(req);

  const revokedInSharedStore = providedToken ? await isRevokedAdminOrSessionTokenAsync(providedToken) : false;
  const isVerifiedJwt = !revokedInSharedStore && isVerifiedOwnerIdentity(providedToken);
  const isValidSecret = isValidAdminSecret(providedToken);

  if (!isValidSecret && !isVerifiedJwt) {
    return res.status(404).json({
      error: "Cannot " + req.method + " " + req.originalUrl,
    });
  }

  next();
}
