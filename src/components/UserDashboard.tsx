import React, { useState } from "react";
import { UserProfile, ToolHistoryItem, ToolItem, DUAL_OWNER_EMAILS } from "../types";
import { PaymentHistory } from "./PaymentHistory";
import {
  User,
  Crown,
  Sparkles,
  Star,
  Clock,
  Download,
  X,
  FileText,
  Shield,
  ArrowUpRight,
  HardDrive,
  Settings,
  CheckCircle,
  Receipt,
  LayoutDashboard,
  Calendar,
  Zap,
  KeyRound,
  Edit3,
  Mail,
  Smartphone,
  ShieldCheck,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { safeFetchJson } from "../utils/apiHelper";

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  favorites: string[];
  history: ToolHistoryItem[];
  allTools: ToolItem[];
  onSelectTool: (tool: ToolItem) => void;
  onOpenAdminPanel?: () => void;
  onOpenPricing?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  isOpen,
  onClose,
  userProfile,
  favorites,
  history,
  allTools,
  onSelectTool,
  onOpenAdminPanel,
  onOpenPricing,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "files" | "plan" | "overview">("profile");
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(userProfile.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  if (!isOpen) return null;

  const favoriteTools = allTools.filter((t) => favorites.includes(t.id));
  const isOwner = userProfile.role === "owner" || DUAL_OWNER_EMAILS.includes((userProfile.email || "").toLowerCase().trim());
  const isSsoUser =
    Boolean(userProfile.isSsoManaged) ||
    userProfile.plan?.toLowerCase().includes("enterprise") ||
    userProfile.plan?.toLowerCase().includes("sso") ||
    userProfile.plan?.toLowerCase().includes("saml") ||
    Boolean(userProfile.ssoDomain) ||
    Boolean(userProfile.ssoProvider) ||
    Boolean(userProfile.organizationName);
  const isPaidUser = userProfile.plan?.toLowerCase().includes("pro") || userProfile.plan?.toLowerCase().includes("annual") || isSsoUser || isOwner;

  // Calculate renewal / expiry info
  const planExpiryText = isOwner
    ? "Lifetime Super Admin Active (No Expiry)"
    : isSsoUser
    ? "Enterprise SSO Active (Managed by Organization IT)"
    : isPaidUser
    ? "Active for 30 Days (Auto-Renewable via Razorpay)"
    : "Free Tier Active (No Expiry)";

  const handleUpdateName = async () => {
    if (!nameVal.trim()) return;
    setSavingProfile(true);
    setProfileMsg("");
    try {
      await safeFetchJson("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userProfile.email,
          updates: { name: nameVal.trim() },
        }),
      });
      userProfile.name = nameVal.trim();
      setEditingName(false);
      setProfileMsg("Profile name updated successfully!");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch {
      userProfile.name = nameVal.trim();
      setEditingName(false);
      setProfileMsg("Profile updated locally.");
      setTimeout(() => setProfileMsg(""), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden my-auto">
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <img
              src={userProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
              alt={userProfile.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover ring-2 ring-orange-500/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-[240px]">
                  {userProfile.name}
                </h2>
                <span
                  className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                    isOwner
                      ? "bg-amber-500 text-slate-950"
                      : isSsoUser
                      ? "bg-blue-600 text-white"
                      : isPaidUser
                      ? "bg-orange-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {isOwner ? "SUPER ADMIN / OWNER" : userProfile.plan || "FREE PLAN"}
                </span>

                {isSsoUser && (
                  <span
                    id="user-dashboard-sso-managed-badge"
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-blue-600/10 dark:from-blue-500/25 dark:via-indigo-500/25 dark:to-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-400/40 shadow-xs shrink-0 select-none transition-all hover:border-blue-500/50"
                    title={`SSO Managed: Authenticated via Enterprise Identity Provider ${userProfile.organizationName ? `(${userProfile.organizationName})` : userProfile.ssoProvider ? `(${userProfile.ssoProvider.toUpperCase()})` : ""}`}
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                    <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>SSO Managed</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userProfile.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            {onOpenAdminPanel && (isOwner || userProfile.hasAdminAccess) && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md hover:opacity-90 transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Admin Suite</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs - All 3 Required Core Tabs Fully Unlocked */}
        <div className="px-4 sm:px-6 pt-2 sm:pt-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs font-extrabold overflow-x-auto">
          {/* Tab 1: Profile */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-t-xl sm:rounded-t-2xl border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User className="w-4 h-4 text-orange-500" />
            <span>1. Profile &amp; Account</span>
          </button>

          {/* Tab 2: Recent Files */}
          <button
            onClick={() => setActiveTab("files")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-t-xl sm:rounded-t-2xl border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "files"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4 text-blue-500" />
            <span>2. Recent Files ({history.length})</span>
          </button>

          {/* Tab 3: Plan Details */}
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-t-xl sm:rounded-t-2xl border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "plan"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>3. Plan Details &amp; Invoices</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Tab 4: Overview & Tools */}
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-t-xl sm:rounded-t-2xl border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-purple-500" />
            <span>Overview &amp; Tools</span>
          </button>
        </div>

        {/* Dashboard Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          {profileMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4" />
              <span>{profileMsg}</span>
            </div>
          )}

          {/* TAB 1: PROFILE & ACCOUNT (UNLOCKED) */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <User className="w-4 h-4 text-orange-500" />
                    <span>Personal Profile &amp; Identity</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    Active &amp; Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Name field */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Full Name</span>
                      {!editingName && (
                        <button
                          onClick={() => setEditingName(true)}
                          className="text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    {editingName ? (
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="text"
                          value={nameVal}
                          onChange={(e) => setNameVal(e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent flex-1"
                        />
                        <button
                          onClick={handleUpdateName}
                          disabled={savingProfile}
                          className="px-2.5 py-1 bg-orange-600 text-white rounded-lg font-bold text-[11px] hover:bg-orange-500 cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setNameVal(userProfile.name);
                            setEditingName(false);
                          }}
                          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{userProfile.name}</div>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>Registered Email</span>
                    </div>
                    <div className="font-mono text-slate-900 dark:text-white text-xs truncate">
                      {isOwner && userProfile.email
                        ? userProfile.email.replace(/^(.{4})(.*)(.@.*)$/, "$1*********$3")
                        : userProfile.email}
                    </div>
                  </div>

                  {/* Account Role */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Role</div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      {isOwner ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                      <span className="uppercase">{isOwner ? "Owner (Super Admin)" : userProfile.role || "User"}</span>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Member Since</div>
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {userProfile.joinedDate || "Jan 2026"}
                    </div>
                  </div>

                  {/* Authentication & SSO Status */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 sm:col-span-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Authentication Method</span>
                      {isSsoUser && (
                        <span
                          id="sso-managed-profile-pill"
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-blue-600/10 dark:from-blue-500/25 dark:via-indigo-500/25 dark:to-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-400/40 shadow-xs select-none"
                        >
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                          </span>
                          <ShieldCheck className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>SSO Managed</span>
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-xs">
                      {isSsoUser ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>
                            {userProfile.organizationName
                              ? `${userProfile.organizationName} Corporate IdP`
                              : userProfile.ssoProvider
                              ? `${userProfile.ssoProvider.toUpperCase()} Single Sign-On`
                              : "Enterprise SAML 2.0 / OIDC Identity Provider"}
                          </span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Direct Email &amp; Password Access</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enterprise Governance / Security notice */}
              {isSsoUser ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Enterprise Identity Governance</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Authentication, user lifecycle, and role assignments are centrally managed by your organization's IT department.
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-xs shrink-0 select-none transition">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    <ShieldCheck className="w-3 h-3 text-blue-100" />
                    <span>SSO Managed</span>
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Account Security &amp; Password Recovery</span>
                      <span className="text-[11px] text-slate-500">Need to reset your password? Use the OTP verification flow anytime.</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Password &amp; Security
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECENT FILES (UNLOCKED) */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Processed PDF Files</h3>
                  <p className="text-xs text-slate-400">Processed locally inside your web browser sandbox</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  {history.length} {history.length === 1 ? "File" : "Files"}
                </span>
              </div>

              {history.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-400">No PDF files processed in this session yet.</div>
                  <button
                    onClick={() => {
                      if (allTools.length > 0) {
                        onClose();
                        onSelectTool(allTools[0]);
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Open PDF Tool
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                  {history.map((item) => (
                    <div key={item.id} className="p-3.5 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{item.fileName}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.toolName} • {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>{item.status || "Completed"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PLAN DETAILS & INVOICES (UNLOCKED) */}
          {activeTab === "plan" && (
            <div className="space-y-5">
              {/* Active Plan Card */}
              <div className="p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 border border-orange-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Plan Active &amp; Unlocked</span>
                    </div>
                    {isSsoUser && (
                      <div
                        id="sso-managed-plan-pill"
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500/25 via-indigo-500/25 to-blue-600/20 text-blue-200 border border-blue-400/40 text-[10px] sm:text-xs font-black uppercase tracking-wider select-none shadow-xs"
                      >
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
                        </span>
                        <ShieldCheck className="w-3 h-3 text-blue-300 shrink-0" />
                        <span>SSO Managed Workspace</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                    <span>{isOwner ? "👑 Platform Owner Full Access" : isPaidUser ? `⭐ ${userProfile.plan || "Pro Sun"} Active` : "Free Tier (Standard Tools)"}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>Expiry Date:</strong> {planExpiryText}</span>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-400 font-semibold">57+ PDF Utilities Enabled</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
                  {onOpenPricing && !isOwner && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPricing();
                      }}
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider hover:opacity-95 transition shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isPaidUser ? "Change Plan" : "Upgrade to Pro"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Payment History & Razorpay Receipts Table */}
              <div className="pt-2">
                <PaymentHistory userProfile={userProfile} onOpenPricing={onOpenPricing} />
              </div>
            </div>
          )}

          {/* TAB 4: OVERVIEW & TOOLS */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">{history.length}</div>
                    <div className="text-[11px] text-slate-400 font-medium">Processed PDFs</div>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">{favorites.length}</div>
                    <div className="text-[11px] text-slate-400 font-medium">Favorite Tools</div>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">100% Local</div>
                    <div className="text-[11px] text-slate-400 font-medium">Client-Side Memory</div>
                  </div>
                </div>
              </div>

              {/* Favorite Quick Tools */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Your Favorite Tools ({favoriteTools.length})</span>
                </h3>

                {favoriteTools.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    You haven't starred any favorite tools yet. Click the star icon on any tool card!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {favoriteTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          onClose();
                          onSelectTool(tool);
                        }}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-500 transition text-left flex items-center justify-between group cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-500 truncate">
                            {tool.name}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{tool.description}</div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
