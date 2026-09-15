/**
 * Dynamic Hreflang & Meta Tag Generator Module for PDFSun.in
 * Supports 18+ high-intent locales across Tier-1, Tier-2, and Tier-3 global markets.
 * Fully compatible with React (react-helmet-async), Node.js (SSR / Express), and Next.js.
 */

export interface LocaleConfig {
  code: string; // BCP 47 code (e.g. en-US, de-DE, hi-IN)
  hreflang: string; // hreflang attribute value
  lang: string; // ISO 639-1 language
  country: string; // ISO 3166-1 alpha-2 country
  name: string; // English name
  nativeName: string; // Native language name
  tier: 1 | 2 | 3;
  region: "North America" | "Europe" | "LATAM" | "Middle East" | "APAC" | "South Asia";
  cpcPotential: "High" | "Medium" | "Volume";
}

/**
 * 18+ High-Intent Global Locales for Programmatic SEO & Geo-Targeting
 */
export const HIGH_INTENT_LOCALES: LocaleConfig[] = [
  // Tier-1: High CPC / RPM (North America, UK, Western Europe, ANZ, East Asia)
  {
    code: "en-US",
    hreflang: "en-US",
    lang: "en",
    country: "US",
    name: "English (United States)",
    nativeName: "English (US)",
    tier: 1,
    region: "North America",
    cpcPotential: "High",
  },
  {
    code: "en-GB",
    hreflang: "en-GB",
    lang: "en",
    country: "GB",
    name: "English (United Kingdom)",
    nativeName: "English (UK)",
    tier: 1,
    region: "Europe",
    cpcPotential: "High",
  },
  {
    code: "en-CA",
    hreflang: "en-CA",
    lang: "en",
    country: "CA",
    name: "English (Canada)",
    nativeName: "English (Canada)",
    tier: 1,
    region: "North America",
    cpcPotential: "High",
  },
  {
    code: "en-AU",
    hreflang: "en-AU",
    lang: "en",
    country: "AU",
    name: "English (Australia)",
    nativeName: "English (Australia)",
    tier: 1,
    region: "APAC",
    cpcPotential: "High",
  },
  {
    code: "de-DE",
    hreflang: "de-DE",
    lang: "de",
    country: "DE",
    name: "German (Germany)",
    nativeName: "Deutsch",
    tier: 1,
    region: "Europe",
    cpcPotential: "High",
  },
  {
    code: "fr-FR",
    hreflang: "fr-FR",
    lang: "fr",
    country: "FR",
    name: "French (France)",
    nativeName: "Français",
    tier: 1,
    region: "Europe",
    cpcPotential: "High",
  },
  {
    code: "es-ES",
    hreflang: "es-ES",
    lang: "es",
    country: "ES",
    name: "Spanish (Spain)",
    nativeName: "Español (España)",
    tier: 1,
    region: "Europe",
    cpcPotential: "High",
  },
  {
    code: "it-IT",
    hreflang: "it-IT",
    lang: "it",
    country: "IT",
    name: "Italian (Italy)",
    nativeName: "Italiano",
    tier: 1,
    region: "Europe",
    cpcPotential: "High",
  },
  {
    code: "nl-NL",
    hreflang: "nl-NL",
    lang: "nl",
    country: "NL",
    name: "Dutch (Netherlands)",
    nativeName: "Nederlands",
    tier: 1,
    region: "Europe",
    cpcPotential: "High",
  },
  {
    code: "ja-JP",
    hreflang: "ja-JP",
    lang: "ja",
    country: "JP",
    name: "Japanese (Japan)",
    nativeName: "日本語",
    tier: 1,
    region: "APAC",
    cpcPotential: "High",
  },
  {
    code: "ko-KR",
    hreflang: "ko-KR",
    lang: "ko",
    country: "KR",
    name: "Korean (South Korea)",
    nativeName: "한국어",
    tier: 1,
    region: "APAC",
    cpcPotential: "High",
  },

  // Tier-2: Consistent High Volume & Expanding Ad Spend (LATAM, Middle East, SE Asia, CIS)
  {
    code: "pt-BR",
    hreflang: "pt-BR",
    lang: "pt",
    country: "BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    tier: 2,
    region: "LATAM",
    cpcPotential: "Medium",
  },
  {
    code: "es-MX",
    hreflang: "es-MX",
    lang: "es",
    country: "MX",
    name: "Spanish (Mexico)",
    nativeName: "Español (México)",
    tier: 2,
    region: "LATAM",
    cpcPotential: "Medium",
  },
  {
    code: "ar-SA",
    hreflang: "ar-SA",
    lang: "ar",
    country: "SA",
    name: "Arabic (Saudi Arabia)",
    nativeName: "العربية (السعودية)",
    tier: 2,
    region: "Middle East",
    cpcPotential: "Medium",
  },
  {
    code: "ar-AE",
    hreflang: "ar-AE",
    lang: "ar",
    country: "AE",
    name: "Arabic (UAE)",
    nativeName: "العربية (الإمارات)",
    tier: 2,
    region: "Middle East",
    cpcPotential: "Medium",
  },
  {
    code: "id-ID",
    hreflang: "id-ID",
    lang: "id",
    country: "ID",
    name: "Indonesian (Indonesia)",
    nativeName: "Bahasa Indonesia",
    tier: 2,
    region: "APAC",
    cpcPotential: "Medium",
  },
  {
    code: "vi-VN",
    hreflang: "vi-VN",
    lang: "vi",
    country: "VN",
    name: "Vietnamese (Vietnam)",
    nativeName: "Tiếng Việt",
    tier: 2,
    region: "APAC",
    cpcPotential: "Medium",
  },
  {
    code: "th-TH",
    hreflang: "th-TH",
    lang: "th",
    country: "TH",
    name: "Thai (Thailand)",
    nativeName: "ไทย",
    tier: 2,
    region: "APAC",
    cpcPotential: "Medium",
  },
  {
    code: "ru-RU",
    hreflang: "ru-RU",
    lang: "ru",
    country: "RU",
    name: "Russian (Russia)",
    nativeName: "Русский",
    tier: 2,
    region: "Europe",
    cpcPotential: "Medium",
  },

  // Tier-3: Explosive Traffic Volume, High Retention & Viral DA (India, South Asia)
  {
    code: "hi-IN",
    hreflang: "hi-IN",
    lang: "hi",
    country: "IN",
    name: "Hindi (India)",
    nativeName: "हिन्दी",
    tier: 3,
    region: "South Asia",
    cpcPotential: "Volume",
  },
  {
    code: "en-IN",
    hreflang: "en-IN",
    lang: "en",
    country: "IN",
    name: "English (India)",
    nativeName: "English (India)",
    tier: 3,
    region: "South Asia",
    cpcPotential: "Volume",
  },
];

