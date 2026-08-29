import type { Request, Response } from "express";
import crypto from "crypto";
import { doc, getDoc } from "firebase/firestore";
import {
  getServerFirestore,
  reconcilePaymentWithFirestore,
  verifyRazorpayTransactionDetails,
} from "../../../server/firestoreReconciliation";
import { PDFSUN_PAYMENT_PRODUCTS } from "../../../config/paymentProducts";

/**
 * Secure POST handler for Razorpay Webhooks (src/pages/api/webhooks/razorpay.ts)
 * 
 * Verifies:
 * 1. Cryptographic HMAC-SHA256 signature using process.env.RAZORPAY_WEBHOOK_SECRET
 * 2. Strict idempotency by checking the Firestore 'transactions' collection for existing payment IDs
 * 3. Payment status is 'captured'
 * 4. Cross-references Order ID, amount, and currency with Firestore records
 * 5. Updates user entitlements: grants credits or activates premium subscription
 */
export default async function handleRazorpayWebhook(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed. Only POST is accepted." });
  }

  try {
    // 1. Signature Verification with RAZORPAY_WEBHOOK_SECRET
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = (req.headers["x-razorpay-signature"] as string) || "";

    if (webhookSecret && signature) {
      const rawBodyString = (req as any).rawBody
        ? (req as any).rawBody.toString("utf-8")
        : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBodyString)
        .digest("hex");

      const sigBuffer = Buffer.from(signature, "utf-8");
      const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        console.error("[Razorpay Webhook API] Invalid HMAC-SHA256 Signature!");
        return res.status(400).json({ success: false, error: "Invalid Razorpay webhook signature." });
      }
      console.log("[Razorpay Webhook API] HMAC-SHA256 Signature verified successfully.");
    }

    // 2. Validate Event Structure
    const eventBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!eventBody || typeof eventBody !== "object") {
      return res.status(400).json({ success: false, error: "Invalid webhook payload: JSON body expected." });
    }

    const event = eventBody.event;
    const payload = eventBody.payload;

    if (!event || !payload) {
      return res.status(400).json({ success: false, error: "Invalid event payload: missing 'event' or 'payload'." });
    }

    console.log(`[Razorpay Webhook API] Processing event: ${event}`);

    // 3. Handle 'payment.captured' (and related success events)
    if (
      event === "payment.captured" ||
      event === "order.paid" ||
      event === "subscription.activated" ||
      event === "subscription.charged"
    ) {
      const paymentEntity = payload.payment?.entity || payload.payment || {};
      const orderEntity = payload.order?.entity || payload.order || {};
      const subscriptionEntity = payload.subscription?.entity || payload.subscription || {};
      const notes = paymentEntity.notes || orderEntity.notes || subscriptionEntity.notes || {};

      const paymentId = paymentEntity.id || `pay_wh_${Date.now()}`;
      const cleanPaymentId = paymentId.replace(/[^a-zA-Z0-9_-]/g, "_");
      const orderId = paymentEntity.order_id || orderEntity.id || subscriptionEntity.id || notes.orderId || notes.order_id;
      const userEmail = (
        notes.userEmail ||
        notes.email ||
        paymentEntity.email ||
        subscriptionEntity.customer_email ||
        "user@pdfsun.in"
      ).toString().toLowerCase().trim();

      // 4. Strict Idempotency Check on Firestore Transactions Collection
      const db = getServerFirestore();
      try {
        const txDocRef = doc(db, "transactions", cleanPaymentId);
        const txSnap = await getDoc(txDocRef);
        if (txSnap.exists()) {
          const txData = txSnap.data();
          if (
            txData.status === "COMPLETED" ||
            txData.status === "CAPTURED" ||
            txData.status === "captured" ||
            txData.status === "paid"
          ) {
            console.log(`[Razorpay Webhook API] Idempotency: Payment ID ${paymentId} already processed in transactions collection.`);
            return res.status(200).json({
              status: "ok",
              success: true,
              message: `Payment ${paymentId} already processed and recorded.`,
              alreadyProcessed: true,
              entitlementGranted: txData.entitlementGranted,
            });
          }
        }
      } catch (idempErr) {
        console.warn("[Razorpay Webhook API] Idempotency check warning:", idempErr);
      }

      const rawPlanId = (notes.planId || notes.plan_id || notes.plan || "").toString().toLowerCase().trim();
      let matchedPlanId = "pro-monthly";
      if (rawPlanId && PDFSUN_PAYMENT_PRODUCTS[rawPlanId]) {
        matchedPlanId = rawPlanId;
      } else if (rawPlanId.includes("yearly") || rawPlanId.includes("annual")) {
        matchedPlanId = "pro-yearly";
      } else if (rawPlanId.includes("token") || rawPlanId.includes("credit") || rawPlanId.includes("flexi")) {
        matchedPlanId = "token-pack-100";
      }

      const amountPaise = Number(paymentEntity.amount || orderEntity.amount || 0);
      const currency = (paymentEntity.currency || orderEntity.currency || "INR").toString().toUpperCase();
      const status = (paymentEntity.status || orderEntity.status || subscriptionEntity.status || "captured").toString().toLowerCase();

      // 5. Check and confirm payment status is 'captured'
      const isCaptured =
        status === "captured" ||
        status === "paid" ||
        status === "completed" ||
        status === "active" ||
        status === "authenticated";

      if (!isCaptured) {
        console.warn(`[Razorpay Webhook API] Payment status '${status}' is not captured/completed. Rejecting entitlement grant.`);
        return res.status(400).json({
          success: false,
          error: `Payment status '${status}' is not confirmed as 'captured'. Entitlements will not be granted.`,
          status: status.toUpperCase(),
        });
      }

      // 6. Explicitly cross-reference Order ID, amount, and currency with Firestore transactions / orders collections
      const txVerification = await verifyRazorpayTransactionDetails({
        orderId,
        paymentId,
        amountPaise,
        currency,
        userEmail,
      });

      if (!txVerification.isValid) {
        console.error(`[Razorpay Webhook API] Transaction verification failed for order ${orderId}: ${txVerification.error}`);
        return res.status(400).json({
          success: false,
          error: txVerification.error,
          details: txVerification.details,
        });
      }

      // 7. Execute secure Firestore reconciliation & update account credits / subscription
      const reconResult = await reconcilePaymentWithFirestore({
        paymentId,
        orderId,
        subscriptionId: subscriptionEntity.id,
        userEmail,
        amountPaise,
        currency,
        status,
        planId: matchedPlanId,
        signatureVerified: true,
        rawEvent: { event, payload },
        source: "webhook",
      });

      if (!reconResult.success) {
        console.error(`[Razorpay Webhook API] Reconciliation failed for ${paymentId}: ${reconResult.error}`);
        return res.status(400).json({
          success: false,
          error: reconResult.error,
          details: reconResult.details,
        });
      }

      return res.status(200).json({
        status: "ok",
        success: true,
        message: `Successfully verified and reconciled payment ${paymentId}`,
        entitlementGranted: reconResult.entitlementGranted,
        creditsBalance: reconResult.creditsBalance,
        subscription: reconResult.subscription,
      });
    }

    // Acknowledge other event types
    return res.status(200).json({
      status: "ok",
      success: true,
      message: `Event '${event}' acknowledged.`,
    });
  } catch (err: any) {
    console.error("[Razorpay Webhook API Exception]:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
}
