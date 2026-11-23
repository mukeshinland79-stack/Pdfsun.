import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import jwt from "jsonwebtoken";
import { UserProfile } from "../types";
import { DUAL_OWNER_EMAILS } from "../server/ownerIdentity";
import { ALL_TOOLS } from "../data/toolsData";
import {
  adminAuth,
  clearRevokedTokensForTesting,
  generateAdminJwtToken,
  getJwtSecret,
  isValidAdminSecret,
  isVerifiedOwnerIdentity,
  revokeAdminOrSessionToken,
  verifyAdminJwtToken,
} from "../server/middleware/adminAuth";
import { handleVerifySession } from "../server/authRoutes";
import { isOwnerAccountEmail } from "../server/authService";
import { isOwnerAccount } from "../utils/mockAuth";
import {
  isAdminActionPermitted,
  validateAdminSession,
} from "../../middleware/adminAuth";
import { AdminPanel } from "../components/AdminPanel";
import { OwnerGrowthIntelligenceDashboard } from "../components/OwnerGrowthIntelligenceDashboard";
import { ServerSystemConfigForm } from "../components/ServerSystemConfigForm";
import { ApiThrottlingManager } from "../components/ApiThrottlingManager";
import { AuditLogManager } from "../components/AuditLogManager";

const ROOT = process.cwd();
const SOLE_OWNER = "mukeshinland79@gmail.com";
const CUSTOMER_EMAIL = "mukeshkalonia241@gmail.com";
const DELEGATED_ADMIN = "ops-admin@pdfsun.in";

type TestCase = { name: string; fn: () => Promise<void> | void };
const tests: TestCase[] = [];

function test(name: string, fn: () => Promise<void> | void) {
  tests.push({ name, fn });
}

function createMockReqRes(headers: Record<string, string> = {}, body: Record<string, unknown> = {}) {
  const req: any = {
    method: "POST",
    originalUrl: "/api/admin/system-config",
    headers,
    body,
    socket: { remoteAddress: "127.0.0.1" },
    accepts: () => false,
  };
  let statusCode = 200;
  let jsonBody: any = null;
  let nextCalled = false;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      jsonBody = payload;
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
    getJson: () => jsonBody,
    wasNextCalled: () => nextCalled,
  };
}

function makeProfile(overrides: Partial<UserProfile>): UserProfile {
  return {
    id: "usr-test-1",
    name: "Test User",
    email: CUSTOMER_EMAIL,
    role: "user",
    avatar: "",
    plan: "Free Plan (Active)",
    joinedDate: "Nov 2026",
    hasAdminAccess: false,
    isPro: false,
    ...overrides,
  };
}

test("1. Fail-closed generateAdminJwtToken & MFA enforcement for Owner tokens", async () => {
  const tokenWithoutMfaFlag = generateAdminJwtToken({
    email: SOLE_OWNER,
    role: "owner",
  });
  const rawDecoded = jwt.verify(tokenWithoutMfaFlag, getJwtSecret(), { algorithms: ["HS256"] }) as any;
  assert.equal(rawDecoded.mfaVerified, false, "generateAdminJwtToken must default mfaVerified to false");
  assert.equal(verifyAdminJwtToken(tokenWithoutMfaFlag), null, "verifyAdminJwtToken must reject JWT without mfaVerified === true");
  assert.equal(isVerifiedOwnerIdentity(tokenWithoutMfaFlag), false, "isVerifiedOwnerIdentity must reject JWT without mfaVerified === true");

  const ctxDenied = createMockReqRes({ authorization: `Bearer ${tokenWithoutMfaFlag}` });
  await adminAuth(ctxDenied.req, ctxDenied.res, ctxDenied.next);
  assert.equal(ctxDenied.wasNextCalled(), false, "adminAuth must deny Owner token with omitted mfaVerified");
  assert.equal(ctxDenied.getStatus(), 404, "adminAuth must preserve 404 stealth denial");

  const validOwnerToken = generateAdminJwtToken({
    email: SOLE_OWNER,
    role: "owner",
    mfaVerified: true,
  });
  const verifiedOwner = verifyAdminJwtToken(validOwnerToken);
  assert.ok(verifiedOwner, "MFA-verified sole-Owner JWT must pass verifyAdminJwtToken");
  assert.equal(verifiedOwner?.role, "owner");
  assert.equal(isVerifiedOwnerIdentity(validOwnerToken), true);

  const ctxAllowed = createMockReqRes({ authorization: `Bearer ${validOwnerToken}` });
  await adminAuth(ctxAllowed.req, ctxAllowed.res, ctxAllowed.next);
  assert.equal(ctxAllowed.wasNextCalled(), true, "adminAuth must allow MFA-verified sole-Owner JWT");
  assert.equal(ctxAllowed.req.isAdminAuthenticated, true);
  assert.equal(ctxAllowed.req.adminUser?.email, SOLE_OWNER);
});

