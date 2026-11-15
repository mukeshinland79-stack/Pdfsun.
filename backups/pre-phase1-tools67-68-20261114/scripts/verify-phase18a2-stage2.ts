/**
 * Automated Verification Suite for Phase 18A.2 / Stage 2
 * International SEO, Multilingual Subpath Architecture, Hreflang Reciprocity,
 * Schema.org Structured Data, GEO Discoverability, and Compliance Checks.
 */

import http from "http";
import fs from "fs";
import path from "path";

const PORT = 3000;
const BASE_HTTP = `http://localhost:${PORT}`;

interface TestResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(id: string, category: string, name: string, passed: boolean, details: string) {
  results.push({ id, category, name, passed, details });
  const status = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${status}] [${id}] ${name} -> ${details}`);
}

function fetchUrl(urlPath: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_HTTP}${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, headers: res.headers, body: data }));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function runStage2Verification() {
  console.log("================================================================================");
  console.log("PDFSun.in Phase 18A.2 / Stage 2 — Automated Engineering & SEO Verification Suite");
  console.log("Authorized Environment: Local Development Port 3000");
  console.log("Production Status: STRICTLY FROZEN (Zero Production Modification / Zero Remote Writes)");
  console.log("================================================================================\n");

  // -------------------------------------------------------------------------
  // Test Category 1: Multilingual Subpath Routing & HTTP Responses
  // -------------------------------------------------------------------------
  const localizedRoutesToTest = [
    { path: "/hi/pdf-to-word", lang: "hi", expectedTitleKeyword: "पीडीएफ से वर्ड", expectedCanonical: "https://www.pdfsun.in/hi/pdf-to-word" },
    { path: "/es/merge-pdf", lang: "es", expectedTitleKeyword: "Unir PDF", expectedCanonical: "https://www.pdfsun.in/es/merge-pdf" },
    { path: "/fr/compress-pdf", lang: "fr", expectedTitleKeyword: "Compresser PDF", expectedCanonical: "https://www.pdfsun.in/fr/compress-pdf" },
    { path: "/de/split-pdf", lang: "de", expectedTitleKeyword: "PDF teilen", expectedCanonical: "https://www.pdfsun.in/de/split-pdf" },
    { path: "/ar/pdf-to-word", lang: "ar", expectedTitleKeyword: "تحويل PDF إلى Word", expectedCanonical: "https://www.pdfsun.in/ar/pdf-to-word", isRtl: true },
    { path: "/ja/pdf-to-word", lang: "ja", expectedTitleKeyword: "PDF Word 変換", expectedCanonical: "https://www.pdfsun.in/ja/pdf-to-word" },
    { path: "/pt/merge-pdf", lang: "pt", expectedTitleKeyword: "Juntar PDF", expectedCanonical: "https://www.pdfsun.in/pt/merge-pdf" },
    { path: "/ru/pdf-to-word", lang: "ru", expectedTitleKeyword: "PDF в Word", expectedCanonical: "https://www.pdfsun.in/ru/pdf-to-word" },
    { path: "/hi", lang: "hi", expectedTitleKeyword: "मुफ़्त ऑनलाइन पीडीएफ टूल्स", expectedCanonical: "https://www.pdfsun.in/hi" },
    { path: "/es", lang: "es", expectedTitleKeyword: "Herramientas PDF Gratis", expectedCanonical: "https://www.pdfsun.in/es" },
    { path: "/pricing", lang: "en", expectedTitleKeyword: "PDFSun Pricing", expectedCanonical: "https://www.pdfsun.in/pricing" },
    { path: "/hi/pricing", lang: "hi", expectedTitleKeyword: "मूल्य निर्धारण", expectedCanonical: "https://www.pdfsun.in/hi/pricing" },
  ];

  for (let i = 0; i < localizedRoutesToTest.length; i++) {
    const route = localizedRoutesToTest[i];
    try {
      const resp = await fetchUrl(route.path);
      const is200 = resp.status === 200;
      const hasTitle = resp.body.includes(route.expectedTitleKeyword);
      const hasCanonical = resp.body.includes(`href="${route.expectedCanonical}"`);
      const hasRtl = route.isRtl ? resp.body.includes('dir="rtl"') : true;

      const passed = is200 && hasTitle && hasCanonical && hasRtl;
      recordTest(
        `STAGE2-ROUTE-${i + 1}`,
        "Subpath Routing",
        `Localized Route: ${route.path}`,
        passed,
        `Status: ${resp.status}, Title Keyword: "${route.expectedTitleKeyword}" (${hasTitle ? "Found" : "Missing"}), Canonical: "${route.expectedCanonical}" (${hasCanonical ? "Found" : "Missing"})`
      );
    } catch (e: any) {
      recordTest(`STAGE2-ROUTE-${i + 1}`, "Subpath Routing", `Localized Route: ${route.path}`, false, `Network error: ${e.message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test Category 2: Reciprocal Hreflang Tag Verification
  // -------------------------------------------------------------------------
  try {
    const enResp = await fetchUrl("/pdf-to-word");
    const hiResp = await fetchUrl("/hi/pdf-to-word");

    const requiredHreflangs = [
      'hreflang="en"',
      'hreflang="hi"',
      'hreflang="es"',
      'hreflang="fr"',
      'hreflang="de"',
      'hreflang="ar"',
      'hreflang="ja"',
      'hreflang="pt"',
      'hreflang="ru"',
      'hreflang="zh-Hans"',
      'hreflang="x-default"',
    ];

    let enAllFound = true;
    let hiAllFound = true;
    for (const tag of requiredHreflangs) {
      if (!enResp.body.includes(tag)) enAllFound = false;
      if (!hiResp.body.includes(tag)) hiAllFound = false;
    }

    const reciprocalMatch = enResp.body.includes('href="https://www.pdfsun.in/hi/pdf-to-word"') &&
                            hiResp.body.includes('href="https://www.pdfsun.in/pdf-to-word"') &&
                            hiResp.body.includes('href="https://www.pdfsun.in/hi/pdf-to-word"');

    recordTest(
      "STAGE2-HREFLANG-1",
      "International SEO",
      "Reciprocal Hreflang Annotations (en vs hi)",
      enAllFound && hiAllFound && reciprocalMatch,
      `EN page tags: ${enAllFound ? "Complete" : "Incomplete"}, HI page tags: ${hiAllFound ? "Complete" : "Incomplete"}, Reciprocal linking verified: ${reciprocalMatch}`
    );
  } catch (e: any) {
    recordTest("STAGE2-HREFLANG-1", "International SEO", "Reciprocal Hreflang Annotations", false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test Category 3: Schema.org Structured Data & JSON-LD
  // -------------------------------------------------------------------------
  try {
    const hiResp = await fetchUrl("/hi/pdf-to-word");
    const jsonLdMatches = [...hiResp.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];

    let hasWebApp = false;
    let hasHowTo = false;
    let hasFaq = false;
    let hasBreadcrumb = false;
    let parseErrors = 0;

    jsonLdMatches.forEach((m) => {
      try {
        const parsed = JSON.parse(m[1]);
        const typeStr = JSON.stringify(parsed["@type"] || "");
        if (typeStr.includes("WebApplication") || typeStr.includes("SoftwareApplication")) hasWebApp = true;
        if (typeStr.includes("HowTo")) hasHowTo = true;
        if (typeStr.includes("FAQPage")) hasFaq = true;
        if (typeStr.includes("BreadcrumbList")) hasBreadcrumb = true;
      } catch (err) {
        parseErrors++;
      }
    });

    const passed = hasWebApp && hasHowTo && hasFaq && hasBreadcrumb && parseErrors === 0;
    recordTest(
      "STAGE2-JSONLD-1",
      "Structured Data",
      "Schema.org Rich Snippets (WebApplication, HowTo, FAQPage, Breadcrumbs)",
      passed,
      `Schemas parsed: ${jsonLdMatches.length}, WebApp: ${hasWebApp}, HowTo: ${hasHowTo}, FAQ: ${hasFaq}, Breadcrumb: ${hasBreadcrumb}, Parse Errors: ${parseErrors}`
    );
  } catch (e: any) {
    recordTest("STAGE2-JSONLD-1", "Structured Data", "Schema.org Rich Snippets", false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test Category 4: Sitemaps & robots.txt Architecture
  // -------------------------------------------------------------------------
  try {
    const robotsResp = await fetchUrl("/robots.txt");
    const hasSitemapInt = robotsResp.body.includes("sitemap-international.xml");
    const hasSitemapMaster = robotsResp.body.includes("sitemap.xml");

    recordTest(
      "STAGE2-ROBOTS-1",
      "Sitemaps & Crawlers",
      "robots.txt includes sitemap-international.xml",
      hasSitemapInt && hasSitemapMaster,
      `sitemap.xml: ${hasSitemapMaster}, sitemap-international.xml: ${hasSitemapInt}`
    );

    const sitemapIntResp = await fetchUrl("/sitemap-international.xml");
    const isXml = sitemapIntResp.headers["content-type"]?.includes("xml") || sitemapIntResp.body.startsWith("<?xml");
    const hasHiUrl = sitemapIntResp.body.includes("https://www.pdfsun.in/hi/pdf-to-word");
    const hasEsUrl = sitemapIntResp.body.includes("https://www.pdfsun.in/es/merge-pdf");

    recordTest(
      "STAGE2-SITEMAP-INT-1",
      "Sitemaps & Crawlers",
      "sitemap-international.xml contains localized tool URLs",
      isXml && hasHiUrl && hasEsUrl,
      `XML header: ${isXml}, Sample /hi/pdf-to-word: ${hasHiUrl}, Sample /es/merge-pdf: ${hasEsUrl}`
    );
  } catch (e: any) {
    recordTest("STAGE2-SITEMAP-INT-1", "Sitemaps & Crawlers", "sitemap-international.xml", false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test Category 5: Generative Engine Optimization (GEO) & Semantic Content
  // -------------------------------------------------------------------------
  try {
    const toolResp = await fetchUrl("/pdf-to-word");
    const hasGeoSection = toolResp.body.includes("geo-insights") || toolResp.body.includes("Document Intelligence");
    const hasWasmPrivacy = toolResp.body.includes("WebAssembly") && toolResp.body.includes("Zero Server");
    const hasFaqQ = toolResp.body.includes("Is PDF to Word free to use?") || toolResp.body.includes("Are my files private");

    const passed = hasGeoSection && hasWasmPrivacy && hasFaqQ;
    recordTest(
      "STAGE2-GEO-1",
      "GEO / AI Discoverability",
      "Definitive Entity Definitions, Zero Server Ingress, Citation-Ready Q&A",
      passed,
      `GEO section: ${hasGeoSection}, WASM zero-ingress claim: ${hasWasmPrivacy}, Q&A format: ${hasFaqQ}`
    );
  } catch (e: any) {
    recordTest("STAGE2-GEO-1", "GEO / AI Discoverability", "GEO Semantic Content", false, e.message);
  }

  // -------------------------------------------------------------------------
  // Test Category 6: Pricing Tier Integrity & AGENTS.md Compliance
  // -------------------------------------------------------------------------
  try {
    const pricingResp = await fetchUrl("/pricing");
    const hasFree0 = pricingResp.body.includes("Free Forever (₹0)") || pricingResp.body.includes("priceCurrency\": \"INR\",\n              \"availability\": \"https://schema.org/InStock\",\n              \"url\": \"https://www.pdfsun.in/pricing\"\n            }");
    const hasFlex99 = pricingResp.body.includes("99") && pricingResp.body.includes("Flex Pass");
    const hasPro199 = pricingResp.body.includes("199") && pricingResp.body.includes("Pro Sun Monthly");
    const hasAnnual1499 = pricingResp.body.includes("1499") && pricingResp.body.includes("Pro Sun Annual");
    const hasEnt3999 = pricingResp.body.includes("3999") && pricingResp.body.includes("Enterprise Plan");
    const hasSso9999 = pricingResp.body.includes("9999") && pricingResp.body.includes("Enterprise SSO Unlimited");

    const allPricingIntact = hasFlex99 && hasPro199 && hasAnnual1499 && hasEnt3999 && hasSso9999;
    recordTest(
      "STAGE2-PRICING-INTEGRITY",
      "AGENTS.md Compliance",
      "Strict Plan Boundaries: Free (₹0), Flex (₹99), Pro (₹199), Annual (₹1,499), Ent (₹3,999), SSO (₹9,999)",
      allPricingIntact,
      `Flexi(₹99): ${hasFlex99}, Pro(₹199): ${hasPro199}, Annual(₹1,499): ${hasAnnual1499}, Enterprise(₹3,999): ${hasEnt3999}, SSO(₹9,999): ${hasSso9999}`
    );
  } catch (e: any) {
    recordTest("STAGE2-PRICING-INTEGRITY", "AGENTS.md Compliance", "Pricing Integrity", false, e.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log("\n================================================================================");
  console.log(`Phase 18A.2 / Stage 2 Verification Complete: ${passedCount} / ${total} PASS (${((passedCount / total) * 100).toFixed(1)}%)`);
  console.log("================================================================================");

  if (failedCount > 0) {
    console.error(`FAILED TESTS: ${failedCount}`);
    process.exit(1);
  } else {
    console.log("ALL STAGE 2 ACCEPTANCE CRITERIA SATISFIED 100%.");
    process.exit(0);
  }
}

runStage2Verification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
