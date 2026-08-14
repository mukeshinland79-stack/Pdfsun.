import React, { useState } from "react";
import {
  Crown,
  Edit3,
  Globe,
  BarChart3,
  DollarSign,
  Users,
  Eye,
  Sparkles,
  ShieldCheck,
  Zap,
  Sliders,
  LogOut,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { UserProfile, DUAL_OWNER_EMAILS } from "../types";

interface OwnerTopBarProps {
  userProfile?: UserProfile | null;
  canAccessAdmin: boolean;
  onOpenAdmin: (tab?: string) => void;
  onOpenCms: () => void;
  onToggleVisitorPreview?: (isVisitorPreview: boolean) => void;
  isVisitorPreview?: boolean;
}

export const OwnerTopBar: React.FC<OwnerTopBarProps> = ({
  userProfile,
  canAccessAdmin,
  onOpenAdmin,
  onOpenCms,
  onToggleVisitorPreview,
  isVisitorPreview = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Strictly verify owner authority
  const isOwnerUser =
    canAccessAdmin ||
    userProfile?.role === "owner" ||
    (userProfile?.email &&
      (DUAL_OWNER_EMAILS.includes(userProfile.email.toLowerCase()) ||
        userProfile.email.toLowerCase() === "mukeshinland79@gmail.com" ||
        userProfile.email.toLowerCase() === "mukeshkalonia241@gmail.com"));

  if (!isOwnerUser) {
    return null;
  }

  // If visitor preview mode is activated by the owner, show a sleek floating restore pill
  if (isVisitorPreview) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <button
          onClick={() => onToggleVisitorPreview && onToggleVisitorPreview(false)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-2xl shadow-amber-500/50 border-2 border-amber-300 transition-transform active:scale-95"
          title="Exit visitor mode and restore owner control bar"
        >
          <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
          <span>Exit Visitor Mode (Restore Owner Bar)</span>
        </button>
      </div>
    );
  }

  const ownerDisplayName = userProfile?.name || "Mukesh Kalonia";
  const ownerEmail = userProfile?.email || "mukeshinland79@gmail.com";

  return (
    <aside aria-label="Owner Control Bar" className="relative z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white border-b border-amber-500/40 shadow-lg text-xs">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left Side: Owner Identity & Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black shadow-inner">
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-[11px] tracking-wide">
              OWNER MODE: <span className="text-white font-extrabold">{ownerDisplayName}</span>
            </span>
          </div>

          <span className="hidden md:inline-flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{ownerEmail}</span>
          </span>
        </div>

        {/* Center & Right: Quick Owner Actions */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Live CMS / Text Editor */}
          <button
            onClick={onOpenCms}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            title="Edit any text, FAQs, and translations live on the website"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Live Site CMS</span>
          </button>

          {/* Quick Admin Dashboard */}
          <button
            onClick={() => onOpenAdmin("analytics")}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-bold"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Admin Dashboard</span>
            <span className="sm:hidden">Admin</span>
          </button>

          {/* Pricing & Revenue */}
          <button
            onClick={() => onOpenAdmin("finance")}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-bold"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Pricing & Finance</span>
            <span className="sm:hidden">Finance</span>
          </button>

          {/* Multi-Language i18n CMS */}
          <button
            onClick={() => onOpenAdmin("cms")}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-bold"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Translations CMS</span>
            <span className="sm:hidden">i18n</span>
          </button>

          {/* User Management */}
          <button
            onClick={() => onOpenAdmin("users")}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-bold"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Users & RBAC</span>
            <span className="sm:hidden">Users</span>
          </button>

          {/* Visitor Mode Preview Switch */}
          {onToggleVisitorPreview && (
            <button
              onClick={() => onToggleVisitorPreview(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition text-xs font-semibold"
              title="Preview website as a normal visitor without admin badges"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Preview as Visitor</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
