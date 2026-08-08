/**
 * Official PDFSun Production Domain Configuration
 * 
 * Official customer-facing domain: https://pdfsun.in
 * All public share links, QR codes, metadata, Open Graph, and social shares
 * MUST use this canonical origin.
 */

export const OFFICIAL_PRODUCTION_ORIGIN = "https://pdfsun.in";

/**
 * Returns the customer-facing public base URL (https://pdfsun.in).
 */
export function getPublicSiteUrl(): string {
  return OFFICIAL_PRODUCTION_ORIGIN;
}

/**
 * Generates a public share URL using the official production domain (https://pdfsun.in).
 * Example: https://pdfsun.in/d/share_abc123
 */
export function getPublicShareUrl(shareSlug: string): string {
  const cleanSlug = shareSlug.startsWith("/") ? shareSlug.slice(1) : shareSlug;
  if (cleanSlug.startsWith("d/")) {
    return `${OFFICIAL_PRODUCTION_ORIGIN}/${cleanSlug}`;
  }
  return `${OFFICIAL_PRODUCTION_ORIGIN}/d/${cleanSlug}`;
}
