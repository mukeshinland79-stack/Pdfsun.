import { useState, useEffect, useCallback } from "react";

const USAGE_STORAGE_KEY = "pdfsun_usage_tracker_v1";
const PRO_PLAN_KEY = "pdfsun_user_plan_v1";
export const MAX_FREE_DAILY_DOWNLOADS = 3;
export const MAX_FREE_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB in Bytes
export const MAX_FREE_BATCH_FILES = 2; // Max 2 files for Free Users
export const MAX_FREE_AI_QUERIES = 2; // Max 2 trial queries for AI/OCR per day

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

export function useUsageTracker(isUserProOverride: boolean = false) {
  const [isPro, setIsPro] = useState<boolean>(() => {
    if (isUserProOverride) return true;
    try {
      const savedProfile = localStorage.getItem("pdfsun_user_profile");
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (
          p.role === "owner" ||
          p.hasAdminAccess ||
          p.isPro ||
          (p.plan && p.plan.toLowerCase().includes("pro")) ||
          (p.plan && p.plan.toLowerCase().includes("unlimited")) ||
          (p.plan && p.plan.toLowerCase().includes("owner")) ||
          (p.plan && p.plan.toLowerCase().includes("enterprise"))
        ) {
          return true;
        }
      }
      const savedPlan = localStorage.getItem(PRO_PLAN_KEY);
      const savedRole = localStorage.getItem("pdfsun_user_role");
      return savedPlan === "pro" || savedPlan === "owner" || savedRole === "owner";
    } catch {
      return false;
    }
  });

  const [usage, setUsage] = useState<UsageData>(() => {
    const todayStr = getTodayDateString();
    try {
      const saved = localStorage.getItem(USAGE_STORAGE_KEY);
      if (saved) {
        const parsed: UsageData = JSON.parse(saved);
        if (parsed.resetDate !== todayStr) {
          // Counter reset for new 24h day
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
    } catch (e) {
      console.error(e);
    }
    return initObj;
  });

  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>(null);
  const [blockedFileSize, setBlockedFileSize] = useState<number | undefined>(undefined);

  // Sync pro state if override changes
  useEffect(() => {
    if (isUserProOverride) {
      setIsPro(true);
    }
  }, [isUserProOverride]);

  // Save changes to localStorage
  const saveUsage = (newUsage: UsageData) => {
    setUsage(newUsage);
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(newUsage));
    } catch (e) {
      console.error("Failed to save usage tracker:", e);
    }
  };

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
      if (isPro) {
        return { allowed: true };
      }

      // Check file size cap (15 MB)
      if (fileSizeBytes && fileSizeBytes > MAX_FREE_FILE_SIZE_BYTES) {
        return { allowed: false, reason: "FILE_SIZE_EXCEEDED" };
      }

      // Check daily limit (3 max)
      if (usage.count >= MAX_FREE_DAILY_DOWNLOADS) {
        return { allowed: false, reason: "DAILY_LIMIT_REACHED" };
      }

      return { allowed: true };
    },
    [isPro, usage.count]
  );

  // Increment usage count after successful download/conversion
  const recordDownload = useCallback(() => {
    if (isPro) return;

    const todayStr = getTodayDateString();
    const currentCount = usage.resetDate === todayStr ? usage.count : 0;
    const newCount = currentCount + 1;
    const newUsage: UsageData = {
      count: newCount,
      resetDate: todayStr,
      totalLifetimeDownloads: (usage.totalLifetimeDownloads || 0) + 1,
    };
    saveUsage(newUsage);

    // If reached max, notify user
    if (newCount >= MAX_FREE_DAILY_DOWNLOADS) {
      console.log("[UsageTracker] Daily limit reached (3/3). Next attempt will open Paywall.");
    }
  }, [isPro, usage]);

  // Check if batch processing file count is allowed (Max 2 for free users)
  const canProcessBatch = useCallback(
    (fileCount: number): { allowed: boolean; reason?: "BATCH_LIMIT_EXCEEDED" } => {
      if (isPro) return { allowed: true };
      if (fileCount > MAX_FREE_BATCH_FILES) {
        return { allowed: false, reason: "BATCH_LIMIT_EXCEEDED" };
      }
      return { allowed: true };
    },
    [isPro]
  );

  // Check if AI / OCR trial queries can proceed (Max 2 trial queries per day for free users)
  const canProcessAiQuery = useCallback((): { allowed: boolean; reason?: "AI_TRIAL_EXCEEDED" } => {
    if (isPro) return { allowed: true };
    try {
      const todayStr = getTodayDateString();
      const savedAi = localStorage.getItem("pdfsun_ai_query_count_v1");
      if (savedAi) {
        const parsed = JSON.parse(savedAi);
        if (parsed.resetDate === todayStr && parsed.count >= MAX_FREE_AI_QUERIES) {
          return { allowed: false, reason: "AI_TRIAL_EXCEEDED" };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { allowed: true };
  }, [isPro]);

  // Record AI query usage
  const recordAiQuery = useCallback(() => {
    if (isPro) return;
    try {
      const todayStr = getTodayDateString();
      let currentCount = 0;
      const savedAi = localStorage.getItem("pdfsun_ai_query_count_v1");
      if (savedAi) {
        const parsed = JSON.parse(savedAi);
        if (parsed.resetDate === todayStr) {
          currentCount = parsed.count || 0;
        }
      }
      localStorage.setItem(
        "pdfsun_ai_query_count_v1",
        JSON.stringify({ count: currentCount + 1, resetDate: todayStr })
      );
    } catch (e) {
      console.error(e);
    }
  }, [isPro]);

  const setProStatus = useCallback((active: boolean) => {
    setIsPro(active);
    try {
      localStorage.setItem(PRO_PLAN_KEY, active ? "pro" : "free");
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

  const remaining = isPro ? Infinity : Math.max(0, MAX_FREE_DAILY_DOWNLOADS - usage.count);

  return {
    count: usage.count,
    maxDailyFree: MAX_FREE_DAILY_DOWNLOADS,
    remaining,
    maxFreeFileSizeBytes: MAX_FREE_FILE_SIZE_BYTES,
    maxBatchFiles: MAX_FREE_BATCH_FILES,
    maxAiQueries: MAX_FREE_AI_QUERIES,
    isPro,
    canProcessDownload,
    recordDownload,
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
