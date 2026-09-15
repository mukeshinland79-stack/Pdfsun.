import { BLOG_POSTS } from "../data/blogData";
import {
  SitemapUrlEntry,
  SitemapStats,
  buildSitemapEntries,
  generateSitemapXml,
  getSitemapStats,
  downloadSitemapFile,
  copySitemapToClipboard,
} from "./sitemapGenerator";

export type { SitemapUrlEntry, SitemapStats };
export {
  buildSitemapEntries,
  generateSitemapXml,
  getSitemapStats,
  downloadSitemapFile,
  copySitemapToClipboard,
};

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
 * Normalizes the base domain URL, defaulting to https://www.pdfsun.in.
 */
export function normalizeBaseUrl(customBaseUrl?: string): string {
  let baseUrl = customBaseUrl?.trim();
  if (
    !baseUrl ||
    baseUrl.includes("localhost") ||
    baseUrl.includes("127.0.0.1") ||
    baseUrl.includes("run.app") ||
    baseUrl.includes("vercel.app")
  ) {
    baseUrl = "https://www.pdfsun.in";
  }
  return baseUrl.replace(/\/+$/, "");
}

/**
 * Builds structured SitemapUrlEntry items for all 10 blog post articles,
 * formatted with canonical clean URLs (/blog/:slug).
 */
export function buildBlogSitemapEntries(customBaseUrl?: string): SitemapUrlEntry[] {
  const baseUrl = normalizeBaseUrl(customBaseUrl);
  const today = new Date().toISOString().split("T")[0];

  const entries: SitemapUrlEntry[] = [
    // Primary Blog Hub Landing Page
    {
      loc: `${baseUrl}/blog`,
      lastmod: today,
      changefreq: "daily",
      priority: "0.9",
      title: "PDFSun Blog - Technical Guides, Security Deep Dives & Tutorials",
      type: "blog",
    },
  ];

  // Dynamic entries for all 10 in-depth blog posts
  BLOG_POSTS.forEach((post) => {
    entries.push({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.lastModified || today,
      changefreq: "weekly",
      priority: "0.8",
      title: `${post.title} | PDFSun Blog`,
      type: "blog",
    });
  });

  return entries;
}

/**
 * Dynamically generates a valid, standard-compliant XML sitemap string
 * specifically for all 10 PDFSun blog post URLs and the main blog hub.
 *
 * Example URLs generated:
 *  - https://www.pdfsun.in/blog
 *  - https://www.pdfsun.in/blog/in-browser-pdf-processing-privacy
 *  - https://www.pdfsun.in/blog/pdf-compression-guide
 *  - https://www.pdfsun.in/blog/client-side-ocr-browser-text-extraction
 *  - https://www.pdfsun.in/blog/how-to-merge-pdfs-free
 *  - https://www.pdfsun.in/blog/protecting-sensitive-legal-financial-pdfs-aes-256
 *  - https://www.pdfsun.in/blog/gemini-ai-pdf-summarizer-guide
 *  - https://www.pdfsun.in/blog/converting-pdf-tables-to-excel-guide
 *  - https://www.pdfsun.in/blog/removing-pdf-metadata-privacy-guide
 *  - https://www.pdfsun.in/blog/ultimate-pdf-productivity-cheat-sheet
 *  - https://www.pdfsun.in/blog/convert-scanned-images-jpg-png-searchable-pdf-pwa
 */
export function generateBlogSitemap(customBaseUrl?: string): string {
  const entries = buildBlogSitemapEntries(customBaseUrl);

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
 * Triggers a browser download of the dedicated blog-sitemap.xml file.
 */
export function downloadBlogSitemapFile(customBaseUrl?: string): void {
  const xmlContent = generateBlogSitemap(customBaseUrl);
  const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "blog-sitemap.xml";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Copies the raw blog sitemap XML text directly to clipboard.
 */
export async function copyBlogSitemapToClipboard(customBaseUrl?: string): Promise<boolean> {
  try {
    const xmlContent = generateBlogSitemap(customBaseUrl);
    await navigator.clipboard.writeText(xmlContent);
    return true;
  } catch (err) {
    console.error("Failed to copy blog sitemap XML to clipboard:", err);
    return false;
  }
}
