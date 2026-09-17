import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Languages,
  BookOpen,
  Layers,
  Briefcase,
  HelpCircle,
  ScanText,
  Download,
  RefreshCw,
  Zap,
  Star,
  ThumbsUp,
  Share2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RotateCw,
} from "lucide-react";
import { ToolItem, ToolHistoryItem } from "../types";
import { extractTextFromPdfFile, textToPdf, downloadFile, fileToBase64 } from "../lib/pdfEngine";
import { safeFetch } from "../lib/safeApi";
import { QuickShareModal } from "./QuickShareModal";
import { useUsageTracker } from "../hooks/useUsageTracker";
import { FreeLimitPaywallModal } from "./FreeLimitPaywallModal";
import { ResumeReadyWorkspace } from "./ResumeReadyWorkspace";
import { FormattedMarkdown } from "./FormattedMarkdown";

const FeedbackWidget = React.lazy(() => import("./FeedbackWidget"));

interface AIChatWorkspaceProps {
  tool: ToolItem;
  initialFiles?: File[];
  onClose: () => void;
  onAddHistory: (item: ToolHistoryItem) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Flashcard {
  question: string;
  answer: string;
}

type AiTabId = "chat" | "summary" | "translate" | "notes" | "flashcards" | "explain" | "ocr" | "resume";

interface AiTabConfig {
  id: AiTabId;
  canonicalName: string;
  buttonLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  description: string;
  emptyGuidance: string;
}

export const AI_TABS_CONFIG: AiTabConfig[] = [
  {
    id: "chat",
    canonicalName: "AI Chat with PDF",
    buttonLabel: "Send Message",
    icon: Bot,
    badge: "Gemini 3.8 Flash",
    description: "Chat interactively with any uploaded document to ask questions, cross-examine clauses, and verify facts with full multi-turn conversational memory.",
    emptyGuidance: "Upload a document on the left, then ask questions below to interactively chat with your PDF using Gemini AI.",
  },
  {
    id: "summary",
    canonicalName: "AI Document Summary",
    buttonLabel: "Generate AI Summary",
    icon: Sparkles,
    badge: "Executive Brief",
    description: "Summarize the document into: 1) Executive summary (3-5 sentences), 2) Key takeaways (bullet list), and 3) Structured outline.",
    emptyGuidance: "Upload a document on the left, then click 'Generate AI Summary' to receive an executive brief, bulleted takeaways, and outline.",
  },
  {
    id: "translate",
    canonicalName: "AI Translate PDF",
    buttonLabel: "Translate Document",
    icon: Languages,
    badge: "30+ Languages",
    description: "Translate document text into over 30 languages while preserving original document layout, headings, numbers, and bullet points.",
    emptyGuidance: "Upload a document, choose your target language from the dropdown, then click 'Translate Document' to generate a translated version.",
  },
  {
    id: "notes",
    canonicalName: "AI Notes Generator",
    buttonLabel: "Generate AI Notes",
    icon: BookOpen,
    badge: "Smart Study",
    description: "Create structured study notes with key terms, definitions, formulas/concepts, callout highlights, and review questions from this document.",
    emptyGuidance: "Upload study materials or reports on the left, then click 'Generate AI Notes' to synthesize comprehensive notes and key takeaways.",
  },
  {
    id: "flashcards",
    canonicalName: "AI Flashcards",
    buttonLabel: "Generate Study Flashcards",
    icon: Layers,
    badge: "Active Recall",
    description: "Automatically transform dense textbooks, lecture notes, and research papers into interactive study flashcards with flippable revision cards.",
    emptyGuidance: "Upload lecture notes, articles, or chapters, then click 'Generate Study Flashcards' to build an interactive revision deck.",
  },
  {
    id: "explain",
    canonicalName: "AI Explain PDF",
    buttonLabel: "Explain & Simplify Document",
    icon: HelpCircle,
    badge: "Plain Language",
    description: "One-click plain-language document breakdown. Translates complex technical, academic, and legal jargon into crystal-clear layman summaries.",
    emptyGuidance: "Upload complex contracts, research papers, or technical manuals, then click 'Explain & Simplify Document' for a plain-English breakdown.",
  },
  {
    id: "ocr",
    canonicalName: "AI OCR (Text Recognition)",
    buttonLabel: "Run AI Vision OCR",
    icon: ScanText,
    badge: "Gemini Vision AI • Pro",
    description: "Recognize handwritten notes, complex multi-column layouts, scanned PDFs, and image documents using Gemini AI Vision with Tesseract fallback.",
    emptyGuidance: "Upload a scanned document, receipt, or photo, then click 'Run AI Vision OCR' to extract digital text and export a searchable document.",
  },
  {
    id: "resume",
    canonicalName: "AI Resume Builder",
    buttonLabel: "Open Resume Builder",
    icon: Briefcase,
    badge: "ATS Scored",
    description: "Analyze, score, and rewrite your resume into an ATS-optimized, professional PDF tailored for top employers with instant executive export.",
    emptyGuidance: "Upload your existing resume to analyze your ATS score, improve formatting, and export an executive PDF tailored for top jobs.",
  },
];

function getInitialTab(toolItem: ToolItem): AiTabId {
  const matchStr = `${toolItem.id} ${toolItem.slug || ""}`.toLowerCase();
  if (matchStr.includes("resume")) return "resume";
  if (matchStr.includes("summary") || matchStr.includes("summar")) return "summary";
  if (matchStr.includes("translate")) return "translate";
  if (matchStr.includes("notes")) return "notes";
  if (matchStr.includes("flashcard")) return "flashcards";
  if (matchStr.includes("explain")) return "explain";
  if (matchStr.includes("ocr")) return "ocr";
  return "chat";
}

export const AIChatWorkspace: React.FC<AIChatWorkspaceProps> = ({
  tool,
  initialFiles = [],
  onClose,
  onAddHistory,
}) => {
  const [file, setFile] = useState<File | null>(initialFiles[0] || null);
  const [documentText, setDocumentText] = useState<string>("");
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<AiTabId>(() => getInitialTab(tool));

  // Per-tool cached outputs (switching tabs does not wipe generated results)
  const [toolOutputs, setToolOutputs] = useState<Record<string, string>>({});
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeFlashcardIdx, setActiveFlashcardIdx] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  // Chat state (multi-turn conversation memory)
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Execution states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("Hindi");
  const [copied, setCopied] = useState(false);

