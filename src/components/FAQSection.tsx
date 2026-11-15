import React, { useState } from "react";
import { ChevronDown, ShieldCheck, HelpCircle } from "lucide-react";
import { ToolItem } from "../types";
import { FAQS } from "../data/toolsData";
import { getLocalizedToolFAQs, buildFaqJsonLd } from "../lib/toolFaqHelper";
import { useLanguage } from "../lib/i18n";

export interface FAQSectionProps {
  activeTool?: ToolItem | null;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ activeTool }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const { t, currentLanguage, getToolName, getToolDescription } = useLanguage();

  const toolName = activeTool ? getToolName(activeTool) : "";

  const defaultFaqs = [
    {
      q: t("faq.q1", "Are my uploaded PDF files safe on PDFSun?"),
      a: t(
        "faq.a1",
        "Absolutely! At PDFSun, privacy is paramount. Most operations (merging, splitting, rotating, password protecting, organizing) run 100% locally inside your browser via WebAssembly. For AI features, temporary files are processed securely in memory over TLS HTTPS and purged immediately after completion. We NEVER store or share your files."
      ),
    },
    {
      q: t("faq.q2", "How does PDFSun handle AI PDF Chat, Summaries, and Explanations?"),
      a: t(
        "faq.a2",
        "PDFSun integrates Google Gemini 3.6 AI to analyze text extracted from your PDF. You can summarize 200+ page textbooks, ask specific research questions, generate flashcards, or translate full documents into 30+ languages in seconds."
      ),
    },
    {
      q: t("faq.q3", "Is PDFSun completely free to use?"),
      a: t(
        "faq.a3",
        "Yes! PDFSun offers generous free access to all 68+ tools with zero registration required. For heavy power users who need high-capacity batch AI analysis or multi-gigabyte processing, Pro Sun plans are available."
      ),
    },
    {
      q: t("faq.q4", "Can I use PDFSun offline or as a PWA?"),
      a: t(
        "faq.a4",
        "Yes! PDFSun is built as a Progressive Web App (PWA). You can install it on your Desktop, Mac, iPhone, or Android device. All core PDF tools work even without an internet connection."
      ),
    },
    {
      q: t("faq.q5", "What file formats does PDFSun support?"),
      a: t(
        "faq.a5",
        "PDFSun supports PDF, Microsoft Office (DOCX, XLSX, PPTX), Images (JPG, PNG, WEBP), Web (HTML, XML), eBooks (EPUB), and Text (TXT, RTF, CSV)."
      ),
    },
  ];

  const localizedToolFaqs = activeTool
    ? getLocalizedToolFAQs(activeTool, {
        t,
        currentLanguage,
        getToolName,
        getToolDescription,
      })
    : [];

  const displayFaqs = activeTool
    ? localizedToolFaqs.map((f) => ({
        q: f.question,
        a: f.answer,
      }))
    : defaultFaqs;

  const jsonLdData = buildFaqJsonLd(
    displayFaqs.map((f) => ({ question: f.q, answer: f.a }))
  );

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Localized FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdData),
        }}
      />

      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          {activeTool ? <HelpCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>
            {activeTool
              ? t("faq.toolFaqBadge", `${toolName} FAQs`)
              : t("faq.sectionBadge", "Security & Privacy FAQ")}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {activeTool
            ? t("faq.toolTitle", { toolName }, `Frequently Asked Questions about ${toolName}`)
            : t("faq.title", "Frequently Asked Questions")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          {activeTool
            ? t(
                "faq.toolSubtitle",
                { toolName },
                `Everything you need to know about using ${toolName} safely, freely, and efficiently.`
              )
            : t(
                "faq.subtitle",
                "Everything you need to know about PDFSun security, data privacy, and browser operations."
              )}
        </p>
      </div>

      <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
        {displayFaqs.map((faq, idx) => {
          const isOpen = openIdx === idx;

          return (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden transition"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between space-x-4 text-sm font-bold text-slate-900 dark:text-white hover:text-orange-500 transition"
              >
                <span itemProp="name">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div
                  className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-3"
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
  );
};

