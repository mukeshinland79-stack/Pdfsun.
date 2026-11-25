import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  validateSupportInquiryInput,
  generateSupportTicketId,
  persistSupportInquiryAsync,
  listSupportInquiries,
  SupportStoreCapacityError,
} from "../server/supportStore";
import { evaluatePrivatePath } from "../server/privatePathGuard";
import {
  resolveClientIp,
  createSlidingRateLimiter,
  isSafePublicCrawlerRequest,
} from "../server/trafficProtection";
import {
  idempotencyMiddleware,
  clearIdempotencyStoreForTesting,
} from "../server/middleware/idempotencyMiddleware";
import { ContactSupportModal } from "../components/ContactSupportModal";
import { verifyBuildOutput } from "../../scripts/verify-build-output";

type TestCase = { name: string; fn: () => Promise<void> | void };
const tests: TestCase[] = [];

function test(name: string, fn: () => Promise<void> | void) {
  tests.push({ name, fn });
}

function createMockReqRes(options: {
  method?: string;
  path?: string;
  originalUrl?: string;
  headers?: Record<string, string>;
  body?: any;
  ip?: string;
  remoteAddress?: string;
}) {
  const listeners: Record<string, Array<() => void>> = {};
  const headersOut: Record<string, string> = {};
  let statusCode = 200;
  let sentBody: any = undefined;
  let nextCalled = false;

  const req: any = {
    method: options.method || "POST",
    path: options.path || "/api/support/contact",
    baseUrl: "",
    originalUrl: options.originalUrl || options.path || "/api/support/contact",
    headers: options.headers || {},
    body: options.body,
    ip: options.ip,
    socket: { remoteAddress: options.remoteAddress },
  };

  const res: any = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(k: string, v: any) {
      headersOut[k.toLowerCase()] = String(v);
    },
    getHeader(k: string) {
      return headersOut[k.toLowerCase()];
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      headersOut["content-type"] = headersOut["content-type"] || "application/json; charset=utf-8";
      sentBody = payload;
      (listeners["finish"] || []).forEach((fn) => fn());
      return this;
    },
    send(payload?: any) {
      sentBody = payload;
      (listeners["finish"] || []).forEach((fn) => fn());
      return this;
    },
    on(event: string, cb: () => void) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getStatus: () => statusCode,
    getBody: () => sentBody,
    getHeader: (k: string) => headersOut[k.toLowerCase()],
    wasNextCalled: () => nextCalled,
  };
}

// ============================================================================
// 1. SEC-01: Private Path Guard & Encoding Isolation Tests
// ============================================================================
test("SEC-01.1: Blocks sensitive server, data, dotfile, and Vite /@fs/ paths in dev & prod", () => {
  const blockedVectors = [
    "/.data/support_inquiries.json",
    "/.data/",
    "/src/server/ownerIdentity.ts",
    "/src/server/commentsService.ts",
    "/server.ts",
    "/server.cjs",
    "/dist-server/server.cjs",
    "/.env",
    "/.env.local",
    "/.git/config",
    "/system_config.json",
    "/users_store.json",
    "/banned_ips.json",
    "/firestore.rules",
    "/firebase-blueprint.json",
    "/firebase-applet-config.json",
    "/@fs/etc/passwd",
    "/@id/@fs/etc/passwd",
    "/@id/src/server/ownerIdentity.ts",
    "/node_modules/.vite/deps/_metadata.json",
    "/node_modules/.vite/deps/react.js.map",
    "/node_modules/express/package.json",
    "/middleware/other.ts",
    "/scripts/verify-build-output.ts",
  ];

  for (const nodeEnv of ["development", "production"]) {
    for (const url of blockedVectors) {
      const decision = evaluatePrivatePath({ method: "GET", originalUrl: url, path: url, nodeEnv });
      assert.equal(
        decision.action,
        "block",
        `Expected ${url} to be BLOCKED in ${nodeEnv}, got ${JSON.stringify(decision)}`
      );
    }
  }
});

