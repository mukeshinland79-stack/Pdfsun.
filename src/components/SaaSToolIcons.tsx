import React from "react";

export interface SaaSIconProps {
  size?: number;
  className?: string;
  withCard?: boolean;
}

/**
 * 1. AI Document Summary:
 * Clean multi-page document layout in deep indigo text skeleton lines,
 * featuring soft glowing golden-amber and cyan magic sparkle particles hovering overhead.
 */
export const AiSummarySaaSIcon: React.FC<SaaSIconProps> = ({
  size = 24,
  className = "",
  withCard = false,
}) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Document Summary Icon"
    >
      <defs>
        <linearGradient id="docSummBg" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EEF2FF" />
          <stop offset="1" stopColor="#E0E7FF" />
        </linearGradient>
        <linearGradient id="docSummBack" x1="12" y1="8" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C7D2FE" stopOpacity="0.7" />
          <stop offset="1" stopColor="#A5B4FC" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="sparkleAmber" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="sparkleCyan" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#06B6D4" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <filter id="glowSumm" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Back Page Shadow & Offset Sheet */}
      <rect
        x="13"
        y="11"
        width="34"
        height="44"
        rx="5"
        fill="url(#docSummBack)"
        stroke="#818CF8"
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />

      {/* Foreground Document Page */}
      <rect
        x="17"
        y="15"
        width="34"
        height="43"
        rx="5"
        fill="url(#docSummBg)"
        stroke="#4F46E5"
        strokeWidth="1.5"
      />

      {/* Deep Indigo Skeleton Text Lines */}
      <rect x="23" y="23" width="14" height="2.5" rx="1.25" fill="#312E81" />
      <rect x="23" y="29" width="22" height="2" rx="1" fill="#4338CA" fillOpacity="0.8" />
      <rect x="23" y="34" width="20" height="2" rx="1" fill="#4338CA" fillOpacity="0.8" />
      <rect x="23" y="39" width="16" height="2" rx="1" fill="#4338CA" fillOpacity="0.8" />
      <rect x="23" y="44" width="22" height="2" rx="1" fill="#6366F1" fillOpacity="0.7" />
      <rect x="23" y="49" width="12" height="2" rx="1" fill="#818CF8" fillOpacity="0.6" />

      {/* Golden-amber Magic Sparkle (Upper Right) */}
      <g filter="url(#glowSumm)">
        <path
          d="M48 9 C48 13.5, 49.5 15, 54 15 C49.5 15, 48 16.5, 48 21 C48 16.5, 46.5 15, 42 15 C46.5 15, 48 13.5, 48 9 Z"
          fill="url(#sparkleAmber)"
        />
        {/* Cyan Sparkle Particle */}
        <circle cx="39" cy="10" r="1.75" fill="url(#sparkleCyan)" />
        <circle cx="56" cy="22" r="1.25" fill="url(#sparkleCyan)" />
      </g>
    </svg>
  );

  return withCard ? wrapWithCard(svg, size) : svg;
};

/**
 * 2. AI Translate PDF:
 * Crisp document sheet paired with elegant bidirectional language arrows
 * (A ↔ 文 style) encircling the center, wrapped in a soft translucent purple-to-indigo translation glow.
 */
