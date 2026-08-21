import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Grid,
  GraduationCap,
  Sparkles,
  Flame,
  RefreshCw,
  Sliders,
  Shield,
  Wrench,
  Crown,
  Search,
  Filter,
} from "lucide-react";
import { ToolItem, CategoryId } from "../types";
import { ALL_TOOLS, CATEGORIES } from "../data/toolsData";
import { LazyToolCard } from "./LazyToolCard";
import { VirtualizedToolGrid } from "./VirtualizedToolGrid";
import { useUsageAnalytics } from "../hooks/useUsageAnalytics";
import { useToolRatings } from "../hooks/useToolRatings";
import { useLanguage } from "../lib/i18n";

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Grid,
  GraduationCap,
  Sparkles,
  Flame,
  RefreshCw,
  Sliders,
  Shield,
  Wrench,
  Crown,
};

interface ToolGridProps {
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, toolId: string) => void;
  onSelectTool: (tool: ToolItem) => void;
  selectedCategory: CategoryId;
  setSelectedCategory: (cat: CategoryId) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onPageChange?: (page: number, totalPages: number) => void;
  popularTools?: ToolItem[];
}

const USAGE_STORAGE_KEY = "pdfsun_tool_usage_frequency";

export const ToolGrid: React.FC<ToolGridProps> = ({
  favorites,
  onToggleFavorite,
  onSelectTool,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onPageChange,
  popularTools,
}) => {
  const { t } = useLanguage();
  const { isMostPopular, getFormattedUsage, trackToolUsage } = useUsageAnalytics();
  const { getToolRating, rateTool } = useToolRatings();

  // Track tool usage frequency in localStorage
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(USAGE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"virtualized" | "infinite" | "paged">("virtualized");
  const [visibleCount, setVisibleCount] = useState(16);
  const pageSize = 16;

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Synchronize localStorage usage frequency updates across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USAGE_STORAGE_KEY && e.newValue) {
        try {
          setUsageCounts(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Record tool usage frequency to localStorage and trigger analytics
  const handleToolSelect = (tool: ToolItem) => {
    try {
      const updated = {
        ...usageCounts,
        [tool.id]: (usageCounts[tool.id] || 0) + 1,
      };
      setUsageCounts(updated);
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to store tool usage frequency:", e);
    }
    trackToolUsage(tool.id);
    onSelectTool(tool);
  };

  // Compute Top 5 frequently used tools from localStorage frequency tracking
  const top5FrequentTools = useMemo<ToolItem[]>(() => {
    if (popularTools && popularTools.length > 0) {
      return popularTools.slice(0, 5);
    }

    const publicTools = ALL_TOOLS.filter(
      (t) =>
        (t.category as string).toLowerCase() !== "owner" &&
        (t.category as string).toLowerCase() !== "admin"
    );

    const trackedEntries = Object.entries(usageCounts).filter(([_, count]) => count > 0);

    if (trackedEntries.length > 0) {
      const sortedByUsage = [...publicTools].sort((a, b) => {
        const countA = usageCounts[a.id] || 0;
        const countB = usageCounts[b.id] || 0;
        if (countB !== countA) return countB - countA;
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      });
      return sortedByUsage.slice(0, 5);
    }

    // Default fallback to top popular tools
    return publicTools
      .filter((t) => isMostPopular(t.id) || t.isPopular)
      .slice(0, 5);
  }, [popularTools, usageCounts, isMostPopular]);

  // Reset page & visible count when category or search query changes
  React.useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(16);
  }, [selectedCategory, searchQuery]);

  // Ensure only public categories are available in the public category filter bar
  const publicCategories = useMemo(() => {
    return CATEGORIES.filter(
      (cat) =>
        (cat.id as string).toLowerCase() !== "owner" &&
        (cat.id as string).toLowerCase() !== "admin"
    );
  }, []);

  // Filter tools based on category and search query
  const filteredTools = useMemo(() => {
    if (selectedCategory === "popular" && !searchQuery.trim()) {
      return top5FrequentTools;
    }

    return ALL_TOOLS.filter((tool) => {
      // Exclude internal admin tools from the public toolkit grid
      if (
        (tool.category as string).toLowerCase() === "owner" ||
        (tool.category as string).toLowerCase() === "admin"
      ) {
        return false;
      }

      // Category match
      let matchesCategory = true;
      if (selectedCategory === "student") matchesCategory = !!tool.isStudentFavorite;
      else if (selectedCategory === "ai") matchesCategory = !!tool.isAi;
      else if (selectedCategory === "popular") {
        matchesCategory =
          top5FrequentTools.some((t) => t.id === tool.id) ||
          isMostPopular(tool.id) ||
          !!tool.isPopular;
      } else if (selectedCategory !== "all") {
        matchesCategory = tool.category === selectedCategory;
      }

      // Search query match
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch =
          (tool.name || "").toLowerCase().includes(q) ||
          (tool.description || "").toLowerCase().includes(q) ||
          (tool.outputFormat || "").toLowerCase().includes(q) ||
          (tool.supportedInput || []).some((ext) => (ext || "").toLowerCase().includes(q));
      }

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, top5FrequentTools, isMostPopular]);

  // Observer for infinite scroll mode
  useEffect(() => {
    if (viewMode !== "infinite" || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(filteredTools.length, prev + 16));
        }
      },
      { rootMargin: "300px 0px", threshold: 0.01 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [viewMode, filteredTools.length, visibleCount]);

  const totalPages = Math.ceil(filteredTools.length / pageSize) || 1;

  const onPageChangeRef = React.useRef(onPageChange);
  React.useEffect(() => {
    onPageChangeRef.current = onPageChange;
  });

  const lastNotifiedPageRef = React.useRef<{ page: number; totalPages: number } | null>(null);

  React.useEffect(() => {
    const last = lastNotifiedPageRef.current;
    if (!last || last.page !== currentPage || last.totalPages !== totalPages) {
      lastNotifiedPageRef.current = { page: currentPage, totalPages };
      if (onPageChangeRef.current) {
        onPageChangeRef.current(currentPage, totalPages);
      }
    }
  }, [currentPage, totalPages]);

  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTools.slice(start, start + pageSize);
  }, [filteredTools, currentPage, pageSize]);

  const displayedTools = useMemo(() => {
    if (viewMode === "infinite") {
      return filteredTools.slice(0, visibleCount);
    }
    return paginatedTools;
  }, [viewMode, filteredTools, visibleCount, paginatedTools]);

  // Keyboard navigation for category tabs
  const handleCategoryKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (index + 1) % publicCategories.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (index - 1 + publicCategories.length) % publicCategories.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = publicCategories.length - 1;
    } else {
      return;
    }

    const nextCategory = publicCategories[nextIndex];
    if (nextCategory) {
      setSelectedCategory(nextCategory.id as CategoryId);
      const tabElement = document.getElementById(`tab-${nextCategory.id}`);
      tabElement?.focus();
    }
  };

  return (
    <section
      id="tools"
      aria-labelledby="toolkit-heading"
      className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5"
    >
      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Showing ${filteredTools.length} tools for ${
          selectedCategory === "all" ? "All Tools" : selectedCategory
        } category${searchQuery ? ` matching "${searchQuery}"` : ""}.`}
      </div>

      {/* Category Tabs Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 id="toolkit-heading" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t("toolkit.title", "Comprehensive PDF Toolkit")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("toolkit.subtitle", `${ALL_TOOLS.length} enterprise working tools for students, lawyers, researchers, and professionals.`)}
          </p>
        </div>

        {/* Live Filter Counter, View Mode & Search Bar */}
        <div className="w-full md:w-auto flex flex-wrap items-center space-x-2 gap-y-2" role="search">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              role="searchbox"
              aria-label={t("toolkit.filterPlaceholder", `Filter ${ALL_TOOLS.length} tools...`)}
              aria-controls="tools-grid-view"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("toolkit.filterPlaceholder", `Filter ${ALL_TOOLS.length} tools...`)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>

          <div
            className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            role="group"
            aria-label="Grid layout view options"
          >
            <button
              type="button"
              onClick={() => setViewMode("virtualized")}
              aria-pressed={viewMode === "virtualized"}
              aria-label="Virtualized grid view"
              className={`px-2.5 py-1 rounded-lg transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer ${
                viewMode === "virtualized"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Virtualized grid rendering with react-window"
            >
              Virtualized
            </button>
            <button
              type="button"
              onClick={() => setViewMode("infinite")}
              aria-pressed={viewMode === "infinite"}
              aria-label="Lazy load scroll view"
              className={`px-2.5 py-1 rounded-lg transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer ${
                viewMode === "infinite"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Auto-load tools as you scroll"
            >
              Lazy Load
            </button>
            <button
              type="button"
              onClick={() => setViewMode("paged")}
              aria-pressed={viewMode === "paged"}
              aria-label="Paginated view"
              className={`px-2.5 py-1 rounded-lg transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer ${
                viewMode === "paged"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Paginated view mode"
            >
              Paged
            </button>
          </div>

          <div
            id="tools-count-status"
            role="status"
            aria-live="polite"
            className="px-3 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-amber-400 text-xs font-bold whitespace-nowrap"
          >
            {filteredTools.length} {t("toolkit.toolsCount", "Tools")}
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar with Keyboard Navigation */}
      <div
        role="tablist"
        aria-label="Tool categories filter"
        className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none"
      >
        {publicCategories.map((cat, idx) => {
          const IconComp = CATEGORY_ICONS[cat.icon] || Grid;
          const isActive = selectedCategory === cat.id;
          const categoryLabel = t(`categories.${cat.id}`, cat.label);

          return (
            <button
              key={cat.id}
              id={`tab-${cat.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls="tools-grid-view"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setSelectedCategory(cat.id as CategoryId)}
              onKeyDown={(e) => handleCategoryKeyDown(e, idx)}
              aria-label={`${categoryLabel} category${isActive ? ", selected" : ""}`}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition duration-200 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? "text-white" : "text-orange-500"}`} aria-hidden="true" />
              <span>{categoryLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Popular Top 5 Highlight Banner */}
      {selectedCategory === "popular" && (
        <section
          aria-label="Top 5 Most Popular Tools"
          className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900 border border-orange-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20"
              aria-hidden="true"
            >
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {t("toolkit.top5Title", "Top 5 Most Popular Tools")}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white shadow-xs">
                  {top5FrequentTools.length} Ranked
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {Object.keys(usageCounts).length > 0
                  ? t("toolkit.top5DescPersonal", "Dynamically ranked based on your personal device usage frequency and community trends.")
                  : t("toolkit.top5DescDefault", "Most loved, high-speed PDF tools by millions of global users.")}
              </p>
            </div>
          </div>
          {Object.keys(usageCounts).length > 0 && (
            <button
              type="button"
              onClick={() => {
                setUsageCounts({});
                localStorage.removeItem(USAGE_STORAGE_KEY);
              }}
              aria-label="Reset personal tool usage frequency counts"
              className="text-xs font-bold text-slate-500 hover:text-red-500 transition px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 self-end sm:self-auto cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Reset My Counts
            </button>
          )}
        </section>
      )}

      {/* Tools Grid Display */}
      {filteredTools.length > 0 ? (
        <div
          id="tools-grid-view"
          role="region"
          aria-label={`PDF tools catalog, showing ${filteredTools.length} tools`}
          className="space-y-8"
        >
          {viewMode === "virtualized" ? (
            <VirtualizedToolGrid
              tools={filteredTools}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              onSelectTool={handleToolSelect}
              isMostPopular={(id) => isMostPopular(id) || !!filteredTools.find((t) => t.id === id)?.isPopular}
              getFormattedUsage={getFormattedUsage}
              getToolRating={getToolRating}
              onRateTool={rateTool}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedTools.map((tool) => (
                <LazyToolCard
                  key={tool.id}
                  tool={tool}
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelectTool={handleToolSelect}
                  isMostPopular={isMostPopular(tool.id) || tool.isPopular}
                  usageFormatted={getFormattedUsage(tool.id)}
                  ratingState={getToolRating(tool.id)}
                  onRateTool={rateTool}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Sentinel & Manual Trigger */}
          {viewMode === "infinite" && (
            <div className="pt-4 flex flex-col items-center justify-center space-y-3">
              {visibleCount < filteredTools.length ? (
                <>
                  <div ref={sentinelRef} className="h-6 w-full flex items-center justify-center">
                    <span className="text-xs font-medium text-slate-400 animate-pulse">
                      Scroll to lazy-load more tools...
                    </span>
                  </div>
                  <button
                    onClick={() => setVisibleCount((prev) => Math.min(filteredTools.length, prev + 16))}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    Load More Tools ({filteredTools.length - visibleCount} remaining)
                  </button>
                </>
              ) : (
                <div className="text-xs text-slate-400 font-medium">
                  Showing all {filteredTools.length} tools
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {viewMode === "paged" && totalPages > 1 && (
            <nav
              aria-label="Toolkit pagination navigation"
              className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800"
            >
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400" aria-current="page">
                PDF Sun - Page <span className="text-orange-500 font-black">{currentPage}</span> of {totalPages} ({filteredTools.length} total tools)
              </div>
              <div className="flex items-center space-x-1.5 flex-wrap justify-center" role="navigation" aria-label="Pagination pages">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  aria-label="Go to previous page"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    aria-label={`Page ${page}${currentPage === page ? ", current page" : ""}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    onClick={() => {
                      setCurrentPage(page);
                      document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      currentPage === page
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  aria-label="Go to next page"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <Filter className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No matching tools found</h3>
          <p className="text-xs text-slate-400">Try searching with a different keyword like "merge", "split", "AI", or "word".</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-orange-600 transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </section>
  );
};
