import React, { useEffect, useRef } from "react";

interface AdSensePlaceholderProps {
  slotId?: string;
  adClient?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "leaderboard" | "banner";
  responsive?: boolean;
  className?: string;
}

/**
 * Clean, official Google AdSense Display Unit
 * Complies strictly with AdSense policies: No fake fallback banners, no deceptive labels.
 */
export const AdSensePlaceholder: React.FC<AdSensePlaceholderProps> = ({
  slotId,
  adClient = "ca-pub-4189458265489554",
  format = "auto",
  responsive = true,
  className = "",
}) => {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      // Ignore if AdBlocker or Auto-Ads already handled this
    }
  }, []);

  return (
    <div
      className={`my-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-center items-center overflow-hidden adsense-slot-wrapper ${className}`}
      aria-label="Advertisement"
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
