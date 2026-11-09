import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
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

interface BarcodeStudioWorkspaceProps {
  onBackToHome?: () => void;
}

type StudioTab = "single" | "sheet" | "bulk" | "presets" | "guide";

export const BarcodeStudioWorkspace: React.FC<BarcodeStudioWorkspaceProps> = ({
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
  };

  // Copy SVG to clipboard
  const handleCopySvg = async () => {
    if (!rendered?.svg) return;
    try {
      await navigator.clipboard.writeText(rendered.svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Download Sheet PDF
  const handleDownloadSheet = async () => {
    const template = STANDARD_LABEL_TEMPLATES.find((t) => t.id === selectedTemplateId) || STANDARD_LABEL_TEMPLATES[0];
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

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pdfsun_labels_${template.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      alert("Error generating label sheet: " + (err?.message || err));
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
        alert("No items found to generate. Please check your inputs.");
        setIsGeneratingBulkZip(false);
        return;
      }

      const zipBytes = await createBulkBarcodeZip(items, "svg", (curr, total) => {
        setBulkProgress({ current: curr, total });
      });

      const blob = new Blob([zipBytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pdfsun_batch_barcodes_${items.length}_items.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      alert("Error creating batch archive: " + (err?.message || err));
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
      };
      reader.readAsText(file);
    } else {
      reader.onload = (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = parseExcelData(buffer, symbology);
        if (parsed.length > 0) {
          setSheetItems(parsed);
          setActiveTab("sheet");
        } else {
          alert("Could not find barcode columns in Excel file. Expected 'barcode' or 'sku' header.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const currentMeta = SYMBOLOGY_CATALOG[symbology] || SYMBOLOGY_CATALOG.code128;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Studio Header Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                  PDFSun
                </span>
                <span className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                  Barcode Studio
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Professional 1D/2D Barcode Generator, Avery Sheet Imposition & Bulk Engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Back to PDF Tools
              </button>
            )}
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Client-Side & Free</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto">
          {[
            { id: "single", label: "Single Studio", icon: Barcode },
            { id: "sheet", label: "Sheet Imposition & Labels", icon: Printer },
            { id: "bulk", label: "Bulk Automation", icon: FileSpreadsheet },
            { id: "presets", label: "Preset Library", icon: Sparkles },
            { id: "guide", label: "Standards & Guide", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={`flex items-center space-x-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* TAB 1: SINGLE GENERATOR */}
        {activeTab === "single" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Configuration Controls */}
            <div className="lg:col-span-5 space-y-6">
              {/* Symbology Selector */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <optgroup label="1D Linear Standards">
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
                  <optgroup label="2D Matrix Symbologies">
                    <option value="qrcode">QR Code (Model 2 / High Capacity)</option>
                    <option value="datamatrix">Data Matrix (ECC 200 / Direct Part Marking)</option>
                    <option value="pdf417">PDF417 (Stacked 2D / Boarding Passes)</option>
                    <option value="aztec">Aztec Code (Bulls-Eye / Transit Tickets)</option>
                  </optgroup>
                  <optgroup label="Business Presets">
                    <option value="isbn">ISBN-13 (Book Publishing Standard)</option>
                    <option value="issn">ISSN (Periodicals & Magazines)</option>
                    <option value="amazon-fnsku">Amazon FBA (FNSKU Barcode)</option>
                  </optgroup>
                </select>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {currentMeta.standard}:
                  </span>{" "}
                  {currentMeta.description}
                </p>
              </div>

              {/* Data Input & Validation */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    2. Data Payload
                  </label>
                  <button
                    onClick={() => setInputText(currentMeta.sampleData)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Validation Banner */}
                {!validation.isValid && validation.errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{validation.errorMessage}</p>
                        {validation.suggestedFix && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                            Suggestion: {validation.suggestedFix}
                          </p>
                        )}
                      </div>
                    </div>
                    {validation.autoFixAvailable && (
                      <button
                        onClick={handleApplyFix}
                        className="ml-3 shrink-0 px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                      >
                        Auto-Fix
                      </button>
                    )}
                  </div>
                )}

                {validation.isValid && validation.warningMessage && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{validation.warningMessage}</span>
                  </div>
                )}
              </div>

              {/* Visual Customization */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  3. Appearance & Sizing
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
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
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
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

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                      Foreground Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                      <span className="text-xs font-mono">{foregroundColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                      <span className="text-xs font-mono">{backgroundColor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Include Human-Readable Text
                  </span>
                  <input
                    type="checkbox"
                    checked={includeText}
                    onChange={(e) => setIncludeText(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Rotation ({rotation === "N" ? "0°" : rotation === "R" ? "90°" : rotation === "I" ? "180°" : "270°"})
                  </span>
                  <div className="flex space-x-1">
                    {(["N", "R", "I", "L"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRotation(r)}
                        className={`px-2 py-1 text-xs rounded font-semibold ${
                          rotation === r
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {r === "N" ? "0°" : r === "R" ? "90°" : r === "I" ? "180°" : "270°"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Barcode Preview & Export Center */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
                {/* Badge Indicator */}
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {currentMeta.name}
                  </span>
                  {rendered && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-500 dark:text-slate-400">
                      ~{rendered.widthMm}mm × {rendered.heightMm}mm
                    </span>
                  )}
                </div>

                {/* Quick Actions (Copy / Fit) */}
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <button
                    onClick={handleCopySvg}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title="Copy Vector SVG"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Rendering Canvas */}
                <div className="w-full flex items-center justify-center py-8 px-4">
                  {isRendering && (
                    <div className="flex flex-col items-center justify-center space-y-2 py-12">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-400 font-medium">Synthesizing barcode...</span>
                    </div>
                  )}

                  {!isRendering && renderError && (
                    <div className="text-center max-w-md py-10">
                      <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Cannot Render Barcode
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{renderError}</p>
                    </div>
                  )}

                  {!isRendering && !renderError && rendered && (
                    <div
                      className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200/80 max-w-full overflow-x-auto transition-transform flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: rendered.svg }}
                    />
                  )}
                </div>

                {/* Real-time Status Caption */}
                {rendered && !renderError && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Encoded Value: <span className="font-semibold text-slate-800 dark:text-slate-200">{validation.normalizedText || inputText}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Download / Export Center */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                    <Download className="w-4 h-4 text-amber-500" />
                    <span>Download Center (Zero Watermarks)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Print-Ready 300+ DPI</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    disabled={!rendered}
                    onClick={() => rendered && exportSvgFile(rendered, inputText)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition group"
                  >
                    <FileCode className="w-5 h-5 text-amber-500 group-hover:scale-110 transition mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">SVG Vector</span>
                    <span className="text-[10px] text-slate-400">Infinite Scale</span>
                  </button>

                  <button
                    disabled={!rendered}
                    onClick={() => rendered && exportPngFile(rendered, inputText)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition group"
                  >
                    <Download className="w-5 h-5 text-orange-500 group-hover:scale-110 transition mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">PNG Image</span>
                    <span className="text-[10px] text-slate-400">High-Res Raster</span>
                  </button>

                  <button
                    disabled={!rendered}
                    onClick={() => rendered && exportJpgFile(rendered, inputText)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition group"
                  >
                    <Palette className="w-5 h-5 text-rose-500 group-hover:scale-110 transition mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">JPG File</span>
                    <span className="text-[10px] text-slate-400">White Background</span>
                  </button>

                  <button
                    disabled={!rendered}
                    onClick={() => rendered && exportSingleBarcodePdf(rendered, inputText)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition group"
                  >
                    <FileText className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition mb-1" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Single PDF</span>
                    <span className="text-[10px] text-slate-400">Vector Document</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHEET IMPOSITION & LABELS */}
        {activeTab === "sheet" && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <Printer className="w-5 h-5 text-amber-500" />
                    <span>Avery & Thermal Sheet Imposition Designer</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Generate millimeter-exact printable label sheets for Avery, Zebra Direct Thermal rolls, and Dymo stock.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDownloadSheet}
                    disabled={isGeneratingSheetPdf}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
                  >
                    {isGeneratingSheetPdf ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4" />
                    )}
                    <span>Download Print PDF Sheet</span>
                  </button>
                </div>
              </div>

              {/* Template Stock Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Select Label Sheet Stock
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {STANDARD_LABEL_TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {tpl.name}
                        </span>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block mt-1">
                          {tpl.labelsPerRow * tpl.labelsPerColumn} Labels / Sheet
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {tpl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Print Modes: Repeat Single vs Multi-Item List */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="repeatCheckbox"
                    checked={repeatSingleAcrossSheet}
                    onChange={(e) => setRepeatSingleAcrossSheet(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="repeatCheckbox" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fill whole sheet with Single Studio item:{" "}
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      {inputText} ({symbology})
                    </span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 transition flex items-center space-x-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Import Excel / CSV</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Item Table Editor if not repeating */}
              {!repeatSingleAcrossSheet && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Label Items Queue ({sheetItems.length} items)
                    </span>
                    <button
                      onClick={() =>
                        setSheetItems([
                          ...sheetItems,
                          {
                            id: `item-${Date.now()}`,
                            barcodeValue: "890103099999",
                            symbology: "ean13",
                            title: "New Product",
                            price: "₹99",
                            quantity: 1,
                          },
                        ])
                      }
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                    >
                      + Add Row
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Barcode Data</th>
                          <th className="py-2.5 px-3">Format</th>
                          <th className="py-2.5 px-3">Title Header</th>
                          <th className="py-2.5 px-3">Subtitle / SKU</th>
                          <th className="py-2.5 px-3">Price</th>
                          <th className="py-2.5 px-3">Qty</th>
                          <th className="py-2.5 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sheetItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.barcodeValue}
                                onChange={(e) => {
                                  const updated = [...sheetItems];
                                  updated[idx].barcodeValue = e.target.value;
                                  setSheetItems(updated);
                                }}
                                className="w-full bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none font-mono text-xs"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={item.symbology}
                                onChange={(e) => {
                                  const updated = [...sheetItems];
                                  updated[idx].symbology = e.target.value as SymbologyType;
                                  setSheetItems(updated);
                                }}
                                className="bg-transparent text-xs font-medium focus:outline-none"
                              >
                                <option value="code128">Code 128</option>
                                <option value="ean13">EAN-13</option>
                                <option value="upca">UPC-A</option>
                                <option value="qrcode">QR Code</option>
                                <option value="datamatrix">Data Matrix</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.title || ""}
                                placeholder="Product Title"
                                onChange={(e) => {
                                  const updated = [...sheetItems];
                                  updated[idx].title = e.target.value;
                                  setSheetItems(updated);
                                }}
                                className="w-full bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none text-xs"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.subtitle || ""}
                                placeholder="SKU-..."
                                onChange={(e) => {
                                  const updated = [...sheetItems];
                                  updated[idx].subtitle = e.target.value;
                                  setSheetItems(updated);
                                }}
                                className="w-full bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none text-xs"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.price || ""}
                                placeholder="₹..."
                                onChange={(e) => {
                                  const updated = [...sheetItems];
                                  updated[idx].price = e.target.value;
                                  setSheetItems(updated);
                                }}
                                className="w-16 bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none text-xs font-semibold"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={1}
                                max={500}
                                value={item.quantity || 1}
                                onChange={(e) => {
                                  const updated = [...sheetItems];
                                  updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                                  setSheetItems(updated);
                                }}
                                className="w-12 bg-transparent border-b border-transparent focus:border-amber-500 focus:outline-none text-xs text-center"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={() => setSheetItems(sheetItems.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                              >
                                Delete
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
          </div>
        )}

        {/* TAB 3: BULK AUTOMATION */}
        {activeTab === "bulk" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                  <span>Bulk Barcode Generator & ZIP Packager</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Generate hundreds of vector SVGs or high-res images in seconds via sequential numbering or CSV input.
                </p>
              </div>

              <button
                onClick={handleDownloadBulkZip}
                disabled={isGeneratingBulkZip}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
              >
                {isGeneratingBulkZip ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {bulkProgress
                    ? `Processing ${bulkProgress.current}/${bulkProgress.total}...`
                    : "Download Batch ZIP"}
                </span>
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <button
                onClick={() => setBulkMode("sequential")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  bulkMode === "sequential"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                Sequential Numbering Generator
              </button>
              <button
                onClick={() => setBulkMode("csv")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  bulkMode === "csv"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                CSV / Spreadsheet Upload
              </button>
            </div>

            {bulkMode === "sequential" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={seqPrefix}
                    onChange={(e) => setSeqPrefix(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Start Number
                  </label>
                  <input
                    type="number"
                    value={seqStart}
                    onChange={(e) => setSeqStart(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    End Number
                  </label>
                  <input
                    type="number"
                    value={seqEnd}
                    onChange={(e) => setSeqEnd(parseInt(e.target.value, 10) || 100)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Zero-Padding Length
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={seqPad}
                    onChange={(e) => setSeqPad(parseInt(e.target.value, 10) || 4)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Paste CSV Data (Columns: barcode, title, subtitle, price)
                </label>
                <textarea
                  rows={6}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRESET LIBRARY */}
        {activeTab === "presets" && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Industry-Specific Barcode Presets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Click any preset to load official symbologies, sample payloads, and standards compliant dimensions into the workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BUSINESS_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {preset.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {preset.symbology}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {preset.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {preset.description}
                    </p>
                    <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {preset.samplePayload}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="mt-6 w-full py-2 bg-slate-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
                  >
                    <span>Load Preset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: STANDARDS & GUIDE */}
        {activeTab === "guide" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span>Barcode Standards, Check Digits & Quiet Zones</span>
            </h2>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">
                  1. The GS1 Modulo-10 Check Digit Formula
                </h3>
                <p>
                  EAN-13, EAN-8, UPC-A, and ITF-14 all calculate their mandatory check digit using the GS1 Modulo-10 algorithm. Starting from the rightmost digit before the checksum, digits are alternately multiplied by 3 and 1. The sum is subtracted from the nearest higher multiple of 10. PDFSun automates this calculation in real-time.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                  2. Quiet Zone Requirements
                </h3>
                <p>
                  A barcode scanner requires blank margins (quiet zones) before the first bar and after the final bar. For EAN-13, a minimum quiet zone of 10 modules (approx 3.63mm) is required. For 2D Data Matrix, a 1-module border is sufficient. Never place text or graphics inside the quiet zone.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                  3. Color Contrast & Optical Scannability
                </h3>
                <p>
                  Most barcode scanners use red laser light (630nm–670nm). Because red light reflects off red surfaces, NEVER print barcode bars in red, yellow, or light brown. Always maintain strong optical contrast: black bars on pure white background is the global gold standard.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
