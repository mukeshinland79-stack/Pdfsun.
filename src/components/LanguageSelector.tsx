import React, { useState, useRef, useEffect, useMemo } from "react";
import { Globe, ChevronDown, Check, Search, Sparkles } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES, LanguageOption } from "../lib/i18n";

export interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  className = "",
}) => {
  const { currentLanguage, setLanguage, languageOption, isRtl } = useLanguage();
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

  // Filter languages
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectLanguage = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition text-xs font-bold ${
          isOpen
            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
        title="Switch Interface Language"
        aria-label="Select website language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="text-sm">{languageOption.flag}</span>
        {!compact && (
          <span className="hidden xl:inline font-semibold">{languageOption.nativeName}</span>
        )}
        <span className="uppercase text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
          {languageOption.code}
        </span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="px-1 py-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Language ({SUPPORTED_LANGUAGES.length})</span>
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
              {languageOption.code.toUpperCase()}
            </span>
          </div>

          {/* Quick Switch Recommendation Card */}
          <div className="p-2.5 mb-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-1.5">
            <div className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Instant Translation Engine</span>
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded font-bold">
                30+ Languages
              </span>
            </div>
            <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 leading-tight">
              Switch UI labels, tools, dropzone prompts and controls instantly.
            </p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                { code: "en", flag: "🇺🇸", label: "EN" },
                { code: "fr", flag: "🇫🇷", label: "FR" },
                { code: "es", flag: "🇪🇸", label: "ES" },
                { code: "hi", flag: "🇮🇳", label: "HI" },
                { code: "de", flag: "🇩🇪", label: "DE" },
                { code: "ar", flag: "🇸🇦", label: "AR" },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelectLanguage(item.code)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1 transition ${
                    currentLanguage === item.code
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-700 border border-indigo-200/60 dark:border-indigo-800/40"
                  }`}
                >
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Filter Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by language name or code..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Language List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                      isSelected
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-base shrink-0">{lang.flag}</span>
                      <div className="min-w-0">
                        <div className="font-semibold truncate flex items-center space-x-1.5">
                          <span>{lang.nativeName}</span>
                          {lang.isRtl && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold">
                              RTL
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {lang.name} ({lang.code.toUpperCase()})
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching languages found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
