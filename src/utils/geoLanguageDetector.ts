import { SupportedLanguage, GeoDetectionResult } from "../types/history";

/**
 * 30 Supported Languages for Global History Engine with Native Names, Flags, and Hreflang
 */
export const TOP_30_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English (US)", nativeName: "English (US)", flag: "🇺🇸", hreflang: "en", popularCountries: ["US", "GB", "CA", "AU", "IN", "NZ", "SG", "ZA"] },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", hreflang: "hi", popularCountries: ["IN", "NP", "MU", "FJ"] },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳", hreflang: "bn", popularCountries: ["BD", "IN"] },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", hreflang: "mr", popularCountries: ["IN"] },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", hreflang: "te", popularCountries: ["IN"] },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", hreflang: "ta", popularCountries: ["IN", "LK", "SG", "MY"] },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳", hreflang: "gu", popularCountries: ["IN"] },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳", hreflang: "pa", popularCountries: ["IN", "PK", "CA", "GB"] },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳", hreflang: "kn", popularCountries: ["IN"] },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", hreflang: "ml", popularCountries: ["IN", "AE", "SA"] },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", direction: "rtl", hreflang: "ur", popularCountries: ["PK", "IN", "AE"] },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", hreflang: "es", popularCountries: ["ES", "MX", "CO", "AR", "PE", "CL", "US"] },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", hreflang: "fr", popularCountries: ["FR", "CA", "BE", "CH", "SN", "CI"] },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", hreflang: "de", popularCountries: ["DE", "AT", "CH", "LI"] },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", hreflang: "it", popularCountries: ["IT", "CH", "SM"] },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", hreflang: "pt", popularCountries: ["BR", "PT", "AO", "MZ"] },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", hreflang: "ru", popularCountries: ["RU", "KZ", "BY", "KG"] },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", hreflang: "ja", popularCountries: ["JP"] },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", hreflang: "ko", popularCountries: ["KR"] },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳", hreflang: "zh-Hans", popularCountries: ["CN", "SG", "TW", "HK"] },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", direction: "rtl", hreflang: "ar", popularCountries: ["SA", "AE", "EG", "QA", "KW", "OM"] },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", hreflang: "tr", popularCountries: ["TR", "CY"] },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", hreflang: "nl", popularCountries: ["NL", "BE", "SR"] },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", hreflang: "pl", popularCountries: ["PL"] },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", hreflang: "vi", popularCountries: ["VN"] },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", hreflang: "th", popularCountries: ["TH"] },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", hreflang: "id", popularCountries: ["ID"] },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦", hreflang: "uk", popularCountries: ["UA"] },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", direction: "rtl", hreflang: "fa", popularCountries: ["IR", "AF", "TJ"] },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾", hreflang: "ms", popularCountries: ["MY", "BN", "SG"] },
];

/**
 * Maps country codes to their default prominent native language and name
 */
export const COUNTRY_META_MAP: Record<string, { name: string; defaultLang: string; flag: string }> = {
  IN: { name: "India", defaultLang: "hi", flag: "🇮🇳" },
  US: { name: "United States", defaultLang: "en", flag: "🇺🇸" },
  GB: { name: "United Kingdom", defaultLang: "en", flag: "🇬🇧" },
  CA: { name: "Canada", defaultLang: "en", flag: "🇨🇦" },
  AU: { name: "Australia", defaultLang: "en", flag: "🇦🇺" },
  DE: { name: "Germany", defaultLang: "de", flag: "🇩🇪" },
  FR: { name: "France", defaultLang: "fr", flag: "🇫🇷" },
  ES: { name: "Spain", defaultLang: "es", flag: "🇪🇸" },
  IT: { name: "Italy", defaultLang: "it", flag: "🇮🇹" },
  BR: { name: "Brazil", defaultLang: "pt", flag: "🇧🇷" },
  JP: { name: "Japan", defaultLang: "ja", flag: "🇯🇵" },
  KR: { name: "South Korea", defaultLang: "ko", flag: "🇰🇷" },
  CN: { name: "China", defaultLang: "zh", flag: "🇨🇳" },
  SA: { name: "Saudi Arabia", defaultLang: "ar", flag: "🇸🇦" },
  AE: { name: "United Arab Emirates", defaultLang: "ar", flag: "🇦🇪" },
  RU: { name: "Russia", defaultLang: "ru", flag: "🇷🇺" },
  TR: { name: "Turkey", defaultLang: "tr", flag: "🇹🇷" },
  NL: { name: "Netherlands", defaultLang: "nl", flag: "🇳🇱" },
  PL: { name: "Poland", defaultLang: "pl", flag: "🇵🇱" },
  VN: { name: "Vietnam", defaultLang: "vi", flag: "🇻🇳" },
  TH: { name: "Thailand", defaultLang: "th", flag: "🇹🇭" },
  ID: { name: "Indonesia", defaultLang: "id", flag: "🇮🇩" },
  UA: { name: "Ukraine", defaultLang: "uk", flag: "🇺🇦" },
  IR: { name: "Iran", defaultLang: "fa", flag: "🇮🇷" },
  MY: { name: "Malaysia", defaultLang: "ms", flag: "🇲🇾" },
  BD: { name: "Bangladesh", defaultLang: "bn", flag: "🇧🇩" },
  PK: { name: "Pakistan", defaultLang: "ur", flag: "🇵🇰" },
  MX: { name: "Mexico", defaultLang: "es", flag: "🇲🇽" },
};

