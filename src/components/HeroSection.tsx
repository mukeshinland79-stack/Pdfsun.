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

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      multiple: true,
      accept: {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
        "image/*": [".jpg", ".jpeg", ".png"],
        "text/plain": [".txt"],
        "text/html": [".html"],
      },
    });

  const quickTags = [
    { name: t("mergePdf", "Merge PDF"), toolId: "merge-pdf", icon: Combine },
    { name: t("compressPdf", "Compress PDF"), toolId: "compress-pdf", icon: Minimize2 },
    { name: "PDF to Word", toolId: "pdf-to-word", icon: FileText },
    { name: t("chatWithPdf", "AI Chat with PDF"), toolId: "ai-chat-pdf", icon: Sparkles },
    { name: "AI Summary", toolId: "ai-pdf-summary", icon: Zap },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-500/5 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900 py-12 sm:py-20 border-b border-slate-200 dark:border-slate-800">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/15 to-sky-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        {/* Brand Trust Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>PDFSUN.COM • Enterprise Grade • 100% Client-Side Privacy</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t("heroTitle", "Enterprise PDF Tools & AI Document Engine")}
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {t("heroSub", "100% Client-Side WebAssembly Processing. Private, Fast, & Secure.")}
          </p>
        </div>

        {/* Quick Search & Launch */}
        <div className="max-w-xl mx-auto flex items-center bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-blue-600 ml-3" />
          <input
            type="text"
            placeholder={t("searchPlaceholder", "Search 50+ tools (Cmd+K)...")}
            onClick={onOpenSearch}
            readOnly
            className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none cursor-pointer"
          />
          <button
            onClick={onOpenSearch}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition flex items-center space-x-1.5"
          >
            <span>Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white/20 rounded text-[10px]">⌘K</kbd>
          </button>
        </div>

        {/* Drag & Drop Main Dropzone with react-dropzone integration */}
        <div
          {...getRootProps()}
          className={`max-w-2xl mx-auto rounded-3xl p-8 sm:p-10 border-2 border-dashed transition-all duration-200 shadow-2xl relative group cursor-pointer ${
            isDragReject
              ? "border-rose-500 bg-rose-500/10 scale-[1.01]"
              : isDragAccept
              ? "border-emerald-500 bg-emerald-500/10 scale-[1.02] ring-4 ring-emerald-500/20"
              : isDragActive
              ? "border-blue-600 bg-blue-500/10 scale-[1.02] ring-4 ring-blue-500/20"
              : "border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:border-blue-500 dark:hover:border-blue-400"
          }`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr p-0.5 shadow-lg group-hover:scale-110 transition duration-200 ${
              isDragActive ? "from-emerald-500 to-teal-500 shadow-emerald-500/30 animate-bounce" : "from-blue-600 to-indigo-600 shadow-blue-500/30"
            }`}>
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <UploadCloud className={`w-8 h-8 ${isDragActive ? "text-emerald-500" : "text-blue-600"}`} />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isDragActive
                  ? isDragReject
                    ? "Some files may not be supported"
                    : "Release files to launch tool workspace"
                  : t("dropzoneTitle", "Drop PDF files here or click to browse")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDragActive ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Drop now to start processing instantly
                  </span>
                ) : (
                  <>
                    or <span className="text-blue-600 dark:text-blue-400 font-semibold underline">Choose Files from Device</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] text-slate-400 font-medium">
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50">PDF</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50">Word</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50">Excel</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50">PPTX</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50">Images</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50">HTML/TXT</span>
            </div>
          </div>
        </div>

        {/* Popular Quick Tools Pills */}
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Popular Quick Actions</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {quickTags.map((tag) => {
              const tool = ALL_TOOLS.find((t) => t.id === tag.toolId);
              if (!tool) return null;
              const Icon = tag.icon;
              return (
                <button
                  key={tag.toolId}
                  onClick={() => onSelectTool(tool)}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs hover:shadow-md transition"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{tag.name}</span>
                  <ArrowRight className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Security Bullet Highlights */}
        <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-slate-200/60 dark:border-slate-800 max-w-4xl mx-auto">
          <div className="flex items-start space-x-3 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/40">
            <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Ultra Fast Speed</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Local browser acceleration engine.</div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/40">
            <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">No Storage Purge</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Zero permanent file retention guarantee.</div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/40">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Gemini 3.6 AI</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Smart chat, summary & translation.</div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/40">
            <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">50+ Working Tools</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Complete PDF conversion suite.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
