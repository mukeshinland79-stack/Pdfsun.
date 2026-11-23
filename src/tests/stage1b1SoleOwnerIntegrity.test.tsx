import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { DUAL_OWNER_EMAILS as AUTHORITATIVE_OWNERS, isServerOwnerEmail } from "../server/ownerIdentity";
import {
  DUAL_OWNER_EMAILS as LEGACY_SECURITY_OWNERS,
  dualOwnerSecurityMiddleware,
  adminSecurityMiddleware,
  requireAdminApiAuth,
} from "../middleware/adminSecurity";
import { validateAdminSession } from "../middleware/adminAuth";
import { isOwnerAccountEmail } from "../server/authService";
import {
  adminAuth,
  generateAdminJwtToken,
  isVerifiedOwnerIdentity,
  verifyAdminJwtToken,
} from "../server/middleware/adminAuth";
import { detectActivePlanTier, PLAN_LIMITS } from "../hooks/useUsageTracker";
import { checkAdminRole, checkOwnerRole } from "../hooks/useAuth";
import { isOwnerAccount } from "../utils/mockAuth";
import { PDFSUN_PAYMENT_PRODUCTS } from "../config/paymentProducts";
import { ALL_TOOLS } from "../data/toolsData";

const ROOT = process.cwd();
const SOLE_OWNER = "mukeshinland79@gmail.com";
const CUSTOMER_EMAIL = "mukeshkalonia241@gmail.com";

type TestCase = { name: string; fn: () => Promise<void> | void };
const tests: TestCase[] = [];

function test(name: string, fn: () => Promise<void> | void) {
  tests.push({ name, fn });
}

function createMockReqRes(headers: Record<string, string> = {}) {
  const req: any = {
    method: "GET",
    originalUrl: "/api/admin/config",
    headers,
    socket: { remoteAddress: "127.0.0.1" },
    accepts: () => false,
  };
  let statusCode = 200;
  let jsonBody: any = null;
  let textBody: string | null = null;
  let nextCalled = false;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    type() {
      return this;
    },
    json(payload: any) {
      jsonBody = payload;
      return this;
    },
    send(payload: string) {
      textBody = payload;
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
    getResult: () => ({ statusCode, jsonBody, textBody, nextCalled }),
  };
}

test("1. Single Authoritative Server-Only Sole-Owner Policy across ownerIdentity, authService, and legacy adminSecurity", () => {
  assert.deepEqual(AUTHORITATIVE_OWNERS, [SOLE_OWNER]);
  assert.deepEqual(LEGACY_SECURITY_OWNERS, [SOLE_OWNER]);
  assert.equal(AUTHORITATIVE_OWNERS.includes(CUSTOMER_EMAIL), false);
  assert.equal(LEGACY_SECURITY_OWNERS.includes(CUSTOMER_EMAIL), false);

  assert.equal(isServerOwnerEmail(SOLE_OWNER), true);
  assert.equal(isServerOwnerEmail(CUSTOMER_EMAIL), false);
  assert.equal(isOwnerAccountEmail(SOLE_OWNER), true);
  assert.equal(isOwnerAccountEmail(SOLE_OWNER.toUpperCase()), true);
  assert.equal(isOwnerAccountEmail(CUSTOMER_EMAIL), false);
  assert.equal(isOwnerAccountEmail("customer@example.com"), false);

  // Client mockAuth must NOT trust raw email strings; it requires server-verified role + hasAdminAccess
  assert.equal(isOwnerAccount(SOLE_OWNER), false);
  assert.equal(isOwnerAccount(CUSTOMER_EMAIL), false);
  assert.equal(isOwnerAccount({ id: "owner-002", name: "Owner", email: SOLE_OWNER, role: "owner", hasAdminAccess: true, isPro: true, plan: "Owner", avatar: "", joinedDate: "2026" }), true);
  assert.equal(isOwnerAccount({ id: "usr-1", name: "Customer", email: CUSTOMER_EMAIL, role: "owner", hasAdminAccess: false, isPro: false, plan: "Free", avatar: "", joinedDate: "2026" }), false);
});

