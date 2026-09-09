import { DailyKnowledgeData } from "../server/knowledgeHubController";

const localClientCache = new Map<string, DailyKnowledgeData>();

/**
 * Fetch daily knowledge hub data for a specific date, country, and language
 */
export async function fetchDailyKnowledge(
  dateStr: string,
  country: string,
  language: string
): Promise<DailyKnowledgeData | null> {
  const cacheKey = `${dateStr}_${country}_${language}`;
  if (localClientCache.has(cacheKey)) {
    return localClientCache.get(cacheKey)!;
  }

  try {
    let res = await fetch("/api/get-daily-knowledge-hub", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: dateStr,
        country,
        language,
      }),
    });

    if (!res.ok) {
      res = await fetch("/api/knowledge-hub/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateStr,
          country,
          language,
        }),
      });
    }

    if (!res.ok) {
      throw new Error(`Knowledge hub API responded with status ${res.status}`);
    }

    const json = await res.json();
    if (json.success && json.data) {
      localClientCache.set(cacheKey, json.data);
      return json.data;
    }
  } catch (err) {
    console.warn("Error fetching daily knowledge:", err);
  }

  return null;
}
