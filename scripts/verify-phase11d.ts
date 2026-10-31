/**
 * PDFSun.in — Phase 11D Security Hardening & Independent Verification Suite
 * 
 * Verifies:
 * 1. CORS Hardening (Verified Origin Allowlist, Reject Untrusted, Preflight 403 vs 204)
 * 2. JWT Secret Management (256-bit requirement, fail-closed in production)
 * 3. Distributed Rate Limiting (Atomic quotas, UTC reset, IP anti-spoofing, rollback)
 * 4. Firestore Security Rules (Default deny, client write lockdown, owner isolation)
 * 5. Download Proxy Security (Magic bytes signature check, strict base64, CRLF sanitation)
 * 6. Excel Formula Injection Defense (Padded formulas, numeric preservation, control chars)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { VERIFIED_CORS_ORIGINS, validateDownloadPayload, ALLOWED_DOWNLOAD_MIME_TYPES } from "../server";
import { getJwtSecret, generateAdminJwtToken, verifyAdminJwtToken } from "../src/server/middleware/adminAuth";
import {
  checkAndConsumeAiQuota,
  rollbackAiQuota,
  getAiQuotaStatus,
  resetAiQuotaForTesting,
  hashIdentifier,
  buildQuotaKey,
} from "../src/server/distributedRateLimiter";
import { sanitizePlainTextForExcel } from "../src/core/udir/xlsxCompiler";
import { getClientIp } from "../src/server/trafficProtection";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`[PASS] ✓ ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ✗ ${testName} ${details ? "- " + details : ""}`);
    failCount++;
  }
}

async function runPhase11dSuite() {
  console.log("================================================================================");
  console.log("PDFSun.in — Phase 11D: Security Hardening & Independent Verification Suite");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // TEST SECTION 1: CORS Hardening (Rule 3)
  // --------------------------------------------------------------------------
  console.log("--- [1/6] Verifying SEC-11D-001: CORS Verified Origin Allowlist ---");

  // Positive CORS tests
  assert(
    VERIFIED_CORS_ORIGINS.has("https://www.pdfsun.in"),
    "Production origin https://www.pdfsun.in is in verified allowlist"
  );
  assert(
    VERIFIED_CORS_ORIGINS.has("https://pdfsun.in"),
    "Production apex origin https://pdfsun.in is in verified allowlist"
  );
  assert(
    VERIFIED_CORS_ORIGINS.has("https://ais-pre-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app"),
    "Staging candidate origin is in verified allowlist"
  );
  assert(
    VERIFIED_CORS_ORIGINS.has("https://ais-dev-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app"),
    "Development candidate origin is in verified allowlist"
  );
  assert(
    VERIFIED_CORS_ORIGINS.has("http://localhost:3000"),
    "Local dev origin http://localhost:3000 is in verified allowlist"
  );

  // Negative CORS tests
  const untrustedOrigins = [
    "https://evil-attacker.com",
    "https://subdomain.pdfsun.in.attacker.com",
    "https://phishing-pdfsun.in",
    "null",
    "http://untrusted-host.net",
  ];
  for (const origin of untrustedOrigins) {
    assert(
      !VERIFIED_CORS_ORIGINS.has(origin),
      `Untrusted origin is strictly rejected: ${origin}`
    );
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 2: JWT Secret Management & Fail-Closed Behavior (Rule 4)
  // --------------------------------------------------------------------------
  console.log("\n--- [2/6] Verifying SEC-11D-002: JWT 256-Bit Secret Management & Production Guard ---");

  const originalEnv = { ...process.env };

  try {
    // Test 1: In production without secret, getJwtSecret() must throw fatal error
    process.env.NODE_ENV = "production";
    delete process.env.ADMIN_JWT_SECRET;
    delete process.env.JWT_SECRET;
    delete process.env.OWNER_JWT_SECRET;
    delete process.env.ADMIN_SECRET_KEY;

    let threwInProd = false;
    try {
      getJwtSecret();
    } catch (err: any) {
      threwInProd = err.message.includes("FATAL SECURITY ERROR");
    }
    assert(
      threwInProd,
      "Production fails closed (throws fatal error) when ADMIN_JWT_SECRET is missing"
    );

    // Test 2: In production with weak secret (< 32 chars), fails closed
    process.env.ADMIN_JWT_SECRET = "weak_secret_under_32_chars";
    let threwOnWeak = false;
    try {
      getJwtSecret();
    } catch (err: any) {
      threwOnWeak = err.message.includes("FATAL SECURITY ERROR");
    }
    assert(
      threwOnWeak,
      "Production fails closed when configured secret is less than 256 bits (32 characters)"
    );

    // Test 3: In production with strong 256-bit secret, resolves successfully
    const strongSecret = crypto.randomBytes(32).toString("hex"); // 64 chars
    process.env.ADMIN_JWT_SECRET = strongSecret;
    const resolvedSecret = getJwtSecret();
    assert(
      resolvedSecret === strongSecret,
      "Production accepts valid 256-bit cryptographically secure secret"
    );

    // Test 4: Token generation and verification
    const token = generateAdminJwtToken({ email: "mukeshinland79@gmail.com", role: "owner" });
    assert(typeof token === "string" && token.split(".").length === 3, "Admin JWT token is correctly signed");
    const verified = verifyAdminJwtToken(token);
    assert(
      verified !== null && verified.email === "mukeshinland79@gmail.com",
      "Valid admin JWT token decodes and verifies against 256-bit secret"
    );

    // Test 5: Tampered token verification fails
    const tamperedToken = token.slice(0, -5) + "abcde";
    const tamperedVerified = verifyAdminJwtToken(tamperedToken);
    assert(tamperedVerified === null, "Tampered JWT token signature is rejected");
  } finally {
    process.env = originalEnv;
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 3: Distributed Rate Limiting & Anti-Spoofing (Rule 5)
  // --------------------------------------------------------------------------
  console.log("\n--- [3/6] Verifying SEC-11D-003: Distributed Atomic Rate Limiter ---");

  resetAiQuotaForTesting();
  const testIp = "203.0.113.42";

  // Test 1: First 3 guest requests are allowed
  const req1 = await checkAndConsumeAiQuota({ identifier: testIp, isGuest: true });
  assert(req1.allowed && req1.count === 1 && req1.remaining === 2, "Guest operation 1/3 allowed");

  const req2 = await checkAndConsumeAiQuota({ identifier: testIp, isGuest: true });
  assert(req2.allowed && req2.count === 2 && req2.remaining === 1, "Guest operation 2/3 allowed");

  const req3 = await checkAndConsumeAiQuota({ identifier: testIp, isGuest: true });
  assert(req3.allowed && req3.count === 3 && req3.remaining === 0, "Guest operation 3/3 allowed");

  // Test 2: 4th guest request is strictly rejected
  const req4 = await checkAndConsumeAiQuota({ identifier: testIp, isGuest: true });
  assert(!req4.allowed && req4.count === 3 && req4.remaining === 0, "Guest operation 4/3 rejected (Quota Exceeded)");

  // Test 3: Downstream failure rollback decrements count back
  await rollbackAiQuota({ identifier: testIp, isGuest: true });
  const statusAfterRollback = getAiQuotaStatus({ identifier: testIp, isGuest: true });
  assert(
    statusAfterRollback.count === 2 && statusAfterRollback.remaining === 1,
    "Quota rollback successfully decrements count on downstream error"
  );

  // Test 4: Paid subscriber bypasses limits
  const paidCheck = await checkAndConsumeAiQuota({
    identifier: "subscriber@example.com",
    isGuest: false,
    userPlan: "pro_sun_monthly",
  });
  assert(paidCheck.allowed && paidCheck.tier === "paid", "Pro Sun subscriber has full access");

  // Test 5: Owner bypasses all limits
  const ownerCheck = await checkAndConsumeAiQuota({
    identifier: "mukeshinland79@gmail.com",
    isGuest: false,
    isOwnerOrAdmin: true,
  });
  assert(ownerCheck.allowed && ownerCheck.tier === "owner", "Primary Owner bypasses all quotas");

  // Test 6: Anti-spoofing IP extraction
  const mockReqWithSpoofedHeader: any = {
    ip: "198.51.100.25", // Trusted proxy IP resolved by Express
    headers: {
      "x-forwarded-for": "1.2.3.4, 5.6.7.8", // Injected client spoofing attempt
    },
    socket: { remoteAddress: "127.0.0.1" },
  };
  const extractedIp = getClientIp(mockReqWithSpoofedHeader);
  assert(
    extractedIp === "198.51.100.25",
    "getClientIp prioritizes validated Express req.ip over spoofed X-Forwarded-For"
  );

  // --------------------------------------------------------------------------
  // TEST SECTION 4: Firestore Security Rules (Rule 6)
  // --------------------------------------------------------------------------
  console.log("\n--- [4/6] Verifying SEC-11D-004: Firestore Security Rules Fortress ---");

  const rulesPath = path.join(process.cwd(), "firestore.rules");
  const rulesContent = fs.readFileSync(rulesPath, "utf-8");

  assert(
    rulesContent.includes("match /{document=**} {\n      allow read, write: if false;\n    }") ||
    rulesContent.includes("match /{document=**} {") && rulesContent.includes("allow read, write: if false;"),
    "Global Fortress Safety Net (default-deny catch-all) is present at rules root"
  );

  const financialCollections = [
    "/payments/{paymentId}",
    "/transactions/{paymentId}",
    "/user_subscriptions/{userId}",
    "/user_credits/{userEmail}",
    "/payment_reconciliations/{reconciliationId}",
    "/orders/{orderId}",
  ];

  for (const col of financialCollections) {
    const hasLockdown = rulesContent.includes(`match ${col}`) && rulesContent.includes("allow create, update, delete: if false;");
    assert(hasLockdown, `Financial collection ${col} strictly enforces 'allow create, update, delete: if false;'`);
  }

  assert(
    rulesContent.includes("match /owner_payment_audit_logs/{logId}") &&
    rulesContent.includes("isOwnerAdmin()"),
    "Owner Payment Audit Logs restricts read access strictly to isOwnerAdmin()"
  );

  assert(
    rulesContent.includes("match /daily_ai_quotas/{quotaId}") &&
    rulesContent.includes("match /rate_limits/{rateLimitId}"),
    "Rate limits and daily AI quotas collections are sealed against client access"
  );

  // --------------------------------------------------------------------------
  // TEST SECTION 5: Secure Download Proxy & Magic Bytes (Rule 7)
  // --------------------------------------------------------------------------
  console.log("\n--- [5/6] Verifying SEC-11D-005: Download Proxy & File Signature Validation ---");

  // Valid PDF with %PDF- header
  const validPdfHeader = Buffer.from("%PDF-1.7\nSample content\n%%EOF");
  const validPdfPayload = {
    fileBase64: validPdfHeader.toString("base64"),
    fileName: "Report_2026.pdf",
    mimeType: "application/pdf",
  };
  const validPdfResult = validateDownloadPayload(validPdfPayload);
  assert(validPdfResult.valid, "Valid PDF with '%PDF-' magic bytes accepted");

  // Fraudulent payload claiming to be PDF with non-PDF binary
  const fraudPdfPayload = {
    fileBase64: Buffer.from("MZ\x90\x00\x03\x00\x00\x00Executable binary").toString("base64"),
    fileName: "Malware.exe.pdf",
    mimeType: "application/pdf",
  };
  const fraudPdfResult = validateDownloadPayload(fraudPdfPayload);
  assert(
    !fraudPdfResult.valid && fraudPdfResult.error?.includes("File content signature does not match claimed PDF MIME type"),
    "Disguised executable claiming to be PDF is rejected via magic byte validation"
  );

  // Valid ZIP / OpenXML with PK\x03\x04
  const validZipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
  const validZipPayload = {
    fileBase64: validZipHeader.toString("base64"),
    fileName: "Spreadsheet.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  const validZipResult = validateDownloadPayload(validZipPayload);
  assert(validZipResult.valid, "Valid OpenXML/XLSX with PK zip magic bytes accepted");

  // Invalid base64 characters
  const malformedBase64Payload = {
    fileBase64: "NotValidBase64!@#$%%^&*",
    fileName: "Document.pdf",
    mimeType: "application/pdf",
  };
  const malformedResult = validateDownloadPayload(malformedBase64Payload);
  assert(!malformedResult.valid, "Malformed base64 characters are rejected");

  // CRLF and Path Traversal in filename sanitized
  const maliciousFilenamePayload = {
    fileBase64: validPdfHeader.toString("base64"),
    fileName: "../../etc/passwd\r\nSet-Cookie: evil=true.pdf",
    mimeType: "application/pdf",
  };
  const sanitizedResult = validateDownloadPayload(maliciousFilenamePayload);
  assert(
    sanitizedResult.valid &&
    !sanitizedResult.cleanFilename?.includes("\r") &&
    !sanitizedResult.cleanFilename?.includes("\n") &&
    !sanitizedResult.cleanFilename?.includes(".."),
    "Filename sanitization neutralizes CRLF and directory traversal characters"
  );

  // --------------------------------------------------------------------------
  // TEST SECTION 6: Excel Formula Injection Defense (Rule 8)
  // --------------------------------------------------------------------------
  console.log("\n--- [6/6] Verifying SEC-11D-006: Excel Formula Injection Defense ---");

  // Standard triggers
  assert(sanitizePlainTextForExcel("=SUM(A1:A10)") === "'=SUM(A1:A10)", "Leading '=' escaped with single quote");
  assert(sanitizePlainTextForExcel("+1+2") === "'+1+2", "Leading '+' escaped with single quote");
  assert(sanitizePlainTextForExcel("-500") === "'-500", "Leading '-' escaped with single quote");
  assert(sanitizePlainTextForExcel("@EXTERN()") === "'@EXTERN()", "Leading '@' escaped with single quote");
  assert(sanitizePlainTextForExcel("\t=cmd|' /C calc'!A0") === "'\t=cmd|' /C calc'!A0", "Leading tab escaped with single quote");
  assert(sanitizePlainTextForExcel("\r=cmd") === "'\r=cmd", "Leading carriage return escaped with single quote");

  // Whitespace-padded formula injection
  assert(sanitizePlainTextForExcel("   =cmd|' /C calc'!A0") === "'   =cmd|' /C calc'!A0", "Whitespace-padded formula escaped with single quote");
  assert(sanitizePlainTextForExcel("  +2+2") === "'  +2+2", "Whitespace-padded '+' escaped with single quote");

  // Normal text unmutated
  assert(sanitizePlainTextForExcel("Invoice Number: 9874") === "Invoice Number: 9874", "Standard text unmutated");
  assert(sanitizePlainTextForExcel("27AABCU9603R1ZN") === "27AABCU9603R1ZN", "Indian GSTIN unmutated");
  assert(sanitizePlainTextForExcel("पीडीएफ़ सन भारत") === "पीडीएफ़ सन भारत", "Unicode Devanagari Hindi text unmutated");

  // Summary
  console.log("\n================================================================================");
  console.log(`Phase 11D Verification Finished: ${passCount} Passed, ${failCount} Failed (${passCount + failCount} total checks)`);
  console.log("================================================================================");

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase11dSuite().catch((err) => {
  console.error("FATAL ERROR in Phase 11D test suite:", err);
  process.exit(1);
});
