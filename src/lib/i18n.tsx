import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, FC } from "react";
import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import HttpBackend from "i18next-http-backend";

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
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", isRtl: true },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", isRtl: true },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "Chinese Simplified", nativeName: "中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese Traditional", nativeName: "繁體中文", flag: "🇹🇼" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", isRtl: true },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    home: "Home",
    allTools: "All PDF Tools",
    aiSuite: "AI Tools",
    searchPlaceholder: "Search 50+ tools (Cmd+K)...",
    history: "Recent History",
    favorites: "Favorite Tools",
    themeToggleLight: "Switch to Professional Light Theme",
    themeToggleDark: "Switch to Eye-Comfort Dark Theme",
    login: "Login",
    register: "Register",
    loginRegister: "Login / Register",
    profile: "Profile",
    dashboard: "User Dashboard",
    recentFiles: "Recent Files",
    settings: "Settings",
    logout: "Logout",
    adminProfile: "Admin Profile",
    adminPanel: "Admin Panel",
    analyticsDashboard: "Analytics Dashboard",
    userManagement: "User Management",
    fileManagement: "File Management",
    aiManagement: "AI Management",
    adManagement: "Advertisement Management",
    websiteSettings: "Website Settings",
    reports: "Reports",
    systemLogs: "System Logs",
    backupRestore: "Backup & Restore",
    heroTitle: "Enterprise PDF Tools & AI Document Engine",
    heroSub: "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.",
    dropzoneTitle: "Drop PDF files here or click to browse",
    selectTool: "Select a tool below to get started",
    popularTools: "Popular PDF Tools",
    studentTools: "Student & Academic Tools",
    aiTools: "AI PDF Suite",
    convertPdf: "Convert PDF",
    editPdf: "Edit PDF",
    securityPdf: "Security & Passwords",
    downloadReady: "File Ready to Download!",
    processing: "Processing document securely...",
    mergePdf: "Merge PDF",
    splitPdf: "Split PDF",
    compressPdf: "Compress PDF",
    chatWithPdf: "Chat with PDF (Gemini AI)",
    privacyNote: "100% Local Privacy • WebAssembly Powered",
  },
  hi: {
    home: "मुख्य पृष्ठ",
    allTools: "सभी पीडीएफ उपकरण",
    aiSuite: "एआई दस्तावेज सूट",
    searchPlaceholder: "50+ उपकरण खोजें (Cmd+K)...",
    history: "हाल का इतिहास",
    favorites: "पसंदीदा उपकरण",
    themeToggleLight: "लाइट थीम पर स्विच करें",
    themeToggleDark: "डार्क थीम पर स्विच करें",
    login: "लॉग इन",
    register: "पंजीकरण",
    loginRegister: "लॉग इन / पंजीकरण",
    profile: "प्रोफ़ाइल",
    dashboard: "उपयोगकर्ता डैशबोर्ड",
    recentFiles: "हाल की फाइलें",
    settings: "सेटिंग्स",
    logout: "लॉग आउट",
    adminProfile: "एडमिन प्रोफ़ाइल",
    adminPanel: "एडमिन पैनल",
    analyticsDashboard: "एनालिटिक्स डैशबोर्ड",
    userManagement: "उपयोगकर्ता प्रबंधन",
    fileManagement: "फाइल प्रबंधन",
    aiManagement: "एआई प्रबंधन",
    adManagement: "विज्ञापन प्रबंधन",
    websiteSettings: "वेबसाइट सेटिंग्स",
    reports: "रिपोर्ट्स",
    systemLogs: "सिस्टम लॉग्स",
    backupRestore: "बैकअप और रीस्टोर",
    heroTitle: "इंटरप्राइज पीडीएफ टूल और एआई डॉक्यूमेंट इंजन",
    heroSub: "100% क्लाइंट-साइड वेबअसेंबली प्रोसेसिंग। सुरक्षित और तेज़।",
    dropzoneTitle: "पीडीएफ फाइलों को यहां ड्रैग करें या ब्राउज़ करें",
    selectTool: "शुरू करने के लिए नीचे दिए गए उपकरण का चयन करें",
    popularTools: "लोकप्रिय पीडीएफ उपकरण",
    studentTools: "छात्र एवं अकादमिक उपकरण",
    aiTools: "एआई पीडीएफ सूट",
    convertPdf: "पीडीएफ कनवर्ट करें",
    editPdf: "पीडीएफ संपादित करें",
    securityPdf: "सुरक्षा और पासवर्ड",
    downloadReady: "फाइल डाउनलोड के लिए तैयार है!",
    processing: "दस्तावेज़ सुरक्षित रूप से प्रोसेस हो रहा है...",
    mergePdf: "पीडीएफ मर्ज करें",
    splitPdf: "पीडीएफ स्प्लिट करें",
    compressPdf: "पीडीएफ कंप्रेस करें",
    chatWithPdf: "पीडीएफ के साथ चैट करें (Gemini AI)",
    privacyNote: "100% स्थानीय गोपनीयता • वेबअसेंबली संचालित",
  },
  bn: {
    home: "হোম",
    allTools: "সব পিডিএফ টুলস",
    aiSuite: "এআই ডকুমেন্ট স্যুট",
    searchPlaceholder: "৫০+ টুলস অনুসন্ধান করুন...",
    history: "সাম্প্রতিক ইতিহাস",
    favorites: "প্রিয় টুলস",
    themeToggleLight: "লাইট থিম নির্বাচন করুন",
    themeToggleDark: "ডার্ক থিম নির্বাচন করুন",
    login: "লগইন",
    register: "নিবন্ধন",
    loginRegister: "লগইন / নিবন্ধন",
    profile: "প্রোফাইল",
    dashboard: "ড্যাশবোর্ড",
    recentFiles: "সাম্প্রতিক ফাইল",
    settings: "সেটিংস",
    logout: "লগআউট",
    adminProfile: "অ্যাডমিন প্রোফাইল",
    adminPanel: "অ্যাডমিন প্যানেল",
    analyticsDashboard: "অ্যানালিটিক্স",
    userManagement: "ব্যবহারকারী ব্যবস্থাপনা",
    fileManagement: "ফাইল ব্যবস্থাপনা",
    aiManagement: "এআই ব্যবস্থাপনা",
    adManagement: "বিজ্ঞাপন ব্যবস্থাপনা",
    websiteSettings: "ওয়েবসাইট সেটিংস",
    reports: "রিপোর্টস",
    systemLogs: "সিস্টেম লগ",
    backupRestore: "ব্যাকআপ এবং রিস্টোর",
    heroTitle: "পিডিএফ টুলস এবং এআই ডকুমেন্ট ইঞ্জিন",
    heroSub: "১০০% সম্পূর্ণ নিরাপদ ও দ্রুত স্থানীয় প্রসেসিং",
    dropzoneTitle: "পিডিএফ ফাইল এখানে ড্রপ করুন",
    selectTool: "শুরু করতে নিচে টুল নির্বাচন করুন",
    popularTools: "জনপ্রিয় টুলস",
    studentTools: "ছাত্রদের টুলস",
    aiTools: "এআই স্যুট",
    convertPdf: "পিডিএফ রূপান্তর",
    editPdf: "পিডিএফ এডিট",
    securityPdf: "নিরাপত্তা ও পাসওয়ার্ড",
    downloadReady: "ডাউনলোডের জন্য ফাইল প্রস্তুত!",
    processing: "প্রসেসিং হচ্ছে...",
    mergePdf: "পিডিএফ একত্রিত করুন",
    splitPdf: "পিডিএফ বিভক্ত করুন",
    compressPdf: "পিডিএফ সংকুচিত করুন",
    chatWithPdf: "পিডিএফ চ্যাট (Gemini AI)",
    privacyNote: "১০০% সম্পূর্ণ গোপনীয়তা",
  },
  ta: {
    home: "முகப்பு",
    allTools: "அனைத்து PDF கருவிகள்",
    aiSuite: "AI ஆவணத் தொகுப்பு",
    searchPlaceholder: "50+ கருவிகளைத் தேடுங்கள்...",
    history: "சமீபத்திய வரலாறு",
    favorites: "விருப்பமான கருவிகள்",
    themeToggleLight: "லைட் தீமிற்கு மாற்றவும்",
    themeToggleDark: "டார்க் தீமிற்கு மாற்றவும்",
    login: "உள்நுழை",
    register: "பதிவு செய்",
    loginRegister: "உள்நுழை / பதிவு செய்",
    profile: "சுயவிவரம்",
    dashboard: "டாஷ்போர்டு",
    recentFiles: "சமீபத்திய கோப்புகள்",
    settings: "அமைப்புகள்",
    logout: "வெளியேறு",
    adminProfile: "நிர்வாகி சுயவிவரம்",
    adminPanel: "நிர்வாகக் குழு",
    analyticsDashboard: "பகுப்பாய்வு",
    userManagement: "பயனர் நிர்வாகம்",
    fileManagement: "கோப்பு நிர்வாகம்",
    aiManagement: "AI நிர்வாகம்",
    adManagement: "விளம்பர நிர்வாகம்",
    websiteSettings: "இணையதள அமைப்புகள்",
    reports: "அறிக்கைகள்",
    systemLogs: "சிஸ்டம் பதிவுகள்",
    backupRestore: "காப்புப்பிரதி மற்றும் மீட்டமைப்பு",
    heroTitle: "PDF கருவிகள் & AI ஆவண இயந்திரம்",
    heroSub: "100% பாதுகாப்பான மற்றும் வேகமான செயலாக்கம்",
    dropzoneTitle: "PDF கோப்புகளை இங்கே பதிவேற்றவும்",
    selectTool: "தொடங்க ஒரு கருவியைத் தேர்ந்தெடுக்கவும்",
    popularTools: "பிரபலமான கருவிகள்",
    studentTools: "மாணவர் கருவிகள்",
    aiTools: "AI கருவிகள்",
    convertPdf: "PDF ஆக மாற்று",
    editPdf: "PDF திருத்து",
    securityPdf: "பாதுகாப்பு & கடவுச்சொல்",
    downloadReady: "பதிவிறக்கம் செய்யத் தயார்!",
    processing: "செயலாக்கப் படுகிறது...",
    mergePdf: "PDFகளை இணைக்கவும்",
    splitPdf: "PDFகளை பிரிக்கவும்",
    compressPdf: "PDF சுருக்கவும்",
    chatWithPdf: "PDF உடனுரையாடு (Gemini AI)",
    privacyNote: "100% உள்ளூர் தனியுரிமை",
  },
  te: {
    home: "హోమ్",
    allTools: "అన్ని PDF టూల్స్",
    aiSuite: "AI డాక్యుమెంట్ సూట్",
    searchPlaceholder: "50+ టూల్స్‌ని శోధించండి...",
    history: "ఇటీవలి హిస్టరీ",
    favorites: "ఇష్టమైన టూల్స్",
    themeToggleLight: "లైట్ థీమ్‌కి మారండి",
    themeToggleDark: "డార్క్ థీమ్‌కి మారండి",
    login: "లాగిన్",
    register: "రిజిస్టర్",
    loginRegister: "లాగిన్ / రిజిస్టర్",
    profile: "ప్రొఫైల్",
    dashboard: "డాష్‌బోర్డ్",
    recentFiles: "ఇటీవలి ఫైళ్లు",
    settings: "సెట్టింగ్‌లు",
    logout: "లాగౌట్",
    adminProfile: "అడ్మిన్ ప్రొఫైల్",
    adminPanel: "అడ్మిన్ ప్యానెల్",
    analyticsDashboard: "అనలిటిక్స్",
    userManagement: "యూజర్ మేనేజ్‌మెంట్",
    fileManagement: "ఫైల్ మేనేజ్‌మెంట్",
    aiManagement: "AI మేనేజ్‌మెంట్",
    adManagement: "యాడ్ మేనేజ్‌మెంట్",
    websiteSettings: "వెబ్‌సైట్ సెట్టింగ్‌లు",
    reports: "రిపోర్ట్‌లు",
    systemLogs: "సిస్టమ్ లాగ్స్",
    backupRestore: "బ్యాకప్ మరియు రీస్టోర్",
    heroTitle: "PDF టూల్స్ & AI డాక్యుమెంట్ ఇంజిన్",
    heroSub: "100% సురక్షిత మరియు వేగవంతమైన ప్రాసెసింగ్",
    dropzoneTitle: "PDF ఫైళ్లను ఇక్కడ డ్రాప్ చేయండి",
    selectTool: "ప్రారంభించడానికి టూల్ ఎంచుకోండి",
    popularTools: "పాపులర్ టూల్స్",
    studentTools: "స్టూడెంట్ టూల్స్",
    aiTools: "AI సూట్",
    convertPdf: "PDF ని కన్వర్ట్ చేయండి",
    editPdf: "PDF ని ఎడిట్ చేయండి",
    securityPdf: "సెక్యూరిటీ & పాస్‌వర్డ్",
    downloadReady: "డౌన్‌లోడ్ చేయడానికి సిద్ధంగా ఉంది!",
    processing: "ప్రాసెసింగ్ జరుగుతోంది...",
    mergePdf: "PDF లని కలపండి",
    splitPdf: "PDF లని విడదీయండి",
    compressPdf: "PDF లని సైజ్ తగ్గించండి",
    chatWithPdf: "PDF తో చాట్ చేయండి (Gemini AI)",
    privacyNote: "100% ప్రైవసీ సురక్షితం",
  },
  mr: {
    home: "मुख्यपृष्ठ",
    allTools: "सर्व PDF साधने",
    aiSuite: "AI दस्तऐवज सूट",
    searchPlaceholder: "50+ साधने शोधा...",
    history: "नुकताच इतिहास",
    favorites: "आवडती साधने",
    themeToggleLight: "लाइट थीमवर स्विच करा",
    themeToggleDark: "डार्क थीमवर स्विच करा",
    login: "लॉगिन",
    register: "नोंदणी",
    loginRegister: "लॉगिन / नोंदणी",
    profile: "प्रोफाइल",
    dashboard: "डॅशबोर्ड",
    recentFiles: "नुकत्याच वापरलेल्या फायली",
    settings: "सेटिंग्ज",
    logout: "लॉगआउट",
    adminProfile: "अ‍ॅडमिन प्रोफाइल",
    adminPanel: "अ‍ॅडमिन पॅनेल",
    analyticsDashboard: "अ‍ॅनालिटिक्स",
    userManagement: "वापरकर्ता व्यवस्थापन",
    fileManagement: "फाइल व्यवस्थापन",
    aiManagement: "AI व्यवस्थापन",
    adManagement: "जाहिरात व्यवस्थापन",
    websiteSettings: "वेबसाइट सेटिंग्ज",
    reports: "अहवाल",
    systemLogs: "सिस्टम लॉग्स",
    backupRestore: "बैकअप आणि रीस्टोर",
    heroTitle: "PDF साधने आणि AI दस्तऐवज इंजिन",
    heroSub: "100% सुरक्षित आणि जलद प्रोसेसिंग",
    dropzoneTitle: "PDF फायली येथे ड्रॉप करा",
    selectTool: "सुरू करण्यासाठी साधन निवडा",
    popularTools: "लोकप्रिय साधने",
    studentTools: "विद्यार्थी साधने",
    aiTools: "AI साधने",
    convertPdf: "PDF रूपांतरित करा",
    editPdf: "PDF संपादित करा",
    securityPdf: "सुरक्षा आणि पासवर्ड",
    downloadReady: "फाइल डाउनलोडसाठी तयार आहे!",
    processing: "प्रक्रिया सुरू आहे...",
    mergePdf: "PDF एकत्र करा",
    splitPdf: "PDF विभक्त करा",
    compressPdf: "PDF आकुंचित करा",
    chatWithPdf: "PDF सह चॅट करा (Gemini AI)",
    privacyNote: "100% गोपनीयता सुरक्षित",
  },
  gu: {
    home: "હોમ",
    allTools: "બધા PDF સાધનો",
    aiSuite: "AI દસ્તાવેજ સૂટ",
    searchPlaceholder: "50+ સાધનો શોધો...",
    history: "તાજેતરનો ઇતિહાસ",
    favorites: "મનપસંદ સાધનો",
    themeToggleLight: "લાઇટ થીમ પસંદ કરો",
    themeToggleDark: "ડાર્ક થીમ પસંદ કરો",
    login: "લોગિન",
    register: "રજીસ્ટર",
    loginRegister: "લોગિન / રજીસ્ટર",
    profile: "પ્રોફાઇલ",
    dashboard: "ડેશબોર્ડ",
    recentFiles: "તાજેતરની ફાઇલો",
    settings: "સેટિંગ્સ",
    logout: "લોગઆઉટ",
    adminProfile: "એડમિન પ્રોફાઇલ",
    adminPanel: "એડમિન પેનલ",
    analyticsDashboard: "એનાલિટિક્સ",
    userManagement: "વપરાશકર્તા વ્યવસ્થાપન",
    fileManagement: "ફાઇલ વ્યવસ્થાપન",
    aiManagement: "AI વ્યવસ્થાપન",
    adManagement: "જાહેરાત વ્યવસ્થાપન",
    websiteSettings: "વેબસાઇટ સેટિંગ્સ",
    reports: "રિપોર્ટ્સ",
    systemLogs: "સિસ્ટમ લોગ્સ",
    backupRestore: "બેકઅપ અને પુનઃસ્થાપિત કરો",
    heroTitle: "PDF સાધનો અને AI દસ્તાવેજ એન્જિન",
    heroSub: "100% સુરક્ષિત અને ઝડપી પ્રોસેસિંગ",
    dropzoneTitle: "PDF ફાઇલો અહીં ડ્રોપ કરો",
    selectTool: "શરૂ કરવા માટે સાધન પસંદ કરો",
    popularTools: "લોકપ્રિય સાધનો",
    studentTools: "વિદ્યાર્થી સાધનો",
    aiTools: "AI સાધનો",
    convertPdf: "PDF રૂપાંતરિત કરો",
    editPdf: "PDF સંપાદિત કરો",
    securityPdf: "સુરક્ષા અને પાસવર્ડ",
    downloadReady: "ફાઇલ ડાઉનલોડ કરવા માટે તૈયાર છે!",
    processing: "પ્રોસેસિંગ ચાલુ છે...",
    mergePdf: "PDF મર્જ કરો",
    splitPdf: "PDF સ્પ્લિટ કરો",
    compressPdf: "PDF કોમ્પ્રેસ કરો",
    chatWithPdf: "PDF સાથે ચેટ કરો (Gemini AI)",
    privacyNote: "100% સ્થાનિક ગોપનીયતા",
  },
  ur: {
    home: "ہوم",
    allTools: "تمام PDF ٹولز",
    aiSuite: "اے آئی ڈاکومنٹ سوٹ",
    searchPlaceholder: "50+ ٹولز تلاش کریں...",
    history: "حالیہ ہسٹری",
    favorites: "پسندیدہ ٹولز",
    themeToggleLight: "لائٹ تھیم منتخب کریں",
    themeToggleDark: "ڈارک تھیم منتخب کریں",
    login: "لاگ ان",
    register: "رجسٹر کریں",
    loginRegister: "لاگ ان / رجسٹر",
    profile: "پروفائل",
    dashboard: "ڈیش بورڈ",
    recentFiles: "حالیہ فائلیں",
    settings: "سیٹنگز",
    logout: "لاگ آؤٹ",
    adminProfile: "ایڈمن پروفائل",
    adminPanel: "ایڈمن پینل",
    analyticsDashboard: "تجزیاتی ڈیش بورڈ",
    userManagement: "صارفین کا انتظام",
    fileManagement: "فائلوں کا انتظام",
    aiManagement: "اے آئی کا انتظام",
    adManagement: "اشتہارات کا انتظام",
    websiteSettings: "ویب سائٹ سیٹنگز",
    reports: "رپورٹس",
    systemLogs: "سسٹم لاگز",
    backupRestore: "بیک اپ اور بحالی",
    heroTitle: "پی ڈی ایف ٹولز اور اے آئی ڈاکومنٹ انجن",
    heroSub: "100% محفوظ اور تیز ترین پروسیسنگ",
    dropzoneTitle: "پی ڈی ایف فائلیں یہاں ڈراپ کریں",
    selectTool: "شروع کرنے کے لیے ایک ٹول منتخب کریں",
    popularTools: "مقبول ٹولز",
    studentTools: "طلباء کے ٹولز",
    aiTools: "اے آئی ٹولز",
    convertPdf: "پی ڈی ایف کنورٹ کریں",
    editPdf: "پی ڈی ایف ایڈٹ کریں",
    securityPdf: "سیکیورٹی اور پاس ورڈ",
    downloadReady: "فائل ڈاؤن لوڈ کے لیے تیار ہے!",
    processing: "پروسیسنگ ہو رہی ہے...",
    mergePdf: "پی ڈی ایف کو ضم کریں",
    splitPdf: "پی ڈی ایف کو الگ کریں",
    compressPdf: "پی ڈی ایف سائز کم کریں",
    chatWithPdf: "پی ڈی ایف کے ساتھ چیٹ کریں (Gemini AI)",
    privacyNote: "100% مکمل نجی رازداری",
  },
  ar: {
    home: "الرئيسية",
    allTools: "جميع أدوات PDF",
    aiSuite: "مجموعة أدوات الذكاء الاصطناعي",
    searchPlaceholder: "ابحث في أكثر من 50 أداة...",
    history: "السجل الحديث",
    favorites: "الأدوات المفضلة",
    themeToggleLight: "التبديل إلى المظهر الفاتح",
    themeToggleDark: "التبديل إلى المظهر الداكن",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    loginRegister: "تسجيل الدخول / التسجيل",
    profile: "الملف الشخصي",
    dashboard: "لوحة التحكم",
    recentFiles: "الملفات الأخيرة",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    adminProfile: "ملف المسؤول",
    adminPanel: "لوحة المسؤول",
    analyticsDashboard: "لوحة التحليلات",
    userManagement: "إدارة المستخدمين",
    fileManagement: "إدارة الملفات",
    aiManagement: "إدارة الذكاء الاصطناعي",
    adManagement: "إدارة الإعلانات",
    websiteSettings: "إعدادات الموقع",
    reports: "التقارير",
    systemLogs: "سجلات النظام",
    backupRestore: "النسخ الاحتياطي والاستعادة",
    heroTitle: "أدوات PDF ومحرك المستندات الذكي",
    heroSub: "معالجة آمنة وسريعة 100% على جهازك مباشرة",
    dropzoneTitle: "اسحب ملفات PDF هنا أو انقر للاستعراض",
    selectTool: "اختر أداة أدناه للبدء",
    popularTools: "الأدوات الشائعة",
    studentTools: "أدوات الطلاب",
    aiTools: "أدوات الذكاء الاصطناعي",
    convertPdf: "تحويل PDF",
    editPdf: "تعديل PDF",
    securityPdf: "الأمان وكلمات المرور",
    downloadReady: "الملف جاهز للتنزيل!",
    processing: "جاري معالجة المستند بأمان...",
    mergePdf: "دمج PDF",
    splitPdf: "تقسيم PDF",
    compressPdf: "ضغط PDF",
    chatWithPdf: "الدردشة مع PDF (Gemini AI)",
    privacyNote: "خصوصية محلية 100%",
  },
  es: {
    home: "Inicio",
    allTools: "Todas las herramientas PDF",
    aiSuite: "Suite IA de Documentos",
    searchPlaceholder: "Buscar entre 50+ herramientas...",
    history: "Historial reciente",
    favorites: "Herramientas favoritas",
    themeToggleLight: "Cambiar a Tema Claro",
    themeToggleDark: "Cambiar a Tema Oscuro",
    login: "Iniciar sesión",
    register: "Registrarse",
    loginRegister: "Iniciar sesión / Registro",
    profile: "Perfil",
    dashboard: "Panel de usuario",
    recentFiles: "Archivos recientes",
    settings: "Configuración",
    logout: "Cerrar sesión",
    adminProfile: "Perfil de Admin",
    adminPanel: "Panel de Administración",
    analyticsDashboard: "Panel de Analíticas",
    userManagement: "Gestión de Usuarios",
    fileManagement: "Gestión de Archivos",
    aiManagement: "Gestión de IA",
    adManagement: "Gestión de Anuncios",
    websiteSettings: "Configuración del Sitio",
    reports: "Informes",
    systemLogs: "Registros del Sistema",
    backupRestore: "Copia de Seguridad y Restauración",
    heroTitle: "Herramientas PDF Empresariales y Motor de IA",
    heroSub: "Procesamiento WebAssembly 100% cliente. Privado, Rápido y Seguro.",
    dropzoneTitle: "Arrastra archivos PDF aquí o haz clic para explorar",
    selectTool: "Selecciona una herramienta para comenzar",
    popularTools: "Herramientas Populares",
    studentTools: "Herramientas Estudiantiles",
    aiTools: "Suite IA PDF",
    convertPdf: "Convertir PDF",
    editPdf: "Editar PDF",
    securityPdf: "Seguridad y Contraseñas",
    downloadReady: "¡Archivo listo para descargar!",
    processing: "Procesando documento de forma segura...",
    mergePdf: "Unir PDF",
    splitPdf: "Dividir PDF",
    compressPdf: "Comprimir PDF",
    chatWithPdf: "Chatear con PDF (Gemini AI)",
    privacyNote: "100% Privacidad Local",
  },
  fr: {
    home: "Accueil",
    allTools: "Tous les outils PDF",
    aiSuite: "Suite IA Documents",
    searchPlaceholder: "Rechercher 50+ outils...",
    history: "Historique récent",
    favorites: "Outils favoris",
    themeToggleLight: "Basculer vers le Thème Clair",
    themeToggleDark: "Basculer vers le Thème Sombre",
    login: "Connexion",
    register: "S'inscrire",
    loginRegister: "Connexion / Inscription",
    profile: "Profil",
    dashboard: "Tableau de bord",
    recentFiles: "Fichiers récents",
    settings: "Paramètres",
    logout: "Déconnexion",
    adminProfile: "Profil Admin",
    adminPanel: "Panneau d'Administration",
    analyticsDashboard: "Tableau d'Analytique",
    userManagement: "Gestion des Utilisateurs",
    fileManagement: "Gestion des Fichiers",
    aiManagement: "Gestion de l'IA",
    adManagement: "Gestion des Publicités",
    websiteSettings: "Paramètres du Site",
    reports: "Rapports",
    systemLogs: "Journaux Système",
    backupRestore: "Sauvegarde et Restauration",
    heroTitle: "Outils PDF Entreprise & Moteur IA",
    heroSub: "Traitement WebAssembly 100% local. Privé, Rapide & Sécurisé.",
    dropzoneTitle: "Déposez les fichiers PDF ici ou cliquez pour parcourir",
    selectTool: "Sélectionnez un outil ci-dessous pour commencer",
    popularTools: "Outils Populaires",
    studentTools: "Outils Étudiants",
    aiTools: "Suite IA PDF",
    convertPdf: "Convertir PDF",
    editPdf: "Éditer PDF",
    securityPdf: "Sécurité & Mots de passe",
    downloadReady: "Fichier prêt à être téléchargé !",
    processing: "Traitement sécurisé du document...",
    mergePdf: "Fusionner PDF",
    splitPdf: "Diviser PDF",
    compressPdf: "Compresser PDF",
    chatWithPdf: "Discuter avec le PDF (Gemini AI)",
    privacyNote: "100% Confidentialité Locale",
  },
  de: {
    home: "Startseite",
    allTools: "Alle PDF-Werkzeuge",
    aiSuite: "KI-Dokumenten-Suite",
    searchPlaceholder: "Über 50 Werkzeuge durchsuchen...",
    history: "Verlauf",
    favorites: "Favoriten",
    themeToggleLight: "Zu hellem Design wechseln",
    themeToggleDark: "Zu dunklem Design wechseln",
    login: "Anmelden",
    register: "Registrieren",
    loginRegister: "Anmelden / Registrieren",
    profile: "Profil",
    dashboard: "Dashboard",
    recentFiles: "Neueste Dateien",
    settings: "Einstellungen",
    logout: "Abmelden",
    adminProfile: "Admin-Profil",
    adminPanel: "Admin-Bereich",
    analyticsDashboard: "Analyse-Dashboard",
    userManagement: "Benutzerverwaltung",
    fileManagement: "Dateiverwaltung",
    aiManagement: "KI-Verwaltung",
    adManagement: "Anzeigenverwaltung",
    websiteSettings: "Website-Einstellungen",
    reports: "Berichte",
    systemLogs: "Systemprotokolle",
    backupRestore: "Sicherung & Wiederherstellung",
    heroTitle: "Enterprise PDF-Tools & KI-Dokumenten-Engine",
    heroSub: "100% lokal im Browser. Privat, Schnell & Sicher.",
    dropzoneTitle: "PDF-Dateien hier ablegen oder klicken",
    selectTool: "Wählen Sie ein Werkzeug aus",
    popularTools: "Beliebte Werkzeuge",
    studentTools: "Studenten-Werkzeuge",
    aiTools: "KI-PDF-Suite",
    convertPdf: "PDF Konvertieren",
    editPdf: "PDF Bearbeiten",
    securityPdf: "Sicherheit & Passwörter",
    downloadReady: "Datei bereit zum Download!",
    processing: "Dokument wird sicher verarbeitet...",
    mergePdf: "PDF Zusammenfügen",
    splitPdf: "PDF Teilen",
    compressPdf: "PDF Komprimieren",
    chatWithPdf: "Mit PDF Chatten (Gemini AI)",
    privacyNote: "100% Lokale Privatsphäre",
  },
  zh: {
    home: "首页",
    allTools: "所有 PDF 工具",
    aiSuite: "AI 文档套件",
    searchPlaceholder: "搜索 50+ 个工具 (Cmd+K)...",
    history: "最近历史",
    favorites: "收藏工具",
    themeToggleLight: "切换至明亮模式",
    themeToggleDark: "切换至护眼暗黑模式",
    login: "登录",
    register: "注册",
    loginRegister: "登录 / 注册",
    profile: "个人资料",
    dashboard: "用户仪表盘",
    recentFiles: "最近文件",
    settings: "设置",
    logout: "退出登录",
    adminProfile: "管理员资料",
    adminPanel: "管理员面板",
    analyticsDashboard: "数据分析仪表盘",
    userManagement: "用户管理",
    fileManagement: "文件管理",
    aiManagement: "AI 管理",
    adManagement: "广告管理",
    websiteSettings: "网站设置",
    reports: "报告",
    systemLogs: "系统日志",
    backupRestore: "备份与恢复",
    heroTitle: "企业级 PDF 工具与 AI 文档引擎",
    heroSub: "100% 浏览器本地 WebAssembly 处理。私密、快速且安全。",
    dropzoneTitle: "拖拽 PDF 文件至此，或点击浏览",
    selectTool: "请选择下方工具开始使用",
    popularTools: "热门 PDF 工具",
    studentTools: "学生与学术工具",
    aiTools: "AI PDF 套件",
    convertPdf: "转换 PDF",
    editPdf: "编辑 PDF",
    securityPdf: "安全与密码",
    downloadReady: "文件已准备好下载！",
    processing: "正在安全处理文档...",
    mergePdf: "合并 PDF",
    splitPdf: "拆分 PDF",
    compressPdf: "压缩 PDF",
    chatWithPdf: "与 PDF 对话 (Gemini AI)",
    privacyNote: "100% 本地隐私保护",
  },
  ja: {
    home: "ホーム",
    allTools: "すべてのPDFツール",
    aiSuite: "AIドキュメントスイート",
    searchPlaceholder: "50+のツールを検索 (Cmd+K)...",
    history: "最近の履歴",
    favorites: "お気に入り",
    themeToggleLight: "ライトテーマに切り替え",
    themeToggleDark: "ダークテーマに切り替え",
    login: "ログイン",
    register: "新規登録",
    loginRegister: "ログイン / 登録",
    profile: "プロフィール",
    dashboard: "ダッシュボード",
    recentFiles: "最近のファイル",
    settings: "設定",
    logout: "ログアウト",
    adminProfile: "管理者プロフィール",
    adminPanel: "管理パネル",
    analyticsDashboard: "分析ダッシュボード",
    userManagement: "ユーザー管理",
    fileManagement: "ファイル管理",
    aiManagement: "AI管理",
    adManagement: "広告管理",
    websiteSettings: "Webサイト設定",
    reports: "レポート",
    systemLogs: "システムログ",
    backupRestore: "バックアップと復元",
    heroTitle: "エンタープライズPDFツール＆AIドキュメントエンジン",
    heroSub: "100% ブラウザ内WebAssembly処理。プライベート、高速、安全。",
    dropzoneTitle: "ここにPDFファイルをドロップするか、クリックして参照",
    selectTool: "開始するには以下のツールを選択してください",
    popularTools: "人気のPDFツール",
    studentTools: "学生・学術向けツール",
    aiTools: "AI PDFスイート",
    convertPdf: "PDF変換",
    editPdf: "PDF編集",
    securityPdf: "セキュリティとパスワード",
    downloadReady: "ダウンロードの準備ができました！",
    processing: "ドキュメントを安全に処理中...",
    mergePdf: "PDF結合",
    splitPdf: "PDF分割",
    compressPdf: "PDF圧縮",
    chatWithPdf: "PDFとチャット (Gemini AI)",
    privacyNote: "100% ローカルプライバシー保護",
  },
  ko: {
    home: "홈",
    allTools: "모든 PDF 도구",
    aiSuite: "AI 문서 스위트",
    searchPlaceholder: "50개 이상의 도구 검색...",
    history: "최근 기록",
    favorites: "즐겨찾기",
    themeToggleLight: "라이트 모드로 전환",
    themeToggleDark: "다크 모드로 전환",
    login: "로그인",
    register: "회원가입",
    loginRegister: "로그인 / 회원가입",
    profile: "프로필",
    dashboard: "대시보드",
    recentFiles: "최근 파일",
    settings: "설정",
    logout: "로그아웃",
    adminProfile: "관리자 프로필",
    adminPanel: "관리자 패널",
    analyticsDashboard: "분석 대시보드",
    userManagement: "사용자 관리",
    fileManagement: "파일 관리",
    aiManagement: "AI 관리",
    adManagement: "광고 관리",
    websiteSettings: "웹사이트 설정",
    reports: "보고서",
    systemLogs: "시스템 로그",
    backupRestore: "백업 및 복원",
    heroTitle: "엔터프라이즈 PDF 도구 및 AI 문서 엔진",
    heroSub: "100% 로컬 웹어셈블리 처리. 안전하고 빠른 처리.",
    dropzoneTitle: "PDF 파일을 여기에 끌어다 놓거나 클릭하세요",
    selectTool: "시작하려면 아래 도구를 선택하세요",
    popularTools: "인기 PDF 도구",
    studentTools: "학생 및 학술 도구",
    aiTools: "AI PDF 스위트",
    convertPdf: "PDF 변환",
    editPdf: "PDF 편집",
    securityPdf: "보안 및 비밀번호",
    downloadReady: "다운로드할 준비가 되었습니다!",
    processing: "문서를 안전하게 처리 중입니다...",
    mergePdf: "PDF 병합",
    splitPdf: "PDF 분할",
    compressPdf: "PDF 압축",
    chatWithPdf: "PDF와 대화하기 (Gemini AI)",
    privacyNote: "100% 개인정보 보호",
  },
};

