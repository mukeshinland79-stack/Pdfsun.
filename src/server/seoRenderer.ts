import { ALL_TOOLS } from "../data/toolsData";
import { PSEO_LANDING_PAGES, POPULAR_COMPRESS_SIZES, generateCompressSizePseoPage, matchPSEORoute } from "../data/pSEOData";
import { BLOG_POSTS } from "../data/blogData";
import { TOOL_TRANSLATIONS } from "../lib/translations/toolTranslations";

export interface SeoLanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  hreflang: string;
  dir: "ltr" | "rtl";
  locale: string;
}

export const SEO_LANGUAGES: SeoLanguageConfig[] = [
  { code: "en", name: "English", nativeName: "English", hreflang: "en", dir: "ltr", locale: "en_US" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", hreflang: "hi", dir: "ltr", locale: "hi_IN" },
  { code: "es", name: "Spanish", nativeName: "Español", hreflang: "es", dir: "ltr", locale: "es_ES" },
  { code: "fr", name: "French", nativeName: "Français", hreflang: "fr", dir: "ltr", locale: "fr_FR" },
  { code: "de", name: "German", nativeName: "Deutsch", hreflang: "de", dir: "ltr", locale: "de_DE" },
  { code: "pt", name: "Portuguese", nativeName: "Português", hreflang: "pt", dir: "ltr", locale: "pt_BR" },
  { code: "ar", name: "Arabic", nativeName: "العربية", hreflang: "ar", dir: "rtl", locale: "ar_SA" },
  { code: "ja", name: "Japanese", nativeName: "日本語", hreflang: "ja", dir: "ltr", locale: "ja_JP" },
  { code: "ru", name: "Russian", nativeName: "Русский", hreflang: "ru", dir: "ltr", locale: "ru_RU" },
  { code: "zh-CN", name: "Chinese Simplified", nativeName: "简体中文", hreflang: "zh-Hans", dir: "ltr", locale: "zh_CN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", hreflang: "bn", dir: "ltr", locale: "bn_IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", hreflang: "mr", dir: "ltr", locale: "mr_IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", hreflang: "te", dir: "ltr", locale: "te_IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", hreflang: "ta", dir: "ltr", locale: "ta_IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", hreflang: "gu", dir: "ltr", locale: "gu_IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", hreflang: "pa", dir: "ltr", locale: "pa_IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", hreflang: "kn", dir: "ltr", locale: "kn_IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", hreflang: "ml", dir: "ltr", locale: "ml_IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", hreflang: "ur", dir: "rtl", locale: "ur_PK" },
  { code: "ko", name: "Korean", nativeName: "한국어", hreflang: "ko", dir: "ltr", locale: "ko_KR" },
  { code: "zh-TW", name: "Chinese Traditional", nativeName: "繁體中文", hreflang: "zh-Hant", dir: "ltr", locale: "zh_TW" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", hreflang: "tr", dir: "ltr", locale: "tr_TR" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", hreflang: "nl", dir: "ltr", locale: "nl_NL" },
  { code: "pl", name: "Polish", nativeName: "Polski", hreflang: "pl", dir: "ltr", locale: "pl_PL" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", hreflang: "vi", dir: "ltr", locale: "vi_VN" },
  { code: "th", name: "Thai", nativeName: "ไทย", hreflang: "th", dir: "ltr", locale: "th_TH" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", hreflang: "id", dir: "ltr", locale: "id_ID" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", hreflang: "uk", dir: "ltr", locale: "uk_UA" },
  { code: "fa", name: "Persian", nativeName: "فارسی", hreflang: "fa", dir: "rtl", locale: "fa_IR" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", hreflang: "ms", dir: "ltr", locale: "ms_MY" },
  { code: "it", name: "Italian", nativeName: "Italiano", hreflang: "it", dir: "ltr", locale: "it_IT" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", hreflang: "el", dir: "ltr", locale: "el_GR" },
  { code: "he", name: "Hebrew", nativeName: "עברית", hreflang: "he", dir: "rtl", locale: "he_IL" },
];

export interface PageSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  ogImage: string;
  keywords: string;
  jsonLdSchemas: object[];
  crawlableHtml: string;
  activeLang: string;
  isRtl: boolean;
  reciprocalHreflangs: string;
}

/**
 * Builds rich, crawlable HTML semantic content, canonical URLs, reciprocal hreflang tags,
 * and structured JSON-LD for any route (including localized subpaths e.g. /hi/pdf-to-word, /es/merge-pdf, /fr/pricing).
 */
export function getSeoMetadataForPath(rawPath: string, queryParams: Record<string, any> = {}): PageSeoMetadata {
  const baseUrl = "https://www.pdfsun.in";
  const defaultOgImage = `${baseUrl}/og-image.png`;

  // 1. Normalize and parse subpath / language code
  const rawClean = (rawPath.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const segments = rawClean.split("/").filter(Boolean);

  let langCode = "en";
  let subRoute = rawClean;

  if (segments.length > 0) {
    const candidate = segments[0].toLowerCase();
    const matched = SEO_LANGUAGES.find(
      (l) => l.code.toLowerCase() === candidate || l.code.toLowerCase().split("-")[0] === candidate
    );
    if (matched) {
      langCode = matched.code;
      const rest = segments.slice(1);
      subRoute = rest.length > 0 ? "/" + rest.join("/") : "/";
    }
  }

  // Fallback to query param if not in subpath
  if (langCode === "en" && queryParams.lang) {
    const q = String(queryParams.lang).toLowerCase();
    const matched = SEO_LANGUAGES.find(
      (l) => l.code.toLowerCase() === q || l.code.toLowerCase().split("-")[0] === q
    );
    if (matched) langCode = matched.code;
  }

  const langConfig = SEO_LANGUAGES.find((l) => l.code === langCode) || SEO_LANGUAGES[0];
  const isRtl = langConfig.dir === "rtl";

  // Base path for hreflangs without language prefix (e.g. "" for home, "/pdf-to-word" for tool)
  const baseSubRoute = subRoute === "/" ? "" : subRoute;

  // Exact Canonical URL
  const canonicalPath = langCode === "en"
    ? (baseSubRoute || "/")
    : `/${langCode}${baseSubRoute}`;
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  // Reciprocal Hreflangs across supported global languages + x-default
  const reciprocalHreflangs = SEO_LANGUAGES.map((l) => {
    const loc = l.code === "en"
      ? `${baseUrl}${baseSubRoute || "/"}`
      : `${baseUrl}/${l.code}${baseSubRoute}`;
    return `<link rel="alternate" hreflang="${l.hreflang}" href="${escapeHtml(loc)}" />`;
  }).join("\n    ") +
  `\n    <link rel="alternate" hreflang="x-default" href="${escapeHtml(baseUrl + (baseSubRoute || "/"))}" />`;

  // -------------------------------------------------------------
  // Route 1: Home Page (/ or /:lang or /:lang/)
  // -------------------------------------------------------------
  if (subRoute === "/" || subRoute === "") {
    const homeTitles: Record<string, string> = {
      hi: "PDFSun - मुफ़्त ऑनलाइन पीडीएफ टूल्स | मर्ज, कंप्रेस, स्प्लिट और कन्वर्ट",
      es: "PDFSun - Herramientas PDF Gratis Online | Unir, Comprimir, Dividir y Convertir PDF",
      fr: "PDFSun - Outils PDF Gratuits en Ligne | Fusionner, Compresser, Convertir PDF",
      de: "PDFSun - Kostenlose Online-PDF-Tools | Zusammenfügen, Komprimieren, Konvertieren",
      ar: "PDFSun - أدوات بي دي إف مجانية عبر الإنترنت | دمج، ضغط، تقسيم وتحويل PDF",
      pt: "PDFSun - Ferramentas PDF Gratuitas Online | Juntar, Comprimir e Converter PDF",
      ja: "PDFSun - 無料オンラインPDFツール | 結合・圧縮・変換・編集",
      ru: "PDFSun - Бесплатные Онлайн Инструменты PDF | Объединение, Сжатие, Конвертация",
      "zh-CN": "PDFSun - 免费在线 PDF 工具箱 | 合并、压缩、拆分与转换 PDF",
      bn: "PDFSun - বিনামূল্যে অনলাইন পিডিএফ টুলস | মার্জ, কম্প্রেস, স্প্লিট ও কনভার্ট",
      mr: "PDFSun - मोफत ऑनलाइन पीडीएफ टूल्स | विलीन, कॉम्प्रेस, स्प्लिट आणि रूपांतरित करा",
      gu: "PDFSun - મફત ઓનલાઇન પીડીએફ ટૂલ્સ | મર્જ, કમ્પ્રેસ, સ્પ્લિટ અને કન્વર્ટ",
    };

    const homeDescriptions: Record<string, string> = {
      hi: "100% प्राइवेट, मुफ़्त ऑनलाइन पीडीएफ टूल्स। अपने ब्राउज़र में सीधे पीडीएफ मर्ज करें, कंप्रेस करें, स्प्लिट करें और कन्वर्ट करें। शून्य सर्वर अपलोड, वेबअसेंबली स्पीड।",
      es: "Herramientas PDF 100% privadas y gratuitas. Une, comprime, divide y convierte documentos PDF directamente en tu navegador con WebAssembly. Sin subidas a servidores.",
      fr: "Outils PDF 100% privés et gratuits en ligne. Fusionnez, compressez, divisez et convertissez vos PDF dans votre navigateur via WebAssembly. Zéro upload serveur.",
      de: "100% private, kostenlose Online-PDF-Tools. PDFs direkt im Browser zusammenfügen, komprimieren, teilen und konvertieren. Null Server-Uploads mit WebAssembly.",
      ar: "أدوات PDF مجانية وخاصة 100%. دمج وضغط وتقسيم وتحويل وتوقيع مستندات PDF محلياً داخل متصفحك عبر تقنية WebAssembly بدون رفع المستندات إلى خوادم خارجية.",
      pt: "Ferramentas PDF 100% privadas e gratuitas. Junte, comprima, divida e converta PDFs diretamente no seu navegador com WebAssembly. Sem upload de arquivos para servidores.",
      ja: "100%完全プライベート、無料のオンラインPDFツール。ブラウザ内でWebAssemblyにより直接PDFを結合、圧縮、分割、変換。サーバーアップロード一切なし。",
      ru: "100% конфиденциальные бесплатные онлайн инструменты PDF. Объединяйте, сжимайте, разделяйте и конвертируйте PDF прямо в браузере через WebAssembly без загрузки на сервер.",
      "zh-CN": "100% 浏览器本地隐私，免费在线 PDF 工具箱。使用 WebAssembly 在本地极速合并、压缩、拆分和转换 PDF 文档，文件永不上传服务器。",
      bn: "১০০% ব্যক্তিগত ও বিনামূল্যে অনলাইন পিডিএফ টুলস। কোনো সার্ভার আপলোড ছাড়াই ব্রাউজারে ওয়েবঅ্যাসেম্বলি প্রযুক্তিতে ফাইল মার্জ, কম্প্রেস ও কনভার্ট করুন।",
      mr: "१००% खाजगी आणि मोफत ऑनलाइन पीडीएफ टूल्स. कोणत्याही सर्व्हर अपलोडशिवाय थेट ब्राऊझरमध्ये वेबअसेंब्लीसह फाइल्स प्रोसेस करा.",
      gu: "૧૦૦% ખાનગી અને મફત ઓનલાઇન પીડીએફ ટૂલ્સ. કોઈ સર્વર અપલોડ વિના સીધા બ્રાઉઝરમાં વેબએસેમ્બલી વડે ફાઇલો પ્રોસેસ કરો.",
    };

    const title = homeTitles[langCode] || "PDFSun - Free Online PDF Tools | Merge, Compress, Split & Convert PDF";
    const description = homeDescriptions[langCode] || "100% private, free online PDF tools. Merge, compress, split, convert, and sign PDF documents directly in your browser. Zero server upload, ultra-fast WebAssembly processing.";

    return {
      title,
      description,
      canonicalUrl,
      ogTitle: title,
      ogDescription: description,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "free pdf tools, merge pdf online free without email, compress pdf under 200kb, split pdf, convert pdf to word, client-side pdf, pdfsun",
      activeLang: langCode,
      isRtl,
      reciprocalHreflangs,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PDFSun",
          "alternateName": ["PDFSun.in", "PDF Sun", "PDF Sun Online"],
          "url": baseUrl,
          "inLanguage": langCode,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${baseUrl}/?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "PDFSun Online PDF Engine",
          "operatingSystem": "All (Web, Windows, macOS, Linux, Android, iOS)",
          "applicationCategory": "UtilitiesApplication",
          "inLanguage": langCode,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PDFSun",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
        },
      ],
      crawlableHtml: `
        <article dir="${isRtl ? 'rtl' : 'ltr'}" style="max-width: 900px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>${title}</h1>
          <p>${description}</p>
          <h2>Popular Core PDF Tools</h2>
          <ul>
            <li><a href="${langCode === 'en' ? '' : '/' + langCode}/merge-pdf"><strong>Merge PDF</strong></a>: Combine multiple PDF files into one single document with custom page ordering.</li>
            <li><a href="${langCode === 'en' ? '' : '/' + langCode}/compress-pdf"><strong>Compress PDF</strong></a>: Reduce PDF size to under 100KB, 200KB, or 500KB while preserving vector text and image clarity.</li>
            <li><a href="${langCode === 'en' ? '' : '/' + langCode}/split-pdf"><strong>Split PDF</strong></a>: Extract page ranges or save every page as an individual PDF.</li>
            <li><a href="${langCode === 'en' ? '' : '/' + langCode}/pdf-to-word"><strong>PDF to Word</strong></a>: Convert static PDFs into editable Microsoft Word (.docx) documents.</li>
            <li><a href="${langCode === 'en' ? '' : '/' + langCode}/sign-pdf"><strong>Sign PDF</strong></a>: Add electronic signatures, initials, and date stamps without registration.</li>
            <li><a href="${langCode === 'en' ? '' : '/' + langCode}/protect-pdf"><strong>Protect PDF</strong></a>: Encrypt sensitive files with military-grade 256-bit AES passwords.</li>
          </ul>
          <h2>Enterprise Security &amp; Generative AI Discovery</h2>
          <p><strong>Zero Server Ingress:</strong> Unlike cloud converters that upload documents to remote servers, PDFSun executes 100% of processing in local client memory via compiled WebAssembly (WASM).</p>
          <p><strong>Compliance:</strong> Built for banking, legal, financial, and healthcare workflows compliant with GDPR and CCPA principles.</p>
        </article>
      `,
    };
  }

  // -------------------------------------------------------------
  // Route 2: Pricing Page (/pricing or /:lang/pricing)
  // Strictly respects AGENTS.md Pricing Tiers
  // -------------------------------------------------------------
  if (subRoute === "/pricing") {
    const pricingTitles: Record<string, string> = {
      hi: "PDFSun मूल्य निर्धारण - पारदर्शी नि:शुल्क, फ्लेक्स पास और प्रो प्लान",
      es: "Precios de PDFSun - Planes Transparentes Gratis, Flex Pass y Pro",
      fr: "Tarifs PDFSun - Forfaits Transparents Gratuit, Flex Pass et Pro",
      de: "PDFSun Preise - Transparente Tarife: Kostenlos, Flex Pass und Pro",
      ar: "أسعار PDFSun - خطط اشتراك شفافة مجانية ومرنة واحترافية",
      default: "PDFSun Pricing - Transparent Free, Flex Pass & Pro Subscription Plans",
    };

    const title = pricingTitles[langCode] || pricingTitles.default;
    const description = "Simple, honest pricing for PDFSun. Free forever tier (₹0), Flex Pass (₹99 for 7 days), Pro Sun Monthly (₹199), Pro Sun Annual (₹1,499), and Enterprise SSO. No surprise auto-debits.";

    return {
      title,
      description,
      canonicalUrl,
      ogTitle: title,
      ogDescription: description,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "pdfsun pricing, pdf tools subscription, flex pass pdf, pro sun monthly, enterprise pdf tools, razorpay",
      activeLang: langCode,
      isRtl,
      reciprocalHreflangs,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "PDFSun Pro & Enterprise Suite",
          "description": "Enterprise-grade client-side WebAssembly document engine with zero server upload.",
          "brand": { "@type": "Brand", "name": "PDFSun" },
          "offers": [
            { "@type": "Offer", "name": "Free Forever", "price": "0", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": canonicalUrl },
            { "@type": "Offer", "name": "Flex Pass (7 Days)", "price": "99", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": canonicalUrl },
            { "@type": "Offer", "name": "Pro Sun Monthly", "price": "199", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": canonicalUrl },
            { "@type": "Offer", "name": "Pro Sun Annual", "price": "1499", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": canonicalUrl },
            { "@type": "Offer", "name": "Enterprise Plan", "price": "3999", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": canonicalUrl },
            { "@type": "Offer", "name": "Enterprise SSO Unlimited", "price": "9999", "priceCurrency": "INR", "availability": "https://schema.org/InStock", "url": canonicalUrl },
          ],
        },
      ],
      crawlableHtml: `
        <article dir="${isRtl ? 'rtl' : 'ltr'}" style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>${title}</h1>
          <p>${description}</p>
          <h2>Official Subscription &amp; Access Tiers</h2>
          <ul>
            <li><strong>Free Forever (₹0)</strong>: Basic PDF tools, 15 MB file size limit, 3 operations per day.</li>
            <li><strong>Flex Pass (₹99 / 7 Days)</strong>: Pay-as-you-go access, valid for 7 days with no auto-debit commitments.</li>
            <li><strong>Pro Sun Monthly (₹199 / month)</strong>: Full feature access, standard limits, auto-renewed monthly.</li>
            <li><strong>Pro Sun Annual (₹1,499 / year)</strong>: Full feature access, high limits, billed yearly.</li>
            <li><strong>Enterprise Plan (₹3,999 / year)</strong>: Multi-user access (5 seats), high processing limits, priority support.</li>
            <li><strong>Enterprise SSO Unlimited (₹9,999 / year)</strong>: Enterprise SSO (20 seats), unlimited throughput, dedicated infrastructure.</li>
          </ul>
        </article>
      `,
    };
  }

  // -------------------------------------------------------------
  // Route 3: Blog Index (/blog or /:lang/blog)
  // -------------------------------------------------------------
  if (subRoute === "/blog") {
    return {
      title: "PDFSun Blog & Engineering Guides - Document Privacy & Tips",
      description: "Expert guides, tutorials, and technical deep-dives on PDF editing, WebAssembly in-browser processing, document security, OCR, and digital workflows.",
      canonicalUrl,
      ogTitle: "PDFSun Blog & Engineering Insights",
      ogDescription: "In-depth articles on digital document optimization, client-side privacy, file compression benchmarks, and zero-knowledge workflows.",
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "pdf blog, pdf tutorials, how to compress pdf, webassembly pdf, pdf privacy, pdf security guides",
      activeLang: langCode,
      isRtl,
      reciprocalHreflangs,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "PDFSun Document Insights",
          "url": canonicalUrl,
          "description": "Guides and tutorials on PDF manipulation, security, and WebAssembly computing.",
        },
      ],
      crawlableHtml: `
        <article dir="${isRtl ? 'rtl' : 'ltr'}" style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>PDFSun Engineering &amp; Document Insights</h1>
          <p>Explore our latest tutorials and technical articles on client-side PDF computing and privacy.</p>
          ${BLOG_POSTS.map(
            (b) => `
            <div style="margin-bottom: 24px;">
              <h2><a href="/blog/${b.slug}">${b.title}</a></h2>
              <p>${b.excerpt}</p>
              <small>By ${b.author} • ${b.date} • ${b.readTime}</small>
            </div>
          `
          ).join("")}
        </article>
      `,
    };
  }

  // -------------------------------------------------------------
  // Route: Barcode Studio (/barcode or /barcode-studio)
  // -------------------------------------------------------------
  if (subRoute === "/barcode" || subRoute === "/barcode-studio") {
    const title = "Free Online Barcode Studio & Avery Label Generator | PDFSun.in";
    const description = "Generate 21+ standard 1D linear and 2D matrix barcodes (Code 128, EAN-13, UPC-A, QR Code, Data Matrix, PDF417). Design print-ready Avery & Zebra label sheets with bulk sequential numbering & CSV export.";

    return {
      title,
      description,
      canonicalUrl: `${baseUrl}/barcode`,
      ogTitle: title,
      ogDescription: description,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "barcode generator, free barcode studio, code 128, ean 13 generator, upc-a, qr code, data matrix, avery 5160 labels, zebra thermal labels, bulk barcode generator, pdfsun",
      activeLang: langCode,
      isRtl,
      reciprocalHreflangs,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "PDFSun Barcode Studio",
          "url": `${baseUrl}/barcode`,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
          },
          "featureList": [
            "21+ Barcode Symbologies (Linear, 2D Matrix, Business Presets)",
            "Automated GS1 Modulo-10 Check Digit Calculation",
            "Avery 5160, L7160, L7163 & Zebra 4x6 Label Sheet Imposition",
            "Bulk CSV & Excel Spreadsheet Ingestion",
            "Automated Sequential Numbering & Batch ZIP Export",
            "Vector SVG, 300+ DPI PNG, and Print-Ready PDF Downloads",
            "100% Client-Side Privacy: No Server Data Uploads",
          ],
        },
      ],
      crawlableHtml: `
        <article dir="${isRtl ? 'rtl' : 'ltr'}" style="max-width: 900px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>Free Online Barcode Studio &amp; Sheet Imposition Designer</h1>
          <p>Generate professional, standards-compliant barcodes in vector SVG and high-resolution raster formats directly in your browser. Design print-ready label sheets for Avery® and thermal rolls with 100% privacy and zero server uploads.</p>
          <h2>Supported Barcode Standards</h2>
          <ul>
            <li><strong>Code 128:</strong> High-density alphanumeric barcode supporting all 128 ASCII characters for enterprise asset tracking.</li>
            <li><strong>EAN-13 &amp; UPC-A:</strong> Global retail point-of-sale barcodes with automated GS1 Modulo-10 check digit calculation.</li>
            <li><strong>ITF-14:</strong> Master shipping carton barcode with sturdy bearer bars for corrugated cardboard transit.</li>
            <li><strong>QR Code &amp; Data Matrix (ECC 200):</strong> High-capacity 2D matrix symbologies for URLs, contact cards, and FDA UDI healthcare labeling.</li>
            <li><strong>PDF417 &amp; Aztec Code:</strong> Stacked 2D and bulls-eye codes used in airline boarding passes and transit ticketing.</li>
            <li><strong>Business Presets:</strong> Pre-configured workflows for Amazon FBA (FNSKU), Book Publishing (ISBN-13), and Periodicals (ISSN).</li>
          </ul>
          <h2>Print-Ready Sheet Imposition</h2>
          <p>Format barcodes onto standard adhesive label templates including Avery 5160 (Letter 30-up), Avery L7160/L7163 (A4 European standards), and Zebra 4"x6" direct thermal shipping labels.</p>
        </article>
      `,
    };
  }

  // -------------------------------------------------------------
  // Route 4: Single Blog Article (/blog/:slug)
  // -------------------------------------------------------------
  if (subRoute.startsWith("/blog/")) {
    const postSlug = subRoute.replace("/blog/", "").replace(/\/+$/, "");
    const post = BLOG_POSTS.find((p) => p.slug === postSlug);
    if (post) {
      return {
        title: `${post.title} | PDFSun`,
        description: post.excerpt,
        canonicalUrl,
        ogTitle: post.title,
        ogDescription: post.excerpt,
        ogType: "article",
        ogImage: post.image || defaultOgImage,
        keywords: (post.tags || []).join(", ") + ", pdfsun, pdf guide",
        activeLang: langCode,
        isRtl,
        reciprocalHreflangs,
        jsonLdSchemas: [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.image || defaultOgImage,
            "datePublished": post.date,
            "dateModified": post.lastModified || post.date,
            "author": { "@type": "Person", "name": post.author },
            "publisher": {
              "@type": "Organization",
              "name": "PDFSun",
              "logo": { "@type": "ImageObject", "url": `${baseUrl}/logo.png` },
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
          },
          ...(post.faqs && post.faqs.length > 0
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": post.faqs.map((f) => ({
                    "@type": "Question",
                    "name": f.question,
                    "acceptedAnswer": { "@type": "Answer", "text": f.answer },
                  })),
                },
              ]
            : []),
        ],
        crawlableHtml: `
          <article dir="${isRtl ? 'rtl' : 'ltr'}" style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
            <h1>${post.title}</h1>
            <p style="font-weight: bold; color: #475569;">${post.excerpt}</p>
            <p><small>Published by ${post.author} on ${post.date}</small></p>
            <div>${post.executiveSummary ? `<div style="background: #f1f5f9; padding: 16px; border-radius: 8px;"><strong>Executive Summary:</strong> ${post.executiveSummary}</div>` : ""}</div>
            ${post.faqs ? `<h2>Frequently Asked Questions</h2>${post.faqs.map((f) => `<div><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}` : ""}
          </article>
        `,
      };
    }
  }

  // -------------------------------------------------------------
  // Route 5: Target Size Programmatic SEO Pages (e.g. /compress-pdf-to-200kb)
  // -------------------------------------------------------------
  const sizeMatch = subRoute.match(/^\/compress-pdf-to-(\d+)(kb|mb)$/i);
  if (sizeMatch) {
    const rawSize = `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}`;
    const pseoPage = generateCompressSizePseoPage(rawSize, "Global");
    return {
      title: pseoPage.seoTitle,
      description: pseoPage.seoDescription,
      canonicalUrl,
      ogTitle: pseoPage.headline,
      ogDescription: pseoPage.seoDescription,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: `compress pdf to ${rawSize}, reduce pdf size to ${rawSize} free, shrink pdf to ${rawSize} online, pdf under ${rawSize}`,
      activeLang: langCode,
      isRtl,
      reciprocalHreflangs,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": ["WebApplication", "SoftwareApplication"],
          "name": pseoPage.headline,
          "url": canonicalUrl,
          "description": pseoPage.seoDescription,
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to Compress PDF to ${rawSize.toUpperCase()} Online Free`,
          "step": pseoPage.howToSteps.map((s) => ({
            "@type": "HowToStep",
            "position": s.position,
            "name": s.name,
            "text": s.text,
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": pseoPage.customFaqs.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Compress PDF", "item": `${baseUrl}/compress-pdf` },
            { "@type": "ListItem", "position": 3, "name": pseoPage.headline, "item": canonicalUrl },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PDFSun",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
        },
      ],
      crawlableHtml: `
        <article dir="${isRtl ? 'rtl' : 'ltr'}" style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>${pseoPage.headline}</h1>
          <p>${pseoPage.subheadline}</p>
          <div style="background: #e0f2fe; padding: 12px; border-radius: 6px; margin: 16px 0;">
            <strong>${pseoPage.complianceBadge}</strong>: ${pseoPage.intentBlockText}
          </div>
          <h2>Step-by-Step Instructions</h2>
          <ol>
            ${pseoPage.howToSteps.map((s) => `<li><strong>${s.name}</strong>: ${s.text}</li>`).join("")}
          </ol>
          <h2>Frequently Asked Questions</h2>
          ${pseoPage.customFaqs.map((f) => `<div><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}
        </article>
      `,
    };
  }

  // -------------------------------------------------------------
  // Route 6: Curated pSEO Landing Pages (e.g. /merge-pdf-without-email, /sign-pdf-online-free)
  // -------------------------------------------------------------
  const matchedPseo = matchPSEORoute(subRoute);
  if (matchedPseo) {
    return {
      title: matchedPseo.seoTitle,
      description: matchedPseo.seoDescription,
      canonicalUrl,
      ogTitle: matchedPseo.headline,
      ogDescription: matchedPseo.seoDescription,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: `${matchedPseo.headline.toLowerCase()}, online pdf free, no watermark, no email, pdfsun`,
      activeLang: langCode,
      isRtl,
      reciprocalHreflangs,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": ["WebApplication", "SoftwareApplication"],
          "name": matchedPseo.headline,
          "url": canonicalUrl,
          "description": matchedPseo.seoDescription,
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to Use ${matchedPseo.headline}`,
          "step": matchedPseo.howToSteps.map((s) => ({
            "@type": "HowToStep",
            "position": s.position,
            "name": s.name,
            "text": s.text,
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": matchedPseo.customFaqs.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "PDF Tools", "item": `${baseUrl}/#tools` },
            { "@type": "ListItem", "position": 3, "name": matchedPseo.headline, "item": canonicalUrl },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PDFSun",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
        },
      ],
      crawlableHtml: `
        <article dir="${isRtl ? 'rtl' : 'ltr'}" style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6;">
          <h1>${matchedPseo.headline}</h1>
          <p>${matchedPseo.subheadline}</p>
          <h2>Key Features</h2>
          <ul>
            ${matchedPseo.featureHighlights.map((f) => `<li>${f}</li>`).join("")}
          </ul>
          <h2>How To Guide</h2>
          <ol>
            ${matchedPseo.howToSteps.map((s) => `<li><strong>${s.name}</strong>: ${s.text}</li>`).join("")}
          </ol>
          <h2>Frequently Asked Questions</h2>
          ${matchedPseo.customFaqs.map((f) => `<div><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}
        </article>
      `,
    };
  }

  // -------------------------------------------------------------
  // Route 7: Core Individual Tool Pages (e.g. /merge-pdf, /hi/pdf-to-word, /es/compress-pdf, etc.)
  // Full 66 Registered Tools Support with Multilingual Localized Intelligence
  // -------------------------------------------------------------
  const toolSlug = subRoute.replace(/^\//, "").replace(/\/+$/, "");
  const matchedTool = ALL_TOOLS.find((t) => t.slug === toolSlug || t.id === toolSlug);

  if (matchedTool) {
    // 1. Resolve localized name and description
    const localized = (TOOL_TRANSLATIONS as any)[langCode]?.[matchedTool.slug] ||
                      (TOOL_TRANSLATIONS as any)[langCode]?.[matchedTool.id] ||
                      (TOOL_TRANSLATIONS as any)[langCode.split("-")[0]]?.[matchedTool.slug];

    const localizedName = localized?.name || matchedTool.name;
    const localizedDesc = localized?.desc || matchedTool.description;

    // 2. Build high-CTR localized page title
    const toolTitle = buildLocalizedToolTitle(localizedName, langCode);
    const toolDesc = buildLocalizedToolDescription(localizedName, localizedDesc, langCode);

    // 3. Build localized FAQs for Schema.org and Crawlable HTML
    const localizedFaqs = buildLocalizedToolFaqs(localizedName, langCode);

    // 4. Build localized HowTo steps
    const localizedSteps = buildLocalizedToolSteps(localizedName, langCode);

    return {
      title: toolTitle,
      description: toolDesc,
      canonicalUrl,
      ogTitle: `${localizedName} | PDFSun`,
      ogDescription: toolDesc,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: `${localizedName.toLowerCase()}, ${matchedTool.slug}, online pdf ${matchedTool.name.toLowerCase()}, private pdf tool, wasm, pdfsun`,
      activeLang: langCode,
      isRtl,
      reciprocalHreflangs,
      jsonLdSchemas: [
        {
          "@context": "https://schema.org",
          "@type": ["WebApplication", "SoftwareApplication"],
          "name": `${localizedName} - PDFSun`,
          "url": canonicalUrl,
          "description": localizedDesc,
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All (Web, Windows, macOS, Linux, Android, iOS)",
          "inLanguage": langCode,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to use ${localizedName} Online Free`,
          "step": localizedSteps.map((s, idx) => ({
            "@type": "HowToStep",
            "position": idx + 1,
            "name": s.title,
            "text": s.instruction,
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": localizedFaqs.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "PDF Tools", "item": `${baseUrl}/#tools` },
            { "@type": "ListItem", "position": 3, "name": localizedName, "item": canonicalUrl },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PDFSun",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
        },
      ],
      crawlableHtml: `
        <article dir="${isRtl ? 'rtl' : 'ltr'}" style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>${toolTitle}</h1>
          <p>${toolDesc}</p>
          
          <h2>${getStepHeading(langCode)}</h2>
          <ol>
            ${localizedSteps.map((s) => `<li><strong>${s.title}</strong>: ${s.instruction}</li>`).join("")}
          </ol>

          <h2>${getFaqHeading(langCode)}</h2>
          ${localizedFaqs.map((f) => `<div><h3>${f.question}</h3><p>${f.answer}</p></div>`).join("")}

          <section class="geo-insights" style="margin-top: 32px; padding: 16px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <h3>Privacy Guarantee &amp; Document Intelligence Specifications</h3>
            <p><strong>Zero Server Ingress:</strong> All document parsing and conversion execute directly inside the client browser sandbox using compiled WebAssembly. Files never leave your device.</p>
            <p><strong>Financial &amp; Enterprise Security:</strong> Safe for sensitive GST invoices, bank statements, tax documents, and legal contracts with AES-256 integrity.</p>
            <p><strong>Compliance:</strong> GDPR, CCPA, and HIPAA privacy-by-design compliant.</p>
          </section>
        </article>
      `,
    };
  }

  // -------------------------------------------------------------
  // Route 8: Static Legal & Informational Pages
  // -------------------------------------------------------------
  const staticPolicies: Record<string, { title: string; desc: string; html: string }> = {
    "/privacy-policy": {
      title: "Privacy Policy - Military-Grade In-Browser Document Protection | PDFSun",
      desc: "Official PDFSun Privacy Policy. Zero server upload, 100% client-side WebAssembly processing, Gemini AI privacy, and Google AdSense cookie disclosures.",
      html: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>Privacy Policy - PDFSun (pdfsun.in)</h1>
          <p><strong>Effective Date: 2026 • Canonical URL: https://www.pdfsun.in/privacy-policy</strong></p>
          <p>At PDFSun, operated by Mukesh Kalonia, user privacy and document confidentiality are fundamental engineering commitments.</p>
          <h2>1. Local Client-Side Processing (Zero Server Ingress)</h2>
          <p>All core PDF utilities execute 100% locally inside your web browser sandbox using compiled WebAssembly (WASM). Your original documents, file bytes, and processed outputs are never transmitted to, processed on, or stored in remote cloud servers.</p>
          <h2>2. AI Document Processing &amp; Ephemeral Inference</h2>
          <p>When you explicitly utilize Gemini AI utilities, document text passages are transmitted securely over encrypted TLS HTTPS strictly for ephemeral computational inference and purged immediately upon completion.</p>
          <h2>3. Google AdSense &amp; Third-Party Advertising Cookies</h2>
          <p>PDFSun partners with Google AdSense. Advertising cookies have absolute zero access to your uploaded files, document contents, filenames, or extracted text.</p>
          <h2>4. Contact Support &amp; Grievance Redressal</h2>
          <p>For any privacy-related inquiries, contact Platform Operator Mukesh Kalonia at <a href="mailto:mukeshinland79@gmail.com">mukeshinland79@gmail.com</a>.</p>
        </article>
      `,
    },
    "/terms-of-service": {
      title: "Terms of Service | PDFSun",
      desc: "Official Terms of Service for PDFSun (pdfsun.in). Acceptable use guidelines, browser stability, and service terms.",
      html: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>Terms of Service - PDFSun (pdfsun.in)</h1>
          <p>By accessing or using PDFSun (https://www.pdfsun.in/), you agree to comply with and be bound by these Terms of Service.</p>
          <h2>1. Acceptable Use</h2>
          <p>You agree not to upload malicious files, copyrighted material without permission, or attempt reverse engineering of PDFSun engines.</p>
          <h2>2. Service Availability</h2>
          <p>PDFSun is provided 'as is' with maximum uptime guarantees and high-speed in-browser WebAssembly performance.</p>
        </article>
      `,
    },
    "/about-us": {
      title: "About PDFSun - The Zero-Knowledge Client-Side PDF Engine",
      desc: "Learn about PDFSun, founded by Mukesh Kalonia. High-speed client-side WebAssembly document processing with 100% privacy.",
      html: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>About PDFSun - Mission &amp; Technology</h1>
          <p>PDFSun (pdfsun.in) is an independent, high-performance web document platform founded and actively maintained by Mukesh Kalonia, providing fast, secure, and intuitive PDF utilities with 100% in-browser WebAssembly privacy.</p>
        </article>
      `,
    },
    "/contact-us": {
      title: "Contact PDFSun Support & Partnerships",
      desc: "Contact the PDFSun engineering and support team. Inquiries, bug reports, and partnership support with 24 business hour response.",
      html: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>Contact Us &amp; Support - PDFSun</h1>
          <p>Official Support Email: <a href="mailto:mukeshinland79@gmail.com">mukeshinland79@gmail.com</a></p>
          <p>Platform Operator: Mukesh Kalonia (Headquarters: Rajasthan, India)</p>
        </article>
      `,
    },
    "/cookie-policy": {
      title: "Cookie Policy | PDFSun",
      desc: "Official Cookie Policy for PDFSun (pdfsun.in). Explains essential storage and third-party advertising cookies.",
      html: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>Cookie Policy - PDFSun (pdfsun.in)</h1>
          <p>Essential local storage is used for preferences and themes. Google AdSense advertising cookies comply with standard opt-out policies.</p>
        </article>
      `,
    },
    "/refund-policy": {
      title: "Refund Policy | PDFSun",
      desc: "Official 14-day refund policy for PDFSun Pro Sun and Team Enterprise subscription purchases.",
      html: `
        <article style="max-width: 800px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <h1>Refund Policy - PDFSun (pdfsun.in)</h1>
          <p>We offer a 14-day refund policy for Pro Sun and Team Enterprise subscription purchases on PDFSun. Contact mukeshinland79@gmail.com.</p>
        </article>
      `,
    },
  };

  const activeStaticPolicy = staticPolicies[subRoute];
  if (activeStaticPolicy) {
    return {
      title: activeStaticPolicy.title,
      description: activeStaticPolicy.desc,
      canonicalUrl,
      ogTitle: activeStaticPolicy.title,
      ogDescription: activeStaticPolicy.desc,
      ogType: "website",
      ogImage: defaultOgImage,
      keywords: "pdfsun policy, pdf privacy, terms of service, pdfsun contact, cookie policy, refund policy",
      activeLang: langCode,
      isRtl,
      reciprocalHreflangs,
      jsonLdSchemas: [],
      crawlableHtml: activeStaticPolicy.html,
    };
  }

  // Fallback to Home metadata with active canonical
  return {
    title: "PDFSun - Free Online PDF Tools | Merge, Compress, Split & Convert PDF",
    description: "100% private, free online PDF tools. Merge, compress, split, convert, and sign PDF documents directly in your browser with zero server uploads.",
    canonicalUrl,
    ogTitle: "PDFSun - Free Online PDF Tools",
    ogDescription: "Fast, 100% private in-browser PDF utilities powered by WebAssembly.",
    ogType: "website",
    ogImage: defaultOgImage,
    keywords: "free pdf tools, merge pdf, compress pdf, split pdf, pdfsun",
    activeLang: langCode,
    isRtl,
    reciprocalHreflangs,
    jsonLdSchemas: [],
    crawlableHtml: `<article dir="${isRtl ? 'rtl' : 'ltr'}"><h1>PDFSun Document Suite</h1></article>`,
  };
}

/**
 * Injects route-specific SEO tags, canonical link, OpenGraph metadata, JSON-LD schemas,
 * language/RTL HTML direction, and semantic crawlable fallback content into the base index.html template string.
 */
export function injectSeoTagsIntoHtml(htmlTemplate: string, rawPath: string, queryParams: Record<string, any> = {}): string {
  const seo = getSeoMetadataForPath(rawPath, queryParams);

  let updatedHtml = htmlTemplate;

  // 1. Synchronize <html lang="..." dir="...">
  updatedHtml = updatedHtml.replace(
    /<html\s+([^>]*?)lang="[^"]*"/is,
    `<html $1lang="${seo.activeLang}" dir="${seo.isRtl ? 'rtl' : 'ltr'}"`
  );
  if (!updatedHtml.includes(`dir="`)) {
    updatedHtml = updatedHtml.replace(/<html/i, `<html dir="${seo.isRtl ? 'rtl' : 'ltr'}"`);
  }

  // 2. Replace <title>
  updatedHtml = updatedHtml.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(seo.title)}</title>`);

  // 3. Replace <meta name="description" content="..." />
  updatedHtml = updatedHtml.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/is,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`
  );

  // 4. Replace <meta name="keywords" content="..." />
  if (updatedHtml.includes('name="keywords"')) {
    updatedHtml = updatedHtml.replace(
      /<meta\s+name="keywords"\s+content=".*?"\s*\/?>/is,
      `<meta name="keywords" content="${escapeHtml(seo.keywords)}" />`
    );
  }

  // 5. Replace <link rel="canonical" href="..." /> AND inject reciprocal hreflang tags
  updatedHtml = updatedHtml.replace(
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/is,
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />\n    ${seo.reciprocalHreflangs}`
  );

  // 6. Replace OpenGraph og:title, og:description, og:url, og:type, og:image
  updatedHtml = updatedHtml.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:title" content="${escapeHtml(seo.ogTitle)}" />`
  );
  updatedHtml = updatedHtml.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:description" content="${escapeHtml(seo.ogDescription)}" />`
  );
  updatedHtml = updatedHtml.replace(
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/is,
    `<meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />`
  );

  // 7. Replace Twitter Card title & description
  updatedHtml = updatedHtml.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/is,
    `<meta name="twitter:title" content="${escapeHtml(seo.ogTitle)}" />`
  );
  updatedHtml = updatedHtml.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/is,
    `<meta name="twitter:description" content="${escapeHtml(seo.ogDescription)}" />`
  );

  // 8. Inject Route-Specific JSON-LD schemas right before </head>
  if (seo.jsonLdSchemas && seo.jsonLdSchemas.length > 0) {
    const jsonLdScripts = seo.jsonLdSchemas
      .map((schema) => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
      .join("\n");
    updatedHtml = updatedHtml.replace("</head>", `${jsonLdScripts}\n</head>`);
  }

  // 9. Replace semantic <noscript> crawlable content so bots get accurate page content
  if (seo.crawlableHtml) {
    updatedHtml = updatedHtml.replace(
      /<noscript>[\s\S]*?<\/noscript>/i,
      `<noscript>\n<div class="crawlable-seo-fallback" style="padding: 24px; max-width: 900px; margin: 0 auto; font-family: sans-serif;">\n${seo.crawlableHtml}\n</div>\n</noscript>`
    );
  }

  return updatedHtml;
}

