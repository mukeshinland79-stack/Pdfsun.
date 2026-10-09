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
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Heart,
  Eye,
  TrendingUp,
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
  DAYS_IN_MONTH,
  generateAlgorithmicDayInHistory
} from "../data/historyData";
import { fetchDayInHistory } from "../services/historyService";
import { generateHistoryWorksheetPdf } from "../utils/historyPdfGenerator";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";
import { useLanguage } from "../lib/i18n";
import { useHistoryEngagement } from "../hooks/useHistoryEngagement";
import {
  getLocalizedTag,
  getLocalizedCategoryFilterName,
  getLocalizedQuickJumps,
  localizeHistoryData,
  useLocalizedHistoryData,
} from "../utils/historyTranslationEngine";
import { LanguageSelectorModal } from "./LanguageSelectorModal";

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
  const { currentLanguage, setLanguage: setGlobalLanguage, isRtl: globalIsRtl } = useLanguage();

  // 1. Reactive State Variables for Date, Country, Language, and Filtering
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    if (initialLanguage) return initialLanguage;
    if (currentLanguage) {
      const match = TOP_30_LANGUAGES.find(
        (l) => l.code === currentLanguage || l.code.split("-")[0] === currentLanguage.split("-")[0]
      );
      if (match) return match;
    }
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pdfsun_history_lang") || localStorage.getItem("pdfsun_lang");
        if (saved) {
          const match = TOP_30_LANGUAGES.find((l) => l.code === saved || l.code.split("-")[0] === saved.split("-")[0]);
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

  const [historyData, setHistoryData] = useState<DayInHistoryData | null>(() => {
    try {
      const now = new Date();
      const raw = generateAlgorithmicDayInHistory(now.getMonth() + 1, now.getDate(), "IN", "en");
      return localizeHistoryData(raw, initialLanguage?.code || "en", "IN");
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "popular" | "milestone" | "birth" | "invention" | "country-spotlight">("all");
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<HistoryEventItem | null>(null);
  const [copiedEventText, setCopiedEventText] = useState(false);

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
  const [isLangSelectorModalOpen, setIsLangSelectorModalOpen] = useState(false);

  // Sync initialLanguage changes if props update
  useEffect(() => {
    if (initialLanguage) {
      setSelectedLang(initialLanguage);
      setHistoryData((prev) => (prev ? localizeHistoryData(prev, initialLanguage.code, selectedCountry) : prev));
    }
  }, [initialLanguage, selectedCountry]);

  // Reactively synchronize with global language state from useLanguage()
  useEffect(() => {
    if (currentLanguage) {
      const match = TOP_30_LANGUAGES.find(
        (l) => l.code === currentLanguage || l.code.split("-")[0] === currentLanguage.split("-")[0]
      );
      if (match && match.code !== selectedLang.code) {
        setSelectedLang(match);
        setHistoryData((prev) => (prev ? localizeHistoryData(prev, match.code, selectedCountry) : prev));
      }
    }
  }, [currentLanguage, selectedCountry, selectedLang.code]);

  // Global event listener for zero-reload instant language updates
  useEffect(() => {
    const handleGlobalLangEvent = (e: any) => {
      const code = e.detail?.lang;
      if (code) {
        const match = TOP_30_LANGUAGES.find(
          (l) => l.code === code || l.code.split("-")[0] === code.split("-")[0]
        );
        if (match) {
          setSelectedLang(match);
          setHistoryData((prev) => (prev ? localizeHistoryData(prev, match.code, selectedCountry) : prev));
        }
      }
    };
    window.addEventListener("pdfsun_language_changed", handleGlobalLangEvent);
    return () => window.removeEventListener("pdfsun_language_changed", handleGlobalLangEvent);
  }, [selectedCountry]);

  // Sync initialCountryCode
  useEffect(() => {
    if (initialCountryCode) {
      setSelectedCountry(initialCountryCode);
    }
  }, [initialCountryCode]);

  // Derived Date properties
  const selectedYear = selectedDate.getFullYear();
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
  const loadHistoryData = useCallback(async (date: Date, langCode: string, countryCode: string, forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const data = await fetchDayInHistory(date, langCode, countryCode, forceRefresh);
      const localized = localizeHistoryData(data, langCode, countryCode);
      setHistoryData(localized);
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

  // Automatic midnight date change detector while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = new Date();
      // Check if viewing today and the day has rolled over
      const isYesterday =
        selectedDate.getDate() !== now.getDate() &&
        Math.abs(now.getTime() - selectedDate.getTime()) < 36 * 60 * 60 * 1000;

      if (isYesterday) {
        setSelectedDate(now);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isOpen, selectedDate]);

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

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    if (!isNaN(newYear)) {
      const newMaxDays = DAYS_IN_MONTH[selectedMonth - 1] || 31;
      const clampedDay = Math.min(selectedDay, newMaxDays);
      const newDate = new Date(newYear, selectedMonth - 1, clampedDay);
      setSelectedDate(newDate);
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
      setHistoryData((prev) => (prev ? localizeHistoryData(prev, found.code, selectedCountry) : prev));
      if (typeof setGlobalLanguage === "function") {
        setGlobalLanguage(found.code);
      }
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

    const isCorrect = historyData?.dailyTrivia ? index === historyData.dailyTrivia.correctIndex : false;
    trackQuizAttempt(historyData?.dailyTrivia?.id || "daily-trivia", isCorrect);

    if (historyData?.dailyTrivia && isCorrect) {
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
    if (displayData) {
      trackWorksheetDownload(displayData.events?.length || 1, displayData.events?.[0]?.id);
      generateHistoryWorksheetPdf(displayData);
    }
  };

  const handleShare = async () => {
    const shareUrl = `https://www.pdfsun.in/today-in-history?lang=${selectedLang.code}&date=${selectedMonth}-${selectedDay}&country=${selectedCountry}`;
    const shareTitle = `Today in History • ${displayData?.formattedDate || "PDFSun"}`;
    const shareText = `Explore historical events on ${displayData?.formattedDate} in world history & download the free study sheet!`;

    if (displayData?.events?.[0]) {
      trackShare(displayData.events[0]);
    }

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
  const displayData = useLocalizedHistoryData(historyData, selectedLang.code, selectedCountry) || historyData;
  const dateKey = displayData ? `${displayData.month}-${displayData.day}` : undefined;

  const {
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
  } = useHistoryEngagement(dateKey);

  // Derive reactively localized selectedDetailEvent so opening or switching languages translates detail modal in real-time
  const activeDetailEvent = useMemo(() => {
    if (!selectedDetailEvent || !displayData) return selectedDetailEvent;
    const allItems = [
      ...(displayData.events || []),
      ...(displayData.births || []),
      ...(displayData.discoveries || []),
      ...(displayData.countrySpotlight || []),
    ];
    const match = allItems.find(
      (e) => e.id === selectedDetailEvent.id || (e.year === selectedDetailEvent.year && e.headline === selectedDetailEvent.headline)
    );
    return match || selectedDetailEvent;
  }, [selectedDetailEvent, displayData]);

  // Filter events by Category & Search Query
  const allEventsList = useMemo(() => {
    if (!displayData) return [];
    let list: HistoryEventItem[] = [];

    const combinedAll = [
      ...(displayData.events || []),
      ...(displayData.births || []),
      ...(displayData.discoveries || [])
    ];

    if (activeCategory === "popular") {
      list = getPopularEvents(combinedAll);
    } else if (activeCategory === "all") {
      list = combinedAll;
    } else if (activeCategory === "milestone") {
      list = displayData.events || [];
    } else if (activeCategory === "birth") {
      list = displayData.births || [];
    } else if (activeCategory === "invention") {
      list = displayData.discoveries || [];
    } else if (activeCategory === "country-spotlight") {
      list = [
        ...(displayData.events || []).filter((e) => e.countryCode === selectedCountry),
        ...(displayData.births || []).filter((b) => b.countryCode === selectedCountry)
      ];
      if (list.length === 0) {
        list = (displayData.events || []).slice(0, 3);
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
  }, [displayData, activeCategory, getPopularEvents, searchQuery, selectedCountry]);

  // Track impressions of displayed events
  useEffect(() => {
    if (isOpen && allEventsList.length > 0) {
      allEventsList.slice(0, 8).forEach((item) => {
        trackView(item, dateKey);
      });
    }
  }, [isOpen, allEventsList, trackView, dateKey]);

  // Check if country matches exist in current dataset
  const hasDirectCountryMatches = useMemo(() => {
    if (!displayData) return false;
    const evts = [...(displayData.events || []), ...(displayData.births || [])];
    return evts.some((e) => e.countryCode === selectedCountry);
  }, [displayData, selectedCountry]);

  if (!isOpen) return null;

  return (
    <div
      id="today-in-history-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="today-in-history-heading"
    >
      <div
        id="today-in-history-modal-container"
        dir={selectedLang.direction === "rtl" || selectedLang.code === "ar" || selectedLang.code === "ur" || selectedLang.code === "fa" ? "rtl" : "ltr"}
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
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  {displayData?.version?.includes("verified-internet") ? getHistoryText("internetVerified", langCode) : getHistoryText("verifiedHub", langCode)}
                </span>
                {displayData?.isAiEnhanced && (
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                    {getHistoryText("aiVerified", langCode)}
                  </span>
                )}
              </div>
              <h2 id="today-in-history-heading" className="text-lg sm:text-2xl font-black text-white tracking-tight mt-1">
                {getHistoryText("todayInHistory", langCode)}
              </h2>
            </div>
          </div>

          {/* Quick Actions (Refresh, PDF Export & Close) with WCAG AAA contrast & 44px touch targets */}
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            <button
              id="history-refresh-btn"
              onClick={() => loadHistoryData(selectedDate, selectedLang.code, selectedCountry, true)}
              disabled={loading}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition flex items-center justify-center cursor-pointer disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              title="Refresh latest internet historical events"
              aria-label="Refresh latest events"
            >
              <RefreshCw className={`w-4 h-4 text-amber-300 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              id="history-export-pdf-btn"
              onClick={handleExportPdf}
              className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/30 flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              title="Download clean study worksheet PDF"
              aria-label="Download study sheet PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{getHistoryText("exportAsPdf", langCode)}</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              id="history-share-btn"
              onClick={handleShare}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition flex items-center justify-center cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
              title="Share Today's History"
              aria-label="Share Today's History"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && <span className="ml-1 text-[10px] text-emerald-300 font-bold">{getHistoryText("copied", langCode)}</span>}
            </button>

            <button
              id="history-close-btn"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-rose-500 text-white transition flex items-center justify-center cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-400"
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DYNAMIC REACTIVE CONTROLS RIBBON (DATE, COUNTRY, LANGUAGE) */}
        <div className="px-3 sm:px-6 py-3 bg-slate-50 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Time-Machine Date Controller */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Quick Prev / Date / Next Navigator */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                id="history-prev-day-btn"
                onClick={handlePrevDay}
                className="min-w-[40px] min-h-[40px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
                title={getHistoryText("prevDay", langCode)}
                aria-label={getHistoryText("prevDay", langCode)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2 py-1 font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 text-xs sm:text-sm">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="whitespace-nowrap">{displayData?.formattedDate || formatLocalizedHistoryDate(selectedDate, langCode)}</span>
              </div>

              <button
                id="history-next-day-btn"
                onClick={handleNextDay}
                className="min-w-[40px] min-h-[40px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
                title={getHistoryText("nextDay", langCode)}
                aria-label={getHistoryText("nextDay", langCode)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                id="history-today-btn"
                onClick={handleToday}
                className="min-h-[40px] px-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl flex items-center justify-center transition cursor-pointer"
              >
                {getHistoryText("today", langCode)}
              </button>
            </div>

            {/* Direct Month, Day & Year Dropdowns for Complete Reactivity */}
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 px-3 py-1 min-h-[44px] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{getHistoryText("selectMonth", langCode)}:</span>
              <select
                id="history-month-select"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer py-1"
                aria-label="Select Month"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {name}
                  </option>
                ))}
              </select>

              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase ml-1">{getHistoryText("selectDay", langCode)}:</span>
              <select
                id="history-day-select"
                value={selectedDay}
                onChange={handleDayChange}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer py-1"
                aria-label="Select Day"
              >
                {Array.from({ length: maxDaysInSelectedMonth }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {d}
                  </option>
                ))}
              </select>

              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase ml-1">{getHistoryText("selectYear", langCode)}:</span>
              <select
                id="history-year-select"
                value={selectedYear}
                onChange={handleYearChange}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer py-1"
                aria-label="Select Year"
              >
                {[
                  2026, 2025, 2024, 2023, 2022, 2020, 2015, 2010, 2005, 2000,
                  1995, 1991, 1989, 1980, 1975, 1969, 1965, 1960, 1950, 1947,
                  1945, 1939, 1930, 1920, 1914, 1900, 1865, 1800, 1776, 1492
                ].includes(selectedYear) ? null : (
                  <option value={selectedYear} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {selectedYear}
                  </option>
                )}
                {[
                  2026, 2025, 2024, 2023, 2022, 2020, 2015, 2010, 2005, 2000,
                  1995, 1991, 1989, 1980, 1975, 1969, 1965, 1960, 1950, 1947,
                  1945, 1939, 1930, 1920, 1914, 1900, 1865, 1800, 1776, 1492
                ].map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Native Date Picker Input */}
            <div className="hidden md:flex items-center space-x-1.5 bg-white dark:bg-slate-800 px-3 py-1 min-h-[44px] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
              <input
                id="history-native-date-picker"
                type="date"
                value={dateInputFormatted}
                onChange={handleDateInputChange}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer py-1"
                aria-label="Select Custom Date"
              />
            </div>
          </div>

          {/* Country & Language Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Country Selector */}
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 px-3 py-1 min-h-[44px] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <select
                id="history-country-select"
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer max-w-[140px] sm:max-w-none truncate py-1"
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
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-3 py-1 min-h-[44px] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
              <select
                id="history-language-select"
                value={selectedLang.code}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden cursor-pointer max-w-[140px] sm:max-w-none truncate py-1"
                aria-label="Select Language"
              >
                {TOP_30_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsLangSelectorModalOpen(true)}
                className="min-w-[36px] min-h-[36px] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-500 hover:text-indigo-400 flex items-center justify-center transition cursor-pointer"
                title="Search all 30+ languages"
                aria-label="Search all languages"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* HISTORIC PRESET SHORTCUTS PILLS (Dynamic Horizontal Scroll with Smooth Touch Gestures) */}
        <div className="px-3 sm:px-6 py-2 bg-slate-100/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto touch-pan-x text-[11px] scrollbar-none">
          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] shrink-0 tracking-wide">{getHistoryText("quickJumps", langCode)}:</span>
          {getLocalizedQuickJumps(langCode).map((jump, jIdx) => (
            <button
              key={jIdx}
              onClick={() => handlePresetDate(jump.month, jump.day)}
              className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-all"
            >
              {jump.label}
            </button>
          ))}
        </div>

        {/* MAIN SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative">
          {/* Top Subtle Loading Progress Bar */}
          {loading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 animate-pulse z-20" />
          )}

          {/* INITIAL COLD-LOAD SKELETON (Only on first load when no data exists) */}
          {loading && !historyData && (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              </div>
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            </div>
          )}

          {displayData && (
            <div className={`space-y-6 transition-opacity duration-150 ${loading ? "opacity-80" : "opacity-100"}`}>
              {/* FEATURED HEADLINE BANNER & COUNTRY STATUS BADGE (WCAG AAA HIGH-CONTRAST CONTAINER) */}
              <div
                className="relative rounded-3xl p-5 sm:p-7 bg-[#1E293B] sm:bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-slate-700/80 text-white shadow-xl space-y-3 overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Dynamic Country Match / Fallback Indicator Badge */}
                  {hasDirectCountryMatches ? (
                    <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/50 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {getHistoryText("countryMatchBadge", langCode)}: {COUNTRY_META_MAP[selectedCountry]?.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/50 shadow-2xs">
                      <Info className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      {getHistoryText("globalFallbackBadge", langCode)}
                    </span>
                  )}

                  <span className="text-xs font-mono text-slate-200 font-semibold bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                    {getHistoryText("dayOfYearText", langCode, { day: displayData.dayOfYear })}
                  </span>
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight">
                  {displayData.featuredHeadline}
                </h3>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
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
                    id="cat-popular"
                    onClick={() => setActiveCategory("popular")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center space-x-1 ${
                      activeCategory === "popular"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400/40"
                        : "bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-slate-200 border border-amber-500/30"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{getHistoryText("popular", langCode) || "Most Popular"}</span>
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
                    {getLocalizedCategoryFilterName("milestone", langCode)}
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
                    {getLocalizedCategoryFilterName("birth", langCode)}
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
                    {getLocalizedCategoryFilterName("invention", langCode)}
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
                    {COUNTRY_META_MAP[selectedCountry]?.flag || "🌐"} {getLocalizedCategoryFilterName("country-spotlight", langCode, COUNTRY_META_MAP[selectedCountry]?.name)}
                  </button>
                </div>

                {/* Instant Search Box */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={getHistoryText("searchPlaceholder", langCode)}
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
                  {allEventsList.map((item, idx) => {
                    const metrics = getEventMetrics(item.id, item);
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedDetailEvent(item);
                          trackReadDetail(item, dateKey);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedDetailEvent(item);
                            trackReadDetail(item, dateKey);
                          }
                        }}
                        className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-[#181825] border border-slate-200 dark:border-[#2e2e42] hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg dark:hover:bg-[#1e1e32] transition-all duration-200 space-y-2.5 flex flex-col justify-between group cursor-pointer active:scale-[0.99]"
                        title={getHistoryText("details", langCode)}
                      >
                        <div>
                          {/* Year & Tag Header + Engagement / Likes */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-mono font-black text-xs shadow-2xs">
                                {item.year}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-700/90 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 shadow-2xs">
                                {getLocalizedTag(item.tag, item.category, langCode)}
                              </span>
                            </div>

                            {/* Engagement Badges & Interactive Like */}
                            <div className="flex items-center space-x-1.5">
                              {activeCategory === "popular" && (
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                                  {idx === 0 ? "🏆 #1 Most Read" : idx === 1 ? "🔥 #2 Popular" : idx === 2 ? "⭐ #3 Top Pick" : `#${idx + 1}`}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLike(item, dateKey);
                                }}
                                title="Upvote / Like this story"
                                aria-label="Like story"
                                className={`px-2 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                                  metrics.isLiked
                                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                                    : "bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-500 border border-transparent"
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${metrics.isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                                <span className="text-[10px] font-bold font-mono">{metrics.likes}</span>
                              </button>
                            </div>
                          </div>

                          {/* Event Title */}
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors flex items-start justify-between gap-2">
                            <span>{item.headline}</span>
                          </h4>

                          {/* Description */}
                          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-[#D1D5DB] leading-relaxed mt-1.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Significance Note */}
                        {item.significance && (
                          <p className="text-[11px] italic text-blue-700 dark:text-[#93C5FD]">
                            {item.significance}
                          </p>
                        )}

                        {/* Interactive Source Reference, Reads count & Click-to-Expand Indicator */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-[#2e2e42] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#9CA3AF] gap-2 select-none">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-blue-500 dark:text-blue-400 font-bold shrink-0">◉</span>
                            <span className="font-semibold text-slate-700 dark:text-[#D1D5DB] truncate">
                              {getHistoryText("source", langCode)}: {item.sourceName || "Wikimedia Foundation"}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">•</span>
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 font-mono text-[10px] shrink-0" title="Total Reader Engagement">
                              <Eye className="w-3 h-3 text-slate-400" />
                              {metrics.reads.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              {item.verificationStatus || getHistoryText("verified", langCode)}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-90 group-hover:underline">
                              {getHistoryText("details", langCode)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-[#181825] rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {getHistoryText("noEventsMatch", langCode)}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {getHistoryText("trySwitching", langCode)}
                  </p>
                </div>
              )}

              {/* DAILY TRIVIA QUIZ CHALLENGE (WCAG AAA ACCESSIBILITY & CONTRAST FIX) */}
              {displayData.dailyTrivia && (
                <div
                  className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#181825] border-2 border-amber-400/80 dark:border-amber-500/40 shadow-xl space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0">
                        <HelpCircle className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#0F172A] dark:text-amber-300">
                          {getHistoryText("dailyQuizTitle", langCode)}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white">
                          {getHistoryText("testKnowledge", langCode)}
                        </h4>
                      </div>
                    </div>

                    {/* Streak Badge */}
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-bold shadow-2xs">
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                      <span>{quizStreak} {getHistoryText("streak", langCode)}</span>
                    </div>
                  </div>

                  {/* Question */}
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {displayData.dailyTrivia.question}
                  </p>

                  {/* Options Grid with distinct hover, focus, active, selected states and crisp 4.5:1 contrast */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayData.dailyTrivia.options.map((option, idx) => {
                      let btnStyle = "bg-slate-50 dark:bg-[#1E1E2E] border-2 border-slate-300 dark:border-[#374151] text-slate-900 dark:text-[#F3F4F6] hover:border-amber-500 hover:bg-amber-50/60 dark:hover:bg-[#25263A] focus:ring-2 focus:ring-amber-500 focus:outline-hidden";
                      let letterCircle = "bg-slate-200 dark:bg-white/15 text-slate-900 dark:text-white";

                      if (quizSubmitted) {
                        if (idx === displayData.dailyTrivia.correctIndex) {
                          btnStyle = "bg-emerald-600 text-white border-2 border-emerald-500 font-bold shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400";
                          letterCircle = "bg-white/20 text-white";
                        } else if (idx === selectedOption) {
                          btnStyle = "bg-rose-600 text-white border-2 border-rose-500 font-bold ring-2 ring-rose-400";
                          letterCircle = "bg-white/20 text-white";
                        } else {
                          btnStyle = "bg-slate-100 dark:bg-[#181825] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-[#2e2e42] opacity-50 cursor-not-allowed";
                          letterCircle = "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500";
                        }
                      } else if (selectedOption === idx) {
                        btnStyle = "bg-amber-500 text-slate-950 border-2 border-amber-600 font-bold ring-2 ring-amber-400 shadow-md";
                        letterCircle = "bg-slate-950 text-amber-400";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizSubmitted}
                          onClick={() => handleQuizAnswer(idx)}
                          className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition flex items-start space-x-2.5 cursor-pointer shadow-xs active:scale-[0.99] ${btnStyle}`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${letterCircle}`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-snug font-medium pt-0.5">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {quizSubmitted && (
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#1E1E2E] border border-amber-400/60 dark:border-amber-500/40 space-y-2 animate-fadeIn text-slate-800 dark:text-[#D1D5DB]">
                      <div className="flex items-center space-x-2">
                        {selectedOption === displayData.dailyTrivia.correctIndex ? (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {getHistoryText("correct", langCode)}
                          </span>
                        ) : (
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {getHistoryText("incorrect", langCode)} {displayData.dailyTrivia.options[displayData.dailyTrivia.correctIndex]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed font-medium">
                        {displayData.dailyTrivia.explanation}
                      </p>
                    </div>
                  )}

                  {/* Display-Only Trivia Source Reference */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-[#374151] flex items-center justify-between text-[11px] text-slate-600 dark:text-[#9CA3AF] select-text cursor-default">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="text-amber-500 dark:text-amber-400 font-bold shrink-0">◉</span>
                      <span className="font-semibold text-slate-800 dark:text-[#D1D5DB] truncate">
                        {getHistoryText("source", langCode)}: {displayData.dailyTrivia.sourceName || "Wikimedia Foundation"}
                      </span>
                      <span className="text-slate-500 dark:text-[#9CA3AF] font-mono text-[10px] shrink-0">
                        • {displayData.dailyTrivia.sourceDomain || "wikimedia.org"}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 shrink-0">
                      {displayData.dailyTrivia.verificationStatus || getHistoryText("verified", langCode)}
                    </span>
                  </div>
                </div>
              )}

              {/* QUOTE OF THE DAY & AI DEEP DIVE CTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quote Box */}
                {displayData.quoteOfTheDay && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-[#181825] border border-slate-200 dark:border-[#2e2e42] space-y-2 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {getHistoryText("quoteTitle", langCode)}
                      </span>
                      <blockquote className="text-xs sm:text-sm font-serif italic text-slate-800 dark:text-[#F3F4F6] leading-relaxed mt-1">
                        &ldquo;{displayData.quoteOfTheDay.quote}&rdquo;
                      </blockquote>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        — {displayData.quoteOfTheDay.author}{" "}
                        <span className="text-[11px] font-normal text-slate-500 dark:text-[#9CA3AF]">
                          ({displayData.quoteOfTheDay.context})
                        </span>
                      </p>
                    </div>

                    {/* Display-Only Quote Source Reference */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-[#2e2e42] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#9CA3AF] select-text cursor-default mt-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="text-blue-500 dark:text-blue-400 font-bold shrink-0">◉</span>
                        <span className="font-semibold text-slate-700 dark:text-[#D1D5DB] truncate">
                          {getHistoryText("source", langCode)}: {displayData.quoteOfTheDay.sourceName || "Historical Archives"}
                        </span>
                        <span className="text-slate-400 dark:text-[#9CA3AF] font-mono text-[10px] shrink-0">
                          • {displayData.quoteOfTheDay.sourceDomain || "wikimedia.org"}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                        {displayData.quoteOfTheDay.verificationStatus || getHistoryText("verified", langCode)}
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Assistant Integration Card */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 border border-blue-400/30 text-white space-y-2 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center space-x-2 text-cyan-200 text-xs font-black uppercase tracking-wider">
                      <Bot className="w-4 h-4" />
                      <span>{getHistoryText("learnWithAi", langCode)}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-white mt-1">
                      {getHistoryText("aiBannerTitle", langCode)}
                    </h4>
                    <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                      {getHistoryText("aiBannerDesc", langCode)}
                    </p>
                  </div>

                  <button
                    onClick={handleLaunchAiAssistant}
                    className="mt-2 self-start px-4 py-2 rounded-xl bg-white text-blue-950 hover:bg-slate-100 text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
                  >
                    {getHistoryText("openAiWorkspace", langCode)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INTERACTIVE EVENT DETAIL DIALOG (Accessible to all guests & users) */}
      {activeDetailEvent && (
        <div
          id="history-event-detail-backdrop"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedDetailEvent(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            id="history-event-detail-modal"
            dir={selectedLang.direction === "rtl" || selectedLang.code === "ar" || selectedLang.code === "ur" || selectedLang.code === "fa" ? "rtl" : "ltr"}
            className="relative w-full max-w-xl bg-white dark:bg-[#181825] rounded-3xl border border-slate-200 dark:border-[#2e2e42] shadow-2xl overflow-hidden p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-mono font-black text-sm shadow-xs">
                  {activeDetailEvent.year}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-[#25263a] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#374151]">
                  {getLocalizedTag(activeDetailEvent.tag, activeDetailEvent.category, langCode)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailEvent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#25263a] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {activeDetailEvent.headline}
            </h3>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#1E1E2E] border border-slate-200/80 dark:border-[#2e2e42] text-xs sm:text-sm text-slate-700 dark:text-[#D1D5DB] leading-relaxed space-y-2">
              <p>{activeDetailEvent.description}</p>
              {activeDetailEvent.significance && (
                <p className="text-xs italic text-blue-600 dark:text-[#93C5FD] pt-2 border-t border-slate-200/60 dark:border-[#374151]">
                  <strong>{getHistoryText("historicalImpact", langCode)}</strong> {activeDetailEvent.significance}
                </p>
              )}
            </div>

            {/* Source & Actions */}
            {(() => {
              const modalMetrics = getEventMetrics(activeDetailEvent.id, activeDetailEvent);
              return (
                <div className="pt-3 border-t border-slate-200 dark:border-[#2e2e42] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-slate-500 dark:text-[#9CA3AF]">
                    <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">
                      {getHistoryText("verifiedVia", langCode)} <strong className="text-slate-700 dark:text-white">{activeDetailEvent.sourceName || "Wikimedia Foundation"}</strong>
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono text-[11px]">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {modalMetrics.reads.toLocaleString()} reads
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleLike(activeDetailEvent, dateKey)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        modalMetrics.isLiked
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40"
                          : "bg-slate-100 dark:bg-[#25263a] hover:bg-slate-200 dark:hover:bg-[#2f3148] text-slate-700 dark:text-slate-200 border-slate-300 dark:border-[#374151]"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${modalMetrics.isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                      <span>{modalMetrics.likes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const text = `${activeDetailEvent.year}: ${activeDetailEvent.headline} - ${activeDetailEvent.description}`;
                        navigator.clipboard.writeText(text);
                        trackCopy(activeDetailEvent);
                        setCopiedEventText(true);
                        setTimeout(() => setCopiedEventText(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#25263a] hover:bg-slate-200 dark:hover:bg-[#2f3148] text-slate-700 dark:text-slate-200 font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-300 dark:border-[#374151]"
                    >
                      {copiedEventText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEventText ? getHistoryText("copied", langCode) : getHistoryText("copyStory", langCode)}</span>
                    </button>

                    {activeDetailEvent.wikipediaUrl && (
                      <a
                        href={activeDetailEvent.wikipediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Wikipedia</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* 30+ SEARCHABLE LANGUAGE SELECTOR MODAL */}
      <LanguageSelectorModal
        isOpen={isLangSelectorModalOpen}
        onClose={() => setIsLangSelectorModalOpen(false)}
        onLanguageSelect={(lang) => handleLanguageChange(lang.code)}
      />
    </div>
  );
};