export interface HreflangTag {
  hreflang: string;
  href: string;
}

export interface MetaGeneratorOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  baseUrl?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  ogImageAlt?: string;
  author?: string;
  twitterHandle?: string;
  noIndex?: boolean;
  locale?: string;
}

export interface GeneratedMetadata {
  title: string;
  meta: Array<{ name?: string; property?: string; content: string }>;
  links: Array<{ rel: string; href: string; hreflang?: string }>;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
}

/**
 * Generate hreflang tags for any given route path
 */
export function generateHreflangTags(
  pathname: string = "",
  baseUrl: string = "https://pdfsun.in"
): HreflangTag[] {
  // Normalize clean path
  let cleanPath = pathname.trim();
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);
  const pathPrefix = cleanPath ? `/${cleanPath}` : "";

  const tags: HreflangTag[] = [
    // x-default points to base canonical URL
    {
      hreflang: "x-default",
      href: `${baseUrl}${pathPrefix}`,
    },
    // Generic English default
    {
      hreflang: "en",
      href: `${baseUrl}${pathPrefix}`,
    },
  ];

  // Generate localized hreflang targets
  for (const loc of HIGH_INTENT_LOCALES) {
    let href = `${baseUrl}${pathPrefix}`;
    // If locale language differs from primary English, attach ?lang= query or route param
    if (loc.lang !== "en") {
      const separator = pathPrefix.includes("?") ? "&" : "?";
      href = `${baseUrl}${pathPrefix}${separator}lang=${loc.lang}`;
    } else if (loc.code !== "en-US") {
      const separator = pathPrefix.includes("?") ? "&" : "?";
      href = `${baseUrl}${pathPrefix}${separator}gl=${loc.country.toLowerCase()}`;
    }

    tags.push({
      hreflang: loc.hreflang,
      href,
    });
  }

  return tags;
}

