import React from "react";
import { ShieldCheck, Shield, FileCheck, CheckCircle2, Lock, Cpu, Sparkles, AlertTriangle } from "lucide-react";

export interface DocumentFidelityBadgeProps {
  toolId?: string;
  sourceFileName?: string;
  sourceFileSize?: number;
  outputFormat?: string;
  onOpenVerificationStudio?: () => void;
  className?: string;
}

export const DocumentFidelityBadge: React.FC<DocumentFidelityBadgeProps> = ({
  toolId = "general",
  sourceFileName = "document.pdf",
  sourceFileSize,
  outputFormat = "PDF",
  onOpenVerificationStudio,
  className = "",
}) => {
  const getToolSpecificNotice = () => {
    switch (toolId) {
      case "pdf-to-word":
        return {
          title: "High-Fidelity DOCX Reconstruction",
          detail: "Paragraph ordering, font metrics, and table structures mapped to native OpenXML tags without flattening.",
          badge: "OpenXML Validated",
        };
      case "word-to-pdf":
        return {
          title: "Vector Page Layout Fidelity",
          detail: "Margins, embedded media, and typographic fallbacks (Calibri/Times/Arial) matched to vector PDF coordinates.",
          badge: "Vector Preserved",
        };
      case "pdf-to-excel":
        return {
          title: "Precision Grid & Value Casting",
          detail: "Numeric values, dates, headers, and dynamic formulas (=SUM) mapped without altering underlying figures.",
          badge: "Formula & Grid Intact",
        };
      case "excel-to-pdf":
        return {
          title: "AutoFit & Table Alignment",
          detail: "Rendered with collapsed vector gridlines, repeated headers, and zero horizontal column clipping.",
          badge: "Single-Pass Vector",
        };
      case "pdf-to-powerpoint":
        return {
          title: "Slide Hierarchy & Text Frames",
          detail: "Discrete relative-positioned text frames and slide aspect ratio preserved without text collisions.",
          badge: "Native PPTX Shapes",
        };
      case "compress-pdf":
        return {
          title: "Intelligent Zero-Inflation Compression",
          detail: "Embedded image XObjects downsampled while font vectors, form fields, and page counts remain 100% intact.",
          badge: "Zero Size Inflation",
        };
      case "redact-pdf":
        return {
          title: "Permanent Stream Token Purge",
          detail: "Decompressed byte streams stripped of targeted text tokens; scanned pages sanitized via deep pixel burning.",
          badge: "Zero Residual Leaks",
        };
      case "protect-pdf":
        return {
          title: "ISO 32000 AES-256 Encryption",
          detail: "Cryptographic encryption applied directly in browser runtime; keys never transmitted over network.",
          badge: "AES-256 Validated",
        };
      case "merge-pdf":
      case "split-pdf":
      case "rotate-pdf":
      case "organize-pdf":
        return {
          title: "Lossless Native Page Tree Manipulation",
          detail: "Underlying PDF byte objects and page trees copied directly without recompression or quality loss.",
          badge: "100% Lossless",
        };
      default:
        return {
          title: "Original Document Preservation",
          detail: "Content, structure, and visual appearance preserved as faithfully as the target format technically permits.",
          badge: "Verified In-Browser",
        };
    }
  };

  const info = getToolSpecificNotice();

  return (
    <div
      className={`rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-xs backdrop-blur-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                {info.title}
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                {info.badge}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {info.detail}
            </p>
          </div>
        </div>

        {onOpenVerificationStudio && (
          <button
            type="button"
            onClick={onOpenVerificationStudio}
            className="inline-flex items-center justify-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Audit Verification
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-emerald-500/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Input Untouched</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>100% In-Browser WASM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Zero Cloud Uploads</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Memory Purged</span>
        </div>
      </div>
    </div>
  );
};
