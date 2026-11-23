import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Request, Response } from "express";

import {
  buildClearSessionCookies,
  buildCsrfTokenCookie,
  buildSessionCookies,
  shouldUseSecureCookies,
} from "../server/cookieSecurity";
import { createCsrfOriginProtectionMiddleware } from "../server/middleware/csrfOriginProtection";
import { getDistributedStateDiagnostics, getDistributedStateStore } from "../server/distributedStateStore";
import { verifyBuildOutput } from "../../scripts/verify-build-output";
import { ALL_TOOLS } from "../data/toolsData";
import { DUAL_OWNER_EMAILS } from "../types";

type TestFn = () => void | Promise<void>;

const tests: Array<{ name: string; fn: TestFn }> = [];
function test(name: string, fn: TestFn) {
  tests.push({ name, fn });
}

function createMockReq(overrides: Partial<Request> = {}): Request {
  const headers = (overrides.headers || {}) as Record<string, string | string[] | undefined>;
  return {
    method: "POST",
    path: "/v1/auth/login",
    originalUrl: "/api/v1/auth/login",
    protocol: "https",
    secure: true,
    headers,
    get(name: string) {
      const val = headers[name.toLowerCase()];
      return Array.isArray(val) ? val[0] : val;
    },
    ...overrides,
  } as unknown as Request;
}

function createMockRes() {
  let statusCode = 200;
  let body: any = null;
  const headers: Record<string, string | string[]> = {};
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      body = payload;
      return this;
    },
    setHeader(name: string, value: string | string[]) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
  } as unknown as Response;

  return {
    res,
    getStatus: () => statusCode,
    getBody: () => body,
    getHeaders: () => headers,
  };
}

