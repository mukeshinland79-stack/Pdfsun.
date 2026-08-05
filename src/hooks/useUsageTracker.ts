import { useState, useEffect, useCallback } from "react";

const USAGE_STORAGE_KEY = "pdfsun_usage_tracker_v1";
const PRO_PLAN_KEY = "pdfsun_user_plan_v1";
export const MAX_FREE_DAILY_DOWNLOADS = 3;
export const MAX_FREE_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB in Bytes

export interface UsageData {
  count: number;
  resetDate: string; // YYYY-MM-DD
  totalLifetimeDownloads: number;
}

export type PaywallReason = "limit" | "size" | null;

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
      const savedPlan = localStorage.getItem(PRO_PLAN_KEY);
      return savedPlan === "pro" || savedPlan === "owner";
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
    isPro,
    canProcessDownload,
    recordDownload,
    setProStatus,
    resetCounter,
    isPaywallOpen,
    paywallReason,
    blockedFileSize,
    triggerPaywall,
    closePaywall,
  };
}
