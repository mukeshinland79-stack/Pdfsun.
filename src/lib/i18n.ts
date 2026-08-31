export * from "./i18n.tsx";
export {
  MASTER_TRANSLATIONS,
  registerLanguageDictionary,
  getTranslationDictionary,
  ENGLISH_TRANSLATIONS,
  HINDI_TRANSLATIONS,
  SPANISH_TRANSLATIONS,
  FRENCH_TRANSLATIONS,
  GERMAN_TRANSLATIONS,
  ARABIC_TRANSLATIONS,
  HEBREW_TRANSLATIONS,
  URDU_TRANSLATIONS,
} from "./translations";
export type {
  TranslationSchema,
  NavTranslations,
  HeroTranslations,
  PricingTranslations,
  AiTranslations,
  FooterTranslations,
  UiTranslations,
  ToolTranslationItem,
  WorkspaceTranslations,
  FaqTranslations,
  BadgesTranslations,
  CategoriesTranslations,
} from "./translations";
import i18n from "./i18n.tsx";
export default i18n;
