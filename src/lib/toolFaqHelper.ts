import { ToolItem } from "../types";

export interface ToolFAQ {
  question: string;
  answer: string;
}

/**
 * Curated, comprehensive functional FAQ definitions for specific tools.
 * Each entry answers real search intent and explains exact tool mechanics.
 */
export const TOOL_SPECIFIC_FAQS: Record<string, ToolFAQ[]> = {
  "merge-pdf": [
    {
      question: "How do I combine multiple PDF files into one single document?",
      answer: "To merge PDFs on PDFSun, drag and drop all your PDF documents into the workspace. Reorder the file cards to arrange your desired sequence, then click 'Merge PDF' to immediately download your consolidated document.",
    },
    {
      question: "Is there a limit on how many PDF files or pages I can merge?",
      answer: "No! PDFSun allows you to merge dozens of PDF files and hundreds of pages simultaneously directly inside your browser with zero limits, zero fees, and no file size restrictions.",
    },
    {
      question: "Will merging PDF files alter original font formatting or image quality?",
      answer: "Not at all. PDFSun combines underlying PDF byte streams, page trees, and embedded fonts without rasterizing text, preserving 100% of your original document clarity and vector fidelity.",
    },
    {
      question: "Are my uploaded PDF files kept secure and private during merging?",
      answer: "Yes, 100% private. All PDF merging operations execute locally inside your web browser via client-side WebAssembly. Your documents are never uploaded to, processed on, or stored in remote cloud servers.",
    },
    {
      question: "Can I merge PDF files on my iPhone, Android phone, or Mac?",
      answer: "Yes! PDFSun works seamlessly across all modern mobile and desktop browsers including Apple Safari, Google Chrome, Mozilla Firefox, and Microsoft Edge without installing third-party apps.",
    },
  ],

  "split-pdf": [
    {
      question: "How do I extract specific page ranges (e.g. 1-5, 8, 12-20) from a PDF?",
      answer: "Upload your document to Split PDF, choose 'Custom Page Range', enter your desired pages or intervals (such as '1-5, 8, 12-20'), and click 'Split PDF' to immediately download your extracted PDF file.",
    },
    {
      question: "Can I split every page into separate individual single-page PDF files?",
      answer: "Yes! Select the 'Extract All Pages' mode to automatically separate every page in your document into its own individual PDF file, delivered neatly packaged in a single downloadable ZIP archive.",
    },
    {
      question: "Does splitting a PDF reduce its visual resolution or damage searchable text?",
      answer: "No. Splitting extracts the native PDF page objects directly from the file structure without modifying typography, clickable hyperlinks, bookmarks, or vector artwork.",
    },
    {
      question: "How can I split password-protected or encrypted PDF documents?",
      answer: "If your document has an open password, first unlock it using our free Unlock PDF tool, and then split or extract pages freely.",
    },
    {
      question: "Is Split PDF free and private on PDFSun?",
      answer: "Yes, Split PDF is completely free with no watermarks and no registration required. All processing runs 100% client-side in your browser for absolute data confidentiality.",
    },
  ],

  "compress-pdf": [
    {
      question: "How does PDF compression reduce file size without losing text clarity?",
      answer: "PDFSun Compress optimizes internal PDF structure by removing redundant metadata, consolidating embedded font tables, stripping unreferenced objects, and applying intelligent image downsampling so typography and vector graphics remain razor sharp.",
    },
    {
      question: "Can I compress a PDF to a specific size limit for email, job portals, or government portals (under 200KB, 500KB, or 1MB)?",
      answer: "Yes! PDFSun offers multiple compression presets (Extreme Compression, Recommended Balanced, and Low Compression) allowing you to shrink large multi-megabyte PDFs down to meet strict attachment and portal upload limits.",
    },
    {
      question: "How much file size reduction can I expect on scanned PDFs and images?",
      answer: "Documents containing high-resolution scans, photos, or complex graphics typically achieve 40% to 85% file size reduction, while text-heavy PDFs with embedded fonts are efficiently streamlined.",
    },
    {
      question: "Are my confidential business, financial, and tax documents safe when compressed?",
      answer: "Absolutely. PDFSun processes your documents locally using client-side WebAssembly. Your files are never sent over the internet or stored on external servers.",
    },
    {
      question: "Does compressing a PDF strip interactive form fields, bookmarks, or links?",
      answer: "No. PDFSun preserves active form fields, table of contents bookmarks, internal links, and searchable text layers while minimizing byte weight.",
    },
  ],

  "rotate-pdf": [
    {
      question: "How do I rotate sideways or upside-down PDF pages?",
      answer: "Upload your document to Rotate PDF, click the rotate controls (90° clockwise, 90° counter-clockwise, or 180° inversion), and click 'Rotate PDF' to save and download your properly oriented document immediately.",
    },
    {
      question: "Can I rotate specific individual pages without rotating the whole document?",
      answer: "Yes! PDFSun displays live interactive visual thumbnails for every page. You can rotate individual pages independently by clicking the rotation icon on that specific page thumbnail, or click 'Rotate All' to adjust the entire file at once.",
    },
    {
      question: "Is the page rotation permanent in Adobe Acrobat, Apple Preview, and mobile readers?",
      answer: "Yes! PDFSun updates the internal PDF page dictionary `/Rotate` attribute and reconstructs the coordinate transformation matrix so your orientation changes are permanently recognized across all PDF software and operating systems.",
    },
    {
      question: "Can I rotate scanned landscape spreadsheets, invoices, or blueprints to portrait?",
      answer: "Absolutely. Rotate PDF easily corrects upside-down and sideways scans from photocopiers, mobile phone scanners, receipts, architectural plans, and financial reports.",
    },
    {
      question: "Are my documents safe and private when using Rotate PDF?",
      answer: "Yes, 100% private. All PDF page rotation is executed entirely within your browser using client-side WebAssembly. No files or personal data are ever uploaded to remote servers.",
    },
  ],

  "protect-pdf": [
    {
      question: "How does PDF password protection work on PDFSun?",
      answer: "Protect PDF encrypts your document with bank-grade 256-bit AES encryption. You can set an open password required to view the document, as well as permission restrictions against unauthorized copying, printing, and editing.",
    },
    {
      question: "Is my password or encrypted PDF uploaded to any cloud server?",
      answer: "No. All encryption and key generation take place directly inside your browser using the native Web Cryptography API. Neither your document nor your password is ever transmitted over the network.",
    },
    {
      question: "Can I set restrictions to prevent printing, copying text, or modifying pages?",
      answer: "Yes! You can configure granular permissions to disable text and image copying, prevent high-resolution printing, and block document alterations.",
    },
    {
      question: "How do I remove the password later if I need to make changes?",
      answer: "If you know the password, simply upload the file to our Unlock PDF tool, enter the password once, and download a completely unlocked, restriction-free version.",
    },
    {
      question: "Will protected PDFs open in Adobe Reader, Apple Preview, and mobile PDF viewers?",
      answer: "Yes. PDFSun generates standard ISO 32000-compliant PDF security envelopes that are universally supported across all PDF reading applications on Windows, Mac, iOS, Android, and Linux.",
    },
  ],

  "unlock-pdf": [
    {
      question: "How do I remove a password or restrictions from a protected PDF?",
      answer: "Upload your password-protected PDF to Unlock PDF, enter the owner or open password, and click 'Unlock PDF'. The tool strips encryption tags and delivers an unlocked PDF file ready for editing and printing.",
    },
    {
      question: "Can PDFSun unlock PDFs with forgotten passwords without knowing the key?",
      answer: "For owner-restricted documents (where printing or copying is locked without an open password), PDFSun can remove restrictions directly. For files locked with a strong user open password, the correct password must be entered to decrypt the AES byte stream.",
    },
    {
      question: "Is unlocking my PDF secure and confidential?",
      answer: "Yes. All decryption takes place locally inside your browser via WebAssembly. Your files and credentials remain strictly on your device.",
    },
  ],

  "watermark-pdf": [
    {
      question: "How do I add a text or logo watermark to a PDF?",
      answer: "Upload your document to Watermark PDF, choose between text (e.g., 'CONFIDENTIAL', 'DRAFT') or upload a PNG/JPG logo, adjust opacity, angle, font, and placement, then click 'Apply Watermark' to download.",
    },
    {
      question: "Can I watermark all pages or only specific pages?",
      answer: "You can apply the watermark across every page in the document or configure specific page ranges with a single click.",
    },
    {
      question: "Does the watermark appear above or below the original document text?",
      answer: "You can choose between foreground overlay (stamped on top of content) or background underlay (placed behind existing text and images) for subtle document branding.",
    },
  ],

  "remove-watermark": [
    {
      question: "How does the Remove Watermark tool clear background stamps and text?",
      answer: "Remove Watermark analyzes background graphic layers, text stamps, and color ranges to selectively erase unwanted watermarks and restore clean, legible PDF pages without degrading primary text content.",
    },
    {
      question: "Will removing a watermark affect the original document formatting?",
      answer: "No. The tool isolates overlay graphics while preserving document typography, vector lines, tables, and page layouts.",
    },
  ],

  "pdf-to-word": [
    {
      question: "How accurately does PDF to Word convert tables, headings, and fonts?",
      answer: "PDFSun uses an advanced layout-reconstruction engine that maps PDF text blocks into editable Microsoft Word (.docx) paragraphs, headings, bullet lists, and structured tables with original font styling.",
    },
    {
      question: "Can I edit the converted Word document in Microsoft Office, Google Docs, or LibreOffice?",
      answer: "Yes! The output is a standard OpenXML (.docx) file fully compatible with Microsoft Word 2016+, Office 365, Google Docs, Apple Pages, and LibreOffice Writer.",
    },
    {
      question: "Are scanned image PDFs converted into editable Word text?",
      answer: "For scanned or photo-based PDFs, combine PDF to Word with our OCR PDF tool to perform optical character recognition and extract fully editable text.",
    },
  ],

  "word-to-pdf": [
    {
      question: "How do I convert Microsoft Word documents (.docx, .doc) to PDF?",
      answer: "Simply drop your Word file into Word to PDF. The tool formats and compiles your document into a standardized, high-fidelity PDF file preserving exact margins, page breaks, and embedded imagery.",
    },
    {
      question: "Will my Word document layout shift or lose font styles when converted to PDF?",
      answer: "No. PDFSun embeds fonts and maintains exact point-by-point spacing so your converted PDF appears identical to your original Word layout on any screen or printer.",
    },
  ],

  "pdf-to-excel": [
    {
      question: "How does PDF to Excel extract tables and numerical data?",
      answer: "PDF to Excel scans cell coordinates, grid borders, and tabular alignments in your PDF, translating them into structured rows and columns inside an editable Microsoft Excel (.xlsx) or CSV spreadsheet.",
    },
    {
      question: "Can I convert multi-page bank statements, financial audits, or invoices to Excel?",
      answer: "Yes! PDF to Excel handles multi-page documents and extracts all tables across sequential pages into structured spreadsheet worksheets.",
    },
  ],

  "excel-to-pdf": [
    {
      question: "How does Excel to PDF fit wide spreadsheets and tables onto printable pages?",
      answer: "Excel to PDF automatically adjusts column scaling, margins, and orientation (portrait or landscape) to ensure your spreadsheet data fits cleanly on standard A4 or Letter PDF pages.",
    },
  ],

  "ocr-pdf": [
    {
      question: "What is OCR and how does it make scanned PDFs searchable?",
      answer: "Optical Character Recognition (OCR) analyzes bitmap images of scanned pages to identify letters, numbers, and symbols, generating an invisible text layer that allows you to search, highlight, and copy text from scanned PDFs.",
    },
    {
      question: "What languages are supported by PDFSun OCR?",
      answer: "PDFSun supports multi-language character recognition including English, Hindi, Spanish, French, German, Chinese, Japanese, and 25+ additional world languages.",
    },
  ],

  "ai-chat-pdf": [
    {
      question: "How does AI Chat with PDF work?",
      answer: "AI Chat with PDF uses Google Gemini 3.6 AI to read and understand your uploaded document. You can ask complex questions, verify facts, search for specific data points, and receive cited page references instantly.",
    },
    {
      question: "Can I chat with long 200+ page textbooks, legal contracts, or research papers?",
      answer: "Yes! PDFSun handles extensive multi-chapter documents, allowing students, researchers, and legal professionals to query large files in seconds.",
    },
    {
      question: "Is my document text kept secure and confidential when chatting with AI?",
      answer: "Yes. Document text is processed in-memory over secure TLS HTTPS connections and is never retained, sold, or used for model training.",
    },
  ],

  "ai-pdf-summary": [
    {
      question: "What formats of summaries does AI PDF Summary generate?",
      answer: "AI PDF Summary provides structured executive briefs, bulleted key takeaways, chapter-by-chapter breakdowns, and actionable action items formatted in clean markdown.",
    },
    {
      question: "How fast can AI summarize a lengthy report or research paper?",
      answer: "Summarization takes just 3 to 8 seconds, turning hundreds of pages of technical or academic text into concise, digestible notes.",
    },
  ],

  "edit-pdf-metadata": [
    {
      question: "What PDF metadata properties can I inspect and edit?",
      answer: "You can view and modify Title, Author, Subject, Keywords, Creator Tool, Producer, and Creation/Modification timestamps, as well as strip sensitive metadata for privacy before publishing.",
    },
  ],

  "view-pdf-metadata": [
    {
      question: "Why should I inspect PDF metadata before sharing files?",
      answer: "PDF metadata often contains hidden personal information including author names, internal company server paths, software versions, and creation dates. Inspecting metadata helps ensure sensitive details are removed before distribution.",
    },
  ],

  "organize-pdf": [
    {
      question: "How do I rearrange, delete, or duplicate pages in a PDF?",
      answer: "Upload your document to Organize PDF, then use visual drag-and-drop to reorder pages, click the trash icon to remove unwanted pages, or rotate individual page thumbnails before saving your new PDF.",
    },
  ],

  "sign-pdf": [
    {
      question: "Are electronic signatures created on PDFSun legally binding?",
      answer: "Yes! PDFSun complies with standard electronic signature requirements (such as ESIGN and eIDAS for standard commercial agreements). You can draw, type, or upload your signature and stamp it securely onto any page.",
    },
  ],

  "crop-pdf": [
    {
      question: "How do I crop margins or remove unwanted borders from PDF pages?",
      answer: "Upload your file to Crop PDF, drag the interactive crop bounding box to select your desired page area, and click 'Crop PDF' to trim away excess margins uniformly or on specific pages.",
    },
  ],

  "annotate-pdf": [
    {
      question: "What annotation tools are available for reviewing PDFs?",
      answer: "Annotate PDF provides freehand drawing pens, highlighters, sticky note comments, geometric shapes (rectangles, circles, arrows), and text callouts for collaborative document review.",
    },
  ],
};

