import React, { useState } from "react";
import {
  Sun,
  Mail,
  User,
  Globe,
  ShieldCheck,
  Heart,
  BookOpen,
  LifeBuoy,
  Code2,
  Cpu,
  Terminal,
  Zap,
  Sparkles,
  Layers,
  CheckCircle2,
  Laptop,
} from "lucide-react";
import { PolicyType } from "../types";
import { NewsletterSubscription } from "./NewsletterSubscription";
import { PDFSunLogo } from "./PDFSunLogo";
import { PDFSunBrandShowcaseModal } from "./PDFSunBrandShowcaseModal";
import { ALL_TOOLS } from "../data/toolsData";

interface FooterProps {
  onOpenPolicy: (policy: PolicyType) => void;
  onOpenAllTools: () => void;
  onOpenAiTools: () => void;
  onOpenBlogModal: () => void;
  onOpenContactModal: () => void;
  onOpenSitemapModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicy,
  onOpenAllTools,
  onOpenAiTools,
  onOpenBlogModal,
  onOpenContactModal,
  onOpenSitemapModal,
}) => {
  const [showBrandShowcase, setShowBrandShowcase] = useState(false);

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <PDFSunLogo layout="horizontal" size="lg" theme="dark" showTagline />

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              PDFSun (pdfsun.in) — Your Smart Document Companion. Merge, split, compress, convert, edit, and analyze documents with cutting-edge Gemini 3.6 AI and 100% in-browser privacy.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowBrandShowcase(true)}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Brand Identity Guidelines & Logo Kit</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-2 text-xs font-medium text-slate-400">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Website: <a href="https://pdfsun.in" target="_blank" rel="noreferrer" className="text-white font-mono hover:text-amber-400 hover:underline">https://pdfsun.in</a></span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Support: <a href="mailto:mukeshkalonia241@gmail.com" className="text-amber-400 hover:underline">mukeshkalonia241@gmail.com</a></span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Owner: <strong className="text-white">Mukesh Kalonia</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-amber-400 transition">
                  Home
                </button>
              </li>
              <li>
                <button onClick={onOpenAllTools} className="hover:text-amber-400 transition">
                  All PDF Tools ({ALL_TOOLS.length})
                </button>
              </li>
              <li>
                <button onClick={onOpenAiTools} className="hover:text-amber-400 transition flex items-center space-x-1 text-amber-400 font-bold">
                  <span>AI Tools Suite</span>
                </button>
              </li>
              <li>
                <a href="#pricing" className="hover:text-amber-400 transition">
                  Pricing Plans
                </a>
              </li>
              <li>
                <button onClick={onOpenBlogModal} className="hover:text-amber-400 transition">
                  Blog & Articles
                </button>
              </li>
              <li>
                <button onClick={onOpenContactModal} className="hover:text-amber-400 transition">
                  Support & Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Policies</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-amber-400 transition">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("privacy")} className="hover:text-amber-400 transition">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("terms")} className="hover:text-amber-400 transition">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={onOpenContactModal} className="hover:text-amber-400 transition">
                  Contact Us
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("about")} className="hover:text-amber-400 transition">
                  About Us
                </button>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center space-x-1 font-bold text-amber-400"
                  title="View Dynamic XML Sitemap"
                >
                  <span>XML Sitemap (.xml)</span>
                </a>
              </li>
              {onOpenSitemapModal && (
                <li>
                  <button onClick={onOpenSitemapModal} className="hover:text-amber-400 transition">
                    Visual Sitemap
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Resources</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <button onClick={onOpenContactModal} className="hover:text-amber-400 transition">
                  Help Center
                </button>
              </li>
              <li>
                <button onClick={onOpenBlogModal} className="hover:text-amber-400 transition">
                  Tutorials & Guides
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition">
                  FAQs & Security
                </a>
              </li>
              {onOpenSitemapModal && (
                <li>
                  <button
                    onClick={onOpenSitemapModal}
                    className="hover:text-amber-400 transition flex items-center space-x-1 font-bold text-amber-400/90"
                  >
                    <span>SEO Sitemap (.xml)</span>
                  </button>
                </li>
              )}
              <li className="pt-2 flex items-center space-x-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>GDPR Compliant</span>
              </li>
            </ul>
          </div>

          {/* Social Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Social</h4>
            <div className="grid grid-cols-1 gap-2 text-xs font-medium text-slate-400">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2">
                <span>Facebook</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2">
                <span>LinkedIn</span>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2">
                <span>YouTube</span>
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2">
                <span>X (Twitter)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Professional Website Developer & Pro Features Lower Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-amber-950/30 border border-amber-500/20 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center shadow-lg font-black shrink-0">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black text-white tracking-wide uppercase">
                    Professional Developer Pro Suite
                  </h4>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    v3.8 Production Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Architected & Engineered by <strong className="text-amber-400 font-bold">Mukesh Kalonia</strong> • Lead Web Developer
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>100% Operational • 0.02s Response</span>
            </div>
          </div>

          {/* Short Pro Feature Icons & Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 group hover:border-amber-500/50 transition">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-200 truncate">Gemini 3.6 AI Core</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 group hover:border-blue-500/50 transition">
              <Zap className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-200 truncate">Turbo GPU Canvas</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 group hover:border-emerald-500/50 transition">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-200 truncate">256-Bit SSL Encryption</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 group hover:border-indigo-500/50 transition">
              <Terminal className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-200 truncate">WASM Multi-thread</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 group hover:border-purple-500/50 transition">
              <Cpu className="w-4 h-4 text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-200 truncate">Zero-Knowledge Sandbox</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-2 group hover:border-orange-500/50 transition">
              <Globe className="w-4 h-4 text-orange-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-200 truncate">Global Edge CDN</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span>🇮🇳</span>
            <strong className="text-white">Proudly Made in India</strong>
            <span>•</span>
            <span>© 2026 <strong className="text-white">PDF Sun</strong>. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>Designed & Engineered by</span>
            <strong className="text-amber-400 font-bold">Mukesh Kalonia</strong>
            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
              Lead Web Developer
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
