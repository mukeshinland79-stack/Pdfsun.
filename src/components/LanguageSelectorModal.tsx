import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Globe, Check, X, Sparkles } from "lucide-react";
import { TOP_30_LANGUAGES } from "../utils/geoLanguageDetector";
import { useLanguageStore } from "../hooks/useLanguageStore";
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
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Autofocus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter languages in real-time
  const filteredLanguages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return TOP_30_LANGUAGES;

    return TOP_30_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query) ||
        lang.popularCountries.some((c) => c.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang.code);
    if (onLanguageSelect) {
      onLanguageSelect(lang);
    }
    onClose();
  };

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
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close language selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search language or country (e.g. Hindi, हिन्दी, Spanish, Urdu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 text-sm text-white placeholder-slate-400 rounded-2xl border border-slate-700/80 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Languages Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {filteredLanguages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredLanguages.map((lang) => {
                const isSelected = currentLanguage === lang.code;
                const isLanguageRtl =
                  lang.direction === "rtl" ||
                  lang.code === "ar" ||
                  lang.code === "ur" ||
                  lang.code === "fa";

                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                        : "bg-slate-800/50 hover:bg-slate-800 border-slate-800/80 hover:border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-2xl shrink-0" role="img" aria-label={lang.name}>
                        {lang.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm text-white truncate">
                            {lang.nativeName}
                          </span>
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