/**
 * Generic category-specific fallback FAQ generator for tools without dedicated custom FAQ entries.
 */
export function getCategoryFallbackFaq(tool: ToolItem): ToolFAQ {
  switch (tool.category) {
    case "ai":
      return {
        question: `How does AI technology process files in ${tool.name}?`,
        answer: `${tool.name} utilizes secure Google Gemini 3.6 AI models to analyze, summarize, or extract structured data from your ${
          tool.supportedInput.length > 0 ? tool.supportedInput.join(" or ") : "PDF"
        } documents with enterprise-grade speed and precision.`,
      };
    case "security":
      return {
        question: `How does security and encryption work in ${tool.name}?`,
        answer: `${tool.name} applies browser-native 256-bit Web Cryptography API standards directly on your device to protect, encrypt, or modify security permissions for your documents.`,
      };
    case "convert":
      return {
        question: `Will ${tool.name} preserve the original formatting and visual layout?`,
        answer: `Yes! ${tool.name} uses advanced rendering pipelines to preserve text fonts, vector graphics, table structures, and page layouts when generating ${tool.outputFormat} files.`,
      };
    case "student":
      return {
        question: `Is ${tool.name} suitable for students and academic research papers?`,
        answer: `Absolutely. ${tool.name} is optimized for students, researchers, and educators to process textbooks, lecture notes, assignments, and study materials free of cost.`,
      };
    case "edit":
      return {
        question: `Can I reorder, annotate, or adjust pages using ${tool.name}?`,
        answer: `Yes! ${tool.name} offers a visual interactive workspace allowing you to configure, rearrange, and customize your files prior to exporting.`,
      };
    case "advanced":
    default:
      return {
        question: `What makes ${tool.name} on PDFSun fast and private?`,
        answer: `${tool.name} runs 100% in your browser using client-side WebAssembly technology. Your files are processed instantly with zero server uploads and zero data retention.`,
      };
  }
}

