import React, { useState } from "react";
import { ChevronDown, ShieldCheck, HelpCircle } from "lucide-react";
import { ToolItem } from "../types";
import { FAQS } from "../data/toolsData";
import { getToolFAQs } from "./SEOManager";

export interface FAQSectionProps {
  activeTool?: ToolItem | null;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ activeTool }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const displayFaqs = activeTool
    ? getToolFAQs(activeTool).map((f) => ({ q: f.question, a: f.answer }))
    : FAQS;

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          {activeTool ? <HelpCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{activeTool ? `${activeTool.name} FAQs` : "Security & Privacy FAQ"}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {activeTool ? `Frequently Asked Questions about ${activeTool.name}` : "Frequently Asked Questions"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {activeTool
            ? `Everything you need to know about using ${activeTool.name} safely, freely, and efficiently.`
            : "Everything you need to know about PDFSun security, data privacy, and browser operations."}
        </p>
      </div>

      <div className="space-y-3">
        {displayFaqs.map((faq, idx) => {
          const isOpen = openIdx === idx;

          return (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between space-x-4 text-sm font-bold text-slate-900 dark:text-white hover:text-orange-500 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
