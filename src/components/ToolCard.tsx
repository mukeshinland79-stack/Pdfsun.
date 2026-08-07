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

  return (
    <div
      onClick={() => onSelectTool(tool)}
      className="btn-interactive group relative bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 hover:border-orange-500 dark:hover:border-amber-500 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between space-x-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-amber-950/40 border border-orange-100 dark:border-amber-900/40 text-orange-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white transition duration-200 shadow-xs">
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
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-600 dark:text-amber-400 border border-orange-500/30"
                title={t("badges.mostPopular", "Most Popular Tool")}
              >
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500 shrink-0" />
                <span>{t("badges.mostPopular", "Most Popular")}</span>
              </span>
            )}

            {tool.isPro && (
              <ProFeatureIcon variant="pill" size="xs" label={t("badges.pro", "PRO")} />
            )}

            {tool.isAi && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{t("badges.ai", "AI")}</span>
              </span>
            )}

            {tool.isStudentFavorite && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20" title={t("badges.student", "Student Essential")}>
                <GraduationCap className="w-3 h-3 mr-0.5" />
                <span>{t("badges.student", "Student")}</span>
              </span>
            )}

            <button
              onClick={(e) => onToggleFavorite(e, tool.id)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title={isFavorite ? t("favorites.remove", "Remove from favorites") : t("favorites.add", "Add to favorites")}
            >
              <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
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
            {tool.badge && (
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-orange-500 text-white">
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
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5 font-medium text-slate-400">
          <span>{t("tools.outputFormat", "Output")}: {tool.outputFormat}</span>
          {usageFormatted && (
            <span className="text-[10px] font-semibold text-orange-600/80 dark:text-amber-400/80">
              • {usageFormatted}
            </span>
          )}
        </div>
        <span className="flex items-center space-x-1 font-bold text-orange-600 dark:text-amber-400 group-hover:translate-x-1 transition">
          <span>{t("tools.openTool", "Open Tool")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
