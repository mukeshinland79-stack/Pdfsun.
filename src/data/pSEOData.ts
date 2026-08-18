export interface PSEOLandingPage {
  slug: string;
  alternateSlugs?: string[];
  targetToolId: string;
  tier: 1 | 2 | 3;
  region: "USA" | "Europe" | "Asia" | "Global";
  language: string; // ISO code (en, de, es, fr, it, nl, hi, etc.)
  targetLimit?: string; // e.g., "100KB", "200KB", "50KB"
  targetSizeKB?: number; // Numeric value in KB for tool pre-sets
  targetFormat?: string; // "PDF"
  regionContext?: string; // "USA", "Global", etc.
  intentCategory?: "government-portal" | "email-resume" | "large-docs" | "general";
  intentBlockText?: string;
  targetDevice?: string; // e.g., "Mac", "Windows", "Mobile", "All"
  complianceBadge?: string; // e.g., "HIPAA Compliant", "GDPR Verified", "Govt Portal Certified"
  seoTitle: string;
  seoDescription: string;
  headline: string;
  subheadline: string;
  intent: "Transactional" | "Commercial" | "Niche Commercial" | "Intent-Specific";
  estimatedMonthlyVol: string;
  cpcValue?: string;
  crossLinkToolIds: string[];
  featureHighlights: string[];
  howToSteps: {
    name: string;
    text: string;
    position: number;
  }[];
  customFaqs: {
    question: string;
    answer: string;
  }[];
}

/**
 * Standard list of high-volume programmatic target sizes for sitemap generation and internal interlinking
 */
export const POPULAR_COMPRESS_SIZES = [
  "50kb",
  "100kb",
  "150kb",
  "200kb",
  "250kb",
  "300kb",
  "400kb",
  "500kb",
  "600kb",
  "750kb",
  "800kb",
  "1mb",
  "2mb",
  "3mb",
  "5mb",
  "10mb",
  "20mb",
  "25mb",
  "50mb",
  "100mb",
];

/**
 * Dynamic Intent Content Trigger conditional mapper based on Target Size
 */
export function getCompressionIntentText(targetSizeKB: number, targetFormatted: string): {
  intentCategory: "government-portal" | "email-resume" | "large-docs" | "general";
  badge: string;
  intentText: string;
} {
  if (targetSizeKB <= 200) {
    return {
      intentCategory: "government-portal",
      badge: "Govt & Passport Upload Cap Compliant",
      intentText:
        "Ideal for online government application portals, passport uploads, student registration forms, and visa application sites with strict file size caps.",
    };
  } else if (targetSizeKB <= 500) {
    return {
      intentCategory: "email-resume",
      badge: "Email Attachment & ATS Optimized",
      intentText:
        "Perfect for emailing job resumes, CVs, portfolios, and tax documentation without bouncing off email attachment limits.",
    };
  } else if (targetSizeKB <= 5120) {
    return {
      intentCategory: "large-docs",
      badge: "eBook & Presentation Downsampler",
      intentText:
        "Best suited for shrinking large eBooks, graphic-heavy presentations, architectural plans, and scanned contracts.",
    };
  } else {
    return {
      intentCategory: "general",
      badge: "High-Volume Document Shrinker",
      intentText:
        "Engineered for high-volume technical manuals, CAD prints, research dossiers, and multi-gigabyte document archives.",
    };
  }
}

/**
 * Standardized Programmatic SEO (pSEO) Page Generator for any target file size
 * Prevents thin content with dynamic intent blocks, structured schemas, step guides, and FAQs.
 */
export function generateCompressSizePseoPage(
  targetSizeRaw: string,
  regionContext: string = "Global"
): PSEOLandingPage {
  const normalized = targetSizeRaw.toLowerCase().trim().replace(/[^0-9a-z]/g, "");
  const match = normalized.match(/^(\d+)(kb|mb|gb)?$/);

  let num = 200;
  let unit = "KB";
  let targetSizeKB = 200;

  if (match) {
    num = parseInt(match[1], 10);
    const unitRaw = match[2] || "kb";
    if (unitRaw === "mb") {
      unit = "MB";
      targetSizeKB = num * 1024;
    } else if (unitRaw === "gb") {
      unit = "GB";
      targetSizeKB = num * 1024 * 1024;
    } else {
      unit = "KB";
      targetSizeKB = num;
    }
  }

  const targetFormatted = `${num}${unit}`;
  const slug = `compress-pdf-to-${num}${unit.toLowerCase()}`;
  const { intentCategory, badge, intentText } = getCompressionIntentText(targetSizeKB, targetFormatted);

  return {
    slug,
    alternateSlugs: [
      `compress-pdf-${num}${unit.toLowerCase()}`,
      `reduce-pdf-size-to-${num}${unit.toLowerCase()}`,
      `shrink-pdf-to-${num}${unit.toLowerCase()}`,
      `compress-pdf/to-${num}${unit.toLowerCase()}`,
    ],
    targetToolId: "compress-pdf",
    tier: 1,
    region: regionContext as any,
    language: "en",
    targetLimit: targetFormatted,
    targetSizeKB,
    targetFormat: "PDF",
    regionContext,
    intentCategory,
    intentBlockText: intentText,
    targetDevice: "All",
    complianceBadge: `100% Client-Side Privacy (${badge})`,
    seoTitle: `Compress PDF to ${targetFormatted} Online Free (Without Losing Quality)`,
    seoDescription: `Reduce PDF size to less than ${targetFormatted} instantly in your browser. Free online tool to shrink PDF file size to ${targetFormatted} for job applications and portals.`,
    headline: `Compress PDF to ${targetFormatted} Online`,
    subheadline: `Instant, free & secure compression down to ${targetFormatted}`,
    intent: "Transactional",
    estimatedMonthlyVol: targetSizeKB <= 200 ? "150K–300K" : targetSizeKB <= 500 ? "90K–180K" : "45K–90K",
    cpcValue: "$2.85",
    crossLinkToolIds: ["merge-pdf", "split-pdf", "protect-pdf", "jpg-to-pdf", "pdf-to-word", "sign-pdf", "edit-pdf"],
    featureHighlights: [
      `Auto-calibrated for exact ${targetFormatted} maximum limit`,
      "100% Client-side WebAssembly execution (Zero Server Uploads)",
      "Preserves sharp vector fonts, tables, and form fields",
      "Instant in-browser processing under 2 seconds",
    ],
    howToSteps: [
      {
        name: "Select your PDF document",
        text: "Drag your file into the dropzone above or click 'Choose File'.",
        position: 1,
      },
      {
        name: "Set compression target",
        text: `Our algorithm automatically sets the compression target to ${targetFormatted}.`,
        position: 2,
      },
      {
        name: "Download",
        text: "Click 'Compress PDF' and get your optimized file instantly.",
        position: 3,
      },
    ],
    customFaqs: [
      {
        question: `Will compressing my PDF to ${targetFormatted} reduce image quality?`,
        answer: `Our smart compression algorithm balances DPI resolution and image artifacts. It strips unnecessary metadata and applies lossless compression first, ensuring your text remains crisp even when reduced to under ${targetFormatted}.`,
      },
      {
        question: `Is it safe to compress sensitive PDFs to ${targetFormatted} on this site?`,
        answer: `Yes. Your files are processed 100% locally in your browser via WebAssembly (WASM). Your document is never uploaded to an external server, making it 100% secure and compliant with HIPAA and GDPR standards.`,
      },
      {
        question: `Can I compress PDF to ${targetFormatted} on iPhone or Android?`,
        answer: `Yes, our online compressor works on modern web browsers across Mobile, Mac, Windows, and Linux devices without requiring software installation.`,
      },
    ],
  };
}

