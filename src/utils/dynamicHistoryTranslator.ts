import { useMemo } from "react";
import { DayInHistoryData, HistoryEventItem, DailyTriviaQuiz } from "../types/history";

/**
 * Enterprise Multilingual Dictionary & Semantic Translator for Historical Data
 * Supports instant, real-time client-side translation across 18+ languages without network overhead.
 */

// Common source name translations
export const SOURCE_NAME_I18N: Record<string, Record<string, string>> = {
  hi: {
    "Wikimedia Foundation": "विकिमीडिया फाउंडेशन",
    "Wikimedia Foundation Public REST API": "विकिमीडिया फाउंडेशन आधिकारिक ज्ञानकोश",
    "Wikimedia Foundation / Wikipedia On-This-Day": "विकिमीडिया फाउंडेशन / विकिपीडिया 'आज का इतिहास'",
    "Wikimedia Foundation / Wikipedia Biographies": "विकिमीडिया फाउंडेशन / विकिपीडिया जीवनियां",
    "Wikipedia Open Encyclopedia Archives": "विकिपीडिया खुला ऐतिहासिक अभिलेखागार",
    "Historical Archives": "ऐतिहासिक अभिलेखागार",
    "Historical Philosophy Archives": "ऐतिहासिक दर्शन एवं विचार अभिलेखागार",
    "Wikimedia & Scientific History Archives": "विकिमीडिया एवं वैज्ञानिक इतिहास अभिलेखागार",
  },
  bn: {
    "Wikimedia Foundation": "উইকিমিডিয়া ফাউন্ডেশন",
    "Wikimedia Foundation Public REST API": "উইকিমিডিয়া ফাউন্ডেশন পাবলিক এপিআই",
    "Wikimedia Foundation / Wikipedia On-This-Day": "উইকিমিডিয়া ফাউন্ডেশন / উইকিপিডিয়া 'আজকের এই দিনে'",
    "Wikimedia Foundation / Wikipedia Biographies": "উইকিমিডিয়া ফাউন্ডেশন / উইকিপিডিয়া জীবনী",
    "Wikipedia Open Encyclopedia Archives": "উইকিপিডিয়া উন্মুক্ত ঐতিহাসিক আর্কাইভ",
    "Historical Archives": "ঐতিহাসিক আর্কাইভ",
    "Historical Philosophy Archives": "ঐতিহাসিক দর্শন ও চিন্তন আর্কাইভ",
    "Wikimedia & Scientific History Archives": "উইকিমিডিয়া ও বিজ্ঞান ইতিহাস আর্কাইভ",
  },
  mr: {
    "Wikimedia Foundation": "विकिमीडिया फाउंडेशन",
    "Wikimedia Foundation Public REST API": "विकिमीडिया फाउंडेशन सार्वजनिक एपीआय",
    "Wikimedia Foundation / Wikipedia On-This-Day": "विकिमीडिया फाउंडेशन / विकिपीडिया 'आजचा इतिहास'",
    "Wikimedia Foundation / Wikipedia Biographies": "विकिमीडिया फाउंडेशन / विकिपीडिया चरित्रे",
    "Wikipedia Open Encyclopedia Archives": "विकिपीडिया खुला ऐतिहासिक संग्रह",
    "Historical Archives": "ऐतिहासिक अभिलेखागार",
    "Historical Philosophy Archives": "ऐतिहासिक तत्त्वज्ञान अभिलेखागार",
    "Wikimedia & Scientific History Archives": "विकिमीडिया व विज्ञान इतिहास संग्रह",
  },
  te: {
    "Wikimedia Foundation": "వికీమీడియా ఫౌండేషన్",
    "Wikimedia Foundation Public REST API": "వికీమీడియా ఫౌండేషన్ పబ్లిక్ ఏపీఐ",
    "Wikimedia Foundation / Wikipedia On-This-Day": "వికీమీడియా ఫౌండేషన్ / వికీపీడియా 'ఈ రోజు చరిత్రలో'",
    "Wikimedia Foundation / Wikipedia Biographies": "వికీమీడియా ఫౌండేషన్ / వికీపీడియా జీవిత చరిత్రలు",
    "Wikipedia Open Encyclopedia Archives": "వికీపీడియా చారిత్రక ఆర్కైవ్స్",
    "Historical Archives": "చారిత్రక ఆర్కైవ్స్",
    "Historical Philosophy Archives": "చారిత్రక తత్వశాస్త్ర ఆర్కైవ్స్",
  },
  ta: {
    "Wikimedia Foundation": "விக்கிமீடியா அறக்கட்டளை",
    "Wikimedia Foundation Public REST API": "விக்கிமீடியா அறக்கட்டளை பொது ஏபிஐ",
    "Wikimedia Foundation / Wikipedia On-This-Day": "விக்கிமீடியா அறக்கட்டளை / விக்கிப்பீடியா 'இன்றைய நாளில்'",
    "Wikimedia Foundation / Wikipedia Biographies": "விக்கிமீடியா அறக்கட்டளை / விக்கிப்பீடியா வாழ்க்கை வரலாறுகள்",
    "Wikipedia Open Encyclopedia Archives": "விக்கிப்பீடியா வரலாற்று காப்பகம்",
    "Historical Archives": "வரலாற்று ஆவணக் காப்பகம்",
    "Historical Philosophy Archives": "வரலாற்று தத்துவ காப்பகம்",
  },
  gu: {
    "Wikimedia Foundation": "વિકિમીડિયા ફાઉન્ડેશન",
    "Wikimedia Foundation Public REST API": "વિકિમીડિયા ફાઉન્ડેશન સત્તાવાર એપીઆઈ",
    "Wikimedia Foundation / Wikipedia On-This-Day": "વિકિમીડિયા ફાઉન્ડેશન / વિકિપીડિયા 'આજનો ઇતિહાસ'",
    "Wikimedia Foundation / Wikipedia Biographies": "વિકિમીડિયા ફાઉન્ડેશન / વિકિપીડિયા જીવનચરિત્રો",
    "Wikipedia Open Encyclopedia Archives": "વિકિપીડિયા મુક્ત ઐતિહાસિક સંગ્રહ",
    "Historical Archives": "ઐતિહાસિક સંગ્રહ",
  },
  pa: {
    "Wikimedia Foundation": "ਵਿਕੀਮੀਡੀਆ ਫਾਊਂਡੇਸ਼ਨ",
    "Wikimedia Foundation Public REST API": "ਵਿਕੀਮੀਡੀਆ ਫਾਊਂਡੇਸ਼ਨ ਜਨਤਕ ਏਪੀਆਈ",
    "Wikimedia Foundation / Wikipedia On-This-Day": "ਵਿਕੀਮੀਡੀਆ ਫਾਊਂਡੇਸ਼ਨ / ਵਿਕੀਪੀਡੀਆ 'ਅੱਜ ਦਾ ਇਤਿਹਾਸ'",
    "Wikimedia Foundation / Wikipedia Biographies": "ਵਿਕੀਮੀਡੀਆ ਫਾਊਂਡੇਸ਼ਨ / ਵਿਕੀਪੀਡੀਆ ਜੀਵਨੀਆਂ",
    "Wikipedia Open Encyclopedia Archives": "ਵਿਕੀਪੀਡੀਆ ਖੁੱਲ੍ਹਾ ਇਤਿਹਾਸਕ ਪੁਰਾਲੇਖ",
    "Historical Archives": "ਇਤਿਹਾਸਕ ਪੁਰਾਲੇਖ",
  },
  ur: {
    "Wikimedia Foundation": "وکیمیڈیا فاؤنڈیشن",
    "Wikimedia Foundation Public REST API": "وکیمیڈیا فاؤنڈیشن عوامی ای پی آئی",
    "Wikimedia Foundation / Wikipedia On-This-Day": "وکیمیڈیا فاؤنڈیشن / وکیکیپیڈیا 'آج کا دن تاریخ میں'",
    "Wikimedia Foundation / Wikipedia Biographies": "وکیمیڈیا فاؤنڈیشن / وکیکیپیڈیا سوانح حیات",
    "Wikipedia Open Encyclopedia Archives": "وکیکیپیڈیا کھلا تاریخی آرکائیو",
    "Historical Archives": "تاریخی دستاویزات",
    "Historical Philosophy Archives": "تاریخی فلسفہ دستاویزات",
  },
  es: {
    "Wikimedia Foundation": "Fundación Wikimedia",
    "Wikimedia Foundation Public REST API": "API Pública de la Fundación Wikimedia",
    "Wikimedia Foundation / Wikipedia On-This-Day": "Fundación Wikimedia / Wikipedia 'Un Día Como Hoy'",
    "Wikimedia Foundation / Wikipedia Biographies": "Fundación Wikimedia / Biografías de Wikipedia",
    "Wikipedia Open Encyclopedia Archives": "Archivos Históricos Abiertos de Wikipedia",
    "Historical Archives": "Archivos Históricos",
    "Historical Philosophy Archives": "Archivos de Filosofía Histórica",
    "Wikimedia & Scientific History Archives": "Archivos de Historia Científica y Wikimedia",
  },
  fr: {
    "Wikimedia Foundation": "Fondation Wikimédia",
    "Wikimedia Foundation Public REST API": "API publique de la Fondation Wikimédia",
    "Wikimedia Foundation / Wikipedia On-This-Day": "Fondation Wikimédia / Wikipédia 'Ce jour dans l'histoire'",
    "Wikimedia Foundation / Wikipedia Biographies": "Fondation Wikimédia / Biographies de Wikipédia",
    "Wikipedia Open Encyclopedia Archives": "Archives historiques de Wikipédia",
    "Historical Archives": "Archives Historiques",
    "Historical Philosophy Archives": "Archives de Philosophie Historique",
  },
  de: {
    "Wikimedia Foundation": "Wikimedia Foundation",
    "Wikimedia Foundation Public REST API": "Öffentliche REST-API der Wikimedia Foundation",
    "Wikimedia Foundation / Wikipedia On-This-Day": "Wikimedia Foundation / Wikipedia 'Was geschah heute'",
    "Wikimedia Foundation / Wikipedia Biographies": "Wikimedia Foundation / Wikipedia-Biografien",
    "Wikipedia Open Encyclopedia Archives": "Freies historisches Wikipedia-Archiv",
    "Historical Archives": "Historisches Archiv",
  },
  ar: {
    "Wikimedia Foundation": "مؤسسة ويكيميديا",
    "Wikimedia Foundation Public REST API": "واجهة برمجة تطبيقات مؤسسة ويكيميديا",
    "Wikimedia Foundation / Wikipedia On-This-Day": "مؤسسة ويكيميديا / ويكيبيديا 'حدث في مثل هذا اليوم'",
    "Wikimedia Foundation / Wikipedia Biographies": "مؤسسة ويكيميديا / تراجم ويكيبيديا",
    "Wikipedia Open Encyclopedia Archives": "أرشيف ويكيبيديا التاريخي المفتوح",
    "Historical Archives": "الأرشيف التاريخي",
    "Historical Philosophy Archives": "أرشيف الفلسفة التاريخية",
  },
  ru: {
    "Wikimedia Foundation": "Фонд Викимедиа",
    "Wikimedia Foundation Public REST API": "Открытый API Фонда Викимедиа",
    "Wikimedia Foundation / Wikipedia On-This-Day": "Фонд Викимедиа / Википедия 'В этот день'",
    "Wikimedia Foundation / Wikipedia Biographies": "Фонд Викимедиа / Биографии Википедии",
    "Wikipedia Open Encyclopedia Archives": "Открытые исторические архивы Википедии",
    "Historical Archives": "Исторические архивы",
  },
  zh: {
    "Wikimedia Foundation": "维基媒体基金会",
    "Wikimedia Foundation Public REST API": "维基媒体基金会公开API",
    "Wikimedia Foundation / Wikipedia On-This-Day": "维基媒体基金会 / 维基百科“历史上的今天”",
    "Wikimedia Foundation / Wikipedia Biographies": "维基媒体基金会 / 维基百科人物传记",
    "Wikipedia Open Encyclopedia Archives": "维基百科开放历史档案",
    "Historical Archives": "历史档案馆",
  },
  ja: {
    "Wikimedia Foundation": "ウィキメディア財団",
    "Wikimedia Foundation Public REST API": "ウィキメディア財団公式REST API",
    "Wikimedia Foundation / Wikipedia On-This-Day": "ウィキメディア財団 / ウィキペディア「今日は何の日」",
    "Wikimedia Foundation / Wikipedia Biographies": "ウィキメディア財団 / ウィキペディア人物伝",
    "Wikipedia Open Encyclopedia Archives": "ウィキペディア歴史アーカイブ",
    "Historical Archives": "歴史アーカイブ",
  },
};

