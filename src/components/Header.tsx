import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Moon,
  Search,
  Sparkles,
  Star,
  Clock,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Layers,
  Crown,
  User,
  LogOut,
  BarChart3,
  Users,
  Settings,
  Globe,
  Home,
  Check,
  Eye,
  Laptop,
  Edit3,
  Sliders,
  Wallet,
} from "lucide-react";
import { ALL_TOOLS, CATEGORIES } from "../data/toolsData";
import { ToolItem, UserRole, UserProfile, CategoryId, DUAL_OWNER_EMAILS } from "../types";
import { useLanguage } from "../lib/i18n";
import { SearchModal } from "./SearchModal";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PDFSunLogo } from "./PDFSunLogo";
import { PDFSunBrandShowcaseModal } from "./PDFSunBrandShowcaseModal";
import { checkAdminRole } from "../hooks/useAuth";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  themeMode?: "system" | "light" | "dark" | "eye-protection" | "aurora";
  setThemeMode?: (mode: "system" | "light" | "dark" | "eye-protection" | "aurora") => void;
  syncWithSystem?: boolean;
  setSyncWithSystem?: (val: boolean) => void;
  favorites: string[];
  onOpenFavorites: () => void;
  onOpenHistory: () => void;
  onSelectTool: (tool: ToolItem) => void;
  onOpenSearch: () => void;
  currentRole: UserRole;
  userProfile: UserProfile | null;
  canAccessAdmin?: boolean;
  adminEditModeActive?: boolean;
  onToggleAdminEditMode?: () => void;
  onOpenCms?: () => void;
  onOpenAuthModal: (initialMode?: "customer" | "owner") => void;
  onOpenAdminPanel: (tab?: string) => void;
  onOpenUserDashboard: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  onOpenShareModal?: () => void;
  selectedCategory?: CategoryId;
  onSelectCategory?: (cat: CategoryId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  themeMode = "light",
  setThemeMode,
  syncWithSystem = true,
  setSyncWithSystem,
  favorites,
  onOpenFavorites,
  onOpenHistory,
  onSelectTool,
  onOpenSearch,
  currentRole,
  userProfile,
  canAccessAdmin,
  adminEditModeActive = false,
  onToggleAdminEditMode,
  onOpenCms,
  onOpenAuthModal,
  onOpenAdminPanel,
  onOpenUserDashboard,
  onLogout,
  onGoHome,
  selectedCategory = "all",
  onSelectCategory,
}) => {
  const { t } = useLanguage();

  // Strict RBAC authorization: Server token verified & cryptographic role checked
  const isAuthenticated = userProfile !== null && currentRole !== "public";
  const hasAdminRights = isAuthenticated && (Boolean(canAccessAdmin) || checkAdminRole(userProfile, currentRole));
  const isAdminOrOwner = hasAdminRights;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [toolsSearchQuery, setToolsSearchQuery] = useState("");
  const [toolsActiveCategory, setToolsActiveCategory] = useState<string>("all");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [showBrandShowcase, setShowBrandShowcase] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  const handleOpenSearchModal = useCallback(() => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      setSearchOverlayOpen(true);
    }
  }, [onOpenSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target as Node)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track window scroll for elevated header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global Keyboard Shortcut listener for Command Palette (Cmd+K, Ctrl+K, Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "/" || (e.key && e.key.toLowerCase() === "k"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleOpenSearchModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleOpenSearchModal]);

  const popularTools = ALL_TOOLS.filter((t) => t.isPopular).slice(0, 8);
  const aiTools = ALL_TOOLS.filter((t) => t.isAi);

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-[#0b1120]/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-200 ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4 overflow-hidden">
        
        {/* ========================================================= */}
        {/* ZONE 1: LEFT ZONE (Brand Logo & Main Desktop Nav Links)   */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
          <PDFSunLogo
            layout="horizontal"
            size="md"
            onClick={onGoHome}
          />

          {/* Primary Navigation Links (Desktop lg+) */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {/* Direct Home Link */}
            <button
              onClick={onGoHome}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition whitespace-nowrap cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t("home", "Home")}</span>
            </button>

            {/* PDF Tools Mega Dropdown */}
            <div className="relative" ref={toolsDropdownRef}>
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                onMouseEnter={() => setToolsDropdownOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition whitespace-nowrap cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t("allTools", "All PDF Tools")}</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${toolsDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {toolsDropdownOpen && (
                <div
                  onMouseLeave={() => setToolsDropdownOpen(false)}
                  className="absolute top-full left-0 w-[420px] max-w-[90vw] mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  {/* Inline Tool Search & Category Filter */}
                  <div className="mb-2.5 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={toolsSearchQuery}
                        onChange={(e) => setToolsSearchQuery(e.target.value)}
                        placeholder={`Quick find among ${ALL_TOOLS.length} tools...`}
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      {toolsSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setToolsSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Chips */}
                    {!toolsSearchQuery && (
                      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                        {[
                          { id: "all", label: "Popular" },
                          { id: "convert", label: "Convert" },
                          { id: "organize", label: "Organize" },
                          { id: "security", label: "Security" },
                          { id: "ai", label: "AI Suite" },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setToolsActiveCategory(cat.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                              toolsActiveCategory === cat.id
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filtered Tools List */}
                  <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {(() => {
                      let displayedTools = ALL_TOOLS;
                      if (toolsSearchQuery.trim()) {
                        const q = toolsSearchQuery.toLowerCase().trim();
                        displayedTools = ALL_TOOLS.filter(
                          (t) =>
                            t.name.toLowerCase().includes(q) ||
                            t.description.toLowerCase().includes(q) ||
                            t.category.toLowerCase().includes(q)
                        );
                      } else if (toolsActiveCategory === "all") {
                        displayedTools = ALL_TOOLS.filter((t) => t.isPopular || t.isStudentFavorite).slice(0, 10);
                      } else if (toolsActiveCategory === "ai") {
                        displayedTools = ALL_TOOLS.filter((t) => t.isAi || t.category === "ai");
                      } else if (toolsActiveCategory === "security") {
                        displayedTools = ALL_TOOLS.filter(
                          (t) =>
                            t.category === "security" ||
                            ["protect-pdf", "unlock-pdf", "flatten-pdf", "redact-pdf", "watermark-pdf"].includes(t.id)
                        );
                      } else if (toolsActiveCategory === "organize") {
                        displayedTools = ALL_TOOLS.filter(
                          (t) =>
                            t.category === "edit" ||
                            ["merge-pdf", "split-pdf", "rotate-pdf", "remove-pages", "organize-pdf", "extract-pages"].includes(t.id)
                        );
                      } else if (toolsActiveCategory === "convert") {
                        displayedTools = ALL_TOOLS.filter((t) => t.category === "convert").slice(0, 12);
                      }

                      if (displayedTools.length === 0) {
                        return (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No tools found matching "{toolsSearchQuery}"
                          </div>
                        );
                      }

                      return displayedTools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            onSelectTool(tool);
                            setToolsDropdownOpen(false);
                            setToolsSearchQuery("");
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 transition text-slate-700 dark:text-slate-200 group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold group-hover:scale-105 transition shrink-0">
                              {tool.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate flex items-center space-x-1.5">
                                <span>{tool.name}</span>
                                {tool.badge && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                    {tool.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[260px]">{tool.description}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0">
                            Open →
                          </span>
                        </button>
                      ));
                    })()}
                  </div>

                  {/* Mega-menu Bottom Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      {ALL_TOOLS.length} Total WebAssembly Tools
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        handleOpenSearchModal();
                      }}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Command Palette</span>
                      <kbd className="px-1 py-0.5 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">⌘K</kbd>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Tools Suite Pill */}
            {aiTools.length > 0 && (
              <button
                onClick={() => onSelectTool(aiTools[0])}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition shadow-2xs whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t("aiSuite", "AI Suite")}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-600 text-white rounded-full font-mono font-bold">
                  PRO
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* ========================================================= */}
        {/* ZONE 2: CENTER ZONE (Compact SaaS Search Bar)             */}
        {/* ========================================================= */}
        <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-2 justify-center">
          <button
            type="button"
            onClick={handleOpenSearchModal}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs whitespace-nowrap cursor-pointer group"
            title={`Command Palette (${isMac ? "Cmd+K" : "Ctrl+K"})`}
            aria-label="Open Command Palette tool search modal"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                {t("searchTools", `Search ${ALL_TOOLS.length} tools...`)}
              </span>
            </div>

            {/* Visual Shortcut Badge next to search input */}
            <div className="flex items-center space-x-1 shrink-0 ml-2">
              <span className="hidden sm:inline-flex items-center space-x-0.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 shadow-2xs group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <span>{isMac ? "⌘" : "Ctrl+"}</span>
                <span>K</span>
              </span>
            </div>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ZONE 3: RIGHT ZONE (Actions, Theme, Language & Auth)      */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 ml-auto">
          
          {/* Mobile/Tablet Search Icon Trigger (< md) */}
          <button
            type="button"
            onClick={handleOpenSearchModal}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={`Search Tools (${isMac ? "⌘K" : "Ctrl+K"})`}
            aria-label="Search Tools"
          >
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Language Switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Single Unified Theme Selector */}
          <div className="relative" ref={themeDropdownRef}>
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs flex items-center space-x-1.5 cursor-pointer ${
                themeMode === "dark"
                  ? "bg-slate-800 text-blue-300 border-slate-700 hover:bg-slate-700"
                  : themeMode === "eye-protection"
                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40"
                  : themeMode === "aurora"
                  ? "bg-indigo-950/80 text-sky-300 border-indigo-500/40"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              }`}
              title={`Current Theme: ${themeMode}. Click to switch.`}
              aria-label="Change Display Theme"
            >
              {themeMode === "system" && <Laptop className="w-4 h-4 text-indigo-500" />}
              {themeMode === "light" && <Sun className="w-4 h-4 text-amber-500 fill-amber-400/30" />}
              {themeMode === "dark" && <Moon className="w-4 h-4 text-blue-400 fill-blue-400/30" />}
              {themeMode === "eye-protection" && <Eye className="w-4 h-4 text-amber-600 fill-amber-500/30" />}
              {themeMode === "aurora" && <Sparkles className="w-4 h-4 text-sky-300" />}

              <span className="hidden md:inline font-bold">
                {themeMode === "system"
                  ? "Auto"
                  : themeMode === "light"
                  ? "Light"
                  : themeMode === "dark"
                  ? "Dark"
                  : themeMode === "eye-protection"
                  ? "Eye Care"
                  : "Aurora"}
              </span>
              <ChevronDown className={`w-3 h-3 hidden md:inline transition-transform duration-200 ${themeDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Theme Dropdown Menu */}
            <AnimatePresence>
              {themeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1"
                >
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Display Theme
                  </div>
                  {[
                    { id: "system", label: "System Auto", desc: "Matches OS settings", icon: Laptop, color: "text-indigo-500" },
                    { id: "light", label: "Light Mode", desc: "Crisp daylight UI", icon: Sun, color: "text-amber-500" },
                    { id: "dark", label: "Dark Mode", desc: "OLED midnight theme", icon: Moon, color: "text-blue-400" },
                    { id: "eye-protection", label: "Eye Care", desc: "Warm sepia filter", icon: Eye, color: "text-amber-600" },
                    { id: "aurora", label: "Aurora Glass", desc: "Vibrant frosted glass", icon: Sparkles, color: "text-sky-400" },
                  ].map((opt) => {
                    const IconComp = opt.icon;
                    const isActive = themeMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (setThemeMode) {
                            setThemeMode(opt.id as any);
                          } else {
                            setDarkMode(opt.id === "dark" || opt.id === "aurora");
                          }
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <IconComp className={`w-4 h-4 ${opt.color}`} />
                          <div>
                            <div className="text-xs font-bold">{opt.label}</div>
                            <div className="text-[10px] text-slate-400">{opt.desc}</div>
                          </div>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary CTA / User Profile / Admin Menu */}
          <div className="relative" ref={profileDropdownRef}>
            {hasAdminRights ? (
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-95 transition cursor-pointer text-xs font-bold"
                aria-label="Open Admin Menu"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden sm:inline uppercase tracking-wider text-[11px] font-black">
                  {currentRole === "owner" ? "Owner" : "Admin"}
                </span>
                <ChevronDown className="w-3 h-3 opacity-80 shrink-0" />
              </button>
            ) : userProfile !== null ? (
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer text-xs font-bold"
                aria-label="Open User Menu"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {(userProfile.name || "U")[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate">
                  {userProfile.name.split(" ")[0]}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal("customer")}
                  className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 whitespace-nowrap cursor-pointer active:scale-95"
                  aria-label="Login or Sign In"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("login", "Login / Sign In")}</span>
                </button>
              </div>
            )}

            {/* Profile / Admin Navigation Dropdown */}
            {profileDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 z-50 animate-in fade-in"
              >
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-1">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                    <span className="truncate pr-2">{userProfile?.name || "Customer Account"}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      {currentRole === "owner" ? "OWNER" : userProfile?.hasAdminAccess ? "ADMIN" : "PRO"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{userProfile?.email || "customer@pdfsun.in"}</div>
                </div>

                {/* ADMIN ONLY MENU ITEMS */}
                {hasAdminRights && (
                  <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
                      <span>{currentRole === "owner" ? "Owner Administration" : "Admin Suite"}</span>
                      {adminEditModeActive && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black border border-amber-500/30">
                          BAR ACTIVE
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-bold flex items-center space-x-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 transition shadow-2xs cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      <span>{t("adminPanel", "Open Admin Dashboard")}</span>
                    </button>

                    {onOpenCms && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenCms();
                        }}
                        className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                        <span>Live Site CMS Editor</span>
                      </button>
                    )}

                    {onToggleAdminEditMode && (
                      <button
                        onClick={() => onToggleAdminEditMode()}
                        className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Sliders className="w-3.5 h-3.5 text-slate-500" />
                          <span>Admin Control Bar</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            adminEditModeActive
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                          }`}
                        >
                          {adminEditModeActive ? "ON" : "OFF"}
                        </span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAdminPanel("analytics");
                        }}
                        className="p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <BarChart3 className="w-3 h-3 text-blue-500" />
                        <span>Analytics</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAdminPanel("finance");
                        }}
                        className="p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Wallet className="w-3 h-3 text-emerald-500" />
                        <span>Finance</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAdminPanel("users");
                        }}
                        className="p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Users className="w-3 h-3 text-cyan-500" />
                        <span>Users & RBAC</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAdminPanel("settings");
                        }}
                        className="p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Settings className="w-3 h-3 text-slate-400" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* USER SHORTCUTS: FAVORITES & RECENT FILES */}
                <div className="space-y-0.5 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenFavorites();
                    }}
                    className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Star className={`w-3.5 h-3.5 ${favorites.length > 0 ? "fill-amber-400 text-amber-400" : "text-amber-500"}`} />
                      <span>{t("favorites.title", "Favorite Tools")}</span>
                    </div>
                    {favorites.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                        {favorites.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t("history", "Recent History")}</span>
                  </button>

                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenUserDashboard();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t("dashboard", "User Dashboard")}</span>
                    </button>
                  )}
                </div>

                {/* LOGOUT BUTTON */}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full p-2 rounded-xl text-left text-xs font-bold flex items-center space-x-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t("logout", "Logout")}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle (< 1024px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RESPONSIVE MOBILE & TABLET SLIDE-OVER DRAWER (< 1024px)   */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#0b1120]/98 backdrop-blur-xl p-4 space-y-3 animate-in slide-in-from-top-2">

          {/* Mobile Quick Search Button */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchOverlayOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t("searchTools", `Search ${ALL_TOOLS.length} PDF tools...`)}</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">Ctrl+K</kbd>
          </button>

          {/* Mobile Navigation Links */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onGoHome();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition cursor-pointer"
            >
              <Home className="w-4 h-4 text-blue-600" />
              <span>{t("home", "Home")}</span>
            </button>

            {aiTools.length > 0 && (
              <button
                onClick={() => {
                  onSelectTool(aiTools[0]);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-xs cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t("aiSuite", "AI PDF Tools Suite")}</span>
                </div>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">PRO</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenFavorites();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span>{t("favorites.title", "Favorite Tools")}</span>
              </div>
              {favorites.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onOpenHistory();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{t("history", "Recent History")}</span>
            </button>
          </div>

          {/* Mobile Language Switcher Row */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t("language", "Language")}</span>
            </span>
            <LanguageSwitcher variant="dropdown" />
          </div>

          {/* Mobile Theme Switcher Row */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {t("themeMode", "Website Theme")}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "Auto", icon: Laptop },
              ].map((m) => {
                const IconComponent = m.icon;
                const isActive = themeMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (setThemeMode) setThemeMode(m.id as any);
                      else setDarkMode(m.id === "dark" || m.id === "aurora");
                    }}
                    className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ADMIN MOBILE MENU OPTIONS */}
          {isAdminOrOwner && (
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 px-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Suite {currentRole === "owner" ? "(Owner)" : "(Granted)"}</span>
                </span>
                {adminEditModeActive && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black border border-amber-500/30">
                    BAR ACTIVE
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminPanel();
                }}
                className="w-full p-2 rounded-xl text-left text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center space-x-2 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Open Admin Dashboard</span>
              </button>

              {onOpenCms && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCms();
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs font-bold text-slate-800 dark:text-slate-200 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 flex items-center space-x-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Live Site CMS Editor</span>
                </button>
              )}

              {onToggleAdminEditMode && (
                <button
                  onClick={() => onToggleAdminEditMode()}
                  className="w-full p-2 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Admin Control Bar</span>
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      adminEditModeActive
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    {adminEditModeActive ? "ON" : "OFF"}
                  </span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("analytics");
                  }}
                  className="p-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer"
                >
                  Analytics
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("finance");
                  }}
                  className="p-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer"
                >
                  Finance
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("users");
                  }}
                  className="p-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer"
                >
                  Users & RBAC
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("settings");
                  }}
                  className="p-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer"
                >
                  Settings
                </button>
              </div>
            </div>
          )}

          {/* GUEST AUTH BUTTONS (MOBILE) */}
          {!isAuthenticated && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal("customer");
                }}
                className="w-full p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>{t("login", "Login / Sign In")}</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t("privacyNote", "100% Local Privacy")}</span>
            </span>
            <span className="font-mono text-[10px]">pdfsun.in</span>
          </div>
        </div>
      )}

      {/* Centralized Search Modal */}
      <SearchModal
        isOpen={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        onSelectTool={onSelectTool}
        favorites={favorites}
      />

      {/* Brand Identity Master Showcase Modal */}
      {showBrandShowcase && (
        <PDFSunBrandShowcaseModal onClose={() => setShowBrandShowcase(false)} />
      )}
    </header>
  );
};

