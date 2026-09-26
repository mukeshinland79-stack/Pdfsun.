import { useState, useEffect, useCallback } from "react";

const USAGE_STORAGE_KEY = "pdfsun_usage_tracker_v1";
const PRO_PLAN_KEY = "pdfsun_user_plan_v1";
const DATA_VOLUME_KEY = "pdfsun_data_volume_bytes_v1";
const AI_QUERIES_KEY = "pdfsun_ai_query_count_v1";

// Plan boundaries strictly respecting AGENTS_md:
export const PLAN_LIMITS = {
  free: {
    planName: "Free Forever",
    priceINR: 0,
    maxFileSizeBytes: 15 * 1024 * 1024, // 15 MB
    maxFileSizeMB: 15,
    maxDailyOperations: 3,
    maxBatchFiles: 2,
    maxDailyAiQueries: 2,
    isUnlimited: false,
    durationText: "Free Forever (No Expiry)",
  },
  flexi: {
    planName: "Flex Pass",
    priceINR: 99,
    maxFileSizeBytes: 500 * 1024 * 1024, // 500 MB
    maxFileSizeMB: 500,
    maxDailyOperations: Infinity, // Unlimited during 7 days
    maxBatchFiles: 10,
    maxDailyAiQueries: 50,
    isUnlimited: true,
    durationText: "Valid for 7 Days (Pay-as-you-go)",
  },
  "pro-monthly": {
    planName: "Pro Sun Monthly",
    priceINR: 199,
    maxFileSizeBytes: 2048 * 1024 * 1024, // 2 GB
    maxFileSizeMB: 2048,
    maxDailyOperations: Infinity,
    maxBatchFiles: 50,
    maxDailyAiQueries: Infinity,
    isUnlimited: true,
    durationText: "Auto-renews Monthly (30 Days)",
  },
  "pro-yearly": {
    planName: "Pro Sun Annual",
    priceINR: 1499,
    maxFileSizeBytes: 2048 * 1024 * 1024, // 2 GB
    maxFileSizeMB: 2048,
    maxDailyOperations: Infinity,
    maxBatchFiles: 100,
    maxDailyAiQueries: Infinity,
    isUnlimited: true,
    durationText: "Active for 1 Year (365 Days)",
  },
  enterprise: {
    planName: "Enterprise Plan",
    priceINR: 3999,
    maxFileSizeBytes: 2048 * 1024 * 1024, // 2 GB
    maxFileSizeMB: 2048,
    maxDailyOperations: Infinity,
    maxBatchFiles: 200,
    maxDailyAiQueries: Infinity,
    isUnlimited: true,
    durationText: "5 User Seats (Priority Infrastructure)",
  },
  "enterprise-sso": {
    planName: "Enterprise SSO Unlimited",
    priceINR: 9999,
    maxFileSizeBytes: 2048 * 1024 * 1024, // 2 GB
    maxFileSizeMB: 2048,
    maxDailyOperations: Infinity,
    maxBatchFiles: 500,
    maxDailyAiQueries: Infinity,
    isUnlimited: true,
    durationText: "20 Seats SSO (Unlimited Throughput)",
  },
  owner: {
    planName: "👑 Super Admin (Owner)",
    priceINR: 0,
    maxFileSizeBytes: 4096 * 1024 * 1024, // 4 GB
    maxFileSizeMB: 4096,
    maxDailyOperations: Infinity,
    maxBatchFiles: 1000,
    maxDailyAiQueries: Infinity,
    isUnlimited: true,
    durationText: "Lifetime Super Admin Active (No Expiry)",
  },
};

export const MAX_FREE_DAILY_DOWNLOADS = PLAN_LIMITS.free.maxDailyOperations;
export const MAX_FREE_FILE_SIZE_BYTES = PLAN_LIMITS.free.maxFileSizeBytes;
export const MAX_FREE_BATCH_FILES = PLAN_LIMITS.free.maxBatchFiles;
export const MAX_FREE_AI_QUERIES = PLAN_LIMITS.free.maxDailyAiQueries;

export interface UsageData {
  count: number;
  resetDate: string; // YYYY-MM-DD
  totalLifetimeDownloads: number;
}