test("2. Finding 1: detectActivePlanTier strictly denies Owner tier to Customer even with spoofed role and preserves Free/Pro tiers", () => {
  // Spoofed owner role for Customer account MUST NOT grant owner tier
  assert.equal(
    detectActivePlanTier({
      email: CUSTOMER_EMAIL,
      role: "owner",
      isPro: false,
    }),
    "free"
  );

  // Paid Customer with spoofed owner role receives only their paid tier, never owner
  assert.equal(
    detectActivePlanTier({
      email: CUSTOMER_EMAIL,
      role: "owner",
      isPro: true,
      plan: "Pro Sun Monthly",
    }),
    "pro-monthly"
  );

  // Sole Owner email WITHOUT verified owner role cannot claim owner tier
  assert.equal(
    detectActivePlanTier({
      email: SOLE_OWNER,
      role: "user",
      isPro: false,
    }),
    "free"
  );

  // Sole Owner WITH verified server-issued owner role + hasAdminAccess gets owner tier
  assert.equal(
    detectActivePlanTier({
      email: SOLE_OWNER,
      role: "owner",
      hasAdminAccess: true,
      isPro: true,
    }),
    "owner"
  );

  // Normal customer Free & Pro tier calculations remain unchanged
  assert.equal(detectActivePlanTier(null), "free");
  assert.equal(detectActivePlanTier({ email: "a@b.com", role: "user", isPro: false }), "free");
  assert.equal(detectActivePlanTier({ email: "a@b.com", role: "user", isPro: true, planId: "flexi" }), "flexi");
  assert.equal(detectActivePlanTier({ email: "a@b.com", role: "user", isPro: true, planId: "pro-monthly" }), "pro-monthly");
  assert.equal(detectActivePlanTier({ email: "a@b.com", role: "user", isPro: true, planId: "pro-yearly" }), "pro-yearly");
  assert.equal(detectActivePlanTier({ email: "a@b.com", role: "user", isPro: true, planId: "enterprise" }), "enterprise");
  assert.equal(detectActivePlanTier({ email: "a@b.com", role: "user", isPro: true, planId: "enterprise-sso" }), "enterprise-sso");
});

test("3. Finding 2: Legacy adminSecurity.ts middleware enforces Sole-Owner JWT + MFA and blocks Customer/spoofed headers", async () => {
  const customerClaimingOwnerJwt = generateAdminJwtToken({
    email: CUSTOMER_EMAIL,
    role: "owner",
    mfaVerified: true,
  });
  const ownerPreMfaJwt = generateAdminJwtToken({
    email: SOLE_OWNER,
    role: "owner",
    mfaVerified: false,
  });
  const forgedJwt = jwt.sign(
    { email: SOLE_OWNER, role: "owner", hasAdminAccess: true, mfaVerified: true },
    "wrong-attacker-secret-key-99999"
  );
  const validOwnerJwt = generateAdminJwtToken({
    email: SOLE_OWNER,
    role: "owner",
    mfaVerified: true,
  });

  const middlewares = [
    { name: "dualOwnerSecurityMiddleware", fn: dualOwnerSecurityMiddleware },
    { name: "adminSecurityMiddleware", fn: adminSecurityMiddleware },
    { name: "requireAdminApiAuth", fn: requireAdminApiAuth },
  ];

  for (const mw of middlewares) {
    // Spoofed identity headers alone -> 404
    const spoof = createMockReqRes({
      "x-user-email": SOLE_OWNER,
      "x-owner-email": SOLE_OWNER,
    });
    await mw.fn(spoof.req, spoof.res, spoof.next);
    assert.equal(spoof.getResult().nextCalled, false, `${mw.name} must block spoofed headers`);
    assert.equal(spoof.getResult().statusCode, 404, `${mw.name} must return 404 stealth`);

    // Customer JWT claiming role=owner -> 404
    const cust = createMockReqRes({ authorization: `Bearer ${customerClaimingOwnerJwt}` });
    await mw.fn(cust.req, cust.res, cust.next);
    assert.equal(cust.getResult().nextCalled, false, `${mw.name} must reject Customer JWT claiming owner`);
    assert.equal(cust.getResult().statusCode, 404);

    // Pre-MFA Owner JWT -> 404
    const preMfa = createMockReqRes({ authorization: `Bearer ${ownerPreMfaJwt}` });
    await mw.fn(preMfa.req, preMfa.res, preMfa.next);
    assert.equal(preMfa.getResult().nextCalled, false, `${mw.name} must reject pre-MFA Owner JWT`);
    assert.equal(preMfa.getResult().statusCode, 404);

    // Forged JWT -> 404
    const forged = createMockReqRes({ authorization: `Bearer ${forgedJwt}` });
    await mw.fn(forged.req, forged.res, forged.next);
    assert.equal(forged.getResult().nextCalled, false, `${mw.name} must reject forged JWT`);
    assert.equal(forged.getResult().statusCode, 404);

    // Valid MFA-verified Sole Owner JWT -> next() called
    const ok = createMockReqRes({ authorization: `Bearer ${validOwnerJwt}` });
    await mw.fn(ok.req, ok.res, ok.next);
    assert.equal(ok.getResult().nextCalled, true, `${mw.name} must allow valid MFA-verified Sole Owner JWT`);
  }
});

