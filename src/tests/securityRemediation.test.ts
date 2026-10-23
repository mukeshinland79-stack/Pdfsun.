import crypto from "crypto";
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
import { reconcilePaymentWithFirestore } from "../server/firestoreReconciliation";

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

  return { passed, failed, logs };
}