export const AiTranslateSaaSIcon: React.FC<SaaSIconProps> = ({
  size = 24,
  className = "",
  withCard = false,
}) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Translate PDF Icon"
    >
      <defs>
        <linearGradient id="transDocBg" x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5F3FF" />
          <stop offset="1" stopColor="#EDE9FE" />
        </linearGradient>
        <linearGradient id="transRing" x1="18" y1="20" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <radialGradient id="transGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft Translation Glow */}
      <circle cx="32" cy="32" r="22" fill="url(#transGlow)" />

      {/* Crisp Document Sheet */}
      <rect
        x="15"
        y="12"
        width="34"
        height="42"
        rx="5"
        fill="url(#transDocBg)"
        stroke="#7C3AED"
        strokeWidth="1.5"
      />

      {/* Subtle Upper Header Line */}
      <rect x="21" y="19" width="14" height="2" rx="1" fill="#A78BFA" />

      {/* Center Circular Bidirectional Translation Orbit */}
      <circle
        cx="32"
        cy="33"
        r="11"
        stroke="url(#transRing)"
        strokeWidth="1.5"
        strokeDasharray="14 5"
        strokeLinecap="round"
      />

      {/* Arrow Heads */}
      <path d="M38 23.5 L42.5 24 L39.5 28" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 42.5 L21.5 42 L24.5 38" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Elegant Minimalist Language Symbols (A & 文 aesthetic vectors - zero plain text) */}
      {/* Abstract A symbol vector */}
      <path
        d="M26.5 35.5 L29 29.5 L31.5 35.5 M27.2 34 H30.8"
        stroke="#4C1D95"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Abstract East-Asian glyph vector */}
      <path
        d="M33.5 30 H38.5 M36 30 V31.5 M34 32.5 L37.5 36 M38 32.5 L34.5 36"
        stroke="#4338CA"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return withCard ? wrapWithCard(svg, size) : svg;
};

/**
 * 3. AI Notes Generator:
 * Floating open hardcover notebook with fine grid lines, an ultra-sleek metallic stylus pen
 * resting diagonally across the binding, and a delicate glowing coral-to-amber lightbulb accent.
 */
export const AiNotesSaaSIcon: React.FC<SaaSIconProps> = ({
  size = 24,
  className = "",
  withCard = false,
}) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Notes Generator Icon"
    >
      <defs>
        <linearGradient id="bookCover" x1="12" y1="16" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="bookPages" x1="14" y1="17" x2="50" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFDF7" />
          <stop offset="1" stopColor="#F8FAFC" />
        </linearGradient>
        <linearGradient id="stylusGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#E2E8F0" />
          <stop offset="0.5" stopColor="#94A3B8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="bulbAccent" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FB7185" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Floating Notebook Hardcover Shadow & Body */}
      <rect x="11" y="16" width="42" height="35" rx="4" fill="url(#bookCover)" />
      
      {/* Open Left & Right Pages */}
      <path
        d="M13 18 C19 18 29 19 31.5 21 L31.5 48 C29 46.5 19 46 13 46 Z"
        fill="url(#bookPages)"
        stroke="#CBD5E1"
        strokeWidth="0.8"
      />
      <path
        d="M51 18 C45 18 35 19 32.5 21 L32.5 48 C35 46.5 45 46 51 46 Z"
        fill="url(#bookPages)"
        stroke="#CBD5E1"
        strokeWidth="0.8"
      />

      {/* Fine Grid / Ruled Lines on Pages */}
      <path d="M16 26 H28 M16 32 H28 M16 38 H27" stroke="#E2E8F0" strokeWidth="1" strokeLinecap="round" />
      <path d="M36 26 H48 M36 32 H48 M36 38 H47" stroke="#E2E8F0" strokeWidth="1" strokeLinecap="round" />

      {/* Notebook Center Binding Groove */}
      <line x1="32" y1="19" x2="32" y2="49" stroke="#94A3B8" strokeWidth="1.2" />

      {/* Metallic Stylus Resting Diagonally */}
      <g transform="rotate(28 32 32)">
        <rect x="30" y="10" width="3.5" height="36" rx="1.75" fill="url(#stylusGrad)" stroke="#334155" strokeWidth="0.8" />
        <polygon points="30,46 33.5,46 31.75,51" fill="#1E293B" />
        <rect x="30" y="12" width="3.5" height="3" fill="#F59E0B" />
      </g>

      {/* Delicate Glowing Coral-to-Amber Lightbulb Accent in Corner */}
      <g transform="translate(42, 6)">
        <circle cx="8" cy="8" r="7" fill="url(#bulbAccent)" fillOpacity="0.2" />
        {/* Minimal Bulb Outline */}
        <path
          d="M8 3.5 C5.8 3.5 4 5.3 4 7.5 C4 9 4.8 10.2 6 11 L6 12.5 H10 L10 11 C11.2 10.2 12 9 12 7.5 C12 5.3 10.2 3.5 8 3.5 Z"
          fill="url(#bulbAccent)"
        />
        <rect x="6.5" y="13" width="3" height="1" rx="0.5" fill="#F59E0B" />
      </g>
    </svg>
  );

  return withCard ? wrapWithCard(svg, size) : svg;
};

