import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  createContext,
  ReactNode,
  FC,
} from "react";
import i18n from "i18next";
import HttpBackend from "i18next-http-backend";
import enLocale from "../locales/en.json";
import {
  ENGLISH_PRICING_TRANSLATIONS,
  ENGLISH_BLOG_TRANSLATIONS,
  ENGLISH_HOMEPAGE_SECTIONS,
} from "./translations/englishCoreSections";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag?: string;
  isRtl?: boolean;
}

export const SUPPORTED_LANGUAGES: ReadonlyArray<LanguageOption> = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr", flag: "🇮🇳" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr", flag: "🇵🇹" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦", isRtl: true },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", flag: "🇯🇵" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", dir: "ltr", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", dir: "ltr", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", dir: "ltr", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", dir: "ltr", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", dir: "ltr", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", dir: "ltr", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl", flag: "🇵🇰", isRtl: true },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr", flag: "🇰🇷" },
  { code: "zh-CN", name: "Chinese Simplified", nativeName: "简体中文", dir: "ltr", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese Traditional", nativeName: "繁體中文", dir: "ltr", flag: "🇹🇼" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", dir: "ltr", flag: "🇵🇱" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", dir: "ltr", flag: "🇹🇭" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr", flag: "🇮🇩" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", dir: "ltr", flag: "🇺🇦" },
  { code: "fa", name: "Persian", nativeName: "فارसी", dir: "rtl", flag: "🇮🇷", isRtl: true },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", dir: "ltr", flag: "🇲🇾" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", dir: "ltr", flag: "🇬🇷" },
  { code: "he", name: "Hebrew", nativeName: "עברית", dir: "rtl", flag: "🇮🇱", isRtl: true },
];

export const RTL_LANGUAGES = ["ar", "ur", "fa", "he"];

export const isRtlLanguage = (code: string): boolean => {
  const clean = code.toLowerCase().split("-")[0];
  const item = SUPPORTED_LANGUAGES.find(
    (l) => l.code.toLowerCase() === code.toLowerCase() || l.code.toLowerCase().split("-")[0] === clean
  );
  if (item && item.dir === "rtl") return true;
  return RTL_LANGUAGES.includes(clean);
};

export const getDirection = (code: string): "rtl" | "ltr" => {
  return isRtlLanguage(code) ? "rtl" : "ltr";
};

export const DEFAULT_LANGUAGE = "en";
export const STORAGE_KEY = "pdfsun_lang";
export const FALLBACK_STORAGE_KEYS = ["pdfsun_language", "i18nextLng", "user_language"];
const CMS_STORAGE_KEY = "pdfsun_cms_overrides";

/**
 * Retrieves the persisted language from localStorage or document.cookie
 */
export const getPersistedLanguage = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    // 1. Check localStorage
    const primary = localStorage.getItem(STORAGE_KEY);
    if (primary) {
      const cleanPrimary = primary.split("-")[0];
      if (SUPPORTED_LANGUAGES.some((l) => l.code === primary)) return primary;
      if (SUPPORTED_LANGUAGES.some((l) => l.code === cleanPrimary)) return cleanPrimary;
    }
    for (const key of FALLBACK_STORAGE_KEYS) {
      const fallback = localStorage.getItem(key);
      if (fallback) {
        const cleanFallback = fallback.split("-")[0];
        if (SUPPORTED_LANGUAGES.some((l) => l.code === fallback)) return fallback;
        if (SUPPORTED_LANGUAGES.some((l) => l.code === cleanFallback)) return cleanFallback;
      }
    }

    // 2. Check Cookie fallback
    if (document.cookie) {
      const match = document.cookie.match(/(?:^|; )\s*pdfsun_lang=([^;]+)/);
      if (match && match[1]) {
        const cookieVal = decodeURIComponent(match[1]);
        const cleanCookie = cookieVal.split("-")[0];
        if (SUPPORTED_LANGUAGES.some((l) => l.code === cookieVal)) return cookieVal;
        if (SUPPORTED_LANGUAGES.some((l) => l.code === cleanCookie)) return cleanCookie;
      }
    }
  } catch {
    // Ignore storage read error
  }
  return null;
};

// Helpers for CMS Live Overrides
export const getCmsOverrides = (): Record<string, Record<string, string>> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveCmsOverride = (lang: string, key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    const existing = getCmsOverrides();
    if (!existing[lang]) existing[lang] = {};
    existing[lang][key] = value;
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("pdfsun_cms_updated", { detail: { lang, key, value } }));
  } catch (e) {
    console.error("Failed to save CMS override:", e);
  }
};

export const saveBulkCmsOverrides = (overrides: Record<string, Record<string, string>>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent("pdfsun_cms_updated", { detail: overrides }));
  } catch (e) {
    console.error("Failed to save bulk CMS overrides:", e);
  }
};

export const deleteCmsOverride = (lang: string, key: string) => {
  if (typeof window === "undefined") return;
  try {
    const existing = getCmsOverrides();
    if (existing[lang] && existing[lang][key]) {
      delete existing[lang][key];
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent("pdfsun_cms_updated"));
    }
  } catch (e) {
    console.error(e);
  }
};

export const resetAllCmsOverrides = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CMS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("pdfsun_cms_updated"));
  } catch (e) {
    console.error(e);
  }
};

