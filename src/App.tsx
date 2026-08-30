import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ToolGrid } from "./components/ToolGrid";
import { ActiveToolWorkspace } from "./components/ActiveToolWorkspace";
import { AIChatWorkspace } from "./components/AIChatWorkspace";
import { WatermarkPdfTool } from "./components/WatermarkPdfTool";
import { RemoveWatermarkTool } from "./components/RemoveWatermarkTool";
import { EditPdfMetadataTool } from "./components/EditPdfMetadataTool";
import { ViewPdfMetadataTool } from "./components/ViewPdfMetadataTool";
import { ProtectPdfTool } from "./components/ProtectPdfTool";
import { SharePdfSunModal } from "./components/SharePdfSunModal";
import { SupportedFormats } from "./components/SupportedFormats";
import { PricingSection } from "./components/PricingSection";
import { FAQSection } from "./components/FAQSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { AdSensePlaceholder } from "./components/AdSensePlaceholder";
import { NewsletterSubscription } from "./components/NewsletterSubscription";
import { GlobalErrorToast } from "./components/GlobalErrorToast";
import { Footer } from "./components/Footer";
import { PolicyModals } from "./components/PolicyModals";
import { RecentHistoryModal } from "./components/RecentHistoryModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { AuthModal } from "./components/AuthModal";
import { AdminPanel } from "./components/AdminPanel";
import { ProtectedAdminWrapper } from "./components/ProtectedAdminRoute";
import { UserDashboard } from "./components/UserDashboard";
import { BlogModal } from "./components/BlogModal";
import { ContactSupportModal } from "./components/ContactSupportModal";
import { SearchModal } from "./components/SearchModal";
import { SitemapModal } from "./components/SitemapModal";
import { PaymentSuccessModal } from "./components/PaymentSuccessModal";
import { SEOManager } from "./components/SEOManager";
import { DualAiFeatureBanner } from "./components/DualAiFeatureBanner";
import { TodayInHistoryModal } from "./components/TodayInHistoryModal";
import { TodayInHistoryBanner } from "./components/TodayInHistoryBanner";
import { PSEOLandingBanner } from "./components/PSEOLandingBanner";
import { MobileAppPromotionCard } from "./components/MobileAppPromotionCard";
import { InstallAppModal } from "./components/InstallAppModal";
import { detectUserGeoAndLanguage } from "./utils/geoLanguageDetector";
import { GeoDetectionResult } from "./types/history";
import { InactivityWarningModal } from "./components/InactivityWarningModal";
import { OwnerCmsModal } from "./components/OwnerCmsModal";
import { useInactivityTimeout } from "./hooks/useInactivityTimeout";
import { ToolItem, CategoryId, PolicyType, ToolHistoryItem, UserRole, UserProfile, AdminSettings, AdminUserAccount, DUAL_OWNER_EMAILS } from "./types";
import { ALL_TOOLS } from "./data/toolsData";
import { matchPSEORoute, PSEOLandingPage, generateCompressSizePseoPage } from "./data/pSEOData";
import { useAuth } from "./hooks/useAuth";
import { useUsageAnalytics } from "./hooks/useUsageAnalytics";
import { useKeyboardShortcutsManager } from "./hooks/useKeyboardShortcutsManager";
import { calculateAdPlacements } from "./utils/adSenseHelper";
import { trackGAPricingView, trackGAPaymentSuccess } from "./utils/analytics";

export type ThemeMode = "system" | "light" | "dark" | "eye-protection" | "aurora";

