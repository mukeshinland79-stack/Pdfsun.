import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Zap,
  Bell,
  Lock,
} from "lucide-react";

interface NewsletterSubscriptionProps {
  className?: string;
  variant?: "standalone" | "compact";
}

export const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({
  className = "",
  variant = "standalone",
}) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pdfsun_newsletter_subscribed");
    if (saved) {
      setIsSubscribed(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address (e.g. user@example.com).");
      return;
    }

    setStatus("loading");

    // Simulate fast subscription API response
    setTimeout(() => {
      setStatus("success");
      setIsSubscribed(true);
      localStorage.setItem("pdfsun_newsletter_subscribed", cleanEmail);
      setEmail("");
    }, 700);
  };

  if (variant === "compact") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <span>PDFSun Digest</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Weekly PDF & AI productivity hacks</p>
          </div>
        </div>

        {isSubscribed ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Subscribed! Check your inbox.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="Enter your email..."
                disabled={status === "loading"}
                className="w-full pl-3 pr-20 py-2.5 rounded-xl text-sm md:text-xs bg-slate-800/90 dark:bg-slate-900 border border-slate-600 text-slate-100 font-medium placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 outline-none transition"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="absolute right-1 top-1 bottom-1 px-3.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition btn-interactive flex items-center space-x-1"
              >
                <span>Join</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
            {status === "error" && (
              <p className="text-[10px] text-rose-500 font-medium">
                {typeof errorMessage === "object" && errorMessage !== null
                  ? (errorMessage as any)?.message || JSON.stringify(errorMessage)
                  : String(errorMessage)}
              </p>
            )}
          </form>
        )}
      </div>
    );
  }

  // Standalone Banner Section (Placed above Footer)
  return (
    <section className={`w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${className}`} id="newsletter">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-10 lg:p-12 text-left">
        {/* Decorative Background Glows */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>PDFSun Weekly Insights</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Stay Ahead with AI & PDF <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Productivity Hacks</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Join over <strong>150,000+ professionals, students, and legal teams</strong>. Get exclusive tutorials, Gemini 3.6 AI prompt workflows, and early access to new PDFSun tools—delivered once a week.
            </p>

            {/* Subscriber Perks List */}
            <div className="pt-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 max-w-xl">
              <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest">SUBSCRIBER PERKS</h4>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Early access to new Gemini 3.6 AI PDF utilities</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Exclusive document compression & security workflows</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span>Weekly productivity guides & keyboard shortcut cheat sheets</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium pt-2">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Spam</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>100% Data Confidentiality</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Bell className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Unsubscribe Anytime</span>
              </div>
            </div>
          </div>

          {/* Right Input / Card Column */}
          <div className="lg:col-span-5 bg-slate-900/90 dark:bg-slate-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-700/60 shadow-xl space-y-4">
            {isSubscribed ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-left space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">You're Subscribed! 🎉</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Welcome to the PDFSun community! You will receive our next edition packed with document tips and new AI features.
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem("pdfsun_newsletter_subscribed");
                    setIsSubscribed(false);
                    setStatus("idle");
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-white underline transition pt-1 cursor-pointer"
                >
                  Subscribe another email address
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newsletter-email" className="block text-xs font-bold text-slate-200">
                    Your Work or Personal Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      placeholder="name@company.com"
                      disabled={status === "loading"}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl text-base md:text-sm bg-slate-800/90 dark:bg-slate-900 border border-slate-600 text-slate-100 font-medium placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 outline-none transition shadow-inner"
                    />
                  </div>
                </div>

                {status === "error" && (
                  <div className="flex items-center space-x-2 text-rose-400 text-xs font-medium p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {typeof errorMessage === "object" && errorMessage !== null
                        ? (errorMessage as any)?.message || JSON.stringify(errorMessage)
                        : String(errorMessage)}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-interactive w-full py-3.5 px-6 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 active:scale-[0.99] transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {status === "loading" ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Subscribing...</span>
                    </span>
                  ) : (
                    <>
                      <span>Get Free Weekly Updates</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center font-medium">
                  By joining, you agree to receive PDFSun product digests. No spam guaranteed.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