export const getInitialLanguage = (): string => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    // 1. Check URL query parameters (?lang=... or ?lng=...) first for direct links & SEO
    const searchParams = new URLSearchParams(window.location.search);
    const urlLang = searchParams.get("lang") || searchParams.get("lng");
    if (urlLang) {
      const clean = urlLang.toLowerCase().split("-")[0];
      const match = SUPPORTED_LANGUAGES.find(
        (l) => l.code.toLowerCase() === urlLang.toLowerCase() || l.code.toLowerCase() === clean
      );
      if (match) return match.code;
    }

    // 2. Check URL path prefix (e.g. /hi/, /es/, /de/, /ar/, /hi/pricing, /es/merge-pdf)
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const potentialLang = pathParts[0].toLowerCase();
      const match = SUPPORTED_LANGUAGES.find(
        (l) => l.code.toLowerCase() === potentialLang || l.code.toLowerCase() === potentialLang.split("-")[0]
      );
      if (match) return match.code;
    }

    // 3. Check persisted user selection from localStorage
    const persisted = getPersistedLanguage();
    if (persisted) {
      return persisted;
    }

    // 4. Fall back to browser navigator language preference
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav) {
      const preferredLangs = Array.isArray(nav.languages) && nav.languages.length > 0
        ? nav.languages
        : [nav.language];
      for (const rawLang of preferredLangs) {
        if (!rawLang || typeof rawLang !== "string") continue;
        const primaryLang = rawLang.split("-")[0].toLowerCase();
        const matched = SUPPORTED_LANGUAGES.find(
          (l) => l.code.toLowerCase() === rawLang.toLowerCase() || l.code.toLowerCase() === primaryLang
        );
        if (matched) return matched.code;
      }
    }
  } catch {
    // Ignore storage access error
  }
  return DEFAULT_LANGUAGE;
};

