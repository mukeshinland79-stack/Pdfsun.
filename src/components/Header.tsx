import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Moon,
  Search,
  Star,
  Clock,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
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
  QrCode,
  Sparkles,
  Share2,
  FileText,
  Languages,
  Zap,
  Briefcase,
  FileCheck,
} from "lucide-react";
import { ALL_TOOLS } from "../data/toolsData";
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
  onOpenTodayInHistory?: () => void;
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
  onOpenTodayInHistory,
  onOpenShareModal,
}) => {
  const { t } = useLanguage();

  // Strict RBAC authorization: Server token verified & cryptographic role checked
  const isAuthenticated = Boolean(userProfile && userProfile.email && currentRole !== "public");
  const hasAdminRights = Boolean(canAccessAdmin) && isAuthenticated && checkAdminRole(userProfile, currentRole);
  const isAdminOrOwner = hasAdminRights;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [showBrandShowcase, setShowBrandShowcase] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelectSpecificTool = (toolId: string) => {
    const targetTool = ALL_TOOLS.find((t) => t.id === toolId);
    if (targetTool) {
      onSelectTool(targetTool);
    }
  };

  // Close dropdowns on outside click or touch
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Track window scroll for elevated header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
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

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-[#0b1120]/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-200 ${
        scrolled ? "shadow-md" : "shadow-xs"
      }`}
    >
      {/* ========================================================= */}
      {/* PRIMARY CLEAN TOP BAR: Brand Logo, Global Search & Controls */}
      {/* ========================================================= */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 py-2 sm:py-2.5 min-h-[3.75rem]">
          
          {/* ZONE 1: BRAND LOGO */}
          <div className="flex items-center shrink-0">
            <PDFSunLogo
              layout="horizontal"
              size="md"
              onClick={onGoHome}
            />
          </div>

          {/* ZONE 2: CENTER RESPONSIVE GLOBAL SEARCH BAR */}
          <div className="flex flex-1 max-w-xs sm:max-w-md md:max-w-lg mx-2">
            <button
              type="button"
              onClick={handleOpenSearchModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs cursor-pointer group gap-1"
              title={`Command Palette (${isMac ? "Cmd+K" : "Ctrl+K"})`}
              aria-label="Open Command Palette tool search modal"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                  {t("searchTools", `Search ${ALL_TOOLS.length} PDF tools...`)}
                </span>
              </div>

              {/* Visual Shortcut Badge */}
              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 shadow-2xs group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span>{isMac ? "⌘" : "Ctrl+"}</span>
                  <span>K</span>
                </span>
              </div>
            </button>
          </div>

          {/* ZONE 3: ESSENTIAL RIGHT ACTIONS (Language, Theme & Auth/Profile) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            
            {/* Language Selector */}
            <LanguageSwitcher showLabel={true} align="right" />

            {/* Theme Selector */}
            <div className="relative" ref={themeDropdownRef}>
              <button
                type="button"
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
                    className="absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-[9999] space-y-1"
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
                          type="button"
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
                          {isActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-auto" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile / Admin / Auth Menu */}
            <div className="relative" ref={profileDropdownRef}>
              {hasAdminRights ? (
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:opacity-95 transition cursor-pointer text-xs font-bold"
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
                  type="button"
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
                <button
                  type="button"
                  onClick={() => onOpenAuthModal("customer")}
                  className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 whitespace-nowrap cursor-pointer active:scale-95"
                  aria-label="Login or Sign In"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("login", "Login / Sign In")}</span>
                </button>
              )}

              {/* Profile / Admin Navigation Dropdown */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 z-[9999] animate-in fade-in"
                >
                  <div className="w-full p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1 space-y-1">
                    <div className="w-full flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {userProfile?.name || "Customer Account"}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                        currentRole === "owner"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : userProfile?.hasAdminAccess
                          ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                          : userProfile?.isPro
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      }`}>
                        {currentRole === "owner"
                          ? "FOUNDER & OWNER"
                          : userProfile?.hasAdminAccess
                          ? "ADMIN ACCESS"
                          : userProfile?.isPro
                          ? "PRO CUSTOMER"
                          : "FREE CUSTOMER"}
                      </span>
                    </div>
                    <div className="w-full text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {userProfile?.email
                        ? currentRole === "owner" || DUAL_OWNER_EMAILS.includes((userProfile.email || "").toLowerCase().trim())
                          ? userProfile.email.replace(/^(.{4})(.*)(.@.*)$/, "$1*********$3")
                          : userProfile.email
                        : "customer@pdfsun.in"}
                    </div>
                  </div>

                  {/* ADMIN ONLY MENU ITEMS */}
                  {hasAdminRights && (
                    <div className="w-full space-y-1 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                      <div className="w-full px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between gap-1">
                        <span>{currentRole === "owner" ? "Owner Administration" : "Admin Suite"}</span>
                        {adminEditModeActive && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black border border-amber-500/30">
                            BAR ACTIVE
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
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
                          type="button"
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
                          type="button"
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

                      <div className="w-full grid grid-cols-2 gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("analytics");
                          }}
                          className="w-full p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <BarChart3 className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">Analytics</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("finance");
                          }}
                          className="w-full p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Wallet className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">Finance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("users");
                          }}
                          className="w-full p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Users className="w-3 h-3 text-cyan-500 shrink-0" />
                          <span className="truncate">Users & RBAC</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("settings");
                          }}
                          className="w-full p-1.5 rounded-lg text-left text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Settings className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">Settings</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* USER SHORTCUTS: FAVORITES, HISTORY & DASHBOARD */}
                  <div className="w-full space-y-0.5 border-b border-slate-100 dark:border-slate-800 pb-1">
                    <button
                      type="button"
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
                      type="button"
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
                        type="button"
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

                    {onOpenShareModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenShareModal();
                        }}
                        className="w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Share &amp; Scan QR Code</span>
                      </button>
                    )}
                  </div>

                  {/* LOGOUT BUTTON */}
                  {isAuthenticated && (
                    <button
                      type="button"
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

            {/* Mobile Menu Toggle Button (< lg screens) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RESPONSIVE MOBILE SLIDE-OVER DRAWER (< lg)                */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="w-full lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#0b1120]/98 backdrop-blur-xl p-4 space-y-3 animate-in slide-in-from-top-2 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">

          {/* Mobile Quick Search Button */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchOverlayOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer gap-2"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">{t("searchTools", `Search ${ALL_TOOLS.length} PDF tools...`)}</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400 shrink-0 ml-auto">Ctrl+K</kbd>
          </button>

          {/* Mobile Essential Navigation Links */}
          <div className="w-full space-y-1">
            <button
              type="button"
              onClick={() => {
                onGoHome();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition cursor-pointer"
            >
              <Home className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{t("home", "Home")}</span>
            </button>

            {/* Mobile AI Tools Quick Grid */}
            <div className="w-full p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>AI Suite Tools</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {/* Summary */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSelectSpecificTool("ai-pdf-summary");
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 cursor-pointer hover:border-blue-400 transition"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Summary</span>
                </button>

                {/* Translate */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSelectSpecificTool("ai-translate-pdf");
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 cursor-pointer hover:border-blue-400 transition"
                >
                  <Languages className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Translate</span>
                </button>

                {/* Resume Ready */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSelectSpecificTool("ai-resume-builder");
                  }}
                  className="p-2 rounded-lg bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/30 text-left text-xs font-bold text-orange-900 dark:text-orange-200 flex items-center justify-between cursor-pointer hover:border-orange-400 transition col-span-2"
                >
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                    <span>Resume Ready</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded font-black uppercase">
                    ATS
                  </span>
                </button>

                {/* AI Chat */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSelectSpecificTool("ai-chat-pdf");
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 cursor-pointer hover:border-indigo-400 transition col-span-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">AI Chat with PDF</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenFavorites();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition cursor-pointer gap-2"
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t("favorites.title", "Favorite Tools")}</span>
              </div>
              {favorites.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold shrink-0 ml-auto">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenHistory();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{t("history", "Recent History")}</span>
            </button>

            {onOpenShareModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenShareModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Share PDFSun &amp; QR Code</span>
                </div>
                <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            )}
          </div>

          {/* Mobile Language Switcher Row */}
          <div className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{t("language", "Language")}</span>
            </span>
            <LanguageSwitcher variant="dropdown" />
          </div>

          {/* Mobile Theme Switcher Row */}
          <div className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {t("themeMode", "Website Theme")}
            </span>
            <div className="w-full grid grid-cols-3 gap-1.5">
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
                    type="button"
                    onClick={() => {
                      if (setThemeMode) setThemeMode(m.id as any);
                      else setDarkMode(m.id === "dark" || m.id === "aurora");
                    }}
                    className={`w-full flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
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
            <div className="w-full p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <div className="w-full text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 px-1 flex items-center justify-between gap-1">
                <span className="flex items-center space-x-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Admin Suite {currentRole === "owner" ? "(Owner)" : "(Granted)"}</span>
                </span>
                {adminEditModeActive && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black border border-amber-500/30">
                    BAR ACTIVE
                  </span>
                )}
              </div>

              <button
                type="button"
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
                  type="button"
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
                  type="button"
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

              <div className="w-full grid grid-cols-2 gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("analytics");
                  }}
                  className="w-full p-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Analytics</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("finance");
                  }}
                  className="w-full p-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">Finance</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("users");
                  }}
                  className="w-full p-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <span className="truncate">Users & RBAC</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel("settings");
                  }}
                  className="w-full p-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* AUTHENTICATED USER CARD (MOBILE) */}
          {isAuthenticated && userProfile && (
            <div className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {(userProfile.name || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {userProfile.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                      {currentRole === "owner" ? "OWNER" : userProfile.hasAdminAccess ? "ADMIN" : userProfile.isPro ? "PRO" : "FREE"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    {userProfile.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenUserDashboard();
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t("logout", "Logout")}</span>
                </button>
              </div>
            </div>
          )}

          {/* GUEST AUTH BUTTON (MOBILE) */}
          {!isAuthenticated && (
            <div className="w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal("customer");
                }}
                className="w-full p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer active:scale-98"
              >
                <User className="w-4 h-4" />
                <span>{t("login", "Login / Sign In")}</span>
              </button>
            </div>
          )}

          <div className="w-full pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 gap-1">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
