import { DayInHistoryData } from "../types/history";
import { DAILY_HISTORY_DATABASE } from "../data/historyData";
import { formatLocalizedHistoryDate } from "../utils/geoLanguageDetector";

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

  // Try fetching from server API first (which has Gemini translation and dynamic daily historical events)
  try {
    const res = await fetch(`/api/history/today?month=${month}&day=${day}&lang=${langCode}&country=${countryCode}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.events && data.events.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Graceful fallback to client built-in database
  }

  // Fallback to client-side database
  const fallbackEntry = DAILY_HISTORY_DATABASE[dateKey] || DAILY_HISTORY_DATABASE["8-17"] || {};
  const formattedDateStr = formatLocalizedHistoryDate(date, langCode);

  const finalData: DayInHistoryData = {
    dateString: formattedDateStr,
    month,
    day,
    formattedDate: formattedDateStr,
    dayOfYear: Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)),
    featuredHeadline: fallbackEntry.featuredHeadline || "Historic Global Milestones & Scientific Breakthroughs",
    countryCode,
    countryName: countryCode === "IN" ? "India" : "Global",
    languageCode: langCode,
    languageName: langCode,
    events: fallbackEntry.events || [],
    births: fallbackEntry.births || [],
    discoveries: fallbackEntry.discoveries || [],
    dailyTrivia: fallbackEntry.dailyTrivia || {
      id: `trv-${month}${day}`,
      question: "Which major milestone took place on this day in global history?",
      options: ["The Radcliffe Line demarcation in 1947", "The first commercial audio CD in 1982", "Venera 7 launch in 1970", "All of the above"],
      correctIndex: 3,
      explanation: "August 17 is notable for multiple historic breakthroughs across national independence, music technology, and space exploration.",
      historicalContext: "History is full of interconnected technological and human milestones.",
      relatedYear: "Multiple"
    },
    quoteOfTheDay: fallbackEntry.quoteOfTheDay || {
      quote: "History is a gallery of pictures in which there are few originals and many copies.",
      author: "Alexis de Tocqueville",
      context: "Historian & Political Philosopher"
    }
  };

  return finalData;
}
