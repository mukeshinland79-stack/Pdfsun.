import React, { useMemo, useEffect } from "react";
import { Check, X, ShieldCheck, ShieldAlert, Lock, AlertCircle } from "lucide-react";

export interface PasswordRule {
  id: "minLength" | "hasNumber" | "hasSpecial" | "hasUppercase" | "hasLowercase";
  label: string;
  met: boolean;
  required?: boolean;
}

export interface PasswordValidationResult {
  score: number; // 0 - 4
  percentage: number; // 0 - 100
  strengthLabel: "Very Weak" | "Weak" | "Medium" | "Strong" | "Very Strong" | "Empty";
  isValid: boolean; // True only if all required criteria are met
  rules: PasswordRule[];
  colorClasses: {
    text: string;
    bg: string;
    bar: string;
    border: string;
    pill: string;
  };
  errors: string[];
}

export interface PasswordStrengthValidatorProps {
  password: string;
  minLength?: number;
  requireNumber?: boolean;
  requireSpecial?: boolean;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  showRulesList?: boolean;
  showStrengthBar?: boolean;
  showSummaryBadge?: boolean;
  className?: string;
  id?: string;
  onValidationChange?: (result: PasswordValidationResult) => void;
}

/**
 * Pure evaluation function for password strength and security rule validation
 */
export function validatePasswordStrength(
  password: string,
  options: {
    minLength?: number;
    requireNumber?: boolean;
    requireSpecial?: boolean;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
  } = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireNumber = true,
    requireSpecial = true,
    requireUppercase = true,
    requireLowercase = true,
  } = options;

  if (!password) {
    const defaultRules: PasswordRule[] = [
      { id: "minLength", label: `At least ${minLength} characters`, met: false, required: true },
      { id: "hasNumber", label: "At least one number (0-9)", met: false, required: requireNumber },
      { id: "hasSpecial", label: "At least one special character (!@#$%...)", met: false, required: requireSpecial },
      { id: "hasUppercase", label: "At least one uppercase letter (A-Z)", met: false, required: requireUppercase },
      { id: "hasLowercase", label: "At least one lowercase letter (a-z)", met: false, required: requireLowercase },
    ];

    return {
      score: 0,
      percentage: 0,
      strengthLabel: "Empty",
      isValid: false,
      rules: defaultRules,
      colorClasses: {
        text: "text-slate-400 dark:text-slate-500",
        bg: "bg-slate-100 dark:bg-slate-800",
        bar: "bg-slate-200 dark:bg-slate-700",
        border: "border-slate-200 dark:border-slate-700",
        pill: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
      },
      errors: ["Password is required"],
    };
  }

  const isMinLength = password.length >= minLength;
  const hasNum = /[0-9]/.test(password);
  const hasSpec = /[^A-Za-z0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);

  const rules: PasswordRule[] = [
    {
      id: "minLength",
      label: `At least ${minLength} characters (${password.length}/${minLength})`,
      met: isMinLength,
      required: true,
    },
    {
      id: "hasNumber",
      label: "At least one number (0-9)",
      met: hasNum,
      required: requireNumber,
    },
    {
      id: "hasSpecial",
      label: "At least one special character (!@#$%^&*)",
      met: hasSpec,
      required: requireSpecial,
    },
    {
      id: "hasUppercase",
      label: "At least one uppercase letter (A-Z)",
      met: hasUpper,
      required: requireUppercase,
    },
    {
      id: "hasLowercase",
      label: "At least one lowercase letter (a-z)",
      met: hasLower,
      required: requireLowercase,
    },
  ];

  // Calculate score based on total passed checks and length bonuses
  let passedCount = 0;
  if (isMinLength) passedCount++;
  if (hasNum) passedCount++;
  if (hasSpec) passedCount++;
  if (hasUpper) passedCount++;
  if (hasLower) passedCount++;

  // Length bonus for extra resilience (12+ characters)
  if (password.length >= 12 && isMinLength) {
    passedCount += 0.5;
  }

  // Determine required criteria satisfaction
  const missingRequired = rules.filter((r) => r.required && !r.met);
  const isValid = missingRequired.length === 0;

  const errors = missingRequired.map((r) => r.label);

  let score = 0;
  let percentage = 0;
  let strengthLabel: PasswordValidationResult["strengthLabel"] = "Very Weak";
  let colorClasses = {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    bar: "bg-red-500",
    border: "border-red-200 dark:border-red-900/50",
    pill: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  if (passedCount >= 5) {
    score = 4;
    percentage = 100;
    strengthLabel = "Very Strong";
    colorClasses = {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      bar: "bg-emerald-500",
      border: "border-emerald-200 dark:border-emerald-900/50",
      pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    };
  } else if (passedCount >= 4) {
    score = 3;
    percentage = 75;
    strengthLabel = "Strong";
    colorClasses = {
      text: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
      bar: "bg-teal-500",
      border: "border-teal-200 dark:border-teal-900/50",
      pill: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    };
  } else if (passedCount >= 3) {
    score = 2;
    percentage = 50;
    strengthLabel = "Medium";
    colorClasses = {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      bar: "bg-amber-500",
      border: "border-amber-200 dark:border-amber-900/50",
      pill: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    };
  } else if (passedCount >= 2) {
    score = 1;
    percentage = 25;
    strengthLabel = "Weak";
    colorClasses = {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      bar: "bg-orange-500",
      border: "border-orange-200 dark:border-orange-900/50",
      pill: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    };
  }

  return {
    score,
    percentage,
    strengthLabel,
    isValid,
    rules,
    colorClasses,
    errors,
  };
}

