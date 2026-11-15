import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Shield, CheckCircle2 } from "lucide-react";

export interface PasswordPolicyTooltipProps {
  policyText?: string;
  minLength?: number;
  className?: string;
  iconClassName?: string;
  tooltipId?: string;
}

/**
 * Reusable inline '?' help tooltip for password security policy clarity.
 * Provides accessible, hoverable, and tappable tooltip popup.
 */
export const PasswordPolicyTooltip: React.FC<PasswordPolicyTooltipProps> = ({
  policyText = "Minimum 8 characters, including at least 1 number (0-9) and 1 special symbol (!@#$%).",
  minLength = 8,
  className = "",
  iconClassName = "",
  tooltipId = "password-policy-tooltip",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={`${tooltipId}-btn`}
        aria-label="View password security requirements"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer inline-flex items-center justify-center ${iconClassName}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {/* Floating Tooltip Bubble */}
      {isOpen && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 dark:border dark:border-slate-700 shadow-xl shadow-slate-900/30 text-left pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center space-x-1.5 pb-1.5 border-b border-slate-800 dark:border-slate-700 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-red-400 dark:text-red-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-100 tracking-wide uppercase">
              Password Security Policy
            </span>
          </div>

          <p className="text-[11px] text-slate-300 dark:text-slate-300 leading-relaxed font-medium">
            {policyText}
          </p>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 dark:border-slate-700/80 grid grid-cols-2 gap-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              Min. {minLength} characters
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              1+ Number (0-9)
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              1+ Symbol (!@#$)
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              Uppercase & Lowercase
            </span>
          </div>

          {/* Pointer Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
        </div>
      )}
    </div>
  );
};

export default PasswordPolicyTooltip;
