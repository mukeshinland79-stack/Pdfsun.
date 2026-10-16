import React, { useState } from "react";
import { ShieldCheck, Sparkles, Info, X, Check, Lock } from "lucide-react";
import { getToolPrivacyDetails, ToolPrivacyMode } from "../data/privacyModes";

interface PrivacyBadgeProps {
  toolId?: string;
  mode?: ToolPrivacyMode;
  variant?: "compact" | "banner" | "card";
  className?: string;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  toolId = "default",
  mode: explicitMode,
  variant = "compact",
  className = "",
}) => {
  const [showModal, setShowModal] = useState(false);
  const details = getToolPrivacyDetails(explicitMode ? (explicitMode === "ai_cloud" ? "ai-chat-pdf" : "merge-pdf") : toolId);

  const isAi = details.mode === "ai_cloud";

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            isAi
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
          } ${className}`}
          title="Click to view privacy & data security guarantee"
        >
          {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{isAi ? "AI Cloud (Zero Storage)" : "100% In-Browser"}</span>
          <Info className="w-3 h-3 opacity-60 ml-0.5" />
        </button>

        {showModal && (
          <PrivacyModal details={details} onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  if (variant === "banner") {
    return (
      <>
        <div
          className={`w-full rounded-2xl p-4 sm:p-5 border transition-all ${
            isAi
              ? "bg-amber-500/5 border-amber-500/20 text-neutral-800 dark:text-neutral-200"
              : "bg-emerald-500/5 border-emerald-500/20 text-neutral-800 dark:text-neutral-200"
          } ${className}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isAi
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isAi ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-sm sm:text-base">
                    {details.badgeLabel}
                  </h5>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isAi
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    Privacy First
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
                  {details.shortDescription}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold underline underline-offset-4 text-neutral-500 hover:text-neutral-900 dark:hover:text-white shrink-0 pt-1"
            >
              Learn More
            </button>
          </div>
        </div>

        {showModal && (
          <PrivacyModal details={details} onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  // Card variant
  return (
    <>
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
          isAi
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-emerald-500/5 border-emerald-500/20"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          {isAi ? (
            <Sparkles className="w-4 h-4 text-amber-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            {details.badgeLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
        >
          Details
        </button>
      </div>

      {showModal && (
        <PrivacyModal details={details} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

const PrivacyModal: React.FC<{ details: ReturnType<typeof getToolPrivacyDetails>; onClose: () => void }> = ({
  details,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl text-neutral-900 dark:text-neutral-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                details.mode === "ai_cloud"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {details.mode === "ai_cloud" ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <h3 className="font-bold text-base">{details.badgeLabel}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {details.fullStatement}
        </p>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Security Guarantee
          </p>
          <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
            {details.certifications.map((cert) => (
              <li key={cert} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
};
