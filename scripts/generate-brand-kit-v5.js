import sharp from 'sharp';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');

// 1. Primary Horizontal Logo for Light Theme (logo-light.svg)
// Aspect ratio: 250x50 (5:1 matching 180x36, 200x40, etc.)
const logoLightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 50" width="250" height="50" fill="none">
  <defs>
    <!-- Brand Blue Document Gradient -->
    <linearGradient id="docGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052FF" />
      <stop offset="60%" stop-color="#0043D6" />
      <stop offset="100%" stop-color="#002F9E" />
    </linearGradient>
    <!-- Rising Sun Gradient -->
    <linearGradient id="sunGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE033" />
      <stop offset="50%" stop-color="#FFAB00" />
      <stop offset="100%" stop-color="#FF6D00" />
    </linearGradient>
    <!-- Fold Corner Gradient -->
    <linearGradient id="foldGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <!-- Shadow Filter -->
    <filter id="shadowLight" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0052FF" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- LOGO EMBLEM GROUP (0 to 45px) -->
  <g transform="translate(4, 5)">
    <!-- Rising Sun Emblem (Behind Document) -->
    <circle cx="31" cy="14" r="11" fill="url(#sunGradLight)" />
    <!-- Sun Rays Emanating -->
    <line x1="31" y1="0" x2="31" y2="2" stroke="#FFAB00" stroke-width="2" stroke-linecap="round" />
    <line x1="43" y1="4" x2="41" y2="6" stroke="#FF8F00" stroke-width="2" stroke-linecap="round" />
    <line x1="44" y1="16" x2="42" y2="16" stroke="#FF6D00" stroke-width="2" stroke-linecap="round" />

    <!-- Main Folded PDF Document -->
    <g filter="url(#shadowLight)">
      <path d="M 9 6 C 7 6, 5 8, 5 10 L 5 36 C 5 38, 7 40, 9 40 L 27 40 C 29 40, 31 38, 31 36 L 31 16 L 21 6 Z" fill="url(#docGradLight)" />
      <!-- Fold Corner Sheet -->
      <path d="M 21 6 L 31 16 L 23 16 C 22 16, 21 15, 21 14 Z" fill="url(#foldGradLight)" />
      
      <!-- Document Inner Structure Lines -->
      <rect x="9" y="19" width="13" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.95" />
      <rect x="9" y="24" width="17" height="2.2" rx="1.1" fill="#93C5FD" opacity="0.9" />
      <rect x="9" y="29" width="10" height="2.2" rx="1.1" fill="#FFE033" opacity="0.95" />

      <!-- AI Sparkle Star -->
      <circle cx="13" cy="12" r="1.5" fill="#FFFFFF" />
    </g>
  </g>

  <!-- BRAND NAME & BADGES -->
  <!-- "PDF" Text -->
  <text x="56" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="22" font-weight="900" fill="#0F172A" letter-spacing="-0.5">PDF</text>
  <!-- "Sun" Text -->
  <text x="98" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="22" font-weight="900" fill="#EA580C" letter-spacing="-0.5">Sun</text>

  <!-- "PRO AI" Badge -->
  <rect x="144" y="13" width="54" height="18" rx="5" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1" />
  <text x="171" y="25.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="9" font-weight="800" fill="#0052FF" letter-spacing="0.5" text-anchor="middle">PRO AI</text>

  <!-- Subtitle: "pdfsun.in • Your Smart Document Companion" -->
  <text x="56" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="8.5" font-weight="600" fill="#64748B" letter-spacing="0.2">
    <tspan fill="#0052FF" font-weight="700">pdfsun.in</tspan> • Your Smart Document Companion
  </text>
