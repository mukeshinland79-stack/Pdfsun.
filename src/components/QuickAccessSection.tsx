import React, { useState, useRef, useMemo } from "react";
import {
  Flame,
  Zap,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Trash2,
  SlidersHorizontal,
  ArrowRight,
  Combine,
  Scissors,
  Minimize2,
  FileText,
  FileType,
  Sheet,
  Table,
  Presentation,
  Film,
  Image,
  FileImage,
  ImagePlus,
  Images,
  Code,
  Bot,
  Languages,
  Briefcase,
  Layers,
  BookOpen,
  ScanText,
  CheckCheck,
  HelpCircle,
  LayoutGrid,
  RotateCw,
  Crop,
  FileSpreadsheet,
  Edit3,
  Highlighter,
  PenTool,
  Stamp,
  Eraser,
  Hash,
  Palette,
  Lock,
  Unlock,
  ShieldAlert,
  Wrench,
  Layers3,
  GitCompare,
  Eye,
  FileSearch,
  Boxes,
  Camera,
  ImageDown,
  Info,
  Archive,
  BookMarked,
  FileCode,
  AlignLeft,
  FileCode2,
  Share2,
  Grid,
  GraduationCap,
  RefreshCw,
  Sliders,
  Shield,
} from "lucide-react";
import { ToolItem } from "../types";
import { useLanguage } from "../lib/i18n";
import { useUserInteractionHistory } from "../hooks/useUserInteractionHistory";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Combine,
  Scissors,
  Minimize2,
  FileText,
  FileType,
  Sheet,
  Table,
  Presentation,
  Film,
  Image,
  FileImage,
  ImagePlus,
  Images,
  Code,
  Bot,
  Sparkles,
  Languages,
  Briefcase,
  Layers,
  BookOpen,
  ScanText,
  CheckCheck,
  HelpCircle,
  LayoutGrid,
  RotateCw,
  Crop,
  Trash2,
  FileSpreadsheet,
  Edit3,
  Highlighter,
  PenTool,
  Stamp,
  Eraser,
  Hash,
  Palette,
  Lock,
  Unlock,
  ShieldAlert,
  Wrench,
  Layers3,
  GitCompare,
  Eye,
  FileSearch,
  Boxes,
  Camera,
  ImageDown,
  Info,
  Archive,
  BookMarked,
  FileCode,
  AlignLeft,
  FileCode2,
  Share2,
  Grid,
  GraduationCap,
  Flame,
  RefreshCw,
  Sliders,
  Shield,
};

export type QuickAccessTab = "popular" | "personal" | "favorites" | "ai";

interface QuickAccessSectionProps {
  allTools: ToolItem[];
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, toolId: string) => void;
  onSelectTool: (tool: ToolItem) => void;
  sortByPopularity: boolean;
  onToggleSortByPopularity: () => void;
  getFormattedUsage: (toolId: string) => string;
  isMostPopular: (toolId: string) => boolean;
}

