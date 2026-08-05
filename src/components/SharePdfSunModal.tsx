import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  X,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Download,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sparkles,
} from "lucide-react";
import { generateQrMatrix } from "../lib/qrGenerator";

interface SharePdfSunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEBSITE_URL = "https://pdfsun.in";
const WEBSITE_TITLE = "PDFSun – Free Online PDF Tools";
const WEBSITE_DESC =
  "Fast, Secure and Free Online PDF Tools. Merge, Split, Compress, Convert, Edit, Protect and Manage PDFs from any device.";

export const SharePdfSunModal: React.FC<SharePdfSunModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "qr">("quick");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keyboard shortcut listener for Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Show Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // One Tap Copy Link
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(WEBSITE_URL);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = WEBSITE_URL;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast("PDFSun link copied successfully.");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Copy error:", err);
      showToast("PDFSun link copied successfully.");
    }
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: WEBSITE_TITLE,
          text: WEBSITE_DESC,
          url: WEBSITE_URL,
        });
        showToast("Shared successfully!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Native share error:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // QR Code Matrix Generation
  const qrMatrix = useMemo(() => {
    try {
      return generateQrMatrix(WEBSITE_URL);
    } catch (e) {
      console.error("QR Generation error:", e);
      return [];
    }
  }, []);

  // Download QR Code as High-Res PNG
  const handleDownloadQr = () => {
    if (!qrMatrix || qrMatrix.length === 0) return;
    const canvas = document.createElement("canvas");
    const moduleSize = 16;
    const padding = 32;
    const size = qrMatrix.length * moduleSize + padding * 2;

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // Draw dark modules
    ctx.fillStyle = "#0F172A";
    for (let r = 0; r < qrMatrix.length; r++) {
      for (let c = 0; c < qrMatrix[r].length; c++) {
        if (qrMatrix[r][c]) {
          ctx.fillRect(
            padding + c * moduleSize,
            padding + r * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }

    // Add Logo text in center header or footer
    ctx.fillStyle = "#3B82F6";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PDFSun.in", size / 2, size - 10);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "pdfsun_qr_code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("QR Code downloaded!");
  };

  if (!isOpen) return null;

  // Social Channels list with branding colors and custom deep-links
  const shareChannels = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${WEBSITE_TITLE}\n${WEBSITE_DESC}\n${WEBSITE_URL}`
      )}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20",
      url: `https://t.me/share/url?url=${encodeURIComponent(
        WEBSITE_URL
      )}&text=${encodeURIComponent(`${WEBSITE_TITLE} - ${WEBSITE_DESC}`)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        WEBSITE_URL
      )}`,
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-slate-900 hover:bg-black text-white shadow-slate-900/20",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        WEBSITE_URL
      )}&text=${encodeURIComponent(`${WEBSITE_TITLE} - ${WEBSITE_DESC}`)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/20",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        WEBSITE_URL
      )}`,
    },
    {
      name: "Reddit",
      icon: Globe,
      color: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20",
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(
        WEBSITE_URL
      )}&title=${encodeURIComponent(WEBSITE_TITLE)}`,
    },
    {
      name: "Gmail",
      icon: Mail,
      color: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
      url: `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodeURIComponent(
        WEBSITE_TITLE
      )}&body=${encodeURIComponent(`${WEBSITE_DESC}\n\n${WEBSITE_URL}`)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20",
      url: `mailto:?subject=${encodeURIComponent(
        WEBSITE_TITLE
      )}&body=${encodeURIComponent(`${WEBSITE_DESC}\n\n${WEBSITE_URL}`)}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Dialog Body */}
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col relative transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full shadow-xl border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Share PDFSun
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  ⭐ Official
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Spread the word about free, secure & fast PDF tools.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="px-6 pt-4 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setActiveTab("quick")}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === "quick"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Social & Apps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center space-x-2 ${
              activeTab === "qr"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeTab === "quick" ? (
            <>
              {/* Copy Link Input Bar */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Direct Website Link
                </label>
                <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    readOnly
                    value={WEBSITE_URL}
                    className="flex-1 bg-transparent px-3 text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center space-x-1.5 shrink-0"
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

              {/* Native System Share Button (Android / iPhone) */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-extrabold shadow-lg transition flex items-center justify-center space-x-2"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Share via System / Native Apps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Social Channels Grid */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Share to Messaging & Socials
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {shareChannels.map((channel) => {
                    const IconComp = channel.icon;
                    return (
                      <a
                        key={channel.name}
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3 rounded-2xl ${channel.color} text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 shadow-sm hover:scale-[1.02] active:scale-95`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="truncate">{channel.name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* QR Code Tab */
            <div className="flex flex-col items-center justify-center space-y-5 text-center">
              <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-200 inline-block relative group">
                <svg
                  width="200"
                  height="200"
                  viewBox={`0 0 ${qrMatrix.length || 25} ${qrMatrix.length || 25}`}
                  className="shape-rendering-crisp"
                >
                  {qrMatrix.map((row, r) =>
                    row.map((cell, c) =>
                      cell ? (
                        <rect
                          key={`${r}-${c}`}
                          x={c}
                          y={r}
                          width="1"
                          height="1"
                          fill="#0F172A"
                        />
                      ) : null
                    )
                  )}
                </svg>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 border-2 border-white text-white font-black text-[10px] flex items-center justify-center shadow-md">
                    PDF
                  </div>
                </div>
              </div>

              <div className="space-y-1 max-w-xs">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Scan QR with Mobile Camera
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instantly open <strong className="text-amber-500 font-extrabold">pdfsun.in</strong> on iPhone or Android.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="py-2.5 px-5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition flex items-center space-x-2"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download High-Res QR Code</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Privacy • Zero Tracking</span>
          </div>
          <span>https://pdfsun.in</span>
        </div>
      </div>
    </div>
  );
};
