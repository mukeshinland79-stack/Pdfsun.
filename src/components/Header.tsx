import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
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
  Smartphone,
  Camera,
  BookOpen,
  Calendar,
  Tag,
  Server,
  LayoutDashboard,
  FileCheck,
} from "lucide-react";
import { ToolItem, UserRole, UserProfile, CategoryId } from "../types";
import { useLanguage } from "../lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PDFSunLogo } from "./PDFSunLogo";
import { checkAdminRole } from "../hooks/useAuth";
import { lazyWithDevSync } from "../utils/lazyWithDevSync";

const SearchModal = lazyWithDevSync(() =>
  import("./SearchModal").then((m) => ({ default: m.SearchModal }))
);
const PDFSunBrandShowcaseModal = lazyWithDevSync(() =>
  import("./PDFSunBrandShowcaseModal").then((m) => ({
    default: m.PDFSunBrandShowcaseModal,
  }))
);

export type HeaderThemeMode =
  | "system"
  | "light"
  | "dark"
  | "eye-protection"
  | "aurora"
  | "high-contrast";

export interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  themeMode?: HeaderThemeMode;
  setThemeMode?: (mode: HeaderThemeMode) => void;
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
  onOpenPricing?: () => void;
  onOpenBlog?: () => void;
  onOpenInstallApp?: () => void;
  onOpenAvatarModal?: () => void;
  onOpenVerificationStudio?: () => void;
  selectedCategory?: CategoryId;
  onSelectCategory?: (cat: CategoryId) => void;
  /** Optional initial menu visibility flags used for deterministic verification tests */
  defaultProfileMenuOpen?: boolean;
  defaultMobileMenuOpen?: boolean;
}

const THEME_OPTIONS: ReadonlyArray<{
  id: HeaderThemeMode;
  label: string;
  shortLabel: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}> = [
  {
    id: "light",
    label: "Light",
    shortLabel: "Light",
    desc: "Clean white SaaS surface",
    icon: Sun,
    iconClass: "text-amber-500",
  },
  {
    id: "dark",
    label: "Dark",
    shortLabel: "Dark",
    desc: "Low-glare midnight canvas",
    icon: Moon,
    iconClass: "text-indigo-400",
  },
  {
    id: "system",
    label: "Auto (System)",
    shortLabel: "Auto",
    desc: "Match OS appearance",
    icon: Laptop,
    iconClass: "text-blue-500",
  },
  {
    id: "eye-protection",
    label: "Eye Care",
    shortLabel: "Eye Care",
    desc: "Warm reduced blue light",
    icon: Eye,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "aurora",
    label: "Aurora",
    shortLabel: "Aurora",
    desc: "Deep ambient slate",
    icon: Sparkles,
    iconClass: "text-sky-500",
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    shortLabel: "Contrast",
    desc: "Maximum WCAG readability",
    icon: ShieldCheck,
    iconClass: "text-amber-500",
  },
];