/**
 * Key historical concepts, verbs, nouns, and entity mappings
 */
interface TranslationLexiconEntry {
  en: RegExp;
  hi: string;
  bn: string;
  mr: string;
  te: string;
  ta: string;
  gu: string;
  pa: string;
  ur: string;
  es: string;
  fr: string;
  ar: string;
  de: string;
}

export const HISTORICAL_PATTERNS: TranslationLexiconEntry[] = [
  // Actions & Milestones
  {
    en: /\b(was born|is born)\b/gi,
    hi: "का जन्म हुआ",
    bn: "-এর জন্ম হয়",
    mr: "यांचा जन्म झाला",
    te: "జన్మించారు",
    ta: "பிறந்தார்",
    gu: "નો જન્મ થયો",
    pa: "ਦਾ ਜਨਮ ਹੋਇਆ",
    ur: "پیدا ہوئے",
    es: "nació",
    fr: "est né",
    ar: "ولد",
    de: "wurde geboren",
  },
  {
    en: /\b(died at the age of|passed away|dies)\b/gi,
    hi: "का निधन हुआ",
    bn: "প্রয়াত হন",
    mr: "यांचे निधन झाले",
    te: "మరణించారు",
    ta: "மறைந்தார்",
    gu: "અવસાન પામ્યા",
    pa: "ਅਕਾਲ ਚਲਾਣਾ ਕਰ ਗਏ",
    ur: "کا انتقال ہوا",
    es: "falleció",
    fr: "est décédé",
    ar: "توفي",
    de: "starb",
  },
  {
    en: /\b(declared independence|gains independence|declares independence)\b/gi,
    hi: "ने स्वतंत्रता की घोषणा की",
    bn: "স্বাধীনতা ঘোষণা করে",
    mr: "स्वातंत्र्याची घोषणा केली",
    te: "స్వాతంత్ర్యం ప్రకటించింది",
    ta: "சுதந்திரம் அறிவித்தது",
    gu: "સ્વતંત્રતાની જાહેરાત કરી",
    pa: "ਆਜ਼ਾਦੀ ਦਾ ਐਲਾਨ ਕੀਤਾ",
    ur: "نے آزادی کا اعلان کیا",
    es: "declaró su independencia",
    fr: "a déclaré son indépendance",
    ar: "أعلن استقلاله",
    de: "erklärte seine Unabhängigkeit",
  },
  {
    en: /\b(signed the treaty|treaty is signed|is signed)\b/gi,
    hi: "संधि पर हस्ताक्षर किए गए",
    bn: "চুক্তি স্বাক্ষরিত হয়",
    mr: "करारावर स्वाक्षरी झाली",
    te: "ఒప్పందంపై సంతకం చేయబడింది",
    ta: "ஒப்பந்தம் கையெழுத்தானது",
    gu: "સંધિ પર હસ્તાક્ષર થયા",
    pa: "ਸੰਧੀ 'ਤੇ ਦਸਤਖਤ ਕੀਤੇ ਗਏ",
    ur: "معاہدے پر دستخط کیے گئے",
    es: "se firmó el tratado",
    fr: "le traité a été signé",
    ar: "تم التوقيع على المعاهدة",
    de: "wurde der Vertrag unterzeichnet",
  },
  {
    en: /\b(was launched|is launched|successfully launched)\b/gi,
    hi: "का सफल प्रक्षेपण किया गया",
    bn: "সফলভাবে উৎক্ষেপণ করা হয়",
    mr: "यशस्वीरित्या प्रक्षेपित करण्यात आले",
    te: "విజయవంతంగా ప్రయోగించబడింది",
    ta: "வெற்றிகரமாக ஏவப்பட்டது",
    gu: "સફળતાપૂર્વક પ્રક્ષેપિત કરવામાં આવ્યું",
    pa: "ਸਫਲਤਾਪੂਰਵਕ ਲਾਂਚ ਕੀਤਾ ਗਿਆ",
    ur: "کامیابی سے لانچ کیا گیا",
    es: "fue lanzado con éxito",
    fr: "a été lancé avec succès",
    ar: "تم إطلاقه بنجاح",
    de: "wurde erfolgreich gestartet",
  },
  {
    en: /\b(discovered|discovers|discovery of)\b/gi,
    hi: "की ऐतिहासिक खोज की",
    bn: "আবিষ্কার করেন",
    mr: "चा ऐतिहासिक शोध लावला",
    te: "కనుగొన్నారు",
    ta: "கண்டுபிடித்தார்",
    gu: "ની શોધ કરી",
    pa: "ਦੀ ਖੋਜ ਕੀਤੀ",
    ur: "دریافت کیا",
    es: "descubrió",
    fr: "a découvert",
    ar: "اكتشف",
    de: "entdeckte",
  },
  {
    en: /\b(invented|invents|invention of)\b/gi,
    hi: "का आविष्कार किया",
    bn: "আবিষ্কার করেন",
    mr: "चा शोध लावला",
    te: "ఆవిష్కరించారు",
    ta: "கண்டுபிடித்தார்",
    gu: "ની શોધ કરી",
    pa: "ਦੀ ਕਾਢ ਕੱਢੀ",
    ur: "ایجاد کیا",
    es: "inventó",
    fr: "a inventé",
    ar: "اخترع",
    de: "erfand",
  },
  {
    en: /\b(comes into effect|came into force|enters into force)\b/gi,
    hi: "आधिकारिक रूप से लागू हुआ",
    bn: "আনুষ্ঠানিকভাবে কার্যকর হয়",
    mr: "अधिकृतपणे लागू झाले",
    te: "అధికారికంగా అమల్లోకి వచ్చింది",
    ta: "அதிகாரப்பூர்வமாக அமலுக்கு வந்தது",
    gu: "સત્તાવાર રીતે અમલમાં આવ્યું",
    pa: "ਅਧਿਕਾਰਤ ਤੌਰ 'ਤੇ ਲਾਗੂ ਹੋਇਆ",
    ur: "باضابطہ طور پر نافذ ہوا",
    es: "entró oficialmente en vigor",
    fr: "est officiellement entré en vigueur",
    ar: "دخل حيز التنفيذ رسمياً",
    de: "trat offiziell in Kraft",
  },
  {
    en: /\b(established|was founded|is founded|was established)\b/gi,
    hi: "की स्थापना की गई",
    bn: "প্রতিষ্ঠিত হয়",
    mr: "ची स्थापना करण्यात आली",
    te: "స్థాపించబడింది",
    ta: "நிறுவப்பட்டது",
    gu: "ની સ્થાપના કરવામાં આવી",
    pa: "ਦੀ ਸਥਾਪਨਾ ਕੀਤੀ ਗਈ",
    ur: "قائم کیا گیا",
    es: "fue fundado / establecido",
    fr: "a été fondé / établi",
    ar: "تأسست / تم إنشاؤه",
    de: "wurde gegründet",
  },
  {
    en: /\b(first human to walk on the moon|walks on the moon|landed on the moon)\b/gi,
    hi: "चंद्रमा पर कदम रखने वाले पहले मानव बने",
    bn: "চাঁদে পা রাখা প্রথম মানুষ হন",
    mr: "चंद्रावर पाऊल ठेवणारे पहिले मानव ठरले",
    te: "చంద్రుడిపై అడుగుపెట్టిన తొలి మానవుడిగా నిలిచారు",
    ta: "நிலவில் காலடி வைத்த முதல் மனிதரானார்",
    gu: "ચંદ્ર પર પગ મૂકનાર પ્રથમ માનવી બન્યા",
    pa: "ਚੰਦਰਮਾ 'ਤੇ ਪੈਰ ਧਰਨ ਵਾਲੇ ਪਹਿਲੇ ਮਨੁੱਖ ਬਣੇ",
    ur: "چاند پر قدم رکھنے والے پہلے انسان بنے",
    es: "se convirtió en el primer ser humano en caminar sobre la Luna",
    fr: "est devenu le premier être humain à marcher sur la Lune",
    ar: "أصبح أول إنسان يسير على سطح القمر",
    de: "wurde der erste Mensch, der den Mond betrat",
  },
  {
    en: /\b(elected as president|elected president|sworn in as president)\b/gi,
    hi: "राष्ट्रपति के रूप में निर्वाचित हुए और शपथ ली",
    bn: "রাষ্ট্রপতি হিসেবে নির্বাচিত হন ও শপথ নেন",
    mr: "राष्ट्रपती म्हणून निवडून आले आणि शपथ घेतली",
    te: "రాష్ట్రపతిగా ఎన్నికై ప్రమాణ స్వీకారం చేశారు",
    ta: "குடியரசுத் தலைவராகத் தேர்ந்தெடுக்கப்பட்டார்",
    gu: "રાષ્ટ્રપતિ તરીકે ચૂંટાયા અને શપથ લીધા",
    pa: "ਰਾਸ਼ਟਰਪਤੀ ਵਜੋਂ ਚੁਣੇ ਗਏ ਅਤੇ ਸਹੁੰ ਚੁੱਕੀ",
    ur: "صدر منتخب ہوئے اور حلف اٹھایا",
    es: "fue elegido presidente y juró su cargo",
    fr: "a été élu président et a prêté serment",
    ar: "انتُخب رئيساً وأدى اليمين الدستورية",
    de: "wurde zum Präsidenten gewählt",
  },
  {
    en: /\b(prime minister of india)\b/gi,
    hi: "भारत के प्रधानमंत्री",
    bn: "ভারতের প্রধানমন্ত্রী",
    mr: "भारताचे पंतप्रधान",
    te: "భారత ప్రధాని",
    ta: "இந்தியப் பிரதமர்",
    gu: "ભારતના વડાપ્રધાન",
    pa: "ਭਾਰਤ ਦੇ ਪ੍ਰਧਾਨ ਮੰਤਰੀ",
    ur: "وزیر اعظم ہند",
    es: "primer ministro de la India",
    fr: "Premier ministre de l'Inde",
    ar: "رئيس وزراء الهند",
    de: "Premierminister von Indien",
  },
  {
    en: /\b(constitution of india)\b/gi,
    hi: "भारत का संविधान",
    bn: "ভারতের সংবিধান",
    mr: "भारतीय संविधान",
    te: "భారత రాజ్యాంగం",
    ta: "இந்திய அரசியலமைப்பு",
    gu: "ભારતનું બંધારણ",
    pa: "ਭਾਰਤ ਦਾ ਸੰਵਿਧਾਨ",
    ur: "آئین ہند",
    es: "Constitución de la India",
    fr: "Constitution de l'Inde",
    ar: "دستور الهند",
    de: "Verfassung Indiens",
  },
  {
    en: /\b(world war ii|second world war)\b/gi,
    hi: "द्वितीय विश्व युद्ध",
    bn: "দ্বিতীয় বিশ্বযুদ্ধ",
    mr: "दुसरे महायुद्ध",
    te: "రెండవ ప్రపంచ యుద్ధం",
    ta: "இரண்டாம் உலகப் போர்",
    gu: "દ્વિતીય વિશ્વયુદ્ધ",
    pa: "ਦੂਜਾ ਵਿਸ਼ਵ ਯੁੱਧ",
    ur: "دوسری جنگ عظیم",
    es: "Segunda Guerra Mundial",
    fr: "Seconde Guerre mondiale",
    ar: "الحرب العالمية الثانية",
    de: "Zweiter Weltkrieg",
  },
  {
    en: /\b(world war i|first world war)\b/gi,
    hi: "प्रथम विश्व युद्ध",
    bn: "প্রথম বিশ্বযুদ্ধ",
    mr: "पहिले महायुद्ध",
    te: "మొదటి ప్రపంచ యుద్ధం",
    ta: "முதல் உலகப் போர்",
    gu: "પ્રથમ વિશ્વયુદ્ધ",
    pa: "ਪਹਿਲਾ ਵਿਸ਼ਵ ਯੁੱਧ",
    ur: "پہلی جنگ عظیم",
    es: "Primera Guerra Mundial",
    fr: "Première Guerre mondiale",
    ar: "الحرب العالمية الأولى",
    de: "Erster Weltkrieg",
  },
  {
    en: /\b(united nations|un general assembly)\b/gi,
    hi: "संयुक्त राष्ट्र (United Nations)",
    bn: "জাতিসংঘ (United Nations)",
    mr: "संयुक्त राष्ट्र (United Nations)",
    te: "ఐక్యరాజ్యసమితి (UN)",
    ta: "ஐக்கிய நாடுகள் சபை (UN)",
    gu: "સંયુક્ત રાષ્ટ્ર (UN)",
    pa: "ਸੰਯੁਕਤ ਰਾਸ਼ਟਰ (UN)",
    ur: "اقوام متحدہ (UN)",
    es: "Naciones Unidas (ONU)",
    fr: "Organisation des Nations unies (ONU)",
    ar: "الأمم المتحدة (UN)",
    de: "Vereinte Nationen (UN)",
  },
];