/**
 * Default global FAQs applicable to any tool on PDFSun.
 */
export function getDefaultToolFaqs(tool: ToolItem): ToolFAQ[] {
  const inputs = tool.supportedInput.length > 0 ? tool.supportedInput.join(" or ") : "PDF";
  return [
    {
      question: `How do I use ${tool.name} online on PDFSun?`,
      answer: `To use ${tool.name}: 1) Select or drag and drop your ${inputs} files into the workspace. 2) Adjust preferences or order if needed. 3) Click Process to instantly convert and download your ${tool.outputFormat} file.`,
    },
    {
      question: `Is ${tool.name} completely free to use without limits or watermarks?`,
      answer: `Yes! ${tool.name} on PDFSun is 100% free with no hidden fees, no required subscriptions, no mandatory account sign-ups, and no intrusive watermarks added to your exported files.`,
    },
    {
      question: `Are my files safe and private when using ${tool.name}?`,
      answer: `At PDFSun, privacy is paramount. ${tool.name} processes files client-side locally inside your browser via WebAssembly. Your documents are never uploaded to or permanently stored on external servers.`,
    },
    {
      question: `What file formats are supported by ${tool.name}?`,
      answer: `${tool.name} accepts ${
        tool.supportedInput.length > 0 ? tool.supportedInput.join(", ") : "PDF"
      } input files and produces high-quality ${tool.outputFormat} outputs.`,
    },
    {
      question: `Can I use ${tool.name} on mobile or tablet devices?`,
      answer: `Yes! ${tool.name} is fully responsive and compatible with all modern smartphones, tablets, Mac, Windows, iOS, and Android devices without installing extra software.`,
    },
    {
      question: `Do I need to install any software or app for ${tool.name}?`,
      answer: `No installation is required. ${tool.name} runs directly in any modern web browser such as Google Chrome, Apple Safari, Mozilla Firefox, or Microsoft Edge.`,
    },
  ];
}