test("4. Finding 3 & PII-01 UI Audit: ServerSystemConfigForm, AdminPanel, AdminActivityLog, and src/types.ts contain zero personal email literals", () => {
  const typesCode = fs.readFileSync(path.join(ROOT, "src/types.ts"), "utf8");
  assert.equal(typesCode.includes(SOLE_OWNER), false, "src/types.ts must not embed personal Owner email");
  assert.equal(typesCode.includes("DUAL_OWNER_EMAILS"), false, "DUAL_OWNER_EMAILS must live server-only in src/server/ownerIdentity.ts");

  const configForm = fs.readFileSync(path.join(ROOT, "src/components/ServerSystemConfigForm.tsx"), "utf8");
  assert.equal(configForm.includes("Owner 1:"), false, "ServerSystemConfigForm must not display Owner 1 / Owner 2");
  assert.equal(configForm.includes(CUSTOMER_EMAIL), false, "ServerSystemConfigForm must not display Customer email as Owner");
  assert.equal(configForm.includes(SOLE_OWNER), false, "ServerSystemConfigForm must not hardcode personal Owner email");
  assert.equal(configForm.includes('Authorized Owner: {currentUserProfile?.email || "Verified Platform Owner"}'), true);

  const adminPanel = fs.readFileSync(path.join(ROOT, "src/components/AdminPanel.tsx"), "utf8");
  assert.equal(adminPanel.includes('emailLower.includes("mukesh")'), false, "AdminPanel must not use substring matching on mukesh");
  assert.equal(adminPanel.includes('emailLower.includes("mukeshkalonia")'), false, "AdminPanel must not use substring matching on mukeshkalonia");
  assert.equal(adminPanel.includes(SOLE_OWNER), false, "AdminPanel must not hardcode personal Owner email");

  const activityLog = fs.readFileSync(path.join(ROOT, "src/components/AdminActivityLog.tsx"), "utf8");
  assert.equal(activityLog.includes(SOLE_OWNER), false, "AdminActivityLog must not embed personal Owner email");
  assert.equal(activityLog.includes(CUSTOMER_EMAIL), false, "AdminActivityLog must not list Customer as admin actor");
});