export const PSEO_LANDING_PAGES: PSEOLandingPage[] = [
  // ==========================================
  // TIER 1: USA (HIGH CPC & COMMERCIAL INTENT)
  // ==========================================
  {
    slug: "compress-pdf-to-100kb",
    alternateSlugs: ["compress-pdf/100kb", "compress-pdf-100kb", "reduce-pdf-size-to-100kb"],
    targetToolId: "compress-pdf",
    tier: 1,
    region: "USA",
    language: "en",
    targetLimit: "100KB",
    targetDevice: "All",
    complianceBadge: "Client-Side Processing (Zero Server Uploads)",
    seoTitle: "Compress PDF to 100KB Online Free - High Quality | PDF Sun",
    seoDescription: "Compress PDF to exactly 100KB or less online for free. Fast, high-resolution client-side compression without quality loss or server uploads.",
    headline: "Compress PDF to 100KB Online Free",
    subheadline: "Reduce your PDF file size under 100KB instantly directly in your browser with crystal-clear text and image preservation.",
    intent: "Transactional",
    estimatedMonthlyVol: "110K–200K",
    cpcValue: "$2.50",
    crossLinkToolIds: ["sign-pdf", "edit-pdf", "protect-pdf", "merge-pdf"],
    featureHighlights: [
      "Target exact 100KB file size threshold",
      "100% Private local WebAssembly processing",
      "No email or registration required",
      "Instant email and upload attachment readiness",
    ],
    howToSteps: [
      { name: "Upload PDF File", text: "Select or drop your PDF document into the compressor workspace.", position: 1 },
      { name: "Select 100KB Preset", text: "Choose the High Compression preset targeting 100KB or adjust compression sliders.", position: 2 },
      { name: "Download Compressed PDF", text: "Click Compress and instantly download your sub-100KB PDF document.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Can I really compress a PDF to 100KB without losing text clarity?",
        answer: "Yes. PDF Sun utilizes advanced WebAssembly vector downsampling that preserves crisp font definitions while aggressively optimizing embedded raster images.",
      },
      {
        question: "Is there any risk of my confidential PDF leaking?",
        answer: "None. All compression computations happen locally inside your browser's runtime sandbox. Your files never leave your computer or touch our servers.",
      },
    ],
  },
  {
    slug: "sign-pdf-online-free",
    alternateSlugs: ["sign-pdf-free", "electronic-signature-pdf", "esig-pdf-online"],
    targetToolId: "sign-pdf",
    tier: 1,
    region: "USA",
    language: "en",
    targetDevice: "All",
    complianceBadge: "ESIGN & UETA Compliant Signatures",
    seoTitle: "Sign PDF Online Free - Legal Electronic Signatures | PDF Sun",
    seoDescription: "Sign PDF documents online for free with legally binding electronic signatures. Draw, type, or upload your signature securely in your browser.",
    headline: "Sign PDF Documents Online for Free",
    subheadline: "Create and apply legally binding electronic signatures, initial stamps, and dates to contracts and forms with zero software installation.",
    intent: "Commercial",
    estimatedMonthlyVol: "90K–150K",
    cpcValue: "$6.00",
    crossLinkToolIds: ["protect-pdf", "edit-pdf", "merge-pdf", "pdf-to-word"],
    featureHighlights: [
      "Draw, type, or upload custom signatures",
      "Add interactive date stamps, checkmarks, and initials",
      "ESIGN Act & UETA compliant electronic signing",
      "No account creation or subscription limits",
    ],
    howToSteps: [
      { name: "Open PDF Document", text: "Upload the PDF contract, NDA, or agreement you need to sign.", position: 1 },
      { name: "Create Your Signature", text: "Draw your signature on screen, type your name, or upload a scanned signature image.", position: 2 },
      { name: "Place & Finalize", text: "Position your signature on the signature line, apply date stamps, and download the signed PDF.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Are signatures created on PDF Sun legally binding?",
        answer: "Yes, electronic signatures created on PDF Sun comply with the US ESIGN Act and UETA guidelines for standard commercial agreements.",
      },
    ],
  },
  {
    slug: "edit-pdf-text-free",
    alternateSlugs: ["edit-pdf-online-free", "free-pdf-editor", "edit-pdf-mac", "edit-pdf/mac"],
    targetToolId: "edit-pdf",
    tier: 1,
    region: "USA",
    language: "en",
    targetDevice: "Mac & Windows",
    complianceBadge: "Full-Featured Web PDF Editor",
    seoTitle: "Edit PDF Text Online Free - Browser PDF Editor | PDF Sun",
    seoDescription: "Edit PDF text, add annotations, insert images, and organize pages online for free. Works seamlessly on Mac, Windows, and mobile devices.",
    headline: "Edit PDF Text & Annotations Online Free",
    subheadline: "Modify text, insert paragraphs, add graphics, draw highlights, and reorganize document pages without purchasing expensive desktop software.",
    intent: "Transactional",
    estimatedMonthlyVol: "200K–350K",
    cpcValue: "$3.20",
    crossLinkToolIds: ["pdf-to-word", "sign-pdf", "compress-pdf", "protect-pdf"],
    featureHighlights: [
      "Direct on-canvas text editing and additions",
      "Rich color highlighters, shape tools, and callouts",
      "Universal compatibility with Mac Preview and Windows Acrobat",
      "100% Private local browser execution",
    ],
    howToSteps: [
      { name: "Load PDF", text: "Select your PDF file to open it in the visual editor workspace.", position: 1 },
      { name: "Make Edits", text: "Click to add new text, annotate existing sections, or highlight important clauses.", position: 2 },
      { name: "Save Changes", text: "Click Export PDF to render and download your revised document.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Can I edit PDF text on Mac without Adobe Acrobat Pro?",
        answer: "Yes! PDF Sun runs directly in Safari, Chrome, and Edge on macOS, offering powerful PDF text editing capabilities without expensive subscription fees.",
      },
    ],
  },
  {
    slug: "convert-pdf-to-word-editable",
    alternateSlugs: ["pdf-to-word-editable", "convert-pdf-to-docx-free"],
    targetToolId: "pdf-to-word",
    tier: 1,
    region: "USA",
    language: "en",
    targetDevice: "All",
    complianceBadge: "High-Fidelity DOCX Layout Engine",
    seoTitle: "Convert PDF to Word Editable Online Free (.docx) | PDF Sun",
    seoDescription: "Convert PDF to fully editable Microsoft Word (.docx) documents with intact tables, fonts, and layouts. 100% free with no email required.",
    headline: "Convert PDF to Editable Word Document (.docx)",
    subheadline: "Extract editable text, formatting, tables, and images from PDF documents into standard Microsoft Word DOCX files in seconds.",
    intent: "Transactional",
    estimatedMonthlyVol: "150K–250K",
    cpcValue: "$2.80",
    crossLinkToolIds: ["word-to-pdf", "edit-pdf", "ai-ocr", "compress-pdf"],
    featureHighlights: [
      "Flawless preservation of multi-column layouts and tables",
      "Outputs standard Microsoft Word DOCX format",
      "Extracts embedded images and typography",
      "Fast conversion with zero server queues",
    ],
    howToSteps: [
      { name: "Select PDF", text: "Drag and drop your PDF document into the converter box.", position: 1 },
      { name: "Analyze Layout", text: "Our parser detects paragraph structures, font hierarchies, and tabular grids.", position: 2 },
      { name: "Download DOCX", text: "Click Convert to Word and download your editable DOCX file immediately.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Will tables and fonts remain editable in Word?",
        answer: "Yes, our conversion engine reconstructs true Word tables, header levels, and bullet points rather than flattening them into static pictures.",
      },
    ],
  },
  {
    slug: "hipaa-compliant-pdf-merge",
    alternateSlugs: ["hipaa-pdf-merge", "secure-medical-pdf-combiner", "merge-pdf-hipaa"],
    targetToolId: "merge-pdf",
    tier: 1,
    region: "USA",
    language: "en",
    complianceBadge: "HIPAA Compliant Client-Side Security",
    seoTitle: "HIPAA Compliant PDF Merge Online - Zero Server Uploads | PDF Sun",
    seoDescription: "Merge medical records, clinical notes, and healthcare PDFs with 100% HIPAA compliance. Files process exclusively in local browser memory.",
    headline: "HIPAA Compliant PDF Merge & Combiner",
    subheadline: "Combine medical charts, clinical evaluations, and PHI documents securely. With zero cloud uploads, patient health information never leaves your device.",
    intent: "Niche Commercial",
    estimatedMonthlyVol: "5K–12K",
    cpcValue: "$8.50+",
    crossLinkToolIds: ["protect-pdf", "redact-pdf", "compress-pdf", "sign-pdf"],
    featureHighlights: [
      "Zero Cloud Storage: Zero transmission of Protected Health Information (PHI)",
      "Satisfies HIPAA Security Rule §164.312 data privacy requirements",
      "Unlimited file merging with drag-and-drop sequencing",
      "Instant offline-capable WebAssembly processing",
    ],
    howToSteps: [
      { name: "Add Health Documents", text: "Select your patient records or medical charts securely.", position: 1 },
      { name: "Arrange Chronology", text: "Drag pages into correct chronological order.", position: 2 },
      { name: "Merge & Save", text: "Generate the consolidated patient record instantly on your computer.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Why is PDF Sun inherently HIPAA compliant?",
        answer: "Because PDF Sun executes 100% client-side inside your browser via WebAssembly, your documents are never uploaded to any remote server or third-party cloud. No Business Associate Agreement (BAA) is required because no PHI is ever received or stored by us.",
      },
    ],
  },
  {
    slug: "redact-pdf-online-free",
    alternateSlugs: ["black-out-pdf-text", "redact-sensitive-info-pdf"],
    targetToolId: "redact-pdf",
    tier: 1,
    region: "USA",
    language: "en",
    complianceBadge: "Permanent Cryptographic Sanitization",
    seoTitle: "Redact PDF Online Free - Permanently Black Out Text & SSN | PDF Sun",
    seoDescription: "Permanently redact and black out confidential text, SSNs, credit cards, and images from PDF files online. True sanitization, not just black boxes.",
    headline: "Redact PDF Online Free",
    subheadline: "Permanently sanitize confidential data, social security numbers, banking details, and addresses from your PDF documents before sharing.",
    intent: "Commercial",
    estimatedMonthlyVol: "30K–50K",
    cpcValue: "$4.10",
    crossLinkToolIds: ["protect-pdf", "sign-pdf", "edit-pdf", "compress-pdf"],
    featureHighlights: [
      "Permanent underlying text deletion (not just cosmetic black overlays)",
      "Redact sensitive metadata and hidden revision history",
      "Client-side processing prevents leaks during redaction",
      "Instant export ready for legal discovery or public filing",
    ],
    howToSteps: [
      { name: "Upload PDF", text: "Open the confidential document you need to sanitize.", position: 1 },
      { name: "Mark Redaction Areas", text: "Highlight or draw boxes around text, numbers, or images to redact.", position: 2 },
      { name: "Apply Redaction & Export", text: "Click Apply Redactions to strip all underlying data permanently and download.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Can redacted text be highlighted or copied by recipients?",
        answer: "No. PDF Sun permanently strips the underlying character glyphs and metadata streams from the PDF structure, ensuring complete irreversibility.",
      },
    ],
  },
  {
    slug: "combine-pdf-files-mac",
    alternateSlugs: ["merge-pdf-mac", "combine-pdf-mac-online"],
    targetToolId: "merge-pdf",
    tier: 1,
    region: "USA",
    language: "en",
    targetDevice: "Mac",
    complianceBadge: "Optimized for macOS Safari & Chrome",
    seoTitle: "Combine PDF Files on Mac Online Free | PDF Sun",
    seoDescription: "Easily combine multiple PDF files on Mac online for free. Faster and simpler than Mac Preview, with custom visual page reordering.",
    headline: "Combine PDF Files on Mac Online",
    subheadline: "Join multiple PDF files into one clean document on macOS without complex Finder menus or expensive software.",
    intent: "Intent-Specific",
    estimatedMonthlyVol: "40K–70K",
    cpcValue: "$3.00",
    crossLinkToolIds: ["compress-pdf", "split-pdf", "sign-pdf", "edit-pdf"],
    featureHighlights: [
      "Fast drag-and-drop on macOS Safari, Chrome, and Firefox",
      "Visual thumbnail preview for all pages",
      "Retains high-DPI Retina display sharpness",
      "No Apple Silicon or Intel hardware limitations",
    ],
    howToSteps: [
      { name: "Drop Mac Files", text: "Drag your PDF files directly from macOS Finder into the browser.", position: 1 },
      { name: "Reorder Pages", text: "Rearrange page thumbnails in your desired sequence.", position: 2 },
      { name: "Download Combined PDF", text: "Save the merged PDF directly to your Mac Downloads folder.", position: 3 },
    ],
    customFaqs: [
      {
        question: "How is this better than merging PDFs in Mac Preview?",
        answer: "PDF Sun provides interactive visual drag-and-drop thumbnail reordering, batch rotation, and duplicate page removal across all your documents simultaneously.",
      },
    ],
  },

  // =========================================================
  // TIER 2: EUROPE (GDPR-FOCUSED & LOCALIZED MULTI-LANGUAGE)
  // =========================================================
  {
    slug: "de/pdf-verkleinern",
    alternateSlugs: ["pdf-verkleinern", "pdf-komprimieren-online"],
    targetToolId: "compress-pdf",
    tier: 2,
    region: "Europe",
    language: "de",
    complianceBadge: "DSGVO-Konform (100% Lokal im Browser)",
    seoTitle: "PDF verkleinern kostenlos online - Schnell & DSGVO-sicher | PDF Sun",
    seoDescription: "PDF-Dateien kostenlos und sicher online verkleinern. 100% DSGVO-konform ohne Upload auf externe Server. Hohe Qualität & blitzschnell.",
    headline: "PDF verkleinern kostenlos online",
    subheadline: "Reduzieren Sie die Dateigröße Ihrer PDFs direkt im Browser ohne Qualitätsverlust. 100% Datenschutz garantiert.",
    intent: "Transactional",
    estimatedMonthlyVol: "300K–500K",
    crossLinkToolIds: ["merge-pdf", "sign-pdf", "protect-pdf", "pdf-to-word"],
    featureHighlights: [
      "100% DSGVO-Konformität durch reine clientseitige Verarbeitung",
      "Keine Speicherung auf fremden Cloud-Servern",
      "Maximale Textschärfe bei minimaler Dateigröße",
      "Kostenlos ohne Registrierung nutzbar",
    ],
    howToSteps: [
      { name: "PDF-Datei auswählen", text: "Ziehen Sie Ihre PDF-Datei per Drag & Drop in den Arbeitsbereich.", position: 1 },
      { name: "Komprimierungsgrad wählen", text: "Wählen Sie die gewünschte Komprimierungsstufe aus.", position: 2 },
      { name: "Verkleinerte PDF herunterladen", text: "Klicken Sie auf 'Komprimieren' und laden Sie die optimierte Datei sofort herunter.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Ist die PDF-Verkleinerung auf PDF Sun DSGVO-konform?",
        answer: "Ja, zu 100%. Die Datenverarbeitung findet ausschließlich lokal in Ihrem Browser mittels WebAssembly statt. Es werden keine Dokumente an Server übertragen.",
      },
    ],
  },
  {
    slug: "es/unir-pdf-gratis",
    alternateSlugs: ["unir-pdf-gratis", "juntar-pdf-online", "combinar-pdf-gratis"],
    targetToolId: "merge-pdf",
    tier: 2,
    region: "Europe",
    language: "es",
    complianceBadge: "Cumplimiento RGPD (Procesamiento 100% Local)",
    seoTitle: "Unir PDF gratis online - Combinar varios archivos PDF | PDF Sun",
    seoDescription: "Une y combina múltiples archivos PDF en un solo documento online y gratis. Rápido, seguro y sin límite de archivos ni marcas de agua.",
    headline: "Unir archivos PDF gratis online",
    subheadline: "Combina varios documentos PDF en uno solo con el orden de páginas que elijas. Rápido, fácil y 100% privado.",
    intent: "Transactional",
    estimatedMonthlyVol: "250K–400K",
    crossLinkToolIds: ["compress-pdf", "split-pdf", "sign-pdf", "edit-pdf"],
    featureHighlights: [
      "Combina documentos ilimitados en segundos",
      "Reordena páginas con vista previa interactiva",
      "100% Privado: tus archivos no salen de tu navegador",
      "Compatible con móviles, PC y Mac",
    ],
    howToSteps: [
      { name: "Seleccionar archivos PDF", text: "Sube o arrastra tus documentos PDF al área de trabajo.", position: 1 },
      { name: "Ordenar documentos", text: "Arrastra los archivos o páginas individuales en el orden que prefieras.", position: 2 },
      { name: "Unir y descargar", text: "Haz clic en 'Unir PDF' y descarga tu documento combinado al instante.", position: 3 },
    ],
    customFaqs: [
      {
        question: "¿Es seguro unir mis documentos PDF en PDF Sun?",
        answer: "Totalmente seguro. El proceso se realiza directamente en la memoria de tu navegador sin subirse a ningún servidor externo.",
      },
    ],
  },
  {
    slug: "fr/compresser-pdf",
    alternateSlugs: ["compresser-un-pdf", "compresser-pdf-gratuit"],
    targetToolId: "compress-pdf",
    tier: 2,
    region: "Europe",
    language: "fr",
    complianceBadge: "Conforme RGPD (Traitement 100% Local)",
    seoTitle: "Compresser un PDF en ligne gratuit - Réduire la taille | PDF Sun",
    seoDescription: "Compressez vos fichiers PDF en ligne gratuitement tout en conservant une excellente qualité. 100% sécurisé et conforme RGPD.",
    headline: "Compresser un PDF en ligne gratuitement",
    subheadline: "Réduisez la taille de vos documents PDF en quelques secondes sans perte de qualité visuelle. Rapide et confidentiel.",
    intent: "Transactional",
    estimatedMonthlyVol: "180K–300K",
    crossLinkToolIds: ["merge-pdf", "sign-pdf", "protect-pdf", "pdf-to-word"],
    featureHighlights: [
      "Réduction significative du poids de vos fichiers PDF",
      "Préservation de la netteté des polices et graphiques",
      "Respect strict du RGPD européen",
      "Sans inscription ni filigrane",
    ],
    howToSteps: [
      { name: "Déposer le fichier PDF", text: "Glissez-déposez votre document PDF dans l'outil.", position: 1 },
      { name: "Ajuster la compression", text: "Sélectionnez le niveau de compression souhaité.", position: 2 },
      { name: "Télécharger le PDF", text: "Cliquez sur 'Compresser' et récupérez immédiatement votre fichier allégé.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Mes fichiers sont-ils stockés sur vos serveurs ?",
        answer: "Non. Le traitement s'effectue intégralement dans votre navigateur grâce à la technologie WebAssembly.",
      },
    ],
  },
  {
    slug: "it/convertitore-pdf-word",
    alternateSlugs: ["convertitore-da-pdf-a-word", "convertire-pdf-in-word"],
    targetToolId: "pdf-to-word",
    tier: 2,
    region: "Europe",
    language: "it",
    complianceBadge: "Conforme GDPR (Elaborazione Locale)",
    seoTitle: "Convertitore da PDF a Word modificabile online gratis | PDF Sun",
    seoDescription: "Converti file PDF in documenti Word DOCX modificabili online e gratis. Mantieni tabelle, formattazione e testo senza installare software.",
    headline: "Converti PDF in Word (.docx) Modificabile",
    subheadline: "Estrai testo e tabelle dai tuoi file PDF in documenti Microsoft Word perfettamente modificabili in pochi secondi.",
    intent: "Transactional",
    estimatedMonthlyVol: "100K–200K",
    crossLinkToolIds: ["word-to-pdf", "edit-pdf", "compress-pdf", "sign-pdf"],
    featureHighlights: [
      "Conversione ad alta precisione in formato DOCX",
      "Mantenimento di tabelle, elenchi e caratteri",
      "100% Gratuito e senza registrazione",
      "Sicurezza totale per i documenti aziendali",
    ],
    howToSteps: [
      { name: "Carica il PDF", text: "Seleziona o trascina il tuo file PDF.", position: 1 },
      { name: "Avvia la conversione", text: "Il nostro motore analizza e ricostruisce la struttura DOCX.", position: 2 },
      { name: "Scarica il file Word", text: "Scarica subito il tuo documento Word modificabile.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Posso modificare il testo dopo la conversione in Word?",
        answer: "Certamente, il file generato è un normale documento Microsoft Word (.docx) completamente editabile.",
      },
    ],
  },
  {
    slug: "gdpr-compliant-pdf-compressor",
    alternateSlugs: ["gdpr-pdf-compression", "gdpr-compliant-pdf-tools"],
    targetToolId: "compress-pdf",
    tier: 2,
    region: "Europe",
    language: "en",
    complianceBadge: "EU GDPR Article 25 & 32 Verified",
    seoTitle: "GDPR Compliant PDF Compressor - 100% In-Browser Privacy | PDF Sun",
    seoDescription: "B2B enterprise GDPR-compliant PDF compressor. Local browser processing ensures zero data transfer, zero data processing agreements, and total privacy.",
    headline: "GDPR Compliant PDF Compression for Enterprise",
    subheadline: "Compress sensitive corporate documents, contracts, and personal data with complete peace of mind. Zero data ever leaves your device.",
    intent: "Commercial",
    estimatedMonthlyVol: "10K–25K",
    crossLinkToolIds: ["hipaa-compliant-pdf-merge", "protect-pdf", "redact-pdf", "sign-pdf"],
    featureHighlights: [
      "Exceeds EU GDPR Data Privacy by Design mandates",
      "Zero Data Processing Agreement (DPA) requirements",
      "Reduces corporate bandwidth and email attachment sizes",
      "Audit-friendly browser cryptographic execution",
    ],
    howToSteps: [
      { name: "Select Business Document", text: "Add corporate or customer PDFs to the compressor.", position: 1 },
      { name: "Compress Securely", text: "Apply high-ratio compression in local browser sandbox.", position: 2 },
      { name: "Download Instantly", text: "Receive the optimized file ready for distribution.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Does PDF Sun act as a GDPR Data Processor?",
        answer: "No. Because zero customer data is transferred to or stored on our servers, PDF Sun never touches your data, ensuring inherent compliance with GDPR regulations.",
      },
    ],
  },
  {
    slug: "nl/pdf-bewerken-online",
    alternateSlugs: ["pdf-bewerken-online", "gratis-pdf-editor"],
    targetToolId: "edit-pdf",
    tier: 2,
    region: "Europe",
    language: "nl",
    complianceBadge: "AVG/GDPR Veilig (100% Lokale Verwerking)",
    seoTitle: "PDF bewerken online gratis - Tekst aanpassen & annoteren | PDF Sun",
    seoDescription: "Bewerk PDF-bestanden gratis online in je browser. Voeg tekst toe, markeer passages en beheer pagina's zonder software te installeren.",
    headline: "PDF bewerken online gratis",
    subheadline: "Pas teksten aan, voeg opmerkingen toe en beheer pagina's eenvoudig in je webbrowser met maximale privacy.",
    intent: "Transactional",
    estimatedMonthlyVol: "50K–90K",
    crossLinkToolIds: ["compress-pdf", "sign-pdf", "merge-pdf", "pdf-to-word"],
    featureHighlights: [
      "Direct tekst en aantekeningen toevoegen",
      "100% AVG-proof lokale browserverwerking",
      "Geen registratie of abonnement nodig",
      "Werkt op alle apparaten (Windows, Mac, mobiel)",
    ],
    howToSteps: [
      { name: "PDF openen", text: "Sleep uw PDF-bestand naar de online editor.", position: 1 },
      { name: "Aanpassingen maken", text: "Voeg tekst, markeringen of vormen toe.", position: 2 },
      { name: "PDF opslaan", text: "Download uw bewerkte PDF direct naar uw apparaat.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Blijven mijn documenten privé?",
        answer: "Ja, al uw documenten worden uitsluitend lokaal in uw browser verwerkt en nooit naar een server geüpload.",
      },
    ],
  },

  // =================================================================
  // TIER 3: ASIA (MASSIVE VOLUME & GOVERNMENT DOCUMENT LIMITS & UNLOCK)
  // =================================================================
  {
    slug: "compress-pdf-to-200kb",
    alternateSlugs: ["compress-pdf-200kb", "pdf-compressor-200kb", "reduce-pdf-size-to-200kb-online"],
    targetToolId: "compress-pdf",
    tier: 3,
    region: "Asia",
    language: "en",
    targetLimit: "200KB",
    complianceBadge: "Govt Job & Exam Portal Optimized (UPSC / SSC / IBPS / NTA)",
    seoTitle: "Compress PDF to 200KB Online Free - Fast Govt Portal Uploads | PDF Sun",
    seoDescription: "Compress PDF to 200KB online for free. Specially optimized for UPSC, SSC, IBPS, NTA, state exams, and govt job application portals with crisp clarity.",
    headline: "Compress PDF to 200KB Online Free",
    subheadline: "Reduce your PDF file size under 200KB for government job portals, university admissions, and online exams without losing document readability.",
    intent: "Transactional",
    estimatedMonthlyVol: "400K–800K",
    cpcValue: "$1.20",
    crossLinkToolIds: ["compress-pdf-to-100kb", "compress-pdf-to-50kb", "jpg-to-pdf", "aadhaar-pdf-unlock"],
    featureHighlights: [
      "Tailored for government exam portals (UPSC, SSC, State PSC, NTA)",
      "Strict file cap under 200KB with crystal-clear signature & photo readability",
      "100% Free with zero daily compression limits",
      "Instant mobile camera PDF optimization",
    ],
    howToSteps: [
      { name: "Choose PDF Document", text: "Select your certificates, marksheets, or application form PDF.", position: 1 },
      { name: "Apply 200KB Preset", text: "The compressor automatically targets the strict 200KB portal limit.", position: 2 },
      { name: "Download & Submit", text: "Download your 200KB PDF ready for immediate portal upload.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Will my uploaded certificates still be legible at 200KB?",
        answer: "Yes, our algorithm uses intelligent dynamic resolution scaling that keeps text and stamp seals 100% legible while stripping unnecessary metadata streams.",
      },
      {
        question: "Which government portals accept this compressed 200KB PDF?",
        answer: "All major portals including UPSC, SSC CGL/CHSL, IBPS Banking, State Public Service Commissions, CBSE, NTA NEET/JEE, and Railway recruitment portals.",
      },
    ],
  },
  {
    slug: "compress-pdf-to-50kb",
    alternateSlugs: ["compress-pdf-50kb", "pdf-compressor-50kb", "reduce-pdf-size-to-50kb"],
    targetToolId: "compress-pdf",
    tier: 3,
    region: "Asia",
    language: "en",
    targetLimit: "50KB",
    complianceBadge: "Ultra-Light Weight Document Compression",
    seoTitle: "Compress PDF to 50KB Online Free | PDF Sun",
    seoDescription: "Compress PDF to 50KB or less online for free. Perfect for passport applications, visa uploads, and signature photo attachments.",
    headline: "Compress PDF to 50KB Online Free",
    subheadline: "Ultra-light compression to reduce PDF documents under 50KB for strict online upload portals with zero watermark.",
    intent: "Transactional",
    estimatedMonthlyVol: "250K–500K",
    cpcValue: "$1.10",
    crossLinkToolIds: ["compress-pdf-to-100kb", "compress-pdf-to-200kb", "jpg-to-pdf", "sign-pdf"],
    featureHighlights: [
      "Target strict 50KB maximum limits",
      "Optimized for identity proofs, signature scans, and single-page forms",
      "Zero quality degradation on critical text fields",
      "Fast client-side rendering on 4G and 5G mobile networks",
    ],
    howToSteps: [
      { name: "Select PDF", text: "Pick the PDF file you need to compress under 50KB.", position: 1 },
      { name: "Apply Max Compression", text: "Our engine optimizes raster blocks to reach under 50KB.", position: 2 },
      { name: "Download 50KB File", text: "Download and attach directly to your application.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Can multi-page PDFs be compressed to 50KB?",
        answer: "Yes, single and multi-page documents can be compressed to 50KB depending on the initial resolution and content type.",
      },
    ],
  },
  {
    slug: "aadhaar-pdf-unlock",
    alternateSlugs: ["unlock-aadhaar-pdf", "aadhaar-card-pdf-password-remover", "eaadhaar-unlock"],
    targetToolId: "unlock-pdf",
    tier: 3,
    region: "Asia",
    language: "en",
    complianceBadge: "UIDAI e-Aadhaar 8-Character Password Unlocker",
    seoTitle: "Aadhaar Card PDF Password Remover Online Free | PDF Sun",
    seoDescription: "Unlock and remove password from e-Aadhaar PDF online for free. Permanent password removal for easy printing, sharing, and KYC verification.",
    headline: "Aadhaar PDF Password Remover Online",
    subheadline: "Permanently remove password protection from your downloaded e-Aadhaar card PDF so you can print, share, and upload it for KYC without entering passwords every time.",
    intent: "Intent-Specific",
    estimatedMonthlyVol: "100K–250K",
    cpcValue: "$0.90",
    crossLinkToolIds: ["unlock-pdf", "protect-pdf", "compress-pdf-to-200kb", "merge-pdf"],
    featureHighlights: [
      "Permanent removal of UIDAI default 8-character password",
      "Ready for bank KYC, passport verification, and SIM activation",
      "100% Private local decryption (your Aadhaar never leaves your device)",
      "Zero watermark or quality alterations",
    ],
    howToSteps: [
      { name: "Upload e-Aadhaar PDF", text: "Select your password-protected e-Aadhaar document.", position: 1 },
      { name: "Enter Current Password", text: "Provide your password (first 4 letters of name in CAPITAL + birth year YYYY).", position: 2 },
      { name: "Download Unlocked PDF", text: "Download your permanent password-free Aadhaar PDF instantly.", position: 3 },
    ],
    customFaqs: [
      {
        question: "What is the standard password for e-Aadhaar PDF?",
        answer: "UIDAI sets the default password as the first 4 letters of your name in CAPITAL letters followed by your 4-digit year of birth (e.g., MUKESH born in 1998 = MUKE1998).",
      },
      {
        question: "Is it safe to unlock my Aadhaar on PDF Sun?",
        answer: "Yes, completely safe. The decryption happens strictly in your browser's local memory. Your Aadhaar number and personal details are never sent over the internet.",
      },
    ],
  },
  {
    slug: "unlock-pdf-password-online",
    alternateSlugs: ["unlock-pdf-free", "remove-pdf-password-online", "pdf-password-remover"],
    targetToolId: "unlock-pdf",
    tier: 3,
    region: "Asia",
    language: "en",
    complianceBadge: "Instant Bank Statement & Tax PDF Decryption",
    seoTitle: "Unlock PDF Password Online Free - Remove PDF Restrictions | PDF Sun",
    seoDescription: "Remove password security and editing restrictions from PDF files online for free. Instantly unlock bank statements, payslips, and tax documents.",
    headline: "Unlock PDF Password Online Free",
    subheadline: "Permanently strip user passwords, printing locks, and copy restrictions from your PDF files in seconds with zero file upload to remote servers.",
    intent: "Transactional",
    estimatedMonthlyVol: "200K–350K",
    cpcValue: "$1.40",
    crossLinkToolIds: ["protect-pdf", "aadhaar-pdf-unlock", "edit-pdf", "compress-pdf"],
    featureHighlights: [
      "Removes printing, copying, and editing restrictions",
      "Unlock bank statements (HDFC, SBI, ICICI, Axis, PNB) and salary slips",
      "Client-side decryption protects confidential financial information",
      "Instant download without registration",
    ],
    howToSteps: [
      { name: "Select Protected PDF", text: "Drop your locked PDF file into the decryption box.", position: 1 },
      { name: "Enter Known Password", text: "Type the master password once to authorize removal.", position: 2 },
      { name: "Download Unrestricted PDF", text: "Save the permanent unlocked PDF for unlimited printing and copying.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Can I remove passwords from my bank statement PDFs permanently?",
        answer: "Yes! Once you enter your statement password once, PDF Sun permanently removes the encryption header, allowing you to open and print it anywhere without typing a password.",
      },
    ],
  },
  {
    slug: "jpg-to-pdf-converter-online",
    alternateSlugs: ["jpg-to-pdf-free", "convert-photo-to-pdf", "image-to-pdf-online"],
    targetToolId: "jpg-to-pdf",
    tier: 3,
    region: "Asia",
    language: "en",
    complianceBadge: "High-Resolution Image to PDF Engine",
    seoTitle: "JPG to PDF Converter Online Free - Convert Images to PDF | PDF Sun",
    seoDescription: "Convert JPG and PNG images to a single high quality PDF document online for free. Adjust margins, orientation, and image order effortlessly.",
    headline: "JPG to PDF Converter Online Free",
    subheadline: "Turn camera photos, receipts, ID cards, and scanned documents into professional, perfectly organized PDF files in seconds.",
    intent: "Transactional",
    estimatedMonthlyVol: "500K–900K",
    cpcValue: "$1.80",
    crossLinkToolIds: ["png-to-pdf", "compress-pdf-to-200kb", "merge-pdf", "pdf-to-jpg"],
    featureHighlights: [
      "Combine multiple photos into one single PDF",
      "Custom page orientation (Portrait / Landscape) and margin controls",
      "Auto-enhancement for receipts, ID cards, and documents",
      "100% Free with unlimited image conversion",
    ],
    howToSteps: [
      { name: "Upload Photos", text: "Select JPG or PNG photos from your computer or phone gallery.", position: 1 },
      { name: "Arrange Order", text: "Drag images into preferred page order and set page margins.", position: 2 },
      { name: "Download PDF", text: "Click Convert to PDF and download your clean document.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Can I convert multiple JPG pictures into one single PDF?",
        answer: "Yes, you can upload dozens of pictures simultaneously and PDF Sun will merge them into a single consolidated PDF document.",
      },
    ],
  },
  {
    slug: "merge-pdf-file-free",
    alternateSlugs: ["merge-pdf-free-online", "combine-pdf-files-free"],
    targetToolId: "merge-pdf",
    tier: 3,
    region: "Asia",
    language: "en",
    complianceBadge: "Fast Document Merger for Work & School",
    seoTitle: "Merge PDF File Free Online - Fast & Unlimited Combiner | PDF Sun",
    seoDescription: "Merge PDF files free online with unlimited documents. Reorder pages, combine assignments, and export one consolidated PDF in seconds.",
    headline: "Merge PDF Files Free Online",
    subheadline: "Combine school assignments, office invoices, and multi-part documents into one organized PDF file without watermarks or file size restrictions.",
    intent: "Transactional",
    estimatedMonthlyVol: "300K–600K",
    cpcValue: "$1.50",
    crossLinkToolIds: ["compress-pdf-to-200kb", "split-pdf", "sign-pdf", "jpg-to-pdf"],
    featureHighlights: [
      "Unlimited file uploads with visual thumbnail sorting",
      "Works on any mobile browser with zero app installation",
      "Fast client-side WebAssembly rendering",
      "No email required, 100% free forever",
    ],
    howToSteps: [
      { name: "Choose PDF Documents", text: "Select all the PDF files you wish to join together.", position: 1 },
      { name: "Drag to Reorder", text: "Arrange pages or files into your desired reading sequence.", position: 2 },
      { name: "Save Consolidated File", text: "Download your merged PDF document with a single click.", position: 3 },
    ],
    customFaqs: [
      {
        question: "Is there a limit on how many PDF files I can merge?",
        answer: "No limits! Because processing runs in your browser, you can merge as many files as your device memory supports.",
      },
    ],
  },
];