test("SEC-01.2: Rejects encoded traversal, double encoding, malformed percent, null bytes, trailing dots/spaces, and semicolon params", () => {
  const bypassVectors = [
    "/%2e%2e/server.ts",
    "/%252e%252e/server.ts",
    "/%25252e%25252e/server.ts",
    "/%ZZmalformed",
    "/%2",
    "/foo%00bar",
    "/foo\u0000bar",
    "/.data./support_inquiries.json",
    "/server.ts ",
    "/.well-known/ard.json;jsessionid=1",
    "/.well-known/%61rd.json",
    "/.well-known/ard.json.",
    "/src/server%2fownerIdentity.ts",
    "/..\\server.ts",
    "/" + "a".repeat(2100),
  ];

  for (const url of bypassVectors) {
    const decision = evaluatePrivatePath({ method: "GET", originalUrl: url, path: url, nodeEnv: "development" });
    assert.equal(decision.action, "block", `Bypass vector must be blocked: ${url}`);
  }

  // Ensure allowlist NEVER short-circuits a malformed alternate candidate
  const mismatch = evaluatePrivatePath({
    method: "GET",
    originalUrl: "/.well-known/ard.json;bypass=1",
    path: "/.well-known/ard.json",
    nodeEnv: "production",
  });
  assert.equal(mismatch.action, "block", "Allowlist must not short-circuit malformed originalUrl");
});

test("SEC-01.3: Preserves exact /.well-known/ard.json and exact dev-only Vite/Firebase assets", () => {
  assert.equal(
    evaluatePrivatePath({
      method: "GET",
      originalUrl: "/.well-known/ard.json",
      path: "/.well-known/ard.json",
      nodeEnv: "production",
    }).action,
    "allow"
  );

  // Dev-only Vite deps, Vite client env, browser adminAuth helper & firebase-applet-config.json?import allowed in dev, blocked in prod
  const devOnlyAllowed = [
    { originalUrl: "/node_modules/.vite/deps/react.js?v=abc123", path: "/node_modules/.vite/deps/react.js" },
    { originalUrl: "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs", path: "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs" },
    { originalUrl: "/node_modules/vite/dist/client/env.mjs", path: "/node_modules/vite/dist/client/env.mjs" },
    { originalUrl: "/middleware/adminAuth.ts", path: "/middleware/adminAuth.ts" },
    { originalUrl: "/firebase-applet-config.json?import", path: "/firebase-applet-config.json" },
    { originalUrl: "/src/App.tsx", path: "/src/App.tsx" },
  ];

  for (const item of devOnlyAllowed) {
    assert.equal(
      evaluatePrivatePath({ method: "GET", ...item, nodeEnv: "development" }).action,
      "allow",
      `Expected ${item.originalUrl} to be ALLOWED in development`
    );
    assert.equal(
      evaluatePrivatePath({ method: "GET", ...item, nodeEnv: "production" }).action,
      "block",
      `Expected ${item.originalUrl} to be BLOCKED in production`
    );
  }

  // Non-GET requests to dev-only root middleware/adminAuth.ts remain blocked even in development
  assert.equal(
    evaluatePrivatePath({
      method: "POST",
      originalUrl: "/middleware/adminAuth.ts",
      path: "/middleware/adminAuth.ts",
      nodeEnv: "development",
    }).action,
    "block"
  );
});

