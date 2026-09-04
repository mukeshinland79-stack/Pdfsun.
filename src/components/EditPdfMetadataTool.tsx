import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileSearch,
  UploadCloud,
  FileText,
  Download,
  X,
  CheckCircle2,
  RefreshCw,
  Share2,
  Trash2,
  Info,
  Calendar,
  User,
  BookOpen,
  Tag,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Edit,
  Save,
  Clock,
  HardDrive,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  getPdfMetadata,
  updatePdfMetadata,
  downloadFile,
  PdfMetadataInfo,
} from "../lib/pdfEngine";
import { ToolHistoryItem } from "../types";
import { QuickShareModal } from "./QuickShareModal";
import { ToolSeoThreeSentenceCard } from "./ToolSeoThreeSentenceCard";
import { triggerErrorToast } from "./GlobalErrorToast";

interface EditPdfMetadataToolProps {
  initialFile?: File | null;
  onClose?: () => void;
  onAddHistory?: (item: ToolHistoryItem) => void;
}

export const EditPdfMetadataTool: React.FC<EditPdfMetadataToolProps> = ({
  initialFile = null,
  onClose,
  onAddHistory,
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [originalMetadata, setOriginalMetadata] = useState<PdfMetadataInfo | null>(null);

  // Form Fields for editing
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [creator, setCreator] = useState<string>("");
  const [producer, setProducer] = useState<string>("");

  // State / Execution
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadReady, setDownloadReady] = useState<{
    data: Uint8Array;
    fileName: string;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Load existing metadata on file set
  useEffect(() => {
    let isCancelled = false;

    async function loadMetadata() {
      if (!file) {
        setOriginalMetadata(null);
        setTitle("");
        setAuthor("");
        setSubject("");
        setKeywords("");
        setCreator("");
        setProducer("");
        return;
      }

      try {
        setIsLoadingMetadata(true);
        const meta = await getPdfMetadata(file);

        if (isCancelled) return;

        setOriginalMetadata(meta);
        setTitle(meta.title || "");
        setAuthor(meta.author || "");
        setSubject(meta.subject || "");
        setKeywords(meta.keywords || "");
        setCreator(meta.creator || "");
        setProducer(meta.producer || "PDFSun Metadata Studio");
      } catch (err: any) {
        console.error("Failed to read PDF metadata:", err);
        triggerErrorToast(
          "Metadata Load Failed",
          "Could not parse document properties. Setting standard defaults."
        );
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
        setAuthor("Anonymous");
        setSubject("PDF Document");
        setKeywords("");
        setCreator("PDFSun Application");
        setProducer("PDFSun Engine");
      } finally {
        if (!isCancelled) setIsLoadingMetadata(false);
      }
    }

    loadMetadata();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (selected.type === "application/pdf" || selected.name.endsWith(".pdf")) {
        setFile(selected);
        setDownloadReady(null);
      } else {
        triggerErrorToast("Invalid File", "Please upload a valid PDF file.");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleClearFields = () => {
    setTitle("");
    setAuthor("");
    setSubject("");
    setKeywords("");
    setCreator("");
    setProducer("");
  };

  const handleResetOriginal = () => {
    if (originalMetadata) {
      setTitle(originalMetadata.title || "");
      setAuthor(originalMetadata.author || "");
      setSubject(originalMetadata.subject || "");
      setKeywords(originalMetadata.keywords || "");
      setCreator(originalMetadata.creator || "");
      setProducer(originalMetadata.producer || "");
    }
  };

  const handleSaveMetadata = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);

    try {
      const updatedBytes = await updatePdfMetadata(
        file,
        {
          title,
          author,
          subject,
          keywords,
          creator,
          producer,
        },
        (p) => setProgress(p)
      );

      const outFileName = `PDFSun_Metadata_${file.name}`;
      setDownloadReady({ data: updatedBytes, fileName: outFileName });
      setIsProcessing(false);

      try {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      } catch {}

      if (onAddHistory) {
        onAddHistory({
          id: Date.now().toString(),
          toolId: "pdf-metadata",
          toolName: "View/Edit PDF Metadata",
          fileName: file.name,
          timestamp: Date.now(),
          status: "completed",
          outputFileName: outFileName,
        });
      }
    } catch (err: any) {
      console.error("Metadata save error:", err);
      setIsProcessing(false);
      triggerErrorToast(
        "Save Metadata Failed",
        err.message || "An error occurred while writing new PDF metadata properties."
      );
    }
  };

  const handleDownload = () => {
    if (!downloadReady) return;
    downloadFile(downloadReady.data, downloadReady.fileName, "application/pdf");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                View & Edit PDF Metadata
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                PDF Document Properties
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect and edit internal PDF properties like Title, Author, Subject, Keywords & Producer
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

      {/* Main Studio Area */}
      <div className="p-6">
        {!file ? (
          /* Dropzone */
          <div
            {...getRootProps()}
            className={`p-10 rounded-3xl border-2 border-dashed transition-all text-center cursor-pointer ${
              isDragActive
                ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 scale-[0.99]"
                : "border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              Select or drop a PDF file to view metadata
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Inspect document properties and modify metadata attributes securely in your browser.
            </p>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition shadow-md"
            >
              Browse PDF File
            </button>
          </div>
        ) : (
          /* Workspace layout when file loaded */
          <div className="space-y-6">
            {/* Top Bar: File Info Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-md">
                    {file.name}
                  </p>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    <span>{formatFileSize(file.size)}</span>
                    {originalMetadata?.pageCount && (
                      <span>• {originalMetadata.pageCount} pages</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                  <span>Choose Another File</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                        setDownloadReady(null);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Split Grid: Form Controls (Left) & Read-Only Specs (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Inputs (7 Cols) */}
              <div className="lg:col-span-7 space-y-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div className="flex items-center space-x-2">
                    <Edit className="w-4 h-4 text-blue-500" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Edit Document Properties
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleResetOriginal}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline"
                      title="Restore metadata from original file"
                    >
                      Reset to Original
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={handleClearFields}
                      className="text-[11px] font-bold text-red-500 hover:text-red-600 underline"
                      title="Clear all text fields"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {isLoadingMetadata ? (
                  <div className="py-12 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Reading document metadata headers...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>Title</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Document title</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Annual Financial Review 2026"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    {/* Author */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span>Author</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Creator or organization</span>
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="e.g. Jane Doe / Acme Corp"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-500" />
                          <span>Subject</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Short summary topic</span>
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Corporate Finance & Auditing"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    {/* Keywords */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-500" />
                          <span>Keywords</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Comma-separated</span>
                      </label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="e.g. audit, finance, report, 2026, confidential"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    {/* Creator & Producer (Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                          <Cpu className="w-3.5 h-3.5 text-blue-500" />
                          <span>Creator Application</span>
                        </label>
                        <input
                          type="text"
                          value={creator}
                          onChange={(e) => setCreator(e.target.value)}
                          placeholder="e.g. Adobe InDesign / PDFSun"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          <span>PDF Producer</span>
                        </label>
                        <input
                          type="text"
                          value={producer}
                          onChange={(e) => setProducer(e.target.value)}
                          placeholder="e.g. PDFSun Studio Engine"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={handleSaveMetadata}
                        disabled={isProcessing}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Updating PDF Header ({progress}%)...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save & Update Metadata</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: File Properties & Download (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* File Technical Metadata Summary Card */}
                <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Document Information</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px]">
                      Inspection
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 font-medium">Original Title:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                        {originalMetadata?.title || "Not set"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 font-medium">Original Author:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                        {originalMetadata?.author || "Not set"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 font-medium">Total Page Count:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {originalMetadata?.pageCount || 1} pages
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 font-medium">File Size:</span>
                      <span className="font-mono text-slate-200">
                        {originalMetadata?.fileSize
                          ? formatFileSize(originalMetadata.fileSize)
                          : formatFileSize(file.size)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 font-medium flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Created Date:</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {formatDate(originalMetadata?.creationDate)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 font-medium flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Last Modified:</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {formatDate(originalMetadata?.modificationDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ready to Download Output Box */}
                {downloadReady && (
                  <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-extrabold">Metadata Updated Successfully!</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Internal header properties updated. Download your new PDF file below.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Updated PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowShareModal(true)}
                        className="py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center space-x-1.5"
                      >
                        <Share2 className="w-4 h-4 text-blue-500" />
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
      <ToolSeoThreeSentenceCard toolId="edit-pdf-metadata" toolName="Edit PDF Metadata" />

      {/* Quick Share Modal */}
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
