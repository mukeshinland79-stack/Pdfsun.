import React, { useState, useEffect } from "react";
import {
  X,
  Smartphone,
  Download,
  ShieldCheck,
  Lock,
  Sparkles,
  ChevronRight,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { AdSensePlaceholder } from "./AdSensePlaceholder";
import { isAdSenseApproved } from "../utils/adSenseHelper";
import { usePWAStatus } from "../pwaRegister";

interface StickyBottomAdBannerProps {
  isVisible?: boolean;
  onOpenInstallApp?: () => void;
}

/**
 * High-Trust PWA / Security Value Bar & Sticky AdSense Controller
 * 
 * Strictly replaces empty ad placeholders with high-converting engagement boosters:
 * - Option A (Primary): PWA / App Install Bar
 *   "Fast, 100% Private & Free PDF Utilities — Install App / Add to Home Screen"
 * - Option B (Secondary / Fallback): Security & Privacy Trust Badge
 *   "100% Client-Side Processing | Client Data Privacy Secured | Files Auto-Deleted | No Signup Required"
 * - Max height 60px on mobile, 80px on desktop
 * - Subtle dismiss/close (X) button
 * - Zero hardcoded "ADVERTISEMENT" labels and zero empty white boxes
 */
export const StickyBottomAdBanner: React.FC<StickyBottomAdBannerProps> = ({
  isVisible = true,
  onOpenInstallApp,
}) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("pdfsun_sticky_valbar_dismissed") === "true";
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<"pwa" | "privacy">("pwa");
  const { isInstalled, hasNativePrompt, installPWA } = usePWAStatus();
  const approved = isAdSenseApproved();

  // Gentle auto-rotate between PWA install bar and Privacy badge every 8 seconds on small screens
  useEffect(() => {
    if (approved) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === "pwa" ? "privacy" : "pwa"));
    }, 8000);
    return () => clearInterval(timer);
  }, [approved]);

  if (!isVisible || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pdfsun_sticky_valbar_dismissed", "true");
    }
  };

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      await installPWA();
    } else if (onOpenInstallApp) {
      onOpenInstallApp();
    }
  };

  // Pre-Approval State: Render High-Trust PWA & Security Value Bar
  if (!approved) {
    return (
      <aside
        aria-label="PDFSun App & Privacy Guarantee"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 shadow-2xl transition-all duration-300 py-1.5 px-3 sm:px-6 max-h-[64px] sm:max-h-[76px] flex items-center"
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex items-center space-x-3 sm:space-x-4">
            {/* Desktop View: Both Option A (PWA) and Option B (Trust Badge) Visible */}
            <div className="hidden lg:flex items-center space-x-6 flex-1 min-w-0">
              {/* Option A: PWA Bar */}
              <div className="flex items-center space-x-2.5 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
                  <Smartphone className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    Fast, 100% Private &amp; Free PDF Utilities
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1.5">
                    — Install App / Add to Home Screen
                  </span>
                </div>
              </div>

              {/* Option B: Security & Privacy Trust Badge */}
              <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-6 text-xs text-slate-600 dark:text-slate-400 shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium truncate">
                  100% Client-Side Processing • Client Data Privacy Secured • Files Auto-Deleted • No Signup
                </span>
              </div>
            </div>

            {/* Mobile / Tablet View: Interactive Compact Tab Swapper */}
            <div className="flex lg:hidden items-center space-x-2.5 flex-1 min-w-0">
              {activeTab === "pwa" ? (
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate">
                      Fast &amp; 100% Private PDF Utilities
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Install Free App to Home Screen
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs font-black text-emerald-700 dark:text-emerald-300 truncate">
                      100% Client-Side Processing
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Files Auto-Deleted • Zero Data Retention
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs & Dismiss Button */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Install CTA Button */}
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center space-x-1.5 cursor-pointer active:scale-95 transition"
                aria-label="Install PDFSun App to Home Screen"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">Install App</span>
                <span className="xs:hidden">Install</span>
              </button>
            )}

            {/* Close / Dismiss (X) Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Post-Approval State: Standard AdSense Banner
  return (
    <aside
      aria-label="Sponsored Space"
      className="ad-container is-approved fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 shadow-2xl transition-all duration-300 py-1 px-3 sm:px-6"
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center relative">
        <div className="w-full flex items-center justify-end px-2 pb-0.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex items-center space-x-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer p-0.5 rounded text-[10px]"
            title="Dismiss banner"
            aria-label="Dismiss banner"
          >
            <span>Close</span>
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="w-full max-h-[90px] overflow-hidden flex items-center justify-center">
          <AdSensePlaceholder
            slotId="pdfsun-sticky-bottom-banner"
            format="horizontal"
            className="my-0 py-0"
          />
        </div>
      </div>
    </aside>
  );
};