</svg>`;

// 2. Primary Horizontal Logo for Dark Theme (logo-dark.svg)
const logoDarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 50" width="250" height="50" fill="none">
  <defs>
    <!-- Vibrant Blue Gradient for Dark Mode -->
    <linearGradient id="docGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="50%" stop-color="#0052FF" />
      <stop offset="100%" stop-color="#0035A8" />
    </linearGradient>
    <!-- Glowing Sun Gradient -->
    <linearGradient id="sunGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF566" />
      <stop offset="50%" stop-color="#FFC107" />
      <stop offset="100%" stop-color="#FF9800" />
    </linearGradient>
    <linearGradient id="foldGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#BFDBFE" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <filter id="sunGlowDark" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#FFB300" flood-opacity="0.6" />
    </filter>
    <filter id="shadowDark" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0052FF" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- LOGO EMBLEM GROUP (0 to 45px) -->
  <g transform="translate(4, 5)">
    <!-- Glowing Rising Sun Emblem -->
    <circle cx="31" cy="14" r="11" fill="url(#sunGradDark)" filter="url(#sunGlowDark)" />
    <!-- Sun Rays Emanating -->
    <line x1="31" y1="0" x2="31" y2="2" stroke="#FFD54F" stroke-width="2" stroke-linecap="round" />
    <line x1="43" y1="4" x2="41" y2="6" stroke="#FFCA28" stroke-width="2" stroke-linecap="round" />
    <line x1="44" y1="16" x2="42" y2="16" stroke="#FFA000" stroke-width="2" stroke-linecap="round" />

    <!-- Main Folded PDF Document -->
    <g filter="url(#shadowDark)">
      <path d="M 9 6 C 7 6, 5 8, 5 10 L 5 36 C 5 38, 7 40, 9 40 L 27 40 C 29 40, 31 38, 31 36 L 31 16 L 21 6 Z" fill="url(#docGradDark)" />
      <!-- Fold Corner Sheet -->
      <path d="M 21 6 L 31 16 L 23 16 C 22 16, 21 15, 21 14 Z" fill="url(#foldGradDark)" />
      
      <!-- Document Inner Structure Lines -->
      <rect x="9" y="19" width="13" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.95" />
      <rect x="9" y="24" width="17" height="2.2" rx="1.1" fill="#93C5FD" opacity="0.9" />
      <rect x="9" y="29" width="10" height="2.2" rx="1.1" fill="#FFE082" opacity="0.95" />

      <!-- AI Sparkle Star -->
      <circle cx="13" cy="12" r="1.5" fill="#FFFFFF" />
    </g>
  </g>

  <!-- BRAND NAME & BADGES -->
  <!-- "PDF" Text -->
  <text x="56" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" letter-spacing="-0.5">PDF</text>
  <!-- "Sun" Text -->
  <text x="98" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="22" font-weight="900" fill="#FBBF24" letter-spacing="-0.5">Sun</text>

  <!-- "PRO AI" Badge -->
  <rect x="144" y="13" width="54" height="18" rx="5" fill="#1E293B" stroke="#3B82F6" stroke-width="1" />
  <text x="171" y="25.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="9" font-weight="800" fill="#60A5FA" letter-spacing="0.5" text-anchor="middle">PRO AI</text>

  <!-- Subtitle: "pdfsun.in • Your Smart Document Companion" -->
  <text x="56" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="8.5" font-weight="600" fill="#94A3B8" letter-spacing="0.2">
    <tspan fill="#60A5FA" font-weight="700">pdfsun.in</tspan> • Your Smart Document Companion
  </text>
</svg>`;