test("2. Strict Owner role + authorized Owner identity + MFA conjunction (rejects allowlist bypass & Customer escalation)", async () => {
  // Allowlisted Owner email with role === "user" + mfaVerified === true + stray hasAdminAccess === true must be REJECTED
  const allowlistedNonOwnerJwt = jwt.sign(
    {
      id: "usr-owner-downgraded",
      email: SOLE_OWNER,
      role: "user",
      hasAdminAccess: true,
      mfaVerified: true,
    },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: "1h" }
  );
  assert.equal(verifyAdminJwtToken(allowlistedNonOwnerJwt), null, "Allowlisted email with role=user must fail verifyAdminJwtToken");
  const ctxAllowlistBypass = createMockReqRes({ authorization: `Bearer ${allowlistedNonOwnerJwt}` });
  await adminAuth(ctxAllowlistBypass.req, ctxAllowlistBypass.res, ctxAllowlistBypass.next);
  assert.equal(ctxAllowlistBypass.wasNextCalled(), false, "adminAuth must reject allowlisted email without role=owner");
  assert.equal(ctxAllowlistBypass.getStatus(), 404);

  // Customer claiming role === "owner" + mfaVerified === true must be REJECTED
  const customerEscalatedJwt = generateAdminJwtToken({
    email: CUSTOMER_EMAIL,
    role: "owner",
    hasAdminAccess: true,
    mfaVerified: true,
  });
  assert.equal(verifyAdminJwtToken(customerEscalatedJwt), null, "Customer claiming role=owner must fail verifyAdminJwtToken");
  assert.equal(isVerifiedOwnerIdentity(customerEscalatedJwt), false, "Customer claiming role=owner must fail isVerifiedOwnerIdentity");
  const ctxCustomer = createMockReqRes({ authorization: `Bearer ${customerEscalatedJwt}` });
  await adminAuth(ctxCustomer.req, ctxCustomer.res, ctxCustomer.next);
  assert.equal(ctxCustomer.wasNextCalled(), false, "adminAuth must reject Customer claiming role=owner");
  assert.equal(ctxCustomer.getStatus(), 404);
});

