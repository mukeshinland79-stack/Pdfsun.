import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import {
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  X,
  Download,
  UploadCloud,
  FileText,
  RefreshCw,
  Share2,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Info,
  Shield,
  Printer,
  Copy,
  Edit,
  FileCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { protectPdf, downloadFile } from "../lib/pdfEngine";
import { ToolHistoryItem } from "../types";
import { QuickShareModal } from "./QuickShareModal";
import { triggerErrorToast } from "./GlobalErrorToast";

// Configure PDF.js worker
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
    pdfjsLib.version || "4.10.38"
  }/pdf.worker.min.mjs`;
}

interface ProtectPdfToolProps {
  initialFile?: File | null;
  onClose?: () => void;
  onAddHistory?: (item: ToolHistoryItem) => void;
}

export const ProtectPdfTool: React.FC<ProtectPdfToolProps> = ({
  initialFile = null,
  onClose,
  onAddHistory,
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isRenderingPreview, setIsRenderingPreview] = useState<boolean>(false);

  // Password & Security Settings
  const [userPassword, setUserPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [useOwnerPassword, setUseOwnerPassword] = useState<boolean>(false);
  const [ownerPassword, setOwnerPassword] = useState<string>("");
  const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false);

  // Security Restriction Toggles
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(false);
  const [allowModifying, setAllowModifying] = useState<boolean>(false);
  const [allowAnnotating, setAllowAnnotating] = useState<boolean>(false);

  // Encryption standard
  const [encryptionLevel, setEncryptionLevel] = useState<"AES-256" | "AES-128">("AES-256");

  // Output & Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [downloadReady, setDownloadReady] = useState<{
    data: Uint8Array;
    fileName: string;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Preview canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Page 1 Preview
  const renderPagePreview = useCallback(async (pdfFile: File) => {
    try {
      setIsRenderingPreview(true);
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const renderContext = {
            canvasContext: context,
            viewport,
            canvas,
          };
          await page.render(renderContext).promise;
        }
      }
    } catch (err) {
      console.warn("PDF preview rendering notice:", err);
    } finally {
      setIsRenderingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (file) {
      renderPagePreview(file);
      setDownloadReady(null);
    } else {
      setPageCount(0);
    }
  }, [file, renderPagePreview]);

  // Dropzone Setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf")) {
        setFile(selected);
        setDownloadReady(null);
      } else {
        triggerErrorToast("Invalid File Format", "Please upload a valid PDF document (.pdf).");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  // Calculate Password Strength score (0 to 100)
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "None", color: "bg-slate-300 dark:bg-slate-700" };
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;

    if (score < 40) return { score, label: "Weak", color: "bg-rose-500" };
    if (score < 70) return { score, label: "Medium", color: "bg-amber-500" };
    if (score < 90) return { score, label: "Strong", color: "bg-emerald-500" };
    return { score: 100, label: "Ultra Secure (256-bit)", color: "bg-blue-600" };
  };

  const strength = getPasswordStrength(userPassword);
  const passwordsMatch = userPassword.length > 0 && userPassword === confirmPassword;

  // Execute PDF Encryption
  const handleProtectPdf = async () => {
    if (!file) {
      triggerErrorToast("No PDF Uploaded", "Please select a PDF document first.");
      return;
    }

    if (!userPassword) {
      triggerErrorToast("Password Required", "Please enter a password to protect your PDF.");
      return;
    }

    if (userPassword.length < 4) {
      triggerErrorToast("Password Too Short", "Your password should be at least 4 characters long.");
      return;
    }

    if (userPassword !== confirmPassword) {
      triggerErrorToast("Passwords Do Not Match", "Please ensure the confirmation password matches.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setStatusMessage("Reading document structure...");

      const options = {
        userPassword,
        ownerPassword: useOwnerPassword ? ownerPassword || userPassword : userPassword,
        allowPrinting,
        allowModifying,
        allowCopying,
        allowAnnotating,
      };

      setStatusMessage(`Encrypting PDF pages with ${encryptionLevel} security key...`);
      setProgress(40);

      const protectedBytes = await protectPdf(file, options, (pct) => {
        setProgress(Math.max(40, Math.min(95, pct)));
      });

      const originalBaseName = file.name.replace(/\.[^/.]+$/, "");
      const outputFileName = `${originalBaseName}_protected.pdf`;

      setDownloadReady({
        data: protectedBytes,
        fileName: outputFileName,
      });

      // Add to recent history log
      if (onAddHistory) {
        onAddHistory({
          id: `protect-${Date.now()}`,
          toolId: "protect-pdf",
          toolName: "Protect PDF",
          fileName: outputFileName,
          timestamp: Date.now(),
          status: "completed",
          outputFileName,
        });
      }

      // Celebrate success
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error("Encryption error:", err);
      triggerErrorToast(
        "Encryption Failed",
        err?.message || "An error occurred while encrypting the PDF document."
      );
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleDownload = () => {
    if (!downloadReady) return;
    downloadFile(downloadReady.data, downloadReady.fileName, "application/pdf");
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto transition-all">
      {/* Tool Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Protect PDF Document
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                256-Bit AES
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Encrypt your PDF with strong passwords & permissions right inside your browser.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Work Area */}
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {!file ? (
          /* File Upload Dropzone */
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
              isDragActive
                ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 scale-[0.99]"
                : "border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/30 dark:bg-slate-900/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Drag & drop your PDF file here
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                or click to browse from your device
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono pt-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Client-Side Encryption • Password never leaves your browser</span>
            </div>
          </div>
        ) : (
          /* File Selected & Settings Panel */
          <div className="space-y-6">
            {/* File Info Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-12 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center">
                    <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                    {isRenderingPreview && (
                      <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>{formatSize(file.size)}</span>
                    {pageCount > 0 && <span>• {pageCount} {pageCount === 1 ? "page" : "pages"}</span>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setDownloadReady(null);
                  setUserPassword("");
                  setConfirmPassword("");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 text-xs font-extrabold transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Change File</span>
              </button>
            </div>

            {/* Password Configuration Section */}
            {!downloadReady && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Passwords */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Key className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Password Setup
                      </h3>
                    </div>

                    {/* User Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Set Document Password *</span>
                        {userPassword && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded text-white ${strength.color}`}>
                            {strength.label}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showUserPassword ? "text" : "password"}
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="Enter password..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserPassword(!showUserPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      {userPassword && (
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full transition-all duration-300 ${strength.color}`}
                            style={{ width: `${strength.score}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password..."
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition pr-10 ${
                            confirmPassword && !passwordsMatch
                              ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-slate-900 dark:text-white"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-amber-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {confirmPassword && (
                        <div className="flex items-center space-x-1.5 text-xs pt-0.5">
                          {passwordsMatch ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              <span className="text-rose-500 font-bold">Passwords do not match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Advanced Owner Password Toggle */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useOwnerPassword}
                          onChange={(e) => setUseOwnerPassword(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Set Separate Master / Owner Password
                        </span>
                      </label>

                      {useOwnerPassword && (
                        <div className="mt-3 relative animate-in fade-in">
                          <input
                            type={showOwnerPassword ? "text" : "password"}
                            value={ownerPassword}
                            onChange={(e) => setOwnerPassword(e.target.value)}
                            placeholder="Owner admin password..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Permissions & Restrictions */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Sliders className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Permissions & Encryption Rules
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {/* Printing */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer">
                        <div className="flex items-center space-x-2.5">
                          <Printer className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Allow High-Res Printing
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={allowPrinting}
                          onChange={(e) => setAllowPrinting(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      {/* Content Copying */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer">
                        <div className="flex items-center space-x-2.5">
                          <Copy className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Allow Text & Image Copying
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={allowCopying}
                          onChange={(e) => setAllowCopying(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      {/* Page Modifying */}
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer">
                        <div className="flex items-center space-x-2.5">
                          <Edit className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Allow Document Modifying
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={allowModifying}
                          onChange={(e) => setAllowModifying(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    {/* Encryption Level */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Encryption Standard
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEncryptionLevel("AES-256")}
                          className={`p-2 rounded-xl text-xs font-extrabold border transition ${
                            encryptionLevel === "AES-256"
                              ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          AES 256-Bit (Max)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEncryptionLevel("AES-128")}
                          className={`p-2 rounded-xl text-xs font-extrabold border transition ${
                            encryptionLevel === "AES-128"
                              ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          AES 128-Bit (Standard)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar when processing */}
                {isProcessing && (
                  <div className="space-y-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 animate-pulse">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                      <span>{statusMessage}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Protect Action Button */}
                <button
                  type="button"
                  onClick={handleProtectPdf}
                  disabled={isProcessing || !userPassword || !passwordsMatch}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Encrypting PDF...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Protect & Encrypt PDF Now</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Success / Download Ready State */}
            {downloadReady && (
              <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-6 border border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-3 text-emerald-400 border-b border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      PDF Document Encrypted Successfully!
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Protected with 256-Bit AES encryption • File ready for download
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 hover:brightness-105 transition flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Protected PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="py-3.5 px-6 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold text-sm transition flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>Share Encrypted File</span>
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setDownloadReady(null);
                      setUserPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Encrypt Another File</span>
                  </button>

                  <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>100% Client-Side Privacy Guaranteed</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
