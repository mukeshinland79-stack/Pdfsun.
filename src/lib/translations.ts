// Centralized Master Translations Repository for PDFSun
// Contains deep, multi-language dictionaries for all application keys:
// Tools, Pricing, AI, Footer, Navigation, Hero, Badges, FAQ, and UI strings.
// Extensible architecture supporting 30+ regional & global languages.

import { INDIAN_LANGUAGES_TRANSLATIONS } from "./translations/indianLanguages";
import { GLOBAL_LANGUAGES_TRANSLATIONS } from "./translations/globalLanguages";
import { TOOL_TRANSLATIONS } from "./translations/toolTranslations";

export interface ToolTranslationItem {
  name?: string;
  desc?: string;
  [key: string]: string | undefined;
}

export interface NavTranslations {
  home: string;
  allTools: string;
  aiSuite: string;
  pricing: string;
  loginRegister: string;
  brandKit: string;
  searchBtn: string;
  history: string;
  favorites: string;
  theme: string;
  language: string;
  adminPanel: string;
  userPortal: string;
  logout: string;
  [key: string]: string;
}

export interface HeroTranslations {
  title: string;
  subtitle: string;
  chooseFiles: string;
  dropzoneTitle: string;
  dropzoneSub: string;
  dropzoneActiveTitle: string;
  dropzoneActiveSub: string;
  or: string;
  searchPlaceholder: string;
  statsFiles: string;
  statsPrivate: string;
  [key: string]: string;
}

export interface QuickActionsTranslations {
  title: string;
  merge: string;
  split: string;
  compress: string;
  pdfToWord: string;
  chatWithPdf: string;
  aiSummary: string;
  [key: string]: string;
}

export interface BadgesTranslations {
  privacyTitle: string;
  privacySub: string;
  utilitiesTitle: string;
  utilitiesSub: string;
  ultraFast: string;
  ultraFastDesc: string;
  noStorage: string;
  noStorageDesc: string;
  geminiAi: string;
  geminiAiDesc: string;
  tools50: string;
  tools50Desc: string;
  mostPopular: string;
  pro: string;
  ai: string;
  student: string;
  proTooltip: string;
  [key: string]: string;
}

export interface CategoriesTranslations {
  all: string;
  student: string;
  ai: string;
  popular: string;
  convert: string;
  edit: string;
  organize: string;
  security: string;
  optimize: string;
  advanced: string;
  [key: string]: string;
}

export interface FormatsTranslations {
  badge: string;
  title: string;
  subtitle: string;
  [key: string]: string;
}

export interface PricingTranslations {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  currencyInr: string;
  currencyUsd: string;
  monthly: string;
  yearly: string;
  savePercent: string;
  guarantee: string;
  termsTitle: string;
  termsText: string;
  activePlan: string;
  planActivated: string;
  buyCredits: string;
  subscribeMonthly: string;
  getAnnual: string;
  getTeam: string;
  freeTier?: string;
  proMonthly?: string;
  proAnnual?: string;
  lifetimePlan?: string;
  creditsPlan?: string;
  [key: string]: string | undefined;
}

export interface AiTranslations {
  title: string;
  subtitle: string;
  chatPlaceholder: string;
  askQuestion: string;
  explainDoc: string;
  summarizeDoc: string;
  generateQuiz: string;
  createFlashcards: string;
  grammarFix: string;
  resumeBuilder: string;
  notesGen: string;
  aiOcr: string;
  tokenUsage: string;
  modelSelection: string;
  promptPlaceholder: string;
  analyzeBtn: string;
  clearChat: string;
  [key: string]: string;
}

export interface WorkspaceTranslations {
  dropOrSelect: string;
  processFile: string;
  processing: string;
  downloadReady: string;
  downloadBtn: string;
  resetBtn: string;
  openInNew: string;
  uploadAnother: string;
  cancelBtn: string;
  copyBtn: string;
  previewBtn: string;
  errorMsg: string;
  successMsg: string;
  [key: string]: string;
}

export interface FaqTranslations {
  sectionBadge: string;
  toolFaqBadge: string;
  title: string;
  toolTitle: string;
  subtitle: string;
  toolSubtitle: string;
  q1: string;
  a1: string;
  q2: string;
  a2: string;
  q3: string;
  a3: string;
  q4: string;
  a4: string;
  q5: string;
  a5: string;
  [key: string]: string;
}

export interface FooterTranslations {
  tagline: string;
  brandKit: string;
  quickLinks: string;
  policies: string;
  resources: string;
  social: string;
  home: string;
  allTools: string;
  aiSuite: string;
  pricing: string;
  blog: string;
  support: string;
  privacyPolicy: string;
  termsOfService: string;
  aboutUs: string;
  helpCenter: string;
  sitemap: string;
  rights: string;
  developedBy: string;
  leadDev: string;
  [key: string]: string;
}

export interface UiTranslations {
  search: string;
  cancel: string;
  save: string;
  close: string;
  delete: string;
  edit: string;
  apply: string;
  download: string;
  upload: string;
  back: string;
  next: string;
  submit: string;
  confirm: string;
  clear: string;
  copied: string;
  processing: string;
  loading: string;
  error: string;
  success: string;
  selectLanguage: string;
  switchTheme: string;
  filterAll: string;
  filterCategory: string;
  noResults: string;
  viewAll: string;
  tryAgain: string;
  [key: string]: string;
}

export interface TranslationSchema {
  nav: NavTranslations;
  hero: HeroTranslations;
  quick_actions: QuickActionsTranslations;
  badges: BadgesTranslations;
  categories: CategoriesTranslations;
  formats: FormatsTranslations;
  pricing: PricingTranslations;
  ai: AiTranslations;
  workspace: WorkspaceTranslations;
  faq: FaqTranslations;
  footer: FooterTranslations;
  ui: UiTranslations;
  tools: Record<string, ToolTranslationItem | string>;
  testimonials?: {
    badge: string;
    title: string;
    subtitle: string;
    [key: string]: string;
  };
  [section: string]: any;
}

// ----------------------------------------------------------------------
// CORE MULTI-LANGUAGE MASTER DICTIONARIES
// ----------------------------------------------------------------------

