import React, { useState, useEffect } from "react";
import {
  QrCode,
  Copy,
  Check,
  Download,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  X,
  Share2,
} from "lucide-react";
import { getPublicShareUrl, getPublicSiteUrl } from "../utils/siteConfig";
import { getQrCodeDataUrl } from "../lib/qrGenerator";

export interface DownloadQrCodeGeneratorProps {
  fileName: string;
  downloadUrl?: string;
  shareSlug?: string;
  toolSlug?: string;
  onClose?: () => void;
  isModal?: boolean;
  fileBlob?: Blob | Uint8Array | null;
  mimeType?: string;
  onDownloadDirect?: () => void;
}

export const DownloadQrCodeGenerator: React.FC<DownloadQrCodeGeneratorProps> = ({
  fileName,
  downloadUrl,
  shareSlug,
  toolSlug,
  onClose,
  isModal = false,
  fileBlob,
  mimeType,
  onDownloadDirect,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState<250 | 300 | 180>(250);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrLoaded, setQrLoaded] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [canShareFile, setCanShareFile] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Generate target scannable URL (Opens canonical tool or site URL on mobile — zero fake hash download URLs)
  const targetUrl =
    downloadUrl ||
    (shareSlug
      ? getPublicShareUrl(shareSlug)
      : toolSlug
      ? `${getPublicSiteUrl()}/${toolSlug}`
      : `${getPublicSiteUrl()}`);

  // Test native file sharing capability with strict navigator.canShare verification
  useEffect(() => {
    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        fileBlob
      ) {
        const testBlob = fileBlob instanceof Blob ? fileBlob : new Blob([fileBlob], { type: mimeType || "application/octet-stream" });
        const testFile = new File([testBlob], fileName, { type: mimeType || "application/octet-stream" });
        if (navigator.canShare({ files: [testFile] })) {
          setCanShareFile(true);
        } else {
          setCanShareFile(false);
        }
      } else {
        setCanShareFile(false);
      }
    } catch {
      setCanShareFile(false);
    }
  }, [fileBlob, fileName, mimeType]);

  const handleNativeShare = async () => {
    if (!fileBlob || typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    try {
      setIsSharing(true);
      const rawBlob = fileBlob instanceof Blob ? fileBlob : new Blob([fileBlob], { type: mimeType || "application/octet-stream" });
      const shareFile = new File([rawBlob], fileName, { type: mimeType || "application/octet-stream" });

      if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
        await navigator.share({
          files: [shareFile],
          title: fileName,
          text: `Processed with PDFSun: ${fileName}`,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Native file sharing unavailable or cancelled:", err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Generate QR Code locally via QRCode engine with zero external network dependencies
  useEffect(() => {
    let isMounted = true;
    setQrLoaded(false);
    getQrCodeDataUrl(targetUrl, {
      size: qrSize,
      margin: 2,
      darkColor: "#0f172a",
      lightColor: "#ffffff",
      errorCorrectionLevel: "H",
    }).then((url) => {
      if (isMounted) {
        setQrDataUrl(url);
        setQrLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [targetUrl, qrSize]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    try {
      setDownloadingQr(true);
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `pdfsun-qr-${fileName.replace(/\.[^/.]+$/, "")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.warn("Failed to download QR image:", err);
    } finally {
      setDownloadingQr(false);
    }
  };

  const content = (
    <div className="w-full space-y-4 text-left">
      <div
        className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-6 text-center transition-all duration-200 border border-slate-200/80 dark:border-slate-800"
        style={{
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Top Header inside card */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Mobile Tool Access
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] font-medium">
                {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>100% Client-Side</span>
            </span>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* High-Contrast QR Code Image Frame */}
        <div className="relative inline-block my-1 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-inner min-w-[180px] min-h-[180px] flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`PDFSun QR Code for ${fileName}`}
              style={{
                width: `${Math.min(qrSize, 220)}px`,
                height: `${Math.min(qrSize, 220)}px`,
                display: "block",
                margin: "0 auto",
              }}
              className="rounded-lg transition-transform hover:scale-[1.02]"
            />
          ) : (
            <div className="w-[180px] h-[180px] flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          )}
        </div>

        {/* Honest Privacy & Tool Prompt */}
        <div className="mt-3.5 space-y-1.5 text-center">
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-bold leading-snug">
            Scan to open this tool on your phone: <br />
            <span className="text-amber-600 dark:text-amber-400 font-extrabold break-all">
              {targetUrl.replace(/^https?:\/\//, "")}
            </span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your document was processed 100% inside this browser and was never uploaded to our servers. Download directly to this device, or scan to process documents on your phone.
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 flex-wrap">
          {/* Direct Same-Device Download (if available) */}
          {onDownloadDirect && (
            <button
              type="button"
              onClick={onDownloadDirect}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          )}

          {/* Native Web Share API (When verified by navigator.canShare) */}
          {canShareFile && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isSharing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {isSharing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : shareSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>{shareSuccess ? "Shared!" : "Share File"}</span>
            </button>
          )}

          {/* Copy Tool Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Copy Tool Link</span>
              </>
            )}
          </button>

          {/* Save QR Image */}
          <button
            type="button"
            onClick={handleDownloadQrPng}
            disabled={downloadingQr}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Download QR code image file (.png)"
          >
            {downloadingQr ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Save QR Image</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="max-w-md w-full animate-in zoom-in-95">{content}</div>
      </div>
    );
  }

  return content;
};
