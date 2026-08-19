import express from "express";
import { GoogleGenAI } from "@google/genai";
import {
  DAILY_HISTORY_DATABASE,
  generateAlgorithmicDayInHistory,
  MONTH_NAMES,
  getHistoryText
} from "../data/historyData";
import { TOP_30_LANGUAGES, COUNTRY_META_MAP } from "../utils/geoLanguageDetector";
import { DayInHistoryData, HistoryEventItem, DailyTriviaQuiz } from "../types/history";

const historyCache = new Map<string, DayInHistoryData>();

// Helper to initialize Gemini AI client safely
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Express router for Today in History & Daily Knowledge Hub API
 */
export const historyRouter = express.Router();

historyRouter.get("/today", async (req, res) => {
  try {
    const rawMonth = parseInt(req.query.month as string, 10);
    const rawDay = parseInt(req.query.day as string, 10);
    const now = new Date();
    const month = !isNaN(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : now.getMonth() + 1;
    const day = !isNaN(rawDay) && rawDay >= 1 && rawDay <= 31 ? rawDay : now.getDate();
    const lang = (req.query.lang as string || "en").toLowerCase();
    const country = (req.query.country as string || "IN").toUpperCase();

    const cacheKey = `${month}-${day}-${lang}-${country}`;
    if (historyCache.has(cacheKey)) {
      return res.json(historyCache.get(cacheKey));
    }

    const monthName = MONTH_NAMES[month - 1] || "August";
    const formattedDate = `${monthName} ${day}`;
    const countryMeta = COUNTRY_META_MAP[country] || { name: "Global", defaultLang: "en", flag: "🌐" };
    const langMeta = TOP_30_LANGUAGES.find((l) => l.code === lang) || TOP_30_LANGUAGES[0];

    let historyData: DayInHistoryData | null = null;

    // 1. Try Gemini 3.7 Flash for Real-Time Country & Multilingual Historical Generation
    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `You are the core intelligence of "Today in History & Global Knowledge Hub".
Generate authentic, factual historical events for the date: ${formattedDate} (${monthName} ${day}).
Target Country/Perspective: ${countryMeta.name} (Country Code: ${country}).
Target Output Language: ${langMeta.name} (Native: ${langMeta.nativeName}, Code: ${lang}).

Requirements:
1. Provide 4-6 major historical milestones and events on ${formattedDate}. Prioritize events related to ${countryMeta.name} if any exist on this date; include other major world events as well.
2. Provide 2-3 famous birthdays (historical or notable figures born on ${formattedDate}).
3. Provide 1-2 scientific inventions or technological breakthroughs on or around ${formattedDate}.
4. Provide 1 accurate, engaging daily trivia question with 4 options, the 0-based correctIndex, and a clear explanation in ${langMeta.name}.
5. Provide 1 inspiring quote of the day with author and historical context.
6. Translate all headlines, descriptions, trivia, explanations, and quotes directly into ${langMeta.name}.

Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "featuredHeadline": "string (Catchy summary headline in ${langMeta.name})",
  "hasCountrySpecificEvents": boolean,
  "events": [
    {
      "id": "evt-1",
      "year": number or "string",
      "headline": "string",
      "description": "string",
      "category": "milestone" or "invention" or "culture" or "country-spotlight",
      "tag": "string",
      "significance": "string",
      "countryCode": "${country}" or other ISO-2 code,
      "countryName": "string",
      "wikipediaUrl": "string or undefined"
    }
  ],
  "births": [
    {
      "id": "bth-1",
      "year": number or "string",
      "headline": "Person Name",
      "description": "string",
      "category": "birth",
      "tag": "string",
      "significance": "string",
      "countryCode": "string",
      "countryName": "string"
    }
  ],
  "discoveries": [
    {
      "id": "dsc-1",
      "year": number or "string",
      "headline": "string",
      "description": "string",
      "category": "invention",
      "tag": "string",
      "significance": "string"
    }
  ],
  "dailyTrivia": {
    "id": "trv-${month}-${day}",
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctIndex": number (0 to 3),
    "explanation": "string",
    "historicalContext": "string",
    "relatedYear": "string or number"
  },
  "quoteOfTheDay": {
    "quote": "string",
    "author": "string",
    "context": "string"
  }
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed && Array.isArray(parsed.events) && parsed.events.length > 0) {
            const hasCountryMatches = parsed.events.some((e: any) => e.countryCode === country) || parsed.hasCountrySpecificEvents;
            historyData = {
              dateString: formattedDate,
              month,
              day,
              formattedDate,
              dayOfYear: Math.floor((new Date(2026, month - 1, day).getTime() - new Date(2026, 0, 0).getTime()) / (1000 * 60 * 60 * 24)),
              featuredHeadline: parsed.featuredHeadline || `Historic Milestones on ${formattedDate}`,
              countryCode: country,
              countryName: countryMeta.name,
              languageCode: lang,
              languageName: langMeta.name,
              isAiEnhanced: true,
              isCountrySpecific: !!hasCountryMatches,
              isGlobalFallback: !hasCountryMatches,
              events: parsed.events || [],
              births: parsed.births || [],
              discoveries: parsed.discoveries || [],
              dailyTrivia: parsed.dailyTrivia || {
                id: `trv-${month}-${day}`,
                question: `Which significant historical event took place on ${formattedDate}?`,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctIndex: 0,
                explanation: `Major historical events occurred on ${formattedDate}.`,
                historicalContext: "History is defined by key human achievements.",
                relatedYear: "Historic"
              },
              quoteOfTheDay: parsed.quoteOfTheDay || {
                quote: "History is a guide to navigation in perilous times.",
                author: "David McCullough",
                context: "Historian"
              }
            };
          }
        }
      } catch (geminiError) {
        console.warn("[History API] Gemini generation fallback to database:", geminiError);
      }
    }

    // 2. Fallback to Curated Database if available
    if (!historyData) {
      const baseKey = `${month}-${day}`;
      const curated = DAILY_HISTORY_DATABASE[baseKey];
      if (curated && curated.events && curated.events.length > 0) {
        const countryMatches = curated.events.some((e) => e.countryCode === country);
        historyData = {
          dateString: formattedDate,
          month,
          day,
          formattedDate,
          dayOfYear: Math.floor((new Date(2026, month - 1, day).getTime() - new Date(2026, 0, 0).getTime()) / (1000 * 60 * 60 * 24)),
          featuredHeadline: curated.featuredHeadline || `Historic Milestones on ${formattedDate}`,
          countryCode: country,
          countryName: countryMeta.name,
          languageCode: lang,
          languageName: langMeta.name,
          isAiEnhanced: false,
          isCountrySpecific: countryMatches,
          isGlobalFallback: !countryMatches,
          events: curated.events || [],
          births: curated.births || [],
          discoveries: curated.discoveries || [],
          dailyTrivia: curated.dailyTrivia || {
            id: `trv-${month}-${day}`,
            question: `Which historical event occurred on ${formattedDate}?`,
            options: ["Historic Event A", "Historic Event B", "Historic Event C", "All of the above"],
            correctIndex: 3,
            explanation: `${formattedDate} marks important turning points in world history.`,
            historicalContext: "History connects past discoveries to present innovations.",
            relatedYear: "Multiple"
          },
          quoteOfTheDay: curated.quoteOfTheDay || {
            quote: "History is not a burden on the memory but an illumination of the soul.",
            author: "Lord Acton",
            context: "Historical Scholar & Philosopher"
          }
        };
      }
    }

    // 3. Guaranteed Algorithmic Fallback for all 365 days
    if (!historyData) {
      historyData = generateAlgorithmicDayInHistory(month, day, country, lang);
      historyData.isCountrySpecific = false;
      historyData.isGlobalFallback = true;
    }

    // Edge cache for 12 hours
    historyCache.set(cacheKey, historyData);
    res.setHeader("Cache-Control", "public, max-age=43200");
    return res.json(historyData);
  } catch (error) {
    console.error("[History API Error]", error);
    return res.status(500).json({ error: "Failed to generate history data" });
  }
});
