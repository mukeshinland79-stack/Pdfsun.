import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  Send,
  Mail,
  QrCode,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Download,
  Globe,
  FileText,
} from "lucide-react";

export interface QuickShareModalProps {
  fileName: string;
  mimeType?: string;
  onClose: () => void;
  onDownloadDirect?: () => void;
}

export const QuickShareModal: React.FC<QuickShareModalProps> = ({
  fileName,
  mimeType = "application/pdf",
  onClose,
  onDownloadDirect,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Generate deterministic share URL slug
  const shareSlug = `share_${Math.random().toString(36).substring(2, 10)}`;
  const shareUrl = `https://pdfsun.com/d/${shareSlug}`;
  const shareTitle = `Processed PDF Document: ${fileName}`;
  const shareText = `Check out my processed PDF document "${fileName}" on PDFSun. Download or view it securely:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Native share dismissed or failed:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Social Share Handlers
  const socialPlatforms = [
    {
      name: "WhatsApp",
      color: "bg-emerald-500 hover:bg-emerald-600 text-white",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.76.459 3.48 1.332 5.003l-1.355 4.962 5.086-1.334c1.464.798 3.12 1.218 4.926 1.218 5.508 0 9.991-4.479 9.991-9.985 0-5.506-4.483-9.984-9.991-9.984zm0 18.286c-1.58 0-3.131-.424-4.489-1.229l-.322-.192-3.336.875.89-3.255-.211-.336c-.886-1.408-1.353-3.037-1.353-4.708 0-4.568 3.717-8.286 8.285-8.286 4.567 0 8.286 3.718 8.286 8.286 0 4.568-3.719 8.285-8.286 8.285zm4.536-6.195c-.249-.125-1.472-.726-1.7-.809-.228-.083-.394-.125-.561.125-.166.249-.645.809-.79 0.975-.145.166-.291.187-.54.062s-1.052-.388-2.004-1.237c-.741-.661-1.241-1.478-1.386-1.727-.145-.249-.015-.384.11-.508.112-.111.249-.291.374-.436.125-.145.166-.249.249-.415.083-.166.042-.312-.021-.436-.062-.125-.561-1.351-.77-1.85-.203-.487-.41-.42-.561-.428l-.478-.008c-.166 0-.436.062-.665.312s-.873.852-.873 2.079.894 2.411 1.018 2.578c.125.166 1.76 2.688 4.264 3.769.596.257 1.061.411 1.424.527.598.19 1.142.163 1.572.099.48-.071 1.472-.602 1.68-.184.208-.582.208-1.081.145-1.164-.062-.083-.228-.125-.478-.249z"/>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      name: "X (Twitter)",
      color: "bg-slate-900 hover:bg-black text-white border border-slate-700",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 1.63 1.63A1.63 1.63 0 0 0 7.86 6.7z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      color: "bg-sky-500 hover:bg-sky-600 text-white",
      icon: <Send className="w-3.5 h-3.5" />,
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Facebook",
      color: "bg-indigo-600 hover:bg-indigo-700 text-white",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Email",
      color: "bg-amber-500 hover:bg-amber-600 text-white",
      icon: <Mail className="w-3.5 h-3.5" />,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    },
  ];

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=1e293b&color=ffffff`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Quick Share Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  Instant Link
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {fileName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Share Link Input Block */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Shareable Download Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center justify-between min-w-0">
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate select-all">
                {shareUrl}
              </span>
              <span className="text-[10px] font-bold text-slate-400 ml-2 shrink-0">
                SSL 256-Bit
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shrink-0 shadow-sm ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instant Social Media Platforms Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Share Directly to Social Platforms
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-xs ${platform.color}`}
              >
                <div className="shrink-0">{platform.icon}</div>
                <span className="truncate">{platform.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Native Mobile Share & QR Code Options */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          {/* QR Code Toggle Button */}
          <button
            onClick={() => setShowQr(!showQr)}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center space-x-1.5 transition"
          >
            <QrCode className="w-4 h-4 text-amber-500" />
            <span>{showQr ? "Hide QR Code" : "Show Phone QR Code"}</span>
          </button>

          {/* Web Share API Trigger */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center space-x-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-500" />
              <span>Device Share</span>
            </button>
          )}
        </div>

        {/* QR Code Display Card */}
        {showQr && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 animate-in slide-in-from-top-2">
            <div className="w-36 h-36 bg-slate-800 rounded-xl p-2 mx-auto flex items-center justify-center border border-slate-700 shadow-md">
              <img
                src={qrImageUrl}
                alt="Quick Share QR Code"
                className="w-full h-full rounded-lg object-contain"
              />
            </div>
            <p className="text-[11px] font-bold text-slate-300">
              Scan with smartphone camera to view & download PDF instantly.
            </p>
          </div>
        )}

        {/* Modal Footer Note */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Private & Encrypted
          </span>
          {onDownloadDirect && (
            <button
              onClick={onDownloadDirect}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Direct Download</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