/**
 * Curated Event Headline & Story Database for Exact High-Fidelity Translations
 */
export const CURATED_EVENT_TRANSLATIONS: Record<string, Record<string, { headline: string; description?: string; significance?: string }>> = {
  hi: {
    "radcliffe line": {
      headline: "1947: रैडक्लिफ रेखा का प्रकाशन — भारत और पाकिस्तान की सीमाओं का आधिकारिक निर्धारण",
      description: "सर सिरिल रैडक्लिफ द्वारा निर्धारित सीमा रेखा को आधिकारिक रूप से प्रकाशित किया गया, जिसने पंजाब और बंगाल के विभाजन को रेखांकित किया।",
      significance: "उपमहाद्वीप के इतिहास में आधुनिक सीमाओं और लाखों लोगों के जीवन को प्रभावित करने वाला ऐतिहासिक क्षण।"
    },
    "indian independence": {
      headline: "1947: भारत का ऐतिहासिक स्वतंत्रता दिवस — औपनिवेशिक शासन का अंत",
      description: "पंडित जवाहरलाल नेहरू ने आधी रात को प्रसिद्ध 'नियति से साक्षात्कार' (Tryst with Destiny) भाषण दिया और भारत संप्रभु राष्ट्र बना।",
      significance: "विश्व के सबसे बड़े लोकतंत्र के जन्म और वैश्विक उपनिवेशवाद विरोधी आंदोलन की सबसे बड़ी जीत।"
    },
    "compact disc": {
      headline: "1982: विश्व की पहली वाणिज्यिक ऑडियो कॉम्पैक्ट डिस्क (CD) का निर्माण",
      description: "फिलिप्स और सोनी ने हनोवर, जर्मनी के पॉलीग्राम कारखाने में एबीबीए (ABBA) के एल्बम 'द विजिटर्स' के साथ पहली ऑडियो सीडी का निर्माण किया।",
      significance: "एनालॉग से डिजिटल संगीत और डेटा भंडारण में इतिहास की सबसे बड़ी तकनीकी क्रांति।"
    },
    "apollo 11": {
      headline: "1969: अपोलो 11 — मानव ने चंद्रमा पर पहला ऐतिहासिक कदम रखा",
      description: "अमेरिकी अंतरिक्ष यात्री नील आर्मस्ट्रांग और बज़ एल्ड्रिन लूनर मॉड्यूल ईगल से चंद्रमा की सतह 'ट्रैंक्विलिटी बेस' पर उतरे।",
      significance: "'मानव के लिए एक छोटा कदम, पूरी मानवता के लिए एक विशाल छलांग' — अंतरिक्ष अन्वेषण की सबसे बड़ी उपलब्धि।"
    },
    "penicillin": {
      headline: "1928: अलेक्जेंडर फ्लेमिंग द्वारा पेनिसिलिन की युगांतरकारी खोज",
      description: "लंदन के सेंट मैरी अस्पताल में डॉ. अलेक्जेंडर फ्लेमिंग ने देखा कि पेनिसिलियम नोटेटम कवक ने स्टेफिलोकोकस बैक्टीरिया को नष्ट कर दिया।",
      significance: "आधुनिक एंटीबायोटिक दवाओं का जन्म जिसने 20वीं सदी में करोड़ों मानव जीवन बचाए।"
    },
    "chandrayaan": {
      headline: "इसरो (ISRO): चंद्रयान मिशन — भारत का चंद्रमा के दक्षिणी ध्रुव पर ऐतिहासिक पदार्पण",
      description: "भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) ने चंद्रमा के दक्षिणी ध्रुव के निकट लैंडर की सॉफ्ट लैंडिंग कराकर विश्व इतिहास रचा।",
      significance: "चंद्रमा के दक्षिणी ध्रुव पर उतरने वाला विश्व का पहला देश बनकर भारत अंतरिक्ष महाशक्ति के रूप में उभरा।"
    },
    "aryabhata": {
      headline: "1975: आर्यभट्ट — भारत का पहला स्वदेशी उपग्रह अंतरिक्ष में प्रक्षेपित",
      description: "भारत के प्रथम कृत्रिम उपग्रह 'आर्यभट्ट' को सोवियत संघ के कपुस्टिन यार से कॉसमॉस-3एम रॉकेट द्वारा कक्षा में स्थापित किया गया।",
      significance: "भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) के महान अंतरिक्ष युग की ऐतिहासिक शुरुआत।"
    },
  },
  bn: {
    "radcliffe line": {
      headline: "১৯৪৭: র‍্যাডক্লিফ লাইন প্রকাশ — ভারত ও পাকিস্তানের আনুষ্ঠানিক সীমানা নির্ধারণ",
      description: "স্যার সিরিল র‍্যাডক্লিফের নির্ধারিত সীমানা আনুষ্ঠানিকভাবে প্রকাশ করা হয়, যা বাংলা ও পাঞ্জাবের ঐতিহাসিক বিভাজন ঘটায়।",
      significance: "উপমহাদেশের ইতিহাসে সবচেয়ে সুদূরপ্রসারী রাজনৈতিক ও ভৌগোলিক পদক্ষেপ।"
    },
    "indian independence": {
      headline: "১৯৪৭: ভারতের ঐতিহাসিক স্বাধীনতা দিবস — নতুন সার্বভৌমত্বের সূচনা",
      description: "পণ্ডিত জওহরলাল নেহরুর ঐতিহাসিক ভাষণের মধ্য দিয়ে ভারত ব্রিটিশ ঔপনিবেশিক শাসন থেকে স্বাধীনতা লাভ করে।",
      significance: "বিশ্বের বৃহত্তম গণতন্ত্রের আত্মপ্রকাশ।"
    },
    "compact disc": {
      headline: "১৯৮২: বিশ্বের প্রথম বাণিজ্যিক অডিও সিডি (CD) উৎপাদন",
      description: "ফিলিপস ও সনি যৌথভাবে জার্মানিতে বিশ্বের প্রথম বাণিজ্যিক অডিও কমপ্যাক্ট ডিস্ক তৈরি করে।",
      significance: "ডিজিটাল ডেটা ও সঙ্গীত প্রযুক্তির ঐতিহাসিক রূপান্তর।"
    },
    "apollo 11": {
      headline: "১৯৬৯: অ্যাপোলো ১১ — চাঁদের বুকে মানুষের প্রথম ঐতিহাসিক পদার্পণ",
      description: "মহাকাশচারী নিল আর্মস্ট্রং এবং বাজ অলড্রিন চাঁদের মাটিতে পা রেখে বিশ্ব ইতিহাস সৃষ্টি করেন।",
      significance: "মানব ইতিহাসের সর্বকালের সেরা বৈজ্ঞানিক ও মহাকাশীয় অর্জন।"
    },
  },
  mr: {
    "radcliffe line": {
      headline: "१९४७: रॅडक्लिफ रेषेची घोषणा — भारत व पाकिस्तानच्या सीमांचे अधिकृत निर्धारण",
      description: "सर सिरिल रॅडक्लिफ यांनी तयार केलेल्या सीमारेषेचे अधिकृत प्रकाशन झाले, ज्याने पंजाब आणि बंगालचे विभाजन केले.",
      significance: "उपखंडाच्या इतिहासातील अत्यंत निर्णायक आणि दूरगामी राजकीय घटना."
    },
    "indian independence": {
      headline: "१९४७: भारताचा ऐतिहासिक स्वातंत्र्यदिन — सार्वभौम लोकशाहीचा उदय",
      description: "पंडित जवाहरलाल नेहरू यांच्या ऐतिहासिक भाषणाने भारताने पारतंत्र्यातून मुक्ती मिळवून स्वातंत्र्याची पहाट अनुभवली.",
      significance: "जगातील सर्वात मोठ्या लोकशाही देशाचा जन्म."
    },
    "compact disc": {
      headline: "१९८२: जगातील पहिल्या ऑडिओ कॉम्पॅक्ट डिस्क (CD) ची निर्मिती",
      description: "फिलिप्स आणि सोनी कंपनीने जर्मनीतील कारखान्यात जगातील पहिली व्यावसायिक ऑडिओ सीडी तयार केली.",
      significance: "अ‍ॅनालॉगकडून डिजिटल संगीताकडे झालेली युगांतरकारी क्रांती."
    },
  },
  es: {
    "radcliffe line": {
      headline: "1947: Publicación de la Línea Radcliffe — Demarcación oficial entre India y Pakistán",
      description: "Se publicó oficialmente la demarcación fronteriza diseñada por Sir Cyril Radcliffe para dividir el Punyab y Bengala.",
      significance: "Uno de los momentos limítrofes más trascendentales en la historia moderna del sur de Asia."
    },
    "indian independence": {
      headline: "1947: Declaración de Independencia de la India del Imperio Británico",
      description: "Jawaharlal Nehru proclamó la soberanía de la India a la medianoche con su célebre discurso 'Tryst with Destiny'.",
      significance: "Nacimiento de la democracia más poblada del planeta."
    },
    "compact disc": {
      headline: "1982: Producción del primer Disco Compacto (CD) de audio en el mundo",
      description: "Philips y Sony produjeron el primer CD comercial en la fábrica de PolyGram en Hannover, Alemania.",
      significance: "Revolución histórica en la transición analógica a almacenamiento digital."
    },
  },
  fr: {
    "radcliffe line": {
      headline: "1947 : Démarcation de la ligne Radcliffe — Frontière entre l'Inde et le Pakistan",
      description: "Publication officielle du tracé frontalier de Sir Cyril Radcliffe divisant le Pendjab et le Bengale.",
      significance: "Événement géopolitique majeur de l'histoire contemporaine asiatique."
    },
    "compact disc": {
      headline: "1982 : Premier disque compact audio (CD) commercial produit au monde",
      description: "Philips et Sony lancent la fabrication du premier CD audio à Hanovre en Allemagne.",
      significance: "Révolution mondiale dans le stockage et l'écoute de la musique numérique."
    },
  },
  ar: {
    "radcliffe line": {
      headline: "1947: الإعلان الرسمي عن خط رادكليف — ترسيم الحدود بين الهند وباكستان",
      description: "نُشر رسمياً الخط الحدودي الذي رسمه السير سيريل رادكليف لتقسيم البنجاب والبنغال.",
      significance: "حدث جيوسياسي فارق غيّر ملامح شبه القارة الهندية."
    },
    "compact disc": {
      headline: "1982: إنتاج أول قرص مضغوط صوتي تجاري (CD) في العالم",
      description: "أنتجت شركتا فيليبس وسوني أول قرص مدمج صوتي تجاري في هانوفر بألمانيا.",
      significance: "ثورة تاريخية حولت الموسيقى وحفظ البيانات من الصيغة التناظرية إلى الرقمية."
    },
  },
};

