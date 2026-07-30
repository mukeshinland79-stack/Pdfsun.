import React from "react";
import { Star, MessageSquare } from "lucide-react";
import { TESTIMONIALS } from "../data/toolsData";

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-800/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Loved by 500,000+ Users</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Trusted by Students, Lawyers & Researchers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            See what students and industry professionals say about PDFSun efficiency, privacy, and Gemini AI capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-1 text-amber-400">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/30"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</div>
                  <div className="text-[10px] text-slate-400">{item.role} • {item.organization}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