/**
 * 4. AI Flashcards:
 * Two neatly stacked floating flashcards displaying soft structural lines,
 * enclosed by a smooth circular flip/refresh arrow with a refined emerald green to cyan gradient accent edge.
 */
export const AiFlashcardsSaaSIcon: React.FC<SaaSIconProps> = ({
  size = 24,
  className = "",
  withCard = false,
}) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Flashcards Icon"
    >
      <defs>
        <linearGradient id="cardGradEdge" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="cardFront" x1="20" y1="20" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#ECFDF5" />
        </linearGradient>
      </defs>

      {/* Back Stacked Card (Tilted 7deg) */}
      <g transform="rotate(-6 28 32)">
        <rect
          x="18"
          y="18"
          width="28"
          height="28"
          rx="5"
          fill="#D1FAE5"
          stroke="#6EE7B7"
          strokeWidth="1.2"
        />
        <rect x="23" y="25" width="14" height="2" rx="1" fill="#A7F3D0" />
        <rect x="23" y="30" width="18" height="2" rx="1" fill="#A7F3D0" />
      </g>

      {/* Front Card (Active Focus) */}
      <rect
        x="18"
        y="18"
        width="28"
        height="28"
        rx="5"
        fill="url(#cardFront)"
        stroke="url(#cardGradEdge)"
        strokeWidth="1.6"
      />

      {/* Soft Structural Lines on Front Card */}
      <rect x="24" y="25" width="16" height="2.5" rx="1.25" fill="#047857" />
      <rect x="24" y="31" width="12" height="2" rx="1" fill="#10B981" fillOpacity="0.7" />
      <rect x="24" y="36" width="10" height="2" rx="1" fill="#06B6D4" fillOpacity="0.6" />

      {/* Circular Flip / Refresh Arrow */}
      <path
        d="M51 28 C53 35 50 43 43 47 C37 50 30 49 25 45"
        fill="none"
        stroke="url(#cardGradEdge)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polygon points="50,23 54,29 48,29" fill="#10B981" />

      {/* Bottom Reverse Flip Arc */}
      <path
        d="M13 36 C11 29 14 21 21 17 C27 14 34 15 39 19"
        fill="none"
        stroke="url(#cardGradEdge)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polygon points="14,41 10,35 16,35" fill="#06B6D4" />
    </svg>
  );

  return withCard ? wrapWithCard(svg, size) : svg;
};

/**
 * 5. AI Explain PDF:
 * Sapphire blue document outline with an elegantly integrated, floating question mark element
 * that seamlessly transforms into a soft glowing lightbulb of understanding.
 */
