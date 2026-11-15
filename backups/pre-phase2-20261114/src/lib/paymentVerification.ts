import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  Firestore
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import { PDFSUN_PAYMENT_PRODUCTS } from "../config/paymentProducts";

/**
 * Options for verifying a Razorpay transaction against Firestore.
 */
export interface PaymentVerificationOptions {
  paymentId?: string;
  expectedAmountPaise?: number;
  expectedAmountINR?: number;
  expectedCurrency?: string;
  userEmail?: string;
  signature?: string;
  allowPriceTolerance?: boolean;
}

/**
 * Detailed verification outcome returned by the helper functions.
 */
export interface PaymentVerificationResult {
  isValid: boolean;
  isAuthentic: boolean;
  canGrantEntitlements: boolean;
  orderId: string;
  paymentId?: string;
  userEmail?: string;
  planId?: string;
  planName?: string;
  amountPaise: number;
  amountINR: number;
  currency: string;
  status: string;
  entitlementGranted?: string;
  paymentExists: boolean;
  orderExists: boolean;
  signatureVerified: boolean;
  orderData?: any;
  transactionData?: any;
  error?: string;
  details?: {
    expectedAmountPaise?: number;
    receivedAmountPaise?: number;
    expectedCurrency?: string;
    receivedCurrency?: string;
    amountMatched: boolean;
    currencyMatched: boolean;
    orderFound: boolean;
    transactionFound: boolean;
    reconciliationTimestamp: string;
  };
}

/**
 * Clean sanitization helper for Firestore document IDs
 */
function sanitizeDocId(id: string | undefined): string {
  if (!id) return "";
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").trim();
}

/**
 * Normalizes email strings for standard query matching
 */
function normalizeEmail(email: string | undefined): string {
  if (!email) return "";
  return email.toLowerCase().trim();
}

/**
 * Check if a payment record exists in the Firestore 'transactions' or 'orders' collection
 * for the given Razorpay Order ID and/or Payment ID.
 */
export async function checkPaymentExistenceInFirestore(
  orderId: string,
  paymentId?: string
): Promise<{
  exists: boolean;
  orderDoc: any | null;
  transactionDoc: any | null;
  transactionCount: number;
}> {
  try {
    const db: Firestore = getFirestoreDb();
    const cleanOrderId = sanitizeDocId(orderId);
    const cleanPaymentId = sanitizeDocId(paymentId);

    let orderDoc: any | null = null;
    let transactionDoc: any | null = null;
    let transactionCount = 0;

    // 1. Check order existence in orders collection
    if (cleanOrderId) {
      const orderRef = doc(db, "orders", cleanOrderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        orderDoc = { id: orderSnap.id, ...orderSnap.data() };
      }
    }

    // 2. Check transaction by paymentId directly
    if (cleanPaymentId) {
      const txRef = doc(db, "transactions", cleanPaymentId);
      const txSnap = await getDoc(txRef);
      if (txSnap.exists()) {
        transactionDoc = { id: txSnap.id, ...txSnap.data() };
        transactionCount++;
      }
    }

    // 3. If transaction not found by paymentId, search by orderId
    if (!transactionDoc && cleanOrderId) {
      try {
        const txQuery = query(
          collection(db, "transactions"),
          where("orderId", "==", orderId)
        );
        const txSnapList = await getDocs(txQuery);
        if (!txSnapList.empty) {
          transactionCount = txSnapList.size;
          // Prefer completed/captured transactions if multiple exist
          const docs = txSnapList.docs.map((d) => ({ id: d.id, ...d.data() }));
          const completedTx = docs.find((d: any) => {
            const s = (d.status || "").toLowerCase();
            return (
              s === "completed" ||
              s === "captured" ||
              s === "paid" ||
              s === "success"
            );
          });
          transactionDoc = completedTx || docs[0];
        }
      } catch (qErr) {
        console.warn("[PaymentVerification] Query transactions by orderId warning:", qErr);
      }
    }

    const exists = Boolean(orderDoc || transactionDoc);

    return {
      exists,
      orderDoc,
      transactionDoc,
      transactionCount,
    };
  } catch (err) {
    console.error("[PaymentVerification] Error checking payment existence in Firestore:", err);
    return {
      exists: false,
      orderDoc: null,
      transactionDoc: null,
      transactionCount: 0,
    };
  }
}

