import React from "react";
import {
  ShieldCheck,
  Zap,
  Bot,
  Lock,
  FileCheck,
  Layers,
  Sparkles,
  Globe2,
  CheckCircle2,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { AdSensePlaceholder } from "./AdSensePlaceholder";

interface PdfSunArticleSectionProps {
  showAd?: boolean;
}

/**
 * Clean, fully responsive, SEO-optimized, and AdSense-compliant Article Content Section for PDFSun.in.
 * Features semantic HTML5 (<article>, <h2>, <h3>, <p>, <section>), high-value unique text,
 * zero layout shift, and an integrated AdSense unit for maximum monetization compliance.
 */
export const PdfSunArticleSection: React.FC<PdfSunArticleSectionProps> = ({
  showAd = true,
}) => {
  return (
    <section
      id="pdfsun-editorial-overview"
      className="my-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      aria-label="About PDFSun - Architecture, Security and Document Intelligence"
    >
      <article className="rounded-3xl bg-gradient-to-b from-slate-900 via-[#0c1322] to-slate-950 border border-slate-800/80 shadow-2xl p-6 sm:p-10 lg:p-12 relative overflow-hidden">
        {/* Subtle Ambient Decorative Glows */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Semantic Article Header */}
        <header className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Next-Gen Document Engineering</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            PDFSun.in: Fast, Free &amp; Private Online Document Management Suite
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Engineered for professionals, students, and global enterprises,{" "}
            <strong className="text-white font-semibold">PDFSun.in</strong> delivers a complete,
            zero-compromise workspace for viewing, editing, compressing, converting, and
            analyzing PDF documents directly inside your web browser.
          </p>
        </header>

        {/* 3-Column Core Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 relative z-10">
          {/* Card 1: Client-Side WebAssembly Security */}
          <div className="rounded-2xl p-6 bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Zero-Knowledge WebAssembly Privacy
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unlike traditional PDF converters that upload confidential contracts and personal
                records to third-party cloud servers, PDFSun executes core document modifications
                locally using sandboxed <strong>WebAssembly (WASM)</strong>. Your documents remain
                entirely in your device&apos;s memory and are never stored or logged remotely.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-700/40 flex items-center text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>100% In-Browser Isolation</span>
            </div>
          </div>

          {/* Card 2: AI Document Copilot */}
          <div className="rounded-2xl p-6 bg-slate-800/40 border border-slate-700/60 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                AI Copilot &amp; Smart Analysis
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Unlock deep insights from academic research papers, legal briefs, and financial
                statements. The built-in AI Copilot provides instant document summarization,
                multilingual translations across 30+ languages, interactive natural language Q&amp;A,
                and structured table-to-spreadsheet extraction.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-700/40 flex items-center text-xs font-semibold text-blue-400">
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Gemini-Powered Intelligence</span>
            </div>
          </div>

          {/* Card 3: Lightning Speed & Precision */}
          <div className="rounded-2xl p-6 bg-slate-800/40 border border-slate-700/60 hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Sub-Second Processing &amp; Compression
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Experience ultra-fast batch conversions, instant page reordering, and smart PDF
                compression. Shrink large scan files down to targeted thresholds (100KB, 200KB,
                or 500KB) for seamless email attachments and portal submissions without compromising
                visual typography or vector clarity.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-700/40 flex items-center text-xs font-semibold text-amber-400">
              <Cpu className="w-4 h-4 mr-1.5" />
              <span>Multithreaded Web Workers</span>
            </div>
          </div>
        </div>

        {/* Detailed Semantic Editorial Body */}
        <div className="space-y-4 pt-6 border-t border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed relative z-10">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <span>Why Modern Teams Choose PDFSun Over Desktop Software</span>
          </h3>

          <p>
            Traditional document management often requires bloated desktop software installations,
            costly recurring subscriptions, or risking confidential data on untrusted cloud servers.
            PDFSun solves this dilemma by uniting over 30 essential tools—including PDF merging,
            splitting, page rotation, optical character recognition (OCR), digital signature stamping,
            and password decryption—into a single, high-performance web platform that works instantly
            on Windows, macOS, Linux, iOS, and Android devices.
          </p>

          <p>
            Whether preparing invoices, merging semester study notes, or redacting sensitive client
            identities, PDFSun ensures that your workflows remain unthrottled, ad-compliant, and
            strictly private. No user registration or credit card is ever required to access our core
            utilities.
          </p>
        </div>

        {/* Compliant In-Article AdSense Banner (Only when enabled and non-intrusive) */}
        {showAd && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col items-center justify-center relative z-10">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mb-2">
              Sponsored Content
            </span>
            <AdSensePlaceholder
              slotId="pdfsun-auto-incontent-02"
              format="rectangle"
              className="my-0 w-full"
            />
          </div>
        )}
      </article>
    </section>
  );
};
