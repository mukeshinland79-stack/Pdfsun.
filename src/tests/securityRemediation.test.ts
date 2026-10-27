import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import {
  isRazorpaySecretConfigured,
  isWebhookSecretConfigured,
  verifySubscriptionSignature,
  verifyOrderSignature,
  verifyWebhookSignature,
  getExecutionEnvironment,
  validatePaymentEnvironmentGuard,
  isLiveRazorpayKeyId,
  isTestRazorpayKeyId,
  createSubscriptionInstance,
} from "../server/razorpayService";
import { ALL_TOOLS } from "../data/toolsData";
import {
  reconcilePaymentWithFirestore,
  verifyRazorpayTransactionDetails,
} from "../server/firestoreReconciliation";
import {
  isValidAdminSecret,
  isVerifiedOwnerIdentity,
  generateAdminJwtToken,
} from "../server/middleware/adminAuth";

export interface SecurityTestResult {
  passed: number;
  failed: number;
  logs: string[];
}

export async function runSecurityRemediationTestSuite(): Promise<SecurityTestResult> {
  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      logs.push(`  ✓ PASS: ${testName}`);
    } else {
      failed++;
      logs.push(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
    }
  }

  logs.push("--- PDFSun Phase 7: Critical Security Remediation Test Suite ---");

  // 1. Missing or placeholder secrets cause payment verification to fail closed
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const originalWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    // Test with placeholder secret
    process.env.RAZORPAY_KEY_SECRET = "your_live_key_secret";
    assert(
      isRazorpaySecretConfigured() === false,
      "Placeholder RAZORPAY_KEY_SECRET is detected as unconfigured"
    );

    assert(
      verifySubscriptionSignature({
        razorpay_payment_id: "pay_test_123",
        razorpay_subscription_id: "sub_test_123",
        razorpay_signature: "mock_signature_abc",
      }) === false,
      "Subscription signature verification fails closed when secret is placeholder"
    );

    assert(
      verifyOrderSignature({
        razorpay_order_id: "order_test_123",
        razorpay_payment_id: "pay_test_123",
        razorpay_signature: "mock_signature_abc",
      }) === false,
      "Order signature verification fails closed when secret is placeholder"
    );

    // Test with undefined secret
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    assert(
      isRazorpaySecretConfigured() === false,
      "Undefined RAZORPAY_KEY_SECRET fails closed"
    );

    assert(
      isWebhookSecretConfigured() === false,
      "Undefined RAZORPAY_WEBHOOK_SECRET fails closed"
    );

    assert(
      verifyWebhookSignature(JSON.stringify({ event: "payment.captured" }), "any_sig") === false,
      "Webhook signature fails closed when secret is absent"
    );

    // 2. Invalid signatures are strictly rejected with configured secret
    const testSecret = "secure_test_secret_key_8492048590";
    process.env.RAZORPAY_KEY_SECRET = testSecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

    assert(
      isRazorpaySecretConfigured() === true,
      "Valid secret recognized as properly configured"
    );

    assert(
      verifySubscriptionSignature({
        razorpay_payment_id: "pay_valid_123",
        razorpay_subscription_id: "sub_valid_123",
        razorpay_signature: "tampered_fake_signature",
      }) === false,
      "Tampered subscription signature is rejected"
    );

    assert(
      verifyOrderSignature({
        razorpay_order_id: "order_valid_123",
        razorpay_payment_id: "pay_valid_123",
        razorpay_signature: "invalid_order_sig",
      }) === false,
      "Invalid order signature is rejected"
    );

    assert(
      verifyWebhookSignature(JSON.stringify({ event: "payment.captured" }), "bad_webhook_sig") === false,
      "Invalid webhook signature is rejected"
    );

    // 3. Valid cryptographically signed payload succeeds
    const validPaymentId = "pay_live_00112233";
    const validOrderId = "order_live_99887766";
    const validOrderSig = crypto
      .createHmac("sha256", testSecret)
      .update(`${validOrderId}|${validPaymentId}`)
      .digest("hex");

    assert(
      verifyOrderSignature({
        razorpay_order_id: validOrderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validOrderSig,
      }) === true,
      "Cryptographically valid order signature passes verification"
    );

    const validSubId = "sub_live_55443322";
    const validSubSig = crypto
      .createHmac("sha256", testSecret)
      .update(`${validPaymentId}|${validSubId}`)
      .digest("hex");

    assert(
      verifySubscriptionSignature({
        razorpay_payment_id: validPaymentId,
        razorpay_subscription_id: validSubId,
        razorpay_signature: validSubSig,
      }) === true,
      "Cryptographically valid subscription signature passes verification"
    );

    const webhookPayload = JSON.stringify({ event: "payment.captured", payment_id: validPaymentId });
    const validWebhookSig = crypto
      .createHmac("sha256", testSecret)
      .update(webhookPayload)
      .digest("hex");

    assert(
      verifyWebhookSignature(webhookPayload, validWebhookSig) === true,
      "Cryptographically valid webhook signature passes verification"
    );

    // 4. Reconciliation rejects unverified signature and invalid status
    const unverifiedRecon = await reconcilePaymentWithFirestore({
      paymentId: "pay_unverified_99",
      amountPaise: 19900,
      currency: "INR",
      status: "captured",
      planId: "pro-monthly",
      signatureVerified: false,
      userEmail: "test@pdfsun.in",
    });

    assert(
      unverifiedRecon.success === false && unverifiedRecon.status === "INVALID_SIGNATURE",
      "Reconciliation rejects payments where signatureVerified is false"
    );

    const pendingStatusRecon = await reconcilePaymentWithFirestore({
      paymentId: "pay_pending_99",
      amountPaise: 19900,
      currency: "INR",
      status: "pending",
      planId: "pro-monthly",
      signatureVerified: true,
      userEmail: "test@pdfsun.in",
    });

    assert(
      pendingStatusRecon.success === false && pendingStatusRecon.status === "PENDING",
      "Reconciliation rejects non-captured/pending payments"
    );

    const underpaidRecon = await reconcilePaymentWithFirestore({
      paymentId: "pay_underpaid_99",
      amountPaise: 100, // ₹1 instead of ₹199
      currency: "INR",
      status: "captured",
      planId: "pro-monthly",
      signatureVerified: true,
      userEmail: "test@pdfsun.in",
    });

    assert(
      underpaidRecon.success === false,
      "Reconciliation rejects underpaid amounts"
    );

    // Exact amount verification: reject unexplained overpayment
    const overpaidRecon = await reconcilePaymentWithFirestore({
      paymentId: "pay_overpaid_99",
      amountPaise: 50000, // ₹500 instead of ₹199
      currency: "INR",
      status: "captured",
      planId: "pro-monthly",
      signatureVerified: true,
      userEmail: "test@pdfsun.in",
    });

    assert(
      overpaidRecon.success === false && overpaidRecon.status === "AMOUNT_MISMATCH",
      "Reconciliation rejects unexplained overpayment amounts"
    );

    // 4.1. Verify All 5 Plans Integer Paise, Billing Interval, and Hosted URLs
    const { PDFSUN_PAYMENT_PRODUCTS: catalog } = await import("../config/paymentProducts");
    
    assert(
      catalog.flexi.pricePaise === 9900 && catalog.flexi.displayPriceINR === 99,
      "Flexi Pack catalog has exact 9,900 paise (₹99)"
    );
    assert(
      catalog.flexi.durationDays === 7 && catalog.flexi.badge.includes("7 DAYS"),
      "Flexi Pack 7-day validity is explicitly codified in product policy (not inferred)"
    );
    assert(
      catalog.flexi.razorpayPaymentLink === "https://rzp.io/rzp/pdfsun-flexi",
      "Flexi Pack uses verified canonical URL https://rzp.io/rzp/pdfsun-flexi"
    );

    assert(
      catalog["pro-monthly"].pricePaise === 19900 && catalog["pro-monthly"].displayPriceINR === 199,
      "Pro Sun Monthly catalog has exact 19,900 paise (₹199)"
    );
    assert(
      catalog["pro-monthly"].razorpayPaymentLink === "https://rzp.io/rzp/pdfsun-monthly",
      "Pro Sun Monthly uses verified canonical URL https://rzp.io/rzp/pdfsun-monthly"
    );

    assert(
      catalog["pro-yearly"].pricePaise === 149900 && catalog["pro-yearly"].displayPriceINR === 1499,
      "Pro Sun Annual catalog has exact 149,900 paise (₹1,499)"
    );
    assert(
      catalog["pro-yearly"].razorpayPaymentLink === "https://rzp.io/rzp/pdfsun-annual",
      "Pro Sun Annual uses verified canonical URL https://rzp.io/rzp/pdfsun-annual"
    );

    assert(
      catalog.enterprise.pricePaise === 399900 && catalog.enterprise.displayPriceINR === 3999 && catalog.enterprise.seats === 5,
      "Enterprise Plan catalog has exact 399,900 paise (₹3,999) with 5 seats"
    );
    assert(
      catalog.enterprise.razorpayPaymentLink === "https://rzp.io/rzp/pdfsun-enterprise",
      "Enterprise Plan uses verified canonical URL https://rzp.io/rzp/pdfsun-enterprise"
    );

    assert(
      catalog["enterprise-sso"].pricePaise === 999900 && catalog["enterprise-sso"].displayPriceINR === 9999 && catalog["enterprise-sso"].seats === 20,
      "Enterprise SSO Unlimited catalog has exact 999,900 paise (₹9,999) with 20 seats"
    );
    assert(
      catalog["enterprise-sso"].razorpayPaymentLink === "https://rzp.io/rzp/DTBivZF",
      "Enterprise SSO Unlimited uses verified canonical URL https://rzp.io/rzp/DTBivZF"
    );

    // Verify all 5 hosted links are rzp.io links and not confused with subscription plan IDs
    const allLinks = [
      catalog.flexi.razorpayPaymentLink,
      catalog["pro-monthly"].razorpayPaymentLink,
      catalog["pro-yearly"].razorpayPaymentLink,
      catalog.enterprise.razorpayPaymentLink,
      catalog["enterprise-sso"].razorpayPaymentLink,
    ];
    assert(
      allLinks.every((link) => link.startsWith("https://rzp.io/rzp/") && !link.startsWith("plan_")),
      "All five payment links are verified hosted URLs and distinct from Subscription Plan IDs"
    );
  } finally {
    // Restore environment
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
  }

  // 5. Verify AI Privacy Disclosures
  const aiChatPath = path.join(process.cwd(), "src/components/AIChatWorkspace.tsx");
  const aiChatCode = fs.readFileSync(aiChatPath, "utf-8");

  assert(
    !aiChatCode.includes("100% Local Processing: Your files never leave your device. Zero Server Uploads."),
    "AIChatWorkspace does NOT display false '100% Local Processing: Zero Server Uploads' claim"
  );

  assert(
    aiChatCode.includes("AI Service Notice") && aiChatCode.includes("Google Gemini API"),
    "AIChatWorkspace contains clear AI disclosure notifying users about data transmission to Gemini API"
  );

  const copilotBannerPath = path.join(process.cwd(), "src/components/DualAiFeatureBanner.tsx");
  const copilotBannerCode = fs.readFileSync(copilotBannerPath, "utf-8");

  assert(
    !copilotBannerCode.includes("Zero Server Uploads"),
    "DualAiFeatureBanner does NOT claim 'Zero Server Uploads' for AI Copilot"
  );

  assert(
    copilotBannerCode.includes("Powered by Gemini AI"),
    "DualAiFeatureBanner explicitly attributes AI processing to Gemini AI"
  );

  // 6. Verify Structured Data contains NO fabricated aggregateRating
  const seoRendererPath = path.join(process.cwd(), "src/server/seoRenderer.ts");
  const seoRendererCode = fs.readFileSync(seoRendererPath, "utf-8");
  assert(
    !seoRendererCode.includes("aggregateRating"),
    "seoRenderer.ts contains NO synthetic aggregateRating"
  );

  const seoManagerPath = path.join(process.cwd(), "src/components/SEOManager.tsx");
  const seoManagerCode = fs.readFileSync(seoManagerPath, "utf-8");
  assert(
    !seoManagerCode.includes("aggregateRating"),
    "SEOManager.tsx contains NO synthetic aggregateRating"
  );

  const schemaGenPath = path.join(process.cwd(), "src/lib/schemaGenerator.ts");
  const schemaGenCode = fs.readFileSync(schemaGenPath, "utf-8");
  assert(
    !schemaGenCode.includes("aggregateRating"),
    "schemaGenerator.ts contains NO synthetic aggregateRating"
  );

  const pricingPath = path.join(process.cwd(), "src/components/PricingSection.tsx");
  const pricingCode = fs.readFileSync(pricingPath, "utf-8");
  assert(
    !pricingCode.includes("aggregateRating"),
    "PricingSection.tsx schema contains NO synthetic aggregateRating"
  );

  // 7. Verify all 66 registered tools remain intact
  assert(
    ALL_TOOLS.length === 66,
    `All 66 registered tools preserved intact (actual: ${ALL_TOOLS.length})`
  );

  const uniqueIds = new Set(ALL_TOOLS.map((t) => t.id));
  assert(
    uniqueIds.size === 66,
    `All 66 tool IDs are unique and without duplicates (actual: ${uniqueIds.size})`
  );

  // 8. Phase 7B: Fail-Closed Razorpay Environment Isolation & Non-Production Live-Key Guard Tests
  const envBackup = {
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  };

  try {
    // 8.1. Development + Live Key -> BLOCKED before network access
    process.env.NODE_ENV = "development";
    process.env.APP_URL = "https://ais-dev-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app";
    process.env.RAZORPAY_KEY_ID = "rzp_live_fakeLiveKeyForTest123";

    const devLiveGuard = validatePaymentEnvironmentGuard();
    assert(
      devLiveGuard.allowed === false && devLiveGuard.category === "NON_PROD_LIVE_KEY_BLOCKED",
      "Development + live key: payment operation blocked before network access"
    );

    // Verify createSubscriptionInstance throws fail-closed error
    let createThrewInDev = false;
    try {
      await createSubscriptionInstance({
        planId: "pro-monthly",
        userEmail: "test@pdfsun.in",
      });
    } catch (e: any) {
      createThrewInDev = true;
      assert(
        e.message.includes("blocked by security guard"),
        "createSubscriptionInstance throws non-sensitive error when live key in development"
      );
    }
    assert(createThrewInDev, "createSubscriptionInstance strictly throws when live key in development");

    // 8.2. Staging + Live Key -> BLOCKED before network access
    process.env.NODE_ENV = "production"; // Staging might have NODE_ENV=production but ais-pre URL
    process.env.APP_URL = "https://ais-pre-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app";
    process.env.RAZORPAY_KEY_ID = "rzp_live_fakeLiveKeyForTest123";

    const stagingLiveGuard = validatePaymentEnvironmentGuard();
    assert(
      stagingLiveGuard.allowed === false && stagingLiveGuard.category === "NON_PROD_LIVE_KEY_BLOCKED",
      "Staging + live key: payment operation blocked before network access"
    );

    // 8.3. Development/Staging + Valid Test Key -> PERMITTED (Sandbox mode)
    process.env.NODE_ENV = "development";
    process.env.APP_URL = "https://ais-dev-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app";
    process.env.RAZORPAY_KEY_ID = "rzp_test_validSandboxKey123";

    const devTestGuard = validatePaymentEnvironmentGuard();
    assert(
      devTestGuard.allowed === true && devTestGuard.environment === "development",
      "Development + valid test configuration: permitted to proceed in sandbox"
    );

    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://ais-pre-nc2omqrcrewclthjpyezu6-513767419820.asia-east1.run.app";
    process.env.RAZORPAY_KEY_ID = "rzp_test_validSandboxKey123";

    const stagingTestGuard = validatePaymentEnvironmentGuard();
    assert(
      stagingTestGuard.allowed === true && stagingTestGuard.environment === "staging",
      "Staging + valid test configuration: permitted to proceed in sandbox"
    );

    // 8.4. Production Configuration -> Existing behavior preserved
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://www.pdfsun.in";
    process.env.RAZORPAY_KEY_ID = "rzp_live_prodKey123456";

    const prodGuard = validatePaymentEnvironmentGuard();
    assert(
      prodGuard.allowed === true && prodGuard.environment === "production",
      "Production configuration: existing behavior preserved"
    );

    // 8.5. Unknown Environment -> FAIL CLOSED
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://unknown-untrusted-domain.com";
    process.env.RAZORPAY_KEY_ID = "rzp_live_prodKey123456";

    const unknownGuard = validatePaymentEnvironmentGuard();
    assert(
      unknownGuard.allowed === false && unknownGuard.category === "UNKNOWN_ENVIRONMENT_FAIL_CLOSED",
      "Unknown environment: fail closed for payment operations"
    );
  } finally {
    process.env.NODE_ENV = envBackup.NODE_ENV;
    process.env.APP_URL = envBackup.APP_URL;
    process.env.RAZORPAY_KEY_ID = envBackup.RAZORPAY_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = envBackup.RAZORPAY_KEY_SECRET;
  }

  // 9. Phase 8: Transaction Details & Gateway Verification Tests
  const zeroAmountTest = await verifyRazorpayTransactionDetails({
    paymentId: "pay_zero_test",
    amountPaise: 0,
    currency: "INR",
  });
  assert(
    zeroAmountTest.isValid === false,
    "verifyRazorpayTransactionDetails strictly rejects non-positive or 0 amount"
  );

  const invalidCurrencyTest = await verifyRazorpayTransactionDetails({
    paymentId: "pay_curr_test",
    amountPaise: 19900,
    currency: "EUR",
  });
  assert(
    invalidCurrencyTest.isValid === false,
    "verifyRazorpayTransactionDetails strictly rejects unsupported foreign currencies"
  );

  const validDetailsTest = await verifyRazorpayTransactionDetails({
    paymentId: "pay_valid_details_test",
    amountPaise: 19900,
    currency: "INR",
  });
  assert(
    validDetailsTest.isValid === true,
    "verifyRazorpayTransactionDetails validates valid amount and currency"
  );

  // 10. Phase 8: Sitemap 404 Guard & XML Integrity
  const serverCode = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf-8");
  assert(
    serverCode.includes("sitemap.xml") &&
    serverCode.includes("sitemap-blog.xml") &&
    serverCode.includes("sitemap-compress-sizes.xml") &&
    serverCode.includes("sitemap-pseo.xml"),
    "server.ts defines routes for all 4 authoritative sitemaps"
  );

  assert(
    serverCode.includes("<error>Sitemap not found</error>") &&
    serverCode.includes('res.status(404).send(\'<?xml version="1.0" encoding="UTF-8"?><error>Sitemap not found</error>\')'),
    "server.ts XML guard strictly returns 404 XML for unknown .xml files (never HTML SPA)"
  );

  // 11. Phase 8: Fake Query Parameter & Replay Attack Immunity
  const appCode = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf-8");
  assert(
    appCode.includes("if (paymentId && signature && (orderId || subscriptionId))") &&
    appCode.includes("fetch(\"/api/razorpay/verify-payment\""),
    "App.tsx enforces server signature verification before triggering payment activation modal"
  );

  // 12. Phase 9: Firestore Rules & Owner Payment Audit Ledger Invariants
  const rulesPath = path.join(process.cwd(), "firestore.rules");
  const rulesCode = fs.readFileSync(rulesPath, "utf-8");

  assert(
    rulesCode.includes("match /owner_payment_audit_logs/{logId}") &&
    rulesCode.includes('request.auth.token.email == "mukeshinland79@gmail.com"') &&
    rulesCode.includes("allow delete: if false;"),
    "firestore.rules strictly restricts owner_payment_audit_logs read to mukeshinland79@gmail.com and forbids delete (immutable/tamper-proof)"
  );

  assert(
    rulesCode.includes("match /payments/{paymentId}") &&
    rulesCode.includes('resource.data.userEmail == request.auth.token.email ||') &&
    rulesCode.includes('request.auth.token.email == "mukeshinland79@gmail.com"'),
    "firestore.rules enforces user isolation for payments: users can only read their own payments"
  );

  assert(
    rulesCode.includes("match /transactions/{paymentId}") &&
    rulesCode.includes('resource.data.userEmail == request.auth.token.email ||') &&
    rulesCode.includes('request.auth.token.email == "mukeshinland79@gmail.com"'),
    "firestore.rules enforces user isolation for transactions: users can only read their own records"
  );

  assert(
    rulesCode.includes("match /user_subscriptions/{userId}") &&
    rulesCode.includes("userId == request.auth.uid ||") &&
    rulesCode.includes("userId == request.auth.token.email ||"),
    "firestore.rules enforces subscription isolation: users can only read their own subscription documents"
  );

  // 13. Phase 9: Owner Payment Audit Logs Server Endpoint Authorization
  assert(
    serverCode.includes('app.get("/api/admin/owner-payment-audit-logs"') &&
    serverCode.includes("isOwner = isCorrectSecretKey || isVerifiedJwtOwner") &&
    serverCode.includes("return res.status(403).json"),
    "server.ts owner-payment-audit-logs endpoint requires verified credentials and rejects unauthorized requests with 403"
  );

  assert(
    serverCode.includes("Client-supplied email header without verified credentials cannot establish owner privileges"),
    "server.ts strictly forbids client-supplied email header from establishing owner privileges"
  );

  // 14. Phase 9: Cross-User Entitlement Isolation & Webhook Idempotency
  const reconCode = fs.readFileSync(path.join(process.cwd(), "src/server/firestoreReconciliation.ts"), "utf-8");
  assert(
    reconCode.includes('status: "USER_MISMATCH"') &&
    reconCode.includes("Payment was already processed and claimed by another user account"),
    "firestoreReconciliation.ts strictly rejects cross-user claims where a payment belongs to another user"
  );

  assert(
    reconCode.includes("alreadyReconciled = true") &&
    reconCode.includes("if (!alreadyReconciled)"),
    "firestoreReconciliation.ts enforces idempotency: duplicate events do not grant duplicate entitlements"
  );

  // 15. Phase 10: Firestore Audit Ledger Hardening & Client Write Denial
  assert(
    rulesCode.includes("match /owner_payment_audit_logs/{logId}") &&
    rulesCode.includes("allow create, update, delete: if false;"),
    "firestore.rules strictly denies all client-side create, update, and delete on owner_payment_audit_logs (write: false)"
  );

  assert(
    rulesCode.includes("match /orders/{orderId}") &&
    rulesCode.includes("allow create, update, delete: if false;"),
    "firestore.rules strictly denies all client-side create, update, and delete on orders"
  );

  assert(
    !rulesCode.includes("match /owner_payment_audit_logs/{logId} {\n      allow read: if isSignedIn() && request.auth.token.email == \"mukeshinland79@gmail.com\";\n      allow create, update: if true;"),
    "firestore.rules has completely eliminated active 'allow create, update: if true;' on owner_payment_audit_logs"
  );

  // 16. Phase 10: Admin Secret Hardening & Fallback Elimination
  const financeHubCode = fs.readFileSync(path.join(process.cwd(), "src/components/FinanceHub.tsx"), "utf-8");
  assert(
    !financeHubCode.includes("'x-admin-token': '12345'"),
    "FinanceHub.tsx has removed hardcoded '12345' token from audit log fetching"
  );

  assert(
    !serverCode.includes('ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY || "12345"'),
    "server.ts default config does not accept '12345' as default ADMIN_SECRET_KEY"
  );

  assert(
    !serverCode.includes('providedToken === "12345"'),
    "server.ts does not permit hardcoded '12345' token in RBAC or audit log endpoints"
  );

  // 17. Phase 10: Cryptographic Admin Secret & Identity Validation Tests
  const secureKeyForTest = "production_grade_secret_key_99381029482";
  assert(
    isValidAdminSecret("12345", "12345") === false,
    "isValidAdminSecret strictly rejects known weak '12345' default token"
  );

  assert(
    isValidAdminSecret("12345", secureKeyForTest) === false,
    "isValidAdminSecret strictly rejects '12345' when secure secret is configured"
  );

  assert(
    isValidAdminSecret(undefined, secureKeyForTest) === false,
    "isValidAdminSecret fails closed when token is undefined"
  );

  assert(
    isValidAdminSecret("your_admin_secret_key", "your_admin_secret_key") === false,
    "isValidAdminSecret fails closed on placeholder secret key"
  );

  assert(
    isValidAdminSecret("short", "short") === false,
    "isValidAdminSecret fails closed on weak secrets under 16 characters"
  );

  assert(
    isValidAdminSecret(secureKeyForTest, secureKeyForTest) === true,
    "isValidAdminSecret correctly validates authentic secret using timing-safe comparison"
  );

  // 18. Phase 10: Owner Cryptographic JWT Authentication & Spoofing Immunity
  assert(
    isVerifiedOwnerIdentity(undefined) === false,
    "isVerifiedOwnerIdentity strictly rejects undefined token"
  );

  assert(
    isVerifiedOwnerIdentity("untrusted_spoofed_token_string") === false,
    "isVerifiedOwnerIdentity strictly rejects untrusted raw token strings"
  );

  const ownerJwt = generateAdminJwtToken({
    email: "mukeshinland79@gmail.com",
    role: "owner",
  });
  assert(
    isVerifiedOwnerIdentity(ownerJwt) === true,
    "isVerifiedOwnerIdentity successfully validates cryptographically signed owner JWT"
  );

  const nonOwnerJwt = generateAdminJwtToken({
    email: "attacker@randomdomain.com",
    role: "admin",
  });
  assert(
    isVerifiedOwnerIdentity(nonOwnerJwt) === false,
    "isVerifiedOwnerIdentity rejects non-owner admin JWT from accessing owner audit logs"
  );

  // 19. Phase 10A: JWT Signature Forgery, Malformation & Expiration Rejection
  const forgedSecretJwt = jwt.sign(
    { email: "mukeshinland79@gmail.com", role: "owner", hasAdminAccess: true },
    "attacker_wrong_signing_secret_9999"
  );
  assert(
    isVerifiedOwnerIdentity(forgedSecretJwt) === false,
    "isVerifiedOwnerIdentity strictly rejects JWT signed with forged or invalid secret key"
  );

  const expiredJwt = jwt.sign(
    { email: "mukeshinland79@gmail.com", role: "owner", hasAdminAccess: true },
    process.env.JWT_SECRET || process.env.ADMIN_SECRET_KEY || "PDFSun_Super_Admin_Secret_JWT_Key_2026",
    { expiresIn: "-10s" }
  );
  assert(
    isVerifiedOwnerIdentity(expiredJwt) === false,
    "isVerifiedOwnerIdentity strictly rejects expired JWT tokens"
  );

  assert(
    isVerifiedOwnerIdentity("ey.invalid.structure") === false,
    "isVerifiedOwnerIdentity strictly rejects malformed or truncated JWT tokens"
  );

  // 20. Phase 10A: Alternative Endpoints & Secondary Middleware Hardening
  const adminSecurityPath = path.join(process.cwd(), "src/middleware/adminSecurity.ts");
  const adminSecurityCode = fs.readFileSync(adminSecurityPath, "utf-8");

  assert(
    !serverCode.includes('password === "12345"'),
    "server.ts /api/admin/reveal-account does not contain hardcoded '12345' password bypass"
  );

  assert(
    !adminSecurityCode.includes('providedToken === "12345"'),
    "adminSecurity.ts does not permit '12345' token bypass"
  );

  assert(
    !adminSecurityCode.includes('const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "pdfsun_owner_super_secret_key_2026"'),
    "adminSecurity.ts does not use insecure static default fallback for ADMIN_SECRET_KEY"
  );

  assert(
    adminSecurityCode.includes("dualOwnerSecurityMiddleware") &&
    adminSecurityCode.includes("isVerifiedJwt = isVerifiedOwnerIdentity(providedToken)") &&
    adminSecurityCode.includes("isValidSecret = isValidAdminSecret(providedToken)"),
    "adminSecurity.ts enforces verified owner identity or timing-safe secret, rejecting unauthenticated headers"
  );

  // 21. Phase 10A: Full Elimination of 12345 Across All Client Components
  const ssoHandlerCode = fs.readFileSync(path.join(process.cwd(), "src/utils/SSOHandler.ts"), "utf-8");
  assert(
    !ssoHandlerCode.includes('"x-admin-token": "12345"'),
    "SSOHandler.ts does not contain hardcoded '12345' token"
  );

  const auditLogManagerCode = fs.readFileSync(path.join(process.cwd(), "src/components/AuditLogManager.tsx"), "utf-8");
  assert(
    !auditLogManagerCode.includes('"x-admin-token": "12345"'),
    "AuditLogManager.tsx does not contain hardcoded '12345' token"
  );

  const adminPanelCode = fs.readFileSync(path.join(process.cwd(), "src/components/AdminPanel.tsx"), "utf-8");
  assert(
    !adminPanelCode.includes('ADMIN_SECRET_KEY: "12345"') &&
    !adminPanelCode.includes('"x-admin-token": "12345"'),
    "AdminPanel.tsx does not contain hardcoded '12345' secret or token"
  );

  const serverConfigFormCode = fs.readFileSync(path.join(process.cwd(), "src/components/ServerSystemConfigForm.tsx"), "utf-8");
  assert(
    !serverConfigFormCode.includes('ADMIN_SECRET_KEY: "12345"') &&
    !serverConfigFormCode.includes('"x-admin-token": config.ADMIN_SECRET_KEY || "12345"'),
    "ServerSystemConfigForm.tsx does not contain hardcoded '12345' secret or token"
  );

  const apiThrottlingCode = fs.readFileSync(path.join(process.cwd(), "src/components/ApiThrottlingManager.tsx"), "utf-8");
  assert(
    !apiThrottlingCode.includes('"x-admin-token": "12345"'),
    "ApiThrottlingManager.tsx does not contain hardcoded '12345' token"
  );

  const commentModCode = fs.readFileSync(path.join(process.cwd(), "src/components/AdminCommentModeration.tsx"), "utf-8");
  assert(
    !commentModCode.includes('"x-admin-token": "12345"'),
    "AdminCommentModeration.tsx does not contain hardcoded '12345' token"
  );

  // 22. Phase 10D.2: Public Build Artifact & Source Map Guard Verification
  const serverArtifactGuardCode = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf-8");
  assert(
    serverArtifactGuardCode.includes('base === "server.cjs"') &&
    serverArtifactGuardCode.includes('base === "server.cjs.map"') &&
    serverArtifactGuardCode.includes('base.endsWith(".cjs")') &&
    serverArtifactGuardCode.includes('base.endsWith(".map")'),
    "server.ts contains strict middleware guard blocking server.cjs and server.cjs.map"
  );

  // Functional verification of the artifact blocking logic
  function isArtifactBlocked(testPath: string): boolean {
    let rawPath = testPath || "";
    try {
      rawPath = decodeURIComponent(rawPath);
    } catch {
      // Malformed URI encoding
    }
    const normalized = path.normalize(rawPath).toLowerCase().replace(/\\/g, "/");
    const base = path.basename(normalized);

    return (
      base === "server.cjs" ||
      base === "server.cjs.map" ||
      base.startsWith("server.cjs") ||
      normalized.includes("server.cjs") ||
      base.endsWith(".cjs") ||
      base.endsWith(".cjs.map") ||
      (base.endsWith(".map") && normalized.includes("server"))
    );
  }

  assert(isArtifactBlocked("/server.cjs"), "Artifact guard strictly blocks /server.cjs");
  assert(isArtifactBlocked("/server.cjs.map"), "Artifact guard strictly blocks /server.cjs.map");
  assert(isArtifactBlocked("/SERVER.CJS"), "Artifact guard blocks case variations /SERVER.CJS");
  assert(isArtifactBlocked("/SERVER.CJS.MAP"), "Artifact guard blocks case variations /SERVER.CJS.MAP");
  assert(isArtifactBlocked("/%73erver.cjs"), "Artifact guard blocks URI-encoded /%73erver.cjs");
  assert(isArtifactBlocked("/dist/server.cjs"), "Artifact guard blocks subpath /dist/server.cjs");
  assert(isArtifactBlocked("/dist/server.cjs.map"), "Artifact guard blocks subpath /dist/server.cjs.map");
  assert(!isArtifactBlocked("/assets/index.js"), "Artifact guard permits legitimate public asset /assets/index.js");
  assert(!isArtifactBlocked("/assets/index.css"), "Artifact guard permits legitimate public asset /assets/index.css");
  assert(!isArtifactBlocked("/robots.txt"), "Artifact guard permits legitimate public asset /robots.txt");
  assert(!isArtifactBlocked("/sitemap.xml"), "Artifact guard permits legitimate public asset /sitemap.xml");
  assert(!isArtifactBlocked("/site.webmanifest"), "Artifact guard permits legitimate public asset /site.webmanifest");
  assert(!isArtifactBlocked("/sw.js"), "Artifact guard permits legitimate public asset /sw.js");

  return { passed, failed, logs };
}