/**
 * Match incoming URL pathname to a pSEO landing page definition
 */
export function matchPSEORoute(pathname: string): PSEOLandingPage | null {
  if (!pathname) return null;
  const clean = pathname.toLowerCase().replace(/^\/+|\/+$/g, "");
  if (!clean) return null;

  // 1. Check explicit static pSEO landing pages
  for (const page of PSEO_LANDING_PAGES) {
    const pageSlugClean = page.slug.toLowerCase().replace(/^\/+|\/+$/g, "");
    if (clean === pageSlugClean) return page;

    if (page.alternateSlugs) {
      for (const alt of page.alternateSlugs) {
        const altClean = alt.toLowerCase().replace(/^\/+|\/+$/g, "");
        if (clean === altClean) return page;
      }
    }
  }

  // 2. Dynamic pSEO pattern matching for target size variations (e.g. compress-pdf-to-200kb, reduce-pdf-size-to-500kb, etc.)
  const dynamicSizeMatch = clean.match(/^(?:compress-pdf-to-|reduce-pdf-size-to-|reduce-pdf-to-|shrink-pdf-to-|compress-pdf-|compress-pdf\/to-)(\d+)(kb|mb|gb)?$/i);
  if (dynamicSizeMatch) {
    const rawSize = `${dynamicSizeMatch[1]}${dynamicSizeMatch[2] || "kb"}`;
    return generateCompressSizePseoPage(rawSize);
  }

  return null;
}