export const AiExplainSaaSIcon: React.FC<SaaSIconProps> = ({
  size = 24,
  className = "",
  withCard = false,
}) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Explain PDF Icon"
    >
      <defs>
        <linearGradient id="explainDoc" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EFF6FF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="sapphireGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Document Sheet Base */}
      <rect
        x="15"
        y="12"
        width="34"
        height="43"
        rx="5"
        fill="url(#explainDoc)"
        stroke="url(#sapphireGrad)"
        strokeWidth="1.5"
      />

      {/* Subtle Text Lines in Background */}
      <rect x="21" y="20" width="16" height="2" rx="1" fill="#93C5FD" />
      <rect x="21" y="44" width="22" height="2" rx="1" fill="#93C5FD" fillOpacity="0.7" />
      <rect x="21" y="49" width="14" height="2" rx="1" fill="#BFDBFE" fillOpacity="0.7" />

      {/* Glowing Soft Aura of Understanding */}
      <circle cx="32" cy="31" r="14" fill="url(#bulbGlow)" />

      {/* Question Mark transforming into Lightbulb */}
      {/* Lightbulb Dome / Curved Question Head Hybrid */}
      <path
        d="M26 27 C26 23.5 28.5 21 32 21 C35.5 21 38 23.5 38 26.5 C38 29.5 35 31 33.5 33 L33.5 35.5"
        fill="none"
        stroke="#1D4ED8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Bulb Filament / Base Contact */}
      <rect x="30.5" y="37" width="3" height="1.8" rx="0.9" fill="#F59E0B" />
      <circle cx="32" cy="41" r="1.3" fill="#F59E0B" />

      {/* Soft Radiating Ray Accents */}
      <line x1="32" y1="16" x2="32" y2="18" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="21" x2="23.5" y2="22.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="42" y1="21" x2="40.5" y2="22.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return withCard ? wrapWithCard(svg, size) : svg;
};

/**
 * 6. AI OCR (Text Recognition PRO):
 * Scanned document with precise cyan OCR alignment grid lines framing a highlighted region,
 * complete with a tiny, refined red gradient "PRO" badge with pill corners.
 */
export const AiOcrSaaSIcon: React.FC<SaaSIconProps> = ({
  size = 24,
  className = "",
  withCard = false,
}) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI OCR Text Recognition PRO Icon"
    >
      <defs>
        <linearGradient id="ocrDoc" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0FDFA" />
          <stop offset="1" stopColor="#E6FFFA" />
        </linearGradient>
        <linearGradient id="proPill" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#EF4444" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* Document Sheet */}
      <rect
        x="15"
        y="12"
        width="34"
        height="43"
        rx="5"
        fill="url(#ocrDoc)"
        stroke="#0D9488"
        strokeWidth="1.5"
      />

      {/* Precise Cyan OCR Alignment Reticle / Corner Brackets */}
      {/* Top Left Bracket */}
      <path d="M21 27 H25 M21 27 V31" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" />
      {/* Top Right Bracket */}
      <path d="M43 27 H39 M43 27 V31" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" />
      {/* Bottom Left Bracket */}
      <path d="M21 41 H25 M21 41 V37" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" />
      {/* Bottom Right Bracket */}
      <path d="M43 41 H39 M43 41 V37" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" />

      {/* Horizontal Laser Scanning Line */}
      <line x1="20" y1="34" x2="44" y2="34" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="2 2" />

      {/* Recognized Text Skeleton Inside Scanner Field */}
      <rect x="25" y="31" width="14" height="2" rx="1" fill="#0F766E" />
      <rect x="25" y="36" width="11" height="2" rx="1" fill="#0F766E" fillOpacity="0.8" />

      {/* Contextual Text Skeleton outside scanner */}
      <rect x="21" y="19" width="12" height="2" rx="1" fill="#99F6E4" />
      <rect x="21" y="47" width="18" height="2" rx="1" fill="#99F6E4" />

      {/* Refined Red Gradient PRO Badge with Pill Corners (Top Right) */}
      <rect x="36" y="8" width="19" height="9" rx="4.5" fill="url(#proPill)" filter="drop-shadow(0px 2px 4px rgba(239,68,68,0.3))" />
      {/* Geometric 'P' 'R' 'O' Micro glyph representations without font dependency */}
      <path d="M40 11 V14 M40 11 H42 C42.6 11 43 11.4 43 12 C43 12.6 42.6 13 42 13 H40" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M45 11 V14 M45 11 H46.8 C47.3 11 47.7 11.4 47.7 12 C47.7 12.6 47.3 13 46.8 13 H45 M46.5 13 L47.8 14" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="51.2" cy="12.5" r="1.3" stroke="#FFFFFF" strokeWidth="0.9" />
    </svg>
  );

  return withCard ? wrapWithCard(svg, size) : svg;
};

