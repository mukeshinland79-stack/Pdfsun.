import type { Request } from "express";

const DEFAULT_SESSION_MAX_AGE_SEC = 7 * 24 * 3600; // 7 days

/**
 * Determines whether authentication and CSRF cookies MUST carry the `Secure` attribute.
 * Always true in production, on Vercel, or when served over HTTPS / TLS-terminating reverse proxies.
 */
export function shouldUseSecureCookies(req?: Partial<Request>): boolean {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return true;
  }

  if (req) {
    if (req.secure) return true;
    const forwardedProto = req.headers?.["x-forwarded-proto"];
    const protoStr = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    if (typeof protoStr === "string" && protoStr.toLowerCase().split(",")[0].trim() === "https") {
      return true;
    }
    const origin = req.headers?.origin;
    if (typeof origin === "string" && origin.toLowerCase().startsWith("https://")) {
      return true;
    }
  }

  return false;
}

export interface BuildSessionCookiesOptions {
  token: string;
  email?: string;
  isOwner?: boolean;
  req?: Partial<Request>;
  includeEmailCookie?: boolean;
  maxAgeSeconds?: number;
}

/**
 * Builds hardened Set-Cookie headers for user and owner/admin sessions:
 * - `pdfsun_user_session`: HttpOnly, SameSite=Lax, Secure (in prod/HTTPS)
 * - `pdfsun_admin_session`: HttpOnly, SameSite=Strict, Secure (in prod/HTTPS) — Owner/Admin only
 * - `pdfsun_user_email` (optional UI hint): SameSite=Lax, Secure (in prod/HTTPS)
 */
export function buildSessionCookies(options: BuildSessionCookiesOptions): string[] {
  const {
    token,
    email,
    isOwner = false,
    req,
    includeEmailCookie = true,
    maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SEC,
  } = options;

  const secureAttr = shouldUseSecureCookies(req) ? "; Secure" : "";
  const encodedToken = encodeURIComponent(token);

  const cookies: string[] = [
    `pdfsun_user_session=${encodedToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secureAttr}`,
  ];

  if (includeEmailCookie && email !== undefined) {
    cookies.push(
      `pdfsun_user_email=${encodeURIComponent(email || "")}; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secureAttr}`
    );
  }

  if (isOwner) {
    cookies.push(
      `pdfsun_admin_session=${encodedToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secureAttr}`
    );
  }

  return cookies;
}

/**
 * Builds hardened Set-Cookie clearing headers matching the attributes used at issuance.
 */
export function buildClearSessionCookies(req?: Partial<Request>): string[] {
  const secureAttr = shouldUseSecureCookies(req) ? "; Secure" : "";
  const expired = "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";

  return [
    `pdfsun_admin_session=; Path=/; ${expired}; HttpOnly; SameSite=Strict${secureAttr}`,
    `pdfsun_user_session=; Path=/; ${expired}; HttpOnly; SameSite=Lax${secureAttr}`,
    `pdfsun_user_email=; Path=/; ${expired}; SameSite=Lax${secureAttr}`,
    `pdfsun_csrf_token=; Path=/; ${expired}; SameSite=Strict${secureAttr}`,
    `session_token=; Path=/; ${expired}; HttpOnly; SameSite=Lax${secureAttr}`,
    `access_token=; Path=/; ${expired}; HttpOnly; SameSite=Lax${secureAttr}`,
    `refresh_token=; Path=/; ${expired}; HttpOnly; SameSite=Lax${secureAttr}`,
    `pdfsun_auth_token=; Path=/; ${expired}; SameSite=Lax${secureAttr}`,
  ];
}

/**
 * Builds a double-submit CSRF cookie readable by same-origin frontend JavaScript
 * and paired with the `x-csrf-token` request header.
 */
export function buildCsrfTokenCookie(csrfToken: string, req?: Partial<Request>): string {
  const secureAttr = shouldUseSecureCookies(req) ? "; Secure" : "";
  return `pdfsun_csrf_token=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Strict; Max-Age=86400${secureAttr}`;
}
