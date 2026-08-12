import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import {
  FileSearch,
  UploadCloud,
  FileText,
  Download,
  X,
  Check,
  Copy,
  Info,
  Calendar,
  User,
  BookOpen,
  Tag,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
  HardDrive,
  FileCode,
  CheckCircle2,
  Share2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Maximize2,
  Star,
  MessageSquare,
  Printer,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  getPdfMetadata,
  fileToArrayBuffer,
  downloadFile,
  PdfMetadataInfo,
} from "../lib/pdfEngine";
import { ToolHistoryItem } from "../types";
import { triggerErrorToast } from "./GlobalErrorToast";

const FeedbackWidget = React.lazy(() => import("./FeedbackWidget"));

if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

interface DetailedPdfMetadata {
  basic: PdfMetadataInfo;
  xmpPacket: string | null;
  xmpFields: Record<string, string>;
  pdfVersion?: string;
}

interface ViewPdfMetadataToolProps {
  initialFile?: File | null;
  onClose?: () => void;
  onAddHistory?: (item: ToolHistoryItem) => void;
}

export const ViewPdfMetadataTool: React.FC<ViewPdfMetadataToolProps> = ({
  initialFile = null,
  onClose,
  onAddHistory,
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<DetailedPdfMetadata | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fields" | "xmp" | "json">("fields");
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // PDF.js Document Preview state
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [previewScale, setPreviewScale] = useState<number>(1.0);
  const [isRenderingPreview, setIsRenderingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Load and parse PDF & XMP metadata
  useEffect(() => {
    let isCancelled = false;

    async function loadMetadata() {
      if (!file) {
        setMetadata(null);
        pdfDocRef.current = null;
        return;
      }

      setIsLoading(true);
      setPreviewError(null);

      try {
        const basicMeta = await getPdfMetadata(file);
        const bytes = await fileToArrayBuffer(file);

        let xmpPacket: string | null = null;
        const xmpFields: Record<string, string> = {};
        let pdfVersion: string | undefined = undefined;

        try {
          const textDecoder = new TextDecoder("utf-8", { fatal: false });
          const fullText = textDecoder.decode(bytes);

          // Find XMP packet boundaries
          const xmpStart = fullText.indexOf("<?xpacket begin");
          const xmpEnd = fullText.indexOf("<?xpacket end");

          if (xmpStart !== -1 && xmpEnd !== -1 && xmpEnd > xmpStart) {
            xmpPacket = fullText.substring(xmpStart, xmpEnd + 15);
          } else {
            const xmpMetaStart = fullText.indexOf("<x:xmpmeta");
            const xmpMetaEnd = fullText.indexOf("</x:xmpmeta>");
            if (xmpMetaStart !== -1 && xmpMetaEnd !== -1 && xmpMetaEnd > xmpMetaStart) {
              xmpPacket = fullText.substring(xmpMetaStart, xmpMetaEnd + 12);
            }
          }

          if (xmpPacket) {
            const extractTag = (tagName: string) => {
              const regex = new RegExp(
                `<(?:[a-zA-Z0-9_]+:)?${tagName}[^>]*>([^<]+)</(?:[a-zA-Z0-9_]+:)?${tagName}>`,
                "i"
              );
              const match = xmpPacket?.match(regex);
              return match ? match[1].trim() : null;
            };

            const xmpTitle = extractTag("title");
            const xmpCreator = extractTag("creator") || extractTag("Author");
            const xmpCreatorTool = extractTag("CreatorTool");
            const xmpCreateDate = extractTag("CreateDate");
            const xmpModifyDate = extractTag("ModifyDate");
            const xmpProducer = extractTag("Producer");
            const xmpSubject = extractTag("description") || extractTag("subject");

            if (xmpTitle) xmpFields["Title (dc:title)"] = xmpTitle;
            if (xmpCreator) xmpFields["Author/Creator (dc:creator)"] = xmpCreator;
            if (xmpCreatorTool) xmpFields["Creator Tool (xmp:CreatorTool)"] = xmpCreatorTool;
            if (xmpCreateDate) xmpFields["Creation Date (xmp:CreateDate)"] = xmpCreateDate;
            if (xmpModifyDate) xmpFields["Modification Date (xmp:ModifyDate)"] = xmpModifyDate;
            if (xmpProducer) xmpFields["Producer Tool (pdf:Producer)"] = xmpProducer;
            if (xmpSubject) xmpFields["Subject (dc:description)"] = xmpSubject;
          }

          const headerMatch = fullText.substring(0, 1024).match(/%PDF-(\d\.\d)/);
          if (headerMatch) {
            pdfVersion = headerMatch[1];
          }
        } catch (xmpErr) {
          console.warn("Could not parse XMP stream packet:", xmpErr);
        }

        // Initialize PDF.js proxy document for visual rendering
        try {
          const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
          const pdfDoc = await loadingTask.promise;
          if (!isCancelled) {
            pdfDocRef.current = pdfDoc;
            setTotalPages(pdfDoc.numPages);
            setPreviewPage(1);
          }
        } catch (docErr) {
          console.warn("PDF.js document preview initialization warning:", docErr);
          if (!isCancelled) {
            setPreviewError("Could not render visual page preview.");
          }
        }

        if (isCancelled) return;

        setMetadata({
          basic: basicMeta,
          xmpPacket,
          xmpFields,
          pdfVersion,
        });

        if (onAddHistory) {
          onAddHistory({
            id: Date.now().toString(),
            toolId: "view-pdf-metadata",
            toolName: "View PDF Metadata",
            fileName: file.name,
            timestamp: Date.now(),
            status: "completed",
            outputFileName: `Metadata_${file.name}.txt`,
          });
        }
      } catch (err: any) {
        console.error("Failed to inspect PDF metadata:", err);
        triggerErrorToast(
          "Metadata Extraction Error",
          "Could not parse PDF metadata structure. File may be encrypted or corrupted."
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadMetadata();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  // Render current preview page onto Canvas via PDF.js
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!showPreview || !pdfDocRef.current || !canvasRef.current) return;

      setIsRenderingPreview(true);
      try {
        const pageNum = Math.min(Math.max(1, previewPage), totalPages);
        const page = await pdfDocRef.current.getPage(pageNum);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale: previewScale * 1.2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("PDF.js canvas render error:", err);
      } finally {
        if (!isCancelled) setIsRenderingPreview(false);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [file, previewPage, previewScale, totalPages, showPreview]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (selected.type === "application/pdf" || selected.name.endsWith(".pdf")) {
        setFile(selected);
      } else {
        triggerErrorToast("Invalid File", "Please upload a valid PDF document.");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleCopyText = (text: string, keyName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAllJson = () => {
    let contentToCopy = "";
    if (metadata && file) {
      const reportData = {
        fileName: file.name,
        fileSize: file.size,
        fileSizeBytes: file.size,
        pageCount: metadata.basic.pageCount,
        pdfVersion: metadata.pdfVersion || "1.7",
        title: metadata.basic.title || "(Not set)",
        author: metadata.basic.author || "(Not set)",
        subject: metadata.basic.subject || "(Not set)",
        keywords: metadata.basic.keywords || "(Not set)",
        creator: metadata.basic.creator || "(Not set)",
        producer: metadata.basic.producer || "(Not set)",
        creationDate: metadata.basic.creationDate || "(Not set)",
        modificationDate: metadata.basic.modificationDate || "(Not set)",
        xmpFields: metadata.xmpFields,
        hasXmpPacket: !!metadata.xmpPacket,
      };
      contentToCopy = JSON.stringify(reportData, null, 2);
    } else {
      const defaultData = {
        tool: "View PDF Metadata",
        platform: "PDFSun (pdfsun.in)",
        status: "Client-Side Inspection Sandbox",
        security: "100% Client-Side Private Processing",
        rating: "5.0 / 5.0",
        features: [
          "PDF Document Info Dictionary Parsing",
          "Embedded XMP XML Packet Extraction",
          "PDF.js Visual Page Rendering",
          "Copy & Export Technical Metadata"
        ]
      };
      contentToCopy = JSON.stringify(defaultData, null, 2);
    }

    navigator.clipboard.writeText(contentToCopy);
    setCopiedKey("ALL_JSON");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadMetadataJson = () => {
    if (!metadata || !file) return;
    const reportData = {
      fileName: file.name,
      fileSize: file.size,
      pageCount: metadata.basic.pageCount,
      pdfVersion: metadata.pdfVersion || "1.7",
      title: metadata.basic.title || "(Not set)",
      author: metadata.basic.author || "(Not set)",
      subject: metadata.basic.subject || "(Not set)",
      keywords: metadata.basic.keywords || "(Not set)",
      creator: metadata.basic.creator || "(Not set)",
      producer: metadata.basic.producer || "(Not set)",
      creationDate: metadata.basic.creationDate || "(Not set)",
      modificationDate: metadata.basic.modificationDate || "(Not set)",
      xmpFields: metadata.xmpFields,
      hasXmpPacket: !!metadata.xmpPacket,
      xmpPacket: metadata.xmpPacket || null,
    };

    const content = JSON.stringify(reportData, null, 2);
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(content);
    const jsonFileName = `Metadata_${file.name.replace(/\.[^/.]+$/, "")}.json`;

    downloadFile(jsonBytes, jsonFileName, "application/json");

    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    } catch {}
  };

  const handleDownloadReport = () => {
    let content = "";
    let reportName = "";

    if (metadata && file) {
      const lines = [
        `==================================================`,
        `       PDF SUN - PDF & XMP METADATA REPORT        `,
        `==================================================`,
        `File Name:         ${file.name}`,
        `File Size:         ${(file.size / 1024).toFixed(2)} KB (${file.size} bytes)`,
        `Page Count:        ${metadata.basic.pageCount}`,
        `PDF Version:       %PDF-${metadata.pdfVersion || "1.7"}`,
        `Inspection Time:   ${new Date().toLocaleString()}`,
        `--------------------------------------------------`,
        `DOCUMENT PROPERTIES (Standard PDF Info)`,
        `--------------------------------------------------`,
        `Title:             ${metadata.basic.title || "(Not specified)"}`,
        `Author:            ${metadata.basic.author || "(Not specified)"}`,
        `Subject:           ${metadata.basic.subject || "(Not specified)"}`,
        `Keywords:          ${metadata.basic.keywords || "(Not specified)"}`,
        `Creator Tool:      ${metadata.basic.creator || "(Not specified)"}`,
        `Producer App:      ${metadata.basic.producer || "(Not specified)"}`,
        `Creation Date:     ${metadata.basic.creationDate || "(Not specified)"}`,
        `Modification Date: ${metadata.basic.modificationDate || "(Not specified)"}`,
        ``,
      ];

      if (Object.keys(metadata.xmpFields).length > 0) {
        lines.push(`--------------------------------------------------`);
        lines.push(`XMP EXTENDED METADATA TAGS`);
        lines.push(`--------------------------------------------------`);
        Object.entries(metadata.xmpFields).forEach(([k, v]) => {
          lines.push(`${k.padEnd(20)}: ${v}`);
        });
        lines.push(``);
      }

      if (metadata.xmpPacket) {
        lines.push(`--------------------------------------------------`);
        lines.push(`RAW XMP XML PACKET`);
        lines.push(`--------------------------------------------------`);
        lines.push(metadata.xmpPacket);
      }

      content = lines.join("\n");
      reportName = `Metadata_Report_${file.name.replace(/\.[^/.]+$/, "")}.txt`;
    } else {
      const lines = [
        `==================================================`,
        `       PDF SUN - VIEW PDF METADATA TOOL REPORT    `,
        `==================================================`,
        `Tool Name:         View PDF Metadata`,
        `Platform:          PDFSun (pdfsun.in)`,
        `Generated On:      ${new Date().toLocaleString()}`,
        `Security Status:   100% Client-Side Sandbox`,
        `User Rating:       5.0 / 5.0 (Client-side Verified)`,
        `--------------------------------------------------`,
        `SUMMARY & FEEDBACK NOTICE:`,
        `This tool provides local client-side metadata parsing`,
        `and PDF.js rendering for inspection without uploading`,
        `your documents to external servers.`,
        `==================================================`,
      ];
      content = lines.join("\n");
      reportName = `PDFSun_ViewPdfMetadata_Feedback_Report.txt`;
    }

    const encoder = new TextEncoder();
    const reportBytes = encoder.encode(content);

    downloadFile(reportBytes, reportName, "text/plain");

    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    } catch {}
  };

  const handlePrintMetadata = () => {
    const fileName = file?.name || "PDF Document";
    const fileSizeStr = file ? `${(file.size / 1024).toFixed(2)} KB (${file.size} bytes)` : "N/A";
    const pageCount = metadata?.basic.pageCount ?? "N/A";
    const pdfVersion = metadata?.pdfVersion ? `%PDF-${metadata.pdfVersion}` : "N/A";
    const title = metadata?.basic.title || "(Not specified)";
    const author = metadata?.basic.author || "(Not specified)";
    const subject = metadata?.basic.subject || "(Not specified)";
    const keywords = metadata?.basic.keywords || "(Not specified)";
    const creator = metadata?.basic.creator || "(Not specified)";
    const producer = metadata?.basic.producer || "(Not specified)";
    const creationDate = metadata?.basic.creationDate || "(Not specified)";
    const modificationDate = metadata?.basic.modificationDate || "(Not specified)";

    let xmpRows = "";
    if (metadata?.xmpFields && Object.keys(metadata.xmpFields).length > 0) {
      xmpRows = Object.entries(metadata.xmpFields)
        .map(
          ([k, v]) => `
          <tr>
            <td class="meta-key">${k}</td>
            <td>${v}</td>
          </tr>`
        )
        .join("");
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      triggerErrorToast(
        "Print Blocked",
        "Please allow popups to trigger print for the metadata summary."
      );
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Metadata Summary - ${fileName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      padding: 32px;
      margin: 0;
      background: #ffffff;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #ea580c;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      color: #ea580c;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .meta-date {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .section-header {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 24px;
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
      word-break: break-word;
    }
    th {
      background-color: #f8fafc;
      font-weight: 700;
      color: #334155;
      border-bottom: 2px solid #e2e8f0;
    }
    .meta-key {
      font-weight: 600;
      width: 200px;
      color: #475569;
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">PDFSun — Metadata Summary Report</div>
      <div class="subtitle">Client-Side Verified Technical Metadata Extraction</div>
    </div>
    <div class="meta-date">
      <div><strong>Printed:</strong> ${new Date().toLocaleString()}</div>
      <div><strong>File:</strong> ${fileName}</div>
    </div>
  </div>

  <div class="section-header">File Overview</div>
  <table>
    <tr><td class="meta-key">File Name</td><td>${fileName}</td></tr>
    <tr><td class="meta-key">File Size</td><td>${fileSizeStr}</td></tr>
    <tr><td class="meta-key">Page Count</td><td>${pageCount}</td></tr>
    <tr><td class="meta-key">PDF Version</td><td>${pdfVersion}</td></tr>
  </table>

  <div class="section-header">Standard PDF Document Dictionary</div>
  <table>
    <tr><td class="meta-key">Title</td><td>${title}</td></tr>
    <tr><td class="meta-key">Author</td><td>${author}</td></tr>
    <tr><td class="meta-key">Subject</td><td>${subject}</td></tr>
    <tr><td class="meta-key">Keywords</td><td>${keywords}</td></tr>
    <tr><td class="meta-key">Creator Tool</td><td>${creator}</td></tr>
    <tr><td class="meta-key">Producer Application</td><td>${producer}</td></tr>
    <tr><td class="meta-key">Creation Date</td><td>${creationDate}</td></tr>
    <tr><td class="meta-key">Modification Date</td><td>${modificationDate}</td></tr>
  </table>

  ${
    xmpRows
      ? `
  <div class="section-header">Extracted XMP Metadata Tags</div>
  <table>
    <thead>
      <tr>
        <th style="width:200px;">XMP Property Tag</th>
        <th>Property Value</th>
      </tr>
    </thead>
    <tbody>
      ${xmpRows}
    </tbody>
  </table>
  `
      : ""
  }

  <div class="footer">
    <span>Generated by PDFSun (pdfsun.in) • 100% Private Client-Side Inspection</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() {
        window.close();
      }, 500);
    };
  </script>
</body>
</html>
`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "(Not specified)";
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 my-4">
      {/* Modal / Tool Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h2 className="text-base font-extrabold text-white">View PDF & XMP Metadata</h2>
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Read Only
              </span>

              {/* Compact Header Rating Badge */}
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition ml-1"
                title="View user reviews and ratings"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>5.0</span>
                <span className="text-[10px] text-slate-300 font-normal">(96)</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Inspect hidden document attributes, title, author, creation date & creator tool with live page preview.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {/* File Dropzone or Selected File Header */}
        {!file ? (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                  : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Select or Drop PDF File to Inspect
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-3">
                Upload any PDF document to instantly view its title, author, creation timestamp, creator application, embedded XMP metadata, and page visual preview.
              </p>
              <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition">
                Choose PDF File
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Read-Only Inspection:</strong> Client-side metadata parsing and PDF.js page rendering. Your original file remains untouched.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm shrink-0"
                title="Read user comments and leave feedback"
              >
                <MessageSquare className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>Comments</span>
              </button>
            </div>
          </div>
        ) : (
          /* Selected File Summary Banner */
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 font-black text-xs">
                PDF
              </div>
              <div className="truncate">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {file.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3 mt-0.5 font-mono">
                  <span>{formatFileSize(file.size)}</span>
                  {metadata && (
                    <>
                      <span>•</span>
                      <span>{metadata.basic.pageCount} Pages</span>
                      <span>•</span>
                      <span>PDF %PDF-{metadata.pdfVersion || "1.7"}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                  showPreview
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-transparent hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
                title="Toggle visual page preview"
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
              </button>

              <div {...getRootProps()} className="inline-block">
                <input {...getInputProps()} />
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center space-x-1.5"
                  title="Choose another file"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Change File</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setMetadata(null);
                  pdfDocRef.current = null;
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                title="Remove File"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Inspecting XMP & PDF Metadata Streams + Generating Preview...
            </p>
          </div>
        )}

        {/* Display Metadata & Preview Grid */}
        {metadata && !isLoading && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Nav Tabs & Top Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab("fields")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    activeTab === "fields"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Metadata Fields</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("xmp")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    activeTab === "xmp"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>
                    XMP Stream {metadata.xmpPacket ? "(Present)" : "(None)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("json")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    activeTab === "json"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Code2Icon className="w-3.5 h-3.5" />
                  <span>JSON Summary</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllJson}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center space-x-1.5"
                  title="Copy extracted metadata JSON to clipboard"
                >
                  {copiedKey === "ALL_JSON" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-black">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Copy Metadata</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMetadataJson}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center space-x-1.5"
                  title="Download metadata as a JSON file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Metadata</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center space-x-1.5"
                  title="Download metadata report as text file"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>TXT Report</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintMetadata}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center space-x-1.5 shadow-sm"
                  title="Print extracted metadata summary"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Split Panel: Left Visual PDF.js Document Preview + Right Metadata Tabs */}
            <div
              className={`grid gap-6 ${
                showPreview ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
              }`}
            >
              {/* PDF.js Document Preview Panel */}
              {showPreview && (
                <div className="lg:col-span-5 flex flex-col bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl p-4 space-y-3">
                  {/* Preview Panel Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 px-1">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white">
                        Document Preview
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {Math.round(previewScale * 100)}%
                      </span>
                      {previewScale !== 1.0 && (
                        <button
                          type="button"
                          onClick={() => setPreviewScale(1.0)}
                          className="text-[10px] text-indigo-400 hover:underline font-medium"
                          title="Reset zoom to 100%"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clean Navigation & Zoom Control Bar */}
                  <div className="p-2 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                    {/* Page Navigation Group */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={previewPage <= 1}
                        onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-700 transition text-xs font-bold flex items-center space-x-1"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Prev</span>
                      </button>

                      <div className="px-2 py-1 bg-slate-900/90 rounded-lg text-[11px] font-mono font-bold text-slate-200 border border-slate-800">
                        {previewPage} / {totalPages}
                      </div>

                      <button
                        type="button"
                        disabled={previewPage >= totalPages}
                        onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-700 transition text-xs font-bold flex items-center space-x-1"
                        title="Next Page"
                      >
                        <span className="hidden xs:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Zoom Navigation Group */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={previewScale <= 0.6}
                        onClick={() => setPreviewScale((s) => Math.max(0.6, s - 0.2))}
                        className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30 transition flex items-center space-x-1 text-xs font-bold"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                        <span className="sr-only sm:not-sr-only sm:text-[10px]">Out</span>
                      </button>

                      <button
                        type="button"
                        disabled={previewScale >= 2.0}
                        onClick={() => setPreviewScale((s) => Math.min(2.0, s + 0.2))}
                        className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30 transition flex items-center space-x-1 text-xs font-bold"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span className="sr-only sm:not-sr-only sm:text-[10px]">In</span>
                      </button>
                    </div>
                  </div>

                  {/* Canvas Render Container */}
                  <div className="relative flex-1 min-h-[340px] max-h-[520px] overflow-auto rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-center p-3">
                    {isRenderingPreview && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-10 space-x-2 text-xs font-bold text-indigo-300">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        <span>Rendering Page {previewPage}...</span>
                      </div>
                    )}

                    {previewError ? (
                      <div className="text-center p-6 space-y-2">
                        <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-medium">
                          {previewError}
                        </p>
                      </div>
                    ) : (
                      <canvas
                        ref={canvasRef}
                        className="max-w-full h-auto rounded-lg shadow-2xl bg-white transition-all"
                      />
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 text-center font-mono pt-1">
                    Powered by PDF.js engine • Page {previewPage} of {totalPages}
                  </div>
                </div>
              )}

              {/* Right Panel: Metadata Information */}
              <div
                className={`${
                  showPreview ? "lg:col-span-7" : "col-span-1"
                } space-y-4`}
              >
                {/* TAB 1: Key Metadata Fields Inspection Grid */}
                {activeTab === "fields" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* 1. Title */}
                    <FieldDisplayCard
                      icon={<BookOpen className="w-4 h-4 text-indigo-500" />}
                      label="Document Title"
                      value={metadata.basic.title}
                      placeholder="Not set in PDF header"
                      onCopy={() => handleCopyText(metadata.basic.title, "title")}
                      isCopied={copiedKey === "title"}
                    />

                    {/* 2. Author */}
                    <FieldDisplayCard
                      icon={<User className="w-4 h-4 text-emerald-500" />}
                      label="Author / Creator"
                      value={metadata.basic.author}
                      placeholder="Not specified"
                      onCopy={() => handleCopyText(metadata.basic.author, "author")}
                      isCopied={copiedKey === "author"}
                    />

                    {/* 3. Creation Date */}
                    <FieldDisplayCard
                      icon={<Calendar className="w-4 h-4 text-blue-500" />}
                      label="Creation Date"
                      value={formatDate(metadata.basic.creationDate)}
                      rawIso={metadata.basic.creationDate}
                      placeholder="Not set"
                      onCopy={() =>
                        handleCopyText(metadata.basic.creationDate || "", "creationDate")
                      }
                      isCopied={copiedKey === "creationDate"}
                    />

                    {/* 4. Creator Tool (Application) */}
                    <FieldDisplayCard
                      icon={<Cpu className="w-4 h-4 text-purple-500" />}
                      label="Creator Tool (Application)"
                      value={metadata.basic.creator}
                      placeholder="Not specified"
                      onCopy={() => handleCopyText(metadata.basic.creator, "creator")}
                      isCopied={copiedKey === "creator"}
                    />

                    {/* 5. Subject */}
                    <FieldDisplayCard
                      icon={<Info className="w-4 h-4 text-amber-500" />}
                      label="Subject / Description"
                      value={metadata.basic.subject}
                      placeholder="Not specified"
                      onCopy={() => handleCopyText(metadata.basic.subject, "subject")}
                      isCopied={copiedKey === "subject"}
                    />

                    {/* 6. Producer */}
                    <FieldDisplayCard
                      icon={<Sparkles className="w-4 h-4 text-pink-500" />}
                      label="PDF Producer Engine"
                      value={metadata.basic.producer}
                      placeholder="Not specified"
                      onCopy={() => handleCopyText(metadata.basic.producer, "producer")}
                      isCopied={copiedKey === "producer"}
                    />

                    {/* 7. Keywords */}
                    <FieldDisplayCard
                      icon={<Tag className="w-4 h-4 text-teal-500" />}
                      label="Keywords / Tags"
                      value={metadata.basic.keywords}
                      placeholder="No keywords tags found"
                      onCopy={() => handleCopyText(metadata.basic.keywords, "keywords")}
                      isCopied={copiedKey === "keywords"}
                    />

                    {/* 8. Modification Date */}
                    <FieldDisplayCard
                      icon={<Clock className="w-4 h-4 text-orange-500" />}
                      label="Last Modification Date"
                      value={formatDate(metadata.basic.modificationDate)}
                      rawIso={metadata.basic.modificationDate}
                      placeholder="Not set"
                      onCopy={() =>
                        handleCopyText(metadata.basic.modificationDate || "", "modDate")
                      }
                      isCopied={copiedKey === "modDate"}
                    />
                  </div>
                )}

                {/* TAB 2: XMP Metadata Packet */}
                {activeTab === "xmp" && (
                  <div className="space-y-4">
                    {metadata.xmpPacket ? (
                      <>
                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                          <span className="font-bold flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                            <span>Embedded XMP XML Metadata Stream Found</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(metadata.xmpPacket || "", "xmpPacket")
                            }
                            className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg text-[11px] font-bold border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 transition"
                          >
                            {copiedKey === "xmpPacket" ? "Copied Packet!" : "Copy Raw XML"}
                          </button>
                        </div>

                        <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800 whitespace-pre-wrap leading-relaxed">
                          {metadata.xmpPacket}
                        </pre>
                      </>
                    ) : (
                      <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <FileCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          No XMP Stream Detected
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                          This document relies on standard PDF Document Information Dictionary fields rather than an extended XMP XML metadata packet.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: JSON Summary */}
                {activeTab === "json" && (
                  <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
                    {JSON.stringify(
                      {
                        fileName: file.name,
                        fileSize: file.size,
                        pageCount: metadata.basic.pageCount,
                        pdfVersion: metadata.pdfVersion || "1.7",
                        title: metadata.basic.title || null,
                        author: metadata.basic.author || null,
                        subject: metadata.basic.subject || null,
                        keywords: metadata.basic.keywords || null,
                        creatorTool: metadata.basic.creator || null,
                        producerEngine: metadata.basic.producer || null,
                        creationDate: metadata.basic.creationDate || null,
                        modificationDate: metadata.basic.modificationDate || null,
                        xmpFieldsExtracted: metadata.xmpFields,
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            </div>

            {/* Bottom Disclaimer Notice & Footer Actions */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Read-Only Inspection:</strong> Client-side metadata parsing and PDF.js page rendering. Your original file remains untouched.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm shrink-0"
                title="Read user comments and leave feedback"
              >
                <MessageSquare className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>Comments</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Isolated Review & Feedback Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 relative max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  User Reviews & Ratings for View PDF Metadata
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <React.Suspense
              fallback={
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Loading review board...</span>
                </div>
              }
            >
              <FeedbackWidget toolId="view-pdf-metadata" toolName="View PDF Metadata" />
            </React.Suspense>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-slate-400 font-medium">
                PDFSun • Client-Side Security Verified
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyAllJson}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
                  title="Copy all extracted technical metadata to clipboard"
                >
                  {copiedKey === "ALL_JSON" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-black">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Copy Metadata</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrintMetadata}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
                  title="Print extracted metadata summary"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper card component for metadata fields
interface FieldDisplayCardProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  rawIso?: string;
  placeholder?: string;
  onCopy: () => void;
  isCopied: boolean;
}

const FieldDisplayCard: React.FC<FieldDisplayCardProps> = ({
  icon,
  label,
  value,
  rawIso,
  placeholder = "Not set",
  onCopy,
  isCopied,
}) => {
  const hasValue = Boolean(value && value.trim().length > 0 && value !== "(Not specified)");

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-2 group hover:border-indigo-500/40 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {label}
          </span>
        </div>

        {hasValue && (
          <button
            type="button"
            onClick={onCopy}
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Copy field value"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      <div>
        <div
          className={`text-xs font-medium break-all ${
            hasValue
              ? "text-slate-900 dark:text-white font-semibold"
              : "text-slate-400 dark:text-slate-500 italic"
          }`}
        >
          {hasValue ? value : placeholder}
        </div>
        {rawIso && hasValue && (
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            {rawIso}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper icon
const Code2Icon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    />
  </svg>
);