test("5. Server adminAuth & JWT verification strictly reject Customer claiming owner role and enforce MFA", async () => {
  const customerOwnerJwt = generateAdminJwtToken({
    email: CUSTOMER_EMAIL,
    role: "owner",
    mfaVerified: true,
  });
  assert.equal(isVerifiedOwnerIdentity(customerOwnerJwt), false);
  assert.equal(verifyAdminJwtToken(customerOwnerJwt), null);

  const custCtx = createMockReqRes({ authorization: `Bearer ${customerOwnerJwt}` });
  await adminAuth(custCtx.req, custCtx.res, custCtx.next);
  assert.equal(custCtx.getResult().nextCalled, false);
  assert.equal(custCtx.getResult().statusCode, 404);

  const ownerNoMfaJwt = generateAdminJwtToken({
    email: SOLE_OWNER,
    role: "owner",
    mfaVerified: false,
  });
  assert.equal(isVerifiedOwnerIdentity(ownerNoMfaJwt), false);
  assert.equal(verifyAdminJwtToken(ownerNoMfaJwt), null);

  const validOwnerJwt = generateAdminJwtToken({
    email: SOLE_OWNER,
    role: "owner",
    mfaVerified: true,
  });
  assert.equal(isVerifiedOwnerIdentity(validOwnerJwt), true);
  assert.ok(verifyAdminJwtToken(validOwnerJwt) !== null);

  const ownerCtx = createMockReqRes({ authorization: `Bearer ${validOwnerJwt}` });
  await adminAuth(ownerCtx.req, ownerCtx.res, ownerCtx.next);
  assert.equal(ownerCtx.getResult().nextCalled, true);
  assert.equal(ownerCtx.req.isAdminAuthenticated, true);
});

test("6. Frontend useAuth helpers & root middleware/adminAuth strictly isolate unverified profiles", () => {
  const spoofedCustomerProfile: any = {
    id: "usr-spoof",
    name: "Customer",
    email: CUSTOMER_EMAIL,
    role: "owner",
    hasAdminAccess: false,
    isPro: false,
    plan: "Free",
    avatar: "",
    joinedDate: "2026",
  };
  assert.equal(checkOwnerRole(spoofedCustomerProfile, "owner"), false);
  assert.equal(checkAdminRole(spoofedCustomerProfile, "owner"), false);

  const unverifiedOwnerProfile: any = {
    ...spoofedCustomerProfile,
    email: SOLE_OWNER,
    role: "user",
    hasAdminAccess: false,
  };
  assert.equal(checkOwnerRole(unverifiedOwnerProfile, "user"), false);
  assert.equal(checkAdminRole(unverifiedOwnerProfile, "user"), false);

  const verifiedOwnerProfile: any = {
    ...spoofedCustomerProfile,
    email: SOLE_OWNER,
    role: "owner",
    hasAdminAccess: true,
  };
  assert.equal(checkOwnerRole(verifiedOwnerProfile, "owner"), true);
  assert.equal(checkAdminRole(verifiedOwnerProfile, "owner"), true);

  const sampleJwt = generateAdminJwtToken({ email: CUSTOMER_EMAIL, role: "owner", mfaVerified: true });
  const custValidation = validateAdminSession(spoofedCustomerProfile, sampleJwt);
  assert.equal(custValidation.isValid, false);
  assert.equal(custValidation.isOwner, false);
  assert.equal(custValidation.role, "unauthorized");

  const validOwnerJwt = generateAdminJwtToken({ email: SOLE_OWNER, role: "owner", mfaVerified: true });
  const ownerValidation = validateAdminSession(verifiedOwnerProfile, validOwnerJwt);
  assert.equal(ownerValidation.isValid, true);
  assert.equal(ownerValidation.isOwner, true);
  assert.equal(ownerValidation.role, "owner");
});

