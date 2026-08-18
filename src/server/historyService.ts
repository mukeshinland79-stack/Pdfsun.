import express from "express";
import { GoogleGenAI } from "@google/genai";
import { DAILY_HISTORY_DATABASE, getHistoryText } from "../data/historyData";
import { TOP_30_LANGUAGES, COUNTRY_META_MAP } from "../utils/geoLanguageDetector";
import { DayInHistoryData } from "../types/history";

const historyCache = new Map<string, DayInHistoryData>();

/**
 * Express router for Today in History API
 */
export const historyRouter = express.Router();

historyRouter.get("/today", async (req, res) => {
  try {
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const day = parseInt(req.query.day as string, 10) || new Date().getDate();
    const lang = (req.query.lang as string || "en").toLowerCase();
    const country = (req.query.country as string || "IN").toUpperCase();

    const cacheKey = `${month}-${day}-${lang}-${country}`;
    if (historyCache.has(cacheKey)) {
      return res.json(historyCache.get(cacheKey));
    }

    const baseKey = `${month}-${day}`;
    const baseEntry = DAILY_HISTORY_DATABASE[baseKey] || DAILY_HISTORY_DATABASE["8-17"] || {};

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const formattedDate = `${monthNames[month - 1]} ${day}`;

    const countryMeta = COUNTRY_META_MAP[country] || { name: "Global", defaultLang: "en", flag: "🌐" };
    const langMeta = TOP_30_LANGUAGES.find((l) => l.code === lang) || TOP_30_LANGUAGES[0];

    const responsePayload: DayInHistoryData = {
      dateString: formattedDate,
      month,
      day,
      formattedDate,
      dayOfYear: Math.floor((new Date(2026, month - 1, day).getTime() - new Date(2026, 0, 0).getTime()) / (1000 * 60 * 60 * 24)),
      featuredHeadline: baseEntry.featuredHeadline || `Historic Milestones & Discoveries on ${formattedDate}`,
      countryCode: country,
      countryName: countryMeta.name,
      languageCode: lang,
      languageName: langMeta.name,
      events: baseEntry.events || [],
      births: baseEntry.births || [],
      discoveries: baseEntry.discoveries || [],
      dailyTrivia: baseEntry.dailyTrivia || {
        id: `trv-${month}${day}`,
        question: `Which significant historical event took place on ${formattedDate}?`,
        options: [
          "The demarcation of the Radcliffe Line in 1947",
          "Production of the first commercial audio CD in 1982",
          "Launch of the Venera 7 spacecraft to Venus in 1970",
          "All of the above"
        ],
        correctIndex: 3,
        explanation: `${formattedDate} marks major historical turning points in world history, music technology, and space exploration.`,
        historicalContext: "History is defined by human ingenuity and courage across eras.",
        relatedYear: "Multiple"
      },
      quoteOfTheDay: baseEntry.quoteOfTheDay || {
        quote: "History is not a burden on the memory but an illumination of the soul.",
        author: "Lord Acton",
        context: "Historical Scholar & Philosopher"
      }
    };

    // Edge cache for 12 hours
    historyCache.set(cacheKey, responsePayload);
    res.setHeader("Cache-Control", "public, max-age=43200");
    return res.json(responsePayload);
  } catch (error) {
    console.error("[History API Error]", error);
    return res.status(500).json({ error: "Failed to generate history data" });
  }
});
