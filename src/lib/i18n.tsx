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
import { INDIAN_LANGUAGES_TRANSLATIONS } from "./translations/indianLanguages";
import { GLOBAL_LANGUAGES_TRANSLATIONS } from "./translations/globalLanguages";
import { TOOL_TRANSLATIONS } from "./translations/toolTranslations";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRtl?: boolean;
}

export const SUPPORTED_LANGUAGES: ReadonlyArray<LanguageOption> = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", isRtl: true },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Chinese Simplified", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "zh-CN", name: "Chinese Simplified", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese Traditional", nativeName: "繁體中文", flag: "🇹🇼" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", isRtl: true },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", isRtl: true },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
];

export const RTL_LANGUAGES = ["ar", "ur", "fa"];

export const isRtlLanguage = (code: string): boolean => {
  return RTL_LANGUAGES.includes(code);
};

export const DEFAULT_LANGUAGE = "en";
export const STORAGE_KEY = "pdfsun_lang";
export const FALLBACK_STORAGE_KEYS = ["pdfsun_language", "i18nextLng", "user_language"];
const CMS_STORAGE_KEY = "pdfsun_cms_overrides";

/**
 * Retrieves the persisted language from localStorage using 'pdfsun_lang' key (with fallback support)
 */
export const getPersistedLanguage = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
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
    // 1. Check persisted user selection from localStorage first
    const persisted = getPersistedLanguage();
    if (persisted) {
      return persisted;
    }

    // 2. Fall back to browser navigator language preference
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
    nav: {
      home: "Home",
      allTools: "All PDF Tools",
      aiSuite: "AI Tools Suite",
      pricing: "Pricing Plans",
      loginRegister: "Login / Register",
      brandKit: "Brand Kit",
      searchBtn: "Search 57+ Tools",
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
      searchPlaceholder: "Search 57+ PDF tools (Cmd+K)...",
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
      utilitiesTitle: "57+ Pro PDF Utilities",
      utilitiesSub: "Complete PDF suite",
      ultraFast: "Ultra Fast Speed",
      ultraFastDesc: "Local browser acceleration engine.",
      noStorage: "No Storage Purge",
      noStorageDesc: "Zero permanent file retention guarantee.",
      geminiAi: "Gemini 3.6 AI",
      geminiAiDesc: "Smart chat, summary & translation.",
      tools50: "57+ Working Tools",
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
      a3: "Yes! PDFSun offers generous free access to all 57+ tools with zero registration required. For heavy power users who need high-capacity batch AI analysis or multi-gigabyte processing, Pro Sun plans are available.",
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
  hi: {
    nav: {
      home: "मुख्य पृष्ठ",
      allTools: "सभी पीडीएफ उपकरण",
      aiSuite: "एआई टूल्स सूट",
      pricing: "मूल्य निर्धारण योजनाएं",
      loginRegister: "लॉगिन / पंजीकरण",
      brandKit: "ब्रांड किट",
      searchBtn: "57+ टूल्स खोजें",
      history: "हाल का इतिहास",
      favorites: "पसंदीदा",
      theme: "थीम",
      language: "भाषा",
      adminPanel: "व्यवस्थापक पैनल (Admin)",
      userPortal: "उपयोगकर्ता डैशबोर्ड",
      logout: "लॉग आउट",
    },
    hero: {
      title: "एंटरप्राइज पीडीएफ टूल्स और दस्तावेज इंजन",
      subtitle: "100% क्लाइंट-साइड वेबअसेंबली प्रोसेसिंग। सुरक्षित, तेज़ और निजी।",
      chooseFiles: "डिवाइस से फाइलें चुनें",
      dropzoneTitle: "पीडीएफ फाइलें यहां छोड़ें या ब्राउज़ करने के लिए क्लिक करें",
      dropzoneSub: "आपकी फाइलें पूरी तरह से आपके डिवाइस पर रहती हैं। तेज़, सुरक्षित और गोपनीय।",
      dropzoneActiveTitle: "टूल वर्कस्पेस शुरू करने के लिए फाइलें छोड़ें",
      dropzoneActiveSub: "तुरंत प्रोसेसिंग शुरू करने के लिए अभी छोड़ें",
      or: "या",
      searchPlaceholder: "57+ पीडीएफ टूल्स खोजें (Cmd+K)...",
      statsFiles: "500K+ फाइलें प्रोसेस की गईं",
      statsPrivate: "100% इन-ब्राउज़र गोपनीयता",
    },
    quick_actions: {
      title: "लोकप्रिय त्वरित क्रियाएं",
      merge: "पीडीएफ जोड़ें (Merge)",
      split: "पीडीएफ अलग करें (Split)",
      compress: "पीडीएफ कंप्रेस करें",
      pdfToWord: "पीडीएफ से वर्ड (PDF to Word)",
      chatWithPdf: "पीडीएफ से एआई चैट",
      aiSummary: "एआई सारांश (Summary)",
    },
    badges: {
      privacyTitle: "100% इन-ब्राउज़र गोपनीयता",
      privacySub: "क्लाइंट-साइड वेबअसेंबली प्रोसेसिंग",
      utilitiesTitle: "57+ प्रो पीडीएफ टूल्स",
      utilitiesSub: "पूर्ण पीडीएफ सूट",
      ultraFast: "अल्ट्रा फास्ट स्पीड",
      ultraFastDesc: "लोकल ब्राउज़र एक्सेलेरेशन इंजन।",
      noStorage: "शून्य डेटा स्टोरेज",
      noStorageDesc: "कोई फाइल सेव नहीं की जाती, पूर्ण सुरक्षा।",
      geminiAi: "जेमिनी 3.6 एआई",
      geminiAiDesc: "स्मार्ट चैट, सारांश और अनुवाद।",
      tools50: "57+ कार्यशील टूल्स",
      tools50Desc: "पूर्ण पीडीएफ रूपांतरण सूट।",
      mostPopular: "सबसे लोकप्रिय टूल",
      pro: "प्रो (PRO)",
      ai: "एआई (AI)",
      student: "छात्रों के लिए आवश्यक",
      proTooltip: "प्रो सुविधा - एंटरप्राइज पीडीएफ प्रोसेसिंग",
    },
    categories: {
      all: "सभी टूल्स (All)",
      student: "छात्रों के लिए (Student)",
      ai: "एआई पीडीएफ टूल्स (AI)",
      popular: "लोकप्रिय टूल्स (Popular)",
      convert: "पीडीएफ बदलें (Convert)",
      edit: "संपादित करें (Edit)",
      organize: "पेज व्यवस्थित करें (Organize)",
      security: "सुरक्षा और लॉक (Security)",
      optimize: "कंप्रेस और ऑप्टिमाइज़",
      advanced: "उन्नत टूल्स (Advanced)",
    },
    formats: {
      badge: "सार्वभौमिक दस्तावेज़ कनवर्टर",
      title: "PDFSun पर समर्थित फ़ाइल प्रारूप",
      subtitle: "सभी प्रमुख कार्यालय प्रारूपों, वेक्टर छवियों और ई-पुस्तक मानकों में दस्तावेजों को बदलें, प्रोसेस और ऑप्टिमाइज़ करें।",
    },
    pricing: {
      badge: "तुरंत असीमित पीडीएफ प्रोसेसिंग",
      title: "सरल, पारदर्शी",
      titleHighlight: "मूल्य निर्धारण योजनाएं",
      subtitle: "100% निजी वेबअसेंबली गति के साथ असीमित पीडीएफ फाइलें प्रोसेस करें। कोई छिपा हुआ शुल्क नहीं। सभी योजनाओं पर पहले 7 दिनों की 100% मनी-बैक गारंटी।",
      currencyInr: "🇮🇳 भारतीय रुपया (₹) रेज़रपे",
      currencyUsd: "🌎 अमेरिकी डॉलर ($) रेज़रपे",
      monthly: "मासिक बिलिंग",
      yearly: "वार्षिक बिलिंग",
      savePercent: "40% बचत करें",
      guarantee: "पहले 7 दिन 100% मनी-बैक गारंटी",
      termsTitle: "अस्वीकरण और रिफंड शर्तें",
      termsText: "7-दिन की मनी-बैक गारंटी: यदि 30% से कम कोटा या क्रेडिट का उपयोग किया गया है, तो पहली बार की गई खरीद को 7 दिनों के भीतर वापस किया जा सकता है। गेटवे शुल्क गैर-वापसी योग्य हैं। किसी भी समय रद्द करें।",
      activePlan: "वर्तमान में सक्रिय योजना",
      planActivated: "योजना सक्रिय हो गई",
      buyCredits: "100 क्रेडिट खरीदें — ₹99",
      subscribeMonthly: "मासिक सदस्यता लें",
      getAnnual: "वार्षिक पहुंच प्राप्त करें — 40% बचाएं",
      getTeam: "टीम एक्सेस प्राप्त करें",
    },
    testimonials: {
      badge: "500,000+ उपयोगकर्ताओं द्वारा विश्वसनीय",
      title: "छात्रों, वकीलों और शोधकर्ताओं द्वारा विश्वसनीय",
      subtitle: "देखें कि छात्र और उद्योग पेशेवर PDFSun की दक्षता, गोपनीयता और जेमिनी एआई क्षमताओं के बारे में क्या कहते हैं।",
    },
    tools: {
      "openTool": "टूल खोलें",
      "share-pdfsun": {
        name: "पीडीएफसन साझा करें (Share PDFSun)",
        desc: "पीडीएफसन को दोस्तों और सहकर्मियों के साथ डायरेक्ट लिंक, क्यूआर कोड या सोशल नेटवर्क द्वारा आसानी से साझा करें।",
      },
      "merge-pdf": {
        name: "पीडीएफ जोड़ें (Merge PDF)",
        desc: "कई पीडीएफ दस्तावेजों को कस्टम पेज क्रम और लेआउट के साथ एक संगठित फाइल में आसानी से जोड़ें।",
      },
      "split-pdf": {
        name: "पीडीएफ अलग करें (Split PDF)",
        desc: "विशिष्ट पेज श्रेणियों को निकालें या प्रत्येक पेज को अलग-अलग स्वतंत्र पीडीएफ फाइलों में विभाजित करें।",
      },
      "compress-pdf": {
        name: "पीडीएफ कंप्रेस करें (Compress PDF)",
        desc: "दस्तावेज की विजुअल गुणवत्ता और स्पष्ट लिखावट को बनाए रखते हुए पीडीएफ फाइल का आकार काफी कम करें।",
      },
      "pdf-to-word": {
        name: "पीडीएफ से वर्ड (PDF to Word)",
        desc: "पीडीएफ दस्तावेजों को पूरी तरह से संपादन योग्य माइक्रोसॉफ्ट वर्ड (.docx) दस्तावेजों में बदलें।",
      },
      "word-to-pdf": {
        name: "वर्ड से पीडीएफ (Word to PDF)",
        desc: "माइक्रोसॉफ्ट वर्ड (.docx, .doc) फाइलों को पेशेवर, उच्च गुणवत्ता वाले पीडीएफ में बदलें।",
      },
      "ai-chat-pdf": {
        name: "पीडीएफ से एआई चैट (AI Chat PDF)",
        desc: "जेमिनी 3.6 एआई का उपयोग करके अपने पीडीएफ दस्तावेजों से सवाल पूछें, तथ्य खोजें और संवाद करें।",
      },
      "ai-pdf-summary": {
        name: "एआई दस्तावेज सारांश (AI Summary)",
        desc: "लंबे पीडीएफ दस्तावेजों से संक्षिप्त कार्यकारी सारांश, मुख्य बिंदु और संरचित रूपरेखा तैयार करें।",
      },
      "protect-pdf": {
        name: "पीडीएफ सुरक्षित करें (Protect PDF)",
        desc: "256-बिट एईएस एन्क्रिप्शन के साथ अपने गोपनीय पीडीएफ दस्तावेजों को पासवर्ड से सुरक्षित करें।",
      },
      "unlock-pdf": {
        name: "पीडीएफ अनलॉक करें (Unlock PDF)",
        desc: "पासवर्ड प्रतिबंधों को हटाएं और संपादन व साझा करने के लिए सुरक्षित पीडीएफ को अनलॉक करें।",
      },
      "watermark-pdf": {
        name: "वॉटरमार्क जोड़ें (Watermark PDF)",
        desc: "सटीक कोण, पारदर्शिता और स्थिति नियंत्रण के साथ अनुकूलित टेक्स्ट या लोगो वॉटरमार्क जोड़ें।",
      },
      "remove-watermark": {
        name: "वॉटरमार्क हटाएं (Remove Watermark)",
        desc: "पीडीएफ पेजों से अवांछित वॉटरमार्क स्टैम्प और बैकग्राउंड टेक्स्ट को साफ करें और मिटाएं।",
      },
      "rotate-pdf": {
        name: "पीडीएफ पेज घुमाएं (Rotate PDF)",
        desc: "अलग-अलग पेजों या पूरे दस्तावेज को 90°, 180°, या 270° दक्षिणावर्त या वामावर्त घुमाएं।",
      },
      "ocr-pdf": {
        name: "ओसीआर टेक्स्ट पहचान (OCR PDF)",
        desc: "स्कैन किए गए पीडीएफ दस्तावेजों और छवियों से संपादन योग्य टेक्स्ट को सटीक रूप से पहचानें।",
      },
      "edit-pdf-metadata": {
        name: "मेटाडेटा संपादित करें (Edit Metadata)",
        desc: "शीर्षक, लेखक, विषय, कीवर्ड और निर्माण तिथि जैसे दस्तावेज गुणों को देखें और संपादित करें।",
      },
      "view-pdf-metadata": {
        name: "मेटाडेटा देखें (View Metadata)",
        desc: "छिपे हुए पीडीएफ दस्तावेज मेटाडेटा, निर्माता टूल, एन्क्रिप्शन प्रकार और पेज आयामों का निरीक्षण करें।",
      },
      "organize-pdf": {
        name: "पेज व्यवस्थित करें (Organize Pages)",
        desc: "विजुअल ड्रैग-एंड-ड्रॉप के साथ पीडीएफ में पेजों को पुनर्व्यवस्थित, हटाएं या डुप्लिकेट करें।",
      },
      "pdf-to-jpg": {
        name: "पीडीएफ से जेपीजी (PDF to JPG)",
        desc: "पीडीएफ दस्तावेज के प्रत्येक पेज को उच्च रिज़ॉल्यूशन वाली जेपीजी छवियों में बदलें।",
      },
      "jpg-to-pdf": {
        name: "जेपीजी से पीडीएफ (JPG to PDF)",
        desc: "कई तस्वीरों, स्क्रीनशॉट या जेपीजी छवियों को एक संयुक्त पीडीएफ फाइल में जोड़ें।",
      },
      "pdf-to-excel": {
        name: "पीडीएफ से एक्सेल (PDF to Excel)",
        desc: "पीडीएफ दस्तावेजों से डेटा तालिकाओं को संपादन योग्य माइक्रोसॉफ्ट एक्सेल (.xlsx) में निकालें।",
      },
      "excel-to-pdf": {
        name: "एक्सेल से पीडीएफ (Excel to PDF)",
        desc: "एक्सेल स्प्रेडशीट (.xlsx, .xls) को प्रिंट करने योग्य सुरुचिपूर्ण पीडीएफ दस्तावेजों में बदलें।",
      },
      "pdf-to-powerpoint": {
        name: "पीडीएफ से पावरपॉइंट (PDF to PPT)",
        desc: "पीडीएफ प्रस्तुतियों को संपादन योग्य माइक्रोसॉफ्ट पावरपॉइंट (.pptx) स्लाइड में बदलें।",
      },
      "powerpoint-to-pdf": {
        name: "पावरपॉइंट से पीडीएफ (PPT to PDF)",
        desc: "माइक्रोसॉफ्ट पावरपॉइंट फाइलों को आसानी से साझा करने योग्य पीडीएफ में बदलें।",
      },
      "annotate-pdf": {
        name: "पीडीएफ एनोटेट करें (Annotate PDF)",
        desc: "किसी भी पीडीएफ पर आकार, फ्रीहैंड चित्र, स्टिकी नोट्स और टेक्स्ट टिप्पणियां जोड़ें।",
      },
      "sign-pdf": {
        name: "पीडीएफ पर हस्ताक्षर करें (Sign PDF)",
        desc: "अपने पीडीएफ पेजों पर सीधे सत्यापन योग्य डिजिटल इलेक्ट्रॉनिक हस्ताक्षर बनाएं और लगाएं।",
      },
    },
    faq: {
      sectionBadge: "सुरक्षा और गोपनीयता अक्सर पूछे जाने वाले प्रश्न",
      toolFaqBadge: "टूल प्रश्नोत्तरी (FAQs)",
      title: "अक्सर पूछे जाने वाले प्रश्न (FAQs)",
      toolTitle: "{{toolName}} के बारे में अक्सर पूछे जाने वाले प्रश्न",
      subtitle: "PDFSun सुरक्षा, डेटा गोपनीयता और ब्राउज़र संचालन के बारे में वह सब कुछ जो आपको जानना आवश्यक है।",
      toolSubtitle: "{{toolName}} को सुरक्षित, स्वतंत्र और कुशलता से उपयोग करने के बारे में पूरी जानकारी।",
      q1: "क्या मेरी अपलोड की गई पीडीएफ फाइलें PDFSun पर सुरक्षित हैं?",
      a1: "बिल्कुल! PDFSun पर गोपनीयता सर्वोपरि है। अधिकांश कार्य (जोड़ना, अलग करना, घुमाना, पासवर्ड लगाना, व्यवस्थित करना) वेबअसेंबली के माध्यम से 100% स्थानीय रूप से आपके ब्राउज़र में चलते हैं। एआई सुविधाओं के लिए, अस्थायी फाइलें टीएलएस एचटीटीपीएस पर मेमोरी में सुरक्षित रूप से प्रोसेस होती हैं और काम पूरा होते ही तुरंत हटा दी जाती हैं। हम आपकी फाइलें कभी स्टोर या साझा नहीं करते।",
      q2: "PDFSun एआई चैट, सारांश और व्याख्या को कैसे संभालता है?",
      a2: "PDFSun आपके पीडीएफ से निकाले गए टेक्स्ट का विश्लेषण करने के लिए गूगल जेमिनी 3.6 एआई को एकीकृत करता है। आप 200+ पेजों की पाठ्यपुस्तकों का सारांश बना सकते हैं, विशिष्ट शोध प्रश्न पूछ सकते हैं, फ्लैशकार्ड बना सकते हैं, या कुछ ही सेकंड में पूरे दस्तावेजों का 30+ भाषाओं में अनुवाद कर सकते हैं।",
      q3: "क्या PDFSun का उपयोग पूरी तरह से मुफ़्त है?",
      a3: "हाँ! PDFSun बिना किसी पंजीकरण या साइन-अप के सभी 57+ टूल्स तक उदार मुफ्त पहुंच प्रदान करता है। भारी बिजली उपयोगकर्ताओं के लिए जो उच्च क्षमता वाले बैच एआई विश्लेषण या मल्टी-गीगाबाइट प्रोसेसिंग चाहते हैं, उनके लिए प्रो सन प्लान उपलब्ध हैं।",
      q4: "क्या मैं PDFSun को ऑफलाइन या PWA के रूप में उपयोग कर सकता हूँ?",
      a4: "हाँ! PDFSun एक प्रोग्रेसिव वेब ऐप (PWA) के रूप में बनाया गया है। आप इसे अपने डेस्कटॉप, मैक, आईफोन या एंड्रॉइड डिवाइस पर इंस्टॉल कर सकते हैं। सभी मुख्य पीडीएफ टूल्स बिना इंटरनेट कनेक्शन के भी काम करते हैं।",
      q5: "PDFSun किन फाइल स्वरूपों का समर्थन करता है?",
      a5: "PDFSun पीडीएफ, माइक्रोसॉफ्ट ऑफिस (DOCX, XLSX, PPTX), छवियां (JPG, PNG, WEBP), वेब (HTML, XML), ई-बुक्स (EPUB), और टेक्स्ट (TXT, RTF, CSV) का समर्थन करता है।",
    },
    workspace: {
      dropOrSelect: "फाइलें यहां छोड़ें या डिवाइस से चुनने के लिए क्लिक करें",
      processFile: "दस्तावेज प्रोसेस करें",
      processing: "प्रोसेसिंग जारी है...",
      downloadReady: "आपका दस्तावेज डाउनलोड के लिए तैयार है!",
      downloadBtn: "पीडीएफ डाउनलोड करें",
      resetBtn: "एक और फाइल प्रोसेस करें",
      openInNew: "टूल खोलें",
    },
    footer: {
      tagline: "PDFSun (pdfsun.in) — आपका स्मार्ट डॉक्यूमेंट साथी। जेमिनी 3.6 एआई और 100% इन-ब्राउज़र गोपनीयता के साथ दस्तावेजों को मर्ज, स्प्लिट, कंप्रेस, कन्वर्ट, एडिट और विश्लेषण करें।",
      brandKit: "ब्रांड पहचान दिशानिर्देश और लोगो किट",
      quickLinks: "त्वरित लिंक",
      policies: "नीतियां (Policies)",
      resources: "संसाधन (Resources)",
      social: "सोशल मीडिया",
      home: "मुख्य पृष्ठ",
      allTools: "सभी पीडीएफ उपकरण",
      aiSuite: "एआई टूल्स सूट",
      pricing: "मूल्य निर्धारण योजनाएं",
      blog: "ब्लॉग और लेख",
      support: "सहायता और संपर्क",
      privacyPolicy: "गोपनीयता नीति",
      termsOfService: "सेवा की शर्तें",
      aboutUs: "हमारे बारे में",
      helpCenter: "सहायता केंद्र",
      sitemap: "साइटमैप",
      rights: "सर्वाधिकार सुरक्षित।",
      developedBy: "डिज़ाइन और विकसित द्वारा",
      leadDev: "मुख्य वेब डेवलपर",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      allTools: "Todas las herramientas PDF",
      aiSuite: "Suite de herramientas IA",
      pricing: "Planes de precios",
      loginRegister: "Iniciar sesión / Registrarse",
      brandKit: "Kit de marca",
      searchBtn: "Buscar más de 57 herramientas",
      history: "Historial reciente",
      favorites: "Favoritos",
      theme: "Tema",
      language: "Idioma",
      adminPanel: "Panel de administración",
      userPortal: "Panel de usuario",
      logout: "Cerrar sesión",
    },
    hero: {
      title: "Motor de documentos y herramientas PDF empresariales",
      subtitle: "Procesamiento WebAssembly 100% en el cliente. Privado, rápido y seguro.",
      chooseFiles: "Elegir archivos del dispositivo",
      dropzoneTitle: "Arrastre archivos PDF aquí o haga clic para explorar",
      dropzoneSub: "Los archivos permanecen completamente en su dispositivo. Rápido, seguro y privado.",
      dropzoneActiveTitle: "Suelte los archivos para iniciar el espacio de trabajo",
      dropzoneActiveSub: "Suelte ahora para comenzar el procesamiento al instante",
      or: "o",
      searchPlaceholder: "Buscar más de 57 herramientas PDF (Cmd+K)...",
      statsFiles: "Más de 500K archivos procesados",
      statsPrivate: "Privacidad 100% en el navegador",
    },
    quick_actions: {
      title: "Acciones rápidas populares",
      merge: "Combinar PDF",
      split: "Dividir PDF",
      compress: "Comprimir PDF",
      pdfToWord: "PDF a Word",
      chatWithPdf: "Chat IA con PDF",
      aiSummary: "Resumen IA",
    },
    badges: {
      privacyTitle: "Privacidad 100% en el navegador",
      privacySub: "Procesamiento WebAssembly del lado del cliente",
      utilitiesTitle: "Más de 57 herramientas PDF Pro",
      utilitiesSub: "Suite PDF completa",
      ultraFast: "Velocidad ultra rápida",
      ultraFastDesc: "Motor de aceleración en navegador local.",
      noStorage: "Cero retención de archivos",
      noStorageDesc: "Garantía de eliminación permanente e inmediata.",
      geminiAi: "Gemini 3.6 IA",
      geminiAiDesc: "Chat inteligente, resumen y traducción.",
      tools50: "57+ herramientas funcionales",
      tools50Desc: "Suite completa de conversión PDF.",
      mostPopular: "Herramienta más popular",
      pro: "PRO",
      ai: "IA",
      student: "Esencial para estudiantes",
      proTooltip: "Función Pro - Procesamiento PDF empresarial",
    },
    categories: {
      all: "Todas las utilidades",
      student: "Esencial para estudiantes",
      ai: "Herramientas IA para PDF",
      popular: "Herramientas populares",
      convert: "Convertir PDF",
      edit: "Editar y anotar",
      organize: "Organizar y páginas",
      security: "Seguridad y proteger",
      optimize: "Comprimir y optimizar",
      advanced: "Avanzado",
    },
    formats: {
      badge: "Convertidor universal de documentos",
      title: "Formatos de archivo admitidos en PDFSun",
      subtitle: "Convierta, procese y optimice documentos en todos los formatos principales.",
    },
    pricing: {
      badge: "PROCESAMIENTO DE PDF ILIMITADO AL INSTANTE",
      title: "Planes de Precios",
      titleHighlight: "Simples y Transparentes",
      subtitle: "Procese archivos PDF ilimitados con velocidad WebAssembly 100% privada. Sin tarifas ocultas.",
      currencyInr: "🇮🇳 INR (₹) Razorpay",
      currencyUsd: "🌎 USD ($) Razorpay",
      monthly: "Facturación mensual",
      yearly: "Facturación anual",
      savePercent: "Ahorre 40%",
      guarantee: "Primeros 7 días 100% garantía de devolución de dinero",
      termsTitle: "Términos de reembolso",
      termsText: "Garantía de devolución de dinero de 7 días para compras elegibles por primera vez.",
      activePlan: "PLAN ACTUALMENTE ACTIVO",
      planActivated: "PLAN ACTIVADO",
      buyCredits: "Comprar 100 créditos — ₹99",
      subscribeMonthly: "Suscribirse mensualmente",
      getAnnual: "Acceso anual — Ahorre 40%",
      getTeam: "Acceso de equipo",
    },
    testimonials: {
      badge: "Amado por más de 500,000 usuarios",
      title: "Confiado por estudiantes, abogados e investigadores",
      subtitle: "Vea lo que dicen los profesionales sobre la eficiencia y privacidad de PDFSun.",
    },
    tools: {
      "openTool": "Abrir herramienta",
      "share-pdfsun": {
        name: "Compartir PDFSun",
        desc: "Comparta PDFSun con colegas y compañeros mediante enlaces directos, códigos QR de alta resolución o redes sociales.",
      },
      "merge-pdf": {
        name: "Combinar PDF",
        desc: "Combine varios documentos PDF en un solo archivo organizado con orden y diseño personalizados.",
      },
      "split-pdf": {
        name: "Dividir PDF",
        desc: "Extraiga rangos de páginas específicos o divida cada página en archivos PDF independientes al instante.",
      },
      "compress-pdf": {
        name: "Comprimir PDF",
        desc: "Reduzca el tamaño de archivo PDF significativamente manteniendo la máxima calidad visual y nitidez tipográfica.",
      },
      "pdf-to-word": {
        name: "PDF a Word",
        desc: "Convierta documentos PDF en documentos de Microsoft Word (.docx) totalmente editables con formato intacto.",
      },
      "word-to-pdf": {
        name: "Word a PDF",
        desc: "Convierta archivos de Microsoft Word (.docx, .doc) en documentos PDF limpios y profesionales.",
      },
      "ai-chat-pdf": {
        name: "Chat IA con PDF",
        desc: "Haga preguntas, extraiga datos y converse de forma interactiva con sus documentos PDF mediante Gemini 3.6 IA.",
      },
      "ai-pdf-summary": {
        name: "Resumen de documentos con IA",
        desc: "Genere resúmenes ejecutivos concisos, conclusiones clave y esquemas estructurados de documentos PDF extensos.",
      },
      "protect-pdf": {
        name: "Proteger PDF (Contraseña)",
        desc: "Cifre y proteja con contraseña sus documentos PDF confidenciales con cifrado AES de 256 bits.",
      },
      "unlock-pdf": {
        name: "Desbloquear PDF (Quitar contraseña)",
        desc: "Elimine las restricciones de contraseña y descifre archivos PDF protegidos para editarlos y compartirlos.",
      },
    },
    faq: {
      sectionBadge: "Preguntas frecuentes sobre seguridad y privacidad",
      toolFaqBadge: "Preguntas frecuentes de la herramienta",
      title: "Preguntas frecuentes",
      toolTitle: "Preguntas frecuentes sobre {{toolName}}",
      subtitle: "Todo lo que necesita saber sobre la seguridad, privacidad de datos y operaciones en el navegador de PDFSun.",
      toolSubtitle: "Todo lo que necesita saber para usar {{toolName}} de manera segura, gratuita y eficiente.",
      q1: "¿Están seguros mis archivos PDF cargados en PDFSun?",
      a1: "¡Absolutamente! En PDFSun, la privacidad es primordial. La mayoría de las operaciones se ejecutan 100% localmente en su navegador a través de WebAssembly.",
      q2: "¿Cómo maneja PDFSun el chat, resúmenes y explicaciones de IA?",
      a2: "PDFSun integra Google Gemini 3.6 IA para analizar texto extraído de su PDF de forma rápida y segura.",
      q3: "¿Es PDFSun completamente gratuito?",
      a3: "¡Sí! PDFSun ofrece acceso gratuito generoso a todas las más de 57 herramientas sin necesidad de registrarse.",
      q4: "¿Puedo usar PDFSun sin conexión o como PWA?",
      a4: "¡Sí! PDFSun está creado como una aplicación web progresiva (PWA). Puede instalarla en Desktop, Mac, iPhone o Android.",
      q5: "¿Qué formatos de archivo admite PDFSun?",
      a5: "PDFSun admite PDF, Microsoft Office (DOCX, XLSX, PPTX), Imágenes (JPG, PNG, WEBP), Web (HTML, XML), eBooks (EPUB) y Texto (TXT, RTF, CSV).",
    },
    workspace: {
      dropOrSelect: "Arrastre archivos aquí o haga clic para elegir del dispositivo",
      processFile: "Procesar documento",
      processing: "Procesando...",
      downloadReady: "¡Su documento está listo para descargar!",
      downloadBtn: "Descargar PDF",
      resetBtn: "Procesar otro archivo",
      openInNew: "Abrir herramienta",
    },
    footer: {
      tagline: "PDFSun (pdfsun.in) — Su compañero inteligente de documentos con Gemini 3.6 IA y 100% de privacidad en el navegador.",
      brandKit: "Pautas de identidad de marca",
      quickLinks: "Enlaces rápidos",
      policies: "Políticas",
      resources: "Recursos",
      social: "Redes sociales",
      home: "Inicio",
      allTools: "Todas las herramientas PDF",
      aiSuite: "Suite de herramientas IA",
      pricing: "Planes de precios",
      blog: "Blog y artículos",
      support: "Soporte y contacto",
      privacyPolicy: "Política de privacidad",
      termsOfService: "Términos de servicio",
      aboutUs: "Sobre nosotros",
      helpCenter: "Centro de ayuda",
      sitemap: "Mapa del sitio",
      rights: "Todos los derechos reservados.",
      developedBy: "Diseñado y desarrollado por",
      leadDev: "Desarrollador web principal",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      allTools: "Tous les outils PDF",
      aiSuite: "Suite d'outils IA",
      pricing: "Tarifs",
      loginRegister: "Connexion / Inscription",
      brandKit: "Kit de marque",
      searchBtn: "Rechercher parmi 57+ outils",
      history: "Historique récent",
      favorites: "Favoris",
      theme: "Thème",
      language: "Langue",
      adminPanel: "Panneau d'administration",
      userPortal: "Tableau de bord utilisateur",
      logout: "Déconnexion",
    },
    hero: {
      title: "Moteur de documents et outils PDF pour entreprises",
      subtitle: "Traitement WebAssembly 100% côté client. Privé, rapide et sécurisé.",
      chooseFiles: "Choisir des fichiers sur l'appareil",
      dropzoneTitle: "Déposez vos fichiers PDF ici ou cliquez pour parcourir",
      dropzoneSub: "Vos fichiers restent entièrement sur votre appareil. Rapide, sûr et confidentiel.",
      dropzoneActiveTitle: "Déposez pour lancer l'espace de travail",
      dropzoneActiveSub: "Déposez maintenant pour commencer le traitement instantanément",
      or: "ou",
      searchPlaceholder: "Rechercher parmi plus de 57 outils PDF (Cmd+K)...",
      statsFiles: "+500K fichiers traités",
      statsPrivate: "100% Confidentialité dans le navigateur",
    },
    quick_actions: {
      title: "Actions rapides populaires",
      merge: "Fusionner PDF",
      split: "Diviser PDF",
      compress: "Compresser PDF",
      pdfToWord: "PDF en Word",
      chatWithPdf: "Chat IA avec PDF",
      aiSummary: "Résumé IA",
    },
    badges: {
      privacyTitle: "100% Confidentialité dans le navigateur",
      privacySub: "Traitement WebAssembly côté client",
      utilitiesTitle: "57+ Outils PDF Pro",
      utilitiesSub: "Suite PDF complète",
      ultraFast: "Vitesse ultra rapide",
      ultraFastDesc: "Moteur d'accélération dans le navigateur local.",
      noStorage: "Zéro conservation des fichiers",
      noStorageDesc: "Garantie de suppression permanente et immédiate.",
      geminiAi: "Gemini 3.6 IA",
      geminiAiDesc: "Chat intelligent, résumé et traduction.",
      tools50: "57+ Outils fonctionnels",
      tools50Desc: "Suite complète de conversion PDF.",
      mostPopular: "Outil le plus populaire",
      pro: "PRO",
      ai: "IA",
      student: "Essentiel pour étudiants",
      proTooltip: "Fonctionnalité Pro - Traitement PDF d'entreprise",
    },
    categories: {
      all: "Tous les outils",
      student: "Essentiel pour étudiants",
      ai: "Outils PDF IA",
      popular: "Outils populaires",
      convert: "Convertir PDF",
      edit: "Modifier et annoter",
      organize: "Organiser et pages",
      security: "Sécurité et protéger",
      optimize: "Compresser et optimiser",
      advanced: "Avancé",
    },
    formats: {
      badge: "Convertisseur universel de documents",
      title: "Formats de fichiers pris en charge sur PDFSun",
      subtitle: "Convertissez, traitez et optimisez des documents dans tous les principaux formats de bureau.",
    },
    pricing: {
      badge: "TRAITEMENT PDF ILLIMITÉ INSTANTANÉ",
      title: "Tarification",
      titleHighlight: "Simple et Transparente",
      subtitle: "Traitez des fichiers PDF illimités avec une vitesse WebAssembly 100% privée.",
      currencyInr: "🇮🇳 INR (₹) Razorpay",
      currencyUsd: "🌎 USD ($) Razorpay",
      monthly: "Facturation mensuelle",
      yearly: "Facturation annuelle",
      savePercent: "Économisez 40%",
      guarantee: "Garantie de remboursement de 7 jours",
      termsTitle: "Conditions de remboursement",
      termsText: "Garantie de remboursement de 7 jours sur les premiers achats éligibles.",
      activePlan: "PLAN ACTUELLEMENT ACTIF",
      planActivated: "PLAN ACTIVÉ",
      buyCredits: "Acheter 100 crédits — ₹99",
      subscribeMonthly: "S'abonner mensuellement",
      getAnnual: "Accès annuel — Économisez 40%",
      getTeam: "Accès d'équipe",
    },
    testimonials: {
      badge: "Apprécié par plus de 500 000 utilisateurs",
      title: "Reconnu par les étudiants, avocats et chercheurs",
      subtitle: "Découvrez ce que disent les professionnels sur l'efficacité et la confidentialité de PDFSun.",
    },
    tools: {
      "openTool": "Ouvrir l'outil",
      "share-pdfsun": {
        name: "Partager PDFSun",
        desc: "Partagez PDFSun avec vos amis et collègues via des liens directs, des codes QR haute résolution et les réseaux sociaux.",
      },
      "merge-pdf": {
        name: "Fusionner PDF",
        desc: "Combinez plusieurs documents PDF en un seul fichier organisé avec ordre et disposition personnalisés.",
      },
      "split-pdf": {
        name: "Diviser PDF",
        desc: "Extrayez des plages de pages spécifiques ou divisez chaque page en fichiers PDF autonomes instantanément.",
      },
      "compress-pdf": {
        name: "Compresser PDF",
        desc: "Réduisez considérablement la taille du fichier PDF tout en préservant une qualité visuelle maximale.",
      },
      "pdf-to-word": {
        name: "PDF en Word",
        desc: "Convertissez des documents PDF en documents Microsoft Word (.docx) entièrement modifiables.",
      },
      "word-to-pdf": {
        name: "Word en PDF",
        desc: "Convertissez des fichiers Microsoft Word (.docx, .doc) en documents PDF nets et professionnels.",
      },
      "ai-chat-pdf": {
        name: "Chat IA avec PDF",
        desc: "Posez des questions, extrayez des faits et discutez avec vos documents PDF grâce à l'IA Gemini 3.6.",
      },
      "ai-pdf-summary": {
        name: "Résumé de document IA",
        desc: "Générez des résumés concis, des points clés et des plans structurés à partir de longs documents PDF.",
      },
    },
    faq: {
      sectionBadge: "FAQ Sécurité et Confidentialité",
      toolFaqBadge: "FAQ de l'outil",
      title: "Foire aux questions",
      toolTitle: "Foire aux questions sur {{toolName}}",
      subtitle: "Tout ce que vous devez savoir sur la sécurité, la confidentialité des données et les opérations de PDFSun.",
      toolSubtitle: "Tout ce que vous devez savoir pour utiliser {{toolName}} en toute sécurité.",
      q1: "Mes fichiers PDF téléchargés sont-ils en sécurité sur PDFSun ?",
      a1: "Absolument ! Chez PDFSun, la confidentialité est primordiale. Les opérations s'exécutent 100% localement dans votre navigateur via WebAssembly.",
      q2: "Comment PDFSun gère-t-il le chat, les résumés et les explications par IA ?",
      a2: "PDFSun intègre Google Gemini 3.6 IA pour analyser le texte extrait de votre PDF rapidement et en toute sécurité.",
      q3: "PDFSun est-il totalement gratuit ?",
      a3: "Oui ! PDFSun offre un accès gratuit généreux à l'ensemble des plus de 57 outils sans inscription.",
      q4: "Puis-je utiliser PDFSun hors ligne ou en tant que PWA ?",
      a4: "Oui ! PDFSun est une Progressive Web App (PWA) installable sur ordinateur ou smartphone.",
      q5: "Quels formats de fichiers sont pris en charge ?",
      a5: "PDFSun prend en charge PDF, Microsoft Office (DOCX, XLSX, PPTX), Images (JPG, PNG, WEBP), Web (HTML) et Texte.",
    },
    workspace: {
      dropOrSelect: "Déposez des fichiers ici ou cliquez pour choisir sur l'appareil",
      processFile: "Traiter le document",
      processing: "Traitement en cours...",
      downloadReady: "Votre document est prêt à être téléchargé !",
      downloadBtn: "Télécharger le PDF",
      resetBtn: "Traiter un autre fichier",
      openInNew: "Ouvrir l'outil",
    },
    footer: {
      tagline: "PDFSun (pdfsun.in) — Votre compagnon intelligent pour vos documents avec Gemini 3.6 IA et confidentialité totale.",
      brandKit: "Charte graphique",
      quickLinks: "Liens rapides",
      policies: "Politiques",
      resources: "Ressources",
      social: "Réseaux sociaux",
      home: "Accueil",
      allTools: "Tous les outils PDF",
      aiSuite: "Suite d'outils IA",
      pricing: "Tarifs",
      blog: "Blog & Articles",
      support: "Support & Contact",
      privacyPolicy: "Politique de confidentialité",
      termsOfService: "Conditions d'utilisation",
      aboutUs: "À propos",
      helpCenter: "Centre d'aide",
      sitemap: "Plan du site",
      rights: "Tous droits réservés.",
      developedBy: "Conçu et développé par",
      leadDev: "Développeur Web Principal",
    },
  },
  de: {
    nav: {
      home: "Startseite",
      allTools: "Alle PDF-Tools",
      aiSuite: "KI-Werkzeuge",
      pricing: "Preise & Tarife",
      loginRegister: "Anmelden / Registrieren",
      brandKit: "Brand Kit",
      searchBtn: "57+ Tools suchen",
      history: "Verlauf",
      favorites: "Favoriten",
      theme: "Design",
      language: "Sprache",
      adminPanel: "Admin-Bereich",
      userPortal: "Benutzer-Dashboard",
      logout: "Abmelden",
    },
    hero: {
      title: "Enterprise PDF-Tools & Dokumenten-Engine",
      subtitle: "100% clientseitige WebAssembly-Verarbeitung. Privat, schnell und sicher.",
      chooseFiles: "Dateien vom Gerät auswählen",
      dropzoneTitle: "PDF-Dateien hier ablegen oder klicken zum Durchsuchen",
      dropzoneSub: "Dateien verbleiben vollständig auf Ihrem Gerät. Schnell, sicher und privat.",
      dropzoneActiveTitle: "Dateien loslassen, um Tool zu starten",
      dropzoneActiveSub: "Jetzt ablegen für sofortige Verarbeitung",
      or: "oder",
      searchPlaceholder: "57+ PDF-Tools durchsuchen (Cmd+K)...",
      statsFiles: "Über 500.000 verarbeitete Dateien",
      statsPrivate: "100% Datenschutz im Browser",
    },
    quick_actions: {
      title: "Beliebte Schnellaktionen",
      merge: "PDF zusammenfügen",
      split: "PDF teilen",
      compress: "PDF komprimieren",
      pdfToWord: "PDF in Word",
      chatWithPdf: "KI-Chat mit PDF",
      aiSummary: "KI-Zusammenfassung",
    },
    badges: {
      privacyTitle: "100% Datenschutz im Browser",
      privacySub: "Clientseitige WebAssembly-Verarbeitung",
      utilitiesTitle: "57+ Pro PDF-Tools",
      utilitiesSub: "Komplette PDF-Suite",
      ultraFast: "Ultraschnelle Geschwindigkeit",
      ultraFastDesc: "Lokale Browser-Beschleunigung.",
      noStorage: "Keine Datenspeicherung",
      noStorageDesc: "Garantie der sofortigen und permanenten Löschung.",
      geminiAi: "Gemini 3.6 KI",
      geminiAiDesc: "Intelligenter Chat, Zusammenfassung & Übersetzung.",
      tools50: "57+ funktionierende Tools",
      tools50Desc: "Komplette Suite für PDF-Konvertierung.",
      mostPopular: "Beliebtestes Tool",
      pro: "PRO",
      ai: "KI",
      student: "Ideal für Studenten",
      proTooltip: "Pro-Funktion - Enterprise PDF-Verarbeitung",
    },
    categories: {
      all: "Alle Tools",
      student: "Für Studenten",
      ai: "KI PDF-Tools",
      popular: "Beliebte Tools",
      convert: "PDF konvertieren",
      edit: "Bearbeiten & Anmerkungen",
      organize: "Seiten organisieren",
      security: "Sicherheit & Schutz",
      optimize: "Komprimieren & Optimieren",
      advanced: "Erweitert",
    },
    formats: {
      badge: "Universeller Dokumenten-Konverter",
      title: "Unterstützte Dateiformate auf PDFSun",
      subtitle: "Konvertieren, verarbeiten und optimieren Sie Dokumente in allen wichtigen Office-Formaten.",
    },
    pricing: {
      badge: "SOFORTIGE UNBEGRENZTE PDF-VERARBEITUNG",
      title: "Einfache, transparente",
      titleHighlight: "Preispläne",
      subtitle: "Verarbeiten Sie unbegrenzte PDF-Dateien mit 100% privater WebAssembly-Geschwindigkeit.",
      currencyInr: "🇮🇳 INR (₹) Razorpay",
      currencyUsd: "🌎 USD ($) Razorpay",
      monthly: "Monatliche Abrechnung",
      yearly: "Jährliche Abrechnung",
      savePercent: "40% sparen",
      guarantee: "Erste 7 Tage 100% Geld-zurück-Garantie",
      termsTitle: "Rückerstattungsrichtlinien",
      termsText: "7 Tage Geld-zurück-Garantie für berechtigte Erstkäufe.",
      activePlan: "DERZEIT AKTIVER PLAN",
      planActivated: "PLAN AKTIVIERT",
      buyCredits: "100 Credits kaufen — ₹99",
      subscribeMonthly: "Monatlich abonnieren",
      getAnnual: "Jahreszugang — 40% sparen",
      getTeam: "Team-Zugang erhalten",
    },
    testimonials: {
      badge: "Von über 500.000 Nutzern geschätzt",
      title: "Von Studenten, Anwälten & Forschern geschätzt",
      subtitle: "Erfahren Sie, was Fachleute über die Effizienz und den Datenschutz von PDFSun sagen.",
    },
    tools: {
      "openTool": "Tool öffnen",
      "share-pdfsun": {
        name: "PDFSun teilen",
        desc: "Teilen Sie PDFSun mit Freunden und Kollegen über direkte Links und QR-Codes.",
      },
      "merge-pdf": {
        name: "PDF zusammenfügen",
        desc: "Kombinieren Sie mehrere PDF-Dokumente in einer einzigen Datei.",
      },
      "split-pdf": {
        name: "PDF teilen",
        desc: "Extrahieren Sie bestimmte Seitenbereiche oder teilen Sie PDF-Seiten auf.",
      },
      "compress-pdf": {
        name: "PDF komprimieren",
        desc: "Reduzieren Sie die Dateigröße bei maximaler visueller Qualität.",
      },
      "pdf-to-word": {
        name: "PDF in Word",
        desc: "Konvertieren Sie PDF-Dokumente in bearbeitbare Microsoft Word-Dateien.",
      },
      "word-to-pdf": {
        name: "Word in PDF",
        desc: "Konvertieren Sie Microsoft Word-Dateien in professionelle PDFs.",
      },
      "ai-chat-pdf": {
        name: "KI-Chat mit PDF",
        desc: "Stellen Sie Fragen und chatten Sie mit Ihren PDF-Dokumenten via Gemini 3.6 KI.",
      },
      "ai-pdf-summary": {
        name: "KI-Zusammenfassung",
        desc: "Erstellen Sie prägnante Zusammenfassungen aus langen PDFs.",
      },
    },
    faq: {
      sectionBadge: "Sicherheits- & Datenschutz-FAQ",
      toolFaqBadge: "Tool-FAQs",
      title: "Häufig gestellte Fragen",
      toolTitle: "Häufig gestellte Fragen zu {{toolName}}",
      subtitle: "Alles, was Sie über Sicherheit und Datenschutz bei PDFSun wissen müssen.",
      toolSubtitle: "Alles über die sichere Nutzung von {{toolName}}.",
      q1: "Sind meine hochgeladenen PDF-Dateien auf PDFSun sicher?",
      a1: "Absolut! Bei PDFSun hat Datenschutz oberste Priorität. Operationen laufen 100% lokal im Browser über WebAssembly.",
      q2: "Wie funktioniert der KI-Chat mit PDF?",
      a2: "PDFSun integriert Google Gemini 3.6 KI, um Text aus Ihrer PDF schnell und sicher zu analysieren.",
      q3: "Ist PDFSun völlig kostenlos?",
      a3: "Ja! PDFSun bietet großzügigen kostenlosen Zugang zu allen 57+ Tools ohne Registrierung.",
      q4: "Kann ich PDFSun offline oder als PWA nutzen?",
      a4: "Ja! PDFSun ist eine installierbare Progressive Web App (PWA).",
      q5: "Welche Dateiformate werden unterstützt?",
      a5: "PDFSun unterstützt PDF, Microsoft Office, Bilder (JPG, PNG, WEBP), Web und Textdateien.",
    },
    workspace: {
      dropOrSelect: "Dateien hier ablegen oder klicken zur Auswahl",
      processFile: "Dokument verarbeiten",
      processing: "Verarbeitung läuft...",
      downloadReady: "Ihr Dokument steht zum Download bereit!",
      downloadBtn: "PDF herunterladen",
      resetBtn: "Weitere Datei verarbeiten",
      openInNew: "Tool öffnen",
    },
    footer: {
      tagline: "PDFSun (pdfsun.in) — Ihr intelligenter Dokumentenbegleiter mit Gemini 3.6 KI und 100% Datenschutz.",
      brandKit: "Brand Guidelines",
      quickLinks: "Schnelllinks",
      policies: "Richtlinien",
      resources: "Ressourcen",
      social: "Social Media",
      home: "Startseite",
      allTools: "Alle PDF-Tools",
      aiSuite: "KI-Werkzeuge",
      pricing: "Preise & Tarife",
      blog: "Blog & Artikel",
      support: "Support & Kontakt",
      privacyPolicy: "Datenschutzerklärung",
      termsOfService: "Nutzungsbedingungen",
      aboutUs: "Über uns",
      helpCenter: "Hilfebereich",
      sitemap: "Sitemap",
      rights: "Alle Rechte vorbehalten.",
      developedBy: "Entwickelt von",
      leadDev: "Lead Web Developer",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      allTools: "جميع أدوات PDF",
      aiSuite: "مجموعة أدوات الذكاء الاصطناعي",
      pricing: "خطط الأسعار",
      loginRegister: "تسجيل الدخول / التسجيل",
      brandKit: "هوية العلامة التجارية",
      searchBtn: "بحث في 57+ أداة",
      history: "السجل الأخير",
      favorites: "المفضلة",
      theme: "المظهر",
      language: "اللغة",
      adminPanel: "لوحة التحكم (Admin)",
      userPortal: "لوحة تحكم المستخدم",
      logout: "تسجيل الخروج",
    },
    hero: {
      title: "أدوات PDF احترافية ومحرك مستندات متطور",
      subtitle: "معالجة 100% من جانب العميل باستخدام WebAssembly. آمنة، وسريعة، وخصوصية تامة.",
      chooseFiles: "اختر الملفات من الجهاز",
      dropzoneTitle: "أفلت ملفات PDF هنا أو انقر للاستعراض",
      dropzoneSub: "تبقى ملفاتك بالكامل على جهازك دون رفعها إلى أي خادم خارجي.",
      dropzoneActiveTitle: "أفلت الملفات لبدء المعالجة فوراً",
      dropzoneActiveSub: "أفلت الآن للبدء",
      or: "أو",
      searchPlaceholder: "ابحث في أكثر من 57 أداة PDF...",
      statsFiles: "أكثر من 500 ألف ملف تمت معالجته",
      statsPrivate: "خصوصية 100% داخل المتصفح",
    },
    quick_actions: {
      title: "إجراءات سريعة شائعة",
      merge: "دمج ملفات PDF",
      split: "تقسيم PDF",
      compress: "ضغط PDF",
      pdfToWord: "تحويل PDF إلى Word",
      chatWithPdf: "محادثة بالذكاء الاصطناعي مع PDF",
      aiSummary: "ملخص الذكاء الاصطناعي",
    },
    badges: {
      privacyTitle: "خصوصية 100% داخل المتصفح",
      privacySub: "معالجة WebAssembly محلية",
      utilitiesTitle: "أكثر من 57 أداة PDF احترافية",
      utilitiesSub: "مجموعة أدوات متكاملة",
      ultraFast: "سرعة فائقة",
      ultraFastDesc: "محرك تسريع محلي داخل المتصفح.",
      noStorage: "بدون تخزين سحابي",
      noStorageDesc: "ضمان حذف الملفات المؤقتة فوراً.",
      geminiAi: "ذكاء اصطناعي Gemini 3.6",
      geminiAiDesc: "محادثة ذكية، وتلخيص، وترجمة.",
      tools50: "57+ أداة تعمل بكفاءة",
      tools50Desc: "حزمة شاملة لتحويل وتحرير PDF.",
      mostPopular: "الأداة الأكثر شيوعاً",
      pro: "احترافي (PRO)",
      ai: "ذكاء اصطناعي (AI)",
      student: "أساسي للطلاب",
      proTooltip: "ميزة احترافية - معالجة PDF متقدمة",
    },
    categories: {
      all: "جميع الأدوات",
      student: "أساسي للطلاب",
      ai: "أدوات الذكاء الاصطناعي",
      popular: "الأدوات الشائعة",
      convert: "تحويل PDF",
      edit: "تحرير وتدوين",
      organize: "تنظيم الصفحات",
      security: "الأمان والحماية",
      optimize: "ضغط وتحسين",
      advanced: "متقدم",
    },
    formats: {
      badge: "محول المستندات الشامل",
      title: "صيغ الملفات المدعومة على PDFSun",
      subtitle: "تحويل ومعالجة المستندات عبر جميع صيغ الأوفيس والصور والكتب الإلكترونية.",
    },
    pricing: {
      badge: "معالجة فورية غير محدودة لملفات PDF",
      title: "خطط أسعار",
      titleHighlight: "بسيطة وشفافة",
      subtitle: "معالجة ملفات PDF غير محدودة مع ضمان استرداد الأموال بنسبة 100% خلال أول 7 أيام.",
      currencyInr: "🇮🇳 روبية هندية (₹) Razorpay",
      currencyUsd: "🌎 دولار أمريكي ($) Razorpay",
      monthly: "اشتراك شهري",
      yearly: "اشتراك سنوي",
      savePercent: "وفر 40%",
      guarantee: "ضمان استرداد الأموال 100% لأول 7 أيام",
      termsTitle: "شروط الاسترداد",
      termsText: "ضمان استرداد الأموال خلال 7 أيام للمشتريات المؤهلة.",
      activePlan: "الخطة النشطة حالياً",
      planActivated: "تم تفعيل الخطة",
      buyCredits: "شراء 100 رصيد — ₹99",
      subscribeMonthly: "اشتراك شهري",
      getAnnual: "اشتراك سنوي — وفر 40%",
      getTeam: "اشتراك فريق عمل",
    },
    testimonials: {
      badge: "يثق بنا أكثر من 500,000 مستخدم",
      title: "موثوق من قبل الطلاب والمحامين والباحثين",
      subtitle: "تعرف على آراء المستخدمين حول كفاءة PDFSun والخصوصية الفائقة.",
    },
    tools: {
      "openTool": "فتح الأداة",
      "share-pdfsun": {
        name: "مشاركة PDFSun",
        desc: "شارك PDFSun مع أصدقائك وزملائك عبر الروابط المباشرة ورموز QR وشبكات التواصل الاجتماعي.",
      },
      "merge-pdf": {
        name: "دمج PDF",
        desc: "اجمع مستندات PDF متعددة في ملف واحد منظم بسهولة.",
      },
      "split-pdf": {
        name: "تقسيم PDF",
        desc: "استخرج نطاقات صفحات معينة أو قسّم الملف إلى صفحات مستقلة.",
      },
      "compress-pdf": {
        name: "ضغط PDF",
        desc: "قلل حجم ملف PDF بشكل ملحوظ مع الحفاظ على أعلى جودة للمستند.",
      },
      "pdf-to-word": {
        name: "تحويل PDF إلى Word",
        desc: "حول ملفات PDF إلى مستندات Microsoft Word قابلة للتعديل بالكامل.",
      },
      "word-to-pdf": {
        name: "تحويل Word إلى PDF",
        desc: "حول ملفات Microsoft Word إلى مستندات PDF احترافية.",
      },
      "ai-chat-pdf": {
        name: "محادثة بالذكاء الاصطناعي مع PDF",
        desc: "اطرح أسئلة وتفاعل مع محتوى مستنداتك عبر ذكاء Gemini 3.6 الاصطناعي.",
      },
      "ai-pdf-summary": {
        name: "تلخيص المستندات بالذكاء الاصطناعي",
        desc: "أنشئ ملخصات تنفيذية سريعة ونقاط رئيسية من ملفات PDF الطويلة.",
      },
    },
    faq: {
      sectionBadge: "الأسئلة الشائعة حول الأمان والخصوصية",
      toolFaqBadge: "أسئلة شائعة حول الأداة",
      title: "الأسئلة الشائعة",
      toolTitle: "الأسئلة الشائعة حول {{toolName}}",
      subtitle: "كل ما تحتاج معرفته عن خصوصية وأمان PDFSun وعمليات المعالجة داخل المتصفح.",
      toolSubtitle: "كل ما تحتاج معرفته لاستخدام {{toolName}} بأمان وسهولة.",
      q1: "هل ملفاتي المرفوعة آمنة على PDFSun؟",
      a1: "بالتأكيد! الخصوصية تأتي أولاً في PDFSun. معظم العمليات تعمل محلياً بنسبة 100% داخل متصفحك عبر WebAssembly.",
      q2: "كيف يعمل الذكاء الاصطناعي في PDFSun؟",
      a2: "يدمج PDFSun ذكاء Google Gemini 3.6 لتحليل وتلخيص مستنداتك بسرعة فائقة وبخصوصية تامة.",
      q3: "هل استخدام PDFSun مجاني بالكامل؟",
      a3: "نعم! يوفر PDFSun وصولاً مجانياً سخياً لجميع الأدوات الـ 57+ دون الحاجة لأي تسجيل.",
      q4: "هل يمكنني استخدام PDFSun دون اتصال بالإنترنت؟",
      a4: "نعم! PDFSun مصمم كتطبيق ويب تقدمي (PWA) يعمل على الهواتف وأجهزة الكمبيوتر.",
      q5: "ما هي صيغ الملفات المدعومة؟",
      a5: "يدعم PDFSun ملفات PDF، وأوفيس، والصور (JPG, PNG, WEBP)، وملفات النصوص والويب.",
    },
    workspace: {
      dropOrSelect: "أفلت الملفات هنا أو انقر للاختيار من الجهاز",
      processFile: "معالجة المستند",
      processing: "جارٍ المعالجة...",
      downloadReady: "مستندك جاهز للتنزيل!",
      downloadBtn: "تنزيل PDF",
      resetBtn: "معالجة ملف آخر",
      openInNew: "فتح الأداة",
    },
    footer: {
      tagline: "PDFSun (pdfsun.in) — رفيقك الذكي لإدارة وتحويل مستندات PDF بذكاء Gemini 3.6 وخصوصية كاملة داخل المتصفح.",
      brandKit: "دليل الهوية البصرية",
      quickLinks: "روابط سريعة",
      policies: "السياسات",
      resources: "المصادر",
      social: "التواصل الاجتماعي",
      home: "الرئيسية",
      allTools: "جميع أدوات PDF",
      aiSuite: "أدوات الذكاء الاصطناعي",
      pricing: "خطط الأسعار",
      blog: "المدونة والمقالات",
      support: "الدعم والتواصل",
      privacyPolicy: "سياسة الخصوصية",
      termsOfService: "شروط الخدمة",
      aboutUs: "من نحن",
      helpCenter: "مركز المساعدة",
      sitemap: "خريطة الموقع",
      rights: "جميع الحقوق محفوظة.",
      developedBy: "تصميم وتطوير بواسطة",
      leadDev: "كبير مطوري الويب",
    },
  },
};