export const ENGLISH_TRANSLATIONS: TranslationSchema = {
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
    freeTier: "Free Starter",
    proMonthly: "Pro Sun Monthly",
    proAnnual: "Pro Sun Annual",
    lifetimePlan: "Lifetime Pro Sun",
    creditsPlan: "100 AI Credits Pack",
  },
  ai: {
    title: "Gemini 3.6 AI PDF Intelligence Suite",
    subtitle: "Interact, extract, summarize, and translate high-volume documents with state-of-the-art multimodal AI.",
    chatPlaceholder: "Ask anything about this document, extract tables, or request explanations...",
    askQuestion: "Ask a Question",
    explainDoc: "Explain Complex Terms",
    summarizeDoc: "Executive Summary",
    generateQuiz: "Generate Study Quiz",
    createFlashcards: "Create Study Flashcards",
    grammarFix: "Grammar & Style Polishing",
    resumeBuilder: "ATS Resume Ready Builder",
    notesGen: "Structured Study Notes",
    aiOcr: "Multilingual OCR Engine",
    tokenUsage: "AI Token Usage",
    modelSelection: "Model: Gemini 3.6 Flash",
    promptPlaceholder: "Type your query here...",
    analyzeBtn: "Analyze Document",
    clearChat: "Clear Chat History",
  },
  workspace: {
    dropOrSelect: "Drop files here or click to choose from device",
    processFile: "Process Document",
    processing: "Processing with WebAssembly...",
    downloadReady: "Your document is ready to download!",
    downloadBtn: "Download PDF",
    resetBtn: "Process Another File",
    openInNew: "Open Tool",
    uploadAnother: "Upload Another File",
    cancelBtn: "Cancel",
    copyBtn: "Copy Text",
    previewBtn: "Preview",
    errorMsg: "An error occurred while processing the file. Please try again.",
    successMsg: "File processed successfully!",
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
  ui: {
    search: "Search",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    apply: "Apply",
    download: "Download",
    upload: "Upload",
    back: "Back",
    next: "Next",
    submit: "Submit",
    confirm: "Confirm",
    clear: "Clear",
    copied: "Copied!",
    processing: "Processing...",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    selectLanguage: "Select Language",
    switchTheme: "Switch Theme",
    filterAll: "All",
    filterCategory: "Filter by Category",
    noResults: "No matching tools found",
    viewAll: "View All",
    tryAgain: "Try Again",
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
  testimonials: {
    badge: "Loved by 500,000+ Users",
    title: "Trusted by Students, Lawyers & Researchers",
    subtitle: "See what students and industry professionals say about PDFSun efficiency, privacy, and Gemini AI capabilities.",
  },
};

export const HINDI_TRANSLATIONS: Partial<TranslationSchema> = {
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
    statsFiles: "5 लाख+ फाइलें प्रोसेस की गईं",
    statsPrivate: "100% ब्राउज़र में स्थानीय गोपनीयता",
  },
  quick_actions: {
    title: "लोकप्रिय त्वरित क्रियाएं",
    merge: "पीडीएफ मर्ज करें",
    split: "पीडीएफ अलग करें",
    compress: "पीडीएफ कंप्रेस करें",
    pdfToWord: "पीडीएफ से वर्ड",
    chatWithPdf: "पीडीएफ के साथ एआई चैट",
    aiSummary: "एआई सारांश",
  },
  badges: {
    privacyTitle: "100% ब्राउज़र गोपनीयता",
    privacySub: "क्लाइंट-साइड वेबअसेंबली प्रोसेसिंग",
    utilitiesTitle: "57+ प्रो पीडीएफ टूल्स",
    utilitiesSub: "संपूर्ण पीडीएफ सुइट",
    ultraFast: "अल्ट्रा फास्ट स्पीड",
    ultraFastDesc: "स्थानीय ब्राउज़र हार्डवेयर त्वरण इंजन।",
    noStorage: "शून्य डेटा अवधारण",
    noStorageDesc: "स्थायी सर्वर स्टोरेज पर कोई फाइल नहीं रखी जाती।",
    geminiAi: "जेमिनी 3.6 एआई",
    geminiAiDesc: "स्मार्ट चैट, सारांश और बहुभाषी अनुवाद।",
    tools50: "57+ उपयोगी टूल्स",
    tools50Desc: "संपूर्ण पीडीएफ रूपांतरण और संपादन प्लेटफॉर्म।",
    mostPopular: "सबसे लोकप्रिय टूल",
    pro: "प्रो",
    ai: "एआई",
    student: "छात्रों के लिए आवश्यक",
    proTooltip: "प्रो सुविधा - एंटरप्राइज पीडीएफ प्रोसेसिंग",
  },
  categories: {
    all: "सभी टूल्स",
    student: "छात्र आवश्यक",
    ai: "एआई पीडीएफ टूल्स",
    popular: "लोकप्रिय टूल्स",
    convert: "पीडीएफ कनवर्ट करें",
    edit: "संपादित और एनोटेट करें",
    organize: "व्यवस्थित और पेज",
    security: "सुरक्षा और लॉक",
    optimize: "कंप्रेस और सुधारें",
    advanced: "उन्नत",
  },
  pricing: {
    badge: "असीमित इंस्टेंट पीडीएफ प्रोसेसिंग",
    title: "सरल और पारदर्शी",
    titleHighlight: "मूल्य निर्धारण योजनाएं",
    subtitle: "100% निजी वेबअसेंबली गति के साथ असीमित पीडीएफ फाइलें प्रोसेस करें। कोई छिपा शुल्क नहीं। 7 दिन की मनी-बैक गारंटी।",
    currencyInr: "🇮🇳 INR (₹) Razorpay",
    currencyUsd: "🌎 USD ($) Razorpay",
    monthly: "मासिक बिलिंग",
    yearly: "वार्षिक बिलिंग",
    savePercent: "40% बचत",
    guarantee: "प्रथम 7 दिन 100% मनी-बैक गारंटी",
    termsTitle: "नियम एवं शर्तें",
    termsText: "7 दिन की मनी-बैक गारंटी: पात्र पहली खरीद पर 7 दिनों के भीतर पूर्ण रिफंड उपलब्ध है। किसी भी समय रद्द करें।",
    activePlan: "वर्तमान में सक्रिय प्लान",
    planActivated: "प्लान सक्रिय हो गया",
    buyCredits: "100 क्रेडिट खरीदें — ₹99",
    subscribeMonthly: "मासिक सदस्यता लें",
    getAnnual: "वार्षिक सदस्यता लें — 40% बचत",
    getTeam: "टीम एक्सेस प्राप्त करें",
  },
  ai: {
    title: "जेमिनी 3.6 एआई पीडीएफ इंटेलिजेंस",
    subtitle: "अत्याधुनिक मल्टीमॉडल एआई के साथ दस्तावेजों से सवाल-जवाब करें, सारांश बनाएं और अनुवाद करें।",
    chatPlaceholder: "दस्तावेज़ के बारे में कुछ भी पूछें...",
    askQuestion: "प्रश्न पूछें",
    explainDoc: "कठिन शब्दों को समझें",
    summarizeDoc: "दस्तावेज़ सारांश",
    generateQuiz: "अध्ययन क्विज बनाएं",
    createFlashcards: "फ्लैशकार्ड बनाएं",
    grammarFix: "व्याकरण और शैली सुधार",
    resumeBuilder: "रेज़्युमे बिल्डर",
    notesGen: "स्टडी नोट्स जनरेटर",
    aiOcr: "बहुभाषी ओसीआर इंजन",
    tokenUsage: "एआई टोकन उपयोग",
    modelSelection: "मॉडल: जेमिनी 3.6 फ्लैश",
    promptPlaceholder: "अपना सवाल यहाँ लिखें...",
    analyzeBtn: "दस्तावेज़ का विश्लेषण करें",
    clearChat: "चैट साफ़ करें",
  },
  workspace: {
    dropOrSelect: "फाइलें यहां छोड़ें या डिवाइस से चुनें",
    processFile: "दस्तावेज़ प्रोसेस करें",
    processing: "प्रोसेसिंग जारी है...",
    downloadReady: "आपका दस्तावेज़ डाउनलोड के लिए तैयार है!",
    downloadBtn: "पीडीएफ डाउनलोड करें",
    resetBtn: "दूसरी फाइल प्रोसेस करें",
    openInNew: "टूल खोलें",
    uploadAnother: "अन्य फाइल अपलोड करें",
    cancelBtn: "रद्द करें",
    copyBtn: "टेक्स्ट कॉपी करें",
    previewBtn: "पूर्वावलोकन",
    errorMsg: "फाइल प्रोसेस करने में त्रुटि हुई। कृपया पुनः प्रयास करें।",
    successMsg: "फाइल सफलतापूर्वक प्रोसेस की गई!",
  },
  footer: {
    tagline: "PDFSun (pdfsun.in) — आपका स्मार्ट दस्तावेज़ साथी। जेमिनी 3.6 एआई और 100% इन-ब्राउज़र गोपनीयता के साथ पीडीएफ मर्ज, कन्वर्ट, एडिट और विश्लेषण करें।",
    brandKit: "ब्रांड आइडेंटिटी दिशानिर्देश और लोगो किट",
    quickLinks: "त्वरित लिंक",
    policies: "नीतियां",
    resources: "संसाधन",
    social: "सोशल",
    home: "मुख्य पृष्ठ",
    allTools: "सभी पीडीएफ टूल्स",
    aiSuite: "एआई टूल्स सुइट",
    pricing: "मूल्य निर्धारण",
    blog: "ब्लॉग और लेख",
    support: "सहायता और संपर्क",
    privacyPolicy: "गोपनीयता नीति",
    termsOfService: "सेवा की शर्तें",
    aboutUs: "हमारे बारे में",
    helpCenter: "सहायता केंद्र",
    sitemap: "साइटमैप",
    rights: "सर्वाधिकार सुरक्षित।",
    developedBy: "वास्तुकार और इंजीनियर",
    leadDev: "लीड वेब डेवलपर",
  },
  ui: {
    search: "खोजें",
    cancel: "रद्द करें",
    save: "सहेजें",
    close: "बंद करें",
    delete: "हटाएं",
    edit: "संपादित करें",
    apply: "लागू करें",
    download: "डाउनलोड",
    upload: "अपलोड",
    back: "वापस",
    next: "आगे",
    submit: "जमा करें",
    confirm: "पुष्टि करें",
    clear: "साफ़ करें",
    copied: "कॉपी हो गया!",
    processing: "प्रोसेसिंग जारी है...",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफलता",
    selectLanguage: "भाषा चुनें",
    switchTheme: "थीम बदलें",
    filterAll: "सभी",
    filterCategory: "श्रेणी अनुसार फ़िल्टर करें",
    noResults: "कोई टूल नहीं मिला",
    viewAll: "सभी देखें",
    tryAgain: "पुनः प्रयास करें",
  },
  tools: TOOL_TRANSLATIONS["hi"] || {},
};