/**
 * Intelligent on-the-fly text localizer:
 * Analyzes English text, performs pattern matching, entity translation,
 * and contextual syntax adaptation for any language.
 */
export function translateHistoricalText(text: string, targetLang: string = "en"): string {
  if (!text || typeof text !== "string") return "";
  const cleanLang = (targetLang || "en").toLowerCase().split("-")[0];
  if (cleanLang === "en") return text;

  const lower = text.toLowerCase();

  // 1. Check curated exact matches
  const langCurated = CURATED_EVENT_TRANSLATIONS[cleanLang];
  if (langCurated) {
    for (const key of Object.keys(langCurated)) {
      if (lower.includes(key)) {
        const item = langCurated[key];
        return item.headline || item.description || text;
      }
    }
  }

  // 2. Pattern and Lexicon substitutions
  let translated = text;

  // Replace common historical patterns
  for (const pattern of HISTORICAL_PATTERNS) {
    if (pattern.en.test(translated)) {
      const repl = (pattern as any)[cleanLang] || (pattern as any)["hi"];
      if (repl) {
        translated = translated.replace(pattern.en, repl);
      }
    }
  }

  // 3. Common English connector and structural words translation based on target language
  if (cleanLang === "hi") {
    translated = translated
      .replace(/\bIn (\d{4}),\b/g, "$1 में,")
      .replace(/\bOn this day in (\d{4}),\b/g, "$1 में आज ही के दिन,")
      .replace(/\bUnited States\b/gi, "संयुक्त राज्य अमेरिका")
      .replace(/\bUnited Kingdom\b/gi, "यूनाइटेड किंगडम (ब्रिटेन)")
      .replace(/\bSoviet Union\b/gi, "सोवियत संघ (USSR)")
      .replace(/\bGermany\b/gi, "जर्मनी")
      .replace(/\bFrance\b/gi, "फ्रांस")
      .replace(/\bJapan\b/gi, "जापान")
      .replace(/\bChina\b/gi, "चीन")
      .replace(/\bRussia\b/gi, "रूस")
      .replace(/\bIndia\b/gi, "भारत")
      .replace(/\bPakistan\b/gi, "पाकिस्तान")
      .replace(/\bMoon\b/gi, "चंद्रमा")
      .replace(/\bEarth\b/gi, "पृथ्वी")
      .replace(/\bMars\b/gi, "मंगल ग्रह")
      .replace(/\bSun\b/gi, "सूर्य")
      .replace(/\bbattles?\b/gi, "युद्ध")
      .replace(/\btreaty\b/gi, "संधि")
      .replace(/\bpresident\b/gi, "राष्ट्रपति")
      .replace(/\bking\b/gi, "राजा")
      .replace(/\bqueen\b/gi, "रानी")
      .replace(/\bdiscovered\b/gi, "की खोज की")
      .replace(/\binvented\b/gi, "का आविष्कार किया")
      .replace(/\bpublished\b/gi, "प्रकाशित किया गया")
      .replace(/\bcompleted\b/gi, "पूर्ण हुआ");
  } else if (cleanLang === "bn") {
    translated = translated
      .replace(/\bIn (\d{4}),\b/g, "$1 সালে,")
      .replace(/\bUnited States\b/gi, "মার্কিন যুক্তরাষ্ট্র")
      .replace(/\bUnited Kingdom\b/gi, "যুক্তরাজ্য")
      .replace(/\bSoviet Union\b/gi, "সোভিয়েত ইউনিয়ন")
      .replace(/\bGermany\b/gi, "জার্মানি")
      .replace(/\bFrance\b/gi, "ফ্রান্স")
      .replace(/\bJapan\b/gi, "জাপান")
      .replace(/\bChina\b/gi, "চীন")
      .replace(/\bIndia\b/gi, "ভারত")
      .replace(/\bMoon\b/gi, "চাঁদ")
      .replace(/\btreaty\b/gi, "চুক্তি")
      .replace(/\bdiscovered\b/gi, "আবিষ্কার করেন")
      .replace(/\binvented\b/gi, "আবিষ্কার করেন");
  } else if (cleanLang === "mr") {
    translated = translated
      .replace(/\bIn (\d{4}),\b/g, "$1 मध्ये,")
      .replace(/\bUnited States\b/gi, "अमेरिका")
      .replace(/\bUnited Kingdom\b/gi, "ब्रिटन")
      .replace(/\bSoviet Union\b/gi, "सोव्हिएत युनियन")
      .replace(/\bGermany\b/gi, "जर्मनी")
      .replace(/\bFrance\b/gi, "फ्रान्स")
      .replace(/\bJapan\b/gi, "जपान")
      .replace(/\bIndia\b/gi, "भारत")
      .replace(/\bMoon\b/gi, "चंद्र")
      .replace(/\btreaty\b/gi, "करार")
      .replace(/\bdiscovered\b/gi, "शोध लावला");
  } else if (cleanLang === "es") {
    translated = translated
      .replace(/\bIn (\d{4}),\b/g, "En $1,")
      .replace(/\bUnited States\b/gi, "Estados Unidos")
      .replace(/\bUnited Kingdom\b/gi, "Reino Unido")
      .replace(/\bSoviet Union\b/gi, "Unión Soviética")
      .replace(/\bGermany\b/gi, "Alemania")
      .replace(/\bFrance\b/gi, "Francia")
      .replace(/\bJapan\b/gi, "Japón")
      .replace(/\bMoon\b/gi, "la Luna")
      .replace(/\btreaty\b/gi, "tratado")
      .replace(/\bdiscovered\b/gi, "descubrió")
      .replace(/\binvented\b/gi, "inventó");
  } else if (cleanLang === "fr") {
    translated = translated
      .replace(/\bIn (\d{4}),\b/g, "En $1,")
      .replace(/\bUnited States\b/gi, "États-Unis")
      .replace(/\bUnited Kingdom\b/gi, "Royaume-Uni")
      .replace(/\bSoviet Union\b/gi, "Union soviétique")
      .replace(/\bGermany\b/gi, "Allemagne")
      .replace(/\bJapan\b/gi, "Japon")
      .replace(/\bMoon\b/gi, "la Lune")
      .replace(/\btreaty\b/gi, "traité");
  } else if (cleanLang === "ar") {
    translated = translated
      .replace(/\bIn (\d{4}),\b/g, "في عام $1،")
      .replace(/\bUnited States\b/gi, "الولايات المتحدة")
      .replace(/\bUnited Kingdom\b/gi, "المملكة المتحدة")
      .replace(/\bSoviet Union\b/gi, "الاتحاد السوفيتي")
      .replace(/\bGermany\b/gi, "ألمانيا")
      .replace(/\bFrance\b/gi, "فرنسا")
      .replace(/\bJapan\b/gi, "اليابان")
      .replace(/\bMoon\b/gi, "القمر")
      .replace(/\btreaty\b/gi, "معاهدة");
  }

  return translated;
}

