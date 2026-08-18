import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import confetti from "canvas-confetti";
import { DayInHistoryData, SupportedLanguage, HistoryEventItem } from "../types/history";
import { TOP_30_LANGUAGES, COUNTRY_META_MAP, formatLocalizedHistoryDate } from "../utils/geoLanguageDetector";
import { getHistoryText } from "../data/historyData";
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
  initialCountryCode = "US",
  onSelectTool,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
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
  const [activeCategory, setActiveCategory] = useState<"all" | "milestone" | "birth" | "invention">("all");

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

  useEffect(() => {
    if (initialLanguage) {
      setSelectedLang(initialLanguage);
    }
  }, [initialLanguage]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchDayInHistory(currentDate, selectedLang.code, selectedCountry).then((data) => {
      if (isMounted) {
        setHistoryData(data);
        setLoading(false);
        setSelectedOption(null);
        setQuizSubmitted(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentDate, selectedLang, selectedCountry]);

  if (!isOpen) return null;

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
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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
    const shareUrl = `https://pdfsun.in/today-in-history?lang=${selectedLang.code}&date=${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    const shareTitle = `Today in History • ${historyData?.formattedDate || "PDFSun"}`;
    const shareText = `Discover what happened on ${historyData?.formattedDate} in world history & download the free study sheet!`;

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

  const filteredEvents = historyData
    ? activeCategory === "all"
      ? [...(historyData.events || []), ...(historyData.discoveries || [])]
      : activeCategory === "birth"
      ? historyData.births || []
      : activeCategory === "invention"
      ? historyData.discoveries || []
      : historyData.events || []
    : [];

  const langCode = selectedLang.code;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="today-in-history-heading"
    >
      <div className="relative w-full max-w-5xl my-6 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Banner */}
        <div className="relative p-5 sm:p-7 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-500/20">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Calendar className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {selectedLang.nativeName} ({selectedLang.name})
                </span>
                <span className="text-xs text-blue-200 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {COUNTRY_META_MAP[selectedCountry]?.name || "Global"}
                </span>
              </div>
              <h2 id="today-in-history-heading" className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {getHistoryText("todayInHistory", langCode)}
              </h2>
            </div>
          </div>

          {/* Quick Actions (PDF Export & Close) */}
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/30 flex items-center space-x-1.5 transition active:scale-95"
              title="Download clean study worksheet PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{getHistoryText("exportAsPdf", langCode)}</span>
              <span className="sm:hidden">Export PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center space-x-1"
              title="Share Today's History"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && <span className="text-[10px] text-emerald-300">Copied!</span>}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Selector & Multilingual Controls Ribbon */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Time-Machine Date Controller */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 py-1 font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{historyData?.formattedDate || formatLocalizedHistoryDate(currentDate, langCode)}</span>
            </div>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition"
            >
              Today
            </button>
          </div>

          {/* Language & Country Dropdown Selectors */}
          <div className="flex items-center space-x-2">
            {/* Top 30 Languages Switcher */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={selectedLang.code}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                aria-label="Select History Language"
              >
                {TOP_30_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Country Context Selector */}
            <div className="hidden sm:flex items-center space-x-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                aria-label="Select Country Perspective"
              >
                {Object.entries(COUNTRY_META_MAP).map(([code, meta]) => (
                  <option key={code} value={code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {meta.flag} {meta.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Main Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Featured Headline Hero Card */}
          {historyData && (
            <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 dark:from-blue-900/30 dark:via-slate-900/50 dark:to-purple-900/20 border border-blue-200 dark:border-blue-500/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white">
                    FEATURED TODAY
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {historyData.formattedDate}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {historyData.featuredHeadline}
                </h3>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleLaunchAiAssistant}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Bot className="w-4 h-4 text-cyan-400 dark:text-blue-600" />
                  <span>{getHistoryText("learnWithAi", langCode)}</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Daily Trivia Quiz Hook (Transforms 6s to 60s+ Dwell Time) */}
          {historyData?.dailyTrivia && (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-amber-300">
                    {getHistoryText("dailyQuizTitle", langCode)}
                  </h4>
                </div>

                <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{quizStreak} {getHistoryText("streak", langCode)}</span>
                </div>
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-100 mb-4 leading-relaxed">
                {historyData.dailyTrivia.question}
              </p>

              {/* 4 Interactive Option Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                {historyData.dailyTrivia.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === historyData.dailyTrivia.correctIndex;
                  const showResult = quizSubmitted;

                  let btnClass = "bg-slate-800/90 border-slate-700 hover:bg-slate-700/80 text-slate-200";
                  if (showResult) {
                    if (isCorrect) {
                      btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20";
                    } else if (isSelected && !isCorrect) {
                      btnClass = "bg-rose-500/20 border-rose-500 text-rose-300";
                    } else {
                      btnClass = "bg-slate-800/40 border-slate-800 text-slate-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(idx)}
                      disabled={quizSubmitted}
                      className={`p-3 rounded-2xl border text-xs sm:text-sm font-medium text-left transition flex items-center justify-between ${btnClass}`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </span>

                      {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanation Feedback */}
              {quizSubmitted && (
                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs space-y-1 animate-fadeIn">
                  <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Historical Context ({historyData.dailyTrivia.relatedYear}):</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {historyData.dailyTrivia.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Filter Categories Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
            {[
              { id: "all", label: "All Events" },
              { id: "milestone", label: getHistoryText("milestones", langCode) },
              { id: "birth", label: getHistoryText("birthdays", langCode) },
              { id: "invention", label: getHistoryText("discoveries", langCode) },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeCategory === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Historical Events Timeline Cards List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Loading historical timeline...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No events recorded for this category.
              </div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 shadow-xs hover:shadow-md transition duration-200 flex flex-col sm:flex-row items-start gap-4"
                >
                  {/* Year Badge */}
                  <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-sm sm:text-base border border-blue-500/20 shrink-0 font-mono">
                    {evt.year}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {evt.tag}
                      </span>
                      {evt.countryName && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {evt.countryName}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {evt.headline}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {evt.description}
                    </p>

                    {evt.wikipediaUrl && (
                      <a
                        href={evt.wikipediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                      >
                        <span>Wikipedia Archive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quote of the Day Banner */}
          {historyData?.quoteOfTheDay && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 flex items-center space-x-3.5">
              <BookOpen className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm italic font-medium">
                  &ldquo;{historyData.quoteOfTheDay.quote}&rdquo;
                </p>
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-1">
                  — {historyData.quoteOfTheDay.author} ({historyData.quoteOfTheDay.context})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Ribbon with PDFSun Tool Integration */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Educational study sheet provided free by PDFSun • 100% Client-Side Privacy</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{getHistoryText("exportAsPdf", langCode)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
