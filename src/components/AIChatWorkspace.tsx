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
  Trash2,
  MessageSquareText,
} from "lucide-react";
import { ToolItem, ToolHistoryItem } from "../types";
import { extractTextFromPdfFile, textToPdf, downloadFile, fileToBase64 } from "../lib/pdfEngine";
import { safeFetch } from "../lib/safeApi";
import { QuickShareModal } from "./QuickShareModal";
import { useUsageTracker } from "../hooks/useUsageTracker";
import { FreeLimitPaywallModal } from "./FreeLimitPaywallModal";
import { ResumeReadyWorkspace } from "./ResumeReadyWorkspace";
import { FormattedMarkdown } from "./FormattedMarkdown";
import { useToolRatings } from "../hooks/useToolRatings";
import { ErrorBoundary } from "./ErrorBoundary";

const FeedbackWidget = React.lazy(() => import("./FeedbackWidget"));

export type PipelineStage = "idle" | "ingestion" | "extraction" | "invocation" | "streaming" | "completed";

export interface ToolOutputState {
  output: string;
  flashcards?: Flashcard[];
  chatMessages?: ChatMessage[];
  fileName?: string;
  fileSize?: number;
  timestamp: number;
  isComplete: boolean;
  targetLanguage?: string;
}

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
  shortTooltip: string;
  emptyGuidance: string;
}

