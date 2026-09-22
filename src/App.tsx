import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { ShieldCheck } from "lucide-react";
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
import { AservusPdfCompressor } from "./components/AservusPdfCompressor";
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
import { ProfileAvatarModal } from "./components/ProfileAvatarModal";
import { BlogModal } from "./components/BlogModal";
import { ContactSupportModal } from "./components/ContactSupportModal";
import { SearchModal } from "./components/SearchModal";
import { SitemapModal } from "./components/SitemapModal";
import { PaymentSuccessModal } from "./components/PaymentSuccessModal";
import { SEOManager } from "./components/SEOManager";
import { DualAiFeatureBanner } from "./components/DualAiFeatureBanner";
import { TodayInHistoryModal } from "./components/TodayInHistoryModal";
import { EngineChroniclesHub } from "./components/EngineChroniclesHub";
import { PdfSunArticleSection } from "./components/PdfSunArticleSection";
import { PSEOLandingBanner } from "./components/PSEOLandingBanner";
import { MobileAppPromotionCard } from "./components/MobileAppPromotionCard";
import { InstallAppModal } from "./components/InstallAppModal";
import { FuturePdfStudioModal, FutureStudioTab } from "./components/FuturePdfStudioModal";
import { ReturningVisitorBar } from "./components/ReturningVisitorBar";
import { BreadcrumbNav } from "./components/BreadcrumbNav";
import { CollapsibleSectionsHub } from "./components/CollapsibleSectionsHub";
import { BlogPage } from "./components/BlogPage";
import { detectUserGeoAndLanguage } from "./utils/geoLanguageDetector";
import { GeoDetectionResult } from "./types/history";
import { InactivityWarningModal } from "./components/InactivityWarningModal";
import { OwnerCmsModal } from "./components/OwnerCmsModal";
import { useInactivityTimeout } from "./hooks/useInactivityTimeout";
import { ToolItem, CategoryId, PolicyType, ToolHistoryItem, UserProfile, AdminSettings, AdminUserAccount } from "./types";
import { ALL_TOOLS } from "./data/toolsData";
import { matchPSEORoute, PSEOLandingPage, generateCompressSizePseoPage } from "./data/pSEOData";
import { useAuth } from "./hooks/useAuth";
import { useUsageAnalytics } from "./hooks/useUsageAnalytics";
import { useKeyboardShortcutsManager } from "./hooks/useKeyboardShortcutsManager";
import { calculateAdPlacements } from "./utils/adSenseHelper";
import { trackGAPricingView, trackGAPaymentSuccess } from "./utils/analytics";
import { useLanguage, SUPPORTED_LANGUAGES } from "./lib/i18n";
import { resolvePaymentProduct } from "./config/paymentProducts";

export type ThemeMode = "system" | "light" | "dark" | "eye-protection" | "aurora";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

