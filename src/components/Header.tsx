import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun, Moon, Search, Sparkles, Star, Clock, Menu, X,
  ChevronDown, Layers, Crown, User, LogOut, BarChart3, Users,
  Settings, Home, Eye, Laptop, Edit3, Wallet, Shield, Activity,
  Sliders, ArrowRight
} from "lucide-react";

import { ALL_TOOLS } from "../data/toolsData";
import { ToolItem, UserRole, UserProfile } from "../types";
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
  onOpenAuthModal,
  onOpenAdminPanel,
  onOpenUserDashboard,
  onLogout,
  onGoHome,
}) => {
  const { t } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [toolsSearchQuery, setToolsSearchQuery] = useState("");
  const [toolsCategory, setToolsCategory] = useState("all");
  const [isMac, setIsMac] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      className="sticky top-0 z-[100] w-full h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3">
        
        {/* LOGO & MAIN LINKS */}
        <div className="flex items-center space-x-4 shrink-0">
          <PDFSunLogo layout="horizontal" size="md" onClick={onGoHome} />

          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={onGoHome}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            >
              <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t("home", "Home")}</span>
            </button>

            {/* Tools Dropdown */}
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
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-[110]"
                  >
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={toolsSearchQuery}
                          onChange={(e) => setToolsSearchQuery(e.target.value)}
                          placeholder="Search tools..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>

                      <div className="flex space-x-1 text-[10px] font-bold overflow-x-auto pb-1">
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

                      <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1">
                        {ALL_TOOLS.filter((t) => {
                          if (toolsSearchQuery) return t.name.toLowerCase().includes(toolsSearchQuery.toLowerCase());
                          if (toolsCategory === "all") return true;
                          return t.category === toolsCategory || (toolsCategory === "ai" && t.isAi);
                        }).slice(0, 10).map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onSelectTool(tool);
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 transition group"
                          >
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600">
                              {tool.name}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
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

        {/* SEARCH BAR */}
        <div className="hidden md:flex flex-1 max-w-sm mx-2">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition text-xs font-medium text-slate-500 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Search PDF tools & features...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>
        </div>

        {/* RIGHT CONTROLS & OWNER PROFILE */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("theme")}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {themeMode === "dark" ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            <AnimatePresence>
              {activeDropdown === "theme" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-[110] space-y-0.5 text-xs font-semibold"
                >
                  {[
                    { id: "light", label: "Light Mode", icon: Sun },
                    { id: "dark", label: "Dark Mode", icon: Moon },
                    { id: "eye-protection", label: "Eye Care", icon: Eye },
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
                        className={`w-full flex items-center space-x-2 p-2 rounded-xl text-left transition ${
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

          {/* OWNER / ADMIN DROPDOWN MENU */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("profile")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition ${
                hasAdminRights 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 ring-2 ring-blue-400/30" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {hasAdminRights ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span className="uppercase tracking-wide">{currentRole}</span>
                </>
              ) : isAuthenticated ? (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[80px] truncate">{userProfile?.name.split(" ")[0]}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>{t("login", "Account")}</span>
                </>
              )}
              <ChevronDown className={`w-3 h-3 opacity-80 transition-transform duration-200 ${activeDropdown === "profile" ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {activeDropdown === "profile" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[110] space-y-1 text-xs"
                >
                  {isAuthenticated && (
                    <div className="px-3 py-2.5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 rounded-xl mb-1 border border-slate-200/60 dark:border-slate-700/50">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100 truncate flex items-center justify-between">
                        <span>{userProfile?.name}</span>
                        {hasAdminRights && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md">
                            Owner
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{userProfile?.email}</div>
                    </div>
                  )}

                  {/* Integrated Owner Admin Suite */}
                  {hasAdminRights && (
                    <div className="space-y-0.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center justify-between">
                        <span>Admin Control Suite</span>
                        <Crown className="w-3 h-3" />
                      </div>
                      
                      <button
                        onClick={() => { setActiveDropdown(null); onOpenAdminPanel("profile"); }}
                        className="w-full text-left p-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 font-bold flex items-center justify-between hover:bg-blue-100/70 dark:hover:bg-blue-900/60 transition"
                      >
                        <div className="flex items-center space-x-2">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>Admin Control Panel</span>
                        </div>
                        <span className="text-[9px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-bold px-1.5 py-0.5 rounded">Dashboard</span>
                      </button>

                      <button
                        onClick={() => { setActiveDropdown(null); onOpenAdminPanel("analytics"); }}
                        className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2 transition"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Real-Time Analytics</span>
                      </button>

                      <button
                        onClick={() => { setActiveDropdown(null); onOpenAdminPanel("finance"); }}
                        className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2 transition"
                      >
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Finance &amp; Revenue</span>
                      </button>

                      <button
                        onClick={() => { setActiveDropdown(null); onOpenAdminPanel("users"); }}
                        className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2 transition"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>Users &amp; RBAC Roles</span>
                      </button>

                      <button
                        onClick={() => { setActiveDropdown(null); onOpenAdminPanel("settings"); }}
                        className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2 transition"
                      >
                        <Settings className="w-3.5 h-3.5 text-purple-500" />
                        <span>Platform Settings</span>
                      </button>

                      {onToggleAdminEditMode && (
                        <button
                          onClick={() => { setActiveDropdown(null); onToggleAdminEditMode(); }}
                          className="w-full text-left p-2 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold flex items-center space-x-2 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                          <span>{adminEditModeActive ? "Disable Live CMS" : "Enable Live CMS"}</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="pt-1 space-y-0.5">
                    <button
                      onClick={() => { setActiveDropdown(null); onOpenFavorites(); }}
                      className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2 transition"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>Favorites ({favorites.length})</span>
                    </button>

                    <button
                      onClick={() => { setActiveDropdown(null); onOpenHistory(); }}
                      className="w-full text-left p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center space-x-2 transition"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Recent Activity</span>
                    </button>

                    {isAuthenticated ? (
                      <button
                        onClick={() => { setActiveDropdown(null); onLogout(); }}
                        className="w-full text-left p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center space-x-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout Account</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => { setActiveDropdown(null); onOpenAuthModal("customer"); }}
                        className="w-full text-left p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold flex items-center space-x-2 transition"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Login / Register</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

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