// 3. Centered Vertical Stacked Logo (logo-stacked.svg)
const logoStackedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360" width="400" height="360" fill="none">
  <defs>
    <linearGradient id="docGradStacked" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052FF" />
      <stop offset="50%" stop-color="#0043D6" />
      <stop offset="100%" stop-color="#002A8F" />
    </linearGradient>
    <linearGradient id="sunGradStacked" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE033" />
      <stop offset="50%" stop-color="#FFAB00" />
      <stop offset="100%" stop-color="#FF6D00" />
    </linearGradient>
    <linearGradient id="foldGradStacked" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <filter id="shadowStacked" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0052FF" flood-opacity="0.3" />
    </filter>
    <filter id="sunGlowStacked" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#FF9800" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Large Centered Emblem (Top) -->
  <g transform="translate(140, 20)">
    <!-- Rising Sun Behind Document -->
    <circle cx="85" cy="40" r="34" fill="url(#sunGradStacked)" filter="url(#sunGlowStacked)" />
    <!-- Rays -->
    <line x1="85" y1="0" x2="85" y2="6" stroke="#FFD54F" stroke-width="4" stroke-linecap="round" />
    <line x1="120" y1="12" x2="114" y2="18" stroke="#FFA000" stroke-width="4" stroke-linecap="round" />
    <line x1="126" y1="46" x2="120" y2="46" stroke="#FF6D00" stroke-width="4" stroke-linecap="round" />

    <!-- Folded Document -->
    <g filter="url(#shadowStacked)">
      <path d="M 24 16 C 18 16, 14 20, 14 26 L 14 104 C 14 110, 18 114, 24 114 L 78 114 C 84 114, 88 110, 88 104 L 88 46 L 58 16 Z" fill="url(#docGradStacked)" />
      <path d="M 58 16 L 88 46 L 66 46 C 62 46, 58 42, 58 38 Z" fill="url(#foldGradStacked)" />

      <!-- Inner Lines -->
      <rect x="26" y="54" width="40" height="6" rx="3" fill="#FFFFFF" opacity="0.95" />
      <rect x="26" y="68" width="50" height="6" rx="3" fill="#93C5FD" opacity="0.9" />
      <rect x="26" y="82" width="30" height="6" rx="3" fill="#FFE033" opacity="0.95" />

      <!-- Sparkle Star -->
      <circle cx="36" cy="34" r="4" fill="#FFFFFF" />
    </g>
  </g>

  <!-- Brand Typography Stack (Centered) -->
  <g transform="translate(200, 195)">
    <!-- PDF Sun Title -->
    <text x="-40" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="44" font-weight="900" fill="#0F172A" letter-spacing="-1" text-anchor="end">PDF</text>
    <text x="-32" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="44" font-weight="900" fill="#EA580C" letter-spacing="-1" text-anchor="start">Sun</text>

    <!-- PRO AI Badge -->
    <rect x="65" y="-30" width="70" height="24" rx="7" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.5" />
    <text x="100" y="-14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="11" font-weight="800" fill="#0052FF" letter-spacing="0.5" text-anchor="middle">PRO AI</text>

    <!-- Domain -->
    <text x="0" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="20" font-weight="800" fill="#0052FF" letter-spacing="1" text-anchor="middle">pdfsun.in</text>

    <!-- Tagline -->
    <text x="0" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="16" font-weight="600" fill="#64748B" letter-spacing="0.2" text-anchor="middle">Your Smart Document Companion</text>

    <!-- Value Pill -->
    <rect x="-120" y="90" width="240" height="30" rx="15" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1" />
    <circle cx="-100" cy="105" r="4" fill="#10B981" />
    <text x="-88" y="110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif" font-size="11" font-weight="700" fill="#334155">100% Private Client-Side Tools</text>
  </g>
