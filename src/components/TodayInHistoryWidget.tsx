import React, { useState, useMemo, useCallback } from "react";
import {
  Calendar,
  Globe,
  MapPin,
  Download,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Flame,
  Award,
  BookOpen,
  Search,
  X,
  Copy,
  Check,
  ExternalLink,
  Bot,
  RotateCcw,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useHistoryData } from "../hooks/useHistoryData";
import { useLanguageStore } from "../hooks/useLanguageStore";
import { ToolItem } from "../types";
import { HistoryEventItem } from "../types/history";
import { LanguageSelectorModal } from "./LanguageSelectorModal";
import { generateHistoryWorksheetPdf } from "../utils/historyPdfGenerator";
import { getHistoryText } from "../data/historyData";
import { getLocalizedTag, getLocalizedCategoryFilterName } from "../utils/historyTranslationEngine";
import { ALL_TOOLS } from "../data/toolsData";

interface TodayInHistoryWidgetProps {
  countryCode?: string;
  onSelectTool?: (tool: ToolItem) => void;
  className?: string;
}

export const TodayInHistoryWidget: React.FC<TodayInHistoryWidgetProps> = ({
  countryCode = "IN",
  onSelectTool,
  className = "",
}) => {
  const { currentLanguage, languageMeta, isRtl, direction, formatLocalizedDate } = useLanguageStore();

  const {
    data,
    loading,
    error,
    isFallback,
    selectedDate,
    nextDay,
    prevDay,
    today,
    refetch,
  } = useHistoryData({ countryCode });

  // UI States
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "milestone" | "birth" | "invention">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<HistoryEventItem | null>(null);
  const [copiedStory, setCopiedStory] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Trivia Quiz Interactive State
  const [quizState, setQuizState] = useState<{
    selectedOption: number | null;
    isSubmitted: boolean;
    isCorrect: boolean | null;
    shakingIndex: number | null;
  }>({
    selectedOption: null,
    isSubmitted: false,
    isCorrect: null,
    shakingIndex: null,
  });

  const [score, setScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("pdfsun_trivia_score") || "0", 10);
    } catch {
      return 0;
    }
  });

  const [streak, setStreak] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("pdfsun_history_streak") || "1", 10);
    } catch {
      return 1;
    }
  });

  // Reset quiz state when date or language changes
  React.useEffect(() => {
    setQuizState({
      selectedOption: null,
      isSubmitted: false,
      isCorrect: null,
      shakingIndex: null,
    });
  }, [selectedDate, currentLanguage]);

  // Handle Quiz Answer Click with Visual Animations
  const handleAnswerClick = useCallback(
    (index: number) => {
      if (quizState.isSubmitted || !data?.dailyTrivia) return;

      const isAnswerCorrect = index === data.dailyTrivia.correctIndex;

      if (isAnswerCorrect) {
        // Correct Answer: Green Highlight + Ripple + Confetti
        setQuizState({
          selectedOption: index,
          isSubmitted: true,
          isCorrect: true,
          shakingIndex: null,
        });

        const newScore = score + 10;
        const newStreak = streak + 1;
        setScore(newScore);
        setStreak(newStreak);

        try {
          localStorage.setItem("pdfsun_trivia_score", String(newScore));
          localStorage.setItem("pdfsun_history_streak", String(newStreak));
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.8 },
            colors: ["#10b981", "#3b82f6", "#f59e0b"],
          });
        } catch {}
      } else {
        // Wrong Answer: Shake Animation + Red Highlight + Reveal Correct
        setQuizState({
          selectedOption: index,
          isSubmitted: true,
          isCorrect: false,
          shakingIndex: index,
        });

        // Reset shake after animation completes
        setTimeout(() => {
          setQuizState((prev) => ({ ...prev, shakingIndex: null }));
        }, 500);
      }
    },
    [data?.dailyTrivia, quizState.isSubmitted, score, streak]
  );

  // Filter Event Cards
  const filteredEvents = useMemo(() => {
    if (!data) return [];
    let list: HistoryEventItem[] = [];

    if (activeCategory === "all") {
      list = [...(data.events || []), ...(data.births || []), ...(data.discoveries || [])];
    } else if (activeCategory === "milestone") {
      list = data.events || [];
    } else if (activeCategory === "birth") {
      list = data.births || [];
    } else if (activeCategory === "invention") {
      list = data.discoveries || [];
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (e) =>
        e.headline.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.subtitle && e.subtitle.toLowerCase().includes(q)) ||
        String(e.year).includes(q)
    );
  }, [activeCategory, data, searchQuery]);

  // Launch AI Copilot Workspace
  const handleLaunchAiWorkspace = () => {
    const aiTool = ALL_TOOLS.find((t) => t.slug === "ai-summary" || t.id === "ai-summary" || t.slug === "ai-chat");
    if (aiTool && onSelectTool) {
      onSelectTool(aiTool);
    }
  };

  // Export PDF Worksheet
  const handleExportPdf = () => {
    if (data) {
      generateHistoryWorksheetPdf(data);
    }
  };

  // Formatted date string using Intl.DateTimeFormat
  const formattedDateHeader = useMemo(() => {
    return formatLocalizedDate(selectedDate, { month: "long", day: "numeric", year: "numeric" });
  }, [formatLocalizedDate, selectedDate]);

  return (
    <section
      dir={direction}
      aria-label="Today in History and Knowledge Hub"
      className={`relative w-full max-w-7xl mx-auto rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}
    >
      {/* 1. TOP HEADER RIBBON & NAVIGATION CONTROLS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Calendar className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {languageMeta.nativeName} ({languageMeta.name})
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-400" />
                {getHistoryText("verifiedHub", currentLanguage)}
              </span>
              {isFallback && (
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  Auto Localized
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {getHistoryText("todayInHistory", currentLanguage)} • {formattedDateHeader}
            </h2>
          </div>
        </div>

        {/* Date Time-Machine & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          {/* Quick Date Stepper */}
          <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700 shadow-sm">
            <button
              onClick={prevDay}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title={getHistoryText("prevDay", currentLanguage)}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={today}
              className="px-3 py-1 text-xs font-bold text-blue-400 hover:bg-blue-500/20 rounded-xl transition cursor-pointer"
            >
              {getHistoryText("today", currentLanguage)}
            </button>
            <button
              onClick={nextDay}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title={getHistoryText("nextDay", currentLanguage)}
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Language Selector Modal Trigger */}
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            title="Switch Language across 30+ languages"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{languageMeta.flag} {languageMeta.nativeName}</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-500/20"
            title="Download Study Sheet PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{getHistoryText("exportAsPdf", currentLanguage)}</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* ZERO LAYOUT SHIFT (CLS = 0) SHIMMER SKELETON PLACEHOLDER */}
      {loading && (
        <div className="space-y-6 animate-pulse" aria-hidden="true">
          {/* Featured Headline Skeleton */}
          <div className="h-28 rounded-3xl bg-slate-800/80 border border-slate-700/60" />

          {/* Event Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-44 rounded-3xl bg-slate-800/70 border border-slate-700/50" />
            <div className="h-44 rounded-3xl bg-slate-800/70 border border-slate-700/50" />
            <div className="h-44 rounded-3xl bg-slate-800/70 border border-slate-700/50" />
          </div>

          {/* Trivia & Bottom Cards Skeleton */}
          <div className="h-56 rounded-3xl bg-slate-800/70 border border-slate-700/50" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 rounded-3xl bg-slate-800/70 border border-slate-700/50" />
            <div className="h-40 rounded-3xl bg-slate-800/70 border border-slate-700/50" />
          </div>
        </div>
      )}

      {/* MAIN RENDERED CONTENT (WHEN DATA LOADED) */}
      {!loading && data && (
        <div className="space-y-6">
          {/* FEATURED SPOTLIGHT CARD (WCAG AA ELEVATED SURFACE) */}
          <div
            style={{
              backgroundColor: "var(--surface-card-elevated, #1E1E2E)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
            className="relative rounded-3xl p-5 sm:p-7 shadow-xl space-y-2.5 overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {getHistoryText("featuredHeadline", currentLanguage) || "Historical Spotlight"}
              </span>
              <span className="text-xs font-mono text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                {getHistoryText("dayOfYearText", currentLanguage, { day: data.dayOfYear })}
              </span>
            </div>

            <h3 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight">
              {data.featuredHeadline}
            </h3>

            <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
              {getHistoryText("subtitle", currentLanguage)}
            </p>
          </div>

          {/* FILTER BAR & SEARCH */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {getHistoryText("allCategories", currentLanguage)}
              </button>
              <button
                onClick={() => setActiveCategory("milestone")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeCategory === "milestone"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {getLocalizedCategoryFilterName("milestone", currentLanguage)}
              </button>
              <button
                onClick={() => setActiveCategory("birth")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeCategory === "birth"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {getLocalizedCategoryFilterName("birth", currentLanguage)}
              </button>
              <button
                onClick={() => setActiveCategory("invention")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeCategory === "invention"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {getLocalizedCategoryFilterName("invention", currentLanguage)}
              </button>
            </div>

            {/* Instant Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={getHistoryText("searchPlaceholder", currentLanguage)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 text-xs text-white placeholder-slate-400 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. EVENT CARDS GRID (UPPER CARDS SECTION A) */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDetailEvent(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDetailEvent(item);
                    }
                  }}
                  className="p-5 rounded-3xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/70 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer active:scale-[0.99]"
                >
                  <div className="space-y-2.5">
                    {/* Dynamic Year Badge & Category Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-mono font-black text-xs shadow-sm">
                        {item.year}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-700/70 px-2.5 py-0.5 rounded-lg border border-slate-600">
                        {getLocalizedTag(item.tag, item.category, currentLanguage)}
                      </span>
                    </div>

                    {/* Title / Name */}
                    <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {item.title || item.headline}
                    </h4>

                    {/* Profession / Subtitle */}
                    {item.subtitle && (
                      <p className="text-xs font-semibold text-amber-400/90 tracking-wide">
                        {item.subtitle}
                      </p>
                    )}

                    {/* Detailed Summary */}
                    <p className="text-xs text-[#D1D5DB] leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Source Attribution & "विवरण देखें" Details Trigger */}
                  <div className="pt-3 mt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[170px]">
                      {getHistoryText("source", currentLanguage)}: {item.sourceName || "विकिपीडिया"}
                    </span>
                    <span className="text-blue-400 font-bold group-hover:underline flex items-center gap-1 shrink-0">
                      {getHistoryText("details", currentLanguage)}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-800/40 rounded-3xl border border-dashed border-slate-700 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">
                {getHistoryText("noEventsMatch", currentLanguage)}
              </h4>
              <p className="text-xs text-slate-400">
                {getHistoryText("trySwitching", currentLanguage)}
              </p>
            </div>
          )}

          {/* 3. INTERACTIVE DAILY TRIVIA QUIZ SECTION (MIDDLE-BOTTOM CARD SECTION B) */}
          {data.dailyTrivia && (
            <div
              style={{
                backgroundColor: "var(--surface-trivia-card, #181825)",
              }}
              className="p-5 sm:p-7 rounded-3xl border border-amber-500/40 shadow-xl space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      {getHistoryText("dailyQuizTitle", currentLanguage)}
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-[#F9FAFB]">
                      {getHistoryText("testKnowledge", currentLanguage)}
                    </h4>
                  </div>
                </div>

                {/* Score & Streak Badges */}
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold font-mono">
                    Score: {score} pts
                  </span>
                  <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                    <span>{streak} {getHistoryText("streak", currentLanguage)}</span>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {data.dailyTrivia.question}
              </p>

              {/* 4 Option Buttons (A, B, C, D) with Instant Interactive Animation Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.dailyTrivia.options.map((option, idx) => {
                  const isCorrectAnswer = idx === data.dailyTrivia.correctIndex;
                  const isUserSelection = idx === quizState.selectedOption;
                  const isShaking = idx === quizState.shakingIndex;

                  let optionStyle = "bg-[#1E1E2E] border-[#374151] text-[#F3F4F6] hover:border-amber-400 hover:bg-[#25263A]";

                  if (quizState.isSubmitted) {
                    if (isCorrectAnswer) {
                      optionStyle = "bg-emerald-600 text-white border-emerald-500 font-bold shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400 animate-quiz-ripple";
                    } else if (isUserSelection) {
                      optionStyle = "bg-rose-600 text-white border-rose-500 font-bold ring-2 ring-rose-400";
                    } else {
                      optionStyle = "bg-slate-900/50 text-slate-500 border-slate-800 opacity-40";
                    }
                  } else if (isUserSelection) {
                    optionStyle = "bg-amber-500 text-slate-950 border-amber-400 font-bold";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={quizState.isSubmitted}
                      onClick={() => handleAnswerClick(idx)}
                      className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition flex items-start space-x-2.5 cursor-pointer shadow-sm ${optionStyle} ${
                        isShaking ? "animate-quiz-shake" : ""
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quiz Feedback Explanation Box */}
              {quizState.isSubmitted && (
                <div className="p-4 rounded-2xl bg-[#1E1E2E] border border-amber-500/40 space-y-2 animate-fadeIn text-[#D1D5DB]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {quizState.isCorrect ? (
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {getHistoryText("correct", currentLanguage)} (+10 pts)
                        </span>
                      ) : (
                        <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          {getHistoryText("incorrect", currentLanguage)}: {data.dailyTrivia.options[data.dailyTrivia.correctIndex]}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setShowExplanationModal(true)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      Full Explanation
                    </button>
                  </div>
                  <p className="text-xs text-[#D1D5DB] leading-relaxed">
                    {data.dailyTrivia.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. QUOTE CARD (SECTION C) & AI DOCUMENT COPILOT BANNER (SECTION D) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SECTION C: Quote / Historic Wisdom Card */}
            {data.quoteOfTheDay && (
              <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-3 flex flex-col justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {getHistoryText("quoteTitle", currentLanguage)}
                  </span>
                  <blockquote className="text-sm font-serif italic text-[#F3F4F6] leading-relaxed mt-2">
                    &ldquo;{data.quoteOfTheDay.quote}&rdquo;
                  </blockquote>
                  <p className="text-xs font-bold text-white mt-2">
                    — {data.quoteOfTheDay.author}{" "}
                    <span className="text-[11px] font-normal text-slate-400">
                      ({data.quoteOfTheDay.context})
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{getHistoryText("source", currentLanguage)}: {data.quoteOfTheDay.sourceName || "ऐतिहासिक अभिलेखागार"}</span>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Verified
                  </span>
                </div>
              </div>
            )}

            {/* SECTION D: AI Document Copilot Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 border border-blue-400/30 text-white space-y-3 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center space-x-2 text-cyan-200 text-xs font-black uppercase tracking-wider">
                  <Bot className="w-4 h-4" />
                  <span>{getHistoryText("learnWithAi", currentLanguage)}</span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-white mt-1">
                  {getHistoryText("aiBannerTitle", currentLanguage)}
                </h4>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  {getHistoryText("aiBannerDesc", currentLanguage)}
                </p>
              </div>

              <button
                onClick={handleLaunchAiWorkspace}
                className="mt-2 self-start px-4 py-2 rounded-xl bg-white text-blue-950 hover:bg-slate-100 text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
              >
                {getHistoryText("openAiWorkspace", currentLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE EVENT DETAIL MODAL */}
      {selectedDetailEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedDetailEvent(null)}
        >
          <div
            dir={direction}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-mono font-black text-sm">
                  {selectedDetailEvent.year}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  {getLocalizedTag(selectedDetailEvent.tag, selectedDetailEvent.category, currentLanguage)}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailEvent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
              {selectedDetailEvent.title || selectedDetailEvent.headline}
            </h3>

            {selectedDetailEvent.subtitle && (
              <p className="text-xs font-semibold text-amber-400">
                {selectedDetailEvent.subtitle}
              </p>
            )}

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-[#D1D5DB] leading-relaxed space-y-2">
              <p>{selectedDetailEvent.description}</p>
              {selectedDetailEvent.significance && (
                <p className="text-xs italic text-blue-300 pt-2 border-t border-slate-700">
                  <strong>{getHistoryText("historicalImpact", currentLanguage)}:</strong> {selectedDetailEvent.significance}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                {getHistoryText("verifiedVia", currentLanguage)} {selectedDetailEvent.sourceName || "विकिपीडिया"}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const text = `${selectedDetailEvent.year}: ${selectedDetailEvent.headline} - ${selectedDetailEvent.description}`;
                    navigator.clipboard.writeText(text);
                    setCopiedStory(true);
                    setTimeout(() => setCopiedStory(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                >
                  {copiedStory ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStory ? getHistoryText("copied", currentLanguage) : getHistoryText("copyStory", currentLanguage)}</span>
                </button>

                {selectedDetailEvent.wikipediaUrl && (
                  <a
                    href={selectedDetailEvent.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Wikipedia</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DYNAMIC TRIVIA EXPLANATION MODAL */}
      {showExplanationModal && data?.dailyTrivia && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowExplanationModal(false)}
        >
          <div
            dir={direction}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                Trivia Explanation & Context
              </h3>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#1E1E2E] border border-amber-500/30 text-xs sm:text-sm text-[#D1D5DB] leading-relaxed space-y-2">
              <p><strong>Correct Answer:</strong> {data.dailyTrivia.options[data.dailyTrivia.correctIndex]}</p>
              <p>{data.dailyTrivia.explanation}</p>
              {data.dailyTrivia.historicalContext && (
                <p className="text-xs text-blue-300 italic pt-2 border-t border-slate-700">
                  {data.dailyTrivia.historicalContext}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowExplanationModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 7. FULL 30+ LANGUAGE SEARCHABLE SELECTOR MODAL */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </section>
  );
};
