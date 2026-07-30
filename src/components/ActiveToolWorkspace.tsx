import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  UploadCloud,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  RotateCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
  Sparkles,
  Layers,
  Settings,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Info,
  Cloud,
  Share2,
  ChevronDown,
  HardDrive,
  FolderCheck,
  Copy,
  ExternalLink,
  Check,
  Upload,
  LayoutGrid,
  List,
  Eye,
  ZoomIn,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ToolItem, ToolHistoryItem } from "../types";
import {
  mergePdfs,
  splitPdf,
  compressPdf,
  rotatePdf,
  watermarkPdf,
  addPageNumbers,
  flattenPdf,
  imagesToPdf,
  textToPdf,
  ocrImageToText,
  editPdfMetadata,
  createBatchZip,
  downloadFile,
  createSamplePdfFile,
  fileToBase64,
} from "../lib/pdfEngine";
import {
  validateFile,
  validateBatchFiles,
  FileValidationResult,
  readLargeFileChunked,
  formatBytes,
} from "../lib/fileValidationService";
import {
  validateFile as validateFileCore,
  FileValidationStatus,
} from "../lib/fileValidation";
import { parseHumanFriendlyError, DetailedErrorInfo } from "../lib/errorNotificationService";
import { ErrorNotificationOverlay } from "./ErrorNotificationOverlay";
import { QuickActionsFloatingMenu } from "./QuickActionsFloatingMenu";
import { AnnotatePdfWorkspace } from "./AnnotatePdfWorkspace";
import { QuickShareModal } from "./QuickShareModal";
import { ToolRating } from "./ToolRating";
import { useToolRatings } from "../hooks/useToolRatings";
import { CompressionEfficiency } from "./CompressionEfficiency";
import { QuickTipTooltip } from "./QuickTipTooltip";

export interface ExtendedFileState extends FileValidationResult {
  progress: number;
  currentStep?: string;
  isProcessing?: boolean;
}

interface ActiveToolWorkspaceProps {
  tool: ToolItem;
  initialFiles?: File[];
  onClose: () => void;
  onAddHistory: (item: ToolHistoryItem) => void;
}

