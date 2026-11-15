import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generateFavicons() {
  const publicDir = path.join(process.cwd(), "public");
  const svgPath = path.join(publicDir, "favicon.svg");
  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [
    { name: "favicon-16x16.png", width: 16, height: 16 },
    { name: "favicon-32x32.png", width: 32, height: 32 },
    { name: "favicon-48x48.png", width: 48, height: 48 },
    { name: "apple-touch-icon.png", width: 180, height: 180 },
    { name: "apple-touch-icon-180x180.png", width: 180, height: 180 },
    { name: "android-chrome-192x192.png", width: 192, height: 192 },
    { name: "android-chrome-512x512.png", width: 512, height: 512 },
    { name: "logo.png", width: 512, height: 512 },
  ];

  for (const item of sizes) {
    const outPath = path.join(publicDir, item.name);
    await sharp(svgBuffer, { density: 300 })
      .resize(item.width, item.height)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outPath);
    console.log(`Generated ${item.name} (${item.width}x${item.height})`);
  }

  // Also generate 32x32 favicon.ico from 32x32 png
  const png32 = await sharp(svgBuffer, { density: 300 })
    .resize(32, 32)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), png32);
  console.log("Updated favicon.ico (32x32)");

  // Generate OpenGraph Social Share Image 1200x630
  const ogSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fb923c" />
        <stop offset="100%" stop-color="#ea580c" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <circle cx="200" cy="150" r="180" fill="#f97316" opacity="0.08" />
    <circle cx="1000" cy="480" r="220" fill="#3b82f6" opacity="0.06" />
    
    <!-- Icon Box -->
    <g transform="translate(160, 215)">
      <rect width="200" height="200" rx="44" fill="url(#sunGrad)" />
      <g transform="translate(44, 38) scale(3.1)">
        <path d="M6 0h16l12 12v26a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" fill="#ffffff" opacity="0.95" />
        <path d="M22 0v12h12" fill="#fdba74" opacity="0.8" />
        <rect x="8" y="18" width="20" height="3" rx="1.5" fill="#ea580c" />
        <rect x="8" y="24" width="16" height="3" rx="1.5" fill="#f97316" />
        <rect x="8" y="30" width="12" height="3" rx="1.5" fill="#fb923c" />
      </g>
    </g>

    <!-- Texts -->
    <g transform="translate(410, 260)">
      <text x="0" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" fill="#ffffff">PDFSun.in</text>
      <text x="0" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#f97316">100% Private, Fast In-Browser PDF Suite</text>
      <text x="0" y="135" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">Merge • Split • Compress • Edit • Convert • Gemini AI OCR</text>
    </g>
  </svg>`;

  const ogBuffer = Buffer.from(ogSvg);
  await sharp(ogBuffer)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, "og-image.png"));
  console.log("Generated og-image.png (1200x630)");
}

generateFavicons().catch(console.error);
