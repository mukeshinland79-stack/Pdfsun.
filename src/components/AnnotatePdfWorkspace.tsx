import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import {
  Highlighter,
  Pen,
  StickyNote,
  Type,
  Eraser,
  Undo2,
  Redo2,
  RotateCcw,
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
  Palette,
  Sliders,
  Layers,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadFile } from "../lib/pdfEngine";

// Set PDF.js worker
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
}

export interface DrawingStroke {
  id: string;
  tool: "pen" | "highlighter" | "eraser";
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
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

export interface PageAnnotations {
  strokes: DrawingStroke[];
  texts: TextAnnotation[];
  stickyNotes: StickyNoteAnnotation[];
}

interface AnnotatePdfWorkspaceProps {
  file: File;
  onClose: () => void;
  onSaveComplete?: (outputBytes: Uint8Array, fileName: string) => void;
}

const PRESET_COLORS = [
  { name: "Yellow Highlight", value: "#facc15" },
  { name: "Green Highlight", value: "#22c55e" },
  { name: "Cyan Highlight", value: "#06b6d4" },
  { name: "Pink Highlight", value: "#ec4899" },
  { name: "Blue Pen", value: "#2563eb" },
  { name: "Red Pen", value: "#dc2626" },
  { name: "Dark Slate", value: "#0f172a" },
  { name: "Purple", value: "#9333ea" },
];

export const AnnotatePdfWorkspace: React.FC<AnnotatePdfWorkspaceProps> = ({
  file,
  onClose,
  onSaveComplete,
}) => {
  // PDF Document State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading PDF document...");

  // Active Tool & Styling
  const [activeTool, setActiveTool] = useState<
    "pen" | "highlighter" | "sticky" | "text" | "eraser"
  >("pen");
  const [selectedColor, setSelectedColor] = useState("#facc15"); // default highlight yellow
  const [penWidth, setPenWidth] = useState(4);
  const [highlighterWidth, setHighlighterWidth] = useState(18);
  const [textSize, setTextSize] = useState(16);

  // Annotations state per page number { [pageNum]: PageAnnotations }
  const [annotations, setAnnotations] = useState<Record<number, PageAnnotations>>({});
  
  // Undo / Redo history for current page
  const [historyStack, setHistoryStack] = useState<Record<number, PageAnnotations[]>>({});
  const [redoStack, setRedoStack] = useState<Record<number, PageAnnotations[]>>({});

  // Drawing in progress
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);

