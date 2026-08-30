import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Crop,
  Maximize,
  RotateCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Download,
  X,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Type,
  Pen,
  Square,
  Circle,
  ArrowRight,
  Sun,
  Contrast,
  Droplet,
  Layers,
  FlipHorizontal,
  FlipVertical,
  Check,
  RotateCcw as ResetIcon,
  Image as ImageIcon,
  Palette,
  FileImage,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadFile } from "../lib/pdfEngine";

export interface ImageEditorWorkspaceProps {
  file: File;
  onClose: () => void;
  onSaveComplete?: (outputBytes: Uint8Array, fileName: string) => void;
}

export type ImageToolMode =
  | "adjust"
  | "crop"
  | "resize"
  | "transform"
  | "draw"
  | "text"
  | "shape"
  | "watermark";

export type AspectRatioOption = "free" | "1:1" | "4:3" | "16:9" | "3:2" | "9:16";

export interface ImageFilterSettings {
  brightness: number; // -100 to 100 (0 default)
  contrast: number; // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
  exposure: number; // -100 to 100 (0 default)
  blur: number; // 0 to 20 (0 default)
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
}

const DEFAULT_FILTERS: ImageFilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  blur: 0,
  grayscale: false,
  sepia: false,
  invert: false,
};

export const ImageEditorWorkspace: React.FC<ImageEditorWorkspaceProps> = ({
  file,
  onClose,
  onSaveComplete,
}) => {
  // Source Image
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>("");
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Editor View & Mode
  const [activeTab, setActiveTab] = useState<ImageToolMode>("adjust");
  const [zoom, setZoom] = useState<number>(1);

  // Filters State
  const [filters, setFilters] = useState<ImageFilterSettings>({ ...DEFAULT_FILTERS });

  // Transforms State
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Resize State
  const [resizeWidth, setResizeWidth] = useState<number>(0);
  const [resizeHeight, setResizeHeight] = useState<number>(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);

  // Crop State
  const [cropAspect, setCropAspect] = useState<AspectRatioOption>("free");
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null
  );
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number } | null>(null);

  // Annotations / Draw
  const [drawColor, setDrawColor] = useState<string>("#ef4444");
  const [brushSize, setBrushSize] = useState<number>(4);
  const [drawStrokes, setDrawStrokes] = useState<
    { color: string; width: number; points: { x: number; y: number }[] }[]
  >([]);
  const [activeStroke, setActiveStroke] = useState<{
    color: string;
    width: number;
    points: { x: number; y: number }[];
  } | null>(null);

  // Text Overlay
  const [textOverlays, setTextOverlays] = useState<
    { id: string; text: string; x: number; y: number; size: number; color: string }[]
  >([]);
  const [newTextValue, setNewTextValue] = useState<string>("");

  // Watermark
  const [watermarkText, setWatermarkText] = useState<string>("");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(30);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<"jpeg" | "png" | "webp">("png");
  const [exportQuality, setExportQuality] = useState<number>(92);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initial Image Load
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setCurrentImageSrc(src);
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setResizeWidth(img.naturalWidth);
        setResizeHeight(img.naturalHeight);
        setCropRect({
          x: Math.round(img.naturalWidth * 0.1),
          y: Math.round(img.naturalHeight * 0.1),
          width: Math.round(img.naturalWidth * 0.8),
          height: Math.round(img.naturalHeight * 0.8),
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Redraw Canvas Pipeline (Applies Transforms, Filters, Crops, Drawings, Overlays)
  const redrawCanvas = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetW = resizeWidth || originalImage.naturalWidth;
    const targetH = resizeHeight || originalImage.naturalHeight;

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.save();

    // 1. Transformations: Rotation & Flip
    ctx.translate(targetW / 2, targetH / 2);
    ctx.rotate((rotationAngle * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // 2. CSS Canvas Filter string
    const filterParts: string[] = [];
    if (filters.brightness !== 0) filterParts.push(`brightness(${100 + filters.brightness}%)`);
    if (filters.contrast !== 0) filterParts.push(`contrast(${100 + filters.contrast}%)`);
    if (filters.saturation !== 0) filterParts.push(`saturate(${100 + filters.saturation}%)`);
    if (filters.exposure !== 0) filterParts.push(`brightness(${100 + filters.exposure}%)`);
    if (filters.blur > 0) filterParts.push(`blur(${filters.blur}px)`);
    if (filters.grayscale) filterParts.push("grayscale(100%)");
    if (filters.sepia) filterParts.push("sepia(100%)");
    if (filters.invert) filterParts.push("invert(100%)");

    ctx.filter = filterParts.length > 0 ? filterParts.join(" ") : "none";

    // Draw base image centered
    ctx.drawImage(originalImage, -targetW / 2, -targetH / 2, targetW, targetH);
    ctx.restore();

    // 3. Draw Freehand Strokes
    drawStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });

    // 4. Draw Text Overlays
    textOverlays.forEach((txt) => {
      ctx.save();
      ctx.font = `bold ${txt.size}px sans-serif`;
      ctx.fillStyle = txt.color;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(txt.text, txt.x, txt.y);
      ctx.restore();
    });

    // 5. Draw Watermark
    if (watermarkText.trim()) {
      ctx.save();
      ctx.translate(targetW / 2, targetH / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.font = `bold ${Math.max(24, Math.round(targetW / 18))}px sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${watermarkOpacity / 100})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();
    }
  }, [
    originalImage,
    resizeWidth,
    resizeHeight,
    rotationAngle,
    flipH,
    flipV,
    filters,
    drawStrokes,
    textOverlays,
    watermarkText,
    watermarkOpacity,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Apply Crop Action
  const handleApplyCrop = () => {
    if (!canvasRef.current || !cropRect) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropRect.width;
    croppedCanvas.height = cropRect.height;
    const cCtx = croppedCanvas.getContext("2d");
    if (!cCtx) return;

    cCtx.drawImage(
      canvas,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height
    );

    const croppedDataUrl = croppedCanvas.toDataURL("image/png");
    const newImg = new Image();
    newImg.onload = () => {
      setOriginalImage(newImg);
      setImageDimensions({ width: cropRect.width, height: cropRect.height });
      setResizeWidth(cropRect.width);
      setResizeHeight(cropRect.height);
      setCropRect(null);
      setActiveTab("adjust");
    };
    newImg.src = croppedDataUrl;
  };

  // Reset Everything to Original
  const handleResetToOriginal = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setRotationAngle(0);
    setFlipH(false);
    setFlipV(false);
    setDrawStrokes([]);
    setTextOverlays([]);
    setWatermarkText("");
    if (originalImage) {
      setResizeWidth(originalImage.naturalWidth);
      setResizeHeight(originalImage.naturalHeight);
    }
  };

  // Draw interactions on overlay
  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== "draw" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setActiveStroke({
      color: drawColor,
      width: brushSize,
      points: [{ x, y }],
    });
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeStroke || activeTab !== "draw" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setActiveStroke((prev) => (prev ? { ...prev, points: [...prev.points, { x, y }] } : null));
  };

  const handleOverlayMouseUp = () => {
    if (activeStroke) {
      setDrawStrokes((prev) => [...prev, activeStroke]);
      setActiveStroke(null);
    }
  };

  // Add Text Box
  const handleAddTextOverlay = () => {
    if (!newTextValue.trim()) return;
    const newText = {
      id: `txt-${Date.now()}`,
      text: newTextValue,
      x: Math.round(resizeWidth / 3),
      y: Math.round(resizeHeight / 2),
      size: Math.max(20, Math.round(resizeWidth / 20)),
      color: drawColor,
    };
    setTextOverlays((prev) => [...prev, newText]);
    setNewTextValue("");
  };

  // Export & Download
  const handleSaveAndExportImage = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      const mime =
        exportFormat === "jpeg"
          ? "image/jpeg"
          : exportFormat === "webp"
          ? "image/webp"
          : "image/png";

      const dataUrl = canvasRef.current.toDataURL(mime, exportQuality / 100);
      const byteString = atob(dataUrl.split(",")[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const outName = `${file.name.replace(/\.[^/.]+$/, "")}_edited_pdfsun.${exportFormat}`;
      downloadFile(ia, outName, mime);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      if (onSaveComplete) {
        onSaveComplete(ia, outName);
      }

      setIsExporting(false);
    } catch (err: any) {
      console.error("Image Export Error:", err);
      alert(`Image Export Failed: ${err.message || "An unexpected error occurred."}`);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. Header Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base tracking-tight text-white">
                PDFSun Advanced Image Editor
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                HD STUDIO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {file.name} • {imageDimensions.width} × {imageDimensions.height} px
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToOriginal}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition"
            title="Reset All Adjustments"
          >
            <ResetIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleSaveAndExportImage}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Save & Export</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Top Tool Switcher */}
      <nav aria-label="Image Tools" className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center space-x-2 overflow-x-auto shrink-0">
        {[
          { id: "adjust", label: "Adjust & Filters", icon: Sliders },
          { id: "crop", label: "Crop & Aspect", icon: Crop },
          { id: "resize", label: "Resize", icon: Maximize },
          { id: "transform", label: "Rotate & Flip", icon: RotateCw },
          { id: "draw", label: "Draw & Paint", icon: Pen },
          { id: "text", label: "Add Text", icon: Type },
          { id: "watermark", label: "Watermark", icon: FileImage },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                isActive
                  ? "bg-emerald-500 text-white shadow"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Control Panel for Active Tool */}
        <aside className="w-80 bg-slate-900/95 border-r border-slate-800 p-4 flex flex-col space-y-5 overflow-y-auto shrink-0">
          {/* ADJUST & FILTERS */}
          {activeTab === "adjust" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Color & Tone Adjustments
              </h3>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Brightness</span>
                  <span className="font-mono text-emerald-400">{filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.brightness}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, brightness: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Contrast</span>
                  <span className="font-mono text-emerald-400">{filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.contrast}
                  onChange={(e) => setFilters((f) => ({ ...f, contrast: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Saturation</span>
                  <span className="font-mono text-emerald-400">{filters.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.saturation}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, saturation: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Blur */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Blur</span>
                  <span className="font-mono text-emerald-400">{filters.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.blur}
                  onChange={(e) => setFilters((f) => ({ ...f, blur: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Preset Effect Toggles */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-400">Special Presets</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, grayscale: !f.grayscale }))}
                    className={`py-2 rounded-lg text-xs font-medium border transition ${
                      filters.grayscale
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    B&W
                  </button>
                  <button
                    onClick={() => setFilters((f) => ({ ...f, sepia: !f.sepia }))}
                    className={`py-2 rounded-lg text-xs font-medium border transition ${
                      filters.sepia
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => setFilters((f) => ({ ...f, invert: !f.invert }))}
                    className={`py-2 rounded-lg text-xs font-medium border transition ${
                      filters.invert
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Invert
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CROP & ASPECT */}
          {activeTab === "crop" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Crop & Aspect Ratio
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(["free", "1:1", "4:3", "16:9", "3:2", "9:16"] as AspectRatioOption[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setCropAspect(r)}
                    className={`py-2 rounded-lg text-xs font-medium border transition ${
                      cropAspect === r
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={handleApplyCrop}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-xs text-white rounded-xl shadow transition"
              >
                Apply Crop
              </button>
            </div>
          )}

          {/* RESIZE */}
          {activeTab === "resize" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Resize Dimensions (Pixels)
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Width (px)</label>
                  <input
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setResizeWidth(val);
                      if (maintainAspectRatio && originalImage) {
                        const ratio = originalImage.naturalHeight / originalImage.naturalWidth;
                        setResizeHeight(Math.round(val * ratio));
                      }
                    }}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Height (px)</label>
                  <input
                    type="number"
                    value={resizeHeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setResizeHeight(val);
                      if (maintainAspectRatio && originalImage) {
                        const ratio = originalImage.naturalWidth / originalImage.naturalHeight;
                        setResizeWidth(Math.round(val * ratio));
                      }
                    }}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                  />
                </div>
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Maintain Aspect Ratio</span>
                </label>
              </div>
            </div>
          )}

          {/* ROTATE & FLIP */}
          {activeTab === "transform" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rotate & Orientation
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRotationAngle((a) => (a - 90 + 360) % 360)}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium flex items-center justify-center space-x-2 border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>90° Left</span>
                </button>
                <button
                  onClick={() => setRotationAngle((a) => (a + 90) % 360)}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium flex items-center justify-center space-x-2 border border-slate-700"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>90° Right</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setFlipH((f) => !f)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center space-x-2 border ${
                    flipH
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  onClick={() => setFlipV((f) => !f)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center space-x-2 border ${
                    flipV
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>
          )}

          {/* DRAW & PAINT */}
          {activeTab === "draw" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Brush Color & Size
              </h3>
              <div className="flex items-center space-x-2">
                {["#ef4444", "#f59e0b", "#10b981", "#2563eb", "#8b5cf6", "#ffffff", "#000000"].map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => setDrawColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border ${
                        drawColor === c ? "ring-2 ring-emerald-500 scale-110" : "border-slate-600"
                      }`}
                    />
                  )
                )}
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Brush Size</span>
                  <span className="font-mono text-emerald-400">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* ADD TEXT */}
          {activeTab === "text" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Add Text Layer
              </h3>
              <input
                type="text"
                value={newTextValue}
                onChange={(e) => setNewTextValue(e.target.value)}
                placeholder="Enter text..."
                className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
              />
              <button
                onClick={handleAddTextOverlay}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 font-semibold text-xs text-white rounded-lg transition"
              >
                Insert Text
              </button>
            </div>
          )}

          {/* WATERMARK */}
          {activeTab === "watermark" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Watermark Overlay
              </h3>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g. COPYRIGHT © 2026"
                className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
              />
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Opacity</span>
                  <span className="font-mono text-emerald-400">{watermarkOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* EXPORT SETTINGS (Always at bottom of sidebar) */}
          <div className="mt-auto pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300">Export Settings</h4>
            <div className="grid grid-cols-3 gap-2">
              {(["png", "jpeg", "webp"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`py-1.5 text-xs font-medium rounded border uppercase ${
                    exportFormat === fmt
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Quality</span>
                <span className="font-mono text-emerald-400">{exportQuality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={exportQuality}
                onChange={(e) => setExportQuality(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </aside>

        {/* Center Canvas Viewport */}
        <main className="flex-1 bg-slate-950 flex items-center justify-center p-6 overflow-auto relative">
          <div className="relative shadow-2xl border border-slate-800 rounded bg-slate-900/50 p-2">
            <canvas
              ref={canvasRef}
              onMouseDown={handleOverlayMouseDown}
              onMouseMove={handleOverlayMouseMove}
              onMouseUp={handleOverlayMouseUp}
              className={`max-h-[78vh] max-w-[70vw] object-contain rounded ${
                activeTab === "draw" ? "cursor-crosshair" : "cursor-default"
              }`}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
