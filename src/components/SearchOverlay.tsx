import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  Sparkles,
  Star,
  ArrowRight,
  Command,
  CornerDownLeft,
  SlidersHorizontal,
  Compass,
  Zap,
} from "lucide-react";
import { ALL_TOOLS } from "../data/toolsData";
import { ToolItem } from "../types";
import { useLanguage } from "../lib/i18n";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolItem) => void;
  favorites?: string[];
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  favorites = [],
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Categories list
  const categories = useMemo(
    () => [
      { id: "all", label: "All Tools" },
      { id: "popular", label: "Popular" },
      { id: "ai", label: "AI Tools" },
      { id: "convert", label: "Convert" },
      { id: "edit", label: "Edit & Organize" },
      { id: "security", label: "Security & OCR" },
    ],
    []
  );

  // Filter tools based on search query & category
  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === "all"
          ? true
          : selectedCategory === "popular"
          ? tool.isPopular
          : selectedCategory === "ai"
          ? tool.isAi
          : tool.category?.toLowerCase() === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        (tool.badge && tool.badge.toLowerCase().includes(q)) ||
        (tool.category && tool.category.toLowerCase().includes(q))
      );
    });
  }, [query, selectedCategory]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Handle Keyboard Navigation (Arrow Keys, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredTools.length > 0 ? (prev + 1) % filteredTools.length : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredTools.length > 0
            ? (prev - 1 + filteredTools.length) % filteredTools.length
            : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredTools.length > 0 && filteredTools[selectedIndex]) {
          onSelectTool(filteredTools[selectedIndex]);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex, onClose, onSelectTool]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeItem = listRef.current.children[selectedIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 sm:px-6">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] z-10"
        >
          {/* Header Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-900/80">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchOverlayPlaceholder", `Search ${ALL_TOOLS.length} tools across platform (Type or press Ctrl+/)...`)}
              className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="hidden sm:flex items-center space-x-1.5 shrink-0">
              <kbd className="px-2 py-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 font-mono">
                Ctrl+/
              </kbd>
              <kbd className="px-2 py-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 font-mono">
                ESC
              </kbd>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-50/30 dark:bg-slate-900/40">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Results List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool, idx) => {
                const isSelected = idx === selectedIndex;
                const isFav = favorites.includes(tool.id);

                return (
                  <div
                    key={tool.id}
                    onClick={() => {
                      onSelectTool(tool);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 shadow-xs"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {tool.isAi ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {tool.name}
                          </span>
                          {tool.isAi && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              AI
                            </span>
                          )}
                          {tool.badge && (
                            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {tool.badge}
                            </span>
                          )}
                          {isFav && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {tool.category}
                      </span>
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No matching tools found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Try searching for "Merge", "OCR", "Compress", or "Convert".
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Shortcuts Hint */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[9px] font-mono">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[9px] font-mono">
                  ↓
                </kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center space-x-1">
                <CornerDownLeft className="w-3 h-3" />
                <span>Select</span>
              </span>
            </div>

            <div className="font-semibold text-blue-600 dark:text-blue-400">
              {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"} available
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
