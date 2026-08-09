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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"overview" | "payments">("overview");

  if (!isOpen) return null;

  const favoriteTools = allTools.filter((t) => favorites.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-600/30 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{userProfile.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500 text-slate-950 uppercase">
                  {userProfile.plan}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{userProfile.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onOpenAdminPanel && (userProfile.role === "owner" || DUAL_OWNER_EMAILS.includes((userProfile.email || "").toLowerCase().trim()) || userProfile.hasAdminAccess) && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md hover:bg-blue-700 transition"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-t-2xl border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "overview"
                ? "border-amber-500 text-amber-500 bg-white dark:bg-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview &amp; Tools</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2.5 rounded-t-2xl border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === "payments"
                ? "border-amber-500 text-amber-500 bg-white dark:bg-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Payment History &amp; Subscriptions</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === "payments" ? (
            <PaymentHistory userProfile={userProfile} onOpenPricing={onOpenPricing} />
          ) : (
            <>
              {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">{history.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Processed PDFs</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">{favorites.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Favorite Tools</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">100% Client</div>
                <div className="text-[11px] text-slate-400 font-medium">Local Browser Memory</div>
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
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-500 transition text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-500">
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

          {/* Processing Log */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Recent PDF Activity Log</span>
            </h3>

            {history.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 bg-white dark:bg-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{item.fileName}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.toolName} • {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{item.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
</div>
  );
};
