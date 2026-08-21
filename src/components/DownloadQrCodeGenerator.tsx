import React, { useState } from "react";
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

export interface DownloadQrCodeGeneratorProps {
  fileName: string;
  downloadUrl?: string;
  shareSlug?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const DownloadQrCodeGenerator: React.FC<DownloadQrCodeGeneratorProps> = ({
  fileName,
  downloadUrl,
  shareSlug,
  onClose,
  isModal = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState<250 | 300 | 180>(250);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  // Generate target scannable URL
  const targetUrl =
    downloadUrl ||
    (shareSlug
      ? getPublicShareUrl(shareSlug)
      : `${getPublicSiteUrl()}/#download=${encodeURIComponent(fileName)}`);

  // High-Contrast, High-Error-Correction (ECC=H) QR Code API URL
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(
    targetUrl
  )}&ecc=H&margin=10&color=0f172a&bgcolor=ffffff`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrPng = async () => {
    try {
      setDownloadingQr(true);
      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `pdfsun-qr-${fileName.replace(/\.[^/.]+$/, "")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Failed to download QR image:", err);
      // Fallback: open in new tab
      window.open(qrApiUrl, "_blank");
    } finally {
      setDownloadingQr(false);
    }
  };

  const content = (
    <div className="w-full space-y-4">
      {/* High-Contrast Card styled as in specification */}
      <div
        className="relative bg-white text-slate-900 rounded-2xl p-6 text-center transition-all duration-200 border border-slate-200/80"
        style={{
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Top Header inside card */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Mobile Instant Download
              </h4>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] font-medium">
                {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>ECC-H Safe</span>
            </span>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* High-Contrast, High-Error-Correction QR Code Image Frame */}
        <div className="relative inline-block my-1 bg-white p-2 rounded-2xl border border-slate-100 shadow-inner">
          <img
            src={qrApiUrl}
            alt={`PDFSun QR Code for ${fileName}`}
            onLoad={() => setQrLoaded(true)}
            style={{
              width: `${Math.min(qrSize, 240)}px`,
              height: `${Math.min(qrSize, 240)}px`,
              display: "block",
              margin: "0 auto",
            }}
            className="rounded-lg transition-transform hover:scale-[1.02]"
          />
          {!qrLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          )}
        </div>

        {/* Caption with Google Lens & Camera Prompt */}
        <div className="mt-3.5 space-y-1">
          <p className="text-xs sm:text-sm text-slate-700 font-bold leading-snug">
            Scan with Google Lens or Phone Camera to open <br />
            <span className="text-amber-600 font-extrabold break-all">
              {targetUrl.replace(/^https?:\/\//, "")}
            </span>
          </p>
          <p className="text-[11px] text-slate-400">
            High-contrast error correction allows instant detection in any lighting condition.
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-center gap-2 flex-wrap">
          {/* Copy Target Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Download QR Code Image as PNG */}
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

          {/* Direct Open Link */}
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
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