export const SPANISH_TRANSLATIONS: Partial<TranslationSchema> = {
  nav: {
    home: "Inicio",
    allTools: "Todas las Herramientas PDF",
    aiSuite: "Herramientas de IA",
    pricing: "Precios",
    loginRegister: "Iniciar Sesión / Registro",
    brandKit: "Kit de Marca",
    searchBtn: "Buscar más de 57 herramientas",
    history: "Historial Reciente",
    favorites: "Favoritos",
    theme: "Tema",
    language: "Idioma",
    adminPanel: "Panel de Administración",
    userPortal: "Panel de Usuario",
    logout: "Cerrar Sesión",
  },
  hero: {
    title: "Herramientas PDF Empresariales y Motor de Documentos",
    subtitle: "Procesamiento 100% local en el navegador con WebAssembly. Privado, rápido y seguro.",
    chooseFiles: "Elegir archivos del dispositivo",
    dropzoneTitle: "Arrastre archivos PDF aquí o haga clic para examinar",
    dropzoneSub: "Los archivos se procesan 100% en su navegador. Privado y seguro.",
    dropzoneActiveTitle: "Suelte los archivos para comenzar",
    dropzoneActiveSub: "Suelte ahora para procesar al instante",
    or: "o",
    searchPlaceholder: "Buscar más de 57 herramientas PDF (Cmd+K)...",
    statsFiles: "Más de 500k archivos procesados",
    statsPrivate: "100% privacidad en el navegador",
  },
  quick_actions: {
    title: "Acciones Rápidas Populares",
    merge: "Unir PDF",
    split: "Dividir PDF",
    compress: "Comprimir PDF",
    pdfToWord: "PDF a Word",
    chatWithPdf: "Chatear con PDF con IA",
    aiSummary: "Resumen con IA",
  },
  badges: {
    privacyTitle: "100% Privacidad en Navegador",
    privacySub: "Procesamiento WebAssembly local",
    utilitiesTitle: "Más de 57 Herramientas PDF",
    utilitiesSub: "Suite PDF completa",
    ultraFast: "Velocidad Ultra Rápida",
    ultraFastDesc: "Motor de aceleración de hardware nativo.",
    noStorage: "Sin Almacenamiento Permanente",
    noStorageDesc: "Los archivos se eliminan inmediatamente de la memoria.",
    geminiAi: "IA Gemini 3.6",
    geminiAiDesc: "Chat inteligente, resumen y traducción multilingüe.",
    tools50: "Más de 57 Herramientas",
    tools50Desc: "Plataforma integral de conversión y edición.",
    mostPopular: "Herramienta Más Popular",
    pro: "PRO",
    ai: "IA",
    student: "Esencial para Estudiantes",
    proTooltip: "Función Pro - Procesamiento PDF Empresarial",
  },
  categories: {
    all: "Todas las Utilidades",
    student: "Estudiantes",
    ai: "Herramientas IA PDF",
    popular: "Populares",
    convert: "Convertir PDF",
    edit: "Editar y Anotar",
    organize: "Organizar Páginas",
    security: "Seguridad y Protección",
    optimize: "Comprimir y Reparar",
    advanced: "Avanzado",
  },
  pricing: {
    badge: "PROCESAMIENTO PDF ILIMITADO AL INSTANTE",
    title: "Planes de Precios",
    titleHighlight: "Simples y Transparentes",
    subtitle: "Procese archivos PDF ilimitados con velocidad WebAssembly 100% privada. Sin tarifas ocultas. Garantía de reembolso de 7 días.",
    currencyInr: "🇮🇳 INR (₹) Razorpay",
    currencyUsd: "🌎 USD ($) Razorpay",
    monthly: "Facturación Mensual",
    yearly: "Facturación Anual",
    savePercent: "Ahorra 40%",
    guarantee: "Garantía de reembolso de 7 días al 100%",
    termsTitle: "Términos y Condiciones de Reembolso",
    termsText: "Garantía de devolución de dinero de 7 días: Reembolso completo en compras elegibles si se ha utilizado menos del 30% de la cuota.",
    activePlan: "PLAN ACTUALMENTE ACTIVO",
    planActivated: "PLAN ACTIVADO",
    buyCredits: "Comprar 100 Créditos — ₹99",
    subscribeMonthly: "Suscribirse Mensualmente",
    getAnnual: "Obtener Acceso Anual — Ahorra 40%",
    getTeam: "Obtener Acceso de Equipo",
  },
  footer: {
    tagline: "PDFSun (pdfsun.in) — Su compañero inteligente de documentos. Una, divida, comprima, convierta, edite y analice documentos con IA Gemini 3.6.",
    brandKit: "Guía de Identidad de Marca y Kit de Logotipos",
    quickLinks: "Enlaces Rápidos",
    policies: "Políticas",
    resources: "Recursos",
    social: "Redes Sociales",
    home: "Inicio",
    allTools: "Todas las Herramientas",
    aiSuite: "Suite de IA",
    pricing: "Precios",
    blog: "Blog y Artículos",
    support: "Soporte y Contacto",
    privacyPolicy: "Política de Privacidad",
    termsOfService: "Términos de Servicio",
    aboutUs: "Sobre Nosotros",
    helpCenter: "Centro de Ayuda",
    sitemap: "Mapa del Sitio",
    rights: "Todos los derechos reservados.",
    developedBy: "Diseñado y Desarrollado por",
    leadDev: "Desarrollador Web Principal",
  },
  tools: TOOL_TRANSLATIONS["es"] || {},
};

