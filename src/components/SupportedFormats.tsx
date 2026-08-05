import React from "react";
import { FileCheck, Sparkles } from "lucide-react";
import { SUPPORTED_FORMATS } from "../data/toolsData";

export const SupportedFormats: React.FC = () => {
  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-800/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal Document Converter</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Supported File Formats on PDFSun
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Convert, process, and optimize documents across all major office formats, vector images, and eBook standards.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          {SUPPORTED_FORMATS.map((fmt) => (
            <div
              key={fmt.ext}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500 dark:hover:border-amber-400 transition text-center space-y-1.5 group"
            >
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {fmt.badge}
              </span>
              <div className="text-base font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                .{fmt.ext}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1">{fmt.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
