import React, { useState } from "react";
import { X, User, Shield, Lock, CheckCircle2, Crown, Sparkles, LogOut, ArrowRight } from "lucide-react";
import { UserRole, UserProfile } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  userProfile: UserProfile | null;
  onSelectRole: (role: UserRole, profile: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  userProfile,
  onSelectRole,
}) => {
  const [activeTab, setActiveTab] = useState<"switch" | "login">("switch");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  if (!isOpen) return null;

  const handleSimulateLoginUser = () => {
    const profile: UserProfile = {
      id: "usr-88210",
      name: "Alex Rivera",
      email: "alex.rivera@university.edu",
      role: "user",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      plan: "Student Pro",
      joinedDate: "Jan 2026",
    };
    onSelectRole("user", profile);
    onClose();
  };

  const handleSimulateLoginOwner = () => {
    const ownerProfile: UserProfile = {
      id: "owner-001",
      name: "Mukesh Kalonia",
      email: "mukeshkalonia241@gmail.com",
      role: "owner",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      plan: "Team Enterprise",
      joinedDate: "Founder & Owner",
    };
    onSelectRole("owner", ownerProfile);
    onClose();
  };

  const handleLogout = () => {
    onSelectRole("public", null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">PDFSun Access & User Roles</h3>
              <p className="text-[10px] text-slate-400">PDFSUN.COM Authentication Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentRole === "owner" ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5" />
              </div>
            ) : currentRole === "user" ? (
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md">
                <User className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>{userProfile ? userProfile.name : "Public Guest Visitor"}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black bg-orange-500/10 text-orange-600 dark:text-amber-400">
                  {currentRole.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {userProfile ? userProfile.email : "Browsing standard PDF tools"}
              </div>
            </div>
          </div>

          {currentRole !== "public" && (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>

        {/* One-Click Role Switch Options */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Role
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Public Visitor */}
            <button
              onClick={() => {
                onSelectRole("public", null);
                onClose();
              }}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                currentRole === "public"
                  ? "border-orange-500 bg-orange-500/5 dark:bg-slate-800 ring-2 ring-orange-500/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Public Visitor</div>
                  <div className="text-[10px] text-slate-400">Access Home, 50+ Tools, AI Tools, Pricing, Blog & Support</div>
                </div>
              </div>
              {currentRole === "public" && <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />}
            </button>

            {/* Logged-In User */}
            <button
              onClick={handleSimulateLoginUser}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                currentRole === "user"
                  ? "border-blue-500 bg-blue-500/5 dark:bg-slate-800 ring-2 ring-blue-500/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Logged-in Normal User (Alex Rivera)</div>
                  <div className="text-[10px] text-slate-400">Unlocks User Profile, Dashboard, Saved Favorites, History & Settings</div>
                </div>
              </div>
              {currentRole === "user" && <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />}
            </button>

            {/* Owner (Mukesh Kalonia) */}
            <button
              onClick={handleSimulateLoginOwner}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                currentRole === "owner"
                  ? "border-amber-500 bg-amber-500/5 dark:bg-slate-800 ring-2 ring-amber-500/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                    <span>Platform Owner (Mukesh Kalonia)</span>
                    <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1 rounded">ADMIN</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Full Admin Panel, Analytics, User & File Management, AI & Ads Controls</div>
                </div>
              </div>
              {currentRole === "owner" && <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />}
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Role switching updates navigation options instantly across PDFSUN.COM.
          </p>
        </div>
      </div>
    </div>
  );
};