export const FRENCH_TRANSLATIONS: Partial<TranslationSchema> = {
  nav: {
    home: "Accueil",
    allTools: "Tous les Outils PDF",
    aiSuite: "Suite Outils IA",
    pricing: "Tarifs",
    loginRegister: "Connexion / Inscription",
    brandKit: "Kit de Marque",
    searchBtn: "Rechercher parmi 57+ outils",
    history: "Historique Récent",
    favorites: "Favoris",
    theme: "Thème",
    language: "Langue",
    adminPanel: "Panneau d'Administration",
    userPortal: "Tableau de Bord",
    logout: "Déconnexion",
  },
  hero: {
    title: "Outils PDF d'Entreprise et Moteur Documentaire",
    subtitle: "Traitement 100% local WebAssembly dans votre navigateur. Privé, rapide et sécurisé.",
    chooseFiles: "Choisir des fichiers",
    dropzoneTitle: "Déposez vos fichiers PDF ici ou cliquez pour parcourir",
    dropzoneSub: "Vos fichiers restent entièrement sur votre appareil. Rapide, sûr et confidentiel.",
    dropzoneActiveTitle: "Relâchez les fichiers pour lancer l'outil",
    dropzoneActiveSub: "Déposez maintenant pour un traitement instantané",
    or: "ou",
    searchPlaceholder: "Rechercher 57+ outils PDF (Cmd+K)...",
    statsFiles: "500K+ fichiers traités",
    statsPrivate: "100% confidentialité dans le navigateur",
  },
  quick_actions: {
    title: "Actions Rapides Populaires",
    merge: "Fusionner PDF",
    split: "Diviser PDF",
    compress: "Compresser PDF",
    pdfToWord: "PDF en Word",
    chatWithPdf: "Discuter avec le PDF (IA)",
    aiSummary: "Résumé IA",
  },
  badges: {
    privacyTitle: "100% Confidentialité Locale",
    privacySub: "Traitement WebAssembly côté client",
    utilitiesTitle: "57+ Outils PDF Pro",
    utilitiesSub: "Suite PDF complète",
    ultraFast: "Vitesse Ultra Rapide",
    ultraFastDesc: "Moteur d'accélération matérielle du navigateur.",
    noStorage: "Zéro Rétention de Données",
    noStorageDesc: "Aucun fichier n'est conservé sur des serveurs permanents.",
    geminiAi: "IA Gemini 3.6",
    geminiAiDesc: "Chat intelligent, résumé et traduction multilingue.",
    tools50: "57+ Outils Dédiés",
    tools50Desc: "Plateforme complète de conversion et d'édition.",
    mostPopular: "Outil le Plus Populaire",
    pro: "PRO",
    ai: "IA",
    student: "Essentiel Étudiant",
    proTooltip: "Fonctionnalité Pro - Traitement PDF d'Entreprise",
  },
  categories: {
    all: "Tous les Outils",
    student: "Essentiel Étudiant",
    ai: "Outils PDF IA",
    popular: "Outils Populaires",
    convert: "Convertir PDF",
    edit: "Modifier et Annoter",
    organize: "Organiser les Pages",
    security: "Sécurité et Protection",
    optimize: "Compresser et Réparer",
    advanced: "Avancé",
  },
  pricing: {
    badge: "TRAITEMENT PDF ILLIMITÉ ET INSTANTANÉ",
    title: "Tarifs Simples",
    titleHighlight: "et Transparents",
    subtitle: "Traitez des fichiers PDF illimités avec une vitesse WebAssembly 100% privée. Aucun frais caché. Garantie de remboursement de 7 jours.",
    currencyInr: "🇮🇳 INR (₹) Razorpay",
    currencyUsd: "🌎 USD ($) Razorpay",
    monthly: "Facturation Mensuelle",
    yearly: "Facturation Annuelle",
    savePercent: "Économisez 40%",
    guarantee: "Garantie de remboursement de 7 jours à 100%",
    termsTitle: "Conditions de Remboursement",
    termsText: "Garantie de remboursement de 7 jours : Remboursement intégral pour les premiers achats si moins de 30% du quota a été utilisé.",
    activePlan: "FORFAIT ACTUELLEMENT ACTIF",
    planActivated: "FORFAIT ACTIVÉ",
    buyCredits: "Acheter 100 Crédits — ₹99",
    subscribeMonthly: "S'abonner Mensuellement",
    getAnnual: "Obtenir l'Accès Annuel — Économisez 40%",
    getTeam: "Obtenir l'Accès Équipe",
  },
  footer: {
    tagline: "PDFSun (pdfsun.in) — Votre compagnon intelligent pour les documents. Fusionnez, divisez, compressez, convertissez, éditez et analysez avec l'IA Gemini 3.6.",
    brandKit: "Charte Graphique et Kit Logo",
    quickLinks: "Liens Rapides",
    policies: "Politiques",
    resources: "Ressources",
    social: "Réseaux Sociaux",
    home: "Accueil",
    allTools: "Tous les Outils",
    aiSuite: "Suite IA",
    pricing: "Tarifs",
    blog: "Blog et Articles",
    support: "Support et Contact",
    privacyPolicy: "Politique de Confidentialité",
    termsOfService: "Conditions d'Utilisation",
    aboutUs: "À Propos de Nous",
    helpCenter: "Centre d'Aide",
    sitemap: "Plan du Site",
    rights: "Tous droits réservés.",
    developedBy: "Conçu et Développé par",
    leadDev: "Développeur Web Principal",
  },
  tools: TOOL_TRANSLATIONS["fr"] || {},
};

