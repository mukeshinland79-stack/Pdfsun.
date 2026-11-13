import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Barcode,
  Layers,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
  Palette,
  Printer,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Maximize2,
  FileCode,
  FileText,
  Package,
  UploadCloud,
  X,
  FileSearch,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toStrictUint8Array } from "../utils/binaryUtils";
import {
  SymbologyType,
  SYMBOLOGY_CATALOG,
  BarcodeRenderOptions,
  LabelItemData,
} from "../barcode/types";
import { validateBarcodeInput } from "../barcode/validation";
import { renderBarcode, RenderOutput } from "../barcode/renderer";
import {
  exportSvgFile,
  exportPngFile,
  exportJpgFile,
  exportSingleBarcodePdf,
} from "../barcode/exporter";
import {
  STANDARD_LABEL_TEMPLATES,
  generatePrintReadyLabelPdf,
} from "../barcode/labelDesigner";
import {
  parseCsvData,
  parseExcelData,
  generateSequentialItems,
  createBulkBarcodeZip,
} from "../barcode/bulkEngine";
import { BUSINESS_PRESETS, BusinessPreset } from "../barcode/presets";
import {
  extractBarcodesFromDocument,
  ExtractedBarcodeCandidate,
  DocumentExtractionResult,
} from "../barcode/documentExtractor";
import { ToolItem, ToolHistoryItem } from "../types";

export interface BarcodeStudioWorkspaceProps {
  tool?: ToolItem;
  initialFiles?: File[] | null;
  onClose?: () => void;
  onAddHistory?: (item: ToolHistoryItem) => void;
  onBackToHome?: () => void;
}

type StudioTab = "single" | "extract" | "sheet" | "bulk" | "presets" | "guide";