// -------------------------------------------------------------
// Helper Localization Generators
// -------------------------------------------------------------

function buildLocalizedToolTitle(toolName: string, lang: string): string {
  switch (lang) {
    case "hi":
      return `${toolName} ऑनलाइन मुफ़्त - 100% प्राइवेट इन-ब्राउज़र | PDFSun`;
    case "es":
      return `${toolName} Gratis en Línea - 100% Privado en Navegador | PDFSun`;
    case "fr":
      return `${toolName} Gratuit en Ligne - 100% Privé dans le Navigateur | PDFSun`;
    case "de":
      return `${toolName} Kostenlos Online - 100% Sicher im Browser | PDFSun`;
    case "ar":
      return `${toolName} مجاناً أونلاين - خصوصية تامة في المتصفح | PDFSun`;
    case "pt":
      return `${toolName} Grátis Online - 100% Privado no Navegador | PDFSun`;
    case "ja":
      return `${toolName} 無料オンライン - 完全プライベート・ブラウザ処理 | PDFSun`;
    case "ru":
      return `${toolName} Бесплатно Онлайн - 100% Конфиденциально в Браузере | PDFSun`;
    case "zh-CN":
    case "zh-TW":
      return `${toolName} 免费在线工具 - 100% 浏览器本地隐私处理 | PDFSun`;
    case "bn":
      return `${toolName} বিনামূল্যে অনলাইনে - ১০০% গোপনীয় ব্রাউজার প্রসেসিং | PDFSun`;
    case "mr":
      return `${toolName} मोफत ऑनलाइन - १००% खाजगी इन-ब्राउझर | PDFSun`;
    case "gu":
      return `${toolName} મફત ઓનલાઇન - 100% ખાનગી ઇન-બ્રાઉઝર | PDFSun`;
    default:
      return `${toolName} Online Free - 100% Private In-Browser | PDFSun`;
  }
}