// In-memory Core Dictionaries for Instant 0ms Zero-Latency Switching
export const IN_MEMORY_TRANSLATIONS: Record<string, Record<string, any>> = {
  en: {
    ...enLocale,
    nav: {
      home: "Home",
      allTools: "All PDF Tools",
      aiSuite: "AI Tools Suite",
      pricing: "Pricing Plans",
      loginRegister: "Login / Register",
      brandKit: "Brand Kit",
      searchBtn: "Search 66+ Tools",
      history: "Recent History",
      favorites: "Favorites",
      theme: "Theme",
      language: "Language",
      adminPanel: "Admin Panel",
      userPortal: "User Dashboard",
      logout: "Logout",
    },
    hero: {
      title: "Enterprise PDF Tools & Document Engine",
      subtitle: "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.",
      chooseFiles: "Choose Files from Device",
      dropzoneTitle: "Drop PDF files here or click to browse",
      dropzoneSub: "Files stay completely on your device. Fast, safe, and private.",
      dropzoneActiveTitle: "Release files to launch tool workspace",
      dropzoneActiveSub: "Drop now to start processing instantly",
      or: "or",
      searchPlaceholder: "Search 66+ PDF & Document Tools (Ctrl+K)...",
      statsFiles: "500K+ Files Processed",
      statsPrivate: "100% In-Browser Privacy",
    },
    quick_actions: {
      title: "Popular Quick Actions",
      merge: "Merge PDF",
      split: "Split PDF",
      compress: "Compress PDF",
      pdfToWord: "PDF to Word",
      chatWithPdf: "AI Chat with PDF",
      aiSummary: "AI Summary",
    },
    badges: {
      privacyTitle: "100% In-Browser Privacy",
      privacySub: "Client-side WebAssembly processing",
      utilitiesTitle: "66+ Free Online PDF & Document Tools",
      utilitiesSub: "Complete PDF suite",
      ultraFast: "Ultra Fast Speed",
      ultraFastDesc: "Local browser acceleration engine.",
      noStorage: "No Storage Purge",
      noStorageDesc: "Zero permanent file retention guarantee.",
      geminiAi: "Gemini 3.6 AI",
      geminiAiDesc: "Smart chat, summary & translation.",
      tools50: "66+ Free Online PDF & Document Tools",
      tools50Desc: "Complete PDF conversion suite.",
      mostPopular: "Most Popular Tool",
      pro: "PRO",
      ai: "AI",
      student: "Student Essential",
      proTooltip: "Pro Feature - Enterprise PDF Processing",
    },
    categories: {
      all: "All Utilities",
      student: "Student Essential",
      ai: "AI PDF Tools",
      popular: "Popular Tools",
      convert: "Convert PDF",
      edit: "Edit & Annotate",
      organize: "Organize & Pages",
      security: "Security & Protect",
      optimize: "Compress & Fix",
      advanced: "Advanced",
    },
    formats: {
      badge: "Universal Document Converter",
      title: "Supported File Formats on PDFSun",
      subtitle: "Convert, process, and optimize documents across all major office formats, vector images, and eBook standards.",
    },
    pricing: {
      badge: "INSTANT UNLIMITED PDF PROCESSING",
      title: "Simple, Transparent",
      titleHighlight: "Pricing Plans",
      subtitle: "Process unlimited PDF files with 100% private WebAssembly speed. No hidden fees. First 7 Days 100% Money-Back Guarantee on all subscription plans.",
      currencyInr: "🇮🇳 INR (₹) Razorpay",
      currencyUsd: "🌎 USD ($) Razorpay",
      monthly: "Monthly Billing",
      yearly: "Annual Billing",
      savePercent: "Save 40%",
      guarantee: "First 7 Days 100% Money-Back Guarantee",
      termsTitle: "Disclaimer & Refund Terms",
      termsText: "7-Day Money-Back Guarantee: Eligible first-time purchases can be refunded within 7 days if less than 30% of the included quota or credits has been used. Applicable payment gateway fees are non-refundable. Cancel your subscription anytime; access continues until the current billing period ends.",
      activePlan: "CURRENTLY ACTIVE PLAN",
      planActivated: "PLAN ACTIVATED",
      buyCredits: "Buy 100 Credits — ₹99",
      subscribeMonthly: "Subscribe Monthly",
      getAnnual: "Get Annual Access — Save 40%",
      getTeam: "Get Team Access",
    },
    testimonials: {
      badge: "Loved by 500,000+ Users",
      title: "Trusted by Students, Lawyers & Researchers",
      subtitle: "See what students and industry professionals say about PDFSun efficiency, privacy, and Gemini AI capabilities.",
    },
    tools: {
      "openTool": "Open Tool",
      "share-pdfsun": {
        name: "Share PDFSun",
        desc: "Share PDFSun with friends, classmates, and colleagues via direct links, high-res QR codes, and social channels with zero signup.",
      },
      "merge-pdf": {
        name: "Merge PDF",
        desc: "Combine multiple PDF documents into a single organized file with custom page order and layout.",
      },
      "split-pdf": {
        name: "Split PDF",
        desc: "Extract specific page ranges or split each page into independent standalone PDF files instantly.",
      },
      "compress-pdf": {
        name: "Compress PDF",
        desc: "Reduce PDF file size significantly while preserving maximum document visual quality and sharp typography.",
      },
      "pdf-to-word": {
        name: "PDF to Word",
        desc: "Convert PDF documents into fully editable Microsoft Word (.docx) documents with intact formatting.",
      },
      "word-to-pdf": {
        name: "Word to PDF",
        desc: "Convert Microsoft Word (.docx, .doc) files into clean, professional PDF documents instantly.",
      },
      "ai-chat-pdf": {
        name: "AI Chat with PDF",
        desc: "Ask questions, extract facts, find citations, and chat interactively with your PDF documents using Gemini 3.6 AI.",
      },
      "ai-pdf-summary": {
        name: "AI Document Summary",
        desc: "Generate concise executive summaries, key takeaways, and structured outlines from long PDF documents.",
      },
      "protect-pdf": {
        name: "Protect PDF (Password)",
        desc: "Encrypt and password-protect your confidential PDF documents with 256-bit AES encryption.",
      },
      "unlock-pdf": {
        name: "Unlock PDF (Remove Password)",
        desc: "Remove password restrictions and decrypt protected PDF files for editing and sharing.",
      },
      "watermark-pdf": {
        name: "Watermark PDF",
        desc: "Add customized text or logo image watermarks with precise angle, opacity, and positioning controls.",
      },
      "remove-watermark": {
        name: "Remove Watermark",
        desc: "Clean and erase unwanted watermark stamps and background overlay text from PDF pages.",
      },
      "rotate-pdf": {
        name: "Rotate PDF Pages",
        desc: "Rotate individual pages or entire documents 90°, 180°, or 270° clockwise or counter-clockwise.",
      },
      "ocr-pdf": {
        name: "OCR PDF (Text Recognition)",
        desc: "Recognize and extract editable text from scanned PDF documents and image files accurately.",
      },
      "edit-pdf-metadata": {
        name: "Edit PDF Metadata",
        desc: "View and edit document properties like title, author, subject, keywords, and creation date.",
      },
      "view-pdf-metadata": {
        name: "View PDF Metadata",
        desc: "Inspect hidden PDF document metadata, producer tools, encryption type, and page dimensions.",
      },
      "organize-pdf": {
        name: "Organize PDF Pages",
        desc: "Rearrange, reorder, delete, duplicate, or resequence pages in any PDF file with visual drag-and-drop.",
      },
      "pdf-to-jpg": {
        name: "PDF to JPG",
        desc: "Convert every page of a PDF document into high-resolution JPG images.",
      },
      "jpg-to-pdf": {
        name: "JPG to PDF",
        desc: "Combine multiple photos, screenshots, or JPG images into a single unified PDF file.",
      },
      "pdf-to-excel": {
        name: "PDF to Excel",
        desc: "Extract data tables from PDF documents into editable Microsoft Excel spreadsheets (.xlsx).",
      },
      "excel-to-pdf": {
        name: "Excel to PDF",
        desc: "Convert Excel spreadsheets (.xlsx, .xls) into formatted, printable PDF documents.",
      },
      "pdf-to-powerpoint": {
        name: "PDF to PowerPoint",
        desc: "Turn your PDF presentations back into editable Microsoft PowerPoint (.pptx) slides.",
      },
      "powerpoint-to-pdf": {
        name: "PowerPoint to PDF",
        desc: "Convert Microsoft PowerPoint presentations into easy-to-share PDF documents.",
      },
      "annotate-pdf": {
        name: "Annotate PDF",
        desc: "Add shapes, freehand drawings, sticky notes, and text annotations to any PDF.",
      },
      "sign-pdf": {
        name: "Sign PDF",
        desc: "Create and place verifiable digital electronic signatures directly on your PDF pages.",
      },
    },
    faq: {
      sectionBadge: "Security & Privacy FAQ",
      toolFaqBadge: "Tool FAQs",
      title: "Frequently Asked Questions",
      toolTitle: "Frequently Asked Questions about {{toolName}}",
      subtitle: "Everything you need to know about PDFSun security, data privacy, and browser operations.",
      toolSubtitle: "Everything you need to know about using {{toolName}} safely, freely, and efficiently.",
      q1: "Are my uploaded PDF files safe on PDFSun?",
      a1: "Absolutely! At PDFSun, privacy is paramount. Most operations (merging, splitting, rotating, password protecting, organizing) run 100% locally inside your browser via WebAssembly. For AI features, temporary files are processed securely in memory over TLS HTTPS and purged immediately after completion. We NEVER store or share your files.",
      q2: "How does PDFSun handle AI PDF Chat, Summaries, and Explanations?",
      a2: "PDFSun integrates Google Gemini 3.6 AI to analyze text extracted from your PDF. You can summarize 200+ page textbooks, ask specific research questions, generate flashcards, or translate full documents into 30+ languages in seconds.",
      q3: "Is PDFSun completely free to use?",
      a3: "Yes! PDFSun offers generous free access to all 66+ tools with zero registration required. For heavy power users who need high-capacity batch AI analysis or multi-gigabyte processing, Pro Sun plans are available.",
      q4: "Can I use PDFSun offline or as a PWA?",
      a4: "Yes! PDFSun is built as a Progressive Web App (PWA). You can install it on your Desktop, Mac, iPhone, or Android device. All core PDF tools work even without an internet connection.",
      q5: "What file formats does PDFSun support?",
      a5: "PDFSun supports PDF, Microsoft Office (DOCX, XLSX, PPTX), Images (JPG, PNG, WEBP), Web (HTML, XML), eBooks (EPUB), and Text (TXT, RTF, CSV).",
    },
    workspace: {
      dropOrSelect: "Drop files here or click to choose from device",
      processFile: "Process Document",
      processing: "Processing...",
      downloadReady: "Your document is ready to download!",
      downloadBtn: "Download PDF",
      resetBtn: "Process Another File",
      openInNew: "Open Tool",
    },
    footer: {
      tagline: "PDFSun (pdfsun.in) — Your Smart Document Companion. Merge, split, compress, convert, edit, and analyze documents with cutting-edge Gemini 3.6 AI and 100% in-browser privacy.",
      brandKit: "Brand Identity Guidelines & Logo Kit",
      quickLinks: "Quick Links",
      policies: "Policies",
      resources: "Resources",
      social: "Social",
      home: "Home",
      allTools: "All PDF Tools",
      aiSuite: "AI Tools Suite",
      pricing: "Pricing Plans",
      blog: "Blog & Articles",
      support: "Support & Contact",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      aboutUs: "About Us",
      helpCenter: "Help Center",
      sitemap: "Sitemap",
      rights: "All rights reserved.",
      developedBy: "Architected & Engineered by",
      leadDev: "Lead Web Developer",
    },
  },
};

