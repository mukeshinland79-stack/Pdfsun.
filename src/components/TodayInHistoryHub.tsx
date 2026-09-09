import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  Calendar,
  Globe,
  MapPin,
  Sparkles,
  Download,
  CheckCircle2,
  HelpCircle,
  Quote,
  Flame,
  FileText,
  RefreshCw,
  Landmark,
  Cpu,
  Rocket,
  BookOpen,
  Award,
  Telescope,
} from "lucide-react";
import confetti from "canvas-confetti";
import { GeoDetectionResult } from "../types/history";
import { DailyKnowledgeData } from "../server/knowledgeHubController";
import { fetchDailyKnowledge } from "../services/knowledgeHubService";
import { TOP_30_LANGUAGES, COUNTRY_META_MAP } from "../utils/geoLanguageDetector";
import { fetchDayInHistory } from "../services/historyService";
import { generateHistoryWorksheetPdf } from "../utils/historyPdfGenerator";

interface TodayInHistoryHubProps {
  geoResult: GeoDetectionResult;
  onOpenHistoryModal?: () => void;
  onOpenAiWorkspace?: () => void;
}

export const TodayInHistoryHub: React.FC<TodayInHistoryHubProps> = ({
  geoResult,
  onOpenHistoryModal,
  onOpenAiWorkspace,
}) => {
  // Modal visibility state (default: false, only compact strip is visible)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Selected Date, Country, Language
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return geoResult.detectedCountryName || "United States";
  });

  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return geoResult.detectedLanguage?.name || "English (US)";
  });

  const [knowledgeData, setKnowledgeData] = useState<DailyKnowledgeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Manage body scroll locking when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Load data whenever modal opens or filters change
  const loadData = useCallback(async (date: string, country: string, lang: string) => {
    setIsLoading(true);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);

    try {
      const data = await fetchDailyKnowledge(date, country, lang);
      if (data) {
        startTransition(() => {
          setKnowledgeData(data);
        });
      }
    } catch (err) {
      console.warn("Failed to load knowledge hub data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      loadData(selectedDate, selectedCountry, selectedLang);
    }
  }, [isModalOpen, selectedDate, selectedCountry, selectedLang, loadData]);

  // Handle Quiz Option Selection
  const handleSelectQuizOption = (index: number) => {
    if (quizSubmitted) return;
    setSelectedQuizOption(index);
    setQuizSubmitted(true);

    const isCorrect = index === 0;
    if (isCorrect) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {}
    }
  };

  const handleExportPdf = async () => {
    const dateObj = new Date(selectedDate);
    const langCode = geoResult.detectedLanguage?.code || "en";
    const countryCode = geoResult.detectedCountryCode || "US";
    const historyData = await fetchDayInHistory(dateObj, langCode, countryCode);
    if (historyData) {
      generateHistoryWorksheetPdf(historyData);
    }
  };

  // Formatted date badge for the compact strip
  const formattedDateBadge = (() => {
    try {
      const d = new Date(selectedDate + "T12:00:00Z");
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "Today";
    }
  })();

  return (
    <section
      id="today-in-history-hub"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      aria-label="Today in History and Daily Knowledge Hub"
    >
      {/* 1. COMPACT HOME BANNER (Default State: Always Visible) */}
      <div
        id="knowledge-hub-compact-strip"
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-[#0d111d] border border-gray-800 hover:border-gray-700 rounded-xl p-4 my-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500 text-xl group-hover:scale-105 transition-transform">
            📅
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span id="strip-lang-badge" className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded uppercase tracking-wider">
                {selectedLang}
              </span>
              <span id="strip-date-badge" className="text-amber-400">
                {formattedDateBadge}
              </span>
            </div>
            <h3 className="text-white font-bold text-base md:text-lg mt-0.5 group-hover:text-blue-200 transition-colors">
              Today in History &amp; Daily Knowledge Hub
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            id="btn-open-knowledge-hub"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>EXPLORE HISTORY</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. FULL EXPANDABLE STUDY HUB (Hidden by Default, Opens on Click) */}
      <div
        id="knowledge-hub-modal"
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-center p-2 md:p-6 overflow-y-auto ${
          isModalOpen ? "" : "hidden"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsModalOpen(false);
          }
        }}
      >
        <div
          className="bg-[#0b0f19] text-white w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-gray-800 shadow-2xl p-4 md:p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Controls */}
          <div className="sticky top-0 bg-[#0b0f19]/95 backdrop-blur-md z-20 pb-4 border-b border-gray-800 flex justify-between items-center mb-6">
            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                LIVE DAILY KNOWLEDGE HUB
              </span>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <span>Today in History &amp; Daily Knowledge Hub</span>
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin inline-block ml-1" />
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700 transition"
                title="Download Study Sheet PDF"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Study PDF</span>
              </button>
              <button
                id="btn-close-knowledge-hub"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full text-lg w-9 h-9 flex items-center justify-center transition cursor-pointer"
                aria-label="Close Knowledge Hub Modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filter Controls (Date, Country, Language) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-[#121827] p-4 rounded-xl border border-gray-800">
            <div>
              <label htmlFor="hub-date-picker" className="text-xs text-gray-400 block mb-1 font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                SELECT DATE
              </label>
              <input
                type="date"
                id="hub-date-picker"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#0b0f19] border border-gray-700 text-white text-sm rounded-lg p-2.5 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label htmlFor="hub-country-select" className="text-xs text-gray-400 block mb-1 font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" />
                COUNTRY / PERSPECTIVE
              </label>
              <select
                id="hub-country-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-[#0b0f19] border border-gray-700 text-white text-sm rounded-lg p-2.5 focus:border-blue-400 focus:outline-hidden"
              >
                <option value="United States">🇺🇸 United States</option>
                <option value="India">🇮🇳 India</option>
                <option value="Worldwide">🌐 Worldwide</option>
                {Object.entries(COUNTRY_META_MAP)
                  .filter(([_, meta]) => meta.name !== "United States" && meta.name !== "India")
                  .map(([code, meta]) => (
                    <option key={code} value={meta.name}>
                      {meta.flag} {meta.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="hub-language-select" className="text-xs text-gray-400 block mb-1 font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                LANGUAGE
              </label>
              <select
                id="hub-language-select"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full bg-[#0b0f19] border border-gray-700 text-white text-sm rounded-lg p-2.5 focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="English (US)">🇺🇸 English (US)</option>
                <option value="Hindi">🇮🇳 Hindi (हिन्दी)</option>
                <option value="Spanish">🇪🇸 Spanish (Español)</option>
                {TOP_30_LANGUAGES.filter(
                  (l) => l.name !== "English (US)" && l.name !== "Hindi" && l.name !== "Spanish"
                ).map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Content Grid (6 Cards + Quiz + Quote + AI Deep Dive) */}
          <div
            id="hub-dynamic-content"
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 ${
              isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* 1. Governance & Treaties */}
            <div
              id="card-governance"
              className="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-amber-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-xs text-amber-400 font-bold mb-2">
                  <span className="tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    GOVERNANCE &amp; TREATIES
                  </span>
                  <span className="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">
                    {knowledgeData?.governance?.year || "1945"}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base leading-snug">
                  {knowledgeData?.governance?.title || "Charter of the United Nations"}
                </h4>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {knowledgeData?.governance?.description ||
                    "Delegates finalized diplomatic treaties establishing sovereign international protocols and global peace accords."}
                </p>
              </div>
              {knowledgeData?.governance?.subtext && (
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">
                  {knowledgeData.governance.subtext}
                </p>
              )}
            </div>

            {/* 2. Technology & Science */}
            <div
              id="card-tech"
              className="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-blue-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-xs text-blue-400 font-bold mb-2">
                  <span className="tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    TECHNOLOGY &amp; SCIENCE
                  </span>
                  <span className="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">
                    {knowledgeData?.techScience?.year || "1982"}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base leading-snug">
                  {knowledgeData?.techScience?.title || "Commercial Optical Compact Disc"}
                </h4>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {knowledgeData?.techScience?.description ||
                    "Engineers pressed the world's first commercial digital optical disc, sparking the global transition from analog magnetic tape."}
                </p>
              </div>
              {knowledgeData?.techScience?.subtext && (
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">
                  {knowledgeData.techScience.subtext}
                </p>
              )}
            </div>

            {/* 3. Space & Aerospace */}
            <div
              id="card-space"
              className="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-purple-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-xs text-purple-400 font-bold mb-2">
                  <span className="tracking-wider flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5 text-purple-400" />
                    SPACE &amp; AEROSPACE
                  </span>
                  <span className="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">
                    {knowledgeData?.spaceAerospace?.year || "1969"}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base leading-snug">
                  {knowledgeData?.spaceAerospace?.title || "Lunar Lander Touches Lunar Surface"}
                </h4>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {knowledgeData?.spaceAerospace?.description ||
                    "Astronauts completed descent maneuvers to touch down on another celestial body, watched by over 600 million people."}
                </p>
              </div>
              {knowledgeData?.spaceAerospace?.subtext && (
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">
                  {knowledgeData.spaceAerospace.subtext}
                </p>
              )}
            </div>

            {/* 4. Science & Letters */}
            <div
              id="card-letters"
              className="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-xs text-emerald-400 font-bold mb-2">
                  <span className="tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    SCIENCE &amp; LETTERS
                  </span>
                  <span className="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">
                    {knowledgeData?.scienceLetters?.year || "1859"}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base leading-snug">
                  {knowledgeData?.scienceLetters?.title || "On the Origin of Species Published"}
                </h4>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {knowledgeData?.scienceLetters?.description ||
                    "Seminal scientific literature introduced the principle of natural selection, restructuring modern biological research."}
                </p>
              </div>
              {knowledgeData?.scienceLetters?.subtext && (
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">
                  {knowledgeData.scienceLetters.subtext}
                </p>
              )}
            </div>

            {/* 5. Nobel Laureate */}
            <div
              id="card-nobel"
              className="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-yellow-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-xs text-yellow-400 font-bold mb-2">
                  <span className="tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-yellow-400" />
                    NOBEL LAUREATE
                  </span>
                  <span className="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">
                    {knowledgeData?.nobelLaureate?.year || "1921"}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base leading-snug">
                  {knowledgeData?.nobelLaureate?.title || "Physics Prize for Photoelectric Effect"}
                </h4>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {knowledgeData?.nobelLaureate?.description ||
                    "Honored for foundational explanations of quantized light photons, bridging quantum mechanics and optical physics."}
                </p>
              </div>
              {knowledgeData?.nobelLaureate?.subtext && (
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">
                  {knowledgeData.nobelLaureate.subtext}
                </p>
              )}
            </div>

            {/* 6. Astrophysics */}
            <div
              id="card-astrophysics"
              className="bg-[#121827] p-5 rounded-xl border border-gray-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-xs text-cyan-400 font-bold mb-2">
                  <span className="tracking-wider flex items-center gap-1.5">
                    <Telescope className="w-3.5 h-3.5 text-cyan-400" />
                    ASTROPHYSICS
                  </span>
                  <span className="bg-gray-800 text-gray-300 font-mono text-xs px-2.5 py-0.5 rounded border border-gray-700">
                    {knowledgeData?.astrophysics?.year || "2019"}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base leading-snug">
                  {knowledgeData?.astrophysics?.title || "First Image of a Black Hole Horizon"}
                </h4>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {knowledgeData?.astrophysics?.description ||
                    "Event Horizon Telescope synchronized global observatories to capture the silhouette of supermassive black hole M87*."}
                </p>
              </div>
              {knowledgeData?.astrophysics?.subtext && (
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-800/80 italic">
                  {knowledgeData.astrophysics.subtext}
                </p>
              )}
            </div>

            {/* Quiz Section */}
            <div id="quiz-block" className="col-span-1 md:col-span-2 bg-[#121827] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  DAILY KNOWLEDGE CHALLENGE (QUIZ)
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {selectedDate}
                </span>
              </div>
              <p className="font-bold text-white text-base mt-1 mb-3">
                {knowledgeData?.quiz?.question || "Which fundamental scientific breakthrough occurred on this date?"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(knowledgeData?.quiz?.options || [
                  "A) Optical laser digital recording and standardisation",
                  "B) First transatlantic telegraph cable communication",
                  "C) Discovery of Neptune's primary planetary rings",
                  "D) Patenting of the high-frequency alternating current dynamo",
                ]).map((opt, idx) => {
                  const isSelected = selectedQuizOption === idx;
                  const isCorrect = idx === 0;

                  let btnStyle = "bg-gray-800/90 hover:bg-gray-700 text-gray-200 border-gray-700";
                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-300";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-600/30 border-rose-500 text-rose-300";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuizOption(idx)}
                      className={`p-3 text-left text-xs font-medium rounded-lg border transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {quizSubmitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
              {quizSubmitted && (
                <div className="mt-3 p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300">
                  <span className="font-bold text-amber-400">Insight: </span>
                  {knowledgeData?.quiz?.explanation ||
                    "Historical archives confirm key advancements in digital recording and communication protocols taking place on this landmark date."}
                </div>
              )}
            </div>

            {/* Quote & AI Study Deep Dive */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="quote-block" className="bg-[#121827] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-gray-400" />
                  QUOTE OF THE DAY
                </span>
                <p className="italic text-sm text-gray-300 mt-2 leading-relaxed">
                  &ldquo;{knowledgeData?.quote?.text || "The important thing is not to stop questioning. Curiosity has its own reason for existing."}&rdquo;
                </p>
                <p className="text-xs font-semibold text-amber-400 mt-2 text-right">
                  — {knowledgeData?.quote?.author || "Albert Einstein"}
                </p>
              </div>

              <div id="deepdive-block" className="bg-blue-950/30 p-5 rounded-xl border border-blue-500/30 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    DEEP DIVE WITH PDFSUN AI
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1.5">
                    {knowledgeData?.deepDive?.title || "Analyze & Compile Historical Documents with PDFSun AI"}
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {knowledgeData?.deepDive?.description ||
                      "Upload historical manuscripts or research papers to extract key chronological events, summarize findings, and generate study guides."}
                  </p>
                </div>
                {onOpenAiWorkspace ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      onOpenAiWorkspace();
                    }}
                    className="mt-3 inline-flex items-center justify-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white py-2 px-3.5 rounded-lg transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Launch PDFSun AI Studio</span>
                  </button>
                ) : (
                  <a
                    href="#all-tools"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 inline-flex items-center justify-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white py-2 px-3.5 rounded-lg transition"
                  >
                    <span>Launch PDF Tools &amp; AI Studio</span>
                    <span>→</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
