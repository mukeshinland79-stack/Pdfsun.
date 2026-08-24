import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Shield,
  Lock,
  CheckCircle2,
  Crown,
  LogOut,
  ArrowRight,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Smartphone,
  ShieldAlert,
  Key,
  Globe,
  Building2,
  Sparkles,
} from "lucide-react";
import { UserRole, UserProfile, DUAL_OWNER_EMAILS } from "../types";
import { safeFetchJson, getErrorMessage } from "../utils/apiHelper";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { PasswordResetWizard } from "./PasswordResetWizard";
import { PDFSunLogoIcon } from "./PDFSunLogo";
import {
  EnterpriseIdpCarousel,
  HorizontalIdpLogoCarousel,
  ENTERPRISE_IDPS,
  IdentityProvider,
} from "./EnterpriseIdpCarousel";
import {
  handleSSOLoginFlow,
  validateSSODomain,
  validateCorporateDomain,
  CorporateDomainValidator,
  resolveEnterpriseOrgPlan,
  isPublicConsumerDomain,
  extractOrganizationFromDomain,
  SSOProviderType,
} from "../utils/SSOHandler";

export { getErrorMessage };

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  onReset: () => void;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class AuthLocalErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("[AuthLocalErrorBoundary] Error caught locally inside Auth Modal:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const errorText = getErrorMessage(this.state.error);
      return (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Authentication Form Notice
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {errorText || "A temporary issue occurred while rendering this step."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const [authMode, setAuthMode] = useState<"customer" | "owner" | "forgot-password" | "sso">(initialMode);
  const [customerSubMode, setCustomerSubMode] = useState<"signin" | "signup">("signin");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "facebook" | "sso" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // SSO Domain & Provider state
  const [ssoDomain, setSsoDomain] = useState("");
  const [selectedIdp, setSelectedIdp] = useState<IdentityProvider>(ENTERPRISE_IDPS[0]);

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
      setOwnerMfaStep(1);
      setOwnerMfaOtp("");
      setOwnerMfaOtpHint(null);
      setOwnerEmailInput("");
      setOwnerKeyInput("");
      setSocialLoading(null);
    }
  }, [isOpen, initialMode]);

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
        throw new Error(error || data?.error || data?.message || "Authentication failed. Please check your credentials.");
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
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Social Sign In Handler (Google, Facebook, SSO)
  const handleSocialSignIn = async (provider: "google" | "facebook" | "sso") => {
    setErrorMsg("");
    setSuccessMsg("");
    setSocialLoading(provider);

    try {
      let email = "";
      let name = "";
      let avatar = "";

      if (provider === "google") {
        email = emailInput.trim().toLowerCase() || "user.google@pdfsun.in";
        name = nameInput.trim() || "Google User";
        avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
      } else if (provider === "facebook") {
        email = emailInput.trim().toLowerCase() || "user.facebook@pdfsun.in";
        name = nameInput.trim() || "Facebook User";
        avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80";
      } else if (provider === "sso") {
        const ssoResult = await handleSSOLoginFlow({
          inputDomainOrEmail: ssoDomain,
          providerId: (selectedIdp.id as SSOProviderType) || "okta",
          fallbackName: nameInput || undefined,
        });

        if (!ssoResult.success || !ssoResult.user) {
          throw new Error(ssoResult.error || "Single Sign-On authentication failed.");
        }

        const roleToSet: UserRole = ssoResult.role || "user";
        const profile: UserProfile = ssoResult.user;

        setSuccessMsg(
          ssoResult.message ||
            `Signed in successfully via ${selectedIdp.shortName} (${profile.plan})!`
        );

        setTimeout(() => {
          onSelectRole(roleToSet, profile);
          handlePostLoginRedirectAndCleanup();
          onClose();
          if (roleToSet === "owner" && onSuccessOpenAdmin) {
            onSuccessOpenAdmin();
          }
        }, 400);
        return;
      }

      const { ok, data, error } = await safeFetchJson("/api/v1/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          provider,
          email,
          name,
          avatar,
          ssoDomain: undefined,
        }),
      });

      if (!ok || !data || data.success === false) {
        throw new Error(error || data?.error || data?.message || `Failed to sign in with ${provider}.`);
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
        name: isOwnerEmail ? "Mukesh Kalonia" : name,
        email,
        role: roleToSet,
        avatar,
        plan: isOwnerEmail ? "Founder & Owner" : "Pro Sun (OAuth)",
        joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        hasAdminAccess: isOwnerEmail,
        isPro: true,
      };

      setSuccessMsg(`Signed in successfully with ${provider === "google" ? "Google" : "Facebook"}!`);

      setTimeout(() => {
        onSelectRole(roleToSet, profile);
        handlePostLoginRedirectAndCleanup();
        onClose();
        if (isOwnerEmail && onSuccessOpenAdmin) {
          onSuccessOpenAdmin();
        }
      }, 400);
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSocialLoading(null);
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
        throw new Error(error || data?.error || data?.message || "Access Denied: Invalid credentials or unauthorized account.");
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
      setErrorMsg(getErrorMessage(err));
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
        throw new Error(error || data?.error || data?.message || "Invalid or expired MFA Security Code. Please try again.");
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
      setErrorMsg(getErrorMessage(err));
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
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#131b2e] rounded-3xl max-w-[440px] w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 my-auto max-h-[95vh] overflow-y-auto relative">
        <AuthLocalErrorBoundary onReset={() => {
          setAuthMode("customer");
          setErrorMsg("");
          setSuccessMsg("");
        }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Heading */}
        <div className="text-center space-y-2 pt-1">
          {authMode === "owner" ? (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto">
              <Crown className="w-6 h-6" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mx-auto space-y-1">
              <PDFSunLogoIcon size={44} variant="app-icon" animated={false} />
              <div className="flex items-center space-x-1 font-black text-lg tracking-tight leading-none">
                <span className="text-slate-900 dark:text-white">PDF</span>
                <span className="text-amber-500">Sun</span>
                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 pl-0.5">.in</span>
              </div>
            </div>
          )}
          
          <div className="space-y-1 pt-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {authMode === "owner"
                ? "Owner & Admin Portal"
                : authMode === "sso"
                ? "Enterprise Single Sign-On"
                : authMode === "forgot-password"
                ? "Reset Password"
                : customerSubMode === "signup"
                ? "Create a free account"
                : "Log in to your account"}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {authMode === "owner"
                ? "Strict Multi-Factor Identity Protection"
                : authMode === "sso"
                ? "Secure corporate login via Okta, Azure AD, Google Workspace & SAML"
                : "Every tool you need to use PDFs, in one place"}
            </p>
          </div>
        </div>

        {/* Current Active Account Card (if logged in) */}
        {currentRole !== "public" && userProfile && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
                currentRole === "owner"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-red-600"
              }`}>
                {currentRole === "owner" ? <Crown className="w-4 h-4" /> : (userProfile.name?.[0] || "U").toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="truncate max-w-[130px]">{userProfile.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    {currentRole === "owner" ? "OWNER" : "PRO"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {userProfile.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words leading-relaxed">
              {typeof errorMsg === "object" && errorMsg !== null
                ? (errorMsg as any)?.message || JSON.stringify(errorMsg)
                : String(errorMsg)}
            </span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {typeof successMsg === "object" && successMsg !== null
                ? (successMsg as any)?.message || JSON.stringify(successMsg)
                : String(successMsg)}
            </span>
          </div>
        )}

        {/* 1. CUSTOMER / PUBLIC AUTH MODE (iLovePDF Style) */}
        {authMode === "customer" && (
          <div className="space-y-4">
            {/* Quick Social Sign-In Grid */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Google Button */}
                <button
                  type="button"
                  disabled={socialLoading !== null}
                  onClick={() => handleSocialSignIn("google")}
                  className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {socialLoading === "google" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Google</span>
                </button>

                {/* Facebook Button */}
                <button
                  type="button"
                  disabled={socialLoading !== null}
                  onClick={() => handleSocialSignIn("facebook")}
                  className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {socialLoading === "facebook" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  <span>Facebook</span>
                </button>
              </div>

              {/* SSO Button with IdP Brand Logomarks Preview */}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("sso");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer group"
              >
                <div className="flex items-center space-x-2">
                  <Key className="w-3.5 h-3.5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                  <span>Enterprise Single Sign-On (SSO)</span>
                </div>
                <div className="flex items-center -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center p-0.5" title="Okta">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#007DC1" strokeWidth="3.5" /><circle cx="12" cy="12" r="4.5" fill="#007DC1" /></svg>
                  </span>
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center p-0.5" title="Azure AD">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9.5" height="9.5" rx="1.5" fill="#F25022" /><rect x="12.5" y="2" width="9.5" height="9.5" rx="1.5" fill="#7FBA00" /><rect x="2" y="12.5" width="9.5" height="9.5" rx="1.5" fill="#00A4EF" /><rect x="12.5" y="12.5" width="9.5" height="9.5" rx="1.5" fill="#FFB900" /></svg>
                  </span>
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center p-0.5" title="Google Workspace">
                    <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                  </span>
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center p-0.5 text-[8px] font-black text-purple-600" title="SAML 2.0">
                    S
                  </span>
                </div>
              </button>
            </div>

            {/* Divider "OR" */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Or
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleCustomerSubmit} className="space-y-3.5">
              {customerSubMode === "signup" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition font-medium"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your email or phone"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition pr-10 font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
                {/* Corporate SSO Detection Banner in Standard Login */}
                {emailInput.includes("@") && (() => {
                  const corpCheck = validateCorporateDomain(emailInput);
                  if (corpCheck.isValid && corpCheck.isVerified) {
                    return (
                      <div className="mt-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                                {corpCheck.organizationName}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-600 text-white uppercase tracking-wider shrink-0">
                                Domain Verified
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
                              Single Sign-On (SSO) configured for your organization
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode("sso");
                            setSsoDomain(emailInput);
                            if (corpCheck.suggestedProvider) {
                              const match = ENTERPRISE_IDPS.find((p) => p.id === corpCheck.suggestedProvider);
                              if (match) setSelectedIdp(match);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black shrink-0 transition cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          Use SSO →
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {customerSubMode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot-password");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot your password?
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
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
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

              {/* Remember me checkbox */}
              {customerSubMode === "signin" && (
                <div className="flex items-center space-x-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                    Remember me on this device
                  </label>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-wide transition shadow-lg shadow-red-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98 cursor-pointer uppercase mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{customerSubMode === "signup" ? "Creating Account..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span>{customerSubMode === "signup" ? "Sign Up" : "Log In"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle Mode Footer */}
            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              {customerSubMode === "signin" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerSubMode("signup");
                      setErrorMsg("");
                    }}
                    className="font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerSubMode("signin");
                      setErrorMsg("");
                    }}
                    className="font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* 2. SINGLE SIGN-ON (SSO) WORKSPACE LOGIN */}
        {authMode === "sso" && (
          <div className="space-y-4">
            {/* Identity Provider Carousel */}
            <EnterpriseIdpCarousel
              selectedIdp={selectedIdp}
              onSelectIdp={(idp) => setSelectedIdp(idp)}
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSocialSignIn("sso");
              }}
              className="space-y-3.5"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {selectedIdp.shortName} Domain or Work Email
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {selectedIdp.protocol}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={selectedIdp.placeholder}
                    value={ssoDomain}
                    onChange={(e) => setSsoDomain(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition font-medium pr-10"
                  />
                  {ssoDomain.trim() && validateCorporateDomain(ssoDomain, (selectedIdp.id as SSOProviderType) || "okta").isVerified ? (
                    <div 
                      id="sso-domain-verified-badge"
                      className="absolute right-3 top-2.5 flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
                      title="Enterprise Domain Verified"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="hidden sm:inline">Verified</span>
                    </div>
                  ) : (
                    <Globe className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  )}
                </div>
                {ssoDomain.trim() ? (
                  (() => {
                    const validation = validateCorporateDomain(
                      ssoDomain,
                      (selectedIdp.id as SSOProviderType) || "okta"
                    );
                    if (!validation.isValid) {
                      return (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1 font-medium leading-tight">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{validation.error}</span>
                        </p>
                      );
                    }
                    if (validation.isVerified) {
                      return (
                        <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* Domain Verified Card */}
                          <div 
                            id="sso-domain-verified-card"
                            className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 dark:border-emerald-500/20 text-slate-800 dark:text-slate-200 shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start space-x-2 min-w-0">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center flex-wrap gap-1.5">
                                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                      {validation.organizationName}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      Domain Verified
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5 flex items-center flex-wrap gap-1">
                                    <span>{validation.protocol}</span>
                                    <span>•</span>
                                    <span>{validation.securityTier}</span>
                                    <span>•</span>
                                    <span className="font-bold text-emerald-800 dark:text-emerald-200">SAML SSO Active</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick IdP Suggestion if mismatched */}
                          {validation.suggestedProvider && validation.suggestedProvider !== selectedIdp.id && (
                            <button
                              type="button"
                              onClick={() => {
                                const match = ENTERPRISE_IDPS.find((p) => p.id === validation.suggestedProvider);
                                if (match) setSelectedIdp(match);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium transition flex items-center justify-between gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                            >
                              <span>
                                ⚡ Registered with <strong>{validation.suggestedProvider.toUpperCase()}</strong>
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                                Switch to {validation.suggestedProvider.toUpperCase()} →
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    }
                    return (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>
                          Organization: <strong className="font-bold text-slate-800 dark:text-slate-200">{validation.organizationName}</strong> • SAML 2.0 Ready
                        </span>
                      </p>
                    );
                  })()
                ) : (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    💡 {selectedIdp.domainHint}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={socialLoading !== null || !ssoDomain.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xs tracking-wide transition shadow-lg shadow-red-600/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer uppercase"
              >
                {socialLoading === "sso" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to {selectedIdp.shortName}...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with {selectedIdp.shortName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Horizontal Identity Provider Logo Carousel */}
            <div className="pt-1">
              <HorizontalIdpLogoCarousel
                onSelectIdpName={(name) => {
                  const matched = ENTERPRISE_IDPS.find(
                    (p) =>
                      p.shortName.toLowerCase().includes(name.toLowerCase()) ||
                      p.name.toLowerCase().includes(name.toLowerCase())
                  );
                  if (matched) {
                    setSelectedIdp(matched);
                  } else {
                    // Default to SAML/Custom IdP for other providers (Ping, OneLogin, Duo)
                    const saml = ENTERPRISE_IDPS.find((p) => p.id === "saml");
                    if (saml) setSelectedIdp(saml);
                  }
                }}
              />
            </div>

            {/* Enterprise Plan Link for Companies */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Not configured yet?</span>
                <span>Deploy SSO for your team from ₹5,999 / $99.99/yr.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  const el = document.getElementById("pricing");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline shrink-0 cursor-pointer"
              >
                View SSO Pricing →
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("customer");
                  setErrorMsg("");
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              >
                ← Back to standard login
              </button>
            </div>
          </div>
        )}

        {/* 3. FORGOT PASSWORD RECOVERY WIZARD */}
        {authMode === "forgot-password" && (
          <PasswordResetWizard
            initialIdentifier={emailInput}
            isModal={true}
            onBackToSignIn={() => {
              setAuthMode("customer");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            onSuccess={(profile) => {
              if (profile) {
                onSelectRole(profile.role, profile);
              }
              onClose();
            }}
          />
        )}

        {/* 4. MANDATORY MULTI-FACTOR AUTHENTICATION FOR OWNER & ADMINISTRATOR PORTAL */}
        {authMode === "owner" && (
          <div className="space-y-4 p-4 rounded-3xl bg-amber-500/5 border border-amber-500/30">
            {/* Header / Security Badge */}
            <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Owner &amp; Admin Suite
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {ownerMfaStep === 1 ? "Step 1: Identity & Credentials" : "Step 2: 6-Digit MFA Verification"}
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
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
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
                      placeholder="e.g. mukeshinland79@gmail.com"
                      value={ownerEmailInput}
                      onChange={(e) => setOwnerEmailInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium pr-9"
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
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-amber-500/30 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium pr-10"
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
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 text-white font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98 uppercase"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials &amp; Generating OTP...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 shrink-0" />
                      <span>Verify &amp; Send 6-Digit MFA Code</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MFA Step 2: 6-Digit OTP Verification Screen */}
            {ownerMfaStep === 2 && (
              <form onSubmit={handleOwnerVerifyMfa} className="space-y-3.5 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
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
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
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
                    className="w-full px-3.5 py-3 rounded-2xl border border-amber-500/40 bg-white dark:bg-slate-800 text-base font-mono tracking-[0.35em] text-center font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || ownerMfaOtp.length < 6}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-98 uppercase"
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

        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Protected by PDFSun Privacy Shield • 256-Bit SSL Encryption</span>
        </div>
        </AuthLocalErrorBoundary>
      </div>
    </div>
  );
};