test("3. Strict non-owner Admin conjunction: requires role === 'admin' AND hasAdminAccess === true AND mfaVerified === true", async () => {
  // Admin without MFA -> REJECT
  const adminNoMfa = generateAdminJwtToken({
    email: DELEGATED_ADMIN,
    role: "admin",
    hasAdminAccess: true,
    mfaVerified: false,
  });
  assert.equal(verifyAdminJwtToken(adminNoMfa), null, "Admin JWT without MFA must be rejected");
  const ctxNoMfa = createMockReqRes({ authorization: `Bearer ${adminNoMfa}` });
  await adminAuth(ctxNoMfa.req, ctxNoMfa.res, ctxNoMfa.next);
  assert.equal(ctxNoMfa.wasNextCalled(), false);
  assert.equal(ctxNoMfa.getStatus(), 404);

  // Admin with MFA but hasAdminAccess: false -> REJECT
  const adminNoAccessFlag = generateAdminJwtToken({
    email: DELEGATED_ADMIN,
    role: "admin",
    hasAdminAccess: false,
    mfaVerified: true,
  });
  assert.equal(verifyAdminJwtToken(adminNoAccessFlag), null, "Admin JWT without hasAdminAccess=true must be rejected");
  const ctxNoFlag = createMockReqRes({ authorization: `Bearer ${adminNoAccessFlag}` });
  await adminAuth(ctxNoFlag.req, ctxNoFlag.res, ctxNoFlag.next);
  assert.equal(ctxNoFlag.wasNextCalled(), false);
  assert.equal(ctxNoFlag.getStatus(), 404);

  // Standard user with stray hasAdminAccess: true + mfaVerified: true -> REJECT
  const userStrayFlag = jwt.sign(
    {
      id: "usr-stray",
      email: "regular-customer@example.com",
      role: "user",
      hasAdminAccess: true,
      mfaVerified: true,
    },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: "1h" }
  );
  assert.equal(verifyAdminJwtToken(userStrayFlag), null, "User JWT with stray hasAdminAccess=true must be rejected");
  const ctxStray = createMockReqRes({ authorization: `Bearer ${userStrayFlag}` });
  await adminAuth(ctxStray.req, ctxStray.res, ctxStray.next);
  assert.equal(ctxStray.wasNextCalled(), false);
  assert.equal(ctxStray.getStatus(), 404);

  // Legitimate non-owner Admin with role=admin + hasAdminAccess=true + mfaVerified=true -> ALLOW (non-owner)
  const validAdminJwt = generateAdminJwtToken({
    email: DELEGATED_ADMIN,
    role: "admin",
    hasAdminAccess: true,
    mfaVerified: true,
  });
  const decodedAdmin = verifyAdminJwtToken(validAdminJwt);
  assert.ok(decodedAdmin, "Valid MFA-verified non-owner Admin JWT must pass verifyAdminJwtToken");
  assert.equal(decodedAdmin?.role, "admin");
  assert.equal(isVerifiedOwnerIdentity(validAdminJwt), false, "Non-owner Admin must NOT pass isVerifiedOwnerIdentity");
  const ctxValidAdmin = createMockReqRes({ authorization: `Bearer ${validAdminJwt}` });
  await adminAuth(ctxValidAdmin.req, ctxValidAdmin.res, ctxValidAdmin.next);
  assert.equal(ctxValidAdmin.wasNextCalled(), true, "adminAuth must allow valid MFA-verified non-owner Admin");
  assert.equal(ctxValidAdmin.req.adminUser?.role, "admin");
});

test("4. Token revocation and timing-safe secret verification remain intact", async () => {
  clearRevokedTokensForTesting();
  const validOwnerToken = generateAdminJwtToken({
    email: SOLE_OWNER,
    role: "owner",
    mfaVerified: true,
  });
  revokeAdminOrSessionToken(validOwnerToken);

  const ctxRevoked = createMockReqRes({ authorization: `Bearer ${validOwnerToken}` });
  await adminAuth(ctxRevoked.req, ctxRevoked.res, ctxRevoked.next);
  assert.equal(ctxRevoked.wasNextCalled(), false, "Revoked MFA-verified Owner JWT must be rejected");
  assert.equal(ctxRevoked.getStatus(), 404);
  clearRevokedTokensForTesting();

  const strongSecret = "PdfSun_Stage1B2_TimingSafe_Secret_99887766";
  assert.equal(isValidAdminSecret(strongSecret, strongSecret), true);
  assert.equal(isValidAdminSecret("wrong_secret_value_123456", strongSecret), false);
  assert.equal(isValidAdminSecret("12345", "12345"), false);
});

