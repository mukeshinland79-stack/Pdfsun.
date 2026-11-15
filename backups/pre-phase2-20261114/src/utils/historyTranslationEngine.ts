import { DayInHistoryData, HistoryEventItem, DailyTriviaQuiz } from "../types/history";
import { formatLocalizedHistoryDate } from "./geoLanguageDetector";
import { getHistoryText } from "../data/historyData";
import {
  translateHistoricalText,
  translateSourceName,
  deepLocalizeHistoryData,
  useLocalizedHistoryData,
} from "./dynamicHistoryTranslator";

export {
  translateHistoricalText,
  translateSourceName,
  deepLocalizeHistoryData,
  useLocalizedHistoryData,
};

/**
 * Category names across core 18 languages
 */
export const CATEGORY_NAMES_I18N: Record<string, Record<string, string>> = {
  en: {
    all: "All Categories",
    milestone: "Historic Milestones",
    birth: "Notable Birthdays",
    invention: "Science & Inventions",
    culture: "Culture & Arts",
    "country-spotlight": "Country Spotlight",
  },
  hi: {
    all: "सभी श्रेणियां",
    milestone: "प्रमुख ऐतिहासिक घटनाएं",
    birth: "प्रसिद्ध जन्म एवं हस्तियां",
    invention: "वैज्ञानिक खोज व आविष्कार",
    culture: "संस्कृति एवं कला",
    "country-spotlight": "देश विशेष",
  },
  bn: {
    all: "সমস্ত বিভাগ",
    milestone: "ঐতিহাসিক মাইলফলক",
    birth: "বিশিষ্ট ব্যক্তিদের জন্ম",
    invention: "আবিষ্কার ও বিজ্ঞান",
    culture: "সংস্কৃতি ও সাহিত্য",
    "country-spotlight": "দেশের বিশেষ ঘটনা",
  },
  mr: {
    all: "सर्व श्रेणी",
    milestone: "ऐतिहासिक घडामोडी",
    birth: "प्रसिद्ध जन्म आणि व्यक्ती",
    invention: "वैज्ञानिक शोध",
    culture: "संस्कृती आणि कला",
    "country-spotlight": "देश विशेष",
  },
  te: {
    all: "అన్ని వర్గాలు",
    milestone: "చారిత్రక మైలురాళ్ళు",
    birth: "ప్రముఖుల జన్మదినాలు",
    invention: "సైన్స్ మరియు ఆవిష్కరణలు",
    culture: "సంస్కృతి మరియు కళలు",
    "country-spotlight": "దేశ విశేషాలు",
  },
  ta: {
    all: "அனைத்து பிரிவுகள்",
    milestone: "வரலாற்று மைல்கற்கள்",
    birth: "பிரபலங்களின் பிறந்தநாள்",
    invention: "கண்டுபிடிப்புகள் & அறிவியல்",
    culture: "கலை மற்றும் கலாச்சாரம்",
    "country-spotlight": "நாட்டின் சிறப்புகள்",
  },
  gu: {
    all: "બધી શ્રેણીઓ",
    milestone: "ઐતિહાસિક સીમાચિહ્નો",
    birth: "પ્રખ્યાત જન્મ અને હસ્તીઓ",
    invention: "વૈજ્ઞાનિક શોધો",
    culture: "સંસ્કૃતિ અને કલા",
    "country-spotlight": "દેશ વિશેષ",
  },
  pa: {
    all: "ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ",
    milestone: "ਇਤਿਹਾਸਕ ਮੀਲ ਪੱਥਰ",
    birth: "ਪ੍ਰਸਿੱਧ ਜਨਮ ਅਤੇ ਸ਼ਖਸੀਅਤਾਂ",
    invention: "ਵਿਗਿਆਨਕ ਖੋਜਾਂ",
    culture: "ਸੱਭਿਆਚਾਰ ਅਤੇ ਕਲਾ",
    "country-spotlight": "ਦੇਸ਼ ਵਿਸ਼ੇਸ਼",
  },
  ur: {
    all: "تمام زمرے",
    milestone: "اہم تاریخی سنگ میل",
    birth: "مشہور شخصیات کے یوم پیدائش",
    invention: "سائنسی ایجادات و دریافتیں",
    culture: "ثقافت و فنون",
    "country-spotlight": "ملکی تاریخ",
  },
  es: {
    all: "Todas las Categorías",
    milestone: "Hitos Históricos",
    birth: "Nacimientos Notables",
    invention: "Ciencia e Invenciones",
    culture: "Cultura y Arte",
    "country-spotlight": "Destacado del País",
  },
  fr: {
    all: "Toutes les catégories",
    milestone: "Événements Historiques",
    birth: "Naissances Célèbres",
    invention: "Sciences & Inventions",
    culture: "Culture et Arts",
    "country-spotlight": "Projecteur Pays",
  },
  de: {
    all: "Alle Kategorien",
    milestone: "Historische Meilensteine",
    birth: "Berühmte Geburtstage",
    invention: "Wissenschaft & Erfindungen",
    culture: "Kultur und Kunst",
    "country-spotlight": "Länder-Fokus",
  },
  ar: {
    all: "جميع الفئات",
    milestone: "أبرز المحطات التاريخية",
    birth: "مواليد بارزون",
    invention: "العلوم والاكتشافات",
    culture: "الثقافة والفنون",
    "country-spotlight": "أضواء على البلد",
  },
  ru: {
    all: "Все категории",
    milestone: "Исторические события",
    birth: "Знаменитые дни рождения",
    invention: "Наука и открытия",
    culture: "Культура и искусство",
    "country-spotlight": "В фокусе страны",
  },
  ja: {
    all: "すべてのカテゴリー",
    milestone: "歴史的マイルストーン",
    birth: "偉人の誕生日",
    invention: "科学と発明",
    culture: "文化と芸術",
    "country-spotlight": "国別ハイライト",
  },
  zh: {
    all: "全部类别",
    milestone: "重大历史时刻",
    birth: "名人诞辰",
    invention: "科技与发明",
    culture: "文化与艺术",
    "country-spotlight": "国家聚焦点",
  },
  pt: {
    all: "Todas as Categorias",
    milestone: "Grandes Marcos Históricos",
    birth: "Aniversários Notáveis",
    invention: "Ciência e Descobertas",
    culture: "Cultura e Artes",
    "country-spotlight": "Destaque do País",
  },
  it: {
    all: "Tutte le Categorie",
    milestone: "Eventi Storici Principali",
    birth: "Nascite Notabili",
    invention: "Scienza e Invenzioni",
    culture: "Cultura e Arti",
    "country-spotlight": "Focus Paese",
  },
};

/**
 * Standardized category badge tag mappings for all 18 languages
 */