export type PaywallReason = "limit" | "size" | "batch" | "ai_trial" | null;

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function detectActivePlanTier(): keyof typeof PLAN_LIMITS {
  if (typeof window === "undefined") return "free";
  try {
    const savedRole = localStorage.getItem("pdfsun_user_role");
    if (savedRole === "owner") return "owner";

    const savedProfile = localStorage.getItem("pdfsun_user_profile");
    if (savedProfile) {
      const p = JSON.parse(savedProfile);
      const email = (p.email || "").toLowerCase().trim();
      if (p.role === "owner" || email === "mukeshinland79@gmail.com" || email === "mukeshkalonia241@gmail.com") {
        return "owner";
      }
      const planStr = (p.plan || p.planId || "").toLowerCase();
      if (planStr.includes("enterprise sso") || planStr.includes("enterprise-sso") || p.isSsoManaged) {
        return "enterprise-sso";
      }
      if (planStr.includes("enterprise")) {
        return "enterprise";
      }
      if (planStr.includes("annual") || planStr.includes("yearly") || planStr.includes("pro-yearly")) {
        return "pro-yearly";
      }
      if (planStr.includes("monthly") || planStr.includes("pro sun monthly") || planStr.includes("pro-monthly")) {
        return "pro-monthly";
      }
      if (planStr.includes("flex") || planStr.includes("pass") || planStr.includes("flexi")) {
        return "flexi";
      }
      if (p.isPro || planStr.includes("pro")) {
        return "pro-monthly";
      }
    }

    const savedPlan = (localStorage.getItem(PRO_PLAN_KEY) || "").toLowerCase();
    if (savedPlan.includes("enterprise-sso")) return "enterprise-sso";
    if (savedPlan.includes("enterprise")) return "enterprise";
    if (savedPlan.includes("annual") || savedPlan.includes("yearly")) return "pro-yearly";
    if (savedPlan.includes("flex")) return "flexi";
    if (savedPlan === "pro" || savedPlan.includes("pro")) return "pro-monthly";
    if (savedPlan === "owner") return "owner";
  } catch {}
  return "free";
}

