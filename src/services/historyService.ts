import { DayInHistoryData } from "../types/history";
import { DAILY_HISTORY_DATABASE, generateAlgorithmicDayInHistory } from "../data/historyData";
import { formatLocalizedHistoryDate, COUNTRY_META_MAP, TOP_30_LANGUAGES } from "../utils/geoLanguageDetector";

/**
 * Service to fetch and provide rich Day in History data
 */
export async function fetchDayInHistory(
  date: Date,
  langCode: string = "en",
  countryCode: string = "IN"
): Promise<DayInHistoryData> {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateKey = `${month}-${day}`;

  // 1. Try fetching from server API (which supports dynamic Gemini AI generation, country filtering, & translation)
  try {
    const res = await fetch(`/api/history/today?month=${month}&day=${day}&lang=${langCode}&country=${countryCode}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.events && data.events.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Gracefully handle network disconnects or API errors
  }

  // 2. Client-side database fallback
  const fallbackEntry = DAILY_HISTORY_DATABASE[dateKey];
  const formattedDateStr = formatLocalizedHistoryDate(date, langCode);
  const countryMeta = COUNTRY_META_MAP[countryCode] || { name: "Global", defaultLang: "en", flag: "🌐" };
  const langMeta = TOP_30_LANGUAGES.find((l) => l.code === langCode) || TOP_30_LANGUAGES[0];

  if (fallbackEntry && fallbackEntry.events && fallbackEntry.events.length > 0) {
    const countryMatches = fallbackEntry.events.some((e) => e.countryCode === countryCode);
    return {
      dateString: formattedDateStr,
      month,
      day,
      formattedDate: formattedDateStr,
      dayOfYear: Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)),
      featuredHeadline: fallbackEntry.featuredHeadline || `Historic Milestones on ${formattedDateStr}`,
      countryCode,
      countryName: countryMeta.name,
      languageCode: langCode,
      languageName: langMeta.name,
      isCountrySpecific: countryMatches,
      isGlobalFallback: !countryMatches,
      events: fallbackEntry.events || [],
      births: fallbackEntry.births || [],
      discoveries: fallbackEntry.discoveries || [],
      dailyTrivia: fallbackEntry.dailyTrivia || {
        id: `trv-${month}-${day}`,
        question: `Which significant historical event took place on this day?`,
        options: ["Major Historic Treaty", "Scientific Invention", "Exploration Milestone", "All of the above"],
        correctIndex: 3,
        explanation: `${formattedDateStr} marks multiple interconnected historic breakthroughs.`,
        historicalContext: "History is defined by key human achievements.",
        relatedYear: "Multiple"
      },
      quoteOfTheDay: fallbackEntry.quoteOfTheDay || {
        quote: "History is a gallery of pictures in which there are few originals and many copies.",
        author: "Alexis de Tocqueville",
        context: "Historian & Political Philosopher"
      }
    };
  }

  // 3. Dynamic algorithmic fallback for all 365 days
  const algorithmic = generateAlgorithmicDayInHistory(month, day, countryCode, langCode);
  algorithmic.formattedDate = formattedDateStr;
  algorithmic.dateString = formattedDateStr;
  algorithmic.isGlobalFallback = true;
  return algorithmic;
}
