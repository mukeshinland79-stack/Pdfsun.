import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  Sparkles,
  RefreshCw,
  Clock,
  Check,
} from "lucide-react";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { safeFetchJson, getErrorMessage } from "../utils/apiHelper";
import { UserProfile, UserRole } from "../types";

export interface PasswordResetWizardProps {
  onSuccess: (profile: UserProfile | null, token?: string) => void;
  onBackToSignIn: () => void;
  initialIdentifier?: string;
  isModal?: boolean;
}

export type WizardStep = 1 | 2 | 3 | 4;

export const PasswordResetWizard: React.FC<PasswordResetWizardProps> = ({
  onSuccess,
  onBackToSignIn,
  initialIdentifier = "",
  isModal = true,
}) => {
  // Wizard Navigation Step
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form Field States
  const [identifier, setIdentifier] = useState<string>(initialIdentifier);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Metadata & Delivery State
  const [maskedTarget, setMaskedTarget] = useState<string>("");
  const [isProAccount, setIsProAccount] = useState<boolean>(false);

  // Status & Feedback States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // 10-Minute Countdown Timer (600 seconds)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // React useRef for non-rendering state tracking and timer safety
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const stateTrackerRef = useRef({
    identifier,
    resetToken,
    remainingSeconds,
  });

  // Keep ref synchronized with state
  useEffect(() => {
    stateTrackerRef.current = {
      identifier,
      resetToken,
      remainingSeconds,
    };
  }, [identifier, resetToken, remainingSeconds]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Format seconds into MM:SS display (e.g. 10:00 -> 09:59)
  const formatTimer = (totalSecs: number): string => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start / Reset 10-Minute Countdown Timer
  const startCountdownTimer = useCallback((durationSeconds: number = 600) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemainingSeconds(durationSeconds);

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start 60-second Resend Cooldown
  const startResendCooldown = useCallback((seconds: number = 60) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(seconds);

    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Step 1: Initiate Password Recovery (Generate & Send OTP)
  const handleInitiateReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage("Please enter your registered Email Address or Mobile Number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { ok, data, error } = await safeFetchJson<{
        success: boolean;
        message?: string;
        maskedTarget?: string;
        maskedEmail?: string;
        maskedPhone?: string;
        cooldownSeconds?: number;
        expiresInSeconds?: number;
      }>("/api/auth/reset-initiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanIdentifier }),
      });

      if (!ok || !data?.success) {
        setErrorMessage(getErrorMessage(error || data?.message || "Failed to dispatch recovery OTP. Please try again."));
        return;
      }

      const target = data.maskedTarget || data.maskedEmail || data.maskedPhone || cleanIdentifier;
      setMaskedTarget(target);
      setIsProAccount(Boolean(data.maskedPhone && data.maskedEmail));
      setSuccessMessage(data.message || `Secure OTP dispatched to ${target}`);
      
      // Move to Step 2 & Start 10-Minute Timer
      setCurrentStep(2);
      startCountdownTimer(data.expiresInSeconds || 600);
      startResendCooldown(data.cooldownSeconds || 60);

      // Auto-focus the first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle individual OTP digit change
  const handleOtpDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    // If user pasted a full 6-digit code
    if (sanitized.length > 1) {
      const chars = sanitized.slice(0, 6).split("");
      const updated = [...otpDigits];
      chars.forEach((c, idx) => {
        if (idx < 6) updated[idx] = c;
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(chars.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = sanitized.charAt(sanitized.length - 1);
    setOtpDigits(updated);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const getFullOtp = (): string => otpDigits.join("");

  // Step 2 & 3: Verify OTP Code and Acquire 5-Minute Reset Token
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = getFullOtp();
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    if (remainingSeconds <= 0) {
      setErrorMessage("The OTP verification code has expired. Please click 'Resend Code'.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { ok, data, error } = await safeFetchJson<{
        success: boolean;
        resetToken?: string;
        message?: string;
        expiresInSeconds?: number;
      }>("/api/auth/verify-recovery-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: stateTrackerRef.current.identifier,
          otp: fullOtp,
        }),
      });

      if (!ok || !data?.success || !data.resetToken) {
        setErrorMessage(getErrorMessage(error || data?.message || "Invalid or expired OTP code."));
        return;
      }

      setResetToken(data.resetToken);
      setSuccessMessage(data.message || "OTP verified successfully! Please set your new password.");
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Set New Password & Complete Recovery
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation password do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const { ok, data, error } = await safeFetchJson<{
        success: boolean;
        token?: string;
        user?: UserProfile;
        message?: string;
      }>("/api/auth/new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken: stateTrackerRef.current.resetToken,
          newPassword,
          identifier: stateTrackerRef.current.identifier,
        }),
      });

      if (!ok || !data?.success) {
        setErrorMessage(getErrorMessage(error || data?.message || "Failed to update password. Please restart recovery."));
        return;
      }

      setSuccessMessage(data.message || "Password Successfully Reset for PDFSun.in! Access is restored securely.");
      
      // Notify parent & restore session
      setTimeout(() => {
        onSuccess(data.user || null, data.token);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${isModal ? "p-1" : "max-w-md mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl"}`}>
      {/* Wizard Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          {currentStep !== 4 && (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 2) setCurrentStep(1);
                else onBackToSignIn();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span>PDFSun Account Recovery</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentStep === 1 && "Step 1: Initiate password reset with OTP"}
              {currentStep === 2 && "Step 2 & 3: Multi-channel OTP & 10-Min Timer"}
              {currentStep === 4 && "Step 4: Set new password & restore access"}
            </p>
          </div>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="flex items-center space-x-1">
          {[1, 2, 4].map((stepNum, idx) => (
            <div
              key={stepNum}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep >= stepNum
                  ? "w-5 bg-gradient-to-r from-orange-500 to-amber-500"
                  : "w-2 bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start space-x-2.5 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            {typeof errorMessage === "object" && errorMessage !== null
              ? (errorMessage as any)?.message || JSON.stringify(errorMessage)
              : String(errorMessage)}
          </span>
        </div>
      )}

      {/* Global Success Banner */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start space-x-2.5 text-emerald-700 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">
            {typeof successMessage === "object" && successMessage !== null
              ? (successMessage as any)?.message || JSON.stringify(successMessage)
              : String(successMessage)}
          </span>
        </div>
      )}

      {/* STEP 1: INITIATION FORM */}
      {currentStep === 1 && (
        <form onSubmit={handleInitiateReset} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Registered Email Address or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. mukeshinland79@gmail.com or 9991659655"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 outline-none transition pr-10"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              We will send a cryptographically secure 6-digit OTP valid for 10 minutes.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Multi-Channel Security Guarantee:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Basic: Verified Email</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>PRO: Email + SMS OTP</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending OTP Code...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Send 6-Digit OTP Code</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2 & 3: OTP INPUT & 10-MINUTE COUNTDOWN TIMER */}
      {currentStep === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {/* Target Notification Callout */}
          <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                OTP Dispatched To
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {maskedTarget || identifier}
              </span>
            </div>
            {isProAccount && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                PRO Multi-Channel
              </span>
            )}
          </div>

          {/* 10-Minute Holographic / Digital Countdown Timer */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-inner flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${remainingSeconds > 60 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400 animate-pulse"}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Time-Limited Expiry
                </span>
                <span className="text-[11px] text-slate-300">
                  {remainingSeconds > 0 ? "Valid for 10 minutes strictly" : "Expired - please resend"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xl sm:text-2xl font-black font-mono tracking-widest ${remainingSeconds > 60 ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"}`}>
                {formatTimer(remainingSeconds)}
              </span>
            </div>
          </div>

          {/* 6-Digit OTP Box Grid */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition shadow-sm"
                />
              ))}
            </div>
          </div>

          {/* Resend Code Section */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 text-[11px]">Didn't receive the code?</span>
            <button
              type="button"
              disabled={resendCooldown > 0 || isLoading}
              onClick={() => handleInitiateReset()}
              className="text-orange-600 dark:text-orange-400 hover:underline font-bold disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || getFullOtp().length !== 6 || remainingSeconds <= 0}
            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying OTP...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Verify & Continue</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 4: NEW PASSWORD FORM & SUCCESS SCREEN */}
      {currentStep === 4 && (
        <form onSubmit={handleSetNewPassword} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <PasswordStrengthIndicator password={newPassword} />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !newPassword || newPassword !== confirmPassword}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Restoring Access...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save New Password & Log In</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Security Engine Telemetry Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 font-medium">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span>PDFSun Banking-Grade Recovery</span>
        </span>
        <span>Google Cloud Run & AI Studio</span>
      </div>
    </div>
  );
};
