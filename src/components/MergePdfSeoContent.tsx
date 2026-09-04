import React, { useState } from "react";
import {
  Combine,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Smartphone,
  Globe2,
  Share2,
} from "lucide-react";
import { AdSensePlaceholder } from "./AdSensePlaceholder";

interface MergePdfSeoContentProps {
  onSelectAnotherTool?: (toolId: string) => void;
}

export const MergePdfSeoContent: React.FC<MergePdfSeoContentProps> = ({
  onSelectAnotherTool,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const mergeFaqs = [
    {
      q: "How to merge PDF files online for free on PDFSun?",
      a: "Merging PDF files on PDFSun takes only 3 simple steps: 1) Drag and drop your PDF documents or multi-page files into the merge workspace. 2) Drag the visual page or file cards to arrange them into your preferred reading sequence. 3) Click the 'Merge PDF' button to generate and immediately download your unified, consolidated PDF document with zero wait times.",
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
    {
      q: "Can I merge PDF documents on Mac, iPhone, iPad, Windows, or Android?",
      a: "Yes! PDFSun is a high-performance progressive web utility compatible with every modern browser, including Apple Safari on iOS and macOS, Google Chrome on Android and Windows, Mozilla Firefox, and Microsoft Edge. No software installation, browser extensions, or Adobe Acrobat licenses are required.",
    },
    {
      q: "Can I combine password-protected PDF files?",
      a: "If your PDF file is encrypted with a known open password, simply unlock it first using our free 'Unlock PDF' tool on PDFSun. Once unlocked, you can merge, reorder, rotate, or split the document freely.",
    },
    {
      q: "Does PDFSun add unwanted watermarks or alter original page orientation?",
      a: "Never. PDFSun produces clean, professional PDFs with zero watermarks, zero brand stamps, and zero unwanted modifications. Every page retains its original orientation, bleed, margins, and embedded metadata.",
    },
  ];

  const relatedTools = [
    { id: "compress-pdf", name: "Compress PDF", desc: "Shrink file size up to 90% without quality loss" },
    { id: "split-pdf", name: "Split PDF", desc: "Extract specific page ranges or split into individual PDFs" },
    { id: "protect-pdf", name: "Protect PDF", desc: "Encrypt sensitive documents with 256-bit AES password" },
    { id: "sign-pdf", name: "Sign PDF", desc: "Add legally binding digital signatures and date stamps" },
    { id: "pdf-to-word", name: "PDF to Word", desc: "Convert PDF documents to editable Microsoft Word (.docx)" },
    { id: "edit-pdf", name: "Edit PDF", desc: "Add annotations, highlight text, and insert custom shapes" },
  ];

  return (
    <article
      id="merge-pdf-seo-guide"
      className="w-full max-w-4xl mx-auto mt-6 space-y-8 text-left"
      aria-label="Comprehensive Guide to Merging PDF Files Online"
    >
      {/* 1. SECTION: High-Performance Key Highlights Grid */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <header className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Combine className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>High-Speed Client-Side PDF Combiner</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            The Ultimate Guide to Merging PDF Files Online Safely &amp; Instantly
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Whether preparing multi-chapter academic dissertations, compiling financial statements for tax filing,
            or organizing corporate contracts, merging documents into a single consolidated PDF is an essential daily task.
            Learn why browser-based WebAssembly technology provides faster, safer, and 100% private PDF joining.
          </p>
        </header>

        {/* Feature Cards Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zero Server Uploads</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Files are processed entirely within your device's browser memory. Your documents never touch external cloud servers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sub-Second Execution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Native WebAssembly byte-level page stitching eliminates upload queues and latency, producing instant 1-click downloads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lossless Vector Fidelity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Maintains true vector font paths, bookmarks, hyperlinks, and embedded color spaces without compression artifacts.
            </p>
          </div>
        </div>
      </section>

      {/* 2. SECTION: Step-by-Step How-To Tutorial */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            How to Combine Multiple PDF Files in 3 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Follow this simple visual workflow to consolidate separate documents into one file within seconds:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">1</span>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Select or Drop Files</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Drag your PDF documents directly from your desktop or phone file picker into the active workspace above. You can add two or dozens of files simultaneously.
            </p>
          </div>

          <div className="flex flex-col space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">2</span>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Arrange Page Sequence</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Drag and drop individual document thumbnail cards to reorder them in your preferred reading order. Delete unwanted pages or rotate individual orientations.
            </p>
          </div>

          <div className="flex flex-col space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">3</span>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Merge &amp; Instant Save</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Click the orange 'Merge PDF' action button. Your client browser stitches the binary files immediately, downloading the output in high resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Non-intrusive AdSense Slot Placement #1 */}
      <AdSensePlaceholder slotId="pdfsun-tool-content-01" format="horizontal" />

      {/* 3. SECTION: In-Depth Editorial Guide & Best Practices */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Why Client-Side PDF Merging Outperforms Traditional Online Converters
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            When searching for an online PDF merger, most legacy web utilities require uploading your complete document
            to a remote server queue. For enterprise legal teams, healthcare professionals handling HIPAA-protected health records,
            or students with strict confidentiality guidelines, remote server transmission introduces privacy liabilities and compliance risks.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
            1. Total Data Privacy &amp; Regulatory Compliance (GDPR, HIPAA, FERPA)
          </h3>
          <p>
            PDFSun is engineered on a modern privacy-first architecture. By utilizing WebAssembly (WASM) and compiled client-side
            binary engines, all file concatenation operations occur strictly within your web browser's isolated JavaScript sandbox.
            Because protected health information (PHI), bank statements, and proprietary contracts are never transmitted across the network,
            your operations naturally align with international privacy regulations including GDPR in the European Union and HIPAA in the United States.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
            2. Eliminating Bandwidth Bottlenecks &amp; Upload Failures
          </h3>
          <p>
            Traditional PDF combining websites require uploading hundreds of megabytes of raw document bytes, waiting for server queues,
            and downloading the resulting file again. On slower cellular networks or congested Wi-Fi, this causes frequent connection timeouts
            and data failures. In contrast, PDFSun processes files locally at bus speed — merging 50+ pages in under 800 milliseconds
            without using mobile data bandwidth.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
            3. Document Formatting &amp; Embedded Font Integrity
          </h3>
          <p>
            Inferior PDF tools frequently convert pages to static raster images during concatenation, which destroys selectable text,
            blurs vector graphics on high-DPI Retina screens, and inflates file size dramatically. PDFSun's direct object tree merger
            retains underlying font dictionaries, form fields, outlines, and coordinate matrices without rasterization.
          </p>
        </div>

        {/* Compliance Badges Row */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/20 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>GDPR Compliant</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-500/20 font-semibold">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>Zero Remote Storage</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-500/20 font-semibold">
            <Globe2 className="w-3.5 h-3.5 text-amber-500" />
            <span>ISO 27001 Aligned</span>
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
            Common Questions About Merging PDF Files on PDFSun
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quick answers to the most frequently asked questions regarding limits, security, and document formatting:
          </p>
        </div>

        <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
          {mergeFaqs.map((faq, idx) => {
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
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition"
                >
                  <span itemProp="name">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? "rotate-180 text-orange-500" : ""
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

      {/* Non-intrusive AdSense Slot Placement #2 */}
      <AdSensePlaceholder slotId="pdfsun-tool-content-02" format="rectangle" />

      {/* 5. SECTION: Related PDF Tools & Cross-Navigation */}
      <section className="bg-white/95 dark:bg-slate-900/95 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Recommended Next Steps &amp; Related Tools</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">100% Free &amp; Private</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {relatedTools.map((rel) => (
            <button
              key={rel.id}
              type="button"
              onClick={() => onSelectAnotherTool && onSelectAnotherTool(rel.id)}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-orange-500/60 hover:bg-orange-50/20 dark:hover:bg-slate-800 text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-500 transition">
                  {rel.name}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {rel.desc}
              </p>
            </button>
          ))}
        </div>
      </section>
    </article>
  );
};
