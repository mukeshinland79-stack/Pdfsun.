import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  X,
  Mail,
  Send,
  CheckCircle2,
  ExternalLink,
  Crown,
  RefreshCw,
  Gift,
} from "lucide-react";

interface SideSkyscraperAdsProps {
  onSelectTool?: (toolSlug: string) => void;
}

export const SideSkyscraperAds: React.FC<SideSkyscraperAdsProps> = ({ onSelectTool }) => {
  const [leftDismissed, setLeftDismissed] = useState(false);
  const [rightDismissed, setRightDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
    localStorage.setItem("pdfsun_newsletter_subscribed", email);
  };

  const adCards = [
    {
      title: "Gemini 3.6 AI PDF Assistant",
      tagline: "Summarize 200+ page PDFs in seconds with instant Q&A.",
      tag: "SPONSORED",
      accent: "from-amber-500 to-orange-500",
      cta: "Try AI Chat",
      slug: "ai-chat-pdf",
    },
    {
      title: "PDFSun Pro Engine",
      tagline: "Ultra-fast WebAssembly client-side compression & OCR.",
      tag: "ADSENSE",
      accent: "from-blue-600 to-indigo-600",
      cta: "Explore 50+ Tools",
      slug: "compress-pdf",
    },
    {
      title: "100% Private Client Suite",
      tagline: "Your document binary data never reaches any remote server.",
      tag: "VERIFIED",
      accent: "from-emerald-600 to-teal-600",
      cta: "Merge PDFs",
      slug: "merge-pdf",
    },
  ];

  const currentAd = adCards[activeAdIndex % adCards.length];

  return (
    <>
      {/* LEFT SIDE SKYSCRAPER AD (Desktop xl/2xl) */}
      {!leftDismissed && (
        <aside
          className="fixed left-3 top-28 z-20 hidden xl:flex flex-col gap-3 w-44 2xl:w-48 pointer-events-auto transition-all duration-300 animate-fadeIn"
          aria-label="Sponsored Content Left"
        >
          <div className="relative p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-amber-500/30 dark:border-amber-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between text-left group overflow-hidden">
            {/* Header Badge & Dismiss Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                {currentAd.tag}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveAdIndex((prev) => prev + 1)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title="Rotate Ad"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setLeftDismissed(true)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition"
                  title="Close banner"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Ad Content */}
            <div className="py-3 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                {currentAd.title}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {currentAd.tagline}
              </p>
            </div>

            {/* Action CTA */}
            <button
              onClick={() => onSelectTool && onSelectTool(currentAd.slug)}
              className={`w-full py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${currentAd.accent} hover:opacity-90 transition shadow-md flex items-center justify-center space-x-1 btn-interactive`}
            >
              <span>{currentAd.cta}</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {/* Sub-label */}
            <div className="pt-2 text-[9px] font-semibold text-slate-400 text-center">
              Google AdSense • Verified
            </div>
          </div>

          {/* Secondary Pro Feature Pill */}
          <div className="p-3 rounded-xl bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 text-white text-left space-y-1.5 shadow-md">
            <div className="flex items-center space-x-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span>PDFSun Pro</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Zero ads, unlimited 2GB file batching & priority AI speed.
            </p>
          </div>
        </aside>
      )}

      {/* RIGHT SIDE SKYSCRAPER AD & NEWSLETTER (Desktop xl/2xl) */}
      {!rightDismissed && (
        <aside
          className="fixed right-3 top-28 z-20 hidden xl:flex flex-col gap-3 w-44 2xl:w-48 pointer-events-auto transition-all duration-300 animate-fadeIn"
          aria-label="Newsletter & Sponsored Content Right"
        >
          {/* Newsletter Side Card */}
          <div className="relative p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-blue-500/30 dark:border-blue-500/20 shadow-xl backdrop-blur-md flex flex-col justify-between text-left overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white">
                NEWSLETTER
              </span>
              <button
                onClick={() => setRightDismissed(true)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition"
                title="Close banner"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="py-2.5 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                PDFSun Weekly Digest
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                Join 150,000+ users receiving weekly PDF tips & AI hacks.
              </p>
            </div>

            {subscribed ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Subscribed! Check inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-1.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email..."
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm flex items-center justify-center space-x-1 btn-interactive"
                >
                  <span>Subscribe</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}

            <div className="pt-2 text-[9px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Zero Spam • 100% Free</span>
            </div>
          </div>

          {/* AdSense Unit Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white text-left space-y-2 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between text-[9px] font-black text-amber-400 uppercase tracking-widest">
              <span>GOOGLE ADSENSE</span>
              <Gift className="w-3 h-3" />
            </div>
            <p className="text-[11px] font-bold text-slate-100 leading-snug">
              Instant PDF Conversion
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Convert Word, Excel, JPG & PowerPoint to PDF in 1-click.
            </p>
            <a
              href="#tools"
              className="block w-full py-1.5 text-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition border border-white/10"
            >
              Start Free
            </a>
          </div>
        </aside>
      )}
    </>
  );
};