test("5. JWT fallback sanitization in handleVerifySession: rejects missing-profile privileged JWTs and sanitizes Customer fallback", async () => {
  const missingOwnerToken = jwt.sign(
    {
      id: "ghost-owner-1",
      name: "Ghost Owner",
      email: "ghost-owner-stage1b2@example.com",
      role: "owner",
      hasAdminAccess: true,
      mfaVerified: true,
    },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: "1h" }
  );
  const ctxGhostOwner = createMockReqRes({ authorization: `Bearer ${missingOwnerToken}` });
  await handleVerifySession(ctxGhostOwner.req, ctxGhostOwner.res);
  assert.equal(ctxGhostOwner.getStatus(), 401, "Missing-profile JWT claiming owner must be rejected with 401");
  assert.equal(ctxGhostOwner.getJson()?.valid, false);
  assert.equal(ctxGhostOwner.getJson()?.user, null);
  assert.equal(ctxGhostOwner.getJson()?.role, "public");

  const missingAdminToken = jwt.sign(
    {
      id: "ghost-admin-1",
      name: "Ghost Admin",
      email: "ghost-admin-stage1b2@example.com",
      role: "admin",
      hasAdminAccess: true,
      mfaVerified: true,
    },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: "1h" }
  );
  const ctxGhostAdmin = createMockReqRes({ authorization: `Bearer ${missingAdminToken}` });
  await handleVerifySession(ctxGhostAdmin.req, ctxGhostAdmin.res);
  assert.equal(ctxGhostAdmin.getStatus(), 401, "Missing-profile JWT claiming admin must be rejected with 401");
  assert.equal(ctxGhostAdmin.getJson()?.valid, false);
  assert.equal(ctxGhostAdmin.getJson()?.user, null);

  const missingPrivUserToken = jwt.sign(
    {
      id: "ghost-priv-user-1",
      name: "Ghost Privileged User",
      email: "ghost-priv-stage1b2@example.com",
      role: "user",
      hasAdminAccess: true,
      mfaVerified: true,
    },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: "1h" }
  );
  const ctxGhostPriv = createMockReqRes({ authorization: `Bearer ${missingPrivUserToken}` });
  await handleVerifySession(ctxGhostPriv.req, ctxGhostPriv.res);
  assert.equal(ctxGhostPriv.getStatus(), 401, "Missing-profile JWT claiming hasAdminAccess=true must be rejected with 401");
  assert.equal(ctxGhostPriv.getJson()?.valid, false);

  const missingCustomerToken = jwt.sign(
    {
      id: "ghost-customer-1",
      name: "Standard Customer",
      email: "ephemeral-customer-stage1b2@example.com",
      role: "user",
      hasAdminAccess: false,
      mfaVerified: true,
    },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: "1h" }
  );
  const ctxCustomer = createMockReqRes({ authorization: `Bearer ${missingCustomerToken}` });
  await handleVerifySession(ctxCustomer.req, ctxCustomer.res);
  assert.equal(ctxCustomer.getStatus(), 200, "Valid non-privileged Customer fallback remains allowed");
  assert.equal(ctxCustomer.getJson()?.valid, true);
  assert.equal(ctxCustomer.getJson()?.role, "user");
  assert.equal(ctxCustomer.getJson()?.user?.role, "user");
  assert.equal(ctxCustomer.getJson()?.user?.hasAdminAccess, false);
  assert.equal(ctxCustomer.getJson()?.user?.isPro, false);

  // Verify legitimate existing Owner session still resolves cleanly
  const validOwnerSessionJwt = jwt.sign(
    {
      id: "owner-002",
      name: "Mukesh Inland",
      email: SOLE_OWNER,
      role: "owner",
      hasAdminAccess: true,
      mfaVerified: true,
    },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: "1h" }
  );
  const ctxOwner = createMockReqRes({ authorization: `Bearer ${validOwnerSessionJwt}` });
  await handleVerifySession(ctxOwner.req, ctxOwner.res);
  assert.equal(ctxOwner.getStatus(), 200, "Existing Owner session must remain valid");
  assert.equal(ctxOwner.getJson()?.valid, true);
  assert.equal(ctxOwner.getJson()?.user?.email, SOLE_OWNER);
  assert.equal(ctxOwner.getJson()?.role, "owner");
});

