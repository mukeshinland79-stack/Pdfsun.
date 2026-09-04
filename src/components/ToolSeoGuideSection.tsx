import React, { useState } from "react";
import {
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Cpu,
  Globe2,
  FileText,
} from "lucide-react";
import { AdSensePlaceholder } from "./AdSensePlaceholder";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";

interface ToolSeoGuideSectionProps {
  tool: ToolItem;
  onSelectAnotherTool?: (toolId: string) => void;
}

interface ToolSpecificGuide {
  title: string;
  intro: string;
  features: { title: string; desc: string }[];
  steps: { title: string; desc: string }[];
  privacyEditorial: {
    heading: string;
    points: { title: string; desc: string }[];
  };
  faqs: { q: string; a: string }[];
}

const SPECIFIC_GUIDES: Record<string, ToolSpecificGuide> = {
  "merge-pdf": {
    title: "The Ultimate Guide to Merging PDF Files Online Safely & Instantly",
    intro:
      "Whether preparing multi-chapter academic dissertations, compiling financial statements for tax filing, or organizing corporate contracts, merging documents into a single consolidated PDF is an essential daily workflow. Learn why browser-based WebAssembly technology provides faster, safer, and 100% private PDF joining without third-party server uploads.",
    features: [
      {
        title: "Zero Server Uploads",
        desc: "Files are processed entirely within your device's browser memory using WebAssembly. Your documents never touch external cloud servers.",
      },
      {
        title: "Sub-Second Execution",
        desc: "Native WebAssembly byte-level page stitching eliminates upload queues and latency, producing instant 1-click downloads in under 2 seconds.",
      },
      {
        title: "Lossless Vector Fidelity",
        desc: "Maintains true vector font paths, bookmarks, hyperlinks, and embedded color spaces without compression artifacts or pixelation.",
      },
    ],
    steps: [
      {
        title: "Select or Drop Files",
        desc: "Drag your PDF documents directly from your computer or mobile file picker into the active workspace above. You can add two or dozens of files simultaneously.",
      },
      {
        title: "Arrange Page Sequence",
        desc: "Drag and drop individual document thumbnail cards to reorder them into your preferred reading order. Delete unwanted pages or rotate individual orientations as needed.",
      },
      {
        title: "Merge & Instant Save",
        desc: "Click the primary action button. Your client browser stitches the binary files immediately, prompting a direct download stream with zero waiting queues.",
      },
    ],
    privacyEditorial: {
      heading: "Why Client-Side PDF Merging Outperforms Traditional Online Converters",
      points: [
        {
          title: "Total Data Privacy & Regulatory Compliance (GDPR, HIPAA, FERPA)",
          desc: "PDFSun is engineered on a modern privacy-first architecture. By utilizing WebAssembly (WASM) and compiled client-side binary engines, all file concatenation operations occur strictly within your web browser's isolated JavaScript sandbox. Because protected health information (PHI), bank statements, and proprietary contracts are never transmitted across the network, your operations naturally align with international privacy regulations including GDPR in the European Union and HIPAA in the United States.",
        },
        {
          title: "Eliminating Bandwidth Bottlenecks & Upload Failures",
          desc: "Traditional PDF combining websites require uploading hundreds of megabytes of raw document bytes, waiting for remote server queues, and downloading the resulting file again. On slower cellular networks or congested Wi-Fi, this causes frequent connection timeouts and data failures. In contrast, PDFSun processes files locally at bus speed — merging 50+ pages in under 800 milliseconds without using mobile data bandwidth.",
        },
        {
          title: "Document Formatting & Embedded Font Integrity",
          desc: "Inferior PDF tools frequently convert pages to static raster images during concatenation, which destroys selectable text, blurs vector graphics on high-DPI Retina screens, and inflates file size dramatically. PDFSun's direct object tree merger retains underlying font dictionaries, form fields, outlines, and coordinate matrices without rasterization.",
        },
      ],
    },
    faqs: [
      {
        q: "How to merge PDF files online for free on PDFSun?",
        a: "Merging PDF files on PDFSun takes only 3 simple steps: 1) Drag and drop your PDF documents into the merge workspace. 2) Drag visual thumbnail cards to arrange them into your preferred reading sequence. 3) Click 'Merge PDF' to generate and immediately download your unified PDF document with zero wait times.",
      },
      {
        q: "Is there any file size limit or number of files cap when merging PDFs?",
        a: "No! PDFSun imposes zero arbitrary file limits, zero page caps, and zero paywalls. Because our processing executes directly on your client device using modern WebAssembly, you can merge dozens of PDF documents and hundreds of pages simultaneously without server timeouts or file size rejection errors.",
      },
      {
        q: "Are my uploaded PDF documents private, secure, and confidential?",
        a: "Yes, 100% private and secure. Unlike traditional cloud converter websites that transmit your sensitive files to third-party remote servers, PDFSun runs entirely in your local browser sandbox via WebAssembly (Wasm). Your confidential contracts, financial spreadsheets, medical charts, and personal records never leave your device.",
      },
      {
        q: "Will merging PDFs degrade visual quality, vector fonts, or image resolution?",
        a: "Never. PDFSun combines underlying PDF byte streams, page object trees, embedded TrueType/OpenType fonts, vector lines, and high-resolution images natively without rasterizing or downscaling text. All vector graphics, hyperlinks, and document formatting remain 100% intact with pristine fidelity.",
      },
    ],
  },
  "compress-pdf": {
    title: "Complete Guide to Compressing PDF File Size Online for Free",
    intro:
      "Heavy PDF documents create friction when emailing client proposals, submitting university assignments, or uploading government and visa applications with strict size limits (such as 200KB or 500KB). Discover how modern browser-based compression optimizes document streams, downsizes embedded assets, and removes redundant overhead without compromising legibility.",
    features: [
      {
        title: "Targeted Compression Presets",
        desc: "Choose between Extreme Compression (max size reduction for government portals), Recommended Balanced (ideal for email & web), or Low Compression (maximum visual fidelity).",
      },
      {
        title: "Smart Metadata Stripping",
        desc: "Cleans unreferenced byte streams, redundant embedded thumbnails, duplicate fonts, and debug metadata to trim document weight effortlessly.",
      },
      {
        title: "100% In-Browser Privacy",
        desc: "Execution occurs strictly on your device's CPU. Sensitive tax forms, payroll documents, and legal filings are compressed with zero external server exposure.",
      },
    ],
    steps: [
      {
        title: "Upload Your Heavy PDF",
        desc: "Drag and drop any large PDF file into the compress workspace. You'll see the exact original file size calculated immediately.",
      },
      {
        title: "Select Compression Level",
        desc: "Pick your preferred compression mode depending on your submission requirements, whether you need to fit under a 200KB upload cap or keep high-res illustrations.",
      },
      {
        title: "Compress & Instant Download",
        desc: "Click 'Compress PDF'. Our WebAssembly engine compresses your document streams in under 2 seconds, displaying your percentage savings and initiating immediate download.",
      },
    ],
    privacyEditorial: {
      heading: "How Browser-Side WebAssembly Revolutionizes PDF File Compression",
      points: [
        {
          title: "Stream-Level Byte Optimization Without Rasterization",
          desc: "Many low-grade online tools simply turn entire PDF pages into low-resolution JPEG images to reduce file size. This ruins searchable text, eliminates copy-paste functionality, and makes typography appear fuzzy when printed. PDFSun analyzes individual PDF byte streams, compresses DCT and Flate decode filters natively, and retains true vector glyphs so text remains razor-sharp at any zoom level.",
        },
        {
          title: "Meeting Strict Portal Caps (200KB, 500KB, 1MB)",
          desc: "Corporate recruitment portals, municipal government filings, and university application systems regularly enforce strict file size barriers. With PDFSun's balanced compression heuristics, you can effortlessly shrink 10MB scanned portfolios down to under 200KB without needing technical PDF knowledge or costly desktop software licenses.",
        },
        {
          title: "Safe for Financial, Legal & Healthcare Documents",
          desc: "Because compression is computed locally in your browser sandbox, no external entity or cloud hosting provider can intercept, read, or catalog your confidential spreadsheets, court filings, or medical reports. This ensures airtight compliance with GDPR, CCPA, and HIPAA requirements.",
        },
      ],
    },
    faqs: [
      {
        q: "How to compress a PDF to 200KB or less online?",
        a: "Upload your document to PDFSun's Compress PDF tool and select the 'Extreme Compression' preset. The engine strips duplicate font tables, downsamples heavy scanned images, and optimizes Flate compression streams to shrink multi-megabyte PDFs down to meet government and job portal caps under 200KB.",
      },
      {
        q: "Does compressing a PDF delete bookmarks, hyperlinks, or text layers?",
        a: "No! PDFSun preserves your document's searchable text layer, clickable hyperlinks, active form fields, and table-of-contents bookmarks intact while optimizing the underlying byte payloads.",
      },
      {
        q: "Is PDF compression on PDFSun completely free without watermarks?",
        a: "Yes. PDFSun offers unlimited free PDF compression with zero watermarks, zero subscription fees, and no required account registration. Download your compressed file instantly.",
      },
      {
        q: "Are my documents secure during the compression process?",
        a: "Yes, 100% private. All PDF compression algorithms run locally in your web browser via WebAssembly. Your documents are never uploaded to or stored on remote cloud servers.",
      },
    ],
  },
  "pdf-to-word": {
    title: "Master Guide: Convert PDF to Editable Microsoft Word (DOCX) Online",
    intro:
      "Need to update an agreement, repurpose research findings, or modify a resume trapped inside a read-only PDF? Converting PDF files to fully editable Microsoft Word documents (.docx) unlocks your content for fast revisions, collaborative editing, and seamless formatting updates without retyping text from scratch.",
    features: [
      {
        title: "Paragraph & Heading Detection",
        desc: "Intelligently reconstructs font hierarchies, headers, footers, bulleted lists, and paragraph indentations into standard editable Word styles.",
      },
      {
        title: "Table & Column Preservation",
        desc: "Extracts tabular data and multi-column layouts into native Microsoft Word tables with adjustable cell borders and text alignment.",
      },
      {
        title: "Clean Formatting Output",
        desc: "Produces modern, clean .docx files that open smoothly across Microsoft Word, Google Docs, Apple Pages, and LibreOffice with zero formatting glitches.",
      },
    ],
    steps: [
      {
        title: "Select Your PDF File",
        desc: "Drop your PDF agreement, invoice, or academic paper into the workspace. Supports single and multi-page documents.",
      },
      {
        title: "Automatic Layout Analysis",
        desc: "Our client-side conversion engine parses text runs, font metrics, and geometric bounding boxes to map layout structures accurately.",
      },
      {
        title: "Download Editable DOCX",
        desc: "Click 'Convert to Word' to receive a fully formatted, editable Microsoft Word (.docx) file ready for immediate editing in Word or Google Docs.",
      },
    ],
    privacyEditorial: {
      heading: "Preserving Formatting, Tables & Typography in PDF to Word Conversion",
      points: [
        {
          title: "Eliminating the Pain of Manual Document Retyping",
          desc: "Retyping long reports, legal contracts, or client resumes from a static PDF consumes hours of valuable productivity. PDFSun extracts native text runs and font coordinates, matching proportional word spacing and line heights so your converted Word document closely mirrors the original PDF presentation.",
        },
        {
          title: "High Compatibility Across Google Docs, Microsoft 365 & Apple Pages",
          desc: "The generated .docx file conforms strictly to Office Open XML standards (ISO/IEC 29500), ensuring that whether you edit in desktop Microsoft Word, Google Docs in Google Drive, or Apple Pages on a Mac, fonts and layouts render cleanly without broken character blocks.",
        },
        {
          title: "Confidentiality for Proprietary Corporate Documents",
          desc: "Corporate employment agreements, trade secrets, non-disclosure agreements, and invoices require strict data isolation. Because conversion runs client-side on your device, no third-party cloud server retains a copy of your intellectual property.",
        },
      ],
    },
    faqs: [
      {
        q: "Can I convert scanned PDFs into editable Word documents?",
        a: "Yes! If your PDF contains scanned images or photos of physical paperwork, you can run it through PDFSun's OCR (Optical Character Recognition) tool first to extract editable text, and then export it directly to Microsoft Word format.",
      },
      {
        q: "Will the converted Word document keep tables and images intact?",
        a: "Yes. PDFSun's conversion heuristics identify tabular grids and embedded illustrations, placing them into native Microsoft Word table structures and inline figure frames for convenient editing.",
      },
      {
        q: "Do I need Microsoft Office installed on my computer to convert?",
        a: "No software installation is necessary. The conversion runs 100% inside your web browser. You can open the resulting .docx file in free tools like Google Docs, Word Online, or LibreOffice.",
      },
      {
        q: "Is PDF to Word conversion free and private on PDFSun?",
        a: "Yes, PDF to Word is completely free with no usage caps, no watermark stamps, and zero server uploads. Your data remains strictly on your local machine.",
      },
    ],
  },
  "jpg-to-pdf": {
    title: "How to Convert JPG, PNG & Images to a Clean PDF Document Online",
    intro:
      "Combining photo scans, smartphone receipts, ID card photos, or portfolio illustrations into a single cohesive PDF makes sharing professional, neat, and universal across all devices. Learn how to convert images to high-resolution PDF documents with custom page sizes, margins, and orientations in seconds.",
    features: [
      {
        title: "Multi-Image Batch Joining",
        desc: "Add multiple JPG, JPEG, PNG, WEBP, or BMP images at once and arrange them into a single, structured multi-page PDF document.",
      },
      {
        title: "Custom Margins & Page Sizes",
        desc: "Choose between standard A4, US Letter, or auto-fit canvas dimensions with customizable margin padding for neat, printable results.",
      },
      {
        title: "Pristine Image Resolution",
        desc: "Embeds photos at native camera resolution without downsampling color depth, ensuring crisp printing and crystal-clear inspection.",
      },
    ],
    steps: [
      {
        title: "Upload Your Photos or Images",
        desc: "Select or drop JPG, PNG, or WEBP photos from your gallery or desktop folder into the active workspace.",
      },
      {
        title: "Adjust Page Order & Orientation",
        desc: "Reorder images by dragging thumbnails into your preferred sequence. Choose portrait or landscape orientation to match your visual content.",
      },
      {
        title: "Generate & Save Your PDF",
        desc: "Click 'Convert to PDF'. Your browser bundles your images into a single cohesive PDF document in less than 2 seconds.",
      },
    ],
    privacyEditorial: {
      heading: "Professional Image-to-PDF Conversion for Business, Visas & Academic Work",
      points: [
        {
          title: "Universal Cross-Platform Shareability",
          desc: "Sending loose JPG or PNG files via email often results in mismatched orientations, broken attachments, or compressed previews on different mobile devices. Packaging your images into a single PDF document ensures recipients see your content in the exact page order and layout you designed, whether opened on an iPhone, Android, Mac, or Windows PC.",
        },
        {
          title: "Ideal for Visa Applications, KYC & Expense Reports",
          desc: "Embassy visa portals, banking KYC forms, and corporate expense accounting systems universally demand single PDF submissions for passport copies, utility bills, and receipts. PDFSun simplifies this workflow by merging multiple photo captures into an official PDF in seconds.",
        },
        {
          title: "Client-Side Privacy for Personal Photos & Identity Documents",
          desc: "Sensitive identity documents like driver's licenses, passports, and utility bills should never be uploaded to unknown third-party cloud servers. PDFSun encodes image data locally in your browser memory via WebAssembly, guaranteeing total peace of mind.",
        },
      ],
    },
    faqs: [
      {
        q: "Can I combine multiple photos into a single PDF file?",
        a: "Yes! You can upload multiple JPG, PNG, or WEBP files simultaneously. Drag and drop the image cards to arrange the page sequence, and PDFSun will merge them into a single multi-page PDF document.",
      },
      {
        q: "Will converting JPG to PDF reduce photo quality or blur text?",
        a: "No. PDFSun embeds your original image bytes directly into the PDF container without recompressing or rasterizing, preserving 100% of your camera's native clarity and color reproduction.",
      },
      {
        q: "Can I convert images on my iPhone or Android smartphone?",
        a: "Yes! PDFSun works directly in mobile Safari, Chrome, and Firefox browsers. You can take photos directly from your smartphone camera or select images from your photo gallery.",
      },
      {
        q: "Is there any watermark or file limit on JPG to PDF conversion?",
        a: "None. PDFSun is 100% free with no watermarks, no registration requirement, and zero hidden subscription paywalls.",
      },
    ],
  },
  "ai-chat-pdf": {
    title: "AI Chat with PDF: Interrogate Documents with Real-Time Intelligence",
    intro:
      "Reading through dense 80-page financial audits, academic research papers, legal briefs, and technical manuals can take hours. With PDFSun's AI Chat with PDF engine, you can ask direct questions, extract executive summaries, locate citations, and analyze complex document arguments in seconds.",
    features: [
      {
        title: "Direct Citation Answers",
        desc: "Ask specific questions and receive verified answers backed by direct quotes and page number references from your document.",
      },
      {
        title: "Executive Summaries on Demand",
        desc: "Instantly distill hundred-page documents into digestible key findings, bulleted action items, or presentation-ready talking points.",
      },
      {
        title: "Multi-Language Analysis",
        desc: "Translate and query documents in over 30 languages, asking questions in English about a German contract or French scientific paper.",
      },
    ],
    steps: [
      {
        title: "Upload Any PDF Document",
        desc: "Drop your research paper, financial report, or legal agreement into the AI Chat workspace to begin document parsing.",
      },
      {
        title: "Ask Natural Language Questions",
        desc: "Type questions like 'What are the main risks identified in section 4?' or 'Summarize the financial projections for Q3'.",
      },
      {
        title: "Review Insights & Copy Answers",
        desc: "Receive instant, contextual responses with citations. Copy summaries or export full Q&A chat transcripts with one click.",
      },
    ],
    privacyEditorial: {
      heading: "Accelerating Research, Legal Discovery & Financial Analysis with AI",
      points: [
        {
          title: "Transforming How Students & Researchers Absorb Information",
          desc: "Academic literature reviews often demand reading dozens of methodology papers. AI Chat with PDF enables researchers to immediately query methodology parameters, sample sizes, and empirical conclusions without manually scanning hundreds of pages.",
        },
        {
          title: "Legal Contract & Compliance Clause Identification",
          desc: "Contract attorneys and procurement managers can interrogate agreements for indemnity clauses, termination notice periods, jurisdiction rules, and liability caps in seconds, dramatically speeding up contract review cycles.",
        },
        {
          title: "Strict Confidentiality & Zero Training Retention",
          desc: "Your uploaded proprietary documents are never used to train public machine learning models. Interactions remain private, secure, and ephemeral.",
        },
      ],
    },
    faqs: [
      {
        q: "How does AI Chat with PDF understand my document?",
        a: "Our document AI engine extracts the text layer from your PDF, indexes semantic vectors, and applies state-of-the-art natural language comprehension to understand context, tables, and nuances to answer your specific prompts accurately.",
      },
      {
        q: "Can the AI cite exact page numbers and quotes from the PDF?",
        a: "Yes! Whenever the AI provides an answer, it cross-references the underlying document sections and page numbers so you can verify accuracy immediately.",
      },
      {
        q: "What file types and document sizes are supported?",
        a: "You can query any text-based PDF document, research paper, whitepaper, corporate slide deck, or business report. For scanned PDFs without text, run our OCR tool first.",
      },
      {
        q: "Is my document data kept private when using AI Chat?",
        a: "Yes. Document context is processed securely and is never stored permanently, monetized, or fed into public generative training datasets.",
      },
    ],
  },
};