  // Community Engagement States
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(128);

  const {
    isPro,
    canProcessAiQuery,
    recordAiQuery,
    isPaywallOpen,
    paywallReason,
    blockedFileSize,
    triggerPaywall,
    closePaywall,
  } = useUsageTracker();

  // Determine currently active tab configuration
  const activeTabConfig = useMemo(
    () => AI_TABS_CONFIG.find((t) => t.id === activeTab) || AI_TABS_CONFIG[0],
    [activeTab]
  );

  // Current output for the active tab
  const currentOutput = toolOutputs[activeTab] || "";

  // Extract text when a document is uploaded
  const handleFileChange = useCallback(async (f: File) => {
    setFile(f);
    setIsExtractingText(true);
    setAiError(null);

    try {
      if (f.type.startsWith("image/") || f.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
        setDocumentText(`Image file loaded: ${f.name} (${(f.size / 1024).toFixed(1)} KB).\nClick "Run AI Vision OCR" to extract full text with Gemini AI Vision.`);
      } else {
        const extracted = await extractTextFromPdfFile(f);
        setDocumentText(extracted);
      }
    } catch (err: any) {
      console.warn("Text extraction notice:", err);
      setDocumentText(
        `Document: ${f.name} (${(f.size / 1024).toFixed(1)} KB)\n[Scanned or image-based document detected. Click "Run AI Vision OCR" or extract directly with Gemini AI.]`
      );
    } finally {
      setIsExtractingText(false);
    }
  }, []);

