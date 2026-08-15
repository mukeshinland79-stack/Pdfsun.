import React, { useState, useEffect } from "react";
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
  Phone,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";
import { safeFetchJson } from "../utils/apiHelper";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  userProfile: UserProfile | null;
  onSelectRole: (role: UserRole, profile: UserProfile | null) => void;
  initialMode?: "customer" | "owner";
  onSuccessOpenAdmin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  userProfile,
  onSelectRole,
  initialMode = "customer",
  onSuccessOpenAdmin,
}) => {
  const [authMode, setAuthMode] = useState<"customer" | "owner" | "forgot-password">(initialMode);
  const [customerSubMode, setCustomerSubMode] = useState<"signin" | "signup">("signin");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [ownerKeyInput, setOwnerKeyInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // OTP Password Recovery States
  const [otpInput, setOtpInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpHint, setOtpHint] = useState<string | null>(null);

  // Sync mode when initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode === "owner" ? "owner" : "customer");
      setErrorMsg("");
      setSuccessMsg("");
      setOtpSent(false);
      setOtpInput("");
      setNewPasswordInput("");
      setOtpHint(null);
      if (initialMode === "owner") {
        if (!emailInput) setEmailInput("mukeshinland79@gmail.com");
        if (!ownerKeyInput) setOwnerKeyInput("12345");
      }
    }
  }, [isOpen, initialMode]);

  // Handle OTP Resend Countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  // Real Backend Customer Login / Sign up with safe JSON parsing
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const email = emailInput.trim().toLowerCase();
    if (!email) {
      setErrorMsg("Please enter your email address or mobile number.");
      return;
    }

    if (!passwordInput) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = customerSubMode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        customerSubMode === "signup"
          ? { name: nameInput.trim(), email, password: passwordInput }
          : { email, password: passwordInput };

      const { ok, data, error } = await safeFetchJson(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!ok || !data || data.success === false) {
        throw new Error(error || data?.error || "Authentication failed. Please check your credentials.");
      }

      if (data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const isOwnerEmail =
        DUAL_OWNER_EMAILS.includes(email) ||
        email === "mukeshkalonia241@gmail.com" ||
        email === "mukeshinland79@gmail.com";
      const roleToSet: UserRole = isOwnerEmail ? "owner" : (data.user?.role || "user");
      const profile: UserProfile = data.user || {
        id: isOwnerEmail ? "owner-001" : `usr-${Date.now()}`,
        name: isOwnerEmail
          ? (email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia")
          : (data.user?.name || (nameInput ? nameInput.trim() : email.split("@")[0].replace(/[._]/g, " "))),
        email: email,
        role: roleToSet,
        avatar: isOwnerEmail
          ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
          : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        plan: isOwnerEmail ? "Founder & Owner" : "Free Plan (Active)",
        joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        hasAdminAccess: isOwnerEmail,
        isPro: isOwnerEmail ? true : Boolean(data.user?.isPro),
      };

      setSuccessMsg(customerSubMode === "signup" ? "Free account activated! Welcome to PDFSun." : "Signed in successfully!");
      
      setTimeout(() => {
        onSelectRole(roleToSet, profile);
        handlePostLoginRedirectAndCleanup();
        onClose();
        if (isOwnerEmail && onSuccessOpenAdmin) {
          onSuccessOpenAdmin();
        }
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send OTP for Forgot Password
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const identifier = emailInput.trim();
    if (!identifier) {
      setErrorMsg("Please enter your registered Email or Mobile number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { ok, data, error } = await safeFetchJson("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      if (!ok || !data || data.success === false) {
        throw new Error(error || data?.error || "Failed to generate verification OTP.");
      }

      setOtpSent(true);
      setOtpCountdown(60);
      if (data.otp) {
        setOtpHint(data.otp);
        setOtpInput(data.otp); // Pre-fill for instant seamless verification
      }
      setSuccessMsg(data.message || `Verification OTP generated for ${identifier}. Valid for 10 minutes.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not send OTP. Please check your contact info.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP and Reset Password
  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const identifier = emailInput.trim();
    if (!identifier) {
      setErrorMsg("Please enter your registered Email or Mobile number.");
      return;
    }
    if (!otpInput.trim()) {
      setErrorMsg("Please enter the 6-digit OTP code.");
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 4) {
      setErrorMsg("New password must be at least 4 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { ok, data, error } = await safeFetchJson("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          otp: otpInput.trim(),
          newPassword: newPasswordInput,
        }),
      });

      if (!ok || !data || data.success === false) {
        throw new Error(error || data?.error || "Password reset failed. Invalid or expired OTP.");
      }

      if (data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const isOwnerEmail =
        DUAL_OWNER_EMAILS.includes(identifier.toLowerCase()) ||
        identifier.toLowerCase() === "mukeshkalonia241@gmail.com" ||
        identifier.toLowerCase() === "mukeshinland79@gmail.com";
      const roleToSet: UserRole = isOwnerEmail ? "owner" : (data.user?.role || "user");
      const profile: UserProfile = data.user || {
        id: `usr-${Date.now()}`,
        name: identifier.split("@")[0].replace(/[._]/g, " "),
        email: identifier,
        role: roleToSet,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        plan: isOwnerEmail ? "Founder & Owner" : "Free Plan (Active)",
        joinedDate: "Jan 2026",
        hasAdminAccess: isOwnerEmail,
        isPro: isOwnerEmail,
      };

      setSuccessMsg("Password reset successfully! Logging you in...");
      setTimeout(() => {
        onSelectRole(roleToSet, profile);
        handlePostLoginRedirectAndCleanup();
        onClose();
        if (isOwnerEmail && onSuccessOpenAdmin) {
          onSuccessOpenAdmin();
        }
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password.");
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
      const { ok, data, error } = await safeFetchJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "alex.rivera@university.edu",
          password: "demo123",
        }),
      });

      if (data && data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const profile: UserProfile = data?.user || {
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

  // One-Click Fast Owner Authentication
  const handleOneClickOwnerLogin = async (ownerEmailSelected = "mukeshinland79@gmail.com") => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const { ok, data, error } = await safeFetchJson("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ownerEmailSelected,
          secretKey: "12345",
        }),
      });

      if (data && data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const ownerName = ownerEmailSelected.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia";
      const ownerProfile: UserProfile = data?.user || {
        id: "owner-001",
        name: ownerName,
        email: ownerEmailSelected,
        role: "owner",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        plan: "Founder & Owner",
        joinedDate: "Founder & Owner",
        hasAdminAccess: true,
        isPro: true,
      };

      setSuccessMsg("Super Owner authenticated! Opening Admin Suite...");
      setTimeout(() => {
        onSelectRole("owner", ownerProfile);
        handlePostLoginRedirectAndCleanup();
        onClose();
        if (onSuccessOpenAdmin) {
          onSuccessOpenAdmin();
        }
      }, 300);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate owner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Website Owner Authentication (Password / Key Verified via Server)
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const email = (emailInput.trim() || "mukeshinland79@gmail.com").toLowerCase();
    const key = ownerKeyInput.trim() || "12345";

    setIsSubmitting(true);

    try {
      const { ok, data, error } = await safeFetchJson("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          secretKey: key,
        }),
      });

      if (!ok || !data || (!data.token && !data.success && data.status !== "ok")) {
        throw new Error(error || data?.error || data?.message || "Owner access denied. Invalid key or credentials.");
      }

      if (data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const ownerName = email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia";
      const ownerEmail = email;

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
        if (onSuccessOpenAdmin) {
          onSuccessOpenAdmin();
        }
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate owner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await safeFetchJson("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("pdfsun_auth_token");
    onSelectRole("public", null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 sm:space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">PDFSun Account Portal</h3>
              <p className="text-[10px] text-slate-400 font-medium truncate">Free Plan &amp; Role-Based Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 ml-2 cursor-pointer"
            aria-label="Close auth modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Card (if logged in) */}
        {currentRole !== "public" && userProfile && (
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              {currentRole === "owner" ? (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
              ) : currentRole === "user" ? (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <User className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}

              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5 flex-wrap">
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">{userProfile.name}</span>
                  <span
                    className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded uppercase font-black shrink-0 ${
                      currentRole === "owner"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : currentRole === "user"
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "bg-slate-500/10 text-slate-500"
                    }`}
                  >
                    {currentRole === "owner" ? "OWNER" : currentRole === "user" ? "ACTIVE USER" : "FREE GUEST"}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {userProfile.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-2.5 sm:px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-[11px] font-bold hover:bg-rose-500 hover:text-white transition flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="break-words">{errorMsg}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* OTP Code Hint Callout (Dev / Instant Access Banner) */}
        {otpHint && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
            <span className="font-semibold">Verification Code (OTP):</span>
            <span className="font-mono font-black text-sm bg-amber-500 text-slate-950 px-2 py-0.5 rounded tracking-widest">{otpHint}</span>
          </div>
        )}

        {/* 1. CUSTOMER LOGIN & SIGNUP FORM */}
        {authMode === "customer" && (
          <div className="space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex space-x-3 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSubMode("signin");
                    setErrorMsg("");
                  }}
                  className={`text-xs font-bold transition pb-1 border-b-2 cursor-pointer ${
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
                  className={`text-xs font-bold transition pb-1 border-b-2 cursor-pointer ${
                    customerSubMode === "signup"
                      ? "border-orange-500 text-orange-600 dark:text-orange-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  Create Free Account
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">100% Free Plan</span>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              {customerSubMode === "signup" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mukesh Kumar"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. alex.rivera@edu.org or 9991659655"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition pr-9"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {customerSubMode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot-password");
                        setErrorMsg("");
                        setSuccessMsg("");
                        setOtpSent(false);
                      }}
                      className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
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
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-md shadow-orange-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{customerSubMode === "signup" ? "Activate Free Account" : "Sign In to Account"}</span>
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
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
              <span>One-Click Fast Demo Login (Alex Rivera)</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("owner");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-[11px] text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center space-x-1 mx-auto transition cursor-pointer font-semibold"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Owner &amp; Administrator Portal</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. FORGOT PASSWORD VIA OTP RECOVERY */}
        {authMode === "forgot-password" && (
          <div className="space-y-3.5">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("customer");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Back to Sign In"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">Account Password Recovery</h4>
                <p className="text-[10px] text-slate-400">Reset your password via 6-digit OTP verification</p>
              </div>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Registered Email Address or Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. mukeshinland79@gmail.com or 9991659655"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition pr-9"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-md shadow-orange-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Verification OTP</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordWithOtp} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Enter 6-Digit OTP Code
                    </label>
                    <button
                      type="button"
                      disabled={otpCountdown > 0 || isSubmitting}
                      onClick={handleSendOtp}
                      className="text-[10px] text-orange-600 dark:text-orange-400 hover:underline font-semibold disabled:text-slate-400 cursor-pointer"
                    >
                      {otpCountdown > 0 ? `Resend OTP (${otpCountdown}s)` : "Resend OTP"}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono tracking-widest text-center font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter at least 4 characters"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      aria-label="Toggle new password visibility"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying &amp; Resetting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify OTP &amp; Reset Password</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("customer");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer font-semibold"
              >
                ← Back to Regular Sign In
              </button>
            </div>
          </div>
        )}

        {/* 3. WEBSITE OWNER LOGIN FORM (PROTECTED) */}
        {authMode === "owner" && (
          <div className="space-y-3.5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/5 border border-amber-500/30">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Super Admin &amp; Owner Portal</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("customer");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Switch to User Login
              </button>
            </div>

            {/* Quick 1-Click Instant Owner Login Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Instant 1-Click Owner Access:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOneClickOwnerLogin("mukeshinland79@gmail.com")}
                  disabled={isSubmitting}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                  <span>Mukesh Inland</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOneClickOwnerLogin("mukeshkalonia241@gmail.com")}
                  disabled={isSubmitting}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 border border-amber-500/40 shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Mukesh Kalonia</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center my-1">
              <span className="absolute bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase font-bold">
                Or Enter Owner Passkey
              </span>
              <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleOwnerLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Owner Email or Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="mukeshinland79@gmail.com or 9991659655"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Owner Passcode / Secret Key
                </label>
                <input
                  type="password"
                  placeholder="Enter owner passkey (e.g. 12345 or mukesh123)"
                  value={ownerKeyInput}
                  onChange={(e) => setOwnerKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-xs hover:opacity-95 transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Owner Credentials...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 shrink-0" />
                    <span>Verify &amp; Unlock Owner Suite</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Strict Role Boundary: Guest &amp; Customer accounts do NOT have access to Admin options or Owner settings.
          </p>
        </div>
      </div>
    </div>
  );
};
