import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { DUAL_OWNER_EMAILS } from "../../types";
import { getDistributedStateStore } from "../distributedStateStore";

// Dynamic JWT Secret resolver: Enforces minimum 256-bit cryptographically secure secret.
// Strictly separated from ADMIN_SECRET_KEY so an admin secret key is never reused as JWT signing material.
// In production (NODE_ENV === "production"), startup/invocation strictly fails closed if a valid secret is not configured.
// In development/testing, generates an ephemeral 256-bit random key at boot with security warning.
let ephemeralJwtSecret: string | null = null;
function getEphemeralSecret(): string {
  if (!ephemeralJwtSecret) {
    ephemeralJwtSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "[SECURITY WARN] ADMIN_JWT_SECRET / JWT_SECRET environment variable not configured. Generated ephemeral 256-bit runtime secret for development/testing."
    );
  }
  return ephemeralJwtSecret;
}

const REVOKED_TOKEN_REGISTRY = new Set<string>();

export function revokeAdminOrSessionToken(token: string): void {
  if (!token) return;
  REVOKED_TOKEN_REGISTRY.add(token);
  if (REVOKED_TOKEN_REGISTRY.size > 10000) {
    const first = REVOKED_TOKEN_REGISTRY.values().next().value;
    if (first) REVOKED_TOKEN_REGISTRY.delete(first);
  }
  // Propagate revocation to shared distributed state store (Redis REST when configured)
  getDistributedStateStore()
    .revokeToken(token)
    .catch((err) => {
      console.warn("[AdminAuth] Distributed token revocation write failed:", err);
    });
}

export function isRevokedAdminOrSessionToken(token: string): boolean {
  return Boolean(token && REVOKED_TOKEN_REGISTRY.has(token));
}

export async function isRevokedAdminOrSessionTokenAsync(token: string): Promise<boolean> {
  if (!token) return false;
  if (REVOKED_TOKEN_REGISTRY.has(token)) return true;
  const store = getDistributedStateStore();
  if (!store.distributedReliable) return false;
  return store.isTokenRevoked(token);
}

export function clearRevokedTokensForTesting(): void {
  REVOKED_TOKEN_REGISTRY.clear();
}

const KNOWN_WEAK_SECRETS = new Set<string>([
  "12345",
  "your_admin_secret_key",
  "pdfsun_super_admin_secret_jwt_key_2026",
  "pdfsun_owner_super_secret_key_2026",
  "replace_with_64_char_random_jwt_secret",
  "replace_with_strong_admin_secret_key",
]);

function isKnownWeakSecret(secret: string): boolean {
  return KNOWN_WEAK_SECRETS.has(secret.trim().toLowerCase());
}

export function getJwtSecret(): string {
  const configured = (
    process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET ||
    process.env.OWNER_JWT_SECRET ||
    ""
  ).trim();

  // Enforce minimum 256-bit (32 characters) length and reject known insecure/placeholder defaults
  if (configured && !isKnownWeakSecret(configured) && configured.length >= 32) {
    return configured;
  }

  // Fail-closed in production environment per Phase 11D Rule 4
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[FATAL SECURITY ERROR] In production, ADMIN_JWT_SECRET or JWT_SECRET (minimum 256-bit / 32 characters) must be configured in environment or Google Cloud Secret Manager. Ephemeral secret fallback is strictly prohibited in production."
    );
  }

  return getEphemeralSecret();
}

/**
 * Validates that production deployments provide distinct, high-entropy JWT and Admin secrets.
 * Fails closed on missing, weak, placeholder, or identical secrets in NODE_ENV === "production".
 */
export function validateProductionAuthSecrets(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  const jwtSecret = getJwtSecret();
  const adminSecret = (process.env.ADMIN_SECRET_KEY || "").trim();

  if (!adminSecret || isKnownWeakSecret(adminSecret) || adminSecret.length < 16) {
    throw new Error(
      "[FATAL SECURITY ERROR] In production, ADMIN_SECRET_KEY (minimum 16 characters, non-placeholder) must be configured."
    );
  }
  if (jwtSecret === adminSecret) {
    throw new Error(
      "[FATAL SECURITY ERROR] ADMIN_JWT_SECRET / JWT_SECRET must be strictly distinct from ADMIN_SECRET_KEY in production."
    );
  }
}

/**
 * Timing-safe, fail-closed validation of the administrative secret key.
 * Strictly rejects missing, placeholder ('your_admin_secret_key'), weak (< 16 chars),
 * or known insecure test tokens ('12345', 'pdfsun_owner_super_secret_key_2026').
 */