// ============================================================================
// 2. SEC-03: Rate-Limit Trust Boundary & Crawler Scope Tests
// ============================================================================
test("SEC-03.1: Ignores caller X-User-Id / X-User-Email header rotation during rate limiting", async () => {
  const limiter = createSlidingRateLimiter(
    { maxRequests: 2, windowMs: 60_000, message: "Rate limit hit" },
    "sec03_header_test"
  );

  for (let i = 1; i <= 3; i++) {
    const ctx = createMockReqRes({
      method: "POST",
      path: "/api/support/contact",
      ip: "198.51.100.10",
      headers: {
        "x-user-id": `spoofed-user-${i}`,
        "x-user-email": `spoofed-${i}@evil.test`,
      },
    });
    await limiter(ctx.req, ctx.res, ctx.next);
    if (i <= 2) {
      assert.equal(ctx.wasNextCalled(), true, `Request ${i} within limit should pass`);
    } else {
      assert.equal(ctx.wasNextCalled(), false, "3rd request with rotated X-User-Id/Email must be blocked");
      assert.equal(ctx.getStatus(), 429);
    }
  }
});

test("SEC-03.2: Googlebot User-Agent NEVER bypasses POST or /api/* rate limits, only safe public GET/HEAD", async () => {
  const googlebotUa = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

  const getPublic = createMockReqRes({ method: "GET", path: "/merge-pdf", originalUrl: "/merge-pdf" });
  assert.equal(isSafePublicCrawlerRequest(getPublic.req, googlebotUa), true);

  const getApi = createMockReqRes({ method: "GET", path: "/api/tools/stats", originalUrl: "/api/tools/stats" });
  assert.equal(isSafePublicCrawlerRequest(getApi.req, googlebotUa), false);

  const postPublic = createMockReqRes({ method: "POST", path: "/merge-pdf", originalUrl: "/merge-pdf" });
  assert.equal(isSafePublicCrawlerRequest(postPublic.req, googlebotUa), false);

  const limiter = createSlidingRateLimiter(
    { maxRequests: 1, windowMs: 60_000, message: "Rate limit hit" },
    "sec03_googlebot_post_test"
  );

  const first = createMockReqRes({
    method: "POST",
    path: "/api/support/contact",
    ip: "198.51.100.22",
    headers: { "user-agent": googlebotUa },
  });
  await limiter(first.req, first.res, first.next);
  assert.equal(first.wasNextCalled(), true);

  const second = createMockReqRes({
    method: "POST",
    path: "/api/support/contact",
    ip: "198.51.100.22",
    headers: { "user-agent": googlebotUa },
  });
  await limiter(second.req, second.res, second.next);
  assert.equal(second.wasNextCalled(), false, "Googlebot POST must NOT bypass rate limiter");
  assert.equal(second.getStatus(), 429);
});

