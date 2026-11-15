import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { DUAL_OWNER_EMAILS } from "../../types";

// Dynamic JWT Secret resolver: Enforces minimum 256-bit cryptographically secure secret.
// In production (NODE_ENV === "production"), startup strictly fails closed if a valid secret is not configured.
// In development/testing, generates an ephemeral 256-bit random key at boot with security warning.
let ephemeralJwtSecret: string | null = null;
function getEphemeralSecret(): string {
  if (!ephemeralJwtSecret) {
    ephemeralJwtSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "[SECURITY WARN] ADMIN_JWT_SECRET environment variable not configured. Generated ephemeral 256-bit runtime secret for development/testing."
    );
  }
  return ephemeralJwtSecret;
}

export function getJwtSecret(): string {
  const configured = (
    process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET ||
    process.env.OWNER_JWT_SECRET ||
    process.env.ADMIN_SECRET_KEY ||
    ""
  ).trim();

  // Enforce minimum 256-bit (32 characters) length and reject known insecure test defaults
  if (
    configured &&
    configured !== "12345" &&
    configured !== "your_admin_secret_key" &&
    configured !== "PDFSun_Super_Admin_Secret_JWT_Key_2026" &&
    configured.length >= 32
  ) {
    return configured;
  }

  // Fail-closed in production environment per Phase 11D Rule 4
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[FATAL SECURITY ERROR] In production, ADMIN_JWT_SECRET (minimum 256-bit / 32 characters) must be configured in environment or Google Cloud Secret Manager. Ephemeral secret fallback is strictly prohibited in production."
    );
  }

  return getEphemeralSecret();
}

/**
 * Timing-safe, fail-closed validation of the administrative secret key.
 * Strictly rejects missing, placeholder ('your_admin_secret_key'), weak (< 16 chars),
 * or known insecure test tokens ('12345').
 */
export function isValidAdminSecret(providedSecret: string | undefined | null, configuredOverride?: string): boolean {
  if (!providedSecret || typeof providedSecret !== "string") return false;
  const configured = (configuredOverride !== undefined ? configuredOverride : (process.env.ADMIN_SECRET_KEY || "")).trim();
  // Fail-closed against missing, placeholder, weak (< 16 chars), or insecure defaults
  if (!configured || configured === "12345" || configured === "your_admin_secret_key" || configured.length < 16) {
    return false;
  }
  const provTrimmed = providedSecret.trim();
  if (provTrimmed === "12345") return false;

  const provBuf = Buffer.from(provTrimmed);
  const confBuf = Buffer.from(configured);
  if (provBuf.length !== confBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(provBuf, confBuf);
}

/**
 * Validates whether the supplied token or credential proves authentic owner identity.
 * Rejects client-supplied headers without cryptographically verified JWT.
 */
export function isVerifiedOwnerIdentity(providedToken: string | undefined | null): boolean {
  if (!providedToken || typeof providedToken !== "string") return false;
  const decoded = verifyAdminJwtToken(providedToken.trim());
  if (!decoded) return false;
  const email = (decoded.email || "").toLowerCase().trim();
  return decoded.role === "owner" || DUAL_OWNER_EMAILS.includes(email) || email === "mukeshinland79@gmail.com";
}

export interface AdminJwtPayload {
  id?: string;
  email: string;
  role: "admin" | "owner";
  hasAdminAccess: boolean;
  permissions?: Record<string, boolean>;
  iat?: number;
  exp?: number;
}

// Extend Express Request object type definition to include admin user payload
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminJwtPayload;
      isAdminAuthenticated?: boolean;
    }
  }
}

/**
 * Utility helper to issue signed JWT tokens for verified administrators/owners
 */
export function generateAdminJwtToken(payload: Partial<AdminJwtPayload>): string {
  const tokenData: AdminJwtPayload = {
    id: payload.id || "admin_" + Math.random().toString(36).substring(2, 9),
    email: payload.email || "admin@pdfsun.in",
    role: payload.role || "admin",
    hasAdminAccess: true,
    permissions: payload.permissions || {
      analytics: true,
      userManagement: true,
      fileManagement: true,
      adManagement: true,
      websiteSettings: true,
    },
  };

  return jwt.sign(tokenData, getJwtSecret(), { expiresIn: "24h" });
}

/**
 * Utility helper to verify and decode JWT token safely
 */
export function verifyAdminJwtToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AdminJwtPayload;
    if (decoded && (decoded.role === "admin" || decoded.role === "owner" || decoded.hasAdminAccess === true)) {
      return decoded;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Express Middleware: Enforces JWT role validation for all sensitive financial API endpoints and admin routes.
 * Ensures unauthorized or non-admin requests to /api/admin/* receive a 404 response (Stealth mode security).
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // 1. Extract token from Authorization header, custom headers, cookies, or query parameters
    let token: string | null = null;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (typeof req.headers["x-admin-token"] === "string") {
      token = req.headers["x-admin-token"];
    } else if (typeof req.headers["x-access-token"] === "string") {
      token = req.headers["x-access-token"];
    } else if (req.query?.token && typeof req.query.token === "string") {
      token = req.query.token;
    } else if (req.query?.jwt && typeof req.query.jwt === "string") {
      token = req.query.jwt;
    }

    // Direct secret key override check (e.g., dual-owner emergency secret header)
    const secretKeyHeader = req.headers["x-admin-secret"] || req.headers["x-secret-key"] || req.headers["x-admin-token"];
    if (typeof secretKeyHeader === "string" && isValidAdminSecret(secretKeyHeader)) {
      req.isAdminAuthenticated = true;
      req.adminUser = {
        email: "owner@pdfsun.in",
        role: "owner",
        hasAdminAccess: true,
      };
      return next();
    }

    // 2. Validate extracted JWT Token
    if (token) {
      const decodedUser = verifyAdminJwtToken(token);

      if (decodedUser) {
        // Validate email against owner list or explicit admin permissions
        const isOwner = DUAL_OWNER_EMAILS.includes(decodedUser.email.toLowerCase());
        if (isOwner || decodedUser.role === "admin" || decodedUser.role === "owner" || decodedUser.hasAdminAccess) {
          req.isAdminAuthenticated = true;
          req.adminUser = decodedUser;
          return next();
        }
      }
    }

    // 3. Unauthorized or non-admin access: Return 404 response as per security spec
    res.status(404).json({
      error: `Cannot ${req.method} ${req.originalUrl}`,
      status: 404,
      message: "Resource not found",
    });
  } catch (err) {
    console.warn("[AdminAuth] Unexpected error validating admin credentials:", err);
    res.status(404).json({
      error: `Cannot ${req.method} ${req.originalUrl}`,
      status: 404,
      message: "Resource not found",
    });
  }
}

// Named exports and default export for maximum consumer flexibility
export const verifyAdminRole = adminAuth;
export const adminAuthMiddleware = adminAuth;
export default adminAuth;
