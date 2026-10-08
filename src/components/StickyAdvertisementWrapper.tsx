import React, { useState, useEffect, useRef } from "react";
import { AdSensePlaceholder } from "./AdSensePlaceholder";
import { TrendingToolsQuickHub } from "./TrendingToolsQuickHub";
import { isAdSenseApproved } from "../utils/adSenseHelper";
import { ToolItem } from "../types";

interface StickyAdvertisementWrapperProps {
  slotId?: string;
  className?: string;
  onSelectTool?: (tool: ToolItem) => void;
}

/**
 * Enterprise-Grade Sticky Engagement & AdSense Slot Controller
 * 
 * Pre-Approval State:
 * - Renders the "Trending PDF & AI Tools Quick-Hub" engagement booster
 * - No empty boxes, zero CLS, zero hardcoded ADVERTISEMENT text
 * 
 * Post-Approval State:
 * - Renders compliant AdSense banner with reserved CLS bounds
 */
export const StickyAdvertisementWrapper: React.FC<StickyAdvertisementWrapperProps> = ({
  slotId = "pdfsun-sticky-copilot-banner",
  className = "",
  onSelectTool,
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const approved = isAdSenseApproved();

  useEffect(() => {
    if (!approved) return;

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
  }, [approved]);

  // Pre-Approval State: Replace empty ad container with Trending Tools Quick-Hub
  if (!approved) {
    return (
      <div className={`w-full ${className}`}>
        <TrendingToolsQuickHub
          onSelectTool={onSelectTool || (() => {})}
          className="my-4"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="sticky-ad-copilot-wrapper"
      className={`ad-container is-approved w-full transition-all duration-300 relative z-30 ${
        isSticky
          ? "sticky top-16 md:top-20 py-2 shadow-lg backdrop-blur-md bg-white/95 dark:bg-[#0b1120]/95 border-y border-slate-200/80 dark:border-slate-800/80 rounded-2xl"
          : "py-2"
      } ${className}`}
      aria-label="Sponsored Space"
    >
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
        {/* Ad Container with Reserved CLS Box */}
        <div className="relative min-h-[90px] md:min-h-[120px] max-h-[20vh] w-full rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-center items-center overflow-hidden transition-shadow">
          {/* AdSense Display Unit - Label only dynamically shown when ad is filled */}
          <div className="w-full flex justify-center items-center">
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

