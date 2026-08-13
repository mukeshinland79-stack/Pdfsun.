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
  Award,
  Users,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import { generateQrMatrix } from "../lib/qrGenerator";

interface SharePdfSunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEBSITE_URL = "https://pdfsun.in";
const WEBSITE_REFERRAL_URL = "https://pdfsun.in?ref=share_friend";
const WEBSITE_TITLE = "PDFSun – Fast, Free & Secure Online PDF Tools";
const HIGH_CONVERTING_COPY =
  "I use PDFSun for fast, free, and secure PDF tools (Compress, Convert, Edit). Check it out: https://pdfsun.in";

export const SharePdfSunModal: React.FC<SharePdfSunModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQrImage, setCopiedQrImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "qr">("quick");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [useReferralLink, setUseReferralLink] = useState(false);

  const targetShareUrl = useReferralLink ? WEBSITE_REFERRAL_URL : WEBSITE_URL;

  // Analytics Tracking Dispatcher
  const trackShareEvent = useCallback((channel: string, method: string) => {
    try {
      const shareData = { channel, method, timestamp: new Date().toISOString() };
      // Local Storage Analytics Log
      const existing = JSON.parse(localStorage.getItem("pdfsun_share_events") || "[]");
      existing.unshift(shareData);
      localStorage.setItem("pdfsun_share_events", JSON.stringify(existing.slice(0, 50)));

      // Dispatch Custom Event for Analytics Monitors
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("pdfsun_analytics_share", { detail: shareData })
        );
        if ((window as any).gtag) {
          (window as any).gtag("event", "share", {
            method: method,
            content_type: "website",
            item_id: channel,
          });
        }
      }
    } catch (err) {
      console.warn("Share tracking error:", err);
    }
  }, []);

  // Keyboard shortcut listener for ESC key
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

  // One Tap Copy Direct Link with Visual Feedback
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetShareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = targetShareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      showToast("Copied to Clipboard! ✓");
      trackShareEvent("direct_link", "copy_clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error("Copy error:", err);
      showToast("Link copied to clipboard!");
    }
  };

  // One-Click Native Web Share API
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: WEBSITE_TITLE,
          text: HIGH_CONVERTING_COPY,
          url: targetShareUrl,
        });
        showToast("Shared successfully!");
        trackShareEvent("native_web_share", "web_share_api");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Native share error:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // QR Code Matrix Generation using local pure TS matrix generator
  const qrMatrix = useMemo(() => {
    try {
      return generateQrMatrix(targetShareUrl);
    } catch (e) {
      console.error("QR Generation error:", e);
      return [];
    }
  }, [targetShareUrl]);

  // Generate High-Res Canvas Context for QR Code
  const createQrCanvas = useCallback(
    (includeBrandedFrame: boolean = false) => {
      if (!qrMatrix || qrMatrix.length === 0) return null;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      if (!includeBrandedFrame) {
        // Standard High-Res 300 DPI QR Code
        const moduleSize = 20;
        const padding = 40;
        const size = qrMatrix.length * moduleSize + padding * 2;

        canvas.width = size;
        canvas.height = size;

        // White background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);

        // QR Dark Modules
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

        // Center Custom "PDFSun" Logo Badge Overlay
        const badgeW = Math.floor(size * 0.32);
        const badgeH = Math.floor(size * 0.15);
        const badgeX = (size - badgeW) / 2;
        const badgeY = (size - badgeH) / 2;

        // White Quiet-Zone Padding Box
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(badgeX - 6, badgeY - 6, badgeW + 12, badgeH + 12, 18);
        ctx.fill();

        // Badge Container (Dark Slate with Amber Border)
        ctx.fillStyle = "#0F172A";
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#F59E0B";
        ctx.stroke();

        // "PDFSun" Text inside Badge
        const fontSize = Math.floor(badgeH * 0.48);
        ctx.font = `900 ${fontSize}px sans-serif`;
        ctx.textBaseline = "middle";

        const pdfText = "PDF";
        const sunText = "Sun";
        const pdfW = ctx.measureText(pdfText).width;
        const sunW = ctx.measureText(sunText).width;
        const totalW = pdfW + sunW;

        const textStartX = badgeX + (badgeW - totalW) / 2;
        const textCenterY = badgeY + badgeH / 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.fillText(pdfText, textStartX, textCenterY);

        ctx.fillStyle = "#F59E0B";
        ctx.fillText(sunText, textStartX + pdfW, textCenterY);

        // Footer Branding Text
        ctx.fillStyle = "#1E293B";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("PDFSun.in • Free Online PDF Tools", size / 2, size - 12);

        return canvas;
      } else {
        // Branded Promotional Poster Card (1000x1200 high-res printable poster)
        const width = 1000;
        const height = 1200;
        canvas.width = width;
        canvas.height = height;

        // Top Gradient Header
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#0F172A");
        grad.addColorStop(0.5, "#1E293B");
        grad.addColorStop(1, "#0284C7");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Header Title
        ctx.fillStyle = "#F8FAFC";
        ctx.font = "black 42px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PDFSun.in", width / 2, 90);

        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("FREE & SECURE ONLINE PDF TOOLS", width / 2, 135);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "18px sans-serif";
        ctx.fillText("Merge • Compress • Convert • Edit • AI Chat with PDF", width / 2, 175);

        // White Container Card for QR
        const cardX = 120;
        const cardY = 230;
        const cardW = 760;
        const cardH = 760;

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 32);
        ctx.fill();

        // Draw QR Code inside Card
        const qrPadding = 60;
        const qrAreaSize = cardW - qrPadding * 2;
        const moduleSize = qrAreaSize / qrMatrix.length;

        ctx.fillStyle = "#0F172A";
        for (let r = 0; r < qrMatrix.length; r++) {
          for (let c = 0; c < qrMatrix[r].length; c++) {
            if (qrMatrix[r][c]) {
              ctx.fillRect(
                cardX + qrPadding + c * moduleSize,
                cardY + qrPadding + r * moduleSize,
                moduleSize,
                moduleSize
              );
            }
          }
        }

        // Center Custom PDFSun Logo Badge inside Poster QR
        const badgeW = 220;
        const badgeH = 100;
        const badgeX = cardX + cardW / 2 - badgeW / 2;
        const badgeY = cardY + cardH / 2 - badgeH / 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(badgeX - 8, badgeY - 8, badgeW + 16, badgeH + 16, 22);
        ctx.fill();

        ctx.fillStyle = "#0F172A";
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 18);
        ctx.fill();

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#F59E0B";
        ctx.stroke();

        ctx.font = "900 42px sans-serif";
        ctx.textBaseline = "middle";

        const pdfText = "PDF";
        const sunText = "Sun";
        const pdfW = ctx.measureText(pdfText).width;
        const sunW = ctx.measureText(sunText).width;
        const totalW = pdfW + sunW;

        const textStartX = badgeX + (badgeW - totalW) / 2;
        const textCenterY = badgeY + badgeH / 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.fillText(pdfText, textStartX, textCenterY);

        ctx.fillStyle = "#F59E0B";
        ctx.fillText(sunText, textStartX + pdfW, textCenterY);

        // Subtitle below QR inside card
        ctx.fillStyle = "#0F172A";
        ctx.font = "bold 22px sans-serif";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Scan with Camera to Open PDFSun", width / 2, cardY + cardH - 30);

        // Footer Call to Action
        ctx.fillStyle = "#F8FAFC";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("100% In-Browser Privacy • No Registration Required", width / 2, 1050);

        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("https://pdfsun.in", width / 2, 1100);

        return canvas;
      }
    },
    [qrMatrix]
  );

  // Copy QR Image directly to Clipboard
  const handleCopyQrImage = async () => {
    const canvas = createQrCanvas(false);
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          navigator.clipboard.write
        ) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopiedQrImage(true);
          showToast("QR Image Copied to Clipboard! ✓");
          trackShareEvent("qr_image", "copy_clipboard");
          setTimeout(() => setCopiedQrImage(false), 2500);
        } else {
          showToast("Clipboard image copy not supported on this browser.");
        }
      } catch (err) {
        console.error("Copy QR image failed:", err);
        showToast("QR Image downloaded as PNG instead.");
        handleDownloadQr(false);
      }
    }, "image/png");
  };

  // Download High-Res QR Code or Branded Promo Poster
  const handleDownloadQr = (isBrandedFrame: boolean = false) => {
    const canvas = createQrCanvas(isBrandedFrame);
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = isBrandedFrame
      ? "pdfsun_branded_promo_qr.png"
      : "pdfsun_qr_code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      isBrandedFrame
        ? "Branded Promo Poster Downloaded!"
        : "High-Res QR Code Downloaded!"
    );
    trackShareEvent(
      isBrandedFrame ? "branded_poster_qr" : "high_res_qr",
      "download_png"
    );
  };

  if (!isOpen) return null;

  // Social Share Platforms with high-converting pre-written copy
  const shareChannels = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${HIGH_CONVERTING_COPY}`
      )}`,
      channelKey: "whatsapp",
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20",
      url: `https://t.me/share/url?url=${encodeURIComponent(
        targetShareUrl
      )}&text=${encodeURIComponent(HIGH_CONVERTING_COPY)}`,
      channelKey: "telegram",
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-slate-900 hover:bg-black text-white shadow-slate-900/20",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        targetShareUrl
      )}&text=${encodeURIComponent(HIGH_CONVERTING_COPY)}`,
      channelKey: "twitter",
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        targetShareUrl
      )}&quote=${encodeURIComponent(HIGH_CONVERTING_COPY)}`,
      channelKey: "facebook",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/20",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        targetShareUrl
      )}`,
      channelKey: "linkedin",
    },
    {
      name: "Reddit",
      icon: Globe,
      color: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20",
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(
        targetShareUrl
      )}&title=${encodeURIComponent(WEBSITE_TITLE)}`,
      channelKey: "reddit",
    },
    {
      name: "Gmail",
      icon: Mail,
      color: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
      url: `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodeURIComponent(
        WEBSITE_TITLE
      )}&body=${encodeURIComponent(`${HIGH_CONVERTING_COPY}`)}`,
      channelKey: "gmail",
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20",
      url: `mailto:?subject=${encodeURIComponent(
        WEBSITE_TITLE
      )}&body=${encodeURIComponent(`${HIGH_CONVERTING_COPY}`)}`,
      channelKey: "email_client",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Dialog Box Container */}
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
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-blue-600 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Share PDFSun
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ⭐ Official
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help friends & colleagues edit PDFs fast, free & secure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            aria-label="Close Share Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIRAL INCENTIVE / REFERRAL HOOK BANNER */}
        <div className="px-5 py-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-600/10 border-b border-amber-500/20 flex items-center space-x-3">
          <div className="p-1.5 rounded-xl bg-amber-500 text-slate-950 shrink-0 font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              🚀 Share with 3 friends to help keep PDFSun 100% free forever!
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Zero popups • Unlimited high-speed PDF processing
            </p>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center space-x-2">
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
              <span>QR Code Studio</span>
            </button>
          </div>

          {/* Referral Link Toggle */}
          <label
            className="flex items-center space-x-1.5 pb-2 cursor-pointer text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-amber-500 transition"
            title="Attach referral tracking code to the share link"
          >
            <input
              type="checkbox"
              checked={useReferralLink}
              onChange={(e) => setUseReferralLink(e.target.checked)}
              className="w-3.5 h-3.5 text-amber-500 rounded border-slate-300 dark:border-slate-700 focus:ring-amber-500 cursor-pointer accent-amber-500"
            />
            <span>Include Ref Hook</span>
          </label>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {activeTab === "quick" ? (
            <>
              {/* Copy Link Input Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Direct Website Share Link
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ⚡ Instant Access
                  </span>
                </div>

                <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    readOnly
                    value={targetShareUrl}
                    className="flex-1 bg-transparent px-3 text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center space-x-1.5 shrink-0 shadow-md ${
                      copiedLink
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20"
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Copied! ✓</span>
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

              {/* Native System Share Button (Android / iPhone / Mac / Windows) */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-extrabold shadow-lg transition flex items-center justify-center space-x-2 border border-slate-800 dark:border-slate-700 active:scale-98"
              >
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Share via System / Native Apps</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </button>

              {/* Pre-configured High-Converting Copy Banner */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pre-filled Sharing Message
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                  "{HIGH_CONVERTING_COPY}"
                </p>
              </div>

              {/* Social Channels Grid */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  One-Click Messaging & Social Share
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
                        onClick={() =>
                          trackShareEvent(channel.channelKey, "social_click")
                        }
                        className={`p-3 rounded-2xl ${channel.color} text-xs font-bold transition flex flex-col items-center justify-center space-y-1.5 shadow-xs hover:scale-[1.03] active:scale-95`}
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
              {/* QR Canvas Display Wrapper */}
              <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-200 inline-block relative group">
                <svg
                  width="210"
                  height="210"
                  viewBox={`0 0 ${qrMatrix.length || 25} ${
                    qrMatrix.length || 25
                  }`}
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

                {/* Center Custom PDFSun Badge Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="px-3.5 py-1.5 bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-xl flex items-center space-x-0.5 font-black text-xs tracking-tight text-white ring-4 ring-white dark:ring-slate-900">
                    <span className="text-white font-black">PDF</span>
                    <span className="text-amber-500 font-black">Sun</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 max-w-xs">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Scan QR Code with Phone Camera
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Opens{" "}
                  <strong className="text-amber-500 font-extrabold">
                    pdfsun.in
                  </strong>{" "}
                  instantly on iOS or Android.
                </p>
              </div>

              {/* QR Code Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full pt-1">
                {/* 1. Copy QR Image to Clipboard */}
                <button
                  type="button"
                  onClick={handleCopyQrImage}
                  className={`py-2.5 px-3 rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 ${
                    copiedQrImage
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white"
                  }`}
                >
                  {copiedQrImage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied! ✓</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>

                {/* 2. Download High-Res QR PNG */}
                <button
                  type="button"
                  onClick={() => handleDownloadQr(false)}
                  className="py-2.5 px-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>High-Res QR</span>
                </button>

                {/* 3. Download Branded Promo Poster */}
                <button
                  type="button"
                  onClick={() => handleDownloadQr(true)}
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md transition flex items-center justify-center space-x-1.5"
                  title="Download branded promotional poster frame with logo & scan instructions for print or social media"
                >
                  <Award className="w-4 h-4 text-white" />
                  <span>Branded Poster</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Free & Encrypted • Zero Tracking</span>
          </div>
          <span>https://pdfsun.in</span>
        </div>
      </div>
    </div>
  );
};
