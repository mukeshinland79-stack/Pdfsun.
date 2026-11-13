import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  FileText,
  RefreshCw,
  ZoomIn,
  RotateCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  Sparkles,
  Maximize2,
  Lock,
} from "lucide-react";

// Ensure PDF.js worker is registered
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

export interface PdfDocumentMeta {
  pageCount: number;
  width: number;
  height: number;
  pageSizeName: string;
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  isEncrypted?: boolean;
}

export interface PdfPreviewCanvasProps {
  file: File | Blob | ArrayBuffer | Uint8Array | null | undefined;
  pageNumber?: number;
  rotation?: number;
  maxDimension?: number;
  className?: string;
  canvasClassName?: string;
  interactive?: boolean;
  showControls?: boolean;
  showMetadata?: boolean;
  showPageNavigation?: boolean;
  onPageChange?: (newPage: number, totalPages: number) => void;
  onRotate?: (newRotation: number) => void;
  onPreviewClick?: (meta: PdfDocumentMeta | null) => void;
  onLoaded?: (meta: PdfDocumentMeta) => void;
  onError?: (err: any) => void;
  fallbackIcon?: React.ReactNode;
  aspectRatio?: string;
}

export const PdfPreviewCanvas: React.FC<PdfPreviewCanvasProps> = ({
  file,
  pageNumber = 1,
  rotation = 0,
  maxDimension = 420,
  className = "",
  canvasClassName = "",
  interactive = true,
  showControls = true,
  showMetadata = true,
  showPageNavigation = true,
  onPageChange,
  onRotate,
  onPreviewClick,
  onLoaded,
  onError,
  fallbackIcon,
  aspectRatio = "aspect-[1/1.3]",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(pageNumber);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [localRotation, setLocalRotation] = useState<number>(rotation);
  const [documentMeta, setDocumentMeta] = useState<PdfDocumentMeta | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [isImageFile, setIsImageFile] = useState<boolean>(false);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);

  // Sync external props changes
  useEffect(() => {
    setCurrentPage(pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    setLocalRotation(rotation);
  }, [rotation]);

  // Determine standard paper size name
  const getPaperSizeName = (ptWidth: number, ptHeight: number): string => {
    if (
      (ptWidth >= 590 && ptWidth <= 600 && ptHeight >= 835 && ptHeight <= 845) ||
      (ptHeight >= 590 && ptHeight <= 600 && ptWidth >= 835 && ptWidth <= 845)
    ) {
      return "A4 (210×297 mm)";
    }
    if (
      (ptWidth >= 605 && ptWidth <= 620 && ptHeight >= 785 && ptHeight <= 800) ||
      (ptHeight >= 605 && ptHeight <= 620 && ptWidth >= 785 && ptWidth <= 800)
    ) {
      return "US Letter (8.5×11 in)";
    }
    if (
      (ptWidth >= 605 && ptWidth <= 620 && ptHeight >= 1000 && ptHeight <= 1015) ||
      (ptHeight >= 605 && ptHeight <= 620 && ptWidth >= 1000 && ptWidth <= 1015)
    ) {
      return "US Legal (8.5×14 in)";
    }
    return `${Math.round(ptWidth)}×${Math.round(ptHeight)} pt`;
  };

  // Main load and render pipeline
  const renderPdfPage = useCallback(
    async (pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, rotDeg: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Cancel previous in-flight render task to prevent canvas corruption
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancellation exceptions
        }
        renderTaskRef.current = null;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const safePageNum = Math.max(1, Math.min(pageNum, pdfDoc.numPages));
        const page = await pdfDoc.getPage(safePageNum);

        // Calculate scaling
        const originalViewport = page.getViewport({ scale: 1.0, rotation: rotDeg });
        const scaleFactor = Math.min(
          maxDimension / originalViewport.width,
          maxDimension / originalViewport.height,
          1.8
        );

        // Account for high-DPI displays
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const viewport = page.getViewport({ scale: scaleFactor * dpr, rotation: rotDeg });

        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));

        canvas.style.width = `${Math.round(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.round(viewport.height / dpr)}px`;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        // Fill white background for transparent PDF elements
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;
        setIsLoading(false);
      } catch (err: any) {
        if (err?.name === "RenderingCancelledException") {
          return; // Expected when page/file updates quickly
        }
        console.error("PDF page render error:", err);
        setErrorMessage(err?.message || "Failed to render PDF page");
        setIsLoading(false);
        if (onError) onError(err);
      }
    },
    [maxDimension, onError]
  );

  // Load PDF Document upon file change
  useEffect(() => {
    let isCancelled = false;

    // Cleanup previous object URLs
    if (imageObjectUrl) {
      URL.revokeObjectURL(imageObjectUrl);
      setImageObjectUrl(null);
    }

    if (!file) {
      pdfDocRef.current = null;
      setTotalPages(1);
      setCurrentPage(1);
      setDocumentMeta(null);
      setIsLoading(false);
      setErrorMessage(null);
      setIsEncrypted(false);
      setIsImageFile(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // Check if uploaded file is a raster image (JPG, PNG, WebP)
    if (file instanceof File && file.type.startsWith("image/")) {
      setIsImageFile(true);
      const objUrl = URL.createObjectURL(file);
      setImageObjectUrl(objUrl);
      setIsLoading(false);

      const meta: PdfDocumentMeta = {
        pageCount: 1,
        width: 800,
        height: 600,
        pageSizeName: "Raster Image",
        title: file.name,
      };
      setDocumentMeta(meta);
      setTotalPages(1);
      if (onLoaded) onLoaded(meta);
      return;
    }

    setIsImageFile(false);
    setIsLoading(true);
    setErrorMessage(null);

    const loadDocument = async () => {
      try {
        let bufferData: ArrayBuffer;

        if (file instanceof File || file instanceof Blob) {
          bufferData = await file.arrayBuffer();
        } else if (file instanceof Uint8Array) {
          bufferData = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
        } else {
          bufferData = file;
        }

        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          data: bufferData.slice(0),
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/",
          cMapPacked: true,
        });

        loadingTask.onPassword = () => {
          setIsEncrypted(true);
          setErrorMessage("This PDF is password-protected.");
        };

        const pdfDoc = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = pdfDoc;
        const total = pdfDoc.numPages;
        setTotalPages(total);
        setIsEncrypted(false);

        // Extract metadata
        let docTitle = "";
        let docAuthor = "";
        let docCreator = "";
        let docProducer = "";

        try {
          const meta = await pdfDoc.getMetadata();
          if (meta?.info) {
            const info = meta.info as any;
            docTitle = info.Title || (file instanceof File ? file.name : "");
            docAuthor = info.Author || "";
            docCreator = info.Creator || "";
            docProducer = info.Producer || "";
          }
        } catch {
          // ignore metadata failure
        }

        // Get 1st page viewport info
        const firstPage = await pdfDoc.getPage(1);
        const originalViewport = firstPage.getViewport({ scale: 1.0 });
        const ptWidth = Math.round(originalViewport.width);
        const ptHeight = Math.round(originalViewport.height);
        const sizeName = getPaperSizeName(ptWidth, ptHeight);

        const summary: PdfDocumentMeta = {
          pageCount: total,
          width: ptWidth,
          height: ptHeight,
          pageSizeName: sizeName,
          title: docTitle || (file instanceof File ? file.name : undefined),
          author: docAuthor,
          creator: docCreator,
          producer: docProducer,
        };

        setDocumentMeta(summary);
        if (onLoaded) onLoaded(summary);

        await renderPdfPage(pdfDoc, currentPage, localRotation);
      } catch (err: any) {
        if (isCancelled) return;
        console.error("PDF loading error:", err);
        setErrorMessage(err?.message || "Could not parse or render PDF");
        setIsLoading(false);
        if (onError) onError(err);
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [file]);

  // Handle Page navigation or rotation adjustments on loaded document
  useEffect(() => {
    if (pdfDocRef.current && !isImageFile) {
      renderPdfPage(pdfDocRef.current, currentPage, localRotation);
    }
  }, [currentPage, localRotation, renderPdfPage, isImageFile]);

  // Interaction handlers
  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      if (onPageChange) onPageChange(next, totalPages);
    }
  };

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      if (onPageChange) onPageChange(prev, totalPages);
    }
  };

  const handleRotateRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRot = (localRotation + 90) % 360;
    setLocalRotation(nextRot);
    if (onRotate) onRotate(nextRot);
  };

  const handleRotateLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRot = (localRotation + 270) % 360;
    setLocalRotation(nextRot);
    if (onRotate) onRotate(nextRot);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPreviewClick && onPreviewClick(documentMeta)}
      className={`group relative flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-all overflow-hidden ${
        interactive ? "cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md" : ""
      } ${aspectRatio} ${className}`}
    >
      {/* Background document canvas or image */}
      <div className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden">
        {isImageFile && imageObjectUrl ? (
          <img
            src={imageObjectUrl}
            alt="Uploaded Preview"
            style={{ transform: `rotate(${localRotation}deg)` }}
            className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 pointer-events-none"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 pointer-events-none ${canvasClassName}`}
          />
        )}

        {/* Loading Spinner Skeleton Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 z-10 animate-in fade-in">
            <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 font-mono">
              Rendering Preview...
            </span>
          </div>
        )}

        {/* Error or Password Overlay */}
        {errorMessage && !isLoading && (
          <div className="absolute inset-0 bg-slate-900/90 text-white p-4 flex flex-col items-center justify-center text-center space-y-2 z-10 animate-in fade-in">
            {isEncrypted ? (
              <Lock className="w-8 h-8 text-amber-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-400" />
            )}
            <div className="text-xs font-bold">{isEncrypted ? "Password Protected" : "Preview Unavailable"}</div>
            <p className="text-[10px] text-slate-300 max-w-xs">{errorMessage}</p>
          </div>
        )}

        {/* Empty Fallback when no file is loaded */}
        {!file && !isLoading && (
          <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 p-4">
            {fallbackIcon || (
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No document uploaded
            </span>
          </div>
        )}
      </div>

      {/* Top Metadata Badges */}
      {showMetadata && file && !errorMessage && (
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
          <span className="px-2 py-0.5 rounded-lg bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold font-mono shadow-xs flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-orange-400 shrink-0" />
            <span>Page {currentPage} of {totalPages}</span>
          </span>

          {documentMeta?.pageSizeName && (
            <span className="px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs text-slate-700 dark:text-slate-200 text-[10px] font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-xs truncate max-w-[120px]">
              {documentMeta.pageSizeName}
            </span>
          )}
        </div>
      )}

      {/* Interactive Hover Controls Overlay */}
      {interactive && showControls && file && !isLoading && !errorMessage && (
        <div
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-200 flex flex-col justify-between p-3 z-30 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Top action row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleRotateLeft}
                className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-orange-500 shadow-sm transition transform hover:scale-105"
                title="Rotate Left 90°"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRotateRight}
                className="p-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-orange-500 shadow-sm transition transform hover:scale-105"
                title="Rotate Right 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onPreviewClick && onPreviewClick(documentMeta)}
              className="px-2.5 py-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-extrabold shadow-sm transition flex items-center space-x-1"
              title="Click to expand inspection view"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Inspect</span>
            </button>
          </div>

          {/* Center clickable zoom cue */}
          <div className="flex items-center justify-center my-auto">
            <div className="px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-bold backdrop-blur-xs flex items-center space-x-1.5 shadow-lg">
              <ZoomIn className="w-4 h-4 text-orange-400" />
              <span>Click to Enlarge</span>
            </div>
          </div>

          {/* Bottom Page Navigation Buttons (if multi-page document) */}
          {showPageNavigation && totalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-900/85 backdrop-blur-xs rounded-xl p-1 text-white text-[11px]">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono font-bold px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default PdfPreviewCanvas;
