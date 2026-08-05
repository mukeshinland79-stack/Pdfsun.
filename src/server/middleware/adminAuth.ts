import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { DUAL_OWNER_EMAILS } from "../../types";

// JWT Secret Key configuration with fallback for production runtime
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SECRET_KEY || "PDFSun_Super_Admin_Secret_JWT_Key_2026";

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

  return jwt.sign(tokenData, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Utility helper to verify and decode JWT token safely
 */
export function verifyAdminJwtToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
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
    const secretKeyHeader = req.headers["x-admin-secret"] || req.headers["x-secret-key"];
    const expectedSecret = process.env.ADMIN_SECRET_KEY || "12345";
    if (typeof secretKeyHeader === "string" && secretKeyHeader === expectedSecret) {
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