export function isValidAdminSecret(providedSecret: string | undefined | null, configuredOverride?: string): boolean {
  if (!providedSecret || typeof providedSecret !== "string") return false;
  const configured = (configuredOverride !== undefined ? configuredOverride : (process.env.ADMIN_SECRET_KEY || "")).trim();
  // Fail-closed against missing, placeholder, weak (< 16 chars), or insecure defaults
  if (!configured || isKnownWeakSecret(configured) || configured.length < 16) {
    return false;
  }
  const provTrimmed = providedSecret.trim();
  if (!provTrimmed || isKnownWeakSecret(provTrimmed)) return false;

  const provBuf = Buffer.from(provTrimmed);
  const confBuf = Buffer.from(configured);
  if (provBuf.length !== confBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(provBuf, confBuf);
}

/**
 * Validates whether the supplied token proves authentic, MFA-verified owner identity.
 * Rejects client-supplied headers and pre-MFA JWTs without mfaVerified === true.
 */
export function isVerifiedOwnerIdentity(providedToken: string | undefined | null): boolean {
  if (!providedToken || typeof providedToken !== "string") return false;
  const decoded = verifyAdminJwtToken(providedToken.trim());
  if (!decoded) return false;
  const email = (decoded.email || "").toLowerCase().trim();
  const isOwner = decoded.role === "owner" && DUAL_OWNER_EMAILS.includes(email);
  return isOwner && decoded.mfaVerified === true;
}

export interface AdminJwtPayload {
  id?: string;
  email: string;
  role: "admin" | "owner";
  hasAdminAccess: boolean;
  mfaVerified?: boolean;
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
    mfaVerified: payload.mfaVerified ?? true,
    permissions: payload.permissions || {
      analytics: true,
      userManagement: true,
      fileManagement: true,
      adManagement: true,
      websiteSettings: true,
    },
  };

  return jwt.sign(tokenData, getJwtSecret(), { expiresIn: "24h", algorithm: "HS256" });
}

/**
 * Utility helper to verify and decode JWT token safely
 */
export function verifyAdminJwtToken(token: string): AdminJwtPayload | null {
  try {
    if (!token || isRevokedAdminOrSessionToken(token)) return null;
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as AdminJwtPayload;
    if (!decoded) return null;
    const email = (decoded.email || "").toLowerCase().trim();
    const isAllowlistedOwner = DUAL_OWNER_EMAILS.includes(email);
    // Reject any token claiming role === "owner" for a non-allowlisted email
    if (decoded.role === "owner" && !isAllowlistedOwner) {
      return null;
    }
    if ((decoded.role === "owner" || isAllowlistedOwner) && decoded.mfaVerified !== true) {
      return null;
    }
    if (decoded.role === "owner" && isAllowlistedOwner) {
      return decoded;
    }
    if (decoded.role === "admin" || decoded.hasAdminAccess === true) {
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
export async function adminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Extract token from Authorization header, custom headers, or HttpOnly cookie (never query parameters)
    let token: string | null = null;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (typeof req.headers["x-admin-token"] === "string") {
      token = req.headers["x-admin-token"].trim();
    } else if (typeof req.headers["x-access-token"] === "string") {
      token = req.headers["x-access-token"].trim();
    } else if (req.headers.cookie) {
      for (const part of String(req.headers.cookie).split(";")) {
        const eqIdx = part.indexOf("=");
        if (eqIdx === -1) continue;
        const key = part.slice(0, eqIdx).trim();
        if (key === "pdfsun_admin_session") {
          try {
            const val = decodeURIComponent(part.slice(eqIdx + 1).trim());
            if (val) {
              token = val;
              break;
            }
          } catch {
            // ignore malformed cookie value
          }
        }
      }
    }

    // Direct secret key override check (for authenticated server-to-server admin headers)
    const secretKeyHeader = req.headers["x-admin-secret"] || req.headers["x-secret-key"] || req.headers["x-admin-token"];
    if (typeof secretKeyHeader === "string" && isValidAdminSecret(secretKeyHeader)) {
      req.isAdminAuthenticated = true;
      req.adminUser = {
        email: DUAL_OWNER_EMAILS[0],
        role: "owner",
        hasAdminAccess: true,
        mfaVerified: true,
      };
      return next();
    }

    // 2. Validate extracted JWT Token (including shared distributed revocation check when Redis is configured)
    if (token) {
      const revokedInSharedStore = await isRevokedAdminOrSessionTokenAsync(token);
      const decodedUser = revokedInSharedStore ? null : verifyAdminJwtToken(token);

      if (decodedUser) {
        const isAllowlistedOwner = DUAL_OWNER_EMAILS.includes((decodedUser.email || "").toLowerCase().trim());
        if (decodedUser.role === "owner") {
          if (isAllowlistedOwner && decodedUser.mfaVerified === true) {
            req.isAdminAuthenticated = true;
            req.adminUser = decodedUser;
            return next();
          }
        } else if (isAllowlistedOwner) {
          if (decodedUser.mfaVerified === true) {
            req.isAdminAuthenticated = true;
            req.adminUser = decodedUser;
            return next();
          }
        } else if (decodedUser.role === "admin" || decodedUser.hasAdminAccess) {
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