  // Initialize with initialFiles if provided
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !file) {
      handleFileChange(initialFiles[0]);
    }
  }, [initialFiles, file, handleFileChange]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles[0]) {
        handleFileChange(acceptedFiles[0]);
      }
    },
    [handleFileChange]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      multiple: false,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "text/plain": [".txt"],
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/webp": [".webp"],
      },
    });

  // Execute Gemini AI Tool Pipeline (Summary, Translate, Notes, Flashcards, Explain, OCR)
  const runAiFeature = async (featureTab: AiTabId) => {
    if (file && file.size > 15 * 1024 * 1024 && !isPro) {
      triggerPaywall("size", file.size);
      return;
    }

    const check = canProcessAiQuery();
    if (!check.allowed) {
      triggerPaywall("ai_trial");
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      let endpoint = "/api/ai/summarize";
      let body: any = { documentText };

      if (featureTab === "summary") {
        endpoint = "/api/ai/summarize";
        body = { documentText };
      } else if (featureTab === "translate") {
        endpoint = "/api/translate";
        body = { documentText, targetLanguage };
      } else if (featureTab === "flashcards") {
        endpoint = "/api/ai/flashcards";
        body = { documentText, count: 8 };
      } else if (featureTab === "notes") {
        endpoint = "/api/ai/notes";
        body = { documentText };
      } else if (featureTab === "explain") {
        endpoint = "/api/ai/explain";
        body = { documentText, targetAudience: "beginner" };
      } else if (featureTab === "ocr") {
        endpoint = "/api/ai/ocr";
        if (file) {
          const base64 = await fileToBase64(file);
          const mime = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/png");
          body = { imageBase64: base64, mimeType: mime };
        } else {
          throw new Error("Please upload a scanned PDF, photo, or image file on the left panel to run OCR.");
        }
      }

      const res = await safeFetch<any>(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || "Failed to process request with Gemini AI.");
      }

      const data = res.data;

      if (featureTab === "flashcards") {
        const cardsList = Array.isArray(data.flashcards) ? data.flashcards : [];
        if (cardsList.length === 0) {
          throw new Error("No flashcards could be synthesized from this document text.");
        }
        setFlashcards(cardsList);
        setActiveFlashcardIdx(0);
        setShowFlashcardAnswer(false);
      } else if (featureTab === "ocr") {
        const ocrText = data.result || data.text || "No text could be recognized.";
        setToolOutputs((prev) => ({ ...prev, ocr: ocrText }));
        // Also populate left document text so subsequent tools can use the recognized content
        setDocumentText(ocrText);
      } else {
        const textResult = data.result || data.translatedText || "AI processing completed.";
        setToolOutputs((prev) => ({ ...prev, [featureTab]: textResult }));
      }

      recordAiQuery();

      onAddHistory({
        id: Date.now().toString(),
        toolId: tool.id,
        toolName: activeTabConfig.canonicalName,
        fileName: file?.name || "Document",
        timestamp: Date.now(),
        status: "completed",
        outputFileName: `PDFSun_${featureTab}_output.pdf`,
      });
    } catch (err: any) {
      console.error("AI Pipeline Error:", err);
      setAiError(err?.message || "An unexpected error occurred while communicating with Gemini AI. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Multi-Turn AI Chat Submission
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    if (file && file.size > 15 * 1024 * 1024 && !isPro) {
      triggerPaywall("size", file.size);
      return;
    }

    const check = canProcessAiQuery();
    if (!check.allowed) {
      triggerPaywall("ai_trial");
      return;
    }

    const userMessageText = chatInput.trim();
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageText,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsAiLoading(true);
    setAiError(null);

    try {
      const chatHistoryForApi = chatMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        content: m.content,
      }));

      const res = await safeFetch<any>("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessageText,
          documentText: documentText || (file ? `Document: ${file.name}` : ""),
          history: chatHistoryForApi,
        }),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || "Failed to process chat response from Gemini.");
      }

      const botReply = res.data.result || res.data.reply || "No response received from Gemini.";
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: botReply,
          timestamp: Date.now(),
        },
      ]);

      recordAiQuery();

      onAddHistory({
        id: Date.now().toString(),
        toolId: tool.id,
        toolName: "AI Chat with PDF",
        fileName: file?.name || "Document",
        timestamp: Date.now(),
        status: "completed",
        outputFileName: "PDFSun_AI_Chat_Transcript.pdf",
      });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${err?.message || "Failed to communicate with Gemini AI. Please check your connection."}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Copy to Clipboard (Enabled only when output exists)
  const copyToClipboard = () => {
    let textToCopy = "";
    if (activeTab === "flashcards" && flashcards.length > 0) {
      textToCopy = flashcards.map((f, i) => `Card ${i + 1}:\nQ: ${f.question}\nA: ${f.answer}`).join("\n\n");
    } else if (activeTab === "chat" && chatMessages.length > 0) {
      textToCopy = chatMessages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    } else if (currentOutput) {
      textToCopy = currentOutput;
    }

    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export PDF (Enabled only when output exists)
  const exportAsPdf = () => {
    let title = activeTabConfig.canonicalName;
    let textToExport = "";

    if (activeTab === "flashcards" && flashcards.length > 0) {
      title = "PDFSun AI Study Flashcards";
      textToExport = flashcards
        .map((f, i) => `----------------------------------------\nFLASHCARD ${i + 1}\n----------------------------------------\nQUESTION:\n${f.question}\n\nANSWER:\n${f.answer}\n`)
        .join("\n\n");
    } else if (activeTab === "chat" && chatMessages.length > 0) {
      title = "PDFSun AI Chat Transcript";
      textToExport = chatMessages
        .map((m) => `[${m.role.toUpperCase()} - ${new Date(m.timestamp).toLocaleTimeString()}]\n${m.content}`)
        .join("\n\n");
    } else if (currentOutput) {
      textToExport = currentOutput;
    }

    if (!textToExport) return;
    const pdfBytes = textToPdf(textToExport, title);
    const cleanFileName = `PDFSun_${activeTabConfig.canonicalName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    downloadFile(pdfBytes, cleanFileName, "application/pdf");
  };

  // Check if current tab has valid output to enable Copy & Export
  const hasValidOutput = useMemo(() => {
    if (activeTab === "resume") return true;
    if (activeTab === "flashcards") return flashcards.length > 0;
    if (activeTab === "chat") return chatMessages.length > 0;
    return Boolean(currentOutput && currentOutput.trim().length > 0);
  }, [activeTab, flashcards.length, chatMessages.length, currentOutput]);

  const handleToggleLike = () => {
    if (hasLiked) {
      setHasLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      setHasLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-[var(--bg-primary,#0a0a0f)] text-[var(--text-primary,#f8fafc)] rounded-3xl max-w-6xl w-full h-[92vh] shadow-2xl border border-[var(--border-color,rgba(255,255,255,0.1))] overflow-hidden flex flex-col">
        {/* Workspace Top Navigation Bar */}
        <div className="px-6 py-4 bg-[var(--bg-surface,#111114)] border-b border-[var(--border-color,rgba(255,255,255,0.1))] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                {/* Canonical Name Synchronized Header Title */}
                <h2 className="text-lg font-black text-[var(--text-primary,#f8fafc)]">
                  {activeTabConfig.canonicalName}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase">
                  {activeTabConfig.badge}
                </span>
                {/* Rating Badge */}
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition ml-1"
                  title="View user reviews and ratings"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                  <span>4.9</span>
                  <span className="text-[10px] text-[var(--text-muted,#64748b)] font-normal">(1,480)</span>
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary,#94a3b8)]">PDFSun Unified AI Document Suite</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Social Proof & Share Buttons */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-[var(--bg-elevated,#16161a)] p-1 rounded-xl border border-[var(--border-color,rgba(255,255,255,0.1))] mr-1">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
                  hasLiked
                    ? "bg-amber-500/20 text-amber-400"
                    : "hover:bg-[var(--bg-elevated-hover,#1f1f26)] text-[var(--text-secondary,#94a3b8)]"
                }`}
                title="Like this AI tool"
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? "fill-amber-500 text-amber-500" : ""}`} />
                <span>{likeCount}</span>
              </button>

              <div className="w-px h-3.5 bg-[var(--border-color,rgba(255,255,255,0.1))]" />

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="px-2 py-1 rounded-lg hover:bg-[var(--bg-elevated-hover,#1f1f26)] text-[var(--text-secondary,#94a3b8)] text-xs font-bold flex items-center space-x-1 transition"
                title="Share this tool"
              >
                <Share2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>Share</span>
              </button>
            </div>

            {/* Copy Result Button (active only when output exists) */}
            <button
              onClick={copyToClipboard}
              disabled={!hasValidOutput}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated,#16161a)] text-[var(--text-primary,#f8fafc)] hover:bg-[var(--bg-elevated-hover,#1f1f26)] transition text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 border border-[var(--border-color,rgba(255,255,255,0.1))]"
              title="Copy output text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? "Copied" : "Copy Result"}</span>
            </button>

            {/* Export PDF Button (active only when output exists) */}
            <button
              onClick={exportAsPdf}
              disabled={!hasValidOutput}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-md"
              title="Download structured output as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#f8fafc)] hover:bg-[var(--bg-elevated,#16161a)] transition ml-1"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Canonical Tabs Bar */}
        <div className="px-6 py-2.5 bg-[var(--bg-surface,#111114)] border-b border-[var(--border-color,rgba(255,255,255,0.1))] flex items-center space-x-2 overflow-x-auto text-xs font-bold scrollbar-none">
          {AI_TABS_CONFIG.map((tConfig) => {
            const IconComponent = tConfig.icon;
            const isActive = activeTab === tConfig.id;

            return (
              <button
                key={tConfig.id}
                onClick={() => {
                  setActiveTab(tConfig.id);
                  setAiError(null);
                }}
                className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 whitespace-nowrap transition duration-150 text-xs ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold shadow-md scale-100 ring-2 ring-orange-400/40"
                    : "text-[var(--text-secondary,#94a3b8)] hover:bg-[var(--bg-elevated,#16161a)] hover:text-[var(--text-primary,#f8fafc)] opacity-70 hover:opacity-100 font-medium"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span>{tConfig.canonicalName}</span>
                {tConfig.id === "ocr" && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black uppercase ml-0.5">
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace Content Grid */}
        {activeTab === "resume" ? (
          <ResumeReadyWorkspace
            initialDocumentText={documentText}
            initialFile={file}
            onAddHistory={onAddHistory}
          />
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left Column: File Drop & Text Preview */}
            <div className="md:col-span-4 p-4 border-r border-[var(--border-color,rgba(255,255,255,0.1))] bg-[var(--bg-surface,#111114)] flex flex-col space-y-3 overflow-y-auto">
              {/* Document Picker */}
              <div
                {...getRootProps()}
                className={`p-4 rounded-2xl border text-center relative group cursor-pointer transition ${
                  isDragReject
                    ? "border-rose-500 bg-rose-500/10 scale-[1.01]"
                    : isDragAccept
                    ? "border-emerald-500 bg-emerald-500/10 scale-[1.01] ring-2 ring-emerald-500/20"
                    : isDragActive
                    ? "border-orange-500 bg-orange-500/10 scale-[1.01] ring-2 ring-orange-500/20"
                    : "bg-[var(--bg-elevated,#16161a)] border-[var(--border-color,rgba(255,255,255,0.1))] hover:border-orange-500"
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud
                  className={`w-7 h-7 mx-auto mb-1 transition-transform ${
                    isDragActive ? "text-orange-500 scale-125 animate-bounce" : "text-orange-400"
                  }`}
                />
                <div className="text-xs font-bold text-[var(--text-primary,#f8fafc)] truncate">
                  {isDragActive
                    ? isDragReject
                      ? "File type not supported"
                      : "Drop document to load text"
                    : file
                    ? file.name
                    : "Upload Document for AI"}
                </div>
                <p className="text-[10px] text-[var(--text-muted,#64748b)] mt-0.5">
                  {activeTab === "ocr" ? "PDF, Scanned Photos, PNG, JPG, WEBP" : "PDF, DOCX, TXT supported"}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--bg-elevated,#16161a)] border border-[var(--border-color,rgba(255,255,255,0.06))] text-[11px]">
                <span className="text-[var(--text-muted,#64748b)] font-medium">Source Status</span>
                <span className="flex items-center space-x-1 font-bold">
                  {documentText.trim().length > 0 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">
                        {documentText.length} chars (~{documentText.split(/\s+/).filter(Boolean).length} words)
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-400">No Document Loaded</span>
                  )}
                </span>
              </div>

              {/* Extracted Document Text Preview */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted,#64748b)] uppercase tracking-wider mb-1.5">
                  <span>Extracted Document Text</span>
                  {isExtractingText && <RefreshCw className="w-3 h-3 animate-spin text-orange-500" />}
                </div>
                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="No document loaded. Upload a PDF or paste text here to analyze with AI..."
                  className="flex-1 w-full p-3 rounded-2xl bg-[var(--bg-elevated,#16161a)] text-xs text-[var(--text-secondary,#94a3b8)] font-mono border border-[var(--border-color,rgba(255,255,255,0.1))] focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Right Column: Interactive Gemini AI Console */}
            <div className="md:col-span-8 flex flex-col h-full bg-[var(--bg-primary,#0a0a0f)] overflow-hidden">
              {/* TAB 1: AI Chat with PDF */}
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col h-full p-4 overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-inner">
                          <Bot className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-extrabold text-[var(--text-primary,#f8fafc)]">
                          Ask Gemini 3.8 Flash Anything About This Document
                        </h3>
                        <p className="text-xs text-[var(--text-muted,#64748b)] max-w-md leading-relaxed">
                          {activeTabConfig.emptyGuidance}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center pt-2 max-w-lg">
                          {[
                            "Summarize key findings",
                            "List main action items",
                            "Explain section 1 in simple terms",
                            "Extract all dates and numbers",
                          ].map((prompt, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => {
                                setChatInput(prompt);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated,#16161a)] hover:bg-[var(--bg-elevated-hover,#1f1f26)] border border-[var(--border-color,rgba(255,255,255,0.1))] text-[11px] text-[var(--text-secondary,#94a3b8)] hover:text-white transition"
                            >
                              &ldquo;{prompt}&rdquo;
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex space-x-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                              <Bot className="w-4 h-4" />
                            </div>
                          )}
                          <div
                            className={`max-w-[82%] p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                              msg.role === "user"
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-md"
                                : "bg-[var(--bg-elevated,#16161a)] text-[var(--text-primary,#f8fafc)] border border-[var(--border-color,rgba(255,255,255,0.1))]"
                            }`}
                          >
                            {msg.content}
                          </div>
                          {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {isAiLoading && (
                      <div className="flex items-center space-x-2 text-xs text-orange-400 font-bold p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                        <span>Gemini 3.8 Flash is analyzing document and formulating response...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Field */}
                  <div className="pt-3 border-t border-[var(--border-color,rgba(255,255,255,0.1))] flex items-center space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="Ask any question about your document..."
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--input-bg,#111114)] text-xs font-medium text-[var(--text-primary,#f8fafc)] border border-[var(--input-border,rgba(255,255,255,0.15))] focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={isAiLoading || !chatInput.trim()}
                      className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-40 hover:opacity-90 transition shadow-md flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: AI Flashcards */}
              {activeTab === "flashcards" && (
                <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
                  {isAiLoading ? (
                    <div className="flex flex-col items-center space-y-3">
                      <RefreshCw className="w-9 h-9 text-orange-500 animate-spin" />
                      <p className="text-xs font-bold text-[var(--text-secondary,#94a3b8)]">
                        Gemini AI is generating active recall flashcards...
                      </p>
                    </div>
                  ) : flashcards.length > 0 ? (
                    <div className="w-full max-w-lg space-y-4 text-center">
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted,#64748b)] uppercase tracking-wider">
                        <span>Flashcard Deck</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold">
                          {activeFlashcardIdx + 1} of {flashcards.length}
                        </span>
                      </div>

                      {/* Interactive Flippable Flashcard */}
                      <div
                        onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                        className="w-full min-h-[240px] p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent border-2 border-orange-500/30 flex flex-col items-center justify-center cursor-pointer shadow-xl hover:scale-[1.01] transition duration-200"
                      >
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-500 text-white mb-3 shadow-xs">
                          {showFlashcardAnswer ? "Answer (Click to see Question)" : "Question (Click to flip)"}
                        </span>
                        <p className="text-sm font-bold text-[var(--text-primary,#f8fafc)] leading-relaxed max-w-md">
                          {showFlashcardAnswer
                            ? flashcards[activeFlashcardIdx].answer
                            : flashcards[activeFlashcardIdx].question}
                        </p>
                      </div>

                      {/* Navigation Controls */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => {
                            setActiveFlashcardIdx((prev) => Math.max(0, prev - 1));
                            setShowFlashcardAnswer(false);
                          }}
                          disabled={activeFlashcardIdx === 0}
                          className="px-4 py-2 rounded-xl bg-[var(--bg-elevated,#16161a)] text-xs font-bold text-[var(--text-secondary,#94a3b8)] hover:text-[var(--text-primary,#f8fafc)] disabled:opacity-30 border border-[var(--border-color,rgba(255,255,255,0.1))] flex items-center space-x-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </button>

                        <button
                          onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                          className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30 flex items-center space-x-1 hover:bg-orange-500/30 transition"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Flip Card</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveFlashcardIdx((prev) => Math.min(flashcards.length - 1, prev + 1));
                            setShowFlashcardAnswer(false);
                          }}
                          disabled={activeFlashcardIdx === flashcards.length - 1}
                          className="px-4 py-2 rounded-xl bg-[var(--bg-elevated,#16161a)] text-xs font-bold text-[var(--text-secondary,#94a3b8)] hover:text-[var(--text-primary,#f8fafc)] disabled:opacity-30 border border-[var(--border-color,rgba(255,255,255,0.1))] flex items-center space-x-1"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => runAiFeature("flashcards")}
                          className="text-xs text-[var(--text-muted,#64748b)] hover:text-orange-400 font-bold underline"
                        >
                          Regenerate deck
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Flashcards Empty State with Direct CTA */
                    <div className="text-center max-w-md space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                        <Layers className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-extrabold text-[var(--text-primary,#f8fafc)]">
                        Generate Active Recall Flashcards
                      </h3>
                      <p className="text-xs text-[var(--text-muted,#64748b)] leading-relaxed">
                        {activeTabConfig.emptyGuidance}
                      </p>
                      {aiError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{aiError}</span>
                        </div>
                      )}
                      <button
                        onClick={() => runAiFeature("flashcards")}
                        disabled={isAiLoading || !documentText.trim()}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                      >
                        {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>Generate Study Flashcards</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Summary, Translate, Notes, Explain, and OCR Pipeline */}
              {activeTab !== "chat" && activeTab !== "flashcards" && (
                <div className="flex-1 p-6 flex flex-col space-y-4 overflow-hidden">
                  {/* Top Bar for Translate Language Selection */}
                  {activeTab === "translate" && (
                    <div className="flex items-center space-x-3 pb-1 flex-wrap gap-2">
                      <label className="text-xs font-bold text-[var(--text-secondary,#94a3b8)]">Target Language:</label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated,#16161a)] text-xs font-bold text-[var(--text-primary,#f8fafc)] border border-[var(--border-color,rgba(255,255,255,0.1))] focus:outline-none focus:border-orange-500"
                      >
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="French">French (Français)</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="Japanese">Japanese (日本語)</option>
                        <option value="Chinese">Chinese (Mandarin)</option>
                        <option value="Arabic">Arabic (العربية)</option>
                        <option value="Portuguese">Portuguese (Português)</option>
                        <option value="Russian">Russian (Русский)</option>
                        <option value="Italian">Italian (Italiano)</option>
                        <option value="Korean">Korean (한국어)</option>
                        <option value="Dutch">Dutch (Nederlands)</option>
                        <option value="Bengali">Bengali (বাংলা)</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                        <option value="Urdu">Urdu (اردو)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                        <option value="Malayalam">Malayalam (മലയാളം)</option>
                        <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                      </select>

                      <button
                        onClick={() => runAiFeature("translate")}
                        disabled={isAiLoading || !documentText.trim()}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition disabled:opacity-40 flex items-center space-x-1.5"
                      >
                        {isAiLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isAiLoading ? "Translating..." : "Translate Document"}</span>
                      </button>
                    </div>
                  )}

                  {/* Output Header with Action Status */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted,#64748b)] flex items-center space-x-2">
                      <span>{activeTabConfig.canonicalName} Output</span>
                      {currentOutput && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                          Ready ({currentOutput.length} chars)
                        </span>
                      )}
                    </div>

                    {currentOutput && (
                      <button
                        onClick={() => runAiFeature(activeTab)}
                        disabled={isAiLoading}
                        className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center space-x-1"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>

                  {/* Error Notification Banner */}
                  {aiError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {/* Content Panel: Empty State with Direct CTA OR Formatted Markdown Result */}
                  <div className="flex-1 overflow-y-auto p-5 rounded-2xl bg-[var(--bg-elevated,#16161a)] border border-[var(--border-color,rgba(255,255,255,0.1))] text-xs text-[var(--text-primary,#f8fafc)] leading-relaxed font-sans scrollbar-thin">
                    {isAiLoading ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-3 text-[var(--text-muted,#64748b)]">
                        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                        <span className="font-bold text-sm text-[var(--text-primary,#f8fafc)]">
                          Gemini 3.8 Flash Processing...
                        </span>
                        <span className="text-xs max-w-sm text-center">
                          Extracting insights and formatting output with AI precision.
                        </span>
                      </div>
                    ) : currentOutput ? (
                      <FormattedMarkdown content={currentOutput} />
                    ) : (
                      /* Tool-Specific Empty State with Prominent One-Click Action */
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                          <activeTabConfig.icon className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-extrabold text-[var(--text-primary,#f8fafc)]">
                            {activeTabConfig.canonicalName}
                          </h3>
                          <p className="text-xs text-[var(--text-muted,#64748b)] max-w-md leading-relaxed">
                            {activeTabConfig.emptyGuidance}
                          </p>
                        </div>

                        <button
                          onClick={() => runAiFeature(activeTab)}
                          disabled={isAiLoading || (!documentText.trim() && !file)}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{activeTabConfig.buttonLabel}</span>
                        </button>

                        {!documentText.trim() && !file && (
                          <p className="text-[11px] text-amber-400/80">
                            * Please upload a document or paste text in the left panel to begin.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Share Modal */}
      {showShareModal && (
        <QuickShareModal
          fileName={file ? file.name : `${tool.name}_Document.pdf`}
          mimeType="application/pdf"
          onClose={() => setShowShareModal(false)}
          onDownloadDirect={exportAsPdf}
        />
      )}

      {/* Reviews & Feedback Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--bg-primary,#0a0a0f)] text-[var(--text-primary,#f8fafc)] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[var(--border-color,rgba(255,255,255,0.1))] space-y-4 relative max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-color,rgba(255,255,255,0.1))] pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500 shrink-0" />
                <h3 className="text-base font-bold text-[var(--text-primary,#f8fafc)] truncate">
                  User Reviews & Ratings for {activeTabConfig.canonicalName}
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted,#64748b)] hover:text-[var(--text-primary,#f8fafc)] hover:bg-[var(--bg-elevated,#16161a)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <React.Suspense
              fallback={
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                  <span>Loading review board...</span>
                </div>
              }
            >
              <FeedbackWidget toolId={tool.id} toolName={activeTabConfig.canonicalName} />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      <FreeLimitPaywallModal
        isOpen={isPaywallOpen}
        onClose={closePaywall}
        reason={paywallReason}
        fileSize={blockedFileSize}
        onOpenPricing={onClose}
      />
    </div>
  );
};