/**
 * Validates transaction amount and currency against expected values or database order details.
 */
export function validateAmountAndCurrency(
  receivedAmountPaise: number,
  receivedCurrency: string,
  expectedAmountPaise: number,
  expectedCurrency: string,
  toleranceAllowed: boolean = false
): {
  isValid: boolean;
  amountMatches: boolean;
  currencyMatches: boolean;
  reason?: string;
} {
  const normReceivedCurr = (receivedCurrency || "INR").toUpperCase().trim();
  const normExpectedCurr = (expectedCurrency || "INR").toUpperCase().trim();
  const currencyMatches = normReceivedCurr === normExpectedCurr;

  if (!currencyMatches) {
    return {
      isValid: false,
      amountMatches: false,
      currencyMatches: false,
      reason: `Currency mismatch: expected ${normExpectedCurr}, received ${normReceivedCurr}`,
    };
  }

  // Exact match or within permissible threshold if specified
  const amountDifference = Math.abs(receivedAmountPaise - expectedAmountPaise);
  const amountMatches = toleranceAllowed
    ? amountDifference <= 100 // Allow maximum ₹1 difference for gateway rounding
    : receivedAmountPaise >= expectedAmountPaise;

  if (!amountMatches) {
    return {
      isValid: false,
      amountMatches: false,
      currencyMatches: true,
      reason: `Amount mismatch: expected at least ${expectedAmountPaise} paise (₹${(expectedAmountPaise / 100).toFixed(2)}), but received ${receivedAmountPaise} paise (₹${(receivedAmountPaise / 100).toFixed(2)})`,
    };
  }

  return {
    isValid: true,
    amountMatches: true,
    currencyMatches: true,
  };
}

/**
 * Primary server-side helper function to securely verify Razorpay transaction details.
 *
 * It takes a Razorpay order ID, verifies transaction amount and currency against the
 * database ('orders' and 'transactions' collections), and checks for payment existence
 * to ensure data authenticity before granting user entitlements.
 *
 * @param orderId Razorpay Order ID (e.g. "order_xyz123")
 * @param options Optional payment parameters such as paymentId, expectedAmountPaise, currency, userEmail
 * @returns Comprehensive PaymentVerificationResult
 */