test("6. Client validateAdminSession strictly rejects localStorage-only secret key fallback", () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevSessionStorage = (globalThis as any).sessionStorage;

  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };

  try {
    (globalThis as any).window = { localStorage: mockStorage, sessionStorage: mockStorage };
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).sessionStorage = mockStorage;

    // Attack: Inject >=16 char secret key into localStorage without a verified JWT/profile
    mockStorage.setItem("pdfsun_admin_secret_key", "AttackerInjectedLocalSecretKey_9999");

    const resNoProfile = validateAdminSession(null);
    assert.equal(resNoProfile.isValid, false, "localStorage secret alone must NOT validate session");
    assert.equal(resNoProfile.isOwner, false, "localStorage secret alone must NOT grant Owner");
    assert.equal(resNoProfile.role, "unauthorized");
    assert.equal(isAdminActionPermitted(null, "withdraw-funds"), false);

    // Attack: Owner profile + localStorage secret WITHOUT JWT -> must still fail
    const ownerProfile = makeProfile({ email: SOLE_OWNER, role: "owner", hasAdminAccess: true });
    const resSecretOnlyWithProfile = validateAdminSession(ownerProfile, null, "AttackerInjectedLocalSecretKey_9999");
    assert.equal(resSecretOnlyWithProfile.isValid, false, "Secret key without JWT must NOT pass validateAdminSession");

    // Attack: Customer claiming role=owner without server-issued admin clearance -> must fail
    const fakeJwt = "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InRlc3QifQ.signature_part_long_enough_12345";
    const customerForgedOwner = makeProfile({ email: CUSTOMER_EMAIL, role: "owner", hasAdminAccess: false });
    const resForged = validateAdminSession(customerForgedOwner, fakeJwt);
    assert.equal(resForged.isValid, false, "Unverified Customer claiming owner role must fail validateAdminSession");
    assert.equal(resForged.isOwner, false);

    // Legitimate sole Owner with JWT format -> allowed for client hint
    const resOwnerValid = validateAdminSession(ownerProfile, fakeJwt);
    assert.equal(resOwnerValid.isValid, true);
    assert.equal(resOwnerValid.isOwner, true);
    assert.equal(resOwnerValid.role, "owner");

    // Legitimate non-owner Admin with JWT format -> allowed as admin, denied owner-only actions
    mockStorage.setItem("pdfsun_admin_token", fakeJwt);
    const adminProfile = makeProfile({ email: DELEGATED_ADMIN, role: "admin", hasAdminAccess: true });
    const resAdminValid = validateAdminSession(adminProfile);
    assert.equal(resAdminValid.isValid, true);
    assert.equal(resAdminValid.isOwner, false);
    assert.equal(resAdminValid.role, "admin");
    assert.equal(isAdminActionPermitted(adminProfile, "withdraw-funds"), false, "Non-owner Admin must be denied owner-only actions");
    assert.equal(isAdminActionPermitted(adminProfile, "view-analytics"), true);
  } finally {
    if (prevWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = prevWindow;
    if (prevLocalStorage === undefined) delete (globalThis as any).localStorage;
    else (globalThis as any).localStorage = prevLocalStorage;
    if (prevSessionStorage === undefined) delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage = prevSessionStorage;
  }
});

