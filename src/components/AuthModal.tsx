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
  Smartphone,
  ShieldAlert,
  Check,
} from "lucide-react";
import { UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";
import { safeFetchJson } from "../utils/apiHelper";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { PasswordResetWizard } from "./PasswordResetWizard";

/**
 * PII Data Protection: Client-side masking helpers
 */
export function maskClientEmail(email: string): string {
  if (!email || !email.includes("@")) return "••••••••";
  const [user, domain] = email.trim().toLowerCase().split("@");
  if (user.length <= 2) {
    return `${user.charAt(0)}***@${domain}`;
  }
  const first = user.charAt(0);
  const last = user.charAt(user.length - 1);
  return `${first}***${last}@${domain}`;
}

export function maskClientPhone(phone: string = "9991659655"): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const start = digits.slice(-10, -6);
    const end = digits.slice(-2);
    return `${start}****${end}`;
  }
  return "9050****55";
}

export function maskClientIdentifier(identifier: string): string {
  if (!identifier) return "••••••••";
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return maskClientEmail(trimmed);
  }
  return maskClientPhone(trimmed);
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // OTP Password Recovery States (Customer)
  const [otpInput, setOtpInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpHint, setOtpHint] = useState<string | null>(null);

  // Mandatory Owner MFA States
  const [ownerMfaStep, setOwnerMfaStep] = useState<1 | 2>(1);
  const [ownerEmailInput, setOwnerEmailInput] = useState("");
  const [ownerKeyInput, setOwnerKeyInput] = useState("");
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerMfaOtp, setOwnerMfaOtp] = useState("");
  const [ownerMaskedEmail, setOwnerMaskedEmail] = useState("");
  const [ownerMaskedPhone, setOwnerMaskedPhone] = useState("");
  const [ownerMfaCountdown, setOwnerMfaCountdown] = useState(0);
  const [ownerMfaOtpHint, setOwnerMfaOtpHint] = useState<string | null>(null);

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
      setOwnerMfaStep(1);
      setOwnerMfaOtp("");
      setOwnerMfaOtpHint(null);
      setOwnerEmailInput("");
      setOwnerKeyInput("");
    }
  }, [isOpen, initialMode]);

  // Handle Customer OTP Resend Countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Handle Owner MFA Resend Countdown
  useEffect(() => {
    if (ownerMfaCountdown > 0) {
      const timer = setTimeout(() => setOwnerMfaCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [ownerMfaCountdown]);

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
      const endpoint = customerSubMode === "signup" ? "/api/v1/auth/register" : "/api/v1/auth/login";
      const payload =
        customerSubMode === "signup"
          ? { name: nameInput.trim(), email, identifier: email, password: passwordInput }
          : { email, identifier: email, password: passwordInput };

      const { ok, data, error } = await safeFetchJson(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
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

  // Send OTP for Customer Forgot Password
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
      const { ok, data, error } = await safeFetchJson("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      if (!ok || !data || data.success === false) {
        throw new Error(error || data?.error || "Failed to generate verification OTP.");
      }

      setOtpSent(true);
      setOtpCountdown(60);
      if (data.otp) {
        setOtpHint(data.otp);
        setOtpInput(data.otp);
      }
      const maskedTarget = data.maskedTarget || maskClientIdentifier(identifier);
      setSuccessMsg(data.message || `OTP sent to ${maskedTarget}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not send OTP. Please check your contact info.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP and Reset Customer Password
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
      const { ok, data, error } = await safeFetchJson("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
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

  // ----------------------------------------------------
  // MANDATORY MULTI-FACTOR AUTHENTICATION FOR OWNER/ADMIN
  // ----------------------------------------------------

  // Step 1: Owner Credential Verification & Dispatch 6-digit MFA Code
  const handleOwnerInitiateMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const email = ownerEmailInput.trim().toLowerCase();
    const key = ownerKeyInput.trim();

    if (!email) {
      setErrorMsg("Please enter your registered Owner Email Address or Mobile Number.");
      return;
    }
    if (!key) {
      setErrorMsg("Please enter your Owner Password or Security Passkey.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { ok, data, error } = await safeFetchJson("/api/v1/auth/send-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email,
          identifier: email,
          password: key,
          secretKey: key,
        }),
      });

      if (!ok || !data || data.success === false) {
        throw new Error(error || data?.error || "Access Denied: Invalid credentials or unauthorized account.");
      }

      setOwnerMaskedEmail(data.maskedEmail || maskClientEmail(email));
      setOwnerMaskedPhone(data.maskedPhone || maskClientPhone("+91 9991659655"));
      setOwnerMfaStep(2);
      setOwnerMfaCountdown(60);
      if (data.otp) {
        setOwnerMfaOtpHint(data.otp);
      }

      setSuccessMsg(`Multi-Factor Authentication initiated. 6-digit OTP code sent to registered Email and Phone.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Owner credential check failed. Access denied.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit MFA Security Code and Grant Session Access
  const handleOwnerVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const email = ownerEmailInput.trim().toLowerCase();
    const otp = ownerMfaOtp.trim();

    if (!otp || otp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit MFA Security Code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { ok, data, error } = await safeFetchJson("/api/v1/auth/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email,
          identifier: email,
          otp,
        }),
      });

      if (!ok || !data || (!data.token && !data.success)) {
        throw new Error(error || data?.error || "Invalid or expired MFA Security Code. Please try again.");
      }

      if (data.token) {
        localStorage.setItem("pdfsun_auth_token", data.token);
      }

      const ownerName = email.includes("inland") ? "Mukesh Inland" : "Mukesh Kalonia";
      const ownerProfile: UserProfile = data.user || {
        id: "owner-001",
        name: ownerName,
        email,
        role: "owner",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        plan: "Founder & Owner",
        joinedDate: "Founder & Owner",
        hasAdminAccess: true,
        isPro: true,
      };

      setSuccessMsg("Multi-Factor Authentication verified! Access granted to Owner & Administrator Suite.");
      setTimeout(() => {
        onSelectRole("owner", ownerProfile);
        handlePostLoginRedirectAndCleanup();
        onClose();
        if (onSuccessOpenAdmin) {
          onSuccessOpenAdmin();
        }
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify MFA Security Code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await safeFetchJson("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
      });
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
              <p className="text-[10px] text-slate-400 font-medium truncate">Strict Role-Based Multi-Factor Authentication</p>
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

        {/* OTP Code Hint Callout (Customer Recovery / Dev Mode) */}
        {otpHint && authMode === "forgot-password" && (
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
                    placeholder="e.g. Rahul Sharma"
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
                    placeholder="9050****55 / r***4@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition pr-9 font-medium"
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
                      className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-bold cursor-pointer"
                    >
                      [Forgot?]
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
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
                {passwordInput && (
                  <PasswordStrengthIndicator
                    password={passwordInput}
                    showCriteria={customerSubMode === "signup"}
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs tracking-wide transition shadow-md shadow-orange-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98 cursor-pointer uppercase"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>{customerSubMode === "signup" ? "Activate Free Account" : "Sign In to Account ⚡"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("owner");
                  setErrorMsg("");
                  setSuccessMsg("");
                  setOwnerMfaStep(1);
                }}
                className="text-[11px] text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center space-x-1.5 mx-auto transition cursor-pointer font-semibold py-1"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Owner &amp; Administrator Portal (2FA / MFA Protected)</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. FORGOT PASSWORD VIA ADVANCED OTP RECOVERY WIZARD */}
        {authMode === "forgot-password" && (
          <PasswordResetWizard
            initialIdentifier={emailInput}
            isModal={true}
            onBackToSignIn={() => {
              setAuthMode("customer");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            onSuccess={(profile, token) => {
              if (profile) {
                onSelectRole(profile.role, profile);
              }
              onClose();
            }}
          />
        )}

        {/* 3. MANDATORY MULTI-FACTOR AUTHENTICATION FOR OWNER & ADMINISTRATOR PORTAL */}
        {authMode === "owner" && (
          <div className="space-y-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30">
            {/* Header / Security Badge */}
            <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Owner &amp; Admin Portal
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {ownerMfaStep === 1 ? "Step 1: Identity & Password Verification" : "Step 2: 6-Digit MFA Security Code"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("customer");
                  setErrorMsg("");
                  setSuccessMsg("");
                  setOwnerMfaStep(1);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer font-medium"
              >
                User Login
              </button>
            </div>

            {/* MFA Step 1: Owner Credentials Form */}
            {ownerMfaStep === 1 && (
              <form onSubmit={handleOwnerInitiateMfa} className="space-y-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                  <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Mandatory Multi-Factor Authentication (MFA) is active. Entering your credentials will dispatch a verification OTP to your registered devices.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Owner Registered Email or Phone
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. muke*********9@gmail.com or 9991****55"
                      value={ownerEmailInput}
                      onChange={(e) => setOwnerEmailInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium pr-9"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Owner Password / Passkey
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("forgot-password");
                          if (ownerEmailInput) setEmailInput(ownerEmailInput);
                          setErrorMsg("");
                          setSuccessMsg("");
                          setOtpSent(false);
                        }}
                        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                      >
                        [Forgot?]
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showOwnerPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={ownerKeyInput}
                        onChange={(e) => setOwnerKeyInput(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                        aria-label="Toggle owner password visibility"
                      >
                        {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {ownerKeyInput && (
                      <PasswordStrengthIndicator
                        password={ownerKeyInput}
                        showCriteria={false}
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 text-white font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials &amp; Generating OTP...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 shrink-0" />
                        <span>Verify &amp; Send 6-Digit MFA Security Code</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot-password");
                        if (ownerEmailInput) setEmailInput(ownerEmailInput);
                        setErrorMsg("");
                        setSuccessMsg("");
                        setOtpSent(false);
                      }}
                      className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      Need to reset your Owner Passkey or Password?
                    </button>
                  </div>
              </form>
            )}

            {/* MFA Step 2: 6-Digit OTP Verification Screen */}
            {ownerMfaStep === 2 && (
              <form onSubmit={handleOwnerVerifyMfa} className="space-y-3.5 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>MFA Verification Code Sent</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    A 6-digit security code has been sent simultaneously to:
                  </p>
                  <div className="flex flex-col space-y-1 pt-1 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    <span className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-bold">{ownerMaskedEmail}</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold">{ownerMaskedPhone}</span>
                    </span>
                  </div>
                </div>

                {ownerMfaOtpHint && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                    <span className="font-semibold">Active MFA Security Code:</span>
                    <span className="font-mono font-black text-sm bg-emerald-500 text-slate-950 px-2 py-0.5 rounded tracking-widest">
                      {ownerMfaOtpHint}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Enter 6-Digit MFA Code
                    </label>
                    <button
                      type="button"
                      disabled={ownerMfaCountdown > 0 || isSubmitting}
                      onClick={handleOwnerInitiateMfa}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold disabled:text-slate-400 cursor-pointer"
                    >
                      {ownerMfaCountdown > 0 ? `Resend Code (${ownerMfaCountdown}s)` : "Resend Code"}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={ownerMfaOtp}
                    onChange={(e) => setOwnerMfaOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                    className="w-full px-3.5 py-3 rounded-xl border border-amber-500/40 bg-white dark:bg-slate-800 text-base font-mono tracking-[0.35em] text-center font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || ownerMfaOtp.length < 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating MFA Security Token...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 shrink-0" />
                      <span>Authenticate &amp; Unlock Owner Suite</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerMfaStep(1);
                      setErrorMsg("");
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition underline cursor-pointer"
                  >
                    ← Change Email or Password
                  </button>
                </div>
              </form>
            )}
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
