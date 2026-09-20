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
  const pushedRef = useRef<boolean>(false);

  useEffect(() => {
    if (pushedRef.current) return;

    const pushAd = () => {
      try {
        if (typeof window === "undefined" || !adRef.current) return;

        // Check if this specific ins element already has an ad or is initialized
        const status = adRef.current.getAttribute("data-adsbygoogle-status");
        if (status || adRef.current.innerHTML.trim().length > 0) {
          pushedRef.current = true;
          return;
        }

        // Verify that this specific element is in the DOM and uninitialized
        const unfilledIns = Array.from(
          document.querySelectorAll("ins.adsbygoogle:not([data-adsbygoogle-status])")
        );
        const isTargetUnfilled = unfilledIns.some(
          (el) => el === adRef.current && el.innerHTML.trim().length === 0
        );

        if (!isTargetUnfilled) {
          return;
        }

        pushedRef.current = true;
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // Silently handle any AdSense auto-ad race condition or ad-blocker interference
      }
    };

    // Small microtask delay to allow DOM mounting & attribute stabilization
    const timer = setTimeout(pushAd, 100);
    return () => clearTimeout(timer);
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
