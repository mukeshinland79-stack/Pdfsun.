import React, { useState } from "react";
import {
  Crown,
  BarChart3,
  Users,
  FolderKanban,
  Sparkles,
  DollarSign,
  Settings,
  FileSpreadsheet,
  Terminal,
  DatabaseBackup,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Save,
  Trash2,
  Power,
  Sliders,
  Download,
  Upload,
  User,
  LogOut,
  FileText,
  Activity,
  HeartPulse,
  Check,
  Flame,
  Globe,
  Copy,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  PieChart,
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  Zap,
  Plus,
  Layers,
} from "lucide-react";
import { AdminSettings, AdminUserAccount, UserProfile, DUAL_OWNER_EMAILS, SystemConfig } from "../types";
import { ServerSystemConfigForm } from "./ServerSystemConfigForm";
import { useUsageAnalytics } from "../hooks/useUsageAnalytics";
import { RealTimeTrafficMonitor } from "./RealTimeTrafficMonitor";
import { ServerStatusWidget } from "./ServerStatusWidget";
import { BusinessGrowthDashboard } from "./BusinessGrowthDashboard";
import { RealTimeApiLatencyMonitor } from "./RealTimeApiLatencyMonitor";
import { AdminActivityLog } from "./AdminActivityLog";
import { AdminAlertSystem } from "./AdminAlertSystem";
import { UserEngagementOverview } from "./UserEngagementOverview";
import { AdminAnomalyDetector } from "./AdminAnomalyDetector";
import { AdminSystemMonitor } from "./AdminSystemMonitor";
import { GlobalTrafficHeatmap } from "./GlobalTrafficHeatmap";
import { AdminPerformanceHeatmap } from "./AdminPerformanceHeatmap";
import { AdminEmailDigest } from "./AdminEmailDigest";
import { SEOPerformanceDashboard } from "./SEOPerformanceDashboard";
import { AITokenMonitor } from "./AITokenMonitor";
import { AdminSystemHealth } from "./AdminSystemHealth";
import { ALL_TOOLS } from "../data/toolsData";
import {
  generateSitemapXml,
  downloadSitemapFile,
  copySitemapToClipboard,
  getSitemapStats,
} from "../utils/sitemapGenerator";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
  onUpdateSettings: (settings: AdminSettings) => void;
  userAccounts?: AdminUserAccount[];
  onToggleAdminPermission?: (userId: string) => void;
  onToggleUserStatus?: (userId: string) => void;
  onAddUserAccount?: (newUser: { name: string; email: string; plan: string; hasAdminAccess: boolean }) => void;
  initialTab?: string;
  onLogout?: () => void;
  isOwner?: boolean;
  currentUserProfile?: UserProfile | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  adminSettings,
  onUpdateSettings,
  userAccounts = [],
  onToggleAdminPermission,
  onToggleUserStatus,
  onAddUserAccount,
  initialTab = "analytics",
  onLogout,
  isOwner,
  currentUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || "analytics");
  const [localSettings, setLocalSettings] = useState<AdminSettings>(adminSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New user creation form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPlan, setNewUserPlan] = useState("Student Pro");
  const [newUserGrantAdmin, setNewUserGrantAdmin] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  // Usage Analytics Hook for live usage monitoring
  const {
    usageCounts,
    topToolIds,
    getFormattedUsage,
    getUsageCount,
    totalExecutions,
    getToolSharePercentage,
    trackToolUsage,
    resetUsage,
    simulateRandomUsage,
  } = useUsageAnalytics(50);

  // Analytics Dashboard local state
  const [analyticsCategory, setAnalyticsCategory] = useState<string>("all");
  const [analyticsSearch, setAnalyticsSearch] = useState<string>("");
  const [analyticsSort, setAnalyticsSort] = useState<"usage" | "name" | "share" | "category">("usage");
  const [isSimulatingAnalytics, setIsSimulatingAnalytics] = useState<boolean>(false);
  const [realtimePulseEvents, setRealtimePulseEvents] = useState<
    { id: string; time: string; toolName: string; category: string; location: string }[]
  >([
    { id: "evt-1", time: "Just now", toolName: "Merge PDF", category: "edit", location: "United States" },
    { id: "evt-2", time: "12s ago", toolName: "AI Chat with PDF", category: "ai", location: "India" },
    { id: "evt-3", time: "34s ago", toolName: "Compress PDF", category: "convert", location: "Germany" },
    { id: "evt-4", time: "1m ago", toolName: "Annotate PDF", category: "edit", location: "Brazil" },
  ]);

  // Live auto-simulation ticker effect for real-time analytics monitoring
  React.useEffect(() => {
    if (!isSimulatingAnalytics) return;

    const interval = setInterval(() => {
      const toolId = simulateRandomUsage();
      if (toolId) {
        const toolObj = ALL_TOOLS.find((t) => t.id === toolId);
        if (toolObj) {
          const locations = ["United States", "India", "Germany", "United Kingdom", "Japan", "Brazil", "Canada", "Australia"];
          const loc = locations[Math.floor(Math.random() * locations.length)];
          const newEvt = {
            id: `evt-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            toolName: toolObj.name,
            category: toolObj.category || "general",
            location: loc,
          };
          setRealtimePulseEvents((prev) => [newEvt, ...prev.slice(0, 9)]);
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulatingAnalytics, simulateRandomUsage]);

  // Handler for Exporting Analytics CSV
  const handleExportAnalyticsCsv = () => {
    const nowStr = new Date().toISOString();
    let csvContent = `PDFSun Enterprise Real-Time Analytics Report\nGenerated At,${nowStr}\nTotal Executions,${totalExecutions}\nTotal Tools Tracked,${ALL_TOOLS.length}\n\n`;
    csvContent += "Rank,Tool ID,Tool Name,Category,Total Executions,Platform Share %\n";
    
    ALL_TOOLS.slice()
      .sort((a, b) => getUsageCount(b.id) - getUsageCount(a.id))
      .forEach((t, index) => {
        const count = getUsageCount(t.id);
        const share = getToolSharePercentage(t.id);
        csvContent += `${index + 1},"${t.id}","${t.name}","${t.category}",${count},${share}%\n`;
      });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PDFSun_RealTime_Analytics_${nowStr.split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // User Management State (fallback if not passed via props)
  const [localUserList, setLocalUserList] = useState<AdminUserAccount[]>([
    { id: "usr-01", name: "Alex Rivera", email: "alex.rivera@edu.org", plan: "Student Pro", status: "Active", joined: "2026-01-12", hasAdminAccess: false },
    { id: "usr-02", name: "Sarah Jenkins", email: "sarah.j@lawfirm.com", plan: "Team Enterprise", status: "Active", joined: "2026-02-04", hasAdminAccess: false },
    { id: "usr-03", name: "David Kim", email: "dkim@tech.co", plan: "Free Sun", status: "Active", joined: "2026-03-19", hasAdminAccess: false },
    { id: "usr-04", name: "Mukesh Kalonia", email: "mukeshkalonia241@gmail.com", plan: "Admin Owner", status: "Active", joined: "2026-01-01", hasAdminAccess: true },
  ]);

  const activeUserList = userAccounts.length > 0 ? userAccounts : localUserList;

  // System Logs State
  const [logs, setLogs] = useState([
    { id: 1, time: "15:42:10", type: "INFO", msg: "User Alex Rivera converted 3 PDF files via Merge tool." },
    { id: 2, time: "15:40:02", type: "AI", msg: "Gemini 3.6 API stream completed (420ms response time)." },
    { id: 3, time: "15:35:12", type: "SYSTEM", msg: "Local memory WebAssembly engine garbage collection executed." },
    { id: 4, time: "15:22:40", type: "ADS", msg: "Google AdSense Publisher Slot pub-4820193821039120 served 120 impressions." },
  ]);

  const handleToggleUserStatusInternal = (userId: string) => {
    if (onToggleUserStatus) {
      onToggleUserStatus(userId);
    } else {
      setLocalUserList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u))
      );
    }
  };

  const handleToggleAdminPermissionInternal = (userId: string) => {
    if (onToggleAdminPermission) {
      onToggleAdminPermission(userId);
    } else {
      setLocalUserList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, hasAdminAccess: !u.hasAdminAccess } : u))
      );
    }
  };

  const handleAddNewUserInternal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    if (onAddUserAccount) {
      onAddUserAccount({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        plan: newUserPlan,
        hasAdminAccess: newUserGrantAdmin,
      });
    } else {
      const newUser: AdminUserAccount = {
        id: `usr-${Date.now()}`,
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        plan: newUserPlan,
        status: "Active",
        joined: new Date().toISOString().split("T")[0],
        hasAdminAccess: newUserGrantAdmin,
      };
      setLocalUserList((prev) => [newUser, ...prev]);
    }
    setNewUserName("");
    setNewUserEmail("");
    setNewUserGrantAdmin(false);
    setShowAddUserForm(false);
  };

  if (!isOpen) return null;

  const userEmail = (currentUserProfile?.email || "").toLowerCase().trim();
  const isDualOwnerUser = DUAL_OWNER_EMAILS.includes(userEmail);

  const isPlatformOwner = isOwner !== undefined 
    ? (isOwner || isDualOwnerUser)
    : (isDualOwnerUser || currentUserProfile?.plan === "Founder & Owner" || currentUserProfile?.plan === "Admin Owner");

  const effectiveActiveTab = isPlatformOwner ? activeTab : "analytics";

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePurgeMemoryCache = () => {
    setLogs((prev) => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: "SYSTEM", msg: "Purged client browser cache memories & temp binaries." },
      ...prev,
    ]);
    alert("Memory cache purged successfully!");
  };

  const handleExportBackup = async () => {
    let liveSystemConfig: SystemConfig = {
      ADMIN_SECRET_KEY: "12345",
      TEMP_STORAGE_RETENTION_MINUTES: 60,
      MAX_STORAGE_USAGE_THRESHOLD: 90,
      HEAVY_TRANSFORMATION_LIMIT: 1000,
      GLOBAL_RATE_LIMIT: 10000,
      BAD_REQUEST_AUTO_BLOCK_COUNT: 100,
      OWNER_ONLY_STEALTH_MODE: true,
    };

    try {
      const res = await fetch("/api/admin/system-config", {
        headers: {
          "x-user-email": (currentUserProfile?.email || "mukeshinland79@gmail.com").toLowerCase().trim(),
          "x-admin-token": "12345",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          liveSystemConfig = data.config;
        }
      }
    } catch (err) {
      console.warn("Using local system config baseline for backup download.");
    }

    const backupPayload = {
      backupMetadata: {
        appName: "PDFSun Enterprise Platform",
        backupType: "Offline Emergency System Configuration Recovery Snapshot",
        exportTimestamp: new Date().toISOString(),
        exportedBy: currentUserProfile?.email || "mukeshinland79@gmail.com",
        version: "2.5.0-PROD",
        environment: "Cloud Run Production",
      },
      systemConfigSecretsAndLimits: {
        ADMIN_SECRET_KEY: liveSystemConfig.ADMIN_SECRET_KEY,
        GLOBAL_RATE_LIMIT: liveSystemConfig.GLOBAL_RATE_LIMIT,
        TEMP_STORAGE_RETENTION_MINUTES: liveSystemConfig.TEMP_STORAGE_RETENTION_MINUTES,
        MAX_STORAGE_USAGE_THRESHOLD: liveSystemConfig.MAX_STORAGE_USAGE_THRESHOLD,
        HEAVY_TRANSFORMATION_LIMIT: liveSystemConfig.HEAVY_TRANSFORMATION_LIMIT,
        BAD_REQUEST_AUTO_BLOCK_COUNT: liveSystemConfig.BAD_REQUEST_AUTO_BLOCK_COUNT,
        OWNER_ONLY_STEALTH_MODE: liveSystemConfig.OWNER_ONLY_STEALTH_MODE,
      },
      websiteAdminSettings: localSettings,
      registeredUserAccounts: activeUserList,
      recoveryInstructions: [
        "1. Store this backup JSON file in a secure, encrypted offline storage location.",
        "2. In the event of an emergency or system reset, use the Import Configuration JSON option in the Admin Settings tab to restore all settings.",
        "3. Verify ADMIN_SECRET_KEY and GLOBAL_RATE_LIMIT parameters after restoring.",
      ],
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `PDFSun_Backup_Configuration_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.websiteAdminSettings) {
          setLocalSettings(json.websiteAdminSettings);
          onUpdateSettings(json.websiteAdminSettings);
        }
        if (json.systemConfigSecretsAndLimits) {
          // Attempt to update server configuration via API
          try {
            await fetch("/api/admin/system-config", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-email": (currentUserProfile?.email || "mukeshinland79@gmail.com").toLowerCase().trim(),
                "x-admin-token": json.systemConfigSecretsAndLimits.ADMIN_SECRET_KEY || "12345",
              },
              body: JSON.stringify(json.systemConfigSecretsAndLimits),
            });
          } catch (apiErr) {
            console.warn("Could not push restored system config to remote server:", apiErr);
          }
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        alert("Configuration backup JSON imported successfully! All settings, secret keys, and rate limits restored.");
      } catch (err) {
        alert("Invalid backup file format. Please upload a valid PDFSun emergency configuration JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl max-w-6xl w-full h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">PDFSun Admin Control Center</h2>
                <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded uppercase">
                  {isPlatformOwner ? "ADMIN OWNER" : "GRANTED ADMIN"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authenticated Admin: <strong>{currentUserProfile?.name || (isPlatformOwner ? "Mukesh Kalonia" : "Customer Admin")}</strong> ({currentUserProfile?.email || (isPlatformOwner ? "mukeshkalonia241@gmail.com" : "admin@pdfsun.app")})
                {!isPlatformOwner && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase border border-amber-500/30">
                    Restricted View (Analytics Only)
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          {isPlatformOwner ? (
            <>
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "profile" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Admin Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "analytics" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "users" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </button>

              <button
                onClick={() => setActiveTab("files")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "files" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>File Management</span>
              </button>

              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "ai" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Management</span>
              </button>

              <button
                onClick={() => setActiveTab("ads")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "ads" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Advertisement Management</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "settings" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Website Settings</span>
              </button>

              <button
                onClick={() => setActiveTab("seo")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "seo" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>SEO & Sitemap</span>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "reports" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Reports</span>
              </button>

              <button
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "logs" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>System Logs</span>
              </button>

              <button
                onClick={() => setActiveTab("health")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "health" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <span>System Health</span>
              </button>

              <button
                onClick={() => setActiveTab("activity_log")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "activity_log" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>System Activity Log</span>
              </button>

              <button
                onClick={() => setActiveTab("backup")}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition ${
                  effectiveActiveTab === "backup" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <DatabaseBackup className="w-4 h-4" />
                <span>Backup & Restore</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab("analytics")}
              className="px-3 py-2 rounded-xl flex items-center space-x-1.5 bg-blue-600 text-white shadow-xs font-bold"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics Dashboard (Restricted Admin View)</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* 0. Admin Profile Tab */}
          {effectiveActiveTab === "profile" && (
            <div className="space-y-6">
              {/* Owner Overview Banner */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                  {currentUserProfile?.name ? currentUserProfile.name.split(" ").map(n => n[0]).join("") : "MK"}
                </div>
                <div className="text-center md:text-left space-y-1">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {currentUserProfile?.name || "Mukesh Kalonia"}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase">
                      DUAL-OWNER PLATFORM ADMIN
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {currentUserProfile?.email || "mukeshkalonia241@gmail.com"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                    Super administrator access with exclusive RBAC authorization to manage global system configurations, security rate limits, and server storage parameters.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-400 uppercase">Role Level</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    Super Admin / Verified Owner
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-400 uppercase">Security Status</div>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Dual-Owner RBAC Enforced</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-400 uppercase">Active Domain</div>
                  <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                    pdfsun.com
                  </div>
                </div>
              </div>

              {/* Dynamic Server & System Configurations Form */}
              <ServerSystemConfigForm currentUserProfile={currentUserProfile} />
            </div>
          )}

          {/* 1. Analytics Tab */}
          {effectiveActiveTab === "analytics" && (
            <div className="space-y-6">
              {/* Real-Time Critical System Alert Dispatcher & Toast Manager */}
              <AdminAlertSystem />

              {/* Server Telemetry & System Status Widget */}
              <ServerStatusWidget />

              {/* Real-Time Infrastructure & System Resource Sparkline Monitor */}
              <AdminSystemMonitor />

              {/* Real-time Traffic & WebSocket Polling Stream */}
              <RealTimeTrafficMonitor />

              {/* Real-time API Latency & Response Gauge Monitor */}
              <RealTimeApiLatencyMonitor />

              {/* Enterprise Business Intelligence & Retention Growth Dashboard */}
              <BusinessGrowthDashboard />

              {/* User Engagement & Retention Recharts Overview */}
              <UserEngagementOverview />

              {/* Google Search Console SEO & Keyword Performance Dashboard */}
              <SEOPerformanceDashboard />

              {/* Gemini AI Model Token Consumption & Cost Monitor */}
              <AITokenMonitor />

              {/* Global Real-Time Traffic Heatmap & Geographic Distribution */}
              <GlobalTrafficHeatmap />

              {/* 24-Hour Server Performance & Latency Heatmap Matrix */}
              <AdminPerformanceHeatmap />

              {/* Statistical Anomaly & Outlier Detector Engine */}
              <AdminAnomalyDetector />

              {/* Automated Admin Email Performance Digest Scheduler */}
              <AdminEmailDigest userEmail={currentUserProfile?.email} />

              {/* Real-time Dashboard Control Toolbar */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-slate-900 text-white shadow-xl border border-blue-800/40 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-black tracking-tight">Real-Time PDF Tool Usage Analytics</h3>
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>LIVE PULSE ACTIVE</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Track tool demand, identify growth trends, and prioritize feature development roadmap.
                      </p>
                    </div>
                  </div>

                  {/* Dashboard Quick Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setIsSimulatingAnalytics(!isSimulatingAnalytics)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md ${
                        isSimulatingAnalytics
                          ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                          : "bg-emerald-600 text-white hover:bg-emerald-500"
                      }`}
                    >
                      {isSimulatingAnalytics ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isSimulatingAnalytics ? "Pause Live Stream" : "Simulate Live Traffic"}</span>
                    </button>

                    <button
                      onClick={handleExportAnalyticsCsv}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={resetUsage}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center space-x-1"
                      title="Reset tool counters to default seed values"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Live Real-time Metrics Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Total Tracked Executions</div>
                    <div className="text-xl font-black text-amber-300 mt-0.5 flex items-center space-x-1">
                      <span>{totalExecutions.toLocaleString()}</span>
                      <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Monitored Tools</div>
                    <div className="text-xl font-black text-emerald-300 mt-0.5">
                      {ALL_TOOLS.length} Active Tools
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Most Used Tool</div>
                    <div className="text-sm font-black text-sky-300 truncate mt-1">
                      {ALL_TOOLS.find((t) => t.id === topToolIds[0])?.name || "Merge PDF"}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Top Category Share</div>
                    <div className="text-sm font-black text-indigo-300 uppercase mt-1">
                      {ALL_TOOLS.find((t) => t.id === topToolIds[0])?.category || "Convert"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Usage Breakdown Section */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Category Usage Share Distribution
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Breakdown of visitor executions grouped by tool category
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stacked Visual Bar */}
                {(() => {
                  const categories = Array.from(new Set(ALL_TOOLS.map((t) => t.category)));
                  const categoryTotals = categories.map((cat) => {
                    const catTools = ALL_TOOLS.filter((t) => t.category === cat);
                    const total = catTools.reduce((acc, t) => acc + getUsageCount(t.id), 0);
                    const pct = totalExecutions > 0 ? (total / totalExecutions) * 100 : 0;
                    return { category: cat, total, pct };
                  }).sort((a, b) => b.total - a.total);

                  const catColors: Record<string, string> = {
                    convert: "bg-blue-500",
                    edit: "bg-indigo-500",
                    ai: "bg-purple-500",
                    security: "bg-emerald-500",
                    student: "bg-amber-500",
                    advanced: "bg-rose-500",
                  };

                  return (
                    <div className="space-y-3">
                      <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                        {categoryTotals.map((item) => (
                          <div
                            key={item.category}
                            style={{ width: `${item.pct}%` }}
                            className={`${catColors[item.category] || "bg-slate-400"} transition-all duration-500`}
                            title={`${item.category.toUpperCase()}: ${item.total} uses (${item.pct.toFixed(1)}%)`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                        {categoryTotals.map((item) => (
                          <div
                            key={item.category}
                            onClick={() => setAnalyticsCategory(analyticsCategory === item.category ? "all" : item.category)}
                            className={`p-2.5 rounded-2xl border text-center cursor-pointer transition ${
                              analyticsCategory === item.category
                                ? "bg-blue-50 dark:bg-blue-900/40 border-blue-500 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-center space-x-1.5">
                              <span className={`w-2 h-2 rounded-full ${catColors[item.category] || "bg-slate-400"}`} />
                              <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-200">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-xs font-black text-slate-900 dark:text-white mt-1">
                              {item.pct.toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.total.toLocaleString()} uses
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Feature Roadmap & Feature Prioritization Matrix */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Feature Roadmap & Development Priority Matrix
                    </h3>
                    <p className="text-xs text-slate-400">
                      Automated feature recommendations based on live visitor utilization data
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topToolIds.slice(0, 3).map((toolId, rank) => {
                    const toolObj = ALL_TOOLS.find((t) => t.id === toolId);
                    if (!toolObj) return null;
                    const count = getUsageCount(toolId);
                    const share = getToolSharePercentage(toolId);

                    const priorityBadges = [
                      { title: "🚀 Tier 1 Priority (Scale First)", desc: `Highest user demand (${count} uses, ${share}% share). Prioritize batch processing support & WebAssembly speed tuning.` },
                      { title: "⭐ Tier 2 Priority (Feature Polish)", desc: `High retention tool (${count} uses). Add granular custom presets and instant drag-and-drop enhancements.` },
                      { title: "⚡ Tier 3 Priority (AI & Extensions)", desc: `Growing popularity (${count} uses). Expand Gemini 3.6 prompt options & export customization.` },
                    ];

                    const pInfo = priorityBadges[rank] || priorityBadges[2];

                    return (
                      <div
                        key={toolId}
                        className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                            Rank #{rank + 1}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-400">{getFormattedUsage(toolId)}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{toolObj.name}</h4>
                        <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">{pInfo.title}</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{pInfo.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Interactive Tool Usage Leaderboard Table */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>PDF Tools Usage Ranking ({ALL_TOOLS.length} Total Tools)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Filter and search real-time tool metrics to analyze demand patterns.
                    </p>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search tool..."
                        value={analyticsSearch}
                        onChange={(e) => setAnalyticsSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 w-36 sm:w-48 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Category Filter */}
                    <select
                      value={analyticsCategory}
                      onChange={(e) => setAnalyticsCategory(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    >
                      <option value="all">All Categories</option>
                      <option value="convert">Convert</option>
                      <option value="edit">Edit</option>
                      <option value="ai">AI</option>
                      <option value="security">Security</option>
                      <option value="student">Student</option>
                      <option value="advanced">Advanced</option>
                    </select>

                    {/* Sort Selector */}
                    <select
                      value={analyticsSort}
                      onChange={(e) => setAnalyticsSort(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    >
                      <option value="usage">Sort by Executions</option>
                      <option value="share">Sort by Share %</option>
                      <option value="name">Sort by Name</option>
                      <option value="category">Sort by Category</option>
                    </select>
                  </div>
                </div>

                {/* Ranking Leaderboard Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 w-12 text-center">Rank</th>
                        <th className="p-3">PDF Tool Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Executions</th>
                        <th className="p-3 w-48">Usage Share %</th>
                        <th className="p-3">Dev Roadmap Priority</th>
                        <th className="p-3 text-right">Simulate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {ALL_TOOLS.filter((t) => {
                        const matchesCat = analyticsCategory === "all" || t.category === analyticsCategory;
                        const matchesSearch =
                          !analyticsSearch.trim() ||
                          t.name.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
                          t.id.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
                          t.description.toLowerCase().includes(analyticsSearch.toLowerCase());
                        return matchesCat && matchesSearch;
                      })
                        .sort((a, b) => {
                          if (analyticsSort === "usage") return getUsageCount(b.id) - getUsageCount(a.id);
                          if (analyticsSort === "share") return getToolSharePercentage(b.id) - getToolSharePercentage(a.id);
                          if (analyticsSort === "name") return a.name.localeCompare(b.name);
                          if (analyticsSort === "category") return (a.category || "").localeCompare(b.category || "");
                          return 0;
                        })
                        .map((toolObj, idx) => {
                          const count = getUsageCount(toolObj.id);
                          const share = getToolSharePercentage(toolObj.id);

                          // Development Priority badge logic
                          let pBadge = {
                            label: "High Priority",
                            color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                          };
                          if (count >= 1000) {
                            pBadge = {
                              label: "🚀 High Priority (Expand Batch)",
                              color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                            };
                          } else if (count >= 500) {
                            pBadge = {
                              label: "⭐ Core Stable (Feature Polish)",
                              color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                            };
                          } else {
                            pBadge = {
                              label: "💡 Growth Potential (Promote)",
                              color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                            };
                          }

                          return (
                            <tr key={toolObj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                              <td className="p-3 text-center font-black">
                                <span
                                  className={`w-6 h-6 rounded-lg text-[11px] font-black inline-flex items-center justify-center ${
                                    idx === 0
                                      ? "bg-amber-500 text-slate-950"
                                      : idx === 1
                                      ? "bg-slate-300 text-slate-900"
                                      : idx === 2
                                      ? "bg-orange-600 text-white"
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                                <div className="flex items-center space-x-2">
                                  <span>{toolObj.name}</span>
                                  {toolObj.badge && (
                                    <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded">
                                      {toolObj.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono font-normal">
                                  {toolObj.id} • {toolObj.outputFormat}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {toolObj.category}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                                {count.toLocaleString()}
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                    <span>{share}%</span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                    <div
                                      style={{ width: `${Math.max(share * 4, 3)}%` }}
                                      className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${pBadge.color}`}
                                >
                                  {pBadge.label}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => trackToolUsage(toolObj.id)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs flex items-center space-x-1 ml-auto"
                                  title="Simulate +1 user execution"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+1 Use</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time Event Pulse Stream Activity Ticker */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Live Execution Activity Stream (Real-Time Visitor Pulse)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Recent PDF tool conversions and AI query stream events
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {realtimePulseEvents.length} Events Logged
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {realtimePulseEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs animate-in fade-in"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{evt.toolName}</p>
                          <p className="text-[10px] text-slate-400">
                            Location: <strong>{evt.location}</strong>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {evt.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. User Management Tab */}
          {effectiveActiveTab === "users" && (
            <div className="space-y-4">
              {/* Sticky Owner Access Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
                <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <strong className="font-extrabold block text-amber-600 dark:text-amber-400">
                    👑 Owner Access Control & Admin Permission Manager (Sticky Policy)
                  </strong>
                  The Admin option is strictly visible ONLY to the Website Owner (Mukesh Kalonia). Customers & regular users cannot see or access the Admin Panel unless the Owner explicitly grants them Admin Access below.
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registered Accounts & RBAC Permissions</h3>
                  <p className="text-[11px] text-slate-400">Grant or revoke Admin access rights for any customer user account.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddUserForm(!showAddUserForm)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition shadow-xs flex items-center space-x-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{showAddUserForm ? "Cancel" : "+ Add New User"}</span>
                  </button>
                  <div className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                    Total: {activeUserList.length} Accounts
                  </div>
                </div>
              </div>

              {/* Add User Inline Form */}
              {showAddUserForm && (
                <form onSubmit={handleAddNewUserInternal} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Register New Account & Assign Permissions</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <select
                      value={newUserPlan}
                      onChange={(e) => setNewUserPlan(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="Free Sun">Free Sun</option>
                      <option value="Student Pro">Student Pro</option>
                      <option value="Team Enterprise">Team Enterprise</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUserGrantAdmin}
                        onChange={(e) => setNewUserGrantAdmin(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Grant Admin Panel Access Right Away</span>
                    </label>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md"
                    >
                      Save Account
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">User Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Plan Tier</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Admin Permission</th>
                      <th className="p-3">Joined</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {activeUserList.map((usr) => {
                      const isOwner = usr.email === "mukeshkalonia241@gmail.com" || usr.plan === "Admin Owner";
                      return (
                        <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold flex items-center space-x-1.5">
                            {isOwner && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                            <span>{usr.name}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{usr.email}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {usr.plan}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                usr.status === "Active"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-600"
                              }`}
                            >
                              {usr.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {isOwner ? (
                              <span className="px-2 py-1 rounded bg-amber-500 text-white font-black text-[10px] uppercase shadow-xs">
                                👑 OWNER (FULL ADMIN)
                              </span>
                            ) : usr.hasAdminAccess ? (
                              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase border border-emerald-500/30">
                                ✅ ADMIN ACCESS GRANTED
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase">
                                🔒 CUSTOMER ONLY
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400">{usr.joined}</td>
                          <td className="p-3 text-right">
                            {!isOwner && (
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => handleToggleAdminPermissionInternal(usr.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                    usr.hasAdminAccess
                                      ? "bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-600 hover:text-white"
                                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                                  }`}
                                >
                                  {usr.hasAdminAccess ? "Revoke Admin" : "Grant Admin"}
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatusInternal(usr.id)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                                >
                                  {usr.status === "Active" ? "Suspend" : "Activate"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. File Management Tab */}
          {effectiveActiveTab === "files" && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Local WebAssembly Storage & Cache Buffer</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    PDFSUN runs 100% in local client browser sandbox memory. No user files are retained on central servers.
                  </p>
                </div>

                <button
                  onClick={handlePurgeMemoryCache}
                  className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-rose-700 transition flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Purge Temp Cache</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. AI Management Tab */}
          {effectiveActiveTab === "ai" && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gemini AI Model Configuration</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Selected Model Alias</label>
                  <select
                    value={localSettings.aiModelVersion}
                    onChange={(e) => setLocalSettings({ ...localSettings, aiModelVersion: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="gemini-3.6-flash">gemini-3.6-flash (Recommended: Lightning Fast Document Analysis)</option>
                    <option value="gemini-3.6-pro">gemini-3.6-pro (Deep Multimodal Document Reasoning)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. Advertisement Management Tab */}
          {effectiveActiveTab === "ads" && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google AdSense Placement Control</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">AdSense Publisher Client ID</label>
                    <input
                      type="text"
                      value={localSettings.adsensePubId}
                      onChange={(e) => setLocalSettings({ ...localSettings, adsensePubId: e.target.value })}
                      className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-6">
                    <input
                      type="checkbox"
                      id="adsToggle"
                      checked={localSettings.adsenseEnabled}
                      onChange={(e) => setLocalSettings({ ...localSettings, adsenseEnabled: e.target.checked })}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <label htmlFor="adsToggle" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Enable Responsive AdSense Placements
                    </label>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-500 space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Ad Placement Rules:</div>
                  <p>• Ads automatically scale to fit Desktop, Tablet, and Mobile screens.</p>
                  <p>• Placements never overlap tool processing dropzones or buttons.</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Website Settings Tab */}
          {effectiveActiveTab === "settings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Site Title</label>
                  <input
                    type="text"
                    value={localSettings.siteName}
                    onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Domain Name</label>
                  <input
                    type="text"
                    value={localSettings.domainName}
                    onChange={(e) => setLocalSettings({ ...localSettings, domainName: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Email</label>
                  <input
                    type="email"
                    value={localSettings.supportEmail}
                    onChange={(e) => setLocalSettings({ ...localSettings, supportEmail: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Owner Name</label>
                  <input
                    type="text"
                    value={localSettings.ownerName}
                    onChange={(e) => setLocalSettings({ ...localSettings, ownerName: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Backup Configuration Section (Emergency Offline Recovery) */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-slate-900/40 border border-blue-500/30 dark:border-indigo-500/30 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/20 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      <DatabaseBackup className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          Backup Configuration (Offline Emergency Recovery)
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase border border-emerald-500/30">
                          PROD READY
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Download an offline JSON snapshot containing all system parameters, secret keys, and rate limits for zero-downtime emergency recovery.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Backup JSON</span>
                    </button>

                    <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 cursor-pointer flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Import Recovery JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackupFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Scope Badges */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase text-slate-400">
                    Included in Offline Backup Snapshot:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono font-bold border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                      <span>🔑 Secret Key (ADMIN_SECRET_KEY)</span>
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono font-bold border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                      <span>⚡ Global Rate Limit (GLOBAL_RATE_LIMIT)</span>
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono font-bold border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                      <span>⏱️ Storage Retention & Thresholds</span>
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono font-bold border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                      <span>🌐 AdSense & Site Info</span>
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono font-bold border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                      <span>👥 User Permissions & RBAC</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO & Sitemap Tab */}
          {effectiveActiveTab === "seo" && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 font-bold">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Dynamic sitemap.xml SEO Engine
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Scans ALL {ALL_TOOLS.length} PDF tools, blog articles, and core routes to optimize Google indexation.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadSitemapFile(localSettings.domainName ? `https://${localSettings.domainName}` : undefined)}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:bg-amber-600 transition flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download sitemap.xml</span>
                  </button>
                </div>

                {/* Sitemap Statistics Grid */}
                {(() => {
                  const sStats = getSitemapStats(localSettings.domainName ? `https://${localSettings.domainName}` : undefined);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Total URLs Scanned</p>
                        <p className="text-lg font-black text-amber-500">{sStats.totalUrls}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase text-slate-400">PDF Tool Pages</p>
                        <p className="text-lg font-black text-blue-500">{sStats.toolUrlsCount}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Blog Tutorials</p>
                        <p className="text-lg font-black text-indigo-500">{sStats.blogUrlsCount}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Core & Legal Routes</p>
                        <p className="text-lg font-black text-emerald-500">{sStats.corePagesCount + sStats.policyPagesCount}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Raw XML Source Preview */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Generated sitemap.xml Preview:
                    </span>
                    <button
                      onClick={() => copySitemapToClipboard(localSettings.domainName ? `https://${localSettings.domainName}` : undefined)}
                      className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy XML</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                    {generateSitemapXml(localSettings.domainName ? `https://${localSettings.domainName}` : undefined)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 7. Reports Tab */}
          {effectiveActiveTab === "reports" && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Usage & Conversion Summary</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit logs for PDF conversions, AI requests, and active user traffic.
                </p>
                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={handleExportBackup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full Audit Report (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 8. System Logs Tab */}
          {effectiveActiveTab === "logs" && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase">
                <span>Real-Time System Log Stream</span>
                <span>{logs.length} Events Recorded</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 space-y-2 border border-slate-800">
                {logs.map((log) => (
                  <div key={log.id} className="flex space-x-2">
                    <span className="text-slate-500">[{log.time}]</span>
                    <span className="text-blue-400 font-bold">[{log.type}]</span>
                    <span>{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Health Tab (Real-Time Recharts Metrics) */}
          {effectiveActiveTab === "health" && (
            <AdminSystemHealth />
          )}

          {/* System Activity Log Tab (Dual-Owner Exclusive) */}
          {effectiveActiveTab === "activity_log" && (
            isPlatformOwner ? (
              <AdminActivityLog currentUserProfile={currentUserProfile} />
            ) : (
              <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
                <div className="p-3 rounded-full bg-rose-500/20 text-rose-500 w-12 h-12 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  Access Denied: Dual-Owner Security Clearance Required
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  The System Activity Log is restricted exclusively to Dual-Owners (Mukesh Kalonia & Mukesh Inland) to safeguard real-time login attempt records, configuration changes, and system exception telemetry.
                </p>
              </div>
            )
          )}

          {/* 9. Backup & Restore Tab */}
          {effectiveActiveTab === "backup" && (
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Export & Restore Platform Configuration</h3>
              <p className="text-xs text-slate-400">Download a full JSON snapshot of your PDFSun admin configuration settings.</p>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Save / Logout Row */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Admin Settings Saved!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {onLogout && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-4 py-2 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center space-x-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Admin</span>
              </button>
            )}

            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Admin Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