test("SEC-03.3: Ignores spoofed CF-Connecting-IP by default and fails closed on missing IP in production", async () => {
  const prevTrust = process.env.TRUST_CLOUDFLARE_EDGE;
  const prevEnv = process.env.NODE_ENV;
  try {
    delete process.env.TRUST_CLOUDFLARE_EDGE;
    const spoofed = createMockReqRes({
      ip: "203.0.113.5",
      headers: { "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" },
    });
    const resolved = resolveClientIp(spoofed.req);
    assert.equal(resolved.ip, "203.0.113.5", "Spoofed CF-Connecting-IP must be ignored when TRUST_CLOUDFLARE_EDGE is unset");
    assert.equal(resolved.source, "express-req-ip");

    process.env.NODE_ENV = "production";
    const limiter = createSlidingRateLimiter(
      { maxRequests: 5, windowMs: 60_000, message: "Rate limit hit" },
      "support"
    );
    const missingIpCtx = createMockReqRes({
      method: "POST",
      path: "/api/support/contact",
      ip: undefined,
      remoteAddress: undefined,
      headers: { "user-agent": "CustomBrowser/1.0" },
    });
    await limiter(missingIpCtx.req, missingIpCtx.res, missingIpCtx.next);
    assert.equal(missingIpCtx.wasNextCalled(), false, "Missing IP on sensitive prod route must fail closed");
    assert.equal(missingIpCtx.getStatus(), 503);
  } finally {
    if (prevTrust === undefined) delete process.env.TRUST_CLOUDFLARE_EDGE;
    else process.env.TRUST_CLOUDFLARE_EDGE = prevTrust;
    if (prevEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevEnv;
  }
});

// ============================================================================
// 3. SEC-04: Scoped Idempotency, 409 Conflict & Concurrency Tests
// ============================================================================
test("SEC-04.1: Validates Idempotency-Key format, replays original status/body, and returns 409 on payload mismatch", () => {
  clearIdempotencyStoreForTesting();

  // Invalid key rejected with 400
  const badKey = createMockReqRes({
    headers: { "idempotency-key": "invalid key with spaces!!" },
    ip: "198.51.100.30",
    body: { a: 1 },
  });
  idempotencyMiddleware(badKey.req, badKey.res, badKey.next);
  assert.equal(badKey.wasNextCalled(), false);
  assert.equal(badKey.getStatus(), 400);

  // First request completes with 201 Created
  const req1 = createMockReqRes({
    method: "POST",
    path: "/api/support/contact",
    ip: "198.51.100.30",
    headers: { "idempotency-key": "idem-key-001" },
    body: { a: 1, b: 2 },
  });
  idempotencyMiddleware(req1.req, req1.res, req1.next);
  assert.equal(req1.wasNextCalled(), true);
  req1.res.status(201).json({ success: true, ticketId: "#PDFSUN-ABC123" });

  // Replay with canonically identical payload (reordered keys) replays exact 201 + body
  const req2 = createMockReqRes({
    method: "POST",
    path: "/api/support/contact",
    ip: "198.51.100.30",
    headers: { "idempotency-key": "idem-key-001" },
    body: { b: 2, a: 1 },
  });
  idempotencyMiddleware(req2.req, req2.res, req2.next);
  assert.equal(req2.wasNextCalled(), false);
  assert.equal(req2.getStatus(), 201);
  assert.equal(req2.getHeader("idempotency-replayed"), "true");
  assert.deepEqual(req2.getBody(), { success: true, ticketId: "#PDFSUN-ABC123" });

  // Reuse same key with DIFFERENT payload -> 409 Conflict
  const reqMismatch = createMockReqRes({
    method: "POST",
    path: "/api/support/contact",
    ip: "198.51.100.30",
    headers: { "idempotency-key": "idem-key-001" },
    body: { a: 999, b: 2 },
  });
  idempotencyMiddleware(reqMismatch.req, reqMismatch.res, reqMismatch.next);
  assert.equal(reqMismatch.wasNextCalled(), false);
  assert.equal(reqMismatch.getStatus(), 409);
});

test("SEC-04.2: Isolates keys across routes and clients, and rejects concurrent in-flight duplicates deterministically", () => {
  clearIdempotencyStoreForTesting();

  // Start an in-flight request (do not finish yet)
  const inFlight = createMockReqRes({
    method: "POST",
    path: "/api/support/contact",
    ip: "198.51.100.40",
    headers: { "idempotency-key": "shared-key-42" },
    body: { msg: "hello" },
  });
  idempotencyMiddleware(inFlight.req, inFlight.res, inFlight.next);
  assert.equal(inFlight.wasNextCalled(), true);

  // Concurrent identical request from same client & route -> 409 + Retry-After
  const concurrent = createMockReqRes({
    method: "POST",
    path: "/api/support/contact",
    ip: "198.51.100.40",
    headers: { "idempotency-key": "shared-key-42" },
    body: { msg: "hello" },
  });
  idempotencyMiddleware(concurrent.req, concurrent.res, concurrent.next);
  assert.equal(concurrent.wasNextCalled(), false);
  assert.equal(concurrent.getStatus(), 409);
  assert.equal(concurrent.getHeader("retry-after"), "1");

  // Same key on a DIFFERENT route -> isolated (allowed)
  const diffRoute = createMockReqRes({
    method: "POST",
    path: "/api/other/action",
    ip: "198.51.100.40",
    headers: { "idempotency-key": "shared-key-42" },
    body: { msg: "different-route" },
  });
  idempotencyMiddleware(diffRoute.req, diffRoute.res, diffRoute.next);
  assert.equal(diffRoute.wasNextCalled(), true, "Same key on different route must not collide");

  // Same key from a DIFFERENT client IP -> isolated (no cross-client leak)
  const diffClient = createMockReqRes({
    method: "POST",
    path: "/api/support/contact",
    ip: "198.51.100.99",
    headers: { "idempotency-key": "shared-key-42" },
    body: { msg: "hello" },
  });
  idempotencyMiddleware(diffClient.req, diffClient.res, diffClient.next);
  assert.equal(diffClient.wasNextCalled(), true, "Same key from different client must not leak or collide");
});

// ============================================================================
// 4. SEC-05: Support Store Validation, Mutex Concurrency, Cap & Cleanup Tests
// ============================================================================
test("SEC-05.1: Input validation, sanitization, and server-generated Ticket ID format", () => {
  const validResult = validateSupportInquiryInput({
    name: "  Aarav Sharma \u0007 ",
    email: "  Aarav@Example.COM ",
    subject: "  PDF to Word formatting help  ",
    message: "Hello team,\nMy PDF table shifted columns when converting to DOCX.",
  });

  assert.equal(validResult.ok, true);
  if (validResult.ok) {
    assert.equal(validResult.data.name, "Aarav Sharma");
    assert.equal(validResult.data.email, "aarav@example.com");
    assert.equal(validResult.data.subject, "PDF to Word formatting help");
    assert.ok(validResult.data.message.includes("My PDF table shifted columns"));
  }

  assert.equal(
    validateSupportInquiryInput({ name: "A", email: "valid@example.com", subject: "Help needed", message: "Valid message body." }).ok,
    false
  );
  assert.equal(
    validateSupportInquiryInput({ name: "Aarav", email: "not-an-email", subject: "Help needed", message: "Valid message body." }).ok,
    false
  );
  assert.equal(
    validateSupportInquiryInput({ name: "Aarav", email: "valid@example.com", subject: "Help needed", message: "Too short" }).ok,
    false
  );
  assert.equal(
    validateSupportInquiryInput({ name: { $gt: "" }, email: "valid@example.com", subject: "Help needed", message: "Valid message body." }).ok,
    false
  );

  const t1 = generateSupportTicketId();
  const t2 = generateSupportTicketId();
  assert.match(t1, /^#PDFSUN-[0-9A-F]{6}$/);
  assert.match(t2, /^#PDFSUN-[0-9A-F]{6}$/);
  assert.notEqual(t1, t2);
});

test("SEC-05.2: Mutex preserves all concurrent writes, enforces capacity without truncation, and leaves zero orphan .tmp files", async () => {
  const realTmp = fs.realpathSync(os.tmpdir());
  const testDir = fs.mkdtempSync(path.join(realTmp, "pdfsun-gate0-support-"));

  try {
    // 15 concurrent writes serialized cleanly by per-directory mutex
    const writes = Array.from({ length: 15 }, (_, idx) =>
      persistSupportInquiryAsync(
        {
          name: `Customer ${idx}`,
          email: `customer${idx}@example.com`,
          subject: `Inquiry #${idx}`,
          message: `Detailed inquiry body number ${idx} for concurrency verification.`,
        },
        { storeDir: testDir, maxRecords: 15, ip: `198.51.100.${idx + 1}` }
      )
    );
    const saved = await Promise.all(writes);
    assert.equal(saved.length, 15);

    const listed = listSupportInquiries(50, testDir);
    assert.equal(listed.length, 15, "All 15 concurrent tickets must persist without lost updates");

    // 16th write exceeds maxRecords=15 -> must throw SupportStoreCapacityError and preserve all 15 existing records
    await assert.rejects(
      () =>
        persistSupportInquiryAsync(
          {
            name: "Overflow User",
            email: "overflow@example.com",
            subject: "Capacity check",
            message: "This record must trigger a clean capacity error without dropping old tickets.",
          },
          { storeDir: testDir, maxRecords: 15, ip: "198.51.100.99" }
        ),
      SupportStoreCapacityError
    );

    assert.equal(
      listSupportInquiries(50, testDir).length,
      15,
      "Existing records must remain intact when capacity is reached"
    );

    // Confirm zero leftover .tmp files in testDir
    const filesInDir = fs.readdirSync(testDir);
    assert.equal(
      filesInDir.filter((f) => f.endsWith(".tmp")).length,
      0,
      "No orphan .tmp files may remain after writes"
    );
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

// ============================================================================
// 5. SEC-06: Honest Support UI & MAILBOX-01 Build Guard Tests
// ============================================================================
test("SEC-06.1: ContactSupportModal renders zero unverified mailto or email-reply promises", () => {
  const html = renderToStaticMarkup(
    React.createElement(ContactSupportModal, { isOpen: true, onClose: () => {} })
  );
  assert.equal(html.includes("mailto:support@pdfsun.in"), false, "Must not render unverified mailto:support@pdfsun.in");
  assert.equal(html.toLowerCase().includes("support@pdfsun.in"), false, "Must not render unverified support@pdfsun.in");
  assert.equal(
    html.toLowerCase().includes("get back to you via email shortly"),
    false,
    "Must not promise unsupported email reply"
  );
  assert.ok(html.includes("In-App Support Queue"), "Must display honest in-app support queue guidance");
});

test("SEC-06.2: MAILBOX-01 verifyBuildOutput passes clean dist and FAILS when forbidden mailbox claim is reintroduced", () => {
  const realTmp = fs.realpathSync(os.tmpdir());
  const fakeRoot = fs.mkdtempSync(path.join(realTmp, "pdfsun-gate0-mailbox01-"));

  try {
    const distDir = path.join(fakeRoot, "dist");
    const serverDir = path.join(fakeRoot, "dist-server");
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(serverDir, { recursive: true });

    fs.writeFileSync(path.join(distDir, "index.html"), "<!doctype html><html><body>PDFSun Clean</body></html>");
    fs.writeFileSync(path.join(distDir, "robots.txt"), "User-agent: *\nAllow: /\n");
    fs.writeFileSync(path.join(distDir, "sitemap.xml"), "<urlset></urlset>");
    fs.writeFileSync(path.join(serverDir, "server.cjs"), "x".repeat(2048));

    const cleanResult = verifyBuildOutput(fakeRoot);
    assert.equal(cleanResult.passed, true, `Clean fixture should pass: ${cleanResult.errors.join("; ")}`);

    // Reintroduce forbidden unverified mailto claim -> MUST FAIL
    fs.writeFileSync(
      path.join(distDir, "bundle.js"),
      'console.log("Contact mailto:support@pdfsun.in");'
    );
    const pollutedResult = verifyBuildOutput(fakeRoot);
    assert.equal(pollutedResult.passed, false, "MAILBOX-01 guard MUST fail when mailto:support@pdfsun.in enters dist/");
    assert.ok(
      pollutedResult.errors.some((e) => e.includes("MAILBOX-01")),
      "Failure output must reference MAILBOX-01"
    );
  } finally {
    fs.rmSync(fakeRoot, { recursive: true, force: true });
  }
});

async function run() {
  let passed = 0;
  let failed = 0;
  for (const tc of tests) {
    try {
      await tc.fn();
      console.log(`PASS: ${tc.name}`);
      passed++;
    } catch (err) {
      console.error(`FAIL: ${tc.name}`);
      console.error(err);
      failed++;
    }
  }
  console.log(`\nGate 0 Security & Support Contact Suite: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

run();