function buildLocalizedToolDescription(toolName: string, desc: string, lang: string): string {
  switch (lang) {
    case "hi":
      return `${desc} मुफ़्त, तेज़ और सुरक्षित। शून्य सर्वर अपलोड, वेबअसेंबली के साथ सीधे अपने ब्राउज़र में सुरक्षित प्रोसेसिंग करें।`;
    case "es":
      return `${desc} Gratis, rápido y seguro. Cero subidas al servidor, procesamiento WebAssembly 100% privado en tu navegador.`;
    case "fr":
      return `${desc} Gratuit, rapide et privé. Zéro téléchargement sur serveur, traitement WebAssembly 100% local dans votre navigateur.`;
    case "de":
      return `${desc} Kostenlos, schnell und privat. Keine Server-Uploads, 100% lokale WebAssembly-Verarbeitung im Browser.`;
    case "ar":
      return `${desc} مجاني وسريع وآمن 100%. بدون رفع على خوادم خارجية، معالجة فورية عبر الويب أسيمبلي داخل متصفحك.`;
    case "pt":
      return `${desc} Grátis, rápido e seguro. Sem envio para servidores, processamento WebAssembly 100% local no navegador.`;
    case "ja":
      return `${desc} 無料・高速・安全。サーバーへのアップロードなし、WebAssemblyでブラウザ内ローカル処理。`;
    case "ru":
      return `${desc} Бесплатно, быстро и безопасно. Без отправки на сервер, 100% локальная обработка через WebAssembly в браузере.`;
    case "zh-CN":
    case "zh-TW":
      return `${desc} 免费、极速、安全。零服务器上传，基于 WebAssembly 的 100% 浏览器本地安全处理。`;
    default:
      return `${desc} Free, fast, zero server uploads. Process PDFs securely with client-side WebAssembly on PDFSun.`;
  }
}