export const GERMAN_TRANSLATIONS: Partial<TranslationSchema> = {
  nav: {
    home: "Startseite",
    allTools: "Alle PDF-Tools",
    aiSuite: "KI-Werkzeuge",
    pricing: "Preise",
    loginRegister: "Anmelden / Registrieren",
    brandKit: "Brand-Kit",
    searchBtn: "57+ Tools durchsuchen",
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
    dropzoneTitle: "PDF-Dateien hier ablegen oder zum Durchsuchen klicken",
    dropzoneSub: "Dateien bleiben zu 100% lokal auf Ihrem Gerät. Schnell, sicher und privat.",
    dropzoneActiveTitle: "Dateien loslassen, um das Tool zu starten",
    dropzoneActiveSub: "Jetzt ablegen für sofortige Verarbeitung",
    or: "oder",
    searchPlaceholder: "57+ PDF-Tools durchsuchen (Cmd+K)...",
    statsFiles: "500K+ verarbeitete Dateien",
    statsPrivate: "100% browserbasierter Datenschutz",
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
    privacyTitle: "100% Lokaler Datenschutz",
    privacySub: "Clientseitige WebAssembly-Verarbeitung",
    utilitiesTitle: "57+ Professionelle PDF-Tools",
    utilitiesSub: "Komplette PDF-Suite",
    ultraFast: "Ultraschnelle Geschwindigkeit",
    ultraFastDesc: "Hardwarebeschleunigte lokale Browser-Engine.",
    noStorage: "Keine Datenspeicherung",
    noStorageDesc: "Dateien werden sofort nach Abschluss aus dem Speicher gelöscht.",
    geminiAi: "Gemini 3.6 KI",
    geminiAiDesc: "Intelligenter Chat, Zusammenfassung & Übersetzung.",
    tools50: "57+ Funktionale Werkzeuge",
    tools50Desc: "Umfassende Plattform für Dokumentenverarbeitung.",
    mostPopular: "Beliebtestes Tool",
    pro: "PRO",
    ai: "KI",
    student: "Für Studierende",
    proTooltip: "Pro-Funktion - Enterprise PDF-Verarbeitung",
  },
  categories: {
    all: "Alle Werkzeuge",
    student: "Studium & Schule",
    ai: "KI-PDF-Tools",
    popular: "Beliebte Tools",
    convert: "PDF konvertieren",
    edit: "Bearbeiten & Annotieren",
    organize: "Seiten organisieren",
    security: "Sicherheit & Schutz",
    optimize: "Komprimieren & Reparieren",
    advanced: "Erweitert",
  },
  pricing: {
    badge: "SOFORTIGE UNBEGRENZTE PDF-VERARBEITUNG",
    title: "Einfache, transparente",
    titleHighlight: "Preise",
    subtitle: "Unbegrenzt PDFs mit 100% privater WebAssembly-Geschwindigkeit verarbeiten. Keine versteckten Gebühren. 7 Tage Geld-zurück-Garantie.",
    currencyInr: "🇮🇳 INR (₹) Razorpay",
    currencyUsd: "🌎 USD ($) Razorpay",
    monthly: "Monatliche Abrechnung",
    yearly: "Jährliche Abrechnung",
    savePercent: "40% sparen",
    guarantee: "Erste 7 Tage 100% Geld-zurück-Garantie",
    termsTitle: "Rückerstattungsbedingungen",
    termsText: "7-Tage-Geld-zurück-Garantie: Vollständige Erstattung bei Erstkäufen, wenn weniger als 30% des Kontingents verbraucht wurden.",
    activePlan: "DERZEIT AKTIVER PLAN",
    planActivated: "PLAN AKTIVIERT",
    buyCredits: "100 Credits kaufen — ₹99",
    subscribeMonthly: "Monatlich abonnieren",
    getAnnual: "Jahreszugang sichern — 40% sparen",
    getTeam: "Team-Zugang erhalten",
  },
  footer: {
    tagline: "PDFSun (pdfsun.in) — Ihr intelligenter Dokumentenbegleiter. PDFs zusammenfügen, teilen, komprimieren, konvertieren und analysieren mit Gemini 3.6 KI.",
    brandKit: "Markenrichtlinien & Logo-Kit",
    quickLinks: "Direktlinks",
    policies: "Richtlinien",
    resources: "Ressourcen",
    social: "Social Media",
    home: "Startseite",
    allTools: "Alle PDF-Tools",
    aiSuite: "KI-Suite",
    pricing: "Preise",
    blog: "Blog & Artikel",
    support: "Hilfe & Kontakt",
    privacyPolicy: "Datenschutzerklärung",
    termsOfService: "Nutzungsbedingungen",
    aboutUs: "Über Uns",
    helpCenter: "Hilfecenter",
    sitemap: "Sitemap",
    rights: "Alle Rechte vorbehalten.",
    developedBy: "Architektur & Entwicklung von",
    leadDev: "Leitender Webentwickler",
  },
  tools: TOOL_TRANSLATIONS["de"] || {},
};