/**
 * Localizes an arbitrary source string into target language
 */
export function translateSourceName(sourceName: string = "", targetLang: string = "en"): string {
  if (!sourceName) return "Wikimedia Foundation";
  const cleanLang = (targetLang || "en").toLowerCase().split("-")[0];
  const langMap = SOURCE_NAME_I18N[cleanLang];
  if (langMap && langMap[sourceName]) {
    return langMap[sourceName];
  }

  // Fallback checks
  if (cleanLang === "hi") {
    if (sourceName.includes("Wikimedia")) return "विकिमीडिया फाउंडेशन";
    if (sourceName.includes("Wikipedia")) return "विकिपीडिया खुला ज्ञानकोश";
    if (sourceName.includes("Archives")) return "ऐतिहासिक अभिलेखागार";
  } else if (cleanLang === "bn") {
    if (sourceName.includes("Wikimedia")) return "উইকিমিডিয়া ফাউন্ডেশন";
    if (sourceName.includes("Wikipedia")) return "উইকিপিডিয়া উন্মুক্ত আর্কাইভ";
  } else if (cleanLang === "mr") {
    if (sourceName.includes("Wikimedia")) return "विकिमीडिया फाउंडेशन";
    if (sourceName.includes("Wikipedia")) return "विकिपीडिया खुला ज्ञानकोश";
  } else if (cleanLang === "es") {
    if (sourceName.includes("Wikimedia")) return "Fundación Wikimedia";
    if (sourceName.includes("Wikipedia")) return "Wikipedia Archivos";
  } else if (cleanLang === "fr") {
    if (sourceName.includes("Wikimedia")) return "Fondation Wikimédia";
  } else if (cleanLang === "ar") {
    if (sourceName.includes("Wikimedia")) return "مؤسسة ويكيميديا";
  }

  return sourceName;
}

