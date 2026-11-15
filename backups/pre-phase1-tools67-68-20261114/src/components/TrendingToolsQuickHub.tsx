import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  Combine,
  Minimize2,
  FileType,
  Sparkles,
  Edit3,
  ArrowRight,
  Zap,
  ShieldCheck,
  CheckCircle2,
  X,
  FileCheck,
} from "lucide-react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

interface TrendingToolsQuickHubProps {
  onSelectTool: (tool: ToolItem) => void;
  className?: string;
}

interface FeaturedToolDef {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  icon: React.ReactNode;
  iconBg: string;
  accentBorder: string;
}

const FEATURED_TOP_TOOLS: FeaturedToolDef[] = [
  {
    id: "merge-pdf",
    name: "Merge PDF",
    badge: "Most Used",
    tagline: "Combine multiple PDFs in custom order",
    icon: <Combine className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    iconBg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    accentBorder: "hover:border-blue-500 dark:hover:border-blue-400",
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    badge: "Save Space",
    tagline: "Reduce file size up to 90% without quality loss",
    icon: <Minimize2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    accentBorder: "hover:border-emerald-500 dark:hover:border-emerald-400",
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    badge: "Editable DOCX",
    tagline: "Convert PDF to editable Word document",
    icon: <FileType className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    iconBg: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    accentBorder: "hover:border-indigo-500 dark:hover:border-indigo-400",
  },
  {
    id: "ai-pdf-summary",
    name: "AI Summarizer",
    badge: "AI Powered",
    tagline: "Extract instant insights & bullet executive summary",
    icon: <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    iconBg: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
    accentBorder: "hover:border-purple-500 dark:hover:border-purple-400",
  },
  {
    id: "edit-pdf",
    name: "PDF Editor",
    badge: "Direct Edit",
    tagline: "Add text, annotations, signatures & highlights",
    icon: <Edit3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    iconBg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    accentBorder: "hover:border-amber-500 dark:hover:border-amber-400",
  },
];

/**
 * Trending PDF & AI Tools Quick-Hub
 * Zero Blank-Space Engagement Booster:
 * - Clean, lightweight replacement for unapproved ad container below knowledge hub / header
 * - Responsive horizontal carousel / grid displaying 5 top-tier tools
 * - Real-time Tool Filter Search Bar across all 66+ tools
 * - Strict zero layout shift & Core Web Vitals optimized
 */
export const TrendingToolsQuickHub: React.FC<TrendingToolsQuickHubProps> = ({
  onSelectTool,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Map of quick tools from ALL_TOOLS data
  const resolvedTools = useMemo(() => {
    return FEATURED_TOP_TOOLS.map((def) => {
      const toolObj = ALL_TOOLS.find((t) => t.id === def.id || t.slug === def.id);
      return {
        def,
        toolObj: toolObj || ({
          id: def.id,
          name: def.name,
          slug: def.id,
          description: def.tagline,
          icon: "FileText",
          category: "convert",
          supportedInput: [".pdf"],
          outputFormat: "PDF",
        } as ToolItem),
      };
    });
  }, []);

  // Filter all 66+ tools for real-time search dropdown
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const handleLaunchTool = (tool: ToolItem) => {
    setSearchQuery("");
    onSelectTool(tool);
  };

  return (
    <section
      className={`engagement-replacement-slot relative rounded-3xl p-4 sm:p-6 lg:p-7 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all ${className}`}
      aria-label="Trending PDF and AI Tools Quick Hub"
    >
      {/* Top 2px Gradient Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500 z-10" />

      {/* Header & Real-Time Tool Filter Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 sm:mb-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Trending Utilities</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              • 66+ Free Tools • No Sign-up Required
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Trending PDF & AI Tools Quick-Hub
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Select a popular tool below or search any of our 66+ client-side document utilities.
          </p>
        </div>

        {/* Real-time Tool Filter Search Bar */}
        <div className="relative w-full lg:w-96 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 66+ Free PDF & Knowledge Tools..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition shadow-inner"
              aria-label="Search 66+ Free PDF & Knowledge Tools"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Real-Time Search Results Dropdown Flyout */}
          {searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-fadeIn">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Matching Tools ({filteredTools.length})</span>
                <span>Click to Open</span>
              </div>

              {filteredTools.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  No tools found matching &ldquo;{searchQuery}&rdquo;. Try another term like &ldquo;PDF&rdquo;, &ldquo;Word&rdquo;, or &ldquo;Compress&rdquo;.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {filteredTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleLaunchTool(tool)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-blue-50/70 dark:hover:bg-slate-800/90 transition text-left cursor-pointer group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                          <span>{tool.name}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5 Top-Tier Tools: Responsive Horizontal Carousel on Mobile / 5-Col Grid on Desktop */}
      <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 overflow-x-auto pb-2 sm:pb-0 snap-x no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
        {resolvedTools.map(({ def, toolObj }) => (
          <div
            key={def.id}
            onClick={() => handleLaunchTool(toolObj)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleLaunchTool(toolObj);
              }
            }}
            className={`min-w-[210px] sm:min-w-0 flex-1 snap-start rounded-2xl p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:shadow-lg hover:-translate-y-0.5 ${def.accentBorder}`}
          >
            <div>
              {/* Header: Icon & Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${def.iconBg}`}
                >
                  {def.icon}
                </div>

                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {def.badge}
                </span>
              </div>

              {/* Title & Tagline */}
              <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-1">
                {def.name}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                {def.tagline}
              </p>
            </div>

            {/* Launch CTA */}
            <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
              <span>Open Tool</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Trust Indicators Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Client-Side Private</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Files Auto-Deleted</span>
          </span>
          <span className="flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>No File Size Restrictions</span>
          </span>
        </div>

        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden md:inline">
          PDFSun Core Utility Engine
        </span>
      </div>
    </section>
  );
};
