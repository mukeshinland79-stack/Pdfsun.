import React, { useState, useEffect, useRef } from "react";
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
  FolderKanban,
  DollarSign,
  Settings,
  Terminal,
  DatabaseBackup,
  Globe,
  Home,
  Check,
  FileSpreadsheet,
  HelpCircle,
  BookOpen,
  UserCheck,
  Download,
  WifiOff,
  Eye,
  EyeOff,
  Palette,
  Laptop,
} from "lucide-react";
import { ALL_TOOLS } from "../data/toolsData";
import { ToolItem, UserRole, UserProfile } from "../types";
import { useLanguage, SUPPORTED_LANGUAGES } from "../lib/i18n";
import { SearchOverlay } from "./SearchOverlay";
import { SearchModal } from "./SearchModal";
import { LanguageSelector } from "./LanguageSelector";
import { usePWAStatus } from "../pwaRegister";

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
  onOpenAuthModal: () => void;
  onOpenAdminPanel: (tab?: string) => void;
  onOpenUserDashboard: () => void;
  onLogout: () => void;
  onGoHome: () => void;
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
  onOpenAuthModal,
  onOpenAdminPanel,
  onOpenUserDashboard,
  onLogout,
  onGoHome,
}) => {
  const { currentLanguage, setLanguage, languageOption, isRtl, t } = useLanguage();
  const { isOffline, isInstallable, installPWA } = usePWAStatus();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Close theme dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Instant Search & Overlay State
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track window scroll for elevated header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global Keyboard Shortcut listener (Ctrl+/ or Cmd+/ or Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "/" || e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        setSearchOverlayOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const popularTools = ALL_TOOLS.filter((t) => t.isPopular).slice(0, 8);
  const aiTools = ALL_TOOLS.filter((t) => t.isAi);

  // Live filtered suggestions for instant header search
  const filteredSearchTools = headerSearchQuery.trim()
    ? ALL_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(headerSearchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(headerSearchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(headerSearchQuery.toLowerCase())
      )
    : [];

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#0f172a]/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ${
        scrolled ? "shadow-md" : "shadow-xs"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            className="flex items-center space-x-2.5 cursor-pointer group"
            onClick={onGoHome}
            title="PDFSun Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center transition group-hover:scale-105">
              <div className="w-full h-full bg-slate-950 dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sun className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  PDFSun
                </span>
                <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  PRO
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">pdfsun.vercel.app</span>
            </div>
          </div>

          {/* Direct Home Link */}
          <button
            onClick={onGoHome}
            className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t("home", "Home")}</span>
          </button>
        </div>

        {/* Center Professional Feature & Status Highlight (Replacing Search Bar) */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>100% In-Browser Privacy</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">50+ Pro PDF Utilities</span>
        </div>

        {/* Nav Items & Dropdowns */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">

          {/* PDF Tools Mega Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              onMouseEnter={() => setToolsDropdownOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t("allTools", "All PDF Tools")}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {toolsDropdownOpen && (
              <div
                onMouseLeave={() => setToolsDropdownOpen(false)}
                className="absolute top-full left-0 w-80 mt-1 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 grid grid-cols-1 gap-1 z-50 animate-in fade-in slide-in-from-top-2"
              >
                <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("popularTools", "Popular Tools")}
                </div>
                {popularTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      onSelectTool(tool);
                      setToolsDropdownOpen(false);
                    }}
                    className="flex items-center space-x-2.5 p-2 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 transition text-slate-700 dark:text-slate-200 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold group-hover:scale-105 transition">
                      {tool.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {tool.name}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{tool.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Tools Suite Pill */}
          <button
            onClick={() => onSelectTool(aiTools[0])}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/20 transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t("aiSuite", "AI Suite")}</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-blue-600 text-white rounded-full font-mono font-bold">
              3.6
            </span>
          </button>

          {/* Language Selector Component */}
          <LanguageSelector />

          {/* PWA Offline / Install Badge */}
          {isOffline ? (
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold shrink-0"
              title="You are currently offline. Client-side PDF tools remain fully functional."
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline Mode</span>
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={installPWA}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition text-xs font-bold shadow-xs shrink-0"
              title="Install PDFSun App for offline desktop & mobile access"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          ) : null}

          {/* Quick Search Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setSearchOverlayOpen(true)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs"
            title="Search 50+ PDF Tools (Ctrl+K)"
            aria-label="Open tool search modal"
          >
            <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400">
              Ctrl+K
            </kbd>
          </button>

          {/* Favorites Counter */}
          <button
            onClick={onOpenFavorites}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            title={t("favorites", "Favorite Tools")}
          >
            <Star className={`w-4 h-4 ${favorites.length > 0 ? "fill-amber-400 text-amber-400" : ""}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {favorites.length}
              </span>
            )}
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={t("history", "Recent History")}
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Single Unified Theme Control Icon & Dropdown Selector */}
          <div className="relative" ref={themeDropdownRef}>
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border shadow-xs ${
                themeMode === "eye-protection"
                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 ring-2 ring-amber-500/20"
                  : themeMode === "aurora"
                  ? "bg-indigo-950/80 text-sky-300 border-indigo-500/40 ring-2 ring-indigo-500/20"
                  : themeMode === "dark"
                  ? "bg-slate-800 text-blue-300 border-slate-700 hover:bg-slate-700"
                  : themeMode === "system"
                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80"
              }`}
              title={
                themeMode === "eye-protection"
                  ? "Current Theme: Eye Protection Mode (Warm sepia & reduced blue light)"
                  : themeMode === "aurora"
                  ? "Current Theme: Aurora Glass (Animated gradient & frosted glass UI)"
                  : themeMode === "dark"
                  ? "Current Theme: Standard Dark Mode (Low-light midnight theme)"
                  : themeMode === "system"
                  ? "Current Theme: System Auto Mode (Matches OS theme)"
                  : "Current Theme: Standard Light Mode (Bright daylight interface)"
              }
              aria-label={`Current Theme: ${themeMode || "light"}. Click to change theme.`}
            >
              {themeMode === "system" && <Laptop className="w-4 h-4 text-indigo-500" />}
              {themeMode === "light" && <Sun className="w-4 h-4 text-amber-500 fill-amber-400/30" />}
              {themeMode === "dark" && <Moon className="w-4 h-4 text-blue-400 fill-blue-400/30" />}
              {themeMode === "eye-protection" && <Eye className="w-4 h-4 text-amber-600 fill-amber-500/30" />}
              {themeMode === "aurora" && <Sparkles className="w-4 h-4 text-sky-300 animate-pulse" />}

              <span className="hidden sm:inline font-bold">
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
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${themeDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {themeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 p-2 z-50 space-y-1"
                >
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Select Display Theme
                  </div>
                  {[
                    {
                      id: "system",
                      label: "System Auto",
                      desc: "Matches OS dark/light setting",
                      tooltip: "System Auto Mode: Automatically syncs with your operating system dark/light schedule",
                      icon: Laptop,
                      color: "text-indigo-500 dark:text-indigo-400",
                    },
                    {
                      id: "light",
                      label: "Light Mode",
                      desc: "High contrast daylight UI",
                      tooltip: "Light Mode: Bright & crisp daytime theme for high readability",
                      icon: Sun,
                      color: "text-amber-500 fill-amber-400/30",
                    },
                    {
                      id: "dark",
                      label: "Dark Mode",
                      desc: "OLED midnight dark theme",
                      tooltip: "Dark Mode: Low-light OLED midnight color scheme for reduced fatigue",
                      icon: Moon,
                      color: "text-blue-400 fill-blue-400/30",
                    },
                    {
                      id: "eye-protection",
                      label: "Eye Protection",
                      desc: "Warm sepia & blue light filter",
                      tooltip: "Eye Protection Mode: Warm sepia filter & blue light reduction for long document reading",
                      icon: Eye,
                      color: "text-amber-600 fill-amber-500/30",
                    },
                    {
                      id: "aurora",
                      label: "Aurora Glass",
                      desc: "Animated gradient & frosted glass",
                      tooltip: "Aurora Glass Theme: Vibrant animated gradient background with frosted glass UI",
                      icon: Sparkles,
                      color: "text-sky-400 animate-pulse",
                    },
                  ].map((opt) => {
                    const IconComp = opt.icon;
                    const isActive = themeMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        title={opt.tooltip}
                        aria-label={`Select ${opt.label}: ${opt.desc}`}
                        onClick={() => {
                          if (setThemeMode) {
                            setThemeMode(opt.id as any);
                          } else {
                            setDarkMode(opt.id === "dark" || opt.id === "aurora");
                          }
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-start space-x-2.5 p-2 rounded-xl text-left transition-all ${
                          isActive
                            ? "bg-blue-50/90 dark:bg-blue-950/70 border border-blue-500/40 ring-2 ring-blue-500/20 shadow-xs"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 transition-colors ${isActive ? "bg-blue-100 dark:bg-blue-900/60 shadow-xs" : "bg-slate-100 dark:bg-slate-800"}`}>
                          <IconComp className={`w-4 h-4 ${opt.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"}`}>
                              {opt.label}
                            </span>
                            {isActive && (
                              <span className="flex items-center space-x-1 text-[10px] font-black tracking-wide text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-md">
                                <span>Active</span>
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? "text-blue-600/80 dark:text-blue-300/80" : "text-slate-400"}`}>{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}

                  {/* Sync with System OS Preference Checkbox */}
                  <div className="pt-2.5 mt-1 border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5">
                    <label
                      className="flex items-center justify-between cursor-pointer group text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      title="Sync with System: Automatically listen to OS light/dark schedule changes"
                    >
                      <div className="flex items-center space-x-2">
                        <Laptop className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          Sync with System
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={syncWithSystem}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (setSyncWithSystem) {
                            setSyncWithSystem(checked);
                          }
                          if (checked && setThemeMode) {
                            setThemeMode("system");
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      />
                    </label>
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-tight">
                      Auto-reverts to Light/Dark whenever your OS theme preference changes
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User & Admin Navigation Menu */}
          <div className="relative">
            {currentRole === "owner" ? (
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 pl-3 pr-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-md hover:opacity-95 transition"
              >
                <Crown className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
                  {t("adminPanel", "Admin")}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : currentRole === "user" ? (
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 pl-3 pr-2.5 rounded-xl bg-slate-800 dark:bg-slate-800 text-white shadow-md hover:bg-slate-700 transition border border-slate-700"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold hidden sm:inline">{userProfile?.name.split(" ")[0]}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onOpenAuthModal}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition shadow-xs flex items-center space-x-1"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t("loginRegister", "Login / Register")}</span>
                </button>
              </div>
            )}

            {/* Profile / Admin Navigation Dropdown */}
            {profileDropdownOpen && (
              <div
                onMouseLeave={() => setProfileDropdownOpen(false)}
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 z-50 animate-in fade-in"
              >
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-1">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{userProfile?.name || "User"}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {currentRole === "owner" ? "ADMIN" : "USER"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono line-clamp-1">{userProfile?.email}</div>
                </div>

                {/* ADMIN ONLY MENU ITEMS - Securely hidden from standard users */}
                {currentRole === "owner" && (
                  <div className="space-y-0.5 border-b border-slate-100 dark:border-slate-800 pb-1">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Mukesh Kalonia (Admin)
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("profile");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("adminProfile", "Admin Profile")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("analytics");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("analyticsDashboard", "Analytics Dashboard")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("users");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("userManagement", "User Management")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("files");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("fileManagement", "File Management")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("ai");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("aiManagement", "AI Management")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("ads");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t("adManagement", "Advertisement Management")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("settings");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t("websiteSettings", "Website Settings")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("reports");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t("reports", "Reports")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("logs");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <Terminal className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t("systemLogs", "System Logs")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAdminPanel("backup");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      <DatabaseBackup className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t("backupRestore", "Backup & Restore")}</span>
                    </button>
                  </div>
                )}

                {/* LOGGED IN USER MENU ITEMS */}
                {currentRole === "user" && (
                  <div className="space-y-0.5 border-b border-slate-100 dark:border-slate-800 pb-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenUserDashboard();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("profile", "Profile")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenUserDashboard();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("dashboard", "Dashboard")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenHistory();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("recentFiles", "Recent Files")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenFavorites();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t("favorites", "Favorites")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenUserDashboard();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("settings", "Settings")}</span>
                    </button>
                  </div>
                )}

                {/* LOGOUT BUTTON */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs font-bold flex items-center space-x-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("logout", "Logout")}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 animate-in slide-in-from-top">

          {/* Mobile Language Switcher Row */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("language", "Language")}
            </span>
            <LanguageSelector compact={false} />
          </div>

          {/* Mobile Theme Switcher Row */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {t("themeMode", "Website Theme")}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: "system", label: "Auto", icon: Laptop },
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "eye-protection", label: "Eye Care", icon: Eye },
                { id: "aurora", label: "Aurora", icon: Sparkles },
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
                    className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
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

          <button
            onClick={onGoHome}
            className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
          >
            <Home className="w-4 h-4 text-blue-600" />
            <span>{t("home", "Home")}</span>
          </button>

          <button
            onClick={() => {
              onSelectTool(aiTools[0]);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-xs"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>{t("aiSuite", "AI Tools")}</span>
            </div>
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">GEMINI 3.6</span>
          </button>

          {/* ADMIN MOBILE MENU OPTIONS */}
          {currentRole === "owner" && (
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1">
              <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 px-2 py-1 flex items-center space-x-1">
                <Crown className="w-3.5 h-3.5" />
                <span>Admin Menu (Mukesh Kalonia)</span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminPanel("profile");
                }}
                className="w-full p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
              >
                Admin Profile
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminPanel("analytics");
                }}
                className="w-full p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
              >
                Analytics Dashboard
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminPanel("users");
                }}
                className="w-full p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
              >
                User Management
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminPanel("files");
                }}
                className="w-full p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
              >
                File Management
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminPanel("ads");
                }}
                className="w-full p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
              >
                Advertisement Management
              </button>
            </div>
          )}

          {currentRole === "user" && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenUserDashboard();
              }}
              className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
            >
              <User className="w-4 h-4 text-blue-600" />
              <span>{t("dashboard", "User Dashboard")}</span>
            </button>
          )}

          {currentRole === "public" && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="w-full p-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>{t("loginRegister", "Login / Register")}</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t("privacyNote", "100% Local Privacy")}</span>
            </span>
            <span className="font-mono text-[10px]">pdfsun.vercel.app</span>
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
    </header>
  );
};