/**
 * Multi-language translation templates for key FAQ questions & answers.
 * When the active language is non-English, these localized templates provide
 * native-language FAQPage JSON-LD schema and in-app accordion text.
 */
const LOCALIZED_FAQ_TEMPLATES: Record<string, { qTemplate: string; aTemplate: string; qFreeTemplate: string; aFreeTemplate: string; qPrivacyTemplate: string; aPrivacyTemplate: string }> = {
  hi: {
    qTemplate: "PDFSun पर ऑनलाइन {{toolName}} का उपयोग कैसे करें?",
    aTemplate: "{{toolName}} का उपयोग करने के लिए: 1) अपनी {{inputs}} फाइलें चुनें या ड्रैग-एंड-ड्रॉप करें। 2) अपनी आवश्यकतानुसार विकल्प सेट करें। 3) प्रोसेस पर क्लिक करके तुरंत अपनी {{outputFormat}} फाइल डाउनलोड करें।",
    qFreeTemplate: "क्या {{toolName}} का उपयोग पूरी तरह से मुफ़्त और बिना वॉटरमार्क के है?",
    aFreeTemplate: "हाँ! PDFSun पर {{toolName}} बिना किसी शुल्क, बिना किसी सीमा और बिना वॉटरमार्क के 100% मुफ़्त है।",
    qPrivacyTemplate: "क्या {{toolName}} का उपयोग करते समय मेरी फाइलें सुरक्षित और निजी रहती हैं?",
    aPrivacyTemplate: "बिल्कुल! PDFSun पर गोपनीयता सर्वोपरि है। {{toolName}} आपके ब्राउज़र में वेबअसेंबली के माध्यम से 100% स्थानीय रूप से चलता है। आपकी फाइलें कभी सर्वर पर अपलोड या स्टोर नहीं की जातीं।",
  },
  es: {
    qTemplate: "¿Cómo usar {{toolName}} en línea en PDFSun?",
    aTemplate: "Para usar {{toolName}}: 1) Seleccione o arrastre sus archivos {{inputs}}. 2) Ajuste las opciones según sea necesario. 3) Haga clic en Procesar para descargar inmediatamente su archivo {{outputFormat}}.",
    qFreeTemplate: "¿Es {{toolName}} completamente gratis y sin marcas de agua?",
    aFreeTemplate: "¡Sí! {{toolName}} en PDFSun es 100% gratuito, sin tarifas ocultas, sin límites y sin marcas de agua agregadas.",
    qPrivacyTemplate: "¿Están seguros y privados mis archivos al usar {{toolName}}?",
    aPrivacyTemplate: "Absolutamente. {{toolName}} procesa archivos localmente en su navegador mediante WebAssembly. Sus documentos nunca se suben ni se almacenan en servidores externos.",
  },
  fr: {
    qTemplate: "Comment utiliser {{toolName}} en ligne sur PDFSun ?",
    aTemplate: "Pour utiliser {{toolName}} : 1) Sélectionnez ou déposez vos fichiers {{inputs}}. 2) Ajustez les options. 3) Cliquez sur Traiter pour télécharger immédiatement votre fichier {{outputFormat}}.",
    qFreeTemplate: "L'outil {{toolName}} est-il totalement gratuit et sans filigrane ?",
    aFreeTemplate: "Oui ! {{toolName}} sur PDFSun est 100% gratuit, sans frais cachés, sans limites et sans filigrane.",
    qPrivacyTemplate: "Mes fichiers sont-ils sécurisés et confidentiels avec {{toolName}} ?",
    aPrivacyTemplate: "Absolument. {{toolName}} s'exécute localement dans votre navigateur via WebAssembly. Vos documents ne sont jamais enregistrés sur des serveurs distants.",
  },
  de: {
    qTemplate: "Wie verwende ich {{toolName}} online auf PDFSun?",
    aTemplate: "So verwenden Sie {{toolName}}: 1) Wählen Sie Ihre {{inputs}}-Dateien aus oder ziehen Sie sie per Drag & Drop. 2) Passen Sie die Einstellungen an. 3) Klicken Sie auf Verarbeiten, um Ihre {{outputFormat}}-Datei herunterzuladen.",
    qFreeTemplate: "Ist {{toolName}} völlig kostenlos und ohne Wasserzeichen?",
    aFreeTemplate: "Ja! {{toolName}} auf PDFSun ist 100% kostenlos, ohne versteckte Gebühren und ohne Wasserzeichen.",
    qPrivacyTemplate: "Sind meine Dateien bei der Verwendung von {{toolName}} sicher und privat?",
    aPrivacyTemplate: "Absolut. {{toolName}} verarbeitet Dateien lokal in Ihrem Browser über WebAssembly. Ihre Dokumente werden niemals auf externe Server hochgeladen.",
  },
  bn: {
    qTemplate: "PDFSun-এ কীভাবে {{toolName}} ব্যবহার করবেন?",
    aTemplate: "{{toolName}} ব্যবহার করার জন্য: ১) আপনার {{inputs}} ফাইল ড্রপ করুন। ২) পছন্দমতো অপশন সেট করুন। ৩) প্রসেস বোতামে ক্লিক করে সাথে সাথে {{outputFormat}} ফাইল ডাউনলোড করুন।",
    qFreeTemplate: "{{toolName}} কি সম্পূর্ণ বিনামূল্যে এবং ওয়াটারমার্ক ছাড়া?",
    aFreeTemplate: "হ্যাঁ! PDFSun-এ {{toolName}} ১০০% বিনামূল্যে, কোনো সীমাবদ্ধতা বা ওয়াटरমার্ক নেই।",
    qPrivacyTemplate: "{{toolName}} ব্যবহারের সময় কি আমার ফাইল সম্পূর্ণ নিরাপদ?",
    aPrivacyTemplate: "হ্যাঁ, সম্পূর্ণ নিরাপদ। সব কাজ আপনার ব্রাউজারে লোকালভাবে ওয়েবঅ্যাসেম্বলি দ্বারা সম্পন্ন হয়।",
  },
};

