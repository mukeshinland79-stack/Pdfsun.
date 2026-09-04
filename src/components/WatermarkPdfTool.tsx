import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import {
  Stamp,
  UploadCloud,
  FileText,
  Download,
  X,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Type,
  RefreshCw,
  Sliders,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Share2,
  Trash2,
  Layers,
  Eye,
  Palette,
  RotateCw,
  Grid,
  Check,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { watermarkPdf, downloadFile, WatermarkOptions } from "../lib/pdfEngine";
import { ToolHistoryItem } from "../types";
import { QuickShareModal } from "./QuickShareModal";
import { ToolSeoThreeSentenceCard } from "./ToolSeoThreeSentenceCard";
import { triggerErrorToast } from "./GlobalErrorToast";

// Configure PDF.js worker
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

interface WatermarkPdfToolProps {
  initialFile?: File | null;
  onClose?: () => void;
  onAddHistory?: (item: ToolHistoryItem) => void;
}

const PRESET_TEXTS = ["CONFIDENTIAL", "DRAFT", "SAMPLE", "DO NOT COPY", "PDFSun", "ORIGINAL", "APPROVED"];
const COLOR_PRESETS = [
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Dark Slate", hex: "#1e293b" },
  { name: "Emerald Green", hex: "#16a34a" },
  { name: "Deep Purple", hex: "#9333ea" },
  { name: "Sunset Orange", hex: "#ea580c" },
  { name: "Pure Black", hex: "#000000" },
];

export const WatermarkPdfTool: React.FC<WatermarkPdfToolProps> = ({
  initialFile = null,
  onClose,
  onAddHistory,
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);

  // Watermark Options
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "TimesRoman" | "Courier">("Helvetica");
  const [fontSize, setFontSize] = useState<number>(42);
  const [textColor, setTextColor] = useState<string>("#dc2626");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.35);
  const [watermarkAngle, setWatermarkAngle] = useState<number>(45);
  const [watermarkPosition, setWatermarkPosition] = useState<
    "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tile"
  >("center");

  // Image Watermark state
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState<number>(0.4);

  // Output / State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [downloadReady, setDownloadReady] = useState<{
    data: Uint8Array;
    fileName: string;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Dropzone for initial PDF
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (selected.type === "application/pdf" || selected.name.endsWith(".pdf")) {
        setFile(selected);
        setDownloadReady(null);
        setCurrentPage(1);
      } else {
        triggerErrorToast("Invalid File Type", "Please select a valid PDF file.");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  // Handle Image Watermark file upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const img = e.target.files[0];
      setWatermarkImageFile(img);
      const url = URL.createObjectURL(img);
      setWatermarkImagePreview(url);
    }
  };

  // Render PDF Page onto canvas
  useEffect(() => {
    let isCancelled = false;

    async function loadAndRenderPdf() {
      if (!file) {
        pdfDocRef.current = null;
        setPdfPageCount(0);
        return;
      }

      try {
        setIsRenderingPage(true);
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        if (isCancelled) return;

        pdfDocRef.current = pdf;
        setPdfPageCount(pdf.numPages);

        const page = await pdf.getPage(currentPage > pdf.numPages ? 1 : currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1.2 });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport,
          canvas,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Error rendering PDF page for preview:", err);
      } finally {
        if (!isCancelled) setIsRenderingPage(false);
      }
    }

    loadAndRenderPdf();

    return () => {
      isCancelled = true;
    };
  }, [file, currentPage]);

  // Execute Watermarking Process
  const handleApplyWatermark = async () => {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage("Loading PDF document...");

    try {
      const options: WatermarkOptions = {
        type: watermarkType,
        text: watermarkText,
        imageFile: watermarkType === "image" ? watermarkImageFile : null,
        opacity: watermarkOpacity,
        fontSize,
        color: textColor,
        fontFamily,
        imageScale,
        angle: watermarkAngle,
        position: watermarkPosition,
      };

      const outputBytes = await watermarkPdf(
        file,
        options,
        watermarkOpacity,
        fontSize,
        (p) => {
          setProgress(10 + Math.round((p / 100) * 85));
          setStatusMessage(`Applying ${watermarkType} watermark (${p}%)...`);
        }
      );

      const outName = `PDFSun_Watermarked_${file.name}`;
      setDownloadReady({ data: outputBytes, fileName: outName });
      setIsProcessing(false);
      setProgress(100);

      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}

      if (onAddHistory) {
        onAddHistory({
          id: Date.now().toString(),
          toolId: "watermark-pdf",
          toolName: "Watermark PDF",
          fileName: file.name,
          timestamp: Date.now(),
          status: "completed",
          outputFileName: outName,
        });
      }
    } catch (err: any) {
      console.error("Watermark generation error:", err);
      setIsProcessing(false);
      triggerErrorToast(
        "Watermarking Failed",
        err.message || "An unexpected error occurred while adding watermark."
      );
    }
  };

  const handleDownload = () => {
    if (!downloadReady) return;
    downloadFile(downloadReady.data, downloadReady.fileName, "application/pdf");
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 transition-all">
      {/* Tool Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Stamp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Watermark PDF Studio</h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Text & Logo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stamp custom text or brand logos with live preview, angle, opacity & layout controls
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Close workspace"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Studio Body */}
      <div className="p-6">
        {!file ? (
          /* File Upload Dropzone */
          <div
            {...getRootProps()}
            className={`p-10 rounded-3xl border-2 border-dashed transition-all text-center cursor-pointer ${
              isDragActive
                ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 scale-[0.99]"
                : "border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/50 dark:bg-slate-800/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              Drop your PDF file here, or browse
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Supports multi-page documents up to 250MB. Processed securely in your browser.
            </p>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition shadow-md"
            >
              Select PDF File
            </button>
          </div>
        ) : (
          /* File Uploaded - Split Workspace (Controls & Live Preview) */
          <div className="space-y-6">
            {/* Top Bar: File Info & Re-upload button */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-md">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {pdfPageCount > 0 ? `${pdfPageCount} pages` : "PDF File"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-orange-500" />
                  <span>Change File</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                        setDownloadReady(null);
                        setCurrentPage(1);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Studio Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Watermark Controls (5 Cols) */}
              <div className="lg:col-span-5 space-y-5 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                {/* Mode Selector */}
                <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-300/50 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setWatermarkType("text")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                      watermarkType === "text"
                        ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Text Watermark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatermarkType("image")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                      watermarkType === "image"
                        ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Image / Logo</span>
                  </button>
                </div>

                {watermarkType === "text" ? (
                  /* Text Watermark Options */
                  <div className="space-y-4">
                    {/* Input string */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Watermark Text</span>
                        <span className="text-[10px] text-slate-400 font-normal">Custom text string</span>
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {PRESET_TEXTS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setWatermarkText(preset)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                              watermarkText === preset
                                ? "bg-amber-500 text-white"
                                : "bg-slate-200/70 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family & Size */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Font Family</label>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                        >
                          <option value="Helvetica">Helvetica Bold</option>
                          <option value="TimesRoman">Times Roman</option>
                          <option value="Courier">Courier Monospace</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                          <span>Font Size</span>
                          <span className="text-amber-600 font-mono">{fontSize}px</span>
                        </label>
                        <input
                          type="range"
                          min="18"
                          max="96"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Text Color Picker */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Color Theme</span>
                        <span className="text-[10px] font-mono text-slate-400">{textColor}</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setTextColor(c.hex)}
                            className={`w-7 h-7 rounded-xl border-2 transition transform hover:scale-110 flex items-center justify-center ${
                              textColor === c.hex
                                ? "border-amber-500 scale-105 shadow-md"
                                : "border-white dark:border-slate-800"
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {textColor === c.hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                          </button>
                        ))}
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0 bg-transparent"
                          title="Custom Hex Color"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Image / Logo Watermark Options */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        Upload Logo Image
                      </label>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageFileChange}
                        className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-600 dark:file:bg-amber-950/40 dark:file:text-amber-400 hover:file:bg-amber-100 cursor-pointer"
                      />
                      {watermarkImageFile && (
                        <div className="flex items-center space-x-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-2">
                          {watermarkImagePreview && (
                            <img
                              src={watermarkImagePreview}
                              alt="Logo watermark preview"
                              className="w-10 h-10 object-contain rounded-lg bg-white p-1 border"
                            />
                          )}
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {watermarkImageFile.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {(watermarkImageFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                        <span>Image Size Scale</span>
                        <span className="text-amber-600 font-mono">{Math.round(imageScale * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={imageScale}
                        onChange={(e) => setImageScale(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Common Watermark Settings: Opacity, Angle, Position */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Opacity slider */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                        <span>Opacity</span>
                        <span className="text-amber-600 font-mono">{Math.round(watermarkOpacity * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.95"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    {/* Rotation Angle */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rotation Angle</label>
                      <select
                        value={watermarkAngle}
                        onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        <option value={45}>45° Diagonal</option>
                        <option value={0}>0° Horizontal</option>
                        <option value={30}>30° Angle</option>
                        <option value={90}>90° Vertical</option>
                        <option value={-45}>-45° Reverse</option>
                      </select>
                    </div>
                  </div>

                  {/* Position selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Watermark Layout Position</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "top-left", label: "Top Left" },
                        { id: "center", label: "Center" },
                        { id: "top-right", label: "Top Right" },
                        { id: "bottom-left", label: "Bottom Left" },
                        { id: "tile", label: "Tile / Repeat" },
                        { id: "bottom-right", label: "Bottom Right" },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setWatermarkPosition(pos.id as any)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition ${
                            watermarkPosition === pos.id
                              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Primary Process Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplyWatermark}
                    disabled={isProcessing || (watermarkType === "image" && !watermarkImageFile)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing ({progress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Stamp className="w-4 h-4" />
                        <span>Apply Watermark & Generate PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Preview & Download (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Page Canvas Container */}
                <div className="relative p-4 rounded-3xl bg-slate-200/70 dark:bg-slate-950 border border-slate-300/80 dark:border-slate-800 flex flex-col items-center justify-center min-h-[460px] overflow-hidden shadow-inner">
                  {/* Status Indicator */}
                  <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold flex items-center space-x-1.5">
                    <Eye className="w-3 h-3 text-amber-400" />
                    <span>Live Page Visual Preview</span>
                  </div>

                  {/* Page Navigation Controls */}
                  {pdfPageCount > 1 && (
                    <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 bg-slate-900/80 backdrop-blur text-white px-2 py-1 rounded-full text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 hover:text-amber-400 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span>
                        {currentPage} / {pdfPageCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(pdfPageCount, p + 1))}
                        disabled={currentPage === pdfPageCount}
                        className="p-1 hover:text-amber-400 disabled:opacity-30"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* PDF Canvas & Dynamic Watermark Overlay */}
                  <div className="relative shadow-2xl rounded-xl overflow-hidden bg-white max-w-full my-auto">
                    <canvas ref={canvasRef} className="max-w-full h-auto block" />

                    {/* CSS / SVG Watermark Overlay Simulation */}
                    <div
                      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                      style={{ opacity: watermarkOpacity }}
                    >
                      {watermarkType === "text" ? (
                        watermarkPosition === "tile" ? (
                          <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-4">
                            {[...Array(9)].map((_, idx) => (
                              <div key={idx} className="flex items-center justify-center">
                                <span
                                  className="font-extrabold whitespace-nowrap select-none"
                                  style={{
                                    color: textColor,
                                    fontSize: `${Math.max(12, fontSize * 0.5)}px`,
                                    transform: `rotate(${watermarkAngle}deg)`,
                                    fontFamily:
                                      fontFamily === "TimesRoman"
                                        ? "Times New Roman, serif"
                                        : fontFamily === "Courier"
                                        ? "Courier, monospace"
                                        : "sans-serif",
                                  }}
                                >
                                  {watermarkText}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            className={`w-full h-full p-6 flex ${
                              watermarkPosition === "top-left"
                                ? "items-start justify-start"
                                : watermarkPosition === "top-right"
                                ? "items-start justify-end"
                                : watermarkPosition === "bottom-left"
                                ? "items-end justify-start"
                                : watermarkPosition === "bottom-right"
                                ? "items-end justify-end"
                                : "items-center justify-center"
                            }`}
                          >
                            <span
                              className="font-extrabold whitespace-nowrap select-none drop-shadow-sm"
                              style={{
                                color: textColor,
                                fontSize: `${fontSize * 0.7}px`,
                                transform: `rotate(${watermarkAngle}deg)`,
                                fontFamily:
                                  fontFamily === "TimesRoman"
                                    ? "Times New Roman, serif"
                                    : fontFamily === "Courier"
                                    ? "Courier, monospace"
                                    : "sans-serif",
                              }}
                            >
                              {watermarkText}
                            </span>
                          </div>
                        )
                      ) : watermarkImagePreview ? (
                        <div
                          className={`w-full h-full p-6 flex ${
                            watermarkPosition === "top-left"
                              ? "items-start justify-start"
                              : watermarkPosition === "top-right"
                              ? "items-start justify-end"
                              : watermarkPosition === "bottom-left"
                              ? "items-end justify-start"
                              : watermarkPosition === "bottom-right"
                              ? "items-end justify-end"
                              : "items-center justify-center"
                          }`}
                        >
                          <img
                            src={watermarkImagePreview}
                            alt="Watermark preview"
                            style={{
                              width: `${imageScale * 70}%`,
                              transform: `rotate(${watermarkAngle}deg)`,
                            }}
                            className="object-contain max-h-full"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isRenderingPage && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Rendering Page...</span>
                    </div>
                  )}
                </div>

                {/* Download Ready Success Box */}
                {downloadReady && (
                  <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-extrabold">Watermark Applied Successfully!</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                        Ready
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Watermarked PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowShareModal(true)}
                        className="py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center space-x-1.5"
                      >
                        <Share2 className="w-4 h-4 text-orange-500" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent 3-Sentence SEO Highlights & WebAssembly Trust Block */}
      <ToolSeoThreeSentenceCard toolId="watermark-pdf" toolName="Watermark PDF" />

      {/* Share Modal */}
      {showShareModal && downloadReady && (
        <QuickShareModal
          fileName={downloadReady.fileName}
          mimeType="application/pdf"
          onClose={() => setShowShareModal(false)}
          onDownloadDirect={handleDownload}
        />
      )}
    </div>
  );
};
