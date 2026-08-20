import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  Send,
  Mail,
  Sparkles,
  ExternalLink,
  Globe
} from "lucide-react";

interface SocialShareWidgetProps {
  toolId?: string;
  toolName?: string;
  description?: string;
  className?: string;
}

export const SocialShareWidget: React.FC<SocialShareWidgetProps> = ({
  toolId,
  toolName = "PDFSun Tool",
  description,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Compute Current Shareable URL
  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://www.pdfsun.in";
  
  // Custom share message text
  const shareTitle = `Try ${toolName} on PDFSun.in – Free Online PDF Tools!`;
  const shareDescription = description || `Use ${toolName} for free, fast, and secure PDF processing online. No installation required!`;
  const fullShareText = `${shareTitle}\n${shareDescription}`;

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = currentUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2500);
    } catch (err) {
      console.error("Copy link error:", err);
    }
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: currentUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Native share error:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Share Platforms Config
  const sharePlatforms = [
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 border-slate-200 dark:border-slate-800",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "hover:bg-[#0a66c2] hover:text-white border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:bg-[#1877f2] hover:text-white border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "hover:bg-[#25d366] hover:text-white border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText + "\n" + currentUrl)}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "hover:bg-[#229ed9] hover:text-white border-sky-200 dark:border-sky-900/40 text-sky-500 dark:text-sky-400",
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "hover:bg-orange-500 hover:text-white border-orange-200 dark:border-orange-900/40 text-orange-500 dark:text-orange-400",
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(fullShareText + "\n\n" + currentUrl)}`,
    },
  ];

  return (
    <div className={`mt-8 p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden ${className}`}>
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-500 dark:bg-orange-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Share {toolName} with Friends & Colleagues
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] uppercase border border-orange-500/20 flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5 text-orange-500" />
              <span>Spread the word</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Found this tool helpful? Share it with your network or team in one click.
          </p>
        </div>

        {/* Native Mobile Share Button */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={handleNativeShare}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Quick Share</span>
          </button>
        )}
      </div>

      {/* Social Platforms Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4">
        {sharePlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-2 group ${platform.color}`}
            >
              <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>{platform.name}</span>
            </a>
          );
        })}
      </div>

      {/* Copy Link Input Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center gap-2">
        <div className="w-full flex-1 flex items-center bg-slate-100 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="w-full bg-transparent text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden font-mono truncate"
          />
        </div>

        <button
          onClick={handleCopyLink}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shrink-0 ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {showToast && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-xl flex items-center space-x-1.5 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>Tool link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
};

export default SocialShareWidget;
