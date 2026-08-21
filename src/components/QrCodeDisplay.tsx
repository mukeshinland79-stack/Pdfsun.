import React, { useState } from "react";
import { QrCode, Copy, Check, Download, ExternalLink, ShieldCheck } from "lucide-react";

export interface QrCodeDisplayProps {
  url: string;
  title?: string;
  subtitle?: string;
  size?: number;
  className?: string;
  showActions?: boolean;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  url,
  title = "PDFSun QR Code",
  subtitle = "Scan with Google Lens or Phone Camera",
  size = 250,
  className = "",
  showActions = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // High-Contrast QR Code via api.qrserver.com
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}&ecc=H&margin=10&color=0f172a&bgcolor=ffffff`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(qrApiUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `pdfsun-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Failed to download QR code image:", err);
      window.open(qrApiUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={`w-full max-w-sm mx-auto bg-white text-slate-900 rounded-2xl p-6 text-center border border-slate-200/80 transition-all ${className}`}
      style={{
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2 text-left">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {title}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[160px]">
              {subtitle}
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
          <ShieldCheck className="w-3 h-3" />
          <span>ECC-H</span>
        </span>
      </div>

      {/* QR Code Frame */}
      <div className="relative inline-block bg-white p-2 rounded-2xl border border-slate-100 shadow-inner">
        <img
          src={qrApiUrl}
          alt="PDFSun QR Code"
          style={{
            width: `${Math.min(size, 240)}px`,
            height: `${Math.min(size, 240)}px`,
            display: "block",
            margin: "0 auto",
          }}
          className="rounded-lg transition-transform hover:scale-[1.02]"
        />
      </div>

      {/* Description text */}
      <p className="mt-4 text-xs sm:text-sm text-slate-700 font-bold leading-snug">
        Scan with Google Lens to open <br />
        <span className="text-amber-600 font-extrabold break-all">{url}</span>
      </p>

      {/* Optional action buttons */}
      {showActions && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Download QR code image"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save QR</span>
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <span>Open</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
