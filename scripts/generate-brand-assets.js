import sharp from 'sharp';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');

// 1. Clean Circular Favicon Vector SVG with inline #0066FF Brand Theme Fill
const faviconSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <!-- Brand Blue Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0066FF" />
      <stop offset="100%" stop-color="#0047BA" />
    </linearGradient>
    <!-- Folded Corner Gradient -->
    <linearGradient id="foldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <!-- Golden Sun Gradient -->
    <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF566" />
      <stop offset="100%" stop-color="#FFB300" />
    </linearGradient>
  </defs>

  <!-- Clean Circular Brand Icon Badge with inline #0066FF -->
  <circle cx="32" cy="32" r="31" fill="url(#bgGrad)" />
  <circle cx="32" cy="32" r="30.5" fill="none" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1" />

  <!-- Rising Sun Accent Behind Document -->
  <circle cx="43" cy="21" r="9" fill="url(#sunGrad)" opacity="0.95" />

  <!-- Main Crisp White Folded PDF Document -->
  <path d="M 21 16 C 19 16, 18 17.5, 18 19.5 L 18 45.5 C 18 47.5, 19 49, 21 49 L 41 49 C 43 49, 44 47.5, 44 45.5 L 44 24 L 36 16 Z" fill="#FFFFFF" />

  <!-- Fold Corner -->
  <path d="M 36 16 L 44 24 L 38 24 C 36.8 24, 36 23.2, 36 22 Z" fill="url(#foldGrad)" />

  <!-- Document Lines (Brand Blue) -->
  <rect x="23" y="27" width="14" height="2.5" rx="1.25" fill="#0066FF" />
  <rect x="23" y="33" width="16" height="2.5" rx="1.25" fill="#2563EB" />
  <rect x="23" y="39" width="10" height="2.5" rx="1.25" fill="#60A5FA" />

  <!-- Sparkle Accent -->
  <circle cx="25" cy="21" r="1.5" fill="#0066FF" />
</svg>`;

// 2. High-Res 512x512 Master Logo SVG (Squircle & Full Detail for App Icon & PWA)
const masterLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0066FF" />
      <stop offset="50%" stop-color="#004FD6" />
      <stop offset="100%" stop-color="#0B2B6E" />
    </linearGradient>
    <linearGradient id="sun512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF566" />
      <stop offset="60%" stop-color="#FFC107" />
      <stop offset="100%" stop-color="#FF9800" />
    </linearGradient>
    <linearGradient id="doc512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <linearGradient id="fold512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <filter id="shadow512" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#002970" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Solid Opaque Background for Apple Touch & Android Chrome -->
  <rect width="512" height="512" rx="128" fill="url(#bg512)" />
  <rect width="508" height="508" x="2" y="2" rx="126" fill="none" stroke="rgba(255, 255, 255, 0.25)" stroke-width="4" />

  <!-- Rising Sun Accent -->
  <circle cx="340" cy="170" r="76" fill="url(#sun512)" opacity="0.95" />
  <circle cx="340" cy="170" r="100" fill="url(#sun512)" opacity="0.25" />

  <!-- Main Crisp White Folded Document -->
  <g filter="url(#shadow512)">
    <path d="M 160 120 C 140 120, 130 134, 130 154 L 130 360 C 130 380, 140 394, 160 394 L 320 394 C 340 394, 350 380, 350 360 L 350 188 L 282 120 Z" fill="url(#doc512)" />
    <!-- Fold Corner -->
    <path d="M 282 120 L 350 188 L 298 188 C 288 188, 282 182, 282 172 Z" fill="url(#fold512)" />

    <!-- Document Lines -->
    <rect x="172" y="214" width="112" height="20" rx="10" fill="#0066FF" />
    <rect x="172" y="258" width="136" height="20" rx="10" fill="#2563EB" />
    <rect x="172" y="302" width="90" height="20" rx="10" fill="#60A5FA" />

    <!-- Star / Sparkle Icon -->
    <circle cx="188" cy="164" r="12" fill="#0066FF" />
  </g>
</svg>`;

// 3. Apple Touch Icon SVG (180x180 Solid Opaque Background)
const appleTouchSvg = masterLogoSvg;

