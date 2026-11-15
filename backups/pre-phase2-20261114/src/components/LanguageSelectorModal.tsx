import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Globe, Check, X, Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";
import { TOP_30_LANGUAGES } from "../utils/geoLanguageDetector";
import { useLanguageStore, setGlobalLanguage } from "../hooks/useLanguageStore";
import { useLanguage } from "../lib/i18n";
import i18n from "i18next";
import { SupportedLanguage } from "../types/history";

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageSelect?: (lang: SupportedLanguage) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  onLanguageSelect,
}) => {
  const { currentLanguage, setLanguage, isRtl } = useLanguageStore();
  const { changeLanguage: changeI18nLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Filter languages in real-time and pin active language at the top
  const filteredLanguages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = TOP_30_LANGUAGES;

    if (query) {
      list = TOP_30_LANGUAGES.filter(
        (lang) =>
          lang.name.toLowerCase().includes(query) ||
          lang.nativeName.toLowerCase().includes(query) ||
          lang.code.toLowerCase().includes(query) ||
          lang.popularCountries.some((c) => c.toLowerCase().includes(query))
      );
    }

    // Always sort the active language to the top of the list
    return [...list].sort((a, b) => {
      const aActive =
        a.code === currentLanguage ||
        a.code.toLowerCase() === currentLanguage.toLowerCase() ||
        a.code.split("-")[0] === currentLanguage.split("-")[0];
      const bActive =
        b.code === currentLanguage ||
        b.code.toLowerCase() === currentLanguage.toLowerCase() ||
        b.code.split("-")[0] === currentLanguage.split("-")[0];
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return 0;
    });
  }, [searchQuery, currentLanguage]);

  // Autofocus search on open and reset focused index
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
      setFocusedIndex(0);
    }
  }, [isOpen]);

  // Reset focused index when query changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery]);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang.code);
    setGlobalLanguage(lang.code);
    if (typeof changeI18nLanguage === "function") {
      changeI18nLanguage(lang.code);
    }
    if (i18n && typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(lang.code).catch(() => {});
    }
    if (onLanguageSelect) {
      onLanguageSelect(lang);
    }
    onClose();
  };

  // Keyboard navigation (Arrow keys, Enter, Home, End, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (filteredLanguages.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev + 2 < filteredLanguages.length ? prev + 2 : (prev + 1 < filteredLanguages.length ? prev + 1 : prev);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev - 2 >= 0 ? prev - 2 : (prev - 1 >= 0 ? prev - 1 : 0);
          return next;
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(filteredLanguages.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setFocusedIndex(filteredLanguages.length - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredLanguages[focusedIndex]) {
          handleSelect(filteredLanguages[focusedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredLanguages, focusedIndex, onClose]);

  // Keep focused item visible in scroll container
  useEffect(() => {
    if (itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-selector-title"
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        dir={isRtl ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900/95 dark:bg-[#12131F] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="language-selector-title" className="text-base sm:text-lg font-black text-white">
                  Select Language
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {TOP_30_LANGUAGES.length} Languages
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instant real-time translation with zero page reload
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close language selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar with Clear Button & Keyboard Hint */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/40 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search language or country (e.g. Hindi, हिन्दी, Spanish, Urdu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 text-sm text-white placeholder-slate-400 rounded-2xl border border-slate-700/80 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              aria-label="Search languages"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition cursor-pointer"
                title="Clear search"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span>Use</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">↓</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">←</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">→</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 flex items-center gap-1">
                <span>Enter</span>
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              <span>to select</span>
            </span>
          </div>
        </div>

        {/* Languages Grid */}
        <div ref={itemsContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {filteredLanguages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredLanguages.map((lang, index) => {
                const isSelected =
                  currentLanguage === lang.code ||
                  currentLanguage.toLowerCase() === lang.code.toLowerCase() ||
                  currentLanguage.split("-")[0] === lang.code.split("-")[0];
                const isFocused = focusedIndex === index;
                const isLanguageRtl =
                  lang.direction === "rtl" ||
                  lang.code === "ar" ||
                  lang.code === "ur" ||
                  lang.code === "fa";

                return (
                  <button
                    key={lang.code}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    type="button"
                    onClick={() => handleSelect(lang)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group relative ${
                      isSelected
                        ? "bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-500/15 ring-2 ring-indigo-500"
                        : isFocused
                        ? "bg-slate-800 border-indigo-400 text-white ring-1 ring-indigo-400/60"
                        : "bg-slate-800/50 hover:bg-slate-800 border-slate-800/80 hover:border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-2xl shrink-0" role="img" aria-label={lang.name}>
                        {lang.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white truncate">
                            {lang.nativeName}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500 text-white shadow-xs">
                              ACTIVE
                            </span>
                          )}
                          {isLanguageRtl && (
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              RTL
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 truncate block">
                          {lang.name}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : isFocused ? (
                      <span className="text-[10px] font-mono text-indigo-300 flex items-center gap-0.5">
                        <span>Select</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition">
                        Select
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Globe className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No languages found</p>
              <p className="text-xs text-slate-500">
                Try searching by English or native script (e.g., &quot;fr&quot; or &quot;Français&quot;)
              </p>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3.5 px-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Automatic client-side hydration active
          </span>
          <span className="text-slate-500 font-mono">PDFSun i18n v2.0</span>
        </div>
      </div>
    </div>
  );
};