// Seed synchronous English namespaces so initial paint requires zero non-English JS
IN_MEMORY_TRANSLATIONS.en.pricing = {
  ...(IN_MEMORY_TRANSLATIONS.en.pricing || {}),
  ...ENGLISH_PRICING_TRANSLATIONS,
};
IN_MEMORY_TRANSLATIONS.en.blog = {
  ...(IN_MEMORY_TRANSLATIONS.en.blog || {}),
  ...ENGLISH_BLOG_TRANSLATIONS,
};
for (const [sectionKey, sectionObj] of Object.entries(ENGLISH_HOMEPAGE_SECTIONS)) {
  IN_MEMORY_TRANSLATIONS.en[sectionKey] = {
    ...(IN_MEMORY_TRANSLATIONS.en[sectionKey] || {}),
    ...(sectionObj as Record<string, any>),
  };
}

// Dynamically populated tool localization cache (populated on demand when non-English pack loads)
let loadedToolTranslations: Record<string, Record<string, { name?: string; desc?: string }>> = {};
let nonEnglishPacksPromise: Promise<void> | null = null;
let nonEnglishPacksLoaded = false;

const REGIONAL_FONT_QUERIES: Record<string, string> = {
  ar: "Noto+Sans+Arabic:wght@400;600;700",
  ur: "Noto+Sans+Arabic:wght@400;600;700",
  fa: "Noto+Sans+Arabic:wght@400;600;700",
  bn: "Noto+Sans+Bengali:wght@400;600;700",
  hi: "Noto+Sans+Devanagari:wght@400;600;700",
  mr: "Noto+Sans+Devanagari:wght@400;600;700",
  gu: "Noto+Sans+Gujarati:wght@400;600;700",
  pa: "Noto+Sans+Gurmukhi:wght@400;600;700",
  ta: "Noto+Sans+Tamil:wght@400;600;700",
  te: "Noto+Sans+Telugu:wght@400;600;700",
};

export function injectRegionalFontForLanguage(langCode: string): void {
  if (typeof document === "undefined") return;
  const baseCode = (langCode || "en").toLowerCase().split("-")[0];
  const familyQuery = REGIONAL_FONT_QUERIES[baseCode];
  if (!familyQuery) return;
  const linkId = `pdfsun-font-${familyQuery.split(":")[0]}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap`;
  document.head.appendChild(link);
}

export async function ensureAllTranslationPacksLoaded(targetLang?: string): Promise<void> {
  if (targetLang) {
    injectRegionalFontForLanguage(targetLang);
  }
  if (nonEnglishPacksLoaded) return;
  if (!nonEnglishPacksPromise) {
    nonEnglishPacksPromise = import("./translations/nonEnglishPacks").then((mod) => {
      Object.assign(
        IN_MEMORY_TRANSLATIONS,
        mod.CORE_REGIONAL_LANGUAGES,
        mod.INDIAN_LANGUAGES_TRANSLATIONS,
        mod.GLOBAL_LANGUAGES_TRANSLATIONS
      );

      if (IN_MEMORY_TRANSLATIONS["zh-CN"]) {
        IN_MEMORY_TRANSLATIONS["zh"] = IN_MEMORY_TRANSLATIONS["zh-CN"];
      }

      loadedToolTranslations = mod.TOOL_TRANSLATIONS;

      for (const lang of SUPPORTED_LANGUAGES) {
        const code = lang.code;
        if (!IN_MEMORY_TRANSLATIONS[code]) {
          IN_MEMORY_TRANSLATIONS[code] = { ...IN_MEMORY_TRANSLATIONS["en"] };
        }
        const pricingBundle = mod.PRICING_TRANSLATIONS[code] || mod.PRICING_TRANSLATIONS.en || {};
        IN_MEMORY_TRANSLATIONS[code].pricing = {
          ...(IN_MEMORY_TRANSLATIONS[code].pricing || {}),
          ...pricingBundle,
        };
        const blogBundle = mod.BLOG_TRANSLATIONS[code] || mod.BLOG_TRANSLATIONS.en || {};
        IN_MEMORY_TRANSLATIONS[code].blog = {
          ...(IN_MEMORY_TRANSLATIONS[code].blog || {}),
          ...blogBundle,
        };
        const homepageBundle = mod.HOMEPAGE_SECTIONS_TRANSLATIONS[code] || mod.HOMEPAGE_SECTIONS_TRANSLATIONS.en || {};
        for (const [sectionKey, sectionObj] of Object.entries(homepageBundle)) {
          IN_MEMORY_TRANSLATIONS[code][sectionKey] = {
            ...(IN_MEMORY_TRANSLATIONS[code][sectionKey] || {}),
            ...(sectionObj as Record<string, any>),
          };
        }

        if (i18n.isInitialized) {
          i18n.addResourceBundle(code, "translation", IN_MEMORY_TRANSLATIONS[code], true, true);
        }
      }

      nonEnglishPacksLoaded = true;
    }).catch((err) => {
      nonEnglishPacksPromise = null;
      console.warn("[i18n] Failed to lazy-load translation pack:", err);
    });
  }
  return nonEnglishPacksPromise;
}

