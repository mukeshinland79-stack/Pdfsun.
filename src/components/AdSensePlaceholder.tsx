import React, { useEffect, useRef, useState } from "react";
import { isAdSenseApproved, ADSENSE_CONFIG } from "../utils/adSenseHelper";

interface AdSensePlaceholderProps {
  slotId?: string;
  adClient?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "leaderboard" | "banner";
  responsive?: boolean;
  className?: string;
  forceShow?: boolean;
}

/**
 * Clean, official Google AdSense Display Unit
 * Complies strictly with AdSense policies & Zero Blank-Space Architecture:
 * - When in Pre-Approval mode: completely suppressed to prevent blank white boxes and low-value content flags.
 * - When approved: zero-CLS container with dynamic fallback collapsing if unfilled.
 * - No hardcoded static "ADVERTISEMENT" labels above empty boxes.
 */
export const AdSensePlaceholder: React.FC<AdSensePlaceholderProps> = ({
  slotId,
  adClient = ADSENSE_CONFIG.client,
  format = "auto",
  responsive = true,
  className = "",
  forceShow = false,
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const approved = forceShow || isAdSenseApproved();

  useEffect(() => {
    if (!approved) return;

    try {
      if (typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setIsLoaded(true);
      }
    } catch (e) {
      // Ignore if AdBlocker or Auto-Ads already handled this
    }
  }, [approved]);

  // Zero Blank-Space Policy: If unapproved, render nothing to avoid empty white/gray boxes
  if (!approved) {
    return (
      <div
        className="ad-container ad-placeholder-box"
        style={{ display: "none", height: 0, margin: 0, padding: 0 }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`ad-container is-approved my-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-center items-center overflow-hidden adsense-slot-wrapper ${className}`}
      aria-label="Sponsored Space"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", textAlign: "center" }}
        data-ad-client={adClient}
        {...(slotId ? { "data-ad-slot": slotId } : {})}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

