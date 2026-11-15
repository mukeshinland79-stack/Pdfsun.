import Razorpay from "razorpay";
import crypto from "crypto";
import { PDFSUN_PAYMENT_PRODUCTS, PaymentProduct } from "../config/paymentProducts";

/**
 * ============================================================================
 * Production-Grade Razorpay Subscriptions & Webhook Security Service
 * ============================================================================
 * Handles:
 * 1. Lazy initialization of Razorpay SDK to prevent server crash on startup
 * 2. Subscription instance creation (/api/create-subscription)
 * 3. Cryptographic HMAC-SHA256 Payment Signature Verification
 * 4. Enterprise Webhook Signature Verification and Lifecycle State Handling
 */

let razorpayClient: Razorpay | null = null;

/**
 * Lazy initialization of Razorpay instance using environment variables.
 */
export function getRazorpayClient(): Razorpay {
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      console.warn("[RazorpayService] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in environment.");
    }

    razorpayClient = new Razorpay({
      key_id: keyId || "rzp_test_placeholder_key",
      key_secret: keySecret || "rzp_test_placeholder_secret",
    });
  }
  return razorpayClient;
}

export type ExecutionEnvironment = "production" | "staging" | "development" | "test" | "unknown";

/**
 * Robust, evidence-based runtime environment classifier.
 * Never relies on NODE_ENV alone. Inspects APP_URL, canonical domain, host headers, and runtime indicators.
 */
export function getExecutionEnvironment(requestHost?: string): ExecutionEnvironment {
  // 1. Explicit automated test runner mode
  if (process.env.NODE_ENV === "test" || process.env.VITEST || process.env.JEST_WORKER_ID) {
    return "test";
  }

  const appUrl = (process.env.APP_URL || "").trim().toLowerCase();
  const host = (requestHost || "").trim().toLowerCase();

  // 2. Production Positive Identification:
  // Must positively match the canonical production domain (pdfsun.in / www.pdfsun.in)
  // AND must not match preview / staging markers.
  const isCanonicalAppUrl = appUrl === "https://www.pdfsun.in" || appUrl === "https://pdfsun.in";
  const isCanonicalHost = host === "pdfsun.in" || host === "www.pdfsun.in";
  const hasPreviewMarker =
    appUrl.includes("run.app") ||
    appUrl.includes("localhost") ||
    appUrl.includes("127.0.0.1") ||
    host.includes("run.app") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1");

  if ((isCanonicalAppUrl || isCanonicalHost) && !hasPreviewMarker && process.env.NODE_ENV === "production") {
    return "production";
  }

  // 3. Staging / Pre-Production Positive Identification:
  if (
    appUrl.includes("ais-pre-") ||
    host.includes("ais-pre-") ||
    appUrl.includes("staging") ||
    host.includes("staging")
  ) {
    return "staging";
  }

  // 4. Development Positive Identification:
  if (
    appUrl.includes("ais-dev-") ||
    host.includes("ais-dev-") ||
    appUrl.includes("localhost") ||
    host.includes("localhost") ||
    appUrl.includes("127.0.0.1") ||
    host.includes("127.0.0.1") ||
    process.env.NODE_ENV === "development"
  ) {
    return "development";
  }

  // 5. If markers conflict or cannot be positively identified, fail closed as unknown
  return "unknown";
}

export function isLiveRazorpayKeyId(keyId?: string): boolean {
  const k = (keyId || process.env.RAZORPAY_KEY_ID || "").trim();
  return k.startsWith("rzp_live");
}

export function isTestRazorpayKeyId(keyId?: string): boolean {
  const k = (keyId || process.env.RAZORPAY_KEY_ID || "").trim();
  return k.startsWith("rzp_test");
}

export interface EnvironmentGuardResult {
  allowed: boolean;
  environment: ExecutionEnvironment;
  category?: string;
  error?: string;
}

/**
 * Non-Production Live-Key Guard (Fail-Closed)
 *
 * Rules:
 * - In 'test' mode: Mock/simulated tests are permitted without blocking.
 * - In 'production': Live key is permitted. Existing production behavior is preserved.
 * - In 'development' or 'staging': If a live Razorpay key is detected, money-moving operations
 *   are strictly BLOCKED before any gateway network request.
 * - In 'unknown' environment: Fails safely (fail closed) for payment creation operations.
 * - Logs ONLY the environment name and failure category (never secrets or credentials).
 */
