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
} from "lucide-react";
import { PolicyType } from "../types";
import { PDFSunLogo } from "./PDFSunLogo";
import { PDFSunBrandShowcaseModal } from "./PDFSunBrandShowcaseModal";
import { ALL_TOOLS } from "../data/toolsData";
import { useLanguage } from "../lib/i18n";

interface FooterProps {
  onOpenPolicy: (policy: PolicyType) => void;
  onOpenAllTools: () => void;
  onOpenAiTools: () => void;
  onOpenTodayInHistory?: () => void;
  onOpenBlogModal: () => void;
  onOpenContactModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicy,
  onOpenAllTools,
  onOpenAiTools,
  onOpenTodayInHistory,
  onOpenBlogModal,
  onOpenContactModal,
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
                <span>100% Private & In-Browser Processing</span>
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
                    <span>Today in History (30 Lang)</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      NEW
                    </span>
                  </button>
                </li>
              )}
              <li>
                <a href="#pricing" className="hover:text-amber-400 transition">
                  {t("footer.pricingPlans", "Pricing Plans")}
                </a>
              </li>
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
                <ShieldCheck className="w-4 h-4" />
                <span>{t("footer.gdprCompliant", "GDPR Compliant")}</span>
              </li>
            </ul>
          </div>

          {/* Social Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {t("footer.social", "Social")}
            </h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-medium text-slate-400">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2"
              >
                <span>Facebook</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2"
              >
                <span>LinkedIn</span>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2"
              >
                <span>YouTube</span>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2"
              >
                <span>X (Twitter)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Security & Trust Section */}
        <div className="flex flex-wrap items-center justify-around gap-6 py-4 my-4 border-t border-b border-slate-800/80 text-xs font-bold text-slate-300 bg-slate-900/60 rounded-2xl px-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
            <span>{t("footer.securityEncrypted", "🔒 256-Bit SSL Encrypted Connection")}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 stroke-[2.5]" />
            <span>{t("footer.paymentPartner", "🛡️ Razorpay Verified Partner (UPI, Cards, NetBanking Supported)")}</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>{t("footer.instantDelivery", "⚡ Instant Automated Delivery")}</span>
          </div>
        </div>

        {/* Bottom Clean Copyright & Compliance Row */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 text-center md:text-left">
            <span>🇮🇳</span>
            <span className="font-semibold text-slate-300">Proudly Made in India</span>
            <span className="text-slate-600">•</span>
            <span>© 2026 <strong className="text-slate-200 font-bold">PDFSun</strong>. All rights reserved.</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Designed &amp; Engineered by <span className="text-slate-300 font-medium">Mukesh Kalonia</span></span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400 text-xs shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
            <span className="font-medium">ISO 27001 &amp; GDPR Privacy Compliant</span>
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

