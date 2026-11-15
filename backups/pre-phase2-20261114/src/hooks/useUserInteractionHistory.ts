import { useState, useEffect, useCallback, useMemo } from "react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

export interface ToolInteractionRecord {
  toolId: string;
  count: number;
  lastUsed: number; // Timestamp
}

const STORAGE_KEY = "pdfsun_user_tool_interactions_v1";
const SYNC_EVENT = "pdfsun_tool_interaction_event";

// Default recommended seeds for initial quick access
const DEFAULT_RECOMMENDED_IDS = [
  "merge-pdf",
  "compress-pdf",
  "pdf-to-word",
  "ai-chat-pdf",
  "annotate-pdf",
  "split-pdf",
  "ocr-pdf",
  "edit-pdf",
];

export function useUserInteractionHistory() {
  const [interactions, setInteractions] = useState<Record<string, ToolInteractionRecord>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load user tool interaction history:", e);
    }
    return {};
  });

  // Keep state synchronized across windows/tabs and component instances
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setInteractions(JSON.parse(e.newValue));
        } catch {}
      }
    };

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, ToolInteractionRecord>>;
      if (customEvent.detail) {
        setInteractions(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SYNC_EVENT, handleCustomSync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SYNC_EVENT, handleCustomSync);
    };
  }, []);

  // Save to localStorage & notify other components
  const persistInteractions = useCallback((updated: Record<string, ToolInteractionRecord>) => {
    setInteractions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT, { detail: updated })
      );
    } catch (e) {
      console.warn("Failed to save tool interaction history:", e);
    }
  }, []);

  // Record an interaction (click or launch)
  const recordInteraction = useCallback(
    (toolId: string) => {
      if (!toolId) return;
      const now = Date.now();
      const current = interactions[toolId] || { toolId, count: 0, lastUsed: now };
      const updated = {
        ...interactions,
        [toolId]: {
          toolId,
          count: current.count + 1,
          lastUsed: now,
        },
      };
      persistInteractions(updated);
    },
    [interactions, persistInteractions]
  );

  // Clear interaction history
  const clearHistory = useCallback(() => {
    persistInteractions({});
  }, [persistInteractions]);

  // Frequently used tools sorted by user click count
  const frequentlyUsedTools = useMemo<ToolItem[]>(() => {
    const records = Object.values(interactions).filter((r) => r.count > 0);
    if (records.length === 0) {
      // Return default starter pack if no history
      return DEFAULT_RECOMMENDED_IDS.map((id) => ALL_TOOLS.find((t) => t.id === id)).filter(
        Boolean
      ) as ToolItem[];
    }

    return records
      .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
      .map((r) => ALL_TOOLS.find((t) => t.id === r.toolId))
      .filter(Boolean) as ToolItem[];
  }, [interactions]);

  // Most recently used tools sorted by timestamp
  const recentlyUsedTools = useMemo<ToolItem[]>(() => {
    const records = Object.values(interactions).filter((r) => r.lastUsed > 0);
    if (records.length === 0) {
      return DEFAULT_RECOMMENDED_IDS.map((id) => ALL_TOOLS.find((t) => t.id === id)).filter(
        Boolean
      ) as ToolItem[];
    }

    return records
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .map((r) => ALL_TOOLS.find((t) => t.id === r.toolId))
      .filter(Boolean) as ToolItem[];
  }, [interactions]);

  // Check if personal history actually has records
  const hasPersonalHistory = useMemo(() => {
    return Object.keys(interactions).length > 0;
  }, [interactions]);

  // Format relative timestamp (e.g., "5m ago", "Today", "2d ago")
  const formatTimeAgo = useCallback((timestamp: number): string => {
    if (!timestamp) return "";
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return "Earlier";
  }, []);

  return {
    interactions,
    recordInteraction,
    clearHistory,
    frequentlyUsedTools,
    recentlyUsedTools,
    hasPersonalHistory,
    formatTimeAgo,
  };
}
