import React, { useState, useMemo } from "react";
import {
  Grid,
  GraduationCap,
  Sparkles,
  Flame,
  RefreshCw,
  Sliders,
  Shield,
  Wrench,
  Search,
  Filter,
} from "lucide-react";
import { ToolItem, CategoryId } from "../types";
import { ALL_TOOLS, CATEGORIES } from "../data/toolsData";
import { ToolCard } from "./ToolCard";
import { useUsageAnalytics } from "../hooks/useUsageAnalytics";
import { useToolRatings } from "../hooks/useToolRatings";

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Grid,
  GraduationCap,
  Sparkles,
  Flame,
  RefreshCw,
  Sliders,
  Shield,
  Wrench,
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
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  favorites,
  onToggleFavorite,
  onSelectTool,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onPageChange,
}) => {
  const { isMostPopular, getFormattedUsage, trackToolUsage } = useUsageAnalytics();
  const { getToolRating, rateTool } = useToolRatings();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 16;

  // Reset page when category or search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Filter tools based on category and search query
  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      // Category match
      let matchesCategory = true;
      if (selectedCategory === "student") matchesCategory = !!tool.isStudentFavorite;
      else if (selectedCategory === "ai") matchesCategory = !!tool.isAi;
      else if (selectedCategory === "popular") matchesCategory = isMostPopular(tool.id) || !!tool.isPopular;
      else if (selectedCategory !== "all") matchesCategory = tool.category === selectedCategory;

      // Search query match
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch =
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.outputFormat.toLowerCase().includes(q) ||
          tool.supportedInput.some((ext) => ext.toLowerCase().includes(q));
      }

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, isMostPopular]);

  const totalPages = Math.ceil(filteredTools.length / pageSize) || 1;

  React.useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage, totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTools.slice(start, start + pageSize);
  }, [filteredTools, currentPage, pageSize]);

  return (
    <section id="tools" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Category Tabs Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Comprehensive PDF Toolkit
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Over 50+ enterprise working tools for students, lawyers, researchers, and professionals.
          </p>
        </div>

        {/* Live Filter Counter & Search Bar */}
        <div className="w-full md:w-auto flex items-center space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter 50+ tools..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="px-3 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-amber-400 text-xs font-bold whitespace-nowrap">
            {filteredTools.length} Tools
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const IconComp = CATEGORY_ICONS[cat.icon] || Grid;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as CategoryId)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? "text-white" : "text-orange-500"}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tools Grid Display */}
      {filteredTools.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={favorites.includes(tool.id)}
                onToggleFavorite={onToggleFavorite}
                onSelectTool={(selected) => {
                  trackToolUsage(selected.id);
                  onSelectTool(selected);
                }}
                isMostPopular={isMostPopular(tool.id) || tool.isPopular}
                usageFormatted={getFormattedUsage(tool.id)}
                ratingState={getToolRating(tool.id)}
                onRateTool={rateTool}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                PDF Sun - Page <span className="text-orange-500 font-black">{currentPage}</span> of {totalPages} ({filteredTools.length} total tools)
              </div>
              <div className="flex items-center space-x-1.5 flex-wrap justify-center">
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                      currentPage === page
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
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