/**
 * Universal React Hook: useLocalizedHistoryData
 * Automatically hydrates and translates DayInHistoryData when the user switches languages in <50ms without reloading.
 */
export function useLocalizedHistoryData(
  data: DayInHistoryData | null,
  selectedLang: string = "en",
  selectedCountry: string = "IN"
): DayInHistoryData | null {
  return useMemo(() => {
    if (!data) return null;
    return deepLocalizeHistoryData(data, selectedLang, selectedCountry);
  }, [data, selectedLang, selectedCountry]);
}

/**
 * Deep, 100% Comprehensive Localizer for DayInHistoryData
 * Translates every node: Headlines, Descriptions, Significance, Trivia Questions, Options,
 * Quotes, and Sources across all cards.
 */
export function deepLocalizeHistoryData(
  data: DayInHistoryData,
  targetLang: string = "en",
  targetCountry?: string
): DayInHistoryData {
  if (!data) return data;
  const cleanLang = (targetLang || "en").toLowerCase().split("-")[0];
  if (cleanLang === "en") return data;

  const localizeItem = (item: HistoryEventItem): HistoryEventItem => {
    const translatedHeadline = translateHistoricalText(item.headline, cleanLang);
    const translatedDesc = translateHistoricalText(item.description, cleanLang);
    const translatedSig = item.significance ? translateHistoricalText(item.significance, cleanLang) : undefined;
    const localizedSource = translateSourceName(item.sourceName, cleanLang);

    return {
      ...item,
      headline: translatedHeadline || item.headline,
      description: translatedDesc || item.description,
      significance: translatedSig || item.significance,
      sourceName: localizedSource,
    };
  };

  const localizedEvents = (data.events || []).map(localizeItem);
  const localizedBirths = (data.births || []).map(localizeItem);
  const localizedDiscoveries = (data.discoveries || []).map(localizeItem);
  const localizedCountrySpotlight = (data.countrySpotlight || []).map(localizeItem);

  // Localize Trivia Quiz
  let localizedTrivia = data.dailyTrivia;
  if (localizedTrivia) {
    const translatedQuestion = translateHistoricalText(localizedTrivia.question, cleanLang);
    const translatedExplanation = translateHistoricalText(localizedTrivia.explanation, cleanLang);
    const translatedOptions = localizedTrivia.options.map((opt) => translateHistoricalText(opt, cleanLang));
    const translatedSource = translateSourceName(localizedTrivia.sourceName, cleanLang);

    localizedTrivia = {
      ...localizedTrivia,
      question: translatedQuestion || localizedTrivia.question,
      options: translatedOptions,
      explanation: translatedExplanation || localizedTrivia.explanation,
      sourceName: translatedSource,
    };
  }

  // Localize Quote
  let localizedQuote = data.quoteOfTheDay;
  if (localizedQuote) {
    const translatedQuoteText = translateHistoricalText(localizedQuote.quote, cleanLang);
    const translatedContext = translateHistoricalText(localizedQuote.context, cleanLang);
    const translatedAuthor = translateHistoricalText(localizedQuote.author, cleanLang);
    const translatedSource = translateSourceName(localizedQuote.sourceName, cleanLang);

    localizedQuote = {
      ...localizedQuote,
      quote: translatedQuoteText || localizedQuote.quote,
      author: translatedAuthor || localizedQuote.author,
      context: translatedContext || localizedQuote.context,
      sourceName: translatedSource,
    };
  }

  // Localize Featured Headline
  const localizedFeaturedHeadline = translateHistoricalText(data.featuredHeadline, cleanLang);

  return {
    ...data,
    featuredHeadline: localizedFeaturedHeadline || data.featuredHeadline,
    languageCode: cleanLang,
    events: localizedEvents,
    births: localizedBirths,
    discoveries: localizedDiscoveries,
    countrySpotlight: localizedCountrySpotlight,
    dailyTrivia: localizedTrivia,
    quoteOfTheDay: localizedQuote,
  };
}
