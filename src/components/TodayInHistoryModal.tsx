import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Globe,
  MapPin,
  Download,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Flame,
  FileText,
  ExternalLink,
  Bot,
  Layers,
  X,
  Printer,
  Compass,
  Search,
  SlidersHorizontal,
  Info,
  CalendarDays,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { DayInHistoryData, SupportedLanguage, HistoryEventItem } from "../types/history";
import {
  TOP_30_LANGUAGES,
  COUNTRY_META_MAP,
  formatLocalizedHistoryDate
} from "../utils/geoLanguageDetector";
import {
  getHistoryText,
  MONTH_NAMES,
  DAYS_IN_MONTH
} from "../data/historyData";
import { fetchDayInHistory } from "../services/historyService";
import { generateHistoryWorksheetPdf } from "../utils/historyPdfGenerator";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

interface TodayInHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: SupportedLanguage;
  initialCountryCode?: string;
  onSelectTool?: (tool: ToolItem) => void;
}

export const TodayInHistoryModal: React.FC<TodayInHistoryModalProps> = ({
  isOpen,
  onClose,
  initialLanguage,
  initialCountryCode = "IN",
  onSelectTool,
}) => {
  // 1. Reactive State Variables for Date, Country, Language, and Filtering
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    if (initialLanguage) return initialLanguage;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pdfsun_history_lang");
        if (saved) {
          const match = TOP_30_LANGUAGES.find((l) => l.code === saved);
          if (match) return match;
        }
      } catch {}
    }
    return TOP_30_LANGUAGES.find((l) => l.code === "en") || TOP_30_LANGUAGES[0];
  });
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCountry = localStorage.getItem("pdfsun_history_country");
        if (savedCountry) return savedCountry;
      } catch {}
    }
    return initialCountryCode;
  });

  const [historyData, setHistoryData] = useState<DayInHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "milestone" | "birth" | "invention" | "country-spotlight">("all");

  // Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizStreak, setQuizStreak] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("pdfsun_history_streak") || "1", 10);
    } catch {
      return 1;
    }
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync initialLanguage changes if props update
  useEffect(() => {
    if (initialLanguage) {
      setSelectedLang(initialLanguage);
    }
  }, [initialLanguage]);

  // Sync initialCountryCode
  useEffect(() => {
    if (initialCountryCode) {
      setSelectedCountry(initialCountryCode);
    }
  }, [initialCountryCode]);

  // Derived Date properties
  const selectedMonth = selectedDate.getMonth() + 1; // 1-12
  const selectedDay = selectedDate.getDate(); // 1-31
  const maxDaysInSelectedMonth = DAYS_IN_MONTH[selectedMonth - 1] || 31;

  // Format date input value (YYYY-MM-DD)
  const dateInputFormatted = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // 2. Fetch data whenever Date, Country, or Language changes
  const loadHistoryData = useCallback(async (date: Date, langCode: string, countryCode: string) => {
    setLoading(true);
    try {
      const data = await fetchDayInHistory(date, langCode, countryCode);
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to load history data:", err);
    } finally {
      setLoading(false);
      setSelectedOption(null);
      setQuizSubmitted(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistoryData(selectedDate, selectedLang.code, selectedCountry);
    }
  }, [isOpen, selectedDate, selectedLang, selectedCountry, loadHistoryData]);

  // 3. Event Listeners for Date, Country, and Language
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [yearStr, monthStr, dayStr] = val.split("-");
      const newDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
      if (!isNaN(newDate.getTime())) {
        setSelectedDate(newDate);
      }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    const newMaxDays = DAYS_IN_MONTH[newMonth - 1] || 31;
    const clampedDay = Math.min(selectedDay, newMaxDays);
    const newDate = new Date(selectedDate.getFullYear(), newMonth - 1, clampedDay);
    setSelectedDate(newDate);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(e.target.value, 10);
    const newDate = new Date(selectedDate.getFullYear(), selectedMonth - 1, newDay);
    setSelectedDate(newDate);
  };

  const handleLanguageChange = (code: string) => {
    const found = TOP_30_LANGUAGES.find((l) => l.code === code);
    if (found) {
      setSelectedLang(found);
      try {
        localStorage.setItem("pdfsun_history_lang", code);
      } catch {}
    }
  };

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    try {
      localStorage.setItem("pdfsun_history_country", code);
    } catch {}
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handlePresetDate = (month: number, day: number) => {
    setSelectedDate(new Date(2026, month - 1, day));
  };

  const handleQuizAnswer = (index: number) => {
    if (quizSubmitted) return;
    setSelectedOption(index);
    setQuizSubmitted(true);

    if (historyData?.dailyTrivia && index === historyData.dailyTrivia.correctIndex) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
      const newStreak = quizStreak + 1;
      setQuizStreak(newStreak);
      try {
        localStorage.setItem("pdfsun_history_streak", String(newStreak));
      } catch {}
    }
  };

  const handleExportPdf = () => {
    if (historyData) {
      generateHistoryWorksheetPdf(historyData);
    }
  };

  const handleShare = async () => {
    const shareUrl = `https://pdfsun.in/today-in-history?lang=${selectedLang.code}&date=${selectedMonth}-${selectedDay}&country=${selectedCountry}`;
    const shareTitle = `Today in History • ${historyData?.formattedDate || "PDFSun"}`;
    const shareText = `Explore historical events on ${historyData?.formattedDate} in world history & download the free study sheet!`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {}
  };

  const handleLaunchAiAssistant = () => {
    const aiTool = ALL_TOOLS.find((t) => t.slug === "ai-summary" || t.id === "ai-summary" || t.slug === "ai-chat");
    if (aiTool && onSelectTool) {
      onClose();
      onSelectTool(aiTool);
    }
  };

  const langCode = selectedLang.code;

  // Filter events by Category & Search Query
  const allEventsList = useMemo(() => {
    if (!historyData) return [];
    let list: HistoryEventItem[] = [];

    if (activeCategory === "all") {
      list = [
        ...(historyData.events || []),
        ...(historyData.births || []),
        ...(historyData.discoveries || [])
      ];
    } else if (activeCategory === "milestone") {
      list = historyData.events || [];
    } else if (activeCategory === "birth") {
      list = historyData.births || [];
    } else if (activeCategory === "invention") {
      list = historyData.discoveries || [];
    } else if (activeCategory === "country-spotlight") {
      list = [
        ...(historyData.events || []).filter((e) => e.countryCode === selectedCountry),
        ...(historyData.births || []).filter((b) => b.countryCode === selectedCountry)
      ];
      if (list.length === 0) {
        list = (historyData.events || []).slice(0, 3);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.headline.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.tag && item.tag.toLowerCase().includes(q)) ||
          String(item.year).includes(q)
      );
    }

    return list;
  }, [historyData, activeCategory, searchQuery, selectedCountry]);

  // Check if country matches exist in current dataset
  const hasDirectCountryMatches = useMemo(() => {
    if (!historyData) return false;
    const evts = [...(historyData.events || []), ...(historyData.births || [])];
    return evts.some((e) => e.countryCode === selectedCountry);
  }, [historyData, selectedCountry]);

  if (!isOpen) return null;

  return (
    <div
      id="today-in-history-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="today-in-history-heading"
    >
      <div
        id="today-in-history-modal-container"
        className="relative w-full max-w-5xl my-4 sm:my-6 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* TOP HEADER BANNER */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-500/20">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Calendar className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {selectedLang.nativeName} ({selectedLang.name})
                </span>
                <span className="text-xs text-blue-200 flex items-center gap-1 font-medium bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-400/20">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {COUNTRY_META_MAP[selectedCountry]?.name || "Global"}
                </span>
                {historyData?.isAiEnhanced && (
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                    AI Verified
                  </span>
                )}
              </div>
              <h2 id="today-in-history-heading" className="text-lg sm:text-2xl font-black text-white tracking-tight mt-1">
                {getHistoryText("todayInHistory", langCode)}
              </h2>
            </div>
          </div>

          {/* Quick Actions (PDF Export & Close) */}
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            <button
              id="history-export-pdf-btn"
              onClick={handleExportPdf}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/30 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
              title="Download clean study worksheet PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{getHistoryText("exportAsPdf", langCode)}</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              id="history-share-btn"
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center space-x-1 cursor-pointer"
              title="Share Today's History"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && <span className="text-[10px] text-emerald-300 font-bold">{getHistoryText("copied", langCode)}</span>}
            </button>

            <button
              id="history-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DYNAMIC REACTIVE CONTROLS RIBBON (DATE, COUNTRY, LANGUAGE) */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Time-Machine Date Controller */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Prev / Date / Next Navigator */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                id="history-prev-day-btn"
                onClick={handlePrevDay}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title={getHistoryText("prevDay", langCode)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2 py-0.5 font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span className="whitespace-nowrap">{historyData?.formattedDate || formatLocalizedHistoryDate(selectedDate, langCode)}</span>
              </div>

              <button
                id="history-next-day-btn"
                onClick={handleNextDay}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title={getHistoryText("nextDay", langCode)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                id="history-today-btn"
                onClick={handleToday}
                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition cursor-pointer"
              >
                {getHistoryText("today", langCode)}
              </button>
            </div>

            {/* Direct Month & Day Dropdowns for Complete Reactivity */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">{getHistoryText("selectMonth", langCode)}:</span>
              <select
                id="history-month-select"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                aria-label="Select Month"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {name}
                  </option>
                ))}
              </select>

              <span className="text-[10px] text-slate-400 font-semibold uppercase ml-1">{getHistoryText("selectDay", langCode)}:</span>
              <select
                id="history-day-select"
                value={selectedDay}
                onChange={handleDayChange}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                aria-label="Select Day"
              >
                {Array.from({ length: maxDaysInSelectedMonth }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Native Date Picker Input */}
            <div className="hidden md:flex items-center space-x-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
              <input
                id="history-native-date-picker"
                type="date"
                value={dateInputFormatted}
                onChange={handleDateInputChange}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                aria-label="Select Custom Date"
              />
            </div>
          </div>

          {/* Country & Language Dropdown Selectors */}
          <div className="flex items-center space-x-2">
            {/* Country Selector */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <select
                id="history-country-select"
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer max-w-[130px] sm:max-w-none truncate"
                aria-label="Select Country Perspective"
              >
                {Object.entries(COUNTRY_META_MAP).map(([code, meta]) => (
                  <option key={code} value={code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {meta.flag} {meta.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector (30 Languages) */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <select
                id="history-language-select"
                value={selectedLang.code}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer max-w-[130px] sm:max-w-none truncate"
                aria-label="Select Language"
              >
                {TOP_30_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* HISTORIC PRESET SHORTCUTS PILLS */}
        <div className="px-4 sm:px-6 py-2 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0">Quick Jumps:</span>
          <button
            onClick={() => handlePresetDate(8, 15)}
            className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 transition shrink-0 cursor-pointer"
          >
            🇮🇳 Aug 15 (India Independence)
          </button>
          <button
            onClick={() => handlePresetDate(8, 17)}
            className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 transition shrink-0 cursor-pointer"
          >
            💿 Aug 17 (Radcliffe Line & First CD)
          </button>
          <button
            onClick={() => handlePresetDate(8, 19)}
            className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 transition shrink-0 cursor-pointer"
          >
            📷 Aug 19 (World Photography Day)
          </button>
          <button
            onClick={() => handlePresetDate(1, 1)}
            className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 transition shrink-0 cursor-pointer"
          >
            🎉 Jan 1 (New Year & Bose)
          </button>
          <button
            onClick={() => handlePresetDate(10, 2)}
            className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 transition shrink-0 cursor-pointer"
          >
            🕊️ Oct 2 (Gandhi Jayanti)
          </button>
        </div>

        {/* MAIN SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* LOADING SKELETON */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              </div>
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            </div>
          )}

          {!loading && historyData && (
            <>
              {/* FEATURED HEADLINE BANNER & COUNTRY STATUS BADGE */}
              <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 shadow-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Dynamic Country Match / Fallback Indicator Badge */}
                  {hasDirectCountryMatches ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {getHistoryText("countryMatchBadge", langCode)}: {COUNTRY_META_MAP[selectedCountry]?.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                      <Info className="w-3.5 h-3.5 mr-1" />
                      {getHistoryText("globalFallbackBadge", langCode)}
                    </span>
                  )}

                  <span className="text-xs font-mono text-slate-400">
                    Day #{historyData.dayOfYear} of Year
                  </span>
                </div>

                <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {historyData.featuredHeadline}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {getHistoryText("subtitle", langCode)}
                </p>
              </div>

              {/* SEARCH & CATEGORY FILTER BAR */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Category Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    id="cat-all"
                    onClick={() => setActiveCategory("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      activeCategory === "all"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {getHistoryText("allCategories", langCode)} ({allEventsList.length})
                  </button>
                  <button
                    id="cat-milestone"
                    onClick={() => setActiveCategory("milestone")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      activeCategory === "milestone"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {getHistoryText("milestones", langCode)}
                  </button>
                  <button
                    id="cat-birth"
                    onClick={() => setActiveCategory("birth")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      activeCategory === "birth"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {getHistoryText("birthdays", langCode)}
                  </button>
                  <button
                    id="cat-invention"
                    onClick={() => setActiveCategory("invention")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      activeCategory === "invention"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {getHistoryText("discoveries", langCode)}
                  </button>
                  <button
                    id="cat-country-spotlight"
                    onClick={() => setActiveCategory("country-spotlight")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      activeCategory === "country-spotlight"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {COUNTRY_META_MAP[selectedCountry]?.flag || "🌐"} {COUNTRY_META_MAP[selectedCountry]?.name || "Country"}
                  </button>
                </div>

                {/* Instant Search Box */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search events, years, people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* EVENTS LIST GRID */}
              {allEventsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allEventsList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400/60 transition shadow-2xs space-y-2 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Year & Tag Header */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-mono font-black text-xs shadow-2xs">
                            {item.year}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                            {item.tag || item.category}
                          </span>
                        </div>

                        {/* Event Title */}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.headline}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                          {item.description}
                        </p>
                      </div>

                      {/* Footer & Meta */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="italic truncate max-w-[200px]">
                          {item.significance || "Major Historical Milestone"}
                        </span>

                        {item.wikipediaUrl && (
                          <a
                            href={item.wikipediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                          >
                            <span>Read Wiki</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    No events matched your current search/category filter.
                  </h4>
                  <p className="text-xs text-slate-500">
                    Try switching categories or exploring other dates.
                  </p>
                </div>
              )}

              {/* DAILY TRIVIA QUIZ CHALLENGE */}
              {historyData.dailyTrivia && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {getHistoryText("dailyQuizTitle", langCode)}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Test Your Historical Knowledge
                        </h4>
                      </div>
                    </div>

                    {/* Streak Badge */}
                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 text-xs font-bold">
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                      <span>{quizStreak} {getHistoryText("streak", langCode)}</span>
                    </div>
                  </div>

                  {/* Question */}
                  <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                    {historyData.dailyTrivia.question}
                  </p>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {historyData.dailyTrivia.options.map((option, idx) => {
                      let btnStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400";
                      if (quizSubmitted) {
                        if (idx === historyData.dailyTrivia.correctIndex) {
                          btnStyle = "bg-emerald-600 text-white border-emerald-600 font-bold shadow-md shadow-emerald-500/30";
                        } else if (idx === selectedOption) {
                          btnStyle = "bg-rose-600 text-white border-rose-600 font-bold";
                        } else {
                          btnStyle = "bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent opacity-60";
                        }
                      } else if (selectedOption === idx) {
                        btnStyle = "bg-amber-500 text-slate-950 border-amber-500 font-bold";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizSubmitted}
                          onClick={() => handleQuizAnswer(idx)}
                          className={`p-3 rounded-2xl border text-xs sm:text-sm text-left transition flex items-start space-x-2 cursor-pointer ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-snug">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {quizSubmitted && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-amber-500/30 space-y-2 animate-fadeIn">
                      <div className="flex items-center space-x-2">
                        {selectedOption === historyData.dailyTrivia.correctIndex ? (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {getHistoryText("correct", langCode)}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {getHistoryText("incorrect", langCode)} {historyData.dailyTrivia.options[historyData.dailyTrivia.correctIndex]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {historyData.dailyTrivia.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* QUOTE OF THE DAY & AI DEEP DIVE CTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quote Box */}
                {historyData.quoteOfTheDay && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {getHistoryText("quoteTitle", langCode)}
                    </span>
                    <blockquote className="text-xs sm:text-sm font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed">
                      &ldquo;{historyData.quoteOfTheDay.quote}&rdquo;
                    </blockquote>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      — {historyData.quoteOfTheDay.author}{" "}
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        ({historyData.quoteOfTheDay.context})
                      </span>
                    </p>
                  </div>
                )}

                {/* AI Assistant Integration Card */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white space-y-2 flex flex-col justify-between shadow-lg shadow-blue-500/20">
                  <div>
                    <div className="flex items-center space-x-2 text-cyan-200 text-xs font-black uppercase tracking-wider">
                      <Bot className="w-4 h-4" />
                      <span>{getHistoryText("learnWithAi", langCode)}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-white mt-1">
                      Summarize & Convert History to PDF Study Worksheets
                    </h4>
                    <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                      Use PDFSun&apos;s intelligent AI tools to summarize historical research papers, extract text, or compile revision flashcards.
                    </p>
                  </div>

                  <button
                    onClick={handleLaunchAiAssistant}
                    className="mt-2 self-start px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
                  >
                    Open AI Workspace
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