export const ARABIC_TRANSLATIONS: Partial<TranslationSchema> = {
  nav: {
    home: "الرئيسية",
    allTools: "جميع أدوات PDF",
    aiSuite: "مجموعة أدوات الذكاء الاصطناعي",
    pricing: "خطط الأسعار",
    loginRegister: "تسجيل الدخول / إنشاء حساب",
    brandKit: "دليل الهوية التجارية",
    searchBtn: "البحث في أكثر من 57 أداة",
    history: "السجل الأخير",
    favorites: "المفضلة",
    theme: "المظهر",
    language: "اللغة",
    adminPanel: "لوحة الإدارة",
    userPortal: "لوحة المستخدم",
    logout: "تسجيل الخروج",
  },
  hero: {
    title: "أدوات PDF الاحترافية ومحرك المستندات الذكي",
    subtitle: "معالجة محلية 100% داخل المتصفح عبر WebAssembly. خصوصية كاملة، سرعة فائقة، وأمان تام.",
    chooseFiles: "اختيار الملفات من الجهاز",
    dropzoneTitle: "اسحب ملفات PDF هنا أو انقر للتصفح",
    dropzoneSub: "تتم معالجة الملفات محلياً على جهازك دون رفعها إلى أي خادم خارجي.",
    dropzoneActiveTitle: "أفلت الملفات لفتح مساحة العمل",
    dropzoneActiveSub: "أفلت الآن لبدء المعالجة الفورية",
    or: "أو",
    searchPlaceholder: "ابحث في أكثر من 57 أداة PDF (Cmd+K)...",
    statsFiles: "أكثر من 500 ألف ملف تمت معالجته",
    statsPrivate: "100% خصوصية تامة داخل المتصفح",
  },
  quick_actions: {
    title: "إجراءات سريعة شائعة",
    merge: "دمج PDF",
    split: "تقسيم PDF",
    compress: "ضغط PDF",
    pdfToWord: "تحويل PDF إلى Word",
    chatWithPdf: "محادثة ذكية مع PDF",
    aiSummary: "تلخيص المستند بالذكاء الاصطناعي",
  },
  badges: {
    privacyTitle: "100% خصوصية محلية",
    privacySub: "معالجة داخل المتصفح بدون خوادم خارجية",
    utilitiesTitle: "أكثر من 57 أداة PDF احترافية",
    utilitiesSub: "مجموعة متكاملة وشاملة للمستندات",
    ultraFast: "سرعة استثنائية",
    ultraFastDesc: "محرك تسريع الأجهزة المباشر داخل المتصفح.",
    noStorage: "انعدام حفظ الملفات",
    noStorageDesc: "يتم مسح المستندات فوراً من الذاكرة بعد المعالجة.",
    geminiAi: "ذكاء اصطناعي Gemini 3.6",
    geminiAiDesc: "محادثة ذكية، استخراج، تلخيص وترجمة فورية.",
    tools50: "57+ أداة متطورة",
    tools50Desc: "منصة شاملة لتحويل وتحرير وتأمين ملفاتك.",
    mostPopular: "الأداة الأكثر طلباً",
    pro: "برو PRO",
    ai: "ذكاء اصطناعي",
    student: "أساسي للطلاب والباحثين",
    proTooltip: "ميزة احترافية - معالجة PDF مؤسسية متقدمة",
  },
  categories: {
    all: "جميع الأدوات",
    student: "أدوات الطلاب والباحثين",
    ai: "أدوات الذكاء الاصطناعي",
    popular: "الأدوات الشائعة",
    convert: "تحويل PDF",
    edit: "تحرير وتعليقات",
    organize: "تنظيم الصفحات",
    security: "الأمان والقفل",
    optimize: "ضغط وإصلاح",
    advanced: "متقدم",
  },
  pricing: {
    badge: "معالجة غير محدودة وفورية لملفات PDF",
    title: "خطط أسعار بسيطة",
    titleHighlight: "وشفافة بالكامل",
    subtitle: "عالج ملفات PDF غير محدودة بأقصى سرعة وأعلى خصوصية. ضمان استرداد الأموال بنسبة 100% خلال أول 7 أيام.",
    currencyInr: "🇮🇳 روبية هندية (₹)",
    currencyUsd: "🌎 دولار أمريكي ($)",
    monthly: "اشتراك شهري",
    yearly: "اشتراك سنوي",
    savePercent: "وفر 40%",
    guarantee: "ضمان استرداد الأموال بنسبة 100% خلال أول 7 أيام",
    termsTitle: "شروط وضمان استرداد الأموال",
    termsText: "ضمان استرداد كامل للمبالغ المدفوعة خلال 7 أيام من تاريخ الشراء الأول في حال استخدام أقل من 30% من الرصيد.",
    activePlan: "الخطة النشطة حالياً",
    planActivated: "تم تفعيل الخطة بنجاح",
    buyCredits: "شراء 100 رصيد — ₹99",
    subscribeMonthly: "اشتراك شهري",
    getAnnual: "احصل على الاشتراك السنوي — وفر 40%",
    getTeam: "احصل على اشتراك فرق العمل",
  },
  footer: {
    tagline: "PDFSun (pdfsun.in) — رفيقك الذكي للمستندات. دمج، تقسيم، ضغط، تحويل، وتعديل وتحليل ملفات PDF بذكاء Gemini 3.6 وخصوصية كاملة داخل المتصفح.",
    brandKit: "دليل الهوية البصرية ومجموعة الشعارات",
    quickLinks: "روابط سريعة",
    policies: "السياسات والخصوصية",
    resources: "المصادر",
    social: "قنوات التواصل",
    home: "الرئيسية",
    allTools: "جميع أدوات PDF",
    aiSuite: "أدوات الذكاء الاصطناعي",
    pricing: "الأسعار والخطط",
    blog: "المدونة والمقالات",
    support: "الدعم والتواصل",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الاستخدام",
    aboutUs: "من نحن",
    helpCenter: "مركز المساعدة",
    sitemap: "خريطة الموقع",
    rights: "جميع الحقوق محفوظة.",
    developedBy: "تصميم وهندسة وتطوير",
    leadDev: "المطور الرئيسي للمشروع",
  },
  tools: TOOL_TRANSLATIONS["ar"] || {},
};

