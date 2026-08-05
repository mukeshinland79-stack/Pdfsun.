import React from "react";

export interface PDFSunLogoIconProps {
  size?: number | string;
  variant?:
    | "default"
    | "glass"
    | "rounded-square"
    | "circle"
    | "app-icon"
    | "monochrome-dark"
    | "monochrome-light"
    | "gold";
  className?: string;
  animated?: boolean;
}

/**
 * PDFSun.in Master Vector Logo Icon
 * Combines Folded PDF Document + Rising Sun + AI Glow Sparkle + Precision Geometry
 */
export const PDFSunLogoIcon: React.FC<PDFSunLogoIconProps> = ({
  size = 40,
  variant = "default",
  className = "",
  animated = false,
}) => {
  const isMonoDark = variant === "monochrome-dark";
  const isMonoLight = variant === "monochrome-light";

  if (variant === "rounded-square" || variant === "app-icon") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center rounded-[22%] bg-gradient-to-br from-slate-950 via-[#0B3D91] to-slate-900 shadow-xl shadow-blue-900/40 p-[12%] overflow-hidden border border-white/10 ${className}`}
      >
        {/* Soft background glow */}
        <div className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 bg-gradient-to-br from-[#FF7A00]/40 to-[#FFC107]/20 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 bg-gradient-to-tr from-[#2563EB]/40 to-[#7C3AED]/20 rounded-full blur-xl pointer-events-none" />

        <PDFSunLogoSvg animated={animated} isMonoDark={false} isMonoLight={false} />
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-tr from-[#0B3D91] via-[#1E40AF] to-[#2563EB] shadow-lg shadow-blue-600/30 p-[15%] overflow-hidden border border-white/20 ${className}`}
      >
        <PDFSunLogoSvg animated={animated} isMonoDark={false} isMonoLight={false} />
      </div>
    );
  }

  if (variant === "glass") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-md p-[10%] border border-slate-700/80 shadow-lg ${className}`}
      >
        <PDFSunLogoSvg animated={animated} isMonoDark={false} isMonoLight={false} />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 ${className}`}
    >
      <PDFSunLogoSvg
        animated={animated}
        isMonoDark={isMonoDark}
        isMonoLight={isMonoLight}
      />
    </div>
  );
};

interface SVGInnerProps {
  animated?: boolean;
  isMonoDark?: boolean;
  isMonoLight?: boolean;
}

