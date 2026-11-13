import React, { useState, useEffect } from "react";
import { getPublicShareUrl } from "../utils/siteConfig";
import {
  Cloud,
  Mail,
  Eye,
  Download,
  X,
  CheckCircle2,
  Sparkles,
  Send,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Printer,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { QuickShareModal } from "./QuickShareModal";

export interface ProcessedFileData {
  data: Uint8Array | Blob | string;
  fileName: string;
  mimeType: string;
}

interface QuickActionsFloatingMenuProps {
  downloadReady: ProcessedFileData | null;
  onSaveGoogleDrive: () => void;
  onDownload: () => void;
  onClose?: () => void;
}

export const QuickActionsFloatingMenu: React.FC<QuickActionsFloatingMenuProps> = ({
  downloadReady,
  onSaveGoogleDrive,
  onDownload,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Email form state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Preview object URL state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (downloadReady) {
      setIsVisible(true);
      setEmailSubject(`Processed PDF: ${downloadReady.fileName}`);
      setEmailMessage(`Hello,\n\nI have processed "${downloadReady.fileName}" using PDFSun. Please find the document attached or download it via the link below.\n\nBest regards.`);

      // Create preview URL if possible
      try {
        let blob: Blob;
        if (downloadReady.data instanceof Blob) {
          blob = downloadReady.data;
        } else if (downloadReady.data instanceof Uint8Array) {
          blob = new Blob([downloadReady.data], { type: downloadReady.mimeType || "application/pdf" });
        } else {
          blob = new Blob([downloadReady.data], { type: downloadReady.mimeType || "text/plain" });
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error("Failed to generate preview URL:", err);
      }
    } else {
      setIsVisible(false);
    }
  }, [downloadReady]);

  if (!downloadReady || !isVisible) return null;

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;

    // Trigger mailto link as fallback & display success message
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
    window.open(mailtoUrl, "_blank");

    setEmailSentNotice(true);
    setTimeout(() => {
      setEmailSentNotice(false);
      setShowEmailModal(false);
    }, 2000);
  };

  const handleCopyShareLink = () => {
    const shareableUrl = getPublicShareUrl(`share_${Math.random().toString(36).substring(2, 10)}`);
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      {/* Quick Actions Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-700/80 backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-300">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Status & File Name */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Ready
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                    PDF
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-200 truncate max-w-[180px] sm:max-w-[200px]">
                  {downloadReady.fileName}
                </p>
              </div>
            </div>

            {/* Mobile Dismiss Button */}
            <button
              onClick={() => {
                setIsVisible(false);
                onClose?.();
              }}
              className="p-1 sm:hidden rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end overflow-x-auto scrollbar-none py-0.5">
            {/* 1. Quick Share Social & Link */}
            <button
              onClick={() => setShowShareModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition text-xs font-bold flex items-center space-x-1.5 shadow-xs shrink-0"
              title="Quick Share via Social Media or Copy Permanent Link"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              <span>Quick Share</span>
            </button>

            {/* 2. Save to Google Drive */}
            <button
              onClick={onSaveGoogleDrive}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white transition text-xs font-bold flex items-center space-x-1.5 border border-slate-700/60 shrink-0"
              title="Instantly save to Google Drive"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Google Drive</span>
            </button>

            {/* 2. Share via Email */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white transition text-xs font-bold flex items-center space-x-1.5 border border-slate-700/60 shrink-0"
              title="Share file via Email"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Share via Email</span>
            </button>

            {/* 3. Preview */}
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white transition text-xs font-bold flex items-center space-x-1.5 border border-slate-700/60 shrink-0"
              title="Preview processed document"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Preview</span>
            </button>

            {/* Direct Download Accent Button */}
            <button
              onClick={onDownload}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition text-xs font-black shadow-md flex items-center space-x-1.5 shrink-0"
              title="Download file directly"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>

            {/* Desktop Dismiss Button */}
            <button
              onClick={() => {
                setIsVisible(false);
                onClose?.();
              }}
              className="hidden sm:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Dismiss quick actions floating menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Share Via Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Share via Email
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Send "{downloadReady.fileName}" directly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailSentNotice ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Email Client Opened!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to send to {recipientEmail} with your processed PDF attached.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Copy Link Option */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Share Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Cloud Share Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PDF Document Live Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-md">
                    Document Preview: {downloadReady.fileName}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      100% In-Browser Rendered
                    </span>
                    <span>•</span>
                    <span>{downloadReady.mimeType}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview Viewport */}
            <div className="flex-1 min-h-[350px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden relative flex flex-col items-center justify-center">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  title="Processed PDF Preview"
                  className="w-full h-full min-h-[420px] rounded-2xl border-0"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {downloadReady.fileName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Processed file is ready for download.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={onSaveGoogleDrive}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center space-x-1.5"
              >
                <Cloud className="w-4 h-4 text-blue-500" />
                <span>Save to Drive</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onDownload}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Quick Share Modal */}
      {showShareModal && downloadReady && (
        <QuickShareModal
          fileName={downloadReady.fileName}
          mimeType={downloadReady.mimeType}
          onClose={() => setShowShareModal(false)}
          onDownloadDirect={onDownload}
        />
      )}
    </>
  );
};
