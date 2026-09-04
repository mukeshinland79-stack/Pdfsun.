import React from "react";
import { ShieldCheck, Zap, Globe2 } from "lucide-react";
import { getToolSeoSentences } from "../data/toolSeoSentences";

interface ToolSeoThreeSentenceCardProps {
  toolId: string;
  toolName: string;
}

export const ToolSeoThreeSentenceCard: React.FC<ToolSeoThreeSentenceCardProps> = ({
  toolId,
  toolName,
}) => {
  const { sentence1, sentence2, sentence3 } = getToolSeoSentences(toolId, toolName);

  return (
    <div
      id={`${toolId}-seo-highlights`}
      className="w-full max-w-4xl mx-auto my-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-all text-left"
      aria-label={`Key Benefits and Global Overview for ${toolName}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {toolName} Overview &amp; Key Advantages
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Zero Server Uploads</span>
          </span>
          <span className="inline-flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>WebAssembly Speed</span>
          </span>
          <span className="inline-flex items-center space-x-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/20">
            <Globe2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Global Access</span>
          </span>
        </div>
      </div>

      <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-normal">
        {/* Sentence 1: The Hook & Core Functionality */}
        <p className="flex items-start space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900 dark:text-white">Core Functionality: </strong>
            {sentence1}
          </span>
        </p>

        {/* Sentence 2: Technical Advantage & Trust (WebAssembly Privacy) */}
        <p className="flex items-start space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900 dark:text-white">Privacy &amp; Speed: </strong>
            {sentence2}
          </span>
        </p>

        {/* Sentence 3: Global Call to Action & Value */}
        <p className="flex items-start space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900 dark:text-white">Global Access: </strong>
            {sentence3}
          </span>
        </p>
      </div>
    </div>
  );
};
