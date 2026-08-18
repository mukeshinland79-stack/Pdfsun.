export interface HistoryEventItem {
  id: string;
  year: number | string;
  headline: string;
  description: string;
  category: "milestone" | "birth" | "invention" | "culture" | "country-spotlight";
  tag: string;
  significance: string;
  countryCode?: string;
  countryName?: string;
  wikipediaUrl?: string;
}

export interface DailyTriviaQuiz {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  historicalContext: string;
  relatedYear: string | number;
}

export interface DayInHistoryData {
  dateString: string; // e.g. "August 17" or "17 August"
  month: number; // 1-12
  day: number; // 1-31
  formattedDate: string;
  dayOfYear: number;
  featuredHeadline: string;
  countryCode: string;
  countryName: string;
  languageCode: string;
  languageName: string;
  isAiEnhanced?: boolean;
  events: HistoryEventItem[];
  births: HistoryEventItem[];
  discoveries: HistoryEventItem[];
  countrySpotlight?: HistoryEventItem[];
  dailyTrivia: DailyTriviaQuiz;
  quoteOfTheDay: {
    quote: string;
    author: string;
    context: string;
  };
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction?: "ltr" | "rtl";
  hreflang: string;
  popularCountries: string[];
}

export interface GeoDetectionResult {
  detectedLanguage: SupportedLanguage;
  detectedCountryCode: string;
  detectedCountryName: string;
  detectedCity?: string;
  timeZone: string;
  isAutoDetected: boolean;
  accuracy: "browser-locale" | "ip-geolocation" | "timezone-inferred" | "user-selected";
}