export const TAG_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    "Global Milestone": "वैश्विक ऐतिहासिक पड़ाव",
    "Governance & Treaties": "शासन एवं ऐतिहासिक संधियां",
    "Notable Birthday": "प्रसिद्ध जन्म एवं हस्तियां",
    "Scientific Breakthrough": "वैज्ञानिक खोज व नवाचार",
    "Technology & Innovation": "प्रौद्योगिकी और नवाचार",
    "Space & Aerospace": "अंतरिक्ष एवं खगोल विज्ञान",
    "Culture & Arts": "संस्कृति एवं कला",
    "Freedom Struggle": "स्वतंत्रता संग्राम",
    "Independence & Borders": "स्वतंत्रता एवं सीमाएं",
    "National Sovereignty": "राष्ट्रीय संप्रभुता",
    "Digital Revolution": "डिजिटल क्रांति",
    "Industrial Revolution": "औद्योगिक क्रांति",
    "Civil Engineering": "सिविल इंजीनियरिंग उपलब्धि",
    "Astrophysics": "खगोल भौतिकी",
    "Mathematics & Science": "गणित एवं विज्ञान",
    "Literature & Nobel Laureate": "साहित्य व नोबेल पुरस्कार",
    "Cinema & Arts": "सिनेमा एवं दृश्य कला",
    "World War II": "द्वितीय विश्व युद्ध",
    "Indian Spotlight": "भारतीय ऐतिहासिक झलक",
  },
  bn: {
    "Global Milestone": "বিশ্ব মাইলফলক",
    "Governance & Treaties": "শাসন ও চুক্তি",
    "Notable Birthday": "বিশিষ্ট ব্যক্তির জন্ম",
    "Scientific Breakthrough": "বৈজ্ঞানিক সাফল্য",
    "Technology & Innovation": "প্রযুক্তি ও উদ্ভাবন",
    "Space & Aerospace": "মহাকাশ ও জ্যোতির্বিজ্ঞান",
    "Culture & Arts": "সংস্কৃতি ও সাহিত্য",
    "Freedom Struggle": "স্বাধীনতা সংগ্রাম",
    "Independence & Borders": "স্বাধীনতা ও সীমান্ত",
    "National Sovereignty": "জাতীয় সার্বভৌমত্ব",
    "Digital Revolution": "ডিজিটাল বিপ্লব",
    "Industrial Revolution": "শিল্প বিপ্লব",
    "Civil Engineering": "পূর্ত প্রকৌশল",
    "Astrophysics": "জ্যোতির্বিজ্ঞান",
    "Mathematics & Science": "গণিত ও বিজ্ঞান",
    "Literature & Nobel Laureate": "সাহিত্য ও নোবেল বিজয়ী",
    "Cinema & Arts": "চলচ্চিত্র ও শিল্পকলা",
    "World War II": "দ্বিতীয় বিশ্বযুদ্ধ",
    "Indian Spotlight": "ভারত বিশেষ",
  },
  mr: {
    "Global Milestone": "जागतिक घडामोडी",
    "Governance & Treaties": "शासन आणि करार",
    "Notable Birthday": "प्रसिद्ध जन्म आणि व्यक्ती",
    "Scientific Breakthrough": "वैज्ञानिक शोध",
    "Technology & Innovation": "तंत्रज्ञान आणि नवकल्पना",
    "Space & Aerospace": "अंतराळ आणि खगोलशास्त्र",
    "Culture & Arts": "संस्कृती आणि कला",
    "Freedom Struggle": "स्वातंत्र्य लढा",
    "Independence & Borders": "स्वातंत्र्य आणि सीमा",
    "National Sovereignty": "राष्ट्रीय सार्वभौमत्व",
    "Digital Revolution": "डिजिटल क्रांती",
    "Industrial Revolution": "औद्योगिक क्रांती",
    "Civil Engineering": "स्थापत्य अभियांत्रिकी",
    "Astrophysics": "खगोल भौतिकी",
    "Mathematics & Science": "गणित आणि विज्ञान",
    "Literature & Nobel Laureate": "साहित्य आणि नोबेल पुरस्कार",
    "Cinema & Arts": "सिनेमा आणि कला",
    "World War II": "दुसरे महायुद्ध",
    "Indian Spotlight": "भारतीय विशेष",
  },
  te: {
    "Global Milestone": "ప్రపంచ మైలురాయి",
    "Governance & Treaties": "పాలన మరియు ఒప్పందాలు",
    "Notable Birthday": "ప్రముఖుల జన్మదినం",
    "Scientific Breakthrough": "శాస్త్రీయ ఆవిష్కరణ",
    "Technology & Innovation": "సాంకేతికత & ఆవిష్కరణ",
    "Space & Aerospace": "అంతరిక్షం & ఏరోస్పేస్",
    "Culture & Arts": "సంస్కృతి మరియు కళలు",
    "Freedom Struggle": "స్వాతంత్ర్య పోరాటం",
    "Independence & Borders": "స్వాతంత్ర్యం & సరిహద్దులు",
    "National Sovereignty": "జాతీయ సార్వభౌమాధికారం",
    "Digital Revolution": "డిజిటల్ విప్లవం",
    "Industrial Revolution": "పారిశ్రామిక విప్లవం",
    "Civil Engineering": "సివిల్ ఇంజనీరింగ్",
    "Astrophysics": "ఖగోళ భౌతికశాస్త్రం",
    "Mathematics & Science": "గణితం & సైన్స్",
    "Literature & Nobel Laureate": "సాహిత్యం & నోబెల్ గ్రహీత",
    "Cinema & Arts": "సినిమా & కళలు",
    "World War II": "రెండవ ప్రపంచ యుద్ధం",
    "Indian Spotlight": "భారతీయ విశేషం",
  },
  ta: {
    "Global Milestone": "உலக வரலாற்று மைல்கல்",
    "Governance & Treaties": "ஆட்சி & ஒப்பந்தங்கள்",
    "Notable Birthday": "பிரபல பிறந்தநாள்",
    "Scientific Breakthrough": "அறிவியல் திருப்புமுனை",
    "Technology & Innovation": "தொழில்நுட்பம் & புதுமை",
    "Space & Aerospace": "விண்வெளி & வானியல்",
    "Culture & Arts": "கலை & கலாச்சாரம்",
    "Freedom Struggle": "சுதந்திரப் போராட்டம்",
    "Independence & Borders": "சுதந்திரம் & எல்லைகள்",
    "National Sovereignty": "தேசிய இறையாண்மை",
    "Digital Revolution": "டிஜிட்டல் புரட்சி",
    "Industrial Revolution": "தொழில்துறை புரட்சி",
    "Civil Engineering": "கட்டுமானப் பொறியியல்",
    "Astrophysics": "வானியற்பியல்",
    "Mathematics & Science": "கணிதம் & அறிவியல்",
    "Literature & Nobel Laureate": "இலக்கியம் & நோபல் பரிசு",
    "Cinema & Arts": "திரைப்படம் & கலைகள்",
    "World War II": "இரண்டாம் உலகப் போர்",
    "Indian Spotlight": "இந்திய சிறப்பு நிகழ்வு",
  },
  gu: {
    "Global Milestone": "વૈશ્વિક સીમાચિહ્ન",
    "Governance & Treaties": "શાસન અને સંધિઓ",
    "Notable Birthday": "પ્રખ્યાત જન્મ",
    "Scientific Breakthrough": "વૈજ્ઞાનિક સફળતા",
    "Technology & Innovation": "ટેકનોલોજી અને નવીનતા",
    "Space & Aerospace": "અંતરિક્ષ અને ખગોળશાસ્ત્ર",
    "Culture & Arts": "સંસ્કૃતિ અને કલા",
    "Freedom Struggle": "સ્વતંત્રતા સંગ્રામ",
    "Independence & Borders": "આઝાદી અને સરહદો",
    "National Sovereignty": "રાષ્ટ્રીય સાર્વભૌમત્વ",
    "Digital Revolution": "ડિજિટલ ક્રાંતિ",
    "Industrial Revolution": "ઔદ્યોગિક ક્રાંતિ",
    "Civil Engineering": "સિવિલ એન્જિનિયરિંગ",
    "Astrophysics": "ખગોળ ભૌતિકશાસ્ત્ર",
    "Mathematics & Science": "ગણિત અને વિજ્ઞાન",
    "Literature & Nobel Laureate": "સાહિત્ય અને નોબેલ વિજેતા",
    "Cinema & Arts": "સિનેમા અને કલા",
    "World War II": "દ્વિતીય વિશ્વયુદ્ધ",
    "Indian Spotlight": "ભારતીય વિશેષ",
  },
  pa: {
    "Global Milestone": "ਵਿਸ਼ਵ ਮੀਲ ਪੱਥਰ",
    "Governance & Treaties": "ਸ਼ਾਸਨ ਅਤੇ ਸੰਧੀਆਂ",
    "Notable Birthday": "ਪ੍ਰਮੁੱਖ ਜਨਮ",
    "Scientific Breakthrough": "ਵਿਗਿਆਨਕ ਸਫ਼ਲਤਾ",
    "Technology & Innovation": "ਤਕਨਾਲੋਜੀ ਅਤੇ ਨਵੀਨਤਾ",
    "Space & Aerospace": "ਪੁਲਾੜ ਅਤੇ ਖਗੋਲ ਵਿਗਿਆਨ",
    "Culture & Arts": "ਸੱਭਿਆਚਾਰ ਅਤੇ ਕਲਾ",
    "Freedom Struggle": "ਆਜ਼ਾਦੀ ਦਾ ਸੰਘਰਸ਼",
    "Independence & Borders": "ਆਜ਼ਾਦੀ ਅਤੇ ਸਰਹੱਦਾਂ",
    "National Sovereignty": "ਰਾਸ਼ਟਰੀ ਪ੍ਰਭੂਸੱਤਾ",
    "Digital Revolution": "ਡਿਜੀਟਲ ਕ੍ਰਾਂਤੀ",
    "Industrial Revolution": "ਉਦਯੋਗਿਕ ਕ੍ਰਾਂਤੀ",
    "Civil Engineering": "ਸਿਵਲ ਇੰਜੀਨੀਅਰਿੰਗ",
    "Astrophysics": "ਖਗੋਲ ਭੌਤਿਕ ਵਿਗਿਆਨ",
    "Mathematics & Science": "ਗਣਿਤ ਅਤੇ ਵਿਗਿਆਨ",
    "Literature & Nobel Laureate": "ਸਾਹਿਤ ਅਤੇ ਨੋਬਲ ਪੁਰਸਕਾਰ",
    "Cinema & Arts": "ਸਿਨੇਮਾ ਅਤੇ ਕਲਾ",
    "World War II": "ਦੂਜੀ ਵਿਸ਼ਵ ਜੰਗ",
    "Indian Spotlight": "ਭਾਰਤੀ ਵਿਸ਼ੇਸ਼",
  },
  ur: {
    "Global Milestone": "عالمی سنگ میل",
    "Governance & Treaties": "حکمرانی اور معاہدے",
    "Notable Birthday": "اہم یوم پیدائش",
    "Scientific Breakthrough": "سائنسی پیش رفت",
    "Technology & Innovation": "ٹیکنالوجی اور جدت",
    "Space & Aerospace": "خلائی تحقیق و فلکیات",
    "Culture & Arts": "ثقافت و فنون",
    "Freedom Struggle": "تحریک آزادی",
    "Independence & Borders": "آزادی اور سرحدیں",
    "National Sovereignty": "قومی خودمختاری",
    "Digital Revolution": "ڈیجیٹل انقلاب",
    "Industrial Revolution": "صنعتی انقلاب",
    "Civil Engineering": "تعمیراتی انجینئرنگ",
    "Astrophysics": "فلکیاتی طبیعیات",
    "Mathematics & Science": "ریاضی اور سائنس",
    "Literature & Nobel Laureate": "ادب اور نوبل انعام",
    "Cinema & Arts": "سینما اور فنون لطیفہ",
    "World War II": "دوسری جنگ عظیم",
    "Indian Spotlight": "ملکی خاص خبر",
  },
  es: {
    "Global Milestone": "HITO GLOBAL",
    "Governance & Treaties": "GOBERNANZA Y TRATADOS",
    "Notable Birthday": "NACIMIENTO DESTACADO",
    "Scientific Breakthrough": "AVANCE CIENTÍFICO",
    "Technology & Innovation": "TECNOLOGÍA E INNOVACIÓN",
    "Space & Aerospace": "ESPACIO Y AEROESPACIAL",
    "Culture & Arts": "CULTURA Y ARTE",
    "Freedom Struggle": "LUCHA POR LA LIBERTAD",
    "Independence & Borders": "INDEPENDENCIA Y FRONTERAS",
    "National Sovereignty": "SOBERANÍA NACIONAL",
    "Digital Revolution": "REVOLUCIÓN DIGITAL",
    "Industrial Revolution": "REVOLUCIÓN INDUSTRIAL",
    "Civil Engineering": "INGENIERÍA CIVIL",
    "Astrophysics": "ASTROFÍSICA",
    "Mathematics & Science": "MATEMÁTICAS Y CIENCIA",
    "Literature & Nobel Laureate": "LITERATURA Y PREMIO NOBEL",
    "Cinema & Arts": "CINE Y ARTES",
    "World War II": "SEGUNDA GUERRA MUNDIAL",
    "Indian Spotlight": "DESTACADO DE LA INDIA",
  },
  fr: {
    "Global Milestone": "JALON MONDIAL",
    "Governance & Treaties": "GOUVERNANCE ET TRAITÉS",
    "Notable Birthday": "NAISSANCE NOTABLE",
    "Scientific Breakthrough": "PERCÉE SCIENTIFIQUE",
    "Technology & Innovation": "TECHNOLOGIE & INNOVATION",
    "Space & Aerospace": "ESPACE ET AÉROSPATIAL",
    "Culture & Arts": "CULTURE ET ARTS",
    "Freedom Struggle": "LUTTE POUR LA LIBERTÉ",
    "Independence & Borders": "INDÉPENDANCE ET FRONTIÈRES",
    "National Sovereignty": "SOUVERAINETÉ NATIONALE",
    "Digital Revolution": "RÉVOLUTION NUMÉRIQUE",
    "Industrial Revolution": "RÉVOLUTION INDUSTRIELLE",
    "Civil Engineering": "GÉNIE CIVIL",
    "Astrophysics": "ASTROPHYSIQUE",
    "Mathematics & Science": "MATHÉMATIQUES & SCIENCES",
    "Literature & Nobel Laureate": "LITTÉRATURE ET PRIX NOBEL",
    "Cinema & Arts": "CINÉMA ET ARTS",
    "World War II": "SECONDE GUERRE MONDIALE",
    "Indian Spotlight": "PROJECTEUR SUR L'INDE",
  },
  de: {
    "Global Milestone": "GLOBALER MEILENSTEIN",
    "Governance & Treaties": "REGIERUNG & VERTRÄGE",
    "Notable Birthday": "BERÜHMTER GEBURTSTAG",
    "Scientific Breakthrough": "WISSENSCHAFTLICHER DURCHBRUCH",
    "Technology & Innovation": "TECHNOLOGIE & INNOVATION",
    "Space & Aerospace": "RAUMFAHRT & ASTRONOMIE",
    "Culture & Arts": "KULTUR UND KUNST",
    "Freedom Struggle": "FREIHEITSKAMPF",
    "Independence & Borders": "UNABHÄNGIGKEIT & GRENZEN",
    "National Sovereignty": "NATIONALE SOUVERÄNITÄT",
    "Digital Revolution": "DIGITALE REVOLUTION",
    "Industrial Revolution": "INDUSTRIELLE REVOLUTION",
    "Civil Engineering": "BAUINGENIEURWESEN",
    "Astrophysics": "ASTROPHYSIK",
    "Mathematics & Science": "MATHEMATIK & WISSENSCHAFT",
    "Literature & Nobel Laureate": "LITERATUR & NOBELPREIS",
    "Cinema & Arts": "KINO & KUNST",
    "World War II": "ZWEITER WELTKRIEG",
    "Indian Spotlight": "INDIEN-FOKUS",
  },
  ar: {
    "Global Milestone": "حدث عالمي بارز",
    "Governance & Treaties": "الحكم والمعاهدات",
    "Notable Birthday": "مواليد بارزون",
    "Scientific Breakthrough": "إنجاز علمي تاريخي",
    "Technology & Innovation": "التكنولوجيا والابتكار",
    "Space & Aerospace": "الفضاء والفلك",
    "Culture & Arts": "الثقافة والفنون",
    "Freedom Struggle": "النضال من أجل الحرية",
    "Independence & Borders": "الاستقلال والحدود",
    "National Sovereignty": "السيادة الوطنية",
    "Digital Revolution": "الثورة الرقمية",
    "Industrial Revolution": "الثورة الصناعية",
    "Civil Engineering": "الهندسة المدنية",
    "Astrophysics": "الفيزياء الفلكية",
    "Mathematics & Science": "الرياضيات والعلوم",
    "Literature & Nobel Laureate": "الأدب وجائزة نوبل",
    "Cinema & Arts": "السينما والفنون",
    "World War II": "الحرب العالمية الثانية",
    "Indian Spotlight": "أضواء على الهند",
  },
  ru: {
    "Global Milestone": "МИРОВОЕ СОБЫТИЕ",
    "Governance & Treaties": "ГОСУДАРСТВО И ДОГОВОРЫ",
    "Notable Birthday": "ЗНАМЕНИТЫЙ ДЕНЬ РОЖДЕНИЯ",
    "Scientific Breakthrough": "НАУЧНЫЙ ПРОРЫВ",
    "Technology & Innovation": "ТЕХНОЛОГИИ И ИННОВАЦИИ",
    "Space & Aerospace": "КОСМОС И АВИАЦИЯ",
    "Culture & Arts": "КУЛЬТУРА И ИСКУССТВО",
    "Freedom Struggle": "БОРЬБА ЗА СВОБОДУ",
    "Independence & Borders": "НЕЗАВИСИМОСТЬ И ГРАНИЦЫ",
    "National Sovereignty": "НАЦИОНАЛЬНЫЙ СУВЕРЕНИТЕТ",
    "Digital Revolution": "ЦИФРОВАЯ РЕВОЛЮЦИЯ",
    "Industrial Revolution": "ПРОМЫШЛЕННАЯ РЕВОЛЮЦИЯ",
    "Civil Engineering": "ИНЖЕНЕРНОЕ ДЕЛО",
    "Astrophysics": "АСТРОФИЗИКА",
    "Mathematics & Science": "МАТЕМАТИКА И НАУКА",
    "Literature & Nobel Laureate": "ЛИТЕРАТУРА И НОБЕЛЕВСКАЯ ПРЕМИЯ",
    "Cinema & Arts": "КИНО И ИСКУССТВО",
    "World War II": "ВТОРАЯ МИРОВАЯ ВОЙНА",
    "Indian Spotlight": "ИНДИЙСКИЙ ФОКУС",
  },
  ja: {
    "Global Milestone": "世界の歴史的マイルストーン",
    "Governance & Treaties": "条約と統治",
    "Notable Birthday": "偉人の誕生日",
    "Scientific Breakthrough": "科学的ブレークスルー",
    "Technology & Innovation": "技術革新とイノベーション",
    "Space & Aerospace": "宇宙探査と航空",
    "Culture & Arts": "文化と芸術",
    "Freedom Struggle": "自由への闘争",
    "Independence & Borders": "独立と国境",
    "National Sovereignty": "国家主権",
    "Digital Revolution": "デジタル革命",
    "Industrial Revolution": "産業革命",
    "Civil Engineering": "土木工学",
    "Astrophysics": "天体物理学",
    "Mathematics & Science": "数学と科学",
    "Literature & Nobel Laureate": "文学とノーベル賞",
    "Cinema & Arts": "映画と芸術",
    "World War II": "第二次世界大戦",
    "Indian Spotlight": "インドのハイライト",
  },
  zh: {
    "Global Milestone": "全球历史里程碑",
    "Governance & Treaties": "条约与国家治理",
    "Notable Birthday": "著名人物诞辰",
    "Scientific Breakthrough": "重大科学突破",
    "Technology & Innovation": "科技与发明创新",
    "Space & Aerospace": "航天与太空探索",
    "Culture & Arts": "文化与艺术",
    "Freedom Struggle": "民族独立斗争",
    "Independence & Borders": "独立与边界确立",
    "National Sovereignty": "国家主权",
    "Digital Revolution": "数字信息革命",
    "Industrial Revolution": "工业革命",
    "Civil Engineering": "土木工程壮举",
    "Astrophysics": "天体物理学",
    "Mathematics & Science": "数学与科学",
    "Literature & Nobel Laureate": "文学与诺贝尔奖",
    "Cinema & Arts": "电影与艺术",
    "World War II": "第二次世界大战",
    "Indian Spotlight": "印度历史亮点",
  },
  pt: {
    "Global Milestone": "MARCO GLOBAL",
    "Governance & Treaties": "GOVERNANÇA E TRATADOS",
    "Notable Birthday": "ANIVERSÁRIO NOTÁVEL",
    "Scientific Breakthrough": "AVANÇO CIENTÍFICO",
    "Technology & Innovation": "TECNOLOGIA E INOVAÇÃO",
    "Space & Aerospace": "ESPAÇO E AEROESPACIAL",
    "Culture & Arts": "CULTURA E ARTES",
    "Freedom Struggle": "LUTA PELA LIBERDADE",
    "Independence & Borders": "INDEPENDÊNCIA E FRONTEIRAS",
    "National Sovereignty": "SOBERANIA NACIONAL",
    "Digital Revolution": "REVOLUÇÃO DIGITAL",
    "Industrial Revolution": "REVOLUÇÃO INDUSTRIAL",
    "Civil Engineering": "ENGENHARIA CIVIL",
    "Astrophysics": "ASTROFÍSICA",
    "Mathematics & Science": "MATEMÁTICA E CIÊNCIA",
    "Literature & Nobel Laureate": "LITERATURA E PRÊMIO NOBEL",
    "Cinema & Arts": "CINEMA E ARTES",
    "World War II": "SEGUNDA GUERRA MUNDIAL",
    "Indian Spotlight": "DESTAQUE DA ÍNDIA",
  },
  it: {
    "Global Milestone": "EVENTO GLOBALE",
    "Governance & Treaties": "GOVERNO E TRATTATI",
    "Notable Birthday": "NASCITA CELEBRE",
    "Scientific Breakthrough": "SCOPERTA SCIENTIFICA",
    "Technology & Innovation": "TECNOLOGIA E INNOVAZIONE",
    "Space & Aerospace": "SPAZIO E AERONAUTICA",
    "Culture & Arts": "CULTURA E ARTI",
    "Freedom Struggle": "LOTTA PER LA LIBERTÀ",
    "Independence & Borders": "INDIPENDENZA E CONFINI",
    "National Sovereignty": "SOVRANITÀ NAZIONALE",
    "Digital Revolution": "RIVOLUZIONE DIGITALE",
    "Industrial Revolution": "RIVOLUZIONE INDUSTRIALE",
    "Civil Engineering": "INGEGNERIA CIVILE",
    "Astrophysics": "ASTROFISICA",
    "Mathematics & Science": "MATEMATICA E SCIENZA",
    "Literature & Nobel Laureate": "LETTERATURA E PREMIO NOBEL",
    "Cinema & Arts": "CINEMA E ARTI",
    "World War II": "SECONDA GUERRA MONDIALE",
    "Indian Spotlight": "FOCUS SULL'INDIA",
  },
};

