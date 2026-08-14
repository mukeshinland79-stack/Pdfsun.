import React, { useState } from "react";
import {
  X,
  User,
  Shield,
  Lock,
  CheckCircle2,
  Crown,
  Sparkles,
  LogOut,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Loader2,
  Mail,
  UserCheck,
  Eye,
  EyeOff,
} from "lucide-react";
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
  const [customerSubMode, setCustomerSubMode] = useState<"signin" | "signup">("signin");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [ownerKeyInput, setOwnerKeyInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isTimeoutReason =
    typeof window !== "undefined" &&
    localStorage.getItem("pdfsun_logout_reason") === "inactivity_timeout";

  const handlePostLoginRedirectAndCleanup = () => {
    try {
      localStorage.removeItem("pdfsun_logout_reason");
      const redirectUrl = localStorage.getItem("pdfsun_redirect_url");
      if (redirectUrl && redirectUrl !== window.location.href) {
        localStorage.removeItem("pdfsun_redirect_url");
        window.location.href = redirectUrl;
      }
    } catch (e) {
      console.warn("Post-login cleanup error:", e);
    }
  };

  if (!isOpen) return null;

  // Real Backend Customer Login / Sign up
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!passwordInput) {
      setErrorMsg("Please enter a password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = customerSubMode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        customerSubMode === "signup"
          ? { name: nameInput.trim(), email, password: passwordInput }
          : { email, password: passwordInput };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please check your credentials.");
      }

      if (data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const isOwnerEmail = DUAL_OWNER_EMAILS.includes(email);
      const profile: UserProfile = data.user || {
        id: `usr-${Date.now()}`,
        name: data.user?.name || (nameInput ? nameInput.trim() : email.split("@")[0].replace(/[._]/g, " ")),
        email: email,
        role: "user",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        plan: isOwnerEmail ? "Owner Enterprise" : "Free Customer",
        joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        hasAdminAccess: isOwnerEmail,
        isPro: Boolean(data.user?.isPro),
      };

      setSuccessMsg(customerSubMode === "signup" ? "Account created successfully!" : "Signed in successfully!");
      
      setTimeout(() => {
        onSelectRole(profile.role || "user", profile);
        handlePostLoginRedirectAndCleanup();
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Customer Demo Login button
  const handleSimulateLoginUser = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "alex.rivera@university.edu",
          password: "demo123",
        }),
      });

      const data = await res.json();
      if (data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const profile: UserProfile = data.user || {
        id: "usr-88210",
        name: "Alex Rivera",
        email: "alex.rivera@university.edu",
        role: "user",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        plan: "Student Pro",
        joinedDate: "Jan 2026",
        hasAdminAccess: false,
        isPro: true,
      };

      setSuccessMsg("Logged in as Demo Customer (Alex Rivera)!");
      setTimeout(() => {
        onSelectRole("user", profile);
        handlePostLoginRedirectAndCleanup();
        onClose();
      }, 300);
    } catch (err: any) {
      setErrorMsg(err.message || "Demo login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Website Owner Authentication (Password / Key Verified via Server)
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const email = emailInput.trim().toLowerCase();
    const isValidOwnerEmail =
      DUAL_OWNER_EMAILS.includes(email) ||
      email === "mukeshkalonia241@gmail.com" ||
      email === "mukeshinland79@gmail.com";

    if (!isValidOwnerEmail && ownerKeyInput !== "mukesh123" && ownerKeyInput !== "admin123" && ownerKeyInput !== "owner2026" && ownerKeyInput !== "12345") {
      setErrorMsg("Access Denied: Only verified platform owners (Mukesh Kalonia / Mukesh Inland) can log in as Admin Owner.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || "mukeshkalonia241@gmail.com",
          secretKey: ownerKeyInput || "12345",
        }),
      });

      const data = await res.json();

      if (!res.ok || (!data.token && !data.success && data.status !== "ok")) {
        throw new Error(data.error || data.message || "Owner access denied. Invalid key or credentials.");
      }

      if (data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const ownerName = email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia";
      const ownerEmail = email || "mukeshkalonia241@gmail.com";

      const ownerProfile: UserProfile = data.user || {
        id: "owner-001",
        name: ownerName,
        email: ownerEmail,
        role: "owner",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        plan: "Founder & Owner",
        joinedDate: "Founder & Owner",
        hasAdminAccess: true,
        isPro: true,
      };

      setSuccessMsg("Owner authentication verified! Accessing Admin Suite...");
      setTimeout(() => {
        onSelectRole("owner", ownerProfile);
        handlePostLoginRedirectAndCleanup();
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate owner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("pdfsun_auth_token");
    onSelectRole("public", null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">PDFSun Account Portal</h3>
              <p className="text-[10px] text-slate-400 font-medium">Enterprise Role-Based Authentication & Session Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close auth modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inactivity Logout Alert Banner */}
        {isTimeoutReason && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-start space-x-3 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Inactivity Auto-Logout Executed</span>
              <span className="text-[11px] text-amber-600/90 dark:text-amber-300/80">
                You were logged out after 10 minutes of idle time. Please log in to restore your session.
              </span>
            </div>
          </div>
        )}

        {/* Current Active Account Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentRole === "owner" ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5" />
              </div>
            ) : currentRole === "user" ? (
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md">
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
                <span
                  className={`text-[9px] px-2 py-0.5 rounded uppercase font-black ${
                    currentRole === "owner"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : currentRole === "user"
                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      : "bg-slate-500/10 text-slate-500"
                  }`}
                >
                  {currentRole === "owner" ? "SUPER ADMIN / OWNER" : currentRole === "user" ? "REGISTERED CUSTOMER" : "GUEST"}
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
              setSuccessMsg("");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              authMode === "customer"
                ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("owner");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              authMode === "owner"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Owner Login</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CUSTOMER LOGIN & SIGNUP FORM */}
        {authMode === "customer" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSubMode("signin");
                    setErrorMsg("");
                  }}
                  className={`text-xs font-bold transition pb-1 border-b-2 ${
                    customerSubMode === "signin"
                      ? "border-orange-500 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSubMode("signup");
                    setErrorMsg("");
                  }}
                  className={`text-xs font-bold transition pb-1 border-b-2 ${
                    customerSubMode === "signup"
                      ? "border-orange-500 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  Create Account
                </button>
              </div>
              <span className="text-[10px] text-slate-400">Instant PDF Access</span>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              {customerSubMode === "signup" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. alex.rivera@university.edu"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-md shadow-orange-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>{customerSubMode === "signup" ? "Create Free Account" : "Sign In to Account"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-2">
              <span className="absolute bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase font-bold">Or</span>
              <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <button
              onClick={handleSimulateLoginUser}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>One-Click Fast Demo Login (Alex Rivera)</span>
            </button>
          </div>
        )}

        {/* WEBSITE OWNER LOGIN FORM (PROTECTED) */}
        {authMode === "owner" && (
          <form onSubmit={handleOwnerLogin} className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30">
            <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5 mb-2">
              <Shield className="w-4 h-4" />
              <span>Strict Website Owner & Super Admin Authentication</span>
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
                Owner Passcode / Secret Key
              </label>
              <input
                type="password"
                placeholder="Enter owner passkey (e.g. mukesh123 or 12345)"
                value={ownerKeyInput}
                onChange={(e) => setOwnerKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs hover:opacity-95 transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Owner Credentials...</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span>Verify & Access Owner Suite</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Strict Role Boundary: Guest & Customer accounts do NOT have access to Admin options or Owner settings.
          </p>
        </div>
      </div>
    </div>
  );
};
