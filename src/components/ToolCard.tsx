import React from "react";
import {
  Star,
  Sparkles,
  Flame,
  ArrowRight,
  GraduationCap,
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
  Trash2,
  FileSpreadsheet,
  Edit3,
  Highlighter,
  PenTool,
  Stamp,
  Eraser,
  Hash,
  AlignVerticalSpaceAround,
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
  RefreshCw,
  Sliders,
  Shield,
} from "lucide-react";
import { ToolItem } from "../types";
import { ToolRating } from "./ToolRating";
import { QuickTipTooltip } from "./QuickTipTooltip";
import { ProFeatureIcon } from "./ProFeatureIcon";
import { ProFeatureBadge } from "./ProFeatureBadge";
import { useLanguage } from "../lib/i18n";

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
  AlignVerticalSpaceAround,
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

interface ToolCardProps {
  tool: ToolItem;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, toolId: string) => void;
  onSelectTool: (tool: ToolItem) => void;
  isMostPopular?: boolean;
  usageFormatted?: string;
  ratingState?: {
    avgRating: number;
    totalRatings: number;
    userRating?: number;
  };
  onRateTool?: (toolId: string, rating: number) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isFavorite,
  onToggleFavorite,
  onSelectTool,
  isMostPopular,
  usageFormatted,
  ratingState,
  onRateTool,
}) => {
  const { t } = useLanguage();
  const IconComponent = ICON_MAP[tool.icon] || FileText;

  const translatedName = t(`tools.${tool.id}.name`, tool.name);
  const translatedDesc = t(`tools.${tool.id}.desc`, tool.description);

  const inputLabel =
    tool.supportedInput && tool.supportedInput.length > 0
      ? tool.supportedInput.map((i) => i.replace(".", "").toUpperCase()).slice(0, 2).join("/")
      : "PDF";

  const fullAriaDescription = `${translatedName}, ${tool.category} category tool. ${translatedDesc} Input format: ${inputLabel}. Output format: ${tool.outputFormat}.${
    tool.isPro ? " Pro feature." : ""
  }${tool.isAi ? " AI powered." : ""}${tool.isStudentFavorite ? " Student essential." : ""}${
    isMostPopular ? " Most popular tool." : ""
  }${ratingState ? ` Rating ${ratingState.avgRating.toFixed(1)} out of 5 stars with ${ratingState.totalRatings} ratings.` : ""}${
    isFavorite ? " Currently in favorites." : " Not in favorites."
  } Press Enter or Space to open tool.`;

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      // Avoid triggering when focused on inner interactive controls (like buttons)
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" || target.closest("button") || target.tagName === "A") {
        return;
      }
      e.preventDefault();
      onSelectTool(tool);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={fullAriaDescription}
      aria-roledescription="PDF tool card"
      aria-haspopup="dialog"
      data-category={tool.category}
      onClick={() => onSelectTool(tool)}
      onKeyDown={handleCardKeyDown}
      className="btn-interactive group relative bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 hover:border-orange-500 dark:hover:border-amber-500 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between space-x-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-amber-950/40 border border-orange-100 dark:border-amber-900/40 text-orange-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white transition duration-200 shadow-xs"
            aria-hidden="true"
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap justify-end gap-y-1">
            <QuickTipTooltip toolId={tool.id} variant="tooltip" />

            {ratingState && onRateTool && (
              <ToolRating
                toolId={tool.id}
                toolName={tool.name}
                avgRating={ratingState.avgRating}
                totalRatings={ratingState.totalRatings}
                userRating={ratingState.userRating}
                onRate={onRateTool}
                size="sm"
              />
            )}

            {isMostPopular && (
              <span
                role="status"
                aria-label="Most popular tool"
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-600 dark:text-amber-400 border border-orange-500/30"
                title={t("badges.mostPopular", "Most Popular Tool")}
              >
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500 shrink-0" aria-hidden="true" />
                <span>{t("badges.mostPopular", "Most Popular")}</span>
              </span>
            )}

            {tool.isPro && (
              <ProFeatureIcon variant="pill" size="xs" label={t("badges.pro", "PRO")} />
            )}

            {tool.isAi && (
              <span
                role="status"
                aria-label="AI powered tool"
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              >
                <Sparkles className="w-3 h-3 text-amber-500" aria-hidden="true" />
                <span>{t("badges.ai", "AI")}</span>
              </span>
            )}

            {tool.isStudentFavorite && (
              <span
                role="status"
                aria-label="Student favorite tool"
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                title={t("badges.student", "Student Essential")}
              >
                <GraduationCap className="w-3 h-3 mr-0.5" aria-hidden="true" />
                <span>{t("badges.student", "Student")}</span>
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(e, tool.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onToggleFavorite(e as any, tool.id);
                }
              }}
              aria-label={isFavorite ? `Remove ${translatedName} from favorites` : `Add ${translatedName} to favorites`}
              aria-pressed={isFavorite}
              className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
              title={isFavorite ? t("favorites.remove", "Remove from favorites") : t("favorites.add", "Add to favorites")}
            >
              <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Title & Badge */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-amber-400 transition">
              {translatedName}
            </h3>
            {tool.isPro && (
              <ProFeatureBadge size="xs" tooltip={t("badges.proTooltip", "Pro Feature - Enterprise PDF Processing")} />
            )}
            {Boolean(tool.badge) && typeof tool.badge === "string" && (
              <span
                role="status"
                aria-label={`Badge: ${tool.badge}`}
                className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-orange-500 text-white"
              >
                {t(`badges.${tool.badge.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, tool.badge)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {translatedDesc}
          </p>
        </div>
      </div>

      {/* Footer Info & Arrow */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-1 font-bold" aria-label={`Input format: ${inputLabel}, Output format: ${tool.outputFormat}`}>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
            {inputLabel}
          </span>
          <ArrowRight className="w-3 h-3 text-orange-500 shrink-0" aria-hidden="true" />
          <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-amber-950/50 text-orange-700 dark:text-amber-300 border border-orange-200/50 dark:border-amber-800/40 font-mono text-[10px]">
            {tool.outputFormat}
          </span>
        </div>
        <span className="flex items-center space-x-1 font-bold text-orange-600 dark:text-amber-400 group-hover:translate-x-1 transition shrink-0 ml-2" aria-hidden="true">
          <span>{t("tools.openTool", "Open Tool")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
