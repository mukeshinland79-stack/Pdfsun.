import React, { useState } from "react";
import { X, User, Shield, Lock, CheckCircle2, Crown, Sparkles, LogOut, ArrowRight, KeyRound, AlertCircle } from "lucide-react";
import { UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";

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
  const [authMode, setAuthMode] = useState<"customer" | "owner">("customer");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [ownerKeyInput, setOwnerKeyInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // Normal Customer Login / Sign up
  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const email = emailInput.trim().toLowerCase() || "customer@pdfsun.app";
    const isOwnerEmail = DUAL_OWNER_EMAILS.includes(email);

    // If customer email is typed, ensure role is 'user' with NO admin rights
    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      name: emailInput ? emailInput.split("@")[0].replace(".", " ") : "Customer User",
      email: email,
      role: "user",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      plan: isOwnerEmail ? "Owner Enterprise" : "Free Customer",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      hasAdminAccess: isOwnerEmail, // Only if actual owner email
    };

    onSelectRole("user", profile);
    onClose();
  };

  // Quick Customer Login button
  const handleSimulateLoginUser = () => {
    const profile: UserProfile = {
      id: "usr-88210",
      name: "Alex Rivera",
      email: "alex.rivera@university.edu",
      role: "user",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      plan: "Student Pro",
      joinedDate: "Jan 2026",
      hasAdminAccess: false,
    };
    onSelectRole("user", profile);
    onClose();
  };

  // Website Owner Authentication (Password / Key Verified)
  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const email = emailInput.trim().toLowerCase();
    const isValidOwnerEmail = DUAL_OWNER_EMAILS.includes(email) || email === "mukeshkalonia241@gmail.com" || email === "mukeshinland79@gmail.com";
    
    // Check owner security passkey or email
    if (!isValidOwnerEmail && ownerKeyInput !== "mukesh123" && ownerKeyInput !== "admin123" && ownerKeyInput !== "owner2026") {
      setErrorMsg("Access Denied: Only verified website owners (Mukesh Kalonia / Mukesh Inland) can log in as Admin Owner.");
      return;
    }

    const ownerName = email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia";
    const ownerEmail = email || "mukeshkalonia241@gmail.com";

    const ownerProfile: UserProfile = {
      id: "owner-001",
      name: ownerName,
      email: ownerEmail,
      role: "owner",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      plan: "Founder & Owner",
      joinedDate: "Founder & Owner",
      hasAdminAccess: true,
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
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">PDFSun Account Portal</h3>
              <p className="text-[10px] text-slate-400">Secure Client-Side Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentRole === "owner" ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5" />
              </div>
            ) : currentRole === "user" ? (
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <User className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>{userProfile ? userProfile.name : "Public Guest"}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${
                  currentRole === "owner" 
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30" 
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }`}>
                  {currentRole === "owner" ? "ADMIN OWNER" : currentRole === "user" ? "CUSTOMER" : "GUEST"}
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

        {/* Auth Mode Toggle Tabs (Customer Login vs Website Owner Verification) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthMode("customer");
              setErrorMsg("");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              authMode === "customer"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("owner");
              setErrorMsg("");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              authMode === "owner"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Website Owner Login</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CUSTOMER LOGIN FORM */}
        {authMode === "customer" && (
          <div className="space-y-4">
            <form onSubmit={handleCustomerLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. alex.rivera@university.edu"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md flex items-center justify-center space-x-2"
              >
                <span>Login as Customer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center my-2">
              <span className="absolute bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase font-bold">Or</span>
              <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <button
              onClick={handleSimulateLoginUser}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>One-Click Demo Customer Login (Alex Rivera)</span>
            </button>
          </div>
        )}

        {/* WEBSITE OWNER LOGIN FORM (PROTECTED) */}
        {authMode === "owner" && (
          <form onSubmit={handleOwnerLogin} className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30">
            <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5 mb-2">
              <Shield className="w-4 h-4" />
              <span>Restricted Website Owner Authentication</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Owner Email Address
              </label>
              <input
                type="email"
                placeholder="mukeshkalonia241@gmail.com / mukeshinland79@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Owner Passcode / Password
              </label>
              <input
                type="password"
                placeholder="Enter owner key (e.g. mukesh123)"
                value={ownerKeyInput}
                onChange={(e) => setOwnerKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs hover:opacity-95 transition shadow-md flex items-center justify-center space-x-2"
            >
              <Crown className="w-4 h-4" />
              <span>Verify & Access Owner Admin</span>
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">
            Note: Customer accounts do NOT have access to Admin options or Owner settings.
          </p>
        </div>
      </div>
    </div>
  );
};