/**
 * 7. AI Resume Builder:
 * Executive structured CV document with a crisp profile silhouette inside a soft circle in the top corner,
 * supported by balanced horizontal section blocks in deep indigo to violet.
 */
export const AiResumeSaaSIcon: React.FC<SaaSIconProps> = ({
  size = 24,
  className = "",
  withCard = false,
}) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Resume Builder Icon"
    >
      <defs>
        <linearGradient id="resumeDoc" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAF5FF" />
          <stop offset="1" stopColor="#F3E8FF" />
        </linearGradient>
        <linearGradient id="resumeBlocks" x1="20" y1="20" x2="44" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Structured CV Document Base */}
      <rect
        x="15"
        y="12"
        width="34"
        height="43"
        rx="5"
        fill="url(#resumeDoc)"
        stroke="#7C3AED"
        strokeWidth="1.5"
      />

      {/* Profile Silhouette in Soft Circle (Top Left Corner of CV) */}
      <circle cx="24" cy="22" r="5" fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="1" />
      {/* Head */}
      <circle cx="24" cy="20.5" r="2" fill="#5B21B6" />
      {/* Shoulders */}
      <path d="M20.5 25 C20.5 23.5 22 23 24 23 C26 23 27.5 23.5 27.5 25" fill="#5B21B6" />

      {/* Header Info Lines (Next to Avatar) */}
      <rect x="32" y="19" width="13" height="2.5" rx="1.25" fill="#4338CA" />
      <rect x="32" y="23.5" width="9" height="1.8" rx="0.9" fill="#8B5CF6" fillOpacity="0.8" />

      {/* Section Divider Accent */}
      <line x1="20" y1="30" x2="44" y2="30" stroke="#C4B5FD" strokeWidth="1.2" />

      {/* Balanced Horizontal Section Blocks in Deep Indigo to Violet */}
      {/* Experience Block */}
      <rect x="20" y="34" width="8" height="2" rx="1" fill="#4338CA" />
      <rect x="20" y="38" width="24" height="2" rx="1" fill="url(#resumeBlocks)" fillOpacity="0.85" />
      <rect x="20" y="42" width="20" height="2" rx="1" fill="url(#resumeBlocks)" fillOpacity="0.7" />

      {/* Skills / Education Block */}
      <rect x="20" y="47" width="10" height="2" rx="1" fill="#6D28D9" />
      <rect x="20" y="50.5" width="22" height="1.8" rx="0.9" fill="#A78BFA" fillOpacity="0.8" />
    </svg>
  );

  return withCard ? wrapWithCard(svg, size) : svg;
};

/**
 * Bonus: AI Chat with PDF (Cohesive with the suite)
 */
export const AiChatSaaSIcon: React.FC<SaaSIconProps> = ({
  size = 24,
  className = "",
  withCard = false,
}) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Chat with PDF Icon"
    >
      <defs>
        <linearGradient id="chatDoc" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF7ED" />
          <stop offset="1" stopColor="#FFEDD5" />
        </linearGradient>
        <linearGradient id="chatBubble" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      {/* Document Sheet */}
      <rect
        x="15"
        y="12"
        width="34"
        height="43"
        rx="5"
        fill="url(#chatDoc)"
        stroke="#EA580C"
        strokeWidth="1.5"
      />
      <rect x="21" y="19" width="16" height="2" rx="1" fill="#FDBA74" />
      <rect x="21" y="24" width="22" height="2" rx="1" fill="#FED7AA" />

      {/* Floating Chat Bubble */}
      <path
        d="M24 30 H42 C45 30 47 32 47 35 V42 C47 45 45 47 42 47 H33 L26 51 V47 H24 C21 47 19 45 19 42 V35 C19 32 21 30 24 30 Z"
        fill="url(#chatBubble)"
        filter="drop-shadow(0px 3px 6px rgba(234,88,12,0.3))"
      />
      {/* Chat Dots */}
      <circle cx="28" cy="38.5" r="1.5" fill="#FFFFFF" />
      <circle cx="33" cy="38.5" r="1.5" fill="#FFFFFF" />
      <circle cx="38" cy="38.5" r="1.5" fill="#FFFFFF" />
    </svg>
  );

  return withCard ? wrapWithCard(svg, size) : svg;
};