export const Header: React.FC<HeaderProps> = React.memo(({
  darkMode,
  setDarkMode,
  themeMode = "light",
  setThemeMode,
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
  onOpenPricing,
  onOpenBlog,
  onOpenInstallApp,
  onOpenAvatarModal,
  onOpenVerificationStudio,
  defaultProfileMenuOpen = false,
  defaultMobileMenuOpen = false,
}) => {
  const { t } = useLanguage();

  // Strict Sole-Owner RBAC verification:
  // Only an authenticated, server-verified Owner session (role === "owner", hasAdminAccess === true,
  // and canAccessAdmin === true) may view Owner/Admin navigation controls.
  // Authoritative email allowlist enforcement occurs exclusively server-side in src/server/ownerIdentity.ts.
  const isAuthenticated = Boolean(
    userProfile && userProfile.email && currentRole !== "public"
  );
  const isSoleOwner =
    isAuthenticated &&
    Boolean(canAccessAdmin) &&
    currentRole === "owner" &&
    userProfile?.role === "owner" &&
    userProfile?.hasAdminAccess === true &&
    checkAdminRole(userProfile, currentRole);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(defaultMobileMenuOpen);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(defaultProfileMenuOpen);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [showBrandShowcase, setShowBrandShowcase] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  // Immediately close role-sensitive dropdowns when auth state clears (e.g. on logout)
  useEffect(() => {
    if (!isAuthenticated) {
      setProfileDropdownOpen(false);
    }
  }, [isAuthenticated, isSoleOwner]);

  const handleOpenSearchModal = useCallback(() => {
    setMobileMenuOpen(false);
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      setSearchOverlayOpen(true);
    }
  }, [onOpenSearch]);

  const handleOpenPricing = useCallback(() => {
    setMobileMenuOpen(false);
    if (onOpenPricing) {
      onOpenPricing();
    } else if (typeof document !== "undefined") {
      const el = document.getElementById("pricing");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [onOpenPricing]);

  const handleSelectTheme = useCallback(
    (mode: HeaderThemeMode) => {
      if (setThemeMode) {
        setThemeMode(mode);
      } else {
        setDarkMode(mode === "dark" || mode === "aurora" || mode === "high-contrast");
      }
      if (setSyncWithSystem) {
        setSyncWithSystem(mode === "system");
      }
      setThemeDropdownOpen(false);
    },
    [setThemeMode, setDarkMode, setSyncWithSystem]
  );

  // Close dropdowns on outside click / touch or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(e.target as Node)
      ) {
        setThemeDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setThemeDropdownOpen(false);
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Track scroll for subtle elevated header shadow and reading progress hairline
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop =
            window.scrollY ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0;
          const scrollHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
          );
          const clientHeight =
            window.innerHeight || document.documentElement.clientHeight || 1;
          const totalScrollable = scrollHeight - clientHeight;
          const pct =
            totalScrollable > 0
              ? Math.min(100, Math.max(0, (scrollTop / totalScrollable) * 100))
              : 0;
          setScrollProgress(pct);
          setScrolled(scrollTop > 8);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Global keyboard shortcut for Search modal (Ctrl+K / Cmd+K / Ctrl+/)
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

  const activeTheme =
    THEME_OPTIONS.find((opt) => opt.id === themeMode) ||
    (darkMode ? THEME_OPTIONS[1] : THEME_OPTIONS[0]);
  const ActiveThemeIcon = activeTheme.icon;

  const displayName = userProfile?.name?.trim() || "Account";
  const firstName = displayName.split(/\s+/)[0] || "Account";
  const avatarSrc = userProfile?.photoURL || userProfile?.avatar;
  const userInitial = (displayName[0] || "U").toUpperCase();
  const maskedOwnerEmail = userProfile?.email
    ? userProfile.email.replace(/^(.{4})(.*)(.@.*)$/, "$1********$3")
    : "";

  const navPillBase =
    "inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-full text-[14px] font-semibold tracking-[-0.01em] whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]";

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-50 w-full bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-shadow duration-200 ${
        scrolled
          ? "shadow-[0_8px_24px_-8px_rgba(15,23,42,0.10)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)]"
          : "shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      }`}
    >
      {/* Top hairline reading progress indicator */}
      <div
        id="scroll-progress-bar-container"
        className="fixed top-0 left-0 right-0 w-full h-[2px] bg-transparent overflow-hidden pointer-events-none z-[60]"
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Content scroll progress"
      >
        <div
          id="scroll-progress-bar-fill"
          className="h-full bg-blue-600 dark:bg-blue-500 transition-[width] duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Main Header Row */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-[60px] lg:h-[68px] flex items-center justify-between gap-2.5 lg:gap-4">
        {/* LEFT SECTION: PDFSun Logo + Brand Name + PRO AI Badge + pdfsun.in */}
        <div className="flex items-center shrink-0 min-w-0">
          <div className="hidden sm:block">
            <PDFSunLogo
              layout="horizontal"
              size="md"
              showProBadge
              showDomain
              onClick={onGoHome}
            />
          </div>
          <div className="sm:hidden">
            <PDFSunLogo
              layout="horizontal"
              size="sm"
              showProBadge
              showDomain
              onClick={onGoHome}
            />
          </div>
        </div>

        {/* CENTER SECTION (Desktop lg+): Search 68+ Tools Pill */}
        <div className="hidden lg:flex flex-1 min-w-[200px] max-w-[360px] xl:max-w-[420px] justify-center">
          <button
            id="header-search-btn"
            type="button"
            onClick={handleOpenSearchModal}
            aria-label={t("nav.searchBtn", "Search 68+ Tools")}
            className="group w-full h-10 px-4 rounded-full bg-slate-100/90 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/90 hover:border-blue-300 dark:border-slate-700/80 dark:hover:border-blue-500/50 transition-all duration-150 flex items-center justify-between gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1120]"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400 shrink-0 transition-colors" />
              <span className="text-[14px] font-medium text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 truncate">
                {t("nav.searchBtn", "Search 68+ Tools")}
              </span>
            </span>
            <kbd className="inline-flex items-center px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 shadow-[0_1px_1px_rgba(15,23,42,0.04)]">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>
        </div>

        {/* RIGHT SECTION (Desktop lg+): App, Plans, Theme, Blog, Language, Login/Profile */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0"
        >
          {/* 5. App button */}
          {onOpenInstallApp && (
            <button
              id="header-install-app-btn"
              type="button"
              onClick={onOpenInstallApp}
              className={`${navPillBase} bg-blue-50/90 hover:bg-blue-100/90 text-blue-700 border border-blue-200/80 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 dark:text-blue-300 dark:border-blue-500/30`}
              title="Install PDFSun App for mobile & desktop"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>{t("nav.app", "App")}</span>
            </button>
          )}

          {/* 6. Plans button */}
          <button
            id="header-nav-pricing-btn"
            type="button"
            onClick={handleOpenPricing}
            className={`${navPillBase} bg-amber-50/95 hover:bg-amber-100/90 text-amber-800 border border-amber-200/85 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-300 dark:border-amber-500/30`}
            title="View pricing plans"
          >
            <Tag className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{t("nav.plans", "Plans")}</span>
          </button>

          {/* 7. Light / Dark Theme selector */}
          <div className="relative" ref={themeDropdownRef}>
            <button
              id="header-theme-btn"
              type="button"
              onClick={() => {
                setThemeDropdownOpen((prev) => !prev);
                setProfileDropdownOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={themeDropdownOpen}
              aria-label={`Theme: ${activeTheme.shortLabel}`}
              className={`${navPillBase} bg-slate-100/90 hover:bg-slate-200/75 text-slate-700 border border-slate-200/85 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700/80`}
            >
              <ActiveThemeIcon className={`w-4 h-4 shrink-0 ${activeTheme.iconClass}`} />
              <span>{activeTheme.shortLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                  themeDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {themeDropdownOpen && (
              <div
                role="menu"
                aria-label="Theme options"
                className="absolute right-0 mt-2 w-60 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.16)] dark:shadow-[0_18px_42px_-10px_rgba(0,0,0,0.55)] z-50"
              >
                <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("themeMode", "Appearance")}
                </div>
                <div className="space-y-0.5">
                  {THEME_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = themeMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectTheme(opt.id)}
                        className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100/90 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconComp className={`w-4 h-4 shrink-0 ${opt.iconClass}`} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold leading-tight truncate">
                              {opt.label}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {opt.desc}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 8. Blog button */}
          {onOpenBlog && (
            <button
              id="header-nav-blog-btn"
              type="button"
              onClick={onOpenBlog}
              className={`${navPillBase} bg-slate-100/90 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/85 hover:border-blue-200 dark:bg-slate-800/80 dark:hover:bg-blue-500/15 dark:text-slate-200 dark:hover:text-blue-300 dark:border-slate-700/80`}
              title="Read PDF guides & tutorials"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>{t("nav.blog", "Blog")}</span>
            </button>
          )}

          {/* 9. Language selector with EN */}
          <LanguageSwitcher showLabel={false} align="right" />

          {/* 10. Auth / Role-Based Profile Button */}
          {!isAuthenticated ? (
            <button
              id="header-login-btn"
              type="button"
              onClick={() => onOpenAuthModal("customer")}
              className={`${navPillBase} px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white border border-blue-600 hover:border-blue-700 shadow-[0_1px_2px_rgba(37,99,235,0.28)]`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>{t("nav.loginRegister", "Login / Register")}</span>
            </button>
          ) : (
            <div className="relative" ref={profileDropdownRef}>
              {isSoleOwner ? (
                <button
                  id="header-owner-btn"
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen((prev) => !prev);
                    setThemeDropdownOpen(false);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={profileDropdownOpen}
                  className={`${navPillBase} pl-3 pr-3.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-[0_1px_3px_rgba(37,99,235,0.3)]`}
                >
                  <Crown className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Owner</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-blue-100 shrink-0 transition-transform duration-150 ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : (
                <button
                  id="header-profile-btn"
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen((prev) => !prev);
                    setThemeDropdownOpen(false);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={profileDropdownOpen}
                  className={`${navPillBase} pl-1.5 pr-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 hover:border-slate-300 dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}
                >
                  <span className="w-7 h-7 rounded-full overflow-hidden bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </span>
                  <span className="max-w-[104px] truncate">{firstName}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}

              {/* AUTHENTICATED ACCOUNT / SOLE-OWNER DROPDOWN */}
              {profileDropdownOpen && (
                <div
                  role="menu"
                  aria-label={isSoleOwner ? "Owner account menu" : "Customer account menu"}
                  className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_18px_44px_-10px_rgba(15,23,42,0.18)] dark:shadow-[0_20px_48px_-10px_rgba(0,0,0,0.6)] z-50 space-y-1.5"
                >
                  {/* Profile Identity Header */}
                  <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex items-center gap-2.5">
                      <div className="relative group/avatar shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={displayName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{userInitial}</span>
                          )}
                        </div>
                        {onOpenAvatarModal && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileDropdownOpen(false);
                              onOpenAvatarModal();
                            }}
                            className="absolute inset-0 rounded-full bg-slate-950/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                            title="Update Profile Picture"
                            aria-label="Update Profile Picture"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                            {displayName}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                              isSoleOwner
                                ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                                : userProfile?.isPro
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                                : "bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30"
                            }`}
                          >
                            {isSoleOwner ? "OWNER" : userProfile?.isPro ? "PRO" : "FREE"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                          {isSoleOwner ? maskedOwnerEmail : userProfile?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SOLE OWNER MANAGEMENT CONTROLS — NEVER RENDERED FOR CUSTOMERS OR GUESTS */}
                  {isSoleOwner && (
                    <div className="space-y-1 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="px-2 py-1 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Owner Management
                        </span>
                        {adminEditModeActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-semibold">
                            CMS Active
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAdminPanel();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-[13px] font-semibold flex items-center gap-2.5 text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <Crown className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>Owner Panel</span>
                      </button>

                      <div className="grid grid-cols-1 gap-0.5 pt-0.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("overview");
                          }}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>Admin Suite</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("finance");
                          }}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Financial Audit Dashboard</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("settings");
                          }}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <Server className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                          <span>Backend Management</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1 pt-0.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("users");
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-left text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <span className="truncate">Users &amp; RBAC</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminPanel("analytics");
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-left text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">Analytics</span>
                        </button>
                      </div>

                      {onOpenCms && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenCms();
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl text-left text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Live Site CMS Editor</span>
                        </button>
                      )}

                      {onToggleAdminEditMode && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => onToggleAdminEditMode()}
                          className="w-full px-2.5 py-1.5 rounded-xl text-left text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>Admin Control Bar</span>
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              adminEditModeActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {adminEditModeActive ? "ON" : "OFF"}
                          </span>
                        </button>
                      )}

                      {onOpenVerificationStudio && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenVerificationStudio();
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl text-left text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <FileCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>Verification Studio</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* PERSONAL ACCOUNT CONTROLS (Customer & Owner) */}
                  <div className="space-y-0.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenUserDashboard();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-medium flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{t("nav.myAccount", "My Account")}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenFavorites();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-medium flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Star
                          className={`w-4 h-4 shrink-0 ${
                            favorites.length > 0
                              ? "fill-amber-400 text-amber-400"
                              : "text-amber-500"
                          }`}
                        />
                        <span>{t("favorites.title", "Favorite Tools")}</span>
                      </span>
                      {favorites.length > 0 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                          {favorites.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenHistory();
                      }}
                      className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-medium flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>{t("history", "Recent History")}</span>
                    </button>

                    {onOpenAvatarModal && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAvatarModal();
                        }}
                        className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-medium flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>Update Profile Picture</span>
                      </button>
                    )}

                    {onOpenShareModal && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenShareModal();
                        }}
                        className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-medium flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>Share &amp; Scan QR Code</span>
                      </button>
                    )}
                  </div>

                  {/* LOGOUT */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left text-[13px] font-semibold flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>{t("logout", "Logout")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* MOBILE & TABLET COMPACT CONTROLS (< lg) — Universally accessible to ALL visitors, customers & owner */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          {/* Compact Search Trigger */}
          <button
            type="button"
            onClick={handleOpenSearchModal}
            aria-label={t("nav.searchBtn", "Search 68+ Tools")}
            className="inline-flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:px-3.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline text-[13px] font-medium text-slate-500 dark:text-slate-400">
              {t("nav.searchBtn", "Search 68+ Tools")}
            </span>
          </button>

          {/* Compact Auth / Profile Trigger */}
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => onOpenAuthModal("customer")}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">
                {t("nav.loginRegister", "Login / Register")}
              </span>
              <span className="sm:hidden">{t("nav.loginShort", "Login")}</span>
            </button>
          ) : isSoleOwner ? (
            <button
              type="button"
              onClick={() => onOpenAdminPanel()}
              aria-label="Open Owner Panel"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Crown className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Owner</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenUserDashboard()}
              aria-label="Open My Account"
              className="inline-flex items-center justify-center gap-1.5 h-10 pl-1.5 pr-2.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[13px] font-semibold shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="w-7 h-7 rounded-full overflow-hidden bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </span>
              <span className="hidden sm:inline max-w-[84px] truncate">{firstName}</span>
            </button>
          )}

          {/* Universal Mobile Menu Toggle Button */}
          <button
            id="header-mobile-drawer-toggle-btn"
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="header-mobile-drawer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE & TABLET NAVIGATION DRAWER (< lg) — Universally available to all roles */}
      {mobileMenuOpen && (
        <div
          id="header-mobile-drawer"
          role="dialog"
          aria-label="Mobile navigation"
          className="lg:hidden w-full max-h-[calc(100dvh-60px)] overflow-y-auto overflow-x-hidden bg-white dark:bg-[#0b1120] border-t border-slate-200/85 dark:border-slate-800 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.16)]"
        >
          <div className="max-w-[1440px] mx-auto px-4 py-4 space-y-4">
            {/* Mobile Search Bar */}
            <button
              type="button"
              onClick={handleOpenSearchModal}
              className="w-full min-h-[44px] px-4 rounded-full bg-slate-100/90 hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 flex items-center justify-between gap-2 text-left cursor-pointer"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {t("nav.searchBtn", "Search 68+ Tools")}
                </span>
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500">
                {isMac ? "⌘K" : "Ctrl+K"}
              </span>
            </button>

            {/* Primary Navigation Links */}
            <div className="space-y-1">
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Navigation
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoHome();
                }}
                className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{t("home", "All 68+ PDF Tools")}</span>
              </button>

              {onOpenInstallApp && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenInstallApp();
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[14px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/70 hover:bg-blue-50 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>{t("nav.app", "App")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenPricing}
                className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[14px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50/70 hover:bg-amber-50 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t("nav.plans", "Plans")}</span>
              </button>

              {onOpenBlog && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBlog();
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{t("nav.blog", "Blog")}</span>
                </button>
              )}

              {onOpenTodayInHistory && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTodayInHistory();
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>Today in History</span>
                </button>
              )}
            </div>

            {/* Personal Workspace Shortcuts */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenFavorites();
                }}
                className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Star
                    className={`w-4 h-4 shrink-0 ${
                      favorites.length > 0
                        ? "fill-amber-400 text-amber-400"
                        : "text-amber-500"
                    }`}
                  />
                  <span>{t("favorites.title", "Favorite Tools")}</span>
                </span>
                {favorites.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                    {favorites.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenHistory();
                }}
                className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span>{t("history", "Recent History")}</span>
              </button>

              {onOpenShareModal && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenShareModal();
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Share PDFSun &amp; QR Code</span>
                  </span>
                  <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              )}
            </div>

            {/* Preferences: Theme & Language */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Mobile Language Selector */}
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{t("language", "Language")}</span>
                </span>
                <LanguageSwitcher showLabel={false} align="right" />
              </div>

              {/* Mobile Theme Selector */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 block">
                  {t("themeMode", "Appearance")}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = themeMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectTheme(opt.id)}
                        className={`min-h-[44px] px-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700"
                        }`}
                      >
                        <IconComp className="w-4 h-4 shrink-0" />
                        <span>{opt.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SOLE OWNER MOBILE PANEL — STRICTLY HIDDEN FROM GUESTS & CUSTOMERS */}
            {isSoleOwner && (
              <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/35 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Owner Management</span>
                  </span>
                  {adminEditModeActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-semibold">
                      CMS Active
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminPanel();
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Owner Panel</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminPanel("overview");
                    }}
                    className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-[13px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">Admin Suite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminPanel("finance");
                    }}
                    className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-[13px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Financial Audit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminPanel("users");
                    }}
                    className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-[13px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span className="truncate">Users &amp; RBAC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminPanel("settings");
                    }}
                    className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-[13px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">Backend</span>
                  </button>
                </div>

                {onOpenCms && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCms();
                    }}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-500/30 text-[13px] font-semibold flex items-center gap-2.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Live Site CMS Editor</span>
                  </button>
                )}

                {onToggleAdminEditMode && (
                  <button
                    type="button"
                    onClick={() => onToggleAdminEditMode()}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-[13px] font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Admin Control Bar</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        adminEditModeActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {adminEditModeActive ? "ON" : "OFF"}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Authenticated User Card OR Guest Login CTA (Mobile) */}
            {isAuthenticated && userProfile ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/85 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 shrink-0">
                        {isSoleOwner ? "OWNER" : userProfile.isPro ? "PRO" : "FREE"}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {isSoleOwner ? maskedOwnerEmail : userProfile.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenUserDashboard();
                    }}
                    className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 text-[13px] font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{t("nav.myAccount", "My Account")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="min-h-[44px] px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-[13px] font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>{t("logout", "Logout")}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal("customer");
                }}
                className="w-full min-h-[46px] px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(37,99,235,0.28)] transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>{t("nav.loginRegister", "Login / Register")}</span>
              </button>
            )}

            {/* Footer Privacy Strip */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[12px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t("privacyNote", "100% Local Privacy")}</span>
              </span>
              <span className="font-mono text-[11px]">pdfsun.in</span>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Search Modal fallback */}
      {searchOverlayOpen && (
        <Suspense fallback={null}>
          <SearchModal
            isOpen={searchOverlayOpen}
            onClose={() => setSearchOverlayOpen(false)}
            onSelectTool={onSelectTool}
            favorites={favorites}
          />
        </Suspense>
      )}

      {/* Brand Identity Showcase Modal */}
      {showBrandShowcase && (
        <Suspense fallback={null}>
          <PDFSunBrandShowcaseModal onClose={() => setShowBrandShowcase(false)} />
        </Suspense>
      )}
    </header>
  );
});

Header.displayName = "Header";