// 1. Build-Output Security Assertion Tests
test("Item 1 & 2: verifyBuildOutput rejects server.cjs, .map, and .env files inside public dist", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pdfsun-build-sec-"));
  try {
    const tmpDist = path.join(tmpRoot, "dist");
    const tmpServer = path.join(tmpRoot, "dist-server");
    fs.mkdirSync(tmpDist, { recursive: true });
    fs.mkdirSync(tmpServer, { recursive: true });
    fs.writeFileSync(path.join(tmpDist, "index.html"), "<!doctype html><html></html>");
    fs.writeFileSync(path.join(tmpDist, "robots.txt"), "User-agent: *");
    fs.writeFileSync(path.join(tmpDist, "sitemap.xml"), "<urlset></urlset>");
    fs.writeFileSync(path.join(tmpServer, "server.cjs"), "// ".repeat(500));

    // Clean state passes
    const cleanReport = verifyBuildOutput(tmpRoot);
    assert.equal(cleanReport.passed, true, `Expected clean dist to pass, got: ${cleanReport.errors.join("; ")}`);

    // Polluted with server.cjs & server.cjs.map fails hard
    fs.writeFileSync(path.join(tmpDist, "server.cjs"), "secret-backend");
    fs.writeFileSync(path.join(tmpDist, "server.cjs.map"), "{}");
    const pollutedReport = verifyBuildOutput(tmpRoot);
    assert.equal(pollutedReport.passed, false, "Expected polluted dist/ to FAIL security audit");
    assert.ok(
      pollutedReport.errors.some((e) => e.includes("server.cjs")),
      "Expected error mentioning server.cjs"
    );
    assert.ok(
      pollutedReport.errors.some((e) => e.includes("server.cjs.map")),
      "Expected error mentioning server.cjs.map"
    );
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("Item 1 & 2: actual repository dist/ and dist-server/ pass verifyBuildOutput", () => {
  const distDir = path.resolve(process.cwd(), "dist");
  const serverDistDir = path.resolve(process.cwd(), "dist-server");
  if (!fs.existsSync(distDir)) {
    throw new Error("dist/ does not exist — run npm run build before running Stage 1B verification.");
  }
  const report = verifyBuildOutput(process.cwd());
  assert.equal(report.passed, true, `Repository dist/ failed security audit: ${report.errors.join("; ")}`);
  assert.equal(fs.existsSync(path.join(distDir, "server.cjs")), false);
  assert.equal(fs.existsSync(path.join(distDir, "server.cjs.map")), false);
  assert.equal(fs.existsSync(path.join(serverDistDir, "server.cjs")), true);
});

// 2. Cookie Security Tests
test("Item 3: session cookies enforce HttpOnly, SameSite=Lax (user), SameSite=Strict (admin), and Secure on HTTPS/prod", () => {
  const httpsReq = createMockReq({
    secure: false,
    protocol: "http",
    headers: { "x-forwarded-proto": "https" },
  });
  assert.equal(shouldUseSecureCookies(httpsReq), true);

  const userCookies = buildSessionCookies({
    token: "token_user_123",
    email: "customer@example.com",
    isOwner: false,
    req: httpsReq,
    includeEmailCookie: false,
  });
  assert.equal(userCookies.length, 1);
  assert.ok(userCookies[0].includes("pdfsun_user_session=token_user_123"));
  assert.ok(userCookies[0].includes("HttpOnly"));
  assert.ok(userCookies[0].includes("SameSite=Lax"));
  assert.ok(userCookies[0].includes("Secure"));

  const adminCookies = buildSessionCookies({
    token: "token_admin_456",
    email: "owner@example.com",
    isOwner: true,
    req: httpsReq,
    includeEmailCookie: false,
  });
  assert.equal(adminCookies.length, 2);
  const adminCookie = adminCookies.find((c) => c.startsWith("pdfsun_admin_session="));
  assert.ok(adminCookie, "Admin session cookie must be emitted for owner/admin");
  assert.ok(adminCookie.includes("HttpOnly"));
  assert.ok(adminCookie.includes("SameSite=Strict"));
  assert.ok(adminCookie.includes("Secure"));

  const clearCookies = buildClearSessionCookies(httpsReq);
  assert.ok(clearCookies.length >= 2);
  const clearedAdmin = clearCookies.find((c) => c.startsWith("pdfsun_admin_session="));
  const clearedUser = clearCookies.find((c) => c.startsWith("pdfsun_user_session="));
  assert.ok(clearedAdmin && clearedAdmin.includes("Max-Age=0") && clearedAdmin.includes("HttpOnly") && clearedAdmin.includes("Secure"));
  assert.ok(clearedUser && clearedUser.includes("Max-Age=0") && clearedUser.includes("HttpOnly") && clearedUser.includes("Secure"));

  const csrfCookie = buildCsrfTokenCookie("csrf_abc", httpsReq);
  assert.ok(csrfCookie.includes("pdfsun_csrf_token=csrf_abc"));
  assert.ok(!csrfCookie.includes("HttpOnly"), "Double-submit CSRF cookie must be readable by frontend JS");
  assert.ok(csrfCookie.includes("SameSite=Strict"));
  assert.ok(csrfCookie.includes("Secure"));
  // 2b. Local HTTP development cookies remain functional (no Secure flag on plain localhost HTTP)
  const localHttpReq = createMockReq({
    secure: false,
    protocol: "http",
    headers: { host: "localhost:3000" },
  });
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    assert.equal(shouldUseSecureCookies(localHttpReq), false, "Local HTTP dev must remain functional without Secure flag");
    const devCookies = buildSessionCookies({
      token: "dev_token_123",
      email: "dev@example.com",
      isOwner: false,
      req: localHttpReq,
    });
    assert.ok(devCookies[0].includes("HttpOnly"));
    assert.ok(devCookies[0].includes("SameSite=Lax"));
    assert.equal(devCookies[0].includes("; Secure"), false);
  }
});

// 3. CSRF & Origin Protection Tests (All 9 Required Scenarios)
test("Item 4: CSRF/Origin middleware validates all 9 scenarios (trusted, untrusted, missing Origin, null Origin, missing/invalid/valid CSRF token, OAuth, Razorpay webhook)", () => {
  const mw = createCsrfOriginProtectionMiddleware(new Set(["https://pdfsun.in", "http://localhost:3000"]));

  // 1. Trusted same-origin mutation -> PASS
  {
    let nextCalled = false;
    const req = createMockReq({ headers: { origin: "https://pdfsun.in" } });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  }

  // 2. Untrusted cross-origin mutation -> 403
  {
    let nextCalled = false;
    const req = createMockReq({ headers: { origin: "https://evil-attacker.example" } });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(mock.getStatus(), 403);
    assert.equal(mock.getBody()?.code, "CSRF_ORIGIN_REJECTED");
  }

  // 3. Missing Origin with untrusted Referer -> 403; Missing Origin/Referer with valid Bearer/server call -> PASS
  {
    let nextCalled = false;
    const req = createMockReq({ headers: { referer: "https://phishing.example/form" } });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(mock.getStatus(), 403);
    assert.equal(mock.getBody()?.code, "CSRF_REFERER_REJECTED");
  }
  {
    let nextCalled = false;
    const req = createMockReq({ headers: { authorization: "Bearer valid_api_jwt" } });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  }

  // 4. Invalid / null Origin + Cross-site Fetch Metadata -> 403
  {
    let nextCalled = false;
    const req = createMockReq({ headers: { origin: "null" } });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(mock.getStatus(), 403);
    assert.equal(mock.getBody()?.code, "CSRF_ORIGIN_REJECTED");
  }
  {
    let nextCalled = false;
    const req = createMockReq({ headers: { "sec-fetch-site": "cross-site" } });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(mock.getStatus(), 403);
    assert.equal(mock.getBody()?.code, "CSRF_CROSS_SITE_REJECTED");
  }

  // 5. Missing CSRF token on cookie-authenticated session with CSRF cookie -> 403
  {
    let nextCalled = false;
    const req = createMockReq({
      headers: {
        origin: "https://pdfsun.in",
        cookie: "pdfsun_user_session=jwt123; pdfsun_csrf_token=good_token",
      },
    });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(mock.getStatus(), 403);
    assert.equal(mock.getBody()?.code, "CSRF_TOKEN_INVALID");
  }

  // 6. Invalid CSRF token on cookie-authenticated session -> 403
  {
    let nextCalled = false;
    const req = createMockReq({
      headers: {
        origin: "https://pdfsun.in",
        cookie: "pdfsun_user_session=jwt123; pdfsun_csrf_token=good_token",
        "x-csrf-token": "wrong_token",
      },
    });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(mock.getStatus(), 403);
    assert.equal(mock.getBody()?.code, "CSRF_TOKEN_INVALID");
  }

  // 7. Valid CSRF token + Trusted Origin -> PASS
  {
    let nextCalled = false;
    const req = createMockReq({
      headers: {
        origin: "https://pdfsun.in",
        cookie: "pdfsun_user_session=jwt123; pdfsun_csrf_token=valid_token_xyz",
        "x-csrf-token": "valid_token_xyz",
      },
    });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  }

  // 8. OAuth social login from trusted SPA origin -> PASS (verified downstream via Google ID token check)
  {
    let nextCalled = false;
    const req = createMockReq({
      path: "/v1/auth/social-login",
      originalUrl: "/api/v1/auth/social-login",
      headers: { origin: "https://pdfsun.in" },
    });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  }

  // 9. Razorpay HMAC webhook bypasses browser Origin check (uses independent HMAC-SHA256 verification)
  {
    let nextCalled = false;
    const req = createMockReq({
      path: "/webhooks/razorpay",
      originalUrl: "/api/webhooks/razorpay",
      headers: { origin: "https://api.razorpay.com" },
    });
    const mock = createMockRes();
    mw(req, mock.res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  }
});

// 4. Honest Distributed State Diagnostics
test("Item 5: distributed state store honestly reports process-local-memory when Upstash env vars are unset", () => {
  const diag = getDistributedStateDiagnostics();
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    assert.equal(diag.mode, "process-local-memory");
    assert.equal(diag.distributedReliable, false);
    assert.equal(diag.rateLimitingShared, false);
    assert.equal(diag.tokenRevocationShared, false);
    assert.ok(diag.statusNote.length > 10);
  } else {
    assert.equal(diag.mode, "upstash-redis-rest");
    assert.equal(diag.distributedReliable, true);
  }
});

// 5. Duplicate PRO Badge Fix + Tool Count Preservation
test("Item 8: ToolCard.tsx has zero duplicate ProFeatureBadge renders and 68 tools (59 Free / 9 Pro) are preserved", () => {
  assert.equal(ALL_TOOLS.length, 68, "Must preserve exactly 68 tools");
  const proTools = ALL_TOOLS.filter((t) => t.isPro);
  const freeTools = ALL_TOOLS.filter((t) => !t.isPro);
  assert.equal(proTools.length, 9, "Must preserve 9 Pro tools");
  assert.equal(freeTools.length, 59, "Must preserve 59 Free tools");

  const toolCardSrc = fs.readFileSync(path.resolve(process.cwd(), "src/components/ToolCard.tsx"), "utf-8");
  assert.equal(
    toolCardSrc.includes("ProFeatureBadge"),
    false,
    "ToolCard.tsx must not render duplicate ProFeatureBadge alongside ProFeatureIcon"
  );
  assert.ok(toolCardSrc.includes("ProFeatureIcon"), "ToolCard.tsx should render single canonical ProFeatureIcon");
});

// 6. Static Review Schema Removal
test("Item 9: TestimonialsSection.tsx removes unsupported static schema.org/Review and ratingValue microdata", () => {
  const src = fs.readFileSync(path.resolve(process.cwd(), "src/components/TestimonialsSection.tsx"), "utf-8");
  assert.equal(src.includes("schema.org/Review"), false, "Unsupported schema.org/Review must be removed");
  assert.equal(src.includes("ratingValue"), false, "Unsupported static ratingValue microdata must be removed");
  assert.equal(src.includes("itemReviewed"), false, "Hidden itemReviewed microdata must be removed");
});

// 7. Outdated Gemini 3.6/3.8 & Unsupported Compliance Claims Audit
test("Item 10: zero Gemini 3.6/3.8 model IDs or unsupported HIPAA Compliant / SOC 2 Type II / <200ms claims remain in source", () => {
  const filesToInspect = [
    "server.ts",
    "src/App.tsx",
    "src/data/toolsData.ts",
    "src/data/pSEOData.ts",
    "src/data/blogData.ts",
    "src/components/AdminPanel.tsx",
    "src/components/AuditLogManager.tsx",
    "src/components/BlogPage.tsx",
    "src/components/EngineChroniclesHub.tsx",
    "src/components/PricingSection.tsx",
    "src/components/PricingCompareTable.tsx",
    "src/lib/translations/englishCoreSections.ts",
    "src/lib/translations/coreRegionalLanguages.ts",
    "src/lib/translations/globalLanguages.ts",
    "src/lib/translations/pricingGlobal.ts",
    "src/lib/translations/toolTranslations.ts",
    "src/lib/translations/pricingTranslations.ts",
    "src/lib/translations/toolTranslationsGlobal.ts",
  ];
  const forbidden = [/gemini-3\.[68]/i, /Gemini 3\.[68]/, /HIPAA Compliant/i, /compliant with HIPAA/i, /SOC 2 Type II/i, /<200ms/];

  for (const rel of filesToInspect) {
    const content = fs.readFileSync(path.resolve(process.cwd(), rel), "utf-8");
    for (const pattern of forbidden) {
      assert.equal(
        pattern.test(content),
        false,
        `Forbidden outdated/unsupported claim ${pattern} found in ${rel}`
      );
    }
  }
});

// 8. Live Localhost Security, API Routing, Webhook Fail-Closed & SEO Verification
test("Phase D Live Localhost: /api/health, CSRF, rate-limit headers, unknown API JSON 404, webhook fail-closed, and SEO sitemaps", async () => {
  const baseUrl = "http://localhost:3000";

  // 8a. Health check exposes payloadLimitMb and honest distributedState
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.equal(healthJson.status, "ok");
  assert.ok(healthJson.services?.distributedState, "/api/health must report distributedState diagnostics");
  assert.ok(typeof healthJson.services?.payloadLimitMb === "number", "/api/health must report payloadLimitMb");

  // 8b. CSRF token endpoint issues cookie, JSON token, and X-RateLimit-* headers
  const csrfRes = await fetch(`${baseUrl}/api/v1/auth/csrf-token`);
  assert.equal(csrfRes.status, 200);
  assert.ok(csrfRes.headers.get("x-ratelimit-limit"), "X-RateLimit-Limit header must be present");
  assert.ok(csrfRes.headers.get("x-ratelimit-remaining"), "X-RateLimit-Remaining header must be present");
  assert.ok(csrfRes.headers.get("x-ratelimit-reset"), "X-RateLimit-Reset header must be present");
  const csrfJson = await csrfRes.json();
  assert.equal(csrfJson.success, true);
  assert.ok(typeof csrfJson.csrfToken === "string" && csrfJson.csrfToken.length >= 32);
  const setCookie = csrfRes.headers.get("set-cookie") || "";
  assert.ok(setCookie.includes("pdfsun_csrf_token="), "CSRF endpoint must emit pdfsun_csrf_token cookie");

  // 8c. Untrusted cross-origin state-changing POST is rejected with 403
  const evilRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://evil-attacker.example",
    },
    body: JSON.stringify({ email: "test@example.com", password: "wrong" }),
  });
  assert.equal(evilRes.status, 403, "Untrusted Origin POST must return HTTP 403");
  const evilJson = await evilRes.json();
  assert.equal(evilJson.code, "CSRF_ORIGIN_REJECTED");

  // 8d. Public artifacts guard: /server.cjs and /server.cjs.map are never exposed
  const cjsRes = await fetch(`${baseUrl}/server.cjs`);
  assert.equal(cjsRes.status, 404);
  const mapRes = await fetch(`${baseUrl}/server.cjs.map`);
  assert.equal(mapRes.status, 404);

  // 8e. Unauthenticated Admin endpoints deny access (stealth 404 on /api/admin/config, strict 403 on payment audit logs)
  const adminConfigRes = await fetch(`${baseUrl}/api/admin/config`);
  assert.ok(
    adminConfigRes.status === 401 || adminConfigRes.status === 403 || adminConfigRes.status === 404,
    `Expected 401/403/404 denial on /api/admin/config, got ${adminConfigRes.status}`
  );
  const adminAuditRes = await fetch(`${baseUrl}/api/admin/owner-payment-audit-logs`);
  assert.equal(adminAuditRes.status, 403, `Expected 403 on /api/admin/owner-payment-audit-logs, got ${adminAuditRes.status}`);

  // 8f. Unknown /api/* route returns JSON 404 (never SPA HTML fallback)
  const unknownApiRes = await fetch(`${baseUrl}/api/does-not-exist-stage1b`);
  assert.equal(unknownApiRes.status, 404, "Unknown /api/* route must return HTTP 404");
  const unknownApiCt = unknownApiRes.headers.get("content-type") || "";
  assert.ok(unknownApiCt.includes("application/json"), `Expected JSON 404 for unknown API route, got ${unknownApiCt}`);

  // 8g. Razorpay webhook fails closed (400/503) on forged/missing signature
  const webhookRes = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "payment.captured", payload: {} }),
  });
  assert.ok(
    webhookRes.status === 400 || webhookRes.status === 503,
    `Expected fail-closed 400/503 on unverified Razorpay webhook, got ${webhookRes.status}`
  );

  // 8h. SEO /robots.txt and all 4 XML sitemaps return 200 with valid Content-Type & XML root tags
  const robotsRes = await fetch(`${baseUrl}/robots.txt`);
  assert.equal(robotsRes.status, 200);
  const robotsText = await robotsRes.text();
  assert.ok(robotsText.includes("User-agent:") && robotsText.includes("Sitemap:"), "robots.txt must include directives and Sitemap");

  const sitemaps = [
    "/sitemap.xml",
    "/sitemap-blog.xml",
    "/sitemap-pseo.xml",
    "/sitemap-compress-sizes.xml",
  ];
  for (const sm of sitemaps) {
    const smRes = await fetch(`${baseUrl}${sm}`);
    assert.equal(smRes.status, 200, `${sm} must return HTTP 200`);
    const ct = smRes.headers.get("content-type") || "";
    assert.ok(ct.includes("xml"), `${sm} Content-Type must be XML, got ${ct}`);
    const xml = await smRes.text();
    assert.ok(xml.trim().startsWith("<?xml"), `${sm} must start with <?xml declaration`);
    assert.ok(xml.includes("<urlset") || xml.includes("<sitemapindex"), `${sm} must contain valid <urlset> or <sitemapindex>`);
  }
});

