import React from "react";
import {
  Sun,
  Mail,
  User,
  Globe,
  ShieldCheck,
  Heart,
  BookOpen,
  LifeBuoy,
} from "lucide-react";
import { PolicyType } from "../types";
import { NewsletterSubscription } from "./NewsletterSubscription";

interface FooterProps {
  onOpenPolicy: (policy: PolicyType) => void;
  onOpenAllTools: () => void;
  onOpenAiTools: () => void;
  onOpenBlogModal: () => void;
  onOpenContactModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicy,
  onOpenAllTools,
  onOpenAiTools,
  onOpenBlogModal,
  onOpenContactModal,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Newsletter Subscription Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800/90 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <NewsletterSubscription />
            </div>
            <div className="lg:col-span-5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Subscriber Perks</h5>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Early access to new Gemini 3.6 AI PDF utilities</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Exclusive document compression & security workflows</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Weekly productivity guides & keyboard shortcut cheat sheets</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tight">PDFSun</span>
                <p className="text-[10px] font-bold text-amber-400 tracking-wider">PDFSUN.COM</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Powerful PDF Tools for Everyone. Merge, split, compress, convert, edit, and analyze documents with cutting-edge Gemini 3.6 AI and local browser encryption.
            </p>

            <div className="space-y-1.5 pt-2 text-xs font-medium text-slate-400">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Domain: <strong className="text-white font-mono">PDFSUN.COM</strong></span>
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
                  All PDF Tools (50+)
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
                <button onClick={() => onOpenPolicy("privacy")} className="hover:text-amber-400 transition">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("terms")} className="hover:text-amber-400 transition">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("cookie")} className="hover:text-amber-400 transition">
                  Cookie Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("refund")} className="hover:text-amber-400 transition">
                  Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy("about")} className="hover:text-amber-400 transition">
                  About PDFSun
                </button>
              </li>
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

        {/* Bottom Copyright Row */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span>🇮🇳</span>
            <strong className="text-white">Proudly Made in India</strong>
            <span>•</span>
            <span>© 2026 <strong className="text-white">PDFSUN.COM</strong>. All Rights Reserved.</span>
          </div>

          <div className="flex items-center space-x-1">
            <span>Designed & Developed by</span>
            <strong className="text-amber-400 font-bold">Mukesh Kalonia</strong>
          </div>
        </div>
      </div>
    </footer>
  );
};