// Synchronously configure i18next with lightweight English resources first
if (!i18n.isInitialized) {
  const initialResources: Record<string, { translation: Record<string, any> }> = {
    en: { translation: IN_MEMORY_TRANSLATIONS.en },
  };

  const isTestOrSsr = typeof window === "undefined" || (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "test");

  const i18nConfig: any = {
    resources: initialResources,
    lng: getInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnEmptyString: false,
    returnNull: false,
  };

  if (!isTestOrSsr) {
    i18n.use(HttpBackend).init({
      ...i18nConfig,
      backend: {
        loadPath: "/locales/{{lng}}/translation.json",
        requestOptions: {
          cache: "default",
        },
      },
    });
  } else {
    i18n.init(i18nConfig);
  }
}

export interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  changeLanguage: (lang: string) => void;
  languageOption: LanguageOption;
  isRtl: boolean;
  dir: "ltr" | "rtl";
  direction: "ltr" | "rtl";
  t: (
    key: string,
    fallbackOrParams?: string | Record<string, any>,
    possibleParamsOrFallback?: Record<string, any> | string
  ) => string;
  getToolName: (tool: { id: string; name: string }) => string;
  getToolDescription: (tool: { id: string; description?: string }) => string;
  getCategoryName: (categoryKey: string) => string;
  cmsOverrides: Record<string, Record<string, string>>;
  saveCmsText: (key: string, value: string, lang?: string) => void;
  resetCmsText: () => void;
}

const defaultContextValue: LanguageContextType = {
  currentLanguage: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  changeLanguage: () => {},
  languageOption: SUPPORTED_LANGUAGES[0],
  isRtl: false,
  dir: "ltr",
  direction: "ltr",
  t: (key: string, fallback?: string | Record<string, any>) => (typeof fallback === "string" ? fallback : key),
  getToolName: (tool) => tool.name,
  getToolDescription: (tool) => tool.description || "",
  getCategoryName: (key) => key,
  cmsOverrides: {},
  saveCmsText: () => {},
  resetCmsText: () => {},
};

export const KEY_ALIASES: Record<string, string[]> = {
  // Navigation & Header
  home: ["nav.home", "footer.home"],
  allTools: ["nav.allTools", "footer.allTools", "categories.all"],
  aiSuite: ["nav.aiSuite", "footer.aiSuite", "categories.ai"],
  pricing: ["nav.pricing", "footer.pricing", "pricing.titleHighlight", "pricing.title"],
  pricingPlans: ["nav.pricing", "footer.pricing", "pricing.titleHighlight", "footer.pricingPlans"],
  login: ["nav.loginRegister", "nav.login"],
  loginRegister: ["nav.loginRegister"],
  brandKit: ["nav.brandKit", "footer.brandKit", "footer.brandGuidelines"],
  searchBtn: ["nav.searchBtn", "hero.searchPlaceholder", "toolkit.filterPlaceholder"],
  searchTools: ["nav.searchBtn", "hero.searchPlaceholder", "toolkit.filterPlaceholder"],
  history: ["nav.history"],
  favorites: ["nav.favorites"],
  "favorites.title": ["nav.favorites", "favorites"],
  theme: ["nav.theme"],
  themeMode: ["nav.theme"],
  language: ["nav.language"],
  adminPanel: ["nav.adminPanel"],
  dashboard: ["nav.userPortal"],
  userPortal: ["nav.userPortal"],
  logout: ["nav.logout"],
  privacyNote: ["badges.privacyTitle", "hero.statsPrivate"],

  // Hero Section
  heroTitle: ["hero.title"],
  heroSub: ["hero.subtitle"],
  searchPlaceholder: ["hero.searchPlaceholder", "nav.searchBtn", "toolkit.filterPlaceholder"],
  chooseFiles: ["hero.chooseFiles", "workspace.dropOrSelect"],
  dropzoneTitle: ["hero.dropzoneTitle", "workspace.dropOrSelect"],
  dropzoneSub: ["hero.dropzoneSub"],
  dropzoneActiveTitle: ["hero.dropzoneActiveTitle"],
  dropzoneActiveSub: ["hero.dropzoneActiveSub"],
  or: ["hero.or"],
  statsFiles: ["hero.statsFiles"],
  statsPrivate: ["hero.statsPrivate", "badges.privacyTitle"],

  // Quick actions
  mergePdf: ["quick_actions.merge", "tools.merge-pdf.name"],
  splitPdf: ["quick_actions.split", "tools.split-pdf.name"],
  compressPdf: ["quick_actions.compress", "tools.compress-pdf.name"],
  pdfToWord: ["quick_actions.pdfToWord", "tools.pdf-to-word.name"],
  chatWithPdf: ["quick_actions.chatWithPdf", "tools.ai-chat-pdf.name"],
  aiSummary: ["quick_actions.aiSummary", "tools.ai-pdf-summary.name"],

  // Toolkit
  "toolkit.title": ["categories.all", "badges.tools50"],
  "toolkit.subtitle": ["hero.subtitle", "badges.tools50Desc"],
  "toolkit.filterPlaceholder": ["hero.searchPlaceholder", "nav.searchBtn"],
  "toolkit.toolsCount": ["badges.tools50", "nav.allTools"],

  // Categories
  "categories.all": ["categories.all"],
  "categories.student": ["categories.student"],
  "categories.ai": ["categories.ai"],
  "categories.popular": ["categories.popular"],
  "categories.convert": ["categories.convert"],
  "categories.edit": ["categories.edit"],
  "categories.organize": ["categories.organize"],
  "categories.security": ["categories.security"],
  "categories.optimize": ["categories.optimize"],
  "categories.advanced": ["categories.advanced"],

  // Pricing & SSO Plans
  "pricing.badge": ["pricing.badge"],
  "pricing.title": ["pricing.title"],
  "pricing.titleHighlight": ["pricing.titleHighlight", "pricing"],
  "pricing.subtitle": ["pricing.subtitle"],
  "pricing.monthly": ["pricing.monthly"],
  "pricing.yearly": ["pricing.yearly"],
  "pricing.savePercent": ["pricing.savePercent"],
  "pricing.guarantee": ["pricing.guarantee"],
  "pricing.termsTitle": ["pricing.termsTitle"],
  "pricing.termsText": ["pricing.termsText"],
  "pricing.activePlan": ["pricing.activePlan"],
  "pricing.planActivated": ["pricing.planActivated"],
  "pricing.backToTools": ["pricing.backToTools", "nav.allTools"],

  // Footer, Trust Badges & Compliance
  "footer.brandGuidelines": ["footer.brandGuidelines", "nav.brandKit"],
  "footer.securityEncrypted": ["footer.securityEncrypted", "badges.privacyTitle"],
  "footer.isoGdprCompliant": ["footer.isoGdprCompliant", "footer.complianceFull"],
  "footer.paymentPartner": ["footer.paymentPartner"],
  "footer.instantDelivery": ["footer.instantDelivery", "badges.ultraFast"],
  "footer.complianceFull": ["footer.complianceFull"],
  "footer.quickLinks": ["footer.quickLinks", "nav.allTools"],
  "footer.allPdfTools": ["footer.allPdfTools", "nav.allTools"],
  "footer.aiToolsSuite": ["footer.aiToolsSuite", "nav.aiSuite"],
  "footer.pricingPlans": ["footer.pricingPlans", "pricing.titleHighlight"],
  "footer.policies": ["footer.policies"],
  "footer.resources": ["footer.resources"],
  "footer.supportContact": ["footer.supportContact"],
  "footer.social": ["footer.social"],

  // Footer & Legal
  privacyPolicy: ["footer.privacyPolicy", "policies.privacy", "footer.policies"],
  termsOfService: ["footer.termsOfService", "policies.terms", "footer.policies"],
  aboutUs: ["footer.aboutUs", "policies.about", "footer.policies"],
  contactUs: ["footer.supportContact", "footer.support"],
  helpCenter: ["footer.helpCenter", "footer.resources"],
  blogArticles: ["footer.blog", "footer.blogArticles", "footer.resources"],
  sitemap: ["footer.sitemap"],
  rights: ["footer.rights"],
};