function buildLocalizedToolFaqs(toolName: string, lang: string): Array<{ question: string; answer: string }> {
  switch (lang) {
    case "hi":
      return [
        {
          question: `क्या ${toolName} का उपयोग पूरी तरह मुफ़्त है?`,
          answer: `हाँ! PDFSun पर ${toolName} 100% मुफ़्त है। किसी भी पंजीकरण या ईमेल की आवश्यकता नहीं है।`,
        },
        {
          question: `क्या मेरी फ़ाइलें सुरक्षित और प्राइवेट रहेंगी?`,
          answer: `बिल्कुल। प्रोसेसिंग आपके डिवाइस के ब्राउज़र में WebAssembly के माध्यम से स्थानीय रूप से होती है। आपकी फ़ाइलें कभी सर्वर पर अपलोड नहीं होतीं।`,
        },
        {
          question: `क्या मैं इसे मोबाइल फोन पर इस्तेमाल कर सकता हूँ?`,
          answer: `हाँ, PDFSun सभी आधुनिक स्मार्टफोन और डेस्कटॉप ब्राउज़र (Chrome, Safari, Firefox, Edge) पर सुचारू रूप से काम करता है।`,
        },
      ];
    case "es":
      return [
        {
          question: `¿Es gratis usar ${toolName}?`,
          answer: `¡Sí! ${toolName} en PDFSun es 100% gratuito, sin necesidad de registro ni correo electrónico.`,
        },
        {
          question: `¿Están seguros y privados mis documentos?`,
          answer: `Absolutamente. El procesamiento se ejecuta en el navegador con WebAssembly. Tus archivos nunca salen de tu dispositivo.`,
        },
        {
          question: `¿Funciona en teléfonos móviles?`,
          answer: `Sí, funciona perfectamente en Android, iOS, Windows y macOS.`,
        },
      ];
    case "fr":
      return [
        {
          question: `Est-ce que ${toolName} est gratuit ?`,
          answer: `Oui ! ${toolName} sur PDFSun est 100% gratuit sans inscription ni adresse email requise.`,
        },
        {
          question: `Mes fichiers sont-ils sécurisés et privés ?`,
          answer: `Absolument. Tout le traitement se fait localement dans votre navigateur via WebAssembly. Vos fichiers ne sont jamais envoyés sur un serveur.`,
        },
      ];
    case "de":
      return [
        {
          question: `Ist die Nutzung von ${toolName} kostenlos?`,
          answer: `Ja! ${toolName} auf PDFSun ist zu 100% kostenlos ohne Registrierung oder E-Mail.`,
        },
        {
          question: `Sind meine Dokumente sicher und privat?`,
          answer: `Ja. Die Verarbeitung erfolgt lokal im Browser mit WebAssembly. Ihre Dateien werden niemals auf fremde Server geladen.`,
        },
      ];
    case "ar":
      return [
        {
          question: `هل استخدام ${toolName} مجاني تماماً؟`,
          answer: `نعم! أداة ${toolName} على PDFSun مجانية 100% ولا تتطلب أي تسجيل أو بريد إلكتروني.`,
        },
        {
          question: `هل ملفاتي آمنة ومحمية الخصوصية؟`,
          answer: `نعم بكل تأكيد. تتم المعالجة بالكامل محلياً داخل متصفحك بتقنية WebAssembly دون نقل ملفاتك إلى أي خادم خارجي.`,
        },
      ];
    default:
      return [
        {
          question: `Is ${toolName} free to use?`,
          answer: `Yes! ${toolName} on PDFSun is 100% free with no registration or email needed.`,
        },
        {
          question: `Are my files private when using ${toolName}?`,
          answer: `Yes. All processing executes client-side inside your browser via WebAssembly. Your files never touch external servers.`,
        },
        {
          question: `Can I use ${toolName} on mobile devices?`,
          answer: `Yes, PDFSun works seamlessly across all modern mobile and desktop browsers including iOS Safari, Android Chrome, and Windows Edge.`,
        },
      ];
  }
}

