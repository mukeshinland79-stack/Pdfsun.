import React, { useState, useEffect, useRef } from "react";
import { AdSensePlaceholder } from "./AdSensePlaceholder";

interface StickyAdvertisementWrapperProps {
  slotId?: string;
  className?: string;
}

/**
 * Enterprise-Grade Sticky Advertisement Wrapper
 * 
 * Strict AdSense & Google Core Web Vitals Guardrails:
 * 1. Zero Cumulative Layout Shift (CLS = 0.00):
 *    Reserves explicit min-height (90px mobile, 120px desktop) before ad script hydrates.
 * 2. AdSense Policy Safe:
 *    Displays unambiguous 'ADVERTISEMENT' micro-label.
 *    Capped to maximum 20% viewport height on mobile to prevent intrusive anchor violations.
 * 3. Sticky Engagement:
 *    Sticky positioning with smooth transition as user scrolls past Today in History.
 */
export const StickyAdvertisementWrapper: React.FC<StickyAdvertisementWrapperProps> = ({
  slotId = "pdfsun-sticky-copilot-banner",
  className = "",
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Trigger sticky state when near top below sticky header (~64px)
        setIsSticky(rect.top <= 80);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      id="sticky-ad-copilot-wrapper"
      className={`w-full transition-all duration-300 relative z-30 ${
        isSticky
          ? "sticky top-16 md:top-20 py-2 shadow-lg backdrop-blur-md bg-white/95 dark:bg-[#0b1120]/95 border-y border-slate-200/80 dark:border-slate-800/80 rounded-2xl"
          : "py-2"
      } ${className}`}
      aria-label="Sponsored Advertisement Space"
    >
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
        {/* Ad Container with Reserved CLS Box & Policy Overlay */}
        <div className="relative min-h-[90px] md:min-h-[120px] max-h-[20vh] w-full rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-center items-center overflow-hidden transition-shadow">
          {/* Subtle Policy-Compliant Label Overlay in Upper Left */}
          <div className="absolute top-1.5 left-3 z-10 select-none pointer-events-none">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400/80 dark:text-slate-500/80 uppercase">
              ADVERTISEMENT
            </span>
          </div>

          {/* AdSense Display Unit */}
          <div className="w-full flex justify-center items-center pt-2">
            <AdSensePlaceholder
              slotId={slotId}
              format="horizontal"
              responsive={true}
              className="my-0 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
