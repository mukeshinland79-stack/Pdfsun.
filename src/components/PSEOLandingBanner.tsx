import React, { useState } from "react";
import { PSEOLandingPage, POPULAR_COMPRESS_SIZES, generateCompressSizePseoPage } from "../data/pSEOData";
import { ALL_TOOLS } from "../data/toolsData";
import { ToolItem } from "../types";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  FileCheck2,
  Sliders,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Building2,
  Mail,
  BookOpen,
  HardDrive,
} from "lucide-react";

interface PSEOLandingBannerProps {
  pseoPage: PSEOLandingPage;
  onSelectTool: (tool: ToolItem, initialFiles?: File[], customPseo?: PSEOLandingPage | null) => void;
  onSelectPseoSize?: (targetSize: string) => void;
}

export const PSEOLandingBanner: React.FC<PSEOLandingBannerProps> = ({
  pseoPage,
  onSelectTool,
  onSelectPseoSize,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Find tools to cross-link
  const crossLinkedTools = ALL_TOOLS.filter((t) =>
    pseoPage.crossLinkToolIds.includes(t.id) || pseoPage.crossLinkToolIds.includes(t.slug)
  ).slice(0, 6);

  const isCompressionTool =
    pseoPage.targetToolId === "compress-pdf" || pseoPage.slug.includes("compress-pdf");

  const targetSizeDisplay = pseoPage.targetLimit || "200KB";

  // Intent Icon selector
  const getIntentIcon = () => {
    switch (pseoPage.intentCategory) {
      case "government-portal":
        return <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case "email-resume":
        return <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case "large-docs":
        return <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const handleSwitchTargetSize = (sizeStr: string) => {
    if (onSelectPseoSize) {
      onSelectPseoSize(sizeStr);
    } else {
      const generated = generateCompressSizePseoPage(sizeStr, pseoPage.region);
      const compressTool = ALL_TOOLS.find((t) => t.id === "compress-pdf");
      if (compressTool) {
        onSelectTool(compressTool, undefined, generated);
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ============================================================ */}
      {/* 1. ABOVE-THE-FOLD (ATF) HERO & PRE-SET CONFIGURATION CARD     */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm">
        {/* Top Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-2xs">
              <Zap className="w-3.5 h-3.5" />
              {pseoPage.region} • High-Speed WebAssembly Engine
            </span>

            {pseoPage.targetLimit && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Pre-set Target: Auto-set to {pseoPage.targetLimit} Max
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            100% Private (Zero Server Uploads)
          </span>
        </div>

        {/* H1 & Sub-heading */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          {pseoPage.headline}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed mb-6 font-normal">
          {pseoPage.subheadline}
        </p>

        {/* Trust Badges Strip (ATF Mandate) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-200">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>100% Client-Side Privacy</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-200">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Under 2 Secs Processing</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Zero Server Uploads</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-200">
            <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>HIPAA & GDPR Compliant</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. BELOW-THE-FOLD (BTF) SECTION A: DYNAMIC HOW-TO GUIDE      */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {isCompressionTool
            ? `How to Compress a PDF File to Less Than ${targetSizeDisplay}`
            : `How to Use ${pseoPage.headline}`}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pseoPage.howToSteps.map((step, idx) => (
            <div
              key={idx}
              className="relative flex flex-col p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                  {step.position || idx + 1}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Step {step.position || idx + 1}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {step.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BELOW-THE-FOLD SECTION B: USE-CASE INTENT MATCHING BLOCK  */}
      {/* ============================================================ */}
      {pseoPage.intentBlockText && (
        <div className="rounded-2xl bg-linear-to-br from-amber-500/10 via-blue-500/5 to-slate-50 dark:from-amber-950/30 dark:via-blue-950/20 dark:to-slate-900 border border-amber-300/60 dark:border-amber-700/50 p-5 sm:p-6 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 shrink-0">
              {getIntentIcon()}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Target Use-Case Intent
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200">
                  Optimal for {targetSizeDisplay} Limit
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {pseoPage.intentBlockText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. BELOW-THE-FOLD SECTION C: DYNAMIC FAQ SECTION (FAQPage)   */}
      {/* ============================================================ */}
      {pseoPage.customFaqs && pseoPage.customFaqs.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Frequently Asked Questions ({targetSizeDisplay})
          </h2>

          <div className="space-y-2.5">
            {pseoPage.customFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. BELOW-THE-FOLD SECTION D: SMART INTERNAL CROSS-LINKING   */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Compress PDF to Other Target Sizes */}
        {isCompressionTool && (
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Compress PDF to Other Target Sizes:
            </span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COMPRESS_SIZES.map((sizeStr) => {
                const isCurrent =
                  targetSizeDisplay.toLowerCase() === sizeStr.toLowerCase() ||
                  pseoPage.slug.endsWith(`-${sizeStr}`);
                return (
                  <button
                    key={sizeStr}
                    type="button"
                    onClick={() => handleSwitchTargetSize(sizeStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Compress to {sizeStr.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Related Tools */}
        {crossLinkedTools.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Related PDF Utilities:
            </span>
            <div className="flex flex-wrap gap-2">
              {crossLinkedTools.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTool(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition shadow-2xs"
                >
                  <span>{t.name}</span>
                  <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