/**
 * Soft rounded rectangular card wrapper (18px corner radius)
 * with subtle optical depth and a soft, multi-layered ambient drop shadow.
 */
function wrapWithCard(svgElement: React.ReactNode, size: number) {
  // If size is small (e.g. <= 32), we adapt padding so the icon remains legible
  const cardSize = Math.max(size, 48);
  const cornerRadius = 18;

  return (
    <div
      style={{
        width: `${cardSize}px`,
        height: `${cardSize}px`,
        borderRadius: `${cornerRadius}px`,
      }}
      className="relative flex items-center justify-center bg-white border border-slate-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06),0_2px_6px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_-4px_rgba(0,0,0,0.12),0_4px_10px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 group-hover:scale-105 overflow-hidden shrink-0 select-none"
    >
      {/* Subtle Inner Optical Depth Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-slate-50/60 pointer-events-none rounded-[18px]" />
      {svgElement}
    </div>
  );
}

/**
 * 7-Icon Catalog Data mapping for easy programmatic rendering
 */
export const SAAS_7_ICONS = [
  {
    id: "summary",
    name: "AI Document Summary",
    icon: AiSummarySaaSIcon,
    description: "Deep indigo text skeleton with glowing golden-amber & cyan magic sparkles",
    promptTag: "Clean multi-page document layout in deep indigo text skeleton lines, featuring soft glowing golden-amber and cyan magic sparkle particles hovering overhead.",
  },
  {
    id: "translate",
    name: "AI Translate PDF",
    icon: AiTranslateSaaSIcon,
    description: "Crisp document sheet with bidirectional language arrows & purple-indigo translation glow",
    promptTag: "Crisp document sheet paired with elegant bidirectional language arrows encircling the center, wrapped in a soft translucent purple-to-indigo translation glow.",
  },
  {
    id: "notes",
    name: "AI Notes Generator",
    icon: AiNotesSaaSIcon,
    description: "Floating hardcover notebook with fine grid lines, metallic stylus & coral-amber lightbulb",
    promptTag: "Floating open hardcover notebook with fine grid lines, an ultra-sleek metallic stylus pen resting diagonally across the binding, and a delicate glowing coral-to-amber lightbulb accent.",
  },
  {
    id: "flashcards",
    name: "AI Flashcards",
    icon: AiFlashcardsSaaSIcon,
    description: "Stacked flashcards with structural lines & smooth circular flip arrow in emerald to cyan",
    promptTag: "Two neatly stacked floating flashcards displaying soft structural lines, enclosed by a smooth circular flip/refresh arrow with a refined emerald green to cyan gradient accent edge.",
  },
  {
    id: "explain",
    name: "AI Explain PDF",
    icon: AiExplainSaaSIcon,
    description: "Sapphire blue document with question mark seamlessly transforming into lightbulb of clarity",
    promptTag: "Sapphire blue document outline with an elegantly integrated, floating question mark element that seamlessly transforms into a soft glowing lightbulb of understanding.",
  },
  {
    id: "ocr",
    name: "AI OCR (Text Recognition PRO)",
    icon: AiOcrSaaSIcon,
    description: "Scanned document with cyan alignment grid lines framing field with refined red PRO badge",
    promptTag: "Scanned document with precise cyan OCR alignment grid lines framing a highlighted region, complete with a tiny, refined red gradient 'PRO' badge with pill corners.",
  },
  {
    id: "resume",
    name: "AI Resume Builder",
    icon: AiResumeSaaSIcon,
    description: "Executive structured CV with crisp profile silhouette & balanced horizontal section blocks",
    promptTag: "Executive structured CV document with a crisp profile silhouette inside a soft circle in the top corner, supported by balanced horizontal section blocks in deep indigo to violet.",
  },
] as const;