// Merge Indian regional and Global translations into in-memory store
Object.assign(IN_MEMORY_TRANSLATIONS, INDIAN_LANGUAGES_TRANSLATIONS, GLOBAL_LANGUAGES_TRANSLATIONS);

// Alias zh to zh-CN for backward compatibility
if (IN_MEMORY_TRANSLATIONS["zh-CN"]) {
  IN_MEMORY_TRANSLATIONS["zh"] = IN_MEMORY_TRANSLATIONS["zh-CN"];
}

// Auto-populate fallbacks for other supported languages so that translation switching NEVER breaks
for (const lang of SUPPORTED_LANGUAGES) {
  if (!IN_MEMORY_TRANSLATIONS[lang.code]) {
    IN_MEMORY_TRANSLATIONS[lang.code] = IN_MEMORY_TRANSLATIONS["en"];
  }
}

// Synchronously configure i18next
if (!i18n.isInitialized) {
  const initialResources: Record<string, { translation: Record<string, any> }> = {};
  for (const [code, dict] of Object.entries(IN_MEMORY_TRANSLATIONS)) {
    initialResources[code] = { translation: dict };
  }

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
          if (i18n.language !== targetLang) {
            i18n.changeLanguage(targetLang).catch(() => {});
          }
          document.documentElement.lang = targetLang;
          document.documentElement.dir = isRtlLanguage(targetLang) ? "rtl" : "ltr";
        }
      } else if (i18n.language !== currentLanguage) {
        i18n.changeLanguage(currentLanguage).catch(() => {});
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
          if (i18n.language !== updatedLang) {
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
        if (i18n.language !== detail.lang) {
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
      document.documentElement.lang = validLang;
      document.documentElement.dir = isRtlLanguage(validLang) ? "rtl" : "ltr";
      window.dispatchEvent(new CustomEvent("pdfsun_language_changed", { detail: { lang: validLang } }));
    } catch {
      // Ignore storage access error
    }

    if (i18n.isInitialized && i18n.language !== validLang) {
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
          const localized = TOOL_TRANSLATIONS[currentLanguage]?.[toolId]?.[field];
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
      const localized = TOOL_TRANSLATIONS[currentLanguage]?.[tool.id]?.name;
      if (localized) return localized;
      return t(`tools.${tool.id}.name`, tool.name);
    },
    [currentLanguage, t]
  );

  const getToolDescription = useCallback(
    (tool: { id: string; description?: string }): string => {
      const localized = TOOL_TRANSLATIONS[currentLanguage]?.[tool.id]?.desc;
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