/**
 * Generate high-CTR dynamic OpenGraph preview card parameters
 */
export function generateDynamicOgImageUrl(options: {
  toolName?: string;
  toolDescription?: string;
  category?: string;
  badge?: string;
  baseUrl?: string;
}): string {
  const {
    toolName = "PDF Tools & AI Engine",
    category = "Utility",
    badge = "100% Free & Secure",
    baseUrl = "https://pdfsun.in",
  } = options;

  // Uses SVG / static branded card with dynamic fallback
  const params = new URLSearchParams({
    title: toolName,
    cat: category,
    badge,
    v: "2.1",
  });

  return `${baseUrl}/og-image.png?${params.toString()}`;
}

/**
 * Master metadata generator function
 */
export function generatePageMetadata(options: MetaGeneratorOptions): GeneratedMetadata {
  const {
    title = "PDFSun - Free Online PDF Tools | Merge, Split, Compress & Edit PDFs",
    description = "Free PDF converter, merge PDF online, compress PDF size, edit PDF documents safely with PDFSun. 100% private, client-side WebAssembly processing.",
    keywords = [
      "free PDF converter",
      "merge PDF online",
      "compress PDF size",
      "edit PDF documents",
      "split PDF",
      "convert PDF to Word",
      "WebAssembly PDF",
      "PDFSun",
      "pdfsun.in",
    ],
    canonicalPath = "",
    baseUrl = "https://pdfsun.in",
    ogType = "website",
    ogImage,
    ogImageAlt = "PDFSun - Free Online PDF Tools & AI Document Engine",
    author = "PDFSun",
    twitterHandle = "@pdfsun_in",
    noIndex = false,
  } = options;

  let cleanPath = canonicalPath.trim();
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);
  const canonicalUrl = cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;

  const resolvedOgImage =
    ogImage ||
    generateDynamicOgImageUrl({
      toolName: title.split(" - ")[0] || "Free PDF Tools",
      baseUrl,
    });

  const metaList: Array<{ name?: string; property?: string; content: string }> = [
    { name: "description", content: description },
    { name: "keywords", content: keywords.join(", ") },
    { name: "author", content: author },
    {
      name: "robots",
      content: noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    // Mobile optimization
    { name: "format-detection", content: "telephone=no" },
    { name: "theme-color", content: "#0f172a" },
  ];

  const linksList: Array<{ rel: string; href: string; hreflang?: string }> = [
    { rel: "canonical", href: canonicalUrl },
  ];

  // Append all 18+ high-intent hreflang links
  const hreflangs = generateHreflangTags(canonicalPath, baseUrl);
  for (const h of hreflangs) {
    linksList.push({
      rel: "alternate",
      hreflang: h.hreflang,
      href: h.href,
    });
  }

  const openGraph: Record<string, string> = {
    "og:type": ogType,
    "og:site_name": "PDFSun",
    "og:title": title,
    "og:description": description,
    "og:url": canonicalUrl,
    "og:image": resolvedOgImage,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": ogImageAlt,
    "og:locale": "en_US",
  };

  const twitter: Record<string, string> = {
    "twitter:card": "summary_large_image",
    "twitter:site": twitterHandle,
    "twitter:creator": twitterHandle,
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": resolvedOgImage,
  };

  return {
    title,
    meta: metaList,
    links: linksList,
    openGraph,
    twitter,
  };
}
