import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Globe,
  Award,
  Download,
  ArrowRight,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { GeoDetectionResult } from "../types/history";
import { fetchDayInHistory } from "../services/historyService";
import { generateHistoryWorksheetPdf } from "../utils/historyPdfGenerator";
import { useLanguage } from "../lib/i18n";

export interface TodayInHistoryKnowledgeHubCardProps {
  badge?: string;
  ctaText?: string;
  icon?: string;
  title?: string;
  geoResult?: GeoDetectionResult;
  onOpenHistoryModal: () => void;
  className?: string;
}

export const TodayInHistoryKnowledgeHubCard: React.FC<TodayInHistoryKnowledgeHubCardProps> = ({
  badge = "DAILY CHRONICLE",
  ctaText = "EXPLORE →",
  icon = "📅",
  title = "Today in History & Daily Knowledge Hub",
  geoResult,
  onOpenHistoryModal,
  className = "",
}) => {
  const { currentLanguage, t } = useLanguage();
  const effectiveLang = currentLanguage || geoResult?.detectedLanguage?.code || "en";
  const countryCode = geoResult?.detectedCountryCode || "IN";
  const countryName = geoResult?.detectedCountryName || "Global";

  const [featuredHeadline, setFeaturedHeadline] = useState<string>(
    "Historic Global Milestones, World Events & Groundbreaking Inventions"
  );
  const [dateString, setDateString] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let lastLoadedDay = new Date().getDate();

    const loadData = () => {
      const now = new Date();
      lastLoadedDay = now.getDate();
      fetchDayInHistory(now, effectiveLang, countryCode).then((data) => {
        if (isMounted && data) {
          setFeaturedHeadline(data.featuredHeadline || "Historic Global Milestones, World Events & Groundbreaking Inventions");
          setDateString(data.formattedDate || "Today");
          setLoading(false);
        }
      });
    };

    loadData();

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
  }, [effectiveLang, countryCode]);

  const handleExportQuickPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const data = await fetchDayInHistory(new Date(), effectiveLang, countryCode);
      if (data) {
        generateHistoryWorksheetPdf(data);
      }
    } catch (err) {
      console.error("Failed to generate quick history worksheet:", err);
    }
  };

  return (
    <div
      id="card-today-in-history-hub"
      onClick={onOpenHistoryModal}
      className={`relative group rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#0A0F1D] via-[#0d1629] to-[#0A0F1D] border border-blue-500/25 hover:border-amber-500/60 shadow-xl hover:shadow-amber-500/15 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer ${className}`}
      role="region"
      aria-label={title}
    >
      {/* Ambient Gold/Amber Glow */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/20 transition-all duration-500"
        aria-hidden="true"
      />

      <div className="space-y-4 relative z-10">
        {/* Header Micro-Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs">
              <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{badge}</span>
            </span>
            <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Live Daily Feed</span>
            </span>
          </div>

          <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">100% Client-Side Knowledge Feed</span>
          </span>
        </div>

        {/* Title, Icon & Localized Date */}
        <div className="flex items-start space-x-3.5 sm:space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform duration-200">
            {icon ? (
              <span className="text-2xl leading-none select-none" aria-hidden="true">
                {icon}
              </span>
            ) : (
              <Calendar className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="inline-flex items-center text-rose-400 font-semibold">
                <MapPin className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                {countryName}
              </span>
              <span>•</span>
              <span className="text-slate-200 font-semibold">
                {dateString || new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}
              </span>
              <span>•</span>
              <span className="text-cyan-400 font-mono text-[11px]">
                {geoResult?.detectedLanguage?.nativeName || "English"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Live Headline Box */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/25 hover:border-amber-500/40 text-xs space-y-1.5 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Today&apos;s Milestones &amp; Historic Discoveries</span>
          </div>
          <p className="font-semibold text-slate-100 sm:text-sm line-clamp-2 leading-relaxed">
            {featuredHeadline}
          </p>
        </div>

        {/* Micro-Features Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-300">
          <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] truncate">
              Localized in <strong>30 Languages</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
            <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] truncate">
              Daily Quiz &amp; Printable Study Worksheet
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="pt-5 mt-6 border-t border-slate-800/80 flex items-center justify-between gap-3 relative z-10">
        <button
          type="button"
          onClick={handleExportQuickPdf}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
          title={t("chronicles.exportPdfTitle", "Download printable study worksheet PDF")}
        >
          <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t("chronicles.exportPdf", "Export PDF")}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenHistoryModal();
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/25 flex items-center space-x-2 transition group-hover:scale-102 active:scale-95 cursor-pointer"
        >
          <span>{ctaText}</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[3] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
