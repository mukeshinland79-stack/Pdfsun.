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

  // Primary languages to toggle between
  const primaryLanguages = [
    { code: "en", name: "English", flag: "🇺🇸", short: "EN" },
    { code: "es", name: "Español", flag: "🇪🇸", short: "ES" },
    { code: "fr", name: "Français", flag: "🇫🇷", short: "FR" },
  ];

  // Filter languages
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

  const handleSelectLanguage = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative inline-flex items-center space-x-1 ${className}`} ref={dropdownRef}>
      {/* Direct Quick Toggle Segment Buttons for EN, ES, FR */}
      {!compact && (
        <div className="hidden xl:flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs shadow-2xs">
          {primaryLanguages.map((lang) => {
            const isActive = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                title={`Switch to ${lang.name}`}
                className={`px-2 py-1 rounded-lg font-extrabold transition-all duration-150 flex items-center space-x-1 ${
                  isActive
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                }`}
              >
                <span className="text-xs leading-none">{lang.flag}</span>
                <span className="text-[11px] font-mono">{lang.short}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition text-xs font-bold ${
          isOpen
            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
        title="Switch Interface Language (English, Spanish, French & 30+ Languages)"
        aria-label="Select website language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="text-sm">{languageOption.flag}</span>
        {!compact && (
          <span className="hidden lg:inline-block font-semibold">{languageOption.nativeName}</span>
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
              <span>Language Switcher</span>
            </span>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
              {languageOption.code.toUpperCase()}
            </span>
          </div>

          {/* Featured Primary Languages: English, Spanish, French */}
          <div className="p-2.5 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-blue-950 dark:text-blue-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Primary Languages</span>
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded font-bold">
                Dynamic Translation
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { code: "en", flag: "🇺🇸", label: "English", sub: "English" },
                { code: "es", flag: "🇪🇸", label: "Español", sub: "Spanish" },
                { code: "fr", flag: "🇫🇷", label: "Français", sub: "French" },
              ].map((item) => {
                const isSelected = currentLanguage === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelectLanguage(item.code)}
                    className={`p-2 rounded-xl text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "bg-blue-600 text-white font-bold shadow-sm ring-2 ring-blue-400/50"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-100/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{item.flag}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                    <div className="mt-1">
                      <div className="text-[11px] font-bold leading-tight">{item.label}</div>
                      <div className={`text-[9px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {item.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
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
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
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
