import React from "react";
import {
  Crown,
  Edit3,
  Globe,
  BarChart3,
  DollarSign,
  Users,
  Eye,
  X,
  Sliders,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { UserProfile, DUAL_OWNER_EMAILS } from "../types";
import { checkAdminRole } from "../hooks/useAuth";

interface OwnerTopBarProps {
  userProfile?: UserProfile | null;
  canAccessAdmin: boolean;
  adminEditModeActive: boolean;
  onCloseEditMode: () => void;
  onOpenAdmin: (tab?: string) => void;
  onOpenCms: () => void;
  onToggleVisitorPreview?: (isVisitorPreview: boolean) => void;
  isVisitorPreview?: boolean;
}

/**
 * Protected Admin / Owner Control Bar
 * Strictly rendered ONLY when:
 * 1. User is authenticated with verified Admin/Owner role (RBAC)
 * 2. Explicit Admin / Edit Mode toggle is activated by the Owner
 * 3. Never renders in public view or regular customer sessions
 */
export const OwnerTopBar: React.FC<OwnerTopBarProps> = ({
  userProfile,
  canAccessAdmin,
  adminEditModeActive,
  onCloseEditMode,
  onOpenAdmin,
  onOpenCms,
  onToggleVisitorPreview,
  isVisitorPreview = false,
}) => {
  // Strict Server & Role Verification
  const isAuthorizedAdmin = canAccessAdmin && checkAdminRole(userProfile || null);

  // If unauthorized OR admin edit mode is inactive, do not render anything
  if (!isAuthorizedAdmin || !adminEditModeActive) {
    return null;
  }

  // If visitor preview mode is activated by the owner, show a sleek floating restore pill
  if (isVisitorPreview) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in">
        <button
          onClick={() => onToggleVisitorPreview && onToggleVisitorPreview(false)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-2xl shadow-amber-500/50 border-2 border-amber-300 transition-transform active:scale-95 cursor-pointer"
          title="Exit visitor mode and restore owner control bar"
        >
          <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
          <span>Exit Visitor Mode</span>
        </button>
      </div>
    );
  }

  const ownerDisplayName = userProfile?.name || "Platform Owner";

  return (
    <aside
      aria-label="Protected Owner Control Bar"
      className="relative z-50 bg-slate-950 text-white border-b border-amber-500/30 shadow-md text-xs transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: Owner Mode Status Indicator (No sensitive raw emails) */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[11px] tracking-wide">
              ADMIN CONTROL VIEW: <span className="text-white font-bold">{ownerDisplayName}</span>
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Session</span>
          </span>
        </div>

        {/* Center & Right: Administrative Quick Actions */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Live CMS Editor */}
          <button
            onClick={onOpenCms}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-xs cursor-pointer"
            title="Edit any text, FAQs, and translations live on the website"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Live Site CMS</span>
          </button>

          {/* Quick Admin Analytics */}
          <button
            onClick={() => onOpenAdmin("analytics")}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-bold"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          {/* Pricing & Revenue */}
          <button
            onClick={() => onOpenAdmin("finance")}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-bold"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Finance</span>
          </button>

          {/* User & RBAC Management */}
          <button
            onClick={() => onOpenAdmin("users")}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-bold"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Users & RBAC</span>
          </button>

          {/* All Admin Settings */}
          <button
            onClick={() => onOpenAdmin("settings")}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-bold"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Visitor Preview Switch */}
          {onToggleVisitorPreview && (
            <button
              onClick={() => onToggleVisitorPreview(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition text-xs font-semibold"
              title="Preview website as a normal visitor"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Visitor View</span>
            </button>
          )}

          {/* Close / Hide Admin Bar Button */}
          <button
            onClick={onCloseEditMode}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            title="Hide Admin Control Bar (Can be re-opened from your Profile menu)"
            aria-label="Hide admin control bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
