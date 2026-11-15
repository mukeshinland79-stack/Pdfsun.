import { useState, useEffect, useCallback, useMemo } from "react";
import { SupportedLanguage } from "../types/history";
import { TOP_30_LANGUAGES } from "../utils/geoLanguageDetector";

const STORAGE_KEY = "pdfsun_history_lang";
const FALLBACK_LANG = "en";

// Global in-memory listeners for cross-component zero-reload synchronization
type Listener = (lang: SupportedLanguage) => void;
const listeners = new Set<Listener>();

let currentLangState: SupportedLanguage = (() => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("pdfsun_lang");
      if (saved) {
        const found = TOP_30_LANGUAGES.find(
          (l) => l.code === saved || l.code.split("-")[0] === saved.split("-")[0]
        );
        if (found) return found;
      }
    } catch {}
  }
  return TOP_30_LANGUAGES.find((l) => l.code === FALLBACK_LANG) || TOP_30_LANGUAGES[0];
})();

export function setGlobalLanguage(code: string) {
  const found = TOP_30_LANGUAGES.find(
    (l) => l.code === code || l.code.split("-")[0] === code.split("-")[0]
  );
  if (!found) return;

  currentLangState = found;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, found.code);
      localStorage.setItem("pdfsun_lang", found.code);
    } catch {}

    // Dispatch global event for legacy components
    window.dispatchEvent(
      new CustomEvent("pdfsun_language_changed", {
        detail: { lang: found.code, direction: found.direction || "ltr" },
      })
    );
  }

  listeners.forEach((listener) => listener(found));
}

/**
 * Universal Language Store Hook (V2)
 * Provides persistent reactive language state, RTL calculation, and localized native date formatting.
 */
export function useLanguageStore() {
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(currentLangState);

  useEffect(() => {
    const handleUpdate: Listener = (newLang) => {
      setActiveLang(newLang);
    };

    listeners.add(handleUpdate);

    // Also listen to window event in case another tab or legacy system changed it
    const handleWindowEvent = (e: any) => {
      const code = e.detail?.lang;
      if (code && code !== activeLang.code) {
        const match = TOP_30_LANGUAGES.find(
          (l) => l.code === code || l.code.split("-")[0] === code.split("-")[0]
        );
        if (match) {
          currentLangState = match;
          setActiveLang(match);
        }
      }
    };

    window.addEventListener("pdfsun_language_changed", handleWindowEvent);

    return () => {
      listeners.delete(handleUpdate);
      window.removeEventListener("pdfsun_language_changed", handleWindowEvent);
    };
  }, [activeLang.code]);

  const isRtl = useMemo(() => {
    return (
      activeLang.direction === "rtl" ||
      activeLang.code === "ar" ||
      activeLang.code === "ur" ||
      activeLang.code === "fa"
    );
  }, [activeLang]);

  const direction = isRtl ? "rtl" : "ltr";

  // Native Intl.DateTimeFormat helper with locale fallback
  const formatLocalizedDate = useCallback(
    (date: Date, options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }) => {
      try {
        const localeMap: Record<string, string> = {
          en: "en-US",
          hi: "hi-IN",
          bn: "bn-IN",
          mr: "mr-IN",
          te: "te-IN",
          ta: "ta-IN",
          gu: "gu-IN",
          pa: "pa-IN",
          kn: "kn-IN",
          ml: "ml-IN",
          ur: "ur-PK",
          es: "es-ES",
          fr: "fr-FR",
          de: "de-DE",
          it: "it-IT",
          pt: "pt-PT",
          ru: "ru-RU",
          ja: "ja-JP",
          ko: "ko-KR",
          zh: "zh-CN",
          ar: "ar-SA",
          tr: "tr-TR",
          nl: "nl-NL",
          pl: "pl-PL",
          vi: "vi-VN",
          th: "th-TH",
          id: "id-ID",
          uk: "uk-UA",
          fa: "fa-IR",
          ms: "ms-MY",
        };

        const targetLocale = localeMap[activeLang.code] || activeLang.code || "en-US";
        return new Intl.DateTimeFormat(targetLocale, options).format(date);
      } catch {
        return date.toLocaleDateString("en-US", options);
      }
    },
    [activeLang.code]
  );

  return {
    currentLanguage: activeLang.code,
    languageMeta: activeLang,
    allLanguages: TOP_30_LANGUAGES,
    isRtl,
    direction,
    setLanguage: setGlobalLanguage,
    formatLocalizedDate,
  };
}