/**
 * Reusable Password Strength & Validation Component
 * Enforces length, special characters, numbers, and case requirements.
 */
export const PasswordStrengthValidator: React.FC<PasswordStrengthValidatorProps> = ({
  password,
  minLength = 8,
  requireNumber = true,
  requireSpecial = true,
  requireUppercase = true,
  requireLowercase = true,
  showRulesList = true,
  showStrengthBar = true,
  showSummaryBadge = true,
  className = "",
  id = "password-strength-validator",
  onValidationChange,
}) => {
  const result = useMemo(() => {
    return validatePasswordStrength(password, {
      minLength,
      requireNumber,
      requireSpecial,
      requireUppercase,
      requireLowercase,
    });
  }, [password, minLength, requireNumber, requireSpecial, requireUppercase, requireLowercase]);

  // Inform parent callback whenever validation status updates
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(result);
    }
  }, [result, onValidationChange]);

  if (!password && !showRulesList) {
    return null;
  }

  return (
    <div
      id={id}
      aria-live="polite"
      className={`space-y-2 text-xs transition-all duration-200 ${className}`}
    >
      {/* Visual Strength Meter Bar */}
      {showStrengthBar && password && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Password Strength:
              </span>
            </div>
            {showSummaryBadge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-colors ${result.colorClasses.pill}`}
              >
                {result.strengthLabel}
              </span>
            )}
          </div>

          {/* 4-Segment Visual Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            {[1, 2, 3, 4].map((step) => {
              const isFilled = result.score >= step;
              return (
                <div
                  key={step}
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFilled ? result.colorClasses.bar : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Rules Criteria Breakdown */}
      {showRulesList && (
        <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 pb-0.5 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center space-x-1.5">
              {result.isValid ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>Security Requirements</span>
            </div>
            <span className={`text-[10px] font-bold ${result.isValid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {result.rules.filter((r) => r.met).length}/{result.rules.length} Met
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-0.5">
            {result.rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center space-x-1.5 text-[11px] transition-colors ${
                  rule.met
                    ? "text-emerald-700 dark:text-emerald-400 font-medium"
                    : password
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    rule.met
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                  }`}
                >
                  {rule.met ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <X className="w-2 h-2 stroke-[2.5]" />
                  )}
                </div>
                <span className="truncate">{rule.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthValidator;
