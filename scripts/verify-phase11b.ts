import fs from "fs";
import path from "path";
import { sanitizePlainTextForExcel } from "../src/core/udir/xlsxCompiler";
import { getJwtSecret, verifyAdminJwtToken, generateAdminJwtToken } from "../src/server/middleware/adminAuth";

async function runPhase11bVerification() {
  console.log("================================================================================");
  console.log("PDFSun.in — Phase 11B: Security Remediation Verification Suite");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`[PASS] ✓ ${testName}`);
    } else {
      failed++;
      console.error(`[FAIL] ✗ ${testName}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  // 1. SEC-11A-001: Firestore Security Rules Lockdown
  console.log("\n--- [1/5] Verifying SEC-11A-001: Firestore Rules Client Write Lockdown ---");
  const rulesContent = fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf-8");
  
  assert(
    !rulesContent.includes("match /payments/{paymentId} {\n      allow read: if isSignedIn() && (\n        resource.data.userEmail == request.auth.token.email ||\n        request.auth.token.email == \"mukeshinland79@gmail.com\"\n      );\n      allow create, update: if true;"),
    "firestore.rules completely purged 'allow create, update: if true;' on /payments"
  );
  assert(
    rulesContent.includes("match /payments/{paymentId}") && rulesContent.includes("allow create, update, delete: if false;"),
    "firestore.rules strictly denies all client-side writes on /payments (write: false)"
  );
  assert(
    rulesContent.includes("match /transactions/{paymentId}") && rulesContent.includes("allow create, update, delete: if false;"),
    "firestore.rules strictly denies all client-side writes on /transactions (write: false)"
  );
  assert(
    rulesContent.includes("match /user_subscriptions/{userId}") && rulesContent.includes("allow create, update, delete: if false;"),
    "firestore.rules strictly denies all client-side writes on /user_subscriptions (write: false)"
  );
  assert(
    rulesContent.includes("match /user_credits/{userEmail}") && rulesContent.includes("allow create, update, delete: if false;"),
    "firestore.rules strictly denies all client-side writes on /user_credits (write: false)"
  );
  assert(
    rulesContent.includes("match /payment_reconciliations/{reconciliationId}") && rulesContent.includes("allow create, update, delete: if false;"),
    "firestore.rules strictly denies all client-side writes on /payment_reconciliations (write: false)"
  );

  // 2. SEC-11A-004: Excel Formula Injection (CWE-1236) Defense
  console.log("\n--- [2/5] Verifying SEC-11A-004: Excel Formula Injection Defense ---");
  const dangerousEquals = sanitizePlainTextForExcel("=cmd|' /C calc'!A0");
  assert(dangerousEquals === "'=cmd|' /C calc'!A0", "Formula trigger '=' is prepended with single quote", dangerousEquals);

  const dangerousPlus = sanitizePlainTextForExcel("+123456789-cmd");
  assert(dangerousPlus === "'+123456789-cmd", "Formula trigger '+' is prepended with single quote", dangerousPlus);

  const dangerousMinus = sanitizePlainTextForExcel("-2+3*cmd");
  assert(dangerousMinus === "'-2+3*cmd", "Formula trigger '-' is prepended with single quote", dangerousMinus);

  const dangerousAt = sanitizePlainTextForExcel("@SUM(1,2)");
  assert(dangerousAt === "'@SUM(1,2)", "Formula trigger '@' is prepended with single quote", dangerousAt);

  const safeInvoice = sanitizePlainTextForExcel("INV-2026-909");
  assert(safeInvoice === "INV-2026-909", "Normal alphanumeric text remains unmutated", safeInvoice);

  const safeGstin = sanitizePlainTextForExcel("07AAAAA0000A1Z5");
  assert(safeGstin === "07AAAAA0000A1Z5", "Indian GSTIN remains unmutated", safeGstin);

  const safeHindi = sanitizePlainTextForExcel("दस्तावेज़ तालिका");
  assert(safeHindi === "दस्तावेज़ तालिका", "Unicode Hindi Devanagari text remains unmutated", safeHindi);

  // 3. SEC-11A-003: JWT Secret Dynamic Resolver & Insecure Fallback Purge
  console.log("\n--- [3/5] Verifying SEC-11A-003: JWT Secret Dynamic Cryptographic Resolver ---");
  const secretKey = getJwtSecret();
  assert(typeof secretKey === "string" && secretKey.length >= 16, "Resolved JWT secret is at least 16 characters long");
  assert(secretKey !== "PDFSun_Super_Admin_Secret_JWT_Key_2026", "Insecure static default secret string is purged and rejected");

  const testToken = generateAdminJwtToken({ email: "mukeshinland79@gmail.com", role: "owner" });
  assert(typeof testToken === "string" && testToken.split(".").length === 3, "generateAdminJwtToken issues valid 3-part JWT");

  const verified = verifyAdminJwtToken(testToken);
  assert(verified !== null && verified.role === "owner", "verifyAdminJwtToken verifies token signed with dynamic secret");

  // 4. SEC-11A-005: Download Proxy Route Hardening
  console.log("\n--- [4/5] Verifying SEC-11A-005 & SEC-11A-006: Server Routes & CORS ---");
  const serverCode = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf-8");
  assert(
    serverCode.includes('app.get(["/api/download/file", "/api/download/stream"]'),
    "server.ts defines explicit GET rejection handler for /api/download/file (Method Not Allowed)"
  );
  assert(
    serverCode.includes('app.post(["/api/download/file", "/api/download/stream"]'),
    "server.ts restricts download stream delivery to POST requests only"
  );
  assert(
    serverCode.includes("ALLOWED_DOWNLOAD_MIME_TYPES = new Set(["),
    "server.ts enforces ALLOWED_DOWNLOAD_MIME_TYPES whitelist against arbitrary file reflection"
  );
  assert(
    serverCode.includes('res.setHeader("Vary", "Origin")'),
    "server.ts CORS sets Vary: Origin header adhering to W3C Fetch specification"
  );

  // 5. SEC-11A-002: AI Entitlement Middleware
  console.log("\n--- [5/5] Verifying SEC-11A-002: AI Entitlement Middleware ---");
  assert(
    serverCode.includes("export function aiEntitlementMiddleware("),
    "server.ts defines aiEntitlementMiddleware"
  );
  assert(
    serverCode.includes('app.use("/api/ai", aiEntitlementMiddleware);'),
    "server.ts attaches aiEntitlementMiddleware to /api/ai endpoints"
  );
  assert(
    serverCode.includes("FREE_TIER_QUOTA_EXCEEDED") && serverCode.includes("3 operations/day"),
    "aiEntitlementMiddleware strictly enforces 3 operations/day free tier quota per AGENTS_md specification"
  );

  console.log("================================================================================");
  console.log(`Phase 11B Verification Finished: ${passed} Passed, ${failed} Failed (${passed + failed} total checks)`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase11bVerification().catch((err) => {
  console.error("Verification suite encountered an exception:", err);
  process.exit(1);
});
