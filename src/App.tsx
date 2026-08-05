import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ToolGrid } from "./components/ToolGrid";
import { ActiveToolWorkspace } from "./components/ActiveToolWorkspace";
import { AIChatWorkspace } from "./components/AIChatWorkspace";
import { WatermarkPdfTool } from "./components/WatermarkPdfTool";
import { EditPdfMetadataTool } from "./components/EditPdfMetadataTool";
import { ProtectPdfTool } from "./components/ProtectPdfTool";
import { SharePdfSunModal } from "./components/SharePdfSunModal";
import { SupportedFormats } from "./components/SupportedFormats";
import { PricingSection } from "./components/PricingSection";
import { FAQSection } from "./components/FAQSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { AdSensePlaceholder } from "./components/AdSensePlaceholder";
import { NewsletterSubscription } from "./components/NewsletterSubscription";
import { EducationalAds } from "./components/EducationalAds";
import { GlobalErrorToast } from "./components/GlobalErrorToast";
import { Footer } from "./components/Footer";
import { PolicyModals } from "./components/PolicyModals";
import { RecentHistoryModal } from "./components/RecentHistoryModal";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { AuthModal } from "./components/AuthModal";
import { AdminPanel } from "./components/AdminPanel";
import { UserDashboard } from "./components/UserDashboard";
import { BlogModal } from "./components/BlogModal";
import { ContactSupportModal } from "./components/ContactSupportModal";
import { SearchModal } from "./components/SearchModal";
import { SitemapModal } from "./components/SitemapModal";
import { SEOManager } from "./components/SEOManager";
import { QuickActionsSidebar } from "./components/QuickActionsSidebar";
import { DualAiFeatureBanner } from "./components/DualAiFeatureBanner";
import { ToolItem, CategoryId, PolicyType, ToolHistoryItem, UserRole, UserProfile, AdminSettings, AdminUserAccount, DUAL_OWNER_EMAILS } from "./types";
import { ALL_TOOLS } from "./data/toolsData";
import { useUsageAnalytics } from "./hooks/useUsageAnalytics";
import { useKeyboardShortcutsManager } from "./hooks/useKeyboardShortcutsManager";
import { calculateAdPlacements } from "./utils/adSenseHelper";

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
          if (vt && vt.finished && typeof vt.finished.catch === "function") {
            vt.finished.catch(() => {
              // Ignore transition abort errors gracefully
            });
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

  // Role & Authentication state
  // Public customers default to "public" mode with null userProfile unless authenticated
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const savedRole = localStorage.getItem("pdfsun_user_role") as UserRole;
      if (savedRole && ["owner", "user", "public"].includes(savedRole)) {
        return savedRole;
      }
    } catch (e) {
      console.error(e);
    }
    return "public";
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const savedProfile = localStorage.getItem("pdfsun_user_profile");
      if (savedProfile) {
        return JSON.parse(savedProfile);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

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
          setUserProfile({ ...userProfile, hasAdminAccess: nextState });
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
    domainName: "https://pdfsun.in",
    supportEmail: "mukeshkalonia241@gmail.com",
    ownerName: "Mukesh Kalonia",
    maintenanceMode: false,
    adsenseEnabled: true,
    adsensePubId: "pub-4820193821039120",
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

  // Modals state
  const [activePolicy, setActivePolicy] = useState<PolicyType | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminPanelTab, setAdminPanelTab] = useState<string>("analytics");
  const [userDashboardOpen, setUserDashboardOpen] = useState(false);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [sitemapModalOpen, setSitemapModalOpen] = useState(false);

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

  const handleSelectTool = (tool: ToolItem, initialFiles?: File[]) => {
    trackToolUsage(tool.id);
    setActiveTool(tool);
    if (initialFiles) setActiveToolFiles(initialFiles);
    else setActiveToolFiles([]);
  };

  const handleSelectRole = (role: UserRole, profile: UserProfile | null) => {
    setCurrentRole(role);
    if (profile) {
      const match = userAccounts.find((a) => a.email === profile.email);
      const hasAdmin = role === "owner" || (match ? match.hasAdminAccess : Boolean(profile.hasAdminAccess));
      const updatedProfile = { ...profile, hasAdminAccess: hasAdmin };
      setUserProfile(updatedProfile);
      try {
        localStorage.setItem("pdfsun_user_role", role);
        localStorage.setItem("pdfsun_user_profile", JSON.stringify(updatedProfile));
      } catch (e) {
        console.error(e);
      }
    } else {
      setUserProfile(null);
      try {
        localStorage.removeItem("pdfsun_user_role");
        localStorage.removeItem("pdfsun_user_profile");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const currentUserEmail = (userProfile?.email || "").toLowerCase().trim();
  const isDualOwner = DUAL_OWNER_EMAILS.includes(currentUserEmail);
  const canAccessAdmin =
    currentRole !== "public" &&
    userProfile !== null &&
    (currentRole === "owner" || (Boolean(userProfile?.hasAdminAccess) && (isDualOwner || userProfile?.role === "owner")));

  const handleLogout = () => {
    setCurrentRole("public");
    setUserProfile(null);
    setAdminPanelOpen(false);
    setUserDashboardOpen(false);
    try {
      localStorage.removeItem("pdfsun_user_role");
      localStorage.removeItem("pdfsun_user_profile");
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdminPanel = (tab?: string) => {
    if (!canAccessAdmin) {
      console.warn("Access denied: Admin panel is totally hidden and restricted for customer users.");
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
    ? `${activeTool.name} - Free Online PDF Tool | PDF Sun`
    : "PDF Sun - Free Online PDF Tools, Converter, Merge & Compress";

  const pageDescription = activeTool
    ? `${activeTool.description} Easily convert, merge, compress, and edit PDF files online for free with PDF Sun.`
    : "PDF Sun lets you easily convert, merge, compress, edit, and secure your PDF files online for free. Fast, easy, and secure PDF tools at pdfsun.in.";

  const canonicalUrl = activeTool
    ? `https://pdfsun.in/?tool=${activeTool.slug}`
    : "https://pdfsun.in/";

  const ogTitle = activeTool
    ? `${activeTool.name} - Free Online PDF Tool | PDF Sun`
    : "PDF Sun - Free Online PDF Tools & Converter";

  const ogDescription = activeTool
    ? `${activeTool.description} Easily convert, merge, compress, and edit PDF files online for free with PDF Sun.`
    : "Easily convert, merge, compress, and edit PDF files online for free with PDF Sun.";

  const twitterTitle = activeTool
    ? `${activeTool.name} - Free Online PDF Tool`
    : "PDF Sun - Free Online PDF Tools";

  const twitterDescription = activeTool
    ? `${activeTool.description} Fast and secure online PDF tools at pdfsun.in`
    : "Fast and secure online PDF tools at pdfsun.in";

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
      />

      {/* Dynamic SEO Head Management */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="PDF Sun, pdf tools, online pdf converter, merge pdf, compress pdf, edit pdf online, pdfsun.in" />
        <meta name="author" content="PDF Sun" />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        <link rel="canonical" href={canonicalUrl} />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Social Sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content="https://pdfsun.in/og-image.png" />
        <meta property="og:site_name" content="PDF Sun" />

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
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenAdminPanel={handleOpenAdminPanel}
        onOpenUserDashboard={() => setUserDashboardOpen(true)}
        onLogout={handleLogout}
        onGoHome={() => {
          setActiveTool(null);
          setSelectedCategory("all");
          setSearchQuery("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Quick Actions Sidebar for Fast Tool Access */}
      <QuickActionsSidebar
        onSelectTool={handleSelectTool}
        activeTool={activeTool}
      />

      {/* Main Hero Dropzone & Search Section */}
      <main className="flex-1">
        <HeroSection
          onSelectTool={handleSelectTool}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        {/* Placement 1: Sub-Hero AdSense Banner (Below Hero Section) */}
        {adPlacements.some((p) => p.id === "hero-sub-ad") && (
          <AdSensePlaceholder slotId="pdfsun-auto-hero-sub-01" format="leaderboard" />
        )}

        {/* 50+ PDF Tools Filterable Grid */}
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

        {/* Educational Partnerships & Academic Excellence Ads (IIT & IIM) */}
        <EducationalAds />

        {/* Dual AI Pro Feature Cards & Global Enterprise Suite */}
        <DualAiFeatureBanner
          onSelectTool={handleSelectTool}
          onOpenSitemapModal={() => setSitemapModalOpen(true)}
          onOpenContactModal={() => setContactModalOpen(true)}
        />

        {/* Placement 2: In-Content AdSense Banner (Between major PDF tool sections) */}
        {adPlacements.some((p) => p.id === "incontent-grid-ad") && (
          <AdSensePlaceholder slotId="pdfsun-auto-incontent-02" format="rectangle" />
        )}

        {/* Supported File Formats */}
        <SupportedFormats />

        {/* Pricing Comparison */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* FAQ Accordion */}
        <FAQSection activeTool={activeTool} />

        {/* Newsletter Subscription Banner */}
        <NewsletterSubscription variant="standalone" />
      </main>

      {/* Enterprise Footer */}
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
        onOpenSitemapModal={() => setSitemapModalOpen(true)}
      />

      {/* Interactive Active Tool Workspace Modals */}
      {activeTool && (
        activeTool.id === "watermark-pdf" ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
            <WatermarkPdfTool
              initialFile={activeToolFiles[0] || null}
              onClose={() => setActiveTool(null)}
              onAddHistory={addHistory}
            />
          </div>
        ) : ["edit-pdf-metadata", "pdf-metadata", "read-pdf-metadata"].includes(activeTool.id) ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
            <EditPdfMetadataTool
              initialFile={activeToolFiles[0] || null}
              onClose={() => setActiveTool(null)}
              onAddHistory={addHistory}
            />
          </div>
        ) : activeTool.id === "share-pdfsun" ? (
          <SharePdfSunModal
            isOpen={true}
            onClose={() => setActiveTool(null)}
          />
        ) : ["protect-pdf", "encrypt-pdf"].includes(activeTool.id) ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
            <ProtectPdfTool
              initialFile={activeToolFiles[0] || null}
              onClose={() => setActiveTool(null)}
              onAddHistory={addHistory}
            />
          </div>
        ) : activeTool.isAi ? (
          <AIChatWorkspace
            tool={activeTool}
            initialFiles={activeToolFiles}
            onClose={() => setActiveTool(null)}
            onAddHistory={addHistory}
          />
        ) : (
          <ActiveToolWorkspace
            tool={activeTool}
            initialFiles={activeToolFiles}
            onClose={() => setActiveTool(null)}
            onAddHistory={addHistory}
          />
        )
      )}

      {/* Authentication & Role Selection Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentRole={currentRole}
        userProfile={userProfile}
        onSelectRole={handleSelectRole}
      />

      {/* Admin Panel Modal for Owner (Mukesh Kalonia & Mukesh Inland) & Authorized Admins */}
      {canAccessAdmin && adminPanelOpen && (
        <AdminPanel
          isOpen={adminPanelOpen}
          onClose={() => setAdminPanelOpen(false)}
          adminSettings={adminSettings}
          onUpdateSettings={setAdminSettings}
          userAccounts={userAccounts}
          onToggleAdminPermission={handleToggleAdminPermission}
          onToggleUserStatus={handleToggleUserStatus}
          onAddUserAccount={handleAddUserAccount}
          initialTab={adminPanelTab}
          onLogout={handleLogout}
          isOwner={currentRole === "owner" || isDualOwner}
          currentUserProfile={userProfile}
        />
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
        />
      )}

      {/* Blog & Knowledge Base Modal */}
      <BlogModal isOpen={blogModalOpen} onClose={() => setBlogModalOpen(false)} />

      {/* Contact & Support Modal */}
      <ContactSupportModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      {/* Dynamic sitemap.xml SEO Generator Modal */}
      <SitemapModal isOpen={sitemapModalOpen} onClose={() => setSitemapModalOpen(false)} />

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

      {/* Global Toast Error Notifications */}
      <GlobalErrorToast />
    </div>
  );
}
