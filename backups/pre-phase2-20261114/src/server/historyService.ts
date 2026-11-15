import express from "express";
import {
  getVerifiedDailyHistory,
  getHistoryEngineStatus,
  purgeHistoryCache,
} from "./dailyHistoryEngine";
import { generateAlgorithmicDayInHistory } from "../data/historyData";
import { DayInHistoryData } from "../types/history";

/**
 * Computes the active calendar date respecting the user's timezone or country
 */
function computeDateInTimezone(tz?: string, countryCode: string = "IN"): { month: number; day: number; year: number; resolvedTz: string } {
  let targetTz = tz;
  if (!targetTz) {
    if (countryCode.toUpperCase() === "IN") targetTz = "Asia/Kolkata";
    else if (countryCode.toUpperCase() === "US") targetTz = "America/New_York";
    else if (countryCode.toUpperCase() === "GB" || countryCode.toUpperCase() === "UK") targetTz = "Europe/London";
    else targetTz = "UTC";
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: targetTz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    const m = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);
    const d = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
    const y = parseInt(parts.find((p) => p.type === "year")?.value || "2026", 10);
    return { month: m, day: d, year: y, resolvedTz: targetTz };
  } catch {
    const now = new Date();
    return { month: now.getMonth() + 1, day: now.getDate(), year: now.getFullYear(), resolvedTz: "UTC" };
  }
}

/**
 * Express router for Today in History & Daily Knowledge Hub API
 * 100% UNGATED & PUBLIC ACCESS FOR ALL GUESTS, VISITORS & USERS
 */
export const historyRouter = express.Router();

// Permissive public access middleware for knowledge hub
historyRouter.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/**
 * GET /api/history/today (also aliased to /feed, /events, /knowledge)
 * Main endpoint fetching real verified historical events from public internet APIs (Wikimedia)
 * Completely ungated for all guests and authenticated users alike.
 */
historyRouter.get(["/today", "/feed", "/events", "/knowledge"], async (req, res) => {
  try {
    const country = ((req.query.country as string) || "IN").toUpperCase();
    const lang = ((req.query.lang as string) || "en").toLowerCase();
    const tzParam = req.query.tz as string | undefined;
    const forceRefresh = req.query.forceRefresh === "true";

    const { month: tzMonth, day: tzDay, year: tzYear, resolvedTz } = computeDateInTimezone(tzParam, country);

    const rawMonth = parseInt(req.query.month as string, 10);
    const rawDay = parseInt(req.query.day as string, 10);
    const rawYear = parseInt(req.query.year as string, 10);

    const month = !isNaN(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : tzMonth;
    const day = !isNaN(rawDay) && rawDay >= 1 && rawDay <= 31 ? rawDay : tzDay;
    const year = !isNaN(rawYear) && rawYear >= 1 && rawYear <= 2100 ? rawYear : tzYear;

    const data = await getVerifiedDailyHistory({
      month,
      day,
      year,
      country,
      lang,
      timezone: resolvedTz,
      forceRefresh,
    });

    // Cache-Control header for browsers & CDNs
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.json(data);
  } catch (error: any) {
    console.error("History router error:", error?.message || error);
    // Return resilient fallback rather than 500 error
    const now = new Date();
    const fallback = generateAlgorithmicDayInHistory(now.getMonth() + 1, now.getDate(), "IN", "en");
    return res.json(fallback);
  }
});

/**
 * GET /api/history/status
 * Engine status and health check for Admin dashboard
 */
historyRouter.get("/status", (req, res) => {
  const status = getHistoryEngineStatus();
  return res.json({
    status: "ok",
    ...status,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/history/refresh
 * Forces cache purge and live refetch for today's verified data (Admin/Owner only)
 */
historyRouter.post("/refresh", async (req, res) => {
  try {
    const rawMonth = parseInt(req.body?.month || req.query.month as string, 10);
    const rawDay = parseInt(req.body?.day || req.query.day as string, 10);

    purgeHistoryCache(isNaN(rawMonth) ? undefined : rawMonth, isNaN(rawDay) ? undefined : rawDay);

    const country = ((req.body?.country || req.query.country as string) || "IN").toUpperCase();
    const lang = ((req.body?.lang || req.query.lang as string) || "en").toLowerCase();

    const now = new Date();
    const m = !isNaN(rawMonth) ? rawMonth : now.getMonth() + 1;
    const d = !isNaN(rawDay) ? rawDay : now.getDate();

    const refreshed = await getVerifiedDailyHistory({
      month: m,
      day: d,
      country,
      lang,
      forceRefresh: true,
    });

    return res.json({
      success: true,
      message: `Daily knowledge cache purged and refreshed from verified internet source for ${m}/${d}.`,
      data: refreshed,
      status: getHistoryEngineStatus(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

interface ServerEngagementItem {
  eventId: string;
  headline: string;
  year: string | number;
  category: string;
  tag: string;
  dateKey: string;
  views: number;
  reads: number;
  likes: number;
  shares: number;
  downloads: number;
  engagementScore: number;
  lastUpdated: string;
}

// In-memory engagement ledger
const serverEngagementStore = new Map<string, ServerEngagementItem>();

/**
 * POST /api/history/engagement
 * Logs client-side user engagement metric (views, reads, likes, shares, downloads)
 */
historyRouter.post("/engagement", (req, res) => {
  try {
    const { eventId, type, headline, year, category, tag, dateKey } = req.body || {};
    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ success: false, error: "eventId is required" });
    }

    const current = serverEngagementStore.get(eventId) || {
      eventId,
      headline: headline || "Historic Event",
      year: year || "",
      category: category || "milestone",
      tag: tag || "History",
      dateKey: dateKey || "",
      views: 0,
      reads: 0,
      likes: 0,
      shares: 0,
      downloads: 0,
      engagementScore: 0,
      lastUpdated: new Date().toISOString(),
    };

    if (headline) current.headline = headline;
    if (year) current.year = year;
    if (category) current.category = category;
    if (tag) current.tag = tag;
    if (dateKey) current.dateKey = dateKey;

    switch (type) {
      case "view":
        current.views += 1;
        current.engagementScore += 1;
        break;
      case "read":
      case "read_detail":
        current.reads += 1;
        current.engagementScore += 3;
        break;
      case "like":
        current.likes += 1;
        current.engagementScore += 5;
        break;
      case "unlike":
        current.likes = Math.max(0, current.likes - 1);
        current.engagementScore = Math.max(0, current.engagementScore - 5);
        break;
      case "share":
        current.shares += 1;
        current.engagementScore += 8;
        break;
      case "download":
      case "download_worksheet":
        current.downloads += 1;
        current.engagementScore += 6;
        break;
      case "quiz_attempt":
        current.engagementScore += 2;
        break;
      default:
        current.views += 1;
        current.engagementScore += 1;
        break;
    }

    current.lastUpdated = new Date().toISOString();
    serverEngagementStore.set(eventId, current);

    return res.json({
      success: true,
      eventId,
      item: current,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/history/popular
 * Returns most engaged & popular historical content for boosting domain authority
 */
historyRouter.get("/popular", (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 50);
    const dateKey = req.query.dateKey as string | undefined;

    let items = Array.from(serverEngagementStore.values());
    if (dateKey) {
      items = items.filter((it) => it.dateKey === dateKey);
    }

    // Sort descending by engagement score
    items.sort((a, b) => b.engagementScore - a.engagementScore);

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({
      success: true,
      count: items.length,
      popular: items.slice(0, limit),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