  // Active typing text annotation
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number } | null>(null);
  const [typedTextValue, setTypedTextValue] = useState("");

  // Saving / Exporting state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Refs for rendering
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load PDF document on mount
  useEffect(() => {
    let isMounted = true;
    const loadPdf = async () => {
      try {
        setLoading(true);
        setLoadingMessage("Parsing PDF structure with PDF.js engine...");
        const arrayBuffer = await file.arrayBuffer();
        
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        console.error("PDF.js loading error:", err);
        setLoadingMessage("Failed to load PDF. Please ensure file is valid.");
        setLoading(false);
      }
    };

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [file]);

  // Render Current PDF Page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !pdfCanvasRef.current || !drawingCanvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const pdfCanvas = pdfCanvasRef.current;
      const pdfCtx = pdfCanvas.getContext("2d");
      if (!pdfCtx) return;

      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;

      const drawingCanvas = drawingCanvasRef.current;
      drawingCanvas.width = viewport.width;
      drawingCanvas.height = viewport.height;

      const renderContext = {
        canvasContext: pdfCtx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      redrawAnnotations();
    } catch (err) {
      console.error("Error rendering page:", err);
    }
  }, [pdfDoc, currentPage, scale, annotations]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  // Redraw Drawing Overlay Canvas
  const redrawAnnotations = useCallback(() => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    const pageAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };

    // Render strokes
    pageAnn.strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = stroke.opacity;

      if (stroke.tool === "highlighter") {
        ctx.globalCompositeOperation = "multiply";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.stroke();
      ctx.restore();
    });

    // Render text annotations
    pageAnn.texts.forEach((txt) => {
      ctx.save();
      ctx.font = `bold ${txt.fontSize}px sans-serif`;
      ctx.fillStyle = txt.color;
      ctx.fillText(txt.text, txt.x, txt.y);
      ctx.restore();
    });
  }, [annotations, currentPage]);

  useEffect(() => {
    redrawAnnotations();
  }, [annotations, currentPage, redrawAnnotations]);

  // History Helper for Undo / Redo
  const pushToHistory = (newAnnotations: PageAnnotations) => {
    const currentPageHistory = historyStack[currentPage] || [];
    const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };

    setHistoryStack((prev) => ({
      ...prev,
      [currentPage]: [...currentPageHistory, currentAnn],
    }));

    // Clear redo stack on new action
    setRedoStack((prev) => ({ ...prev, [currentPage]: [] }));

    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: newAnnotations,
    }));
  };

  const handleUndo = () => {
    const currentPageHistory = historyStack[currentPage] || [];
    if (currentPageHistory.length === 0) return;

    const previousAnn = currentPageHistory[currentPageHistory.length - 1];
    const newHistory = currentPageHistory.slice(0, -1);

    const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };
    const currentPageRedo = redoStack[currentPage] || [];

    setRedoStack((prev) => ({
      ...prev,
      [currentPage]: [...currentPageRedo, currentAnn],
    }));

    setHistoryStack((prev) => ({
      ...prev,
      [currentPage]: newHistory,
    }));

    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: previousAnn,
    }));
  };

  const handleRedo = () => {
    const currentPageRedo = redoStack[currentPage] || [];
    if (currentPageRedo.length === 0) return;

    const nextAnn = currentPageRedo[currentPageRedo.length - 1];
    const newRedo = currentPageRedo.slice(0, -1);

    const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };
    const currentPageHistory = historyStack[currentPage] || [];

    setHistoryStack((prev) => ({
      ...prev,
      [currentPage]: [...currentPageHistory, currentAnn],
    }));

    setRedoStack((prev) => ({
      ...prev,
      [currentPage]: newRedo,
    }));

    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: nextAnn,
    }));
  };

  const handleClearPage = () => {
    pushToHistory({ strokes: [], texts: [], stickyNotes: [] });
  };

  // Mouse / Touch Event Handlers for Canvas Drawing & Annotation Placement
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (loading) return;
    const { x, y } = getCanvasCoordinates(e);

    if (activeTool === "pen" || activeTool === "highlighter") {
      setIsDrawing(true);
      const stroke: DrawingStroke = {
        id: Date.now().toString(),
        tool: activeTool,
        color: selectedColor,
        width: activeTool === "highlighter" ? highlighterWidth : penWidth,
        opacity: activeTool === "highlighter" ? 0.45 : 1.0,
        points: [{ x, y }],
      };
      setCurrentStroke(stroke);
    } else if (activeTool === "sticky") {
      // Add sticky note
      const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };
      const newNote: StickyNoteAnnotation = {
        id: Date.now().toString(),
        x,
        y,
        author: "User Note",
        text: "New sticky comment...",
        color: selectedColor === "#facc15" ? "#fef08a" : "#e0f2fe",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isExpanded: true,
      };
      pushToHistory({
        ...currentAnn,
        stickyNotes: [...currentAnn.stickyNotes, newNote],
      });
    } else if (activeTool === "text") {
      setActiveTextInput({ x, y });
    } else if (activeTool === "eraser") {
      // Erase closest stroke or text
      const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };
      const filteredStrokes = currentAnn.strokes.filter((s) => {
        return !s.points.some((p) => Math.hypot(p.x - x, p.y - y) < 25);
      });
      const filteredTexts = currentAnn.texts.filter((t) => Math.hypot(t.x - x, t.y - y) > 30);

      pushToHistory({
        ...currentAnn,
        strokes: filteredStrokes,
        texts: filteredTexts,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const { x, y } = getCanvasCoordinates(e);

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, { x, y }],
    };

    setCurrentStroke(updatedStroke);

    // Draw immediate stroke segment
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    const pts = updatedStroke.points;
    if (pts.length >= 2) {
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    ctx.strokeStyle = updatedStroke.color;
    ctx.lineWidth = updatedStroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = updatedStroke.opacity;

    if (updatedStroke.tool === "highlighter") {
      ctx.globalCompositeOperation = "multiply";
    }

    ctx.stroke();
    ctx.restore();
  };

  const handleMouseUp = () => {
    if (isDrawing && currentStroke) {
      setIsDrawing(false);
      const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };
      pushToHistory({
        ...currentAnn,
        strokes: [...currentAnn.strokes, currentStroke],
      });
      setCurrentStroke(null);
    }
  };

  // Confirm Typed Text Annotation
  const handleConfirmTextAnnotation = () => {
    if (!activeTextInput || !typedTextValue.trim()) {
      setActiveTextInput(null);
      setTypedTextValue("");
      return;
    }

    const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };
    const newText: TextAnnotation = {
      id: Date.now().toString(),
      x: activeTextInput.x,
      y: activeTextInput.y,
      text: typedTextValue,
      color: selectedColor === "#facc15" ? "#0f172a" : selectedColor,
      fontSize: textSize,
    };

    pushToHistory({
      ...currentAnn,
      texts: [...currentAnn.texts, newText],
    });

    setActiveTextInput(null);
    setTypedTextValue("");
  };

  // Sticky Note Update & Delete
  const handleUpdateStickyNote = (id: string, text: string) => {
    const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };
    const updated = currentAnn.stickyNotes.map((note) =>
      note.id === id ? { ...note, text } : note
    );
    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: { ...currentAnn, stickyNotes: updated },
    }));
  };

  const handleDeleteStickyNote = (id: string) => {
    const currentAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };
    const filtered = currentAnn.stickyNotes.filter((n) => n.id !== id);
    pushToHistory({
      ...currentAnn,
      stickyNotes: filtered,
    });
  };

  // Save & Export Annotated PDF Document
  const handleExportAnnotatedPdf = async () => {
    if (!pdfDoc) return;
    setIsExporting(true);
    setExportProgress(10);

    try {
      const compiledDoc = await PDFDocument.create();

      for (let p = 1; p <= numPages; p++) {
        setExportProgress(Math.round((p / numPages) * 80));

        // 1. Render base PDF page to offscreen canvas
        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale: 2.0 }); // High resolution render

        const offCanvas = document.createElement("canvas");
        offCanvas.width = viewport.width;
        offCanvas.height = viewport.height;
        const offCtx = offCanvas.getContext("2d");
        if (!offCtx) continue;

        await page.render({ canvasContext: offCtx, viewport }).promise;

        // 2. Render Page Annotations onto the offscreen canvas
        const pageAnn = annotations[p] || { strokes: [], texts: [], stickyNotes: [] };
        const scaleFactor = 2.0 / scale; // Scale ratio for high-res output

        // Render strokes
        pageAnn.strokes.forEach((stroke) => {
          if (stroke.points.length < 2) return;
          offCtx.save();
          offCtx.beginPath();
          offCtx.moveTo(stroke.points[0].x * scaleFactor, stroke.points[0].y * scaleFactor);

          for (let i = 1; i < stroke.points.length; i++) {
            offCtx.lineTo(stroke.points[i].x * scaleFactor, stroke.points[i].y * scaleFactor);
          }

          offCtx.strokeStyle = stroke.color;
          offCtx.lineWidth = stroke.width * scaleFactor;
          offCtx.lineCap = "round";
          offCtx.lineJoin = "round";
          offCtx.globalAlpha = stroke.opacity;

          if (stroke.tool === "highlighter") {
            offCtx.globalCompositeOperation = "multiply";
          } else {
            offCtx.globalCompositeOperation = "source-over";
          }

          offCtx.stroke();
          offCtx.restore();
        });

        // Render texts
        pageAnn.texts.forEach((txt) => {
          offCtx.save();
          offCtx.font = `bold ${txt.fontSize * scaleFactor}px sans-serif`;
          offCtx.fillStyle = txt.color;
          offCtx.fillText(txt.text, txt.x * scaleFactor, txt.y * scaleFactor);
          offCtx.restore();
        });

        // Render sticky note markers
        pageAnn.stickyNotes.forEach((note) => {
          offCtx.save();
          const nx = note.x * scaleFactor;
          const ny = note.y * scaleFactor;

          // Note yellow pad box
          offCtx.fillStyle = "#fef08a";
          offCtx.strokeStyle = "#eab308";
          offCtx.lineWidth = 2 * scaleFactor;
          offCtx.beginPath();
          offCtx.roundRect(nx, ny, 180 * scaleFactor, 90 * scaleFactor, 8 * scaleFactor);
          offCtx.fill();
          offCtx.stroke();

          // Header
          offCtx.fillStyle = "#854d0e";
          offCtx.font = `bold ${10 * scaleFactor}px sans-serif`;
          offCtx.fillText(`💬 Note (${note.timestamp})`, nx + 8 * scaleFactor, ny + 18 * scaleFactor);

          // Content text wrapped
          offCtx.fillStyle = "#1e293b";
          offCtx.font = `${10 * scaleFactor}px sans-serif`;
          const words = note.text.split(" ");
          let line = "";
          let lineY = ny + 36 * scaleFactor;

          for (let w = 0; w < words.length; w++) {
            const testLine = line + words[w] + " ";
            const metrics = offCtx.measureText(testLine);
            if (metrics.width > 160 * scaleFactor && w > 0) {
              offCtx.fillText(line, nx + 8 * scaleFactor, lineY);
              line = words[w] + " ";
              lineY += 14 * scaleFactor;
            } else {
              line = testLine;
            }
          }
          offCtx.fillText(line, nx + 8 * scaleFactor, lineY);

          offCtx.restore();
        });

        // Convert page canvas to PNG and embed in pdf-lib document
        const dataUrl = offCanvas.toDataURL("image/png");
        const pngImage = await compiledDoc.embedPng(dataUrl);

        const newPage = compiledDoc.addPage([pngImage.width / 2, pngImage.height / 2]);
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pngImage.width / 2,
          height: pngImage.height / 2,
        });
      }

      setExportProgress(95);
      const pdfBytes = await compiledDoc.save();

      const outName = file.name.replace(/\.[^/.]+$/, "") + "_Annotated.pdf";

      if (onSaveComplete) {
        onSaveComplete(pdfBytes, outName);
      } else {
        downloadFile(pdfBytes, outName, "application/pdf");
      }

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {}

      setIsExporting(false);
      setExportProgress(100);
    } catch (err) {
      console.error("Export error:", err);
      setIsExporting(false);
      alert("Error saving annotated PDF file. Please try again.");
    }
  };

  const currentPageAnn = annotations[currentPage] || { strokes: [], texts: [], stickyNotes: [] };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col h-screen w-screen overflow-hidden animate-in fade-in">
      
      {/* Top Header Bar */}
      <header className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md">
            <Highlighter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white flex items-center space-x-2">
              <span>Annotate PDF Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600 font-mono uppercase font-bold">
                PDF.js Canvas Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {file.name}
            </p>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center space-x-2">
          {/* Export PDF Button */}
          <button
            onClick={handleExportAnnotatedPdf}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs transition shadow-lg flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? `Exporting (${exportProgress}%)...` : "Save & Download PDF"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close annotator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Studio Body: Sidebar Tools + Canvas Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Toolbar Controls Panel */}
        <aside className="w-16 sm:w-64 bg-slate-900 border-r border-slate-800 p-3 flex flex-col space-y-4 shrink-0 overflow-y-auto z-10">
          
          {/* Tool Category Buttons */}
          <div className="space-y-1">
            <span className="hidden sm:block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">
              Annotation Tools
            </span>

            {/* 1. Freehand Pen */}
            <button
              onClick={() => setActiveTool("pen")}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition ${
                activeTool === "pen"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
              title="Freehand Pen Tool"
            >
              <Pen className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Freehand Pen</span>
            </button>

            {/* 2. Highlighter */}
            <button
              onClick={() => setActiveTool("highlighter")}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition ${
                activeTool === "highlighter"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
              title="Text Highlighter"
            >
              <Highlighter className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Highlighter</span>
            </button>

            {/* 3. Sticky Note */}
            <button
              onClick={() => setActiveTool("sticky")}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition ${
                activeTool === "sticky"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
              title="Add Sticky Comment Note"
            >
              <StickyNote className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sticky Comment</span>
            </button>

            {/* 4. Type Text */}
            <button
              onClick={() => setActiveTool("text")}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition ${
                activeTool === "text"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
              title="Type Text Note"
            >
              <Type className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Type Text</span>
            </button>

            {/* 5. Eraser */}
            <button
              onClick={() => setActiveTool("eraser")}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition ${
                activeTool === "eraser"
                  ? "bg-rose-500 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          {/* Preset Color Selection */}
          <div className="hidden sm:block space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Color Palette
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`w-7 h-7 rounded-lg transition transform hover:scale-110 border-2 ${
                    selectedColor === c.value ? "border-white scale-110 ring-2 ring-amber-500" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Thickness & Size Controls */}
          <div className="hidden sm:block space-y-3 pt-2 border-t border-slate-800 text-xs">
            {activeTool === "pen" && (
              <div>
                <label className="text-slate-400 font-bold text-[11px] block mb-1">
                  Pen Size: {penWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={penWidth}
                  onChange={(e) => setPenWidth(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            )}

            {activeTool === "highlighter" && (
              <div>
                <label className="text-slate-400 font-bold text-[11px] block mb-1">
                  Highlighter Size: {highlighterWidth}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="40"
                  value={highlighterWidth}
                  onChange={(e) => setHighlighterWidth(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            )}

            {activeTool === "text" && (
              <div>
                <label className="text-slate-400 font-bold text-[11px] block mb-1">
                  Font Size: {textSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="36"
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            )}
          </div>

          {/* History Controls */}
          <div className="hidden sm:block space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Actions
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleUndo}
                disabled={!(historyStack[currentPage] && historyStack[currentPage].length > 0)}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition"
                title="Undo stroke"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={!(redoStack[currentPage] && redoStack[currentPage].length > 0)}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition"
                title="Redo stroke"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo</span>
              </button>
            </div>

            <button
              onClick={handleClearPage}
              className="w-full py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Page</span>
            </button>
          </div>

          <div className="mt-auto pt-4 text-[10px] text-slate-500 hidden sm:block">
            <div className="flex items-center space-x-1 text-emerald-400 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% In-Browser</span>
            </div>
            Drawings & notes stay private in your local browser cache.
          </div>
        </aside>

        {/* Central Canvas Workspace Area */}
        <main
          ref={containerRef}
          className="flex-1 bg-slate-950 overflow-auto p-4 sm:p-8 flex flex-col items-center relative"
        >
          {loading ? (
            <div className="my-auto text-center space-y-3 p-8">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-300">{loadingMessage}</p>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-xl overflow-hidden bg-white group select-none">
              
              {/* PDF Renderer Canvas */}
              <canvas ref={pdfCanvasRef} className="block" />

              {/* Drawing Annotation Layer Overlay Canvas */}
              <canvas
                ref={drawingCanvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`absolute inset-0 z-10 ${
                  activeTool === "pen" || activeTool === "highlighter"
                    ? "cursor-crosshair"
                    : activeTool === "sticky"
                    ? "cursor-copy"
                    : activeTool === "text"
                    ? "cursor-text"
                    : activeTool === "eraser"
                    ? "cursor-pointer"
                    : "cursor-default"
                }`}
              />

              {/* Typed Text Input Overlay Popup */}
              {activeTextInput && (
                <div
                  style={{ left: activeTextInput.x, top: activeTextInput.y }}
                  className="absolute z-30 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl flex items-center space-x-2 animate-in zoom-in-95"
                >
                  <input
                    type="text"
                    autoFocus
                    value={typedTextValue}
                    onChange={(e) => setTypedTextValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmTextAnnotation();
                      if (e.key === "Escape") setActiveTextInput(null);
                    }}
                    placeholder="Type text note..."
                    style={{ color: selectedColor === "#facc15" ? "#ffffff" : selectedColor, fontSize: `${textSize}px` }}
                    className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-600 focus:outline-none focus:border-amber-500 font-bold"
                  />
                  <button
                    onClick={handleConfirmTextAnnotation}
                    className="px-2.5 py-1 bg-amber-500 text-white font-bold text-xs rounded-lg hover:bg-amber-600"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setActiveTextInput(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Sticky Notes HTML Overlay Cards */}
              {currentPageAnn.stickyNotes.map((note) => (
                <div
                  key={note.id}
                  style={{ left: note.x, top: note.y }}
                  className="absolute z-20 w-48 bg-amber-100 border-2 border-amber-300 rounded-xl p-2.5 shadow-xl text-slate-900 space-y-1.5 animate-in zoom-in-95"
                >
                  <div className="flex items-center justify-between text-[10px] font-black text-amber-900 border-b border-amber-200/80 pb-1">
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 text-amber-700" />
                      <span>{note.author}</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] text-amber-700">{note.timestamp}</span>
                      <button
                        onClick={() => handleDeleteStickyNote(note.id)}
                        className="text-amber-800 hover:text-rose-600 p-0.5 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={note.text}
                    onChange={(e) => handleUpdateStickyNote(note.id, e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none resize-none leading-snug"
                    placeholder="Type sticky comment..."
                  />
                </div>
              ))}

            </div>
          )}
        </main>
      </div>

      {/* Footer Navigation & Zoom Bar */}
      <footer className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-between shrink-0 z-20">
        
        {/* Page Pagination */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-300">
            Page {currentPage} of {numPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages || loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

      </footer>
    </div>
  );
};
