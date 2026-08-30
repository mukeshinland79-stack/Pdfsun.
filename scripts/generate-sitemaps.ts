import fs from "fs";
import path from "path";
import { ALL_TOOLS } from "../src/data/toolsData.js";
import { POPULAR_COMPRESS_SIZES, PSEO_LANDING_PAGES } from "../src/data/pSEOData.js";
import { BLOG_POSTS } from "../src/data/blogData.js";

const BASE_URL = "https://www.pdfsun.in";
const today = new Date().toISOString().split("T")[0];

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 1. Generate robots.txt
const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/admin/

Sitemap: https://www.pdfsun.in/sitemap.xml
Sitemap: https://www.pdfsun.in/sitemap-compress-sizes.xml
Sitemap: https://www.pdfsun.in/sitemap-pseo.xml
`;

// 2. Generate sitemap-compress-sizes.xml
const compressUrls = POPULAR_COMPRESS_SIZES.map((size) => {
  return `  <url>
    <loc>${BASE_URL}/compress-pdf-to-${size}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
}).join("\n");

const sitemapCompressXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${compressUrls}
</urlset>`;

// 3. Generate sitemap-pseo.xml
const pseoUrls = PSEO_LANDING_PAGES.map((page) => {
  return `  <url>
    <loc>${BASE_URL}/${page.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;
}).join("\n");

const sitemapPseoXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pseoUrls}
</urlset>`;

// 4. Generate master sitemap.xml
const staticPages = [
  { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily" },
  { loc: `${BASE_URL}/pricing`, priority: "0.9", changefreq: "weekly" },
  { loc: `${BASE_URL}/privacy-policy`, priority: "0.5", changefreq: "monthly" },
  { loc: `${BASE_URL}/terms-of-service`, priority: "0.5", changefreq: "monthly" },
  { loc: `${BASE_URL}/about-us`, priority: "0.6", changefreq: "monthly" },
  { loc: `${BASE_URL}/contact-us`, priority: "0.6", changefreq: "monthly" },
  { loc: `${BASE_URL}/today-in-history`, priority: "0.8", changefreq: "daily" },
];

const toolPages = ALL_TOOLS.map((t) => ({
  loc: `${BASE_URL}/${t.slug}`,
  priority: t.isPopular || t.isAi ? "0.9" : "0.8",
  changefreq: t.isPopular ? "daily" : "weekly",
}));

const blogPages = BLOG_POSTS.map((b) => ({
  loc: `${BASE_URL}/blog/${b.slug}`,
  priority: "0.7",
  changefreq: "monthly",
}));

const compressDirectPages = POPULAR_COMPRESS_SIZES.map((s) => ({
  loc: `${BASE_URL}/compress-pdf-to-${s}`,
  priority: "0.9",
  changefreq: "weekly",
}));

const pseoDirectPages = PSEO_LANDING_PAGES.map((p) => ({
  loc: `${BASE_URL}/${p.slug}`,
  priority: "0.85",
  changefreq: "weekly",
}));

const allEntries = [
  ...staticPages,
  ...toolPages,
  ...blogPages,
  ...compressDirectPages,
  ...pseoDirectPages,
];

// Deduplicate by loc
const uniqueEntriesMap = new Map<string, { loc: string; priority: string; changefreq: string }>();
allEntries.forEach((entry) => {
  if (!uniqueEntriesMap.has(entry.loc)) {
    uniqueEntriesMap.set(entry.loc, entry);
  }
});

const sitemapXmlUrls = Array.from(uniqueEntriesMap.values())
  .map(
    (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n");

const sitemapMasterXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapXmlUrls}
</urlset>`;

// Write to public/ and dist/ (if exists)
const targets = [
  path.join(process.cwd(), "public"),
  path.join(process.cwd(), "dist"),
];

targets.forEach((targetDir) => {
  try {
    ensureDir(targetDir);
    fs.writeFileSync(path.join(targetDir, "robots.txt"), robotsTxt, "utf8");
    fs.writeFileSync(path.join(targetDir, "sitemap.xml"), sitemapMasterXml, "utf8");
    fs.writeFileSync(path.join(targetDir, "sitemap-compress-sizes.xml"), sitemapCompressXml, "utf8");
    fs.writeFileSync(path.join(targetDir, "sitemap-pseo.xml"), sitemapPseoXml, "utf8");
    console.log(`[Sitemap Generator] Successfully generated static sitemaps & robots.txt in ${targetDir}`);
  } catch (err) {
    console.error(`Error writing sitemaps to ${targetDir}:`, err);
  }
});
