import React, { useState } from "react";
import {
  Mail,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  Zap,
  CreditCard,
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
    <footer
      id="main-footer"
      className="w-full bg-[#0a0d14] text-slate-300 pt-12 pb-12 border-t border-slate-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* 1. TOP TRUST BADGES STRIP (Sub-Footer Header)                             */}
        {/* ========================================================================= */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-4 px-6 mb-10 shadow-sm backdrop-blur-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center text-left">
            
            {/* Card 1: 100% In-Browser Privacy */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Lock className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-emerald-400 block font-bold text-xs truncate">100% In-Browser Privacy</span>
                <span className="text-[11px] text-slate-400 block truncate">Zero Server Uploads</span>
              </div>
            </div>

            {/* Card 2: Enterprise Security */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-emerald-400 block font-bold text-xs truncate">Enterprise Security</span>
                <span className="text-[11px] text-slate-400 block truncate">ISO 27001 &amp; GDPR Compliant</span>
              </div>
            </div>

            {/* Card 3: Razorpay Verified */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <CreditCard className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-blue-400 block font-bold text-xs truncate">Razorpay Verified</span>
                <span className="text-[11px] text-slate-400 block truncate">UPI &amp; Cards Supported</span>
              </div>
            </div>

            {/* Card 4: Ultra Fast Speed */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Zap className="w-4 h-4 stroke-[2.5] text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-amber-400 font-bold text-xs truncate">Ultra Fast Speed</span>
                </div>
                <span className="text-[11px] text-slate-400 block truncate">Instant WebAssembly Engine</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN FOOTER CONTENT (Strict 5-Column Grid Layout)                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-8 text-sm text-slate-300">
          
          {/* COLUMN 1: Brand & Identity */}
          <div className="space-y-3">
            <PDFSunLogo layout="horizontal" size="md" theme="dark" showTagline={false} showProBadge={true} showDomain={false} />
            
            <p className="text-[11px] font-semibold text-amber-400 font-mono tracking-wide">
              pdfsun.in • Your Smart Document Companion
            </p>

            <p className="text-xs text-slate-400 leading-relaxed">
              Merge, split, compress, edit, and analyze documents with cutting-edge Gemini 3.6 AI and 100% in-browser privacy.
            </p>

            {/* Clean Action Row & Micro Status */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowBrandShowcase(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Brand Kit</span>
              </button>

              <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">100% Private &amp; In-Browser Processing</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Quick Links / Tools */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {t("footer.quickLinks", "Quick Links")}
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={onOpenAllTools}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  {t("footer.allPdfTools", `All PDF Tools (${ALL_TOOLS.length})`)}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAiTools}
                  className="hover:text-amber-400 transition-colors flex items-center space-x-1.5 text-amber-400 font-bold cursor-pointer text-left"
                >
                  <span>{t("footer.aiToolsSuite", "AI Tools Suite")}</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-black">AI</span>
                </button>
              </li>
              {onOpenTodayInHistory && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenTodayInHistory}
                    className="hover:text-amber-400 transition-colors flex items-center space-x-1.5 text-slate-300 hover:text-amber-400 cursor-pointer text-left"
                  >
                    <span>Today in History (30 Lang)</span>
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
                    className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                  >
                    {t("footer.pricingPlans", "Pricing Plans")}
                  </button>
                ) : (
                  <a href="#pricing" className="hover:text-amber-400 transition-colors">
                    {t("footer.pricingPlans", "Pricing Plans")}
                  </a>
                )}
              </li>
              {onOpenInstallApp && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenInstallApp}
                    className="hover:text-blue-400 transition-colors flex items-center space-x-1.5 text-blue-400 font-bold cursor-pointer text-left"
                  >
                    <span>Install PDFSun App</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      PWA
                    </span>
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={onOpenBlogModal}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  {t("footer.blogArticles", "Blog & Articles")}
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: Policies */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {t("footer.policies", "Policies")}
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy("privacy")}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  {t("privacyPolicy", "Privacy Policy")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy("terms")}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  {t("termsOfService", "Terms of Service")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy("refund")}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left text-amber-400/90 font-medium"
                >
                  {t("refundPolicy", "Refund Policy")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy("cookie")}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  {t("cookiePolicy", "Cookie Policy")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy("about")}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  {t("aboutUs", "About Us")}
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: Resources */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {t("footer.resources", "Resources")}
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={onOpenContactModal}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  {t("footer.helpCenter", "Help Center")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenBlogModal}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  {t("footer.tutorialsGuides", "Tutorials & Guides")}
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition-colors block">
                  {t("footer.faqsSecurity", "FAQs & Security")}
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 5: Support & Social / CONNECT */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {t("footer.connect", "Connect")}
            </h4>

            {/* Support Highlight Box */}
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs hover:border-amber-500/50 transition-all space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer Support</span>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <button
                  type="button"
                  onClick={onOpenContactModal}
                  className="text-xs font-bold text-amber-400 hover:underline cursor-pointer font-mono truncate"
                >
                  support@pdfsun.in
                </button>
              </div>
            </div>

            {/* Social Icons Row */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                Community
              </span>
              <div className="flex items-center space-x-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow PDFSun on Facebook"
                  title="Follow PDFSun on Facebook"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-xs"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow PDFSun on LinkedIn"
                  title="Follow PDFSun on LinkedIn"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-xs"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Subscribe to PDFSun on YouTube"
                  title="Subscribe to PDFSun on YouTube"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-xs"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow PDFSun on X (Twitter)"
                  title="Follow PDFSun on X (Twitter)"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-xs"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. SUB-FOOTER BOTTOM STRIP (Single Horizon Line Alignment)                */}
        {/* ========================================================================= */}
        <div className="border-t border-slate-800/80 pt-6 mt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          
          {/* Left Side: Ownership & Credits */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 text-center md:text-left">
            <span className="text-sm">🇮🇳</span>
            <span className="font-semibold text-slate-200">Proudly Made in India</span>
            <span className="text-slate-600">•</span>
            <span>© {new Date().getFullYear()} <strong className="text-slate-200 font-bold">PDFSun</strong>. All rights reserved.</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Designed &amp; Engineered by <span className="text-slate-200 font-semibold">Mukesh Kalonia</span>
            </span>
          </div>

          {/* Right Side: Security Standard Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 font-medium text-xs shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">
              Built aligned with ISO 27001 Security Standards • GDPR Privacy Compliant
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




