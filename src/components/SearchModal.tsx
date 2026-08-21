import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  Sparkles,
  Star,
  ArrowRight,
  CornerDownLeft,
  Zap,
  Tag,
  Filter,
  Clock,
  History,
  Trash2,
  Mic,
  MicOff,
  ArrowUpDown,
  CornerUpLeft,
} from "lucide-react";
import { ALL_TOOLS } from "../data/toolsData";
import { ToolItem } from "../types";
import { useLanguage } from "../lib/i18n";

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolItem) => void;
  favorites?: string[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  favorites = [],
}) => {
  const { t, currentLanguage } = useLanguage();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isMac, setIsMac] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Stop listening when modal closes
  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      setIsListening(false);
      setSpeechError(null);
    }
  }, [isOpen]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const toggleVoiceSearch = useCallback(() => {
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechError("Voice search is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguage || "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setSpeechError("Microphone access was denied. Please allow microphone permissions.");
        } else if (event.error === "no-speech") {
          setSpeechError("No speech was detected. Please try speaking again.");
        } else if (event.error === "network") {
          setSpeechError("Network error during voice recognition.");
        } else {
          setSpeechError(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error("Failed to start voice recognition:", err);
      setIsListening(false);
      setSpeechError("Could not start voice recognition.");
    }
  }, [isListening, currentLanguage]);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("pdfsun_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentSortBy, setRecentSortBy] = useState<"recent" | "frequent">(
    () => {
      try {
        const saved = localStorage.getItem("pdfsun_recent_search_sort");
        return saved === "frequent" ? "frequent" : "recent";
      } catch {
        return "recent";
      }
    }
  );

  const [searchCounts, setSearchCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("pdfsun_recent_search_counts");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const saveRecentSearch = useCallback((searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) return;
    const lowerKey = trimmed.toLowerCase();

    setSearchCounts((prev) => {
      const updated = { ...prev, [lowerKey]: (prev[lowerKey] || 1) + 1 };
      try {
        localStorage.setItem("pdfsun_recent_search_counts", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save search counts:", e);
      }
      return updated;
    });

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== lowerKey
      );
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem("pdfsun_recent_searches", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save recent search:", e);
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((searchTerm: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== searchTerm);
      try {
        localStorage.setItem("pdfsun_recent_searches", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to remove recent search:", e);
      }
      return updated;
    });

    setSearchCounts((prev) => {
      const copy = { ...prev };
      delete copy[searchTerm.toLowerCase()];
      try {
        localStorage.setItem("pdfsun_recent_search_counts", JSON.stringify(copy));
      } catch (e) {
        console.error("Failed to update search counts:", e);
      }
      return copy;
    });
  }, []);

  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    setSearchCounts({});
    try {
      localStorage.removeItem("pdfsun_recent_searches");
      localStorage.removeItem("pdfsun_recent_search_counts");
    } catch (e) {
      console.error("Failed to clear recent searches:", e);
    }
  }, []);

  const sortedRecentSearches = useMemo(() => {
    if (recentSortBy === "frequent") {
      return [...recentSearches].sort((a, b) => {
        const countA = searchCounts[a.toLowerCase()] || 1;
        const countB = searchCounts[b.toLowerCase()] || 1;
        if (countB !== countA) {
          return countB - countA;
        }
        return recentSearches.indexOf(a) - recentSearches.indexOf(b);
      });
    }
    return recentSearches;
  }, [recentSearches, recentSortBy, searchCounts]);

  const handleSelectTool = useCallback(
    (tool: ToolItem) => {
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      onSelectTool(tool);
      onClose();
    },
    [query, saveRecentSearch, onSelectTool, onClose]
  );

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setIsInputFocused(true);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle global Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Categories list
  const categories = useMemo(
    () => [
      { id: "all", label: "All Tools" },
      { id: "popular", label: "🔥 Popular" },
      { id: "ai", label: "✨ AI Tools" },
      { id: "convert", label: "🔄 Convert" },
      { id: "edit", label: "✏️ Edit & Organize" },
      { id: "advanced", label: "⚡ Advanced & OCR" },
      { id: "security", label: "🔒 Security" },
    ],
    []
  );

  // Filter tools based on query & selected category
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
        (tool.name || "").toLowerCase().includes(q) ||
        (tool.description || "").toLowerCase().includes(q) ||
        (typeof tool.badge === "string" && tool.badge.toLowerCase().includes(q)) ||
        (typeof tool.category === "string" && tool.category.toLowerCase().includes(q)) ||
        (tool.supportedInput && tool.supportedInput.some((ext) => (ext || "").toLowerCase().includes(q)))
      );
    });
  }, [query, selectedCategory]);

  // Real-time top autocomplete tool match
  const topMatchTool = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || filteredTools.length === 0) return null;
    const prefixMatch = filteredTools.find((t) =>
      t.name.toLowerCase().startsWith(q)
    );
    return prefixMatch || filteredTools[0];
  }, [query, filteredTools]);

  // Dynamic Autosuggest items (Tools, Categories, and Extension Tags)
  const autoSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: Array<{
      id: string;
      type: "tool" | "category" | "extension";
      label: string;
      sublabel?: string;
      tool?: ToolItem;
      categoryId?: string;
    }> = [];

    // 1. Matching Category Suggestions
    categories.forEach((cat) => {
      if (cat.id !== "all") {
        const catCleanName = cat.label.replace(/^[^\w\s]+/, "").trim().toLowerCase();
        if (catCleanName.includes(q) || cat.id.includes(q)) {
          items.push({
            id: `cat-${cat.id}`,
            type: "category",
            label: `Category: ${cat.label}`,
            categoryId: cat.id,
          });
        }
      }
    });

    // 2. Matching Tool Titles (prefix matches first)
    const exactPrefixTools = ALL_TOOLS.filter((t) =>
      t.name.toLowerCase().startsWith(q)
    );
    const substringTools = ALL_TOOLS.filter(
      (t) => !t.name.toLowerCase().startsWith(q) && t.name.toLowerCase().includes(q)
    );

    const sortedMatchingTools = [...exactPrefixTools, ...substringTools];

    sortedMatchingTools.slice(0, 5).forEach((tool) => {
      items.push({
        id: `tool-${tool.id}`,
        type: "tool",
        label: tool.name,
        sublabel: tool.category,
        tool,
      });
    });

    // 3. Matching File Extensions or Keywords
    const commonExtensions = [".pdf", ".docx", ".jpg", ".png", ".xlsx", ".pptx", "ocr"];
    commonExtensions.forEach((ext) => {
      if (ext.toLowerCase().includes(q) && ext.toLowerCase() !== q) {
        items.push({
          id: `ext-${ext}`,
          type: "extension",
          label: `Tag: ${ext.toUpperCase()}`,
        });
      }
    });

    return items;
  }, [query, categories]);

  // Helper to highlight matching characters/substrings in tool names & descriptions
  const renderHighlightedText = useCallback((text: string, searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return text;

    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    if (parts.length <= 1) return text;

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-200/90 dark:bg-amber-500/35 text-amber-950 dark:text-amber-100 font-extrabold px-0.5 rounded-xs underline decoration-amber-400 dark:decoration-amber-500"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  }, []);

  // Reset keyboard cursor on list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Keyboard navigation within results
  useEffect(() => {
    if (!isOpen) return;

    const handleListNavigation = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        e.stopPropagation();
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
      } else if (e.key === "Tab") {
        if (
          topMatchTool &&
          query.trim().length > 0 &&
          query.trim().toLowerCase() !== topMatchTool.name.toLowerCase()
        ) {
          e.preventDefault();
          setQuery(topMatchTool.name);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredTools.length > 0 && filteredTools[selectedIndex]) {
          handleSelectTool(filteredTools[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleListNavigation);
    return () => window.removeEventListener("keydown", handleListNavigation);
  }, [isOpen, filteredTools, selectedIndex, handleSelectTool, topMatchTool, query, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeElem = listRef.current.children[selectedIndex] as HTMLElement;
    if (activeElem) {
      activeElem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-4 sm:px-6">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -16 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[82vh] z-10"
        >
          {/* Header Search Input */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2.5 bg-slate-50/70 dark:bg-slate-900/90">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsInputFocused(false), 200);
              }}
              placeholder={
                isListening
                  ? "Listening... Speak your search query..."
                  : t(
                      "searchModalPlaceholder",
                      `Search ${ALL_TOOLS.length} PDF tools by name, action or extension (e.g. Merge, OCR, Compress)...`
                    )
              }
              className={`w-full bg-transparent text-sm sm:text-base font-medium placeholder-slate-400 focus:outline-none ${
                isListening ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-800 dark:text-slate-100"
              }`}
            />

            {/* Voice Search Microphone Button */}
            <button
              type="button"
              onClick={toggleVoiceSearch}
              title={isListening ? "Stop listening" : "Search using voice"}
              aria-label={isListening ? "Stop voice search" : "Start voice search"}
              className={`p-2 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer relative ${
                isListening
                  ? "bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse ring-2 ring-red-400 ring-offset-2 dark:ring-offset-slate-900"
                  : "text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Show History Toggle Button */}
            {recentSearches.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
                title={showHistory ? "Hide recent searches" : "Show recent searches"}
                aria-label={showHistory ? "Hide recent search history" : "Show recent search history"}
                className={`p-1.5 px-2 rounded-xl transition flex items-center space-x-1 shrink-0 text-xs font-semibold cursor-pointer border ${
                  showHistory
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showHistory ? "Hide History" : "Show History"}</span>
              </button>
            )}

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0 cursor-pointer"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Visual Shortcut Badge for Command Palette */}
            <div className="hidden sm:flex items-center space-x-1.5 shrink-0 pl-1">
              <span
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-lg text-blue-700 dark:text-blue-300 shadow-2xs select-none"
                title="Command Palette Shortcut"
              >
                <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{isMac ? "⌘K" : "Ctrl+K"}</span>
              </span>
              <kbd
                className="px-2 py-1 text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 select-none"
                title="Press ESC to close"
              >
                ESC
              </kbd>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shrink-0 cursor-pointer"
              aria-label="Close search modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Voice Search Active Listening / Error Status Banner */}
          {(isListening || speechError) && (
            <div
              className={`px-4 py-2 border-b text-xs flex items-center justify-between gap-2 ${
                isListening
                  ? "bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
                  : "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                {isListening ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span className="font-semibold">Listening... Speak now to search PDF tools</span>
                  </>
                ) : (
                  <span>{speechError ? String(speechError) : ""}</span>
                )}
              </div>
              {speechError && (
                <button
                  type="button"
                  onClick={() => setSpeechError(null)}
                  className="text-amber-700 dark:text-amber-300 hover:underline font-semibold text-[11px] cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* Real-time Autocomplete & Autosuggestion Banner */}
          {query.trim().length > 0 && (
            <div className="px-4 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                {topMatchTool ? (
                  <>
                    <span className="truncate">
                      Suggested tool: <strong className="text-blue-700 dark:text-blue-300 font-bold">{topMatchTool.name}</strong>
                    </span>
                    {query.trim().toLowerCase() !== topMatchTool.name.toLowerCase() && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(topMatchTool.name);
                          inputRef.current?.focus();
                        }}
                        className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition cursor-pointer flex items-center space-x-1 shrink-0"
                      >
                        <span>Press <kbd className="font-mono bg-white dark:bg-slate-800 px-1 py-0.2 rounded shadow-2xs">Tab ⇥</kbd></span>
                      </button>
                    )}
                  </>
                ) : (
                  <span className="truncate font-semibold text-slate-600 dark:text-slate-400">
                    Smart suggestions available below
                  </span>
                )}
              </div>

              {/* Autosuggestion Interactive Pills */}
              {autoSuggestions.length > 0 && (
                <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider hidden sm:inline shrink-0">
                    Autosuggest:
                  </span>
                  {autoSuggestions.slice(0, 5).map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => {
                        if (sug.type === "tool" && sug.tool) {
                          handleSelectTool(sug.tool);
                        } else if (sug.type === "category" && sug.categoryId) {
                          setSelectedCategory(sug.categoryId);
                        } else if (sug.type === "extension") {
                          const extTag = sug.label.replace(/^Tag:\s*/i, "").toLowerCase();
                          setQuery(extTag);
                        }
                        inputRef.current?.focus();
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition whitespace-nowrap shadow-2xs cursor-pointer flex items-center space-x-1 ${
                        sug.type === "category"
                          ? "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
                          : sug.type === "extension"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                      title={
                        sug.type === "tool"
                          ? `Open tool ${sug.label}`
                          : sug.type === "category"
                          ? `Filter by category`
                          : `Search tag ${sug.label}`
                      }
                    >
                      {sug.type === "category" ? (
                        <Filter className="w-2.5 h-2.5 inline" />
                      ) : sug.type === "extension" ? (
                        <Tag className="w-2.5 h-2.5 inline" />
                      ) : (
                        <Zap className="w-2.5 h-2.5 inline" />
                      )}
                      <span>{sug.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Searches (Toggled via showHistory state without needing input focus) */}
          <AnimatePresence initial={false}>
            {recentSearches.length > 0 && showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40"
              >
                <div className="px-4 py-2.5">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Recent Searches</span>
                      </div>

                      {/* Sort By Dropdown */}
                      <div className="flex items-center space-x-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-300 dark:border-slate-700">
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        <span className="hidden sm:inline">Sort:</span>
                        <select
                          value={recentSortBy}
                          onChange={(e) => {
                            const val = e.target.value as "recent" | "frequent";
                            setRecentSortBy(val);
                            try {
                              localStorage.setItem("pdfsun_recent_search_sort", val);
                            } catch (err) {
                              console.error("Failed to save sort preference:", err);
                            }
                          }}
                          className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                          aria-label="Sort recent searches"
                        >
                          <option value="recent">Most Recent</option>
                          <option value="frequent">Most Frequent</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearAllRecentSearches}
                      className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition flex items-center space-x-1 cursor-pointer px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Clear all recent search history"
                      aria-label="Clear Recent Searches"
                    >
                      <Trash2 className="w-3 h-3 inline text-slate-400 hover:text-red-500 transition-colors" />
                      <span>Clear Recent Searches</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <AnimatePresence>
                      {sortedRecentSearches.map((item) => {
                        const count = searchCounts[item.toLowerCase()] || 1;
                        return (
                          <motion.div
                            key={item}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="group flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 transition shadow-xs"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setQuery(item);
                                saveRecentSearch(item);
                                if (inputRef.current) {
                                  inputRef.current.focus();
                                  inputRef.current.setSelectionRange(item.length, item.length);
                                }
                              }}
                              className="flex items-center space-x-1.5 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left"
                              title={`Click to copy "${item}" into search input`}
                              aria-label={`Copy "${item}" into search input`}
                            >
                              <History className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition" />
                              <span>{item}</span>
                              {count > 1 && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/50 px-1 py-0.2 rounded-full border border-blue-200/60 dark:border-blue-800/60 ml-0.5">
                                  {count}x
                                </span>
                              )}
                              <CornerUpLeft className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRecentSearch(item);
                              }}
                              className="ml-1.5 p-0.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                              title="Remove from recent searches"
                              aria-label={`Remove "${item}" from recent searches`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Categories */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-50/40 dark:bg-slate-900/50">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1 hidden sm:block" />
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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

          {/* Tool Results List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool, idx) => {
                const isSelected = idx === selectedIndex;
                const isFav = favorites.includes(tool.id);

                return (
                  <div
                    key={tool.id}
                    onClick={() => {
                      handleSelectTool(tool);
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
                            {renderHighlightedText(tool.name, query)}
                          </span>
                          {tool.isAi && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              AI
                            </span>
                          )}
                          {tool.badge && (
                            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {renderHighlightedText(tool.badge, query)}
                            </span>
                          )}
                          {isFav && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {renderHighlightedText(tool.description, query)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {tool.category}
                      </span>
                      <div
                        className={`p-1.5 rounded-lg transition ${
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
                    No PDF tools found matching "{query}"
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Try quick tags:
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {["Merge", "Watermark", "OCR", "Compress", "Excel", "Split"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setQuery(tag);
                          saveRecentSearch(tag);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[9px] font-mono">
                  Tab ⇥
                </kbd>
                <span>Autocomplete</span>
              </span>
              <span className="flex items-center space-x-1">
                <CornerDownLeft className="w-3 h-3" />
                <span>Select Tool</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[9px] font-mono">
                  Esc
                </kbd>
                <span>Close</span>
              </span>
            </div>

            <div className="font-semibold text-blue-600 dark:text-blue-400 shrink-0 ml-2">
              {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