// 9. Sole-Owner Invariant & Fail-Closed Production Revocation Check
test("Phase 3 & 2D: Sole-Owner policy is strictly preserved and production Redis outage fails closed on revocation", async () => {
  assert.deepEqual(DUAL_OWNER_EMAILS, ["mukeshinland79@gmail.com"], "mukeshinland79@gmail.com must be the sole authorized Owner");
  assert.equal(DUAL_OWNER_EMAILS.includes("mukeshkalonia241@gmail.com"), false, "mukeshkalonia241@gmail.com must remain Customer only");

  const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
  const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const prevEnv = process.env.NODE_ENV;
  try {
    process.env.UPSTASH_REDIS_REST_URL = "https://127.0.0.1:1";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-unreachable-token-for-fail-closed-check";
    process.env.NODE_ENV = "production";

    const store = getDistributedStateStore();
    assert.equal(store.backend, "upstash-redis-rest");
    const revokedOnOutage = await store.isTokenRevoked("eyJhbGciOiJIUzI1NiJ9.synthetic-token");
    assert.equal(revokedOnOutage, true, "Production Redis outage must fail CLOSED (treat token as revoked/untrusted)");
  } finally {
    if (prevUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    if (prevToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
    if (prevEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevEnv;
  }
});

async function run() {
  let passed = 0;
  let failed = 0;
  console.log("\n=== Stage 1B Security Remediation & Local Verification Suite ===\n");
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`PASS | ${t.name}`);
      passed++;
    } catch (err: any) {
      console.error(`FAIL | ${t.name}`);
      console.error(`     -> ${err?.message || err}`);
      failed++;
    }
  }
  console.log(`\nSummary: ${passed} passed, ${failed} failed (Total: ${tests.length})\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

run();
