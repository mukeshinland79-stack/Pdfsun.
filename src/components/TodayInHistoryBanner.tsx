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
  HelpCircle,
  Flame,
} from "lucide-react";
import { SupportedLanguage, GeoDetectionResult } from "../types/history";
import { fetchDayInHistory } from "../services/historyService";
import { generateHistoryWorksheetPdf } from "../utils/historyPdfGenerator";
import { getHistoryText } from "../data/historyData";

interface TodayInHistoryBannerProps {
  geoResult: GeoDetectionResult;
  onOpenHistoryModal: () => void;
}

export const TodayInHistoryBanner: React.FC<TodayInHistoryBannerProps> = ({
  geoResult,
  onOpenHistoryModal,
}) => {
  const [featuredHeadline, setFeaturedHeadline] = useState<string>("Historic Global Milestones & Groundbreaking Inventions");
  const [dateString, setDateString] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const now = new Date();
    fetchDayInHistory(now, geoResult.detectedLanguage.code, geoResult.detectedCountryCode).then((data) => {
      if (isMounted && data) {
        setFeaturedHeadline(data.featuredHeadline);
        setDateString(data.formattedDate);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [geoResult]);

  const handleExportQuickPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const data = await fetchDayInHistory(new Date(), geoResult.detectedLanguage.code, geoResult.detectedCountryCode);
    if (data) {
      generateHistoryWorksheetPdf(data);
    }
  };

  const langCode = geoResult.detectedLanguage.code;

  return (
    <section
      className="my-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      aria-label="Today in History and Daily Knowledge Hub"
    >
      <div
        onClick={onOpenHistoryModal}
        className="relative group rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-slate-900 via-indigo-950/90 to-blue-950 border border-blue-500/30 hover:border-blue-400 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
      >
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/25 transition-all" />

        <div className="flex items-start space-x-4 z-10 max-w-3xl">
          {/* Calendar Graphic Icon */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-1.5">
            {/* Geo & Language Auto-Detected Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Globe className="w-3 h-3 mr-1" />
                {geoResult.detectedLanguage.nativeName} ({geoResult.detectedLanguage.name})
              </span>

              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                <MapPin className="w-3 h-3 text-rose-400 mr-0.5" />
                {geoResult.detectedCountryName} • {dateString || "Today"}
              </span>

              <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Award className="w-3 h-3 mr-0.5" />
                Daily Quiz & PDF
              </span>
            </div>

            {/* Title & Headline */}
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-200 transition-colors">
              {getHistoryText("todayInHistory", langCode)}: <span className="font-medium text-slate-200">{featuredHeadline}</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Explore global milestones, famous birthdays & solve today&apos;s trivia challenge in 30 languages.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 z-10 w-full md:w-auto justify-end">
          <button
            onClick={handleExportQuickPdf}
            className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center space-x-1.5 border border-white/15"
            title="Download Study Sheet PDF"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Export Study PDF</span>
          </button>

          <button
            onClick={onOpenHistoryModal}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 flex items-center space-x-1.5 transition group-hover:scale-102"
          >
            <span>Explore History</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
