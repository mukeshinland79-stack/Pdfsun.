import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import {
  Barcode,
  ArrowLeft,
  Download,
  Copy,
  Check,
  Printer,
  Upload,
  FileSpreadsheet,
  Sliders,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  Package,
} from "lucide-react";
import {
  BarcodeSymbology,
  BarcodeGenerationOptions,
  BarcodeResult,
  SYMBOLOGY_INFO,
  generateBarcode,
  drawBarcodeToCanvas,
  sanitizeSpreadsheetCell,
  escapeCsvField,
} from "../lib/barcodeEngine";
import { ToolHistoryItem } from "../types";
import { triggerErrorToast } from "./GlobalErrorToast";
import { toStrictArrayBuffer } from "../utils/binaryUtils";
import {
  trackToolOpened,
  trackProcessStarted,
  trackProcessCompleted,
  trackOutputValidated,
  trackDownloadInitiated,
  trackProcessFailed,
} from "../utils/analytics";

export interface BarcodeGeneratorToolProps {
  onClose?: () => void;
  onAddHistory?: (item: ToolHistoryItem) => void;
  onOpenArticle?: (slug: string) => void;
}

interface BulkBarcodeRow {
  rowIndex: number;
  value: string;
  label: string;
  symbology: BarcodeSymbology;
  result: BarcodeResult;
}

const SYMBOLOGIES: BarcodeSymbology[] = [
  "CODE128",
  "EAN13",
  "UPCA",
  "UPCE",
  "EAN8",
  "CODE39",
  "ITF14",
  "CODABAR",
  "GS1_128",
];

const BULK_ROW_LIMIT = 500;
const MAX_BULK_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const GUIDE_SLUG = "complete-guide-barcode-generator-code128-ean13-gs1-128";