const PDFSunLogoSvg: React.FC<SVGInnerProps> = ({
  animated = false,
  isMonoDark = false,
  isMonoLight = false,
}) => {
  // Unique gradient IDs to prevent DOM duplicate ID collisions
  const uid = React.useId().replace(/:/g, "_");

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full overflow-visible"
    >
      <defs>
        {/* PDF Blue Document Gradient */}
        <linearGradient id={`${uid}-pdfGrad`} x1="10" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="60%" stopColor="#0B3D91" />
          <stop offset="100%" stopColor="#09275E" />
        </linearGradient>

        {/* Rising Sun Gradient */}
        <linearGradient id={`${uid}-sunGrad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF566" />
          <stop offset="45%" stopColor="#FFC107" />
          <stop offset="90%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>

        {/* AI Glow Sparkle Gradient */}
        <linearGradient id={`${uid}-aiGrad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>

        {/* Fold Corner Gradient */}
        <linearGradient id={`${uid}-foldGrad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0B3D91" floodOpacity="0.35" />
        </filter>

        <filter id={`${uid}-sunGlow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FF7A00" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* RISING SUN & RAYS (Behind Document) */}
      {!isMonoDark && !isMonoLight && (
        <g className={animated ? "animate-pulse" : ""}>
          {/* Sun Rays Halo */}
          <circle
            cx="68"
            cy="32"
            r="26"
            fill={`url(#${uid}-sunGrad)`}
            opacity="0.25"
            filter={`url(#${uid}-sunGlow)`}
          />
          {/* Sun Disk */}
          <circle cx="68" cy="32" r="18" fill={`url(#${uid}-sunGrad)`} filter={`url(#${uid}-sunGlow)`} />
          
          {/* Rays emanating */}
          <line x1="68" y1="8" x2="68" y2="2" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="88" y1="12" x2="93" y2="7" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="92" y1="32" x2="98" y2="32" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="88" y1="52" x2="93" y2="57" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {/* MAIN PDF FOLDED DOCUMENT */}
      <g filter={`url(#${uid}-shadow)`}>
        {/* Main Document Body Path (with Folded Top Right) */}
        <path
          d="M 22 14 C 18 14, 15 17, 15 21 L 15 81 C 15 85, 18 88, 22 88 L 68 88 C 72 88, 75 85, 75 81 L 75 38 L 51 14 Z"
          fill={
            isMonoDark
              ? "#000000"
              : isMonoLight
              ? "#FFFFFF"
              : `url(#${uid}-pdfGrad)`
          }
          stroke={isMonoLight ? "#E2E8F0" : "none"}
          strokeWidth={isMonoLight ? "2" : "0"}
        />

        {/* Fold Corner Sheet */}
        <path
          d="M 51 14 L 75 38 L 56 38 C 53 38, 51 36, 51 33 Z"
          fill={
            isMonoDark
              ? "#333333"
              : isMonoLight
              ? "#CBD5E1"
              : `url(#${uid}-foldGrad)`
          }
        />

        {/* Document Inner Text Lines (Symbolizing PDF Document Structure) */}
        <rect
          x="25"
          y="46"
          width="36"
          height="4.5"
          rx="2.25"
          fill={isMonoDark ? "#FFFFFF" : isMonoLight ? "#000000" : "#FFFFFF"}
          opacity="0.9"
        />
        <rect
          x="25"
          y="56"
          width="44"
          height="4.5"
          rx="2.25"
          fill={isMonoDark ? "#FFFFFF" : isMonoLight ? "#000000" : "#60A5FA"}
          opacity="0.85"
        />
        <rect
          x="25"
          y="66"
          width="28"
          height="4.5"
          rx="2.25"
          fill={isMonoDark ? "#FFFFFF" : isMonoLight ? "#000000" : "#FFC107"}
          opacity="0.9"
        />

        {/* SMART AI SPARKLE / GLOW STAR (At Center of Page) */}
        {!isMonoDark && !isMonoLight && (
          <g transform="translate(32, 28)">
            {/* 4-Point AI Sparkle Star */}
            <path
              d="M 8 0 C 8 4, 12 8, 16 8 C 12 8, 8 12, 8 16 C 8 12, 4 8, 0 8 C 4 8, 8 4, 8 0 Z"
              fill={`url(#${uid}-aiGrad)`}
              className={animated ? "animate-spin" : ""}
            />
            <circle cx="8" cy="8" r="2.5" fill="#FFFFFF" />
          </g>
        )}
      </g>
    </svg>
  );
};

export interface PDFSunLogoProps {
  layout?: "horizontal" | "vertical" | "icon-only" | "text-only";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  theme?: "light" | "dark" | "monochrome-dark" | "monochrome-light" | "auto";
  showTagline?: boolean;
  showDomain?: boolean;
  showProBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * PDFSun Full Logo Component
 * World-class branding typography and layout options for header, footer, app icons & guidelines.
 */
export const PDFSunLogo: React.FC<PDFSunLogoProps> = ({
  layout = "horizontal",
  size = "md",
  theme = "auto",
  showTagline = false,
  showDomain = true,
  showProBadge = true,
  onClick,
  className = "",
}) => {
  // Size metrics
  const sizeMap = {
    xs: { icon: 24, text: "text-base", domain: "text-[9px]", badge: "text-[8px]" },
    sm: { icon: 32, text: "text-lg", domain: "text-[10px]", badge: "text-[9px]" },
    md: { icon: 40, text: "text-xl", domain: "text-[10px]", badge: "text-[9px]" },
    lg: { icon: 52, text: "text-2xl", domain: "text-xs", badge: "text-[10px]" },
    xl: { icon: 68, text: "text-4xl", domain: "text-sm", badge: "text-xs" },
    hero: { icon: 96, text: "text-6xl", domain: "text-lg", badge: "text-sm" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (layout === "icon-only") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center justify-center ${onClick ? "cursor-pointer hover:scale-105 transition" : ""} ${className}`}
        title="PDFSun Logo"
        aria-label="PDFSun Logo"
      >
        <PDFSunLogoIcon
          size={currentSize.icon}
          variant={
            theme === "monochrome-dark"
              ? "monochrome-dark"
              : theme === "monochrome-light"
              ? "monochrome-light"
              : "default"
          }
        />
      </button>
    );
  }

  const isDarkText = theme === "monochrome-light" || theme === "light";
  const isMonoDark = theme === "monochrome-dark";
  const isMonoLight = theme === "monochrome-light";

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${
        layout === "vertical" ? "flex-col text-center space-y-2" : "space-x-3"
      } ${onClick ? "cursor-pointer group" : ""} ${className}`}
      title="PDFSun - Your Smart Document Companion"
    >
      {/* Icon Mark */}
      <div className={`${onClick ? "group-hover:scale-105 transition duration-200" : ""}`}>
        <PDFSunLogoIcon
          size={currentSize.icon}
          variant={
            isMonoDark
              ? "monochrome-dark"
              : isMonoLight
              ? "monochrome-light"
              : "default"
          }
          animated={onClick !== undefined}
        />
      </div>

      {/* Typography Stack */}
      <div className={`flex flex-col ${layout === "vertical" ? "items-center" : "items-start"}`}>
        <div className="flex items-center space-x-1.5 leading-none">
          {/* PDF portion */}
          <span
            className={`font-black tracking-tight ${currentSize.text} ${
              isMonoDark
                ? "text-black"
                : isMonoLight
                ? "text-white"
                : "text-slate-900 dark:text-white"
            }`}
          >
            PDF
          </span>

          {/* Sun portion */}
          <span
            className={`font-black tracking-tight ${currentSize.text} ${
              isMonoDark
                ? "text-slate-700"
                : isMonoLight
                ? "text-slate-200"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            Sun
          </span>

          {/* Pro / AI Badge */}
          {showProBadge && (
            <span
              className={`font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${currentSize.badge} ${
                isMonoDark || isMonoLight
                  ? "border-current opacity-70"
                  : "bg-gradient-to-r from-blue-500/10 to-amber-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-xs"
              }`}
            >
              PRO AI
            </span>
          )}
        </div>

        {/* Sub-line: domain or tagline */}
        <div className="flex items-center space-x-2 mt-0.5">
          {showDomain && (
            <span
              className={`font-bold font-mono tracking-wider ${currentSize.domain} ${
                isMonoDark
                  ? "text-slate-600"
                  : isMonoLight
                  ? "text-slate-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              pdfsun.in
            </span>
          )}

          {showTagline && (
            <span
              className={`font-medium ${currentSize.domain} ${
                isMonoDark
                  ? "text-slate-500"
                  : isMonoLight
                  ? "text-slate-300"
                  : "text-slate-400 dark:text-slate-400"
              }`}
            >
              • Your Smart Document Companion
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
