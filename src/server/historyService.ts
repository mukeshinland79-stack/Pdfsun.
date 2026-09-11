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
 */
export const historyRouter = express.Router();

/**
 * GET /api/history/today
 * Main endpoint fetching real verified historical events from public internet APIs (Wikimedia)
 */
historyRouter.get("/today", async (req, res) => {
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
