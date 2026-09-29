import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AdSensePlaceholder } from "./AdSensePlaceholder";

interface StickyBottomAdBannerProps {
  isVisible?: boolean;
}

/**
 * Sticky Bottom AdSense Banner
 * Strictly follows Google AdSense Publisher Policies:
 * - Clear "ADVERTISEMENT" labeling to avoid accidental clicks.
 * - Prominent, accessible dismiss button.
 * - Disappears when modal/active tool workspace is engaged to prevent overlapping tool action buttons.
 * - Session-based dismissal.
 */
export const StickyBottomAdBanner: React.FC<StickyBottomAdBannerProps> = ({ isVisible = true }) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("pdfsun_ad_sticky_dismissed") === "true";
    }
    return false;
  });

  if (!isVisible || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pdfsun_ad_sticky_dismissed", "true");
    }
  };

  return (
    <aside
      aria-label="Sponsored Content"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 shadow-2xl transition-all duration-300 py-1 px-3 sm:px-6"
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center relative">
        {/* Compliance Header */}
        <div className="w-full flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest px-2 pb-0.5">
          <span>Advertisement</span>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex items-center space-x-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer p-0.5 rounded text-[10px]"
            title="Dismiss advertisement banner"
            aria-label="Dismiss advertisement"
          >
            <span>Close</span>
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Ad Placement */}
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