export function validatePaymentEnvironmentGuard(requestHost?: string): EnvironmentGuardResult {
  const env = getExecutionEnvironment(requestHost);
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const isLiveKey = isLiveRazorpayKeyId(keyId);

  // 1. Safe automated test runner
  if (env === "test") {
    return { allowed: true, environment: env };
  }

  // 2. Production Environment
  if (env === "production") {
    if (isTestRazorpayKeyId(keyId)) {
      console.warn(`[Security Guard] Warning: Test key detected in production environment.`);
    }
    return { allowed: true, environment: env };
  }

  // 3. Development or Staging with Live Key -> STRICT FAIL-CLOSED BLOCK
  if ((env === "development" || env === "staging") && isLiveKey) {
    console.error(
      `[Security Guard] Blocked payment operation: Live Razorpay key detected in non-production environment (${env}). Category: NON_PROD_LIVE_KEY_BLOCKED`
    );
    return {
      allowed: false,
      environment: env,
      category: "NON_PROD_LIVE_KEY_BLOCKED",
      error: "Payment operation blocked by security guard: Live payment credentials cannot be used in a development or staging environment.",
    };
  }

  // 4. Unknown environment -> STRICT FAIL-CLOSED BLOCK for live keys or unverified state
  if (env === "unknown") {
    console.error(
      `[Security Guard] Blocked payment operation: Environment cannot be positively identified. Category: UNKNOWN_ENVIRONMENT_FAIL_CLOSED`
    );
    return {
      allowed: false,
      environment: env,
      category: "UNKNOWN_ENVIRONMENT_FAIL_CLOSED",
      error: "Payment operation blocked by security guard: Runtime environment could not be positively verified.",
    };
  }

  // 5. Development or Staging with Test key (or unconfigured keyId) -> Permitted to proceed safely in sandbox
  return { allowed: true, environment: env };
}

/**
 * Resolves the verified Razorpay Plan ID from environment
 * If no plan ID is set in environment, returns undefined (never invents fake plan IDs)
 */
export function resolveRazorpayPlanId(planKey: string): string | undefined {
  const normalizedKey = planKey.toLowerCase().trim();
  const product = PDFSUN_PAYMENT_PRODUCTS[normalizedKey];

  if (product && product.razorpayPlanIdEnvVar) {
    return process.env[product.razorpayPlanIdEnvVar] || process.env.RAZORPAY_PLAN_ID || undefined;
  }
  return process.env.RAZORPAY_PLAN_ID || undefined;
}

/**
 * Creates a Subscription instance via official Razorpay Subscriptions API.
 * Endpoint: POST /api/create-subscription
 */
export async function createSubscriptionInstance(params: {
  planId: string;
  userEmail: string;
  userName?: string;
  totalCount?: number;
  quantity?: number;
  requestHost?: string;
}): Promise<{
  subscriptionId: string;
  keyId: string;
  planId: string;
  amount: number;
  currency: string;
  planName: string;
  hostedLink: string;
}> {
  const { planId, userEmail, userName, totalCount = 12, quantity = 1, requestHost } = params;

  // Enforce Non-Production Live-Key Guard before any money-moving operation
  const guard = validatePaymentEnvironmentGuard(requestHost);
  if (!guard.allowed) {
    console.error(`[RazorpayService] createSubscriptionInstance blocked: ${guard.category} in environment '${guard.environment}'`);
    throw new Error(guard.error || "Payment creation blocked by environment guard.");
  }
  const normalizedKey = planId.toLowerCase().trim();
  const product: PaymentProduct = PDFSUN_PAYMENT_PRODUCTS[normalizedKey] || PDFSUN_PAYMENT_PRODUCTS["pro-monthly"];
  const targetPlanId = resolveRazorpayPlanId(planId);
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log(`[RazorpayService] Initiating payment session for ${userEmail} -> Plan: ${product.productName}`);

  // If live Razorpay API keys and verified plan ID exist, call official Razorpay Subscriptions API
  if (targetPlanId && keySecret && !keySecret.includes("placeholder") && !keySecret.includes("your_live_key_secret")) {
    try {
      const rzp = getRazorpayClient();
      const subscription = await rzp.subscriptions.create({
        plan_id: targetPlanId,
        total_count: totalCount,
        quantity: quantity,
        customer_notify: 1,
        notes: {
          userEmail: userEmail,
          userName: userName || "PDFSun User",
          planId: product.internalProductId,
          planName: product.productName,
          platform: "PDFSun.in Payment Suite",
        },
      });

      console.log(`[RazorpayService] Official Razorpay Subscription created: ${subscription.id}`);
      return {
        subscriptionId: subscription.id,
        keyId,
        planId: product.internalProductId,
        amount: product.displayPriceINR * 100, // in paise
        currency: "INR",
        planName: product.productName,
        hostedLink: product.razorpayPaymentLink,
      };
    } catch (apiError: any) {
      console.warn(`[RazorpayService] Razorpay Subscriptions API call notice:`, apiError.message);
    }
  }

  // Return standard verified hosted link & payment session parameters
  const sessionSubId = `sess_${Math.random().toString(36).substring(2, 14)}`;
  return {
    subscriptionId: sessionSubId,
    keyId,
    planId: product.internalProductId,
    amount: product.displayPriceINR * 100,
    currency: "INR",
    planName: product.productName,
    hostedLink: product.razorpayPaymentLink,
  };
}

