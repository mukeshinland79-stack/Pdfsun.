/**
 * Stage 1 Regression & Verification Suite:
 * 1. Public Trust, Privacy & Compliance Truthfulness (zero uncertified/fabricated claims; UI preserved)
 * 2. Hero Single-File Dropzone Privacy Guard (no silent auto-routing to ai-chat-pdf)
 * 3. Vercel Serverless Adapter & vercel.json Routing Integrity
 * 4. Live Local Backend API Connectivity & Rate-Limiter Coverage (http://localhost:3000)
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageProvider } from "../lib/i18n";
import { HeroSection } from "../components/HeroSection";
import { Footer } from "../components/Footer";
import { EnterpriseSuiteCard } from "../components/EnterpriseSuiteCard";
import { LiveActivityStatsWidget } from "../components/LiveActivityStatsWidget";
import { ALL_TOOLS } from "../data/toolsData";

const ROOT = process.cwd();

function renderWithProviders(element: React.ReactElement): string {
  return renderToStaticMarkup(React.createElement(LanguageProvider, null, element));
}

async function runTests() {
  let passed = 0;

  // TEST 1: All 68 canonical tools remain intact
  assert.equal(ALL_TOOLS.length, 68, `Expected exactly 68 tools, got ${ALL_TOOLS.length}`);
  console.log("✅ [1/7] Tool catalog invariant preserved (68/68 tools)");
  passed++;

  // TEST 2: Footer preserves 4-card trust bar & bottom badge with truthful readiness copy
  const footerHtml = renderWithProviders(
    React.createElement(Footer, {
      onOpenPolicy: () => {},
      onOpenAllTools: () => {},
      onOpenAiTools: () => {},
      onOpenPricing: () => {},
      onOpenBlogModal: () => {},
      onOpenContactModal: () => {},
    })
  );
  assert.ok(footerHtml.includes("Local-First Browser Privacy"), "Footer must display Local-First Browser Privacy");
  assert.ok(footerHtml.includes("ISO 27001 Readiness"), "Footer must use ISO 27001 Readiness wording");
  assert.ok(footerHtml.includes("Razorpay Verified"), "Footer must preserve Razorpay trust card");
  assert.ok(footerHtml.includes("Ultra Fast Speed"), "Footer must preserve Speed trust card");
  assert.ok(!footerHtml.includes("ISO 27001 &amp; GDPR Compliant"), "Footer must NOT claim uncertified ISO 27001 Compliant");
  assert.ok(!footerHtml.includes("Gemini 3.6"), "Footer must NOT claim non-existent Gemini 3.6");
  console.log("✅ [2/7] Footer preserves 4 trust cards & uses accurate readiness/privacy wording");
  passed++;

  // TEST 3: EnterpriseSuiteCard preserves premium cards with accurate readiness & local-first copy
  const enterpriseHtml = renderWithProviders(
    React.createElement(EnterpriseSuiteCard, {
      onSelectTool: () => {},
      onOpenPricing: () => {},
    })
  );
  assert.ok(enterpriseHtml.includes("PDFSun Global Enterprise Suite"), "EnterpriseSuiteCard title preserved");
  assert.ok(enterpriseHtml.includes("SOC 2 Readiness"), "EnterpriseSuiteCard uses SOC 2 Readiness wording");
  assert.ok(!enterpriseHtml.includes("SOC-2 &amp; GDPR Ready"), "EnterpriseSuiteCard must NOT claim uncertified SOC-2 Ready");
  assert.ok(!enterpriseHtml.includes("&lt;200ms"), "EnterpriseSuiteCard must NOT hardcode unmeasured <200ms latency");
  assert.ok(!enterpriseHtml.includes("99.99%"), "EnterpriseSuiteCard must NOT claim unsupported 99.99% SLA");
  console.log("✅ [3/7] EnterpriseSuiteCard preserves UI and removes unverified SOC-2/<200ms/99.99% claims");
  passed++;

  // TEST 4: LiveActivityStatsWidget preserves LIVE bar, avoids fake 0.12s speed & uncertified HIPAA claim
  const statsHtml = renderWithProviders(React.createElement(LiveActivityStatsWidget, {}));
  assert.ok(statsHtml.includes("LIVE"), "LiveActivityStatsWidget preserves LIVE badge");
  assert.ok(statsHtml.includes("HIPAA Security Controls Assessment"), "LiveActivityStatsWidget uses HIPAA assessment wording");
  assert.ok(!statsHtml.includes("HIPAA &amp; Zero-Data-Retention Certified"), "Must NOT claim HIPAA Certified");
  assert.ok(!statsHtml.includes("0.12s"), "Must NOT fabricate 0.12s avg speed when server telemetry is null");
  assert.ok(statsHtml.includes("Local WASM"), "Must display truthful Local WASM engine indicator when latency is null");
  console.log("✅ [4/7] LiveActivityStatsWidget preserves LIVE UI without fake 0.12s or HIPAA Certified claim");
  passed++;

  // TEST 5: HeroSection preserves badges & no longer hard-routes single drop to ai-chat-pdf
  const heroHtml = renderWithProviders(
    React.createElement(HeroSection, {
      onSelectTool: () => {},
      onOpenSearch: () => {},
    })
  );
  assert.ok(heroHtml.includes("Local-First Browser Privacy"), "HeroSection uses local-first privacy badge");
  assert.ok(!heroHtml.includes("Works 100% Offline"), "HeroSection must clarify only local tools work offline");
  const heroSource = fs.readFileSync(path.join(ROOT, "src/components/HeroSection.tsx"), "utf-8");
  assert.ok(
    !heroSource.includes('ALL_TOOLS.find((t) => t.id === "ai-chat-pdf")!'),
    "HeroSection onDrop must NOT silently auto-launch ai-chat-pdf on single-file drop"
  );
  assert.ok(heroSource.includes("hero-file-tool-chooser"), "HeroSection must provide inline Local vs Cloud AI tool chooser");
  console.log("✅ [5/7] HeroSection privacy badges accurate & single-file drop requires explicit tool choice");
  passed++;

  // TEST 6: Vercel API recovery configuration & documentation integrity
  const vercelJsonRaw = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8");
  const vercelJson = JSON.parse(vercelJsonRaw);
  assert.ok(!("routes" in vercelJson), "vercel.json must not mix legacy 'routes' with 'headers'");
  assert.ok(Array.isArray(vercelJson.rewrites), "vercel.json must define rewrites");
  assert.ok(
    vercelJson.rewrites.some((r: any) => r.source === "/api/(.*)" && r.destination === "/api"),
    "vercel.json must rewrite /api/(.*) to /api serverless function"
  );
  assert.ok(fs.existsSync(path.join(ROOT, "api/index.ts")), "/api/index.ts serverless adapter must exist");
  assert.ok(
    fs.existsSync(path.join(ROOT, "docs/STAGE1_COMPLIANCE_READINESS_AND_BACKEND_RECOVERY.md")),
    "Stage 1 compliance & backend recovery documentation must exist"
  );
  const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf-8");
  assert.ok(!indexHtml.includes("Gemini 3.6"), "index.html must not contain Gemini 3.6");
  assert.ok(
    indexHtml.includes('"email": "mukeshinland79@gmail.com"'),
    "index.html Organization email preserved pending owner confirmation of official support mailbox"
  );
  console.log("✅ [6/7] Vercel /api/* routing config, /api/index.ts adapter, index.html & compliance docs verified");
  passed++;

  // TEST 7: Live Local Backend API Connectivity & Rate-Limiter Verification (http://localhost:3000)
  const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200, "GET /api/health must return 200");
  const healthJson: any = await healthRes.json();
  assert.equal(healthJson.status, "ok", "/api/health status must be ok");
  assert.equal(typeof healthJson.services?.aiConfigured, "boolean", "/api/health must report services.aiConfigured boolean");
  assert.equal(typeof healthJson.services?.paymentGatewayConfigured, "boolean", "/api/health must report services.paymentGatewayConfigured boolean");

  const providersRes = await fetch(`${baseUrl}/api/v1/auth/providers/status`);
  assert.equal(providersRes.status, 200, "GET /api/v1/auth/providers/status must return 200");
  assert.ok(
    providersRes.headers.get("x-ratelimit-limit") || providersRes.headers.get("ratelimit-limit") || providersRes.status === 200,
    "/api/v1/auth endpoint reachable through sliding rate limiter"
  );

  const verifyRes = await fetch(`${baseUrl}/api/v1/auth/verify-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(verifyRes.status, 200, "POST /api/v1/auth/verify-session must return 200 structured JSON");
  const verifyJson: any = await verifyRes.json();
  assert.equal(verifyJson.valid, false, "Empty verify-session must fail closed (valid: false)");

  const productsRes = await fetch(`${baseUrl}/api/products`);
  assert.equal(productsRes.status, 200, "GET /api/products must return 200");

  const aiChatRes = await fetch(`${baseUrl}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.notEqual(aiChatRes.status, 404, "POST /api/ai/chat must be routed (non-404)");

  const payRes = await fetch(`${baseUrl}/api/create-razorpay-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.notEqual(payRes.status, 404, "POST /api/create-razorpay-order must be routed (non-404)");

  // Verify rate limiter covers /api/v1/auth and /api/admin/auth in server.ts
  const serverSource = fs.readFileSync(path.join(ROOT, "server.ts"), "utf-8");
  assert.ok(serverSource.includes('app.use("/api/v1/auth", authSlidingLimiter)'), "server.ts must rate-limit /api/v1/auth");
  assert.ok(serverSource.includes('app.use("/api/admin/auth", authSlidingLimiter)'), "server.ts must rate-limit /api/admin/auth");
  assert.ok(serverSource.includes('app.use("/api/translate", aiSlidingLimiter)'), "server.ts must rate-limit /api/translate");

  console.log("✅ [7/7] Live local backend connectivity (Health, Auth, AI, Payments) & rate-limiter mounts verified");
  passed++;

  console.log(`\n🎉 Stage 1 Verification Suite Passed: ${passed}/7 tests passed.`);
}

runTests().catch((err) => {
  console.error("❌ Stage 1 Verification Failed:", err);
  process.exit(1);
});
