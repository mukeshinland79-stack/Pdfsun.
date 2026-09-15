import React, { useState, useEffect } from "react";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Globe,
  MapPin,
  Download,
  Award,
  BookOpen,
  Clock,
  Lock,
  Cpu,
  Zap,
  Layers,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Flame,
} from "lucide-react";
import { GeoDetectionResult } from "../types/history";
import { fetchDayInHistory } from "../services/historyService";
import { generateHistoryWorksheetPdf } from "../utils/historyPdfGenerator";
import { getHistoryText } from "../data/historyData";

export interface EngineChroniclesHubProps {
  geoResult: GeoDetectionResult;
  onOpenHistoryModal: () => void;
  onNavigateArticle: (slug: string) => void;
  onNavigateBlog: () => void;
}

export const EngineChroniclesHub: React.FC<EngineChroniclesHubProps> = ({
  geoResult,
  onOpenHistoryModal,
  onNavigateArticle,
  onNavigateBlog,
}) => {
  const [featuredHeadline, setFeaturedHeadline] = useState<string>(
    "Historic Global Milestones & Groundbreaking Inventions"
  );
  const [dateString, setDateString] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "history" | "engineering" | "productivity">("all");

  useEffect(() => {
    let isMounted = true;
    let lastLoadedDay = new Date().getDate();

    const loadData = () => {
      const now = new Date();
      lastLoadedDay = now.getDate();
      fetchDayInHistory(now, geoResult.detectedLanguage?.code || "en", geoResult.detectedCountryCode || "IN").then(
        (data) => {
          if (isMounted && data) {
            setFeaturedHeadline(data.featuredHeadline || "Historic Global Milestones & Groundbreaking Inventions");
            setDateString(data.formattedDate || "Today");
            setLoading(false);
          }
        }
      );
    };

    loadData();

    // Revalidate at midnight / interval
    const interval = setInterval(() => {
      const currentDay = new Date().getDate();
      if (currentDay !== lastLoadedDay) {
        loadData();
      }
    }, 60000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const currentDay = new Date().getDate();
        if (currentDay !== lastLoadedDay) {
          loadData();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [geoResult.detectedLanguage?.code, geoResult.detectedCountryCode]);

  const handleExportQuickPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const data = await fetchDayInHistory(
      new Date(),
      geoResult.detectedLanguage?.code || "en",
      geoResult.detectedCountryCode || "IN"
    );
    if (data) {
      generateHistoryWorksheetPdf(data);
    }
  };

  const langCode = geoResult.detectedLanguage?.code || "en";

  return (
    <div
      id="engine-chronicles-hub"
      className="w-full max-w-7xl mx-auto px-1 sm:px-2 py-3 space-y-6"
      aria-label="PDFSun Engine and Daily Chronicles Hub"
    >
      {/* Top Filter & Category Segmented Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Chronicles &amp; Technical Intelligence Hub
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-cyan-400 border border-cyan-500/30">
            3 Core Pillars
          </span>
        </div>

        {/* Filter View Selector */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            All Pillars (3)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === "history"
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Daily History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("engineering")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === "engineering"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Engineering Insights
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("productivity")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === "productivity"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Productivity Hacks
          </button>
        </div>
      </div>

      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* =========================================================================
         * CARD 1: Today in History & Daily Knowledge Hub
         * ========================================================================= */}
        {(activeTab === "all" || activeTab === "history") && (
          <div
            id="card-daily-history"
            onClick={onOpenHistoryModal}
            className="rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-[#0A0F1D] via-[#0d1629] to-[#0A0F1D] border border-blue-500/25 hover:border-amber-500/60 shadow-xl hover:shadow-amber-500/10 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between cursor-pointer"
          >
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all"
              aria-hidden="true"
            />

            <div className="space-y-4 relative z-10">
              {/* Header Micro-Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Calendar className="w-3 h-3 text-amber-400 mr-1" />
                  Daily Chronicle
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 text-amber-400 mr-1" />
                  Live Daily Feed
                </span>
              </div>

              {/* Title & Icon */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                    Today in History &amp; Daily Knowledge Hub
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                    <span className="inline-flex items-center text-rose-400">
                      <MapPin className="w-3 h-3 mr-0.5" />
                      {geoResult.detectedCountryName || "Global"}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 font-medium">{dateString || "Today"}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Headline */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/20 text-xs space-y-1.5 group-hover:border-amber-500/40 transition-colors">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{getHistoryText("todayInHistory", langCode)}</span>
                </div>
                <p className="font-semibold text-slate-100 line-clamp-2 leading-relaxed">
                  {featuredHeadline}
                </p>
              </div>

              {/* Micro Features / Badges */}
              <div className="space-y-2 pt-1 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[11px] text-slate-300">
                    Localized in <strong>30 Languages</strong> ({geoResult.detectedLanguage?.nativeName || "English"})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-300">
                    Interactive Daily Quiz &amp; Printable Study Worksheet
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
              <button
                type="button"
                onClick={handleExportQuickPdf}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold border border-white/10 transition flex items-center space-x-1.5 cursor-pointer"
                title="Download printable study worksheet PDF"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={onOpenHistoryModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition group-hover:scale-102 cursor-pointer"
              >
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
         * CARD 2: PDFSun Engineering Insights & Technical Deep Dives
         * ========================================================================= */}
        {(activeTab === "all" || activeTab === "engineering") && (
          <div
            id="card-engineering-insights"
            onClick={() => onNavigateArticle("in-browser-pdf-processing-privacy")}
            className="rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-[#0A0F1D] via-[#0d1629] to-[#0A0F1D] border border-blue-500/25 hover:border-cyan-400/60 shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between cursor-pointer"
          >
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all"
              aria-hidden="true"
            />

            <div className="space-y-4 relative z-10">
              {/* Header Micro-Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-cyan-300 border border-blue-500/30">
                  <ShieldCheck className="w-3 h-3 text-cyan-400 mr-1" />
                  Security White Paper
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 text-cyan-400 mr-1" />
                  8 min read
                </span>
              </div>

              {/* Title & Icon */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    PDFSun Engineering Insights &amp; Technical Deep Dives
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-cyan-400 mt-1 font-semibold">
                    <span>WebAssembly</span>
                    <span>•</span>
                    <span>Zero-Data Retention</span>
                    <span>•</span>
                    <span>AES-256</span>
                  </div>
                </div>
              </div>

              {/* Featured Paper Highlight */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-500/20 text-xs space-y-1.5 group-hover:border-cyan-500/40 transition-colors">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Featured Architecture Deep Dive</span>
                </div>
                <p className="font-semibold text-slate-100 line-clamp-2 leading-relaxed">
                  Why In-Browser WebAssembly PDF Processing Beats Cloud Uploads in 2026
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                  How compiled WASM bytecodes eliminate remote server data breach vectors, ensuring GDPR, HIPAA &amp; DPDP compliance.
                </p>
              </div>

              {/* Sub-Articles & Technical Topics */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateArticle("protecting-sensitive-pdfs-aes-256-encryption");
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/60 text-left transition group/item text-xs"
                >
                  <span className="text-[11px] font-medium text-slate-300 group-hover/item:text-cyan-300 truncate">
                    AES-256 Encryption vs. Standard Passwords
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-cyan-400 shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateArticle("ai-document-analysis-gemini-workflows");
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/60 text-left transition group/item text-xs"
                >
                  <span className="text-[11px] font-medium text-slate-300 group-hover/item:text-cyan-300 truncate">
                    AI Document Analysis &amp; Gemini 3.6 Models
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-cyan-400 shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
              <span className="text-[11px] font-mono font-medium text-slate-400">
                WASM Runtime
              </span>

              <button
                type="button"
                onClick={() => onNavigateArticle("in-browser-pdf-processing-privacy")}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition group-hover:scale-102 cursor-pointer"
              >
                <span>Read Deep Dive</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
         * CARD 3: Productivity Hacks, Tutorials & Document Workflows
         * ========================================================================= */}
        {(activeTab === "all" || activeTab === "productivity") && (
          <div
            id="card-productivity-hacks"
            onClick={() => onNavigateArticle("mastering-pdf-compression-dpi-downsample")}
            className="rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-[#0A0F1D] via-[#0d1629] to-[#0A0F1D] border border-blue-500/25 hover:border-emerald-400/60 shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between cursor-pointer"
          >
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all"
              aria-hidden="true"
            />

            <div className="space-y-4 relative z-10">
              {/* Header Micro-Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Zap className="w-3 h-3 text-emerald-400 mr-1" />
                  Productivity Hacks
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 text-emerald-400 mr-1" />
                  7 min read
                </span>
              </div>

              {/* Title & Icon */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    Productivity Hacks, Tutorials &amp; Workflows
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-emerald-400 mt-1 font-semibold">
                    <span>PDF Optimization</span>
                    <span>•</span>
                    <span>AI Summaries</span>
                    <span>•</span>
                    <span>Table Extraction</span>
                  </div>
                </div>
              </div>

              {/* Featured Guide Highlight */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 text-xs space-y-1.5 group-hover:border-emerald-500/40 transition-colors">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>Featured Step-by-Step Tutorial</span>
                </div>
                <p className="font-semibold text-slate-100 line-clamp-2 leading-relaxed">
                  Mastering PDF Compression: Downsample DPI &amp; Quantize Images
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                  Step-by-step workflow to shrink files down to 100KB, 200KB, or 500KB thresholds for portal submissions without quality loss.
                </p>
              </div>

              {/* Sub-Articles & Productivity Guides */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateArticle("step-by-step-merge-massive-pdf-reports");
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/60 text-left transition group/item text-xs"
                >
                  <span className="text-[11px] font-medium text-slate-300 group-hover/item:text-emerald-300 truncate">
                    Merge Massive PDF Reports Online Privately
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-emerald-400 shrink-0 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateArticle("convert-pdf-tables-to-clean-excel-csv");
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/60 text-left transition group/item text-xs"
                >
                  <span className="text-[11px] font-medium text-slate-300 group-hover/item:text-emerald-300 truncate">
                    Extract Clean Excel Tables Without Breaking Columns
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-emerald-400 shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
              <span className="text-[11px] font-mono font-medium text-slate-400">
                Fast &amp; Free Guides
              </span>

              <button
                type="button"
                onClick={() => onNavigateArticle("mastering-pdf-compression-dpi-downsample")}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition group-hover:scale-102 cursor-pointer"
              >
                <span>Read Tutorial</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hub Bar: Direct Access to Master Guides Archive */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-xs text-slate-300">
          <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
          <span>
            Explore all <strong>10+ In-Depth Engineering White Papers</strong>, WebAssembly security architectures &amp; document workflow cheat sheets.
          </span>
        </div>

        <button
          type="button"
          onClick={onNavigateBlog}
          className="px-4 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer shadow-xs"
        >
          <span>View All Articles &amp; Guides</span>
          <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
        </button>
      </div>
    </div>
  );
};
