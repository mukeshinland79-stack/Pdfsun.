import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun, Moon, Search, Sparkles, Star, Clock, Menu, X, ShieldCheck,
  ChevronDown, Layers, Crown, User, LogOut, BarChart3, Users,
  Settings, Globe, Home, Check, Eye, Laptop, Edit3, Sliders, Wallet
} from "lucide-react";

import { ALL_TOOLS } from "../data/toolsData";
import { ToolItem, UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";
import { useLanguage } from "../lib/i18n";
import { SearchModal } from "./SearchModal";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PDFSunLogo } from "./PDFSunLogo";
import { PDFSunBrandShowcaseModal } from "./PDFSunBrandShowcaseModal";
import { checkAdminRole } from "../hooks/useAuth";

export interface HeaderProps {
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
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  themeMode = "light",
  setThemeMode,
  syncWithSystem,
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
  onOpenShareModal,
}) => {
  const { t } = useLanguage();

  // Navigation & Dropdown States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [toolsSearchQuery, setToolsSearchQuery] = useState("");
  const [toolsCategory, setToolsCategory] = useState("all");
  const [isMac, setIsMac] = useState(false);

  // Refs for outside click handling
  const headerRef = useRef<HTMLDivElement>(null);

  // Check Platform for Command Palette hotkey UI
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Shortcuts (Esc & Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "/" || e.key?.toLowerCase() === "k")) {
        e.preventDefault();
        if (onOpenSearch) onOpenSearch();
        else setSearchOverlayOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  // Auth & Admin Status Checks
  const isAuthenticated = userProfile !== null && currentRole !== "public";
  const hasAdminRights = isAuthenticated && (Boolean(canAccessAdmin) || checkAdminRole(userProfile, currentRole));

  const toggleDropdown = useCallback((name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  }, []);

  const handleOpenSearch = useCallback(() => {
    if (onOpenSearch) onOpenSearch();
    else setSearchOverlayOpen(true);
  }, [onOpenSearch]);

  return (
    <header 
      ref={headerRef} 
      className="sticky top-0 z-[999] w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* ================= SECTION 1: LOGO & MAIN NAV ================= */}
        <div className="flex items-center space-x-6 shrink-0">
          <PDFSunLogo layout="horizontal" size="md" onClick={onGoHome} />

          <nav className="hidden lg:flex items-center space-x-1">
            {/* Home Link */}
            <button
              onClick={onGoHome}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            >
              <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t("home", "Home")}</span>
            </button>

            {/* All PDF Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("tools")}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
              >
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t("allTools", "All PDF Tools")}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === "tools" ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {activeDropdown === "tools" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-[1000]"
                  >
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={toolsSearchQuery}
                          onChange={(e) => setToolsSearchQuery(e.target.value)}
                          placeholder="Search 30+ PDF tools..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>

                      {/* Tool Categories */}
                      <div className="flex space-x-1 text-[10px] font-bold overflow-x-auto pb-1 custom-scrollbar">
                        {["all", "convert", "organize", "security", "ai"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setToolsCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg capitalize transition ${
                              toolsCategory === cat
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Tools List */}
                      <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {ALL_TOOLS.filter((t) => {
                          if (toolsSearchQuery) return t.name.toLowerCase().includes(toolsSearchQuery.toLowerCase());
                          if (toolsCategory === "all") return true;
                          return t.category === toolsCategory || (toolsCategory === "ai" && t.isAi);
                        }).slice(0, 12).map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onSelectTool(tool);
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 transition group"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                                {tool.name[0]}
                              </div>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600">
                                {tool.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Open →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* ================= SECTION 2: SEARCH PALETTE ================= */}
        <div className="hidden md:flex flex-1 max-w-sm mx-2">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition text-xs font-medium text-slate-500 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search PDF tools & features...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>
        </div>

        {/* ================= SECTION 3: USER, THEMES & CONTROLS ================= */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Language Selector */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Theme Selector (Supporting Light, Dark, System, Eye-Protection, Aurora) */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("theme")}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Change Theme"
            >
              {themeMode === "dark" ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            <AnimatePresence>
              {activeDropdown === "theme" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[1000] space-y-1 text-xs font-semibold"
                >
                  {[
                    { id: "light", label: "Light Mode", icon: Sun },
                    { id: "dark", label: "Dark Mode", icon: Moon },
                    { id: "eye-protection", label: "Eye Care (Sepia)", icon: Eye },
                    { id: "aurora", label: "Aurora Glass", icon: Sparkles },
                    { id: "system", label: "System Default", icon: Laptop },
                  ].map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (setThemeMode) setThemeMode(item.id as any);
                          else setDarkMode(item.id === "dark");
                          setActiveDropdown(null);
                        }}
                        className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left transition ${
                          themeMode === item.id ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Account & Admin Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("profile")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition ${
                hasAdminRights 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {hasAdminRights ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span className="uppercase">{currentRole}</span>
                </>
              ) : isAuthenticated ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-bold">
                    {(userProfile?.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate">{userProfile?.name.split(" ")[0]}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>{t("login", "Account")}</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            <AnimatePresence>
              {activeDropdown === "profile" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[1000] space-y-1 text-xs"
                >
                  {isAuthenticated && (
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{userProfile?.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{userProfile?.email}</div>
                    </div>
                  )}

                  {hasAdminRights && (
                    <>
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenAdminPanel();
                        }}
                        className="w-full text-left p-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold flex items-center space-x-2"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Admin Control Panel</span>
                      </button>

                      {onToggleAdminEditMode && (
                        <button
                          onClick={() => {
                            setActiveDropdown(null);
                            onToggleAdminEditMode();
                          }}
                          className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{adminEditModeActive ? "Disable Live CMS" : "Enable Live CMS"}</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenFavorites();
                    }}
                    className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>Favorites ({favorites.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      onOpenHistory();
                    }}
                    className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Recent Activity</span>
                  </button>

                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onLogout();
                      }}
                      className="w-full text-left p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onOpenAuthModal("customer");
                      }}
                      className="w-full text-left p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold flex items-center space-x-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Login / Register</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Navigation Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ================= SECTION 4: MOBILE DRAWER MENU ================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-3 overflow-hidden"
          >
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenSearch();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between"
            >
              <span className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>Search PDF Tools...</span>
              </span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-900 border rounded">⌘K</kbd>
            </button>

            <button
              onClick={() => {
                onGoHome();
                setMobileMenuOpen(false);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-left text-xs font-bold flex items-center space-x-2"
            >
              <Home className="w-4 h-4 text-blue-600" />
              <span>Home</span>
            </button>

            {hasAdminRights && (
              <button
                onClick={() => {
                  onOpenAdminPanel();
                  setMobileMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center space-x-2 shadow-sm"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Open Admin Control Panel</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODALS INTEGRATION ================= */}
      <SearchModal
        isOpen={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        onSelectTool={onSelectTool}
        favorites={favorites}
      />

      {brandModalOpen && (
        <PDFSunBrandShowcaseModal isOpen={brandModalOpen} onClose={() => setBrandModalOpen(false)} />
      )}
    </header>
  );
};
