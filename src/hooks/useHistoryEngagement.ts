import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { HistoryEventItem } from "../types/history";
import { recordHistoryEngagementToFirestore, fetchPopularHistoryFromFirestore } from "../lib/firebase";

export interface EventEngagementMetrics {
  eventId: string;
  views: number;
  reads: number;
  likes: number;
  shares: number;
  copies: number;
  downloads: number;
  score: number;
  isLiked: boolean;
  lastInteractedAt: number;
}

const LOCAL_STORAGE_KEY = "pdfsun_history_engagement_v2";
const LIKES_STORAGE_KEY = "pdfsun_history_user_likes_v2";
const SYNC_EVENT_NAME = "pdfsun_history_engagement_updated";

/**
 * Deterministically generates high-authority baseline engagement metrics
 * from event ID / year string, ensuring realistic trust signals across all 66+ tools & history items.
 */
function getBaselineMetrics(eventId: string, item?: Partial<HistoryEventItem>): { views: number; reads: number; likes: number; shares: number } {
  let hash = 0;
  const str = `${eventId || "hist"}_${item?.year || "year"}_${item?.headline || ""}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const pos = Math.abs(hash);
  const views = 240 + (pos % 1860);
  const reads = 45 + ((pos >> 2) % 380);
  const likes = 18 + ((pos >> 4) % 190);
  const shares = 6 + ((pos >> 6) % 75);
  return { views, reads, likes, shares };
}

export function useHistoryEngagement(currentDateKey?: string) {
  // 1. Client-side local metrics store
  const [engagementMap, setEngagementMap] = useState<Record<string, Partial<EventEngagementMetrics>>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Could not read history engagement cache:", e);
    }
    return {};
  });

  // 2. User liked items set
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(LIKES_STORAGE_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch {}
    return new Set();
  });

  // Keep state synchronized across components and browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          setEngagementMap(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === LIKES_STORAGE_KEY && e.newValue) {
        try {
          setLikedIds(new Set(JSON.parse(e.newValue)));
        } catch {}
      }
    };

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ map?: Record<string, Partial<EventEngagementMetrics>>; liked?: string[] }>;
      if (customEvent.detail?.map) {
        setEngagementMap(customEvent.detail.map);
      }
      if (customEvent.detail?.liked) {
        setLikedIds(new Set(customEvent.detail.liked));
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SYNC_EVENT_NAME, handleCustomSync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SYNC_EVENT_NAME, handleCustomSync);
    };
  }, []);

  // Persist state updates & notify other components
  const persistState = useCallback(
    (newMap: Record<string, Partial<EventEngagementMetrics>>, newLikes?: Set<string>) => {
      setEngagementMap(newMap);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMap));
      } catch {}

      if (newLikes) {
        setLikedIds(newLikes);
        try {
          localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(Array.from(newLikes)));
        } catch {}
      }

      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT_NAME, {
          detail: {
            map: newMap,
            liked: newLikes ? Array.from(newLikes) : Array.from(likedIds),
          },
        })
      );
    },
    [likedIds]
  );

  // Send non-blocking background telemetry to backend and Firestore
  const sendBackgroundTelemetry = useCallback(
    (
      eventId: string,
      type: "view" | "read" | "like" | "unlike" | "share" | "copy" | "download" | "quiz_attempt",
      item?: Partial<HistoryEventItem>,
      dateKey?: string
    ) => {
      if (!eventId) return;

      // 1. Post to Express API
      try {
        fetch("/api/history/engagement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            type,
            headline: item?.headline || item?.title || "Historical Milestone",
            year: item?.year || "",
            category: item?.category || "milestone",
            tag: item?.tag || "History",
            dateKey: dateKey || currentDateKey || "",
          }),
        }).catch(() => {
          // Graceful silent fail
        });
      } catch {}

      // 2. Sync to Firestore for real-time multi-client aggregation
      try {
        if (type === "view" || type === "read" || type === "like" || type === "share" || type === "download") {
          recordHistoryEngagementToFirestore(eventId, type, {
            headline: item?.headline || item?.title,
            year: item?.year,
            category: item?.category,
            tag: item?.tag,
            dateKey: dateKey || currentDateKey,
          }).catch(() => {});
        }
      } catch {}
    },
    [currentDateKey]
  );

  // Read current metrics for any given event with realistic baseline calculation
  const getEventMetrics = useCallback(
    (eventId: string, fallbackItem?: Partial<HistoryEventItem>): EventEngagementMetrics => {
      const base = getBaselineMetrics(eventId, fallbackItem);
      const userRec = engagementMap[eventId] || {};
      const isLiked = likedIds.has(eventId);

      const views = base.views + (userRec.views || 0);
      const reads = base.reads + (userRec.reads || 0);
      const likes = base.likes + (userRec.likes || 0) + (isLiked ? 1 : 0);
      const shares = base.shares + (userRec.shares || 0);
      const copies = userRec.copies || 0;
      const downloads = userRec.downloads || 0;

      // Weighted engagement calculation for ranking
      const score = views * 1 + reads * 3 + likes * 5 + shares * 8 + copies * 4 + downloads * 6;

      return {
        eventId,
        views,
        reads,
        likes,
        shares,
        copies,
        downloads,
        score,
        isLiked,
        lastInteractedAt: userRec.lastInteractedAt || 0,
      };
    },
    [engagementMap, likedIds]
  );

  // Debounced view tracking to avoid duplicate hits on quick rerenders
  const trackedViewsRef = useRef<Set<string>>(new Set());

  const trackView = useCallback(
    (item: HistoryEventItem, dateKey?: string) => {
      if (!item?.id) return;
      const key = `${item.id}_${dateKey || ""}`;
      if (trackedViewsRef.current.has(key)) return;
      trackedViewsRef.current.add(key);

      const current = engagementMap[item.id] || {};
      const updated: Record<string, Partial<EventEngagementMetrics>> = {
        ...engagementMap,
        [item.id]: {
          ...current,
          views: (current.views || 0) + 1,
          lastInteractedAt: Date.now(),
        },
      };

      persistState(updated);
      sendBackgroundTelemetry(item.id, "view", item, dateKey);
    },
    [engagementMap, persistState, sendBackgroundTelemetry]
  );

  // Track full detail modal / read clicks
  const trackReadDetail = useCallback(
    (item: HistoryEventItem, dateKey?: string) => {
      if (!item?.id) return;
      const current = engagementMap[item.id] || {};
      const updated: Record<string, Partial<EventEngagementMetrics>> = {
        ...engagementMap,
        [item.id]: {
          ...current,
          reads: (current.reads || 0) + 1,
          lastInteractedAt: Date.now(),
        },
      };

      persistState(updated);
      sendBackgroundTelemetry(item.id, "read", item, dateKey);
    },
    [engagementMap, persistState, sendBackgroundTelemetry]
  );

  // Toggle user like / reaction
  const toggleLike = useCallback(
    (item: HistoryEventItem, dateKey?: string): boolean => {
      if (!item?.id) return false;
      const nextLiked = new Set(likedIds);
      const wasLiked = nextLiked.has(item.id);

      if (wasLiked) {
        nextLiked.delete(item.id);
      } else {
        nextLiked.add(item.id);
      }

      const current = engagementMap[item.id] || {};
      const likesDelta = wasLiked ? -1 : 1;
      const updated: Record<string, Partial<EventEngagementMetrics>> = {
        ...engagementMap,
        [item.id]: {
          ...current,
          likes: Math.max(0, (current.likes || 0) + likesDelta),
          lastInteractedAt: Date.now(),
        },
      };

      persistState(updated, nextLiked);
      sendBackgroundTelemetry(item.id, wasLiked ? "unlike" : "like", item, dateKey);
      return !wasLiked;
    },
    [likedIds, engagementMap, persistState, sendBackgroundTelemetry]
  );

  // Track share
  const trackShare = useCallback(
    (item: HistoryEventItem, platform?: string) => {
      if (!item?.id) return;
      const current = engagementMap[item.id] || {};
      const updated: Record<string, Partial<EventEngagementMetrics>> = {
        ...engagementMap,
        [item.id]: {
          ...current,
          shares: (current.shares || 0) + 1,
          lastInteractedAt: Date.now(),
        },
      };

      persistState(updated);
      sendBackgroundTelemetry(item.id, "share", item);
    },
    [engagementMap, persistState, sendBackgroundTelemetry]
  );

  // Track copy story
  const trackCopy = useCallback(
    (item: HistoryEventItem) => {
      if (!item?.id) return;
      const current = engagementMap[item.id] || {};
      const updated: Record<string, Partial<EventEngagementMetrics>> = {
        ...engagementMap,
        [item.id]: {
          ...current,
          copies: (current.copies || 0) + 1,
          lastInteractedAt: Date.now(),
        },
      };

      persistState(updated);
      sendBackgroundTelemetry(item.id, "copy", item);
    },
    [engagementMap, persistState, sendBackgroundTelemetry]
  );

  // Track worksheet PDF download
  const trackWorksheetDownload = useCallback(
    (itemsCount: number, firstItemId?: string) => {
      if (firstItemId) {
        const current = engagementMap[firstItemId] || {};
        const updated = {
          ...engagementMap,
          [firstItemId]: {
            ...current,
            downloads: (current.downloads || 0) + 1,
            lastInteractedAt: Date.now(),
          },
        };
        persistState(updated);
        sendBackgroundTelemetry(firstItemId, "download");
      }
    },
    [engagementMap, persistState, sendBackgroundTelemetry]
  );

  // Track quiz participation
  const trackQuizAttempt = useCallback(
    (quizId: string, isCorrect: boolean) => {
      sendBackgroundTelemetry(quizId || "daily_quiz", "quiz_attempt");
    },
    [sendBackgroundTelemetry]
  );

  // Rank historical events by engagement score
  const getPopularEvents = useCallback(
    (items: HistoryEventItem[], limit?: number): HistoryEventItem[] => {
      if (!items || items.length === 0) return [];
      const scored = items.map((item) => ({
        item,
        score: getEventMetrics(item.id, item).score,
      }));

      scored.sort((a, b) => b.score - a.score);
      const sorted = scored.map((s) => s.item);
      return limit ? sorted.slice(0, limit) : sorted;
    },
    [getEventMetrics]
  );

  const isLiked = useCallback(
    (eventId: string) => {
      return likedIds.has(eventId);
    },
    [likedIds]
  );

  return {
    trackView,
    trackReadDetail,
    toggleLike,
    trackShare,
    trackCopy,
    trackWorksheetDownload,
    trackQuizAttempt,
    getEventMetrics,
    getPopularEvents,
    isLiked,
  };
}