function buildLocalizedToolSteps(toolName: string, lang: string): Array<{ title: string; instruction: string }> {
  switch (lang) {
    case "hi":
      return [
        { title: "दस्तावेज़ चुनें", instruction: "अपने डिवाइस से फ़ाइल चुनें या कार्यक्षेत्र में ड्रैग और ड्रॉप करें।" },
        { title: "प्रोसेस करें", instruction: "अपनी प्राथमिकताएं चुनें और इन-ब्राउज़र वेबअसेंबली प्रोसेसिंग शुरू करें।" },
        { title: "तुरंत डाउनलोड करें", instruction: "तैयार दस्तावेज़ सीधे अपने डिवाइस पर तुरंत सेव करें।" },
      ];
    case "es":
      return [
        { title: "Seleccionar archivo", instruction: "Elige o arrastra y suelta tu documento en el espacio de trabajo." },
        { title: "Procesar", instruction: "Configura tus opciones y ejecuta la conversión local en el navegador." },
        { title: "Descarga instantánea", instruction: "Descarga tu documento terminado directamente en tu dispositivo." },
      ];
    case "fr":
      return [
        { title: "Sélectionner le fichier", instruction: "Glissez-déposez ou sélectionnez votre document dans l'espace de travail." },
        { title: "Traiter", instruction: "Configurez vos options et lancez le traitement in-browser WebAssembly." },
        { title: "Téléchargement immédiat", instruction: "Téléchargez votre fichier traité directement sur votre appareil." },
      ];
    case "de":
      return [
        { title: "Datei auswählen", instruction: "Wählen oder ziehen Sie Ihr Dokument per Drag-and-Drop in den Arbeitsbereich." },
        { title: "Verarbeiten", instruction: "Passen Sie die Einstellungen an und starten Sie die lokale WebAssembly-Verarbeitung." },
        { title: "Sofort herunterladen", instruction: "Laden Sie Ihr fertiges Dokument direkt auf Ihr Gerät herunter." },
      ];
    case "ar":
      return [
        { title: "اختيار الملف", instruction: "اختر أو اسحب وأفلت مستندك في مساحة العمل." },
        { title: "بدء المعالجة", instruction: "اضبط الخيارات المطلوبة وابدأ المعالجة الفورية داخل المتصفح." },
        { title: "تحميل فوري", instruction: "حمّل مستندك المعالج مباشرة إلى جهازك بدون انتظار." },
      ];
    default:
      return [
        { title: "Select File", instruction: "Choose or drag and drop your document into the tool workspace." },
        { title: "Configure & Process", instruction: "Adjust options and execute instant in-browser WebAssembly processing." },
        { title: "Instant Download", instruction: "Download your transformed document directly to your device." },
      ];
  }
}