/**
 * Common trivia answer options across languages
 */
export const TRIVIA_OPTIONS_I18N: Record<string, Record<string, string>> = {
  hi: {
    "All of the above": "उपरोक्त सभी (All of the above)",
    "Major Historic Treaty": "प्रमुख ऐतिहासिक संधि एवं शासन व्यवस्था",
    "Scientific Invention": "वैज्ञानिक आविष्कार एवं तकनीकी विकास",
    "Exploration Milestone": "भौगोलिक खोज व अंतरिक्ष यात्रा",
    "International Diplomatic Accords & Legal Frameworks": "अंतर्राष्ट्रीय कूटनीतिक समझौते एवं संवैधानिक सुधार",
    "Digital Telecommunications & Computing Architecture": "डिजिटल दूरसंचार एवं कंप्यूटर नेटवर्किंग",
    "Astronomical Observation & Planetary Mapping": "खगोलीय वेधशाला एवं ग्रहीय मानचित्रण",
    "The Panama Canal": "पनामा नहर (The Panama Canal)",
    "The Suez Canal": "स्वेज नहर (The Suez Canal)",
    "The Kiel Canal": "कील नहर (The Kiel Canal)",
    "The Erie Canal": "एरी नहर (The Erie Canal)",
  },
  bn: {
    "All of the above": "উপরের সবগুলি (All of the above)",
    "Major Historic Treaty": "প্রধান ঐতিহাসিক চুক্তি ও শাসনব্যবস্থা",
    "Scientific Invention": "বৈজ্ঞানিক আবিষ্কার ও প্রযুক্তি",
    "Exploration Milestone": "ভৌগোলিক আবিষ্কার ও অনুসন্ধান",
    "International Diplomatic Accords & Legal Frameworks": "আন্তর্জাতিক কূটনৈতিক চুক্তি ও সংস্কার",
    "Digital Telecommunications & Computing Architecture": "ডিজিটাল টেলিযোগাযোগ ও কম্পিউটিং",
    "Astronomical Observation & Planetary Mapping": "জ্যোতির্বিজ্ঞান পর্যবেক্ষণ ও ম্যাপিং",
    "The Panama Canal": "পানামা খাল (The Panama Canal)",
    "The Suez Canal": "সুয়েজ খাল (The Suez Canal)",
    "The Kiel Canal": "কিল খাল (The Kiel Canal)",
    "The Erie Canal": "এরি খাল (The Erie Canal)",
  },
  mr: {
    "All of the above": "वरील सर्व (All of the above)",
    "Major Historic Treaty": "महत्त्वपूर्ण ऐतिहासिक करार",
    "Scientific Invention": "वैज्ञानिक शोध व तंत्रज्ञान",
    "Exploration Milestone": "भौगोलिक शोध आणि मोहीम",
    "International Diplomatic Accords & Legal Frameworks": "आंतरराष्ट्रीय राजनैतिक करार",
    "Digital Telecommunications & Computing Architecture": "डिजिटल दूरसंचार आणि संगणक तंत्रज्ञान",
    "Astronomical Observation & Planetary Mapping": "खगोलशास्त्रीय निरीक्षण",
    "The Panama Canal": "पनामा कालवा (The Panama Canal)",
    "The Suez Canal": "सुएझ कालवा (The Suez Canal)",
    "The Kiel Canal": "कील कालवा (The Kiel Canal)",
    "The Erie Canal": "एरी कालवा (The Erie Canal)",
  },
  te: {
    "All of the above": "పైవన్నీ (All of the above)",
    "Major Historic Treaty": "ప్రధాన చారిత్రక ఒప్పందం",
    "Scientific Invention": "శాస్త్రీయ ఆవిష్కరణ",
    "Exploration Milestone": "అన్వేషణ మైలురాయి",
    "International Diplomatic Accords & Legal Frameworks": "అంతర్జాతీయ దౌత్య ఒప్పందాలు",
    "Digital Telecommunications & Computing Architecture": "డిజిటల్ టెలికమ్యూనికేషన్స్",
    "Astronomical Observation & Planetary Mapping": "ఖగోళ పరిశీలన",
    "The Panama Canal": "పనామా కాలువ (The Panama Canal)",
    "The Suez Canal": "సూయజ్ కాలువ (The Suez Canal)",
    "The Kiel Canal": "కీల్ కాలువ (The Kiel Canal)",
    "The Erie Canal": "ఎరీ కాలువ (The Erie Canal)",
  },
  ta: {
    "All of the above": "மேற்கண்ட அனைத்தும் (All of the above)",
    "Major Historic Treaty": "முக்கிய வரலாற்று ஒப்பந்தம்",
    "Scientific Invention": "அறிவியல் கண்டுபிடிப்பு",
    "Exploration Milestone": "ஆராய்ச்சி மைல்கல்",
    "International Diplomatic Accords & Legal Frameworks": "சர்வதேச இராஜதந்திர ஒப்பந்தங்கள்",
    "Digital Telecommunications & Computing Architecture": "டிஜிட்டல் தொலைத்தொடர்பு",
    "Astronomical Observation & Planetary Mapping": "வானியல் ஆய்வு",
    "The Panama Canal": "பனாமா கால்வாய் (The Panama Canal)",
    "The Suez Canal": "சூயஸ் கால்வாய் (The Suez Canal)",
    "The Kiel Canal": "கீல் கால்வாய் (The Kiel Canal)",
    "The Erie Canal": "ஈரி கால்வாய் (The Erie Canal)",
  },
  gu: {
    "All of the above": "ઉપરોક્ત તમામ (All of the above)",
    "Major Historic Treaty": "મુખ્ય ઐતિહાસિક સંધિ",
    "Scientific Invention": "વૈજ્ઞાનિક શોધ",
    "Exploration Milestone": "અન્વેષણ સીમાચિહ્ન",
    "International Diplomatic Accords & Legal Frameworks": "આંતરરાષ્ટ્રીય રાજદ્વારી કરારો",
    "Digital Telecommunications & Computing Architecture": "ડિજિટલ ટેલિકમ્યુનિકેશન",
    "Astronomical Observation & Planetary Mapping": "ખગોળીય અવલોકન",
    "The Panama Canal": "પનામા નહેર (The Panama Canal)",
    "The Suez Canal": "સુએઝ નહેર (The Suez Canal)",
    "The Kiel Canal": "કીલ નહેર (The Kiel Canal)",
    "The Erie Canal": "એરી નહેર (The Erie Canal)",
  },
  pa: {
    "All of the above": "ਉਪਰੋਕਤ ਸਾਰੇ (All of the above)",
    "Major Historic Treaty": "ਪ੍ਰਮੁੱਖ ਇਤਿਹਾਸਕ ਸੰਧੀ",
    "Scientific Invention": "ਵਿਗਿਆਨਕ ਖੋਜ",
    "Exploration Milestone": "ਖੋਜ ਮੀਲ ਪੱਥਰ",
    "International Diplomatic Accords & Legal Frameworks": "ਕੌਮਾਂਤਰੀ ਕੂਟਨੀਤਕ ਸਮਝੌਤੇ",
    "Digital Telecommunications & Computing Architecture": "ਡਿਜੀਟਲ ਦੂਰਸੰਚਾਰ",
    "Astronomical Observation & Planetary Mapping": "ਖਗੋਲੀ ਨਿਰੀਖਣ",
    "The Panama Canal": "ਪਨਾਮਾ ਨਹਿਰ (The Panama Canal)",
    "The Suez Canal": "ਸੁਏਜ਼ ਨਹਿਰ (The Suez Canal)",
    "The Kiel Canal": "ਕੀਲ ਨਹਿਰ (The Kiel Canal)",
    "The Erie Canal": "ਏਰੀ ਨਹਿਰ (The Erie Canal)",
  },
  ur: {
    "All of the above": "مذکورہ بالا تمام (All of the above)",
    "Major Historic Treaty": "اہم تاریخی معاہدہ",
    "Scientific Invention": "سائنسی ایجاد",
    "Exploration Milestone": "خلائی و ارضی دریافت",
    "International Diplomatic Accords & Legal Frameworks": "بین الاقوامی سفارتی معاہدے",
    "Digital Telecommunications & Computing Architecture": "ڈیجیٹل مواصلات و کمپیوٹر نیٹ ورک",
    "Astronomical Observation & Planetary Mapping": "فلکیاتی مشاہدات",
    "The Panama Canal": "نہر پاناما (The Panama Canal)",
    "The Suez Canal": "نہر سویز (The Suez Canal)",
    "The Kiel Canal": "نہر کیل (The Kiel Canal)",
    "The Erie Canal": "نہر ایری (The Erie Canal)",
  },
  es: {
    "All of the above": "Todas las anteriores (All of the above)",
    "Major Historic Treaty": "Tratado histórico y acuerdos de paz",
    "Scientific Invention": "Invención científica y avances tecnológicos",
    "Exploration Milestone": "Hito de exploración y expedición",
    "International Diplomatic Accords & Legal Frameworks": "Acuerdos diplomáticos y reformas legales",
    "Digital Telecommunications & Computing Architecture": "Telecomunicaciones digitales y computación",
    "Astronomical Observation & Planetary Mapping": "Observación astronómica y mapeo solar",
    "The Panama Canal": "El Canal de Panamá (The Panama Canal)",
    "The Suez Canal": "El Canal de Suez (The Suez Canal)",
    "The Kiel Canal": "El Canal de Kiel (The Kiel Canal)",
    "The Erie Canal": "El Canal de Erie (The Erie Canal)",
  },
  fr: {
    "All of the above": "Toutes ces réponses (All of the above)",
    "Major Historic Treaty": "Traité historique majeur et gouvernance",
    "Scientific Invention": "Invention scientifique et percée technologique",
    "Exploration Milestone": "Étape majeure d'exploration",
    "International Diplomatic Accords & Legal Frameworks": "Accords diplomatiques internationaux",
    "Digital Telecommunications & Computing Architecture": "Télécommunications numériques et informatique",
    "Astronomical Observation & Planetary Mapping": "Observation astronomique et cartographie",
    "The Panama Canal": "Le Canal de Panama",
    "The Suez Canal": "Le Canal de Suez",
    "The Kiel Canal": "Le Canal de Kiel",
    "The Erie Canal": "Le Canal Érié",
  },
  de: {
    "All of the above": "Alle oben genannten (All of the above)",
    "Major Historic Treaty": "Bedeutender historischer Vertrag",
    "Scientific Invention": "Wissenschaftliche Erfindung und Technologie",
    "Exploration Milestone": "Meilenstein der Erkundung",
    "International Diplomatic Accords & Legal Frameworks": "Diplomatische Abkommen und Reformen",
    "Digital Telecommunications & Computing Architecture": "Digitale Telekommunikation und Rechnernetze",
    "Astronomical Observation & Planetary Mapping": "Astronomische Beobachtung und Kartierung",
    "The Panama Canal": "Der Panamakanal",
    "The Suez Canal": "Der Sueskanal",
    "The Kiel Canal": "Der Nord-Ostsee-Kanal (Kiel Canal)",
    "The Erie Canal": "Der Eriekanal",
  },
  ar: {
    "All of the above": "جميع ما سبق (All of the above)",
    "Major Historic Treaty": "معاهدة تاريخية بارزة ونظام حكم",
    "Scientific Invention": "اختراع علمي وتقدم تقني",
    "Exploration Milestone": "إنجاز استكشافي وجغرافي",
    "International Diplomatic Accords & Legal Frameworks": "اتفاقيات دبلوماسية دولية وأطر قانونية",
    "Digital Telecommunications & Computing Architecture": "الاتصالات الرقمية وبنية الحوسبة",
    "Astronomical Observation & Planetary Mapping": "الرصد الفلكي ورسم الخرائط",
    "The Panama Canal": "قناة بنما (The Panama Canal)",
    "The Suez Canal": "قناة السويس (The Suez Canal)",
    "The Kiel Canal": "قناة كيل (The Kiel Canal)",
    "The Erie Canal": "قناة إيري (The Erie Canal)",
  },
};