</svg>`;

// 4. Official Clean Vector Favicon (favicon.svg) with inline #0052FF Brand Color
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <!-- Brand Blue Background Gradient -->
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052FF" />
      <stop offset="100%" stop-color="#0038B8" />
    </linearGradient>
    <linearGradient id="favSun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF566" />
      <stop offset="100%" stop-color="#FF9800" />
    </linearGradient>
    <linearGradient id="favFold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
  </defs>

  <!-- Clean Circular Brand Icon Badge with inline #0052FF -->
  <circle cx="32" cy="32" r="31" fill="url(#favBg)" />
  <circle cx="32" cy="32" r="30.5" fill="none" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1" />

  <!-- Rising Sun Accent -->
  <circle cx="43" cy="21" r="9" fill="url(#favSun)" opacity="0.95" />

  <!-- Main Crisp White Folded Document -->
  <path d="M 21 16 C 19 16, 18 17.5, 18 19.5 L 18 45.5 C 18 47.5, 19 49, 21 49 L 41 49 C 43 49, 44 47.5, 44 45.5 L 44 24 L 36 16 Z" fill="#FFFFFF" />

  <!-- Fold Corner -->
  <path d="M 36 16 L 44 24 L 38 24 C 36.8 24, 36 23.2, 36 22 Z" fill="url(#favFold)" />

  <!-- Document Lines (Brand Blue) -->
  <rect x="23" y="27" width="14" height="2.5" rx="1.25" fill="#0052FF" />
  <rect x="23" y="33" width="16" height="2.5" rx="1.25" fill="#2563EB" />
  <rect x="23" y="39" width="10" height="2.5" rx="1.25" fill="#60A5FA" />

  <!-- Sparkle Accent -->
  <circle cx="25" cy="21" r="1.5" fill="#0052FF" />
</svg>`;

// 5. Master 512x512 App Icon SVG for PWA and Apple Touch Icon
const masterAppIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pwaBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052FF" />
      <stop offset="60%" stop-color="#003EC4" />
      <stop offset="100%" stop-color="#00237A" />
    </linearGradient>
    <linearGradient id="pwaSun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF566" />
      <stop offset="50%" stop-color="#FFC107" />
      <stop offset="100%" stop-color="#FF9800" />
    </linearGradient>
    <linearGradient id="pwaFold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <filter id="pwaShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#001B5E" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Solid Opaque Brand Squircle -->
  <rect width="512" height="512" rx="128" fill="url(#pwaBg)" />
  <rect width="508" height="508" x="2" y="2" rx="126" fill="none" stroke="rgba(255, 255, 255, 0.25)" stroke-width="4" />

  <!-- Rising Sun Accent -->
  <circle cx="340" cy="170" r="76" fill="url(#pwaSun)" opacity="0.95" />
  <circle cx="340" cy="170" r="100" fill="url(#pwaSun)" opacity="0.25" />

  <!-- Main Crisp White Folded Document -->
  <g filter="url(#pwaShadow)">
    <path d="M 160 120 C 140 120, 130 134, 130 154 L 130 360 C 130 380, 140 394, 160 394 L 320 394 C 340 394, 350 380, 350 360 L 350 188 L 282 120 Z" fill="#FFFFFF" />
    <!-- Fold Corner -->
    <path d="M 282 120 L 350 188 L 298 188 C 288 188, 282 182, 282 172 Z" fill="url(#pwaFold)" />

    <!-- Document Lines -->
    <rect x="172" y="214" width="112" height="20" rx="10" fill="#0052FF" />
    <rect x="172" y="258" width="136" height="20" rx="10" fill="#2563EB" />
    <rect x="172" y="302" width="90" height="20" rx="10" fill="#60A5FA" />

    <!-- Sparkle Star -->
    <circle cx="188" cy="164" r="12" fill="#0052FF" />
  </g>
