import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  FileCheck,
  Combine,
  Minimize2,
  FileText,
} from "lucide-react";
import { ToolItem } from "../types";
import { ALL_TOOLS } from "../data/toolsData";
import { useLanguage } from "../lib/i18n";
import { triggerErrorToast } from "./GlobalErrorToast";

interface HeroSectionProps {
  onSelectTool: (tool: ToolItem, initialFiles?: File[]) => void;
  onOpenSearch: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectTool,
  onOpenSearch,
}) => {
  const { t } = useLanguage();

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const defaultTool =
        acceptedFiles.length > 1
          ? ALL_TOOLS.find((t) => t.id === "merge-pdf")!
          : ALL_TOOLS.find((t) => t.id === "ai-chat-pdf")!;
      onSelectTool(defaultTool, acceptedFiles);
    }
  };

  const onDropRejected = (fileRejections: any[]) => {
    if (fileRejections && fileRejections.length > 0) {
      const rejected = fileRejections[0];
      const name = rejected?.file?.name || "File";
      const err = rejected?.errors?.[0]?.message || "Unsupported file format or unreadable document.";
      triggerErrorToast(
        "Upload Not Accepted",
        `"${name}" could not be loaded: ${err}`,
        { type: "upload", fileName: name }
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept } =
    useDropzone({
      onDrop,
      onDropRejected,
      multiple: true,
      accept: {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx", ".xls"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx", ".ppt"],
        "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp"],
        "text/*": [".txt", ".html", ".csv", ".rtf", ".md"],
        "application/epub+zip": [".epub"],
      },
    });

  const quickTags = [
    { name: t("mergePdf", "Merge PDF"), toolId: "merge-pdf", icon: Combine },
    { name: t("compressPdf", "Compress PDF"), toolId: "compress-pdf", icon: Minimize2 },
    { name: t("pdfToWord", "PDF to Word"), toolId: "pdf-to-word", icon: FileText },
    { name: t("chatWithPdf", "AI Chat with PDF"), toolId: "ai-chat-pdf", icon: Sparkles },
    { name: t("aiSummary", "AI Summary"), toolId: "ai-pdf-summary", icon: Zap },
    { name: "Resume Ready", toolId: "ai-resume-builder", icon: FileText },
  ];

  return (
    <section id="hero-section" aria-label="PDFSun Hero Section" className="relative overflow-hidden bg-gradient-to-b from-blue-500/5 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900 py-6 sm:py-8 border-b border-slate-200 dark:border-slate-800">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-sky-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4 sm:space-y-5">
        {/* Trust Badge Pills & Engine Status Container */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Real-Time Live Status Indicator */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold shadow-2xs backdrop-blur-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All PDF engines running at maximum speed</span>
          </div>

          {/* Badge 1: 100% Client-Side Privacy */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-medium shadow-2xs backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">100% In-Browser</span>
            <span className="text-emerald-300 dark:text-emerald-700 font-light">•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-normal">Files Never Stored</span>
            <span className="hidden sm:inline text-emerald-300 dark:text-emerald-700 font-light">•</span>
            <span className="hidden sm:inline text-emerald-700 dark:text-emerald-400 font-normal">Zero Server Uploads</span>
          </div>

          {/* Badge 2: Offline Ready */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-[11px] font-medium shadow-2xs backdrop-blur-xs">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-bold">Lightning Fast</span>
            <span className="text-blue-300 dark:text-blue-700 font-light">•</span>
            <span className="text-slate-600 dark:text-slate-400 font-normal">Works 100% Offline</span>
          </div>

          {/* Badge 3: Pro PDF Utilities */}
          <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shadow-2xs backdrop-blur-xs">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-bold">{ALL_TOOLS.length} Pro PDF Tools</span>
            <span className="text-slate-300 dark:text-slate-600 font-light">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal">Client Sandboxed</span>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t("heroTitle", "Enterprise PDF Tools & AI Document Engine")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-normal">
            {t("heroSub", "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.")}
          </p>
        </div>

        {/* Quick Search & Launch */}
        <div className="max-w-lg mx-auto flex items-center bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-md shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-slate-700">
          <Search className="w-4 h-4 text-blue-600 ml-2.5 shrink-0" />
          <input
            type="text"
            placeholder={t("searchPlaceholder", `Search ${ALL_TOOLS.length} tools (Cmd+K)...`)}
            onClick={onOpenSearch}
            readOnly
            className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none cursor-pointer"
          />
          <button
            onClick={onOpenSearch}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-[11px] font-bold shadow-xs hover:opacity-90 transition flex items-center space-x-1 shrink-0"
          >
            <span>{t("nav.searchBtn", "Search")}</span>
            <kbd className="hidden sm:inline-block px-1 py-0.5 bg-white/20 rounded text-[9px]">⌘K</kbd>
          </button>
        </div>

        {/* Drag & Drop Main Dropzone - Compact & Tight */}
        <div
          {...getRootProps()}
          className={`max-w-xl mx-auto rounded-2xl p-4 sm:p-5 border-2 border-dashed transition-all duration-300 shadow-md relative group cursor-pointer aurora-glass ${
            isDragAccept || isDragActive
              ? "border-emerald-500 bg-emerald-500/10 scale-[1.01] ring-2 ring-emerald-500/20"
              : "border-slate-300 dark:border-slate-700 bg-white/85 dark:bg-slate-800/85 hover:border-blue-500 dark:hover:border-blue-400"
          }`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr p-0.5 shadow-sm group-hover:scale-105 transition duration-200 ${
              isDragActive ? "from-emerald-500 to-teal-500 shadow-emerald-500/30 animate-bounce" : "from-blue-600 to-indigo-600 shadow-blue-500/20"
            }`}>
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <UploadCloud className={`w-5 h-5 ${isDragActive ? "text-emerald-500" : "text-blue-600"}`} />
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isDragActive
                  ? t("dropzoneActiveTitle", "Release files to launch tool workspace")
                  : t("dropzoneTitle", "Drop PDF files here or click to browse")}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isDragActive ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {t("dropzoneActiveSub", "Drop now to start processing instantly")}
                  </span>
                ) : (
                  <>
                    {t("or", "or")} <span className="text-blue-600 dark:text-blue-400 font-semibold underline">{t("hero.chooseFiles", "Choose Files from Device")}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 pt-0.5 text-[10px] text-slate-400 font-medium">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50">PDF</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50">Word</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50">Excel</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50">PPTX</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50">Images</span>
            </div>
          </div>
        </div>

        {/* Popular Quick Tools Pills */}
        <div className="pt-0.5">
          <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">{t("quick_actions.title", "Popular:")}</span>
            {quickTags.map((tag) => {
              const tool = ALL_TOOLS.find((t) => t.id === tag.toolId);
              if (!tool) return null;
              const Icon = tag.icon;
              return (
                <button
                  key={tag.toolId}
                  onClick={() => onSelectTool(tool)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs hover:shadow-xs transition"
                >
                  <Icon className="w-3 h-3 text-blue-600" />
                  <span>{tag.name}</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
