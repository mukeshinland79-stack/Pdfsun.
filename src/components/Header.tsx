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
  Wallet,
  Download,
  WifiOff,
  Eye,
  EyeOff,
  Palette,
  Laptop,
  Activity,
  Share2,
} from "lucide-react";
import { ALL_TOOLS } from "../data/toolsData";
import { ToolItem, UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";
import { useLanguage, SUPPORTED_LANGUAGES } from "../lib/i18n";
import { SearchOverlay } from "./SearchOverlay";
import { SearchModal } from "./SearchModal";
import { LanguageSelector } from "./LanguageSelector";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { usePWAStatus } from "../pwaRegister";
import { PDFSunLogo } from "./PDFSunLogo";
import { PDFSunBrandShowcaseModal } from "./PDFSunBrandShowcaseModal";

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
  onOpenAuthModal: () => void;
  onOpenAdminPanel: (tab?: string) => void;
  onOpenUserDashboard: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  onOpenShareModal?: () => void;
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
  onOpenAuthModal,
  onOpenAdminPanel,
  onOpenUserDashboard,
  onLogout,
  onGoHome,
  onOpenShareModal,
}) => {
  const { currentLanguage, setLanguage, languageOption, isRtl, t } = useLanguage();
  const { isOffline, isInstallable, installPWA } = usePWAStatus();

  // Admin / Owner-Only access rule: Strictly check if user is authenticated AND holds owner role, dual owner email, or admin access flag
  const userEmail = (userProfile?.email || "").toLowerCase().trim();
  const isDualOwnerEmail = DUAL_OWNER_EMAILS.includes(userEmail);
  const isAuthenticated = userProfile !== null;
  const isAdminOrOwner = isAuthenticated && (
    currentRole === "owner" ||
    isDualOwnerEmail ||
    Boolean(userProfile?.hasAdminAccess)
  );
  const hasAdminRights = isAdminOrOwner;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [showBrandShowcase, setShowBrandShowcase] = useState(false);

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
        (e.key === "/" || (e.key && e.key.toLowerCase() === "k"))
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
          (t.name || "").toLowerCase().includes(headerSearchQuery.toLowerCase()) ||
          (t.description || "").toLowerCase().includes(headerSearchQuery.toLowerCase()) ||
          (t.category || "").toLowerCase().includes(headerSearchQuery.toLowerCase())
      )
    : [];

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#0f172a]/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ${
        scrolled ? "shadow-md" : "shadow-xs"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-6">
        {/* Zone 1: Left Zone (Brand Logo & Navigation Dropdowns) */}
        <div className="flex items-center space-x-3 lg:space-x-4 shrink-0">
          <PDFSunLogo
            layout="horizontal"
            size="md"
            onClick={onGoHome}
          />

          {/* Core Navigation Links & Dropdowns (Desktop lg+) */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Direct Home Link */}
            <button
              onClick={onGoHome}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t("home", "Home")}</span>
            </button>

            {/* PDF Tools Mega Dropdown */}
            <div className="relative">
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                onMouseEnter={() => setToolsDropdownOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition whitespace-nowrap"
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/20 transition shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t("aiSuite", "AI Suite")}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-blue-600 text-white rounded-full font-mono font-bold">
                3.6
              </span>
            </button>
          </div>
        </div>

        {/* Zone 2: Center Zone (Compact Search Bar Trigger) */}
        <div className="flex-1 max-w-xs sm:max-w-sm lg:max-w-md mx-2 flex justify-center">
          <button
            type="button"
            onClick={() => setSearchOverlayOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs whitespace-nowrap cursor-pointer"
            title={`Search ${ALL_TOOLS.length} PDF Tools (Ctrl+K)`}
            aria-label="Open tool search modal"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t("searchTools", `Search ${ALL_TOOLS.length} PDF tools...`)}
              </span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400 shrink-0 ml-2">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Zone 3: Right Zone (Language, Theme, Auth & Mobile Menu) */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 ml-auto">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* PWA Offline / Install Badge */}
          {isOffline ? (
            <div
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold shrink-0 whitespace-nowrap"
              title="You are currently offline. Client-side PDF tools remain fully functional."
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode</span>
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={installPWA}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition text-xs font-bold shadow-xs shrink-0 whitespace-nowrap"
              title="Install PDFSun App for offline desktop & mobile access"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          ) : null}

          {/* Favorites Counter */}
          <button
            onClick={onOpenFavorites}
            className="hidden sm:flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            title={t("favorites.title", "Favorite Tools")}
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
            className="hidden sm:flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={t("history", "Recent History")}
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Share PDFSun Modal Button */}
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-extrabold text-xs transition shadow-xs"
              title="Share PDFSun with friends or colleagues"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Share</span>
            </button>
          )}

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
            {hasAdminRights ? (
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 pl-3 pr-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-md hover:opacity-95 transition"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
                  {t("adminPanel", "Admin")}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : userProfile !== null ? (
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 pl-3 pr-2.5 rounded-xl bg-slate-800 dark:bg-slate-800 text-white shadow-md hover:bg-slate-700 transition border border-slate-700"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold hidden sm:inline">{userProfile.name.split(" ")[0]}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onOpenAuthModal}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition shadow-xs flex items-center space-x-1 whitespace-nowrap"
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
                    <span>{userProfile?.name || "Customer User"}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {currentRole === "owner" ? "ADMIN OWNER" : userProfile?.hasAdminAccess ? "ADMIN (GRANTED)" : "CUSTOMER"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono line-clamp-1">{userProfile?.email || "customer@pdfsun.app"}</div>
                </div>

                {/* ADMIN ONLY MENU ITEMS - Securely shown ONLY to Owner or users granted Admin access */}
                {hasAdminRights && (
                  <div className="space-y-0.5 border-b border-slate-100 dark:border-slate-800 pb-1">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {currentRole === "owner" ? "Owner Admin Access" : "Admin Granted Access"}
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
                        onOpenAdminPanel("finance");
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                    >
                      <Wallet className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t("financeHub", "Finance Hub")}</span>
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

                    {isDualOwnerEmail && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAdminPanel("activity_log");
                        }}
                        className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                      >
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span>System Activity Log</span>
                      </button>
                    )}

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
                {(currentRole === "user" || userProfile !== null) && (
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
                      <span>{t("favorites.title", "Favorites")}</span>
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

          {/* Mobile Menu Toggle (< 1024px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile & Tablet Slide-over Drawer Menu (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 space-y-3 animate-in slide-in-from-top-2">

          {/* Mobile Quick Search Button */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchOverlayOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t("searchTools", `Search ${ALL_TOOLS.length} PDF tools...`)}</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">Ctrl+K</kbd>
          </button>

          {/* Mobile Language Switcher Row */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t("language", "Language")}</span>
            </span>
            <LanguageSwitcher variant="pills" />
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

          {/* Mobile Navigation Links */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onGoHome();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition"
            >
              <Home className="w-4 h-4 text-blue-600" />
              <span>{t("home", "Home")}</span>
            </button>

            <button
              onClick={() => {
                onSelectTool(aiTools[0]);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-xs"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>{t("aiSuite", "AI PDF Tools")}</span>
              </div>
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">GEMINI 3.6</span>
            </button>
          </div>

          {/* ADMIN MOBILE MENU OPTIONS - Strict RBAC: Shown ONLY if user is authenticated AND holds Admin/Owner role */}
          {isAdminOrOwner && (
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-1">
              <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 px-2 py-1 flex items-center space-x-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Owner Controls {currentRole === "owner" ? "(Owner)" : "(Granted Access)"}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("profile");
                  }}
                  className="p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
                >
                  Admin Profile
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("analytics");
                  }}
                  className="p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
                >
                  Analytics
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("users");
                  }}
                  className="p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
                >
                  Users
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("files");
                  }}
                  className="p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
                >
                  Files
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("ads");
                  }}
                  className="p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
                >
                  Ads
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("settings");
                  }}
                  className="p-2 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg"
                >
                  Settings
                </button>
              </div>
            </div>
          )}

          {/* LOGGED IN CUSTOMER DASHBOARD */}
          {isAuthenticated && !isAdminOrOwner && (
            <div className="space-y-1 pt-1">
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
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("logout", "Logout")}</span>
              </button>
            </div>
          )}

          {/* GUEST LOGIN BUTTON */}
          {!isAuthenticated && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="w-full p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-xs"
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