export type TranslationParams = Record<string, string | number>;

export interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  languageOption: LanguageOption;
  isRtl: boolean;
  t: (key: string, paramsOrFallback?: TranslationParams | string, fallback?: string) => string;
}

const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "pdfsun_language";

const defaultLanguageOption: LanguageOption =
  SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE) || SUPPORTED_LANGUAGES[0];

// RTL languages helper: Arabic (ar), Urdu (ur), Persian/Farsi (fa)
export const RTL_LANGUAGES = ["ar", "ur", "fa"];

export const isRtlLanguage = (code: string): boolean => {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return !!lang?.isRtl || RTL_LANGUAGES.includes(code);
};

// Initial language resolution from localStorage or browser settings
const getInitialLanguage = (): string => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("pdfsun_lang");
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }

    const nav = typeof navigator !== "undefined" && navigator ? navigator : null;
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
    // Ignore storage quota or private browsing errors
  }
  return DEFAULT_LANGUAGE;
};

const initialLanguage = getInitialLanguage();

// Convert TRANSLATIONS dictionary into i18next resources format for instant fallback
const bundledResources = Object.keys(TRANSLATIONS).reduce((acc, lang) => {
  acc[lang] = {
    translation: TRANSLATIONS[lang],
  };
  return acc;
}, {} as Record<string, { translation: Record<string, string> }>);