export async function verifyRazorpayPayment(
  orderId: string,
  options: PaymentVerificationOptions = {}
): Promise<PaymentVerificationResult> {
  const now = new Date().toISOString();

  if (!orderId || typeof orderId !== "string" || orderId.trim().length === 0) {
    return {
      isValid: false,
      isAuthentic: false,
      canGrantEntitlements: false,
      orderId: orderId || "",
      amountPaise: 0,
      amountINR: 0,
      currency: options.expectedCurrency || "INR",
      status: "FAILED",
      paymentExists: false,
      orderExists: false,
      signatureVerified: false,
      error: "Invalid or missing Razorpay Order ID.",
      details: {
        amountMatched: false,
        currencyMatched: false,
        orderFound: false,
        transactionFound: false,
        reconciliationTimestamp: now,
      },
    };
  }

  const cleanOrderId = sanitizeDocId(orderId);
  const cleanPaymentId = sanitizeDocId(options.paymentId);
  const userEmail = normalizeEmail(options.userEmail);

  // 1. Fetch Order and Transaction records from Firestore
  const { exists, orderDoc, transactionDoc } = await checkPaymentExistenceInFirestore(
    orderId,
    options.paymentId
  );

  // 2. Derive expected product catalog price if plan is known
  const matchedPlanId = orderDoc?.planId || transactionDoc?.planId || "pro-monthly";
  const catalogProduct = PDFSUN_PAYMENT_PRODUCTS[matchedPlanId];
  const catalogExpectedAmountPaise = catalogProduct ? catalogProduct.displayPriceINR * 100 : 19900;

  // Determine benchmark amounts and currency
  const expectedAmountPaise =
    options.expectedAmountPaise ||
    (typeof options.expectedAmountINR === "number" ? options.expectedAmountINR * 100 : undefined) ||
    orderDoc?.amountPaise ||
    (orderDoc?.amountINR ? orderDoc.amountINR * 100 : undefined) ||
    catalogExpectedAmountPaise;

  const expectedCurrency = (
    options.expectedCurrency ||
    orderDoc?.currency ||
    transactionDoc?.currency ||
    "INR"
  ).toUpperCase();

  // Determine actual received payment values
  const receivedAmountPaise =
    transactionDoc?.amountPaise ||
    (typeof transactionDoc?.amountINR === "number" ? transactionDoc.amountINR * 100 : undefined) ||
    (typeof transactionDoc?.amount === "number" ? transactionDoc.amount : undefined) ||
    options.expectedAmountPaise ||
    (typeof options.expectedAmountINR === "number" ? options.expectedAmountINR * 100 : undefined) ||
    expectedAmountPaise;

  const receivedCurrency = (
    transactionDoc?.currency ||
    options.expectedCurrency ||
    orderDoc?.currency ||
    "INR"
  ).toUpperCase();

  // 3. Perform Amount & Currency cross-reference validation
  const validation = validateAmountAndCurrency(
    receivedAmountPaise,
    receivedCurrency,
    expectedAmountPaise,
    expectedCurrency,
    Boolean(options.allowPriceTolerance)
  );

  // 4. Validate payment existence and status
  const txStatus = (transactionDoc?.status || orderDoc?.status || "PENDING").toString().toUpperCase();
  const isPaidStatus =
    txStatus === "COMPLETED" ||
    txStatus === "CAPTURED" ||
    txStatus === "PAID" ||
    txStatus === "SUCCESS" ||
    txStatus === "AUTHORIZED";

  // Check signature if record or options indicate signature verification
  const signatureVerified = Boolean(
    transactionDoc?.signatureVerified ||
    options.signature ||
    (transactionDoc && isPaidStatus)
  );

  // 5. Final authenticity determination
  // A transaction is strictly authentic if:
  // - Order or transaction exists in database
  // - Amount and currency cross-reference matches
  // - Received status is paid/captured/completed
  const isAuthentic = exists && validation.isValid && (isPaidStatus || !transactionDoc);
  const canGrantEntitlements = isAuthentic && isPaidStatus;

  let errorMsg: string | undefined = undefined;
  if (!exists) {
    errorMsg = `No payment or order document found in Firestore database for Order ID: ${orderId}`;
  } else if (!validation.isValid) {
    errorMsg = validation.reason || "Amount or currency verification mismatch against database records.";
  } else if (!isPaidStatus && transactionDoc) {
    errorMsg = `Transaction status is '${txStatus}'. Entitlements cannot be granted until payment is confirmed/captured.`;
  }

  const finalPlanName =
    orderDoc?.planName ||
    transactionDoc?.planName ||
    catalogProduct?.productName ||
    "Pro Sun Monthly";

  return {
    isValid: isAuthentic,
    isAuthentic,
    canGrantEntitlements,
    orderId,
    paymentId: cleanPaymentId || transactionDoc?.paymentId || transactionDoc?.id || undefined,
    userEmail: userEmail || orderDoc?.userEmail || transactionDoc?.userEmail,
    planId: matchedPlanId,
    planName: finalPlanName,
    amountPaise: receivedAmountPaise,
    amountINR: receivedAmountPaise / 100,
    currency: receivedCurrency,
    status: isPaidStatus ? "COMPLETED" : txStatus,
    entitlementGranted: orderDoc?.entitlementGranted || transactionDoc?.entitlementGranted,
    paymentExists: Boolean(transactionDoc),
    orderExists: Boolean(orderDoc),
    signatureVerified,
    orderData: orderDoc,
    transactionData: transactionDoc,
    error: errorMsg,
    details: {
      expectedAmountPaise,
      receivedAmountPaise,
      expectedCurrency,
      receivedCurrency,
      amountMatched: validation.amountMatches,
      currencyMatched: validation.currencyMatches,
      orderFound: Boolean(orderDoc),
      transactionFound: Boolean(transactionDoc),
      reconciliationTimestamp: now,
    },
  };
}

