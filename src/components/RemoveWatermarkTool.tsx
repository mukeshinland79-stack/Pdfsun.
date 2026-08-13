import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import {
  Wand2,
  Pipette,
  Square,
  Sparkles,
  UploadCloud,
  FileText,
  Download,
  X,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Share2,
  Trash2,
  QrCode,
  ArrowRight,
  Sliders,
  Eye,
  Check,
  AlertCircle,
  RefreshCw,
  Info,
  SlidersHorizontal,
  Layers,
  ArrowLeft,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  removeWatermarkFromPdf,
  RemoveWatermarkOptions,
  hexToRgb,
} from "../lib/pdfEngine";
import { ToolHistoryItem } from "../types";
import { QuickShareModal } from "./QuickShareModal";
import { triggerErrorToast } from "./GlobalErrorToast";

if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

interface RemoveWatermarkToolProps {
  initialFile?: File | null;
  onClose?: () => void;
  onAddHistory?: (item: ToolHistoryItem) => void;
}

export const RemoveWatermarkTool: React.FC<RemoveWatermarkToolProps> = ({
  initialFile = null,
  onClose,
  onAddHistory,
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.2);

  // Active Removal Method ("auto" = Vector/Text, "color" = Eyedropper/Pixel, "area" = Bounding Box)
  const [activeMethod, setActiveMethod] = useState<"auto" | "color" | "area">("auto");

  // Method 1 State (Vector / Text Layer Scrubbing)
  const [keywords, setKeywords] = useState<string[]>([
    "DRAFT",
    "CONFIDENTIAL",
    "WATERMARK",
    "SAMPLE",
    "DO NOT COPY",
    "PREVIEW",
    "pdfsun.in",
  ]);
  const [customKeywordInput, setCustomKeywordInput] = useState<string>("");
  const [opacityThreshold, setOpacityThreshold] = useState<number>(0.55);

  // Method 2 State (Color Selector & Eyedropper)
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [selectedColorHex, setSelectedColorHex] = useState<string>("#C8C8C8");
  const [selectedColorRgb, setSelectedColorRgb] = useState<{ r: number; g: number; b: number }>({
    r: 200,
    g: 200,
    b: 200,
  });
  const [colorTolerance, setColorTolerance] = useState<number>(18);
  const [hoverColorInfo, setHoverColorInfo] = useState<{
    r: number;
    g: number;
    b: number;
    hex: string;
    x: number;
    y: number;
  } | null>(null);

  // Method 3 State (Manual Area Selection Bounding Box)
  const [isAreaSelectActive, setIsAreaSelectActive] = useState<boolean>(false);
  const [areaBox, setAreaBox] = useState<{
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  } | null>(null);
  const [isDrawingBox, setIsDrawingBox] = useState<boolean>(false);
  const [boxStartPos, setBoxStartPos] = useState<{ x: number; y: number } | null>(null);
  const [applyAreaToAllPages, setApplyAreaToAllPages] = useState<boolean>(true);

  // Page Target Scope
  const [pageTargetScope, setPageTargetScope] = useState<"all" | "current" | "range">("all");
  const [customPageRange, setCustomPageRange] = useState<string>("1-5");

  // Before vs After Preview Comparison
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [cleanedPreviewDataUrl, setCleanedPreviewDataUrl] = useState<string | null>(null);
  const [compareSliderPos, setCompareSliderPos] = useState<number>(50);
  const [showCompareSlider, setShowCompareSlider] = useState<boolean>(false);

  // Scanned Document Notification
  const [scannedNotice, setScannedNotice] = useState<boolean>(false);

  // Processing & Download State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [downloadReady, setDownloadReady] = useState<{
    data: Uint8Array;
    fileName: string;
  } | null>(null);
  const [showQrCodeModal, setShowQrCodeModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [purgedMessage, setPurgedMessage] = useState<boolean>(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cleanedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Drag & Drop File Loader
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (selected.type.includes("pdf") || selected.name.toLowerCase().endsWith(".pdf")) {
        setFile(selected);
        setCurrentPage(1);
        setDownloadReady(null);
        setCleanedPreviewDataUrl(null);
        setShowCompareSlider(false);
      } else {
        triggerErrorToast("Invalid File Format", "Please select a valid PDF document file (.pdf).");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  // Load PDF Document into memory
  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    const loadPdfDoc = async () => {
      try {
        setIsRenderingPage(true);
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const loadedPdf = await loadingTask.promise;

        if (isMounted) {
          pdfDocRef.current = loadedPdf;
          setPdfPageCount(loadedPdf.numPages);
          setCurrentPage(1);
          setIsRenderingPage(false);
        }
      } catch (err: any) {
        console.error("Error loading PDF document:", err);
        triggerErrorToast("PDF Load Error", "Failed to load PDF file. It may be corrupted or password protected.");
        setIsRenderingPage(false);
      }
    };

    loadPdfDoc();

    return () => {
      isMounted = false;
    };
  }, [file]);

  // Render Current PDF Page onto Canvas
  const renderPdfPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current || pdfPageCount === 0) return;

    try {
      setIsRenderingPage(true);
      const page = await pdfDocRef.current.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoomScale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      setIsRenderingPage(false);
    } catch (err) {
      console.error("Page render error:", err);
      setIsRenderingPage(false);
    }
  }, [currentPage, zoomScale, pdfPageCount]);

  useEffect(() => {
    renderPdfPage();
  }, [renderPdfPage]);

  // Handle Eyedropper Hover & Click Sampling
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const xPx = Math.floor((e.clientX - rect.left) * scaleX);
    const yPx = Math.floor((e.clientY - rect.top) * scaleY);

    if (isEyedropperActive) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx && xPx >= 0 && xPx < canvas.width && yPx >= 0 && yPx < canvas.height) {
        const pixel = ctx.getImageData(xPx, yPx, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

        setHoverColorInfo({
          r,
          g,
          b,
          hex,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }

    // Handle Area Bounding Box Dragging
    if (isAreaSelectActive && isDrawingBox && boxStartPos) {
      const currentXPercent = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const currentYPercent = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

      const xPercent = Math.min(boxStartPos.x, currentXPercent);
      const yPercent = Math.min(boxStartPos.y, currentYPercent);
      const widthPercent = Math.abs(currentXPercent - boxStartPos.x);
      const heightPercent = Math.abs(currentYPercent - boxStartPos.y);

      setAreaBox({
        xPercent: Math.round(xPercent * 10) / 10,
        yPercent: Math.round(yPercent * 10) / 10,
        widthPercent: Math.round(widthPercent * 10) / 10,
        heightPercent: Math.round(heightPercent * 10) / 10,
      });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    if (isEyedropperActive) {
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const xPx = Math.floor((e.clientX - rect.left) * scaleX);
      const yPx = Math.floor((e.clientY - rect.top) * scaleY);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const pixel = ctx.getImageData(xPx, yPx, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

        setSelectedColorRgb({ r, g, b });
        setSelectedColorHex(hex);
        setIsEyedropperActive(false);
        setActiveMethod("color");
        setHoverColorInfo(null);
      }
      return;
    }

    if (isAreaSelectActive) {
      const startXPercent = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const startYPercent = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

      setBoxStartPos({ x: startXPercent, y: startYPercent });
      setIsDrawingBox(true);
      setAreaBox({
        xPercent: Math.round(startXPercent * 10) / 10,
        yPercent: Math.round(startYPercent * 10) / 10,
        widthPercent: 2,
        heightPercent: 2,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawingBox) {
      setIsDrawingBox(false);
    }
  };

  // Add Keyword tag
  const handleAddKeyword = () => {
    if (customKeywordInput.trim()) {
      const cleaned = customKeywordInput.trim().toUpperCase();
      if (!keywords.includes(cleaned)) {
        setKeywords([...keywords, cleaned]);
      }
      setCustomKeywordInput("");
    }
  };

  // Remove Keyword tag
  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  // "Preview Changes" Handler - Renders Instant Cleaned Preview
  const handleGeneratePreview = async () => {
    if (!file || !canvasRef.current) return;

    try {
      setIsPreviewing(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Duplicate current canvas pixel data
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(canvas, 0, 0);
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imgData.data;

      if (activeMethod === "color" || activeMethod === "auto") {
        const maxDist = (colorTolerance / 100) * 441.67;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const dist = Math.sqrt(
            (r - selectedColorRgb.r) ** 2 +
            (g - selectedColorRgb.g) ** 2 +
            (b - selectedColorRgb.b) ** 2
          );

          if (dist <= maxDist) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }
        tempCtx.putImageData(imgData, 0, 0);
      }

      if (areaBox) {
        const maskX = (areaBox.xPercent / 100) * tempCanvas.width;
        const maskY = (areaBox.yPercent / 100) * tempCanvas.height;
        const maskW = (areaBox.widthPercent / 100) * tempCanvas.width;
        const maskH = (areaBox.heightPercent / 100) * tempCanvas.height;

        tempCtx.fillStyle = "#FFFFFF";
        tempCtx.fillRect(maskX, maskY, maskW, maskH);
      }

      setCleanedPreviewDataUrl(tempCanvas.toDataURL("image/png"));
      setShowCompareSlider(true);
      setIsPreviewing(false);
    } catch (err) {
      console.error("Preview generation error:", err);
      setIsPreviewing(false);
      triggerErrorToast("Preview Render Error", "Failed to render watermark preview. Try adjusting options.");
    }
  };

  // "Remove Watermark & Download" Execute Handler
  const handleRemoveWatermarkProcess = async () => {
    if (!file) {
      triggerErrorToast("Missing File", "Please upload a PDF document first.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setStatusMessage("Initializing 3-Tier Watermark Removal Engine...");

      const options: RemoveWatermarkOptions = {
        method: activeMethod,
        keywords,
        opacityThreshold,
        targetColorHex: selectedColorHex,
        targetColorRgb: selectedColorRgb,
        colorTolerance,
        areaBox,
        pageScope: pageTargetScope,
        pageRangeStr: customPageRange,
        currentPageIndex: currentPage - 1,
      };

      setStatusMessage("Scanning document vector layers & color pixels...");
      setProgress(35);

      const cleanedBytes = await removeWatermarkFromPdf(file, options, (p) => {
        setProgress(35 + Math.round((p / 100) * 55));
      });

      setStatusMessage("Finalizing clean PDF output file...");
      setProgress(95);

      const outputFileName = `PDFSun_Clean_${file.name.replace(/\.[^/.]+$/, "")}.pdf`;

      setDownloadReady({
        data: cleanedBytes,
        fileName: outputFileName,
      });

      setIsProcessing(false);
      setProgress(100);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onAddHistory) {
        onAddHistory({
          id: `hist_${Date.now()}`,
          toolId: "remove-watermark",
          toolName: "Remove Watermark",
          fileName: outputFileName,
          timestamp: Date.now(),
          status: "downloaded",
          outputFileName: outputFileName,
        });
      }
    } catch (err: any) {
      console.error("Remove watermark error:", err);
      setIsProcessing(false);
      triggerErrorToast("Watermark Removal Failed", err?.message || "An unexpected error occurred during processing.");
    }
  };

  // Trigger Local Direct Download
  const handleDownload = () => {
    if (!downloadReady) return;
    const blob = new Blob([downloadReady.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadReady.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[85vh]">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition shadow-2xs"
            title="Back to Tools"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Wand2 className="w-5 h-5 text-orange-500" />
                <span>Advanced Watermark Removal Engine</span>
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs">
                3-Tier Scrubbing
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {file ? file.name : "Upload a PDF document to purge watermarks, stamps & logos"}
            </p>
          </div>
        </div>

        {file && (
          <div className="flex items-center space-x-2">
            {/* Page Navigation */}
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {currentPage} of {pdfPageCount || 1}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(pdfPageCount, p + 1))}
                disabled={currentPage === pdfPageCount}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.7, z - 0.2))}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1 font-mono">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setDownloadReady(null);
                setCleanedPreviewDataUrl(null);
                setShowCompareSlider(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition"
            >
              Change File
            </button>
          </div>
        )}
      </div>

      {/* Main Content Workspace */}
      {!file ? (
        /* Empty Upload State */
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          <div
            {...getRootProps()}
            className={`w-full max-w-2xl p-10 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-4 ${
              isDragActive
                ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-500/5"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Drag & Drop PDF file to Remove Watermark
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports digital PDFs, scanned documents, image-layer stamps, and flattened watermarks
              </p>
            </div>
            <div className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md">
              Browse PDF File
            </div>
          </div>
        </div>
      ) : (
        /* Workspace Split Layout: Preview Canvas (Left) + Removal Sidebar (Right) */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Panel: Live Preview Canvas Workspace */}
          <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-950 p-4 relative flex flex-col items-center justify-center overflow-auto min-h-[450px]">
            {/* Top Canvas Toolbar Mode Indicator */}
            <div className="absolute top-3 left-3 z-20 flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold shadow-md flex items-center space-x-1.5 border border-slate-700">
                {isEyedropperActive ? (
                  <>
                    <Pipette className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Eyedropper Mode: Click Watermark Color</span>
                  </>
                ) : isAreaSelectActive ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>Area Selection: Click & Drag Box</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Page Preview</span>
                  </>
                )}
              </span>

              {showCompareSlider && (
                <button
                  type="button"
                  onClick={() => setShowCompareSlider(false)}
                  className="px-2.5 py-1 rounded-xl bg-orange-500 text-white text-[11px] font-bold shadow-md hover:bg-orange-600 transition flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Exit Split Preview</span>
                </button>
              )}
            </div>

            {/* Hover Color Tooltip for Eyedropper */}
            {isEyedropperActive && hoverColorInfo && (
              <div
                className="pointer-events-none fixed z-50 px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-mono font-bold shadow-xl flex items-center space-x-1.5 border border-slate-700 transform -translate-x-1/2 -translate-y-8"
                style={{
                  left: `${hoverColorInfo.x + containerRef.current?.getBoundingClientRect().left!}px`,
                  top: `${hoverColorInfo.y + containerRef.current?.getBoundingClientRect().top!}px`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: hoverColorInfo.hex }}
                />
                <span>{hoverColorInfo.hex}</span>
                <span className="opacity-60">
                  ({hoverColorInfo.r},{hoverColorInfo.g},{hoverColorInfo.b})
                </span>
              </div>
            )}

            {/* Canvas Container Frame */}
            <div
              ref={containerRef}
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white max-w-full my-auto transition-transform"
            >
              <canvas
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseDown={handleCanvasMouseDown}
                onMouseUp={handleCanvasMouseUp}
                className={`block max-w-full h-auto ${
                  isEyedropperActive
                    ? "cursor-crosshair"
                    : isAreaSelectActive
                    ? "cursor-crosshair"
                    : "cursor-default"
                }`}
              />

              {/* Before vs After Split-View Overlay Slider */}
              {showCompareSlider && cleanedPreviewDataUrl && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-orange-500 shadow-2xl"
                  style={{ width: `${compareSliderPos}%` }}
                >
                  <img
                    src={cleanedPreviewDataUrl}
                    alt="Cleaned Preview"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wider">
                    Cleaned Result
                  </div>
                </div>
              )}

              {/* Split Slider Handle Bar */}
              {showCompareSlider && (
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={compareSliderPos}
                  onChange={(e) => setCompareSliderPos(Number(e.target.value))}
                  className="absolute inset-x-0 bottom-4 z-30 w-3/4 mx-auto accent-orange-500 cursor-pointer"
                  title="Drag slider to compare Before vs After"
                />
              )}

              {/* Bounding Box Visual Overlay */}
              {areaBox && (
                <div
                  className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20 rounded pointer-events-none flex items-center justify-center"
                  style={{
                    left: `${areaBox.xPercent}%`,
                    top: `${areaBox.yPercent}%`,
                    width: `${areaBox.widthPercent}%`,
                    height: `${areaBox.heightPercent}%`,
                  }}
                >
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-extrabold shadow">
                    Erase Zone: {areaBox.widthPercent}% x {areaBox.heightPercent}%
                  </span>
                </div>
              )}

              {/* Render Loading Spinner */}
              {isRenderingPage && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center">
                  <RefreshCw className="w-7 h-7 text-orange-500 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Removal Controls Sidebar */}
          <div className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-5">
              {/* 3-Tier Removal Method Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Select Watermark Removal Method
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMethod("auto");
                      setIsEyedropperActive(false);
                      setIsAreaSelectActive(false);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center space-y-1 ${
                      activeMethod === "auto"
                        ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Wand2 className="w-4 h-4" />
                    <span className="text-[11px]">1. Vector Scrub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMethod("color");
                      setIsAreaSelectActive(false);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center space-y-1 ${
                      activeMethod === "color"
                        ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Pipette className="w-4 h-4" />
                    <span className="text-[11px]">2. Color Picker</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMethod("area");
                      setIsEyedropperActive(false);
                      setIsAreaSelectActive(true);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center space-y-1 ${
                      activeMethod === "area"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-[11px]">3. Area Erase</span>
                  </button>
                </div>
              </div>

              {/* METHOD 1 CONTROLS: Vector & Text Layer Scrubbing */}
              {activeMethod === "auto" && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                    <Wand2 className="w-4 h-4 text-orange-500" />
                    <span>Vector & Text Layer Scrubbing (For Digital PDFs)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Strips transparent background streams, draft stamps, and repeated watermark text strings directly from the PDF DOM.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Watermark Keywords to Purge
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-300 text-[10px] font-extrabold flex items-center space-x-1 border border-orange-500/20"
                        >
                          <span>{kw}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className="hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        value={customKeywordInput}
                        onChange={(e) => setCustomKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                        placeholder="Add custom watermark keyword (e.g. COMPANY_NAME)"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-white dark:bg-slate-700 text-xs font-bold hover:bg-slate-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Opacity Scrub Threshold</span>
                      <span className="font-mono">{Math.round(opacityThreshold * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.80"
                      step="0.05"
                      value={opacityThreshold}
                      onChange={(e) => setOpacityThreshold(parseFloat(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* METHOD 2 CONTROLS: Color Tolerance & Luminance Filter */}
              {activeMethod === "color" && (
                <div className="space-y-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                      <Pipette className="w-4 h-4 text-amber-500" />
                      <span>Color Tolerance Filter (For Scanned PDFs)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isEyedropperActive
                          ? "bg-amber-500 text-white shadow-md animate-pulse"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Pipette className="w-3.5 h-3.5" />
                      <span>{isEyedropperActive ? "Click on Canvas..." : "Pick Color from PDF"}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Processes the page canvas pixel-by-pixel, converting matching watermark RGB colors to white.
                  </p>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Selected Color
                      </label>
                      <div className="flex items-center space-x-2 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <input
                          type="color"
                          value={selectedColorHex}
                          onChange={(e) => {
                            setSelectedColorHex(e.target.value);
                            setSelectedColorRgb(hexToRgb(e.target.value));
                          }}
                          className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border-0"
                        />
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                          {selectedColorHex}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Tolerance</span>
                        <span className="font-mono">{colorTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="80"
                        value={colorTolerance}
                        onChange={(e) => setColorTolerance(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 3 CONTROLS: Manual Erase Region Bounding Box */}
              {activeMethod === "area" && (
                <div className="space-y-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                      <Square className="w-4 h-4 text-blue-500" />
                      <span>Manual Area Region Bounding Box</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAreaSelectActive(!isAreaSelectActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isAreaSelectActive
                          ? "bg-blue-600 text-white shadow-md animate-pulse"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>{isAreaSelectActive ? "Drawing Active..." : "Draw Box on PDF"}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Draw a rectangle box over logo stamps or watermark patterns to apply a clean white erase mask.
                  </p>

                  {areaBox ? (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-mono">
                      <span>
                        Box: X {areaBox.xPercent}%, Y {areaBox.yPercent}%, W {areaBox.widthPercent}%, H {areaBox.heightPercent}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setAreaBox(null)}
                        className="text-rose-500 hover:underline text-[11px] font-sans font-bold"
                      >
                        Clear Box
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 text-center text-[11px] text-slate-500">
                      Click "Draw Box on PDF" and drag mouse on the preview canvas to define erase zone.
                    </div>
                  )}
                </div>
              )}

              {/* Target Page Scope */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Target Page Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="pageScope"
                      checked={pageTargetScope === "all"}
                      onChange={() => setPageTargetScope("all")}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span>All Pages</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="pageScope"
                      checked={pageTargetScope === "current"}
                      onChange={() => setPageTargetScope("current")}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span>Current Page #{currentPage}</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      name="pageScope"
                      checked={pageTargetScope === "range"}
                      onChange={() => setPageTargetScope("range")}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span>Custom Range</span>
                  </label>
                </div>

                {pageTargetScope === "range" && (
                  <input
                    type="text"
                    value={customPageRange}
                    onChange={(e) => setCustomPageRange(e.target.value)}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                )}
              </div>
            </div>

            {/* Action Buttons & Results Panel */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{statusMessage}</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={isProcessing || isPreviewing}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
                >
                  <Eye className="w-4 h-4 text-orange-500" />
                  <span>Preview Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveWatermarkProcess}
                  disabled={isProcessing}
                  className="py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-xs font-extrabold shadow-lg hover:shadow-orange-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Remove Watermark & Download</span>
                </button>
              </div>

              {/* Success Result & Download Panel */}
              {downloadReady && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>Watermark Removed Successfully!</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      {(downloadReady.data.byteLength / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Clean PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowQrCodeModal(!showQrCodeModal)}
                      className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                      title="Mobile Transfer QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Mobile QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                      title="Share File Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* QR Code Card */}
                  {showQrCodeModal && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center space-y-1.5 animate-in zoom-in-95">
                      <div className="text-[11px] font-bold text-slate-800">Scan QR Code on Mobile</div>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                          window.location.origin + "/#download=" + downloadReady.fileName
                        )}`}
                        alt="Mobile QR Code"
                        className="w-28 h-28 mx-auto"
                      />
                    </div>
                  )}

                  {/* Instant Security Memory Purge */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setDownloadReady(null);
                        setPurgedMessage(true);
                        setTimeout(() => setPurgedMessage(false), 3000);
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Memory File Now</span>
                    </button>
                  </div>
                </div>
              )}

              {purgedMessage && (
                <div className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  File memory purged for 100% privacy!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Share Modal */}
      {showShareModal && downloadReady && (
        <QuickShareModal
          fileName={downloadReady.fileName}
          onClose={() => setShowShareModal(false)}
          onDownloadDirect={handleDownload}
        />
      )}
    </div>
  );
};
