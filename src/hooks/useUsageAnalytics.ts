import { useState, useEffect, useCallback, useMemo } from "react";

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
}

export const useUsageAnalytics = (topLimit: number = 50): UsageAnalyticsHook => {
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  // Fetch genuine server-persisted tool execution counts on mount
  useEffect(() => {
    let active = true;
    const fetchToolAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics/tools");
        if (!res.ok) return;
        const json = await res.json();
        if (active && json?.counts && typeof json.counts === "object") {
          setUsageCounts(json.counts);
        }
      } catch {
        // Non-blocking when offline
      }
    };
    fetchToolAnalytics();
    return () => {
      active = false;
    };
  }, []);

  // Increment in-memory counter when a genuine conversion completes
  const trackToolUsage = useCallback((toolId: string) => {
    if (!toolId) return;
    setUsageCounts((prev) => ({
      ...prev,
      [toolId]: (prev[toolId] || 0) + 1,
    }));
  }, []);

  const getUsageCount = useCallback(
    (toolId: string): number => {
      return usageCounts[toolId] || 0;
    },
    [usageCounts]
  );

  const totalExecutions = useMemo(() => {
    return Object.values(usageCounts).reduce((acc, curr) => acc + curr, 0);
  }, [usageCounts]);

  const getToolSharePercentage = useCallback(
    (toolId: string): number => {
      const count = usageCounts[toolId] || 0;
      if (totalExecutions === 0) return 0;
      return Number(((count / totalExecutions) * 100).toFixed(1));
    },
    [usageCounts, totalExecutions]
  );

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

  const topToolIds = useMemo(() => {
    return Object.entries(usageCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topLimit)
      .map(([id]) => id);
  }, [usageCounts, topLimit]);

  const isMostPopular = useCallback(
    (toolId: string): boolean => {
      return topToolIds.slice(0, 8).includes(toolId);
    },
    [topToolIds]
  );

  const resetUsage = useCallback(() => {
    setUsageCounts({});
  }, []);

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
  };
};