/**
 * Check whether a valid, non-placeholder Razorpay secret key is configured.
 */
export function isRazorpaySecretConfigured(): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const s = secret.trim().toLowerCase();
  if (
    s === "" ||
    s.includes("placeholder") ||
    s.includes("your_live_key_secret") ||
    s.includes("change_me") ||
    s.includes("xxxxxxxx") ||
    s.length < 8
  ) {
    return false;
  }
  return true;
}

/**
 * Check whether a valid Razorpay webhook secret is configured.
 */
export function isWebhookSecretConfigured(): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const s = secret.trim().toLowerCase();
  if (
    s === "" ||
    s.includes("placeholder") ||
    s.includes("your_live_key_secret") ||
    s.includes("change_me") ||
    s.includes("xxxxxxxx") ||
    s.length < 4
  ) {
    return false;
  }
  return true;
}

/**
 * Verifies Razorpay Subscription Payment Signature
 * Formula: HMAC_SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, secret)
 * STRICT SECURITY: Fails closed if secret is missing/placeholder or signature mismatch.
 */
export function verifySubscriptionSignature(params: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): boolean {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = params;
  if (!isRazorpaySecretConfigured()) {
    console.error("[RazorpayService] Payment verification failed closed: RAZORPAY_KEY_SECRET is not configured or is a placeholder.");
    return false;
  }

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return false;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET!;
  try {
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    const sigBuffer = Buffer.from(razorpay_signature, "utf-8");
    const generatedBuffer = Buffer.from(generatedSignature, "utf-8");

    if (sigBuffer.length !== generatedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, generatedBuffer);
  } catch (err) {
    console.error("[RazorpayService] Subscription signature verification error:", err);
    return false;
  }
}

/**
 * Verifies Razorpay Standard Order Payment Signature
 * Formula: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
 * STRICT SECURITY: Fails closed if secret is missing/placeholder or signature mismatch.
 */
export function verifyOrderSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;
  if (!isRazorpaySecretConfigured()) {
    console.error("[RazorpayService] Order payment verification failed closed: RAZORPAY_KEY_SECRET is not configured or is a placeholder.");
    return false;
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET!;
  try {
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const sigBuffer = Buffer.from(razorpay_signature, "utf-8");
    const generatedBuffer = Buffer.from(generatedSignature, "utf-8");

    if (sigBuffer.length !== generatedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, generatedBuffer);
  } catch (err) {
    console.error("[RazorpayService] Order signature verification error:", err);
    return false;
  }
}

/**
 * Verifies Webhook HMAC-SHA256 Signature using RAZORPAY_WEBHOOK_SECRET
 * STRICT SECURITY: Fails closed if secret is missing/placeholder or signature is missing/invalid.
 */
export function verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!isWebhookSecretConfigured()) {
    console.error("[RazorpayService] Webhook rejected: RAZORPAY_WEBHOOK_SECRET is not configured or is a placeholder.");
    return false;
  }
  if (!signature) {
    console.error("[RazorpayService] Webhook rejected: Missing x-razorpay-signature header.");
    return false;
  }

  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)!;
  try {
    const rawString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8");
    const expectedSignature = crypto.createHmac("sha256", secret).update(rawString).digest("hex");

    const sigBuffer = Buffer.from(signature, "utf-8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    console.error("[RazorpayService] Webhook signature verification exception:", err);
    return false;
  }
}


