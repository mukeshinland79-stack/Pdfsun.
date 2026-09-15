import React, { useState } from "react";
import { ChevronDown, Sparkles, BookOpen, Layers, MessageSquare, Compass, ShieldCheck } from "lucide-react";

export interface CollapsibleSectionsHubProps {
  childrenAiSection?: React.ReactNode;
  childrenHistorySection?: React.ReactNode;
  childrenArticleSection?: React.ReactNode;
  childrenFormatsSection?: React.ReactNode;
  childrenTestimonialsSection?: React.ReactNode;
  childrenFaqSection?: React.ReactNode;
  childrenNewsletterSection?: React.ReactNode;
}

export const CollapsibleSectionsHub: React.FC<CollapsibleSectionsHubProps> = ({
  childrenAiSection,
  childrenHistorySection,
  childrenArticleSection,
  childrenFormatsSection,
  childrenTestimonialsSection,
  childrenFaqSection,
  childrenNewsletterSection,
}) => {
  // Collapsible accordion states (default open for key SEO and informative sections)
  const [aiExpanded, setAiExpanded] = useState<boolean>(true);
  const [knowledgeExpanded, setKnowledgeExpanded] = useState<boolean>(true);
  const [reviewsExpanded, setReviewsExpanded] = useState<boolean>(false);
  const [faqExpanded, setFaqExpanded] = useState<boolean>(true);

  return (
    <div id="collapsible-sections-hub" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Section 1: Enterprise AI & Pro Suite Accordion */}
      {childrenAiSection && (
        <section
          id="section-ai-suite"
          aria-labelledby="heading-ai-suite"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden shadow-2xs transition-all duration-200"
        >
          <button
            id="heading-ai-suite"
            onClick={() => setAiExpanded((prev) => !prev)}
            aria-expanded={aiExpanded}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Enterprise AI &amp; Next-Gen Document Engine
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI PDF Chat, Voice Dictation, Summarization, and Mobile Integration
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hidden sm:inline">
                {aiExpanded ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  aiExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {aiExpanded && (
            <div className="px-3 sm:px-6 pb-6 pt-2 space-y-4 border-t border-slate-200/60 dark:border-slate-800/60 animate-in fade-in duration-200">
              {childrenAiSection}
            </div>
          )}
        </section>
      )}

      {/* Section 2: Knowledge Base & In-Depth Technical Guides */}
      {(childrenHistorySection || childrenArticleSection) && (
        <section
          id="section-knowledge-hub"
          aria-labelledby="heading-knowledge-hub"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden shadow-2xs transition-all duration-200"
        >
          <button
            id="heading-knowledge-hub"
            onClick={() => setKnowledgeExpanded((prev) => !prev)}
            aria-expanded={knowledgeExpanded}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Technical Knowledge Base &amp; Daily History
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Client-side security architecture, compression algorithms &amp; educational guides
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hidden sm:inline">
                {knowledgeExpanded ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  knowledgeExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {knowledgeExpanded && (
            <div className="px-3 sm:px-6 pb-6 pt-2 space-y-4 border-t border-slate-200/60 dark:border-slate-800/60 animate-in fade-in duration-200">
              {childrenHistorySection}
              {childrenArticleSection}
            </div>
          )}
        </section>
      )}

      {/* Section 3: Supported Formats & User Testimonials */}
      {(childrenFormatsSection || childrenTestimonialsSection) && (
        <section
          id="section-formats-reviews"
          aria-labelledby="heading-formats-reviews"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden shadow-2xs transition-all duration-200"
        >
          <button
            id="heading-formats-reviews"
            onClick={() => setReviewsExpanded((prev) => !prev)}
            aria-expanded={reviewsExpanded}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Supported Formats &amp; Verified User Reviews
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  4.9/5 Rating from 18,420+ global professionals and students
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                {reviewsExpanded ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  reviewsExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {reviewsExpanded && (
            <div className="px-3 sm:px-6 pb-6 pt-2 space-y-4 border-t border-slate-200/60 dark:border-slate-800/60 animate-in fade-in duration-200">
              {childrenFormatsSection}
              {childrenTestimonialsSection}
            </div>
          )}
        </section>
      )}

      {/* Section 4: Frequently Asked Questions */}
      {childrenFaqSection && (
        <section
          id="section-faqs"
          aria-labelledby="heading-faqs"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden shadow-2xs transition-all duration-200"
        >
          <button
            id="heading-faqs"
            onClick={() => setFaqExpanded((prev) => !prev)}
            aria-expanded={faqExpanded}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Frequently Asked Questions (FAQ)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Security, file limits, browser privacy, and WebAssembly processing
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 hidden sm:inline">
                {faqExpanded ? "Collapse" : "Expand"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  faqExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {faqExpanded && (
            <div className="px-3 sm:px-6 pb-6 pt-2 space-y-4 border-t border-slate-200/60 dark:border-slate-800/60 animate-in fade-in duration-200">
              {childrenFaqSection}
            </div>
          )}
        </section>
      )}

      {/* Newsletter Subscription */}
      {childrenNewsletterSection && (
        <div className="pt-2">
          {childrenNewsletterSection}
        </div>
      )}
    </div>
  );
};