function getStepHeading(lang: string): string {
  switch (lang) {
    case "hi": return "चरण-दर-चरण निर्देश (How to use)";
    case "es": return "Instrucciones paso a paso";
    case "fr": return "Instructions étape par étape";
    case "de": return "Schritt-für-Schritt-Anleitung";
    case "ar": return "خطوات الاستخدام خطوة بخطوة";
    case "pt": return "Instruções passo a passo";
    case "ja": return "ステップバイステップの手順";
    case "ru": return "Пошаговая инструкция";
    case "zh-CN":
    case "zh-TW": return "分步使用说明";
    default: return "Step-by-Step Instructions";
  }
}

function getFaqHeading(lang: string): string {
  switch (lang) {
    case "hi": return "अक्सर पूछे जाने वाले प्रश्न (FAQ)";
    case "es": return "Preguntas frecuentes";
    case "fr": return "Foire aux questions (FAQ)";
    case "de": return "Häufig gestellte Fragen (FAQ)";
    case "ar": return "الأسئلة الشائعة (FAQ)";
    case "pt": return "Perguntas Frequentes (FAQ)";
    case "ja": return "よくある質問 (FAQ)";
    case "ru": return "Часто задаваемые вопросы (FAQ)";
    case "zh-CN":
    case "zh-TW": return "常见问题解答 (FAQ)";
    default: return "Frequently Asked Questions";
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