export const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>(getInitialLanguage);
  const [revision, setRevision] = useState<number>(0);
  const [cmsOverrides, setCmsOverrides] = useState<Record<string, Record<string, string>>>(getCmsOverrides);

  // App mount & synchronization effect: Reads 'i18nextLng' or 'pdfsun_lang' from localStorage,
  // updates the i18next configuration, and listens for language changes to update localStorage accordingly.
  useEffect(() => {
    // 1. Read 'pdfsun_lang' (or fallback 'i18nextLng' / 'pdfsun_language') from localStorage on app mount
    try {
      const storedLang =
        (typeof window !== "undefined" &&
          (localStorage.getItem("pdfsun_lang") ||
            localStorage.getItem(STORAGE_KEY) ||
            localStorage.getItem("i18nextLng") ||
            localStorage.getItem("pdfsun_language"))) ||
        null;

      if (storedLang) {
        const cleanLang = storedLang.split("-")[0];
        const targetLang = SUPPORTED_LANGUAGES.some((l) => l.code === storedLang)
          ? storedLang
          : SUPPORTED_LANGUAGES.some((l) => l.code === cleanLang)
          ? cleanLang
          : null;

        if (targetLang) {
          if (currentLanguage !== targetLang) {
            setCurrentLanguageState(targetLang);
          }
          if (targetLang !== DEFAULT_LANGUAGE) {
            ensureAllTranslationPacksLoaded(targetLang).then(() => {
              if (i18n.language !== targetLang) {
                i18n.changeLanguage(targetLang).catch(() => {});
              }
              setRevision((r) => r + 1);
            });
          } else if (i18n.language !== targetLang) {
            i18n.changeLanguage(targetLang).catch(() => {});
          }
          document.documentElement.lang = targetLang;
          document.documentElement.dir = isRtlLanguage(targetLang) ? "rtl" : "ltr";
        }
      } else {
        if (currentLanguage !== DEFAULT_LANGUAGE) {
          ensureAllTranslationPacksLoaded(currentLanguage).then(() => {
            if (i18n.language !== currentLanguage) {
              i18n.changeLanguage(currentLanguage).catch(() => {});
            }
            setRevision((r) => r + 1);
          });
        } else if (i18n.language !== currentLanguage) {
          i18n.changeLanguage(currentLanguage).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("LanguageProvider: error initializing language from localStorage:", err);
    }

    // 2. Listen for i18next language changes and persist to localStorage accordingly
    const handleI18nLanguageChanged = (newLng: string) => {
      if (!newLng || typeof newLng !== "string") return;
      const cleanLng = newLng.split("-")[0];
      const validLng = SUPPORTED_LANGUAGES.some((l) => l.code === newLng)
        ? newLng
        : SUPPORTED_LANGUAGES.some((l) => l.code === cleanLng)
        ? cleanLng
        : null;

      if (validLng) {
        try {
          localStorage.setItem("pdfsun_lang", validLng);
          localStorage.setItem(STORAGE_KEY, validLng);
          localStorage.setItem("i18nextLng", validLng);
          document.documentElement.lang = validLng;
          document.documentElement.dir = isRtlLanguage(validLng) ? "rtl" : "ltr";
        } catch {}

        if (validLng !== DEFAULT_LANGUAGE) {
          ensureAllTranslationPacksLoaded(validLng).then(() => setRevision((r) => r + 1));
        }

        setCurrentLanguageState((prev) => (prev !== validLng ? validLng : prev));
        setRevision((r) => r + 1);
      }
    };

    i18n.on("languageChanged", handleI18nLanguageChanged);

    // 3. Multi-tab storage sync
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === "i18nextLng" || e.key === "pdfsun_lang" || e.key === STORAGE_KEY) {
        const updatedLang = e.newValue;
        if (updatedLang && SUPPORTED_LANGUAGES.some((l) => l.code === updatedLang)) {
          setCurrentLanguageState(updatedLang);
          if (updatedLang !== DEFAULT_LANGUAGE) {
            ensureAllTranslationPacksLoaded(updatedLang).then(() => {
              if (i18n.language !== updatedLang) {
                i18n.changeLanguage(updatedLang).catch(() => {});
              }
              setRevision((r) => r + 1);
            });
          } else if (i18n.language !== updatedLang) {
            i18n.changeLanguage(updatedLang).catch(() => {});
          }
          document.documentElement.lang = updatedLang;
          document.documentElement.dir = isRtlLanguage(updatedLang) ? "rtl" : "ltr";
          setRevision((r) => r + 1);
        }
      }
    };

    // 4. Custom event listener
    const handleLanguageEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.lang && SUPPORTED_LANGUAGES.some((l) => l.code === detail.lang)) {
        setCurrentLanguageState(detail.lang);
        if (detail.lang !== DEFAULT_LANGUAGE) {
          ensureAllTranslationPacksLoaded(detail.lang).then(() => {
            if (i18n.language !== detail.lang) {
              i18n.changeLanguage(detail.lang).catch(() => {});
            }
            setRevision((r) => r + 1);
          });
        } else if (i18n.language !== detail.lang) {
          i18n.changeLanguage(detail.lang).catch(() => {});
        }
        setRevision((r) => r + 1);
      }
    };

    window.addEventListener("storage", handleStorageSync);
    window.addEventListener("pdfsun_language_changed", handleLanguageEvent);

    return () => {
      i18n.off("languageChanged", handleI18nLanguageChanged);
      window.removeEventListener("storage", handleStorageSync);
      window.removeEventListener("pdfsun_language_changed", handleLanguageEvent);
    };
  }, []);

  // Synchronize with custom CMS update events
  useEffect(() => {
    const handleCmsUpdate = () => {
      setCmsOverrides(getCmsOverrides());
      setRevision((r) => r + 1);
    };

    window.addEventListener("pdfsun_cms_updated", handleCmsUpdate);
    window.addEventListener("storage", handleCmsUpdate);

    return () => {
      window.removeEventListener("pdfsun_cms_updated", handleCmsUpdate);
      window.removeEventListener("storage", handleCmsUpdate);
    };
  }, []);

  const languageOption = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [currentLanguage]);

  const isRtl = useMemo(() => {
    return isRtlLanguage(currentLanguage);
  }, [currentLanguage]);

  const setLanguage = useCallback((newLang: string) => {
    const validLang = SUPPORTED_LANGUAGES.some((l) => l.code === newLang)
      ? newLang
      : DEFAULT_LANGUAGE;

    setCurrentLanguageState(validLang);

    try {
      localStorage.setItem(STORAGE_KEY, validLang);
      localStorage.setItem("pdfsun_lang", validLang);
      localStorage.setItem("i18nextLng", validLang);
      document.cookie = `pdfsun_lang=${encodeURIComponent(validLang)}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = validLang;
      document.documentElement.dir = isRtlLanguage(validLang) ? "rtl" : "ltr";

      // Dynamically update URL query parameter to keep language state persistent & shareable
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (validLang === DEFAULT_LANGUAGE) {
          url.searchParams.delete("lang");
          url.searchParams.delete("lng");
        } else {
          url.searchParams.set("lang", validLang);
        }
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }

      window.dispatchEvent(new CustomEvent("pdfsun_language_changed", { detail: { lang: validLang } }));
    } catch {
      // Ignore storage access error
    }

    if (validLang !== DEFAULT_LANGUAGE) {
      ensureAllTranslationPacksLoaded(validLang).then(() => {
        if (i18n.isInitialized && i18n.language !== validLang) {
          i18n.changeLanguage(validLang).catch(() => {});
        }
        setRevision((r) => r + 1);
      });
    } else if (i18n.isInitialized && i18n.language !== validLang) {
      i18n.changeLanguage(validLang).catch(() => {});
    }

    setRevision((r) => r + 1);
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    } catch {}
  }, [currentLanguage, isRtl]);

  const saveCmsText = useCallback((key: string, value: string, lang?: string) => {
    const targetLang = lang || currentLanguage;
    saveCmsOverride(targetLang, key, value);
    setCmsOverrides(getCmsOverrides());
    setRevision((r) => r + 1);
  }, [currentLanguage]);

  const resetCmsText = useCallback(() => {
    resetAllCmsOverrides();
    setCmsOverrides({});
    setRevision((r) => r + 1);
  }, []);

  const t = useCallback(
    (
      key: string,
      fallbackOrParams?: string | Record<string, any>,
      possibleParamsOrFallback?: Record<string, any> | string
    ): string => {
      let fallbackText =
        typeof fallbackOrParams === "string"
          ? fallbackOrParams
          : typeof possibleParamsOrFallback === "string"
          ? possibleParamsOrFallback
          : "";
      let params =
        typeof fallbackOrParams === "object"
          ? fallbackOrParams
          : typeof possibleParamsOrFallback === "object"
          ? possibleParamsOrFallback
          : undefined;

      // 1. Check CMS Overrides First for instantaneous live owner edits
      const currentCms = getCmsOverrides();
      const directOverride = currentCms[currentLanguage]?.[key] || currentCms["all"]?.[key] || currentCms["en"]?.[key];
      if (typeof directOverride === "string" && directOverride.trim() !== "") {
        let val = directOverride;
        if (params) {
          for (const [pk, pv] of Object.entries(params)) {
            val = val.replace(new RegExp(`{{${pk}}}`, "g"), String(pv));
          }
        }
        return val;
      }

      // 2. Check Tool Translations directly if key targets tool name/description
      if (key.startsWith("tools.")) {
        const parts = key.split(".");
        if (parts.length >= 3) {
          const toolId = parts[1];
          const field = parts[2] as "name" | "desc";
          const localized = loadedToolTranslations[currentLanguage]?.[toolId]?.[field];
          if (typeof localized === "string" && localized.trim() !== "") {
            return localized;
          }
        }
      }

      // 3. Multi-path In-Memory Resolution with Aliasing (Fast 0ms path for instant zero-refresh language switching)
      const getNested = (obj: any, path: string) => {
        if (!obj) return undefined;
        return path.split(".").reduce((curr, part) => (curr ? curr[part] : undefined), obj);
      };

      const resolveBundle = (bundle: any, rawKey: string): string | undefined => {
        if (!bundle) return undefined;

        // 3a. Direct nested match
        const direct = getNested(bundle, rawKey);
        if (typeof direct === "string" && direct.trim() !== "") return direct;

        // 3b. Canonical Aliases match
        const aliases = KEY_ALIASES[rawKey];
        if (aliases && aliases.length > 0) {
          for (const alias of aliases) {
            const aliasVal = getNested(bundle, alias);
            if (typeof aliasVal === "string" && aliasVal.trim() !== "") return aliasVal;
          }
        }

        // 3c. Top-level section scan (for flat keys like 'home', 'privacyPolicy', 'mergePdf', 'title', etc.)
        if (!rawKey.includes(".")) {
          const sections = [
            "nav",
            "hero",
            "quick_actions",
            "badges",
            "categories",
            "pricing",
            "footer",
            "workspace",
            "faq",
            "testimonials",
          ];
          for (const sec of sections) {
            if (bundle[sec] && typeof bundle[sec][rawKey] === "string" && bundle[sec][rawKey].trim() !== "") {
              return bundle[sec][rawKey];
            }
          }
        }

        return undefined;
      };

      // Check current language bundle
      const langBundle = IN_MEMORY_TRANSLATIONS[currentLanguage];
      const match = resolveBundle(langBundle, key);
      if (match) {
        let val = match;
        if (params) {
          for (const [pk, pv] of Object.entries(params)) {
            val = val.replace(new RegExp(`{{${pk}}}`, "g"), String(pv));
          }
        }
        return val;
      }

      // Fallback to English in-memory dictionary
      const enBundle = IN_MEMORY_TRANSLATIONS["en"];
      const enMatch = resolveBundle(enBundle, key);
      if (enMatch) {
        let val = enMatch;
        if (params) {
          for (const [pk, pv] of Object.entries(params)) {
            val = val.replace(new RegExp(`{{${pk}}}`, "g"), String(pv));
          }
        }
        return val;
      }

      const isValidString = (val: unknown): val is string => {
        if (typeof val !== "string") return false;
        if (val.includes("returned an object") || (val.includes("key ") && val.includes("instead of string"))) {
          return false;
        }
        return true;
      };

      if (i18n.isInitialized && i18n.exists(key)) {
        const res = i18n.t(key, params as Record<string, unknown>);
        if (isValidString(res)) return res;
        if (typeof res === "number" || typeof res === "boolean") return String(res);
        return fallbackText || key;
      }

      const res = i18n.t(key, { ...params, defaultValue: fallbackText || key });
      if (isValidString(res)) return res;
      if (typeof res === "number" || typeof res === "boolean") return String(res);
      return fallbackText || key;
    },
    [currentLanguage, revision]
  );

  const getToolName = useCallback(
    (tool: { id: string; name: string }): string => {
      const localized = loadedToolTranslations[currentLanguage]?.[tool.id]?.name;
      if (localized) return localized;
      return t(`tools.${tool.id}.name`, tool.name);
    },
    [currentLanguage, t]
  );

  const getToolDescription = useCallback(
    (tool: { id: string; description?: string }): string => {
      const localized = loadedToolTranslations[currentLanguage]?.[tool.id]?.desc;
      if (localized) return localized;
      return t(`tools.${tool.id}.desc`, tool.description || "");
    },
    [currentLanguage, t]
  );

  const getCategoryName = useCallback(
    (categoryKey: string): string => {
      return t(`categories.${categoryKey}`, categoryKey);
    },
    [t]
  );

  const contextValue = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      changeLanguage: setLanguage,
      languageOption,
      isRtl,
      dir: isRtl ? ("rtl" as const) : ("ltr" as const),
      direction: isRtl ? ("rtl" as const) : ("ltr" as const),
      t,
      getToolName,
      getToolDescription,
      getCategoryName,
      cmsOverrides,
      saveCmsText,
      resetCmsText,
    }),
    [currentLanguage, setLanguage, languageOption, isRtl, t, getToolName, getToolDescription, getCategoryName, cmsOverrides, saveCmsText, resetCmsText, revision]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  return context || defaultContextValue;
};

/**
 * Custom hook that reads the persisted language from localStorage,
 * updates i18next on app load, and provides convenient helpers to switch and persist language.
 */
export const usePersistedLanguage = () => {
  const context = useLanguage();

  useEffect(() => {
    // Ensures i18next reflects the persisted language
    const persisted = getPersistedLanguage();
    if (persisted && i18n.isInitialized && i18n.language !== persisted) {
      i18n.changeLanguage(persisted).catch(() => {});
    }
  }, []);

  return {
    currentLanguage: context.currentLanguage,
    setLanguage: context.setLanguage,
    changeLanguage: context.changeLanguage,
    languageOption: context.languageOption,
    isRtl: context.isRtl,
    t: context.t,
    getPersistedLanguage,
  };
};

export { i18n };
export default i18n;
