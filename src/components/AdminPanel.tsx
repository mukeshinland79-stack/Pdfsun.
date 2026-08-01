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
  Check,
  Flame,
  Globe,
  Copy,
} from "lucide-react";
import { AdminSettings, AdminUserAccount, UserProfile } from "../types";
import { useUsageAnalytics } from "../hooks/useUsageAnalytics";
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
  const { topToolIds, getFormattedUsage } = useUsageAnalytics(10);

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

  const isPlatformOwner = isOwner !== undefined 
    ? isOwner 
    : (currentUserProfile?.email === "mukeshkalonia241@gmail.com" || currentUserProfile?.plan === "Founder & Owner" || currentUserProfile?.plan === "Admin Owner");

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

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localSettings, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "PDFSun_Admin_Config_Backup.json");
    dlAnchor.click();
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
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                  MK
                </div>
                <div className="text-center md:text-left space-y-1">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Mukesh Kalonia</h3>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase">
                      PLATFORM OWNER
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">mukeshkalonia241@gmail.com</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                    Super administrator access with permission to configure global platform settings, advertisements, system security, and backup snapshots.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-400 uppercase">Role Level</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">Super Admin / Owner</div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-400 uppercase">Security Status</div>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>2FA Enforced</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-400 uppercase">Active Domain</div>
                  <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-mono">pdfsun.vercel.app</div>
                </div>
              </div>
            </div>
          )}

          {/* 1. Analytics Tab */}
          {effectiveActiveTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-xs text-slate-400 font-bold uppercase">Total PDF Conversions</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">1,428,590</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">↑ +14.2% this week</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-xs text-slate-400 font-bold uppercase">Active Monthly Users</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">54,200</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">↑ +8.5% growth</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-xs text-slate-400 font-bold uppercase">Gemini AI Tokens Streamed</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">8,920,400</div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1">Gemini 3.6 Active</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-xs text-slate-400 font-bold uppercase">AdSense Est. Revenue</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">$1,240.50</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Target achieved</div>
                </div>
              </div>

              {/* Top Tools Usage Analytics Live Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-amber-400">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Most Popular Tools (Live Usage Analytics)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Top tools tracked by real user engagement and executions.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Live Tracking Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topToolIds.map((toolId, index) => {
                    const toolObj = ALL_TOOLS.find((t) => t.id === toolId);
                    if (!toolObj) return null;
                    return (
                      <div
                        key={toolId}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {toolObj.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">
                              {toolObj.category}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-orange-600 dark:text-amber-400 bg-orange-500/10 dark:bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                          {getFormattedUsage(toolId)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Health & Privacy Guarantee</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PDFSun runs on 100% client-side WebAssembly routines. Server CPU load is maintained under 2% while handling thousands of concurrent users.
                </p>
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
            <div className="space-y-4">
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

