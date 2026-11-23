/**
 * Server-Only Sole-Owner Identity Authority for PDFSun.in
 *
 * SECURITY BOUNDARY (PII-01 / Phase B.1):
 * - This module MUST ONLY be imported by Node.js/Express server modules.
 * - NEVER import this module into src/types.ts, React components, hooks, or client bundles.
 * - Preserves the canonical Sole Owner identity while keeping personal email literals
 *   strictly off public HTML, SEO metadata, and browser JavaScript bundles.
 */

const DEFAULT_SOLE_OWNER_EMAILS: readonly string[] = ["mukeshinland79@gmail.com"];

function resolveServerOwnerEmails(): readonly string[] {
  const configured =
    typeof process !== "undefined" && typeof process.env?.OWNER_EMAILS === "string"
      ? process.env.OWNER_EMAILS.split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      : [];

  return Object.freeze(
    configured.length > 0 ? Array.from(new Set(configured)) : [...DEFAULT_SOLE_OWNER_EMAILS]
  );
}

export const SERVER_OWNER_EMAILS: readonly string[] = resolveServerOwnerEmails();

/**
 * Server-only compatibility alias for legacy server modules.
 * Never re-export to client bundles.
 */
export const DUAL_OWNER_EMAILS: readonly string[] = SERVER_OWNER_EMAILS;

export const PRIMARY_OWNER_EMAIL: string = SERVER_OWNER_EMAILS[0];

/**
 * Authoritative server-side Sole-Owner allowlist check.
 */
export function isServerOwnerEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.toLowerCase().trim();
  return SERVER_OWNER_EMAILS.includes(clean);
}
