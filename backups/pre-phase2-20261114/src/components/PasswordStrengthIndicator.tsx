import React from "react";
import { Check, X, ShieldCheck, ShieldAlert } from "lucide-react";

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: "Empty" | "Too Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
  barColorClass: string;
  bgLightClass: string;
  criteria: {
    minChars: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: "Empty",
      colorClass: "text-slate-400 dark:text-slate-500",
      barColorClass: "bg-slate-200 dark:bg-slate-700",
      bgLightClass: "bg-slate-100 dark:bg-slate-800",
      criteria: {
        minChars: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const minChars = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let rawScore = 0;
  if (password.length >= 6) rawScore += 1;
  if (minChars) rawScore += 1;
  if (hasUpper && hasLower) rawScore += 1;
  if (hasNumber) rawScore += 1;
  if (hasSpecial) rawScore += 1;

  let score = 1;
  let label: PasswordStrengthResult["label"] = "Too Weak";
  let colorClass = "text-red-500 dark:text-red-400";
  let barColorClass = "bg-red-500";
  let bgLightClass = "bg-red-50 dark:bg-red-950/30";

  if (rawScore >= 4) {
    score = 4;
    label = "Strong";
    colorClass = "text-emerald-500 dark:text-emerald-400";
    barColorClass = "bg-emerald-500";
    bgLightClass = "bg-emerald-50 dark:bg-emerald-950/30";
  } else if (rawScore >= 3) {
    score = 3;
    label = "Good";
    colorClass = "text-emerald-500 dark:text-emerald-400";
    barColorClass = "bg-emerald-500";
    bgLightClass = "bg-emerald-50 dark:bg-emerald-950/30";
  } else if (rawScore >= 2) {
    score = 2;
    label = "Fair";
    colorClass = "text-yellow-500 dark:text-yellow-400";
    barColorClass = "bg-yellow-500";
    bgLightClass = "bg-yellow-50 dark:bg-yellow-950/30";
  }

  return {
    score,
    label,
    colorClass,
    barColorClass,
    bgLightClass,
    criteria: {
      minChars,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    },
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showCriteria = true,
  className = "",
}) => {
  if (!password) return null;

  const strength = evaluatePasswordStrength(password);

  return (
    <div className={`mt-1.5 space-y-1.5 animate-in fade-in duration-200 ${className}`}>
      {/* Visual Color-Coded Multi-Segment Bar & Label */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 grid grid-cols-4 gap-1.5 h-1.5">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = strength.score >= step;
            return (
              <div
                key={step}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFilled ? strength.barColorClass : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {strength.score >= 3 ? (
            <ShieldCheck className={`w-3 h-3 ${strength.colorClass}`} />
          ) : (
            <ShieldAlert className={`w-3 h-3 ${strength.colorClass}`} />
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider ${strength.colorClass}`}>
            {strength.label}
          </span>
        </div>
      </div>

      {/* Optional Real-Time Micro Criteria Checklist */}
      {showCriteria && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-0.5 text-[10px]">
          <div
            className={`flex items-center space-x-1 transition-colors ${
              strength.criteria.minChars
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {strength.criteria.minChars ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-40" />}
            <span>8+ characters</span>
          </div>

          <div
            className={`flex items-center space-x-1 transition-colors ${
              strength.criteria.hasUpper && strength.criteria.hasLower
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {strength.criteria.hasUpper && strength.criteria.hasLower ? (
              <Check className="w-3 h-3 shrink-0" />
            ) : (
              <X className="w-3 h-3 shrink-0 opacity-40" />
            )}
            <span>Upper &amp; lower case</span>
          </div>

          <div
            className={`flex items-center space-x-1 transition-colors ${
              strength.criteria.hasNumber
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {strength.criteria.hasNumber ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-40" />}
            <span>At least 1 number</span>
          </div>

          <div
            className={`flex items-center space-x-1 transition-colors ${
              strength.criteria.hasSpecial
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {strength.criteria.hasSpecial ? (
              <Check className="w-3 h-3 shrink-0" />
            ) : (
              <X className="w-3 h-3 shrink-0 opacity-40" />
            )}
            <span>1 special symbol (@#$)</span>
          </div>
        </div>
      )}
    </div>
  );
};
