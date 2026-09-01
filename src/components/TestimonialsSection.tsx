import React from "react";
import { Star, MessageSquare } from "lucide-react";
import { TESTIMONIALS } from "../data/toolsData";
import { useLanguage } from "../lib/i18n";

export const TestimonialsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-800/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t("testimonials.badge", "Loved by 500,000+ Users")}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t("testimonials.title", "Trusted by Students, Lawyers & Researchers")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {t("testimonials.subtitle", "See what students and industry professionals say about PDFSun efficiency, privacy, and Gemini AI capabilities.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.id}
              itemScope
              itemType="https://schema.org/Review"
              className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
            >
              {/* Required Schema.org itemReviewed property for Google Search Console / Rich Results */}
              <div itemProp="itemReviewed" itemScope itemType="https://schema.org/SoftwareApplication" className="hidden">
                <meta itemProp="name" content="PDFSun - Online PDF Tools" />
                <meta itemProp="applicationCategory" content="UtilitiesApplication" />
                <meta itemProp="operatingSystem" content="All" />
                <meta itemProp="url" content="https://pdfsun.in" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-1 text-amber-400" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                  <meta itemProp="ratingValue" content={item.rating.toString()} />
                  <meta itemProp="bestRating" content="5" />
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed" itemProp="reviewBody">
                  "{t(`testimonials.quote_${item.id}`, item.quote)}"
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700" itemProp="author" itemScope itemType="https://schema.org/Person">
                <img
                  src={item.avatar}
                  alt={item.name}
                  loading="lazy"
                  width="40"
                  height="40"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/30"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white" itemProp="name">{item.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {t(`testimonials.role_${item.id}`, item.role)} • {item.organization}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