test("7. Behavioral SSR checks for all 5 Admin UI components (role+allowlist conjunction & no plan-name/email-only elevation)", () => {
  const ownerVerified = makeProfile({
    email: SOLE_OWNER,
    name: "Mukesh Inland",
    role: "owner",
    hasAdminAccess: true,
    plan: "Founder & Owner",
  });
  const ownerEmailUserRole = makeProfile({
    email: SOLE_OWNER,
    name: "Downgraded Session",
    role: "user",
    hasAdminAccess: false,
    plan: "Founder & Owner",
  });
  const customerForgedOwner = makeProfile({
    email: CUSTOMER_EMAIL,
    name: "Mukesh Kalonia",
    role: "owner",
    hasAdminAccess: false,
    plan: "Founder & Owner",
  });
  const customerStandard = makeProfile({
    email: CUSTOMER_EMAIL,
    name: "Mukesh Kalonia",
    role: "user",
    hasAdminAccess: false,
    plan: "Admin Owner",
  });
  const delegatedAdmin = makeProfile({
    email: DELEGATED_ADMIN,
    name: "Delegated Admin",
    role: "admin",
    hasAdminAccess: true,
    plan: "Free Plan",
  });

  // 7A. OwnerGrowthIntelligenceDashboard
  const growthEmailOnlyHtml = renderToStaticMarkup(
    React.createElement(OwnerGrowthIntelligenceDashboard, { currentUserEmail: SOLE_OWNER })
  );
  assert.ok(
    growthEmailOnlyHtml.includes("Restricted Owner Business Intelligence"),
    "OwnerGrowthIntelligenceDashboard must deny email-only access without Owner role"
  );

  const growthDowngradedHtml = renderToStaticMarkup(
    React.createElement(OwnerGrowthIntelligenceDashboard, { currentUserProfile: ownerEmailUserRole })
  );
  assert.ok(
    growthDowngradedHtml.includes("Restricted Owner Business Intelligence"),
    "OwnerGrowthIntelligenceDashboard must deny allowlisted email with role=user"
  );

  const growthCustomerForgedHtml = renderToStaticMarkup(
    React.createElement(OwnerGrowthIntelligenceDashboard, { currentUserProfile: customerForgedOwner })
  );
  assert.ok(
    growthCustomerForgedHtml.includes("Restricted Owner Business Intelligence"),
    "OwnerGrowthIntelligenceDashboard must deny Customer even with forged role=owner"
  );

  const growthOwnerHtml = renderToStaticMarkup(
    React.createElement(OwnerGrowthIntelligenceDashboard, { currentUserProfile: ownerVerified })
  );
  assert.ok(
    growthOwnerHtml.includes("PDFSun Growth &amp; Tool Reliability Engine") &&
      growthOwnerHtml.includes("Verified Sole-Owner Master Dashboard"),
    "OwnerGrowthIntelligenceDashboard must allow verified Sole Owner"
  );
  assert.equal(growthOwnerHtml.includes("Mukesh Kalonia"), false, "OwnerGrowthIntelligenceDashboard must not show Mukesh Kalonia as Owner");

  // 7B. ServerSystemConfigForm
  const sysUserRoleHtml = renderToStaticMarkup(
    React.createElement(ServerSystemConfigForm, { currentUserProfile: ownerEmailUserRole })
  );
  assert.ok(
    sysUserRoleHtml.includes("Access Denied: Verified Sole-Owner Clearance Required"),
    "ServerSystemConfigForm must deny allowlisted email with role=user"
  );

  const sysCustomerForgedHtml = renderToStaticMarkup(
    React.createElement(ServerSystemConfigForm, { currentUserProfile: customerForgedOwner })
  );
  assert.ok(
    sysCustomerForgedHtml.includes("Access Denied: Verified Sole-Owner Clearance Required"),
    "ServerSystemConfigForm must deny Customer with forged role=owner"
  );

  const sysOwnerHtml = renderToStaticMarkup(
    React.createElement(ServerSystemConfigForm, { currentUserProfile: ownerVerified })
  );
  assert.ok(
    sysOwnerHtml.includes("SOLE-OWNER RBAC") && !sysOwnerHtml.includes("DUAL-OWNER RBAC"),
    "ServerSystemConfigForm must allow verified Sole Owner with updated Sole-Owner RBAC label"
  );

  // 7C. ApiThrottlingManager
  const throttleDowngradedHtml = renderToStaticMarkup(
    React.createElement(ApiThrottlingManager, { currentUserProfile: ownerEmailUserRole })
  );
  assert.ok(
    throttleDowngradedHtml.includes("Access Denied: Verified Owner or Admin Clearance Required"),
    "ApiThrottlingManager must deny allowlisted email with role=user"
  );

  const throttleCustomerHtml = renderToStaticMarkup(
    React.createElement(ApiThrottlingManager, { currentUserProfile: customerStandard })
  );
  assert.ok(
    throttleCustomerHtml.includes("Access Denied: Verified Owner or Admin Clearance Required"),
    "ApiThrottlingManager must deny standard Customer"
  );

  const throttleAdminHtml = renderToStaticMarkup(
    React.createElement(ApiThrottlingManager, { currentUserProfile: delegatedAdmin })
  );
  assert.ok(
    throttleAdminHtml.includes("Read-Only Admin View") && !throttleAdminHtml.includes("Owner Clearance Granted"),
    "ApiThrottlingManager must restrict non-owner Admin to Read-Only Admin View"
  );

  const throttleOwnerHtml = renderToStaticMarkup(
    React.createElement(ApiThrottlingManager, { currentUserProfile: ownerVerified })
  );
  assert.ok(
    throttleOwnerHtml.includes("Owner Clearance Granted") &&
      throttleOwnerHtml.includes("SOLE-OWNER RBAC") &&
      !throttleOwnerHtml.includes("DUAL-OWNER RBAC"),
    "ApiThrottlingManager must grant Owner Clearance to verified Sole Owner"
  );

  // 7D. AuditLogManager
  const auditDowngradedHtml = renderToStaticMarkup(
    React.createElement(AuditLogManager, { currentUserProfile: ownerEmailUserRole })
  );
  assert.ok(
    auditDowngradedHtml.includes("Access Denied: Verified Sole-Owner Clearance Required"),
    "AuditLogManager must deny allowlisted email with role=user"
  );

  const auditCustomerForgedHtml = renderToStaticMarkup(
    React.createElement(AuditLogManager, { currentUserProfile: customerForgedOwner })
  );
  assert.ok(
    auditCustomerForgedHtml.includes("Access Denied: Verified Sole-Owner Clearance Required"),
    "AuditLogManager must deny Customer with forged role=owner"
  );

  const auditOwnerHtml = renderToStaticMarkup(
    React.createElement(AuditLogManager, { currentUserProfile: ownerVerified })
  );
  assert.ok(
    auditOwnerHtml.includes("Enterprise Audit Logs &amp; Identity Trail"),
    "AuditLogManager must allow verified Sole Owner"
  );

  // 7E. AdminPanel (no plan-name or email-only or forged-isOwner elevation)
  const baseSettings: any = {
    domainName: "https://www.pdfsun.in",
    maintenanceMode: false,
    maxFileSizeMb: 500,
    enableAiFeatures: true,
    adsEnabled: false,
  };
  const noop = () => {};

  const adminPanelCustomerEscalationHtml = renderToStaticMarkup(
    React.createElement(AdminPanel, {
      isOpen: true,
      onClose: noop,
      adminSettings: baseSettings,
      onUpdateSettings: noop,
      initialTab: "profile",
      isOwner: true,
      currentUserProfile: customerStandard,
    })
  );
  assert.ok(
    adminPanelCustomerEscalationHtml.includes("Restricted Admin View"),
    "AdminPanel must NOT grant Owner access based on plan name 'Admin Owner' or isOwner prop for Customer"
  );
  assert.equal(
    adminPanelCustomerEscalationHtml.includes("SOLE-OWNER PLATFORM ADMIN"),
    false,
    "AdminPanel must not render Owner Profile banner for non-Owner"
  );

  const adminPanelDowngradedHtml = renderToStaticMarkup(
    React.createElement(AdminPanel, {
      isOpen: true,
      onClose: noop,
      adminSettings: baseSettings,
      onUpdateSettings: noop,
      initialTab: "profile",
      isOwner: true,
      currentUserProfile: ownerEmailUserRole,
    })
  );
  assert.ok(
    adminPanelDowngradedHtml.includes("Restricted Admin View"),
    "AdminPanel must NOT grant Owner access to allowlisted email when role is 'user'"
  );

  const adminPanelOwnerHtml = renderToStaticMarkup(
    React.createElement(AdminPanel, {
      isOpen: true,
      onClose: noop,
      adminSettings: baseSettings,
      onUpdateSettings: noop,
      initialTab: "profile",
      isOwner: true,
      currentUserProfile: ownerVerified,
    })
  );
  assert.ok(
    adminPanelOwnerHtml.includes("SOLE-OWNER PLATFORM ADMIN") &&
      adminPanelOwnerHtml.includes("Sole-Owner RBAC Enforced"),
    "AdminPanel must grant full Owner view to verified Sole Owner with Sole-Owner labels"
  );
  assert.equal(adminPanelOwnerHtml.includes("DUAL-OWNER PLATFORM ADMIN"), false);
  assert.equal(adminPanelOwnerHtml.includes("Lead Web Developer &amp; Dual Owner"), false);
});

