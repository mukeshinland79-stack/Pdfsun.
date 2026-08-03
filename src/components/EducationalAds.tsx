import React from "react";
import { GraduationCap, Landmark, ExternalLink, Award, CheckCircle2, BookOpen } from "lucide-react";
import adsData from "../data/ads.json";

export interface EducationalAdItem {
  id: string;
  institution: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: string[];
  ctaText: string;
  ctaUrl: string;
  bannerUrl?: string;
  logo: string;
  accentGradient: string;
  badgeStyle: string;
}

export const EducationalAds: React.FC<{ className?: string }> = ({ className = "" }) => {
  const ads = (adsData.educationalAds || []) as EducationalAdItem[];

  if (!ads || ads.length === 0) return null;

  return (
    <section className={`my-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full ${className}`}>
      {/* Header Label */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Featured Educational Partnerships & Academic Excellence
          </h2>
        </div>
        <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          SPONSORED EDUCATION
        </span>
      </div>

      {/* Side-by-side flex grid on desktop/tablet, stacked on mobile */}
      <div className="educational-ad-grid grid grid-cols-1 md:grid-cols-2 gap-6">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="group relative rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Banner Graphic Header */}
            {ad.bannerUrl && (
              <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                <img
                  src={ad.bannerUrl}
                  alt={ad.institution}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide border backdrop-blur-md ${ad.badgeStyle}`}>
                    <Award className="w-3 h-3 mr-1 shrink-0" />
                    {ad.badge}
                  </span>
                  <span className="text-2xl p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                    {ad.logo}
                  </span>
                </div>
              </div>
            )}

            {/* Top Accent Gradient Border if no banner */}
            {!ad.bannerUrl && (
              <div className={`h-1.5 bg-gradient-to-r ${ad.accentGradient}`} />
            )}

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                {!ad.bannerUrl && (
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide border ${ad.badgeStyle}`}>
                      <Award className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      {ad.badge}
                    </span>
                    <span className="text-3xl shrink-0 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      {ad.logo}
                    </span>
                  </div>
                )}

                {/* Institution Title */}
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  {ad.institution.includes("Technology") ? (
                    <GraduationCap className="w-5 h-5 text-amber-500 inline shrink-0" />
                  ) : (
                    <Landmark className="w-5 h-5 text-blue-500 inline shrink-0" />
                  )}
                  <span>{ad.institution}</span>
                </h3>

                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
                  {ad.subtitle}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {ad.description}
                </p>

                {/* Metrics Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {ad.metrics.map((metric, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/60"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1.5 shrink-0" />
                      {metric}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <a
                href={ad.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${ad.accentGradient} hover:opacity-95 transition-all shadow-md flex items-center justify-center space-x-2 group/btn`}
              >
                <span>{ad.ctaText}</span>
                <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