export interface LocalizedFaqContext {
  t?: (key: string, fallback?: any, params?: any) => string;
  currentLanguage?: string;
  getToolName?: (tool: { id: string; name: string }) => string;
  getToolDescription?: (tool: { id: string; description?: string }) => string;
}

/**
 * Returns localized, tool-specific FAQs adhering to the FAQSection architecture.
 * Automatically adapts questions and answers to the tool's identity and current active language.
 */
export function getLocalizedToolFAQs(
  tool: ToolItem,
  langContext?: LocalizedFaqContext
): ToolFAQ[] {
  const toolName = langContext?.getToolName ? langContext.getToolName(tool) : tool.name;
  const currentLang = langContext?.currentLanguage || "en";
  const inputs = tool.supportedInput.length > 0 ? tool.supportedInput.join(" or ") : "PDF";

  // 1. Check if tool has explicit FAQs in toolsData.ts or in TOOL_SPECIFIC_FAQS
  let baseFaqs: ToolFAQ[] = [];
  if (tool.faqs && tool.faqs.length > 0) {
    baseFaqs = tool.faqs.map((f) => ({
      question: f.question || (f as any).q,
      answer: f.answer || (f as any).a,
    }));
  } else if (TOOL_SPECIFIC_FAQS[tool.id] || TOOL_SPECIFIC_FAQS[tool.slug]) {
    baseFaqs = TOOL_SPECIFIC_FAQS[tool.id] || TOOL_SPECIFIC_FAQS[tool.slug];
  } else {
    // Generate functional category-specific fallback
    const catFaq = getCategoryFallbackFaq(tool);
    const defaults = getDefaultToolFaqs(tool);
    baseFaqs = [catFaq, ...defaults];
  }

  // Ensure default questions are present if base list is short
  if (baseFaqs.length < 4) {
    const defaults = getDefaultToolFaqs(tool);
    baseFaqs = [...baseFaqs, ...defaults];
  }

  // Deduplicate base FAQs
  const seen = new Set<string>();
  const deduplicated: ToolFAQ[] = [];
  for (const faq of baseFaqs) {
    const key = faq.question.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(faq);
    }
  }

  // 2. Apply localized string replacements
  const localizedFaqs: ToolFAQ[] = deduplicated.map((faq, index) => {
    let q = faq.question;
    let a = faq.answer;

    // Replace English tool name with localized tool name if different
    if (tool.name !== toolName) {
      q = q.split(tool.name).join(toolName);
      a = a.split(tool.name).join(toolName);
    }

    // If active language has specific template translation for the primary questions, apply it
    const langTemplates = LOCALIZED_FAQ_TEMPLATES[currentLang];
    if (langTemplates) {
      if (index === 0 && (q.toLowerCase().includes("how do i") || q.toLowerCase().includes("how to"))) {
        q = langTemplates.qTemplate
          .replace("{{toolName}}", toolName)
          .replace("{{inputs}}", inputs)
          .replace("{{outputFormat}}", tool.outputFormat);
        a = langTemplates.aTemplate
          .replace("{{toolName}}", toolName)
          .replace("{{inputs}}", inputs)
          .replace("{{outputFormat}}", tool.outputFormat);
      } else if (q.toLowerCase().includes("free") || q.toLowerCase().includes("limit")) {
        q = langTemplates.qFreeTemplate.replace("{{toolName}}", toolName);
        a = langTemplates.aFreeTemplate.replace("{{toolName}}", toolName);
      } else if (q.toLowerCase().includes("safe") || q.toLowerCase().includes("private") || q.toLowerCase().includes("security")) {
        q = langTemplates.qPrivacyTemplate.replace("{{toolName}}", toolName);
        a = langTemplates.aPrivacyTemplate.replace("{{toolName}}", toolName);
      }
    }

    return { question: q, answer: a };
  });

  return localizedFaqs;
}

/**
 * Builds standard Schema.org FAQPage JSON-LD object for search engine crawlers.
 */
export function buildFaqJsonLd(faqs: ToolFAQ[]): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
