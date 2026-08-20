import { ALL_TOOLS } from "../data/toolsData";
import { BLOG_POSTS } from "../data/blogData";

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
  title?: string;
  type?: "core" | "tool" | "blog" | "policy";
}

export interface SitemapStats {
  totalUrls: number;
  toolUrlsCount: number;
  blogUrlsCount: number;
  corePagesCount: number;
  policyPagesCount: number;
  lastGenerated: string;
}

/**
 * Escapes special XML characters to prevent invalid sitemap formatting.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Gets the current date formatted as ISO 8601 (YYYY-MM-DD)
 */
function getIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Scans ALL_TOOLS and existing app structure to build an array of structured SitemapUrlEntry items.
 */
export function buildSitemapEntries(customBaseUrl?: string): SitemapUrlEntry[] {
  let baseUrl = customBaseUrl?.trim();
  if (!baseUrl || baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") || baseUrl.includes("run.app") || baseUrl.includes("vercel.app")) {
    baseUrl = "https://www.pdfsun.in";
  }
  // Strip trailing slash
  baseUrl = baseUrl.replace(/\/+$/, "");

  const today = getIsoDate();
  const entries: SitemapUrlEntry[] = [];

  // 1. Core Platform Landing & Hub Pages
  const corePages = [
    { path: "", priority: "1.0", changefreq: "daily" as const, title: "PDF Sun - Free All-in-One Online PDF & AI Document Suite" },
    { path: "#tools", priority: "0.9", changefreq: "daily" as const, title: "All Online PDF Tools Index" },
    { path: "#ai-workspace", priority: "0.9", changefreq: "daily" as const, title: "Gemini 3.6 AI PDF Assistant & Summarizer" },
    { path: "#pricing", priority: "0.8", changefreq: "weekly" as const, title: "Pricing & Student Pro Plans" },
    { path: "#blog", priority: "0.8", changefreq: "weekly" as const, title: "PDF Tutorials, AI Guides & Productivity Blog" },
    { path: "#faq", priority: "0.7", changefreq: "monthly" as const, title: "Frequently Asked Questions & Security" },
  ];

  corePages.forEach((p) => {
    const fullLoc = p.path ? `${baseUrl}/${p.path}` : `${baseUrl}/`;
    entries.push({
      loc: fullLoc,
      lastmod: today,
      changefreq: p.changefreq,
      priority: p.priority,
      title: p.title,
      type: "core",
    });
  });

  // 2. All PDF Tools (Scanned from ALL_TOOLS)
  ALL_TOOLS.forEach((tool) => {
    // Determine priority based on tool popularity & AI features
    let priority = "0.8";
    if (tool.isPopular) priority = "0.9";
    if (tool.isAi) priority = "0.9";

    const changefreq: "daily" | "weekly" = tool.isPopular ? "daily" : "weekly";

    // Path support both direct query format and SEO route formats
    const fullLoc = `${baseUrl}/?tool=${tool.slug}`;

    entries.push({
      loc: fullLoc,
      lastmod: today,
      changefreq,
      priority,
      title: `${tool.name} - Free Online PDF Tool | PDF Sun`,
      type: "tool",
    });
  });

  // 3. Blog & Tutorial Articles (Scanned from BLOG_POSTS)
  BLOG_POSTS.forEach((post) => {
    entries.push({
      loc: `${baseUrl}/?blog=${post.slug}`,
      lastmod: today,
      changefreq: "monthly",
      priority: "0.7",
      title: `${post.title} | PDF Sun Blog`,
      type: "blog",
    });
  });

  // 4. Policy & Support Pages
  const policyPages = [
    { path: "?modal=privacy", title: "Privacy Policy & Client-Side Encryption Guarantee" },
    { path: "?modal=terms", title: "Terms of Service" },
    { path: "?modal=cookie", title: "Cookie & Local Storage Policy" },
    { path: "?modal=refund", title: "Refund Policy & Guarantees" },
    { path: "?modal=about", title: "About PDFSun & Mission" },
    { path: "?modal=contact", title: "Contact Support & Help Center" },
  ];

  policyPages.forEach((pol) => {
    entries.push({
      loc: `${baseUrl}/${pol.path}`,
      lastmod: today,
      changefreq: "monthly",
      priority: "0.5",
      title: `${pol.title} | PDFSun`,
      type: "policy",
    });
  });

  return entries;
}

/**
 * Generates the complete, standard-compliant sitemap.xml string.
 */
export function generateSitemapXml(customBaseUrl?: string): string {
  const entries = buildSitemapEntries(customBaseUrl);

  const xmlLines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`,
  ];

  entries.forEach((item) => {
    xmlLines.push(`  <url>`);
    xmlLines.push(`    <loc>${escapeXml(item.loc)}</loc>`);
    xmlLines.push(`    <lastmod>${item.lastmod}</lastmod>`);
    xmlLines.push(`    <changefreq>${item.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${item.priority}</priority>`);
    xmlLines.push(`  </url>`);
  });

  xmlLines.push(`</urlset>`);

  return xmlLines.join("\n");
}

/**
 * Returns breakdown statistics for the generated sitemap.
 */
export function getSitemapStats(customBaseUrl?: string): SitemapStats {
  const entries = buildSitemapEntries(customBaseUrl);
  return {
    totalUrls: entries.length,
    toolUrlsCount: entries.filter((e) => e.type === "tool").length,
    blogUrlsCount: entries.filter((e) => e.type === "blog").length,
    corePagesCount: entries.filter((e) => e.type === "core").length,
    policyPagesCount: entries.filter((e) => e.type === "policy").length,
    lastGenerated: new Date().toLocaleString(),
  };
}

/**
 * Triggers a browser download of the sitemap.xml file.
 */
export function downloadSitemapFile(customBaseUrl?: string): void {
  const xmlContent = generateSitemapXml(customBaseUrl);
  const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "sitemap.xml";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Copies the raw sitemap XML text directly to clipboard.
 */
export async function copySitemapToClipboard(customBaseUrl?: string): Promise<boolean> {
  try {
    const xmlContent = generateSitemapXml(customBaseUrl);
    await navigator.clipboard.writeText(xmlContent);
    return true;
  } catch (err) {
    console.error("Failed to copy sitemap XML to clipboard:", err);
    return false;
  }
}