export const HEBREW_TRANSLATIONS: Partial<TranslationSchema> = {
  nav: {
    home: "דף הבית",
    allTools: "כל כלי ה-PDF",
    aiSuite: "חבילת כלי AI",
    pricing: "תוכניות ומחירים",
    loginRegister: "התחברות / הרשמה",
    brandKit: "ערכת מותג",
    searchBtn: "חיפוש ב-57+ כלים",
    history: "היסטוריה אחרונה",
    favorites: "מועדפים",
    theme: "ערכת נושא",
    language: "שפה",
    adminPanel: "לוח ניהול",
    userPortal: "לוח משתמש",
    logout: "התנתקות",
  },
  hero: {
    title: "כלי PDF ארגוניים ומנוע מסמכים חכם",
    subtitle: "עיבוד 100% מקומי בדפדפן באמצעות WebAssembly. פרטי, מהיר ומאובטח.",
    chooseFiles: "בחירת קבצים מהמכשיר",
    dropzoneTitle: "גרור קבצי PDF לכאן או לחץ לעיון",
    dropzoneSub: "הקבצים מעובדים באופן מקומי לחלוטין במכשיר שלך.",
    dropzoneActiveTitle: "שחרר קבצים כדי לפתוח את סביבת העבודה",
    dropzoneActiveSub: "שחרר כעת כדי להתחיל בעיבוד מיידי",
    or: "או",
    searchPlaceholder: "חפש ב-57+ כלי PDF (Cmd+K)...",
    statsFiles: "מעל 500,000 קבצים עובדו",
    statsPrivate: "100% פרטיות מלאה בדפדפן",
  },
  quick_actions: {
    title: "פעולות מהירות פופולריות",
    merge: "מיזוג PDF",
    split: "פיצול PDF",
    compress: "דחיסת PDF",
    pdfToWord: "PDF ל-Word",
    chatWithPdf: "צ'אט AI עם PDF",
    aiSummary: "סיכום AI",
  },
  badges: {
    privacyTitle: "100% פרטיות בדפדפן",
    privacySub: "עיבוד WebAssembly בצד הלקוח",
    utilitiesTitle: "57+ כלי PDF מקצועיים",
    utilitiesSub: "חבילת PDF מלאה",
    ultraFast: "מהירות עיבוד אולטרה מהירה",
    ultraFastDesc: "מנוע האצת חומרה מקומי בדפדפן.",
    noStorage: "ללא שמירת נתונים",
    noStorageDesc: "הקבצים נמחקים מהזיכרון מיד עם סיום הפעולה.",
    geminiAi: "בינה מלאכותית Gemini 3.6",
    geminiAiDesc: "צ'אט חכם, סיכום ותרגום רב-לשוני.",
    tools50: "57+ כלים פעילים",
    tools50Desc: "פלטפורמה מלאה להמרה, עריכה וניהול מסמכים.",
    mostPopular: "הכלי הפופולרי ביותר",
    pro: "PRO",
    ai: "AI",
    student: "חיוני לסטודנטים",
    proTooltip: "תכונת Pro - עיבוד PDF ארגוני מתקדם",
  },
  categories: {
    all: "כל הכלים",
    student: "חיוני לסטודנטים",
    ai: "כלי AI למסמכים",
    popular: "כלים פופולריים",
    convert: "המרת PDF",
    edit: "עריכה והערות",
    organize: "ארגון דפים",
    security: "אבטחה והגנה",
    optimize: "דחיסה ותיקון",
    advanced: "מתקדם",
  },
  pricing: {
    badge: "עיבוד PDF בלתי מוגבל ומיידי",
    title: "תוכניות מחיר פשוטות",
    titleHighlight: "ושקופות לחלוטין",
    subtitle: "עבד קבצי PDF ללא הגבלה במהירות WebAssembly פרטית לחלוטין. ללא עמלות נסתרות. 100% החזר כספי ב-7 הימים הראשונים.",
    currencyInr: "🇮🇳 רופי הודי (₹)",
    currencyUsd: "🌎 דולר ארה״ב ($)",
    monthly: "חיוב חודשי",
    yearly: "חיוב שנתי",
    savePercent: "חסוך 40%",
    guarantee: "100% החזר כספי ב-7 הימים הראשונים",
    termsTitle: "תנאי החזר כספי",
    termsText: "החזר כספי מלא מובטח תוך 7 ימים ממועד הרכישה הראשונה במידה ונעשה שימוש בפחות מ-30% מהמכסה.",
    activePlan: "תוכנית פעילה כעת",
    planActivated: "התוכנית הופעלה בהצלחה",
    buyCredits: "קנה 100 קרדיטים — ₹99",
    subscribeMonthly: "מנוי חודשי",
    getAnnual: "רכוש מנוי שנתי — חסוך 40%",
    getTeam: "רכוש גישה לצוות",
  },
  footer: {
    tagline: "PDFSun (pdfsun.in) — שותף המסמכים החכם שלך. מזג, פצל, דחוס, המר, ערוך ונתח מסמכים עם בינה מלאכותית Gemini 3.6 ופרטיות מלאה בדפדפן.",
    brandKit: "הנחיות מותג וערכת לוגואים",
    quickLinks: "קישורים מהירים",
    policies: "מדיניות",
    resources: "משאבים",
    social: "רשתות חברתיות",
    home: "דף הבית",
    allTools: "כל כלי ה-PDF",
    aiSuite: "חבילת AI",
    pricing: "מחירים",
    blog: "בלוג ומאמרים",
    support: "תמיכה ויצירת קשר",
    privacyPolicy: "מדיניות פרטיות",
    termsOfService: "תנאי שימוש",
    aboutUs: "אודותינו",
    helpCenter: "מרכז עזרה",
    sitemap: "מפת אתר",
    rights: "כל הזכויות שמורות.",
    developedBy: "תכנון, הנדסה ופיתוח על ידי",
    leadDev: "מפתח אתרים מוביל",
  },
  tools: TOOL_TRANSLATIONS["he"] || {},
};

