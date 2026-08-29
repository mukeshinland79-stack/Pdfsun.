import fs from "fs";
import path from "path";
import { PDFSUN_PAYMENT_PRODUCTS, PaymentProduct } from "../config/paymentProducts";

export interface VerifiedTransaction {
  id: string; // Razorpay Payment ID (pay_...)
  orderId?: string; // Razorpay Order ID (order_...) or Subscription ID (sub_...)
  subscriptionId?: string;
  email: string;
  amountPaise: number;
  amountINR: number;
  currency: string;
  gateway: "Razorpay" | "Stripe";
  date: string;
  timestamp: string;
  status: "COMPLETED" | "CAPTURED" | "PENDING" | "FAILED" | "REFUNDED" | "CANCELLED";
  planId: string;
  planName: string;
  creditsGranted?: number;
  paymentMethod: string;
  invoiceNo: string;
  isVerified: boolean;
  signatureVerified?: boolean;
}

export interface UserSubscription {
  id: string; // Subscription ID
  user_id: string; // User email
  plan_id: string;
  plan_name: string;
  status: "active" | "expired" | "pending" | "cancelled";
  activated_at: string;
  expires_at: string;
  payment_id: string;
  created_at: string;
  updated_at: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "verified_transactions.json");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "user_subscriptions.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

// In-Memory Cache
let transactionsStore: VerifiedTransaction[] = [];
let subscriptionsStore: Record<string, UserSubscription> = {};
const processedEventIds = new Set<string>();

// Load from disk
export function loadPaymentStores() {
  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const raw = fs.readFileSync(TRANSACTIONS_FILE, "utf-8");
      transactionsStore = JSON.parse(raw);
    } else {
      transactionsStore = [];
    }
  } catch (e) {
    console.error("[PaymentStore] Error reading transactions file:", e);
    transactionsStore = [];
  }

  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf-8");
      subscriptionsStore = JSON.parse(raw);
    } else {
      subscriptionsStore = {};
    }
  } catch (e) {
    console.error("[PaymentStore] Error reading subscriptions file:", e);
    subscriptionsStore = {};
  }
}

export function saveTransactions() {
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactionsStore, null, 2), "utf-8");
  } catch (e) {
    console.error("[PaymentStore] Error writing transactions file:", e);
  }
}

export function saveSubscriptions() {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptionsStore, null, 2), "utf-8");
  } catch (e) {
    console.error("[PaymentStore] Error writing subscriptions file:", e);
  }
}

// Initial load
loadPaymentStores();

/**
 * Idempotency Check
 */
export function isEventProcessed(eventId: string): boolean {
  if (!eventId) return false;
  return processedEventIds.has(eventId);
}

export function markEventProcessed(eventId: string) {
  if (eventId) {
    processedEventIds.add(eventId);
  }
}

/**
 * Get all verified transactions for a specific user email
 * ZERO FAKE DATA: Returns exact array from store, or empty array
 */
export function getUserTransactions(email: string): VerifiedTransaction[] {
  if (!email) return [];
  const normalized = email.toLowerCase().trim();
  return transactionsStore.filter((t) => t.email.toLowerCase().trim() === normalized);
}

/**
 * Calculate total paid amount strictly from verified COMPLETED/CAPTURED transactions
 */
export function getUserTotalPaidAmount(email: string): { totalINR: number; count: number } {
  const txs = getUserTransactions(email);
  const completed = txs.filter((t) => t.status === "COMPLETED" || t.status === "CAPTURED");
  const totalINR = completed.reduce((sum, t) => sum + (t.amountINR || 0), 0);
  return { totalINR, count: completed.length };
}

/**
 * Get active user subscription with real-time expiration check
 */
export function getUserSubscription(userId: string): {
  subscription: UserSubscription | null;
  isActive: boolean;
} {
  if (!userId) return { subscription: null, isActive: false };
  const normalized = userId.toLowerCase().trim();
  const sub = subscriptionsStore[normalized];
  if (!sub) return { subscription: null, isActive: false };

  const now = new Date();
  if (sub.status === "active" && new Date(sub.expires_at) <= now) {
    sub.status = "expired";
    sub.updated_at = now.toISOString();
    saveSubscriptions();
  }

  const isActive = sub.status === "active" && new Date(sub.expires_at) > now;
  return { subscription: sub, isActive };
}

/**
 * Record a verified transaction with strict duplicate protection & entitlement fulfillment
 */