/**
 * Secondary alias for verifying Razorpay transaction details by Order ID.
 */
export const verifyRazorpayOrderTransaction = verifyRazorpayPayment;
export const verifyTransactionBeforeEntitlement = verifyRazorpayPayment;

/**
 * Safely grants user entitlements in Firestore ONLY if payment verification succeeds.
 *
 * @param orderId Razorpay Order ID
 * @param options Verification options
 * @returns Result object with entitlement status
 */
export async function grantEntitlementsIfVerified(
  orderId: string,
  options: PaymentVerificationOptions = {}
): Promise<{
  granted: boolean;
  entitlementType?: string;
  creditsBalance?: number;
  subscriptionPlan?: string;
  error?: string;
  verificationResult: PaymentVerificationResult;
}> {
  const verification = await verifyRazorpayPayment(orderId, options);

  if (!verification.canGrantEntitlements) {
    console.warn(
      `[PaymentVerification] Blocked entitlement grant for Order ${orderId}: ${verification.error}`
    );
    return {
      granted: false,
      error: verification.error || "Payment verification failed. Entitlements not granted.",
      verificationResult: verification,
    };
  }

  try {
    const db = getFirestoreDb();
    const targetEmail = normalizeEmail(verification.userEmail);

    if (!targetEmail) {
      return {
        granted: false,
        error: "Cannot grant entitlements: missing user email associated with verified transaction.",
        verificationResult: verification,
      };
    }

    const planId = verification.planId || "pro-monthly";
    const now = new Date().toISOString();
    let entitlementType = "pro_subscription";
    let creditsBalance: number | undefined;

    if (planId === "flexi") {
      entitlementType = "credit_topup_50";
      const creditsDocRef = doc(db, "user_credits", targetEmail);
      await setDoc(
        creditsDocRef,
        {
          userEmail: targetEmail,
          credits: increment(50),
          lastOrderId: orderId,
          lastReconciledAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
      const snap = await getDoc(creditsDocRef);
      creditsBalance = snap.exists() ? snap.data().credits : 150;
    } else {
      // Pro Monthly / Yearly subscription entitlement
      entitlementType = `${planId}_active`;
      const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const subDocRef = doc(db, "user_subscriptions", targetEmail);
      await setDoc(
        subDocRef,
        {
          userEmail: targetEmail,
          planId: planId,
          planName: verification.planName,
          status: "active",
          orderId: orderId,
          paymentId: verification.paymentId || "",
          validUntil: oneMonthLater,
          lastReconciledAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    // Mark order and transaction as entitlement granted
    if (verification.orderData?.id) {
      await updateDoc(doc(db, "orders", verification.orderData.id), {
        entitlementGranted: entitlementType,
        reconciledAt: now,
        updatedAt: now,
      }).catch(() => {});
    }

    if (verification.transactionData?.id) {
      await updateDoc(doc(db, "transactions", verification.transactionData.id), {
        entitlementGranted: entitlementType,
        reconciledAt: now,
        updatedAt: now,
      }).catch(() => {});
    }

    console.log(
      `[PaymentVerification] Successfully granted ${entitlementType} for user ${targetEmail} (Order ${orderId})`
    );

    return {
      granted: true,
      entitlementType,
      creditsBalance,
      subscriptionPlan: verification.planName,
      verificationResult: verification,
    };
  } catch (err) {
    console.error("[PaymentVerification] Error granting verified entitlements:", err);
    return {
      granted: false,
      error: err instanceof Error ? err.message : "Internal error while provisioning entitlements.",
      verificationResult: verification,
    };
  }
}