// Ultra-Stable Enterprise Error Recovery Layer
class SafeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || "Render Error" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PDFSun Desktop Engine Error Captured:", error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("pdfsun_active_session");
      } catch (e) {}
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-[#161F33] border border-blue-500/30 p-8 rounded-3xl shadow-2xl backdrop-blur-2xl">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-slate-100">PDFSun Engine Auto-Recovery</h2>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Desktop web graphics engine refreshed. Click below to load the optimized workspace.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] text-sm"
            >
              Reload PDFSun Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainApp() {
  const [mounted, setMounted] = useState<boolean>(false);
  const { currentLanguage, setLanguage } = useLanguage();
  const isInitialMount = useRef(true);
  const themeInitialized = useRef(false);

  // Cross-Platform Client Mount Protection
  useEffect(() => {
    setMounted(true);
  }, []);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const savedEye = localStorage.getItem("pdfsun_eye_protection");
      if (savedEye === "true") return "eye-protection";
      const savedTheme = localStorage.getItem("pdfsun_theme");
      if (["system", "dark", "eye-protection", "aurora", "light"].includes(savedTheme || "")) {
        return savedTheme as ThemeMode;
      }
    } catch (e) {}
    return "dark";
  });

  const [syncWithSystem, setSyncWithSystem] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const savedSync = localStorage.getItem("pdfsun_sync_system");
      if (savedSync !== null) return savedSync === "true";
    } catch (e) {}
    return true;
  });

  const isSystemDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const darkMode = themeMode === "dark" || themeMode === "aurora" || (themeMode === "system" && isSystemDark);

  const handleSetDarkMode = useCallback((val: boolean) => {
    setThemeMode(val ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    const updateClasses = (mode: ThemeMode) => {
      root.classList.remove("dark", "eye-protection", "aurora-theme");
      let active = mode;
      if (mode === "system") {
        active = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }

      if (active === "dark") root.classList.add("dark");
      else if (active === "eye-protection") root.classList.add("eye-protection");
      else if (active === "aurora") root.classList.add("dark", "aurora-theme");
    };

    if (!themeInitialized.current) {
      themeInitialized.current = true;
      updateClasses(themeMode);
      isInitialMount.current = false;
    } else {
      updateClasses(themeMode);
    }

    try {
      localStorage.setItem("pdfsun_theme", themeMode);
      localStorage.setItem("pdfsun_eye_protection", themeMode === "eye-protection" ? "true" : "false");
      localStorage.setItem("pdfsun_sync_system", String(syncWithSystem));
    } catch (e) {}
  }, [themeMode, syncWithSystem, mounted]);

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
    updateAvatar,
    syncSubscription,
  } = useAuth();

  const handleInstantProUnlock = useCallback((planName?: string) => {
    const plan = planName || (typeof window !== "undefined" ? localStorage.getItem("pdfsun_user_plan_v1") : null) || "Pro Sun Monthly";
    try {
      localStorage.setItem("pdfsun_user_plan_v1", plan);
      localStorage.setItem("pdfsun_pro_plan", "pro");
      localStorage.setItem("pdfsun_user_is_pro", "true");
    } catch (e) {}

    if (userProfile) {
      const updatedProfile: UserProfile = { ...userProfile, plan, isPro: true };
      handleSelectRole(currentRole === "public" ? "user" : currentRole, updatedProfile);
      if (userProfile.email) syncSubscription(userProfile.email);
    } else {
      const guestPro: UserProfile = {
        id: `usr_${Date.now()}`,
        name: "Pdfsun.in Pro Member",
        email: "user@pdfsun.in",
        plan,
        isPro: true,
        role: "user",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        joinedDate: new Date().toISOString(),
      };
      handleSelectRole("user", guestPro);
    }
  }, [userProfile, currentRole, handleSelectRole, syncSubscription]);

  const [userAccounts, setUserAccounts] = useState<AdminUserAccount[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("pdfsun_user_accounts") : null;
      if (saved) return JSON.parse(saved);
    } catch (e) {}
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
    } catch (e) {}
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
    const updated = userAccounts.map((acc) => (acc.id === userId ? { ...acc, status: acc.status === "Active" ? ("Suspended" as const) : ("Active" as const) } : acc));
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

  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    siteName: "PDF Sun",
    domainName: "https://www.pdfsun.in",
    supportEmail: "mukeshkalonia241@gmail.com",
    ownerName: "Mukesh Kalonia",
    maintenanceMode: false,
    adsenseEnabled: true,
    adsensePubId: "ca-pub-4189458265489554",
    defaultTheme: "dark",
    aiModelVersion: "gemini-3.8-flash",
  });

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("pdfsun_favorites") : null;
      return saved ? JSON.parse(saved) : ["merge-pdf", "ai-chat-pdf", "compress-pdf"];
    } catch (e) {
      return ["merge-pdf", "ai-chat-pdf"];
    }
  });

  const toggleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId];
      try { localStorage.setItem("pdfsun_favorites", JSON.stringify(updated)); } catch (err) {}
      return updated;
    });
  };

  const [history, setHistory] = useState<ToolHistoryItem[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("pdfsun_history") : null;
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const addHistory = (item: ToolHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 30);
      try { localStorage.setItem("pdfsun_history", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem("pdfsun_history"); } catch (e) {}
  };

  const [activeTool, setActiveTool] = useState<ToolItem | null>(null);
  const [activeToolFiles, setActiveToolFiles] = useState<File[]>([]);
  const [activePseoPage, setActivePseoPage] = useState<PSEOLandingPage | null>(null);

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
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [sitemapModalOpen, setSitemapModalOpen] = useState(false);
  const [todayInHistoryOpen, setTodayInHistoryOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [installAppModalOpen, setInstallAppModalOpen] = useState(false);
  const [futureStudioOpen, setFutureStudioOpen] = useState(false);
  const [futureStudioTab, setFutureStudioTab] = useState<FutureStudioTab>("voice-reader");
  const [futureStudioFile, setFutureStudioFile] = useState<File | null>(null);
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
    if (typeof window !== "undefined" && (window.location.pathname === "/pricing" || window.location.hash === "#pricing")) {
      window.history.pushState({}, "", "/");
    }
  }, []);

  const [blogViewActive, setBlogViewActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      return p === "/blog" || p.startsWith("/blog/");
    }
    return false;
  });

  const [blogActiveSlug, setBlogActiveSlug] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      const parts = p.split("/").filter(Boolean);
      if (parts.length > 1 && parts[0] === "blog") return parts[1];
    }
    return null;
  });

  const handleNavigateBlog = useCallback(() => {
    if (activeTool) setActiveTool(null);
    if (activePseoPage) setActivePseoPage(null);
    setPricingModalOpen(false);
    setBlogViewActive(true);
    setBlogActiveSlug(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/blog") {
      window.history.pushState({}, "", "/blog");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTool, activePseoPage]);

  const handleNavigateArticle = useCallback((slug: string) => {
    if (activeTool) setActiveTool(null);
    if (activePseoPage) setActivePseoPage(null);
    setPricingModalOpen(false);
    setBlogViewActive(true);
    setBlogActiveSlug(slug);
    const targetPath = `/blog/${slug}`;
    if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTool, activePseoPage]);

  const handleExitBlogToHome = useCallback(() => {
    setBlogViewActive(false);
    setBlogActiveSlug(null);
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/blog")) {
      window.history.pushState({}, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Universal Route Router
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const syncRouteWithLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split("/").filter(Boolean);
      let detectedLang: string | null = null;
      let effectivePath = currentPath;

      if (pathParts.length > 0) {
        const firstSegment = pathParts[0].toLowerCase();
        const matchedLang = SUPPORTED_LANGUAGES.find(
          (l) => l.code.toLowerCase() === firstSegment || l.code.toLowerCase() === firstSegment.split("-")[0]
        );
        if (matchedLang) {
          detectedLang = matchedLang.code;
          effectivePath = "/" + pathParts.slice(1).join("/");
        }
      }

      const queryLang = params.get("lang") || params.get("lng");
      if (queryLang) {
        const cleanQuery = queryLang.toLowerCase().split("-")[0];
        const matchedLang = SUPPORTED_LANGUAGES.find(
          (l) => l.code.toLowerCase() === queryLang.toLowerCase() || l.code.toLowerCase() === cleanQuery
        );
        if (matchedLang) detectedLang = matchedLang.code;
      }

      if (detectedLang && detectedLang !== currentLanguage) setLanguage(detectedLang);

      const isBlogRoute = effectivePath === "/blog" || effectivePath.startsWith("/blog/") || params.get("view") === "blog" || params.has("blog");

      if (isBlogRoute) {
        setBlogViewActive(true);
        const blogSegments = effectivePath.split("/").filter(Boolean);
        setBlogActiveSlug(blogSegments.length > 1 && blogSegments[0] === "blog" ? blogSegments[1] : null);
        setActiveTool(null);
        setActivePseoPage(null);
        return;
      } else {
        setBlogViewActive(false);
        setBlogActiveSlug(null);
      }

      if (effectivePath === "/pricing" || window.location.hash === "#pricing" || params.get("view") === "pricing") {
        setPricingModalOpen(true);
      }

      if (effectivePath === "/install" || effectivePath === "/app" || window.location.hash === "#install") {
        setInstallAppModalOpen(true);
      }

      if (effectivePath === "/today-in-history" || window.location.hash === "#today-in-history") {
        setTodayInHistoryOpen(true);
        return;
      }

      const matchedPseo = matchPSEORoute(effectivePath) || (params.get("pseo") ? matchPSEORoute(params.get("pseo")!) : null);
      if (matchedPseo) {
        setActivePseoPage(matchedPseo);
        const targetTool = ALL_TOOLS.find((t) => t.id === matchedPseo.targetToolId || t.slug === matchedPseo.targetToolId);
        if (targetTool) setActiveTool(targetTool);
        return;
      }

      let matchedSlug = params.get("tool") || params.get("toolId");
      if (!matchedSlug && effectivePath && effectivePath !== "/") {
        matchedSlug = effectivePath.replace(/^\/(tool\/)?/, "").replace(/\/$/, "");
      }

      if (matchedSlug) {
        if (matchedSlug === "ocr-pdf" || matchedSlug === "ocr-image-to-text") matchedSlug = "ai-ocr";
        const targetTool = ALL_TOOLS.find((t) => t.slug === matchedSlug || t.id === matchedSlug);
        if (targetTool) setActiveTool(targetTool);
      } else if (effectivePath === "/" || effectivePath === "") {
        setActiveTool(null);
        setActivePseoPage(null);
      }
    };

    syncRouteWithLocation();
    window.addEventListener("popstate", syncRouteWithLocation);
    return () => window.removeEventListener("popstate", syncRouteWithLocation);
  }, [mounted, currentLanguage, setLanguage]);

  // Auth deep link listener
  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading) {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname.toLowerCase();
      const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/") || params.get("view") === "admin";
      const isLoginRoute = pathname === "/login" || params.get("view") === "login";

      if (isAdminRoute) {
        if (canAccessAdmin) setAdminPanelOpen(true);
        else {
          setAuthModalInitialMode("owner");
          setAuthModalOpen(true);
        }
      } else if (isLoginRoute && !isAuthenticated) {
        setAuthModalInitialMode("customer");
        setAuthModalOpen(true);
      }
    }
  }, [authLoading, canAccessAdmin, isAuthenticated]);

  // Payment Handler
  useEffect(() => {
    if (typeof window !== "undefined" && !paymentHandledRef.current) {
      const params = new URLSearchParams(window.location.search);
      const isPaymentPath = window.location.pathname === "/payment-success" || window.location.pathname.startsWith("/payment/");
      const isPaymentQuery = params.has("razorpay_payment_id") || params.has("payment_id") || params.get("payment_status") === "success";

      if (isPaymentPath || isPaymentQuery) {
        paymentHandledRef.current = true;
        const rawPlan = params.get("plan") || localStorage.getItem("pdfsun_last_checkout_plan") || "";
        const rawAmount = params.get("amount") || localStorage.getItem("pdfsun_last_checkout_amount") || "";
        const paymentId = params.get("razorpay_payment_id") || params.get("payment_id") || `pay_rzp_${Date.now()}`;

        const resolvedProduct = resolvePaymentProduct({
          planId: rawPlan,
          amountINR: rawAmount ? Number(rawAmount.replace(/[^0-9.]/g, "")) : undefined,
        });

        handleInstantProUnlock(resolvedProduct.productName);
        setPaymentSuccessModalOpen(true);
        trackGAPaymentSuccess(resolvedProduct.internalProductId, paymentId, resolvedProduct.displayPriceINR, "INR");

        try {
          window.history.replaceState({}, document.title, isPaymentPath ? "/" : window.location.pathname);
        } catch (e) {}
      }
    }
  }, [handleInstantProUnlock]);

  const { shortcuts, shortcutsEnabled, toggleShortcutsEnabled, updateShortcutKeyCombo, resetToDefaults } = useKeyboardShortcutsManager({
    onSelectTool: (tool) => handleSelectTool(tool),
    onToggleSearch: () => setSearchModalOpen((prev) => !prev),
    onToggleShortcutsModal: () => setShortcutsModalOpen((prev) => !prev),
    onCloseActiveModalOrWorkspace: () => {
      if (futureStudioOpen) setFutureStudioOpen(false);
      else if (searchModalOpen) setSearchModalOpen(false);
      else if (pricingModalOpen) handleClosePricing();
      else if (shortcutsModalOpen) setShortcutsModalOpen(false);
      else if (historyModalOpen) setHistoryModalOpen(false);
      else if (authModalOpen) setAuthModalOpen(false);
      else if (adminPanelOpen) setAdminPanelOpen(false);
      else if (userDashboardOpen) setUserDashboardOpen(false);
      else if (activeTool) setActiveTool(null);
    },
    onGoHome: () => {
      setActiveTool(null);
      setFutureStudioOpen(false);
      setSearchModalOpen(false);
      setShortcutsModalOpen(false);
      setHistoryModalOpen(false);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const { trackToolUsage } = useUsageAnalytics();

  const handleCloseTool = useCallback(() => {
    setActiveTool(null);
    setActivePseoPage(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      const langQuery = currentLanguage !== "en" ? `?lang=${currentLanguage}` : "";
      window.history.pushState({}, "", `/${langQuery}`);
    }
  }, [currentLanguage]);

  const handleSelectTool = (tool: ToolItem, initialFiles?: File[], customPseoPage?: PSEOLandingPage | null) => {
    const canonicalTool = tool.id === "ocr-pdf" || tool.slug === "ocr-pdf" ? ALL_TOOLS.find((t) => t.id === "ai-ocr") || tool : tool;
    trackToolUsage(canonicalTool.id);

    setActiveTool(canonicalTool);
    const langQuery = currentLanguage !== "en" ? `?lang=${currentLanguage}` : "";

    if (customPseoPage !== undefined) {
      setActivePseoPage(customPseoPage);
      if (customPseoPage && typeof window !== "undefined") {
        window.history.pushState({}, "", `/${customPseoPage.slug}${langQuery}`);
      }
    } else if (typeof window !== "undefined" && window.location.pathname !== `/${canonicalTool.slug}`) {
      window.history.pushState({}, "", `/${canonicalTool.slug}${langQuery}`);
    }

    if (initialFiles) setActiveToolFiles(initialFiles);
    else setActiveToolFiles([]);
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
    await rawLogout();
  }, [rawLogout]);

  const { showWarningModal, remainingSeconds, resetInactivityTimer, executeSecureLogout } = useInactivityTimeout({
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

  const [gridPagination, setGridPagination] = useState({ page: 1, totalPages: 1 });
  const handleGridPageChange = useCallback((page: number, totalPages: number) => {
    setGridPagination((prev) => (prev.page === page && prev.totalPages === totalPages ? prev : { page, totalPages }));
  }, []);

  const pageTitle = activeTool ? `${activeTool.name} - Free Online PDF Tool | PDFSun` : "PDFSun - Free Online PDF Tools | Merge, Split, Compress & Edit PDFs";
  const pageDescription = activeTool ? `${activeTool.description} Free PDF converter, merge PDF online, compress PDF size with PDFSun.` : "Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun.";
  const canonicalUrl = activeTool ? `https://pdfsun.in/${activeTool.slug}` : "https://pdfsun.in";

  const adPlacements = calculateAdPlacements(ALL_TOOLS.length, activeTool !== null, userProfile !== null, typeof window !== "undefined" ? window.innerWidth : 1200);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="main-wrapper min-h-screen bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans flex flex-col">
      <SEOManager
        activeTool={activeTool}
        tools={ALL_TOOLS}
        baseUrl="https://pdfsun.in"
        currentPage={gridPagination.page}
        totalPages={gridPagination.totalPages}
        isTodayInHistoryActive={todayInHistoryOpen}
        isPricingActive={pricingModalOpen}
        isBlogActive={blogViewActive}
        pseoPage={activePseoPage}
      />

      {!blogViewActive && (
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <meta name="keywords" content="Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun, split PDF" />
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:image" content="https://pdfsun.in/og-image.png" />
        </Helmet>
      )}

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
          handleExitBlogToHome();
          setActiveTool(null);
          setSelectedCategory("all");
          setSearchQuery("");
          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenTodayInHistory={() => setTodayInHistoryOpen(true)}
        onOpenShareModal={() => setSharePdfSunModalOpen(true)}
        onOpenPricing={handleOpenPricing}
        onOpenBlog={handleNavigateBlog}
        onOpenInstallApp={() => setInstallAppModalOpen(true)}
        onOpenAvatarModal={() => setAvatarModalOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          handleExitBlogToHome();
          setSelectedCategory(cat);
          if (activeTool) setActiveTool(null);
          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <main className="content-area flex-1">
        {blogViewActive ? (
          <BlogPage
            currentSlug={blogActiveSlug}
            onNavigateHome={handleExitBlogToHome}
            onNavigateBlog={handleNavigateBlog}
            onNavigateArticle={handleNavigateArticle}
            onSelectTool={(toolId) => {
              handleExitBlogToHome();
              const tool = ALL_TOOLS.find((t) => t.id === toolId || t.slug === toolId);
              if (tool) handleSelectTool(tool);
            }}
          />
        ) : (
          <>
            <HeroSection onSelectTool={handleSelectTool} onOpenSearch={() => setSearchModalOpen(true)} />
            <ReturningVisitorBar onSelectTool={handleSelectTool} onOpenHistory={() => setHistoryModalOpen(true)} />
            <BreadcrumbNav
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setSearchQuery("");
                document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
              }}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
              onGoHome={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSelectTool={handleSelectTool}
              onOpenPricing={handleOpenPricing}
              onOpenBlog={handleNavigateBlog}
              activeTool={activeTool}
              baseUrl="https://pdfsun.in"
            />

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

            {adPlacements.some((p) => p.id === "hero-sub-ad") && (
              <AdSensePlaceholder slotId="pdfsun-auto-hero-sub-01" format="leaderboard" />
            )}

            {/* ========================================================================= */}
            {/* UNIVERSAL DAILY CHRONICLE & TECHNICAL INTELLIGENCE HUB (100% PUBLIC/UNGATED) */}
            {/* ========================================================================= */}
            <section
              id="daily-chronicle-section"
              aria-label="Daily Chronicle & Technical Intelligence"
              className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5"
            >
              <EngineChroniclesHub
                geoResult={geoResult}
                onOpenHistoryModal={() => setTodayInHistoryOpen(true)}
                onNavigateArticle={handleNavigateArticle}
                onNavigateBlog={handleNavigateBlog}
              />
            </section>

            <CollapsibleSectionsHub
              childrenAiSection={
                <div className="space-y-4">
                  <MobileAppPromotionCard />
                  <DualAiFeatureBanner onSelectTool={handleSelectTool} onOpenContactModal={() => setContactModalOpen(true)} />
                </div>
              }
              childrenChroniclesSection={
                <div className="space-y-6">
                  <PdfSunArticleSection
                    showAd={adPlacements.some((p) => p.id === "incontent-grid-ad")}
                    onNavigateArticle={handleNavigateArticle}
                    onNavigateBlog={handleNavigateBlog}
                  />
                </div>
              }
              childrenFormatsSection={<SupportedFormats />}
              childrenTestimonialsSection={<TestimonialsSection />}
              childrenFaqSection={<FAQSection activeTool={activeTool} />}
              childrenNewsletterSection={<NewsletterSubscription variant="standalone" />}
            />
          </>
        )}
      </main>

      <Footer
        onOpenPolicy={(p) => setActivePolicy(p)}
        onOpenAllTools={() => {
          handleExitBlogToHome();
          setSelectedCategory("all");
          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenAiTools={() => {
          handleExitBlogToHome();
          setSelectedCategory("ai");
          document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenBlogModal={handleNavigateBlog}
        onOpenContactModal={() => setContactModalOpen(true)}
        onOpenPricing={handleOpenPricing}
        onOpenInstallApp={() => setInstallAppModalOpen(true)}
        onOpenTodayInHistory={() => setTodayInHistoryOpen(true)}
      />

      {activeTool && (
        <div id="pdfsun-tool-wrapper" className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0f19] text-[#1e293b] flex flex-col items-center justify-start min-h-screen py-4 sm:py-8 px-2 sm:px-4">
          {activePseoPage && (
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-2.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl mb-4 text-xs text-slate-300 flex items-center justify-between gap-3 shrink-0 shadow-lg">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  {activePseoPage.region || "Global"} • GDPR Compliant
                </span>
                <span className="truncate font-medium text-slate-200 text-xs hidden sm:inline">
                  {activePseoPage.headline || activePseoPage.seoTitle}
                </span>
              </div>
            </div>
          )}

          <div className="w-full max-w-5xl flex flex-col items-center justify-start flex-1 px-2 sm:px-4">
            <div className="w-full flex items-center justify-center">
              {activeTool.id === "remove-watermark" ? (
                <RemoveWatermarkTool initialFile={activeToolFiles[0] || null} onClose={handleCloseTool} onAddHistory={addHistory} />
              ) : activeTool.id === "watermark-pdf" ? (
                <WatermarkPdfTool initialFile={activeToolFiles[0] || null} onClose={handleCloseTool} onAddHistory={addHistory} />
              ) : ["read-pdf-metadata", "view-pdf-metadata"].includes(activeTool.id) ? (
                <ViewPdfMetadataTool initialFile={activeToolFiles[0] || null} onClose={handleCloseTool} onAddHistory={addHistory} />
              ) : ["edit-pdf-metadata", "pdf-metadata"].includes(activeTool.id) ? (
                <EditPdfMetadataTool initialFile={activeToolFiles[0] || null} onClose={handleCloseTool} onAddHistory={addHistory} />
              ) : activeTool.id === "share-pdfsun" ? (
                <SharePdfSunModal isOpen={true} onClose={handleCloseTool} />
              ) : ["protect-pdf", "encrypt-pdf"].includes(activeTool.id) ? (
                <ProtectPdfTool initialFile={activeToolFiles[0] || null} onClose={handleCloseTool} onAddHistory={addHistory} />
              ) : activeTool.id === "compress-pdf" ? (
                <AservusPdfCompressor initialFile={activeToolFiles[0] || null} onClose={handleCloseTool} onAddHistory={addHistory} />
              ) : activeTool.isAi ? (
                <AIChatWorkspace tool={activeTool} initialFiles={activeToolFiles} onClose={handleCloseTool} onAddHistory={addHistory} />
              ) : (
                <ActiveToolWorkspace tool={activeTool} initialFiles={activeToolFiles} activeToolFiles={activeToolFiles} onClose={handleCloseTool} onSelectTool={handleSelectTool} onAddHistory={addHistory} />
              )}
            </div>

            {activePseoPage && (
              <div className="w-full max-w-4xl mx-auto px-1 sm:px-2 pb-12 pt-6">
                <PSEOLandingBanner
                  pseoPage={activePseoPage}
                  onSelectTool={handleSelectTool}
                  onSelectPseoSize={(sizeStr) => {
                    const generated = generateCompressSizePseoPage(sizeStr, activePseoPage?.region || "USA");
                    setActivePseoPage(generated);
                    const compressTool = ALL_TOOLS.find((t) => t.id === "compress-pdf" || t.slug === "compress-pdf");
                    if (compressTool) setActiveTool(compressTool);
                    if (typeof window !== "undefined") window.history.pushState({}, "", `/${generated.slug}`);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auxiliary Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} currentRole={currentRole} userProfile={userProfile} onSelectRole={handleSelectRole} initialMode={authModalInitialMode} onSuccessOpenAdmin={() => setAdminPanelOpen(true)} />

      {adminPanelOpen && (
        <ProtectedAdminWrapper canAccessAdmin={canAccessAdmin} userProfile={userProfile} isLoading={authLoading} onUnauthorized={() => { setAdminPanelOpen(false); setAuthModalInitialMode("owner"); setAuthModalOpen(true); }}>
          <AdminPanel isOpen={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} adminSettings={adminSettings} onUpdateSettings={setAdminSettings} userAccounts={userAccounts} onToggleAdminPermission={handleToggleAdminPermission} onToggleUserStatus={handleToggleUserStatus} onAddUserAccount={handleAddUserAccount} initialTab={adminPanelTab} onLogout={handleLogout} isOwner={isOwner} currentUserProfile={userProfile} />
        </ProtectedAdminWrapper>
      )}

      {userProfile && userDashboardOpen && (
        <UserDashboard isOpen={userDashboardOpen} onClose={() => setUserDashboardOpen(false)} userProfile={userProfile} favorites={favorites} history={history} allTools={ALL_TOOLS} onSelectTool={handleSelectTool} onOpenAdminPanel={canAccessAdmin ? () => handleOpenAdminPanel() : undefined} onOpenPricing={() => { setUserDashboardOpen(false); handleOpenPricing(); }} onOpenAvatarModal={() => setAvatarModalOpen(true)} />
      )}

      {userProfile && <ProfileAvatarModal isOpen={avatarModalOpen} onClose={() => setAvatarModalOpen(false)} userEmail={userProfile.email} userName={userProfile.name} currentPhotoURL={userProfile.photoURL} currentAvatar={userProfile.avatar} onPhotoUpdated={(newPhotoURL) => updateAvatar(newPhotoURL)} />}

      <PricingSection isOpen={pricingModalOpen} onClose={handleClosePricing} isModal={true} onOpenPolicy={(p) => setActivePolicy(p)} userProfile={userProfile} />
      <BlogModal isOpen={blogModalOpen} onClose={() => setBlogModalOpen(false)} />
      <ContactSupportModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
      <SitemapModal isOpen={sitemapModalOpen} onClose={() => setSitemapModalOpen(false)} />
      <PaymentSuccessModal isOpen={paymentSuccessModalOpen} onClose={() => setPaymentSuccessModalOpen(false)} userProfile={userProfile} onRefreshProfile={() => handleInstantProUnlock()} onStartProcessing={() => { handleInstantProUnlock(); setPaymentSuccessModalOpen(false); document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" }); }} />
      <PolicyModals policy={activePolicy} onClose={() => setActivePolicy(null)} />
      <RecentHistoryModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} history={history} onClearHistory={clearHistory} />
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} onSelectTool={handleSelectTool} favorites={favorites} />
      <KeyboardShortcutsModal isOpen={shortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} shortcuts={shortcuts} shortcutsEnabled={shortcutsEnabled} onToggleEnabled={toggleShortcutsEnabled} onUpdateShortcut={updateShortcutKeyCombo} onResetToDefaults={resetToDefaults} />
      <InactivityWarningModal isOpen={showWarningModal} remainingSeconds={remainingSeconds} onStayLoggedIn={() => resetInactivityTimer(true)} onLogoutNow={() => executeSecureLogout("manual_logout")} />
      <SharePdfSunModal isOpen={sharePdfSunModalOpen} onClose={() => setSharePdfSunModalOpen(false)} />
      <InstallAppModal isOpen={installAppModalOpen} onClose={() => setInstallAppModalOpen(false)} />

      {cmsModalOpen && (
        <ProtectedAdminWrapper canAccessAdmin={canAccessAdmin} userProfile={userProfile} isLoading={authLoading} onUnauthorized={() => { setCmsModalOpen(false); setAuthModalInitialMode("owner"); setAuthModalOpen(true); }}>
          <OwnerCmsModal isOpen={cmsModalOpen} onClose={() => setCmsModalOpen(false)} />
        </ProtectedAdminWrapper>
      )}

      <TodayInHistoryModal isOpen={todayInHistoryOpen} onClose={() => setTodayInHistoryOpen(false)} initialLanguage={geoResult.detectedLanguage} initialCountryCode={geoResult.detectedCountryCode} onSelectTool={handleSelectTool} />
      <FuturePdfStudioModal isOpen={futureStudioOpen} onClose={() => setFutureStudioOpen(false)} initialTab={futureStudioTab} initialFile={futureStudioFile} onAddHistory={addHistory} />
      <GlobalErrorToast />
    </div>
  );
}

// Enterprise Safety Export
export default function App() {
  return (
    <SafeErrorBoundary>
      <MainApp />
    </SafeErrorBoundary>
  );
}
