import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import {
  Highlighter,
  Pen,
  StickyNote,
  Type,
  Eraser,
  Undo2,
  Redo2,
  RotateCcw,
  RotateCw,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  MessageSquare,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Palette,
  Layers,
  FileText,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Image as ImageIcon,
  Stamp,
  Copy,
  Hash,
  Eye,
  Lock,
  Scissors,
  Settings,
  HelpCircle,
  MousePointer,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadFile } from "../lib/pdfEngine";

// Set PDF.js worker
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

export type EditorToolMode =
  | "select"
  | "pen"
  | "highlighter"
  | "eraser"
  | "text"
  | "rect"
  | "circle"
  | "line"
  | "arrow"
  | "sticky"
  | "redact"
  | "stamp"
  | "signature";

export interface DrawingStroke {
  id: string;
  tool: "pen" | "highlighter";
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
}

export interface ShapeAnnotation {
  id: string;
  type: "rect" | "circle" | "line" | "arrow" | "redact";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fillColor?: string;
  lineWidth: number;
  opacity: number;
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  fontFamily: "Helvetica" | "Times" | "Courier";
  isBold?: boolean;
  isItalic?: boolean;
  hasBackground?: boolean;
  bgColor?: string;
}

export interface StickyNoteAnnotation {
  id: string;
  x: number;
  y: number;
  author: string;
  text: string;
  color: string;
  timestamp: string;
  isExpanded?: boolean;
}

export interface ImageAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  format: "png" | "jpeg";
  type: "stamp" | "signature" | "image";
}

export interface PageAnnotations {
  strokes: DrawingStroke[];
  shapes: ShapeAnnotation[];
  texts: TextAnnotation[];
  stickyNotes: StickyNoteAnnotation[];
  images: ImageAnnotation[];
  rotationOffset: number; // 0, 90, 180, 270
}

export interface PageMeta {
  pageIndex: number; // original page index in source doc
  pageNumber: number; // current sequential display number
  rotation: number;
  isDeleted?: boolean;
  isCustomBlank?: boolean;
}

interface PDFEditorWorkspaceProps {
  file: File;
  onClose: () => void;
  onSaveComplete?: (outputBytes: Uint8Array, fileName: string) => void;
}