export function recordVerifiedTransaction(params: {
  paymentId: string;
  orderId?: string;
  subscriptionId?: string;
  userEmail: string;
  amountPaise: number;
  currency?: string;
  status: "COMPLETED" | "CAPTURED" | "PENDING" | "FAILED" | "REFUNDED" | "CANCELLED";
  planId: string;
  paymentMethod?: string;
  signatureVerified?: boolean;
}): { transaction: VerifiedTransaction; isNew: boolean; subscription?: UserSubscription } {
  const normalizedEmail = (params.userEmail || "user@pdfsun.in").toLowerCase().trim();
  const normalizedPlanId = (params.planId || "pro-monthly").toLowerCase().trim();
  const productConfig: PaymentProduct | undefined = PDFSUN_PAYMENT_PRODUCTS[normalizedPlanId];

  const planName = productConfig ? productConfig.productName : "Pro Sun Plan";
  const amountINR = params.amountPaise ? params.amountPaise / 100 : productConfig ? productConfig.displayPriceINR : 199;
  const currency = params.currency || "INR";

  // Check if transaction already exists (Idempotency)
  const existingIndex = transactionsStore.findIndex((t) => t.id === params.paymentId);
  const now = new Date();

  let txRecord: VerifiedTransaction;
  let isNew = false;

  if (existingIndex >= 0) {
    // Update existing transaction status
    txRecord = transactionsStore[existingIndex];
    txRecord.status = params.status;
    txRecord.isVerified = params.status === "COMPLETED" || params.status === "CAPTURED";
    if (params.signatureVerified !== undefined) {
      txRecord.signatureVerified = params.signatureVerified;
    }
  } else {
    isNew = true;
    const invoiceSeq = Math.floor(100000 + Math.random() * 900000);
    txRecord = {
      id: params.paymentId,
      orderId: params.orderId || params.subscriptionId,
      subscriptionId: params.subscriptionId,
      email: normalizedEmail,
      amountPaise: params.amountPaise || amountINR * 100,
      amountINR: amountINR,
      currency: currency,
      gateway: "Razorpay",
      date: now.toISOString().split("T")[0],
      timestamp: now.toISOString(),
      status: params.status,
      planId: normalizedPlanId,
      planName: planName,
      creditsGranted: productConfig?.type === "one-time" ? productConfig.credits : undefined,
      paymentMethod: params.paymentMethod || "UPI / Razorpay Gateway",
      invoiceNo: `INV-PDFSUN-${now.getFullYear()}-${invoiceSeq}`,
      isVerified: params.status === "COMPLETED" || params.status === "CAPTURED",
      signatureVerified: params.signatureVerified ?? true,
    };
    transactionsStore.unshift(txRecord);
  }

  saveTransactions();

  // If payment is completed, fulfill entitlement
  let updatedSub: UserSubscription | undefined;
  if (params.status === "COMPLETED" || params.status === "CAPTURED") {
    if (normalizedPlanId !== "flexi") {
      let durationDays = 30;
      if (normalizedPlanId === "pro-yearly" || normalizedPlanId.includes("annual") || normalizedPlanId.includes("enterprise")) {
        durationDays = 365;
      }
      const activatedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      updatedSub = {
        id: params.subscriptionId || `sub_${params.paymentId}`,
        user_id: normalizedEmail,
        plan_id: normalizedPlanId,
        plan_name: planName,
        status: "active",
        activated_at: activatedAt,
        expires_at: expiresAt,
        payment_id: params.paymentId,
        created_at: activatedAt,
        updated_at: activatedAt,
      };

      subscriptionsStore[normalizedEmail] = updatedSub;
      saveSubscriptions();
    }
  }

  return { transaction: txRecord, isNew, subscription: updatedSub };
}

/**
 * Get all verified transactions for Admin Finance Hub (zero fake data)
 */
export function getAllVerifiedTransactions(): VerifiedTransaction[] {
  return [...transactionsStore];
}

/**
 * Get overall finance metrics
 */
export function getFinanceMetrics() {
  const completed = transactionsStore.filter((t) => t.status === "COMPLETED" || t.status === "CAPTURED");
  const totalRevenue = completed.reduce((sum, t) => sum + (t.amountINR || 0), 0);
  const refundCount = transactionsStore.filter((t) => t.status === "REFUNDED").length;

  let activeSubCount = 0;
  const now = new Date();
  for (const userId in subscriptionsStore) {
    const sub = subscriptionsStore[userId];
    if (sub.status === "active" && new Date(sub.expires_at) > now) {
      activeSubCount++;
    }
  }

  return {
    totalRevenue,
    totalTransactions: completed.length,
    activeSubCount,
    refundCount,
  };
}