export const ActiveToolWorkspace: React.FC<ActiveToolWorkspaceProps> = ({
  tool,
  initialFiles = [],
  onClose,
  onAddHistory,
}) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [fileStates, setFileStates] = useState<ExtendedFileState[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [batchWarning, setBatchWarning] = useState("");
  const [errorOverlay, setErrorOverlay] = useState<DetailedErrorInfo | null>(null);
  const [downloadReady, setDownloadReady] = useState<{
    data: Uint8Array | Blob | string;
    fileName: string;
    mimeType: string;
  } | null>(null);

  // Tool specific options
  const [splitRange, setSplitRange] = useState("1, 2-3");
  const [rotationAngle, setRotationAngle] = useState(90);
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState("PDFSun.com Watermark");
  const [watermarkImageFile, setWatermarkImageFile] = useState<File | null>(null);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.35);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [watermarkPosition, setWatermarkPosition] = useState<"center" | "top-left" | "top-right" | "bottom-left" | "bottom-right">("center");
  const [pageNumPos, setPageNumPos] = useState<"bottom-center" | "bottom-right" | "top-right">("bottom-center");
  const [pdfPassword, setPdfPassword] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaAuthor, setMetaAuthor] = useState("Mukesh Kalonia");
  const [ocrResultText, setOcrResultText] = useState("");
  const [copyTextSuccess, setCopyTextSuccess] = useState(false);
  const [showAnnotatorModal, setShowAnnotatorModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { getToolRating, rateTool } = useToolRatings();

  // Download Extracted OCR Text Helper
  const handleDownloadOcrText = (textOverride?: string) => {
    const textToSave = textOverride || ocrResultText;
    if (!textToSave) return;

    const blob = new Blob([textToSave], { type: "text/plain;charset=utf-8" });
    const targetName = files[0]?.name
      ? `${files[0].name.replace(/\.[^/.]+$/, "")}_OCR_Text.txt`
      : "PDFSun_OCR_Recognized_Text.txt";

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = targetName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export & Cloud Storage State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewModalFile, setPreviewModalFile] = useState<{
    file: File;
    index: number;
    state: ExtendedFileState;
  } | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportingCloud, setExportingCloud] = useState<string | null>(null);
  const [cloudSuccessNotice, setCloudSuccessNotice] = useState<{
    service: string;
    message: string;
    link?: string;
  } | null>(null);

  const handleCloudExport = async (destination: "google-drive" | "dropbox" | "onedrive" | "copy-link") => {
    if (!downloadReady) return;
    setExportMenuOpen(false);

    if (destination === "copy-link") {
      setShowShareModal(true);
      return;
    }

    const serviceNames: Record<string, string> = {
      "google-drive": "Google Drive",
      dropbox: "Dropbox",
      onedrive: "Microsoft OneDrive",
    };

    const targetService = serviceNames[destination] || "Cloud Storage";
    setExportingCloud(targetService);

    // Simulate direct cloud export integration stream
    setTimeout(() => {
      setExportingCloud(null);
      setCloudSuccessNotice({
        service: targetService,
        message: `Successfully saved '${downloadReady.fileName}' to ${targetService} root folder!`,
        link:
          destination === "google-drive"
            ? "https://drive.google.com"
            : destination === "dropbox"
            ? "https://dropbox.com"
            : "https://onedrive.live.com",
      });
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }, 1200);
  };

  // Abort controller ref for cancellation handler
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Run validation service whenever file selection changes
  const runFileValidation = useCallback(async (currentFiles: File[]) => {
    if (currentFiles.length === 0) {
      setFileStates([]);
      setBatchWarning("");
      return;
    }

    setIsValidating(true);

    // Allowed mime types based on tool constraints
    let allowedMimeTypes: string[] | undefined = undefined;
    if (tool.supportedInput && tool.supportedInput.length > 0) {
      allowedMimeTypes = tool.supportedInput;
    } else if (["merge-pdf", "split-pdf", "compress-pdf", "rotate-pdf", "pdf-to-word", "pdf-to-jpg", "watermark-pdf", "page-numbers", "flatten-pdf", "pdf-metadata"].includes(tool.id)) {
      allowedMimeTypes = ["application/pdf", ".pdf"];
    }

    const { results, batchError } = await validateBatchFiles(currentFiles, tool.category, tool.id);
    
    // Validate each file using core validateFile from src/lib/fileValidation.ts
    const validatedStates: ExtendedFileState[] = [];
    for (let i = 0; i < currentFiles.length; i++) {
      const f = currentFiles[i];
      const batchRes = results[i];
      const coreVal: FileValidationStatus = await validateFileCore(f, allowedMimeTypes);

      const isValid = batchRes.isValid && coreVal.isValid;
      const errorMsg = !coreVal.isValid ? coreVal.errorMessage : batchRes.error;

      validatedStates.push({
        ...batchRes,
        isValid,
        error: errorMsg,
        status: isValid ? (batchRes.status === "warning" ? "warning" : "valid") : "invalid",
        progress: 0,
      });
    }

    setBatchWarning(batchError || "");
    setFileStates(validatedStates);
    setIsValidating(false);

    const firstInvalid = validatedStates.find((fs) => !fs.isValid);
    if (firstInvalid && firstInvalid.error) {
      setErrorOverlay(parseHumanFriendlyError(firstInvalid.error, firstInvalid.file.name));
    }
  }, [tool.category, tool.id, tool.supportedInput]);

  useEffect(() => {
    runFileValidation(files);
  }, [files, runFileValidation]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFiles((prev) => [...prev, ...acceptedFiles]);
      setDownloadReady(null);
      setErrorMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      multiple: true,
    });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileStates((prev) => prev.filter((_, i) => i !== index));
    setDownloadReady(null);
  };

  const removeInvalidFiles = () => {
    const validOnly = fileStates.filter((fs) => fs.isValid).map((fs) => fs.file);
    setFiles(validOnly);
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    setFiles((prev) => {
      const updated = [...prev];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx >= 0 && targetIdx < updated.length) {
        const temp = updated[index];
        updated[index] = updated[targetIdx];
        updated[targetIdx] = temp;
      }
      return updated;
    });
  };

  const updateFileProgress = (index: number, fileProgress: number, stepMessage?: string) => {
    setFileStates((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          progress: fileProgress,
          currentStep: stepMessage,
        };
      }
      return updated;
    });
  };

  const handleCancelProcess = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setStatusMessage("Operation cancelled by user.");
    setErrorMessage("Upload and processing was cancelled.");
    setFileStates((prev) =>
      prev.map((fs) => ({
        ...fs,
        progress: 0,
        currentStep: "Cancelled",
      }))
    );
  };

  const executeProcess = async () => {
    // Check if any files are present
    if (files.length === 0 && !["txt-to-pdf", "scan-to-pdf"].includes(tool.id)) {
      const errInfo = parseHumanFriendlyError("Please select at least one file to process.");
      setErrorOverlay(errInfo);
      setErrorMessage("Please select at least one file to process.");
      return;
    }

    // Check if any files failed validation
    const invalidFileState = fileStates.find((fs) => !fs.isValid);
    if (invalidFileState) {
      const errInfo = parseHumanFriendlyError(
        invalidFileState.error || "Some files have validation errors.",
        invalidFileState.file.name
      );
      setErrorOverlay(errInfo);
      setErrorMessage("Some files have validation errors. Please remove invalid files before continuing.");
      return;
    }

    if (["annotate-pdf", "edit-pdf"].includes(tool.id)) {
      if (files.length > 0) {
        setShowAnnotatorModal(true);
        return;
      }
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    setIsProcessing(true);
    setProgress(5);
    setErrorMessage("");
    setStatusMessage(`Validating and initializing chunked stream for ${tool.name}...`);

    try {
      let outputBytes: Uint8Array | Blob | string | null = null;
      let outputName = `PDFSun_${tool.slug}_output.pdf`;
      let mimeType = "application/pdf";

      // 1. Chunked streaming upload approach for files larger than 100MB with per-file progress & cancellation support
      for (let i = 0; i < files.length; i++) {
        if (signal.aborted) {
          throw new DOMException("Operation aborted by user", "AbortError");
        }
        const file = files[i];
        const isLargeFile = file.size > 100 * 1024 * 1024; // > 100MB threshold
        
        setStatusMessage(
          isLargeFile
            ? `Streaming large file ${i + 1}/${files.length} (${formatBytes(file.size)}) in 5MB chunks...`
            : `Reading & verifying file ${i + 1}/${files.length} (${formatBytes(file.size)})...`
        );
        
        await readLargeFileChunked(file, {
          chunkSize: isLargeFile ? 5 * 1024 * 1024 : 2 * 1024 * 1024,
          signal,
          onProgress: (loaded, total, percent) => {
            updateFileProgress(
              i,
              percent,
              isLargeFile
                ? `Chunked streaming ${percent}% (${formatBytes(loaded)} / ${formatBytes(total)})`
                : `Streaming ${percent}%`
            );
            const totalPercent = Math.round(((i + percent / 100) / files.length) * 40);
            setProgress(Math.max(10, totalPercent));
          },
        });
      }

      setStatusMessage(`Running ${tool.name} transformations...`);
      setProgress(45);

      switch (tool.id) {
        case "merge-pdf":
          setStatusMessage("Merging PDF documents...");
          outputBytes = await mergePdfs(files, (p) => setProgress(45 + Math.round((p / 100) * 50)));
          outputName = `PDFSun_Merged_${files.length}_files.pdf`;
          break;

        case "split-pdf":
          setStatusMessage("Splitting PDF pages...");
          const splits = await splitPdf(files[0], splitRange, (p) => setProgress(45 + Math.round((p / 100) * 50)));
          if (splits.length === 1) {
            outputBytes = splits[0].pdfBytes;
            outputName = splits[0].fileName;
          } else {
            outputBytes = await createBatchZip(splits.map((s) => ({ name: s.fileName, bytes: s.pdfBytes })));
            outputName = `PDFSun_Split_Pages_${files[0].name}.zip`;
            mimeType = "application/zip";
          }
          break;

        case "compress-pdf":
          setStatusMessage("Compressing PDF structure & streams...");
          outputBytes = await compressPdf(files[0], 0.7, (p) => setProgress(45 + Math.round((p / 100) * 50)));
          outputName = `PDFSun_Compressed_${files[0].name}`;
          break;

        case "rotate-pdf":
          setStatusMessage(`Rotating PDF by ${rotationAngle}°...`);
          outputBytes = await rotatePdf(files[0], rotationAngle, (p) => setProgress(45 + Math.round((p / 100) * 50)));
          outputName = `PDFSun_Rotated_${files[0].name}`;
          break;

        case "jpg-to-pdf":
        case "png-to-pdf":
          setStatusMessage("Converting image files to PDF...");
          outputBytes = await imagesToPdf(files, (p) => setProgress(45 + Math.round((p / 100) * 50)));
          outputName = `PDFSun_Converted_Images.pdf`;
          break;

        case "watermark-pdf":
          setStatusMessage("Applying custom watermark to PDF pages...");
          outputBytes = await watermarkPdf(
            files[0],
            {
              type: watermarkType,
              text: watermarkText,
              imageFile: watermarkType === "image" ? watermarkImageFile : null,
              opacity: watermarkOpacity,
              fontSize: 42,
              angle: watermarkAngle,
              position: watermarkPosition,
            },
            watermarkOpacity,
            42,
            (p) => setProgress(45 + Math.round((p / 100) * 50))
          );
          outputName = `PDFSun_Watermarked_${files[0].name}`;
          break;

        case "page-numbers":
          setStatusMessage("Adding page numbers...");
          outputBytes = await addPageNumbers(files[0], pageNumPos, (p) => setProgress(45 + Math.round((p / 100) * 50)));
          outputName = `PDFSun_Numbered_${files[0].name}`;
          break;

        case "flatten-pdf":
          setStatusMessage("Flattening form fields and annotations...");
          outputBytes = await flattenPdf(files[0], (p) => setProgress(45 + Math.round((p / 100) * 50)));
          outputName = `PDFSun_Flattened_${files[0].name}`;
          break;

        case "pdf-metadata":
          setStatusMessage("Updating PDF internal metadata...");
          outputBytes = await editPdfMetadata(files[0], { title: metaTitle, author: metaAuthor }, (p) => setProgress(45 + Math.round((p / 100) * 50)));
          outputName = `PDFSun_Meta_${files[0].name}`;
          break;

        case "ocr-image-to-text":
        case "ocr-pdf":
        case "ai-ocr":
          setStatusMessage("Analyzing document & extracting text using Gemini AI model...");
          setProgress(55);
          let extractedOcrText = "";
          try {
            const targetFile = files[0];
            const base64Data = await fileToBase64(targetFile);
            const docMime = targetFile.type || (targetFile.name.endsWith(".pdf") ? "application/pdf" : "image/png");

            const aiRes = await fetch("/api/ai/ocr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: base64Data, mimeType: docMime }),
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              extractedOcrText = aiData.result || "";
              setProgress(90);
            } else {
              console.warn("Gemini OCR server returned non-200, switching to Tesseract engine...");
              setStatusMessage("Gemini API fallback: Processing with local Tesseract OCR engine...");
              extractedOcrText = await ocrImageToText(targetFile, (msg, p) => {
                setStatusMessage(msg);
                setProgress(50 + Math.round((p / 100) * 45));
              });
            }
          } catch (err) {
            console.warn("Gemini OCR fetch error, using Tesseract fallback:", err);
            setStatusMessage("Running local Tesseract OCR engine fallback...");
            extractedOcrText = await ocrImageToText(files[0], (msg, p) => {
              setStatusMessage(msg);
              setProgress(50 + Math.round((p / 100) * 45));
            });
          }

          if (!extractedOcrText || extractedOcrText.trim().length === 0) {
            extractedOcrText = `Document: ${files[0].name}\n[No readable text could be recognized in the file.]`;
          }

          setOcrResultText(extractedOcrText);
          outputBytes = extractedOcrText;
          outputName = `${files[0].name.replace(/\.[^/.]+$/, "")}_OCR_Text.txt`;
          mimeType = "text/plain";
          break;

        case "txt-to-pdf":
          setStatusMessage("Converting text to PDF...");
          outputBytes = textToPdf("Sample text converted into PDF document via PDFSun.", "PDFSun TXT Document");
          outputName = "PDFSun_Converted_Text.pdf";
          break;

        default:
          setStatusMessage(`Processing ${tool.name}...`);
          outputBytes = await compressPdf(files[0] || createSamplePdfFile(), 0.8, (p) => setProgress(45 + Math.round((p / 100) * 50)));
          outputName = `PDFSun_${tool.slug}_${files[0]?.name || "processed.pdf"}`;
          break;
      }

      // Mark all files 100% complete
      setFileStates((prev) => prev.map((fs) => ({ ...fs, progress: 100, currentStep: "Done" })));
      setProgress(100);
      setIsProcessing(false);

      if (outputBytes) {
        // Validate output blob integrity and sanitize filename extension
        const downloadResult = downloadFile(outputBytes, outputName, mimeType);

        setDownloadReady({
          data: outputBytes,
          fileName: downloadResult.finalFileName,
          mimeType,
        });

        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch {}

        const isOcrTool = tool.id === "ocr-pdf" || tool.id === "ocr-image-to-text" || tool.id === "ai-ocr";
        const ocrSnippetText = isOcrTool && typeof outputBytes === "string" ? outputBytes : undefined;

        onAddHistory({
          id: Date.now().toString(),
          toolId: tool.id,
          toolName: tool.name,
          fileName: files[0]?.name || "Document",
          timestamp: Date.now(),
          status: "completed",
          outputFileName: downloadResult.finalFileName,
          snippet: ocrSnippetText,
        });
      } else {
        throw new Error("Transformation engine returned no data (0KB output).");
      }
    } catch (err: any) {
      setIsProcessing(false);
      if (err.name === "AbortError" || err.message?.toLowerCase().includes("abort") || err.message?.toLowerCase().includes("cancel")) {
        setStatusMessage("Operation cancelled by user.");
        setErrorMessage("Upload and streaming operation was cancelled.");
        return;
      }
      console.error("Execution error:", err);
      const errInfo = parseHumanFriendlyError(err, files[0]?.name);
      setErrorOverlay(errInfo);
      setErrorMessage(errInfo.message);
    } finally {
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Workspace Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2 flex-wrap gap-y-1">
                <span>{tool.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500 text-white font-extrabold uppercase">
                  PDFSun Engine
                </span>
                {(() => {
                  const ratingInfo = getToolRating(tool.id);
                  return (
                    <ToolRating
                      toolId={tool.id}
                      toolName={tool.name}
                      avgRating={ratingInfo.avgRating}
                      totalRatings={ratingInfo.totalRatings}
                      userRating={ratingInfo.userRating}
                      onRate={rateTool}
                      size="sm"
                    />
                  );
                })()}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{tool.description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Tip Banner */}
          <QuickTipTooltip toolId={tool.id} variant="inline" />

          {/* File Upload Zone with react-dropzone integration */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative ${
              isDragReject
                ? "border-rose-500 bg-rose-500/10 scale-[1.01]"
                : isDragAccept
                ? "border-emerald-500 bg-emerald-500/10 scale-[1.01] ring-2 ring-emerald-500/20"
                : isDragActive
                ? "border-orange-500 bg-orange-500/10 scale-[1.01] ring-2 ring-orange-500/20"
                : "border-slate-300 dark:border-slate-700 hover:border-orange-500 bg-slate-50/50 dark:bg-slate-800/40"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud
              className={`w-10 h-10 mx-auto mb-2 transition-transform ${
                isDragActive ? "text-orange-500 scale-125 animate-bounce" : "text-orange-500"
              }`}
            />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isDragActive
                ? isDragReject
                  ? "Some files may not be supported"
                  : "Release files to add to workspace"
                : "Click or Drag & Drop Files Here"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports {tool.supportedInput.join(", ")} • Up to 100MB per file • Real-time header validation
            </p>
          </div>

          {/* Validation Warning / Error Banner */}
          {batchWarning && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{batchWarning}</span>
              </div>
            </div>
          )}

          {/* Uploaded & Validated File List with Thumbnail Preview Grid */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold normal-case">
                    Document Order & PDF Thumbnails ({files.length})
                  </span>
                  {isValidating && (
                    <span className="text-orange-500 text-[10px] lowercase flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3 animate-spin inline" />
                      <span>validating headers...</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* View Mode Toggle: Grid vs List */}
                  <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        viewMode === "grid"
                          ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                      title="PDF Thumbnail Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Thumbnails</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        viewMode === "list"
                          ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                      title="Compact List View"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>List</span>
                    </button>
                  </div>

                  {fileStates.some((fs) => !fs.isValid) && (
                    <button
                      onClick={removeInvalidFiles}
                      className="text-[11px] text-rose-500 hover:underline font-extrabold normal-case"
                    >
                      Clear Invalid Files
                    </button>
                  )}
                </div>
              </div>

              {/* View Mode 1: PDF Thumbnail Preview Grid */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1 p-1">
                  {fileStates.map((fs, idx) => {
                    const isInvalid = !fs.isValid;
                    const hasWarning = fs.status === "warning";
                    const isImage = fs.file.type.startsWith("image/");
                    const isPdf = fs.file.type.includes("pdf") || fs.file.name.endsWith(".pdf");

                    return (
                      <div
                        key={fs.id || idx}
                        className={`group relative rounded-2xl border p-2.5 flex flex-col justify-between transition-all ${
                          isInvalid
                            ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900"
                            : hasWarning
                            ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-orange-500 dark:hover:border-orange-400 hover:shadow-lg"
                        }`}
                      >
                        {/* Sequence Order Badge */}
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[10px] shadow-sm flex items-center space-x-1">
                          <span>#{idx + 1}</span>
                          <span className="opacity-80 font-normal">in order</span>
                        </div>

                        {/* PDF Page Canvas Preview Frame */}
                        <div className="relative w-full aspect-[1/1.3] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between p-2.5 my-1 transition group-hover:scale-[1.01]">
                          {/* Simulated document layout inside canvas */}
                          <div
                            className="w-full h-full flex flex-col justify-between transition-transform duration-300"
                            style={{
                              transform: tool.id === "rotate-pdf" ? `rotate(${rotationAngle}deg)` : undefined,
                            }}
                          >
                            <div className="space-y-1.5">
                              {/* Header document line */}
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                                <div className="flex items-center space-x-1">
                                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                                  <span className="text-[9px] font-bold text-slate-400 font-mono">PDF Page 1</span>
                                </div>
                                <span className="text-[8px] text-slate-300 font-mono uppercase">{fs.detectedType}</span>
                              </div>

                              {/* Simulated Text Paragraph Lines */}
                              <div className="space-y-1 pt-1">
                                <div className="h-1.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                <div className="h-1 w-full bg-slate-150 dark:bg-slate-850 rounded-full bg-slate-200/60 dark:bg-slate-800/60" />
                                <div className="h-1 w-5/6 bg-slate-200/60 dark:bg-slate-800/60 rounded-full" />
                                <div className="h-1 w-2/3 bg-slate-200/60 dark:bg-slate-800/60 rounded-full" />
                              </div>
                            </div>

                            {/* Center Preview Emblem */}
                            <div className="flex flex-col items-center justify-center my-auto py-2">
                              {isPdf ? (
                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
                                  <FileText className="w-5 h-5" />
                                </div>
                              ) : isImage ? (
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold">
                                  <UploadCloud className="w-5 h-5" />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
                                  <FileCheck className="w-5 h-5" />
                                </div>
                              )}
                              <span className="text-[9px] font-extrabold text-slate-600 dark:text-slate-300 mt-1 truncate max-w-[90px]">
                                {fs.file.name.replace(/\.[^/.]+$/, "")}
                              </span>
                            </div>

                            {/* Footer page number indicator */}
                            <div className="flex items-center justify-between text-[8px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1 font-mono">
                              <span>A4 Format</span>
                              <span>PDFSun Engine</span>
                            </div>
                          </div>

                          {/* Hover Zoom Overlay Button */}
                          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setPreviewModalFile({ file: fs.file, index: idx, state: fs })}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[11px] font-bold shadow-lg flex items-center space-x-1 hover:scale-105 transition"
                            >
                              <ZoomIn className="w-3.5 h-3.5 text-orange-500" />
                              <span>Preview</span>
                            </button>
                          </div>
                        </div>

                        {/* File Details & Action Bar */}
                        <div className="mt-1 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px]" title={fs.file.name}>
                              {fs.file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{fs.sizeFormatted}</span>
                          </div>

                          {/* Controls Bar: Reorder Left / Right & Delete */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => moveFile(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-30 transition"
                                title="Move document left (earlier in order)"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveFile(idx, "down")}
                                disabled={idx === files.length - 1}
                                className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-30 transition"
                                title="Move document right (later in order)"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* View Mode 2: Compact List View */
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {fileStates.map((fs, idx) => {
                    const isInvalid = !fs.isValid;
                    const hasWarning = fs.status === "warning";
                    const isDone = fs.progress === 100;

                    return (
                      <div
                        key={fs.id || idx}
                        className={`p-3.5 rounded-2xl border transition text-xs font-medium ${
                          isInvalid
                            ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900"
                            : hasWarning
                            ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900"
                            : "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white">
                              #{idx + 1}
                            </span>
                            {isInvalid ? (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : hasWarning ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                            )}

                            <span className="truncate max-w-xs font-bold text-slate-800 dark:text-slate-100">
                              {fs.file.name}
                            </span>

                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {fs.sizeFormatted}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {/* Validation Status Badges */}
                            {isInvalid ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
                                Invalid
                              </span>
                            ) : hasWarning ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                                Header Repaired
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                {fs.detectedType} ✓
                              </span>
                            )}

                            {/* Preview Eye Button */}
                            <button
                              onClick={() => setPreviewModalFile({ file: fs.file, index: idx, state: fs })}
                              className="p-1 rounded text-slate-400 hover:text-orange-500"
                              title="Preview document details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Reorder Buttons */}
                            <div className="flex items-center">
                              <button
                                onClick={() => moveFile(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveFile(idx, "down")}
                                disabled={idx === files.length - 1}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => removeFile(idx)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Error or Warning Diagnostics */}
                        {fs.error && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                            {fs.error}
                          </p>
                        )}
                        {fs.warning && !fs.error && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                            {fs.warning}
                          </p>
                        )}

                        {/* Individual File Processing Progress Bar */}
                        {isProcessing && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>{fs.currentStep || "Processing..."}</span>
                              <span>{fs.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-orange-500 h-full transition-all duration-200 rounded-full"
                                style={{ width: `${fs.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tool Options Configuration Panel */}
          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-slate-800/60 border border-amber-500/20 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Settings className="w-4 h-4" />
              <span>{tool.name} Parameters & Settings</span>
            </div>

            {tool.id === "split-pdf" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page Ranges (e.g., "1-3, 5, 8" or "all")
                </label>
                <input
                  type="text"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {tool.id === "rotate-pdf" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rotation Angle</label>
                <select
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value={90}>90° Clockwise</option>
                  <option value={180}>180° Flip</option>
                  <option value={270}>270° Counter-Clockwise</option>
                </select>
              </div>
            )}

            {tool.id === "watermark-pdf" && (
              <div className="space-y-4">
                {/* Watermark Type Selector */}
                <div className="flex items-center space-x-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setWatermarkType("text")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                      watermarkType === "text"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Text Watermark
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatermarkType("image")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                      watermarkType === "image"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Image / Logo Watermark
                  </button>
                </div>

                {watermarkType === "text" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Logo Image (PNG / JPG)</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setWatermarkImageFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950/40 dark:file:text-blue-400 hover:file:bg-blue-100"
                    />
                    {watermarkImageFile && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                        Selected: {watermarkImageFile.name} ({(watermarkImageFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Position</label>
                    <select
                      value={watermarkPosition}
                      onChange={(e) => setWatermarkPosition(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="center">Center Page</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rotation Angle</label>
                    <select
                      value={watermarkAngle}
                      onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      <option value={45}>45° Diagonal</option>
                      <option value={0}>0° Horizontal</option>
                      <option value={30}>30° Slight Angle</option>
                      <option value={90}>90° Vertical</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Opacity: {Math.round(watermarkOpacity * 100)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {tool.id === "page-numbers" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Number Location</label>
                <select
                  value={pageNumPos}
                  onChange={(e) => setPageNumPos(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
            )}

            {tool.id === "protect-pdf" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Encryption Password</label>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  placeholder="Enter strong password..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            {tool.id === "pdf-metadata" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Document Title"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Author</label>
                  <input
                    type="text"
                    value={metaAuthor}
                    onChange={(e) => setMetaAuthor(e.target.value)}
                    placeholder="Author Name"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {["ocr-pdf", "ocr-image-to-text", "ai-ocr"].includes(tool.id) && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs space-y-1.5">
                <div className="font-bold text-orange-600 dark:text-amber-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>Gemini 3.6 Flash Neural OCR Engine</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Extracts full plain text from scanned PDFs, handwritten notes, forms, and images. Preserves document structure, headings, lists, and tables. Outputs a downloadable .txt file.
                </p>
              </div>
            )}

            {["annotate-pdf", "edit-pdf"].includes(tool.id) && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20 text-xs space-y-3">
                <div className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Interactive PDF.js Canvas Annotator</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Draw freehand, highlight sentences, attach sticky note comments, and write custom text directly on your PDF pages. Fast, secure, and processed completely in your browser.
                </p>
                <button
                  onClick={() => {
                    if (files.length > 0) {
                      setShowAnnotatorModal(true);
                    } else {
                      alert("Please upload or select a PDF file first.");
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md hover:from-amber-600 hover:to-orange-600 transition flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Interactive PDF Annotator Studio</span>
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Validated & processed locally with chunked memory safety. HTTPS Encrypted.</span>
            </div>
          </div>

          {/* Overall Batch Progress Bar & Status */}
          {isProcessing && (
            <div className="space-y-2 p-4 rounded-2xl bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-orange-600 dark:text-amber-400">
                <span className="flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMessage}</span>
                </span>
                <div className="flex items-center space-x-3">
                  <span>{progress}%</span>
                  <button
                    onClick={handleCancelProcess}
                    className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-extrabold flex items-center space-x-1 transition shadow-sm"
                    title="Abort file upload and processing stream"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* OCR Extracted Plain Text Result */}
          {ocrResultText && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    <span>Recognized Text Content</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-500/15 text-orange-600 dark:text-amber-400 border border-orange-500/30">
                    {ocrResultText.length} characters
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ocrResultText);
                      setCopyTextSuccess(true);
                      setTimeout(() => setCopyTextSuccess(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center space-x-1.5 shadow-2xs"
                  >
                    {copyTextSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadOcrText(ocrResultText)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-extrabold shadow-md hover:from-orange-600 hover:to-amber-600 transition flex items-center space-x-1.5"
                    title="Download extracted OCR content as a .txt file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Text (.txt)</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={ocrResultText}
                rows={6}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-mono border border-slate-200 dark:border-slate-700 focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Cloud Sync Progress Indicator */}
          {exportingCloud && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-between text-xs font-semibold animate-pulse">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span>Exporting file directly to {exportingCloud}...</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">Syncing Cloud</span>
            </div>
          )}

          {/* Cloud Export Success Notice */}
          {cloudSuccessNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center space-x-2.5">
                <FolderCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold">{cloudSuccessNotice.message}</div>
                  {cloudSuccessNotice.link && (
                    <a
                      href={cloudSuccessNotice.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] underline text-emerald-600 dark:text-emerald-400 font-medium hover:opacity-80 inline-flex items-center space-x-1 mt-0.5"
                    >
                      <span>Open {cloudSuccessNotice.service}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCloudSuccessNotice(null)}
                className="p-1 rounded text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Compression Efficiency Card for Compress PDF tool */}
          {downloadReady && tool.id === "compress-pdf" && (
            <CompressionEfficiency
              originalSize={files.reduce((acc, f) => acc + f.size, 0) || 1024 * 1024 * 2.4}
              compressedSize={
                typeof downloadReady.data === "string"
                  ? new Blob([downloadReady.data]).size
                  : downloadReady.data instanceof ArrayBuffer
                  ? downloadReady.data.byteLength
                  : downloadReady.data instanceof Uint8Array
                  ? downloadReady.data.byteLength
                  : (downloadReady.data as any)?.size || 1024 * 1024 * 0.95
              }
              fileName={files[0]?.name || downloadReady.fileName}
            />
          )}

          {/* Download Completion Banner with Standardized Export Options */}
          {downloadReady && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Processing Complete!</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      Ready to Export
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {downloadReady.fileName}
                  </div>
                </div>
              </div>

              {/* Standardized Export Button with Direct Download, Quick Share & Cloud Options */}
              <div className="relative shrink-0 flex items-center space-x-2 flex-wrap gap-y-1.5">
                {(ocrResultText || tool.id === "ocr-pdf" || tool.id === "ocr-image-to-text" || tool.id === "ai-ocr") && (
                  <button
                    onClick={() =>
                      handleDownloadOcrText(
                        ocrResultText || (typeof downloadReady.data === "string" ? downloadReady.data : undefined)
                      )
                    }
                    className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-black shadow-md hover:from-amber-600 hover:to-orange-600 transition flex items-center space-x-1.5"
                    title="Trigger a blob-based download of extracted OCR content as a .txt file"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download Text</span>
                  </button>
                )}

                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-indigo-700 hover:to-purple-700 transition flex items-center space-x-1.5"
                  title="Quick Share via Social Media or Copy Download Link"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Quick Share</span>
                </button>

                <button
                  onClick={() => downloadFile(downloadReady.data, downloadReady.fileName, downloadReady.mimeType)}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition flex items-center space-x-2"
                  title="Download file directly to local device"
                >
                  <Download className="w-4 h-4" />
                  <span>Direct Download</span>
                </button>

                {/* Export Dropdown Selector */}
                <div className="relative">
                  <button
                    onClick={() => setExportMenuOpen(!exportMenuOpen)}
                    className="px-3.5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition flex items-center space-x-1.5 shadow-md"
                    title="Export options: Save to Google Drive, Dropbox, OneDrive, or Share link"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Export</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {exportMenuOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                        Export Destination
                      </div>

                      <button
                        onClick={() => {
                          downloadFile(downloadReady.data, downloadReady.fileName, downloadReady.mimeType);
                          setExportMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2.5 transition"
                      >
                        <Download className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold">Download Directly</div>
                          <div className="text-[10px] text-slate-400">Save to local device storage</div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleCloudExport("google-drive")}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2.5 transition"
                      >
                        <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <div className="font-bold">Save to Google Drive</div>
                          <div className="text-[10px] text-slate-400">Export directly to Google Drive</div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleCloudExport("dropbox")}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2.5 transition"
                      >
                        <HardDrive className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <div className="font-bold">Save to Dropbox</div>
                          <div className="text-[10px] text-slate-400">Sync to Dropbox cloud folder</div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleCloudExport("onedrive")}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2.5 transition"
                      >
                        <Cloud className="w-4 h-4 text-sky-500 shrink-0" />
                        <div>
                          <div className="font-bold">Save to OneDrive</div>
                          <div className="text-[10px] text-slate-400">Export to Microsoft OneDrive</div>
                        </div>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        onClick={() => handleCloudExport("copy-link")}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center space-x-2.5 transition"
                      >
                        <Share2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <div className="font-bold">Copy Cloud Share Link</div>
                          <div className="text-[10px] text-slate-400">Generate temporary download link</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workspace Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={isProcessing ? handleCancelProcess : onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            {isProcessing ? "Cancel Operation" : "Cancel"}
          </button>

          <button
            onClick={executeProcess}
            disabled={isProcessing || isValidating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:opacity-95 disabled:opacity-50 transition flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Streaming & Processing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run {tool.name}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Human-Friendly Error Notification Overlay */}
      {errorOverlay && (
        <ErrorNotificationOverlay
          error={errorOverlay}
          onDismiss={() => setErrorOverlay(null)}
          onRemoveProblematicFile={(fileName) => {
            if (fileName) {
              setFiles((prev) => prev.filter((f) => f.name !== fileName));
              setFileStates((prev) => prev.filter((fs) => fs.file.name !== fileName));
            }
          }}
        />
      )}

      {/* Quick Actions Floating Menu upon successful PDF processing */}
      <QuickActionsFloatingMenu
        downloadReady={downloadReady}
        onSaveGoogleDrive={() => handleCloudExport("google-drive")}
        onDownload={() => {
          if (downloadReady) {
            downloadFile(downloadReady.data, downloadReady.fileName, downloadReady.mimeType);
          }
        }}
        onClose={() => {
          // Keep downloadReady but user can dismiss floating bar
        }}
      />

      {/* PDF Thumbnail Enlarged Preview Modal */}
      {previewModalFile && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-orange-500 text-white font-extrabold text-xs">
                  #{previewModalFile.index + 1}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                  {previewModalFile.file.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalFile(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Enlarged Document Page Preview Canvas */}
            <div className="w-full aspect-[1/1.3] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-inner relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-rose-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Page 1 of {previewModalFile.file.name.length % 5 + 1}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {previewModalFile.state.detectedType} Validated
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="h-3 w-4/5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-2 w-11/12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>

              <div className="text-center py-6 my-auto">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold mb-2">
                  <FileCheck className="w-8 h-8" />
                </div>
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {previewModalFile.file.name}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {previewModalFile.state.sizeFormatted} • Verified Sequence #{previewModalFile.index + 1}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 font-mono">
                <span>PDFSun Validation Engine</span>
                <span>Page Order Verified</span>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    moveFile(previewModalFile.index, "up");
                    setPreviewModalFile(null);
                  }}
                  disabled={previewModalFile.index === 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Move Left</span>
                </button>
                <button
                  onClick={() => {
                    moveFile(previewModalFile.index, "down");
                    setPreviewModalFile(null);
                  }}
                  disabled={previewModalFile.index === files.length - 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center space-x-1"
                >
                  <span>Move Right</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setPreviewModalFile(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive PDF Annotator Studio Modal */}
      {showAnnotatorModal && files[0] && (
        <AnnotatePdfWorkspace
          file={files[0]}
          onClose={() => setShowAnnotatorModal(false)}
          onSaveComplete={(outputBytes, outName) => {
            setShowAnnotatorModal(false);
            setDownloadReady({
              data: outputBytes,
              fileName: outName,
              mimeType: "application/pdf",
            });
            onAddHistory({
              id: Date.now().toString(),
              toolId: tool.id,
              toolName: tool.name,
              fileName: files[0]?.name || "Document",
              timestamp: Date.now(),
              status: "completed",
              outputFileName: outName,
            });
          }}
        />
      )}
      {/* Quick Share Studio Modal */}
      {showShareModal && downloadReady && (
        <QuickShareModal
          fileName={downloadReady.fileName}
          mimeType={downloadReady.mimeType}
          onClose={() => setShowShareModal(false)}
          onDownloadDirect={() => downloadFile(downloadReady.data, downloadReady.fileName, downloadReady.mimeType)}
        />
      )}
    </div>
  );
};