// 4. OpenGraph Card SVG (1200x630)
const ogImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#091326" />
    </linearGradient>
    <linearGradient id="ogBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0066FF" />
      <stop offset="100%" stop-color="#0047BA" />
    </linearGradient>
    <linearGradient id="ogSun" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF566" />
      <stop offset="100%" stop-color="#FF9800" />
    </linearGradient>
  </defs>

  <!-- Deep Dark Canvas -->
  <rect width="1200" height="630" fill="url(#ogBg)" />

  <!-- Ambient Glows -->
  <circle cx="950" cy="150" r="300" fill="#0066FF" opacity="0.18" filter="blur(60px)" />
  <circle cx="200" cy="500" r="250" fill="#0047BA" opacity="0.15" filter="blur(50px)" />

  <!-- Brand Circular Logo Badge (Left) -->
  <g transform="translate(140, 165)">
    <circle cx="150" cy="150" r="140" fill="url(#ogBlue)" />
    <circle cx="150" cy="150" r="138" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
    <!-- Rising Sun -->
    <circle cx="200" cy="95" r="42" fill="url(#ogSun)" />
    <!-- Document -->
    <path d="M 100 70 C 90 70, 85 77, 85 87 L 85 195 C 85 205, 90 212, 100 212 L 180 212 C 190 212, 195 205, 195 195 L 195 110 L 155 70 Z" fill="#FFFFFF" />
    <path d="M 155 70 L 195 110 L 165 110 C 159 110, 155 106, 155 100 Z" fill="#3B82F6" />
    <rect x="106" y="122" width="60" height="10" rx="5" fill="#0066FF" />
    <rect x="106" y="144" width="70" height="10" rx="5" fill="#2563EB" />
    <rect x="106" y="166" width="45" height="10" rx="5" fill="#60A5FA" />
    <circle cx="114" cy="94" r="6" fill="#0066FF" />
  </g>

  <!-- Typography Content (Right) -->
  <g transform="translate(500, 200)">
    <!-- Brand Name -->
    <text x="0" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="900" fill="#FFFFFF" letter-spacing="-1">PDFSun<tspan fill="#3B82F6">.in</tspan></text>
    
    <!-- Tagline -->
    <text x="0" y="110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="#93C5FD">100% Private Online PDF Tools &amp; AI Suite</text>

    <!-- Subtitle / Value Prop -->
    <text x="0" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="400" fill="#94A3B8">Merge • Compress • Split • Edit • Convert • OCR • AI Chat</text>

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
  console.log('Writing clean vector SVG assets...');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvgContent, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-512.svg'), masterLogoSvg, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-192.svg'), masterLogoSvg, 'utf8');

  console.log('Rendering high-DPI Blue PNG assets via sharp...');
  // Favicons
  await sharp(Buffer.from(faviconSvgContent)).resize(16, 16).png().toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
  await sharp(Buffer.from(faviconSvgContent)).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
  await sharp(Buffer.from(faviconSvgContent)).resize(48, 48).png().toFile(path.join(PUBLIC_DIR, 'favicon-48x48.png'));
  await sharp(Buffer.from(faviconSvgContent)).resize(64, 64).png().toFile('/tmp/ico-64.png');

  // Apple Touch Icons (180x180 solid opaque)
  await sharp(Buffer.from(appleTouchSvg)).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  await sharp(Buffer.from(appleTouchSvg)).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon-180x180.png'));

  // Android Chrome PWA Icons
  await sharp(Buffer.from(masterLogoSvg)).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));
  await sharp(Buffer.from(masterLogoSvg)).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));
  await sharp(Buffer.from(masterLogoSvg)).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'logo.png'));

  // OpenGraph Image
  await sharp(Buffer.from(ogImageSvg)).resize(1200, 630).png().toFile(path.join(PUBLIC_DIR, 'og-image.png'));

  console.log('Generating multi-resolution 32-bit favicon.ico (16x16, 32x32, 48x48, 64x64)...');
  execSync(`convert ${path.join(PUBLIC_DIR, 'favicon-16x16.png')} ${path.join(PUBLIC_DIR, 'favicon-32x32.png')} ${path.join(PUBLIC_DIR, 'favicon-48x48.png')} /tmp/ico-64.png ${path.join(PUBLIC_DIR, 'favicon.ico')}`);

  console.log('All brand binary assets generated successfully!');
}

run().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
