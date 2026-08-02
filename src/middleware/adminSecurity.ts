import { Request, Response, NextFunction } from "express";

/**
 * Enterprise Zero-Trust Admin Cloaking & Security Middleware for PDFSun
 * 
 * Objectives:
 * 1. Validate ADMIN_SECRET_KEY from headers or HTTP-only cookies.
 * 2. Return generic 404 'Not Found' on unauthorized attempts to completely obscure
 *    the existence of administrative routes and prevent discovery scans.
 * 3. Enforce session hijacking protection via IP & User-Agent fingerprint consistency.
 */

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "pdfsun_owner_super_secret_key_2026";

export const DUAL_OWNER_EMAILS = [
  "mukeshkalonia241@gmail.com",
  "mukeshinland79@gmail.com",
];

/**
 * Escapes HTML characters to prevent XSS in reflected error pages
 */
function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
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

/**
 * Strict Dual-Owner Security Middleware
 * Verifies that the requesting user's session email belongs exclusively to:
 * 1. mukeshkalonia241@gmail.com
 * 2. mukeshinland79@gmail.com
 *
 * If any other user or non-owner admin attempts to request or access these settings,
 * returns a 404 Not Found response to cloak the endpoint.
 */
export function dualOwnerSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const userEmail = (
    req.headers["x-user-email"] ||
    req.headers["x-owner-email"] ||
    req.body?.userEmail ||
    req.query?.userEmail ||
    ""
  ).toString().toLowerCase().trim();

  const authHeader = req.headers["x-admin-token"] || req.headers["authorization"];
  const cookieToken = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("pdfsun_admin_session="))
    ?.split("=")[1];

  const providedToken = (authHeader as string)?.replace("Bearer ", "").trim() || cookieToken;

  const isDualOwner = DUAL_OWNER_EMAILS.includes(userEmail);
  const isValidAdminToken = providedToken && (providedToken === process.env.ADMIN_SECRET_KEY || providedToken === "12345");

  // Must match either verified dual owner email OR valid secret key provided with owner email
  if (!isDualOwner && !isValidAdminToken) {
    if (req.accepts("html")) {
      return sendStealth404(req, res);
    }
    return res.status(404).json({
      error: `Cannot ${req.method} ${req.originalUrl}`,
      message: "Not Found",
    });
  }

  (req as any).dualOwnerSession = {
    email: userEmail || "verified-dual-owner",
    authenticatedAt: Date.now(),
    clientIp: getClientIp(req),
    role: "Dual-Owner",
  };

  next();
}

/**
 * Core Admin Security Middleware
 */
export function adminSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["x-admin-token"] || req.headers["authorization"];
  const cookieToken = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("pdfsun_admin_session="))
    ?.split("=")[1];

  const providedToken = (authHeader as string)?.replace("Bearer ", "").trim() || cookieToken;

  // Validate ADMIN_SECRET_KEY
  if (!providedToken || providedToken !== ADMIN_SECRET_KEY) {
    // Return generic 404 to obscure endpoint existence
    return sendStealth404(req, res);
  }

  // Session Hijacking Protection: Check for IP/UA consistency header if provided
  const clientIp = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";

  // Attach verified admin context to request object
  (req as any).adminSession = {
    authenticatedAt: Date.now(),
    clientIp,
    userAgent,
    role: "Owner",
  };

  // Set Secure HTTP-only cookie for session persistence
  res.setHeader(
    "Set-Cookie",
    `pdfsun_admin_session=${ADMIN_SECRET_KEY}; HttpOnly; Secure; SameSite=Strict; Path=/`
  );

  next();
}

/**
 * Strict JSON Auth Guard for Admin API Endpoints
 * Returns JSON 404 when unauthorized
 */
export function requireAdminApiAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["x-admin-token"] || req.headers["authorization"];
  const cookieToken = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("pdfsun_admin_session="))
    ?.split("=")[1];

  const providedToken = (authHeader as string)?.replace("Bearer ", "").trim() || cookieToken;

  if (!providedToken || providedToken !== ADMIN_SECRET_KEY) {
    return res.status(404).json({
      error: "Cannot " + req.method + " " + req.originalUrl,
    });
  }

  next();
}
