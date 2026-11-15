import fs from "fs";
import path from "path";
import crypto from "crypto";
import { doc, setDoc } from "firebase/firestore";
import { getServerFirestore } from "./firestoreReconciliation";

export interface QuotaCheckResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  resetTimeUtc: string;
  reason?: string;
  tier: "owner" | "paid" | "free_user" | "guest";
}

export interface StoredQuotaRecord {
  count: number;
  date: string;
  lastUpdated: string;
  identifierHash: string;
  tier: string;
}

const RATE_LIMIT_STORE_FILE = path.join(process.cwd(), "rate_limits_store.json");

// In-memory cache synced with persistent disk store and atomic transactions
let localQuotaCache: Record<string, StoredQuotaRecord> = {};

function getTodayUtcString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getNextMidnightUtcString(): string {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

function loadLocalStore(): Record<string, StoredQuotaRecord> {
  try {
    if (fs.existsSync(RATE_LIMIT_STORE_FILE)) {
      const content = fs.readFileSync(RATE_LIMIT_STORE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("[DistributedRateLimiter] Warning reading rate_limits_store.json:", err);
  }
  return {};
}

function persistLocalStoreAtomic(data: Record<string, StoredQuotaRecord>): void {
  const tempFile = `${RATE_LIMIT_STORE_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, RATE_LIMIT_STORE_FILE);
  } catch (err) {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {}
    console.error("[DistributedRateLimiter] Error writing rate_limits_store.json:", err);
  }
}

// Initialize cache on startup
localQuotaCache = loadLocalStore();

export function hashIdentifier(rawIdentifier: string): string {
  return crypto.createHash("sha256").update(rawIdentifier.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function buildQuotaKey(identifier: string, isGuest: boolean, dateStr?: string): string {
  const date = dateStr || getTodayUtcString();
  const hash = hashIdentifier(identifier);
  const prefix = isGuest ? "guest" : "user";
  return `${prefix}_${hash}_${date}`;
}

/**
 * Checks and atomically consumes quota for the client.
 * Returns whether the request is allowed, the updated usage count, and remaining quota.
 */
export async function checkAndConsumeAiQuota(params: {
  identifier: string; // Client IP for guests, email for authenticated users
  isGuest: boolean;
  isOwnerOrAdmin?: boolean;
  userPlan?: string;
}): Promise<QuotaCheckResult> {
  const today = getTodayUtcString();
  const resetTimeUtc = getNextMidnightUtcString();

  // 1. Dual-Owner / Admin: Unlimited throughput
  if (params.isOwnerOrAdmin) {
    return {
      allowed: true,
      count: 0,
      limit: Infinity,
      remaining: Infinity,
      resetTimeUtc,
      tier: "owner",
    };
  }

  // 2. Paid Subscribers (Pro Sun Monthly/Annual, Enterprise, Flex Pass): Full access
  const plan = (params.userPlan || "").toLowerCase().trim();
  const isPaid =
    plan.includes("pro_sun") ||
    plan.includes("enterprise") ||
    plan.includes("flex_pass") ||
    plan === "pro" ||
    plan === "paid";

  if (!params.isGuest && isPaid) {
    return {
      allowed: true,
      count: 0,
      limit: 1000,
      remaining: 1000,
      resetTimeUtc,
      tier: "paid",
    };
  }

  // 3. Free Tier / Guest Visitor: Strictly 3 operations per UTC calendar day
  const quotaLimit = 3;
  const quotaKey = buildQuotaKey(params.identifier, params.isGuest, today);

  // Sync cache with disk store
  localQuotaCache = loadLocalStore();
  const existing = localQuotaCache[quotaKey];

  const currentCount = existing && existing.date === today ? existing.count : 0;

  if (currentCount >= quotaLimit) {
    return {
      allowed: false,
      count: currentCount,
      limit: quotaLimit,
      remaining: 0,
      resetTimeUtc,
      reason: `Free tier daily AI quota reached (${quotaLimit} operations/day). Reset at ${resetTimeUtc}. Upgrade to Pro Sun or Flex Pass to continue.`,
      tier: params.isGuest ? "guest" : "free_user",
    };
  }

  // Atomic increment
  const updatedCount = currentCount + 1;
  const updatedRecord: StoredQuotaRecord = {
    count: updatedCount,
    date: today,
    lastUpdated: new Date().toISOString(),
    identifierHash: hashIdentifier(params.identifier),
    tier: params.isGuest ? "guest" : "free_user",
  };

  localQuotaCache[quotaKey] = updatedRecord;
  persistLocalStoreAtomic(localQuotaCache);

  // Optional background sync with Firestore if initialized
  try {
    const firestore = getServerFirestore();
    if (firestore) {
      // Fire-and-forget sync to Firestore daily_ai_quotas collection
      setDoc(doc(firestore, "daily_ai_quotas", quotaKey), updatedRecord, { merge: true }).catch(() => {});
    }
  } catch {}

  return {
    allowed: true,
    count: updatedCount,
    limit: quotaLimit,
    remaining: quotaLimit - updatedCount,
    resetTimeUtc,
    tier: params.isGuest ? "guest" : "free_user",
  };
}

/**
 * Rollback quota on failed downstream requests (e.g., Gemini 500 error or timeout),
 * preventing duplicate quota deduction when the platform fails to deliver.
 */
export async function rollbackAiQuota(params: { identifier: string; isGuest: boolean }): Promise<void> {
  const today = getTodayUtcString();
  const quotaKey = buildQuotaKey(params.identifier, params.isGuest, today);

  localQuotaCache = loadLocalStore();
  const record = localQuotaCache[quotaKey];
  if (record && record.date === today && record.count > 0) {
    record.count -= 1;
    record.lastUpdated = new Date().toISOString();
    localQuotaCache[quotaKey] = record;
    persistLocalStoreAtomic(localQuotaCache);

    try {
      const firestore = getServerFirestore();
      if (firestore) {
        setDoc(doc(firestore, "daily_ai_quotas", quotaKey), record, { merge: true }).catch(() => {});
      }
    } catch {}
  }
}

/**
 * Inspection helper to check current status without consuming quota
 */
export function getAiQuotaStatus(params: {
  identifier: string;
  isGuest: boolean;
  isOwnerOrAdmin?: boolean;
  userPlan?: string;
}): QuotaCheckResult {
  const today = getTodayUtcString();
  const resetTimeUtc = getNextMidnightUtcString();

  if (params.isOwnerOrAdmin) {
    return { allowed: true, count: 0, limit: Infinity, remaining: Infinity, resetTimeUtc, tier: "owner" };
  }

  const plan = (params.userPlan || "").toLowerCase().trim();
  const isPaid =
    plan.includes("pro_sun") ||
    plan.includes("enterprise") ||
    plan.includes("flex_pass") ||
    plan === "pro" ||
    plan === "paid";

  if (!params.isGuest && isPaid) {
    return { allowed: true, count: 0, limit: 1000, remaining: 1000, resetTimeUtc, tier: "paid" };
  }

  const quotaKey = buildQuotaKey(params.identifier, params.isGuest, today);
  localQuotaCache = loadLocalStore();
  const record = localQuotaCache[quotaKey];
  const count = record && record.date === today ? record.count : 0;
  const limit = 3;

  return {
    allowed: count < limit,
    count,
    limit,
    remaining: Math.max(0, limit - count),
    resetTimeUtc,
    tier: params.isGuest ? "guest" : "free_user",
  };
}

/**
 * Clean testing reset helper
 */
export function resetAiQuotaForTesting(key?: string): void {
  localQuotaCache = loadLocalStore();
  if (key) {
    delete localQuotaCache[key];
  } else {
    localQuotaCache = {};
  }
  persistLocalStoreAtomic(localQuotaCache);
}