export const ToolSeoGuideSection: React.FC<ToolSeoGuideSectionProps> = ({
  tool,
  onSelectAnotherTool,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Look up tailored guide or construct an authoritative high-quality fallback
  const guide =
    SPECIFIC_GUIDES[tool.id] ||
    SPECIFIC_GUIDES[tool.slug] || {
      title: `The Comprehensive Guide to ${tool.name} Online (Fast & Secure)`,
      intro: `${tool.description} Discover why modern browser-based WebAssembly technology on PDFSun delivers lightning-fast, 100% private file execution without third-party cloud server storage or privacy compromises.`,
      features: [
        {
          title: "100% In-Browser Execution",
          desc: "Processed entirely inside your device's browser memory using WebAssembly. Your documents never touch external cloud servers.",
        },
        {
          title: "Sub-Second Processing Speed",
          desc: "Native client-side compilation eliminates network upload bottlenecks, producing instant, high-quality results in under 2 seconds.",
        },
        {
          title: "Full Formatting Preservation",
          desc: "Maintains original document typography, embedded fonts, vector artwork, and formatting structure with zero rasterization artifacts.",
        },
      ],
      steps: [
        {
          title: `Upload Your Document`,
          desc: `Drag and drop your ${tool.supportedInput.join(" or ")} files directly into the ${tool.name} workspace above or click 'Choose Files'.`,
        },
        {
          title: `Configure Tool Options`,
          desc: `Preview your pages, adjust layout preferences, or set processing parameters to match your exact output requirements.`,
        },
        {
          title: `Process & Download Instantly`,
          desc: `Click the primary action button. Your file processes locally in your browser and triggers an instant download stream with zero waiting queues.`,
        },
      ],
      privacyEditorial: {
        heading: `Why Client-Side Processing Makes ${tool.name} Safer & Faster`,
        points: [
          {
            title: "Strict Data Confidentiality & Regulatory Privacy",
            desc: `Unlike legacy converter websites that transmit documents to remote cloud storage, PDFSun executes all ${tool.name} operations inside your local browser sandbox via WebAssembly. Confidential corporate agreements, personal tax filings, and medical records never leave your machine, ensuring effortless GDPR and HIPAA compliance.`,
          },
          {
            title: "Eliminating Cloud Upload Latency & Bandwidth Waste",
            desc: `Processing documents on remote servers wastes mobile bandwidth and frequently fails on slow or spotty Wi-Fi connections. PDFSun works at local computer bus speed, executing tasks in fractions of a second without consuming data.`,
          },
          {
            title: "Pristine Document Fidelity & Clean Output",
            desc: `Our document engines manipulate native PDF object trees, vector paths, and font matrices directly, ensuring that output ${tool.outputFormat} files remain crisp, legible, and professional across any device or screen resolution.`,
          },
        ],
      },
      faqs: (tool.faqs && tool.faqs.length >= 4
        ? tool.faqs.slice(0, 4).map((f) => ({ q: f.question, a: f.answer }))
        : [
            {
              q: `How do I use ${tool.name} on PDFSun for free?`,
              a: `Using ${tool.name} takes just 3 simple steps: 1) Upload your ${tool.supportedInput.join(" or ")} file into the workspace. 2) Configure any optional parameters. 3) Click the action button to process and immediately download your ${tool.outputFormat} file.`,
            },
            {
              q: `Is there any fee, watermark, or page limit on ${tool.name}?`,
              a: `No! ${tool.name} on PDFSun is 100% free with no watermarks, no subscription requirements, and no artificial file size caps.`,
            },
            {
              q: `Are my files private and secure when using ${tool.name}?`,
              a: `Yes, completely secure. PDFSun executes processing locally inside your web browser via WebAssembly. Your files are never uploaded to, transmitted across, or stored on remote cloud servers.`,
            },
            {
              q: `Can I use ${tool.name} on mobile phones (iPhone, Android) and Mac?`,
              a: `Yes! PDFSun is fully responsive and functions smoothly across all modern web browsers including Safari on iOS/macOS, Google Chrome on Android/Windows, Firefox, and Edge.`,
            },
          ]),
    };

  // Curate 6 recommended related tools for cross-linking
  const relatedTools = ALL_TOOLS.filter((t) => t.id !== tool.id).slice(0, 6);

  return (
    <article
      id={`${tool.id}-seo-guide-section`}
      className="w-full max-w-4xl mx-auto mt-6 space-y-8 text-left text-slate-800 dark:text-slate-200"
      aria-label={`Detailed Technical and User Guide for ${tool.name}`}
    >
      {/* 1. SECTION: High-Performance Key Highlights Grid */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <header className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Official PDFSun User Guide &amp; Technical Insights</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {guide.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {guide.intro}
          </p>
        </header>

        {/* Feature Cards Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {guide.features.map((feat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                {idx === 0 ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                ) : idx === 1 ? (
                  <Zap className="w-4 h-4 text-amber-500" />
                ) : (
                  <Cpu className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{feat.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. SECTION: Step-by-Step How-To Tutorial */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            How to Use {tool.name} in 3 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Follow this clear step-by-step procedure to process your files securely in seconds:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {guide.steps.map((st, idx) => (
            <div
              key={idx}
              className="flex flex-col space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {st.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Non-intrusive AdSense Slot Placement #1 with Protective Spacing */}
      <div className="py-2">
        <AdSensePlaceholder slotId={`pdfsun-${tool.id}-slot-01`} format="horizontal" />
      </div>

      {/* 3. SECTION: In-Depth Editorial Guide & Best Practices */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          {guide.privacyEditorial.heading}
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {guide.privacyEditorial.points.map((pt, idx) => (
            <div key={idx} className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-1">
                {idx + 1}. {pt.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">{pt.desc}</p>
            </div>
          ))}
        </div>

        {/* Compliance Badges Row */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/20 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>GDPR &amp; CCPA Compliant</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-500/20 font-semibold">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>Zero Remote Server Storage</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-500/20 font-semibold">
            <Globe2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Browser-Side WebAssembly</span>
          </span>
        </div>
      </section>

      {/* 4. SECTION: Frequently Asked Questions (FAQ Accordion with FAQPage Schema) */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Common Questions About {tool.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authoritative answers regarding privacy, file limits, formatting, and cross-platform compatibility:
          </p>
        </div>

        <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
          {guide.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30 transition"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition"
                >
                  <span itemProp="name">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? "rotate-180 text-amber-500" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div
                    className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60 pt-3"
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <span itemProp="text">{faq.a}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Non-intrusive AdSense Slot Placement #2 with Protective Spacing */}
      <div className="py-2">
        <AdSensePlaceholder slotId={`pdfsun-${tool.id}-slot-02`} format="rectangle" />
      </div>

      {/* 5. SECTION: Related PDF Tools & Cross-Navigation */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Need to do more with your documents? Explore Related Tools</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            100% Free &amp; Private
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {relatedTools.map((rel) => (
            <button
              key={rel.id}
              type="button"
              onClick={() => onSelectAnotherTool && onSelectAnotherTool(rel.id)}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-amber-500/60 hover:bg-amber-50/20 dark:hover:bg-slate-800 text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition">
                  {rel.name}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {rel.description}
              </p>
            </button>
          ))}
        </div>
      </section>
    </article>
  );
};