/**
 * Quick jump dates in localized forms
 */
export const QUICK_JUMPS_I18N: Record<string, { label: string; month: number; day: number }[]> = {
  hi: [
    { label: "🇮🇳 15 अगस्त (भारतीय स्वतंत्रता दिवस)", month: 8, day: 15 },
    { label: "💿 17 अगस्त (रेडक्लिफ रेखा व पहली सीडी)", month: 8, day: 17 },
    { label: "📷 19 अगस्त (विश्व फोटोग्राफी दिवस)", month: 8, day: 19 },
    { label: "🎉 1 जनवरी (नव वर्ष व बोस जयंती)", month: 1, day: 1 },
    { label: "🕊️ 2 अक्टूबर (गांधी जयंती)", month: 10, day: 2 },
  ],
  bn: [
    { label: "🇮🇳 ১৫ আগস্ট (ভারতের স্বাধীনতা দিবস)", month: 8, day: 15 },
    { label: "💿 ১৭ আগস্ট (র‌্যাডক্লিফ লাইন ও প্রথম সিডি)", month: 8, day: 17 },
    { label: "📷 ১৯ আগস্ট (বিশ্ব আলোকচিত্র দিবস)", month: 8, day: 19 },
    { label: "🎉 ১ জানুয়ারি (নতুন বছর ও সত্যেন্দ্রনাথ বসু)", month: 1, day: 1 },
    { label: "🕊️ ২ অক্টোবর (গান্ধী জয়ন্তী)", month: 10, day: 2 },
  ],
  mr: [
    { label: "🇮🇳 १५ ऑगस्ट (भारतीय स्वातंत्र्य दिन)", month: 8, day: 15 },
    { label: "💿 १७ ऑगस्ट (रॅडक्लिफ रेषा व पहिली सीडी)", month: 8, day: 17 },
    { label: "📷 १९ ऑगस्ट (जागतिक छायाचित्रण दिन)", month: 8, day: 19 },
    { label: "🎉 १ जानेवारी (नवीन वर्ष)", month: 1, day: 1 },
    { label: "🕊️ २ ऑक्टोबर (गांधी जयंती)", month: 10, day: 2 },
  ],
  te: [
    { label: "🇮🇳 ఆగస్టు 15 (భారత స్వాతంత్ర్య దినోత్సవం)", month: 8, day: 15 },
    { label: "💿 ఆగస్టు 17 (రాడ్‌క్లిఫ్ లైన్ & మొదటి సీడీ)", month: 8, day: 17 },
    { label: "📷 ఆగస్టు 19 (ప్రపంచ ఫోటోగ్రఫీ దినోత్సవం)", month: 8, day: 19 },
    { label: "🎉 జనవరి 1 (నూతన సంవత్సరం)", month: 1, day: 1 },
    { label: "🕊️ అక్టోబర్ 2 (గాంధీ జయంతి)", month: 10, day: 2 },
  ],
  ta: [
    { label: "🇮🇳 ஆகஸ்ட் 15 (இந்திய சுதந்திர தினம்)", month: 8, day: 15 },
    { label: "💿 ஆகஸ்ட் 17 (ராட்கிளிஃப் கோடு & முதல் சிடி)", month: 8, day: 17 },
    { label: "📷 ஆகஸ்ட் 19 (உலக புகைப்பட தினம்)", month: 8, day: 19 },
    { label: "🎉 ஜனவரி 1 (புத்தாண்டு)", month: 1, day: 1 },
    { label: "🕊️ அக்டோபர் 2 (காந்தி ஜெயந்தி)", month: 10, day: 2 },
  ],
  gu: [
    { label: "🇮🇳 15 ઑગસ્ટ (ભારતીય સ્વતંત્રતા દિવસ)", month: 8, day: 15 },
    { label: "💿 17 ઑગસ્ટ (રેડક્લિફ લાઇન & પ્રથમ સીડી)", month: 8, day: 17 },
    { label: "📷 19 ઑગસ્ટ (વિશ્વ ફોટોગ્રાફી દિવસ)", month: 8, day: 19 },
    { label: "🎉 1 જાન્યુઆરી (નૂતન વર્ષ)", month: 1, day: 1 },
    { label: "🕊️ 2 ઑક્ટોબર (ગાંધી જયંતી)", month: 10, day: 2 },
  ],
  pa: [
    { label: "🇮🇳 15 ਅਗਸਤ (ਭਾਰਤੀ ਆਜ਼ਾਦੀ ਦਿਵਸ)", month: 8, day: 15 },
    { label: "💿 17 ਅਗਸਤ (ਰੈਡਕਲਿਫ਼ ਲਾਈਨ ਤੇ ਪਹਿਲੀ ਸੀਡੀ)", month: 8, day: 17 },
    { label: "📷 19 ਅਗਸਤ (ਵਿਸ਼ਵ ਫੋਟੋਗ੍ਰਾਫੀ ਦਿਵਸ)", month: 8, day: 19 },
    { label: "🎉 1 ਜਨਵਰੀ (ਨਵਾਂ ਸਾਲ)", month: 1, day: 1 },
    { label: "🕊️ 2 ਅਕਤੂਬਰ (ਗਾਂਧੀ ਜਯੰਤੀ)", month: 10, day: 2 },
  ],
  ur: [
    { label: "🇮🇳 15 اگست (یوم آزادی ہند)", month: 8, day: 15 },
    { label: "💿 17 اگست (ریڈکلف لائن اور پہلی سی ڈی)", month: 8, day: 17 },
    { label: "📷 19 اگست (ورلڈ فوٹوگرافی ڈے)", month: 8, day: 19 },
    { label: "🎉 1 جنوری (نیا سال)", month: 1, day: 1 },
    { label: "🕊️ 2 اکتوبر (گاندھی جینتی)", month: 10, day: 2 },
  ],
  es: [
    { label: "🇮🇳 15 Ago (Independencia de la India)", month: 8, day: 15 },
    { label: "💿 17 Ago (Línea Radcliffe y Primer CD)", month: 8, day: 17 },
    { label: "📷 19 Ago (Día Mundial de la Fotografía)", month: 8, day: 19 },
    { label: "🎉 1 Ene (Año Nuevo y Satyendra Bose)", month: 1, day: 1 },
    { label: "🕊️ 2 Oct (Gandhi Jayanti / No Violencia)", month: 10, day: 2 },
  ],
  fr: [
    { label: "🇮🇳 15 Août (Indépendance de l'Inde)", month: 8, day: 15 },
    { label: "💿 17 Août (Ligne Radcliffe & Premier CD)", month: 8, day: 17 },
    { label: "📷 19 Août (Journée Mondiale de la Photographie)", month: 8, day: 19 },
    { label: "🎉 1 Janv (Nouvel An & Bose)", month: 1, day: 1 },
    { label: "🕊️ 2 Oct (Gandhi Jayanti)", month: 10, day: 2 },
  ],
  de: [
    { label: "🇮🇳 15. Aug (Unabhängigkeit Indiens)", month: 8, day: 15 },
    { label: "💿 17. Aug (Radcliffe-Linie & Erste Audio-CD)", month: 8, day: 17 },
    { label: "📷 19. Aug (Welttag der Fotografie)", month: 8, day: 19 },
    { label: "🎉 1. Jan (Neujahr & Bose)", month: 1, day: 1 },
    { label: "🕊️ 2. Okt (Gandhi Jayanti)", month: 10, day: 2 },
  ],
  ar: [
    { label: "🇮🇳 ١٥ أغسطس (استقلال الهند)", month: 8, day: 15 },
    { label: "💿 ١٧ أغسطس (خط رادكليف وأول قرص مدمج)", month: 8, day: 17 },
    { label: "📷 ١٩ أغسطس (اليوم العالمي للتصوير)", month: 8, day: 19 },
    { label: "🎉 ١ يناير (رأس السنة الميلادية)", month: 1, day: 1 },
    { label: "🕊️ ٢ أكتوبر (ذكرى غاندي)", month: 10, day: 2 },
  ],
  en: [
    { label: "🇮🇳 Aug 15 (India Independence)", month: 8, day: 15 },
    { label: "💿 Aug 17 (Radcliffe Line & First CD)", month: 8, day: 17 },
    { label: "📷 Aug 19 (World Photography Day)", month: 8, day: 19 },
    { label: "🎉 Jan 1 (New Year & Bose)", month: 1, day: 1 },
    { label: "🕊️ Oct 2 (Gandhi Jayanti)", month: 10, day: 2 },
  ]
};

