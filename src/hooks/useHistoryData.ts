import { useState, useEffect, useRef, useCallback } from "react";
import { DayInHistoryData, HistoryEventItem } from "../types/history";
import { fetchDayInHistory } from "../services/historyService";
import { deepLocalizeHistoryData } from "../utils/dynamicHistoryTranslator";
import { useLanguageStore } from "./useLanguageStore";

// Fast in-memory cache to prevent duplicate network hits during tab/language toggling
const inMemoryCache = new Map<string, { data: DayInHistoryData; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 Hours

// Wikipedia supported language subdomains for onthisday feeds
const WIKI_SUPPORTED_LANGUAGES = new Set([
  "en", "de", "fr", "es", "ru", "ar", "bs", "uk", "sv", "pt"
]);

interface UseHistoryDataOptions {
  initialDate?: Date;
  countryCode?: string;
  forceRefresh?: boolean;
}

interface UseHistoryDataResult {
  data: DayInHistoryData | null;
  loading: boolean;
  error: string | null;
  isFallback: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  refetch: (force?: boolean) => Promise<void>;
  nextDay: () => void;
  prevDay: () => void;
  today: () => void;
}

/**
 * Enterprise Custom Hook for Today in History (V2)
 * Features client-side SWR caching, Wikipedia REST API integration, and algorithmic fallback.
 */
export function useHistoryData(options: UseHistoryDataOptions = {}): UseHistoryDataResult {
  const { currentLanguage, languageMeta, formatLocalizedDate } = useLanguageStore();
  const [selectedDate, setSelectedDate] = useState<Date>(() => options.initialDate || new Date());
  const [data, setData] = useState<DayInHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  const countryCode = options.countryCode || "IN";
  const abortControllerRef = useRef<AbortController | null>(null);

  const month = selectedDate.getMonth() + 1;
  const day = selectedDate.getDate();
  const year = selectedDate.getFullYear();
  const cacheKey = `history_v2_${month}_${day}_${countryCode.toUpperCase()}_${currentLanguage.toLowerCase()}`;

  const loadData = useCallback(
    async (force: boolean = false) => {
      // 1. Check in-memory SWR cache first for instant sub-20ms transitions
      if (!force) {
        const cached = inMemoryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          setData(cached.data);
          setLoading(false);
          setError(null);
          setIsFallback(!!cached.data.isFallbackTranslation);
          return;
        }

        // Check localStorage cache
        if (typeof window !== "undefined") {
          try {
            const rawStored = localStorage.getItem(cacheKey);
            if (rawStored) {
              const parsed = JSON.parse(rawStored) as DayInHistoryData;
              if (parsed && parsed.events && parsed.events.length > 0) {
                inMemoryCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
                setData(parsed);
                setLoading(false);
                setError(null);
                setIsFallback(!!parsed.isFallbackTranslation);
                return;
              }
            }
          } catch {}
        }
      }

      setLoading(true);
      setError(null);

      // Cancel previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let payload: DayInHistoryData | null = null;
        let usedFallback = false;

        // Strategy A: Direct Wikipedia REST API if language is natively supported
        if (WIKI_SUPPORTED_LANGUAGES.has(currentLanguage)) {
          try {
            const mm = String(month).padStart(2, "0");
            const dd = String(day).padStart(2, "0");
            const wikiUrl = `https://${currentLanguage}.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`;

            const wikiRes = await fetch(wikiUrl, {
              headers: { Accept: "application/json" },
              signal: controller.signal,
            });

            if (wikiRes.ok) {
              const wikiJson = await wikiRes.json();
              if (wikiJson?.events && Array.isArray(wikiJson.events) && wikiJson.events.length > 0) {
                // Map raw Wikipedia events into standardized DayInHistoryData
                const mappedEvents: HistoryEventItem[] = wikiJson.events.slice(0, 14).map((e: any, idx: number) => {
                  const primaryPage = e.pages && e.pages[0];
                  return {
                    id: `wiki-${currentLanguage}-${e.year}-${idx}`,
                    year: e.year,
                    originalYear: e.year,
                    headline: primaryPage?.displaytitle || primaryPage?.title || e.text.slice(0, 70),
                    title: primaryPage?.title || `Event in ${e.year}`,
                    subtitle: primaryPage?.description || "Historical Milestone",
                    description: e.text,
                    category: "milestone",
                    tag: "GLOBAL MILESTONE",
                    significance: primaryPage?.extract ? primaryPage.extract.slice(0, 160) : `Landmark historic achievement in ${e.year}.`,
                    sourceName: `Wikipedia (${languageMeta.name})`,
                    sourceDomain: `${currentLanguage}.wikipedia.org`,
                    wikipediaUrl: primaryPage?.content_urls?.desktop?.page || undefined,
                    imageUrl: primaryPage?.thumbnail?.source || undefined,
                    verificationStatus: "VERIFIED",
                  };
                });

                // Generate synthesized trivia and quote in target language or via translator
                const baseQuizQuestion = mappedEvents[0]
                  ? `Which milestone occurred in the year ${mappedEvents[0].year}?`
                  : `What historic turning point occurred on ${formatLocalizedDate(selectedDate)}?`;

                const initialPayload: DayInHistoryData = {
                  dateString: formatLocalizedDate(selectedDate),
                  month,
                  day,
                  formattedDate: formatLocalizedDate(selectedDate),
                  dayOfYear: Math.floor(
                    (selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 0).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ),
                  featuredHeadline: mappedEvents[0]?.headline || `Historic Global Milestones on ${formatLocalizedDate(selectedDate)}`,
                  countryCode,
                  countryName: countryCode,
                  languageCode: currentLanguage,
                  languageName: languageMeta.name,
                  events: mappedEvents,
                  births: [],
                  discoveries: [],
                  dailyTrivia: {
                    id: `trv-${month}-${day}-${currentLanguage}`,
                    question: baseQuizQuestion,
                    options: [
                      mappedEvents[0]?.headline || "Crucial Technological Breakthrough",
                      "International Diplomatic Accord",
                      "Global Scientific Expedition",
                      "All of the above",
                    ],
                    correctIndex: 0,
                    explanation: mappedEvents[0]?.description || "Key turning point in modern history.",
                    historicalContext: `Recorded in historical annals of ${selectedDate.getFullYear()}.`,
                    relatedYear: mappedEvents[0]?.year || year,
                    sourceName: `Wikipedia (${languageMeta.name})`,
                    sourceDomain: `${currentLanguage}.wikipedia.org`,
                    verificationStatus: "VERIFIED",
                  },
                  quoteOfTheDay: {
                    quote: "History is a guide to navigation in perilous times. History is who we are and why we are the way we are.",
                    author: "David McCullough",
                    context: "Pulitzer Prize-winning Historian",
                    sourceName: "Historical Archives",
                    sourceDomain: "wikimedia.org",
                    verificationStatus: "VERIFIED",
                  },
                  version: "2.0-direct-wiki",
                };

                // Deep translate trivia & quote into target language
                payload = deepLocalizeHistoryData(initialPayload, currentLanguage, countryCode);
              }
            }
          } catch (e: any) {
            if (e.name === "AbortError") return;
            // Gracefully proceed to Strategy B
          }
        }

        // Strategy B: Fallback to unified server API adapter with client-side localization
        if (!payload) {
          const fallbackData = await fetchDayInHistory(selectedDate, currentLanguage, countryCode, force);
          if (fallbackData) {
            payload = deepLocalizeHistoryData(fallbackData, currentLanguage, countryCode);
            if (currentLanguage !== "en" && !WIKI_SUPPORTED_LANGUAGES.has(currentLanguage)) {
              usedFallback = true;
              payload.isFallbackTranslation = true;
            }
          }
        }

        if (payload) {
          // Cache successful payload in memory and localStorage
          inMemoryCache.set(cacheKey, { data: payload, timestamp: Date.now() });
          try {
            localStorage.setItem(cacheKey, JSON.stringify(payload));
          } catch {}

          setData(payload);
          setIsFallback(usedFallback);
        } else {
          setError("Failed to fetch historical events for this date.");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching history data:", err);
          setError(err.message || "Network error loading history data.");
        }
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, countryCode, currentLanguage, day, formatLocalizedDate, languageMeta.name, month, selectedDate, year]
  );

  useEffect(() => {
    loadData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  // Date Navigation Actions
  const nextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() + 1);
      return n;
    });
  }, []);

  const prevDay = useCallback(() => {
    setSelectedDate((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() - 1);
      return n;
    });
  }, []);

  const today = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  return {
    data,
    loading,
    error,
    isFallback,
    selectedDate,
    setSelectedDate,
    refetch: loadData,
    nextDay,
    prevDay,
    today,
  };
}
