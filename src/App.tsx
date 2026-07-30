import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ToolGrid } from "./components/ToolGrid";
import { ActiveToolWorkspace } from "./components/ActiveToolWorkspace";
import { AIChatWorkspace } from "./components/AIChatWorkspace";
import { SupportedFormats } from "./components/SupportedFormats";
import { PricingSection } from "./components/PricingSection";
import { FAQSection } from "./components/FAQSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { AdSensePlaceholder } from "./components/AdSensePlaceholder";
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
import { ToolItem, CategoryId, PolicyType, ToolHistoryItem, UserRole, UserProfile, AdminSettings } from "./types";
import { ALL_TOOLS } from "./data/toolsData";
import { useUsageAnalytics } from "./hooks/useUsageAnalytics";

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("pdfsun_theme");
    if (saved) return saved === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("pdfsun_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("pdfsun_theme", "light");
    }
  }, [darkMode]);

  // Role & Authentication state
  const [currentRole, setCurrentRole] = useState<UserRole>("owner"); // Owner/Admin mode for Mukesh Kalonia
  const [userProfile, setUserProfile] = useState<UserProfile | null>({
    id: "owner-001",
    name: "Mukesh Kalonia",
    email: "mukeshkalonia241@gmail.com",
    role: "owner",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    plan: "Team Enterprise",
    joinedDate: "Founder & Owner",
  });

  // Admin Settings state
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    siteName: "PDFSun - Enterprise PDF Platform",
    domainName: "PDFSUN.COM",
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

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    setUserProfile(profile);
  };

  const handleLogout = () => {
    setCurrentRole("public");
    setUserProfile(null);
  };

  const handleOpenAdminPanel = (tab?: string) => {
    if (tab) setAdminPanelTab(tab);
    setAdminPanelOpen(true);
  };

  // Dynamic SEO Helmet variables
  const pageTitle = activeTool
    ? `${activeTool.name} - Free Online PDF Tool | PDFSun`
    : `${adminSettings.siteName} - Free Online PDF Converter & AI Tools`;

  const pageDescription = activeTool
    ? `${activeTool.description} Free, fast, and 100% private client-side processing on PDFSun with zero server uploads.`
    : "PDFSun is an enterprise-grade, 100% private in-browser PDF suite offering 50+ free utilities: Merge, Split, Compress, AI Chat, OCR, e-Sign, Watermark, and Convert PDFs instantly.";

  const canonicalUrl = activeTool
    ? `https://pdfsun.com/tool/${activeTool.slug}`
    : "https://pdfsun.com/";

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans flex flex-col">
      {/* Dynamic SEO Head Management */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Social Sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="PDFSun Platform" />
        <meta property="og:image" content="https://pdfsun.com/og-image.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://pdfsun.com/twitter-image.png" />

        {/* Indexing & Metadata */}
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="PDF converter, merge PDF, split PDF, compress PDF, AI PDF chat, OCR PDF, e-Sign PDF, watermark PDF, free online PDF tools, PDFSun" />
      </Helmet>

      {/* Sticky Top Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
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

      {/* Main Hero Dropzone & Search Section */}
      <main className="flex-1">
        <HeroSection
          onSelectTool={handleSelectTool}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        {/* AdSense Top Slot */}
        <AdSensePlaceholder slotId="header-leaderboard" format="leaderboard" />

        {/* 50+ PDF Tools Filterable Grid */}
        <ToolGrid
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSelectTool={handleSelectTool}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* AdSense Middle Rectangle */}
        <AdSensePlaceholder slotId="mid-grid-rectangle" format="rectangle" />

        {/* Supported File Formats */}
        <SupportedFormats />

        {/* Pricing Comparison */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* FAQ Accordion */}
        <FAQSection />
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
      />

      {/* Interactive Active Tool Workspace Modals */}
      {activeTool && (
        activeTool.isAi ? (
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

      {/* Admin Panel Modal for Owner (Mukesh Kalonia) */}
      <AdminPanel
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
        adminSettings={adminSettings}
        onUpdateSettings={setAdminSettings}
        initialTab={adminPanelTab}
        onLogout={handleLogout}
      />

      {/* User Dashboard Modal */}
      {userProfile && (
        <UserDashboard
          isOpen={userDashboardOpen}
          onClose={() => setUserDashboardOpen(false)}
          userProfile={userProfile}
          favorites={favorites}
          history={history}
          allTools={ALL_TOOLS}
          onSelectTool={handleSelectTool}
          onOpenAdminPanel={() => setAdminPanelOpen(true)}
        />
      )}

      {/* Blog & Knowledge Base Modal */}
      <BlogModal isOpen={blogModalOpen} onClose={() => setBlogModalOpen(false)} />

      {/* Contact & Support Modal */}
      <ContactSupportModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

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
      />
    </div>
  );
}