export const AI_TABS_CONFIG: AiTabConfig[] = [
  {
    id: "chat",
    canonicalName: "AI Chat with PDF",
    buttonLabel: "Send Message",
    icon: MessageSquareText,
    badge: "Gemini 3.8 Flash",
    shortTooltip: "Chat interactively to ask questions, cross-examine clauses & cite pages",
    description: "Chat interactively with any uploaded document to ask questions, cross-examine clauses, and verify facts with full multi-turn conversational memory.",
    emptyGuidance: "Upload a document on the left, then ask questions below to interactively chat with your PDF using Gemini AI.",
  },
  {
    id: "summary",
    canonicalName: "AI Document Summary",
    buttonLabel: "Generate AI Summary",
    icon: Sparkles,
    badge: "Executive Brief",
    shortTooltip: "Instantly generate executive summaries, key takeaways & structured outlines",
    description: "Summarize the document into: 1) Executive summary (3-5 sentences), 2) Key takeaways (bullet list), and 3) Structured outline.",
    emptyGuidance: "Upload a document on the left, then click 'Generate AI Summary' to receive an executive brief, bulleted takeaways, and outline.",
  },
  {
    id: "translate",
    canonicalName: "AI Translate PDF",
    buttonLabel: "Translate Document",
    icon: Languages,
    badge: "30+ Languages",
    shortTooltip: "Translate entire PDF documents into 30+ languages while preserving layout",
    description: "Translate document text into over 30 languages while preserving original document layout, headings, numbers, and bullet points.",
    emptyGuidance: "Upload a document, choose your target language from the dropdown, then click 'Translate Document' to generate a translated version.",
  },
  {
    id: "notes",
    canonicalName: "AI Notes Generator",
    buttonLabel: "Generate AI Notes",
    icon: BookOpen,
    badge: "Smart Study",
    shortTooltip: "Instantly extract bulleted study notes, formulas, definitions & review tests",
    description: "Create structured study notes with key terms, definitions, formulas/concepts, callout highlights, and review questions from this document.",
    emptyGuidance: "Upload study materials or reports on the left, then click 'Generate AI Notes' to synthesize comprehensive notes and key takeaways.",
  },
  {
    id: "flashcards",
    canonicalName: "AI Flashcards",
    buttonLabel: "Generate Study Flashcards",
    icon: Layers,
    badge: "Active Recall",
    shortTooltip: "Transform dense textbook pages into interactive flippable revision cards",
    description: "Automatically transform dense textbooks, lecture notes, and research papers into interactive study flashcards with flippable revision cards.",
    emptyGuidance: "Upload lecture notes, articles, or chapters, then click 'Generate Study Flashcards' to build an interactive revision deck.",
  },
  {
    id: "explain",
    canonicalName: "AI Explain PDF",
    buttonLabel: "Explain & Simplify Document",
    icon: HelpCircle,
    badge: "Plain Language",
    shortTooltip: "Break down complex technical, legal & financial jargon into simple terms",
    description: "One-click plain-language document breakdown. Translates complex technical, academic, and legal jargon into crystal-clear layman summaries.",
    emptyGuidance: "Upload complex contracts, research papers, or technical manuals, then click 'Explain & Simplify Document' for a plain-English breakdown.",
  },
  {
    id: "ocr",
    canonicalName: "AI OCR (Text Recognition)",
    buttonLabel: "Run AI Vision OCR",
    icon: ScanText,
    badge: "Gemini Vision AI • Pro",
    shortTooltip: "Extract clean digital text from low-res scans, handwriting & image PDFs",
    description: "Recognize handwritten notes, complex multi-column layouts, scanned PDFs, and image documents using Gemini AI Vision with Tesseract fallback.",
    emptyGuidance: "Upload a scanned document, receipt, or photo, then click 'Run AI Vision OCR' to extract digital text and export a searchable document.",
  },
  {
    id: "resume",
    canonicalName: "AI Resume Builder",
    buttonLabel: "Open Resume Builder",
    icon: Briefcase,
    badge: "ATS Scored",
    shortTooltip: "ATS score evaluation & instant executive resume rewriting for job seekers",
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

const SESSION_CACHE_KEY_TEXT = "pdfsun_ai_document_text";
const SESSION_CACHE_KEY_CHAT = "pdfsun_ai_chat_history";
const SESSION_CACHE_KEY_OUTPUTS = "pdfsun_ai_outputs";

export const AIChatWorkspace: React.FC<AIChatWorkspaceProps> = ({
  tool,
  initialFiles = [],
  onClose,
  onAddHistory,
}) => {
  const [file, setFile] = useState<File | null>(initialFiles[0] || null);
  const [documentText, setDocumentText] = useState<string>(() => {
    try {
      return localStorage.getItem(SESSION_CACHE_KEY_TEXT) || "";
    } catch {
      return "";
    }
  });
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);

  // Active Tab state (synced with tool prop)
  const [activeTab, setActiveTab] = useState<AiTabId>(() => getInitialTab(tool));

  useEffect(() => {
    setActiveTab(getInitialTab(tool));
  }, [tool.id, tool.slug]);

  // Standardized 5-Stage Execution Pipeline State
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");

  // Per-tool cached outputs (switching tabs retains generated output, flashcards, metadata)
  const [toolOutputs, setToolOutputs] = useState<Record<string, ToolOutputState>>(() => {
    try {
      const saved = localStorage.getItem(SESSION_CACHE_KEY_OUTPUTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeFlashcardIdx, setActiveFlashcardIdx] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  // Chat state (multi-turn conversation memory)
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(SESSION_CACHE_KEY_CHAT);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Execution states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("Hindi");
  const [targetAudience, setTargetAudience] = useState("beginner");
  const [copied, setCopied] = useState(false);

  // Auto-save session state to localStorage
  useEffect(() => {
    try {
      if (documentText) {
        localStorage.setItem(SESSION_CACHE_KEY_TEXT, documentText);
      } else {
        localStorage.removeItem(SESSION_CACHE_KEY_TEXT);
      }
    } catch (e) {
      console.warn("Could not cache document text:", e);
    }
  }, [documentText]);

  useEffect(() => {
    try {
      if (chatMessages.length > 0) {
        localStorage.setItem(SESSION_CACHE_KEY_CHAT, JSON.stringify(chatMessages.slice(-50)));
      } else {
        localStorage.removeItem(SESSION_CACHE_KEY_CHAT);
      }
    } catch (e) {
      console.warn("Could not cache chat messages:", e);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      if (Object.keys(toolOutputs).length > 0) {
        localStorage.setItem(SESSION_CACHE_KEY_OUTPUTS, JSON.stringify(toolOutputs));
      }
    } catch (e) {
      console.warn("Could not cache tool outputs:", e);
    }
  }, [toolOutputs]);

  // Restore cached tool state when activeTab changes
  useEffect(() => {
    const cached = toolOutputs[activeTab];
    if (cached) {
      if (cached.flashcards && cached.flashcards.length > 0) {
        setFlashcards(cached.flashcards);
      }
      if (cached.chatMessages && cached.chatMessages.length > 0) {
        setChatMessages(cached.chatMessages);
      }
      if (cached.targetLanguage) {
        setTargetLanguage(cached.targetLanguage);
      }
    }
  }, [activeTab, toolOutputs]);

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

  // Dynamic Rating per Active Canonical Tool Tab
  const { getToolRating } = useToolRatings();
  const currentToolRating = useMemo(() => {
    const tabToToolId: Record<AiTabId, string> = {
      ocr: "ai-ocr",
      summary: "ai-pdf-summary",
      translate: "ai-translate-pdf",
      notes: "ai-notes-generator",
      flashcards: "ai-flashcards",
      explain: "ai-explain-pdf",
      resume: "ai-resume-builder",
      chat: "ai-chat-pdf",
    };
    const targetToolId = tabToToolId[activeTab] || tool.id;
    return getToolRating(targetToolId);
  }, [activeTab, getToolRating, tool.id]);

  // Determine currently active tab configuration
  const activeTabConfig = useMemo(
    () => AI_TABS_CONFIG.find((t) => t.id === activeTab) || AI_TABS_CONFIG[0],
    [activeTab]
  );

  // Current output for the active tab from cache
  const currentOutput = toolOutputs[activeTab]?.output || "";

  // Extract text when a document is uploaded (Stages 1 & 2)
  const handleFileChange = useCallback(async (f: File) => {
    setFile(f);
    setPipelineStage("ingestion");
    setIsExtractingText(true);
    setAiError(null);

    // Validate size
    if (f.size > 15 * 1024 * 1024 && !isPro) {
      triggerPaywall("size", f.size);
      setIsExtractingText(false);
      setPipelineStage("idle");
      return;
    }

    setPipelineStage("extraction");
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
      setPipelineStage("idle");
    }
  }, [isPro, triggerPaywall]);

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

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open: openDropzone } =
    useDropzone({
      onDrop,
      noClick: false,
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

    setPipelineStage("invocation");
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
        body = { documentText, targetAudience: targetAudience || "beginner" };
      } else if (featureTab === "ocr") {
        endpoint = "/api/ai/ocr";
        if (file) {
          const base64 = await fileToBase64(file);
          const mime = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/png");
          const hasValidPreExtractedText =
            documentText &&
            !documentText.includes("Scanned or image-based document detected") &&
            !documentText.includes("Image file loaded:") &&
            documentText.trim().length > 30;
          body = {
            imageBase64: base64,
            mimeType: mime,
            fallbackText: hasValidPreExtractedText ? documentText.trim() : undefined,
          };
        } else {
          throw new Error("Please upload a scanned PDF, photo, or image file on the left panel to run OCR.");
        }
      }

      let res;
      try {
        res = await safeFetch<any>(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (err: any) {
        if (featureTab === "ocr") {
          const hasValidPreExtractedText =
            documentText &&
            !documentText.includes("Scanned or image-based document detected") &&
            !documentText.includes("Image file loaded:") &&
            documentText.trim().length > 30;
          if (hasValidPreExtractedText) {
            setToolOutputs((prev) => ({
              ...prev,
              ocr: {
                output: documentText.trim(),
                fileName: file?.name,
                fileSize: file?.size,
                timestamp: Date.now(),
                isComplete: true,
              },
            }));
            setPipelineStage("completed");
            setIsAiLoading(false);
            return;
          }
        }
        throw err;
      }

      if (!res.ok || !res.data) {
        if (featureTab === "ocr") {
          const hasValidPreExtractedText =
            documentText &&
            !documentText.includes("Scanned or image-based document detected") &&
            !documentText.includes("Image file loaded:") &&
            documentText.trim().length > 30;
          if (hasValidPreExtractedText) {
            setToolOutputs((prev) => ({
              ...prev,
              ocr: {
                output: documentText.trim(),
                fileName: file?.name,
                fileSize: file?.size,
                timestamp: Date.now(),
                isComplete: true,
              },
            }));
            setPipelineStage("completed");
            setIsAiLoading(false);
            return;
          }
        }
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
        setToolOutputs((prev) => ({
          ...prev,
          flashcards: {
            output: `${cardsList.length} flashcards synthesized successfully.`,
            flashcards: cardsList,
            fileName: file?.name,
            fileSize: file?.size,
            timestamp: Date.now(),
            isComplete: true,
          },
        }));
        setPipelineStage("completed");
      } else if (featureTab === "ocr") {
        const ocrText = data.result || data.text || "No text could be recognized.";
        setDocumentText(ocrText);
        setPipelineStage("streaming");
        setIsAiLoading(false);
        // Stage 4: Stream progressive rendering
        const words = ocrText.split(" ");
        const step = Math.max(1, Math.floor(words.length / 15));
        for (let i = step; i < words.length; i += step) {
          const partial = words.slice(0, i).join(" ");
          setToolOutputs((prev) => ({
            ...prev,
            ocr: {
              output: partial,
              fileName: file?.name,
              fileSize: file?.size,
              timestamp: Date.now(),
              isComplete: false,
            },
          }));
          await new Promise((r) => setTimeout(r, 20));
        }
        setToolOutputs((prev) => ({
          ...prev,
          ocr: {
            output: ocrText,
            fileName: file?.name,
            fileSize: file?.size,
            timestamp: Date.now(),
            isComplete: true,
          },
        }));
        setPipelineStage("completed");
      } else {
        const textResult = data.result || data.translatedText || "AI processing completed.";
        setPipelineStage("streaming");
        setIsAiLoading(false);
        // Stage 4: Stream progressive rendering
        const words = textResult.split(" ");
        const step = Math.max(1, Math.floor(words.length / 18));
        for (let i = step; i < words.length; i += step) {
          const partial = words.slice(0, i).join(" ");
          setToolOutputs((prev) => ({
            ...prev,
            [featureTab]: {
              output: partial,
              fileName: file?.name,
              fileSize: file?.size,
              timestamp: Date.now(),
              isComplete: false,
              targetLanguage: featureTab === "translate" ? targetLanguage : undefined,
            },
          }));
          await new Promise((r) => setTimeout(r, 20));
        }
        setToolOutputs((prev) => ({
          ...prev,
          [featureTab]: {
            output: textResult,
            fileName: file?.name,
            fileSize: file?.size,
            timestamp: Date.now(),
            isComplete: true,
            targetLanguage: featureTab === "translate" ? targetLanguage : undefined,
          },
        }));
        setPipelineStage("completed");
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
      setPipelineStage("idle");
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

    const updatedWithUser = [...chatMessages, newMsg];
    setChatMessages(updatedWithUser);
    setChatInput("");
    setPipelineStage("invocation");
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
      const updatedMessages: ChatMessage[] = [
        ...updatedWithUser,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: botReply,
          timestamp: Date.now(),
        },
      ];
      setChatMessages(updatedMessages);
      setToolOutputs((prev) => ({
        ...prev,
        chat: {
          output: botReply,
          chatMessages: updatedMessages,
          fileName: file?.name,
          fileSize: file?.size,
          timestamp: Date.now(),
          isComplete: true,
        },
      }));
      setPipelineStage("completed");

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
      setPipelineStage("idle");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Copy to Clipboard (Stage 5 Action Enablement)
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

  // Export PDF (Stage 5 Action Enablement)
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

  // Stage 5 Action Enablement: Export/Copy buttons strictly disabled until pipeline completes
  const hasValidOutput = useMemo(() => {
    if (isAiLoading || pipelineStage === "invocation" || pipelineStage === "streaming" || isExtractingText) {
      return false;
    }
    if (activeTab === "resume") return true;
    if (activeTab === "flashcards") return flashcards.length > 0;
    if (activeTab === "chat") return chatMessages.length > 0;
    return Boolean(currentOutput && currentOutput.trim().length > 0);
  }, [isAiLoading, pipelineStage, isExtractingText, activeTab, flashcards.length, chatMessages.length, currentOutput]);

  const handleClearDocument = useCallback(() => {
    setFile(null);
    setDocumentText("");
    try {
      localStorage.removeItem(SESSION_CACHE_KEY_TEXT);
    } catch {}
  }, []);

  const handleClearChat = useCallback(() => {
    setChatMessages([]);
    try {
      localStorage.removeItem(SESSION_CACHE_KEY_CHAT);
    } catch {}
  }, []);

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
    <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="main-tool-card bg-white text-slate-800 rounded-[20px] max-w-6xl w-full h-[92vh] shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col">
        {/* Workspace Top Navigation Bar */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                {/* Canonical Name Synchronized Header Title */}
                <h2 className="text-lg font-bold text-slate-900">
                  {activeTabConfig.canonicalName}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase">
                  {activeTabConfig.badge}
                </span>
                {/* Dynamic Header-Embedded Rating Badge */}
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 text-xs font-bold transition ml-1"
                  title="View user reviews and ratings"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                  <span>{currentToolRating.avgRating.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({currentToolRating.totalRatings.toLocaleString()})
                  </span>
                </button>
              </div>
              <p className="text-xs text-slate-500">PDFSun Unified AI Document Suite</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Social Proof & Share Buttons */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 mr-1">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
                  hasLiked
                    ? "bg-amber-100 text-amber-700"
                    : "hover:bg-slate-200/60 text-slate-600"
                }`}
                title="Like this AI tool"
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? "fill-amber-500 text-amber-500" : ""}`} />
                <span>{likeCount}</span>
              </button>

              <div className="w-px h-3.5 bg-slate-200" />

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="px-2 py-1 rounded-lg hover:bg-slate-200/60 text-slate-600 text-xs font-bold flex items-center space-x-1 transition"
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
              className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 border border-slate-200"
              title="Copy output text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-600" />}
              <span>{copied ? "Copied" : "Copy Result"}</span>
            </button>

            {/* Export PDF Button (active only when output exists) */}
            <button
              onClick={exportAsPdf}
              disabled={!hasValidOutput}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm"
              title="Download structured output as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ml-1"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Isolated Tool Navigation Header (Tabs Bar) with Stacking Context & Responsive Scroll */}
        <nav
          aria-label="AI Document Tools"
          className="relative z-30 shrink-0 w-full bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent snap-x snap-mandatory"
        >
          <div className="flex items-center gap-2 min-w-max">
            {AI_TABS_CONFIG.map((tConfig) => {
              const IconComponent = tConfig.icon;
              const isActive = activeTab === tConfig.id;

              return (
                <div key={tConfig.id} className="relative group shrink-0 snap-start">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${tConfig.canonicalName} - ${tConfig.shortTooltip}`}
                    onClick={() => {
                      setActiveTab(tConfig.id);
                      setAiError(null);
                    }}
                    className={`relative px-3.5 py-2 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all duration-200 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 select-none ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/25 ring-2 ring-orange-400/60 scale-[1.02]"
                        : "border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-orange-300 dark:hover:border-orange-500/40 hover:bg-orange-50/50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-orange-500"}`} />
                    <span>{tConfig.canonicalName}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs animate-pulse ml-0.5" />
                    )}
                    {tConfig.id === "ocr" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase ml-1 shadow-2xs">
                        PRO
                      </span>
                    )}
                    {tConfig.id === "resume" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-black uppercase ml-1 shadow-2xs">
                        ATS
                      </span>
                    )}
                  </button>

                  {/* Interactive Micro-Tooltip on Hover & Focus */}
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 hidden group-hover:flex group-focus-within:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/95 text-white text-[11px] font-medium shadow-2xl border border-slate-800/80 backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                    <span className="font-bold text-amber-400">{tConfig.canonicalName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-200">{tConfig.shortTooltip}</span>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 rotate-45 border-t border-l border-slate-800/80" />
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* 3. Dedicated 5-Stage Execution Pipeline Breadcrumb Strip (Completely decoupled from Tabs Bar) */}
        <div className="relative z-10 shrink-0 w-full bg-slate-100/90 border-b border-slate-200 px-3 sm:px-6 py-1.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-max text-[11px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-0.5 flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-orange-500" />
              Pipeline:
            </span>
            {[
              { key: "ingestion", label: "1. File Ingestion", shortLabel: "1. Ingestion" },
              { key: "extraction", label: "2. Text Extraction", shortLabel: "2. Extraction" },
              { key: "invocation", label: "3. Gemini AI Invocation", shortLabel: "3. AI Invocation" },
              { key: "streaming", label: "4. Stream Rendering", shortLabel: "4. Stream" },
              { key: "completed", label: "5. Action Enablement", shortLabel: "5. Ready" },
            ].map((stageItem, idx, arr) => {
              const isCurrent = pipelineStage === stageItem.key;
              const isPast =
                (stageItem.key === "ingestion" && ["extraction", "invocation", "streaming", "completed"].includes(pipelineStage)) ||
                (stageItem.key === "extraction" && ["invocation", "streaming", "completed"].includes(pipelineStage)) ||
                (stageItem.key === "invocation" && ["streaming", "completed"].includes(pipelineStage)) ||
                (stageItem.key === "streaming" && pipelineStage === "completed") ||
                (stageItem.key === "completed" && pipelineStage === "completed");

              return (
                <React.Fragment key={stageItem.key}>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs transition-all shrink-0 ${
                      isCurrent
                        ? "bg-orange-50 border-orange-300 text-orange-700 font-bold shadow-2xs"
                        : isPast
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold"
                        : "bg-white/80 border-slate-200 text-slate-400 font-medium opacity-75"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full border border-current opacity-60 shrink-0" />
                    )}
                    <span className="hidden sm:inline">{stageItem.label}</span>
                    <span className="sm:hidden">{stageItem.shortLabel}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Workspace Content Grid */}
        {activeTab === "resume" ? (
          <ResumeReadyWorkspace
            initialDocumentText={documentText}
            initialFile={file}
            onAddHistory={onAddHistory}
          />
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0 relative w-full">
            {/* Left Column: File Drop & Text Preview */}
            <div className="md:col-span-4 p-3.5 sm:p-4 border-r border-slate-200 bg-slate-50/60 flex flex-col space-y-3 overflow-y-auto min-h-0 min-w-0 scrollbar-thin">
              {/* Document Picker */}
              <div
                {...getRootProps()}
                className={`p-4 rounded-2xl border-2 border-dashed text-center relative group cursor-pointer transition ${
                  isDragReject
                    ? "border-rose-500 bg-rose-50 scale-[1.01]"
                    : isDragAccept
                    ? "border-emerald-500 bg-emerald-50 scale-[1.01] ring-2 ring-emerald-500/20"
                    : isDragActive
                    ? "border-orange-500 bg-orange-50 scale-[1.01] ring-2 ring-orange-500/20"
                    : "bg-white border-slate-300 hover:border-orange-500 hover:bg-amber-50/30"
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud
                  className={`w-7 h-7 mx-auto mb-1 transition-transform ${
                    isDragActive ? "text-orange-500 scale-125 animate-bounce" : "text-orange-500"
                  }`}
                />
                <div className="text-xs font-bold text-slate-900 truncate">
                  {isDragActive
                    ? isDragReject
                      ? "File type not supported"
                      : "Drop document to load text"
                    : file
                    ? file.name
                    : "Upload Document for AI"}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {activeTab === "ocr" ? "PDF, Scanned Photos, PNG, JPG, WEBP" : "PDF, DOCX, TXT supported"}
                </p>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearDocument();
                    }}
                    className="mt-2 text-[10px] text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 inline-flex items-center space-x-1"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Remove file</span>
                  </button>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px]">
                <span className="text-slate-500 font-medium">Source Status</span>
                <span className="flex items-center space-x-1 font-bold">
                  {documentText.trim().length > 0 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">
                        {documentText.length} chars (~{documentText.split(/\s+/).filter(Boolean).length} words)
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-600">No Document Loaded</span>
                  )}
                </span>
              </div>

              {/* Extracted Document Text Preview */}
              <div className="flex-1 flex flex-col min-h-[200px]">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span>Extracted Document Text</span>
                    {documentText.trim().length > 0 && (
                      <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 lowercase">
                        auto-saved
                      </span>
                    )}
                  </span>
                  <div className="flex items-center space-x-2">
                    {isExtractingText && <RefreshCw className="w-3 h-3 animate-spin text-orange-500" />}
                    {documentText.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearDocument}
                        className="text-[10px] text-slate-400 hover:text-rose-600 transition flex items-center space-x-1"
                        title="Clear document text"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="No document loaded. Upload a PDF or paste text here to analyze with AI..."
                  className="flex-1 w-full p-3 rounded-xl bg-white text-xs text-slate-800 font-mono border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Right Column: Interactive Gemini AI Console */}
            <div className="md:col-span-8 flex flex-col h-full bg-white overflow-hidden min-h-0 min-w-0 relative">
              <ErrorBoundary>
                {/* TAB 1: AI Chat with PDF */}
                {activeTab === "chat" && (
                  <div className="flex-1 flex flex-col h-full p-4 overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                      {chatMessages.length > 0 && (
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-1 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {chatMessages.length} message{chatMessages.length === 1 ? "" : "s"} in session
                          </span>
                          <button
                            type="button"
                            onClick={handleClearChat}
                            className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition flex items-center space-x-1"
                            title="Clear conversation history"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear chat</span>
                          </button>
                        </div>
                      )}
                      {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner border border-orange-200">
                          <Bot className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Ask Gemini 3.8 Flash Anything About This Document
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
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
                              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-600 hover:text-slate-900 transition"
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
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-xs"
                                : "bg-slate-50 text-slate-800 border border-slate-200"
                            }`}
                          >
                            {msg.content}
                          </div>
                          {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {isAiLoading && (
                      <div className="flex items-center space-x-2 text-xs text-orange-700 font-bold p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                        <span>Gemini 3.8 Flash is analyzing document and formulating response...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Field */}
                  <div className="pt-3 border-t border-slate-200 flex items-center space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="Ask any question about your document..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-medium text-slate-800 border border-slate-200 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={isAiLoading || !chatInput.trim()}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white disabled:opacity-40 hover:opacity-90 transition shadow-xs flex items-center justify-center"
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
                      <p className="text-xs font-bold text-slate-600">
                        Gemini AI is generating active recall flashcards...
                      </p>
                    </div>
                  ) : flashcards.length > 0 ? (
                    <div className="w-full max-w-lg space-y-4 text-center">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Flashcard Deck</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold border border-amber-200">
                          {activeFlashcardIdx + 1} of {flashcards.length}
                        </span>
                      </div>

                      {/* Interactive Flippable Flashcard */}
                      <div
                        onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                        className="w-full min-h-[240px] p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-2 border-orange-200 flex flex-col items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition duration-200"
                      >
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-500 text-white mb-3 shadow-xs">
                          {showFlashcardAnswer ? "Answer (Click to see Question)" : "Question (Click to flip)"}
                        </span>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed max-w-md">
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
                          className="px-4 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 border border-slate-200 flex items-center space-x-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </button>

                        <button
                          onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                          className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200 flex items-center space-x-1 hover:bg-orange-100 transition"
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
                          className="px-4 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 border border-slate-200 flex items-center space-x-1"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => runAiFeature("flashcards")}
                          className="text-xs text-slate-500 hover:text-orange-600 font-bold underline"
                        >
                          Regenerate deck
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Flashcards Empty State with Direct CTA */
                    <div className="text-center max-w-md space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-inner border border-orange-200">
                        <Layers className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        Generate Active Recall Flashcards
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {activeTabConfig.emptyGuidance}
                      </p>
                      {aiError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{aiError}</span>
                        </div>
                      )}
                      <button
                        onClick={() => runAiFeature("flashcards")}
                        disabled={isAiLoading || !documentText.trim()}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
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
                      <label className="text-xs font-bold text-slate-600">Target Language:</label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 focus:outline-none focus:border-orange-500"
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
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition disabled:opacity-40 flex items-center space-x-1.5"
                      >
                        {isAiLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isAiLoading ? "Translating..." : "Translate Document"}</span>
                      </button>
                    </div>
                  )}

                  {/* Top Bar for Explain Target Audience Selection */}
                  {activeTab === "explain" && (
                    <div className="flex items-center space-x-3 pb-1 flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-600">Explain For:</label>
                      <select
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="beginner">Beginner / Layman (Everyday Analogies)</option>
                        <option value="highschool">High School Student (Clear Concepts)</option>
                        <option value="executive">Executive / C-Suite (Key Decisions & Impact)</option>
                        <option value="technical">Technical Specialist (Deep Technical Details)</option>
                      </select>

                      <button
                        onClick={() => runAiFeature("explain")}
                        disabled={isAiLoading || !documentText.trim()}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition disabled:opacity-40 flex items-center space-x-1.5"
                      >
                        {isAiLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isAiLoading ? "Simplifying..." : "Explain Concept"}</span>
                      </button>
                    </div>
                  )}

                  {/* Output Header with Action Status */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                      <span>{activeTabConfig.canonicalName} Output</span>
                      {currentOutput && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          Ready ({currentOutput.length} chars)
                        </span>
                      )}
                    </div>

                    {currentOutput && (
                      <button
                        onClick={() => runAiFeature(activeTab)}
                        disabled={isAiLoading}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>

                  {/* Error Notification Banner */}
                  {aiError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {/* Content Panel: Empty State with Direct CTA OR Formatted Markdown Result */}
                  <div className="flex-1 overflow-y-auto p-5 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans scrollbar-thin">
                    {isAiLoading ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-500">
                        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                        <span className="font-bold text-sm text-slate-900">
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
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-orange-500 border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
                          <activeTabConfig.icon className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-slate-900">
                            {activeTabConfig.canonicalName}
                          </h3>
                          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                            {activeTabConfig.emptyGuidance}
                          </p>
                        </div>

                        {!documentText.trim() && !file ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => openDropzone()}
                              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md hover:from-orange-600 hover:to-amber-600 transition flex items-center space-x-2 mx-auto"
                            >
                              <UploadCloud className="w-4 h-4" />
                              <span>Upload Document for {activeTabConfig.canonicalName}</span>
                            </button>
                            <p className="text-[11px] text-slate-500">
                              Upload a PDF, document, or scanned file to extract and analyze.
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => runAiFeature(activeTab)}
                            disabled={isAiLoading}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                          >
                            {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            <span>{activeTabConfig.buttonLabel}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              </ErrorBoundary>
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
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 truncate">
                  User Reviews & Ratings for {activeTabConfig.canonicalName}
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
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