</svg>`;

// 6. Social Card OpenGraph Image (1200x630)
const ogImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#080D1A" />
    </linearGradient>
    <linearGradient id="ogBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052FF" />
      <stop offset="100%" stop-color="#0035A8" />
    </linearGradient>
    <linearGradient id="ogSun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE033" />
      <stop offset="100%" stop-color="#FF6D00" />
    </linearGradient>
  </defs>

  <!-- Deep Dark Canvas -->
  <rect width="1200" height="630" fill="url(#ogBg)" />

  <!-- Ambient Glows -->
  <circle cx="950" cy="150" r="300" fill="#0052FF" opacity="0.22" filter="blur(60px)" />
  <circle cx="200" cy="500" r="250" fill="#0035A8" opacity="0.18" filter="blur(50px)" />

  <!-- Brand Circular Logo Badge (Left) -->
  <g transform="translate(140, 165)">
    <circle cx="150" cy="150" r="140" fill="url(#ogBlue)" />
    <circle cx="150" cy="150" r="138" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
    <!-- Rising Sun -->
    <circle cx="200" cy="95" r="42" fill="url(#ogSun)" />
    <!-- Document -->
    <path d="M 100 70 C 90 70, 85 77, 85 87 L 85 195 C 85 205, 90 212, 100 212 L 180 212 C 190 212, 195 205, 195 195 L 195 110 L 155 70 Z" fill="#FFFFFF" />
    <path d="M 155 70 L 195 110 L 165 110 C 159 110, 155 106, 155 100 Z" fill="#3B82F6" />
    <rect x="106" y="122" width="60" height="10" rx="5" fill="#0052FF" />
    <rect x="106" y="144" width="70" height="10" rx="5" fill="#2563EB" />
    <rect x="106" y="166" width="45" height="10" rx="5" fill="#60A5FA" />
    <circle cx="114" cy="94" r="6" fill="#0052FF" />
  </g>

  <!-- Typography Content (Right) -->
  <g transform="translate(500, 200)">
    <!-- Brand Name -->
    <text x="0" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="900" fill="#FFFFFF" letter-spacing="-1">PDFSun<tspan fill="#3B82F6">.in</tspan></text>
    
    <!-- Tagline -->
    <text x="0" y="110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="#93C5FD">Your Smart Document Companion</text>

    <!-- Subtitle / Value Prop -->
    <text x="0" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="400" fill="#94A3B8">100% Private Client-Side PDF Tools • OCR • AI Suite</text>

    <!-- Trust Badges Strip -->
    <rect x="0" y="215" width="240" height="42" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1" />
    <circle cx="22" cy="236" r="6" fill="#10B981" />
    <text x="36" y="242" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#F8FAFC">Client-Side WebAssembly</text>

    <rect x="256" y="215" width="200" height="42" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1" />
    <circle cx="278" cy="236" r="6" fill="#3B82F6" />
    <text x="292" y="242" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#F8FAFC">Zero Server Upload</text>
  </g>
</svg>`;

async function run() {
  console.log('Writing clean vector SVG brand assets to /public...');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo-light.svg'), logoLightSvg, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo-dark.svg'), logoDarkSvg, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo-stacked.svg'), logoStackedSvg, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-512.svg'), masterAppIconSvg, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-192.svg'), masterAppIconSvg, 'utf8');

  console.log('Rendering high-density raster assets via sharp...');
  // Favicons
  await sharp(Buffer.from(faviconSvg)).resize(16, 16).png().toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
  await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
  await sharp(Buffer.from(faviconSvg)).resize(48, 48).png().toFile(path.join(PUBLIC_DIR, 'favicon-48x48.png'));
  await sharp(Buffer.from(faviconSvg)).resize(64, 64).png().toFile('/tmp/fav-64.png');

  // Apple Touch Icons (180x180 solid opaque)
  await sharp(Buffer.from(masterAppIconSvg)).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  await sharp(Buffer.from(masterAppIconSvg)).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon-180x180.png'));

  // Android Chrome PWA Icons
  await sharp(Buffer.from(masterAppIconSvg)).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));
  await sharp(Buffer.from(masterAppIconSvg)).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));
  await sharp(Buffer.from(masterAppIconSvg)).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'logo.png'));

  // OpenGraph Image
  await sharp(Buffer.from(ogImageSvg)).resize(1200, 630).png().toFile(path.join(PUBLIC_DIR, 'og-image.png'));

  console.log('Generating multi-resolution 32-bit favicon.ico (16x16, 32x32, 48x48, 64x64)...');
  execSync(`convert ${path.join(PUBLIC_DIR, 'favicon-16x16.png')} ${path.join(PUBLIC_DIR, 'favicon-32x32.png')} ${path.join(PUBLIC_DIR, 'favicon-48x48.png')} /tmp/fav-64.png ${path.join(PUBLIC_DIR, 'favicon.ico')}`);

  console.log('All Enterprise Brand Kit assets (v5.0) generated successfully!');
}

run().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