const PRESET_COLORS = [
  { name: "Primary Blue", value: "#2563eb" },
  { name: "Highlight Yellow", value: "#facc15" },
  { name: "Emerald Green", value: "#10b981" },
  { name: "Crimson Red", value: "#ef4444" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Amber Orange", value: "#f59e0b" },
  { name: "Dark Slate", value: "#0f172a" },
  { name: "Pure White", value: "#ffffff" },
];

const STAMP_PRESETS = [
  { label: "APPROVED", color: "#10b981", border: "solid" },
  { label: "CONFIDENTIAL", color: "#ef4444", border: "solid" },
  { label: "DRAFT", color: "#f59e0b", border: "dashed" },
  { label: "FINAL", color: "#2563eb", border: "solid" },
  { label: "VOID", color: "#64748b", border: "solid" },
  { label: "COMPLETED", color: "#059669", border: "solid" },
];

export const PDFEditorWorkspace: React.FC<PDFEditorWorkspaceProps> = ({
  file,
  onClose,
  onSaveComplete,
}) => {
  // Document State
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [pagesMeta, setPagesMeta] = useState<PageMeta[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("Loading PDF document...");

  // Tool & Styling State
  const [activeTool, setActiveTool] = useState<EditorToolMode>("select");
  const [selectedColor, setSelectedColor] = useState<string>("#2563eb");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [highlighterWidth, setHighlighterWidth] = useState<number>(20);
  const [textSize, setTextSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "Times" | "Courier">("Helvetica");
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>("");
  const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(false);

  // Per-page annotations indexed by original pageIndex or unique page identifier
  const [annotations, setAnnotations] = useState<Record<number, PageAnnotations>>({});
  const [historyStack, setHistoryStack] = useState<Record<number, PageAnnotations[]>>({});
  const [redoStack, setRedoStack] = useState<Record<number, PageAnnotations[]>>({});

  // Drawing in progress
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [currentShapePreview, setCurrentShapePreview] = useState<ShapeAnnotation | null>(null);

  // Active text editing
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number } | null>(null);
  const [typedTextValue, setTypedTextValue] = useState<string>("");

  // Signature pad modal state
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [showStampModal, setShowStampModal] = useState<boolean>(false);
  const [showThumbnailsSidebar, setShowThumbnailsSidebar] = useState<boolean>(true);

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Refs
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingSignatureRef = useRef<boolean>(false);

  // Initial Load with PDF.js
  useEffect(() => {
    let isMounted = true;
    const loadPdf = async () => {
      try {
        setLoading(true);
        setLoadingMessage("Parsing document structure & rendering pages...");
        const arrayBuffer = await file.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDocProxy(doc);
        const meta: PageMeta[] = [];
        const initialAnns: Record<number, PageAnnotations> = {};

        for (let i = 1; i <= doc.numPages; i++) {
          meta.push({
            pageIndex: i - 1,
            pageNumber: i,
            rotation: 0,
          });
          initialAnns[i - 1] = {
            strokes: [],
            shapes: [],
            texts: [],
            stickyNotes: [],
            images: [],
            rotationOffset: 0,
          };
        }

        setPagesMeta(meta);
        setAnnotations(initialAnns);
        setCurrentPageIndex(0);
        setLoading(false);
      } catch (err: any) {
        console.error("PDF Editor: Failed to load document:", err);
        if (isMounted) {
          setLoading(false);
          alert(`Could not open PDF: ${err.message || "Invalid or protected PDF file."}`);
          onClose();
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [file, onClose]);

  const activePageMeta = pagesMeta[currentPageIndex] || null;
  const activePageAnnotations = activePageMeta
    ? annotations[activePageMeta.pageIndex] || {
        strokes: [],
        shapes: [],
        texts: [],
        stickyNotes: [],
        images: [],
        rotationOffset: 0,
      }
    : { strokes: [], shapes: [], texts: [], stickyNotes: [], images: [], rotationOffset: 0 };

  // Render Current PDF Page onto Base Canvas
  useEffect(() => {
    if (!pdfDocProxy || !activePageMeta || activePageMeta.isDeleted) return;

    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        if (activePageMeta.isCustomBlank) {
          const canvas = pdfCanvasRef.current;
          if (canvas) {
            canvas.width = 612 * scale;
            canvas.height = 792 * scale;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
          }
          return;
        }

        const page = await pdfDocProxy.getPage(activePageMeta.pageIndex + 1);
        if (isCancelled) return;

        const totalRotation = (page.rotate + activePageMeta.rotation) % 360;
        const viewport = page.getViewport({ scale, rotation: totalRotation });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("PDF render error:", err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocProxy, activePageMeta, scale]);

  // Redraw Overlay Canvas (Drawings, Highlights, Shapes, Images, Texts, Redactions)
  const redrawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const baseCanvas = pdfCanvasRef.current;
    if (!canvas || !baseCanvas) return;

    canvas.width = baseCanvas.width;
    canvas.height = baseCanvas.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Highlights & Strokes
    activePageAnnotations.strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = stroke.opacity;

      const first = stroke.points[0];
      ctx.moveTo(first.x * scale, first.y * scale);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * scale, pt.y * scale);
      }
      ctx.stroke();
      ctx.restore();
    });

    // 2. Draw Active Stroke
    if (currentStroke && currentStroke.points.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width * scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = currentStroke.opacity;

      const first = currentStroke.points[0];
      ctx.moveTo(first.x * scale, first.y * scale);

      for (let i = 1; i < currentStroke.points.length; i++) {
        const pt = currentStroke.points[i];
        ctx.lineTo(pt.x * scale, pt.y * scale);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Shapes & Redactions
    activePageAnnotations.shapes.forEach((shape) => {
      ctx.save();
      ctx.globalAlpha = shape.opacity;
      const x = shape.x * scale;
      const y = shape.y * scale;
      const w = shape.width * scale;
      const h = shape.height * scale;

      if (shape.type === "redact") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(x, y, w, h);
      } else if (shape.type === "rect") {
        if (shape.fillColor) {
          ctx.fillStyle = shape.fillColor;
          ctx.fillRect(x, y, w, h);
        }
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth * scale;
        ctx.strokeRect(x, y, w, h);
      } else if (shape.type === "circle") {
        ctx.beginPath();
        const rx = Math.abs(w / 2);
        const ry = Math.abs(h / 2);
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (shape.fillColor) {
          ctx.fillStyle = shape.fillColor;
          ctx.fill();
        }
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth * scale;
        ctx.stroke();
      } else if (shape.type === "line") {
        ctx.beginPath();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth * scale;
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
      } else if (shape.type === "arrow") {
        ctx.beginPath();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth * scale;
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(h, w);
        const headlen = 12 * scale;
        ctx.beginPath();
        ctx.fillStyle = shape.color;
        ctx.moveTo(x + w, y + h);
        ctx.lineTo(
          x + w - headlen * Math.cos(angle - Math.PI / 6),
          y + h - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x + w - headlen * Math.cos(angle + Math.PI / 6),
          y + h - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });

    // 4. Draw Current Shape Preview
    if (currentShapePreview) {
      ctx.save();
      ctx.globalAlpha = currentShapePreview.opacity;
      const x = currentShapePreview.x * scale;
      const y = currentShapePreview.y * scale;
      const w = currentShapePreview.width * scale;
      const h = currentShapePreview.height * scale;

      if (currentShapePreview.type === "redact") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(x, y, w, h);
      } else if (currentShapePreview.type === "rect") {
        ctx.strokeStyle = currentShapePreview.color;
        ctx.lineWidth = currentShapePreview.lineWidth * scale;
        ctx.strokeRect(x, y, w, h);
      } else if (currentShapePreview.type === "circle") {
        ctx.beginPath();
        const rx = Math.abs(w / 2);
        const ry = Math.abs(h / 2);
        ctx.ellipse(x + w / 2, y + h / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = currentShapePreview.color;
        ctx.lineWidth = currentShapePreview.lineWidth * scale;
        ctx.stroke();
      } else if (currentShapePreview.type === "line" || currentShapePreview.type === "arrow") {
        ctx.beginPath();
        ctx.strokeStyle = currentShapePreview.color;
        ctx.lineWidth = currentShapePreview.lineWidth * scale;
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Draw Image / Stamp Annotations
    activePageAnnotations.images.forEach((img) => {
      const imgElem = new Image();
      imgElem.src = img.dataUrl;
      if (imgElem.complete) {
        ctx.drawImage(imgElem, img.x * scale, img.y * scale, img.width * scale, img.height * scale);
      } else {
        imgElem.onload = () => {
          ctx.drawImage(
            imgElem,
            img.x * scale,
            img.y * scale,
            img.width * scale,
            img.height * scale
          );
        };
      }
    });

    // 6. Draw Watermark if active
    if (watermarkText.trim()) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.font = `bold ${Math.max(28, 36 * scale)}px sans-serif`;
      ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(watermarkText.toUpperCase(), 0, 0);
      ctx.restore();
    }
  }, [activePageAnnotations, currentStroke, currentShapePreview, scale, watermarkText]);

  useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay]);

  // History & Undo/Redo Engine
  const pushHistory = (pageIndex: number, newAnnotations: PageAnnotations) => {
    const current = historyStack[pageIndex] || [];
    setHistoryStack((prev) => ({
      ...prev,
      [pageIndex]: [...current, activePageAnnotations],
    }));
    setRedoStack((prev) => ({
      ...prev,
      [pageIndex]: [],
    }));
    setAnnotations((prev) => ({
      ...prev,
      [pageIndex]: newAnnotations,
    }));
  };

  const handleUndo = () => {
    if (!activePageMeta) return;
    const pIdx = activePageMeta.pageIndex;
    const pageHistory = historyStack[pIdx] || [];
    if (pageHistory.length === 0) return;

    const previousState = pageHistory[pageHistory.length - 1];
    const newHistory = pageHistory.slice(0, pageHistory.length - 1);

    setRedoStack((prev) => ({
      ...prev,
      [pIdx]: [...(prev[pIdx] || []), activePageAnnotations],
    }));

    setHistoryStack((prev) => ({
      ...prev,
      [pIdx]: newHistory,
    }));

    setAnnotations((prev) => ({
      ...prev,
      [pIdx]: previousState,
    }));
  };

  const handleRedo = () => {
    if (!activePageMeta) return;
    const pIdx = activePageMeta.pageIndex;
    const pageRedo = redoStack[pIdx] || [];
    if (pageRedo.length === 0) return;

    const nextState = pageRedo[pageRedo.length - 1];
    const newRedo = pageRedo.slice(0, pageRedo.length - 1);

    setHistoryStack((prev) => ({
      ...prev,
      [pIdx]: [...(prev[pIdx] || []), activePageAnnotations],
    }));

    setRedoStack((prev) => ({
      ...prev,
      [pIdx]: newRedo,
    }));

    setAnnotations((prev) => ({
      ...prev,
      [pIdx]: nextState,
    }));
  };

  // Coordinate helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: clientX / scale,
      y: clientY / scale,
    };
  };

  // Mouse Handlers for Drawing, Shapes, and Text Placement
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activePageMeta) return;
    const { x, y } = getCanvasCoords(e);

    if (activeTool === "pen" || activeTool === "highlighter") {
      setIsInteracting(true);
      const isHl = activeTool === "highlighter";
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}`,
        tool: isHl ? "highlighter" : "pen",
        color: isHl ? "#facc15" : selectedColor,
        width: isHl ? highlighterWidth : strokeWidth,
        opacity: isHl ? 0.35 : 1,
        points: [{ x, y }],
      };
      setCurrentStroke(newStroke);
    } else if (
      activeTool === "rect" ||
      activeTool === "circle" ||
      activeTool === "line" ||
      activeTool === "arrow" ||
      activeTool === "redact"
    ) {
      setIsInteracting(true);
      setShapeStart({ x, y });
      setCurrentShapePreview({
        id: `shape-preview`,
        type: activeTool,
        x,
        y,
        width: 0,
        height: 0,
        color: activeTool === "redact" ? "#000000" : selectedColor,
        fillColor: activeTool === "redact" ? "#000000" : undefined,
        lineWidth: strokeWidth,
        opacity: activeTool === "redact" ? 1 : 0.9,
      });
    } else if (activeTool === "text") {
      setActiveTextInput({ x, y });
      setTypedTextValue("");
    } else if (activeTool === "sticky") {
      const newNote: StickyNoteAnnotation = {
        id: `note-${Date.now()}`,
        x,
        y,
        author: "User",
        text: "Click to add comment...",
        color: selectedColor,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isExpanded: true,
      };
      pushHistory(activePageMeta.pageIndex, {
        ...activePageAnnotations,
        stickyNotes: [...activePageAnnotations.stickyNotes, newNote],
      });
      setActiveTool("select");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInteracting) return;
    const { x, y } = getCanvasCoords(e);

    if (currentStroke) {
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, { x, y }] } : null));
    } else if (shapeStart && currentShapePreview) {
      const w = x - shapeStart.x;
      const h = y - shapeStart.y;
      setCurrentShapePreview((prev) =>
        prev
          ? {
              ...prev,
              x: w < 0 ? x : shapeStart.x,
              y: h < 0 ? y : shapeStart.y,
              width: Math.abs(w),
              height: Math.abs(h),
            }
          : null
      );
    }
  };

  const handleMouseUp = () => {
    if (!isInteracting || !activePageMeta) return;
    setIsInteracting(false);

    if (currentStroke) {
      pushHistory(activePageMeta.pageIndex, {
        ...activePageAnnotations,
        strokes: [...activePageAnnotations.strokes, currentStroke],
      });
      setCurrentStroke(null);
    } else if (currentShapePreview && shapeStart) {
      if (currentShapePreview.width > 3 || currentShapePreview.height > 3) {
        const finalShape: ShapeAnnotation = {
          ...currentShapePreview,
          id: `shape-${Date.now()}`,
        };
        pushHistory(activePageMeta.pageIndex, {
          ...activePageAnnotations,
          shapes: [...activePageAnnotations.shapes, finalShape],
        });
      }
      setShapeStart(null);
      setCurrentShapePreview(null);
    }
  };

  // Submit Text Annotation
  const handleCommitText = () => {
    if (!activeTextInput || !typedTextValue.trim() || !activePageMeta) {
      setActiveTextInput(null);
      return;
    }

    const newText: TextAnnotation = {
      id: `text-${Date.now()}`,
      x: activeTextInput.x,
      y: activeTextInput.y,
      text: typedTextValue,
      color: selectedColor,
      fontSize: textSize,
      fontFamily,
      isBold,
      isItalic,
    };

    pushHistory(activePageMeta.pageIndex, {
      ...activePageAnnotations,
      texts: [...activePageAnnotations.texts, newText],
    });

    setActiveTextInput(null);
    setTypedTextValue("");
    setActiveTool("select");
  };

  // Page Management Functions
  const handleRotatePage = (direction: "cw" | "ccw") => {
    if (!activePageMeta) return;
    const delta = direction === "cw" ? 90 : -90;
    const updated = pagesMeta.map((p, idx) =>
      idx === currentPageIndex ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p
    );
    setPagesMeta(updated);
  };

  const handleDeletePage = (indexToDelete: number) => {
    if (pagesMeta.filter((p) => !p.isDeleted).length <= 1) {
      alert("Cannot delete the only remaining page in the document.");
      return;
    }
    const updated = pagesMeta.map((p, idx) =>
      idx === indexToDelete ? { ...p, isDeleted: true } : p
    );
    setPagesMeta(updated);
    if (currentPageIndex === indexToDelete) {
      const nextActive = updated.findIndex((p, idx) => !p.isDeleted && idx > indexToDelete);
      let prevActive = -1;
      for (let i = indexToDelete - 1; i >= 0; i--) {
        if (!updated[i].isDeleted) {
          prevActive = i;
          break;
        }
      }
      setCurrentPageIndex(nextActive !== -1 ? nextActive : prevActive !== -1 ? prevActive : 0);
    }
  };

  const handleDuplicatePage = (indexToDuplicate: number) => {
    const target = pagesMeta[indexToDuplicate];
    if (!target) return;
    const newMeta: PageMeta = {
      pageIndex: target.pageIndex,
      pageNumber: pagesMeta.length + 1,
      rotation: target.rotation,
    };
    const updated = [...pagesMeta];
    updated.splice(indexToDuplicate + 1, 0, newMeta);
    setPagesMeta(updated);
    setCurrentPageIndex(indexToDuplicate + 1);
  };

  const handleInsertBlankPage = (afterIndex: number) => {
    const newMeta: PageMeta = {
      pageIndex: 10000 + Date.now() % 10000,
      pageNumber: pagesMeta.length + 1,
      rotation: 0,
      isCustomBlank: true,
    };
    const updated = [...pagesMeta];
    updated.splice(afterIndex + 1, 0, newMeta);
    setPagesMeta(updated);
    setCurrentPageIndex(afterIndex + 1);
  };

  const handleMovePage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pagesMeta.length) return;
    const updated = [...pagesMeta];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setPagesMeta(updated);
    setCurrentPageIndex(targetIndex);
  };

  // Stamp Insertion
  const handleInsertStamp = (label: string, color: string) => {
    if (!activePageMeta) return;
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 70;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 228, 58);

    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 120, 35);

    const dataUrl = canvas.toDataURL("image/png");
    const newImage: ImageAnnotation = {
      id: `stamp-${Date.now()}`,
      x: 100,
      y: 100,
      width: 160,
      height: 48,
      dataUrl,
      format: "png",
      type: "stamp",
    };

    pushHistory(activePageMeta.pageIndex, {
      ...activePageAnnotations,
      images: [...activePageAnnotations.images, newImage],
    });

    setShowStampModal(false);
    setActiveTool("select");
  };

  // Custom Image Upload (Stamp or Photo)
  const handleUploadImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded || !activePageMeta) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newImg: ImageAnnotation = {
        id: `img-${Date.now()}`,
        x: 120,
        y: 120,
        width: 140,
        height: 100,
        dataUrl,
        format: uploaded.type.includes("png") ? "png" : "jpeg",
        type: "image",
      };
      pushHistory(activePageMeta.pageIndex, {
        ...activePageAnnotations,
        images: [...activePageAnnotations.images, newImg],
      });
      setActiveTool("select");
    };
    reader.readAsDataURL(uploaded);
  };

  // Signature Pad Handlers
  const handleStartSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingSignatureRef.current = true;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleDrawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignatureRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleEndSignature = () => {
    isDrawingSignatureRef.current = false;
  };

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApplySignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !activePageMeta) return;
    const dataUrl = canvas.toDataURL("image/png");

    const newSig: ImageAnnotation = {
      id: `sig-${Date.now()}`,
      x: 140,
      y: 200,
      width: 140,
      height: 60,
      dataUrl,
      format: "png",
      type: "signature",
    };

    pushHistory(activePageMeta.pageIndex, {
      ...activePageAnnotations,
      images: [...activePageAnnotations.images, newSig],
    });

    setShowSignatureModal(false);
    setActiveTool("select");
  };

  // Save & Export Real PDF with All Modifications Embedded
  const handleSaveAndExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(10);

      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const outDoc = await PDFDocument.create();

      const activePages = pagesMeta.filter((p) => !p.isDeleted);
      const total = activePages.length;

      const helveticaFont = await outDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await outDoc.embedFont(StandardFonts.HelveticaBold);
      const timesFont = await outDoc.embedFont(StandardFonts.TimesRoman);
      const courierFont = await outDoc.embedFont(StandardFonts.Courier);

      for (let i = 0; i < total; i++) {
        const meta = activePages[i];
        let targetPage: any;

        if (meta.isCustomBlank) {
          targetPage = outDoc.addPage([612, 792]);
        } else {
          const [copiedPage] = await outDoc.copyPages(srcDoc, [meta.pageIndex]);
          targetPage = outDoc.addPage(copiedPage);
        }

        // Apply page rotation
        const currentRot = targetPage.getRotation().angle;
        targetPage.setRotation(degrees((currentRot + meta.rotation) % 360));

        const { width: pWidth, height: pHeight } = targetPage.getSize();
        const pageAnns = annotations[meta.pageIndex];

        if (pageAnns) {
          // 1. Burn Redactions (Blackout boxes)
          for (const shape of pageAnns.shapes) {
            if (shape.type === "redact") {
              targetPage.drawRectangle({
                x: shape.x,
                y: pHeight - shape.y - shape.height,
                width: shape.width,
                height: shape.height,
                color: rgb(0, 0, 0),
                opacity: 1,
              });
            } else if (shape.type === "rect") {
              targetPage.drawRectangle({
                x: shape.x,
                y: pHeight - shape.y - shape.height,
                width: shape.width,
                height: shape.height,
                borderColor: rgb(0.15, 0.39, 0.92),
                borderWidth: shape.lineWidth || 2,
              });
            }
          }

          // 2. Burn Texts
          for (const txt of pageAnns.texts) {
            let fontChoice = helveticaFont;
            if (txt.fontFamily === "Times") fontChoice = timesFont;
            if (txt.fontFamily === "Courier") fontChoice = courierFont;
            if (txt.isBold) fontChoice = helveticaBold;

            targetPage.drawText(txt.text, {
              x: txt.x,
              y: pHeight - txt.y - txt.fontSize,
              size: txt.fontSize || 14,
              font: fontChoice,
              color: rgb(0.1, 0.1, 0.1),
            });
          }

          // 3. Burn Stamp / Signature Images
          for (const img of pageAnns.images) {
            try {
              let embeddedImg: any;
              const imgBytes = Uint8Array.from(atob(img.dataUrl.split(",")[1]), (c) =>
                c.charCodeAt(0)
              );
              if (img.format === "png" || img.dataUrl.includes("image/png")) {
                embeddedImg = await outDoc.embedPng(imgBytes);
              } else {
                embeddedImg = await outDoc.embedJpg(imgBytes);
              }

              targetPage.drawImage(embeddedImg, {
                x: img.x,
                y: pHeight - img.y - img.height,
                width: img.width,
                height: img.height,
              });
            } catch (imgErr) {
              console.warn("Failed embedding image annotation:", imgErr);
            }
          }

          // 4. Burn Freehand / Highlighter Strokes via Canvas Raster Overlay if present
          if (pageAnns.strokes.length > 0) {
            const strokeCanvas = document.createElement("canvas");
            strokeCanvas.width = pWidth * 2;
            strokeCanvas.height = pHeight * 2;
            const sCtx = strokeCanvas.getContext("2d");
            if (sCtx) {
              sCtx.scale(2, 2);
              pageAnns.strokes.forEach((stroke) => {
                if (stroke.points.length < 2) return;
                sCtx.save();
                sCtx.beginPath();
                sCtx.strokeStyle = stroke.color;
                sCtx.lineWidth = stroke.width;
                sCtx.lineCap = "round";
                sCtx.lineJoin = "round";
                sCtx.globalAlpha = stroke.opacity;

                const first = stroke.points[0];
                sCtx.moveTo(first.x, first.y);
                for (let j = 1; j < stroke.points.length; j++) {
                  sCtx.lineTo(stroke.points[j].x, stroke.points[j].y);
                }
                sCtx.stroke();
                sCtx.restore();
              });

              const strokeDataUrl = strokeCanvas.toDataURL("image/png");
              const strokeBytes = Uint8Array.from(atob(strokeDataUrl.split(",")[1]), (c) =>
                c.charCodeAt(0)
              );
              const embeddedStrokePng = await outDoc.embedPng(strokeBytes);

              targetPage.drawImage(embeddedStrokePng, {
                x: 0,
                y: 0,
                width: pWidth,
                height: pHeight,
              });
            }
          }
        }

        // Watermark
        if (watermarkText.trim()) {
          targetPage.drawText(watermarkText.toUpperCase(), {
            x: pWidth / 4,
            y: pHeight / 2,
            size: 36,
            font: helveticaBold,
            color: rgb(0.9, 0.2, 0.2),
            opacity: 0.25,
            rotate: degrees(45),
          });
        }

        // Page Numbering
        if (includePageNumbers) {
          targetPage.drawText(`Page ${i + 1} of ${total}`, {
            x: pWidth / 2 - 30,
            y: 20,
            size: 10,
            font: helveticaFont,
            color: rgb(0.4, 0.4, 0.4),
          });
        }

        setExportProgress(Math.round(10 + ((i + 1) / total) * 80));
      }

      const outputBytes = await outDoc.save();
      setExportProgress(100);

      const outName = `${file.name.replace(/\.[^/.]+$/, "")}_edited_pdfsun.pdf`;
      downloadFile(outputBytes, outName, "application/pdf");

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onSaveComplete) {
        onSaveComplete(outputBytes, outName);
      }

      setIsExporting(false);
    } catch (err: any) {
      console.error("Failed to export PDF:", err);
      alert(`Export Failed: ${err.message || "An unexpected error occurred during PDF assembly."}`);
      setIsExporting(false);
    }
  };

  const activePages = pagesMeta.filter((p) => !p.isDeleted);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. Top Global Navigation & Tool Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base tracking-tight text-white flex items-center">
                PDFSun Advanced Editor
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  PRO SUITE
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs md:max-w-md">{file.name}</p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.4, s + 0.2))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={handleUndo}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Export / Download Button */}
          <button
            onClick={handleSaveAndExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Exporting ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Save & Export PDF</span>
              </>
            )}
          </button>

          {/* Close Window */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            title="Exit Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Secondary Contextual Toolbar */}
      <nav aria-label="Editor Tools" className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between overflow-x-auto shrink-0 gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          <button
            onClick={() => setActiveTool("select")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "select"
                ? "bg-amber-500 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            onClick={() => setActiveTool("pen")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "pen"
                ? "bg-amber-500 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Pen className="w-4 h-4" />
            <span>Draw</span>
          </button>

          <button
            onClick={() => setActiveTool("highlighter")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "highlighter"
                ? "bg-amber-500 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Highlighter className="w-4 h-4 text-yellow-400" />
            <span>Highlight</span>
          </button>

          <button
            onClick={() => setActiveTool("text")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "text"
                ? "bg-amber-500 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Add Text</span>
          </button>

          <button
            onClick={() => setActiveTool("rect")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "rect"
                ? "bg-amber-500 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Square className="w-4 h-4" />
            <span className="hidden md:inline">Rectangle</span>
          </button>

          <button
            onClick={() => setActiveTool("circle")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "circle"
                ? "bg-amber-500 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Circle className="w-4 h-4" />
            <span className="hidden md:inline">Circle</span>
          </button>

          <button
            onClick={() => setActiveTool("arrow")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "arrow"
                ? "bg-amber-500 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span className="hidden md:inline">Arrow</span>
          </button>

          <button
            onClick={() => setActiveTool("redact")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "redact"
                ? "bg-rose-600 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Redact</span>
          </button>

          <button
            onClick={() => setShowStampModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-800"
          >
            <Stamp className="w-4 h-4 text-amber-400" />
            <span>Stamp</span>
          </button>

          <button
            onClick={() => setShowSignatureModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-800"
          >
            <Pen className="w-4 h-4 text-sky-400" />
            <span>Sign</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-800"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Insert Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleUploadImageFile}
          />
        </div>

        {/* Color Palette & Stroke Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-5 h-5 rounded-full border transition transform ${
                  selectedColor === c.value
                    ? "scale-110 border-white ring-2 ring-amber-500/50"
                    : "border-slate-600 hover:scale-105"
                }`}
                title={c.name}
              />
            ))}
          </div>

          <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => handleRotatePage("ccw")}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotatePage("cw")}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 3. Main Workspace with Sidebar & Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page Thumbnails & Organizer Sidebar */}
        {showThumbnailsSidebar && (
          <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Pages ({activePages.length})
              </span>
              <button
                onClick={() => handleInsertBlankPage(currentPageIndex)}
                className="text-xs font-semibold px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded flex items-center space-x-1"
                title="Insert Blank Page"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Blank</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {pagesMeta.map((pageMeta, idx) => {
                if (pageMeta.isDeleted) return null;
                const isSelected = idx === currentPageIndex;

                return (
                  <div
                    key={`${pageMeta.pageIndex}-${idx}`}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`group relative p-2 rounded-xl border transition cursor-pointer flex flex-col items-center ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20"
                        : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    {/* Thumbnail box */}
                    <div className="w-full aspect-[3/4] bg-white rounded shadow flex items-center justify-center relative overflow-hidden">
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        Page {idx + 1}
                      </span>
                      {pageMeta.rotation !== 0 && (
                        <span className="absolute top-1 right-1 text-[10px] bg-slate-900/80 text-white px-1 rounded">
                          {pageMeta.rotation}°
                        </span>
                      )}
                    </div>

                    <div className="w-full flex items-center justify-between mt-2 px-1">
                      <span className="text-xs font-medium text-slate-300">Page {idx + 1}</span>

                      {/* Quick page actions */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicatePage(idx);
                          }}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                          title="Duplicate Page"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(idx);
                          }}
                          className="p-1 hover:bg-rose-500/20 rounded text-rose-400"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Center Canvas Viewport */}
        <main
          ref={viewportContainerRef}
          className="flex-1 bg-slate-950 flex flex-col items-center justify-start p-6 overflow-auto relative"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center my-auto space-y-4">
              <RotateCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-medium text-slate-300">{loadingMessage}</p>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-sm transition-all duration-150">
              {/* PDF Background Canvas */}
              <canvas ref={pdfCanvasRef} className="block rounded-sm bg-white" />

              {/* Annotation & Interaction Overlay Canvas */}
              <canvas
                ref={overlayCanvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={`absolute inset-0 cursor-${
                  activeTool === "pen" || activeTool === "highlighter"
                    ? "crosshair"
                    : activeTool === "text"
                    ? "text"
                    : activeTool === "rect" || activeTool === "circle" || activeTool === "arrow"
                    ? "crosshair"
                    : "default"
                }`}
              />

              {/* Floating Inline Text Input Editor */}
              {activeTextInput && (
                <div
                  style={{
                    left: activeTextInput.x * scale,
                    top: activeTextInput.y * scale,
                  }}
                  className="absolute z-20 bg-slate-900 border border-amber-500 rounded-lg p-2 shadow-2xl flex flex-col space-y-2 min-w-[220px]"
                >
                  <textarea
                    autoFocus
                    value={typedTextValue}
                    onChange={(e) => setTypedTextValue(e.target.value)}
                    placeholder="Type your text annotation..."
                    className="w-full bg-slate-800 text-white text-sm p-2 rounded border border-slate-700 outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1">
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value as any)}
                        className="bg-slate-800 text-xs text-slate-200 rounded px-1.5 py-1 border border-slate-700"
                      >
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times">Times</option>
                        <option value="Courier">Courier</option>
                      </select>
                      <select
                        value={textSize}
                        onChange={(e) => setTextSize(Number(e.target.value))}
                        className="bg-slate-800 text-xs text-slate-200 rounded px-1.5 py-1 border border-slate-700"
                      >
                        <option value={12}>12px</option>
                        <option value={14}>14px</option>
                        <option value={16}>16px</option>
                        <option value={20}>20px</option>
                        <option value={24}>24px</option>
                        <option value={32}>32px</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setActiveTextInput(null)}
                        className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCommitText}
                        className="px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Settings & Document Properties Panel */}
        <aside className="w-72 bg-slate-900/95 border-l border-slate-800 p-4 flex flex-col space-y-5 shrink-0 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center mb-3">
              <Settings className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Document Properties
            </h3>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Pages:</span>
                <span className="font-semibold text-white">{activePages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Page:</span>
                <span className="font-semibold text-amber-400">{currentPageIndex + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Size:</span>
                <span className="font-semibold text-slate-300">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>

          {/* Watermark Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2">Watermark Overlay</h4>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="e.g. CONFIDENTIAL / DRAFT"
              className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Page Numbering Option */}
          <div>
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includePageNumbers}
                onChange={(e) => setIncludePageNumbers(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
              />
              <span>Include Page Numbers (Bottom Footer)</span>
            </label>
          </div>

          {/* Shortcuts Reference */}
          <div className="mt-auto bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 text-xs text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-300 text-[11px] mb-1">Keyboard Shortcuts:</div>
            <div className="flex justify-between">
              <span>Undo</span>
              <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white">Ctrl+Z</kbd>
            </div>
            <div className="flex justify-between">
              <span>Redo</span>
              <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white">Ctrl+Y</kbd>
            </div>
            <div className="flex justify-between">
              <span>Save & Export</span>
              <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white">
                Ctrl+S
              </kbd>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. Stamp Selection Modal */}
      {showStampModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center">
                <Stamp className="w-5 h-5 mr-2 text-amber-400" />
                Select Stamp
              </h3>
              <button
                onClick={() => setShowStampModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {STAMP_PRESETS.map((st) => (
                <button
                  key={st.label}
                  onClick={() => handleInsertStamp(st.label, st.color)}
                  style={{ borderColor: st.color, color: st.color }}
                  className="py-3 px-4 rounded-xl border-2 font-bold text-sm tracking-wider hover:scale-105 active:scale-95 transition bg-slate-800/40"
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Draw Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center">
                <Pen className="w-5 h-5 mr-2 text-sky-400" />
                Draw E-Signature
              </h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-300">
              <canvas
                ref={signatureCanvasRef}
                width={380}
                height={150}
                onMouseDown={handleStartSignature}
                onMouseMove={handleDrawSignature}
                onMouseUp={handleEndSignature}
                className="cursor-crosshair w-full h-[150px] touch-none"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handleClearSignature}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg"
              >
                Clear
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplySignature}
                  className="px-4 py-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow"
                >
                  Apply Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
