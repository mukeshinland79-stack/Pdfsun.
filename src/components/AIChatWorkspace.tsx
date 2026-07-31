import React, { useState, useCallback } from "react";
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
  CheckCheck,
  Download,
  RefreshCw,
  Zap,
} from "lucide-react";
import { ToolItem, ToolHistoryItem } from "../types";
import { extractTextFromPdfFile, textToPdf, downloadFile } from "../lib/pdfEngine";

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

export const AIChatWorkspace: React.FC<AIChatWorkspaceProps> = ({
  tool,
  initialFiles = [],
  onClose,
  onAddHistory,
}) => {
  const [file, setFile] = useState<File | null>(initialFiles[0] || null);
  const [documentText, setDocumentText] = useState<string>("");
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // AI Output state
  const [aiOutputResult, setAiOutputResult] = useState<string>("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeFlashcardIdx, setActiveFlashcardIdx] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [copied, setCopied] = useState(false);

  // Active AI Tab
  const [activeTab, setActiveTab] = useState<"chat" | "summary" | "translate" | "flashcards" | "notes" | "grammar" | "explain">(() => {
    if (tool.id === "ai-pdf-summary") return "summary";
    if (tool.id === "ai-translate-pdf") return "translate";
    if (tool.id === "ai-flashcards") return "flashcards";
    if (tool.id === "ai-notes-generator") return "notes";
    if (tool.id === "ai-grammar") return "grammar";
    if (tool.id === "ai-explain-pdf") return "explain";
    return "chat";
  });

  // Extract text when file is set
  const handleFileChange = async (f: File) => {
    setFile(f);
    setIsExtractingText(true);
    try {
      const extracted = await extractTextFromPdfFile(f);
      setDocumentText(extracted);
    } catch (err) {
      console.error("Text extraction error:", err);
      setDocumentText(`Document: ${f.name}\nSize: ${(f.size / 1024).toFixed(1)} KB.`);
    } finally {
      setIsExtractingText(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      handleFileChange(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      multiple: false,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "text/plain": [".txt"],
      },
    });

  // Handle AI Chat submission
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          documentText: documentText,
          history: chatMessages,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.result || "I've analyzed your request.",
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("AI Chat API Error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an issue connecting to Gemini AI. Please check your API configuration.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run AI Feature (Summarize, Translate, Notes, Flashcards, Grammar, Explain)
  const runAiFeature = async (feature: string) => {
    setIsAiLoading(true);
    setAiOutputResult("");

    try {
      let endpoint = "/api/ai/summarize";
      let body: any = { documentText };

      if (feature === "summary") {
        endpoint = "/api/ai/summarize";
        body.format = "executive";
      } else if (feature === "translate") {
        endpoint = "/api/ai/translate";
        body.targetLanguage = targetLanguage;
      } else if (feature === "flashcards") {
        endpoint = "/api/ai/flashcards";
        body.count = 8;
      } else if (feature === "notes") {
        endpoint = "/api/ai/notes";
      } else if (feature === "grammar") {
        endpoint = "/api/ai/grammar";
        body.mode = "proofread";
      } else if (feature === "explain") {
        endpoint = "/api/ai/explain";
        body.targetAudience = "beginner";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (feature === "flashcards") {
        setFlashcards(data.flashcards || []);
        setActiveFlashcardIdx(0);
        setShowFlashcardAnswer(false);
      } else {
        setAiOutputResult(data.result || "AI execution completed.");
      }

      onAddHistory({
        id: Date.now().toString(),
        toolId: tool.id,
        toolName: `AI ${feature.toUpperCase()}`,
        fileName: file?.name || "Document",
        timestamp: Date.now(),
        status: "completed",
        outputFileName: `PDFSun_AI_${feature}_output.pdf`,
      });
    } catch (err) {
      console.error("AI Feature Error:", err);
      setAiOutputResult("Failed to process request with Gemini AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsPdf = () => {
    const textToExport = aiOutputResult || chatMessages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const pdfBytes = textToPdf(textToExport, `PDFSun AI Document Insights`);
    downloadFile(pdfBytes, `PDFSun_AI_${tool.slug}_export.pdf`, "application/pdf");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Workspace Top Navigation Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{tool.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase">
                  Gemini 3.6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">PDFSun AI Document Suite</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportAsPdf}
              disabled={!aiOutputResult && chatMessages.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold disabled:opacity-40 flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Action Tabs Bar */}
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              activeTab === "chat" ? "bg-orange-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Chat</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("summary");
              runAiFeature("summary");
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              activeTab === "summary" ? "bg-orange-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("translate");
              runAiFeature("translate");
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              activeTab === "translate" ? "bg-orange-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Translate</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("flashcards");
              runAiFeature("flashcards");
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              activeTab === "flashcards" ? "bg-orange-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("notes");
              runAiFeature("notes");
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              activeTab === "notes" ? "bg-orange-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Study Notes</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("explain");
              runAiFeature("explain");
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              activeTab === "explain" ? "bg-orange-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Explain</span>
          </button>
        </div>

        {/* Workspace Content Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: File Drop & Text Preview */}
          <div className="md:col-span-4 p-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col space-y-4 overflow-y-auto">
            {/* Document Picker with react-dropzone integration */}
            <div
              {...getRootProps()}
              className={`p-4 rounded-2xl border text-center relative group cursor-pointer transition ${
                isDragReject
                  ? "border-rose-500 bg-rose-500/10 scale-[1.01]"
                  : isDragAccept
                  ? "border-emerald-500 bg-emerald-500/10 scale-[1.01] ring-2 ring-emerald-500/20"
                  : isDragActive
                  ? "border-orange-500 bg-orange-500/10 scale-[1.01] ring-2 ring-orange-500/20"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-500"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className={`w-8 h-8 mx-auto mb-1 transition-transform ${isDragActive ? "text-orange-500 scale-125 animate-bounce" : "text-orange-500"}`} />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {isDragActive
                  ? isDragReject
                    ? "File type not supported"
                    : "Drop document to load text"
                  : file
                  ? file.name
                  : "Upload Document for AI"}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, TXT supported</p>
            </div>

            {/* Extracted Document Text Preview */}
            <div className="flex-1 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Extracted Document Text</span>
                {isExtractingText && <RefreshCw className="w-3 h-3 animate-spin text-orange-500" />}
              </div>
              <textarea
                readOnly
                value={documentText || "No document loaded. Upload a PDF or type text directly to analyze with AI."}
                className="flex-1 w-full p-3 rounded-2xl bg-white dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Right Column: Interactive Gemini AI Console */}
          <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
            {/* TAB 1: AI Chat View */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col h-full p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Bot className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Ask Gemini 3.6 Anything About This Document
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        "What are the main conclusions?", "Summarize section 2", or "Extract key dates and figures."
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex space-x-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {isAiLoading && (
                    <div className="flex items-center space-x-2 text-xs text-orange-500 font-bold p-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini 3.6 is analyzing your document...</span>
                    </div>
                  )}
                </div>

                {/* Chat Input Field */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask a question about your document..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={isAiLoading || !chatInput.trim()}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-40 hover:opacity-90 transition shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Flashcards Deck View */}
            {activeTab === "flashcards" && (
              <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
                {isAiLoading ? (
                  <div className="flex flex-col items-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Generating study flashcards...</p>
                  </div>
                ) : flashcards.length > 0 ? (
                  <div className="w-full max-w-md space-y-4 text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Flashcard {activeFlashcardIdx + 1} of {flashcards.length}
                    </div>

                    {/* Flashcard Card Element */}
                    <div
                      onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                      className="w-full min-h-[220px] p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent border-2 border-orange-500/30 flex flex-col items-center justify-center cursor-pointer shadow-xl hover:scale-102 transition duration-200"
                    >
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-500 text-white mb-2">
                        {showFlashcardAnswer ? "Answer" : "Question (Click to flip)"}
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {showFlashcardAnswer
                          ? flashcards[activeFlashcardIdx].answer
                          : flashcards[activeFlashcardIdx].question}
                      </p>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => {
                          setActiveFlashcardIdx((prev) => Math.max(0, prev - 1));
                          setShowFlashcardAnswer(false);
                        }}
                        disabled={activeFlashcardIdx === 0}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30"
                      >
                        Previous
                      </button>

                      <button
                        onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                        className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-600 dark:text-amber-400 text-xs font-bold"
                      >
                        Flip Card
                      </button>

                      <button
                        onClick={() => {
                          setActiveFlashcardIdx((prev) => Math.min(flashcards.length - 1, prev + 1));
                          setShowFlashcardAnswer(false);
                        }}
                        disabled={activeFlashcardIdx === flashcards.length - 1}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => runAiFeature("flashcards")}
                    className="px-5 py-2.5 rounded-2xl bg-orange-500 text-white text-xs font-bold shadow-md"
                  >
                    Generate Flashcards Now
                  </button>
                )}
              </div>
            )}

            {/* TAB 3: Summary, Translate, Notes, Grammar, Explain Text View */}
            {activeTab !== "chat" && activeTab !== "flashcards" && (
              <div className="flex-1 p-6 flex flex-col space-y-4 overflow-hidden">
                {activeTab === "translate" && (
                  <div className="flex items-center space-x-3 pb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Language:</label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Portuguese">Portuguese</option>
                    </select>

                    <button
                      onClick={() => runAiFeature("translate")}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-xs hover:bg-orange-600 transition"
                    >
                      Re-Translate
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    AI Output Result ({activeTab})
                  </div>
                  <button
                    onClick={() => copyToClipboard(aiOutputResult)}
                    disabled={!aiOutputResult}
                    className="flex items-center space-x-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 transition disabled:opacity-40"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy Result"}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {isAiLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                      <span>Gemini 3.6 is generating insights...</span>
                    </div>
                  ) : (
                    aiOutputResult || "Click any AI tab above or upload a document to generate results."
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
