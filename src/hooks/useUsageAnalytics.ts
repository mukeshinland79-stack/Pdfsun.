import { useState, useEffect, useCallback, useMemo } from "react";
import { trackGAEvent } from "../utils/analytics";

const STORAGE_KEY = "pdfsun_usage_analytics";

// Realistic initial seed usage counts for tools
const DEFAULT_USAGE_COUNTS: Record<string, number> = {
  "merge-pdf": 1845,
  "compress-pdf": 1620,
  "pdf-to-word": 1490,
  "ai-chat-pdf": 1350,
  "annotate-pdf": 1210,
  "split-pdf": 980,
  "edit-pdf": 890,
  "ocr-pdf": 760,
  "word-to-pdf": 680,
  "excel-to-pdf": 540,
  "pdf-to-jpg": 490,
  "protect-pdf": 430,
  "unlock-pdf": 410,
  "organize-pdf": 390,
  "watermark-pdf": 350,
  "ai-summarize-pdf": 320,
};

export interface UsageAnalyticsHook {
  usageCounts: Record<string, number>;
  trackToolUsage: (toolId: string) => void;
  getUsageCount: (toolId: string) => number;
  getFormattedUsage: (toolId: string) => string;
  isMostPopular: (toolId: string) => boolean;
  topToolIds: string[];
  totalExecutions: number;
  getToolSharePercentage: (toolId: string) => number;
  resetUsage: () => void;
  simulateRandomUsage: () => string;
}

export const useUsageAnalytics = (topLimit: number = 50): UsageAnalyticsHook => {
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved data with default seed counts for any missing tools
        return { ...DEFAULT_USAGE_COUNTS, ...parsed };
      }
    } catch (err) {
      console.warn("Failed to read usage analytics from localStorage:", err);
    }
    return DEFAULT_USAGE_COUNTS;
  });

  // Persist changes to localStorage whenever state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usageCounts));
    } catch (err) {
      console.warn("Failed to save usage analytics to localStorage:", err);
    }
  }, [usageCounts]);

  // Track tool usage by incrementing count
  const trackToolUsage = useCallback((toolId: string) => {
    if (!toolId) return;
    setUsageCounts((prev) => {
      const current = prev[toolId] || 0;
      return {
        ...prev,
        [toolId]: current + 1,
      };
    });
  }, []);

  // Get raw usage count
  const getUsageCount = useCallback(
    (toolId: string): number => {
      return usageCounts[toolId] || 0;
    },
    [usageCounts]
  );

  // Total executions across all tools
  const totalExecutions = useMemo(() => {
    return Object.values(usageCounts).reduce((acc, curr) => acc + curr, 0);
  }, [usageCounts]);

  // Get tool share percentage
  const getToolSharePercentage = useCallback(
    (toolId: string): number => {
      const count = usageCounts[toolId] || 0;
      if (totalExecutions === 0) return 0;
      return Number(((count / totalExecutions) * 100).toFixed(1));
    },
    [usageCounts, totalExecutions]
  );

  // Format usage number into user-friendly text (e.g., "1.8k uses" or "980 uses")
  const getFormattedUsage = useCallback(
    (toolId: string): string => {
      const count = usageCounts[toolId] || 0;
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k uses`;
      }
      return `${count} uses`;
    },
    [usageCounts]
  );

  // Compute top tool IDs based on usage count
  const topToolIds = useMemo(() => {
    return Object.entries(usageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topLimit)
      .map(([id]) => id);
  }, [usageCounts, topLimit]);

  // Check if a tool is among the top popular tools
  const isMostPopular = useCallback(
    (toolId: string): boolean => {
      return topToolIds.slice(0, 8).includes(toolId);
    },
    [topToolIds]
  );

  // Reset usage counters
  const resetUsage = useCallback(() => {
    setUsageCounts(DEFAULT_USAGE_COUNTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USAGE_COUNTS));
    } catch {
      // ignore
    }
  }, []);

  // Simulate a random tool usage tick
  const simulateRandomUsage = useCallback((): string => {
    const keys = Object.keys(usageCounts);
    if (keys.length === 0) return "";
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    trackToolUsage(randomKey);
    return randomKey;
  }, [usageCounts, trackToolUsage]);

  return {
    usageCounts,
    trackToolUsage,
    getUsageCount,
    getFormattedUsage,
    isMostPopular,
    topToolIds,
    totalExecutions,
    getToolSharePercentage,
    resetUsage,
    simulateRandomUsage,
  };
};