export const BarcodeStudioWorkspace: React.FC<BarcodeStudioWorkspaceProps> = ({
  tool,
  initialFiles,
  onClose,
  onAddHistory,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>("single");

  // Single Studio State
  const [symbology, setSymbology] = useState<SymbologyType>("code128");
  const [inputText, setInputText] = useState<string>("PDFSUN-2026-X99");
  const [title, setTitle] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [scale, setScale] = useState<number>(3);
  const [barHeight, setBarHeight] = useState<number>(18);
  const [foregroundColor, setForegroundColor] = useState<string>("#000000");
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const [includeText, setIncludeText] = useState<boolean>(true);
  const [quietZone, setQuietZone] = useState<number>(10);
  const [rotation, setRotation] = useState<"N" | "R" | "L" | "I">("N");

  // Render & Status
  const [rendered, setRendered] = useState<RenderOutput | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Document Extractor State
  const [extractedDoc, setExtractedDoc] = useState<DocumentExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [candidateFilter, setCandidateFilter] = useState<string>("");

  // Sheet Designer State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("avery-5160");
  const [sheetItems, setSheetItems] = useState<LabelItemData[]>([
    {
      id: "label-1",
      barcodeValue: "890103099999",
      symbology: "ean13",
      title: "Eco-Friendly Bamboo Toothbrush",
      subtitle: "SKU-BAM-01",
      price: "₹149",
      quantity: 12,
    },
    {
      id: "label-2",
      barcodeValue: "PDFSUN-PRO-4096",
      symbology: "code128",
      title: "Solar Charge Controller 30A",
      subtitle: "SKU-SCC-30",
      price: "₹1,899",
      quantity: 8,
    },
  ]);
  const [repeatSingleAcrossSheet, setRepeatSingleAcrossSheet] = useState<boolean>(false);
  const [isGeneratingSheetPdf, setIsGeneratingSheetPdf] = useState<boolean>(false);

  // Bulk Engine State
  const [bulkMode, setBulkMode] = useState<"csv" | "sequential">("sequential");
  const [csvRawText, setCsvRawText] = useState<string>(
    "barcode,title,subtitle,price\nPROD-1001,Organic Green Tea,100g Box,₹299\nPROD-1002,Roasted Coffee Beans,250g Pouch,₹450\nPROD-1003,Raw Honey Jar,500g Glass,₹380"
  );
  const [seqPrefix, setSeqPrefix] = useState<string>("SUN-INV-");
  const [seqStart, setSeqStart] = useState<number>(1001);
  const [seqEnd, setSeqEnd] = useState<number>(1025);
  const [seqPad, setSeqPad] = useState<number>(4);
  const [seqSuffix, setSeqSuffix] = useState<string>("");
  const [seqSymbology, setSeqSymbology] = useState<SymbologyType>("code128");
  const [isGeneratingBulkZip, setIsGeneratingBulkZip] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Helper to record history
  const recordHistory = useCallback(
    (actionName: string, detail: string) => {
      if (onAddHistory) {
        onAddHistory({
          id: `hist-bc-${Date.now()}`,
          toolId: "barcode-studio",
          toolName: "Barcode Studio",
          timestamp: Date.now(),
          fileName: detail,
          status: "completed",
        });
      }
    },
    [onAddHistory]
  );

  // Auto-process initial files passed from homepage dropzone
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const file = initialFiles[0];
      handleProcessDocumentFile(file);
    }
  }, [initialFiles]);

  const handleProcessDocumentFile = async (file: File) => {
    setIsExtracting(true);
    setActiveTab("extract");
    try {
      const result = await extractBarcodesFromDocument(file);
      setExtractedDoc(result);
      if (result.candidates.length > 0) {
        showToast(`Extracted ${result.candidates.length} barcode payloads from ${file.name}`);
      } else {
        showToast(`Parsed ${file.name}. No barcode patterns auto-detected.`);
      }
    } catch (err: any) {
      showToast(`Error extracting document: ${err?.message || err}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Dropzone for Document Upload
  const onDropDocuments = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleProcessDocumentFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropDocuments,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
      "text/plain": [".txt"],
      "application/json": [".json"],
      "application/xml": [".xml"],
      "text/xml": [".xml"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"],
    },
    multiple: false,
  });

  // Auto-render single barcode on option changes
  useEffect(() => {
    let isCancelled = false;

    async function updateBarcode() {
      setIsRendering(true);
      setRenderError(null);

      try {
        const result = await renderBarcode({
          symbology,
          text: inputText,
          scale,
          height: barHeight,
          foregroundColor,
          backgroundColor,
          includeText,
          quietZone,
          rotate: rotation,
        });

        if (!isCancelled) {
          setRendered(result);
          setIsRendering(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setRenderError(err?.message || "Failed to render barcode.");
          setIsRendering(false);
        }
      }
    }

    const timer = setTimeout(updateBarcode, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    symbology,
    inputText,
    scale,
    barHeight,
    foregroundColor,
    backgroundColor,
    includeText,
    quietZone,
    rotation,
  ]);

  // Validation status of current input
  const validation = validateBarcodeInput(symbology, inputText);

  // Apply suggested check digit / fix
  const handleApplyFix = () => {
    if (validation.suggestedFix) {
      setInputText(validation.suggestedFix);
      showToast("Applied check digit auto-fix.");
    }
  };

  // Preset Selection
  const handleApplyPreset = (preset: BusinessPreset) => {
    setSymbology(preset.symbology);
    setInputText(preset.samplePayload);
    if (preset.defaultOptions.scale) setScale(preset.defaultOptions.scale);
    if (preset.defaultOptions.height) setBarHeight(preset.defaultOptions.height);
    if (preset.defaultOptions.includeText !== undefined) setIncludeText(preset.defaultOptions.includeText);
    if (preset.defaultOptions.foregroundColor) setForegroundColor(preset.defaultOptions.foregroundColor);
    if (preset.defaultOptions.backgroundColor) setBackgroundColor(preset.defaultOptions.backgroundColor);
    setActiveTab("single");
    showToast(`Loaded ${preset.title} preset.`);
  };

  // Use Extracted Candidate in Single Generator
  const handleUseCandidateInSingle = (cand: ExtractedBarcodeCandidate) => {
    setSymbology(cand.symbologySuggestion);
    setInputText(cand.value);
    if (cand.title) setTitle(cand.title);
    if (cand.price) setPrice(cand.price);
    setActiveTab("single");
    showToast(`Loaded "${cand.value}" into Single Generator.`);
  };

  // Add Candidate to Label Sheet
  const handleAddCandidateToSheet = (cand: ExtractedBarcodeCandidate) => {
    const newItem: LabelItemData = {
      id: `label-cand-${Date.now()}`,
      barcodeValue: cand.value,
      symbology: cand.symbologySuggestion,
      title: cand.title || undefined,
      price: cand.price || undefined,
      subtitle: cand.subtitle || undefined,
      quantity: cand.quantity || 1,
    };
    setSheetItems((prev) => [...prev, newItem]);
    showToast(`Added "${cand.value}" to Sheet Labels.`);
  };

  // Copy SVG to clipboard
  const handleCopySvg = async () => {
    if (!rendered?.svg) return;
    try {
      await navigator.clipboard.writeText(rendered.svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Copied SVG markup to clipboard.");
    } catch {
      // Fallback
    }
  };

  // Single Barcode Exports
  const handleExportPng = () => {
    if (!rendered) return;
    exportPngFile(rendered, inputText);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    recordHistory("export_png", `barcode_${inputText}.png`);
    showToast("Downloaded PNG image.");
  };

  const handleExportSvg = () => {
    if (!rendered) return;
    exportSvgFile(rendered, inputText);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    recordHistory("export_svg", `barcode_${inputText}.svg`);
    showToast("Downloaded SVG vector.");
  };

  const handleExportJpg = async () => {
    if (!rendered) return;
    await exportJpgFile(rendered, inputText);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    recordHistory("export_jpg", `barcode_${inputText}.jpg`);
    showToast("Downloaded JPEG image.");
  };

  const handleExportPdf = () => {
    if (!rendered) return;
    exportSingleBarcodePdf(rendered, inputText, title, price);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    recordHistory("export_pdf", `barcode_${inputText}.pdf`);
    showToast("Downloaded vector PDF.");
  };

  // Native Browser Print Barcode
  const handlePrintSingle = () => {
    if (!rendered?.dataUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - PDFSun</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; }
            .card { text-align: center; border: 1px dashed #ccc; padding: 20px; border-radius: 8px; }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #111; }
            img { max-width: 100%; height: auto; }
            .price { font-size: 13px; font-weight: 600; color: #444; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            ${title ? `<div class="title">${title}</div>` : ""}
            <img src="${rendered.dataUrl}" alt="Barcode ${inputText}" />
            ${price ? `<div class="price">${price}</div>` : ""}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    recordHistory("print_single", `print_${inputText}`);
  };

  // Download Sheet PDF
  const handleDownloadSheet = async () => {
    const template =
      STANDARD_LABEL_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      STANDARD_LABEL_TEMPLATES[0];
    setIsGeneratingSheetPdf(true);

    try {
      let itemsToPrint = sheetItems;
      if (repeatSingleAcrossSheet) {
        itemsToPrint = [
          {
            id: "single-print",
            barcodeValue: inputText,
            symbology,
            title: title || undefined,
            price: price || undefined,
            quantity: template.labelsPerRow * template.labelsPerColumn,
          },
        ];
      }

      const pdfBytes = await generatePrintReadyLabelPdf({
        template,
        items: itemsToPrint,
        showBorder: true,
        showCutMarks: true,
      });

      const blob = new Blob([toStrictUint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pdfsun_labels_${template.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
      recordHistory("download_labels_pdf", `pdfsun_labels_${template.id}.pdf`);
      showToast(`Generated print-ready label PDF (${template.name}).`);
    } catch (err: any) {
      showToast("Error generating label sheet: " + (err?.message || err));
    } finally {
      setIsGeneratingSheetPdf(false);
    }
  };

  // Download Bulk ZIP
  const handleDownloadBulkZip = async () => {
    setIsGeneratingBulkZip(true);
    setBulkProgress(null);

    try {
      let items: LabelItemData[] = [];
      if (bulkMode === "sequential") {
        items = generateSequentialItems({
          prefix: seqPrefix,
          startNumber: seqStart,
          endNumber: seqEnd,
          padLength: seqPad,
          suffix: seqSuffix,
          symbology: seqSymbology,
        });
      } else {
        items = parseCsvData(csvRawText, symbology);
      }

      if (items.length === 0) {
        showToast("No items found to generate. Please check your inputs.");
        setIsGeneratingBulkZip(false);
        return;
      }

      const zipBytes = await createBulkBarcodeZip(items, "svg", (curr, total) => {
        setBulkProgress({ current: curr, total });
      });

      const blob = new Blob([toStrictUint8Array(zipBytes)], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pdfsun_batch_barcodes_${items.length}_items.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      confetti({ particleCount: 50, spread: 80, origin: { y: 0.8 } });
      recordHistory("download_bulk_zip", `pdfsun_batch_barcodes_${items.length}_items.zip`);
      showToast(`Batch generated ${items.length} barcodes into ZIP archive.`);
    } catch (err: any) {
      showToast("Error creating batch archive: " + (err?.message || err));
    } finally {
      setIsGeneratingBulkZip(false);
      setBulkProgress(null);
    }
  };

  // File Upload for Bulk Excel / CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
      reader.onload = (evt) => {
        const text = (evt.target?.result as string) || "";
        setCsvRawText(text);
        setBulkMode("csv");
        showToast(`Imported ${file.name} into CSV mode.`);
      };
      reader.readAsText(file);
    } else {
      reader.onload = (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = parseExcelData(buffer, symbology);
        if (parsed.length > 0) {
          setSheetItems(parsed);
          setActiveTab("sheet");
          showToast(`Imported ${parsed.length} items from Excel into Sheet Designer.`);
        } else {
          showToast("Could not find barcode columns in Excel. Expected 'barcode' or 'sku' header.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleClose = onClose || onBackToHome;
  const currentMeta = SYMBOLOGY_CATALOG[symbology] || SYMBOLOGY_CATALOG.code128;

  // Filter extracted candidates
  const filteredCandidates = (extractedDoc?.candidates || []).filter((c) => {
    if (!candidateFilter.trim()) return true;
    const q = candidateFilter.toLowerCase();
    return (
      c.value.toLowerCase().includes(q) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      c.sourceContext.toLowerCase().includes(q) ||
      c.symbologySuggestion.toLowerCase().includes(q)
    );
  });

  return (
    <div className="main-tool-card w-full max-w-6xl mx-auto bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-[20px] shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-4 transition-all">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Standard PDFSun Tool Header */}
      <header className="tool-card-header flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Barcode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Barcode Studio</h2>
              <span className="pill-badge-orange px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                1D & 2D Matrix
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate 21+ industrial barcodes, Avery sheets, bulk CSV/Excel automation & document data extraction
            </p>
          </div>
        </div>

        {handleClose && (
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close workspace"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Studio Body */}
      <div className="p-4 sm:p-6 md:p-8 bg-white dark:bg-slate-900">
        {/* Explicit UI Trust Badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs text-center">
          <span>🔒 100% Local Processing: Your files, barcodes, and business data never leave your device. Zero Server Uploads.</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-6 overflow-x-auto">
          {[
            { id: "single", label: "Single Studio", icon: Barcode },
            { id: "extract", label: "Upload & Extract", icon: UploadCloud },
            { id: "sheet", label: "Sheet & Labels", icon: Printer },
            { id: "bulk", label: "Bulk Automation", icon: FileSpreadsheet },
            { id: "presets", label: "Preset Library", icon: Sparkles },
            { id: "guide", label: "Standards & Guide", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`flex items-center space-x-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SINGLE GENERATOR */}
        {/* ========================================================================= */}
        {activeTab === "single" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Configuration Controls (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Symbology Selector */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  1. Barcode Symbology
                </label>
                <select
                  value={symbology}
                  onChange={(e) => {
                    const nextSym = e.target.value as SymbologyType;
                    setSymbology(nextSym);
                    setInputText(SYMBOLOGY_CATALOG[nextSym].sampleData);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <optgroup label="1D Linear Standards" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    <option value="code128">Code 128 (Auto / GS1 / High-Density)</option>
                    <option value="ean13">EAN-13 (Global Retail / GTIN-13)</option>
                    <option value="upca">UPC-A (North American Retail / GTIN-12)</option>
                    <option value="code39">Code 39 (Automotive / Defense)</option>
                    <option value="code93">Code 93 (Compact High-Security)</option>
                    <option value="ean8">EAN-8 (Small Package Retail)</option>
                    <option value="upce">UPC-E (Zero-Suppressed)</option>
                    <option value="itf14">ITF-14 (Master Shipping Carton)</option>
                    <option value="interleaved2of5">Interleaved 2 of 5 (Numeric)</option>
                    <option value="codabar">Codabar / NW-7 (Blood Bank & Library)</option>
                    <option value="msi">MSI Plessey (Warehouse Shelving)</option>
                    <option value="pharmacode">Pharmacode (Pharmaceutical Binary)</option>
                    <option value="gs1-128">GS1-128 (Application Identifiers)</option>
                    <option value="databar">GS1 DataBar Omnidirectional</option>
                  </optgroup>
                  <optgroup label="2D Matrix Symbologies" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    <option value="qrcode">QR Code (Model 2 / High Capacity)</option>
                    <option value="datamatrix">Data Matrix (ECC 200 / Direct Part Marking)</option>
                    <option value="pdf417">PDF417 (Stacked 2D / Boarding Passes)</option>
                    <option value="aztec">Aztec Code (Bulls-Eye / Transit Tickets)</option>
                  </optgroup>
                  <optgroup label="Business Presets" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    <option value="isbn">ISBN-13 (Book Publishing Standard)</option>
                    <option value="issn">ISSN (Periodicals & Magazines)</option>
                    <option value="amazon-fnsku">Amazon FBA (FNSKU Barcode)</option>
                  </optgroup>
                </select>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentMeta.standard}:</span>{" "}
                  {currentMeta.description}
                </p>
              </div>

              {/* Data Input & Validation */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    2. Data Payload
                  </label>
                  <button
                    type="button"
                    onClick={() => setInputText(currentMeta.sampleData)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Sample Data</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={symbology === "qrcode" ? 3 : 2}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Enter data for ${currentMeta.name}...`}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Optional Title & Price (For retail/product labels) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                      Label Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Green Tea"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                      Price / SKU (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹299 or SKU-101"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Validation Banner */}
                {!validation.isValid && validation.errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{validation.errorMessage}</p>
                        {validation.suggestedFix && (
                          <p className="text-[11px] text-rose-600 mt-1">
                            Suggestion: {validation.suggestedFix}
                          </p>
                        )}
                      </div>
                    </div>
                    {validation.autoFixAvailable && (
                      <button
                        type="button"
                        onClick={handleApplyFix}
                        className="ml-3 shrink-0 px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition cursor-pointer"
                      >
                        Auto-Fix
                      </button>
                    )}
                  </div>
                )}

                {validation.isValid && validation.warningMessage && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{validation.warningMessage}</span>
                  </div>
                )}
              </div>

              {/* Visual Customization */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  3. Appearance & Sizing
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                      Scale ({scale}x)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={scale}
                      onChange={(e) => setScale(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {!currentMeta.is2D && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                        Bar Height ({barHeight}mm)
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={40}
                        step={2}
                        value={barHeight}
                        onChange={(e) => setBarHeight(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                      Bar Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{foregroundColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{backgroundColor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeText}
                      onChange={(e) => setIncludeText(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Show Human-Readable Text</span>
                  </label>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Rotation:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const rotations: Array<"N" | "R" | "I" | "L"> = ["N", "R", "I", "L"];
                        const next = rotations[(rotations.indexOf(rotation) + 1) % 4];
                        setRotation(next);
                      }}
                      className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>{rotation === "N" ? "0°" : rotation === "R" ? "90°" : rotation === "I" ? "180°" : "270°"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Barcode Preview & Export Center (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col items-center justify-center min-h-[360px] relative">
                {isRendering && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
                    <div className="flex items-center space-x-2 text-amber-600 font-medium text-sm">
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Rendering Barcode Engine...</span>
                    </div>
                  </div>
                )}

                {renderError ? (
                  <div className="p-6 text-center max-w-md space-y-2">
                    <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Symbology Rendering Error</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">{renderError}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Check that your input text conforms to {currentMeta.name} formatting requirements.
                    </p>
                  </div>
                ) : rendered ? (
                  <div className="flex flex-col items-center space-y-3 p-4">
                    {title && <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</span>}
                    <div
                      dangerouslySetInnerHTML={{ __html: rendered.svg }}
                      className="max-w-full overflow-hidden flex items-center justify-center shadow-xs p-3 bg-white rounded-xl border border-slate-200"
                    />
                    {price && <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{price}</span>}
                  </div>
                ) : null}
              </div>

              {/* Action Toolbar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={!rendered}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSvg}
                  disabled={!rendered}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={!rendered}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSingle}
                  disabled={!rendered}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Barcode</span>
                </button>
              </div>

              {/* Secondary utility actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={handleCopySvg}
                  disabled={!rendered}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied SVG" : "Copy SVG Code"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJpg}
                  disabled={!rendered}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JPG</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newItem: LabelItemData = {
                      id: `label-${Date.now()}`,
                      barcodeValue: inputText,
                      symbology,
                      title: title || undefined,
                      price: price || undefined,
                      quantity: 1,
                    };
                    setSheetItems((prev) => [...prev, newItem]);
                    setActiveTab("sheet");
                    showToast("Added barcode to Label Sheet Designer.");
                  }}
                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Send to Label Sheet</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: UPLOAD FILES & DOCUMENTS (NEW FEATURE) */}
        {/* ========================================================================= */}
        {activeTab === "extract" && (
          <div className="space-y-6">
            {/* Dropzone Header */}
            <div
              {...getRootProps()}
              className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
                isDragActive
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 scale-[0.99]"
                  : "border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/40 dark:hover:bg-amber-950/20"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-200 dark:border-amber-800 shadow-2xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Drop PDF, Word, Excel, CSV, TXT, JSON, XML, or Image file here
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-3">
                Client-side parsing extracts all candidate barcode values, SKUs, product codes, or scans embedded QR codes from image photos.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">PDF Document</span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">DOCX Word</span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">XLSX / CSV</span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">JSON / XML</span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">PNG / JPG Photos</span>
              </div>
            </div>

            {isExtracting && (
              <div className="p-8 text-center text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Extracting document byte streams and scanning tokens...</span>
              </div>
            )}

            {extractedDoc && (
              <div className="space-y-4">
                {/* Extraction Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                      <FileSearch className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{extractedDoc.fileName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {(extractedDoc.fileSize / 1024).toFixed(1)} KB • {extractedDoc.candidates.length} Candidate Barcodes Detected
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {extractedDoc.candidates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const bulkItems: LabelItemData[] = extractedDoc.candidates.map((c, i) => ({
                            id: `cand-bulk-${i}`,
                            barcodeValue: c.value,
                            symbology: c.symbologySuggestion,
                            title: c.title,
                            price: c.price,
                            quantity: 1,
                          }));
                          setSheetItems(bulkItems);
                          setActiveTab("sheet");
                          showToast(`Imported ${bulkItems.length} extracted barcodes into Sheet Designer.`);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Send All to Label Sheet</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Candidate Search / Filter */}
                {extractedDoc.candidates.length > 0 && (
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Search detected codes, SKU, context..."
                      value={candidateFilter}
                      onChange={(e) => setCandidateFilter(e.target.value)}
                      className="w-72 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Showing {filteredCandidates.length} of {extractedDoc.candidates.length} items
                    </span>
                  </div>
                )}

                {/* Candidates List Table */}
                {filteredCandidates.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Detected Value / Payload</th>
                          <th className="p-3">Suggested Format</th>
                          <th className="p-3">Source Context</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredCandidates.map((cand) => (
                          <tr key={cand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                            <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-100">
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-amber-800 dark:text-amber-300">
                                {cand.value}
                              </span>
                              {cand.title && <span className="ml-2 font-sans font-normal text-slate-500 dark:text-slate-400">({cand.title})</span>}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                                {cand.symbologySuggestion}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">{cand.sourceContext}</td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleUseCandidateInSingle(cand)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                Use in Studio
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddCandidateToSheet(cand)}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-medium transition cursor-pointer border border-slate-200 dark:border-slate-700"
                              >
                                + Add to Sheet
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No candidates matched your search filter.
                  </div>
                )}

                {/* Raw Text Preview */}
                {extractedDoc.rawTextPreview && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Document Text Extraction Preview
                    </span>
                    <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {extractedDoc.rawTextPreview}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SHEET IMPOSITION & LABELS */}
        {/* ========================================================================= */}
        {activeTab === "sheet" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Adhesive Label Stock Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <optgroup label="US Letter Formats (8.5 x 11 in)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    <option value="avery-5160">Avery® 5160 (30 labels/sheet - 2.625 x 1 in)</option>
                    <option value="avery-5163">Avery® 5163 (10 shipping labels - 4 x 2 in)</option>
                  </optgroup>
                  <optgroup label="European A4 Formats (210 x 297 mm)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    <option value="avery-l7160">Avery® L7160 (21 labels/sheet - 63.5 x 38.1 mm)</option>
                    <option value="avery-l7163">Avery® L7163 (14 parcel labels - 99.1 x 38.1 mm)</option>
                  </optgroup>
                  <optgroup label="Direct Thermal Roll Formats" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    <option value="thermal-4x6">Zebra / Rollo 4x6" Shipping Label (101.6 x 152.4 mm)</option>
                    <option value="dymo-30334">DYMO® 30334 Multi-Purpose (57 x 32 mm)</option>
                    <option value="jewelry-barbell">Jewelry Barbell Tag (56 x 13 mm)</option>
                  </optgroup>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repeatSingleAcrossSheet}
                    onChange={(e) => setRepeatSingleAcrossSheet(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Repeat Single Barcode Across Entire Sheet</span>
                </label>

                <button
                  type="button"
                  onClick={handleDownloadSheet}
                  disabled={isGeneratingSheetPdf}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingSheetPdf ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Generate Print-Ready PDF</span>
                </button>
              </div>
            </div>

            {/* Sheet Items Table (when not repeating single) */}
            {!repeatSingleAcrossSheet && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Items on Sheet ({sheetItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} Total Labels)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: LabelItemData = {
                        id: `item-${Date.now()}`,
                        barcodeValue: "8901030" + Math.floor(100000 + Math.random() * 900000),
                        symbology: "ean13",
                        title: "New Retail Product",
                        price: "₹99",
                        quantity: 1,
                      };
                      setSheetItems((prev) => [...prev, newItem]);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Barcode Payload</th>
                        <th className="p-3">Symbology</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sheetItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-100">
                            <input
                              type="text"
                              value={item.barcodeValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSheetItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, barcodeValue: val } : it))
                                );
                              }}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-900 dark:text-slate-100"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              value={item.symbology}
                              onChange={(e) => {
                                const sym = e.target.value as SymbologyType;
                                setSheetItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, symbology: sym } : it))
                                );
                              }}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 text-xs"
                            >
                              <option value="code128">Code 128</option>
                              <option value="ean13">EAN-13</option>
                              <option value="upca">UPC-A</option>
                              <option value="qrcode">QR Code</option>
                              <option value="datamatrix">Data Matrix</option>
                              <option value="itf14">ITF-14</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.title || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSheetItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, title: val } : it))
                                );
                              }}
                              placeholder="Product Title"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.price || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSheetItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, price: val } : it))
                                );
                              }}
                              placeholder="Price"
                              className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={item.quantity || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setSheetItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                                );
                              }}
                              className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSheetItems((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: BULK AUTOMATION */}
        {/* ========================================================================= */}
        {activeTab === "bulk" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Batch Generation Mode
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setBulkMode("sequential")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      bulkMode === "sequential"
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    Sequential Generator
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode("csv")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      bulkMode === "csv"
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    CSV / Excel Ingestion
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition flex items-center space-x-1.5 shadow-2xs">
                  <UploadCloud className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Upload CSV / Excel</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadBulkZip}
                  disabled={isGeneratingBulkZip}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingBulkZip ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  <span>
                    {isGeneratingBulkZip
                      ? bulkProgress
                        ? `Packing ${bulkProgress.current}/${bulkProgress.total}...`
                        : "Processing..."
                      : "Generate Batch ZIP"}
                  </span>
                </button>
              </div>
            </div>

            {bulkMode === "sequential" ? (
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Prefix</label>
                  <input
                    type="text"
                    value={seqPrefix}
                    onChange={(e) => setSeqPrefix(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Start Number</label>
                  <input
                    type="number"
                    value={seqStart}
                    onChange={(e) => setSeqStart(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">End Number</label>
                  <input
                    type="number"
                    value={seqEnd}
                    onChange={(e) => setSeqEnd(parseInt(e.target.value, 10) || 100)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Zero-Padding</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={seqPad}
                    onChange={(e) => setSeqPad(parseInt(e.target.value, 10) || 4)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                  Paste CSV Data (Columns: barcode, title, subtitle, price)
                </label>
                <textarea
                  rows={6}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PRESET LIBRARY */}
        {/* ========================================================================= */}
        {activeTab === "presets" && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Industry-Specific Barcode Presets</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Click any preset to load official symbologies, sample payloads, and standards-compliant dimensions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {BUSINESS_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        {preset.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{preset.symbology}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{preset.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{preset.description}</p>
                    <div className="mt-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-200">
                      {preset.samplePayload}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="mt-4 w-full py-2 bg-slate-900 dark:bg-amber-500 hover:bg-black dark:hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Load Preset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: STANDARDS & GUIDE */}
        {/* ========================================================================= */}
        {activeTab === "guide" && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Barcode Standards, Check Digits & Quiet Zones
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-slate-700 dark:text-slate-200 space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">1. The GS1 Modulo-10 Check Digit Formula</h4>
              <p>
                EAN-13, EAN-8, UPC-A, and ITF-14 all calculate their mandatory check digit using the GS1 Modulo-10 algorithm. Starting from the rightmost digit before the checksum, digits are alternately multiplied by 3 and 1. The sum is subtracted from the nearest higher multiple of 10. PDFSun automates this calculation in real-time.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 space-y-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">2. Quiet Zone Requirements</h4>
              <p>
                A barcode scanner requires blank margins (quiet zones) before the first bar and after the final bar. For EAN-13, a minimum quiet zone of 10 modules (approx 3.63mm) is required. For 2D Data Matrix, a 1-module border is sufficient. Never place text or graphics inside the quiet zone.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 space-y-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">3. Optical Contrast & Color Rules</h4>
              <p>
                Most barcode scanners use red laser light (630nm–670nm). Because red light reflects off red surfaces, NEVER print barcode bars in red, yellow, or light brown. Always maintain strong optical contrast: black bars on pure white background is the global gold standard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