export function useUsageTracker(isUserProOverride: boolean = false) {
  const [activeTier, setActiveTier] = useState<keyof typeof PLAN_LIMITS>(() => {
    if (isUserProOverride) return "pro-monthly";
    return detectActivePlanTier();
  });

  const currentPlan = PLAN_LIMITS[activeTier] || PLAN_LIMITS.free;
  const isPro = activeTier !== "free";

  const [usage, setUsage] = useState<UsageData>(() => {
    const todayStr = getTodayDateString();
    try {
      const saved = localStorage.getItem(USAGE_STORAGE_KEY);
      if (saved) {
        const parsed: UsageData = JSON.parse(saved);
        if (parsed.resetDate !== todayStr) {
          const resetObj: UsageData = {
            count: 0,
            resetDate: todayStr,
            totalLifetimeDownloads: parsed.totalLifetimeDownloads || 0,
          };
          localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(resetObj));
          return resetObj;
        }
        return parsed;
      }
    } catch (e) {
      console.error("Error reading usage tracker from localStorage:", e);
    }
    const initObj: UsageData = {
      count: 0,
      resetDate: todayStr,
      totalLifetimeDownloads: 0,
    };
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(initObj));
    } catch {}
    return initObj;
  });

  // Track data volume processed
  const [totalVolumeBytes, setTotalVolumeBytes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(DATA_VOLUME_KEY);
      if (saved) return Number(saved) || 0;
    } catch {}
    return 0;
  });

  // Track AI queries processed today
  const [aiQueriesToday, setAiQueriesToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(AI_QUERIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.resetDate === getTodayDateString()) {
          return Number(parsed.count) || 0;
        }
      }
    } catch {}
    return 0;
  });

  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>(null);
  const [blockedFileSize, setBlockedFileSize] = useState<number | undefined>(undefined);

  // Sync active tier from localStorage or override
  useEffect(() => {
    if (isUserProOverride) {
      setActiveTier("pro-monthly");
    } else {
      setActiveTier(detectActivePlanTier());
    }
  }, [isUserProOverride]);

  const saveUsage = (newUsage: UsageData) => {
    setUsage(newUsage);
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(newUsage));
    } catch (e) {
      console.error("Failed to save usage tracker:", e);
    }
  };

  const recordDataVolume = useCallback((bytes: number) => {
    if (!bytes || bytes <= 0) return;
    setTotalVolumeBytes((prev) => {
      const next = prev + bytes;
      try {
        localStorage.setItem(DATA_VOLUME_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const triggerPaywall = useCallback((reason: PaywallReason, fileSize?: number) => {
    setPaywallReason(reason);
    setBlockedFileSize(fileSize);
    setIsPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallReason(null);
    setBlockedFileSize(undefined);
  }, []);

  // Check if a file download/conversion can proceed
  const canProcessDownload = useCallback(
    (fileSizeBytes?: number): { allowed: boolean; reason?: "DAILY_LIMIT_REACHED" | "FILE_SIZE_EXCEEDED" } => {
      // Check file size limit according to active plan
      if (fileSizeBytes && fileSizeBytes > currentPlan.maxFileSizeBytes) {
        return { allowed: false, reason: "FILE_SIZE_EXCEEDED" };
      }

      // Check daily operations limit
      if (currentPlan.maxDailyOperations !== Infinity && usage.count >= currentPlan.maxDailyOperations) {
        return { allowed: false, reason: "DAILY_LIMIT_REACHED" };
      }

      return { allowed: true };
    },
    [currentPlan, usage.count]
  );

  // Increment usage count after successful download/conversion
  const recordDownload = useCallback((fileSizeBytes?: number) => {
    if (fileSizeBytes) {
      recordDataVolume(fileSizeBytes);
    }

    const todayStr = getTodayDateString();
    const currentCount = usage.resetDate === todayStr ? usage.count : 0;
    const newCount = currentCount + 1;
    const newUsage: UsageData = {
      count: newCount,
      resetDate: todayStr,
      totalLifetimeDownloads: (usage.totalLifetimeDownloads || 0) + 1,
    };
    saveUsage(newUsage);

    if (currentPlan.maxDailyOperations !== Infinity && newCount >= currentPlan.maxDailyOperations) {
      console.log(`[UsageTracker] Daily limit reached (${newCount}/${currentPlan.maxDailyOperations}). Next attempt will open Paywall.`);
    }
  }, [currentPlan, usage, recordDataVolume]);

  // Check if batch processing file count is allowed
  const canProcessBatch = useCallback(
    (fileCount: number): { allowed: boolean; reason?: "BATCH_LIMIT_EXCEEDED" } => {
      if (fileCount > currentPlan.maxBatchFiles) {
        return { allowed: false, reason: "BATCH_LIMIT_EXCEEDED" };
      }
      return { allowed: true };
    },
    [currentPlan]
  );

  // Check if AI / OCR trial queries can proceed
  const canProcessAiQuery = useCallback((): { allowed: boolean; reason?: "AI_TRIAL_EXCEEDED" } => {
    if (currentPlan.maxDailyAiQueries === Infinity) return { allowed: true };
    try {
      const todayStr = getTodayDateString();
      const savedAi = localStorage.getItem(AI_QUERIES_KEY);
      if (savedAi) {
        const parsed = JSON.parse(savedAi);
        if (parsed.resetDate === todayStr && parsed.count >= currentPlan.maxDailyAiQueries) {
          return { allowed: false, reason: "AI_TRIAL_EXCEEDED" };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { allowed: true };
  }, [currentPlan]);

  // Record AI query usage
  const recordAiQuery = useCallback(() => {
    const todayStr = getTodayDateString();
    let currentCount = 0;
    try {
      const savedAi = localStorage.getItem(AI_QUERIES_KEY);
      if (savedAi) {
        const parsed = JSON.parse(savedAi);
        if (parsed.resetDate === todayStr) {
          currentCount = parsed.count || 0;
        }
      }
      const nextCount = currentCount + 1;
      setAiQueriesToday(nextCount);
      localStorage.setItem(
        AI_QUERIES_KEY,
        JSON.stringify({ count: nextCount, resetDate: todayStr })
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  const setProStatus = useCallback((active: boolean, tier: keyof typeof PLAN_LIMITS = "pro-monthly") => {
    setActiveTier(active ? tier : "free");
    try {
      localStorage.setItem(PRO_PLAN_KEY, active ? tier : "free");
      localStorage.setItem("pdfsun_user_is_pro", active ? "true" : "false");
    } catch (e) {
      console.error(e);
    }
  }, []);

  const resetCounter = useCallback(() => {
    const todayStr = getTodayDateString();
    saveUsage({
      count: 0,
      resetDate: todayStr,
      totalLifetimeDownloads: usage.totalLifetimeDownloads || 0,
    });
  }, [usage.totalLifetimeDownloads]);

  const remaining = currentPlan.maxDailyOperations === Infinity
    ? Infinity
    : Math.max(0, currentPlan.maxDailyOperations - usage.count);

  const aiQueriesRemaining = currentPlan.maxDailyAiQueries === Infinity
    ? Infinity
    : Math.max(0, currentPlan.maxDailyAiQueries - aiQueriesToday);

  return {
    activeTier,
    currentPlan,
    count: usage.count,
    maxDailyFree: currentPlan.maxDailyOperations === Infinity ? 999999 : currentPlan.maxDailyOperations,
    remaining,
    maxFreeFileSizeBytes: currentPlan.maxFileSizeBytes,
    maxFileSizeMB: currentPlan.maxFileSizeMB,
    maxBatchFiles: currentPlan.maxBatchFiles,
    maxAiQueries: currentPlan.maxDailyAiQueries,
    aiQueriesToday,
    aiQueriesRemaining,
    totalVolumeBytes,
    totalVolumeMB: Number((totalVolumeBytes / (1024 * 1024)).toFixed(2)),
    isPro,
    canProcessDownload,
    recordDownload,
    recordDataVolume,
    canProcessBatch,
    canProcessAiQuery,
    recordAiQuery,
    setProStatus,
    resetCounter,
    isPaywallOpen,
    paywallReason,
    blockedFileSize,
    triggerPaywall,
    closePaywall,
  };
}
