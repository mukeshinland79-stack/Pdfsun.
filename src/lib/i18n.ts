import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, FC } from "react";
import i18n from "i18next";
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
  { code: "mr", name: "Marathi", nativeName: "મરાઠી", flag: "🇮🇳" },
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

export const RTL_LANGUAGES = ["ar", "ur", "fa"];

export const isRtlLanguage = (code: string): boolean => {
  return RTL_LANGUAGES.includes(code);
};

const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "pdfsun_language";

const getInitialLanguage = (): string => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("pdfsun_lang");
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
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

const initialLanguage = getInitialLanguage();

// Initialize i18next singleton
if (!i18n.isInitialized) {
  i18n
    .use(HttpBackend)
    .init({
      backend: {
        loadPath: "/locales/{{lng}}/translation.json",
      },
      lng: initialLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: {
        escapeValue: false,
      },
    });
}

export type TranslationParams = Record<string, string | number>;

export interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  languageOption: LanguageOption;
  isRtl: boolean;
  t: (key: string, paramsOrFallback?: TranslationParams | string, fallback?: string) => string;
}

const defaultLanguageOption =
  SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE) || SUPPORTED_LANGUAGES[0];

const defaultContextValue: LanguageContextType = {
  currentLanguage: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  languageOption: defaultLanguageOption,
  isRtl: false,
  t: (key: string, paramsOrFallback?: TranslationParams | string, fallback?: string): string => {
    let fallbackText: string | undefined;
    if (typeof paramsOrFallback === "string") {
      fallbackText = paramsOrFallback;
    } else {
      fallbackText = fallback;
    }
    return fallbackText || key;
  },
};

export const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export const LanguageProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = React.useState<string>(initialLanguage);

  // Sync state if i18n changes language externally
  React.useEffect(() => {
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

  // Update HTML document direction (dir) to 'rtl' for 'ar', 'ur', 'fa', save to localStorage, and sync i18n
  React.useEffect(() => {
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
    document.dir = isRtl ? "rtl" : "ltr";
    if (isRtl) {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  }, [currentLanguage]);

  const languageOption = React.useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || defaultLanguageOption,
    [currentLanguage]
  );

  const isRtl = isRtlLanguage(currentLanguage);

  const setLanguage = React.useCallback((code: string) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
      setCurrentLanguageState(code);
      i18n.changeLanguage(code);
    }
  }, []);

  const t = React.useCallback(
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
        const res = i18n.t(key, params as Record<string, unknown>);
        if (typeof res === "string") return res;
        if (typeof res === "number" || typeof res === "boolean") return String(res);
        return fallbackText || key;
      }

      const res = i18n.t(key, { ...params, defaultValue: fallbackText || key });
      if (typeof res === "string") return res;
      if (typeof res === "number" || typeof res === "boolean") return String(res);
      return fallbackText || key;
    },
    [currentLanguage]
  );

  const contextValue = React.useMemo(
    () => ({ currentLanguage, setLanguage, languageOption, isRtl, t }),
    [currentLanguage, setLanguage, languageOption, isRtl, t]
  );

  return React.createElement(
    LanguageContext.Provider,
    { value: contextValue },
    children ?? null
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  return context || defaultContextValue;
};

export { i18n };
export default i18n;
