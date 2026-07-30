import React, { useState, useEffect } from "react";
import { Mail, Send, CheckCircle2, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";

interface NewsletterSubscriptionProps {
  className?: string;
  variant?: "footer" | "standalone";
}

export const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({
  className = "",
  variant = "footer",
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

    if (!email || !email.includes("@") || !email.includes(".")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    // Simulate API subscription delay
    setTimeout(() => {
      setStatus("success");
      setIsSubscribed(true);
      localStorage.setItem("pdfsun_newsletter_subscribed", email);
      setEmail("");
    }, 800);
  };

  if (isSubscribed && status === "success") {
    return (
      <div className={`p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2 text-left ${className}`}>
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <h4 className="text-sm font-bold text-white">Thank You for Subscribing! 🎉</h4>
        </div>
        <p className="text-xs text-emerald-300/90 leading-relaxed">
          You're all set to receive exclusive PDF productivity tips, feature updates, and security announcements.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 text-left ${className}`}>
      <div className="space-y-1.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <span>Subscribe to PDFSun Digest</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </h4>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md">
          Get weekly PDF productivity hacks, new AI tool releases, and security tips directly to your inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 max-w-md">
        <div className="relative flex items-center">
          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder="Enter your email address..."
            disabled={status === "loading"}
            className="w-full pl-10 pr-28 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="absolute right-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 transition shadow-sm flex items-center space-x-1 disabled:opacity-50"
          >
            {status === "loading" ? (
              <span className="animate-pulse">Subscribing...</span>
            ) : (
              <>
                <span>Join</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {status === "error" && (
          <div className="flex items-center space-x-1.5 text-rose-400 text-[11px] font-medium pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>

      <div className="flex items-center space-x-4 text-[11px] font-medium text-slate-500 pt-1">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Zero Spam</span>
        </span>
        <span>•</span>
        <span>Unsubscribe Anytime</span>
        <span>•</span>
        <span>100% Free</span>
      </div>
    </div>
  );
};