/**
 * Returns localized tag badge
 */
export function getLocalizedTag(tag?: string, category?: string, langCode: string = "en"): string {
  if (!tag && !category) return "Historical Milestone";
  const cleanLang = (langCode || "en").toLowerCase().split("-")[0];
  const langMap = TAG_TRANSLATIONS[cleanLang];

  if (tag && langMap && langMap[tag]) {
    return langMap[tag];
  }

  // Fallback to category tag if tag is not translated
  if (category) {
    const catMap = CATEGORY_NAMES_I18N[cleanLang];
    if (catMap && catMap[category]) {
      return catMap[category];
    }
  }

  return tag || "Global Milestone";
}

/**
 * Returns localized category filter button name
 */
export function getLocalizedCategoryFilterName(categoryKey: string, langCode: string = "en", countryName?: string): string {
  const cleanLang = (langCode || "en").toLowerCase().split("-")[0];
  const catMap = CATEGORY_NAMES_I18N[cleanLang] || CATEGORY_NAMES_I18N["en"];

  if (categoryKey === "country-spotlight" && countryName) {
    return countryName;
  }

  return catMap[categoryKey] || CATEGORY_NAMES_I18N["en"][categoryKey] || categoryKey;
}

/**
 * Returns localized quick jumps list
 */
export function getLocalizedQuickJumps(langCode: string = "en") {
  const cleanLang = (langCode || "en").toLowerCase().split("-")[0];
  return QUICK_JUMPS_I18N[cleanLang] || QUICK_JUMPS_I18N["en"];
}