export const URDU_TRANSLATIONS: Partial<TranslationSchema> = {
  nav: {
    home: "ہوم",
    allTools: "تمام پی ڈی ایف ٹولز",
    aiSuite: "اے آئی ٹولز سویٹ",
    pricing: "قیمتوں کے منصوبے",
    loginRegister: "لاگ ان / سائن اپ",
    brandKit: "برانڈ کٹ",
    searchBtn: "57+ ٹولز تلاش کریں",
    history: "حالیہ تاریخ",
    favorites: "پسندیدہ",
    theme: "تھیم",
    language: "زبان",
    adminPanel: "ایڈمن پینل",
    userPortal: "یوزر ڈیش بورڈ",
    logout: "لاگ آؤٹ",
  },
  hero: {
    title: "انٹرپرائز پی ڈی ایف ٹولز اور اسمارٹ دستاویز انجن",
    subtitle: "100% براؤزر کے اندر ویب اسمبلی پروسیسنگ۔ تیز، محفوظ اور نجی۔",
    chooseFiles: "ڈیوائس سے فائلیں منتخب کریں",
    dropzoneTitle: "پی ڈی ایف فائلیں یہاں ڈراپ کریں یا براؤز کریں",
    dropzoneSub: "فائلیں مکمل طور پر آپ کے ڈیوائس پر رہتی ہیں اور محفوظ رہتی ہیں۔",
    dropzoneActiveTitle: "ٹول شروع کرنے کے لیے فائلیں چھوڑیں",
    dropzoneActiveSub: "فوری پروسیسنگ شروع کرنے کے لیے ابھی ڈراپ کریں",
    or: "یا",
    searchPlaceholder: "57+ پی ڈی ایف ٹولز تلاش کریں (Cmd+K)...",
    statsFiles: "5 لاکھ سے زائد فائلیں پروسیس ہو چکی ہیں",
    statsPrivate: "100% ان براؤزر پرائیویسی",
  },
  quick_actions: {
    title: "مشہور فوری ایکشنز",
    merge: "پی ڈی ایف ضم کریں",
    split: "پی ڈی ایف الگ کریں",
    compress: "پی ڈی ایف کمپریس کریں",
    pdfToWord: "پی ڈی ایف سے ورڈ",
    chatWithPdf: "اے آئی چیٹ پی ڈی ایف",
    aiSummary: "اے آئی خلاصہ",
  },
  badges: {
    privacyTitle: "100% براؤزر پرائیویسی",
    privacySub: "کلائنٹ سائیڈ ویب اسمبلی پروسیسنگ",
    utilitiesTitle: "57+ پی ڈی ایف یوٹیلیٹیز",
    utilitiesSub: "مکمل پی ڈی ایف سویٹ",
    ultraFast: "انتہائی تیز رفتار",
    ultraFastDesc: "مقامی براؤزر ہارڈ ویئر ایکسلریشن انجن۔",
    noStorage: "صفر ڈیٹا برقرار رکھنا",
    noStorageDesc: "پروسیسنگ مکمل ہوتے ہی فائلیں میموری سے ڈیلیٹ ہو جاتی ہیں۔",
    geminiAi: "جیمنی 3.6 اے آئی",
    geminiAiDesc: "سمارٹ چیٹ، خلاصہ اور کثیر لسانی ترجمہ۔",
    tools50: "57+ فعال ٹولز",
    tools50Desc: "مکمل دستاویز کنورژن اور ایڈیٹنگ پلیٹ فارم۔",
    mostPopular: "سب سے مقبول ٹول",
    pro: "پرو PRO",
    ai: "اے آئی",
    student: "طلباء کے لیے ضروری",
    proTooltip: "پرو فیچر - انٹرپرائز پی ڈی ایف پروسیسنگ",
  },
  categories: {
    all: "تمام یوٹیلیٹیز",
    student: "طلباء کے لیے ضروری",
    ai: "اے آئی پی ڈی ایف ٹولز",
    popular: "مقبول ٹولز",
    convert: "پی ڈی ایف تبدیل کریں",
    edit: "ایڈٹ اور اینوٹیٹ",
    organize: "صفحات ترتیب دیں",
    security: "سیکیورٹی اور پاس ورڈ",
    optimize: "کمپریس اور مرمت",
    advanced: "ایڈوانسڈ",
  },
  pricing: {
    badge: "لامحدود فوری پی ڈی ایف پروسیسنگ",
    title: "سادہ اور شفاف",
    titleHighlight: "قیمتوں کے منصوبے",
    subtitle: "100% پرائیویٹ ویب اسمبلی اسپیڈ کے ساتھ لامحدود فائلیں پروسیس کریں۔ 7 دن کی منی بیک گارنٹی۔",
    currencyInr: "🇮🇳 ہندوستانی روپیہ (₹)",
    currencyUsd: "🌎 امریکی ڈالر ($)",
    monthly: "ماہانہ بلنگ",
    yearly: "سالانہ بلنگ",
    savePercent: "40% بچت",
    guarantee: "پہلے 7 دن 100% منی بیک گارنٹی",
    termsTitle: "شرائط و ضوابط",
    termsText: "7 دن کی منی بیک گارنٹی: اگر 30% سے کم کریڈٹ استعمال ہوا ہو تو مکمل ریفنڈ حاصل کریں۔",
    activePlan: "فی الحال فعال منصوبہ",
    planActivated: "منصوبہ فعال ہو گیا",
    buyCredits: "100 کریڈٹ خریدیں — ₹99",
    subscribeMonthly: "ماہانہ سبسکرائب کریں",
    getAnnual: "سالانہ رسائی حاصل کریں — 40% بچت",
    getTeam: "ٹیم رسائی حاصل کریں",
  },
  footer: {
    tagline: "PDFSun (pdfsun.in) — آپ کا اسمارٹ دستاویز ساتھی۔ جیمنی 3.6 اے آئی اور 100% براؤزر پرائیویسی کے ساتھ پی ڈی ایف ضم، تبدیل، ایڈٹ اور تجزیہ کریں۔",
    brandKit: "برانڈ گائیڈ لائنز اور لوگو کٹ",
    quickLinks: "فوری لنکس",
    policies: "پالیسیاں",
    resources: "وسائل",
    social: "سوشل میڈیا",
    home: "ہوم",
    allTools: "تمام پی ڈی ایف ٹولز",
    aiSuite: "اے آئی سویٹ",
    pricing: "قیمتیں",
    blog: "بلاگ اور مضامین",
    support: "سپورٹ اور رابطہ",
    privacyPolicy: "رازداری کی پالیسی",
    termsOfService: "سروس کی شرائط",
    aboutUs: "ہمارے بارے میں",
    helpCenter: "مدد کا مرکز",
    sitemap: "سائٹ میپ",
    rights: "جملہ حقوق محفوظ ہیں۔",
    developedBy: "ڈیزائن اور ڈیولپمنٹ از",
    leadDev: "لیڈ ویب ڈویلپر",
  },
  tools: TOOL_TRANSLATIONS["ur"] || {},
};

// ----------------------------------------------------------------------
// CENTRALIZED MASTER TRANSLATION REGISTRY
// ----------------------------------------------------------------------

export const MASTER_TRANSLATIONS: Record<string, Record<string, any>> = {
  en: ENGLISH_TRANSLATIONS,
  hi: HINDI_TRANSLATIONS,
  es: SPANISH_TRANSLATIONS,
  fr: FRENCH_TRANSLATIONS,
  de: GERMAN_TRANSLATIONS,
  ar: ARABIC_TRANSLATIONS,
  he: HEBREW_TRANSLATIONS,
  ur: URDU_TRANSLATIONS,
  ...INDIAN_LANGUAGES_TRANSLATIONS,
  ...GLOBAL_LANGUAGES_TRANSLATIONS,
};

// Ensure aliases are in place
if (MASTER_TRANSLATIONS["zh-CN"]) {
  MASTER_TRANSLATIONS["zh"] = MASTER_TRANSLATIONS["zh-CN"];
}

// ----------------------------------------------------------------------
// EXTENSIBILITY & REGISTRY UTILITIES FOR 30+ LANGUAGES
// ----------------------------------------------------------------------

/**
 * Dynamically register or override a language dictionary
 */
export const registerLanguageDictionary = (
  languageCode: string,
  dictionary: Partial<TranslationSchema> | Record<string, any>
): void => {
  if (!languageCode) return;
  const code = languageCode.toLowerCase();
  MASTER_TRANSLATIONS[code] = {
    ...(MASTER_TRANSLATIONS[code] || {}),
    ...dictionary,
  };
};

/**
 * Retrieves the compiled dictionary for a given language code with fallback to English
 */
export const getTranslationDictionary = (langCode: string): Record<string, any> => {
  if (!langCode) return MASTER_TRANSLATIONS["en"];
  const cleanCode = langCode.toLowerCase().split("-")[0];
  return (
    MASTER_TRANSLATIONS[langCode] ||
    MASTER_TRANSLATIONS[cleanCode] ||
    MASTER_TRANSLATIONS["en"]
  );
};

/**
 * Re-export tool translations & regional collections
 */
export { TOOL_TRANSLATIONS, INDIAN_LANGUAGES_TRANSLATIONS, GLOBAL_LANGUAGES_TRANSLATIONS };
