import React, { useState, useRef, useEffect, useMemo } from "react";
import { Globe, Check, ChevronDown, Search } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES } from "../lib/i18n";

export interface LanguageSwitcherProps {
  className?: string;
  variant?: "pills" | "dropdown" | "compact";
  showLabel?: boolean;
}

export const PRIMARY_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", short: "EN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", short: "HI" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", short: "ES" },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
  variant = "dropdown",
  showLabel = true,
}) => {
  const { currentLanguage, setLanguage, languageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus search when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        (lang.name || "").toLowerCase().includes(q) ||
        (lang.nativeName || "").toLowerCase().includes(q) ||
        (lang.code || "").toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Quick Segment Pill Switcher between EN, ES, FR
  if (variant === "pills") {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}>
        {PRIMARY_LANGUAGES.map((lang) => {
          const isActive = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              title={`Switch language to ${lang.name}`}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 flex items-center space-x-1.5 ${
                isActive
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-600"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-xs leading-none">{lang.flag}</span>
              <span>{lang.short}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant with EN, ES, FR highlighted & full language list
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
          isOpen
            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
        title="Toggle Application Language (English, Spanish, French)"
        aria-label="Language Switcher"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="text-xs leading-none">{languageOption.flag}</span>
        {showLabel && (
          <span className="font-semibold">{languageOption.nativeName}</span>
        )}
        <span className="uppercase text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
          ({languageOption.code.toUpperCase()})
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Language Switcher</span>
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
              {currentLanguage.toUpperCase()}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 30+ languages..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Primary Quick Toggle Languages */}
          {!searchQuery && (
            <div className="p-2 mb-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Primary Quick Select
              </div>
              <div className="grid grid-cols-3 gap-1">
                {PRIMARY_LANGUAGES.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsOpen(false);
                      }}
                      className={`p-1.5 rounded-lg text-left transition flex flex-col items-center text-center ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      <span className="text-[11px] font-bold leading-tight mt-0.5">{lang.short}</span>
                      <span className={`text-[9px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {lang.nativeName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Languages List */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            {searchQuery ? `Search Results (${filteredLanguages.length})` : `All Languages (${SUPPORTED_LANGUAGES.length})`}
          </div>
          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {filteredLanguages.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{lang.flag}</span>
                    <div>
                      <span className="font-medium">{lang.nativeName}</span>
                      {lang.name !== lang.nativeName && (
                        <span className="text-[10px] text-slate-400 ml-1.5">({lang.name})</span>
                      )}
                      {lang.isRtl && (
                        <span className="ml-1 px-1 py-0.2 text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-mono">
                          RTL
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