/**
 * Timezone-to-Country Heuristics Mapping for high-speed offline resolution
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Los_Angeles": "US",
  "America/Denver": "US",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "America/Sao_Paulo": "BR",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Europe/Moscow": "RU",
  "Europe/Istanbul": "TR",
  "Europe/Amsterdam": "NL",
  "Europe/Warsaw": "PL",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID",
  "Europe/Kyiv": "UA",
  "Europe/Kiev": "UA",
  "Asia/Tehran": "IR",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Dhaka": "BD",
  "Asia/Karachi": "PK",
  "America/Mexico_City": "MX",
  "America/Toronto": "CA",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
};

/**
 * Zero-Click Geo & Language Auto-Detection Engine
 */
export function detectUserGeoAndLanguage(): GeoDetectionResult {
  // Check if user manually saved their preference previously
  if (typeof window !== "undefined") {
    try {
      const savedLangCode = localStorage.getItem("pdfsun_history_lang");
      const savedCountryCode = localStorage.getItem("pdfsun_history_country");

      if (savedLangCode) {
        const matched = TOP_30_LANGUAGES.find((l) => l.code === savedLangCode);
        if (matched) {
          const countryInfo = (savedCountryCode && COUNTRY_META_MAP[savedCountryCode]) || COUNTRY_META_MAP[matched.popularCountries[0]] || { name: "Global", defaultLang: "en", flag: "🌐" };
          return {
            detectedLanguage: matched,
            detectedCountryCode: savedCountryCode || matched.popularCountries[0] || "US",
            detectedCountryName: countryInfo.name,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            isAutoDetected: false,
            accuracy: "user-selected",
          };
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // 1. Detect Timezone and Country
  let userTz = "UTC";
  let inferredCountry = "IN"; // Default primary focus
  try {
    userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    if (TIMEZONE_TO_COUNTRY[userTz]) {
      inferredCountry = TIMEZONE_TO_COUNTRY[userTz];
    } else if (userTz.startsWith("America/")) {
      inferredCountry = "US";
    } else if (userTz.startsWith("Europe/")) {
      inferredCountry = "GB";
    } else if (userTz.startsWith("Asia/")) {
      inferredCountry = "IN";
    }
  } catch {
    inferredCountry = "IN";
  }

  // 2. Detect Browser Preferred Languages (defaults to English "en")
  let detectedLangCode = "en";
  if (typeof navigator !== "undefined") {
    const rawLanguages = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language || "en"];

    for (const rawLang of rawLanguages) {
      if (!rawLang) continue;
      const cleanLang = rawLang.toLowerCase().split("-")[0];
      const match = TOP_30_LANGUAGES.find((l) => l.code === cleanLang);
      if (match) {
        detectedLangCode = match.code;
        break;
      }
    }
  }

  const selectedLanguage = TOP_30_LANGUAGES.find((l) => l.code === detectedLangCode) || TOP_30_LANGUAGES[0];
  const countryInfo = COUNTRY_META_MAP[inferredCountry] || { name: "Global", defaultLang: "en", flag: "🌐" };

  return {
    detectedLanguage: selectedLanguage,
    detectedCountryCode: inferredCountry,
    detectedCountryName: countryInfo.name,
    timeZone: userTz,
    isAutoDetected: true,
    accuracy: "browser-locale",
  };
}

/**
 * Formats a Date object into human-readable multi-lingual date string
 */
export function formatLocalizedHistoryDate(date: Date, langCode: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
    return new Intl.DateTimeFormat(langCode, options).format(date);
  } catch {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }
}
