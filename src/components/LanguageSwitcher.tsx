import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Globe, Check, ChevronDown, Search, X, Sparkles } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES, LanguageOption } from "../lib/i18n";
import { motion, AnimatePresence } from "motion/react";

export interface LanguageSwitcherProps {
  className?: string;
  variant?: "pills" | "dropdown" | "compact";
  showLabel?: boolean;
  align?: "right" | "left" | "center";
}

export const PRIMARY_LANGUAGES: Array<{
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  short: string;
}> = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", short: "EN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", short: "HI" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", short: "ES" },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
  variant = "dropdown",
  showLabel = true,
  align = "right",
}) => {
  const { currentLanguage, setLanguage, languageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside mousedown or touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto focus search when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelectLanguage = useCallback(
    (code: string) => {
      setLanguage(code);
      setIsOpen(false);
      setSearchQuery("");
    },
    [setLanguage]
  );

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (lang: LanguageOption) =>
        (lang.name || "").toLowerCase().includes(q) ||
        (lang.nativeName || "").toLowerCase().includes(q) ||
        (lang.code || "").toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Quick Segment Pill Switcher between EN, HI, ES
  if (variant === "pills") {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}
        role="group"
        aria-label="Quick language selector"
      >
        {PRIMARY_LANGUAGES.map((lang) => {
          const isActive = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              title={`Switch language to ${lang.name} (${lang.nativeName})`}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 flex items-center space-x-1.5 cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700"
              }`}
              aria-pressed={isActive}
            >
              <span className="text-xs leading-none">{lang.flag}</span>
              <span>{lang.short}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact icon-only button variant
  if (variant === "compact") {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl text-xs font-bold transition-all border shadow-2xs flex items-center justify-center cursor-pointer ${
            isOpen
              ? "bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-400"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
          title={`Language: ${languageOption.name} (${languageOption.nativeName})`}
          aria-label="Change Language"
          aria-expanded={isOpen}
        >
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop layer */}
            <div
              className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-[9998]"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            {/* Dropdown panel */}
            <div
              className={`absolute mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[9999] p-3 text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10 ${
                align === "left" ? "left-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "right-0"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Choose Language</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close language selector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Select */}
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                {PRIMARY_LANGUAGES.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`p-2 rounded-xl text-center flex flex-col items-center transition cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="text-xs font-bold mt-0.5">{lang.short}</span>
                      <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {lang.nativeName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Language List */}
              <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
                {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{lang.flag}</span>
                        <div>
                          <span className="font-semibold">{lang.nativeName}</span>
                          {lang.name !== lang.nativeName && (
                            <span className="text-[10px] text-slate-400 ml-1.5">({lang.name})</span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Standard Dropdown variant with high contrast solid container, backdrop on mobile & quick select
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
          isOpen
            ? "bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-400"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700"
        }`}
        title={`Current Language: ${languageOption.name} (${languageOption.nativeName}). Click to switch.`}
        aria-label="Language Switcher"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="text-xs leading-none shrink-0">{languageOption.flag}</span>
        {showLabel && (
          <span className="font-semibold hidden xs:inline">{languageOption.nativeName}</span>
        )}
        <span className="uppercase text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
          {languageOption.code.toUpperCase()}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Modal Container */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Subtle semi-transparent backdrop layer for mobile & z-index isolation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs z-[9998]"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Dropdown Content with Solid Background & High Z-Index */}
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute mt-2 w-80 sm:w-84 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[9999] p-3 text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10 ${
                align === "left" ? "left-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "right-0"
              }`}
              style={{
                backgroundColor: "var(--bg-panel, #ffffff)",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Select website language"
            >
              {/* Header Title & Close Button */}
              <div className="px-1 py-1 border-b border-slate-100 dark:border-slate-800 mb-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Select Language / भाषा
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-mono font-bold">
                    {currentLanguage.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 30+ languages (e.g. Hindi, Spanish, French)..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Primary Quick Toggle Languages: English, Hindi, Spanish */}
              {!searchQuery && (
                <div className="p-2 mb-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Primary Quick Select</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">Instant</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRIMARY_LANGUAGES.map((lang) => {
                      const isSelected = currentLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleSelectLanguage(lang.code)}
                          className={`p-2 rounded-xl text-left transition-all duration-150 flex flex-col items-center text-center cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white font-bold shadow-xs scale-[1.02]"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                          }`}
                        >
                          <span className="text-lg leading-none">{lang.flag}</span>
                          <span className="text-xs font-bold leading-tight mt-1">{lang.short}</span>
                          <span
                            className={`text-[10px] font-medium ${
                              isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {lang.nativeName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Languages List Header */}
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1 py-1 flex items-center justify-between">
                <span>
                  {searchQuery
                    ? `Search Results (${filteredLanguages.length})`
                    : `All Languages (${SUPPORTED_LANGUAGES.length})`}
                </span>
                <span className="text-[9px] font-mono text-slate-400">30+ Localized</span>
              </div>

              {/* Scrollable Language List */}
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {filteredLanguages.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No language matched "{searchQuery}".
                  </div>
                ) : (
                  filteredLanguages.map((lang: LanguageOption) => {
                    const isSelected = currentLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="text-base leading-none shrink-0">{lang.flag}</span>
                          <div className="min-w-0 truncate">
                            <span className="font-semibold">{lang.nativeName}</span>
                            {lang.name !== lang.nativeName && (
                              <span className="text-[11px] text-slate-400 ml-1.5">
                                ({lang.name})
                              </span>
                            )}
                            {lang.isRtl && (
                              <span className="ml-1.5 px-1 py-0.2 text-[8px] bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded font-mono font-bold">
                                RTL
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5] shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