export const BarcodeGeneratorTool: React.FC<BarcodeGeneratorToolProps> = ({
  onClose,
  onAddHistory,
  onOpenArticle,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<"simple" | "advanced" | "bulk">("simple");
  const [symbology, setSymbology] = useState<BarcodeSymbology>("CODE128");
  const [inputValue, setInputValue] = useState<string>(SYMBOLOGY_INFO.CODE128.example);
  const [customLabel, setCustomLabel] = useState<string>("");

  // Visual / symbology options
  const [barWidth, setBarWidth] = useState<number>(2);
  const [barHeight, setBarHeight] = useState<number>(96);
  const [quietZoneModules, setQuietZoneModules] = useState<number>(10);
  const [foreground, setForeground] = useState<string>("#0f172a");
  const [background, setBackground] = useState<string>("#ffffff");
  const [showText, setShowText] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(14);
  const [includeChecksum, setIncludeChecksum] = useState<boolean>(false);
  const [itfBearerBars, setItfBearerBars] = useState<boolean>(true);
  const [codabarStart, setCodabarStart] = useState<"A" | "B" | "C" | "D">("A");
  const [codabarStop, setCodabarStop] = useState<"A" | "B" | "C" | "D">("B");

  // UI feedback states
  const [copiedType, setCopiedType] = useState<"svg" | "png" | "value" | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string>("");

  // Bulk state
  const [bulkRows, setBulkRows] = useState<BulkBarcodeRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState<string>("");
  const [bulkBusy, setBulkBusy] = useState<boolean>(false);
  const [bulkExportFormat, setBulkExportFormat] = useState<"png" | "svg">("png");

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    trackToolOpened("barcode-generator");
  }, []);

  const currentOptions: BarcodeGenerationOptions = useMemo(
    () => ({
      symbology,
      barWidth,
      height: barHeight,
      quietZoneModules,
      foreground,
      background,
      showText,
      customLabel: workspaceMode !== "simple" ? customLabel : "",
      fontSize,
      includeChecksum,
      itfBearerBars,
      codabarStart,
      codabarStop,
    }),
    [
      symbology,
      barWidth,
      barHeight,
      quietZoneModules,
      foreground,
      background,
      showText,
      workspaceMode,
      customLabel,
      fontSize,
      includeChecksum,
      itfBearerBars,
      codabarStart,
      codabarStop,
    ]
  );

  const barcodeResult: BarcodeResult = useMemo(
    () => generateBarcode(inputValue, currentOptions),
    [inputValue, currentOptions]
  );

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !barcodeResult.valid) return;
    try {
      drawBarcodeToCanvas(canvas, barcodeResult, currentOptions, 2);
    } catch {
      // Canvas unavailable or invalid dimensions handled cleanly
    }
  }, [barcodeResult, currentOptions]);

  const handleSymbologyChange = (nextSymbology: BarcodeSymbology) => {
    setSymbology(nextSymbology);
    // Load valid default example if previous value matched another symbology's untouched example or was empty
    const isPrevDefault = Object.values(SYMBOLOGY_INFO).some((s) => s.example === inputValue);
    if (!inputValue.trim() || isPrevDefault) {
      setInputValue(SYMBOLOGY_INFO[nextSymbology].example);
    }
  };

  const renderToOffscreenCanvas = useCallback(
    (res: BarcodeResult, opts: BarcodeGenerationOptions, scale = 3): HTMLCanvasElement => {
      const canvas = document.createElement("canvas");
      drawBarcodeToCanvas(canvas, res, opts, scale);
      return canvas;
    },
    []
  );

  const recordHistoryAndAnalytics = (ext: string, bytesLength: number, latencyMs: number) => {
    trackProcessCompleted("barcode-generator", latencyMs, ext, bytesLength);
    trackOutputValidated("barcode-generator", ext, bytesLength);
    trackDownloadInitiated("barcode-generator", ext, bytesLength);
    if (onAddHistory) {
      onAddHistory({
        id: String(Date.now()),
        toolId: "barcode-generator",
        toolName: "Barcode Generator",
        fileName: `barcode-${symbology.toLowerCase()}.${ext}`,
        fileSize: bytesLength,
        timestamp: Date.now(),
        status: "downloaded",
      });
    }
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleDownloadSvg = () => {
    if (!barcodeResult.valid) return;
    const t0 = performance.now();
    trackProcessStarted("barcode-generator", "svg", barcodeResult.svgMarkup.length);
    const blob = new Blob([barcodeResult.svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    triggerBlobDownload(blob, `pdfsun-barcode-${symbology.toLowerCase()}.svg`);
    recordHistoryAndAnalytics("svg", blob.size, performance.now() - t0);
    setExportStatus("SVG downloaded");
    setTimeout(() => setExportStatus(""), 2500);
  };

  const handleDownloadRaster = async (format: "png" | "jpg") => {
    if (!barcodeResult.valid) return;
    setIsExporting(true);
    const t0 = performance.now();
    trackProcessStarted("barcode-generator", format, 0);
    try {
      const canvas = renderToOffscreenCanvas(barcodeResult, currentOptions, 3);
      const mime = format === "png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
          mime,
          0.96
        );
      });
      triggerBlobDownload(blob, `pdfsun-barcode-${symbology.toLowerCase()}.${format}`);
      recordHistoryAndAnalytics(format, blob.size, performance.now() - t0);
      setExportStatus(`${format.toUpperCase()} downloaded`);
      setTimeout(() => setExportStatus(""), 2500);
    } catch (err: any) {
      trackProcessFailed("barcode-generator", performance.now() - t0);
      triggerErrorToast("Export Failed", err?.message || "Could not export raster barcode.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!barcodeResult.valid) return;
    setIsExporting(true);
    const t0 = performance.now();
    trackProcessStarted("barcode-generator", "pdf", 0);
    try {
      const canvas = renderToOffscreenCanvas(barcodeResult, currentOptions, 3);
      const dataUrl = canvas.toDataURL("image/png");
      const doc = new jsPDF({
        orientation: barcodeResult.width > barcodeResult.height ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const maxW = pageW - 96;
      const aspect = barcodeResult.height / Math.max(1, barcodeResult.width);
      const renderW = Math.min(maxW, Math.max(260, barcodeResult.width * 0.9));
      const renderH = renderW * aspect;
      const x = (pageW - renderW) / 2;
      const y = Math.max(72, (pageH - renderH) / 3);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`${SYMBOLOGY_INFO[symbology].label} Label`, pageW / 2, 46, { align: "center" });
      doc.addImage(dataUrl, "PNG", x, y, renderW, renderH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Normalized Code: ${barcodeResult.normalizedValue}`, pageW / 2, y + renderH + 24, {
        align: "center",
      });

      const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
      const blob = new Blob([toStrictArrayBuffer(pdfBytes)], { type: "application/pdf" });
      triggerBlobDownload(blob, `pdfsun-barcode-${symbology.toLowerCase()}.pdf`);
      recordHistoryAndAnalytics("pdf", blob.size, performance.now() - t0);
      setExportStatus("PDF label downloaded");
      setTimeout(() => setExportStatus(""), 2500);
    } catch (err: any) {
      trackProcessFailed("barcode-generator", performance.now() - t0);
      triggerErrorToast("PDF Export Failed", err?.message || "Could not create PDF label.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (!barcodeResult.valid) return;
    window.print();
  };

  const handleCopy = async (kind: "svg" | "png" | "value") => {
    if (!barcodeResult.valid) return;
    try {
      if (kind === "svg") {
        await navigator.clipboard.writeText(barcodeResult.svgMarkup);
      } else if (kind === "value") {
        await navigator.clipboard.writeText(barcodeResult.normalizedValue);
      } else {
        const canvas = renderToOffscreenCanvas(barcodeResult, currentOptions, 3);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Clipboard PNG conversion failed"))), "image/png");
        });
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        } else {
          throw new Error("PNG clipboard copy is not supported in this browser; use Download PNG instead.");
        }
      }
      setCopiedType(kind);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err: any) {
      triggerErrorToast("Copy Failed", err?.message || "Could not write to clipboard.");
    }
  };

  // Bulk Template Generators (CWE-1236 formula injection safe + leading zeros preserved)
  const handleDownloadSampleTemplate = (format: "csv" | "xlsx") => {
    const sampleRows = [
      ["code", "label", "symbology"],
      ["089010308951", "Organic Tea 250g", "EAN13"],
      ["PDFSUN-SKU-101", "Warehouse Rack A1", "CODE128"],
      ["03600029145", "Retail Pack 12oz", "UPCA"],
      ["1001234567890", "Master Carton #14", "ITF14"],
      ["(01)08901030895128(17)271231(10)LOT42", "GS1 Pharma Batch", "GS1_128"],
    ];

    if (format === "csv") {
      const csv = sampleRows.map((r) => r.map(escapeCsvField).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      triggerBlobDownload(blob, "pdfsun-barcode-bulk-template.csv");
    } else {
      const safeRows = sampleRows.map((r) => r.map(sanitizeSpreadsheetCell));
      const ws = XLSX.utils.aoa_to_sheet(safeRows);
      // Force string cell types so leading zeros are never stripped by spreadsheet apps
      Object.keys(ws).forEach((key) => {
        if (!key.startsWith("!") && ws[key]) {
          ws[key].t = "s";
          ws[key].z = "@";
        }
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Barcodes");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      triggerBlobDownload(blob, "pdfsun-barcode-bulk-template.xlsx");
    }
  };

  const handleBulkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop() || "";
    if (!["csv", "xls", "xlsx"].includes(ext)) {
      triggerErrorToast("Unsupported File", "Upload a .csv, .xls, or .xlsx spreadsheet.");
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_BULK_FILE_BYTES) {
      triggerErrorToast("File Too Large", "Bulk spreadsheet exceeds the 10 MB browser memory safety limit.");
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
      return;
    }
    setBulkBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", raw: false, codepage: 65001 });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) throw new Error("Spreadsheet contains no worksheets.");
      const sheet = workbook.Sheets[firstSheet];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        raw: false,
        defval: "",
      });

      if (!rows.length) {
        throw new Error("No data rows found in uploaded spreadsheet.");
      }

      const sliced = rows.slice(0, BULK_ROW_LIMIT);
      if (rows.length > BULK_ROW_LIMIT) {
        triggerErrorToast(
          "Row Cap Applied",
          `Processed first ${BULK_ROW_LIMIT} rows to maintain fast browser memory performance.`
        );
      }

      const parsed: BulkBarcodeRow[] = sliced.map((row, idx) => {
        const keys = Object.keys(row);
        const codeKey =
          keys.find((k) => /^(code|barcode|value|data|gtin|upc|ean)$/i.test(k.trim())) || keys[0];
        const labelKey = keys.find((k) => /^(label|title|name|product)$/i.test(k.trim()));
        const symKey = keys.find((k) => /^(symbology|format|type)$/i.test(k.trim()));

        const rawCode = String(row[codeKey] ?? "").trim();
        const rowLabel = labelKey ? String(row[labelKey] ?? "").trim() : "";
        const rawSym = symKey ? String(row[symKey] ?? "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "") : "";
        const rowSymbology: BarcodeSymbology = (SYMBOLOGIES as string[]).includes(rawSym)
          ? (rawSym as BarcodeSymbology)
          : symbology;

        const res = generateBarcode(rawCode, {
          ...currentOptions,
          symbology: rowSymbology,
          customLabel: rowLabel,
        });

        return {
          rowIndex: idx + 1,
          value: rawCode,
          label: rowLabel,
          symbology: rowSymbology,
          result: res,
        };
      });

      setBulkFileName(file.name);
      setBulkRows(parsed);
    } catch (err: any) {
      triggerErrorToast("Import Error", err?.message || "Could not read CSV/Excel file.");
    } finally {
      setBulkBusy(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
    }
  };

  const validBulkRows = useMemo(() => bulkRows.filter((r) => r.result.valid), [bulkRows]);

  const handleBulkDownloadZip = async () => {
    if (!validBulkRows.length) return;
    setBulkBusy(true);
    const t0 = performance.now();
    trackProcessStarted("barcode-generator", "zip", validBulkRows.length);
    try {
      const zip = new JSZip();
      for (const item of validBulkRows) {
        const safeFileCode = item.result.normalizedValue.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || `row-${item.rowIndex}`;
        const baseName = `${String(item.rowIndex).padStart(3, "0")}-${item.symbology.toLowerCase()}-${safeFileCode}`;
        if (bulkExportFormat === "svg") {
          zip.file(`${baseName}.svg`, item.result.svgMarkup);
        } else {
          const canvas = renderToOffscreenCanvas(
            item.result,
            { ...currentOptions, symbology: item.symbology, customLabel: item.label },
            2
          );
          const pngBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG error"))), "image/png");
          });
          zip.file(`${baseName}.png`, pngBlob);
        }
      }

      // Include summary CSV manifest with formula injection protection
      const manifestHeader = ["row", "symbology", "normalized_value", "label", "status"];
      const manifestRows = bulkRows.map((r) => [
        String(r.rowIndex),
        r.symbology,
        r.result.normalizedValue || r.value,
        r.label,
        r.result.valid ? "VALID" : `ERROR: ${r.result.error || "Invalid"}`,
      ]);
      const manifestCsv = [manifestHeader, ...manifestRows]
        .map((r) => r.map(escapeCsvField).join(","))
        .join("\n");
      zip.file("manifest.csv", manifestCsv);

      const zipBytes = await zip.generateAsync({ type: "uint8array" });
      const blob = new Blob([toStrictArrayBuffer(zipBytes)], { type: "application/zip" });
      triggerBlobDownload(blob, `pdfsun-barcodes-batch-${validBulkRows.length}.zip`);
      recordHistoryAndAnalytics("zip", blob.size, performance.now() - t0);
    } catch (err: any) {
      trackProcessFailed("barcode-generator", performance.now() - t0);
      triggerErrorToast("ZIP Export Failed", err?.message || "Could not package bulk barcodes.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDownloadPdfSheet = async () => {
    if (!validBulkRows.length) return;
    setBulkBusy(true);
    const t0 = performance.now();
    trackProcessStarted("barcode-generator", "pdf", validBulkRows.length);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 36;
      const colGap = 20;
      const cols = 2;
      const cellW = (pageW - margin * 2 - colGap) / cols;
      const cellH = 112;
      const rowsPerPage = Math.floor((pageH - margin * 2) / cellH);
      const perPage = cols * rowsPerPage;

      for (let i = 0; i < validBulkRows.length; i++) {
        if (i > 0 && i % perPage === 0) {
          doc.addPage();
        }
        const idxOnPage = i % perPage;
        const col = idxOnPage % cols;
        const row = Math.floor(idxOnPage / cols);
        const x = margin + col * (cellW + colGap);
        const y = margin + row * cellH;

        const item = validBulkRows[i];
        const canvas = renderToOffscreenCanvas(
          item.result,
          { ...currentOptions, symbology: item.symbology, customLabel: item.label },
          2
        );
        const imgData = canvas.toDataURL("image/png");
        const aspect = item.result.height / Math.max(1, item.result.width);
        const maxDrawW = cellW - 16;
        const maxDrawH = cellH - 16;
        let drawW = maxDrawW;
        let drawH = drawW * aspect;
        if (drawH > maxDrawH) {
          drawH = maxDrawH;
          drawW = drawH / Math.max(0.05, aspect);
        }

        doc.setDrawColor(226, 232, 240);
        doc.rect(x, y, cellW, cellH - 8);
        doc.addImage(imgData, "PNG", x + (cellW - drawW) / 2, y + (cellH - 8 - drawH) / 2, drawW, drawH);
      }

      const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
      const blob = new Blob([toStrictArrayBuffer(pdfBytes)], { type: "application/pdf" });
      triggerBlobDownload(blob, `pdfsun-barcode-labels-sheet-${validBulkRows.length}.pdf`);
      recordHistoryAndAnalytics("pdf", blob.size, performance.now() - t0);
    } catch (err: any) {
      trackProcessFailed("barcode-generator", performance.now() - t0);
      triggerErrorToast("PDF Sheet Export Failed", err?.message || "Could not build PDF label sheet.");
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Top Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer shrink-0"
              aria-label="Back to all PDFSun tools"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Barcode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
              Barcode Generator
            </h1>
            <p className="text-xs text-slate-300 truncate">
              9 ISO/GS1 Symbologies · Mod-10/43/103 Verified · 100% Client-Side
            </p>
          </div>
        </div>

        {/* Mode Switcher + Guide Link */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-slate-800 rounded-lg border border-slate-700" role="tablist" aria-label="Barcode workspace mode">
            {(
              [
                { id: "simple", label: "Simple", icon: Sparkles },
                { id: "advanced", label: "Advanced", icon: Sliders },
                { id: "bulk", label: "Bulk CSV/Excel", icon: Layers },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = workspaceMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setWorkspaceMode(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                    active ? "bg-amber-500 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <a
            href={`/blog/${GUIDE_SLUG}`}
            onClick={(e) => {
              if (onOpenArticle) {
                e.preventDefault();
                onOpenArticle(GUIDE_SLUG);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 whitespace-nowrap shrink-0 transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Barcode Guide</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      {workspaceMode !== "bulk" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6">
          {/* Left Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <label htmlFor="barcode-symbology-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Barcode Format (Symbology)
              </label>
              <select
                id="barcode-symbology-select"
                value={symbology}
                onChange={(e) => handleSymbologyChange(e.target.value as BarcodeSymbology)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {SYMBOLOGIES.map((sym) => (
                  <option key={sym} value={sym}>
                    {SYMBOLOGY_INFO[sym].label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                {SYMBOLOGY_INFO[symbology].description}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="barcode-value-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Barcode Value / Payload
                </label>
                <button
                  type="button"
                  onClick={() => setInputValue(SYMBOLOGY_INFO[symbology].example)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Load Example
                </button>
              </div>
              <input
                id="barcode-value-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={SYMBOLOGY_INFO[symbology].example}
                spellCheck={false}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Rules: {SYMBOLOGY_INFO[symbology].rules}
              </p>
            </div>

            {/* GS1-128 Breakdown Helper */}
            {symbology === "GS1_128" && barcodeResult.valid && barcodeResult.metadata?.aiSegments && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Parsed GS1 Application Identifiers (FNC1 Active)
                </div>
                <div className="space-y-1">
                  {barcodeResult.metadata.aiSegments.map((seg, i) => (
                    <div key={`${seg.ai}-${i}`} className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-slate-600 dark:text-slate-400">
                        ({seg.ai}) {seg.title}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symbology-Specific Switches */}
            {symbology === "CODE39" && (
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Append Mod-43 Check Digit
                </span>
                <input
                  type="checkbox"
                  checked={includeChecksum}
                  onChange={(e) => setIncludeChecksum(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
              </label>
            )}

            {symbology === "ITF14" && (
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Render Horizontal Bearer Bars
                </span>
                <input
                  type="checkbox"
                  checked={itfBearerBars}
                  onChange={(e) => setItfBearerBars(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
              </label>
            )}

            {symbology === "CODABAR" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="codabar-start-guard" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Start Guard
                  </label>
                  <select
                    id="codabar-start-guard"
                    value={codabarStart}
                    onChange={(e) => setCodabarStart(e.target.value as "A" | "B" | "C" | "D")}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  >
                    {(["A", "B", "C", "D"] as const).map((g) => (
                      <option key={g} value={g}>Guard {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="codabar-stop-guard" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Stop Guard
                  </label>
                  <select
                    id="codabar-stop-guard"
                    value={codabarStop}
                    onChange={(e) => setCodabarStop(e.target.value as "A" | "B" | "C" | "D")}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  >
                    {(["A", "B", "C", "D"] as const).map((g) => (
                      <option key={g} value={g}>Guard {g}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Advanced Styling Controls */}
            {workspaceMode === "advanced" && (
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label htmlFor="barcode-custom-label" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Optional Header / Product Label
                  </label>
                  <input
                    id="barcode-custom-label"
                    type="text"
                    maxLength={60}
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="e.g. Organic Tea 250g — Batch A"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="barcode-bar-width" className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Bar Width</span>
                      <span className="font-mono tabular-nums">{barWidth}px</span>
                    </label>
                    <input
                      id="barcode-bar-width"
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={barWidth}
                      onChange={(e) => setBarWidth(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="barcode-bar-height" className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Bar Height</span>
                      <span className="font-mono tabular-nums">{barHeight}px</span>
                    </label>
                    <input
                      id="barcode-bar-height"
                      type="range"
                      min={40}
                      max={220}
                      step={4}
                      value={barHeight}
                      onChange={(e) => setBarHeight(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="barcode-quiet-zone" className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Quiet Zone</span>
                      <span className="font-mono tabular-nums">{quietZoneModules}x</span>
                    </label>
                    <input
                      id="barcode-quiet-zone"
                      type="range"
                      min={10}
                      max={24}
                      step={1}
                      value={quietZoneModules}
                      onChange={(e) => setQuietZoneModules(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="barcode-font-size" className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Font Size</span>
                      <span className="font-mono tabular-nums">{fontSize}px</span>
                    </label>
                    <input
                      id="barcode-font-size"
                      type="range"
                      min={10}
                      max={24}
                      step={1}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold">Bar Color</span>
                    <input
                      type="color"
                      value={foreground}
                      onChange={(e) => setForeground(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold">Background</span>
                    <input
                      type="color"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Show Human-Readable Text
                  </span>
                  <input
                    type="checkbox"
                    checked={showText}
                    onChange={(e) => setShowText(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Right Live Preview & Export Panel */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-6 flex flex-col items-center justify-center min-h-[280px] relative print:border-0 print:bg-white">
              {barcodeResult.valid ? (
                <>
                  <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Verified {SYMBOLOGY_INFO[symbology].shortLabel}</span>
                      {barcodeResult.checkDigit && (
                        <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          · Check Digit: {barcodeResult.checkDigit}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {barcodeResult.totalModules} modules · {barcodeResult.width}×{barcodeResult.height}px
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto flex items-center justify-center py-4">
                    <canvas
                      ref={previewCanvasRef}
                      aria-label={`${SYMBOLOGY_INFO[symbology].label} barcode for ${barcodeResult.normalizedValue}`}
                      className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white shadow-xs"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-400 print:hidden">
                    <span>
                      Encoded:{" "}
                      <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                        {barcodeResult.normalizedValue}
                      </strong>
                    </span>
                    {exportStatus && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        · {exportStatus}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center max-w-md space-y-2 py-8">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Invalid {SYMBOLOGY_INFO[symbology].shortLabel} Input
                  </h2>
                  <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                    {barcodeResult.error || "Enter a valid barcode value matching format rules."}
                  </p>
                </div>
              )}
            </div>

            {/* Export Actions */}
            <div className="space-y-3 print:hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  disabled={!barcodeResult.valid || isExporting}
                  onClick={() => handleDownloadRaster("png")}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>
                <button
                  type="button"
                  disabled={!barcodeResult.valid || isExporting}
                  onClick={handleDownloadSvg}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Vector SVG</span>
                </button>
                <button
                  type="button"
                  disabled={!barcodeResult.valid || isExporting}
                  onClick={() => handleDownloadRaster("jpg")}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-slate-800 dark:text-slate-200 text-xs font-bold whitespace-nowrap border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JPG</span>
                </button>
                <button
                  type="button"
                  disabled={!barcodeResult.valid || isExporting}
                  onClick={handleDownloadPdf}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!barcodeResult.valid}
                    onClick={() => handleCopy("svg")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    {copiedType === "svg" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === "svg" ? "SVG Copied" : "Copy SVG"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!barcodeResult.valid}
                    onClick={() => handleCopy("png")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    {copiedType === "png" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === "png" ? "PNG Copied" : "Copy PNG"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!barcodeResult.valid}
                    onClick={() => handleCopy("value")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    {copiedType === "value" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === "value" ? "Value Copied" : "Copy Normalized Code"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!barcodeResult.valid}
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-45 text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Label</span>
                  </button>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Zero server transmission</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bulk CSV / Excel Barcode Generator Workspace */
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Bulk Barcode Batch Import (CSV / XLS / XLSX)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Upload up to {BULK_ROW_LIMIT} rows with columns{" "}
                <code className="font-mono text-amber-600 dark:text-amber-400">code</code>, optional{" "}
                <code className="font-mono text-amber-600 dark:text-amber-400">label</code>, and{" "}
                <code className="font-mono text-amber-600 dark:text-amber-400">symbology</code>. Leading zeros are strictly preserved.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadSampleTemplate("csv")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sample CSV</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSampleTemplate("xlsx")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Sample XLSX</span>
              </button>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold whitespace-nowrap cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{bulkBusy ? "Reading..." : "Upload CSV / Excel"}</span>
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleBulkFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {bulkRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-3">
              <Package className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No batch spreadsheet loaded yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Download a formula-safe sample CSV or Excel template above, or upload your inventory sheet to validate every barcode and export a single ZIP archive or printable A4 PDF label sheet.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                  <span className="font-sans font-bold text-slate-800 dark:text-slate-200">{bulkFileName}</span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {validBulkRows.length} Valid
                  </span>
                  <span>·</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    {bulkRows.length - validBulkRows.length} Invalid
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkExportFormat}
                    onChange={(e) => setBulkExportFormat(e.target.value as "png" | "svg")}
                    aria-label="ZIP barcode file format"
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="png">ZIP: High-DPI PNG</option>
                    <option value="svg">ZIP: Vector SVG</option>
                  </select>
                  <button
                    type="button"
                    disabled={!validBulkRows.length || bulkBusy}
                    onClick={handleBulkDownloadZip}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ZIP ({validBulkRows.length})</span>
                  </button>
                  <button
                    type="button"
                    disabled={!validBulkRows.length || bulkBusy}
                    onClick={handleBulkDownloadPdfSheet}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>A4 PDF Label Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkRows([]);
                      setBulkFileName("");
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    aria-label="Clear imported batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">#</th>
                      <th className="px-3 py-2.5 font-bold">Symbology</th>
                      <th className="px-3 py-2.5 font-bold">Code Value</th>
                      <th className="px-3 py-2.5 font-bold">Label</th>
                      <th className="px-3 py-2.5 font-bold">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {bulkRows.map((r) => (
                      <tr key={r.rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-mono tabular-nums text-slate-500">{r.rowIndex}</td>
                        <td className="px-3 py-2 font-semibold">{SYMBOLOGY_INFO[r.symbology].shortLabel}</td>
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {r.result.valid ? r.result.normalizedValue : r.value || "(empty)"}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{r.label || "—"}</td>
                        <td className="px-3 py-2">
                          {r.result.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{r.result.error}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