// Initialize i18next singleton
if (!i18n.isInitialized) {
  i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      backend: {
        loadPath: "/public/locales/{{lng}}/translation.json",
      },
      resources: bundledResources,
      lng: initialLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: {
        escapeValue: false, // React handles XSS safety
      },
      react: {
        useSuspense: false,
      },
    });
}

const interpolate = (template: string, params?: TranslationParams): string => {
  if (!params || typeof template !== "string") return template || "";
  return Object.entries(params).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(val)),
    template
  );
};

const defaultContextValue: LanguageContextType = {
  currentLanguage: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  languageOption: defaultLanguageOption,
  isRtl: false,
  t: (key: string, paramsOrFallback?: TranslationParams | string, fallback?: string): string => {
    let params: TranslationParams | undefined;
    let fallbackText: string | undefined;

    if (typeof paramsOrFallback === "string") {
      fallbackText = paramsOrFallback;
    } else {
      params = paramsOrFallback;
      fallbackText = fallback;
    }

    const dict = TRANSLATIONS[DEFAULT_LANGUAGE];
    const rawTranslation = dict?.[key] ?? fallbackText ?? key;
    return interpolate(rawTranslation, params);
  },
};

export const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export const LanguageProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>(initialLanguage);

  // Sync state if i18n changes language externally or via storage
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (lng && SUPPORTED_LANGUAGES.some((l) => l.code === lng)) {
        setCurrentLanguageState(lng);
      }
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  // Update HTML document direction (dir) and lang attributes, and sync localStorage and i18n
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }

    try {
      localStorage.setItem(STORAGE_KEY, currentLanguage);
      localStorage.setItem("pdfsun_lang", currentLanguage);
    } catch {
      // Ignore quota or private browsing errors
    }

    const isRtl = isRtlLanguage(currentLanguage);

    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    if (isRtl) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  }, [currentLanguage]);

  const languageOption = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || defaultLanguageOption,
    [currentLanguage]
  );

  const isRtl = isRtlLanguage(currentLanguage);

  const setLanguage = useCallback((code: string) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
      setCurrentLanguageState(code);
      i18n.changeLanguage(code);
    }
  }, []);

  const t = useCallback(
    (key: string, paramsOrFallback?: TranslationParams | string, fallback?: string): string => {
      let params: TranslationParams | undefined;
      let fallbackText: string | undefined;

      if (typeof paramsOrFallback === "string") {
        fallbackText = paramsOrFallback;
      } else {
        params = paramsOrFallback;
        fallbackText = fallback;
      }

      if (i18n.isInitialized && i18n.exists(key)) {
        return i18n.t(key, params);
      }

      const currentDict = TRANSLATIONS[currentLanguage];
      const defaultDict = TRANSLATIONS[DEFAULT_LANGUAGE];

      const rawTranslation = currentDict?.[key] ?? defaultDict?.[key] ?? fallbackText ?? key;
      return interpolate(rawTranslation, params);
    },
    [currentLanguage]
  );

  // Dynamic DOM Translation Loop (Top <header> down to <main>, STRICTLY EXCLUDING <footer> container and descendants)
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const isInsideFooter = (node: Node): boolean => {
      let current: Node | null = node;
      while (current && current !== document.body) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          const el = current as HTMLElement;
          if (el.tagName.toLowerCase() === "footer" || el.closest("footer")) {
            return true;
          }
        }
        current = current.parentNode;
      }
      return false;
    };

    const headerAndMainElements = Array.from(document.querySelectorAll("header, main, [data-i18n]"));
    headerAndMainElements.forEach((el) => {
      if (isInsideFooter(el)) return; // STRICT DOM EXCLUSION RULE FOR FOOTER
      const i18nKey = el.getAttribute("data-i18n");
      if (i18nKey) {
        const translated = t(i18nKey);
        if (translated && translated !== i18nKey) {
          el.textContent = translated;
        }
      }
    });
  }, [currentLanguage, t]);

  const contextValue = useMemo(
    () => ({ currentLanguage, setLanguage, languageOption, isRtl, t }),
    [currentLanguage, setLanguage, languageOption, isRtl, t]
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={contextValue}>
        {children ?? null}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  return context || defaultContextValue;
};

export { i18n };
export default i18n;
