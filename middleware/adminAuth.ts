/**
 * Admin Authentication & Session Verification Utility for PDFSun
 * 
 * Validates the existence of the ADMIN_SECRET_KEY and verified session tokens
 * against the current user session to prevent unauthorized execution of administrative actions.
 */

import { UserProfile, DUAL_OWNER_EMAILS } from "../src/types";

export interface AdminSessionValidationResult {
  isValid: boolean;
  isOwner: boolean;
  role: "owner" | "admin" | "unauthorized";
  reason?: string;
  token?: string;
}

export interface AdminSessionVerificationOptions {
  userProfile?: UserProfile | null;
  token?: string | null;
  adminSecretKey?: string | null;
  requireServerVerification?: boolean;
}

function isValidJwtFormat(token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0) && trimmed.length >= 30;
}

function isStrongSecretKey(secret?: string | null): boolean {
  if (!secret || typeof secret !== "string") return false;
  const trimmed = secret.trim();
  return (
    trimmed.length >= 16 &&
    trimmed !== "12345" &&
    trimmed !== "pdfsunPass2026" &&
    trimmed !== "your_admin_secret_key"
  );
}

/**
 * Retrieves the currently active admin token or session secret from browser storage
 */
export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      localStorage.getItem("pdfsun_admin_token") ||
      localStorage.getItem("pdfsun_auth_token") ||
      sessionStorage.getItem("pdfsun_admin_token") ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Retrieves the stored admin secret key (if provided during owner session)
 */
export function getStoredAdminSecretKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const val =
      localStorage.getItem("pdfsun_admin_secret_key") ||
      sessionStorage.getItem("pdfsun_admin_secret_key");
    if (!isStrongSecretKey(val)) return null;
    return val;
  } catch {
    return null;
  }
}

/**
 * Validates whether the current client session appears to hold a real credential
 * (syntactically valid JWT or strong secret key) paired with owner/admin claims.
 * Authoritative access ALWAYS requires verifyAdminSessionWithServer().
 */
export function validateAdminSession(
  userProfile?: UserProfile | null,
  token?: string | null,
  secretKey?: string | null
): AdminSessionValidationResult {
  const activeKey = secretKey || getStoredAdminSecretKey();
  const activeToken = token || getStoredAdminToken();
  const hasJwtCredential = isValidJwtFormat(activeToken);
  const hasSecretCredential = isStrongSecretKey(activeKey);

  // 1. If userProfile is present with an explicit privileged role AND a real credential
  if (userProfile && userProfile.email && (hasJwtCredential || hasSecretCredential)) {
    const normalizedEmail = (userProfile.email || "").toLowerCase().trim();
    const isDualOwner =
      DUAL_OWNER_EMAILS.includes(normalizedEmail) ||
      normalizedEmail === "mukeshinland79@gmail.com";

    const hasExplicitAdminRole =
      userProfile.role === "owner" ||
      (userProfile.role as string) === "admin" ||
      userProfile.hasAdminAccess === true;

    if (isDualOwner && userProfile.role === "owner") {
      return {
        isValid: true,
        isOwner: true,
        role: "owner",
        token: activeToken || activeKey || undefined,
      };
    }

    if (hasExplicitAdminRole) {
      return {
        isValid: true,
        isOwner: userProfile.role === "owner",
        role: userProfile.role === "owner" ? "owner" : "admin",
        token: activeToken || activeKey || undefined,
      };
    }
  }

  // 2. Direct strong secret key (>= 16 chars, non-placeholder)
  if (hasSecretCredential && activeKey) {
    return {
      isValid: true,
      isOwner: true,
      role: "owner",
      token: activeKey,
    };
  }

  return {
    isValid: false,
    isOwner: false,
    role: "unauthorized",
    reason: "Current user session lacks verified administrative credentials.",
  };
}

/**
 * Performs active server-side cryptographic verification against /api/v1/auth/verify-session
 * using HttpOnly cookies, Bearer JWT, or ADMIN_SECRET_KEY. Always fails closed.
 */
export async function verifyAdminSessionWithServer(
  options: AdminSessionVerificationOptions = {}
): Promise<AdminSessionValidationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const token = options.token || getStoredAdminToken() || "";
    const secret = options.adminSecretKey || getStoredAdminSecretKey() || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["x-admin-token"] = token;
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (secret) {
      headers["x-admin-secret"] = secret;
    }

    const res = await fetch("/api/v1/auth/verify-session", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ token: token || undefined }),
      signal: controller.signal,
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const serverRole = String(data?.user?.role || data?.role || "").toLowerCase();
      const hasAdmin =
        data?.valid === true &&
        Boolean(data?.user) &&
        (serverRole === "owner" || serverRole === "admin" || data?.user?.hasAdminAccess === true);

      if (hasAdmin) {
        return {
          isValid: true,
          isOwner: serverRole === "owner",
          role: serverRole === "owner" ? "owner" : "admin",
          token: token || secret || undefined,
        };
      }

      return {
        isValid: false,
        isOwner: false,
        role: "unauthorized",
        reason: data?.error || "Server denied administrative session privileges.",
      };
    }
  } catch {
    // Fail closed on network/timeout errors
  } finally {
    clearTimeout(timeoutId);
  }

  return {
    isValid: false,
    isOwner: false,
    role: "unauthorized",
    reason: "Unable to verify administrative session with server.",
  };
}

/**
 * Checks if a specific admin action (e.g. system config updates, purge, refund) is permitted
 */
export function isAdminActionPermitted(
  userProfile?: UserProfile | null,
  actionName?: string
): boolean {
  const result = validateAdminSession(userProfile);
  if (!result.isValid) return false;

  const ownerOnlyActions = [
    "system-config-reset",
    "emergency-purge",
    "withdraw-funds",
    "toggle-gateway",
    "reveal-account",
  ];

  if (actionName && ownerOnlyActions.includes(actionName)) {
    return result.isOwner;
  }

  return true;
}

export default {
  validateAdminSession,
  verifyAdminSessionWithServer,
  getStoredAdminToken,
  getStoredAdminSecretKey,
  isAdminActionPermitted,
};