test("7. Live localhost Owner routes reject spoofed headers, forged JWTs, and Customer-claiming-owner JWTs", async () => {
  const baseUrl = "http://localhost:3000";

  const spoofConfig = await fetch(`${baseUrl}/api/admin/config`, {
    headers: {
      "x-user-email": SOLE_OWNER,
      "x-owner-email": SOLE_OWNER,
    },
  });
  assert.equal(spoofConfig.status, 404, "Spoofed owner headers on /api/admin/config must fail closed with 404");

  const spoofAudit = await fetch(`${baseUrl}/api/admin/owner-payment-audit-logs`, {
    headers: {
      "x-user-email": SOLE_OWNER,
      "x-owner-email": SOLE_OWNER,
    },
  });
  assert.equal(spoofAudit.status, 403, "Spoofed owner headers on /api/admin/owner-payment-audit-logs must return 403");

  const forgedJwt = jwt.sign(
    { email: SOLE_OWNER, role: "owner", hasAdminAccess: true, mfaVerified: true },
    "forged-invalid-secret-xyz"
  );
  const forgedRes = await fetch(`${baseUrl}/api/admin/config`, {
    headers: { Authorization: `Bearer ${forgedJwt}` },
  });
  assert.equal(forgedRes.status, 404, "Forged JWT on /api/admin/config must fail closed with 404");

  const customerOwnerJwt = generateAdminJwtToken({
    email: CUSTOMER_EMAIL,
    role: "owner",
    mfaVerified: true,
  });
  const customerRes = await fetch(`${baseUrl}/api/admin/config`, {
    headers: { Authorization: `Bearer ${customerOwnerJwt}` },
  });
  assert.equal(customerRes.status, 404, "Customer JWT claiming role=owner on /api/admin/config must return 404");
});

test("8. Phase D & Registry Regression: 68 tools and all 6 pricing tiers / entitlements preserved untouched", () => {
  assert.equal(ALL_TOOLS.length, 68);
  assert.equal(new Set(ALL_TOOLS.map((t) => t.id)).size, 68);
  assert.equal(new Set(ALL_TOOLS.map((t) => t.slug)).size, 68);
  assert.equal(ALL_TOOLS.filter((t) => !t.isPro).length, 59);
  assert.equal(ALL_TOOLS.filter((t) => t.isPro).length, 9);

  // Verify pricing tiers unchanged
  assert.equal(PDFSUN_PAYMENT_PRODUCTS.free.displayPriceINR, 0);
  assert.equal(PDFSUN_PAYMENT_PRODUCTS.flexi.displayPriceINR, 99);
  assert.equal(PDFSUN_PAYMENT_PRODUCTS.flexi.durationDays, 7);
  assert.equal(PDFSUN_PAYMENT_PRODUCTS["pro-monthly"].displayPriceINR, 199);
  assert.equal(PDFSUN_PAYMENT_PRODUCTS["pro-yearly"].displayPriceINR, 1499);
  assert.equal(PDFSUN_PAYMENT_PRODUCTS.enterprise.displayPriceINR, 3999);
  assert.equal(PDFSUN_PAYMENT_PRODUCTS.enterprise.seats, 5);
  assert.equal(PDFSUN_PAYMENT_PRODUCTS["enterprise-sso"].displayPriceINR, 9999);
  assert.equal(PDFSUN_PAYMENT_PRODUCTS["enterprise-sso"].seats, 20);

  // Verify Free tier limits unchanged
  assert.equal(PLAN_LIMITS.free.maxFileSizeMB, 15);
  assert.equal(PLAN_LIMITS.free.maxDailyOperations, 3);
  assert.equal(PLAN_LIMITS.flexi.maxFileSizeMB, 500);
});

async function run() {
  console.log("=== Stage 1B.1 Sole-Owner Integrity & Entitlement Regression Suite ===");
  let passed = 0;
  let failed = 0;

  for (const tc of tests) {
    try {
      await tc.fn();
      passed++;
      console.log(`PASS | ${tc.name}`);
    } catch (err: any) {
      failed++;
      console.error(`FAIL | ${tc.name}`);
      console.error("      ", err?.stack || err?.message || err);
    }
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed (Total: ${tests.length})`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
