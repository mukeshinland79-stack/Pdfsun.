/**
 * Cookie parsing and formatting utilities for server-side request handling.
 * Safely decodes RFC 6265 Cookie headers without throwing on malformed encodings.
 */

export function parseCookieHeader(cookieHeader?: string | string[]): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) {
    return cookies;
  }

  const raw = Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;
  if (!raw.trim()) {
    return cookies;
  }

  const pairs = raw.split(";");
  for (const pair of pairs) {
    const separatorIdx = pair.indexOf("=");
    if (separatorIdx <= 0) continue;

    const key = pair.slice(0, separatorIdx).trim();
    if (!key) continue;

    const rawValue = pair.slice(separatorIdx + 1).trim();
    const unquoted =
      rawValue.length >= 2 && rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue;

    try {
      cookies[key] = decodeURIComponent(unquoted);
    } catch {
      cookies[key] = unquoted;
    }
  }

  return cookies;
}

export interface CookieSerializeOptions {
  maxAgeSec?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions = {}
): string {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || "/"}`);

  if (typeof options.maxAgeSec === "number") {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSec))}`);
  }
  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }
  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}