export const QuickAccessSection: React.FC<QuickAccessSectionProps> = ({
  allTools,
  favorites,
  onToggleFavorite,
  onSelectTool,
  sortByPopularity,
  onToggleSortByPopularity,
  getFormattedUsage,
  isMostPopular,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<QuickAccessTab>("popular");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    interactions,
    recordInteraction,
    clearHistory,
    frequentlyUsedTools,
    recentlyUsedTools,
    hasPersonalHistory,
    formatTimeAgo,
  } = useUserInteractionHistory();

  // Compute displayed tools based on selected active quick access tab
  const displayedQuickTools = useMemo<ToolItem[]>(() => {
    // Filter out internal admin/owner tools
    const publicTools = allTools.filter(
      (tool) =>
        (tool.category as string).toLowerCase() !== "owner" &&
        (tool.category as string).toLowerCase() !== "admin"
    );

    if (activeTab === "popular") {
      // Top 10 most popular tools
      return publicTools
        .filter((tool) => isMostPopular(tool.id) || tool.isPopular)
        .slice(0, 10);
    }

    if (activeTab === "personal") {
      // Personal history tools
      return frequentlyUsedTools.slice(0, 10);
    }

    if (activeTab === "favorites") {
      const favSet = new Set(favorites);
      const favTools = publicTools.filter((t) => favSet.has(t.id));
      return favTools.length > 0
        ? favTools
        : publicTools.slice(0, 6); // Fallback if no favorites
    }

    if (activeTab === "ai") {
      return publicTools.filter((t) => t.isAi).slice(0, 10);
    }

    return publicTools.slice(0, 8);
  }, [activeTab, allTools, favorites, frequentlyUsedTools, isMostPopular]);

  // Scroll carousel left / right
  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleToolClick = (tool: ToolItem) => {
    recordInteraction(tool.id);
    onSelectTool(tool);
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/80 dark:to-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            {activeTab === "popular" ? (
              <Flame className="w-4 h-4" />
            ) : activeTab === "personal" ? (
              <Zap className="w-4 h-4" />
            ) : activeTab === "favorites" ? (
              <Star className="w-4 h-4 fill-white" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                {activeTab === "popular"
                  ? t("quickAccess.popularTitle", "Popular Tools")
                  : activeTab === "personal"
                  ? t("quickAccess.personalTitle", "Your Quick Access")
                  : activeTab === "favorites"
                  ? t("quickAccess.favoritesTitle", "Your Starred Favorites")
                  : t("quickAccess.aiTitle", "AI Smart Tools")}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-amber-400 border border-orange-500/20">
                {displayedQuickTools.length} {t("quickAccess.available", "Available")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeTab === "popular"
                ? t("quickAccess.popularDesc", "Most frequently used enterprise PDF converters & utilities")
                : activeTab === "personal"
                ? hasPersonalHistory
                  ? t("quickAccess.personalDescWithHistory", "Ranked dynamically based on your personal usage history on this device")
                  : t("quickAccess.personalDescNew", "Recommended toolkit for your workflow. Tools you use will appear here automatically.")
                : activeTab === "favorites"
                ? t("quickAccess.favoritesDesc", "Instant 1-click launchpad for your pinned favorite utilities")
                : t("quickAccess.aiDesc", "Next-gen intelligent PDF analysis, translation, OCR, and summarization")}
            </p>
          </div>
        </div>

        {/* Action Controls: Popularity Grid Sort & Clear History */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {activeTab === "personal" && hasPersonalHistory && (
            <button
              onClick={clearHistory}
              title="Reset personal interaction history"
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t("quickAccess.clearHistory", "Reset History")}</span>
            </button>
          )}

          <button
            onClick={onToggleSortByPopularity}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
              sortByPopularity
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/20"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Toggle sorting the entire PDF tool catalog by highest usage and popularity"
          >
            <TrendingUp className={`w-3.5 h-3.5 ${sortByPopularity ? "text-white" : "text-orange-500"}`} />
            <span>
              {sortByPopularity
                ? t("quickAccess.sortedByPopularity", "Sorted: Most Popular")
                : t("quickAccess.sortByPopularity", "Sort Grid by Popularity")}
            </span>
          </button>
        </div>
      </div>

      {/* Segmented Quick Access Category Tabs & Carousel Navigation */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("popular")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "popular"
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{t("quickAccess.tabPopular", "🔥 Popular Tools")}</span>
          </button>

          <button
            onClick={() => setActiveTab("personal")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "personal"
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t("quickAccess.tabPersonal", "⚡ My Quick Access")}</span>
            {hasPersonalHistory && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "favorites"
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeTab === "favorites" ? "fill-white" : ""}`} />
            <span>
              {t("quickAccess.tabFavorites", "⭐ Favorites")} ({favorites.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "ai"
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("quickAccess.tabAi", "✨ AI Smart Suite")}</span>
          </button>
        </div>

        {/* Carousel Prev / Next Buttons */}
        <div className="hidden sm:flex items-center space-x-1 shrink-0">
          <button
            onClick={() => handleScroll("left")}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            aria-label="Scroll tools left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            aria-label="Scroll tools right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel of Quick Access Tool Cards */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch space-x-3 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x snap-mandatory"
      >
        {displayedQuickTools.map((tool) => {
          const IconComp = ICON_MAP[tool.icon] || FileText;
          const isFav = favorites.includes(tool.id);
          const personalRecord = interactions[tool.id];
          const isTopPopular = isMostPopular(tool.id) || tool.isPopular;

          const translatedName = t(`tools.${tool.id}.name`, tool.name);
          const translatedDesc = t(`tools.${tool.id}.desc`, tool.description);

          return (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className="group relative flex-none w-[260px] sm:w-[280px] snap-start bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700/80 hover:border-amber-500 dark:hover:border-amber-500/80 shadow-xs hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Top Row: Icon + Badges + Star */}
                <div className="flex items-start justify-between space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-amber-950/40 border border-orange-100 dark:border-amber-900/40 text-orange-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white transition duration-200 shadow-xs">
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div className="flex items-center space-x-1.5 flex-wrap justify-end">
                    {/* Status Badge: Personal usage count or Community Popularity */}
                    {personalRecord && personalRecord.count > 0 ? (
                      <span
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        title={`You have used this tool ${personalRecord.count} time(s). Last used ${formatTimeAgo(personalRecord.lastUsed)}.`}
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        <span>{personalRecord.count}x used</span>
                      </span>
                    ) : isTopPopular ? (
                      <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/10 text-orange-600 dark:text-amber-400 border border-orange-500/20">
                        <Flame className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                        <span>{getFormattedUsage(tool.id)}</span>
                      </span>
                    ) : null}

                    {tool.isAi && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        AI
                      </span>
                    )}

                    <button
                      onClick={(e) => onToggleFavorite(e, tool.id)}
                      className="p-1 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Tool Title & Summary */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-amber-400 transition line-clamp-1">
                    {translatedName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-0.5">
                    {translatedDesc}
                  </p>
                </div>
              </div>

              {/* Bottom Quick Launch Link */}
              <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-mono font-bold">
                  {tool.supportedInput && tool.supportedInput.length > 0
                    ? tool.supportedInput[0].replace(".", "").toUpperCase()
                    : "PDF"}{" "}
                  → {tool.outputFormat}
                </span>

                <span className="flex items-center space-x-1 font-bold text-orange-600 dark:text-amber-400 group-hover:translate-x-1 transition">
                  <span>{t("quickAccess.launch", "Launch")}</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
