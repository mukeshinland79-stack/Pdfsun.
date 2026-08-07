import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '..', 'public', 'locales');
const enFilePath = path.join(localesDir, 'en', 'translation.json');

const targetLanguages = [
  'en', 'hi', 'es', 'fr', 'ar', 'pt', 'ru', 'bn', 'ur', 'id',
  'de', 'ja', 'ko', 'tr', 'vi', 'it', 'te', 'ta', 'mr', 'gu',
  'kn', 'ml', 'pa', 'zh-CN', 'zh-TW', 'th', 'pl', 'nl', 'fa', 'uk'
];

const defaultBaseKeys = {
  nav: {
    home: "Home",
    allTools: "All PDF Tools",
    aiSuite: "AI Tools",
    pricing: "Pricing",
    loginRegister: "Login / Register",
    brandKit: "Brand Kit",
    searchBtn: "Search"
  },
  hero: {
    title: "Enterprise PDF Tools & Document Engine",
    subtitle: "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.",
    chooseFiles: "Choose Files from Device"
  },
  quick_actions: {
    merge: "Merge PDF",
    split: "Split PDF",
    compress: "Compress PDF",
    edit: "Edit PDF",
    title: "Popular Quick Actions"
  },
  badges: {
    privacyTitle: "100% In-Browser Privacy",
    privacySub: "Client-side WebAssembly processing",
    utilitiesTitle: "50+ Pro PDF Utilities",
    utilitiesSub: "Complete PDF suite",
    ultraFast: "Ultra Fast Speed",
    noStorage: "No Storage Purge",
    geminiAi: "Gemini 3.6 AI"
  },
  promo: {
    privacy: "100% In-Browser Privacy",
    utilities: "50+ Pro PDF Utilities"
  },
  toolkit: {
    popular: "Popular PDF Tools",
    ai: "AI PDF Tools",
    all: "All Utilities",
    title: "Comprehensive PDF Toolkit",
    subtitle: "Over 50+ enterprise working tools for students, lawyers, researchers, and professionals.",
    filterPlaceholder: "Filter 50+ tools...",
    toolsCount: "Tools"
  },
  tools: {
    mergePdf: "Merge PDF",
    splitPdf: "Split PDF",
    compressPdf: "Compress PDF",
    chatWithPdf: "Chat with PDF",
    outputFormat: "Output",
    openTool: "Open Tool"
  },
  footer: {
    rights: "All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service"
  }
};

let enContent = defaultBaseKeys;

if (fs.existsSync(enFilePath)) {
  try {
    const raw = fs.readFileSync(enFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    enContent = { ...defaultBaseKeys, ...parsed };
    console.log('📄 Loaded base English translation from public/locales/en/translation.json');
  } catch (err) {
    console.warn('⚠️ Could not parse existing en/translation.json, using default base keys.', err.message);
  }
}

console.log(`🌐 Generating locale directories and translation.json files for ${targetLanguages.length} languages...`);

for (const lang of targetLanguages) {
  const langDir = path.join(localesDir, lang);
  const filePath = path.join(langDir, 'translation.json');

  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(enContent, null, 2), 'utf8');
    console.log(`  ✓ Created ${lang}/translation.json`);
  } else {
    // Ensure all base keys exist in existing file
    try {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const merged = { ...enContent, ...existing };
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
      console.log(`  ✓ Updated ${lang}/translation.json with base keys`);
    } catch {
      fs.writeFileSync(filePath, JSON.stringify(enContent, null, 2), 'utf8');
      console.log(`  ✓ Overwrote ${lang}/translation.json`);
    }
  }
}

console.log('✅ All 30 target language translation files generated successfully in public/locales/');