/**
 * Synchronous in-memory history data localizer:
 * Takes any DayInHistoryData (from server or cache or fallback) and cascades 100% localized state
 * across Headline, Formatted Date, Category Badges, Trivia, and Quotes instantly (0ms latency)!
 */
export function localizeHistoryData(
  data: DayInHistoryData,
  targetLang: string = "en",
  targetCountry?: string
): DayInHistoryData {
  if (!data) return data;
  const cleanLang = (targetLang || "en").toLowerCase().split("-")[0];

  // 1. Localize Formatted Date
  let localizedDateStr = data.formattedDate;
  try {
    const dateObj = new Date(2026, data.month - 1, data.day);
    localizedDateStr = formatLocalizedHistoryDate(dateObj, cleanLang);
  } catch {
    localizedDateStr = data.formattedDate || `${data.month}/${data.day}`;
  }

  // 2. Localize Featured Headline
  let localizedHeadline = data.featuredHeadline;
  if (cleanLang === "hi") {
    if (localizedHeadline.includes("Radcliffe Line")) {
      localizedHeadline = "1947: रैडक्लिफ रेखा का औपचारिक प्रकाशन और विश्व की पहली ऑडियो कॉम्पैक्ट डिस्क (CD) का निर्माण";
    } else if (localizedHeadline.includes("Indian Independence")) {
      localizedHeadline = "1947: भारत का ऐतिहासिक स्वतंत्रता दिवस और नई संप्रभुता का उदय";
    } else if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `${localizedDateStr} के ऐतिहासिक पड़ाव, वैज्ञानिक आविष्कार और प्रमुख वैश्विक घटनाएं`;
    }
  } else if (cleanLang === "bn") {
    if (localizedHeadline.includes("Radcliffe Line")) {
      localizedHeadline = "১৯৪৭: র‍্যাডক্লিফ লাইনের আনুষ্ঠানিক প্রকাশ ও বিশ্বের প্রথম অডিও সিডি (CD)";
    } else if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `${localizedDateStr}-এর ঐতিহাসিক মাইলফলক ও বৈজ্ঞানিক আবিষ্কার`;
    }
  } else if (cleanLang === "mr") {
    if (localizedHeadline.includes("Radcliffe Line")) {
      localizedHeadline = "१९४७: रॅडक्लिफ रेषेची घोषणा आणि जगातील पहिली ऑडिओ कॉम्पॅक्ट डिस्क (CD)";
    } else if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `${localizedDateStr} च्या ऐतिहासिक घडामोडी आणि वैज्ञानिक शोध`;
    }
  } else if (cleanLang === "te") {
    if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `${localizedDateStr} చారిత్రక మైలురాళ్ళు మరియు శాస్త్రీయ ఆవిష్కరణలు`;
    }
  } else if (cleanLang === "ta") {
    if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `${localizedDateStr} வரலாற்று மைல்கற்கள் மற்றும் அறிவியல் கண்டுபிடிப்புகள்`;
    }
  } else if (cleanLang === "gu") {
    if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `${localizedDateStr} ના ઐતિહાસિક સીમાચિહ્નો અને વૈજ્ઞાનિક શોધો`;
    }
  } else if (cleanLang === "pa") {
    if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `${localizedDateStr} ਦੇ ਇਤਿਹਾਸਕ ਮੀਲ ਪੱਥਰ ਅਤੇ ਵਿਗਿਆਨਕ ਖੋਜਾਂ`;
    }
  } else if (cleanLang === "ur") {
    if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `${localizedDateStr} کے اہم تاریخی سنگ میل اور سائنسی ایجادات`;
    }
  } else if (cleanLang === "es") {
    if (localizedHeadline.includes("Radcliffe Line")) {
      localizedHeadline = "1947: Demarcación de la Línea Radcliffe y producción del primer Disco Compacto (CD)";
    } else if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `Hitos históricos, descubrimientos científicos y nacimientos célebres del ${localizedDateStr}`;
    }
  } else if (cleanLang === "fr") {
    if (localizedHeadline.includes("Radcliffe Line")) {
      localizedHeadline = "1947 : Démarcation de la ligne Radcliffe et premier disque compact audio (CD)";
    } else if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `Événements historiques marquants et découvertes scientifiques du ${localizedDateStr}`;
    }
  } else if (cleanLang === "ar") {
    if (localizedHeadline.includes("Historic Milestones") || localizedHeadline.includes("Historical Milestones")) {
      localizedHeadline = `أبرز المحطات التاريخية والاكتشافات العلمية في ${localizedDateStr}`;
    }
  }

  // 3. Localize Event Cards (Headlines, Descriptions, Significance, Tags, and Sources)
  const localizeEventList = (items?: HistoryEventItem[]): HistoryEventItem[] => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const localizedTag = getLocalizedTag(item.tag, item.category, cleanLang);
      const isVerified = item.verificationStatus === "VERIFIED" || !item.verificationStatus;
      const localizedStatus = isVerified ? getHistoryText("verified", cleanLang) : item.verificationStatus;
      const localizedHeadline = translateHistoricalText(item.headline, cleanLang);
      const localizedDescription = translateHistoricalText(item.description, cleanLang);
      const localizedSignificance = item.significance ? translateHistoricalText(item.significance, cleanLang) : undefined;
      const localizedSource = translateSourceName(item.sourceName, cleanLang);

      return {
        ...item,
        headline: localizedHeadline || item.headline,
        description: localizedDescription || item.description,
        significance: localizedSignificance || item.significance,
        sourceName: localizedSource || item.sourceName,
        tag: localizedTag,
        verificationStatus: localizedStatus as any,
      };
    });
  };

  const localizedEvents = localizeEventList(data.events);
  const localizedBirths = localizeEventList(data.births);
  const localizedDiscoveries = localizeEventList(data.discoveries);
  const localizedCountrySpotlight = localizeEventList(data.countrySpotlight);

  // 4. Localize Daily Trivia Quiz
  let localizedTrivia = data.dailyTrivia;
  if (localizedTrivia) {
    const optsMap = TRIVIA_OPTIONS_I18N[cleanLang] || {};
    const translatedOptions = localizedTrivia.options.map((opt) => {
      const mapped = optsMap[opt];
      if (mapped) return mapped;
      return translateHistoricalText(opt, cleanLang) || opt;
    });

    let localizedQuestion = translateHistoricalText(localizedTrivia.question, cleanLang);
    let localizedExplanation = translateHistoricalText(localizedTrivia.explanation, cleanLang);
    const localizedTriviaSource = translateSourceName(localizedTrivia.sourceName, cleanLang);

    if (cleanLang === "hi") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `विश्व इतिहास में ${localizedDateStr} को किस महत्वपूर्ण ऐतिहासिक क्षेत्र में युगांतरकारी सफलता प्राप्त हुई थी?`;
        localizedExplanation = `${localizedDateStr} मानव इतिहास में कूटनीति, विज्ञान और तकनीकी नवाचार के अभूतपूर्व समन्वय के लिए विख्यात है।`;
      }
    } else if (cleanLang === "bn") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `বিশ্ব ইতিহাসে ${localizedDateStr} তারিখে কোন ক্ষেত্রে যুগান্তকারী সাফল্য অর্জিত হয়েছিল?`;
        localizedExplanation = `${localizedDateStr} কূটনীতি, প্রযুক্তি ও বিজ্ঞানের অভূতপূর্ব সমন্বয়ের জন্য বিশ্বখ্যাত।`;
      }
    } else if (cleanLang === "mr") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `जागतिक इतिहासात ${localizedDateStr} रोजी कोणत्या क्षेत्रात महत्त्वपूर्ण यश मिळाले होते?`;
        localizedExplanation = `${localizedDateStr} हा दिवस मुत्सद्देगिरी, विज्ञान आणि तंत्रज्ञानातील क्रांतीसाठी ओळखला जातो.`;
      }
    } else if (cleanLang === "te") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `ప్రపంచ చరిత్రలో ${localizedDateStr} నాడు ఏ రంగంలో చారిత్రక మైలురాయి నమోదైంది?`;
        localizedExplanation = `${localizedDateStr} విజ్ఞాన శాస్త్రం, దౌత్యం మరియు సాంకేతిక పరిజ్ఞానాలలో ముఖ్యమైన మార్పులను సూచిస్తుంది.`;
      }
    } else if (cleanLang === "ta") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `உலக வரலாற்றில் ${localizedDateStr} அன்று எந்தத் துறையில் வரலாற்று சாதனை நிகழ்ந்தது?`;
        localizedExplanation = `${localizedDateStr} அறிவியல், தொழில்நுட்பம் மற்றும் வரலாற்று ஒப்பந்தங்களுக்கான முக்கிய நாளாகும்.`;
      }
    } else if (cleanLang === "gu") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `વિશ્વ ઇતિહાસમાં ${localizedDateStr} ના રોજ કયા ક્ષેત્રમાં યુગાંતરકારી સિદ્ધિ પ્રાપ્ત થઈ હતી?`;
        localizedExplanation = `${localizedDateStr} વિજ્ઞાન, મુત્સદ્દીગીરી અને ટેકનોલોજીના સમન્વય માટે જાણીતો છે.`;
      }
    } else if (cleanLang === "pa") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `ਵਿਸ਼ਵ ਇਤਿਹਾਸ ਵਿੱਚ ${localizedDateStr} ਨੂੰ ਕਿਸ ਖੇਤਰ ਵਿੱਚ ਇਤਿਹਾਸਕ ਪ੍ਰਾਪਤੀ ਹੋਈ ਸੀ?`;
        localizedExplanation = `${localizedDateStr} ਕੂਟਨੀਤੀ, ਵਿਗਿਆਨ ਅਤੇ ਤਕਨਾਲੋਜੀ ਦੀਆਂ ਪ੍ਰਾਪਤੀਆਂ ਲਈ ਜਾਣਿਆ ਜਾਂਦਾ ਹੈ।`;
      }
    } else if (cleanLang === "ur") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `عالمی تاریخ میں ${localizedDateStr} کو کس اہم شعبے میں تاریخی سنگ میل عبور کیا گیا؟`;
        localizedExplanation = `${localizedDateStr} سائنس، سفارتکاری اور ٹیکنالوجی کی اہم کامیابیوں کے لیے یاد رکھا جاتا ہے۔`;
      }
    } else if (cleanLang === "es") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `¿En qué ámbito trascendental se produjo un hito histórico fundamental el ${localizedDateStr}?`;
        localizedExplanation = `El ${localizedDateStr} se conmemora en la historia mundial por trascendentales avances interconectados en diplomacia, ciencia y tecnología.`;
      }
    } else if (cleanLang === "fr") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `Quel domaine a connu une avancée historique majeure le ${localizedDateStr} ?`;
        localizedExplanation = `Le ${localizedDateStr} est marqué dans les annales mondiales par des avancées scientifiques, technologiques et diplomatiques majeures.`;
      }
    } else if (cleanLang === "ar") {
      if (localizedQuestion.includes("Which significant historical event") || localizedQuestion.includes("Which domain experienced")) {
        localizedQuestion = `ما هو المجال الذي شهد إنجازاً تاريخياً بارزاً في ${localizedDateStr}؟`;
        localizedExplanation = `يُسجل تاريخ ${localizedDateStr} محطات فارقة تجمع بين الدبلوماسية، العلوم، والابتكارات التقنية.`;
      }
    }

    localizedTrivia = {
      ...localizedTrivia,
      question: localizedQuestion,
      options: translatedOptions,
      explanation: localizedExplanation,
      sourceName: localizedTriviaSource || localizedTrivia.sourceName,
      verificationStatus: getHistoryText("verified", cleanLang),
    };
  }

  // 5. Localize Quote of the Day
  let localizedQuote = data.quoteOfTheDay;
  if (localizedQuote) {
    let quoteText = localizedQuote.quote;
    let contextText = localizedQuote.context;
    let authorText = localizedQuote.author;
    const localizedQuoteSource = translateSourceName(localizedQuote.sourceName, cleanLang);

    if (cleanLang === "hi") {
      if (quoteText.includes("At the stroke of the midnight hour")) {
        quoteText = "आधी रात के इस वक्त, जब पूरी दुनिया सो रही है, भारत जीवन और स्वतंत्रता के लिए जागेगा।";
        contextText = "स्वतंत्र भारत के प्रथम प्रधानमंत्री";
        authorText = "पंडित जवाहरलाल नेहरू";
      } else if (quoteText.includes("History is a gallery of pictures")) {
        quoteText = "इतिहास चित्रों की एक ऐसी दीर्घा है जिसमें मूल प्रतियां कम और अनुकृतियां कहीं अधिक हैं।";
        contextText = "इतिहासकार और राजनीतिक दार्शनिक";
      } else if (quoteText.includes("The only limit to our realization of tomorrow")) {
        quoteText = "कल के हमारे सपनों की प्राप्ति में एकमात्र सीमा आज के हमारे संदेह होंगे।";
        contextText = "संयुक्त राज्य अमेरिका के 32वें राष्ट्रपति";
      } else {
        quoteText = translateHistoricalText(quoteText, cleanLang);
        contextText = translateHistoricalText(contextText, cleanLang);
      }
    } else if (cleanLang === "bn") {
      if (quoteText.includes("History is a gallery of pictures")) {
        quoteText = "ইতিহাস হলো এমন এক চিত্রশালা যেখানে মূল চিত্র খুবই কম এবং প্রতিলিপি অনেক বেশি।";
        contextText = "ঐতিহাসিক ও রাষ্ট্রচিন্তাবিদ";
      } else {
        quoteText = translateHistoricalText(quoteText, cleanLang);
        contextText = translateHistoricalText(contextText, cleanLang);
      }
    } else if (cleanLang === "mr") {
      if (quoteText.includes("History is a gallery of pictures")) {
        quoteText = "इतिहास हे अशा चित्रांचे दालन आहे जिथे मूळ चित्रे कमी आणि प्रती जास्त आहेत.";
        contextText = "इतिहासकार आणि विचारवंत";
      } else {
        quoteText = translateHistoricalText(quoteText, cleanLang);
        contextText = translateHistoricalText(contextText, cleanLang);
      }
    } else if (cleanLang === "es") {
      if (quoteText.includes("History is a gallery of pictures")) {
        quoteText = "La historia es una galería de cuadros en la que hay pocos originales y muchas copias.";
        contextText = "Historiador y filósofo político";
      } else if (quoteText.includes("The only limit to our realization of tomorrow")) {
        quoteText = "El único límite para nuestra realización de mañana serán nuestras dudas de hoy.";
        contextText = "32.º presidente de los Estados Unidos";
      } else {
        quoteText = translateHistoricalText(quoteText, cleanLang);
        contextText = translateHistoricalText(contextText, cleanLang);
      }
    } else if (cleanLang === "fr") {
      if (quoteText.includes("History is a gallery of pictures")) {
        quoteText = "L'histoire est une galerie de tableaux où il y a peu d'originaux et beaucoup de copies.";
        contextText = "Historien et philosophe politique";
      } else {
        quoteText = translateHistoricalText(quoteText, cleanLang);
        contextText = translateHistoricalText(contextText, cleanLang);
      }
    } else if (cleanLang === "ar") {
      if (quoteText.includes("History is a gallery of pictures")) {
        quoteText = "التاريخ هو معرض صور يحتوي على القليل من اللوحات الأصلية والعديد من النسخ المكررة.";
        contextText = "مؤرخ وفيلسوف سياسي";
      } else {
        quoteText = translateHistoricalText(quoteText, cleanLang);
        contextText = translateHistoricalText(contextText, cleanLang);
      }
    } else {
      quoteText = translateHistoricalText(quoteText, cleanLang);
      contextText = translateHistoricalText(contextText, cleanLang);
    }

    localizedQuote = {
      ...localizedQuote,
      quote: quoteText,
      author: authorText,
      context: contextText,
      sourceName: localizedQuoteSource || localizedQuote.sourceName,
      verificationStatus: getHistoryText("verified", cleanLang),
    };
  }

  return {
    ...data,
    formattedDate: localizedDateStr,
    featuredHeadline: localizedHeadline,
    languageCode: cleanLang,
    events: localizedEvents,
    births: localizedBirths,
    discoveries: localizedDiscoveries,
    countrySpotlight: localizedCountrySpotlight,
    dailyTrivia: localizedTrivia,
    quoteOfTheDay: localizedQuote,
  };
}