test("8. Server-only Owner identity, audit operator attribution, Google OAuth continuity & 68-tool invariants", () => {
  assert.deepEqual(DUAL_OWNER_EMAILS, [SOLE_OWNER]);
  assert.equal(isOwnerAccountEmail(SOLE_OWNER), true);
  assert.equal(isOwnerAccountEmail(CUSTOMER_EMAIL), false);
  assert.equal(isOwnerAccount(SOLE_OWNER), false);
  assert.equal(isOwnerAccount(CUSTOMER_EMAIL), false);

  const authServiceCode = fs.readFileSync(path.join(ROOT, "src/server/authService.ts"), "utf8");
  assert.equal(
    authServiceCode.includes('DUAL_OWNER_EMAILS.includes(clean) || clean === "mukeshinland79@gmail.com"'),
    false,
    "authService.ts must use single-source server ownerIdentity without hardcoded fallback literal"
  );
  assert.ok(
    authServiceCode.includes('mfaVerified: params.provider === "google"'),
    "Google OAuth continuity in authService.ts must be preserved during Stage 1B.2"
  );

  const mockAuthCode = fs.readFileSync(path.join(ROOT, "src/utils/mockAuth.ts"), "utf8");
  assert.equal(
    mockAuthCode.includes(SOLE_OWNER),
    false,
    "mockAuth.ts must not embed personal Owner email literal in browser bundle"
  );

  const serverCode = fs.readFileSync(path.join(ROOT, "server.ts"), "utf8");
  assert.equal(
    serverCode.includes('return "owner@pdfsun.in";'),
    false,
    "server.ts resolveVerifiedAuditOperator must never fall back to fabricated owner@pdfsun.in"
  );
  assert.ok(
    serverCode.includes("if (req.adminUser?.email) return req.adminUser.email;") &&
      serverCode.includes('return "SYSTEM";'),
    "server.ts resolveVerifiedAuditOperator must prefer req.adminUser?.email and fall back to SYSTEM"
  );

  // Platform 68-tool invariants preserved
  assert.equal(ALL_TOOLS.length, 68, "All 68 tools must remain registered");
  const freeCount = ALL_TOOLS.filter((t) => !t.isPro).length;
  const proCount = ALL_TOOLS.filter((t) => t.isPro).length;
  assert.equal(freeCount, 59, "59 Free tools preserved");
  assert.equal(proCount, 9, "9 Pro tools preserved");
  assert.ok(ALL_TOOLS.some((t) => t.id === "barcode-generator"), "barcode-generator preserved");
  assert.ok(ALL_TOOLS.some((t) => t.id === "qr-code-generator"), "qr-code-generator preserved");
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
  console.log(`\nStage 1B.2 Security Hardening Suite: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