export default function App() {
  // Ref to track initial page load to skip transition on first render
  const isInitialMount = useRef(true);
  // Ref to track theme initialization status
  const themeInitialized = useRef(false);

  // Enhanced Multi-Theme State (System Auto, Light, Dark, Eye Protection, Aurora Glass)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedEye = localStorage.getItem("pdfsun_eye_protection");
    if (savedEye === "true") return "eye-protection";

    const savedTheme = localStorage.getItem("pdfsun_theme");
    if (savedTheme === "system" || savedTheme === "dark" || savedTheme === "eye-protection" || savedTheme === "aurora" || savedTheme === "light") {
      return savedTheme as ThemeMode;
    }
    return "light";
  });

  // Sync with System preference setting state
  const [syncWithSystem, setSyncWithSystem] = useState<boolean>(() => {
    const savedSync = localStorage.getItem("pdfsun_sync_system");
    if (savedSync !== null) {
      return savedSync === "true";
    }
    return true;
  });

  const isSystemDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const darkMode = themeMode === "dark" || themeMode === "aurora" || (themeMode === "system" && isSystemDark);

  const handleSetDarkMode = useCallback((val: boolean) => {
    setThemeMode(val ? "dark" : "light");
  }, []);

  // Theme DOM Application & Persistence Effect
  useEffect(() => {
    const root = document.documentElement;

    const updateClasses = (mode: ThemeMode) => {
      root.classList.remove("dark", "eye-protection", "aurora-theme");
      let active = mode;
      if (mode === "system") {
        active = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }

      if (active === "dark") {
        root.classList.add("dark");
      } else if (active === "eye-protection") {
        root.classList.add("eye-protection");
      } else if (active === "aurora") {
        root.classList.add("dark", "aurora-theme");
      }
    };

    let timer: NodeJS.Timeout | undefined;

    // Ref-based check for theme initialization
    if (!themeInitialized.current) {
      themeInitialized.current = true;
      updateClasses(themeMode);
      isInitialMount.current = false;
    } else {
      if (!isInitialMount.current) {
        root.classList.add("theme-transitioning");
      }

      if ("startViewTransition" in document && typeof (document as any).startViewTransition === "function") {
        try {
          const vt = (document as any).startViewTransition(() => {
            updateClasses(themeMode);
          });
          if (vt) {
            if (vt.ready && typeof vt.ready.catch === "function") {
              vt.ready.catch(() => {
                // Ignore view transition abort/ready errors gracefully
              });
            }
            if (vt.finished && typeof vt.finished.catch === "function") {
              vt.finished.catch(() => {
                // Ignore view transition abort/finished errors gracefully
              });
            }
          }
        } catch (e) {
          updateClasses(themeMode);
        }
      } else {
        updateClasses(themeMode);
      }

      if (!isInitialMount.current) {
        timer = setTimeout(() => {
          root.classList.remove("theme-transitioning");
        }, 320);
      }
    }

    try {
      localStorage.setItem("pdfsun_theme", themeMode);
      localStorage.setItem("pdfsun_eye_protection", themeMode === "eye-protection" ? "true" : "false");
      localStorage.setItem("pdfsun_sync_system", String(syncWithSystem));
    } catch (e) {
      console.error("Failed to save theme preferences to localStorage:", e);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [themeMode, syncWithSystem]);

  // Dedicated system theme media query listener effect with strict dependency control & cleanup
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!syncWithSystem && themeMode !== "system") return;

      const nextTheme: ThemeMode = e.matches ? "dark" : "light";
      setThemeMode((prevTheme) => {
        // Prevent recursive state update if the theme is already updated
        if (prevTheme === nextTheme) return prevTheme;
        if (syncWithSystem || prevTheme === "system") {
          return nextTheme;
        }
        return prevTheme;
      });
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleSystemChange);
      }
    };
  }, [syncWithSystem, themeMode]);

  // Unified Auth & Session Engine (Single Source of Truth with Multi-Tab Sync)
  const {
    currentRole,
    userProfile,
    authStatus,
    isAuthenticated,
    isOwner,
    isAdmin,
    canAccessAdmin,
    adminEditModeActive,
    setAdminEditModeActive,
    toggleAdminEditMode,
    isLoading: authLoading,
    logout: rawLogout,
    updateRole: handleSelectRole,
  } = useAuth();

  // User Accounts State with persistent Admin Permission control
  const [userAccounts, setUserAccounts] = useState<AdminUserAccount[]>(() => {
    try {
      const saved = localStorage.getItem("pdfsun_user_accounts");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: "usr-01", name: "Alex Rivera", email: "alex.rivera@edu.org", plan: "Student Pro", status: "Active", joined: "2026-01-12", hasAdminAccess: false },
      { id: "usr-02", name: "Sarah Jenkins", email: "sarah.j@lawfirm.com", plan: "Team Enterprise", status: "Active", joined: "2026-02-04", hasAdminAccess: false },
      { id: "usr-03", name: "David Kim", email: "dkim@tech.co", plan: "Free Sun", status: "Active", joined: "2026-03-19", hasAdminAccess: false },
      { id: "usr-04", name: "Mukesh Kalonia", email: "mukeshkalonia241@gmail.com", plan: "Admin Owner", status: "Active", joined: "2026-01-01", hasAdminAccess: true },
      { id: "usr-05", name: "Mukesh Inland", email: "mukeshinland79@gmail.com", plan: "Admin Owner", status: "Active", joined: "2026-01-01", hasAdminAccess: true },
    ];
  });

  const saveUserAccounts = (updated: AdminUserAccount[]) => {
    setUserAccounts(updated);
    try {
      localStorage.setItem("pdfsun_user_accounts", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAdminPermission = (userId: string) => {
    const updated = userAccounts.map((acc) => {
      if (acc.id === userId) {
        const nextState = !acc.hasAdminAccess;
        if (userProfile && userProfile.email === acc.email) {
          handleSelectRole(currentRole, { ...userProfile, hasAdminAccess: nextState });
        }
        return { ...acc, hasAdminAccess: nextState };
      }
      return acc;
    });
    saveUserAccounts(updated);
  };

  const handleToggleUserStatus = (userId: string) => {
    const updated = userAccounts.map((acc) => {
      if (acc.id === userId) {
        return { ...acc, status: acc.status === "Active" ? ("Suspended" as const) : ("Active" as const) };
      }
      return acc;
    });
    saveUserAccounts(updated);
  };

  const handleAddUserAccount = (newUser: { name: string; email: string; plan: string; hasAdminAccess: boolean }) => {
    const account: AdminUserAccount = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      plan: newUser.plan,
      status: "Active",
      joined: new Date().toISOString().split("T")[0],
      hasAdminAccess: newUser.hasAdminAccess,
    };
    saveUserAccounts([account, ...userAccounts]);
  };

  // Admin Settings state
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    siteName: "PDF Sun",
    domainName: "https://www.pdfsun.in",
    supportEmail: "mukeshkalonia241@gmail.com",
    ownerName: "Mukesh Kalonia",
    maintenanceMode: false,
    adsenseEnabled: true,
    adsensePubId: "ca-pub-4189458265489554",
    defaultTheme: "dark",
    aiModelVersion: "gemini-3.6-flash",
  });

  // Category & Filter state
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("pdfsun_favorites") || '["merge-pdf", "ai-chat-pdf", "compress-pdf"]');
    } catch {
      return ["merge-pdf", "ai-chat-pdf"];
    }
  });

  const toggleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId];
      localStorage.setItem("pdfsun_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  // Recent History Log State
  const [history, setHistory] = useState<ToolHistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("pdfsun_history") || "[]");
    } catch {
      return [];
    }
  });

  const addHistory = (item: ToolHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 30);
      localStorage.setItem("pdfsun_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("pdfsun_history");
  };

  // Active Tool Selection Workspace
  const [activeTool, setActiveTool] = useState<ToolItem | null>(null);
  const [activeToolFiles, setActiveToolFiles] = useState<File[]>([]);
  const [activePseoPage, setActivePseoPage] = useState<PSEOLandingPage | null>(null);

  // Modals state
  const [activePolicy, setActivePolicy] = useState<PolicyType | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [sharePdfSunModalOpen, setSharePdfSunModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<"customer" | "owner">("customer");
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminPanelTab, setAdminPanelTab] = useState<string>("analytics");
  const [cmsModalOpen, setCmsModalOpen] = useState(false);
  const [userDashboardOpen, setUserDashboardOpen] = useState(false);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [sitemapModalOpen, setSitemapModalOpen] = useState(false);
  const [todayInHistoryOpen, setTodayInHistoryOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [installAppModalOpen, setInstallAppModalOpen] = useState(false);
  const [geoResult, setGeoResult] = useState<GeoDetectionResult>(() => detectUserGeoAndLanguage());
  const [paymentSuccessModalOpen, setPaymentSuccessModalOpen] = useState(false);
  const paymentHandledRef = useRef(false);

  const handleOpenPricing = useCallback(() => {
    if (activeTool) setActiveTool(null);
    trackGAPricingView("pricing_modal");
    setPricingModalOpen(true);
    if (typeof window !== "undefined" && window.location.pathname !== "/pricing") {
      window.history.pushState({}, "", "/pricing");
    }
  }, [activeTool]);

  const handleClosePricing = useCallback(() => {
    setPricingModalOpen(false);
    if (
      typeof window !== "undefined" &&
      (window.location.pathname === "/pricing" || window.location.hash === "#pricing")
    ) {
      window.history.pushState({}, "", "/");
    }
  }, []);

  useEffect(() => {
      // Geo & Language Auto-detection & URL Routing for Today in History & pSEO & Tool Deep-links & Dedicated Pricing Page
      const syncRouteWithLocation = () => {
        const params = new URLSearchParams(window.location.search);
        const currentPath = window.location.pathname;

        const isPricingUrl =
          currentPath === "/pricing" ||
          window.location.hash === "#pricing" ||
          params.get("view") === "pricing" ||
          params.has("pricing") ||
          params.get("page") === "pricing";

        if (isPricingUrl) {
          setPricingModalOpen(true);
        }

        const isInstallUrl =
          currentPath === "/install" ||
          currentPath === "/app" ||
          window.location.hash === "#install" ||
          params.has("install") ||
          params.has("pwa") ||
          params.get("view") === "install" ||
          params.get("action") === "install";

        if (isInstallUrl) {
          setInstallAppModalOpen(true);
        }

        const isHistoryUrl =
          currentPath === "/today-in-history" ||
          window.location.hash === "#today-in-history" ||
          params.get("view") === "history" ||
          params.has("today-in-history");

        if (isHistoryUrl) {
          setTodayInHistoryOpen(true);
          return;
        }

        // Check for Programmatic SEO (pSEO) targeted landing pages
        const matchedPseo = matchPSEORoute(currentPath) || (params.get("pseo") ? matchPSEORoute(params.get("pseo")!) : null);
        if (matchedPseo) {
          setActivePseoPage(matchedPseo);
          const targetTool = ALL_TOOLS.find(
            (t) => t.id === matchedPseo.targetToolId || t.slug === matchedPseo.targetToolId
          );
          if (targetTool) {
            setActiveTool(targetTool);
          }
          return;
        }

        // Check for standard direct tool route (e.g. /merge-pdf or /tool/merge-pdf or ?tool=merge-pdf)
        const toolParam = params.get("tool") || params.get("toolId");
        let matchedSlug = toolParam;
        if (!matchedSlug && currentPath && currentPath !== "/") {
          const cleanSlug = currentPath.replace(/^\/(tool\/)?/, "").replace(/\/$/, "");
          matchedSlug = cleanSlug;
        }

        if (matchedSlug) {
          const targetTool = ALL_TOOLS.find(
            (t) => t.slug === matchedSlug || t.id === matchedSlug
          );
          if (targetTool) {
            setActiveTool(targetTool);
          }
        } else if (currentPath === "/") {
          setActiveTool(null);
          setActivePseoPage(null);
        }
      };

      syncRouteWithLocation();
      window.addEventListener("popstate", syncRouteWithLocation);
      return () => {
        window.removeEventListener("popstate", syncRouteWithLocation);
      };
  }, []);

  useEffect(() => {
    // Restricted Admin & Auth Routing with Hidden Gateway & Strict RBAC Authentication Wall
    if (typeof window !== "undefined" && !authLoading) {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname.toLowerCase();
      const isAdminRoute =
        pathname === "/admin" ||
        pathname.startsWith("/admin/") ||
        pathname === "/admin-login" ||
        pathname === "/admin-portal" ||
        pathname === "/portal/auth" ||
        window.location.hash === "#admin" ||
        params.get("view") === "admin" ||
        params.get("role") === "owner";

      const isLoginRoute =
        pathname === "/login" ||
        pathname === "/signin" ||
        pathname === "/signup" ||
        pathname === "/register" ||
        params.get("view") === "login" ||
        params.get("auth") === "true";

      if (isAdminRoute) {
        if (canAccessAdmin) {
          setAdminPanelOpen(true);
        } else {
          setAuthModalInitialMode("owner");
          setAuthModalOpen(true);
        }
      } else if (isLoginRoute && !isAuthenticated) {
        setAuthModalInitialMode("customer");
        setAuthModalOpen(true);
      }
    }
  }, [authLoading, canAccessAdmin, isAuthenticated]);

  useEffect(() => {
    if (typeof window !== "undefined" && !paymentHandledRef.current) {
      const params = new URLSearchParams(window.location.search);
      const isPaymentPath =
        window.location.pathname === "/payment-success" ||
        window.location.pathname.startsWith("/payment/");
      const isPaymentQuery =
        params.has("razorpay_payment_id") ||
        params.has("payment_id") ||
        params.get("payment_status") === "success" ||
        window.location.search.includes("razorpay_payment_id");

      if (isPaymentPath || isPaymentQuery) {
        paymentHandledRef.current = true;
        setPaymentSuccessModalOpen(true);
        const paymentId = params.get("razorpay_payment_id") || params.get("payment_id") || "tx_verified";
        trackGAPaymentSuccess("pro_lifetime", paymentId, 499, "INR");

        // Clean query parameters & pathname from URL to prevent infinite refresh loops
        try {
          const cleanPath = isPaymentPath ? "/" : window.location.pathname;
          window.history.replaceState({}, document.title, cleanPath);
        } catch (e) {
          console.warn("Could not clean payment URL params:", e);
        }
      }
    }
  }, []);

  // Keyboard Shortcuts Manager Hook for custom power-user keybindings
  const {
    shortcuts,
    shortcutsEnabled,
    toggleShortcutsEnabled,
    updateShortcutKeyCombo,
    resetToDefaults,
  } = useKeyboardShortcutsManager({
    onSelectTool: (tool) => {
      handleSelectTool(tool);
    },
    onToggleSearch: () => {
      setSearchModalOpen((prev) => !prev);
    },
    onToggleShortcutsModal: () => {
      setShortcutsModalOpen((prev) => !prev);
    },
    onCloseActiveModalOrWorkspace: () => {
      if (searchModalOpen) setSearchModalOpen(false);
      else if (pricingModalOpen) handleClosePricing();
      else if (shortcutsModalOpen) setShortcutsModalOpen(false);
      else if (historyModalOpen) setHistoryModalOpen(false);
      else if (authModalOpen) setAuthModalOpen(false);
      else if (adminPanelOpen) setAdminPanelOpen(false);
      else if (userDashboardOpen) setUserDashboardOpen(false);
      else if (blogModalOpen) setBlogModalOpen(false);
      else if (contactModalOpen) setContactModalOpen(false);
      else if (sitemapModalOpen) setSitemapModalOpen(false);
      else if (activePolicy) setActivePolicy(null);
      else if (activeTool) setActiveTool(null);
    },
    onGoHome: () => {
      setActiveTool(null);
      setSearchModalOpen(false);
      setShortcutsModalOpen(false);
      setHistoryModalOpen(false);
      setAuthModalOpen(false);
      setAdminPanelOpen(false);
      setUserDashboardOpen(false);
      setBlogModalOpen(false);
      setContactModalOpen(false);
      setSitemapModalOpen(false);
      setActivePolicy(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  // Usage Analytics hook
  const { trackToolUsage } = useUsageAnalytics();

  const handleCloseTool = useCallback(() => {
    setActiveTool(null);
    setActivePseoPage(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/" && !window.location.pathname.startsWith("/pricing") && !window.location.pathname.startsWith("/admin")) {
      window.history.pushState({}, "", "/");
    }
  }, []);

  const handleSelectTool = (tool: ToolItem, initialFiles?: File[], customPseoPage?: PSEOLandingPage | null) => {
    trackToolUsage(tool.id);
    setActiveTool(tool);
    if (customPseoPage !== undefined) {
      setActivePseoPage(customPseoPage);
      if (customPseoPage && typeof window !== "undefined") {
        window.history.pushState({}, "", `/${customPseoPage.slug}`);
      }
    } else if (activePseoPage && (activePseoPage.targetToolId !== tool.id && activePseoPage.targetToolId !== tool.slug)) {
      setActivePseoPage(null);
    } else {
      if (typeof window !== "undefined" && window.location.pathname !== `/${tool.slug}`) {
        window.history.pushState({}, "", `/${tool.slug}`);
      }
    }
    if (initialFiles) setActiveToolFiles(initialFiles);
    else setActiveToolFiles([]);
  };

  const handleSelectPseoSize = (sizeStr: string) => {
    const generated = generateCompressSizePseoPage(sizeStr, activePseoPage?.region || "USA");
    setActivePseoPage(generated);
    const compressTool = ALL_TOOLS.find((t) => t.id === "compress-pdf" || t.slug === "compress-pdf");
    if (compressTool) {
      setActiveTool(compressTool);
    }
    window.history.pushState({}, "", `/${generated.slug}`);
  };

  const handleOpenAuthModal = (mode: "customer" | "owner" = "customer") => {
    setAuthModalInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = useCallback(async () => {
    setAdminPanelOpen(false);
    setUserDashboardOpen(false);
    setHistoryModalOpen(false);
    setAuthModalOpen(false);
    // Explicitly execute full session revocation, cookie clearance & provider token cleanup
    await rawLogout();
  }, [rawLogout]);

  // Inactivity Auto-Logout & Session Preservation System
  const {
    showWarningModal,
    remainingSeconds,
    resetInactivityTimer,
    executeSecureLogout,
  } = useInactivityTimeout({
    currentRole,
    userProfile,
    activeToolId: activeTool?.id,
    onLogout: handleLogout,
  });

  const handleOpenAdminPanel = (tab?: string) => {
    if (!canAccessAdmin) {
      if (tab) setAdminPanelTab(tab);
      setAuthModalInitialMode("owner");
      setAuthModalOpen(true);
      return;
    }
    if (tab) setAdminPanelTab(tab);
    setAdminPanelOpen(true);
  };

  // Pagination state tracking for SEO rel=prev/next tags
  const [gridPagination, setGridPagination] = useState({ page: 1, totalPages: 1 });

  const handleGridPageChange = useCallback((page: number, totalPages: number) => {
    setGridPagination((prev) => {
      if (prev.page === page && prev.totalPages === totalPages) return prev;
      return { page, totalPages };
    });
  }, []);

  // Dynamic SEO Helmet variables
  const pageTitle = activeTool
    ? `${activeTool.name} - Free Online PDF Tool | PDFSun`
    : "PDFSun - Free Online PDF Tools | Merge, Split, Compress & Edit PDFs";

  const pageDescription = activeTool
    ? `${activeTool.description} Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun.`
    : "Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun.";

  const canonicalUrl = activeTool
    ? `https://pdfsun.in/${activeTool.slug}`
    : "https://pdfsun.in";

  const ogTitle = pageTitle;
  const ogDescription = pageDescription;
  const twitterTitle = pageTitle;
  const twitterDescription = pageDescription;

  // Calculate dynamic up to 5 Google AdSense placement containers based on page density & viewport
  const adPlacements = calculateAdPlacements(
    ALL_TOOLS.length,
    activeTool !== null,
    userProfile !== null,
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans flex flex-col">
      {/* Dynamic SEO JSON-LD Structured Data Management for Rich Search Snippets */}
      <SEOManager
        activeTool={activeTool}
        tools={ALL_TOOLS}
        baseUrl="https://pdfsun.in"
        currentPage={gridPagination.page}
        totalPages={gridPagination.totalPages}
        isTodayInHistoryActive={todayInHistoryOpen}
        isPricingActive={pricingModalOpen}
        pseoPage={activePseoPage}
      />

      {/* Dynamic SEO Head Management */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun, split PDF, convert PDF to Word, online PDF editor, WebAssembly PDF, PDFSun, pdfsun.in" />
        <meta name="author" content="PDFSun" />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        <link rel="canonical" href={canonicalUrl} />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Social Sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content="https://pdfsun.in/og-image.png" />
        <meta property="og:site_name" content="PDFSun" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={twitterTitle} />
        <meta name="twitter:description" content={twitterDescription} />
        <meta name="twitter:image" content="https://pdfsun.in/og-image.png" />
      </Helmet>

      {/* Sticky Top Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={handleSetDarkMode}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        syncWithSystem={syncWithSystem}
        setSyncWithSystem={setSyncWithSystem}
        favorites={favorites}
        onOpenFavorites={() => {
          setSelectedCategory("all");
          setSearchQuery("");
          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenHistory={() => setHistoryModalOpen(true)}
        onSelectTool={handleSelectTool}
        onOpenSearch={() => setSearchModalOpen(true)}
        currentRole={currentRole}
        userProfile={userProfile}
        canAccessAdmin={canAccessAdmin}
        adminEditModeActive={canAccessAdmin ? adminEditModeActive : false}
        onToggleAdminEditMode={canAccessAdmin ? toggleAdminEditMode : undefined}
        onOpenCms={canAccessAdmin ? () => setCmsModalOpen(true) : undefined}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenAdminPanel={canAccessAdmin ? handleOpenAdminPanel : () => handleOpenAuthModal("owner")}
        onOpenUserDashboard={() => setUserDashboardOpen(true)}
        onLogout={handleLogout}
        onGoHome={() => {
          setActiveTool(null);
          setSelectedCategory("all");
          setSearchQuery("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenTodayInHistory={() => setTodayInHistoryOpen(true)}
        onOpenShareModal={() => setSharePdfSunModalOpen(true)}
        onOpenPricing={handleOpenPricing}
        onOpenInstallApp={() => setInstallAppModalOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (activeTool) setActiveTool(null);
          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Main Hero Dropzone & Search Section */}
      <main className="flex-1">
        <HeroSection
          onSelectTool={handleSelectTool}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        {/* PDF Tools Filterable Grid (Front-and-Center, iLovePDF Style) */}
        <ToolGrid
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSelectTool={handleSelectTool}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onPageChange={handleGridPageChange}
        />

        {/* Placement 1: Sub-Tools AdSense Banner */}
        {adPlacements.some((p) => p.id === "hero-sub-ad") && (
          <AdSensePlaceholder slotId="pdfsun-auto-hero-sub-01" format="leaderboard" />
        )}

        {/* Dedicated PDFSun Mobile App Promotion Card & QR Code */}
        <MobileAppPromotionCard />

        {/* Dual AI Pro Feature Cards & Global Enterprise Suite */}
        <DualAiFeatureBanner
          onSelectTool={handleSelectTool}
          onOpenContactModal={() => setContactModalOpen(true)}
        />

        {/* Geo-Adaptive Multilingual Today in History Hub & Daily Knowledge Engine (Below Tools) */}
        <TodayInHistoryBanner
          geoResult={geoResult}
          onOpenHistoryModal={() => setTodayInHistoryOpen(true)}
        />

        {/* Placement 2: In-Content AdSense Banner (Between major PDF tool sections) */}
        {adPlacements.some((p) => p.id === "incontent-grid-ad") && (
          <AdSensePlaceholder slotId="pdfsun-auto-incontent-02" format="rectangle" />
        )}

        {/* Supported File Formats */}
        <SupportedFormats />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* FAQ Accordion */}
        <FAQSection activeTool={activeTool} />

        {/* Newsletter Subscription Banner */}
        <NewsletterSubscription variant="standalone" />
      </main>

      {/* Enterprise Clean Footer */}
      <Footer
        onOpenPolicy={(p) => setActivePolicy(p)}
        onOpenAllTools={() => {
          setSelectedCategory("all");
          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenAiTools={() => {
          setSelectedCategory("ai");
          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenBlogModal={() => setBlogModalOpen(true)}
        onOpenContactModal={() => setContactModalOpen(true)}
        onOpenPricing={handleOpenPricing}
        onOpenInstallApp={() => setInstallAppModalOpen(true)}
        onOpenTodayInHistory={() => setTodayInHistoryOpen(true)}
      />

      {/* Interactive Active Tool Workspace Modals */}
      {activeTool && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md p-2 sm:p-4 md:p-6 flex flex-col items-center justify-start min-h-screen">
          {activePseoPage && (
            <div className="w-full max-w-5xl mb-3 mt-2">
              <PSEOLandingBanner
                pseoPage={activePseoPage}
                onSelectTool={handleSelectTool}
                onSelectPseoSize={handleSelectPseoSize}
              />
            </div>
          )}

          <div className="w-full flex items-center justify-center">
            {activeTool.id === "remove-watermark" ? (
              <RemoveWatermarkTool
                initialFile={activeToolFiles[0] || null}
                onClose={handleCloseTool}
                onAddHistory={addHistory}
              />
            ) : activeTool.id === "watermark-pdf" ? (
              <WatermarkPdfTool
                initialFile={activeToolFiles[0] || null}
                onClose={handleCloseTool}
                onAddHistory={addHistory}
              />
            ) : ["read-pdf-metadata", "view-pdf-metadata"].includes(activeTool.id) ? (
              <ViewPdfMetadataTool
                initialFile={activeToolFiles[0] || null}
                onClose={handleCloseTool}
                onAddHistory={addHistory}
              />
            ) : ["edit-pdf-metadata", "pdf-metadata"].includes(activeTool.id) ? (
              <EditPdfMetadataTool
                initialFile={activeToolFiles[0] || null}
                onClose={handleCloseTool}
                onAddHistory={addHistory}
              />
            ) : activeTool.id === "share-pdfsun" ? (
              <SharePdfSunModal
                isOpen={true}
                onClose={handleCloseTool}
              />
            ) : ["protect-pdf", "encrypt-pdf"].includes(activeTool.id) ? (
              <ProtectPdfTool
                initialFile={activeToolFiles[0] || null}
                onClose={handleCloseTool}
                onAddHistory={addHistory}
              />
            ) : activeTool.isAi ? (
              <AIChatWorkspace
                tool={activeTool}
                initialFiles={activeToolFiles}
                onClose={handleCloseTool}
                onAddHistory={addHistory}
              />
            ) : (
              <ActiveToolWorkspace
                tool={activeTool}
                initialFiles={activeToolFiles}
                activeToolFiles={activeToolFiles}
                onClose={handleCloseTool}
                onSelectTool={handleSelectTool}
                onAddHistory={addHistory}
              />
            )}
          </div>
        </div>
      )}

      {/* Authentication & Role Selection Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentRole={currentRole}
        userProfile={userProfile}
        onSelectRole={handleSelectRole}
        initialMode={authModalInitialMode}
        onSuccessOpenAdmin={() => {
          setAdminPanelOpen(true);
        }}
      />

      {/* Admin Panel Modal for Owner (Mukesh Kalonia & Mukesh Inland) & Authorized Admins */}
      {adminPanelOpen && (
        <ProtectedAdminWrapper
          canAccessAdmin={canAccessAdmin}
          userProfile={userProfile}
          isLoading={authLoading}
          onUnauthorized={() => {
            setAdminPanelOpen(false);
            setAuthModalInitialMode("owner");
            setAuthModalOpen(true);
            if (
              window.location.pathname === "/admin" ||
              window.location.pathname.startsWith("/admin/")
            ) {
              window.history.replaceState({}, document.title, "/");
            }
          }}
        >
          <AdminPanel
            isOpen={adminPanelOpen}
            onClose={() => {
              setAdminPanelOpen(false);
              if (
                window.location.pathname === "/admin" ||
                window.location.pathname.startsWith("/admin/")
              ) {
                window.history.replaceState({}, document.title, "/");
              }
            }}
            adminSettings={adminSettings}
            onUpdateSettings={setAdminSettings}
            userAccounts={userAccounts}
            onToggleAdminPermission={handleToggleAdminPermission}
            onToggleUserStatus={handleToggleUserStatus}
            onAddUserAccount={handleAddUserAccount}
            initialTab={adminPanelTab}
            onLogout={handleLogout}
            isOwner={isOwner}
            currentUserProfile={userProfile}
          />
        </ProtectedAdminWrapper>
      )}

      {/* User Dashboard Modal */}
      {userProfile && userDashboardOpen && (
        <UserDashboard
          isOpen={userDashboardOpen}
          onClose={() => setUserDashboardOpen(false)}
          userProfile={userProfile}
          favorites={favorites}
          history={history}
          allTools={ALL_TOOLS}
          onSelectTool={handleSelectTool}
          onOpenAdminPanel={canAccessAdmin ? () => handleOpenAdminPanel() : undefined}
          onOpenPricing={() => {
            setUserDashboardOpen(false);
            handleOpenPricing();
          }}
        />
      )}

      {/* Dedicated Standalone "Pricing Plans" Page / Full Modal */}
      <PricingSection
        isOpen={pricingModalOpen}
        onClose={handleClosePricing}
        isModal={true}
        onOpenPolicy={(p) => setActivePolicy(p)}
        userProfile={userProfile}
      />

      {/* Blog & Knowledge Base Modal */}
      <BlogModal isOpen={blogModalOpen} onClose={() => setBlogModalOpen(false)} />

      {/* Contact & Support Modal */}
      <ContactSupportModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      {/* Dynamic sitemap.xml SEO Generator Modal */}
      <SitemapModal isOpen={sitemapModalOpen} onClose={() => setSitemapModalOpen(false)} />

      {/* Payment Success Redirect Modal */}
      <PaymentSuccessModal
        isOpen={paymentSuccessModalOpen}
        onClose={() => setPaymentSuccessModalOpen(false)}
        userProfile={userProfile}
        onRefreshProfile={() => window.location.reload()}
        onStartProcessing={() => {
          setPaymentSuccessModalOpen(false);
          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Policies & Help Modals */}
      <PolicyModals policy={activePolicy} onClose={() => setActivePolicy(null)} />

      {/* Recent History Modal */}
      <RecentHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        history={history}
        onClearHistory={clearHistory}
      />

      {/* Global Tool Search Modal (Ctrl+K) */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectTool={handleSelectTool}
        favorites={favorites}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        shortcuts={shortcuts}
        shortcutsEnabled={shortcutsEnabled}
        onToggleEnabled={toggleShortcutsEnabled}
        onUpdateShortcut={updateShortcutKeyCombo}
        onResetToDefaults={resetToDefaults}
      />

      {/* Inactivity Security Warning Modal */}
      <InactivityWarningModal
        isOpen={showWarningModal}
        remainingSeconds={remainingSeconds}
        onStayLoggedIn={() => resetInactivityTimer(true)}
        onLogoutNow={() => executeSecureLogout("manual_logout")}
      />

      {/* Share PDFSun Modal */}
      <SharePdfSunModal
        isOpen={sharePdfSunModalOpen}
        onClose={() => setSharePdfSunModalOpen(false)}
      />

      {/* Customer-Facing Install PDFSun App Modal & Multi-Platform Guide */}
      <InstallAppModal
        isOpen={installAppModalOpen}
        onClose={() => setInstallAppModalOpen(false)}
      />

      {/* Owner Dynamic CMS & Translations Editor Modal */}
      {cmsModalOpen && (
        <ProtectedAdminWrapper
          canAccessAdmin={canAccessAdmin}
          userProfile={userProfile}
          isLoading={authLoading}
          onUnauthorized={() => {
            setCmsModalOpen(false);
            setAuthModalInitialMode("owner");
            setAuthModalOpen(true);
          }}
        >
          <OwnerCmsModal
            isOpen={cmsModalOpen}
            onClose={() => setCmsModalOpen(false)}
          />
        </ProtectedAdminWrapper>
      )}

      {/* Geo-Adaptive Multilingual Today in History Interactive Hub */}
      <TodayInHistoryModal
        isOpen={todayInHistoryOpen}
        onClose={() => setTodayInHistoryOpen(false)}
        initialLanguage={geoResult.detectedLanguage}
        initialCountryCode={geoResult.detectedCountryCode}
        onSelectTool={handleSelectTool}
      />

      {/* Global Toast Error Notifications */}
      <GlobalErrorToast />
    </div>
  );
}
