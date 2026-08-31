import React, { useState } from "react";
import {
  Sun,
  Mail,
  Globe,
  ShieldCheck,
  Heart,
  BookOpen,
  LifeBuoy,
  Sparkles,
  CheckCircle2,
  Lock,
  Facebook,
  Linkedin,
  Youtube,
} from "lucide-react";
import { PolicyType } from "../types";
import { PDFSunLogo } from "./PDFSunLogo";
import { PDFSunBrandShowcaseModal } from "./PDFSunBrandShowcaseModal";
import { ALL_TOOLS } from "../data/toolsData";
import { useLanguage } from "../lib/i18n";

// Custom modern X (formerly Twitter) SVG icon
const XIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface FooterProps {
  onOpenPolicy: (policy: PolicyType) => void;
  onOpenAllTools: () => void;
  onOpenAiTools: () => void;
  onOpenTodayInHistory?: () => void;
  onOpenBlogModal: () => void;
  onOpenContactModal: () => void;
  onOpenPricing?: () => void;
  onOpenInstallApp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicy,
  onOpenAllTools,
  onOpenAiTools,
  onOpenTodayInHistory,
  onOpenBlogModal,
  onOpenContactModal,
  onOpenPricing,
  onOpenInstallApp,
}) => {
  const [showBrandShowcase, setShowBrandShowcase] = useState(false);
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <PDFSunLogo layout="horizontal" size="lg" theme="dark" showTagline />

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {t(
                "footer.brandDescription",
                "PDFSun (pdfsun.in) — Your Smart Document Companion. Merge, split, compress, convert, edit, and analyze documents with cutting-edge Gemini 3.6 AI and 100% in-browser privacy."
              )}
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowBrandShowcase(true)}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("footer.brandGuidelines", "Brand Identity Guidelines & Logo Kit")}</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-2 text-xs font-medium text-slate-400">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  {t("footer.website", "Website")}:{" "}
                  <a
                    href="https://www.pdfsun.in"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white font-mono hover:text-amber-400 hover:underline"
                  >
                    https://www.pdfsun.in
                  </a>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  {t("footer.support", "Support")}:{" "}
                  <button
                    onClick={onOpenContactModal}
                    className="text-amber-400 hover:underline cursor-pointer"
                  >
                    support@pdfsun.in
                  </button>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t("footer.privateProcessing", "100% Private & In-Browser Processing")}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {t("footer.quickLinks", "Quick Links")}
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  {t("home", "Home")}
                </button>
              </li>
              <li>
                <button onClick={onOpenAllTools} className="hover:text-amber-400 transition cursor-pointer">
                  {t("footer.allPdfTools", `All PDF Tools (${ALL_TOOLS.length})`)}
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAiTools}
                  className="hover:text-amber-400 transition flex items-center space-x-1 text-amber-400 font-bold cursor-pointer"
                >
                  <span>{t("footer.aiToolsSuite", "AI Tools Suite")}</span>
                </button>
              </li>
              {onOpenTodayInHistory && (
                <li>
                  <button
                    onClick={onOpenTodayInHistory}
                    className="hover:text-amber-400 transition flex items-center space-x-1.5 text-amber-400/90 font-medium cursor-pointer"
                  >
                    <span>{t("footer.todayInHistory", "Today in History (30 Lang)")}</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      NEW
                    </span>
                  </button>
                </li>
              )}
              <li>
                {onOpenPricing ? (
                  <button
                    type="button"
                    onClick={onOpenPricing}
                    className="hover:text-amber-400 transition cursor-pointer text-left"
                  >
                    {t("footer.pricingPlans", "Pricing Plans")}
                  </button>
                ) : (
                  <a href="#pricing" className="hover:text-amber-400 transition">
                    {t("footer.pricingPlans", "Pricing Plans")}
                  </a>
                )}
              </li>
              {onOpenInstallApp && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenInstallApp}
                    className="hover:text-blue-400 transition flex items-center space-x-1.5 text-blue-400 font-bold cursor-pointer"
                  >
                    <span>📱 {t("footer.installApp", "Install PDFSun App")}</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      PWA
                    </span>
                  </button>
                </li>
              )}
              <li>
                <button onClick={onOpenBlogModal} className="hover:text-amber-400 transition cursor-pointer">
                  {t("footer.blogArticles", "Blog & Articles")}
                </button>
              </li>
              <li>
                <button onClick={onOpenContactModal} className="hover:text-amber-400 transition cursor-pointer">
                  {t("footer.supportContact", "Support & Contact")}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {t("footer.policies", "Policies")}
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="hover:text-amber-400 transition cursor-pointer"
                >
                  {t("home", "Home")}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("privacy")} className="hover:text-amber-400 transition cursor-pointer">
                  {t("privacyPolicy", "Privacy Policy")}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("terms")} className="hover:text-amber-400 transition cursor-pointer">
                  {t("termsOfService", "Terms of Service")}
                </button>
              </li>
              <li>
                <button onClick={onOpenContactModal} className="hover:text-amber-400 transition cursor-pointer">
                  {t("contactUs", "Contact Us")}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("about")} className="hover:text-amber-400 transition cursor-pointer">
                  {t("aboutUs", "About Us")}
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {t("footer.resources", "Resources")}
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <button onClick={onOpenContactModal} className="hover:text-amber-400 transition cursor-pointer">
                  {t("footer.helpCenter", "Help Center")}
                </button>
              </li>
              <li>
                <button onClick={onOpenBlogModal} className="hover:text-amber-400 transition cursor-pointer">
                  {t("footer.tutorialsGuides", "Tutorials & Guides")}
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition">
                  {t("footer.faqsSecurity", "FAQs & Security")}
                </a>
              </li>
              <li className="pt-2 flex items-center space-x-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.2]" />
                <span>{t("footer.isoGdprCompliant", "ISO 27001 & GDPR Compliant")}</span>
              </li>
            </ul>
          </div>

          {/* Social Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {t("footer.social", "Social Media")}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t("footer.socialDesc", "Connect with our developer & PDF community")}
            </p>
            {/* Inline flex row with gap-3, glassmorphism container and smooth hover animations */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow PDFSun on Facebook"
                title="Follow PDFSun on Facebook"
                className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow PDFSun on LinkedIn"
                title="Follow PDFSun on LinkedIn"
                className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Subscribe to PDFSun on YouTube"
                title="Subscribe to PDFSun on YouTube"
                className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow PDFSun on X (Twitter)"
                title="Follow PDFSun on X (Twitter)"
                className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <XIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Security & Trust Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 my-4 border-t border-b border-slate-800/80 text-xs font-semibold text-slate-300 bg-slate-900/60 backdrop-blur-xs rounded-2xl px-5">
          <div className="flex items-center justify-center sm:justify-start gap-2.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="truncate">{t("footer.securityEncrypted", "256-Bit SSL Encrypted Connection")}</span>
          </div>
          <div className="flex items-center justify-center sm:justify-end lg:justify-center gap-2.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="truncate">{t("footer.isoGdprCompliant", "ISO 27001 & GDPR Compliant")}</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start lg:justify-center gap-2.5 text-blue-400">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 stroke-[2.2]" />
            <span className="truncate">{t("footer.paymentPartner", "Razorpay Verified Partner (UPI & Cards)")}</span>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2.5 text-amber-400">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="truncate">{t("footer.instantDelivery", "Instant In-Browser Processing")}</span>
          </div>
        </div>

        {/* Bottom Clean Copyright & Compliance Row */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 text-center md:text-left">
            <span className="text-sm">🇮🇳</span>
            <span className="font-semibold text-slate-200">{t("footer.madeInIndia", "Proudly Made in India")}</span>
            <span className="text-slate-600">•</span>
            <span>© 2026 <strong className="text-slate-200 font-bold">PDFSun</strong>. {t("footer.rights", "All rights reserved.")}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{t("footer.designedBy", "Designed & Engineered by")} <span className="text-slate-300 font-medium">Mukesh Kalonia</span></span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400 text-xs shrink-0 bg-slate-900/40 border border-slate-800/60 rounded-full px-3.5 py-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="font-medium text-slate-300">
              {t("footer.complianceFull", "Built aligned with ISO 27001 Security Standards • GDPR Privacy Compliant")}
            </span>
          </div>
        </div>
      </div>

      {/* Brand Identity Master Showcase Modal */}
      {showBrandShowcase && (
        <PDFSunBrandShowcaseModal onClose={() => setShowBrandShowcase(false)} />
      )}
    </footer>
  );
};

